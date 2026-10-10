/**
 * Market simulation scenarios (Part 5.1, D8).
 *
 * Dated perturbations of the price model. A scenario is an overlay on (μ, σ)
 * applied only between `from` and `to`, so a lesson can ask "what would a crisis
 * month have done to this position?" without rewriting the history that came
 * before the window.
 *
 * All scenarios use deterministic time windows for reproducibility.
 */

import type { ScenarioOverlay } from "./engine";

/**
 * Base timestamp for scenario windows (2026-01-01 00:00:00 UTC).
 * All scenario windows are relative to this anchor to ensure reproducibility.
 */
const ANCHOR = Math.floor(new Date("2026-01-01T00:00:00Z").getTime() / 1000);

/**
 * One day in seconds.
 */
const DAY = 86_400;

/**
 * Seven days in seconds.
 */
const WEEK = 7 * DAY;

/**
 * Thirty days in seconds.
 */
const MONTH = 30 * DAY;

/**
 * Scenario: Inflation shock.
 *
 * Sudden increase in volatility and upward drift across all sectors.
 * Simulates a period of rapid inflation and market uncertainty.
 */
export const INFLATION_SHOCK: ScenarioOverlay = {
  name: "Inflation Shock",
  volatilityMultiplier: 2.5,
  driftAdjustment: 0.02, // +2% annual drift
  from: ANCHOR + 3 * MONTH,
  to: ANCHOR + 3 * MONTH + 2 * WEEK,
};

/**
 * Scenario: Market crash.
 *
 * Sharp downward drift with elevated volatility.
 * Simulates a market correction or recession.
 */
export const MARKET_CRASH: ScenarioOverlay = {
  name: "Market Crash",
  volatilityMultiplier: 3.0,
  driftAdjustment: -0.15, // -15% annual drift
  from: ANCHOR + 6 * MONTH,
  to: ANCHOR + 6 * MONTH + WEEK,
};

/**
 * Scenario: Bull run.
 *
 * Sustained upward drift with normal volatility.
 * Simulates a period of economic optimism and growth.
 */
export const BULL_RUN: ScenarioOverlay = {
  name: "Bull Run",
  volatilityMultiplier: 1.0,
  driftAdjustment: 0.08, // +8% annual drift
  from: ANCHOR + 9 * MONTH,
  to: ANCHOR + 9 * MONTH + 3 * MONTH,
};

/**
 * Scenario: Sector rotation.
 *
 * Changes drift based on sector (simplified as a uniform multiplier here).
 * In a full implementation, this would vary by sector.
 */
export const SECTOR_ROTATION: ScenarioOverlay = {
  name: "Sector Rotation",
  volatilityMultiplier: 1.2,
  driftAdjustment: 0.03, // +3% annual drift
  from: ANCHOR + 12 * MONTH,
  to: ANCHOR + 12 * MONTH + MONTH,
};

/**
 * Scenario: Volatility spike.
 *
 * Massive volatility increase with neutral drift.
 * Simulates a period of high uncertainty without directional bias.
 */
export const VOLATILITY_SPIKE: ScenarioOverlay = {
  name: "Volatility Spike",
  volatilityMultiplier: 4.0,
  driftAdjustment: 0.0,
  from: ANCHOR + 15 * MONTH,
  to: ANCHOR + 15 * MONTH + 2 * WEEK,
};

/**
 * Scenario: Interest rate hike.
 *
 * Downward drift with moderate volatility increase.
 * Simulates the impact of central bank tightening.
 */
export const INTEREST_RATE_HIKE: ScenarioOverlay = {
  name: "Interest Rate Hike",
  volatilityMultiplier: 1.5,
  driftAdjustment: -0.05, // -5% annual drift
  from: ANCHOR + 18 * MONTH,
  to: ANCHOR + 18 * MONTH + MONTH,
};

/**
 * All available scenarios.
 */
export const SCENARIOS: readonly ScenarioOverlay[] = [
  INFLATION_SHOCK,
  MARKET_CRASH,
  BULL_RUN,
  SECTOR_ROTATION,
  VOLATILITY_SPIKE,
  INTEREST_RATE_HIKE,
];

/**
 * Get active scenarios for a given time.
 */
export function getActiveScenarios(at: Date): readonly ScenarioOverlay[] {
  const timestamp = Math.floor(at.getTime() / 1000);
  return SCENARIOS.filter((scenario) => timestamp >= scenario.from && timestamp < scenario.to);
}

/**
 * Get a scenario by name.
 */
export function getScenarioByName(name: string): ScenarioOverlay | undefined {
  return SCENARIOS.find((scenario) => scenario.name === name);
}
