/**
 * Market quotes API (Part 7.2, D1).
 *
 * GET /api/market/quotes
 *
 * Returns quotes for all instruments. No-store cache for time-sensitive data.
 */

import { NextResponse } from "next/server";
import { market } from "@/lib/market/engine";
import { AppError } from "@/lib/errors";

export function GET() {
  try {
    const quotes = market.getQuotes(new Date());

    return NextResponse.json(quotes);
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
