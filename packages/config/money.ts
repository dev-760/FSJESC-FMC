/**
 * Money arithmetic (N1 — non-negotiable #1).
 *
 * Every monetary value in the application is an integer number of **centimes**
 * held in a `bigint`, wrapped in a branded `Money` value. Binary floating-point
 * arithmetic is never used for money anywhere in this codebase.
 *
 * Rationale for `bigint` over `number`:
 *   - `number` is an IEEE-754 double. `0.1 + 0.2 !== 0.3`, and values above
 *     2^53 lose integral precision. For a ledger, either failure is unacceptable.
 *   - `bigint` is exact at any magnitude, so addition and subtraction of centimes
 *     never drift and need no rounding.
 *
 * The only operation that can produce a fraction of a centime is division
 * (average price, basis-point fees, splitting an amount). Division and allocation
 * therefore route through explicit, documented, half-up rounding helpers — never
 * through implicit language behaviour.
 *
 * This module is pure TypeScript and is safe to use from the domain, the
 * simulator, the application layer, and React Server Components. It has no
 * dependency on React, the ORM, or any browser API.
 */

import { z } from "zod";

declare const moneyBrand: unique symbol;

/** Supported currencies. MAD is the only currency in the simulator (Part 1.4). */
export const CURRENCIES = ["MAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

/**
 * A monetary amount. Branded so a raw `bigint` cannot be passed where money is
 * expected, which is the failure mode that silently corrupts a ledger.
 */
export interface Money {
  readonly [moneyBrand]: "Money";
  readonly amountCents: bigint;
  readonly currency: Currency;
}

export class MoneyError extends Error {
  override readonly name = "MoneyError";
}

/** Guard rails matching the database column widths (§4.1). */
export const MONEY_LIMITS = {
  /** NUMERIC(20,2) holds at most 18 integer digits; stay one order below it. */
  maxAbsCents: 10n ** 17n,
  minAbsCents: -(10n ** 17n),
} as const;

function assertWithinColumnRange(amountCents: bigint): void {
  if (amountCents > MONEY_LIMITS.maxAbsCents || amountCents < MONEY_LIMITS.minAbsCents) {
    throw new MoneyError(
      `Money amount ${amountCents} centimes is outside the supported range (NUMERIC(20,2)).`,
    );
  }
}

function assertCurrency(currency: string): asserts currency is Currency {
  if (!CURRENCIES.includes(currency as Currency)) {
    throw new MoneyError(
      `Unsupported currency "${currency}". This platform operates in ${CURRENCIES.join(", ")} only.`,
    );
  }
}

/**
 * The single place a `Money` value is constructed.
 *
 * The brand is a compile-time-only marker (`declare const`, so it emits no runtime
 * code and adds nothing to the size of a value that appears in hot loops). The
 * assertion below is the price of that, and it is confined to this one function:
 * everything else in the codebase obtains money through `money()` / `zero()` /
 * `fromMajorUnits()` and therefore cannot produce an unbranded amount.
 */
function makeMoney(amountCents: bigint, currency: Currency): Money {
  return { amountCents, currency } as Money;
}

/** Construct a `Money` from an integer number of centimes. */
export function money(amountCents: bigint | number, currency: Currency = "MAD"): Money {
  if (typeof amountCents === "number") {
    if (!Number.isInteger(amountCents)) {
      throw new MoneyError(
        `Refusing to build Money from the non-integer number ${amountCents}. ` +
          `Use fromMajorUnits() to convert decimal values explicitly.`,
      );
    }
    if (!Number.isSafeInteger(amountCents)) {
      throw new MoneyError(`Number ${amountCents} exceeds the safe integer range; pass a bigint.`);
    }
    amountCents = BigInt(amountCents);
  }
  assertWithinColumnRange(amountCents);
  assertCurrency(currency);
  return makeMoney(amountCents, currency);
}

export function zero(currency: Currency = "MAD"): Money {
  return money(0n, currency);
}

export function fromCents(amountCents: bigint | number, currency: Currency = "MAD"): Money {
  return money(amountCents, currency);
}

/* -------------------------------------------------------------------------- */
/* Rounding                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Integer division with half-up rounding, i.e. ties round away from zero.
 * `divideRoundHalfUp(5n, 2n) === 3n`, `divideRoundHalfUp(-5n, 2n) === -3n`.
 *
 * This is the single rounding rule used by the whole application, so that the
 * same computation always produces the same ledger entry.
 */
export function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) throw new MoneyError("Division by zero.");
  if (denominator < 0n) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const negative = numerator < 0n;
  const magnitude = negative ? -numerator : numerator;
  const quotient = magnitude / denominator;
  const remainder = magnitude % denominator;
  // Round up when the remainder is at least half the divisor.
  const rounded = remainder * 2n >= denominator ? quotient + 1n : quotient;
  return negative ? -rounded : rounded;
}

