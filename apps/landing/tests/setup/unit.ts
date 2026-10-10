/**
 * Unit-test environment.
 *
 * Deliberately minimal: the domain and simulator layers are pure TypeScript, so
 * unit tests need no database, no DOM, and no mocked framework. The only global
 * assertion installed here is the `assertBigInt` helper used by money tests.
 */
import { expect } from "vitest";

/** Assert that a value is a `bigint`, with a useful failure message. */
export function assertBigInt(value: unknown): asserts value is bigint {
  expect(typeof value).toBe("bigint");
}

export {};
