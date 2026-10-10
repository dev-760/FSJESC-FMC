/**
 * Money conversion utilities (Part 4.1, N1, D3).
 *
 * Converts between NUMERIC column values (strings) and bigint centimes in the
 * domain layer. This is the boundary where precision is preserved.
 */

/**
 * Convert a NUMERIC string to bigint centimes.
 *
 * Input: "100000.00" → Output: 10000000n (100,000.00 MAD in centimes)
 *
 * The postgres.js driver returns NUMERIC as strings by default, which is what
 * makes this conversion lossless (D3).
 */
export function numericStringToCents(value: string): bigint {
  // Remove any commas, split on decimal point
  const cleaned = value.replace(/,/g, "");
  const [integerPart, decimalPart] = cleaned.split(".");

  if (!integerPart) {
    throw new Error(`Invalid numeric value: ${value}`);
  }

  // Parse integer part
  const integerCents = BigInt(integerPart) * 100n;

  // Parse decimal part (should be 2 digits for money, 4 for prices)
  if (decimalPart) {
    // Pad or truncate to 2 digits for money (for price precision, caller handles it)
    const padded = decimalPart.padEnd(2, "0").slice(0, 2);
    const decimalCents = BigInt(padded);
    return integerCents + decimalCents;
  }

  return integerCents;
}

/**
 * Convert bigint centimes to a NUMERIC string.
 *
 * Input: 10000000n → Output: "100000.00"
 */
export function centsToNumericString(cents: bigint): string {
  const absCents = cents < 0n ? -cents : cents;
  const integerPart = (absCents / 100n).toString();
  const decimalPart = (absCents % 100n).toString().padStart(2, "0");
  const sign = cents < 0n ? "-" : "";
  return `${sign}${integerPart}.${decimalPart}`;
}

/**
 * Convert a NUMERIC string with 4 decimal places to bigint centimes.
 *
 * Used for average price precision (NUMERIC(20,4)).
 * Input: "12345.6789" → Output: 1234568n (rounded to nearest centime)
 */
export function priceStringToCents(value: string): bigint {
  const cleaned = value.replace(/,/g, "");
  const [integerPart, decimalPart] = cleaned.split(".");

  if (!integerPart) {
    throw new Error(`Invalid price value: ${value}`);
  }

  const integerCents = BigInt(integerPart) * 100n;

  if (decimalPart) {
    // Take first 4 decimal places, round to 2
    const padded = decimalPart.padEnd(4, "0").slice(0, 4);
    const tenThousandths = BigInt(padded);
    // Round: if last 2 digits >= 50, round up
    const remainder = tenThousandths % 100n;
    const rounded =
      remainder >= 50n ? tenThousandths + 100n - remainder : tenThousandths - remainder;
    const decimalCents = rounded / 100n;
    return integerCents + decimalCents;
  }

  return integerCents;
}

/**
 * Convert bigint centimes to a NUMERIC string with 4 decimal places.
 *
 * Used for average price storage.
 * Input: 1234568n → Output: "12345.6800"
 */
export function centsToPriceString(cents: bigint): string {
  const absCents = cents < 0n ? -cents : cents;
  const integerPart = (absCents / 100n).toString();
  const decimalPart = (absCents % 100n).toString().padStart(2, "0");
  const sign = cents < 0n ? "-" : "";
  return `${sign}${integerPart}.${decimalPart}00`;
}
