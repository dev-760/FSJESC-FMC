"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, ArrowRightLeft, Globe, Layers, Search } from "lucide-react";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { QuoteBoard } from "@fsjesc/ui/financial/quote-board";
import { Badge } from "@fsjesc/ui/badge";
import { Delta, Num } from "@fsjesc/ui/primitives/num";
import { market } from "@fsjesc/domain/market";
import {
  ALL_MARKET_ASSETS,
  CSE_SECTOR_SUMMARIES,
  FOREX_CURRENCY_LIST,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_DESCRIPTIONS,
  MARKET_CATEGORY_LABELS,
  SAMPLE_OPTION_CONTRACTS,
  SECTOR_LABELS,
  TREASURY_YIELD_CURVE,
  findMarketAsset,
  type MarketCategoryFilter,
  type Sector,
} from "@fsjesc/domain/assets";
import { cn } from "@fsjesc/config/cn";

/**
 * A quote as it arrives over HTTP.
 */
interface WireQuote {
  symbol: string;
  lastCents: string;
  changeBps: number;
}

function parseQuote(wire: WireQuote): { symbol: string; lastCents: bigint; changeBps: bigint } {
  return {
    symbol: wire.symbol,
    lastCents: BigInt(wire.lastCents),
    changeBps: BigInt(wire.changeBps),
  };
}

type Quote = ReturnType<typeof parseQuote>;

const SECTORS = ["ALL", "BANKING", "TELECOM", "REAL_ESTATE", "ENERGY", "RETAIL", "INDUSTRY"] as const;

/** How often the board refreshes. Matches the site-wide quote cadence. */
const REFRESH_MS = 3000;

