/**
 * Orders API Route (Part 5.4, N1, N5).
 *
 * Handles order placement and execution using the pure trading engine.
 * Authenticated users update their database portfolio; guest sessions
 * receive a deterministic simulated execution response.
 */

import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { market } from "@fsjesc/domain/market";
import { executeOrder, createPortfolio, type Portfolio } from "@fsjesc/domain/trading/engine";
import { getCurrentSession } from "@/infrastructure/auth/utils";
import { portfoliosRepository } from "@/infrastructure/database/repositories/portfolios.repository";
import { ordersRepository } from "@/infrastructure/database/repositories/orders.repository";
import { transactionsRepository } from "@/infrastructure/database/repositories/transactions.repository";
import { numericStringToCents, centsToNumericString } from "@/infrastructure/database/money";
import { AppError } from "@fsjesc/config/errors";

const guestPositionSchema = z.object({
  symbol: z.string(),
  quantity: z.number().int().nonnegative(),
  averageCostCents: z.number().int().nonnegative(),
  openedAt: z.number().int().nonnegative(),
});

const guestPortfolioSchema = z.object({
  cashCents: z.union([z.string().regex(/^-?\d+$/), z.number().int().nonnegative()]),
  reservedCents: z.union([z.string().regex(/^-?\d+$/), z.number().int().nonnegative()]).optional(),
  realisedPnlCents: z.union([z.string().regex(/^-?\d+$/), z.number().int()]).optional(),
  positions: z.record(z.string(), guestPositionSchema).optional(),
});