/**
 * Parse a decimal major-unit string ("1234.56", "-0.5", "7") into centimes.
 *
 * Strings are parsed digit by digit rather than through `Number`, so no float
 * rounding can occur. More than two fractional digits is a programming error,
 * not a rounding opportunity: a price of "12.345" MAD cannot be represented in
 * a centime-based ledger, and silently rounding it would hide the defect.
 */
export function fromMajorUnits(value: string, currency: Currency = "MAD"): Money {
  const trimmed = value.trim();
  if (trimmed === "") throw new MoneyError("Cannot parse an empty string as money.");
  if (!/^[+-]?(\d+(\.\d+)?|\.\d+)$/.test(trimmed)) {
    throw new MoneyError(`Cannot parse "${value}" as a decimal money value.`);
  }

  const negative = trimmed.startsWith("-");
  const unsigned = trimmed.replace(/^[+-]/, "");
  const [whole = "0", fraction = ""] = unsigned.split(".");

  if (fraction.length > 2) {
    throw new MoneyError(
      `"${value}" has ${fraction.length} fractional digits; MAD amounts support at most 2.`,
    );
  }

  const padded = (fraction + "00").slice(0, 2);
  const cents = BigInt(whole) * 100n + BigInt(padded);
  return money(negative ? -cents : cents, currency);
}

/**
 * Same as `fromMajorUnits` but tolerates a third-or-later decimal digit and rounds
 * it half-up. Intended for reading values that arrived from an external source at
 * higher precision than the ledger supports.
 */
export function fromMajorUnitsRounded(value: string, currency: Currency = "MAD"): Money {
  const match = /^([+-]?)(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!match) return fromMajorUnits(value, currency); // throws with the precise reason

  const [, sign = "", whole = "0", fraction = ""] = match;
  if (fraction.length <= 2) return fromMajorUnits(value, currency);

  const centimes = BigInt(whole) * 100n + BigInt(fraction.slice(0, 2));
  const thirdDigit = Number(fraction.charAt(2) || "0");
  // Round the magnitude half-up, then apply the sign. Rounding the signed value
  // directly would round -12.345 down to -12.34 instead of away from zero.
  const magnitude = centimes + (thirdDigit >= 5 ? 1n : 0n);
  return money(sign === "-" ? -magnitude : magnitude, currency);
}

export function fromNumber(value: number, currency: Currency = "MAD"): Money {
  if (!Number.isFinite(value)) throw new MoneyError(`Cannot convert ${value} to money.`);
  return fromMajorUnitsRounded(value.toFixed(2), currency);
}

