import { getPublicEnv } from "./env-public";

/**
 * Feature flags (Part 3.4).
 *
 * A flag read on the server is authoritative. The matching `NEXT_PUBLIC_*`
 * override exists only so a Client Component can decide whether to render a
 * navigation entry — never to decide whether an operation is permitted (N3).
 */
export const FEATURE_FLAGS = {
  /** Paper-trading simulator routes. */
  SIMULATOR: true,
  /** Competitions and challenges. */
  COMPETITIONS: true,
  /**
   * Live/real market data provider. Off by design: no external market data feed
   * exists or is claimed (N8). The simulator is a deterministic price model.
   */
  LIVE_MARKET_DATA: false,
  /** Administration surfaces. */
  ADMIN: true,
  /** Self-service account registration. */
  REGISTRATION: true,
  /** Server-Sent Events instead of polling (§5.5). Off; polling is the default. */
  LIVE_UPDATES: false,
  /** Executive surfaces (events, articles, team, competitions, member grants). */
  EXECUTIVE: true,
  /** Scenario challenges. */
  CHALLENGES: true,
} as const;

export type FeatureFlagName = keyof typeof FEATURE_FLAGS;

function publicOverride(name: "SIMULATOR" | "ADMIN" | "REGISTRATION"): boolean | undefined {
  try {
    const env = getPublicEnv();
    if (name === "SIMULATOR") return env.NEXT_PUBLIC_FEATURE_SIMULATOR;
    if (name === "ADMIN") return env.NEXT_PUBLIC_FEATURE_ADMIN;
    return undefined;
  } catch {
    // Public env is not parsed in contexts where NEXT_PUBLIC_* is unavailable
    // (e.g. standalone scripts). Fall back to the compiled default.
    return undefined;
  }
}

export function isEnabled(flag: FeatureFlagName): boolean {
  const value: boolean = FEATURE_FLAGS[flag];
  if (flag === "SIMULATOR" || flag === "ADMIN" || flag === "REGISTRATION") {
    return publicOverride(flag) ?? value;
  }
  return value;
}
