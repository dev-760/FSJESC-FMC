import { describe, expect, it } from "vitest";

import { DEFAULT_SEED, INSTRUMENTS, SimulatedMarket, TRADEABLE } from "@fsjesc/domain/market/engine";
import { hash32, normal, uniform, uniformInt } from "@fsjesc/domain/market/random";
import type { Instrument, Interval } from "@fsjesc/domain/market/provider";

const AT = new Date("2026-03-16T14:30:00Z");

/**
 * The first tradeable instrument, asserted rather than indexed.
 *
 * `noUncheckedIndexedAccess` makes `TRADEABLE[0]` a `T | undefined`, and a
 * non-null assertion would hide exactly the case this helper is here to make loud:
 * an empty instrument universe would otherwise fail somewhere less obvious.
 */
function firstTradeable(): Instrument {
  const instrument = TRADEABLE[0];
  if (!instrument) throw new Error("expected at least one tradeable instrument");
  return instrument;
}

describe("hash32", () => {
  it("is stable for the same input", () => {
    expect(hash32("a", "b")).toBe(hash32("a", "b"));
  });

  it("differs when a separator would otherwise collide", () => {
    // "ab" + "c" and "a" + "bc" hash identically without the separator byte, which
    // would let two different minute keys share one price.
    expect(hash32("ab", "c")).not.toBe(hash32("a", "bc"));
  });

  it("returns an unsigned 32-bit integer", () => {
    for (const input of ["", "MARI", DEFAULT_SEED, "0", "é"]) {
      const value = hash32(input);
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(0xffffffff);
    }
  });
});

describe("uniform", () => {
  it("stays within [0, 1)", () => {
    for (let index = 0; index < 500; index += 1) {
      const value = uniform("seed", String(index));
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it("is reproducible", () => {
    expect(uniform("seed", "7")).toBe(uniform("seed", "7"));
  });

  it("is roughly uniform across ten buckets", () => {
    const buckets = new Map<number, number>();
    for (let index = 0; index < 10_000; index += 1) {
      const bucket = Math.floor(uniform("spread", String(index)) * 10);
      buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);
    }
    // 1,000 expected per bucket; the band is wide so the test is not flaky.
    expect(buckets.size).toBe(10);
    for (const count of buckets.values()) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1_200);
    }
  });
});

describe("normal", () => {
  it("has a mean near zero and a standard deviation near one", () => {
    const samples: number[] = [];
    for (let index = 0; index < 20_000; index += 1) samples.push(normal("z", String(index)));

    const mean = samples.reduce((sum, value) => sum + value, 0) / samples.length;
    const variance = samples.reduce((sum, value) => sum + (value - mean) ** 2, 0) / samples.length;

    expect(Math.abs(mean)).toBeLessThan(0.05);
    expect(Math.sqrt(variance)).toBeGreaterThan(0.9);
    expect(Math.sqrt(variance)).toBeLessThan(1.1);
  });

  it("survives the degenerate input that would produce an infinite deviate", () => {
    // Box-Muller takes log(u1); a u1 of 0 would be −Infinity. `uniform` is clamped
    // above zero for exactly this reason, and this test is what says so.
    for (let index = 0; index < 1_000; index += 1) {
      expect(Number.isFinite(normal("z", String(index)))).toBe(true);
    }
  });
});

