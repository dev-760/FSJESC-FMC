"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { PriceChart } from "../charts/price-chart";
import { Sparkline } from "../charts/sparkline";
import { SessionIndicator } from "../financial/session-indicator";
import { Delta, Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";
import { findMarketAsset } from "@fsjesc/domain/assets";
import { market, TRADEABLE } from "@fsjesc/domain/market/engine";
import { INTERVALS, useTerminalView } from "@fsjesc/domain/market/store";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import { useMarketStream } from "./use-market-stream";

const PREVIEW_TABS = [
  {
    id: "CSE",
    label: "CSE Casablanca",
    endpoint: "/api/v1/cse",
    symbols: ["ATW", "IAM", "BCP", "LHM", "TQM", "MNG", "CSR", "MSA"],
  },
  {
    id: "STOCKS",
    label: "Global Stocks",
    endpoint: "/api/v1/stocks",
    symbols: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "META", "TSLA", "JPM"],
  },
  {
    id: "MACRO",
    label: "ETFs & Futures",
    endpoint: "/api/v1/etfs · /futures",
    symbols: ["SPY", "QQQ", "GLD", "ES", "NQ", "GC", "CL", "ZB"],
  },
  {
    id: "CRYPTO_FX",
    label: "Crypto, FX & Rates",
    endpoint: "/api/v1/crypto · /forex · /bonds",
    symbols: ["BTC", "ETH", "SOL", "USDMAD", "EURMAD", "US10Y", "BDT10Y", "AAPL-CALL"],
  },
] as const;

type PreviewTabId = (typeof PREVIEW_TABS)[number]["id"];

