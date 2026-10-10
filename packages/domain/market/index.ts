/**
 * Market module exports.
 */

export {
  market,
  SimulatedMarket,
  TRADEABLE,
  INSTRUMENTS,
  DEFAULT_SEED,
  type ScenarioOverlay,
} from "./engine";

export {
  INFLATION_SHOCK,
  MARKET_CRASH,
  BULL_RUN,
  SECTOR_ROTATION,
  VOLATILITY_SPIKE,
  INTEREST_RATE_HIKE,
  SCENARIOS,
  getActiveScenarios,
  getScenarioByName,
} from "./scenarios";

export { easternLabel, nextTransition, sessionState, type SessionState } from "./clock";

export {
  type Instrument,
  type Quote,
  type Candle,
  type Series,
  type Interval,
  type AssetClass,
  type MarketClock,
  type MarketDataProvider,
} from "./provider";
