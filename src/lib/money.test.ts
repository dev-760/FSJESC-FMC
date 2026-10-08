import { describe, expect, it } from "vitest";
import {
  MoneyError,
  abs,
  add,
  allocate,
  applyBasisPoints,
  compare,
  divide,
  divideRoundHalfUp,
  equals,
  fromDbNumeric,
  fromMajorUnits,
  fromMajorUnitsRounded,
  fromNumber,
  isGreaterThan,
  isLessThan,
  isNegative,
  isZero,
  max,
  min,
  money,
  multiply,
  negate,
  percentageChangeBps,
  subtract,
  sum,
  toDbNumeric,
  toMajorUnitString,
  zero,
} from "@/lib/money";

/**
 * N1 — money precision. These tests are the contract for the ledger: if any of
 * them changes behaviour, historical records stop reconciling.
 */

describe("construction", () => {
  it("stores amounts as integer centimes", () => {
    expect(money(12_345n).amountCents).toBe(12_345n);
    expect(money(1234).amountCents).toBe(1234n);
  });

  it("defaults to MAD and rejects other currencies", () => {
    expect(money(1n).currency).toBe("MAD");
    expect(() => money(1n, "EUR" as "MAD")).toThrow(MoneyError);
  });

  it("refuses to build money from a non-integer number", () => {
    expect(() => money(10.5)).toThrow(/non-integer/);
    expect(() => money(Number.NaN)).toThrow(MoneyError);
  });

  it("refuses numbers beyond the safe integer range", () => {
    expect(() => money(Number.MAX_SAFE_INTEGER + 2)).toThrow(/safe integer/);
  });

  it("enforces the ledger column range", () => {
    expect(() => money(10n ** 18n)).toThrow(/outside the supported range/);
    expect(money(10n ** 17n - 1n).amountCents).toBe(10n ** 17n - 1n);
  });

  it("supports values far beyond IEEE-754 exactness", () => {
    // 2^53 + 1 is not representable as a double; as a bigint it is exact.
    const huge = money(9_007_199_254_740_993n);
    expect(add(huge, money(1n)).amountCents).toBe(9_007_199_254_740_994n);
    expect(add(huge, money(1n)).amountCents).not.toBe(9_007_199_254_740_992n);
  });
});

describe("parsing decimal strings", () => {
  it("parses whole and fractional major units", () => {
    expect(fromMajorUnits("0").amountCents).toBe(0n);
    expect(fromMajorUnits("1234.56").amountCents).toBe(123_456n);
    expect(fromMajorUnits("-1234.56").amountCents).toBe(-123_456n);
    expect(fromMajorUnits(".5").amountCents).toBe(50n);
    expect(fromMajorUnits("7").amountCents).toBe(700n);
    expect(fromMajorUnits(" 12.34 ").amountCents).toBe(1_234n);
  });

  it("is exact for values that floats cannot represent", () => {
    // In binary floating point, 0.1 + 0.2 === 0.30000000000000004.
    expect(add(fromMajorUnits("0.1"), fromMajorUnits("0.2")).amountCents).toBe(30n);
    // `parseFloat("90071992547409.93")` is not exactly representable; the string
    // parser is.
    expect(fromMajorUnits("90071992547409.93").amountCents).toBe(9_007_199_254_740_993n);
  });

  it("rejects malformed input", () => {
    expect(() => fromMajorUnits("")).toThrow(MoneyError);
    expect(() => fromMajorUnits("abc")).toThrow(/Cannot parse/);
    expect(() => fromMajorUnits("1.2.3")).toThrow(MoneyError);
    expect(() => fromMajorUnits("1e5")).toThrow(MoneyError);
    expect(() => fromMajorUnits("12,34")).toThrow(MoneyError);
  });

  it("rejects more than two fractional digits rather than rounding silently", () => {
    expect(() => fromMajorUnits("12.345")).toThrow(/fractional digits/);
    expect(fromMajorUnitsRounded("12.345").amountCents).toBe(1_235n); // half-up
    expect(fromMajorUnitsRounded("12.344").amountCents).toBe(1_234n);
    expect(fromMajorUnitsRounded("-12.345").amountCents).toBe(-1_235n);
    expect(fromMajorUnitsRounded("12.3").amountCents).toBe(1_230n);
  });

  it("converts numbers through an explicit rounding step", () => {
    expect(fromNumber(12.34).amountCents).toBe(1_234n);
    expect(fromNumber(-0.005).amountCents).toBe(-1n); // half-up, away from zero
    expect(() => fromNumber(Number.POSITIVE_INFINITY)).toThrow(MoneyError);
  });
});

