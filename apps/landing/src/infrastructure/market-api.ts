/**
 * Client for the Python market-data service (`api/`).
 *
 * ## What this is, and is not
 *
 * The simulator's board is driven by a deterministic engine: eight fictional
 * Casablanca instruments priced by a seeded geometric Brownian motion model.
 * That engine is the product, and it lives in the landing app.
 *
 * The Python service is a *real* market-data service — it fronts yfinance for
 * stocks, ETFs, futures, crypto, forex, bonds, options and FRED. It cannot serve
 * the fictional universe, and pretending otherwise would replace reproducible
 * simulated prices with prices that change every minute.
 *
 * What it is used for is reference context: what a real market did, alongside
 * what the simulation did. Every call degrades to `null` rather than throwing,
 * because the service is optional — the platform is fully usable without it, and
 * a board that fails to load because an optional feed is down would be a
 * regression, not a feature.
 */

import { findMarketAsset } from "@fsjesc/domain/assets";

/** Base URL of the Python service. Not `NEXT_PUBLIC_`: server-side only. */
const BASE_URL = (process.env.MARKET_API_URL ?? "https://api.wassly.tech").replace(/\/+$/, "");
const API_KEY = process.env.MARKET_API_KEY ?? "";

const TIMEOUT_MS = 4_000;

export interface ReferenceQuote {
  symbol: string;
  price: number;
  currency: string;
  changePercent: number | null;
}

interface UpstreamQuotePayload {
  symbol?: string;
  price?: number;
  rate?: number;
  currency?: string;
  change_percent?: number | null;
  changePercent?: number | null;
}

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }
  return headers;
}

export function isMarketApiConfigured(): boolean {
  return Boolean(BASE_URL);
}

async function fetchQuoteFromUrl(url: string, fallbackSymbol: string): Promise<ReferenceQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: buildHeaders(),
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as UpstreamQuotePayload;
    const price =
      typeof payload.price === "number"
        ? payload.price
        : typeof payload.rate === "number"
          ? payload.rate
          : null;
    if (price === null) return null;

    const rawChange =
      typeof payload.change_percent === "number"
        ? payload.change_percent
        : typeof payload.changePercent === "number"
          ? payload.changePercent
          : null;

    return {
      symbol: payload.symbol ?? fallbackSymbol,
      price,
      currency: payload.currency ?? "MAD",
      changePercent: rawChange,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Fetch one real-market quote across all 8 API asset classes (`cse`, `stocks`,
 * `etfs`, `futures`, `crypto`, `forex`, `bonds`, `options`).
 *
 * Returns `null` on any failure — unreachable, timeout, non-2xx, malformed
 * payload. Callers treat the reference feed as decorative.
 */
export async function fetchReferenceQuote(symbol: string): Promise<ReferenceQuote | null> {
  const known = findMarketAsset(symbol);
  if (known) {
    const direct = await fetchQuoteFromUrl(`${BASE_URL}${known.apiEndpoint}`, known.ticker);
    if (direct) return direct;
  }

  const encoded = encodeURIComponent(symbol.trim().toUpperCase());
  const cseQuote = await fetchQuoteFromUrl(`${BASE_URL}/api/v1/cse/quote?ticker=${encoded}`, symbol);
  if (cseQuote) return cseQuote;

  return fetchQuoteFromUrl(`${BASE_URL}/api/v1/stocks/quote?symbol=${encoded}`, symbol);
}

/** True when the service answers its health check (`/api/v1/health/healthz`). */
export async function isMarketApiHealthy(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/api/v1/health/healthz`, {
      signal: controller.signal,
      headers: buildHeaders(),
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}