describe("uniformInt", () => {
  it("stays within its inclusive bounds", () => {
    for (let index = 0; index < 500; index += 1) {
      const value = uniformInt(3, 7, "int", String(index));
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });

  it("returns the only value when the range is a single point", () => {
    expect(uniformInt(5, 5, "x")).toBe(5);
  });

  it("rejects an inverted range rather than returning nonsense", () => {
    expect(() => uniformInt(7, 3, "x")).toThrow(RangeError);
  });
});

describe("SimulatedMarket price model", () => {
  const market = new SimulatedMarket();

  it("returns identical prices for identical inputs", () => {
    for (const instrument of TRADEABLE.slice(0, 3)) {
      expect(market.priceAt(instrument.symbol, AT)).toBe(market.priceAt(instrument.symbol, AT));
    }
  });

  it("returns a different price for a different seed", () => {
    const other = new SimulatedMarket("fsjesc-fmc-v2");
    const symbol = firstTradeable().symbol;
    expect(other.priceAt(symbol, AT)).not.toBe(market.priceAt(symbol, AT));
  });

  it("advances with time", () => {
    const symbol = firstTradeable().symbol;
    const later = new Date(AT.getTime() + 3_600_000);
    expect(market.priceAt(symbol, later)).not.toBe(market.priceAt(symbol, AT));
  });

  it("always returns positive integer centimes", () => {
    for (const instrument of INSTRUMENTS) {
      const price = market.priceAt(instrument.symbol, AT);
      expect(Number.isInteger(price)).toBe(true);
      expect(price).toBeGreaterThan(0);
    }
  });

  it("agrees with itself across two instances of the same seed", () => {
    // The day-boundary prefix cache is module-level, so this also asserts that two
    // instances of the same seed read the same cache without interfering.
    const second = new SimulatedMarket(DEFAULT_SEED);
    for (const instrument of TRADEABLE.slice(0, 4)) {
      expect(second.priceAt(instrument.symbol, AT)).toBe(market.priceAt(instrument.symbol, AT));
    }
  });

  it("rejects an unknown symbol rather than inventing a price", () => {
    expect(() => market.priceAt("NOSUCH", AT)).toThrow(/Unknown instrument/);
  });

  it("keeps a year of drift within a plausible band", () => {
    const symbol = firstTradeable().symbol;
    const start = market.priceAt(symbol, new Date("2026-01-01T00:00:00Z"));
    const end = market.priceAt(symbol, new Date("2027-01-01T00:00:00Z"));
    const ratio = end / start;
    // A 6% drift at 22% volatility should land near 1.06, not near 0 or 5.
    expect(ratio).toBeGreaterThan(0.4);
    expect(ratio).toBeLessThan(3);
  });
});

describe("SimulatedMarket series", () => {
  const market = new SimulatedMarket();
  const intervals: Interval[] = ["1m", "5m", "1h", "1d"];

  for (const interval of intervals) {
    it(`builds an ascending, internally consistent ${interval} series`, () => {
      const symbol = firstTradeable().symbol;
      const series = market.getSeries(symbol, interval, AT);

      expect(series.candles.length).toBeGreaterThan(0);

      let previous: { time: number; closeCents: number } | null = null;

      for (const candle of series.candles) {
        expect(Number.isInteger(candle.openCents)).toBe(true);
        expect(Number.isInteger(candle.closeCents)).toBe(true);

        // OHLC ordering is the invariant a chart trusts. Violating it produces a
        // candle no price path could have generated.
        expect(candle.highCents).toBeGreaterThanOrEqual(candle.lowCents);
        expect(candle.highCents).toBeGreaterThanOrEqual(candle.openCents);
        expect(candle.highCents).toBeGreaterThanOrEqual(candle.closeCents);
        expect(candle.lowCents).toBeLessThanOrEqual(candle.openCents);
        expect(candle.lowCents).toBeLessThanOrEqual(candle.closeCents);
        expect(candle.lowCents).toBeGreaterThan(0);
        expect(candle.volume).toBeGreaterThanOrEqual(0);

        if (previous) {
          expect(candle.time).toBeGreaterThan(previous.time);
          // Continuity: a gap between the previous close and this open would read as
          // a real event that never happened.
          expect(candle.openCents).toBe(previous.closeCents);
        }

        previous = candle;
      }
    });
  }

  it("ends the last bar at or before the requested instant", () => {
    const series = market.getSeries(firstTradeable().symbol, "1h", AT);
    const last = series.candles.at(-1);
    expect(last).toBeDefined();
    expect((last?.time ?? 0) * 1000).toBeLessThanOrEqual(AT.getTime());
  });

  it("bars on the interval grid", () => {
    const step = 3_600;
    for (const candle of market.getSeries(firstTradeable().symbol, "1h", AT).candles) {
      expect(candle.time % step).toBe(0);
    }
  });

  it("reports zero volume for instruments that are not tradeable", () => {
    const series = market.getSeries("FSJESC-IDX", "1d", AT);
    expect(series.candles.length).toBeGreaterThan(0);
    for (const candle of series.candles) expect(candle.volume).toBe(0);
  }, 10000);

  it("reports non-zero volume on sub-daily tradeable bars", () => {
    // Rounding daily volume to a lot would zero out every intraday bar, which would
    // make a volume pane silently empty.
    const series = market.getSeries(firstTradeable().symbol, "1h", AT);
    expect(series.candles.some((candle) => candle.volume > 0)).toBe(true);
  });
});

describe("SimulatedMarket quotes", () => {
  const market = new SimulatedMarket();

  it("quotes a bid at or below the last and an ask at or above it", () => {
    for (const instrument of TRADEABLE) {
      const quote = market.getQuote(instrument.symbol, AT);
      expect(quote.bidCents).toBeLessThanOrEqual(quote.askCents);
      expect(quote.bidCents).toBeLessThanOrEqual(quote.lastCents);
      expect(quote.askCents).toBeGreaterThanOrEqual(quote.lastCents);
    }
  });

  it("keeps the spread at least one centime wide", () => {
    for (const instrument of INSTRUMENTS) {
      const quote = market.getQuote(instrument.symbol, AT);
      expect(quote.askCents - quote.bidCents).toBeGreaterThanOrEqual(1);
    }
  });

  it("reports the 24-hour change in cents and basis points", () => {
    const instrument = firstTradeable();
    const quote = market.getQuote(instrument.symbol, AT);
    const dayAgo = market.priceAt(instrument.symbol, new Date(AT.getTime() - 86_400_000));
    expect(quote.changeCents).toBe(BigInt(quote.lastCents - dayAgo));
    expect(typeof quote.changeBps).toBe("bigint");
  });

  it("quotes every instrument", () => {
    expect(market.getQuotes(AT)).toHaveLength(INSTRUMENTS.length);
  });

  it("previews a five-instrument watchlist drawn only from the tradeable set", () => {
    const preview = market.watchlistPreview(AT);
    expect(preview).toHaveLength(5);
    const tradeableSymbols = new Set(TRADEABLE.map((instrument) => instrument.symbol));
    for (const quote of preview) expect(tradeableSymbols.has(quote.symbol)).toBe(true);
  });
});

describe("market clock", () => {
  const market = new SimulatedMarket();

  it("reports a session state and a labelled next transition", () => {
    const clock = market.marketClock(AT);
    expect(["PRE", "OPEN", "POST", "CLOSED"]).toContain(clock.state);
    expect(clock.label).toMatch(/^\d{2}:\d{2}$/);
    expect(clock.nextChange).not.toBeNull();
    expect(clock.nextChange?.inMinutes).toBeGreaterThan(0);
  });

  it("is closed at the weekend and open during the US cash session", () => {
    // Monday 2026-03-16, 10:00 ET = 14:00 UTC (EDT).
    expect(market.marketClock(new Date("2026-03-16T14:00:00Z")).state).toBe("OPEN");
    // Sunday 2026-03-15.
    expect(market.marketClock(new Date("2026-03-15T14:00:00Z")).state).toBe("CLOSED");
  });
});

describe("scenario overlays", () => {
  const base = new SimulatedMarket(DEFAULT_SEED);
  const from = Math.floor(new Date("2026-03-01T00:00:00Z").getTime() / 1000);
  const to = Math.floor(new Date("2026-04-01T00:00:00Z").getTime() / 1000);
  const stressed = new SimulatedMarket(DEFAULT_SEED, [
    {
      name: "March stress",
      volatilityMultiplier: 3,
      driftAdjustment: -0.2,
      from,
      to,
    },
  ]);

  it("changes the path inside the window", () => {
    const symbol = firstTradeable().symbol;
    const inside = new Date("2026-03-16T00:00:00Z");
    expect(stressed.priceAt(symbol, inside)).not.toBe(base.priceAt(symbol, inside));
  });

  it("leaves the path before the window untouched", () => {
    const symbol = firstTradeable().symbol;
    const before = new Date("2026-02-16T00:00:00Z");
    expect(stressed.priceAt(symbol, before)).toBe(base.priceAt(symbol, before));
  });

  it("keeps prices positive under a volatility shock", () => {
    const inside = new Date("2026-03-16T00:00:00Z");
    for (const instrument of INSTRUMENTS) {
      expect(stressed.priceAt(instrument.symbol, inside)).toBeGreaterThan(0);
    }
  });
});