describe("serialisation", () => {
  it("round-trips through the canonical string form", () => {
    for (const value of ["0.00", "0.01", "-0.01", "1234.56", "-1234.56", "1000000.00"]) {
      expect(toMajorUnitString(fromMajorUnits(value))).toBe(value);
    }
  });

  it("produces a NUMERIC-compatible value", () => {
    expect(toDbNumeric(money(123_456n))).toBe("1234.56");
    expect(toDbNumeric(zero())).toBe("0.00");
  });

  it("reads NUMERIC columns returned as strings", () => {
    expect(fromDbNumeric("1234.56").amountCents).toBe(123_456n);
    expect(fromDbNumeric(123456n).amountCents).toBe(123_456n);
    expect(fromDbNumeric(123456).amountCents).toBe(123_456n);
  });

  it("refuses to read money from a float, which would mean precision was already lost", () => {
    expect(() => fromDbNumeric(1234.56)).toThrow(/float/);
  });
});

describe("addition and subtraction", () => {
  it("is exact across many operations", () => {
    let total = zero();
    for (let index = 0; index < 1000; index += 1) {
      total = add(total, money(1n));
    }
    expect(total.amountCents).toBe(1_000n);
  });

  it("handles negative balances", () => {
    expect(subtract(money(100n), money(250n)).amountCents).toBe(-150n);
    expect(add(money(-100n), money(40n)).amountCents).toBe(-60n);
  });

  it("enforces currency agreement", () => {
    const other = { amountCents: 1n, currency: "USD" } as unknown as ReturnType<typeof money>;
    expect(() => add(money(1n), other)).toThrow(/Currency mismatch/);
  });

  it("sums a list and treats an empty list as zero", () => {
    expect(sum([money(100n), money(-40n), money(7n)]).amountCents).toBe(67n);
    expect(sum([]).amountCents).toBe(0n);
    expect(sum([money(1n)]).amountCents).toBe(1n);
  });

  it("negates and takes absolute value", () => {
    expect(negate(money(500n)).amountCents).toBe(-500n);
    expect(abs(money(-500n)).amountCents).toBe(500n);
    expect(abs(money(500n)).amountCents).toBe(500n);
  });
});

describe("rounding", () => {
  it("rounds halves away from zero", () => {
    expect(divideRoundHalfUp(5n, 2n)).toBe(3n);
    expect(divideRoundHalfUp(-5n, 2n)).toBe(-3n);
    expect(divideRoundHalfUp(4n, 2n)).toBe(2n);
    expect(divideRoundHalfUp(1n, 3n)).toBe(0n);
    expect(divideRoundHalfUp(2n, 3n)).toBe(1n);
  });

  it("normalises a negative denominator", () => {
    expect(divideRoundHalfUp(7n, -2n)).toBe(-4n);
  });

  it("refuses division by zero", () => {
    expect(() => divideRoundHalfUp(1n, 0n)).toThrow(MoneyError);
    expect(() => divide(money(1n), 0n)).toThrow(MoneyError);
  });

  it("rejects unsupported rounding modes", () => {
    // Half-up is the only permitted rule (DECISIONS.md D7), so any other mode is
    // rejected rather than silently applied.
    const badMode = "bankers" as Parameters<typeof divide>[2];
    expect(() => divide(money(10n), 3n, badMode)).toThrow(/rounding mode/);
  });

  it("divides money with half-up rounding", () => {
    expect(divide(money(1000n), 3n).amountCents).toBe(333n);
    expect(divide(money(1001n), 3n).amountCents).toBe(334n);
  });
});

describe("multiplication", () => {
  it("is exact for integer share quantities", () => {
    // 123.45 MAD × 7 shares = 864.15 MAD exactly.
    expect(multiply(fromMajorUnits("123.45"), 7n).amountCents).toBe(86_415n);
    expect(toMajorUnitString(multiply(fromMajorUnits("123.45"), 7n))).toBe("864.15");
  });

  it("accepts safe integers as factors", () => {
    expect(multiply(money(100n), 3).amountCents).toBe(300n);
  });

  it("rejects fractional and unsafe factors", () => {
    expect(() => multiply(money(100n), 1.5)).toThrow(/must be an integer/);
    expect(() => multiply(money(100n), Number.MAX_SAFE_INTEGER + 2)).toThrow(/safe integer/);
  });
});

describe("basis points", () => {
  it("applies fees with half-up rounding", () => {
    // 0.10% of 10,000.00 MAD = 10.00 MAD
    expect(toMajorUnitString(applyBasisPoints(fromMajorUnits("10000"), 10n))).toBe("10.00");
    // 0.10% of 5.00 MAD = 0.005 MAD → rounds up to 0.01 MAD
    expect(applyBasisPoints(fromMajorUnits("5.00"), 10n).amountCents).toBe(1n);
    // 0.10% of 4.99 MAD = 0.00499 MAD → rounds down to 0.00 MAD, so a tiny trade
    // is free rather than charged a fraction of a centime.
    expect(applyBasisPoints(fromMajorUnits("4.99"), 10n).amountCents).toBe(0n);
  });

  it("is zero for a zero-rate model", () => {
    expect(applyBasisPoints(fromMajorUnits("123456.78"), 0n).amountCents).toBe(0n);
  });
});

