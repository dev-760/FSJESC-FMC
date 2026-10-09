/**
 * The simulated price model (Part 5.1).
 *
 * Geometric Brownian Motion on a one-minute grid, which for a discrete grid is
 *
 * ```text
 *   S(t) = S(0) · exp( (μ − σ²/2)·t + σ·√t·Z(t) )
 * ```
 *
 * with `t` in years, `μ` the instrument's modelled drift, `σ` its modelled
 * volatility, and `Z(t) = Σ z(j)` a sum of standard normal deviates — one per
 * minute — each derived from `(seed, symbol, minute)`.
 *
 * Three properties this buys, and the reason for the design:
 *   1. **Deterministic.** The same `(seed, symbol, minute)` gives the same price on
 *      every machine, so a classroom can compare notes and both be right.
 *   2. **Reproducible.** Historical candles are generated on demand. Nothing is
 *      persisted, so there is no data to go stale and no backfill job.
 *   3. **Explicable.** A price can be recomputed from this file by hand, which is
 *      what makes it teachable rather than a black box.
 *
 * It is not a model of any real market, and the platform says so everywhere the
 * numbers appear (N8).
 *
 * ## Why the prefix cache
 *
 * `Z(t)` is a running sum, so the naive implementation is O(t) *per call* — and t
 * is about 29 million minutes for a two-year history. Summing per call turns a
 * chart request into minutes of CPU.
 *
 * The fix exploits `Z(t) = Z(day start) + Σ` (the rest of that day). `Z` at each day
 * boundary is cached in a `Float64Array` that grows on demand, so a call costs at
 * most one day of increments plus one array lookup. The result is identical to the
 * naive sum and O(1) amortised.
 */
import { ASSETS, type Sector } from "@/data/assets";
import { normal, uniform } from "./random";
import { easternLabel, nextTransition, sessionState, type SessionState } from "./clock";
import type {
  AssetClass,
  Candle,
  Instrument,
  Interval,
  MarketClock,
  MarketDataProvider,
  Quote,
  Series,
} from "./provider";

const MINUTE = 60;
const HOUR = 3_600;
const DAY = 86_400;

/** One-minute steps per year, for converting an annualised parameter to a per-minute one. */
const MINUTES_PER_YEAR = 252 * (24 * 60);
const MINUTES_PER_DAY = 24 * 60;

/** How many bars a request returns at each interval. */
const BAR_LIMIT: Record<Interval, number> = {
  "1m": 390,
  "5m": 288,
  "1h": 420,
  "1d": 365,
};

const STEP_SECONDS: Record<Interval, number> = {
  "1m": MINUTE,
  "5m": 5 * MINUTE,
  "1h": HOUR,
  "1d": DAY,
};

const SECTOR_TO_CLASS: Record<Sector, AssetClass> = {
  BANKING: "EQUITY",
  REAL_ESTATE: "EQUITY",
  ENERGY: "EQUITY",
  RETAIL: "EQUITY",
  TELECOM: "EQUITY",
  INDUSTRY: "EQUITY",
};

/**
 * The eight tradeable instruments, lifted from the canonical asset list.
 *
 * `src/data/assets.ts` stays the single source of truth for the universe (N4); this
 * module only restates it in the shape the chart layer consumes.
 *
 * Volume is generated rather than derived from the price path, and it carries **no**
 * information about conviction. Teaching "volume confirms the move" on synthetic data
 * would teach a habit that does not survive contact with a real order book.
 */
export const TRADEABLE: readonly Instrument[] = ASSETS.map((asset) => ({
  symbol: asset.ticker,
  name: asset.name,
  sector: asset.sector,
  assetClass: SECTOR_TO_CLASS[asset.sector],
  currency: asset.currency,
  startingPriceCents: asset.startingPriceCents,
  annualDrift: asset.annualDrift,
  annualVolatility: asset.annualVolatility,
  averageDailyVolume: 40_000 + (asset.startingPriceCents % 37) * 1_000,
}));

