/**
 * Market quote API (Part 7.2, D1).
 *
 * GET /api/market/quote?symbol=ATW
 *
 * Returns a quote for a single instrument. No-store cache because quotes are
 * time-sensitive and change with the simulated market.
 */

import { type NextRequest, NextResponse } from "next/server";
import { market } from "@fsjesc/domain/market/engine";
import { AppError } from "@fsjesc/config/errors";

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol");

    if (!symbol) {
      throw new AppError("VALIDATION_ERROR", "symbol parameter is required");
    }

    const quote = market.getQuote(symbol, new Date());

    return NextResponse.json(quote);
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
