/**
 * Admin system status API route.
 *
 * Requires ADMINISTRATOR role.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/database/connection";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/infrastructure/auth/utils";



export async function GET(_request: NextRequest) {
  try {
    await requireRole("ADMINISTRATOR");

    // Check database health
    let databaseStatus: "healthy" | "degraded" | "down" = "healthy";
    try {
      await db.execute("SELECT 1");
    } catch (_err) {
      databaseStatus = "down";
    }

    // Market engine is always healthy in simulation
    const marketEngineStatus: "healthy" | "degraded" | "down" = "healthy";

    // Get uptime (from process)
    const uptime = process.uptime();

    // Get version from package.json
    const version = "1.0.0"; // In production, read from package.json

    // Get last migration timestamp
    const lastMigration = "2026-01-01"; // In production, read from migrations table

    return NextResponse.json({
      database: databaseStatus,
      marketEngine: marketEngineStatus,
      uptime,
      version,
      lastMigration,
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
