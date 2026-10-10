import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT ?? 3210);
const baseURL = `http://127.0.0.1:${PORT}`;

/**
 * End-to-end suite (Part 11.4).
 *
 * Runs against a production build rather than the dev server, so the tests
 * exercise the same bundling, prerendering and cache behaviour a visitor gets.
 *
 * `E2E_SKIP_WEBSERVER=1` reuses an already-running server, which is how the
 * suite is driven during local development against a server on a chosen port.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["html", { open: "never" }], ["list"]] : [["list"]],
  timeout: 45_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      // The simulator must remain fully usable on a phone (Part 9.4): tables
      // reflow into cards rather than shrinking. Verified on a real viewport.
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],

  ...(process.env.E2E_SKIP_WEBSERVER
    ? {}
    : {
        webServer: {
          command: `pnpm build && pnpm start --port ${PORT}`,
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 300_000,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            NODE_ENV: "production",
            NEXT_PUBLIC_APP_URL: baseURL,
          },
        },
      }),
});
