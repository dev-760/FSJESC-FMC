import { defineConfig } from "vitest/config";

/**
 * Three projects (Part 11):
 *
 *   `unit`        pure domain, simulator engine, and application services. No
 *                 database, no network, fast, runs on every commit.
 *   `integration` anything that touches PostgreSQL. Skips itself with a visible
 *                 notice when TEST_DATABASE_URL is absent, because pretending to
 *                 pass is worse than admitting it did not run (DECISIONS.md D2).
 *   `component`   Client Component rendering and interaction, in jsdom.
 *
 * The coverage gate (Part 11.6) is configured at the root so it applies to every
 * project, with `include` restricted to the two directories the spec requires
 * (`domain/` and `simulator/engine/`) at 90% lines and branches.
 *
 * Path aliases resolve through Vite's native `resolve.tsconfigPaths`, which reads
 * the same `@/*` mapping as `tsconfig.json`.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov", "json-summary"],
      reportsDirectory: "./coverage",
      include: ["src/domain/**/*.ts", "src/simulator/engine/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/index.ts", "**/*.d.ts"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
    projects: [
      {
        test: {
          name: "unit",
          environment: "node",
          globals: false,
          include: ["src/**/*.{test,spec}.ts", "tests/unit/**/*.{test,spec}.ts"],
          exclude: ["node_modules", ".next", "tests/integration/**", "tests/e2e/**"],
          setupFiles: ["tests/setup/unit.ts"],
        },
      },
      {
        test: {
          name: "integration",
          environment: "node",
          globals: false,
          include: ["tests/integration/**/*.{test,spec}.ts"],
          exclude: ["node_modules", ".next"],
          setupFiles: ["tests/setup/integration.ts"],
          // Transactions and concurrency tests are genuinely slow; serialise them
          // so a contention assertion is not polluted by a parallel suite.
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
      {
        test: {
          name: "component",
          environment: "jsdom",
          globals: false,
          include: ["src/**/*.test.tsx", "tests/component/**/*.{test,spec}.tsx"],
          setupFiles: ["tests/setup/component.ts"],
        },
      },
    ],
  },
});
