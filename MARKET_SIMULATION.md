# Market Simulation

## Overview

The market simulation uses a deterministic, seeded random number generator to create realistic price paths for fictional instruments. All prices are generated server-side and are not connected to any real market data provider.

## Core Principles

1. **Deterministic**: Same seed produces identical price paths
2. **Educational**: Simulated market, not real data
3. **Transparent**: Always disclose that data is simulated
4. **Fictional Instruments**: No real tickers or securities
5. **No Investment Advice**: Educational purposes only

## Random Number Generation

### Seeded PRNG

Uses a hash-based PRNG for determinism:

```typescript
class SeededPRNG {
  private seed: number;

  constructor(seed: string) {
    this.seed = this.hashString(seed);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}
```

### Seeding

Different market states use different seeds:

```typescript
const marketSeed = "fsjesc-fmc-v1"; // Base seed
const daySeed = `${marketSeed}-${dateString}`;
const prng = new SeededPRNG(daySeed);
```

## Price Model

### Geometric Brownian Motion (GBM)

The price model approximates GBM with discrete steps:

```
P(t+1) = P(t) * exp((μ - σ²/2) * Δt + σ * ε * √Δt)
```

Where:

- `P(t)`: Current price
- `μ`: Drift (expected return)
- `σ`: Volatility
- `Δt`: Time step
- `ε`: Random normal value

### Implementation

```typescript
function generatePricePath(
  basePrice: bigint,
  driftBps: bigint, // drift in basis points
  volatilityBps: bigint, // volatility in basis points
  steps: number,
  prng: SeededPRNG,
): bigint[] {
  const prices: bigint[] = [basePrice];
  const dt = 1 / 252; // Trading days per year

  for (let i = 0; i < steps; i++) {
    const currentPrice = prices[i];
    const drift = (driftBps * dt) / 10_000n;
    const volatility = (volatilityBps * Math.sqrt(dt)) / 10_000n;
    const random = (prng.next() * 2 - 1) * volatility; // Approximate normal

    const change = (currentPrice * (drift + random)) / 10000n;
    const newPrice = currentPrice + change;

    prices.push(newPrice);
  }

  return prices;
}
```

## Instruments

### Fictional Tickers

All instruments are fictional, MAD-denominated:

| Ticker  | Name                 | Sector      | Type   | Base Price (MAD) |
| ------- | -------------------- | ----------- | ------ | ---------------- |
| MARI    | Marrakech Industries | Industrials | Equity | 1,250.00         |
| CASA    | Casablanca Holdings  | Financials  | Equity | 890.50           |
| ATLAS   | Atlas Group          | Energy      | Equity | 2,100.00         |
| MAGHREB | Maghreb Telecom      | Technology  | Equity | 450.25           |
| RIF     | Rif Mountains        | Materials   | Equity | 780.75           |
| SOUK    | Souk Valley          | Consumer    | Equity | 320.50           |
| OASIS   | Oasis Energy         | Energy      | Equity | 1,450.00         |
| ZENITH  | Zenith Pharma        | Healthcare  | Equity | 950.00           |

### Instrument Properties

Each instrument has:

- **Volatility**: Different sectors have different volatility
- **Correlation**: Instruments in same sector are correlated
- **Sector Beta**: Sensitivity to market moves

```typescript
const instruments: Instrument[] = [
  {
    ticker: "MARI",
    name: "Marrakech Industries",
    sector: "Industrials",
    type: "EQUITY",
    basePriceCents: 125000n, // 1,250.00 MAD
    volatilityBps: 1500n, // 15% annual volatility
    driftBps: 800n, // 8% annual drift
  },
  // ... other instruments
];
```

## Candle Generation

### OHLCV Candles

Each candle contains:

- **Open**: Price at period start
- **High**: Highest price in period
- **Low**: Lowest price in period
- **Close**: Price at period end
- **Volume**: Simulated trading volume

```typescript
function generateCandle(pricePath: bigint[], startIndex: number, period: number): Candle {
  const segment = pricePath.slice(startIndex, startIndex + period);

  const open = segment[0];
  const close = segment[segment.length - 1];
  const high = segment.reduce((max, p) => (p > max ? p : max), open);
  const low = segment.reduce((min, p) => (p < min ? p : min), open);

  // Volume is proportional to price movement
  const priceChange = Math.abs(Number(close - open));
  const volume = Math.floor(priceChange * 1000 + Math.random() * 500);

  return { open, high, low, close, volume };
}
```

### Timeframes

Supported timeframes:

- **1m**: 1 minute candles
- **5m**: 5 minute candles
- **15m**: 15 minute candles
- **1h**: 1 hour candles
- **1d**: Daily candles
- **1w**: Weekly candles

## Market Clock

### Trading Hours

Simulated market follows Moroccan stock exchange hours:

- **Open**: 09:00 UTC
- **Close**: 15:30 UTC
- **Closed**: Weekends and holidays

```typescript
function isMarketOpen(date: Date): boolean {
  const hour = date.getUTCHours();
  const day = date.getUTCDay();

  // Closed on weekends
  if (day === 0 || day === 6) return false;

  // Open between 09:00 and 15:30 UTC
  if (hour < 9 || hour >= 15) return false;
  if (hour === 15 && date.getUTCMinutes() >= 30) return false;

  return true;
}
```

