"use client";

import { useEffect, useMemo, useState } from "react";
import { CandlestickChart, Table as TableIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PriceChart } from "@/components/charts/price-chart";
import { Num, Delta } from "@/components/primitives/num";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { market } from "@/lib/market/engine";
import type { Interval, Quote } from "@/lib/market/provider";
import { INTERVALS } from "@/lib/market/store";
import { formatDate } from "@/lib/format";

export interface InstrumentTerminalProps {
  ticker: string;
  name: string;
  sectorLabel: string;
  startingPriceCents: number;
  annualVolatility: number;
  annualDrift: number;
  description: string;
}

export function InstrumentTerminal({
  ticker,
  name,
  sectorLabel,
  startingPriceCents,
  annualVolatility,
  annualDrift,
  description: _description,
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

  return (
    <div className="space-y-6">
      {/* Top Quote Header */}
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-rule pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge tone="accent">{sectorLabel}</Badge>
            <span className="text-2xs text-foreground-muted numeric">TICK SIZE: 0.05 MAD</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight">{name}</h1>
          <p className="numeric text-foreground-secondary mt-1 text-base sm:text-lg flex items-center gap-2">
            <span className="font-semibold text-foreground">{ticker}</span>
            <span>·</span>
            <span>Casablanca Continuous Simulation</span>
          </p>
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
          <p className="label mt-1 text-foreground-muted">Mark-to-Market Price · MAD</p>
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
    </div>
  );
}