export function TerminalPreview({ className }: { className?: string }) {
  const { quotes } = useMarketStream();
  const ready = quotes.length > 0;
  const { symbol, interval, setSymbol, setInterval } = useTerminalView();
  const [activeTab, setActiveTab] = useState<PreviewTabId>("CSE");

  const currentTab = useMemo(
    () => PREVIEW_TABS.find((tab) => tab.id === activeTab) ?? PREVIEW_TABS[0],
    [activeTab],
  );

  const previewInstruments = useMemo(
    () =>
      currentTab.symbols
        .map((sym) => TRADEABLE.find((inst) => inst.symbol === sym))
        .filter((inst): inst is (typeof TRADEABLE)[number] => Boolean(inst)),
    [currentTab],
  );

  const selected = quotes.find((quote) => quote.symbol === symbol) ?? quotes[0];
  const selectedAssetMeta = useMemo(() => findMarketAsset(symbol), [symbol]);

  const series = useMemo(
    () => market.getSeries(symbol, interval, new Date()).candles,
    [symbol, interval],
  );

  const handleTabChange = (tabId: PreviewTabId) => {
    setActiveTab(tabId);
    const nextTab = PREVIEW_TABS.find((t) => t.id === tabId);
    if (nextTab && !nextTab.symbols.includes(symbol as never)) {
      const firstSym = nextTab.symbols[0];
      if (firstSym) setSymbol(firstSym);
    }
  };

  const spreadBps =
    selected && selected.lastCents > 0
      ? (((selected.askCents - selected.bidCents) / selected.lastCents) * 10_000).toFixed(1)
      : "0.0";

  return (
    <div className={cn("border-rule bg-surface border shadow-sm", className)}>
      {/* Terminal chrome: live status, market tabs, session clock, interval selector */}
      <div className="border-rule bg-surface-sunken flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="bg-bull inline-block size-2 rounded-full" aria-hidden="true" />
          <p className="label text-foreground font-semibold">Live Terminal Preview</p>
          <span className="text-rule-strong" aria-hidden="true">
            ·
          </span>
          <p className="numeric text-2xs text-foreground-secondary">{currentTab.endpoint}</p>
        </div>

        <div className="flex items-center gap-3">
          <SessionIndicator />
          <div role="group" aria-label="Chart interval" className="flex items-center gap-0.5">
            {INTERVALS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setInterval(option.value)}
                aria-pressed={interval === option.value}
                className={cn(
                  "focus-visible:outline-ring numeric text-2xs rounded-xs px-1.5 py-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
                  interval === option.value
                    ? "bg-surface text-foreground border-rule border font-semibold"
                    : "text-foreground-secondary hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Market Category Selector Strip */}
      <div
        role="tablist"
        aria-label="Market categories"
        className="border-rule bg-canvas flex overflow-x-auto border-b px-2 py-1.5 gap-1"
      >
        {PREVIEW_TABS.map((tab) => {
          const isCurrent = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={isCurrent}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "focus-visible:outline-ring text-2xs rounded-xs px-2.5 py-1 font-medium whitespace-nowrap transition-colors focus-visible:outline-2",
                isCurrent
                  ? "bg-surface text-foreground border-rule-strong border font-semibold shadow-2xs"
                  : "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,17.5rem)_minmax(0,1fr)]">
        {/* Watchlist */}
        <div className="border-rule lg:border-r">
          <div className="border-rule flex items-center justify-between border-b px-3 py-1.5">
            <p className="label">Watchlist ({previewInstruments.length})</p>
            <p className="label text-2xs">Last · 24h</p>
          </div>
          <ul>
            {previewInstruments.map((instrument) => {
              const quote = quotes.find((entry) => entry.symbol === instrument.symbol);
              const active = instrument.symbol === symbol;
              const assetMeta = findMarketAsset(instrument.symbol);
              const spark = market
                .getSeries(instrument.symbol, "1d", new Date())
                .candles.slice(-40);

              return (
                <li key={instrument.symbol} className="border-rule border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setSymbol(instrument.symbol)}
                    aria-pressed={active}
                    className={cn(
                      "focus-visible:outline-ring flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                      active
                        ? "bg-surface-inset border-l-bull border-l-2"
                        : "hover:bg-surface-sunken",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="numeric text-xs font-semibold text-foreground">
                          {instrument.symbol}
                        </span>
                        <span className="numeric text-2xs text-foreground-muted rounded bg-surface-sunken px-1 py-0.2">
                          {assetMeta?.displayCurrency ?? "MAD"}
                        </span>
                      </span>
                      <span className="text-2xs text-foreground-secondary block truncate">
                        {instrument.name}
                      </span>
                    </span>

                    <Sparkline
                      candles={spark}
                      width={56}
                      height={20}
                      tone="neutral"
                    />

                    <span className="flex shrink-0 flex-col items-end">
                      <Num cents={quote?.lastCents ?? 0} size="2xs" />
                      <Delta bps={quote?.changeBps ?? 0n} size="2xs" showGlyph={false} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Chart & Instrument Telemetry Pane */}
        <div className="min-w-0 flex flex-col justify-between">
          <div>
            <div className="border-rule border-b px-3.5 py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <p className="numeric text-base font-bold text-foreground">
                    {selected?.symbol ?? symbol}
                  </p>
                  <span className="text-foreground-secondary text-xs font-medium">
                    {selectedAssetMeta?.name ??
                      TRADEABLE.find((instrument) => instrument.symbol === symbol)?.name}
                  </span>
                </div>

                {selected ? (
                  <div className="flex items-baseline gap-2.5">
                    <Num cents={selected.lastCents} size="lg" />
                    <span className="numeric text-2xs text-foreground-secondary font-medium">
                      {selectedAssetMeta?.displayCurrency ?? "MAD"}
                    </span>
                    <Delta bps={selected.changeBps} size="sm" />
                  </div>
                ) : null}
              </div>

              {/* Sub-header metadata: Exchange, ISIN, Ratios, Bid/Ask/Spread */}
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-2xs text-foreground-secondary">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="border-rule bg-surface-sunken rounded border px-1.5 py-0.5 font-medium">
                    {selectedAssetMeta?.exchange ?? "Bourse de Casablanca"}
                  </span>
                  {selectedAssetMeta?.isin ? (
                    <span className="numeric border-rule bg-surface-sunken rounded border px-1.5 py-0.5">
                      {selectedAssetMeta.isin}
                    </span>
                  ) : null}
                  {selectedAssetMeta?.ratios?.per ? (
                    <span className="numeric border-rule bg-surface-sunken rounded border px-1.5 py-0.5">
                      PER {selectedAssetMeta.ratios.per.toFixed(1)}x
                    </span>
                  ) : null}
                  {selectedAssetMeta?.ratios?.dividendYield ? (
                    <span className="numeric border-rule bg-surface-sunken rounded border px-1.5 py-0.5">
                      Yield {selectedAssetMeta.ratios.dividendYield.toFixed(1)}%
                    </span>
                  ) : null}
                </div>

                <div className="numeric flex items-center gap-2 text-2xs">
                  <span>
                    Bid{" "}
                    <strong className="text-foreground font-medium">
                      {selected ? (selected.bidCents / 100).toFixed(2) : "—"}
                    </strong>
                  </span>
                  <span className="text-rule-strong">/</span>
                  <span>
                    Ask{" "}
                    <strong className="text-foreground font-medium">
                      {selected ? (selected.askCents / 100).toFixed(2) : "—"}
                    </strong>
                  </span>
                  <span className="text-rule-strong">·</span>
                  <span>Spread {spreadBps} bps</span>
                </div>
              </div>
            </div>

            {ready ? (
              <PriceChart
                symbol={symbol}
                candles={series}
                interval={interval}
                height={300}
                className="border-0"
                label={`${symbol} simulated ${interval} price chart. Current price ${(
                  (selected?.lastCents ?? 0) / 100
                ).toFixed(2)} ${selectedAssetMeta?.displayCurrency ?? "MAD"}.`}
              />
            ) : (
              <div className="bg-surface-inset h-[300px] w-full animate-pulse" aria-hidden="true" />
            )}
          </div>

          {/* Bottom telemetry bar inside chart pane */}
          <div className="border-rule bg-surface-sunken grid grid-cols-3 divide-x border-t text-2xs">
            <div className="px-3 py-2">
              <span className="text-foreground-muted block uppercase tracking-wider">24h Volume</span>
              <span className="numeric text-foreground mt-0.5 block font-medium">
                {selected ? selected.volume.toLocaleString("en-US") : "—"} units
              </span>
            </div>
            <div className="px-3 py-2">
              <span className="text-foreground-muted block uppercase tracking-wider">Model Vol / Drift</span>
              <span className="numeric text-foreground mt-0.5 block font-medium">
                {selectedAssetMeta
                  ? `σ ${(selectedAssetMeta.annualVolatility * 100).toFixed(0)}% · μ ${(selectedAssetMeta.annualDrift * 100).toFixed(1)}%`
                  : "—"}
              </span>
            </div>
            <div className="px-3 py-2">
              <span className="text-foreground-muted block uppercase tracking-wider">Settlement</span>
              <span className="numeric text-foreground mt-0.5 block font-medium">
                MAD · T+2 Ledger
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-rule bg-surface text-foreground-secondary text-2xs border-t px-3.5 py-2.5 leading-relaxed flex flex-wrap items-center justify-between gap-3">
        <p>
          110 real-world instruments across 8 markets · Deterministic GBM + Live API feed
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            href={simulatorUrl("market")}
            className="text-foreground-secondary hover:text-foreground font-medium transition-colors"
          >
            Full Market Board (110)
          </Link>
          <Link
            href={simulatorUrl(`market/${symbol.toLowerCase()}`)}
            className="text-bull hover:text-bull-hover font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Trade {symbol} in Simulator</span>
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

