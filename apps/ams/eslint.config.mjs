import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * AMS lint configuration.
 *
 * AMS is a separate Next app with its own dependencies, so it carries its own
 * flat config rather than importing the landing app's — ESLint resolves config
 * and its imports relative to this directory, and the two apps do not share
 * node_modules.
 */
export default defineConfig([
  ...nextVitals,
  ...nextTs,

  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "**/node_modules/**",
  ]),
]);