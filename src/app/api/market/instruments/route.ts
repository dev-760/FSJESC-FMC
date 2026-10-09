/**
 * Market instruments API (Part 7.2, D1).
 *
 * GET /api/market/instruments
 *
 * Returns the list of all instruments. Can be cached as instruments don't change.
 */

import { NextResponse } from "next/server";
import { market } from "@/lib/market/engine";
import { AppError } from "@/lib/errors";

export function GET() {
  try {
    const instruments = market.listInstruments();

    return NextResponse.json(instruments);
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