const orderSchema = z.object({
  symbol: z.string().min(1).max(20),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT", "STOP"]),
  quantity: z.number().int().positive(),
  limitCents: z.number().int().positive().optional(),
  stopCents: z.number().int().positive().optional(),
  idempotencyKey: z.string().optional(),
  guestPortfolio: guestPortfolioSchema.optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session?.user) {
      return NextResponse.json({
        isGuest: true,
        orders: [],
      });
    }

    const portfolioRecord = await portfoliosRepository.getUserPortfolio(session.user.id);
    if (!portfolioRecord) {
      return NextResponse.json({
        isGuest: false,
        orders: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const limitParam = Number(searchParams.get("limit") ?? "25");
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(1, Math.trunc(limitParam)), 100) : 25;
    const cursor = searchParams.get("cursor") ?? undefined;

    const result = await ordersRepository.getOrders(portfolioRecord.id, limit, cursor);
    return NextResponse.json({
      isGuest: false,
      orders: result.orders,
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as unknown;
    const validated = orderSchema.parse(json);
    const symbol = validated.symbol.trim().toUpperCase();

    const instrument = market.getInstrument(symbol);
    if (!instrument) {
      throw new AppError("NOT_FOUND", `Instrument ${symbol} not found on market`);
    }

    if (!market.isTradeable(symbol)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `Instrument ${symbol} is a reference benchmark and cannot be traded`,
      );
    }

    const now = new Date();
    const quote = market.getQuote(symbol, now);
    const effectiveTriggerCents = validated.stopCents ?? validated.limitCents;

    const session = await getCurrentSession();

    if (!session?.user) {
      // Guest demo mode: execute against provided guest portfolio state or standard 100,000 MAD starting capital
      const basePortfolio = createPortfolio(10_000_000n);
      const demoPortfolio: Portfolio = validated.guestPortfolio
        ? {
            cashCents: BigInt(validated.guestPortfolio.cashCents),
            reservedCents:
              validated.guestPortfolio.reservedCents !== undefined
                ? BigInt(validated.guestPortfolio.reservedCents)
                : 0n,
            realisedPnlCents:
              validated.guestPortfolio.realisedPnlCents !== undefined
                ? BigInt(validated.guestPortfolio.realisedPnlCents)
                : 0n,
            positions: validated.guestPortfolio.positions ?? {},
            orders: [],
          }
        : basePortfolio;

      const executionResult = executeOrder(
        demoPortfolio,
        {
          symbol,
          side: validated.side,
          type: validated.type,
          quantity: validated.quantity,
          limitCents: validated.limitCents,
          stopCents: effectiveTriggerCents,
        },
        quote,
        now,
        `guest-${Date.now()}`,
      );

      return NextResponse.json({
        success: executionResult.order.status !== "REJECTED",
        isGuest: true,
        order: {
          ...executionResult.order,
          feeCents: executionResult.order.feeCents.toString(),
        },
        portfolio: {
          cashCents: executionResult.portfolio.cashCents.toString(),
          reservedCents: executionResult.portfolio.reservedCents.toString(),
          realisedPnlCents: executionResult.portfolio.realisedPnlCents.toString(),
          positions: executionResult.portfolio.positions,
        },
        messages: executionResult.messages,
      });
    }

    // Authenticated user: load user portfolio
    let portfolioRecord = await portfoliosRepository.getUserPortfolio(session.user.id);
    if (!portfolioRecord) {
      portfolioRecord = await portfoliosRepository.create({
        userId: session.user.id,
        startingCashCents: "100000.00",
      });
    }

    // Load active positions
    const positionRecords = await portfoliosRepository.getPositions(portfolioRecord.id);
    const domainPortfolio: Portfolio = {
      cashCents: numericStringToCents(portfolioRecord.cashCents),
      reservedCents: numericStringToCents(portfolioRecord.reservedCents),
      realisedPnlCents: numericStringToCents(portfolioRecord.realisedPnlCents),
      positions: {},
      orders: [],
    };

    for (const pos of positionRecords) {
      domainPortfolio.positions[pos.symbol] = {
        symbol: pos.symbol,
        quantity: pos.quantity,
        averageCostCents: Math.round(Number(numericStringToCents(pos.averageCostCents))),
        openedAt: Math.floor(pos.openedAt.getTime() / 1000),
      };
    }

    // Place initial record in DB with idempotency
    const { order: dbOrder, isNew } = await ordersRepository.placeOrder({
      portfolioId: portfolioRecord.id,
      symbol,
      side: validated.side,
      type: validated.type,
      requested: validated.quantity,
      limitCents: effectiveTriggerCents
        ? centsToNumericString(BigInt(effectiveTriggerCents))
        : undefined,
      idempotencyKey: validated.idempotencyKey,
    });

    if (!isNew && dbOrder.status === "FILLED") {
      return NextResponse.json({
        success: true,
        order: dbOrder,
        messages: ["Order already processed (idempotent submission)."],
      });
    }

    // Execute with trading engine
    const executionResult = executeOrder(
      domainPortfolio,
      {
        symbol,
        side: validated.side,
        type: validated.type,
        quantity: validated.quantity,
        limitCents: validated.limitCents,
        stopCents: effectiveTriggerCents,
      },
      quote,
      now,
      dbOrder.id,
    );

    // Update order status in DB
    const updatedOrder = await ordersRepository.updateOrder(dbOrder.id, {
      filled: executionResult.order.filled,
      averageFillCents: executionResult.order.averageFillCents
        ? centsToNumericString(BigInt(executionResult.order.averageFillCents))
        : undefined,
      feeCents: centsToNumericString(executionResult.order.feeCents),
      status: executionResult.order.status,
      reason: executionResult.order.reason,
    });

    // If any shares executed, persist balance, position, execution & transaction
    if (executionResult.order.filled > 0) {
      await ordersRepository.createExecution({
        orderId: dbOrder.id,
        symbol,
        quantity: executionResult.order.filled,
        priceCents: centsToNumericString(BigInt(executionResult.order.averageFillCents)),
        feeCents: centsToNumericString(executionResult.order.feeCents),
      });

      const cashDiff = executionResult.portfolio.cashCents - domainPortfolio.cashCents;
      await portfoliosRepository.updateCash(
        portfolioRecord.id,
        centsToNumericString(cashDiff),
      );

      const pnlDiff = executionResult.portfolio.realisedPnlCents - domainPortfolio.realisedPnlCents;
      if (pnlDiff !== 0n) {
        await portfoliosRepository.updateRealisedPnl(
          portfolioRecord.id,
          centsToNumericString(pnlDiff),
        );
      }

      // Update positions
      const newPos = executionResult.portfolio.positions[symbol];
      if (newPos && newPos.quantity > 0) {
        await portfoliosRepository.upsertPosition({
          portfolioId: portfolioRecord.id,
          symbol,
          quantity: newPos.quantity,
          averageCostCents: centsToNumericString(BigInt(newPos.averageCostCents)),
        });
      } else {
        await portfoliosRepository.deletePosition(portfolioRecord.id, symbol);
      }

      // Record immutable transaction
      await transactionsRepository.create({
        portfolioId: portfolioRecord.id,
        type: validated.side === "BUY" ? "BUY" : "SELL",
        amountCents: centsToNumericString(cashDiff < 0n ? -cashDiff : cashDiff),
        symbol,
        referenceId: dbOrder.id,
        description: executionResult.messages[0] ?? `${validated.side} ${validated.quantity} ${symbol}`,
      });
    }

    return NextResponse.json({
      success: executionResult.order.status !== "REJECTED",
      order: updatedOrder,
      messages: executionResult.messages,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("Order execution failed:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
