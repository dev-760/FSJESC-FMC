/**
 * Admin dashboard stats API route (`/api/admin/dashboard`).
 *
 * Aggregates platform metrics across users, portfolios, orders, competitions,
 * the 8 Wassly API routers, and all 110 market instruments.
 */

import { type NextRequest, NextResponse } from "next/server";
import { AppError } from "@fsjesc/config/errors";
import {
  authorizeAdminRequest,
  getAdminState,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    const totalUsers = state.users.length;
    const activePortfolios = state.users.filter((u) => u.status === "active").length;

    const totalVolumeCents = state.orders.reduce((sum, ord) => {
      if (ord.status !== "FILLED") return sum;
      const price = BigInt(ord.filledPriceCents ?? "0");
      return sum + price * BigInt(ord.quantity);
    }, 0n);

    const activeCompetitions = state.competitions.filter(
      (c) => c.status === "ACTIVE" || c.status === "OPEN",
    ).length;

    const pendingOrders = state.orders.filter((o) => o.status === "PENDING").length;
    const tradableInstruments = state.instruments.filter((i) => i.tradable).length;
    const healthyRouters = state.apiRouters.filter((r) => r.enabled && r.status === "healthy").length;

    return NextResponse.json({
      totalUsers,
      activePortfolios,
      totalVolumeCents: totalVolumeCents.toString(),
      activeCompetitions,
      pendingOrders,
      tradableInstruments,
      totalInstruments: state.instruments.length,
      healthyRouters,
      totalRouters: state.apiRouters.length,
      marketApiUrl: state.settings.marketApiUrl,
      activeScenario: state.settings.activeScenario,
      marketSessionMode: state.settings.marketSessionMode,
      recentActivity: state.activity.slice(0, 12),
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
