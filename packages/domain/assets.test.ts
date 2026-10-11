import { describe, expect, it } from "vitest";
import {
  ALL_MARKET_ASSETS,
  ASSETS,
  CSE_REAL_ASSETS,
  SECTORS,
  TICKER_PATTERN,
  assetsBySector,
  findAsset,
} from "./assets";
import { money } from "@fsjesc/config/money";

/**
 * The core Bourse de Casablanca instrument set (Part 5.6) & extended multi-market catalog.
 */

describe("instrument set", () => {
  it("contains exactly the eight core Bourse de Casablanca tickers", () => {
    expect(ASSETS.map((asset) => asset.ticker)).toEqual([
      "ATW",
      "IAM",
      "BCP",
      "CSR",
      "MSA",
      "SNP",
      "MUT",
      "ADH",
    ]);
  });

  it("has no duplicate tickers in ASSETS or ALL_MARKET_ASSETS", () => {
    const tickers = new Set(ASSETS.map((asset) => asset.ticker));
    expect(tickers.size).toBe(ASSETS.length);

    const allTickers = new Set(ALL_MARKET_ASSETS.map((asset) => asset.ticker));
    expect(allTickers.size).toBe(ALL_MARKET_ASSETS.length);
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
    // differs between a ~29.50 MAD and a ~492 MAD instrument.
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

  it("gives every core CSE instrument a real Moroccan ISIN and description", () => {
    for (const asset of ASSETS) {
      expect(asset.description.length).toBeGreaterThan(40);
      expect(asset.description).toMatch(/ISIN MA\d{10}/);
    }
    for (const cseAsset of CSE_REAL_ASSETS) {
      expect(cseAsset.isin).toMatch(/^MA\d{10}$/);
      expect(cseAsset.exchange).toBe("Bourse de Casablanca");
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
    expect(findAsset("ATW")?.name).toBe("Attijariwafa Bank");
  });

  it("is case and whitespace insensitive", () => {
    expect(findAsset("  atw ")?.ticker).toBe("ATW");
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
