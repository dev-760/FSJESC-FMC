/**
 * Real-market reference feed.
 *
 * GET /api/market/reference?symbols=MARI,CASA
 *
 * Proxies the Python market-data service. Every entry resolves independently:
 * one symbol the upstream does not know does not fail the response, because the
 * reference feed is decorative and must never take the simulator down with it.
 *
 * The simulated board itself does **not** come from here — see
 * `src/infrastructure/market-api.ts` for why.
 */

import { NextResponse, type NextRequest } from "next/server";
import { fetchReferenceQuote, isMarketApiConfigured } from "@/infrastructure/market-api";

const MAX_SYMBOLS = 10;

export async function GET(request: NextRequest) {
  if (!isMarketApiConfigured()) {
    return NextResponse.json(
      { error: "Market data service is not configured", code: "NOT_CONFIGURED" },
      { status: 503 },
    );
  }

  const requested =
    request.nextUrl.searchParams.get("symbols")?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  if (requested.length === 0) {
    return NextResponse.json(
      { error: "Provide one or more `symbols`, comma separated", code: "BAD_REQUEST" },
      { status: 400 },
    );
  }

  const symbols = requested.slice(0, MAX_SYMBOLS);
  const quotes = await Promise.all(symbols.map((s) => fetchReferenceQuote(s)));

  return NextResponse.json(
    {
      quotes: quotes.map((quote, index) => ({
        symbol: symbols[index],
        quote,
        // Distinguishes "the upstream had no data" from "no data requested".
        status: quote ? "ok" : "unavailable",
      })),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}