/**
 * Context instruments: quoted, not tradeable.
 *
 * The composite index is the denominator for a relative-value exercise; the dirham
 * rate is the unit in which a foreign comparison is expressed. Both exist so a
 * lesson has something to compare against, and neither can be bought.
 */
const CONTEXT: readonly Instrument[] = [
  {
    symbol: "FSJESC-IDX",
    name: "FSJESC Composite Index",
    sector: "COMPOSITE",
    assetClass: "INDEX",
    currency: "MAD",
    startingPriceCents: 412_550,
    annualDrift: 0.055,
    annualVolatility: 0.135,
    averageDailyVolume: 0,
  },
  {
    symbol: "MADUSD",
    name: "Dirham per US dollar",
    sector: "FX",
    assetClass: "FX",
    currency: "MAD",
    startingPriceCents: 9_475,
    annualDrift: 0.005,
    annualVolatility: 0.038,
    averageDailyVolume: 0,
  },
];

export const INSTRUMENTS: readonly Instrument[] = [...TRADEABLE, ...CONTEXT];

export const DEFAULT_SEED = "fsjesc-fmc-v1";

/**
 * A dated perturbation of the model.
 *
 * A scenario is an overlay on `(μ, σ)` applied only between `from` and `to`, so a
 * lesson can ask "what would a crisis month have done to this position?" without
 * rewriting the history that came before the window.
 */
export interface ScenarioOverlay {
  name: string;
  volatilityMultiplier: number;
  /** Additive drift, in annualised fractions. */
  driftAdjustment: number;
  /** Inclusive start, exclusive end, in Unix seconds. */
  from: number;
  to: number;
}

/**
 * Cached sums of standard normal deviates at day boundaries.
 *
 * Keyed by `(seed, symbol)` because `Z` depends only on those — not on `μ` or `σ`,
 * which scale the sum rather than shape it. A scenario therefore reuses the base
 * market's cache instead of rebuilding it.
 */
const zCaches = new Map<string, Float64Array>();

function zSum(seed: string, symbol: string, minute: number): number {
  const key = `${seed} ${symbol}`;
  let cache = zCaches.get(key);
  if (!cache) {
    // Index 0 is the empty prefix, so cache[day] is the sum of every minute before
    // that day's first. Grown on demand, so memory tracks the years actually asked for.
    cache = new Float64Array(1024);
    zCaches.set(key, cache);
  }

  const day = Math.floor(minute / MINUTES_PER_DAY);

  // Grow until the cache covers `day`, filling the new tail from the last entry.
  // The grown array must also become the local reference: reading through the stale
  // one yields `undefined` past its end, and `undefined` silently becomes NaN.
  if (day >= cache.length) {
    let size = cache.length;
    while (size <= day) size *= 2;
    const grown = new Float64Array(size);
    grown.set(cache);
    for (let index = cache.length; index < size; index += 1) {
      grown[index] =
        (grown[index - 1] ?? 0) + normal(seed, symbol, String((index - 1) * MINUTES_PER_DAY));
    }
    zCaches.set(key, grown);
    cache = grown;
  }

  // At most one day of increments on top of an O(1) lookup.
  let sum = cache[day] ?? 0;
  for (let index = day * MINUTES_PER_DAY; index < minute; index += 1) {
    sum += normal(seed, symbol, String(index));
  }
  return sum;
}

export class SimulatedMarket implements MarketDataProvider {
  readonly id = "simulated-gbm";

  constructor(
    private readonly seed: string = DEFAULT_SEED,
    private readonly overlays: readonly ScenarioOverlay[] = [],
  ) {}

  listInstruments(): readonly Instrument[] {
    return INSTRUMENTS;
  }

  listTradeable(): readonly Instrument[] {
    return TRADEABLE;
  }

  getInstrument(symbol: string): Instrument | undefined {
    const key = symbol.trim().toUpperCase();
    return INSTRUMENTS.find((instrument) => instrument.symbol === key);
  }

  isTradeable(symbol: string): boolean {
    return TRADEABLE.some((instrument) => instrument.symbol === symbol.trim().toUpperCase());
  }

