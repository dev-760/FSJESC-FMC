import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * Simulator lint configuration.
 *
 * Deliberately narrower than the landing app's: this app declares neither
 * `typescript-eslint` nor `prettier`, so it cannot use those plugins. The
 * Next-provided presets cover the same rules that actually matter here — hooks,
 * a11y, and type-aware React checks.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "**/node_modules/**"]),
]);