/** Serialise to the canonical `"1234.56"` string used by the database. */
export function toMajorUnitString(value: Money): string {
  const negative = value.amountCents < 0n;
  const magnitude = negative ? -value.amountCents : value.amountCents;
  const whole = magnitude / 100n;
  const fraction = magnitude % 100n;
  const fractionText = fraction.toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fractionText}`;
}

/** Value suitable for a `NUMERIC(20,2)` column. Passed as a string, never a float. */
export function toDbNumeric(value: Money): string {
  assertWithinColumnRange(value.amountCents);
  return toMajorUnitString(value);
}

/** Read a `NUMERIC` column value (postgres.js returns numerics as strings). */
export function fromDbNumeric(value: string | number | bigint, currency: Currency = "MAD"): Money {
  if (typeof value === "bigint") return money(value, currency);
  if (typeof value === "number") {
    if (!Number.isInteger(value)) {
      // A float reached this function, which means precision was already lost
      // upstream. Refuse loudly rather than compounding the error.
      throw new MoneyError(
        `Refusing to read Money from the float ${value}; NUMERIC columns must be read as strings.`,
      );
    }
    return money(BigInt(value), currency);
  }
  return fromMajorUnitsRounded(value, currency);
}

/* -------------------------------------------------------------------------- */
/* Arithmetic                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Currency guard. The two `as string` widenings are what let this compile: after
 * `a.currency !== b.currency` narrows two `Currency` literals, TypeScript infers
 * the difference as `never`, which cannot be interpolated.
 */
function assertSameCurrency(a: Money, b: Money): void {
  if (a.currency !== b.currency) {
    throw new MoneyError(`Currency mismatch: ${String(a.currency)} vs ${String(b.currency)}.`);
  }
}

export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountCents + b.amountCents, a.currency);
}

export function subtract(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.amountCents - b.amountCents, a.currency);
}

export function negate(a: Money): Money {
  return money(-a.amountCents, a.currency);
}

export function abs(a: Money): Money {
  return a.amountCents < 0n ? negate(a) : a;
}

export function sum(values: readonly Money[]): Money {
  const [first] = values;
  if (!first) return zero();
  let total = first.amountCents;
  for (const value of values.slice(1)) {
    assertSameCurrency(first, value);
    total += value.amountCents;
  }
  return money(total, first.currency);
}

/**
 * Multiply by an integer factor — exact, no rounding. Quantity is an integer
 * number of shares, so `price × quantity` is always a whole number of centimes.
 */
export function multiply(a: Money, factor: bigint | number): Money {
  const f = typeof factor === "number" ? toBigIntFactor(factor) : factor;
  return money(a.amountCents * f, a.currency);
}

export function divide(a: Money, divisor: bigint | number, rounding = "half-up"): Money {
  const d = typeof divisor === "number" ? toBigIntFactor(divisor) : divisor;
  if (rounding !== "half-up") {
    throw new MoneyError(`Unsupported rounding mode "${rounding}". Only "half-up" is permitted.`);
  }
  return money(divideRoundHalfUp(a.amountCents, d), a.currency);
}

function toBigIntFactor(value: number): bigint {
  if (!Number.isInteger(value)) {
    throw new MoneyError(`Factor ${value} must be an integer.`);
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`Factor ${value} exceeds the safe integer range; pass a bigint.`);
  }
  return BigInt(value);
}

/**
 * Apply basis points (1 bp = 0.01%) with half-up rounding. Used by fee models.
 */
export function applyBasisPoints(a: Money, basisPoints: bigint | number): Money {
  const bps = typeof basisPoints === "number" ? toBigIntFactor(basisPoints) : basisPoints;
  return money(divideRoundHalfUp(a.amountCents * bps, 10_000n), a.currency);
}

/**
 * Split `total` into `parts` amounts whose sum is exactly `total`, using the
 * largest-remainder method. The remainder cents are distributed one each to the
 * earliest parts, so no centime is created or destroyed.
 */
export function allocate(total: Money, parts: number): Money[] {
  if (!Number.isInteger(parts) || parts < 0) {
    throw new MoneyError(`Cannot allocate money into ${parts} parts.`);
  }
  if (parts === 0) {
    if (total.amountCents === 0n) return [];
    throw new MoneyError("Cannot allocate a non-zero amount into zero parts.");
  }

  const divisor = BigInt(parts);
  const base = divideRoundHalfUp(total.amountCents, divisor);
  const remainder = total.amountCents - base * divisor; // |remainder| < divisor

  const result: Money[] = [];
  for (let index = 0; index < parts; index += 1) {
    const offset =
      index < Number(remainder < 0n ? -remainder : remainder) ? (remainder < 0n ? -1n : 1n) : 0n;
    result.push(money(base + offset, total.currency));
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* Comparison & inspection                                                     */
/* -------------------------------------------------------------------------- */

export function compare(a: Money, b: Money): -1 | 0 | 1 {
  assertSameCurrency(a, b);
  if (a.amountCents < b.amountCents) return -1;
  if (a.amountCents > b.amountCents) return 1;
  return 0;
}

export function equals(a: Money, b: Money): boolean {
  return compare(a, b) === 0;
}

export function isGreaterThan(a: Money, b: Money): boolean {
  return compare(a, b) > 0;
}

export function isGreaterThanOrEqual(a: Money, b: Money): boolean {
  return compare(a, b) >= 0;
}

export function isLessThan(a: Money, b: Money): boolean {
  return compare(a, b) < 0;
}

export function isLessThanOrEqual(a: Money, b: Money): boolean {
  return compare(a, b) <= 0;
}

export function min(a: Money, b: Money): Money {
  return compare(a, b) <= 0 ? a : b;
}

export function max(a: Money, b: Money): Money {
  return compare(a, b) >= 0 ? a : b;
}

export const isZero = (a: Money): boolean => a.amountCents === 0n;
export const isPositive = (a: Money): boolean => a.amountCents > 0n;
export const isNegative = (a: Money): boolean => a.amountCents < 0n;

/** Largest amount representable without overflowing the ledger's guard rails. */
export const MAX_MONEY: Money = money(MONEY_LIMITS.maxAbsCents);
export const MIN_MONEY: Money = money(MONEY_LIMITS.minAbsCents);

/* -------------------------------------------------------------------------- */
/* Percentages                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Percentage change from `base` to `value`, in basis points, half-up rounded.
 * Return type is basis points rather than a float so downstream formatting can
 * choose precision without the value having already lost it.
 */
export function percentageChangeBps(base: Money, value: Money): bigint {
  assertSameCurrency(base, value);
  if (isZero(base)) {
    throw new MoneyError("Percentage change is undefined for a zero base amount.");
  }
  return divideRoundHalfUp((value.amountCents - base.amountCents) * 10_000n, base.amountCents);
}

/* -------------------------------------------------------------------------- */
/* Validation schemas                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Zod schema for money arriving over HTTP. Parses decimal strings only, so a
 * JSON float can never become money without going through `fromMajorUnits`.
 */
export const moneyInputSchema = z
  .string()
  .regex(/^[+-]?\d+(\.\d{1,2})?$/, "must be a decimal amount with at most 2 fractional digits")
  .transform((value) => fromMajorUnits(value));

/** Schema for a `NUMERIC(20,2)` value coming back out of PostgreSQL. */
export const moneyDbSchema = z
  .union([z.string(), z.number().int(), z.bigint()])
  .transform((value) => fromDbNumeric(value));
