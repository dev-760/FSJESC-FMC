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
import { useSimulatorPortfolio } from "./simulator-store";

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
  const { telemetry } = useSimulatorPortfolio(3000);
  const [interval, setIntervalState] = useState<Interval>("1d");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [quote, setQuote] = useState<Quote | null>(null);

  // Poll for latest quote at the simulator's effective date
  useEffect(() => {
    const update = () => {
      try {
        setQuote(market.getQuote(ticker, telemetry.effectiveDate));
      } catch (e) {
        console.error("Failed to update quote", e);
      }
    };
    update();
    const timer = setInterval(update, 3000);
    return () => clearInterval(timer);
  }, [ticker, telemetry.effectiveDate]);

  // Derive series based on selected interval and effective simulated date
  const series = useMemo(() => {
    return market.getSeries(ticker, interval, telemetry.effectiveDate).candles;
  }, [ticker, interval, telemetry.effectiveDate]);

  const currentPriceCents = quote?.lastCents ?? startingPriceCents;
  const changeBps = quote?.changeBps ?? 0n;
  const isPositive = changeBps >= 0n;

  const seriesHighCents =
    series.length > 0 ? Math.max(...series.map((c) => c.highCents)) : startingPriceCents;
  const seriesLowCents =
    series.length > 0 ? Math.min(...series.map((c) => c.lowCents)) : startingPriceCents;
  const lastCandle = series[series.length - 1];

  // Deterministic 5-level simulated L2 Order Book with cumulative sizes and spread in bps
  const orderBook = useMemo(() => {
    if (!quote) return null;
    const tickCents = 5;
    const baseSeed = ticker.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const levels = [0, 1, 2, 3, 4];

    let cumBid = 0;
    const bids = levels.map((lvl) => {
      const priceCents = Math.max(tickCents, quote.bidCents - lvl * tickCents);
      const qty = 60 + ((baseSeed * (lvl + 3) + Math.floor(quote.volume / 50)) % 420);
      cumBid += qty;
      return { priceCents, qty, cumQty: cumBid };
    });

    let cumAsk = 0;
    const asks = levels.map((lvl) => {
      const priceCents = quote.askCents + lvl * tickCents;
      const qty = 55 + ((baseSeed * (lvl + 7) + Math.floor(quote.volume / 45)) % 410);
      cumAsk += qty;
      return { priceCents, qty, cumQty: cumAsk };
    });

    const maxCum = Math.max(cumBid, cumAsk, 1);
    const spreadCents = Math.max(0, quote.askCents - quote.bidCents);
    const spreadBps =
      quote.lastCents > 0 ? ((spreadCents / quote.lastCents) * 10_000).toFixed(1) : "0.0";

    return { bids, asks, maxCum, spreadCents, spreadBps };
  }, [quote, ticker]);

  return (
    <div className="space-y-5">
      {/* Top Quote Header */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-[var(--sim-border)] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
            {marketLabel ? <Badge tone="accent">{marketLabel}</Badge> : null}
            <Badge tone="neutral">{frenchSector ?? sectorLabel}</Badge>
            {compartment ? (
              <span className="rounded bg-[var(--sim-bg-muted)] px-2 py-0.5 font-mono text-[10px] font-semibold text-[var(--sim-ink-2)]">
                Comp. {compartment}
              </span>
            ) : null}
            {isin ? (
              <span className="font-mono text-[10.5px] text-[var(--sim-ink-3)]">ISIN: {isin}</span>
            ) : (
              <span className="text-2xs text-[var(--sim-ink-3)] numeric">PAS: 0.05 MAD</span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--sim-ink)]">
            {name} <span className="font-mono text-base text-[var(--sim-gold-ink)]">({ticker})</span>
          </h2>
          {description && (
            <p className="text-xs text-[var(--sim-ink-3)] mt-1 max-w-2xl leading-relaxed line-clamp-2">
              {description}
            </p>
          )}
        </div>

        <div className="text-left sm:text-right">
          <div className="flex items-baseline sm:justify-end gap-2.5">
            <p className="numeric text-2xl sm:text-3xl font-bold tracking-tight text-[var(--sim-ink)]">
              <Num cents={BigInt(currentPriceCents)} />
            </p>
            <div className="flex items-center gap-1">
              <Delta bps={changeBps} size="sm" />
              {isPositive ? (
                <ArrowUpRight className="h-4 w-4 text-[var(--sim-emerald)]" />
              ) : (
                <ArrowDownRight className="h-4 w-4 text-[var(--sim-terracotta)]" />
              )}
            </div>
          </div>
          <p className="font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)] mt-0.5">
            {exchange ?? "Bourse de Casablanca"} · Jour {telemetry.dayNumber}
            {apiEndpoint ? ` · ${apiEndpoint.split("?")[0]}` : ""}
          </p>
        </div>
      </div>

      {/* OHLCV + Bid/Ask Strip */}
      {quote && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3 text-xs">
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-emerald)] font-semibold">
              Meilleur Achat (Bid)
            </span>
            <p className="numeric font-bold text-[var(--sim-ink)] mt-0.5">
              {(quote.bidCents / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-terracotta)] font-semibold">
              Meilleure Vente (Ask)
            </span>
            <p className="numeric font-bold text-[var(--sim-ink)] mt-0.5">
              {(quote.askCents / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Ouverture (J)
            </span>
            <p className="numeric font-semibold text-[var(--sim-ink-2)] mt-0.5">
              {((lastCandle?.openCents ?? quote.lastCents) / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Plus Haut / Bas
            </span>
            <p className="numeric font-semibold text-[var(--sim-ink-2)] mt-0.5">
              {((lastCandle?.highCents ?? seriesHighCents) / 100).toFixed(2)} /{" "}
              {((lastCandle?.lowCents ?? seriesLowCents) / 100).toFixed(2)}
            </p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Spread L2
            </span>
            <p className="numeric font-semibold text-[var(--sim-ink-2)] mt-0.5">
              {((quote.askCents - quote.bidCents) / 100).toFixed(2)} MAD
            </p>
          </div>
          <div>
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Volume (24h)
            </span>
            <p className="numeric font-semibold text-[var(--sim-ink-2)] mt-0.5">
              {quote.volume.toLocaleString("fr-MA")} t.
            </p>
          </div>
        </div>
      )}

      {/* Chart Container */}
      <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sim-border)] px-3.5 py-2 bg-[var(--sim-bg-subtle)]">
          {/* Interval Selector */}
          <div className="flex items-center gap-1" role="group" aria-label="Unités de temps">
            <span className="font-mono text-[10px] uppercase text-[var(--sim-ink-3)] mr-1.5 hidden sm:inline">
              Unité :
            </span>
            {INTERVALS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntervalState(opt.value)}
                aria-pressed={interval === opt.value}
                className={cn(
                  "numeric text-2xs rounded-md px-2.5 py-1 font-semibold transition-colors cursor-pointer",
                  interval === opt.value
                    ? "bg-[var(--sim-navy)] text-[#f0d28a] shadow-2xs"
                    : "text-[var(--sim-ink-3)] hover:bg-[var(--sim-bg-muted)] hover:text-[var(--sim-ink)]",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Chart vs Accessible Table */}
          <div className="flex items-center gap-1 bg-[var(--sim-bg-muted)] p-0.5 rounded-lg border border-[var(--sim-border)]">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "chart"
                  ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                  : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
              )}
            >
              <CandlestickChart className="h-3.5 w-3.5" />
              <span>Chandeliers</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 text-2xs font-semibold rounded-md transition-colors cursor-pointer",
                viewMode === "table"
                  ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                  : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
              <span>Séries OHLCV</span>
            </button>
          </div>
        </div>

        {viewMode === "chart" ? (
          <div className="p-2 sm:p-3 bg-[var(--sim-bg-card)]">
            <PriceChart
              symbol={ticker}
              candles={series}
              interval={interval}
              height={340}
              label={`${ticker} ${interval} price candlestick chart. Current price ${(Number(currentPriceCents) / 100).toFixed(2)} MAD.`}
            />
          </div>
        ) : (
          <div className="max-h-[340px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] sticky top-0 border-b border-[var(--sim-border)] font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-4 py-2">Date / Heure</th>
                  <th className="px-4 py-2 text-right">Ouverture</th>
                  <th className="px-4 py-2 text-right">Plus Haut</th>
                  <th className="px-4 py-2 text-right">Plus Bas</th>
                  <th className="px-4 py-2 text-right">Clôture</th>
                  <th className="px-4 py-2 text-right">Volume</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {series
                  .slice()
                  .reverse()
                  .map((candle, idx) => (
                    <tr key={idx} className="hover:bg-[var(--sim-bg-subtle)]">
                      <td className="px-4 py-2 numeric text-[var(--sim-ink-2)]">
                        {formatDate(new Date(candle.time * 1000))}
                      </td>
                      <td className="px-4 py-2 numeric text-right">
                        {(candle.openCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 numeric text-right text-[var(--sim-emerald)]">
                        {(candle.highCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 numeric text-right text-[var(--sim-terracotta)]">
                        {(candle.lowCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 numeric text-right font-semibold">
                        {(candle.closeCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 numeric text-right text-[var(--sim-ink-3)]">
                        {candle.volume.toLocaleString("fr-MA")}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simulated L2 Order Book (matches mockups/Simulator.html .book) */}
      {orderBook && (
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] overflow-hidden">
          <div className="border-b border-[var(--sim-border)] px-4 py-2.5 bg-[var(--sim-bg-subtle)] flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--sim-ink)]">
              Carnet d&apos;Ordres Central (Profondeur L2 · 5 Niveaux)
            </span>
            <span className="font-mono text-[11px] text-[var(--sim-ink-3)]">
              Fourchette :{" "}
              <strong className="text-[var(--sim-ink)]">
                {(orderBook.spreadCents / 100).toFixed(2)} MAD ({orderBook.spreadBps} bps)
              </strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[var(--sim-border)]">
            {/* Bids (Achats) */}
            <div className="p-2.5">
              <div className="grid grid-cols-3 px-3 py-1 font-mono text-[10px] uppercase text-[var(--sim-ink-3)] border-b border-[var(--sim-border)]">
                <span>Cumul</span>
                <span className="text-right">Qté Achat</span>
                <span className="text-right text-[var(--sim-emerald)] font-bold">
                  Cours Bid (MAD)
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                {orderBook.bids.map((lvl, idx) => {
                  const widthPct = Math.round((lvl.cumQty / orderBook.maxCum) * 100);
                  return (
                    <div key={idx} className="sim-book-row sim-book-row--bid rounded">
                      <div
                        className="sim-book-row__bar"
                        style={{ width: `${widthPct}%` }}
                        aria-hidden="true"
                      />
                      <span className="relative z-10 text-[var(--sim-ink-3)]">
                        {lvl.cumQty.toLocaleString("fr-MA")}
                      </span>
                      <span className="relative z-10 text-right text-[var(--sim-ink-2)]">
                        {lvl.qty.toLocaleString("fr-MA")}
                      </span>
                      <span className="relative z-10 text-right font-bold text-[var(--sim-emerald)]">
                        {(lvl.priceCents / 100).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Asks (Ventes) */}
            <div className="p-2.5">
              <div className="grid grid-cols-3 px-3 py-1 font-mono text-[10px] uppercase text-[var(--sim-ink-3)] border-b border-[var(--sim-border)]">
                <span className="text-[var(--sim-terracotta)] font-bold">Cours Ask (MAD)</span>
                <span className="text-right">Qté Vente</span>
                <span className="text-right">Cumul</span>
              </div>
              <div className="mt-1 space-y-0.5">
                {orderBook.asks.map((lvl, idx) => {
                  const widthPct = Math.round((lvl.cumQty / orderBook.maxCum) * 100);
                  return (
                    <div key={idx} className="sim-book-row sim-book-row--ask rounded">
                      <div
                        className="sim-book-row__bar"
                        style={{ width: `${widthPct}%`, left: 0, right: "auto" }}
                        aria-hidden="true"
                      />
                      <span className="relative z-10 font-bold text-[var(--sim-terracotta)]">
                        {(lvl.priceCents / 100).toFixed(2)}
                      </span>
                      <span className="relative z-10 text-right text-[var(--sim-ink-2)]">
                        {lvl.qty.toLocaleString("fr-MA")}
                      </span>
                      <span className="relative z-10 text-right text-[var(--sim-ink-3)]">
                        {lvl.cumQty.toLocaleString("fr-MA")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Parameters & Fundamental Valuation Ratios */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3">
          <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
            Volatilité Modélisée
          </span>
          <p className="numeric text-sm font-bold text-[var(--sim-ink)] mt-0.5">
            {(annualVolatility * 100).toFixed(0)}% <span className="text-[11px] font-normal text-[var(--sim-ink-3)]">/ an</span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3">
          <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
            Dérive (Drift μ)
          </span>
          <p className="numeric text-sm font-bold text-[var(--sim-ink)] mt-0.5">
            {(annualDrift * 100).toFixed(1)}% <span className="text-[11px] font-normal text-[var(--sim-ink-3)]">/ an</span>
          </p>
        </div>
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3">
          <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
            PER / PBR
          </span>
          <p className="numeric text-sm font-bold text-[var(--sim-ink)] mt-0.5">
            {ratios?.per !== undefined ? `${ratios.per.toFixed(1)}x` : "—"} /{" "}
            {ratios?.pbr !== undefined ? `${ratios.pbr.toFixed(2)}x` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3">
          <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
            ROE / Rendement Div.
          </span>
          <p className="numeric text-sm font-bold text-[var(--sim-emerald)] mt-0.5">
            {ratios?.roe !== undefined ? `${ratios.roe.toFixed(1)}%` : "—"} /{" "}
            {ratios?.dividendYield !== undefined ? `${ratios.dividendYield.toFixed(2)}%` : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
