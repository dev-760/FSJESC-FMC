"use client";

import { useEffect, useMemo, useState } from "react";
import { CandlestickChart, Table as TableIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PriceChart } from "../charts/price-chart";
import { Num, Delta } from "../primitives/num";
import { Badge } from "../badge";
import { cn } from "@fsjesc/config/cn";
import { market } from "@fsjesc/domain/market/engine";
import type { Interval, Quote } from "@fsjesc/domain/market/provider";
import { INTERVALS } from "@fsjesc/domain/market/store";
import { formatDate } from "@fsjesc/config/format";

export interface InstrumentTerminalProps {
  ticker: string;
  name: string;
  sectorLabel: string;
  startingPriceCents: number;
  annualVolatility: number;
  annualDrift: number;
  description: string;
  marketLabel?: string;
  exchange?: string;
  isin?: string;
  compartment?: string;
  frenchSector?: string;
  apiEndpoint?: string;
  ratios?: {
    per?: number;
    pbr?: number;
    roe?: number;
    dividendYield?: number;
  };
}

export function InstrumentTerminal({
  ticker,
  name,
  sectorLabel,
  startingPriceCents,
  annualVolatility,
  annualDrift,
  description,
  marketLabel,
  exchange,
  isin,
  compartment,
  frenchSector,
  apiEndpoint,
  ratios,
}: InstrumentTerminalProps) {
  const [interval, setIntervalState] = useState<Interval>("1d");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [quote, setQuote] = useState<Quote | null>(null);

  // Poll for latest quote
  useEffect(() => {
    const update = () => {
      try {
        setQuote(market.getQuote(ticker, new Date()));
      } catch (e) {
        console.error("Failed to update quote", e);
      }
    };
    update();
    const timer = setInterval(update, 3000);
    return () => clearInterval(timer);
  }, [ticker]);

  // Derive series based on selected interval
  const series = useMemo(() => {
    return market.getSeries(ticker, interval, new Date()).candles;
  }, [ticker, interval]);

  const currentPriceCents = quote?.lastCents ?? BigInt(startingPriceCents);
  const changeBps = quote?.changeBps ?? 0n;
  const isPositive = changeBps >= 0n;

  // Calculate 52w high / low or series high / low
  const seriesHighCents = series.length > 0 ? Math.max(...series.map((c) => c.highCents)) : startingPriceCents;
  const seriesLowCents = series.length > 0 ? Math.min(...series.map((c) => c.lowCents)) : startingPriceCents;

  // Deterministic 5-level simulated L2 Order Book derived from quote.bidCents / quote.askCents
  const orderBook = useMemo(() => {
    if (!quote) return null;
    const tickCents = 5; // 0.05 MAD tick size
    const baseSeed = ticker.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const levels = [0, 1, 2, 3, 4];
    const bids = levels.map((lvl) => {
      const priceCents = Math.max(tickCents, quote.bidCents - lvl * tickCents);
      const qty = 60 + ((baseSeed * (lvl + 3) + Math.floor(quote.volume / 50)) % 420);
      return { priceCents, qty };
    });
    const asks = levels.map((lvl) => {
      const priceCents = quote.askCents + lvl * tickCents;
      const qty = 55 + ((baseSeed * (lvl + 7) + Math.floor(quote.volume / 45)) % 410);
      return { priceCents, qty };
    });
    const maxQty = Math.max(...bids.map((b) => b.qty), ...asks.map((a) => a.qty), 1);
    return { bids, asks, maxQty };
  }, [quote, ticker]);

  return (
    <div className="space-y-6">
      {/* Top Quote Header */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {marketLabel ? <Badge tone="accent">{marketLabel}</Badge> : null}
            <Badge tone="neutral">{sectorLabel}</Badge>
            {compartment ? (
              <span className="rounded bg-surface-inset px-2 py-0.5 font-mono text-2xs text-foreground-secondary">
                {compartment}
              </span>
            ) : null}
            {isin ? (
              <span className="font-mono text-2xs text-foreground-muted">ISIN: {isin}</span>
            ) : (
              <span className="text-2xs text-foreground-muted numeric">TICK SIZE: 0.05 MAD</span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">{name}</h1>
          <p className="numeric text-foreground-secondary mt-1 text-base sm:text-lg flex flex-wrap items-center gap-2">
            <span className="font-semibold text-foreground">{ticker}</span>
            <span>·</span>
            <span>{exchange ?? "Casablanca Continuous Simulation"}</span>
            {frenchSector && frenchSector !== sectorLabel ? (
              <>
                <span>·</span>
                <span className="text-sm text-foreground-muted">{frenchSector}</span>
              </>
            ) : null}
          </p>
          {description && (
            <p className="text-xs sm:text-sm text-foreground-secondary mt-2 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>

        <div className="text-left sm:text-right">
          <div className="flex items-baseline sm:justify-end gap-3">
            <p className="numeric text-3xl sm:text-4xl font-bold tracking-tight">
              <Num cents={currentPriceCents} />
            </p>
            <div className="flex items-center gap-1">
              <Delta bps={changeBps} size="sm" />
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-bull" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-bear" />
              )}
            </div>
          </div>
          <p className="label mt-1 text-foreground-muted">
            Mark-to-Market Price · MAD
            {apiEndpoint ? ` · ${apiEndpoint.split("?")[0]}` : ""}
          </p>
        </div>
      </div>

      {/* Market Depth / Bid-Ask Strip */}
      {quote && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-sunken p-3.5 rounded-lg border border-rule text-xs sm:text-sm">
          <div>
            <span className="label text-2xs text-bull">BID (BUY)</span>
            <p className="numeric font-semibold text-foreground mt-0.5">
              {(quote.bidCents / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="label text-2xs text-bear">ASK (SELL)</span>
            <p className="numeric font-semibold text-foreground mt-0.5">
              {(quote.askCents / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="label text-2xs">SPREAD</span>
            <p className="numeric font-medium text-foreground-secondary mt-0.5">
              {((quote.askCents - quote.bidCents) / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="label text-2xs">VOLUME (24H)</span>
            <p className="numeric font-medium text-foreground-secondary mt-0.5">
              {quote.volume.toLocaleString("fr-MA")} shs
            </p>
          </div>
        </div>
      )}

      {/* Chart & Analytics Container */}
      <div className="rounded-lg border border-rule bg-surface-raised overflow-hidden">
        {/* Terminal Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-2.5 bg-surface">
          {/* Interval Selector */}
          <div className="flex items-center gap-1" role="group" aria-label="Timeframe intervals">
            <span className="label text-2xs mr-2 text-foreground-muted hidden sm:inline">Interval:</span>
            {INTERVALS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntervalState(opt.value)}
                aria-pressed={interval === opt.value}
                className={cn(
                  "numeric text-2xs rounded px-2.5 py-1 font-medium transition-colors cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  interval === opt.value
                    ? "bg-surface-inset text-bull font-bold border border-rule-strong"
                    : "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Chart vs Accessible Table */}
          <div className="flex items-center gap-1.5 bg-surface-sunken p-0.5 rounded border border-rule">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-2xs font-medium rounded transition-colors cursor-pointer",
                viewMode === "chart"
                  ? "bg-surface-raised text-foreground font-semibold shadow-xs"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              <CandlestickChart className="h-3.5 w-3.5" />
              <span>Candles</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-2xs font-medium rounded transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-surface-raised text-foreground font-semibold shadow-xs"
                  : "text-foreground-muted hover:text-foreground",
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Data Table</span>
            </button>
          </div>
        </div>

        {/* Chart View */}
        {viewMode === "chart" ? (
          <div className="p-2 sm:p-4 bg-surface">
            <PriceChart
              symbol={ticker}
              candles={series}
              interval={interval}
              height={380}
              label={`${ticker} simulated ${interval} price candlestick chart. Current price ${(Number(currentPriceCents) / 100).toFixed(2)} MAD.`}
            />
          </div>
        ) : (
          /* Accessible Historical Table View (Part 9.3 parity) */
          <div className="max-h-[380px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-sunken sticky top-0 border-b border-rule">
                <tr>
                  <th className="px-4 py-2 font-mono label text-2xs">Time / Date</th>
                  <th className="px-4 py-2 font-mono label text-2xs text-right">Open</th>
                  <th className="px-4 py-2 font-mono label text-2xs text-right">High</th>
                  <th className="px-4 py-2 font-mono label text-2xs text-right">Low</th>
                  <th className="px-4 py-2 font-mono label text-2xs text-right">Close</th>
                  <th className="px-4 py-2 font-mono label text-2xs text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule/50">
                {series.slice().reverse().map((candle, idx) => (
                  <tr key={idx} className="hover:bg-surface-inset/50 transition-colors">
                    <td className="px-4 py-2 numeric text-foreground-secondary">
                      {formatDate(new Date(candle.time * 1000))}
                    </td>
                    <td className="px-4 py-2 numeric text-right">
                      {(candle.openCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 numeric text-right text-bull">
                      {(candle.highCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 numeric text-right text-bear">
                      {(candle.lowCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 numeric text-right font-medium">
                      {(candle.closeCents / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 numeric text-right text-foreground-muted">
                      {candle.volume.toLocaleString("fr-MA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-rule px-4 py-2.5 bg-surface-sunken flex flex-wrap items-center justify-between text-2xs text-foreground-secondary gap-2">
          <span>Continuous Geometric Brownian Motion model. Hash-seeded deterministic prices.</span>
          <span className="numeric">Bars loaded: {series.length}</span>
        </div>
      </div>

      {/* Simulated L2 Order Book (5-level depth) */}
      {orderBook && (
        <div className="rounded-lg border border-rule bg-surface-raised overflow-hidden">
          <div className="border-b border-rule px-4 py-2.5 bg-surface flex items-center justify-between">
            <span className="label text-2xs">Simulated Order Book (L2 Depth · 5 Levels)</span>
            <span className="numeric text-2xs text-foreground-muted">Tick: 0.05 MAD</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-rule text-xs">
            {/* Bids (Buy Side) */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between text-2xs label text-foreground-muted pb-1 border-b border-rule/60">
                <span>Bid Qty (shs)</span>
                <span className="text-bull">Bid Price (MAD)</span>
              </div>
              {orderBook.bids.map((level, idx) => {
                const widthPct = Math.round((level.qty / orderBook.maxQty) * 100);
                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-between py-1 px-2 rounded overflow-hidden numeric"
                  >
                    <div
                      className="absolute inset-y-0 right-0 bg-bull-subtle pointer-events-none"
                      style={{ width: `${widthPct}%` }}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 text-foreground-secondary">
                      {level.qty.toLocaleString("fr-MA")}
                    </span>
                    <span className="relative z-10 font-semibold text-bull">
                      {(level.priceCents / 100).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Asks (Sell Side) */}
            <div className="p-3 space-y-1">
              <div className="flex items-center justify-between text-2xs label text-foreground-muted pb-1 border-b border-rule/60">
                <span className="text-bear">Ask Price (MAD)</span>
                <span>Ask Qty (shs)</span>
              </div>
              {orderBook.asks.map((level, idx) => {
                const widthPct = Math.round((level.qty / orderBook.maxQty) * 100);
                return (
                  <div
                    key={idx}
                    className="relative flex items-center justify-between py-1 px-2 rounded overflow-hidden numeric"
                  >
                    <div
                      className="absolute inset-y-0 left-0 bg-bear-subtle pointer-events-none"
                      style={{ width: `${widthPct}%` }}
                      aria-hidden="true"
                    />
                    <span className="relative z-10 font-semibold text-bear">
                      {(level.priceCents / 100).toFixed(2)}
                    </span>
                    <span className="relative z-10 text-foreground-secondary">
                      {level.qty.toLocaleString("fr-MA")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Model Parameters & Financial Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-raised p-4 rounded-lg border border-rule">
        <div>
          <span className="label text-2xs text-foreground-muted">Modelled Volatility</span>
          <p className="numeric text-base sm:text-lg font-semibold text-foreground mt-1">
            {(annualVolatility * 100).toFixed(0)}% <span className="text-2xs text-foreground-secondary">p.a.</span>
          </p>
        </div>
        <div>
          <span className="label text-2xs text-foreground-muted">Modelled Drift</span>
          <p className="numeric text-base sm:text-lg font-semibold text-foreground mt-1">
            {(annualDrift * 100).toFixed(1)}% <span className="text-2xs text-foreground-secondary">p.a.</span>
          </p>
        </div>
        <div>
          <span className="label text-2xs text-foreground-muted">Range (Period Low)</span>
          <p className="numeric text-base sm:text-lg font-semibold text-bear mt-1">
            {(seriesLowCents / 100).toFixed(2)} MAD
          </p>
        </div>
        <div>
          <span className="label text-2xs text-foreground-muted">Range (Period High)</span>
          <p className="numeric text-base sm:text-lg font-semibold text-bull mt-1">
            {(seriesHighCents / 100).toFixed(2)} MAD
          </p>
        </div>
      </div>

      {/* Fundamental Valuation Ratios (/api/v1/cse/instrument-detail & /api/v1/stocks) */}
      {ratios && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-surface-sunken p-4 rounded-lg border border-rule">
          <div>
            <span className="label text-2xs text-foreground-muted">P/E Ratio (PER)</span>
            <p className="numeric text-base sm:text-lg font-semibold text-foreground mt-1">
              {ratios.per !== undefined ? `${ratios.per.toFixed(1)}x` : "N/A"}
            </p>
          </div>
          <div>
            <span className="label text-2xs text-foreground-muted">Price / Book (PBR)</span>
            <p className="numeric text-base sm:text-lg font-semibold text-foreground mt-1">
              {ratios.pbr !== undefined ? `${ratios.pbr.toFixed(2)}x` : "N/A"}
            </p>
          </div>
          <div>
            <span className="label text-2xs text-foreground-muted">Return on Equity (ROE)</span>
            <p className="numeric text-base sm:text-lg font-semibold text-foreground mt-1">
              {ratios.roe !== undefined ? `${ratios.roe.toFixed(1)}%` : "N/A"}
            </p>
          </div>
          <div>
            <span className="label text-2xs text-foreground-muted">Dividend Yield</span>
            <p className="numeric text-base sm:text-lg font-semibold text-bull mt-1">
              {ratios.dividendYield !== undefined ? `${ratios.dividendYield.toFixed(2)}%` : "N/A"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
