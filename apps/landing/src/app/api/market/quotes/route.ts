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

import { NextResponse } from "next/server";
import { market } from "@fsjesc/domain/market/engine";
import { AppError } from "@fsjesc/config/errors";

export function GET() {
  try {
    const quotes = market.getQuotes(new Date());

    const wire = quotes.map((quote) => ({
      symbol: quote.symbol,
      lastCents: quote.lastCents.toString(),
      changeBps: Number(quote.changeBps),
    }));

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