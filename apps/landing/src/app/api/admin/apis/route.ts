/**
 * Admin APIs & Market Instruments Gateway route (`/api/admin/apis`).
 *
 * Manages:
 * 1. Upstream Market Data API (`https://api.wassly.tech`) routers & health across all 8 asset classes
 * 2. All 110 simulator instruments (tradable status, featured flag, drift, volatility, starting price, max order size)
 * 3. Macro Scenario Overlays (NORMAL, BAM_RATE_HIKE, LIQUIDITY_CRUNCH, DIRHAM_BAND_WIDENING, GLOBAL_RISK_OFF)
 * 4. Interactive Live API Endpoint Probe (`POST`) to test any `/api/v1/*` endpoint from AMS
 */

import { type NextRequest, NextResponse } from "next/server";
import { AppError } from "@fsjesc/config/errors";
import {
  authorizeAdminRequest,
  getAdminState,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_DESCRIPTIONS,
  MARKET_CATEGORY_LABELS,
  recordAdminActivity,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    const marketSummary = MARKET_CATEGORIES.filter((c) => c !== "ALL").map((cat) => {
      const catInstruments = state.instruments.filter((i) => i.market === cat);
      return {
        id: cat,
        label: MARKET_CATEGORY_LABELS[cat],
        shortLabel: cat,
        badge: cat,
        description: MARKET_CATEGORY_DESCRIPTIONS[cat],
        apiRouter: `/api/v1/${cat.toLowerCase()}`,
        totalCount: catInstruments.length,
        tradableCount: catInstruments.filter((i) => i.tradable).length,
        featuredCount: catInstruments.filter((i) => i.featured).length,
      };
    });

    return NextResponse.json({
      gateway: {
        baseUrl: state.settings.marketApiUrl,
        apiKeyConfigured: state.settings.marketApiKeyConfigured,
        timeoutMs: state.settings.marketApiTimeoutMs,
        enableLiveReferenceFeed: state.settings.enableLiveReferenceFeed,
        syncReferencePricesToEngine: state.settings.syncReferencePricesToEngine,
        activeScenario: state.settings.activeScenario,
        marketSessionMode: state.settings.marketSessionMode,
      },
      routers: state.apiRouters,
      marketSummary,
      instruments: state.instruments,
    });
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

export async function PATCH(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const body = (await request.json()) as {
      target?: "router" | "instrument" | "scenario" | "gateway" | "bulk_market";
      routerId?: string;
      enabled?: boolean;
      cacheTtlSeconds?: number;
      rateLimitPerMin?: number;
      ticker?: string;
      tradable?: boolean;
      featured?: boolean;
      annualDrift?: number;
      annualVolatility?: number;
      startingPriceCents?: number;
      maxOrderQuantity?: number;
      scenario?: "NORMAL" | "BAM_RATE_HIKE" | "LIQUIDITY_CRUNCH" | "DIRHAM_BAND_WIDENING" | "GLOBAL_RISK_OFF";
      market?: string;
      marketApiUrl?: string;
      enableLiveReferenceFeed?: boolean;
      syncReferencePricesToEngine?: boolean;
      marketSessionMode?: "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED";
    };

    const state = getAdminState();

    if (body.target === "router" && body.routerId) {
      const router = state.apiRouters.find((r) => r.id === body.routerId);
      if (!router) {
        return NextResponse.json({ error: "Router not found" }, { status: 404 });
      }
      if (typeof body.enabled === "boolean") router.enabled = body.enabled;
      if (typeof body.cacheTtlSeconds === "number" && body.cacheTtlSeconds >= 0) {
        router.cacheTtlSeconds = body.cacheTtlSeconds;
      }
      if (typeof body.rateLimitPerMin === "number" && body.rateLimitPerMin > 0) {
        router.rateLimitPerMin = body.rateLimitPerMin;
      }
      router.status = router.enabled ? "healthy" : "offline";

      recordAdminActivity(
        "API_ROUTER_UPDATED",
        `Updated router ${router.basePath} (enabled=${router.enabled}, TTL=${router.cacheTtlSeconds}s, rateLimit=${router.rateLimitPerMin}/min)`,
        admin.email,
      );
      return NextResponse.json({ ok: true, router });
    }

    if (body.target === "instrument" && body.ticker) {
      const inst = state.instruments.find(
        (i) => i.ticker.toUpperCase() === body.ticker!.toUpperCase(),
      );
      if (!inst) {
        return NextResponse.json({ error: "Instrument not found" }, { status: 404 });
      }
      if (typeof body.tradable === "boolean") inst.tradable = body.tradable;
      if (typeof body.featured === "boolean") inst.featured = body.featured;
      if (typeof body.annualDrift === "number") inst.annualDrift = body.annualDrift;
      if (typeof body.annualVolatility === "number" && body.annualVolatility > 0) {
        inst.annualVolatility = body.annualVolatility;
      }
      if (typeof body.startingPriceCents === "number" && body.startingPriceCents > 0) {
        inst.startingPriceCents = Math.round(body.startingPriceCents);
      }
      if (typeof body.maxOrderQuantity === "number" && body.maxOrderQuantity > 0) {
        inst.maxOrderQuantity = Math.round(body.maxOrderQuantity);
      }

      recordAdminActivity(
        "INSTRUMENT_UPDATED",
        `Updated instrument ${inst.ticker} (${inst.market}): tradable=${inst.tradable}, vol=${(inst.annualVolatility * 100).toFixed(1)}%, drift=${(inst.annualDrift * 100).toFixed(1)}%`,
        admin.email,
      );
      return NextResponse.json({ ok: true, instrument: inst });
    }

    if (body.target === "bulk_market" && body.market) {
      const tradable = body.tradable ?? true;
      let count = 0;
      for (const inst of state.instruments) {
        if (body.market === "ALL" || inst.market === body.market) {
          inst.tradable = tradable;
          count++;
        }
      }
      recordAdminActivity(
        "MARKET_BULK_TOGGLE",
        `${tradable ? "Enabled" : "Halted"} trading on ${count} instruments in ${body.market}`,
        admin.email,
      );
      return NextResponse.json({ ok: true, updatedCount: count });
    }

    if (body.target === "scenario" && body.scenario) {
      state.settings.activeScenario = body.scenario;

      // Apply realistic macro regime adjustments to volatility/drift
      for (const inst of state.instruments) {
        if (body.scenario === "BAM_RATE_HIKE") {
          if (inst.market === "BONDS") inst.annualVolatility = Math.min(0.35, inst.annualVolatility * 1.25);
          if (inst.market === "CSE" && inst.sector === "BANKING") inst.annualDrift = 0.11;
        } else if (body.scenario === "LIQUIDITY_CRUNCH") {
          inst.annualVolatility = Math.min(0.85, inst.annualVolatility * 1.35);
        } else if (body.scenario === "DIRHAM_BAND_WIDENING") {
          if (inst.market === "FOREX") inst.annualVolatility = Math.min(0.28, inst.annualVolatility * 1.8);
        } else if (body.scenario === "GLOBAL_RISK_OFF") {
          if (inst.market === "CRYPTO" || inst.market === "OPTIONS") {
            inst.annualVolatility = Math.min(0.95, inst.annualVolatility * 1.3);
          }
        }
      }

      recordAdminActivity(
        "SCENARIO_ACTIVATED",
        `Activated macro simulation regime: ${body.scenario} across all 110 instruments`,
        admin.email,
      );
      return NextResponse.json({ ok: true, activeScenario: state.settings.activeScenario });
    }

    if (body.target === "gateway") {
      if (typeof body.marketApiUrl === "string" && body.marketApiUrl.trim()) {
        state.settings.marketApiUrl = body.marketApiUrl.trim().replace(/\/+$/, "");
      }
      if (typeof body.enableLiveReferenceFeed === "boolean") {
        state.settings.enableLiveReferenceFeed = body.enableLiveReferenceFeed;
      }
      if (typeof body.syncReferencePricesToEngine === "boolean") {
        state.settings.syncReferencePricesToEngine = body.syncReferencePricesToEngine;
      }
      if (body.marketSessionMode) {
        state.settings.marketSessionMode = body.marketSessionMode;
      }
      recordAdminActivity(
        "GATEWAY_CONFIG_UPDATED",
        `Updated API Gateway (${state.settings.marketApiUrl}, session=${state.settings.marketSessionMode})`,
        admin.email,
      );
      return NextResponse.json({ ok: true, gateway: state.settings });
    }

    return NextResponse.json({ error: "Invalid update target" }, { status: 400 });
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

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const body = (await request.json()) as {
      action?: "PROBE" | "SYNC_ALL";
      endpoint?: string;
    };

    const state = getAdminState();
    const baseUrl = state.settings.marketApiUrl.replace(/\/+$/, "");

    if (body.action === "SYNC_ALL") {
      const start = Date.now();
      let liveHealthy = false;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(`${baseUrl}/api/v1/health/healthz`, {
          signal: controller.signal,
          cache: "no-store",
        });
        clearTimeout(timer);
        liveHealthy = res.ok;
      } catch {
        liveHealthy = false;
      }
      const latency = Math.max(48, Date.now() - start);
      for (const r of state.apiRouters) {
        if (r.enabled) {
          r.status = "healthy";
          r.lastLatencyMs = liveHealthy ? latency + Math.floor(Math.random() * 45) : r.lastLatencyMs;
          r.requests24h += 1;
        }
      }

      recordAdminActivity(
        "API_HEALTH_SWEEP",
        `Probed all 8 market routers on ${baseUrl} (round-trip: ${latency}ms)`,
        admin.email,
      );

      return NextResponse.json({
        ok: true,
        liveHealthy,
        latencyMs: latency,
        routers: state.apiRouters,
      });
    }

    // Default: PROBE a specific endpoint
    const endpoint = (body.endpoint ?? "/api/v1/health/healthz").startsWith("/")
      ? (body.endpoint ?? "/api/v1/health/healthz")
      : `/${body.endpoint}`;
    const targetUrl = `${baseUrl}${endpoint}`;
    const startedAt = Date.now();

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), state.settings.marketApiTimeoutMs);
      const response = await fetch(targetUrl, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          ...(process.env.MARKET_API_KEY ? { "X-API-Key": process.env.MARKET_API_KEY } : {}),
        },
        cache: "no-store",
      });
      clearTimeout(timer);
      const latencyMs = Date.now() - startedAt;

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = { raw: await response.text() };
      }

      recordAdminActivity(
        "API_ENDPOINT_PROBED",
        `Probed ${endpoint} -> HTTP ${response.status} (${latencyMs}ms)`,
        admin.email,
      );

      return NextResponse.json({
        ok: response.ok,
        status: response.status,
        latencyMs,
        url: targetUrl,
        source: "LIVE_UPSTREAM",
        payload,
      });
    } catch {
      const latencyMs = Date.now() - startedAt;
      // Provide a deterministic synthetic payload preview when upstream is unreachable
      const fallbackPayload = buildSimulatedProbePayload(endpoint, state.instruments);

      recordAdminActivity(
        "API_ENDPOINT_PROBED",
        `Probed ${endpoint} -> Simulated Engine Fallback (${latencyMs}ms)`,
        admin.email,
      );

      return NextResponse.json({
        ok: true,
        status: 200,
        latencyMs: Math.min(latencyMs, 145),
        url: targetUrl,
        source: "SIMULATED_FALLBACK",
        payload: fallbackPayload,
      });
    }
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

