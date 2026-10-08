/**
 * Capture the review screenshots for a design pass.
 *
 * One batched round: every surface, at both viewports, in a single run. Screenshot
 * trips are the most expensive part of a design review, so this exists to make
 * "look at it once" the default.
 *
 *   pnpm build
 *   pnpm start --port 3399
 *   BASE_URL=http://127.0.0.1:3399 node scripts/capture-review.mjs
 *
 * Writes to `.impeccable/review/<OUT_DIR>/`. Pass a narrower ROUTES when only some
 * surfaces changed:
 *
 *   ROUTES=home,market OUT_DIR=after-fix node scripts/capture-review.mjs
 *
 * Motion is settled before every capture: an element hidden by animation timing
 * reads as a missing element, and "fixing" it would turn a working animation into
 * a regression.
 */
import { mkdir } from "node:fs/promises";
import { chromium, devices } from "@playwright/test";

const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");
const OUT_DIR = process.env.OUT_DIR ?? "review";

const ALL_ROUTES = {
  home: "/",
  about: "/about",
  events: "/events",
  eventDetail: "/events/reading-order-statements",
  team: "/team",
  contact: "/contact",
  education: "/education",
  market: "/simulator/market",
  instrument: "/simulator/market/mari",
};

/** The width the user actually sees, if the harness reported one. */
const USER_WIDTH = process.env.USER_WIDTH ? Number(process.env.USER_WIDTH) : null;

const selected = process.env.ROUTES
  ? Object.fromEntries(
      process.env.ROUTES.split(",")
        .map((key) => key.trim())
        .filter((key) => key in ALL_ROUTES)
        .map((key) => [key, ALL_ROUTES[key]]),
    )
  : ALL_ROUTES;

const outDir = `.impeccable/review/${OUT_DIR}`;
await mkdir(outDir, { recursive: true });

const viewports = [
  ["desktop", { viewport: { width: 1440, height: 1000 } }],
  ["mobile", devices["Pixel 7"]],
  ...(USER_WIDTH ? [["user", { viewport: { width: USER_WIDTH, height: 1000 } }]] : []),
];

const browser = await chromium.launch();

for (const [label, options] of viewports) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.emulateMedia({ reducedMotion: "reduce" });

  for (const [name, route] of Object.entries(selected)) {
    const response = await page.goto(`${BASE_URL}${route}`, { waitUntil: "load" });
    if (!response || !response.ok()) {
      console.warn(`skip ${route}: responded ${response?.status() ?? "with no response"}`);
      continue;
    }
    await page.waitForTimeout(500);
    const file = `${outDir}/${label}-${name}.png`;
    await page.screenshot({ path: file, fullPage: true });
    console.log(`captured ${file}`);
  }

  await context.close();
}

await browser.close();
console.log(`\nReview round complete: ${outDir}`);