  /**
   * The cumulative log return at a minute index.
   *
   * Base model first, then each overlay's contribution over the elapsed part of its
   * window. Additive in both, so an overlay cannot change the path before its window
   * begins — which is what makes a "what if" question answerable without disturbing
   * the record.
   */
  private logReturnAt(instrument: Instrument, minute: number): number {
    const dt = 1 / MINUTES_PER_YEAR;
    const elapsedYears = minute / MINUTES_PER_YEAR;
    const sigma = instrument.annualVolatility;
    const mu = instrument.annualDrift;

    let logReturn =
      (mu - (sigma * sigma) / 2) * elapsedYears +
      sigma * Math.sqrt(dt) * zSum(this.seed, instrument.symbol, minute);

    const endSeconds = minute * MINUTE;
    for (const overlay of this.overlays) {
      if (endSeconds <= overlay.from) continue;
      const fromMinute = Math.max(0, Math.ceil(overlay.from / MINUTE));
      const toMinute = Math.min(minute, Math.floor(overlay.to / MINUTE));
      for (let index = fromMinute; index < toMinute; index += 1) {
        const z = normal(this.seed, instrument.symbol, String(index));
        logReturn +=
          sigma * (overlay.volatilityMultiplier - 1) * Math.sqrt(dt) * z +
          overlay.driftAdjustment * dt;
      }
    }

    return logReturn;
  }

  /** Price in centimes at an arbitrary instant. The primitive everything else uses. */
  priceAt(symbol: string, at: Date): number {
    const instrument = this.getInstrument(symbol);
    if (!instrument) throw new Error(`Unknown instrument: ${symbol}`);
    const minute = Math.floor(at.getTime() / 1000 / MINUTE);
    return this.priceFromLog(instrument, this.logReturnAt(instrument, minute));
  }

  private priceFromLog(instrument: Instrument, logReturn: number): number {
    const price = instrument.startingPriceCents * Math.exp(logReturn);
    // Clamp to a whole centime and keep it positive: centimes are integers (N1).
    return Math.max(1, Math.round(price));
  }

  /** The instants at which bars open, for an interval, ending at `until`. */
  barTimes(interval: Interval, until: Date): number[] {
    const step = STEP_SECONDS[interval];
    const end = Math.floor(until.getTime() / 1000 / step) * step;
    const limit = BAR_LIMIT[interval];
    const times: number[] = [];
    for (let index = limit - 1; index >= 0; index -= 1) times.push(end - index * step);
    return times;
  }

  /**
   * OHLCV for a symbol.
   *
   * Internally consistent by construction, which is the property a chart depends on
   * and the one synthetic series usually get wrong:
   *
   *   - a bar's open **is** the previous bar's close, so no gap ever appears
   *   - high and low come from four deterministic probes placed along the bar, so
   *     both are reachable by a real path rather than sampled independently
   *   - `high >= max(open, close)` and `low <= min(open, close)` always hold
   */
  getSeries(symbol: string, interval: Interval, until: Date): Series {
    const instrument = this.getInstrument(symbol);
    if (!instrument) throw new Error(`Unknown instrument: ${symbol}`);

    const step = STEP_SECONDS[interval];
    const times = this.barTimes(interval, until);
    const candles: Candle[] = [];

    // The first bar opens where the model actually is at that time — not at the
    // starting price, which would draw a spurious gap across the whole history.
    let previousClose = this.priceFromLog(
      instrument,
      this.logReturnAt(instrument, Math.floor((times[0] ?? 0) / MINUTE)),
    );

    for (const time of times) {
      const openCents = previousClose;
      const lastMinute = Math.floor((time + step - 1) / MINUTE);
      const closeCents = this.priceFromLog(instrument, this.logReturnAt(instrument, lastMinute));

      let highCents = Math.max(openCents, closeCents);
      let lowCents = Math.min(openCents, closeCents);
      for (let probe = 1; probe <= 3; probe += 1) {
        const jitter = uniform(this.seed, instrument.symbol, "bar", String(time), `p${probe}`);
        // Anchored along the bar rather than at the open, so a bar with no net move
        // still has a plausible range.
        const anchor = openCents + (closeCents - openCents) * (probe / 4);
        const span = Math.max(
          1,
          Math.round(instrument.startingPriceCents * instrument.annualVolatility * 0.0006),
        );
        const candidate = Math.round(anchor + (jitter - 0.5) * 2 * span);
        highCents = Math.max(highCents, candidate);
        lowCents = Math.min(lowCents, candidate);
      }

      candles.push({
        time,
        openCents,
        highCents: Math.max(highCents, openCents, closeCents),
        lowCents: Math.max(1, Math.min(lowCents, openCents, closeCents)),
        closeCents,
        volume: this.volumeFor(instrument, time, interval),
      });

      previousClose = closeCents;
    }

    return { symbol: instrument.symbol, interval, candles };
  }