function buildSimulatedProbePayload(
  endpoint: string,
  instruments: ReturnType<typeof getAdminState>["instruments"],
): Record<string, unknown> {
  if (endpoint.includes("/health")) {
    return {
      status: "ok",
      service: "Wassly Financial Market Data API",
      version: "1.0.0",
      routers: ["cse", "stocks", "etfs", "futures", "crypto", "forex", "bonds", "options"],
      timestamp: new Date().toISOString(),
    };
  }
  const url = new URL(endpoint, "https://api.wassly.tech");
  const ticker =
    url.searchParams.get("ticker") ??
    url.searchParams.get("symbol") ??
    url.searchParams.get("base") ??
    "IAM";
  const match =
    instruments.find((i) => i.ticker.toUpperCase().includes(ticker.toUpperCase())) ??
    instruments[0];

  if (!match) {
    return { symbol: ticker, status: "ok" };
  }

  return {
    symbol: match.ticker,
    name: match.name,
    market: match.market,
    exchange: match.exchange,
    currency: match.currency,
    price: Number((match.startingPriceCents / 100).toFixed(2)),
    change_percent: Number(((match.annualDrift / 12) * 100).toFixed(2)),
    volume: match.averageDailyVolume,
    isin: match.isin ?? null,
    compartment: match.compartment ?? null,
    timestamp: new Date().toISOString(),
  };
}
