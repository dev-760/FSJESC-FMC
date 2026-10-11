"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";

import { market } from "@fsjesc/domain/market/engine";
import type { Quote } from "@fsjesc/domain/market/provider";
import { Delta, Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";
import { simulatorUrl } from "@fsjesc/config/app-urls";

/**
 * The 32px ticker strip.
 *
 * Three decisions worth stating:
 *
 * 1. **It ticks in the browser.** The price model is pure TypeScript, so it runs
 *    client-side with no network call and no server render. That keeps the layout
 *    static under Cache Components while the strip still looks live. It is a display
 *    of simulated prices and is labelled as such; order flow stays server-authoritative.
 *
 * 2. **It never hydrates against a different clock.** The first client render
 *    returns the empty snapshot, so React has nothing to mismatch. Prices appear
 *    immediately after. A ticker that threw a hydration error would be a poor
 *    advertisement for attention to detail.
 *
 * 3. **It is decorative duplication, so it is hidden from assistive technology.**
 *    The same quotes appear in the quote table below it, where they carry meaning.
 *    Announcing five moving numbers every three seconds would make the page
 *    unusable with a screen reader.
 */

const TICK_MS = 3_000;

const TICKER_STRIP_SYMBOLS = [
  "ATW",
  "IAM",
  "BCP",
  "LHM",
  "TQM",
  "AAPL",
  "NVDA",
  "SPY",
  "BTC",
  "GC",
  "USDMAD",
] as const;

function stripQuotes(at: Date): Quote[] {
  return TICKER_STRIP_SYMBOLS.map((sym) => market.getQuote(sym, at));
}

interface TickerState {
  quotes: readonly Quote[];
  /** Changes every tick, so consumers can key an animation off it. */
  tick: number;
}

const EMPTY: TickerState = { quotes: [], tick: 0 };

let state: TickerState =
  typeof window !== "undefined"
    ? { quotes: stripQuotes(new Date()), tick: 0 }
    : EMPTY;
let timer: ReturnType<typeof setInterval> | undefined;

function ensureStarted(): void {
  if (timer !== undefined) return;
  const update = (): void => {
    state = { quotes: stripQuotes(new Date()), tick: state.tick + 1 };
    for (const listener of listeners) listener();
  };
  // Prime once so the strip has content on first paint after hydration.
  update();
  timer = setInterval(update, TICK_MS);
}

const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  ensureStarted();
  listeners.add(listener);
  if (state.quotes.length > 0) {
    queueMicrotask(listener);
  }
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): TickerState {
  return state;
}

function getServerSnapshot(): TickerState {
  return EMPTY;
}

export function MarketTicker({ className }: { className?: string }) {
  const { quotes } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className={cn(
        "border-rule bg-surface-sunken flex h-8 items-center overflow-hidden border-y",
        className,
      )}
    >
      <div className="shrink-0">
        <p className="label text-2xs text-warning-text px-4 sm:px-6 lg:px-8">Simulated data</p>
      </div>

      {/*
        `aria-hidden` with a single explanatory link kept in the header's own
        landmark: the strip is motion, and motion is not content.
      */}
      <div aria-hidden="true" className="min-w-0 flex-1 overflow-x-auto">
        {quotes.length === 0 ? (
          // Same height, same rhythm as the real items, so nothing shifts when the
          // first snapshot arrives.
          <div className="flex h-8 items-center gap-6 px-4">
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} className="bg-surface-inset h-3 w-24 animate-pulse" />
            ))}
          </div>
        ) : (
          <ul className="flex h-8 items-center gap-4 sm:gap-6 px-4 whitespace-nowrap">
            {quotes.map((quote) => (
              <li key={quote.symbol}>
                <Link
                  href={simulatorUrl(`market/${quote.symbol.toLowerCase()}`)}
                  className="text-2xs flex items-center gap-1.5 sm:gap-2 rounded px-1.5 py-0.5 transition-colors hover:bg-surface-inset group focus-visible:outline-2 focus-visible:outline-ring"
                  title={`View ${quote.symbol} chart and order book`}
                >
                  <span className="numeric text-foreground-secondary group-hover:text-bull font-medium transition-colors">
                    {quote.symbol}
                  </span>
                  <Num cents={quote.lastCents} size="2xs" tone="neutral" />
                  <Delta bps={quote.changeBps} size="2xs" showGlyph={false} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
