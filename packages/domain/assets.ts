/**
 * The eight fictional instruments of the simulated market (Part 5.6).
 *
 * Every field here is invented. The tickers and names are chosen to feel plausible
 * for a Moroccan market without corresponding to any real company, index or
 * security, and the platform never implies otherwise. Starting prices are spread
 * across roughly 20–500 MAD so the simulator exercises both low-price and
 * high-price instruments (and therefore both large and small position sizes).
 *
 * `drift` and `volatility` are parameters of the deterministic price model
 * (Part 5.1), not observed statistics. They are expressed as annualised rates and
 * documented in `MARKET_SIMULATION.md`.
 */

export const SECTORS = [
  "BANKING",
  "REAL_ESTATE",
  "ENERGY",
  "RETAIL",
  "TELECOM",
  "INDUSTRY",
] as const;

export type Sector = (typeof SECTORS)[number];

export const SECTOR_LABELS: Record<Sector, string> = {
  BANKING: "Banking",
  REAL_ESTATE: "Real estate",
  ENERGY: "Energy",
  RETAIL: "Retail",
  TELECOM: "Telecom",
  INDUSTRY: "Industry",
};

export interface AssetDefinition {
  ticker: string;
  name: string;
  sector: Sector;
  description: string;
  currency: "MAD";
  /** Opening price in centimes (N1). 2,480.00 MAD is 248,000 centimes. */
  startingPriceCents: number;
  /** Annualised drift used by the price model, as a fraction. */
  annualDrift: number;
  /** Annualised volatility used by the price model, as a fraction. */
  annualVolatility: number;
}

export const ASSETS: readonly AssetDefinition[] = [
  {
    ticker: "MARI",
    name: "Mariem Agri-Industry",
    sector: "INDUSTRY",
    description:
      "A fictional processor and distributor of food products. Model exercises a consumer-facing " +
      "manufacturer with moderate sensitivity to input costs.",
    currency: "MAD",
    startingPriceCents: 48_000,
    annualDrift: 0.06,
    annualVolatility: 0.22,
  },
  {
    ticker: "CASA",
    name: "Casablanca Retail Group",
    sector: "RETAIL",
    description:
      "A fictional retail operator. Model exercises a low-margin business, where cost sensitivity " +
      "shows up in the price more than in the volume.",
    currency: "MAD",
    startingPriceCents: 18_650,
    annualDrift: 0.04,
    annualVolatility: 0.26,
  },
  {
    ticker: "ATLAS",
    name: "Atlas Energy Partners",
    sector: "ENERGY",
    description:
      "A fictional energy producer and distributor. Model exercises a capital-intensive sector, " +
      "with higher volatility and sensitivity to the interest-rate scenarios.",
    currency: "MAD",
    startingPriceCents: 9_725,
    annualDrift: 0.03,
    annualVolatility: 0.31,
  },
  {
    ticker: "MAGHREB",
    name: "Maghreb Banking Group",
    sector: "BANKING",
    description:
      "A fictional commercial bank. Model exercises a levered business, where a rate move affects " +
      "the whole balance sheet rather than one line of it.",
    currency: "MAD",
    startingPriceCents: 12_400,
    annualDrift: 0.05,
    annualVolatility: 0.28,
  },
  {
    ticker: "RIF",
    name: "Rif Immobilier",
    sector: "REAL_ESTATE",
    description:
      "A fictional property developer. Model exercises an asset class with long horizons and high " +
      "sensitivity to financing conditions.",
    currency: "MAD",
    startingPriceCents: 6_150,
    annualDrift: 0.02,
    annualVolatility: 0.34,
  },
  {
    ticker: "SOUK",
    name: "Souk Digital Services",
    sector: "RETAIL",
    description:
      "A fictional retail technology provider. Model exercises a high-growth, high-volatility name, " +
      "useful for showing what volatility does to a concentrated position.",
    currency: "MAD",
    startingPriceCents: 4_380,
    annualDrift: 0.09,
    annualVolatility: 0.42,
  },
  {
    ticker: "OASIS",
    name: "Oasis Telecom",
    sector: "TELECOM",
    description:
      "A fictional network operator. Model exercises a defensive sector, used as a comparison when " +
      "discussing what lower volatility does to a drawdown.",
    currency: "MAD",
    startingPriceCents: 2_450,
    annualDrift: 0.035,
    annualVolatility: 0.18,
  },
  {
    ticker: "ZENITH",
    name: "Zenith Insurance",
    sector: "BANKING",
    description:
      "A fictional non-life insurer. Model exercises a balance sheet driven by premium income and " +
      "reserves, with volatility between that of a bank and a telecom.",
    currency: "MAD",
    startingPriceCents: 47_900,
    annualDrift: 0.045,
    annualVolatility: 0.2,
  },
] as const;

/** Namespace alias used by the phase placeholders. */
export const SIMULATOR = ASSETS;

export const TICKERS: readonly string[] = ASSETS.map((asset) => asset.ticker);

export const TICKER_PATTERN = /^[A-Z]{2,8}$/;

export function findAsset(ticker: string): AssetDefinition | undefined {
  const normalised = ticker.trim().toUpperCase();
  return ASSETS.find((asset) => asset.ticker === normalised);
}

export function assetsBySector(): Map<Sector, AssetDefinition[]> {
  const grouped = new Map<Sector, AssetDefinition[]>();
  for (const asset of ASSETS) {
    const bucket = grouped.get(asset.sector) ?? [];
    bucket.push(asset);
    grouped.set(asset.sector, bucket);
  }
  return grouped;
}
