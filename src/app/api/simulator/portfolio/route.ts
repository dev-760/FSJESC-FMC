/**
 * Simulator Portfolio API Route.
 *
 * GET /api/simulator/portfolio
 *
 * Returns marked-to-market portfolio overview, positions, and recent orders.
 */

import { NextResponse } from "next/server";
import { getCurrentSession } from "@/infrastructure/auth/utils";
import { portfoliosRepository } from "@/infrastructure/database/repositories/portfolios.repository";
import { ordersRepository } from "@/infrastructure/database/repositories/orders.repository";
import { market } from "@/lib/market";
import {
  createPortfolio,
  markToMarket,
  totalEquityCents,
  type Portfolio,
} from "@/lib/trading/engine";
import { numericStringToCents } from "@/infrastructure/database/money";

export async function GET() {
  try {
    const session = getCurrentSession();
    const now = new Date();
    const quotes = market.getQuotes(now);

    if (!session?.user) {
      // Demo guest portfolio
      const demoPortfolio = createPortfolio(10_000_000n);
      const marks = markToMarket(demoPortfolio, quotes, [], now);
      const equity = totalEquityCents(demoPortfolio, marks);

      return NextResponse.json({
        cashCents: demoPortfolio.cashCents.toString(),
        realisedPnlCents: demoPortfolio.realisedPnlCents.toString(),
        totalEquityCents: equity.toString(),
        unrealisedPnlCents: "0",
        positions: [],
        orders: [],
      });
    }

    let portfolioRecord = await portfoliosRepository.getUserPortfolio(session.user.id);
    if (!portfolioRecord) {
      portfolioRecord = await portfoliosRepository.create({
        userId: session.user.id,
        startingCashCents: "100000.00",
      });
    }

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

    const marks = markToMarket(domainPortfolio, quotes, [], now);
    const equity = totalEquityCents(domainPortfolio, marks);
    const unrealised = marks.reduce((sum, m) => sum + m.unrealisedPnlCents, 0n);

    const { orders } = await ordersRepository.getOrders(portfolioRecord.id, 10);

    return NextResponse.json({
      cashCents: domainPortfolio.cashCents.toString(),
      realisedPnlCents: domainPortfolio.realisedPnlCents.toString(),
      totalEquityCents: equity.toString(),
      unrealisedPnlCents: unrealised.toString(),
      positions: marks.map((m) => ({
        symbol: m.symbol,
        quantity: m.quantity,
        averageCostCents: m.averageCostCents,
        marketValueCents: m.marketValueCents.toString(),
        unrealisedPnlCents: m.unrealisedPnlCents.toString(),
        returnBps: m.returnBps.toString(),
        locked: m.locked,
      })),
      orders,
    });
  } catch (error) {
    console.error("Failed to load simulator portfolio:", error);
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
