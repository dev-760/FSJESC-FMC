/**
 * Market series API (Part 7.2, D1).
 *
 * GET /api/market/series?symbol=MARI&interval=1d&until=2026-03-16T14:30:00Z
 *
 * Returns candle series for an instrument. No-store cache for time-sensitive data.
 */

import { type NextRequest, NextResponse } from "next/server";
import { market } from "@fsjesc/domain/market/engine";
import { AppError } from "@fsjesc/config/errors";
import type { Interval } from "@fsjesc/domain/market/provider";

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");
    const interval = searchParams.get("interval") as Interval | null;
    const untilParam = searchParams.get("until");

    if (!symbol) {
      throw new AppError("VALIDATION_ERROR", "symbol parameter is required");
    }

    if (!interval) {
      throw new AppError("VALIDATION_ERROR", "interval parameter is required");
    }

    const validIntervals: Interval[] = ["1m", "5m", "1h", "1d"];
    if (!validIntervals.includes(interval)) {
      throw new AppError(
        "VALIDATION_ERROR",
        `interval must be one of: ${validIntervals.join(", ")}`,
      );
    }

    const until = untilParam ? new Date(untilParam) : new Date();

    const series = market.getSeries(symbol, interval, until);

    return NextResponse.json(series);
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