describe("allocation", () => {
  it("never creates or destroys a centime", () => {
    const parts = allocate(money(100n), 3);
    expect(parts.map((part) => part.amountCents)).toEqual([34n, 33n, 33n]);
    expect(sum(parts).amountCents).toBe(100n);
  });

  it("splits evenly when possible", () => {
    expect(allocate(money(900n), 3).map((p) => p.amountCents)).toEqual([300n, 300n, 300n]);
  });

  it("distributes a negative remainder to the earliest parts", () => {
    const parts = allocate(money(-100n), 3);
    expect(parts.map((part) => part.amountCents)).toEqual([-34n, -33n, -33n]);
    expect(sum(parts).amountCents).toBe(-100n);
  });

  it("handles degenerate inputs", () => {
    expect(allocate(money(0n), 3).map((p) => p.amountCents)).toEqual([0n, 0n, 0n]);
    expect(allocate(money(0n), 0)).toEqual([]);
    expect(() => allocate(money(1n), 0)).toThrow(/non-zero amount/);
    expect(() => allocate(money(1n), -2)).toThrow(MoneyError);
    expect(() => allocate(money(1n), 1.5)).toThrow(MoneyError);
  });

  it("keeps the invariant over many random-ish splits", () => {
    for (let total = 0n; total <= 40n; total += 1n) {
      for (let parts = 1; parts <= 12; parts += 1) {
        const allocated = allocate(money(total), parts);
        expect(allocated).toHaveLength(parts);
        expect(sum(allocated).amountCents).toBe(total);
      }
    }
  });
});

describe("comparison", () => {
  it("orders amounts", () => {
    expect(compare(money(1n), money(2n))).toBe(-1);
    expect(compare(money(2n), money(1n))).toBe(1);
    expect(compare(money(2n), money(2n))).toBe(0);
    expect(isGreaterThan(money(2n), money(1n))).toBe(true);
    expect(isLessThan(money(1n), money(2n))).toBe(true);
    expect(equals(money(2n), money(2n))).toBe(true);
    expect(min(money(2n), money(1n)).amountCents).toBe(1n);
    expect(max(money(2n), money(1n)).amountCents).toBe(2n);
  });

  it("classifies sign", () => {
    expect(isZero(zero())).toBe(true);
    expect(isNegative(money(-1n))).toBe(true);
    expect(isZero(money(1n))).toBe(false);
  });
});

describe("percentage change", () => {
  it("returns basis points", () => {
    // 10,000 → 10,250 is +2.50% = +250 bps
    expect(percentageChangeBps(fromMajorUnits("10000"), fromMajorUnits("10250"))).toBe(250n);
    expect(percentageChangeBps(fromMajorUnits("10000"), fromMajorUnits("10000"))).toBe(0n);
  });

  it("is relative to the base, so a fall is larger than the equivalent rise", () => {
    // 10,250 → 10,000 is −250.00 / 10,250.00 = −2.44%, not −2.50%.
    expect(percentageChangeBps(fromMajorUnits("10250"), fromMajorUnits("10000"))).toBe(-244n);
  });

  it("rounds half-up", () => {
    // 40.00 → 40.01 is +0.025% = +2.5 bps → 3 bps
    expect(percentageChangeBps(fromMajorUnits("40.00"), fromMajorUnits("40.01"))).toBe(3n);
    expect(percentageChangeBps(fromMajorUnits("40.00"), fromMajorUnits("39.99"))).toBe(-3n);
  });

  it("is undefined for a zero base", () => {
    expect(() => percentageChangeBps(zero(), money(100n))).toThrow(/zero base/);
  });
});

describe("one centime from the balance boundary (Part 11.2)", () => {
  it("distinguishes exact balance from one centime short", () => {
    const balance = fromMajorUnits("1000.00");
    const exactCost = fromMajorUnits("1000.00");
    const oneCentimeMore = fromMajorUnits("1000.01");

    expect(isGreaterThanOrEqualSentinel(balance, exactCost)).toBe(true);
    expect(isGreaterThanOrEqualSentinel(balance, oneCentimeMore)).toBe(false);
  });
});

/** Local helper mirroring the affordability check used by order validation. */
function isGreaterThanOrEqualSentinel(
  available: ReturnType<typeof money>,
  required: ReturnType<typeof money>,
): boolean {
  return compare(available, required) >= 0;
}
