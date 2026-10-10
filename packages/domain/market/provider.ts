/**
 * Market data types and the provider interface.
 *
 * Pure TypeScript: no React, no Next.js, no ORM, no filesystem (N10). The
 * interface exists so a real provider can be substituted for the simulated engine
 * without touching a single component.
 */

export type Interval = "1m" | "5m" | "1h" | "1d";

export type AssetClass = "EQUITY" | "INDEX" | "FX" | "COMMODITY" | "RATE";

export interface Instrument {
  /** Display symbol, e.g. `MARI`. */
  symbol: string;
  name: string;
  sector: string;
  assetClass: AssetClass;
  currency: "MAD";
  /** Opening price in centimes. */
  startingPriceCents: number;
  /** Annualised drift, as a fraction. Model parameter, not an observation. */
  annualDrift: number;
  /** Annualised volatility, as a fraction. Model parameter. */
  annualVolatility: number;
  /** Notional traded per simulated day, in units. Used for a plausible volume. */
  averageDailyVolume: number;
}

export interface Candle {
  /** Unix seconds at the bar's open. */
  time: number;
  openCents: number;
  highCents: number;
  lowCents: number;
  closeCents: number;
  volume: number;
}

export interface Quote {
  symbol: string;
  /** Last traded price in centimes. */
  lastCents: number;
  bidCents: number;
  askCents: number;
  /** Change over the last 24 hours, in basis points. */
  changeBps: bigint;
  /** Absolute 24-hour change in centimes. */
  changeCents: bigint;
  volume: number;
  /** Unix seconds of the tick that produced this quote. */
  asOf: number;
}

export interface Series {
  symbol: string;
  interval: Interval;
  candles: Candle[];
}

/**
 * Market sessions in ET, used for the OPEN/CLOSED indicator.
 *
 * The simulated market runs continuously (Part 5.3, DECISIONS.md) — the clock is a
 * *display* of the real-world session state, not a gate on orders. A student in
 * Casablanca needs the indicator to answer "is New York open?", and nothing more.
 */
export type SessionState = "PRE" | "OPEN" | "POST" | "CLOSED";

export interface MarketClock {
  state: SessionState;
  /** `HH:MM` in ET. */
  label: string;
  /** The next transition. `null` only if a date change interrupts the calculation. */
  nextChange: { state: SessionState; at: string; inMinutes: number } | null;
}

/**
 * The seam a real provider plugs into.
 *
 * Everything synchronous-return is deliberate: the current implementation is a
 * pure function of `(seed, symbol, time)`, so there is no async anywhere in the
 * read path and no loading state to design around. A network provider would
 * change these to promises, and that change is contained to this interface.
 */
export interface MarketDataProvider {
  readonly id: string;
  listInstruments(): readonly Instrument[];
  getInstrument(symbol: string): Instrument | undefined;
  /** OHLCV history, ascending by time. */
  getSeries(symbol: string, interval: Interval, until: Date): Series;
  getQuote(symbol: string, at: Date): Quote;
  getQuotes(at: Date): Quote[];
  marketClock(at: Date): MarketClock;
}
