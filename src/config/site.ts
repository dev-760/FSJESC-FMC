/**
 * Single source of application configuration (Part 3.4).
 *
 * No UI component, route handler, or application service may hardcode a club
 * name, a fee, a starting balance, a rate limit, or a session duration. They read
 * it from here so behaviour is changed in one place and documented in one place.
 */

export const SITE = {
  name: "FSJESC Financial Markets Club",
  shortName: "FSJESC FMC",
  tagline: "Learn financial markets. Research. Simulate. Analyze. Improve.",
  description:
    "The official platform of the FSJESC Financial Markets Club — a student-led environment for learning, researching and simulating financial markets.",
  locale: "en",
  /** All user-facing dates and times are displayed in this zone (Part 1.4). */
  timezone: "Africa/Casablanca",
  /** Used only in the footer copyright line; update each year. */
  foundingYear: 2026,
  campus: "Faculté des Sciences Juridiques, Économiques et Sociales de Casablanca",
  campusShort: "FSJES Casablanca",
  localeCode: "fr-MA",
  url: "https://fsjesc-fmc.example", // overridden by NEXT_PUBLIC_APP_URL at runtime
  contactEmail: "contact@fsjesc-fmc.local",
  social: {
    linkedin: "https://www.linkedin.com/",
    github: "https://github.com/",
    email: "mailto:contact@fsjesc-fmc.local",
  },
} as const;

/** Base currency for every monetary value in the system (Part 1.4, N1). */
export const CURRENCY = "MAD" as const;

/**
 * Fee models (§6.5). Selected here; the trading engine receives a `FeeModel`
 * instance and never contains fee arithmetic of its own.
 */
export const FEES = {
  /** Launch default: zero-fee educational model. */
  model: "zero" as const,
  /**
   * Alternative educational models, kept switchable so the effect of costs can be
   * studied later without touching engine code. Amounts are integer centimes.
   */
  available: {
    zero: {
      id: "zero" as const,
      label: "No commission (educational default)",
      description:
        "Orders are executed without brokerage commission so that the focus stays on market mechanics. Slippage still applies.",
      buyPercentBps: 0,
      sellPercentBps: 0,
      minimumCents: 0n,
    },
    flat: {
      id: "flat" as const,
      label: "Flat commission — 10 MAD per order",
      description: "A flat brokerage charge on each execution, for illustration only.",
      buyPercentBps: 0,
      sellPercentBps: 0,
      minimumCents: 1_000n,
    },
    percentage: {
      id: "percentage" as const,
      label: "Commission — 0.10% of trade value, minimum 5 MAD",
      description: "A proportional brokerage charge, for illustration only.",
      buyPercentBps: 10,
      sellPercentBps: 10,
      minimumCents: 500n,
    },
  },
} as const;

/** Deterministic simulated-market settings (§5). */
export const SIMULATION = {
  /** Default simulated cash balance for a new portfolio, in centimes (100,000 MAD). */
  defaultStartingCashCents: 10_000_000n,
  /** Starting balances offered in the UI, in centimes. */
  startingCashOptionsCents: [5_000_000n, 10_000_000n, 25_000_000n, 50_000_000n] as const,
  /** Price decimals for display; storage always uses integer centimes (N1). */
  priceDecimals: 2,
  quantityDecimals: 0,
  /** Assumed annualisation factor for volatility, for educational metrics only. */
  tradingDaysPerYear: 252,
  /** Poll interval for the quote endpoints (§5.5). */
  quotePollIntervalMs: 3_000,
  /**
   * Market calendar (§5.3). The default educational market runs continuously so
   * that students in any timezone can participate. Setting `marketHoursOnly`
   * to true activates real-session behaviour for classroom exercises.
   */
  calendar: {
    marketHoursOnly: false,
    sessions: [
      { opensAt: "10:00", closesAt: "14:00" },
      { opensAt: "14:30", closesAt: "17:30" },
    ] as const,
    /** Sunday = 0. Saturday is closed; Morocco follows a Mon-Sat working week. */
    tradingWeekdays: [1, 2, 3, 4, 5, 6] as const,
  },
  /** Default limit-order lifetime (§6.4). */
  defaultLimitOrderTtlDays: 7,
  /** Guard against a malicious or buggy client submitting absurd order sizes. */
  maxOrderQuantity: 1_000_000,
  /** Client polling must not outrun the server's ability to stay consistent. */
  lazyMatchingMaxLookbackMinutes: 60 * 24 * 14,
} as const;

/** Session and credential policy (§7.3). */
export const AUTH_CONFIG = {
  sessionMaxAgeSeconds: 60 * 60 * 12,
  sessionUpdateAgeSeconds: 60 * 15,
  cookieName: "fsjesc-fmc.session",
  cookieSameSite: "lax" as const,
  emailVerificationTtlHours: 24,
  passwordResetTtlMinutes: 30,
  minPasswordLength: 12,
  maxPasswordLength: 128,
  /** Argon2id baseline recommended by OWASP (DECISIONS.md D4). */
  argon2: {
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  },
} as const;

/** Rate limits (Part 8.3). Values are configurable; the buckets are not. */
export const RATE_LIMITS = {
  login: { perIpPerMinute: 5, perAccountPerHour: 10 },
  registration: { perIpPerHour: 5 },
  passwordReset: { perAccountPerHour: 3 },
  orderSubmission: { perUserPerMinute: 30 },
  generalApi: { perIpPerMinute: 600 },
} as const;

/** Competition defaults (§7.5). */
export const COMPETITIONS = {
  scoring: {
    method: "TOTAL_RETURN_PERCENT" as const,
    /** Ties are broken by lower maximum drawdown, never by absolute profit (Part 7.5). */
    tieBreak: "LOWER_MAX_DRAWDOWN" as const,
  },
  joinWindowBeforeStartHours: 24,
  leaderboardPageSize: 50,
} as const;

/** Pagination defaults (DECISIONS.md D12). */
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

/**
 * Fixed disclaimers (Part 0.4). Referenced by key everywhere so the wording is
 * consistent and can be translated in one place (§9.5).
 */
export const DISCLAIMERS = {
  /** Persistent simulator banner. */
  DISC_1: "SIMULATED MARKET — Educational environment. No real money.",
  /** Article footer. */
  DISC_2: "For educational purposes only. Not investment advice.",
  /** Analytics and advanced metrics. */
  DISC_3: "Educational metrics. Not personalized financial advice.",
  /** Leaderboard methodology statement. */
  DISC_4:
    "Ranking is based on total portfolio return (%) over the competition window. Ties are broken by the lower maximum drawdown. The market is simulated; results do not predict real-world performance and do not constitute investment advice.",
} as const;

export type DisclaimerKey = keyof typeof DISCLAIMERS;
export type FeeModelId = (typeof FEES.available)[keyof typeof FEES.available]["id"];

/**
 * Individually exported so a component can import exactly the disclaimer it needs
 * (`import { DISC_1 }`) without reaching into the record, which keeps the
 * reference site-wide and greppable.
 */
export const DISC_1 = DISCLAIMERS.DISC_1;
export const DISC_2 = DISCLAIMERS.DISC_2;
export const DISC_3 = DISCLAIMERS.DISC_3;
export const DISC_4 = DISCLAIMERS.DISC_4;

/** The configured fee model, as an id. The engine resolves it to an implementation. */
export function activeFeeModelId(): FeeModelId {
  return FEES.model;
}
