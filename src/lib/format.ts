import { SITE } from "@/config/site";
import { money, type Currency, type Money, percentageChangeBps } from "./money";

/**
 * Locale-aware formatting (Part 9.5).
 *
 * All monetary values are formatted with `Intl.NumberFormat` in the MAD locale.
 * No currency string is ever hardcoded in a component: there is no `"MAD"` literal
 * and no manual thousand-separator logic anywhere in the UI.
 */

const LOCALE = SITE.localeCode;

const CURRENCY_FORMATTERS = new Map<string, Intl.NumberFormat>();

function currencyFormatter(currency: Currency): Intl.NumberFormat {
  let formatter = CURRENCY_FORMATTERS.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    CURRENCY_FORMATTERS.set(currency, formatter);
  }
  return formatter;
}

/**
 * Format a `Money` value, e.g. `123 456,78 MAD`.
 *
 * Because MAD's minor unit in practice is the centime and `Intl` renders two
 * fraction digits, the displayed number always equals the stored centimes.
 */
export function formatMAD(
  value: Money,
  options: { compact?: boolean; showSign?: boolean } = {},
): string {
  const formatter = options.compact
    ? new Intl.NumberFormat(LOCALE, {
        style: "currency",
        currency: value.currency,
        notation: "compact",
        maximumFractionDigits: 1,
      })
    : currencyFormatter(value.currency);

  const formatted = formatter.format(Number(value.amountCents) / 100);
  return options.showSign && value.amountCents > 0n ? `+${formatted}` : formatted;
}

/** Format a centime count without a currency symbol (dense tables). */
export function formatCents(cents: bigint, options: { showSign?: boolean } = {}): string {
  const formatter = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const negative = cents < 0n;
  const magnitude = negative ? -cents : cents;
  const text = `${formatter.format(Number(magnitude) / 100)}`;
  if (negative) return `-${text}`;
  return options.showSign ? `+${text}` : text;
}

/**
 * A price in centimes, rendered with the instrument's display precision.
 * Prices use the same two-decimal convention as money for consistency in tables.
 */
export function formatPrice(cents: bigint, currency: Currency = "MAD"): string {
  return currencyFormatter(currency).format(Number(cents) / 100);
}

export function formatQuantity(quantity: bigint | number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(Number(quantity));
}

/**
 * Format a ratio as a signed percentage from basis points, e.g. `+2.40%`.
 *
 * The direction arrow is part of the output because colour must never be the only
 * carrier of meaning (Part 9.2).
 */
export function formatPercentFromBps(bps: bigint, decimals = 2): string {
  const formatter = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "exceptZero",
  });
  const percent = Number(bps) / 100;
  return `${formatter.format(percent)}%`;
}

export function formatPercent(value: number, decimals = 2): string {
  const formatter = new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "exceptZero",
  });
  return `${formatter.format(value)}%`;
}

/** Directional glyph for a signed change, so sign is never conveyed by colour alone. */
export function directionArrow(bpsOrValue: bigint | number): "↑" | "↓" | "→" {
  const value = typeof bpsOrValue === "bigint" ? bpsOrValue : BigInt(Math.round(bpsOrValue));
  if (value > 0n) return "↑";
  if (value < 0n) return "↓";
  return "→";
}

export function formatChange(bps: bigint, decimals = 2): string {
  return `${formatPercentFromBps(bps, decimals)} ${directionArrow(bps)}`;
}

/** Percentage change between two money amounts, formatted. */
export function formatMoneyChange(from: Money, to: Money, decimals = 2): string {
  if (from.amountCents === 0n) return "n/a";
  return formatChange(percentageChangeBps(from, to), decimals);
}

/* -------------------------------------------------------------------------- */
/* Dates                                                                       */
/* -------------------------------------------------------------------------- */

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: SITE.timezone,
});

const DATE_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeZone: SITE.timezone,
});

const TIME_FORMATTER = new Intl.DateTimeFormat(LOCALE, {
  timeStyle: "short",
  timeZone: SITE.timezone,
});

export function formatDateTime(value: Date | string | number): string {
  return DATE_TIME_FORMATTER.format(toDate(value));
}

export function formatDate(value: Date | string | number): string {
  return DATE_FORMATTER.format(toDate(value));
}

export function formatTime(value: Date | string | number): string {
  return TIME_FORMATTER.format(toDate(value));
}

/** Absolute machine-readable value for `<time dateTime>`. Always UTC. */
export function toIsoString(value: Date | string | number): string {
  return toDate(value).toISOString();
}

/** Title attribute for a date, e.g. "8 October 2026 at 14:32 (Africa/Casablanca)". */
export function formatDateTimeLong(value: Date | string | number): string {
  const date = toDate(value);
  return `${DATE_TIME_FORMATTER.format(date)} (${SITE.timezone})`;
}

function toDate(value: Date | string | number): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) throw new TypeError("Invalid Date");
    return value;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new TypeError(`Invalid date value: ${String(value)}`);
  return date;
}

/* -------------------------------------------------------------------------- */
/* Convenience                                                                 */
/* -------------------------------------------------------------------------- */

/** Signed money delta, e.g. `+1 250,00 MAD` / `−430,00 MAD`. */
export function formatSignedMAD(value: Money): string {
  return formatMAD(value, { showSign: true });
}

/** Thousands-separated integer, for volumes and trade counts. */
export function formatCount(value: bigint | number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(Number(value));
}

/** `12.4K`, `1.2M` — for dense chart axes and summary tiles. */
export function formatCompact(value: bigint | number): string {
  return new Intl.NumberFormat(LOCALE, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export { money };