export function MarketBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<MarketCategoryFilter>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  // Interactive Forex Converter state (/api/v1/forex/convert)
  const [fxAmount, setFxAmount] = useState<string>("10000");
  const [fxFrom, setFxFrom] = useState<string>("MAD");
  const [fxTo, setFxTo] = useState<string>("USD");

  // Interactive Options Chain state (/api/v1/options/chain)
  const [optionUnderlying, setOptionUnderlying] = useState<string>("ALL");
  const [optionTypeFilter, setOptionTypeFilter] = useState<"ALL" | "CALL" | "PUT">("ALL");

  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch("/api/market/quotes", { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Quotes request failed: ${response.status}`);
    const wire = (await response.json()) as WireQuote[];
    setQuotes(wire.map(parseQuote));
    setFailed(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const refresh = async () => {
      try {
        await load(controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to refresh quotes:", error);
        setFailed(true);
      }
    };

    void refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [load]);

  // Count instruments per market category
  const marketCounts = useMemo(() => {
    const counts: Record<MarketCategoryFilter, number> = {
      ALL: ALL_MARKET_ASSETS.length,
      CSE: 0,
      STOCKS: 0,
      ETFS: 0,
      FUTURES: 0,
      CRYPTO: 0,
      FOREX: 0,
      BONDS: 0,
      OPTIONS: 0,
    };
    for (const asset of ALL_MARKET_ASSETS) {
      counts[asset.market] += 1;
    }
    return counts;
  }, []);

  const tradeableSet = useMemo(
    () => new Set(ALL_MARKET_ASSETS.map((a) => a.ticker.toUpperCase())),
    [],
  );

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (!tradeableSet.has(quote.symbol.toUpperCase())) return false;
      const extended = findMarketAsset(quote.symbol);
      const instrument = market.getInstrument(quote.symbol);

      const matchesMarket =
        selectedMarket === "ALL" || extended?.market === selectedMarket;

      const matchesSector =
        selectedSector === "ALL" ||
        extended?.sector === selectedSector ||
        instrument?.sector === selectedSector;

      const matchesSearch =
        q.length === 0 ||
        quote.symbol.toLowerCase().includes(q) ||
        (extended?.name.toLowerCase().includes(q) ?? false) ||
        (extended?.exchange.toLowerCase().includes(q) ?? false) ||
        (extended?.isin?.toLowerCase().includes(q) ?? false) ||
        (extended?.frenchSector?.toLowerCase().includes(q) ?? false);

      return matchesMarket && matchesSector && matchesSearch;
    });
  }, [quotes, search, selectedMarket, selectedSector, tradeableSet]);

  // Forex conversion calculation
  const fxResult = useMemo(() => {
    const parsed = Number.parseFloat(fxAmount);
    const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const fromEntry = FOREX_CURRENCY_LIST.find((c) => c.code === fxFrom) ?? FOREX_CURRENCY_LIST[0];
    const toEntry = FOREX_CURRENCY_LIST.find((c) => c.code === fxTo) ?? FOREX_CURRENCY_LIST[1];
    const amountInUsd = amount / fromEntry.ratePerUsd;
    const converted = amountInUsd * toEntry.ratePerUsd;
    const rate = toEntry.ratePerUsd / fromEntry.ratePerUsd;
    return { amount, converted, rate };
  }, [fxAmount, fxFrom, fxTo]);

  // Filtered option contracts
  const filteredOptions = useMemo(() => {
    return SAMPLE_OPTION_CONTRACTS.filter((c) => {
      const matchUnderlying = optionUnderlying === "ALL" || c.underlying === optionUnderlying;
      const matchType = optionTypeFilter === "ALL" || c.type === optionTypeFilter;
      return matchUnderlying && matchType;
    });
  }, [optionUnderlying, optionTypeFilter]);

  const isLoading = quotes.length === 0 && !failed;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with title, multi-market summary, and market status */}
      <div className="mb-6 flex flex-col gap-4 border-b border-rule pb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="accent" size="sm">
              8 Asset Classes
            </Badge>
            <Badge tone="neutral" size="sm">
              {ALL_MARKET_ASSETS.length} Instruments
            </Badge>
            <span className="font-mono text-2xs text-foreground-muted">
              API: api.wassly.tech/api/v1
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Multi-Asset &amp; Casablanca Market Board
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            {selectedMarket === "ALL"
              ? "Trade Bourse de Casablanca (CSE) equities, Global Stocks, ETFs, Futures, Crypto, Forex, Bonds & Options in one unified terminal."
              : MARKET_CATEGORY_DESCRIPTIONS[selectedMarket]}
          </p>
        </div>
        <Suspense fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}>
          <MarketStatus />
        </Suspense>
      </div>

      {/* Primary Market / Asset Class Tabs (matching all 8 API routers) */}
      <div className="mb-4">
        <div
          className="flex items-center gap-1.5 overflow-x-auto border-b border-rule pb-3"
          role="tablist"
          aria-label="Market asset classes"
        >
          {MARKET_CATEGORIES.map((category) => {
            const active = selectedMarket === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedMarket(category)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-medium transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  active
                    ? "border border-bull/40 bg-bull-subtle font-semibold text-bull shadow-xs"
                    : "border border-rule bg-surface-raised text-foreground-secondary hover:border-rule-strong hover:bg-surface-inset hover:text-foreground",
                )}
              >
                <span>{MARKET_CATEGORY_LABELS[category]}</span>
                <span
                  className={cn(
                    "numeric rounded px-1.5 py-0.5 text-2xs",
                    active
                      ? "bg-bull/15 font-bold text-bull"
                      : "bg-surface-sunken text-foreground-muted",
                  )}
                >
                  {marketCounts[category]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Secondary Filters: Sector Pills & Search */}
      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
        <div
          className="flex items-center gap-1 overflow-x-auto pb-1"
          role="group"
          aria-label="Sector filters"
        >
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSelectedSector(sector)}
              aria-pressed={selectedSector === sector}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring",
                selectedSector === sector
                  ? "border border-rule-strong bg-surface-inset font-semibold text-bull"
                  : "border border-transparent text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              {sector === "ALL" ? "All Sectors" : SECTOR_LABELS[sector]}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-foreground-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticker, company, ISIN, or exchange…"
            aria-label="Search instruments"
            className="w-full rounded-md border border-rule bg-surface-raised py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus-visible:outline-2 focus-visible:outline-ring"
          />
        </div>
      </div>

      {/* ── Specialized API Market Panels ───────────────────────────────────── */}

      {/* 1. CSE Casablanca Sector Summary (/api/v1/cse/sector-summary) */}
      {selectedMarket === "CSE" && (
        <section className="mb-8 rounded-lg border border-rule bg-surface-raised p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-bull" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                Bourse de Casablanca — Sector Summary
              </h2>
              <Badge tone="neutral" size="sm">
                /api/v1/cse/sector-summary
              </Badge>
            </div>
            <span className="numeric text-2xs text-foreground-muted">
              {CSE_SECTOR_SUMMARIES.length} Official CSE Sectors · Principal F · 38 Listed Companies
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CSE_SECTOR_SUMMARIES.map((sec) => {
              const isPos = sec.averageChangePercent >= 0;
              return (
                <div
                  key={sec.sector}
                  className="flex flex-col justify-between rounded-md border border-rule bg-surface p-3.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{sec.englishLabel}</p>
                        <p className="text-2xs text-foreground-muted">{sec.sector}</p>
                      </div>
                      <span
                        className={cn(
                          "numeric rounded px-1.5 py-0.5 text-xs font-semibold",
                          isPos ? "bg-bull-subtle text-bull" : "bg-bear-subtle text-bear",
                        )}
                      >
                        {isPos ? "+" : ""}
                        {sec.averageChangePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-2xs text-foreground-secondary numeric">
                      <span>Cap: {(sec.totalMarketCapMad / 1e9).toFixed(1)}B MAD</span>
                      <span>·</span>
                      <span className="text-bull">{sec.gainers} Up</span>
                      <span className="text-bear">{sec.losers} Down</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-rule/60 pt-2.5">
                    {sec.tickers.map((t) => (
                      <Link
                        key={t}
                        href={`/market/${t.toLowerCase()}`}
                        className="rounded border border-rule bg-surface-raised px-1.5 py-0.5 font-mono text-2xs font-medium text-foreground-secondary transition-colors hover:border-bull hover:text-bull"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Bonds & Treasury Yield Curve (/api/v1/bonds/yield-curve & /api/v1/fred/series/*) */}
      {selectedMarket === "BONDS" && (
        <section className="mb-8 rounded-lg border border-rule bg-surface-raised p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Sovereign Treasury Yield Curve (US FRED vs. Morocco BKAM BDT)
                </h2>
                <Badge tone="neutral" size="sm">
                  /api/v1/bonds/yield-curve
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-foreground-secondary">
                Constant-maturity sovereign yields across 11 tenors (1M to 30Y). Click any tenor to trade its underlying Treasury series.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs numeric">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-bull" />
                <span>US Treasury (FRED)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-xs bg-accent" />
                <span>Morocco BDT (BKAM)</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-11">
            {TREASURY_YIELD_CURVE.map((pt) => {
              const tradeable = findMarketAsset(pt.seriesId);
              const content = (
                <div className="flex flex-col justify-between rounded border border-rule bg-surface p-2.5 transition-colors hover:border-rule-strong">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-foreground">{pt.maturity}</span>
                    <span className="font-mono text-2xs text-foreground-muted">{pt.seriesId}</span>
                  </div>
                  <div className="my-2 space-y-1.5">
                    <div>
                      <div className="flex justify-between text-2xs numeric">
                        <span className="text-foreground-muted">UST</span>
                        <span className="font-semibold text-bull">{pt.usYieldPct.toFixed(2)}%</span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full bg-bull"
                          style={{ width: `${Math.min(100, (pt.usYieldPct / 5.5) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-2xs numeric">
                        <span className="text-foreground-muted">BDT</span>
                        <span className="font-semibold text-foreground">
                          {pt.moroccoBdtYieldPct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken">
                        <div
                          className="h-full bg-accent"
                          style={{ width: `${Math.min(100, (pt.moroccoBdtYieldPct / 5.5) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );

              return tradeable ? (
                <Link key={pt.maturity} href={`/market/${pt.seriesId.toLowerCase()}`}>
                  {content}
                </Link>
              ) : (
                <div key={pt.maturity}>{content}</div>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Forex Currency Converter (/api/v1/forex/convert & /api/v1/forex/currencies) */}
      {selectedMarket === "FOREX" && (
        <section className="mb-8 rounded-lg border border-rule bg-surface-raised p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-bull" />
              <h2 className="text-sm font-semibold tracking-tight text-foreground">
                FX Spot Cross-Rate Converter (ECB Frankfurter &amp; BKAM Reference)
              </h2>
              <Badge tone="neutral" size="sm">
                /api/v1/forex/convert
              </Badge>
            </div>
            <span className="numeric text-2xs text-foreground-muted">
              1 {fxFrom} = {fxResult.rate.toFixed(4)} {fxTo}
            </span>
          </div>

          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto_1fr_1.2fr]">
            <div>
              <label htmlFor="fx-amount" className="label mb-1 block text-2xs">
                Amount
              </label>
              <input
                id="fx-amount"
                type="number"
                min="0"
                step="any"
                value={fxAmount}
                onChange={(e) => setFxAmount(e.target.value)}
                className="numeric w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              />
            </div>

            <div>
              <label htmlFor="fx-from" className="label mb-1 block text-2xs">
                From Currency
              </label>
              <select
                id="fx-from"
                value={fxFrom}
                onChange={(e) => setFxFrom(e.target.value)}
                className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {FOREX_CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFxFrom(fxTo);
                setFxTo(fxFrom);
              }}
              aria-label="Swap currencies"
              className="flex h-9.5 cursor-pointer items-center justify-center rounded-md border border-rule bg-surface px-3 text-foreground-secondary transition-colors hover:border-rule-strong hover:text-bull"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <div>
              <label htmlFor="fx-to" className="label mb-1 block text-2xs">
                To Currency
              </label>
              <select
                id="fx-to"
                value={fxTo}
                onChange={(e) => setFxTo(e.target.value)}
                className="w-full rounded-md border border-rule bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-ring"
              >
                {FOREX_CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-md border border-bull/30 bg-bull-subtle px-4 py-2">
              <span className="label block text-2xs text-bull">Converted Spot Value</span>
              <p className="numeric text-lg font-bold text-foreground">
                {fxResult.converted.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="font-mono text-xs font-semibold text-bull">{fxTo}</span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Options Chain Explorer (/api/v1/options/chain & /api/v1/options/expirations) */}
      {selectedMarket === "OPTIONS" && (
        <section className="mb-8 rounded-lg border border-rule bg-surface-raised p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  CBOE Listed Options Chain Explorer
                </h2>
                <Badge tone="neutral" size="sm">
                  /api/v1/options/chain
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-foreground-secondary">
                Inspect strike prices, implied volatility (IV), open interest, and in-the-money status across active expirations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded border border-rule bg-surface p-0.5">
                {["ALL", "AAPL", "SPY", "NVDA", "QQQ", "TSLA"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setOptionUnderlying(u)}
                    className={cn(
                      "cursor-pointer rounded px-2 py-1 font-mono text-2xs font-medium transition-colors",
                      optionUnderlying === u
                        ? "bg-surface-inset font-bold text-bull"
                        : "text-foreground-secondary hover:text-foreground",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded border border-rule bg-surface p-0.5">
                {(["ALL", "CALL", "PUT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOptionTypeFilter(t)}
                    className={cn(
                      "cursor-pointer rounded px-2 py-1 text-2xs font-medium transition-colors",
                      optionTypeFilter === t
                        ? "bg-surface-inset font-bold text-bull"
                        : "text-foreground-secondary hover:text-foreground",
                    )}
                  >
                    {t === "ALL" ? "Calls & Puts" : `${t}S`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-rule bg-surface-sunken text-2xs label">
                <tr>
                  <th className="px-3 py-2">Contract</th>
                  <th className="px-3 py-2">Underlying</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Expiration</th>
                  <th className="px-3 py-2 text-right">Strike</th>
                  <th className="px-3 py-2 text-right">Last</th>
                  <th className="px-3 py-2 text-right">Bid / Ask</th>
                  <th className="px-3 py-2 text-right">Impl. Vol</th>
                  <th className="px-3 py-2 text-right">Open Int.</th>
                  <th className="px-3 py-2 text-center">Moneyness</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {filteredOptions.map((opt) => (
                  <tr key={opt.contractSymbol} className="hover:bg-surface-inset/50">
                    <td className="px-3 py-2 font-mono text-2xs font-semibold text-foreground">
                      {opt.contractSymbol}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-bull">{opt.underlying}</td>
                    <td className="px-3 py-2">
                      <Badge tone={opt.type === "CALL" ? "positive" : "negative"} size="sm">
                        {opt.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 numeric text-foreground-secondary">{opt.expiration}</td>
                    <td className="px-3 py-2 numeric text-right font-semibold">
                      ${opt.strike.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right font-medium">
                      ${opt.lastPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right text-foreground-secondary">
                      ${opt.bid.toFixed(2)} / ${opt.ask.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right text-foreground-secondary">
                      {opt.impliedVolatilityPct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 numeric text-right text-foreground-muted">
                      {opt.openInterest.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={opt.inTheMoney ? "accent" : "neutral"} size="sm">
                        {opt.inTheMoney ? "ITM" : "OTM"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/market/${opt.tradeableTicker.toLowerCase()}`}
                        className="font-mono text-2xs font-semibold text-bull hover:underline"
                      >
                        Trade &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {failed ? (
        <div
          role="alert"
          className="rounded-lg border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
        >
          Quotes are unavailable. The board will keep trying every {REFRESH_MS / 1000}s.
        </div>
      ) : null}

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-64 rounded-lg border border-rule bg-surface-sunken" />
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="label text-sm font-semibold text-foreground-secondary">
                Continuous Order Board — {MARKET_CATEGORY_LABELS[selectedMarket]} (
                {filteredQuotes.length})
              </h2>
              <span className="numeric text-2xs text-foreground-muted">
                Updated every {REFRESH_MS / 1000}s
              </span>
            </div>
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-lg border border-rule" />}
            >
              <QuoteBoard
                rows={filteredQuotes.map((quote) => {
                  const extended = findMarketAsset(quote.symbol);
                  const instrument = market.getInstrument(quote.symbol);
                  return {
                    asset: {
                      ticker: quote.symbol,
                      name: extended?.name ?? instrument?.name ?? quote.symbol,
                      sector: (extended?.sector ?? instrument?.sector ?? "INDUSTRY") as Sector,
                      description: extended?.description ?? "",
                      currency: "MAD" as const,
                      market: extended?.market,
                      exchange: extended?.exchange,
                      displayCurrency: extended?.displayCurrency,
                      startingPriceCents: Number(quote.lastCents),
                      annualVolatility: extended?.annualVolatility ?? instrument?.annualVolatility ?? 0.2,
                      annualDrift: extended?.annualDrift ?? instrument?.annualDrift ?? 0.05,
                    },
                    changeBps: quote.changeBps,
                  };
                })}
                caption={`${MARKET_CATEGORY_LABELS[selectedMarket]} quotations (${filteredQuotes.length} instruments)`}
              />
            </Suspense>
          </div>

          <div className="border-t border-rule pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Tradeable Instruments ({filteredQuotes.length})
              </h2>
            </div>

            {filteredQuotes.length === 0 ? (
              <div className="rounded-lg border border-rule bg-surface-sunken p-8 text-center">
                <p className="text-sm text-foreground-muted">
                  No instruments match your active market or search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredQuotes.map((quote) => {
                  const extended = findMarketAsset(quote.symbol);
                  const instrument = market.getInstrument(quote.symbol);
                  const isUp = quote.changeBps >= 0n;

                  return (
                    <Link
                      key={quote.symbol}
                      href={`/market/${quote.symbol.toLowerCase()}`}
                      className="group flex flex-col justify-between rounded-lg border border-rule bg-surface-raised p-4 transition-colors duration-150 hover:border-rule-strong hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-base font-bold text-bull">
                            {quote.symbol}
                          </span>
                          <div className="flex items-center gap-1">
                            {extended?.market ? (
                              <Badge tone="accent" size="sm">
                                {extended.market}
                              </Badge>
                            ) : null}
                            {extended || instrument ? (
                              <Badge tone="neutral" size="sm">
                                {
                                  SECTOR_LABELS[
                                    (extended?.sector ?? instrument?.sector ?? "INDUSTRY") as Sector
                                  ]
                                }
                              </Badge>
                            ) : null}
                          </div>
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-foreground">
                          {extended?.name ?? instrument?.name ?? quote.symbol}
                        </p>
                        <p className="mt-0.5 truncate text-2xs text-foreground-muted">
                          {extended?.exchange ?? "Simulated Exchange"}
                          {extended?.isin ? ` · ${extended.isin}` : ""}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t border-rule/60 pt-3">
                        <div>
                          <p className="numeric text-2xl font-bold tracking-tight text-foreground">
                            <Num cents={quote.lastCents} />
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isUp ? (
                              <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-bull" />
                            ) : (
                              <ArrowDownRight aria-hidden className="h-3.5 w-3.5 text-bear" />
                            )}
                            <Delta bps={quote.changeBps} size="xs" />
                          </div>
                        </div>

                        <span className="flex items-center gap-0.5 text-2xs font-medium text-foreground-muted transition-colors group-hover:text-bull">
                          Trade &rarr;
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}