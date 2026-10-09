/**
 * Deterministic pseudo-randomness.
 *
 * The price model must produce the same price on every machine for a given
 * `(seed, symbol, time)`, so `Math.random()` is unusable anywhere near it (Part 5.1).
 *
 * FNV-1a followed by splitmix64 (DECISIONS.md D13). Both are trivial to
 * reimplement in another language, which matters because a student should be able
 * to verify a price from the specification rather than trust this file.
 *
 * Every operation is on 32-bit integers via `Math.imul`, so nothing here depends
 * on `*` on large values, which would lose precision above 2^53.
 */

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a over the UTF-16 code units of each part, separated so keys cannot collide. */
export function hash32(...parts: readonly string[]): number {
  let hash = FNV_OFFSET;
  for (const part of parts) {
    for (let index = 0; index < part.length; index += 1) {
      hash ^= part.charCodeAt(index);
      hash = Math.imul(hash, FNV_PRIME);
    }
    // A separator byte that cannot appear in a symbol or a timestamp.
    hash ^= 0x1f;
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

/** splitmix64 finaliser: decorrelates sequential inputs, which FNV alone does not. */
function mix32(input: number): number {
  let z = (input + 0x9e3779b9) >>> 0;
  z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
  z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
  return (z ^ (z >>> 15)) >>> 0;
}

/**
 * A uniform value in `[0, 1)` derived from the given parts.
 *
 * Three decimals of resolution rather than full float precision: it is enough for
 * a price model, and it makes every value reproducible by hand from the spec.
 */
export function uniform(...parts: readonly string[]): number {
  return (mix32(hash32(...parts)) % 1_000_000) / 1_000_000;
}

/**
 * A standard normal deviate from two uniforms, via Box–Muller.
 *
 * `Math.cos` is used rather than `Math.sin` purely so the two outputs are the same
 * pair every time on every engine.
 */
export function normal(...parts: readonly string[]): number {
  const u1 = Math.max(uniform(...parts, "u1"), 1e-9);
  const u2 = uniform(...parts, "u2");
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** A uniform integer in `[min, max]`, inclusive. */
export function uniformInt(min: number, max: number, ...parts: readonly string[]): number {
  if (max < min) throw new RangeError("max must be >= min");
  return min + (mix32(hash32(...parts)) % (max - min + 1));
}
