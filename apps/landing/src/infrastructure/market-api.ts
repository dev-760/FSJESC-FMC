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

/** Base URL of the Python service. Not `NEXT_PUBLIC_`: server-side only. */
const BASE_URL = process.env.MARKET_API_URL ?? "http://localhost:8000";

const TIMEOUT_MS = 4_000;

export interface ReferenceQuote {
  symbol: string;
  price: number;
  currency: string;
  changePercent: number | null;
}

export function isMarketApiConfigured(): boolean {
  return Boolean(process.env.MARKET_API_URL);
}

/**
 * Fetch one real-market quote.
 *
 * Returns `null` on any failure — unreachable, timeout, non-2xx, malformed
 * payload. Callers treat the reference feed as decorative.
 */
export async function fetchReferenceQuote(symbol: string): Promise<ReferenceQuote | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const url = `${BASE_URL}/api/v1/stocks/quote?symbol=${encodeURIComponent(symbol)}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) return null;

    const payload = (await response.json()) as Partial<ReferenceQuote>;
    if (typeof payload.price !== "number") return null;

    return {
      symbol: payload.symbol ?? symbol,
      price: payload.price,
      currency: payload.currency ?? "MAD",
      changePercent:
        typeof payload.changePercent === "number" ? payload.changePercent : null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** True when the service answers its health check. */
export async function isMarketApiHealthy(): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(`${BASE_URL}/api/v1/healthz`, {
      signal: controller.signal,
      cache: "no-store",
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}