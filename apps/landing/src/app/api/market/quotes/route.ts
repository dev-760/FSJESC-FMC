/**
 * Market quotes API (Part 7.2, D1).
 *
 * GET /api/market/quotes
 *
 * Returns quotes for all instruments. No-store cache for time-sensitive data.
 *
 * Money crosses this boundary as a decimal *string*, not a number. The engine
 * holds centimes as `bigint` to keep arithmetic exact, and `JSON.stringify`
 * throws `TypeError: Do not know how to serialize a BigInt`. Coercing to a float
 * would be worse than throwing — it would silently reintroduce the floating-point
 * drift the integer model exists to prevent — so the string is parsed back to
 * `bigint` on the receiving end.
 */

import { type NextRequest, NextResponse } from "next/server";
import { market } from "@fsjesc/domain/market/engine";
import { AppError } from "@fsjesc/config/errors";

export function GET(request?: NextRequest) {
  try {
    const now = new Date();
    let instruments = market.listInstruments();

    if (request) {
      const { searchParams } = new URL(request.url);
      const marketFilter = searchParams.get("market")?.trim().toUpperCase();
      const sectorFilter = searchParams.get("sector")?.trim().toUpperCase();
      const symbolsFilter = searchParams.get("symbols");

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
      if (symbolsFilter) {
        const requested = new Set(
          symbolsFilter
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean),
        );
        instruments = instruments.filter((inst) => requested.has(inst.symbol));
      }
    }

    const wire = instruments.map((inst) => {
      const quote = market.getQuote(inst.symbol, now);
      return {
        symbol: quote.symbol,
        lastCents: quote.lastCents.toString(),
        bidCents: quote.bidCents.toString(),
        askCents: quote.askCents.toString(),
        changeCents: quote.changeCents.toString(),
        changeBps: Number(quote.changeBps),
        volume: quote.volume,
        asOf: quote.asOf,
      };
    });

    return NextResponse.json(wire, { headers: { "Cache-Control": "no-store" } });
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