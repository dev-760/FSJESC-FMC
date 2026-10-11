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
    const symbolParam = searchParams.get("symbol");

    if (!symbolParam) {
      throw new AppError("VALIDATION_ERROR", "symbol parameter is required");
    }

    const symbol = symbolParam.trim().toUpperCase();
    const instrument = market.getInstrument(symbol);
    if (!instrument) {
      throw new AppError("NOT_FOUND", `Unknown instrument: ${symbol}`);
    }

    const quote = market.getQuote(symbol, new Date());

    return NextResponse.json(
      {
        symbol: quote.symbol,
        lastCents: quote.lastCents.toString(),
        bidCents: quote.bidCents.toString(),
        askCents: quote.askCents.toString(),
        changeCents: quote.changeCents.toString(),
        changeBps: Number(quote.changeBps),
        volume: quote.volume,
        asOf: quote.asOf,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
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