  /** Volume per bar, from a deterministic daily factor rather than the price path. */
  private volumeFor(instrument: Instrument, time: number, interval: Interval): number {
    if (instrument.averageDailyVolume === 0) return 0;
    const day = Math.floor(time / DAY);
    const factor = 0.55 + uniform(this.seed, instrument.symbol, "vol", String(day)) * 0.9;
    const share = STEP_SECONDS[interval] / DAY;
    const raw = instrument.averageDailyVolume * share * factor;
    // Sub-daily bars are small enough that rounding to a lot would zero them out.
    return interval === "1d" ? Math.round(raw / 100) * 100 : Math.round(raw);
  }

  /**
   * A quote at an instant.
   *
   * The spread widens with volatility — a thin book is expensive — and is floored at
   * one centime, the smallest realisable unit (N1).
   */
  getQuote(symbol: string, at: Date): Quote {
    const instrument = this.getInstrument(symbol);
    if (!instrument) throw new Error(`Unknown instrument: ${symbol}`);

    const lastCents = this.priceAt(symbol, at);
    const previousCents = this.priceAt(symbol, new Date(at.getTime() - DAY * 1000));
    const changeCents = lastCents - previousCents;
    const halfSpread = Math.max(1, Math.round(lastCents * instrument.annualVolatility * 0.0125));

    return {
      symbol: instrument.symbol,
      lastCents,
      bidCents: Math.max(1, lastCents - halfSpread),
      askCents: lastCents + halfSpread,
      changeBps: previousCents === 0 ? 0n : (BigInt(changeCents) * 10_000n) / BigInt(previousCents),
      changeCents: BigInt(changeCents),
      volume: this.volumeFor(instrument, Math.floor(at.getTime() / 1000), "1d"),
      asOf: Math.floor(at.getTime() / 1000),
    };
  }

  getQuotes(at: Date): Quote[] {
    return INSTRUMENTS.map((instrument) => this.getQuote(instrument.symbol, at));
  }

  /** The five-instrument excerpt the landing page's terminal preview shows. */
  watchlistPreview(at: Date): Quote[] {
    return TRADEABLE.slice(0, 5).map((instrument) => this.getQuote(instrument.symbol, at));
  }

  /**
   * The real-world US session state, as a display.
   *
   * Derived from the wall clock rather than the price model, because the simulated
   * market never closes. Pretending otherwise would teach a student that a
   * Casablanca afternoon is a dead market.
   */
  marketClock(at: Date): MarketClock {
    const state: SessionState = sessionState(at);
    const transition = nextTransition(at);
    return {
      state,
      label: easternLabel(at),
      nextChange: transition
        ? {
            state: transition.state,
            at: transition.label,
            inMinutes: Math.round((transition.at.getTime() - at.getTime()) / 60_000),
          }
        : null,
    };
  }
}

/**
 * The default market instance.
 *
 * A module-level singleton because the model is pure: two callers asking for the same
 * `(seed, symbol, minute)` get the same price, and the prefix cache is shared. A real
 * provider would be injected here and nowhere else.
 */
export const market = new SimulatedMarket();

export { CONTEXT };
export type { Candle, Instrument, Interval, MarketClock, Quote, Series, AssetClass };
