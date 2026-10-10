/**
 * Admin dashboard stats API route.
 *
 * Requires ADMINISTRATOR role.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@fsjesc/config/errors";
import { requireRole } from "@/infrastructure/auth/utils";



export async function GET(_request: NextRequest) {
  try {
    // Require ADMINISTRATOR role
    await requireRole("ADMINISTRATOR");

    // Get total users
    const [userCount] = await db.select({ count: schema.users.id }).from(schema.users);

    // Get active portfolios (non-competition portfolios with activity)
    const allPortfolios = await db.select().from(schema.portfolios);
    const portfolioCount = allPortfolios.filter((p) => p.isCompetition === 0).length;

    // Get total volume from executions
    const allExecutions = await db.select().from(schema.executions);
    const totalVolumeCents = allExecutions.reduce(
      (sum, exec) => sum + BigInt(exec.priceCents || 0),
      0n,
    );

    // Get active competitions
    const allCompetitions = await db.select().from(schema.competitions);
    const competitionCount = allCompetitions.filter((c) => c.status === "ACTIVE").length;

    // Get pending orders
    const allOrders = await db.select().from(schema.orders);
    const pendingOrdersCount = allOrders.filter((o) => o.status === "PENDING").length;

    // Get recent audit log entries
    const recentActivity = await db
      .select()
      .from(schema.auditLog)
      .orderBy(schema.auditLog.createdAt)
      .limit(10);

    return NextResponse.json({
      totalUsers: userCount?.count || 0,
      activePortfolios: portfolioCount,
      totalVolumeCents: totalVolumeCents.toString(),
      activeCompetitions: competitionCount,
      pendingOrders: pendingOrdersCount,
      recentActivity: recentActivity.map((entry) => ({
        id: entry.id,
        type: entry.action,
        description: entry.changes,
        timestamp: entry.createdAt,
      })),
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
