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

const orderSchema = z.object({
  symbol: z.string().min(1).max(12),
  side: z.enum(["BUY", "SELL"]),
  type: z.enum(["MARKET", "LIMIT"]),
  quantity: z.number().int().positive(),
  limitCents: z.number().int().positive().optional(),
  idempotencyKey: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const json = (await request.json()) as unknown;
    const validated = orderSchema.parse(json);

    const now = new Date();
    const quote = market.getQuote(validated.symbol.toUpperCase(), now);

    if (!quote) {
      return NextResponse.json(
        { error: `Instrument ${validated.symbol} not found on market` },
        { status: 404 },
      );
    }

    const session = getCurrentSession();

    if (!session?.user) {
      // Guest demo mode: execute against standard starting capital
      const demoPortfolio = createPortfolio(10_000_000n);
      const executionResult = executeOrder(
        demoPortfolio,
        {
          symbol: validated.symbol.toUpperCase(),
          side: validated.side,
          type: validated.type,
          quantity: validated.quantity,
          limitCents: validated.limitCents,
        },
        quote,
        now,
        `guest-${Date.now()}`,
      );

      return NextResponse.json({
        success: true,
        isGuest: true,
        order: executionResult.order,
        portfolio: {
          cashCents: executionResult.portfolio.cashCents.toString(),
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
      symbol: validated.symbol.toUpperCase(),
      side: validated.side,
      type: validated.type,
      requested: validated.quantity,
      limitCents: validated.limitCents ? centsToNumericString(BigInt(validated.limitCents)) : undefined,
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
        symbol: validated.symbol.toUpperCase(),
        side: validated.side,
        type: validated.type,
        quantity: validated.quantity,
        limitCents: validated.limitCents,
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
        symbol: validated.symbol.toUpperCase(),
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
      const newPos = executionResult.portfolio.positions[validated.symbol.toUpperCase()];
      if (newPos && newPos.quantity > 0) {
        await portfoliosRepository.upsertPosition({
          portfolioId: portfolioRecord.id,
          symbol: validated.symbol.toUpperCase(),
          quantity: newPos.quantity,
          averageCostCents: centsToNumericString(BigInt(newPos.averageCostCents)),
        });
      } else {
        await portfoliosRepository.deletePosition(portfolioRecord.id, validated.symbol.toUpperCase());
      }

      // Record immutable transaction
      await transactionsRepository.create({
        portfolioId: portfolioRecord.id,
        type: validated.side === "BUY" ? "BUY" : "SELL",
        amountCents: centsToNumericString(cashDiff < 0n ? -cashDiff : cashDiff),
        symbol: validated.symbol.toUpperCase(),
        referenceId: dbOrder.id,
        description: executionResult.messages[0] ?? `${validated.side} ${validated.quantity} ${validated.symbol}`,
      });
    }

    return NextResponse.json({
      success: true,
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