### Market State

```typescript
interface MarketState {
  isOpen: boolean;
  nextOpen: Date;
  nextClose: Date;
}
```

## Scenarios

### INFLATION_SHOCK

Simulates sudden inflation and interest rate hikes:

```typescript
function applyInflationShock(pricePath: bigint[], shockStart: number, severity: number): bigint[] {
  const shockedPath = [...pricePath];

  for (let i = shockStart; i < pricePath.length; i++) {
    // Apply shock factor
    const shockFactor = 1 + (severity * (i - shockStart)) / 100;
    shockedPath[i] = BigInt(Math.floor(Number(pricePath[i]) * shockFactor));
  }

  return shockedPath;
}
```

Effects:

- **Rate-sensitive sectors** (Financials, Real Estate) decline
- **Commodities** (Energy, Materials) may rise
- **Consumer staples** relatively stable

### BULL_MARKET

Simulates a sustained uptrend:

```typescript
function applyBullMarket(
  pricePath: bigint[],
  start: number,
  duration: number,
  strength: number,
): bigint[] {
  const bullPath = [...pricePath];

  for (let i = start; i < start + duration && i < pricePath.length; i++) {
    const trend = (strength * (i - start)) / duration;
    bullPath[i] = BigInt(Math.floor(Number(pricePath[i]) * (1 + trend)));
  }

  return bullPath;
}
```

### BEAR_MARKET

Simulates a sustained downtrend:

```typescript
function applyBearMarket(
  pricePath: bigint[],
  start: number,
  duration: number,
  strength: number,
): bigint[] {
  const bearPath = [...pricePath];

  for (let i = start; i < start + duration && i < pricePath.length; i++) {
    const trend = (-strength * (i - start)) / duration;
    bearPath[i] = BigInt(Math.floor(Number(pricePath[i]) * (1 + trend)));
  }

  return bearPath;
}
```

## Correlation

### Sector Correlation

Instruments in the same sector move together:

```typescript
function applySectorCorrelation(
  pricePaths: Map<string, bigint[]>,
  correlation: number,
): Map<string, bigint[]> {
  const correlatedPaths = new Map<string, bigint[]>();

  const sectors = groupBySector(instruments);

  for (const [sector, tickers] of sectors) {
    const sectorPath = calculateSectorMean(pricePaths, tickers);

    for (const ticker of tickers) {
      const individualPath = pricePaths.get(ticker)!;
      const correlatedPath = individualPath.map((price, i) => {
        const sectorMove = (sectorPath[i] - sectorPath[i - 1]) / sectorPath[i - 1];
        const individualMove = (price - individualPath[i - 1]) / individualPath[i - 1];
        const blendedMove = (1 - correlation) * individualMove + correlation * sectorMove;
        return individualPath[i - 1] * (1 + blendedMove);
      });

      correlatedPaths.set(ticker, correlatedPath);
    }
  }

  return correlatedPaths;
}
```

## Volume Simulation

Volume is simulated based on:

- **Price movement**: Higher volatility = higher volume
- **Time of day**: Higher volume at open and close
- **Market state**: Volume is zero when market closed

```typescript
function generateVolume(priceChange: bigint, timeOfDay: Date, isMarketOpen: boolean): number {
  if (!isMarketOpen) return 0;

  const hour = timeOfDay.getUTCHours();

  // Higher volume at open (9-10) and close (15-15:30)
  const timeMultiplier = hour === 9 || hour === 15 ? 1.5 : 1.0;

  // Higher volume with larger price moves
  const moveMultiplier = 1 + Number(priceChange) / 10000;

  const baseVolume = 1000;
  return Math.floor(baseVolume * timeMultiplier * moveMultiplier * Math.random());
}
```

## API

### Get Quote

```typescript
GET /api/market/quote?ticker=MARI
```

Returns current price for a single instrument.

### Get Quotes

```typescript
GET / api / market / quotes;
```

Returns current prices for all instruments.

### Get Series

```typescript
GET /api/market/series?ticker=MARI&timeframe=1d&period=30
```

Returns historical price series as candles.

### Get Instruments

```typescript
GET / api / market / instruments;
```

Returns list of all available instruments.

## Testing

The market model has unit tests covering:

- Determinism (same seed = same output)
- Price path generation
- Candle generation
- Scenario application
- Market clock
- Volume simulation

Run tests:

```bash
pnpm test:unit market-model
```

## Performance

- Price generation is O(n) where n is number of steps
- All calculations use `bigint` for exact arithmetic
- No external API calls
- Caching can be applied to generated price paths

## Limitations

1. **Not Real Data**: All prices are simulated
2. **Simplified Model**: Does not include all market factors
3. **No Order Book**: Instant execution at mid price
4. **No Slippage**: Assumes perfect liquidity (except for scenarios)
5. **Deterministic**: Cannot simulate truly random events

## Honesty Policy

All pages displaying market data must include:

- **DISC-1**: Persistent banner stating market is simulated
- **Chart footers**: Educational purposes only, not investment advice
- **Disclaimer**: No real money, fictional instruments

Example:

```
⚠ SIMULATED MARKET
All prices and instruments are fictional. This is an educational environment.
No real money is involved. Not investment advice.
```
