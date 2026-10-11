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
  series_id?: string;
  price?: number;
  rate?: number;
  underlying_price?: number;
  currency?: string;
  change_percent?: number | null;
  changePercent?: number | null;
  observations?: Array<{ date?: string; value?: number | null }>;
  curve?: Array<{ maturity?: string; rate?: number | null }>;
  calls?: Array<{ last_price?: number | null; mark?: number | null }>;
  puts?: Array<{ last_price?: number | null; mark?: number | null }>;
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

function extractPriceAndChange(payload: UpstreamQuotePayload): {
  price: number | null;
  changePercent: number | null;
} {
  if (typeof payload.price === "number") {
    return {
      price: payload.price,
      changePercent:
        typeof payload.change_percent === "number"
          ? payload.change_percent
          : typeof payload.changePercent === "number"
            ? payload.changePercent
            : null,
    };
  }

  if (typeof payload.rate === "number") {
    return {
      price: payload.rate,
      changePercent:
        typeof payload.change_percent === "number"
          ? payload.change_percent
          : typeof payload.changePercent === "number"
            ? payload.changePercent
            : null,
    };
  }

  // FRED / Bonds series observations payload
  if (Array.isArray(payload.observations) && payload.observations.length > 0) {
    const valid = payload.observations.filter(
      (obs): obs is { value: number } => typeof obs?.value === "number" && Number.isFinite(obs.value),
    );
    const latest = valid[valid.length - 1];
    if (latest) {
      const prev = valid.length >= 2 ? valid[valid.length - 2] : undefined;
      const changePercent =
        prev && prev.value !== 0 ? ((latest.value - prev.value) / Math.abs(prev.value)) * 100 : null;
      return { price: latest.value, changePercent };
    }
  }

  // Bonds yield curve payload
  if (Array.isArray(payload.curve) && payload.curve.length > 0) {
    const tenYear =
      payload.curve.find((pt) => pt.maturity === "10Y" && typeof pt.rate === "number") ??
      payload.curve.find((pt) => typeof pt.rate === "number");
    if (tenYear && typeof tenYear.rate === "number") {
      return { price: tenYear.rate, changePercent: null };
    }
  }

  // Options chain payload
  const contracts = [...(payload.calls ?? []), ...(payload.puts ?? [])];
  for (const contract of contracts) {
    if (typeof contract?.last_price === "number" && contract.last_price > 0) {
      return { price: contract.last_price, changePercent: null };
    }
  }
  if (typeof payload.underlying_price === "number") {
    return { price: payload.underlying_price, changePercent: null };
  }

  return { price: null, changePercent: null };
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
    const { price, changePercent } = extractPriceAndChange(payload);
    if (price === null) return null;

    return {
      symbol: payload.symbol ?? payload.series_id ?? fallbackSymbol,
      price,
      currency: payload.currency ?? "MAD",
      changePercent,
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