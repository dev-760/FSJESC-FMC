/**
 * Market instruments API (Part 7.2, D1).
 *
 * GET /api/market/instruments
 *
 * Returns the list of all instruments. Can be cached as instruments don't change.
 */

import { type NextRequest, NextResponse } from "next/server";
import { market } from "@fsjesc/domain/market/engine";
import { AppError } from "@fsjesc/config/errors";

export function GET(request?: NextRequest) {
  try {
    let instruments = market.listInstruments();

    if (request) {
      const { searchParams } = new URL(request.url);
      const marketFilter = searchParams.get("market")?.trim().toUpperCase();
      const sectorFilter = searchParams.get("sector")?.trim().toUpperCase();
      const tradeableOnly = searchParams.get("tradeable");

      if (tradeableOnly === "true" || tradeableOnly === "1") {
        instruments = market.listTradeable();
      }
      if (marketFilter) {
        instruments = instruments.filter(
          (inst) => inst.market?.toUpperCase() === marketFilter,
        );
      }
      if (sectorFilter) {
        instruments = instruments.filter(
          (inst) => inst.sector.toUpperCase() === sectorFilter,
        );
      }
    }

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
