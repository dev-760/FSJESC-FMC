"use client";

import Link from "next/link";
import { useMemo } from "react";

import { PriceChart } from "../charts/price-chart";
import { Sparkline } from "../charts/sparkline";
import { SessionIndicator } from "../financial/session-indicator";
import { Delta, Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";
import { market, TRADEABLE } from "@fsjesc/domain/market/engine";
import { INTERVALS, useTerminalView } from "@fsjesc/domain/market/store";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import { useMarketStream } from "./use-market-stream";

export function TerminalPreview({ className }: { className?: string }) {
  const { quotes } = useMarketStream();
  const ready = quotes.length > 0;
  const { symbol, interval, setSymbol, setInterval } = useTerminalView();

  const selected = quotes.find((quote) => quote.symbol === symbol) ?? quotes[0];

  const series = useMemo(
    () => market.getSeries(symbol, interval, new Date()).candles,
    // Recomputed when the reader changes symbol or interval. The candle set for a
    // given (symbol, interval) is fixed by the model, so there is nothing to poll.
    [symbol, interval],
  );

  return (
    <div className={cn("border-rule bg-surface border", className)}>
      {/* Terminal chrome. One row: identity, honesty marker, clock, interval. */}
      <div className="border-rule flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-3 py-2">
        <p className="label text-warning">Simulated data</p>
        <p className="label text-foreground-secondary">MAD · Fictional instruments</p>
        <SessionIndicator className="ml-auto" />

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
                  ? "bg-surface-inset text-foreground font-medium"
                  : "text-foreground-secondary hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        {/* Watchlist. Selectable, because a terminal whose rows cannot be selected is
            a picture of a terminal. */}
        <div className="border-rule lg:border-r">
          <p className="label border-rule border-b px-3 py-2">Watchlist</p>
          <ul>
            {TRADEABLE.map((instrument) => {
              const quote = quotes.find((entry) => entry.symbol === instrument.symbol);
              const active = instrument.symbol === symbol;
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
                      "focus-visible:outline-ring flex w-full items-center gap-3 px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
                      active ? "bg-surface-inset" : "hover:bg-surface-sunken",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="numeric block text-xs font-medium">{instrument.symbol}</span>
                      <span className="text-2xs text-foreground-secondary block truncate">
                        {instrument.name}
                      </span>
                    </span>

                    <Sparkline
                      candles={spark}
                      width={64}
                      height={22}
                      // Already stated numerically two cells over; the shape does not
                      // need a second opinion.
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

        {/* Chart pane. */}
        <div className="min-w-0">
          <div className="border-rule flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b px-3 py-2">
            <p className="text-sm font-semibold">
              {selected?.symbol ?? symbol}
              <span className="text-foreground-secondary ml-2 text-xs font-normal">
                {TRADEABLE.find((instrument) => instrument.symbol === symbol)?.name}
              </span>
            </p>
            {selected ? (
              <>
                <Num cents={selected.lastCents} size="lg" />
                <Delta bps={selected.changeBps} size="sm" />
              </>
            ) : null}
            <p className="label ml-auto">
              {selected ? `Bid ${(selected.bidCents / 100).toFixed(2)}` : ""}
              <span className="text-rule-strong mx-1.5">/</span>
              {selected ? `Ask ${(selected.askCents / 100).toFixed(2)}` : ""}
            </p>
          </div>

          {ready ? (
            <PriceChart
              symbol={symbol}
              candles={series}
              interval={interval}
              height={320}
              className="border-0"
              label={`${symbol} simulated ${interval} price chart. Current price ${(
                (selected?.lastCents ?? 0) / 100
              ).toFixed(2)} dirhams.`}
            />
          ) : (
            <div className="bg-surface-inset h-[320px] w-full animate-pulse" aria-hidden="true" />
          )}
        </div>
      </div>

      <div className="border-rule text-foreground-secondary text-2xs border-t px-3 py-2 leading-relaxed flex flex-wrap items-center justify-between gap-2">
        <p>
          Hash-seeded Geometric Brownian Motion. No real company or exchange represented.
        </p>
        <Link
          href={simulatorUrl(`market/${symbol.toLowerCase()}`)}
          className="text-bull hover:text-bull-hover font-medium flex items-center gap-1 transition-colors"
        >
          <span>Trade {symbol} in Simulator</span>
          <span aria-hidden="true">&rarr;</span>
        </Link>
      </div>
    </div>
  );
}
