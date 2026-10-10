import { describe, expect, it } from "vitest";
import { ASSETS, SECTORS, TICKER_PATTERN, assetsBySector, findAsset } from "./assets";
import { money } from "@fsjesc/config/money";

/**
 * The simulated instrument set (Part 5.6).
 *
 * These assertions guard the honesty requirements as much as the data: exactly
 * eight instruments, all MAD, no real company named, prices spread across the
 * intended range (N8).
 */

describe("instrument set", () => {
  it("contains exactly the eight specified tickers", () => {
    expect(ASSETS.map((asset) => asset.ticker)).toEqual([
      "MARI",
      "CASA",
      "ATLAS",
      "MAGHREB",
      "RIF",
      "SOUK",
      "OASIS",
      "ZENITH",
    ]);
  });

  it("has no duplicate tickers", () => {
    const tickers = new Set(ASSETS.map((asset) => asset.ticker));
    expect(tickers.size).toBe(ASSETS.length);
  });

  it("denominates every instrument in MAD", () => {
    for (const asset of ASSETS) {
      expect(asset.currency).toBe("MAD");
    }
  });

  it("covers six sectors, each with at least one instrument", () => {
    const grouped = assetsBySector();
    expect(grouped.size).toBe(SECTORS.length);
    for (const sector of SECTORS) {
      expect(grouped.get(sector)?.length ?? 0).toBeGreaterThan(0);
    }
  });

  it("spreads starting prices across roughly 20 to 500 MAD", () => {
    const prices = ASSETS.map((asset) => asset.startingPriceCents / 100);
    const lowest = Math.min(...prices);
    const highest = Math.max(...prices);

    expect(lowest).toBeGreaterThanOrEqual(20);
    expect(highest).toBeLessThanOrEqual(500);
    // A meaningful spread, so the number of shares a given budget buys genuinely
    // differs between a 24 MAD and a 480 MAD instrument.
    expect(highest / lowest).toBeGreaterThan(15);
  });

  it("stores starting prices as integer centimes, not floats", () => {
    for (const asset of ASSETS) {
      expect(Number.isInteger(asset.startingPriceCents)).toBe(true);
      expect(asset.startingPriceCents).toBeGreaterThan(0);
      // A usable position must be purchasable with the default starting capital.
      expect(money(asset.startingPriceCents).amountCents).toBe(BigInt(asset.startingPriceCents));
    }
  });

  it("gives every instrument a description that marks it as fictional", () => {
    for (const asset of ASSETS) {
      expect(asset.description.length).toBeGreaterThan(40);
      expect(asset.description.toLowerCase()).toMatch(/fictional|model exercises/);
    }
  });

  it("uses plausible model parameters", () => {
    for (const asset of ASSETS) {
      expect(asset.annualVolatility).toBeGreaterThan(0.05);
      expect(asset.annualVolatility).toBeLessThan(1);
      expect(asset.annualDrift).toBeGreaterThan(-0.5);
      expect(asset.annualDrift).toBeLessThan(0.5);
    }
  });

  it("varies volatility across instruments so sectors are distinguishable", () => {
    const volatilities = new Set(ASSETS.map((asset) => asset.annualVolatility));
    expect(volatilities.size).toBeGreaterThan(4);
  });
});

describe("ticker conventions", () => {
  it("uses uppercase letters only", () => {
    for (const asset of ASSETS) {
      expect(asset.ticker).toMatch(TICKER_PATTERN);
    }
  });
});

describe("lookup", () => {
  it("finds an asset by exact ticker", () => {
    expect(findAsset("MARI")?.name).toBe("Mariem Agri-Industry");
  });

  it("is case and whitespace insensitive", () => {
    expect(findAsset("  mari ")?.ticker).toBe("MARI");
  });

  it("returns undefined for an unknown ticker", () => {
    expect(findAsset("NONEXISTENT")).toBeUndefined();
    expect(findAsset("")).toBeUndefined();
  });
});

describe("sector grouping", () => {
  it("puts each instrument in its declared sector", () => {
    const grouped = assetsBySector();
    for (const [sector, members] of grouped) {
      for (const member of members) {
        expect(member.sector).toBe(sector);
      }
    }
  });

  it("assigns every instrument to exactly one group", () => {
    const total = [...assetsBySector().values()].reduce((sum, group) => sum + group.length, 0);
    expect(total).toBe(ASSETS.length);
  });
});
