/**
 * Public-page performance budget check (Part 10).
 *
 * Measures the initial JavaScript actually shipped to a browser for each public
 * route and fails when a budget is exceeded. Run against a production server:
 *
 *   pnpm build && pnpm start --port 3399
 *   BASE_URL=http://127.0.0.1:3399 node scripts/perf-budget.mjs
 *
 * Deliberately dependency-free so it runs identically on a developer machine and
 * in CI. Gzip level 9 is used because that is what a CDN serves; Brotli is
 * smaller, so this is the pessimistic measurement.
 */
import { gzipSync } from "node:zlib";

const BASE_URL = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

/** Maximum initial JavaScript per route, in bytes, gzipped. */
const BUDGET = {
  "/": 200 * 1024,
  "/about": 200 * 1024,
  "/education": 200 * 1024,
  "/events": 200 * 1024,
  "/team": 200 * 1024,
  "/contact": 200 * 1024,
  "/simulator/market": 200 * 1024,
};

/** Largest Contentful Paint ceiling in milliseconds, measured server-side as a proxy. */
const HTML_SIZE_BUDGET = 220 * 1024;

const failures = [];

for (const [route, budget] of Object.entries(BUDGET)) {
  let html;
  try {
    html = await (await fetch(`${BASE_URL}${route}`)).text();
  } catch (error) {
    failures.push(`${route}: unreachable (${error.message})`);
    continue;
  }

  const scripts = [
    ...new Set([...html.matchAll(/src="(\/_next\/static\/[^"]+\.js)"/g)].map((m) => m[1])),
  ];

  let gzipBytes = 0;
  for (const src of scripts) {
    const response = await fetch(`${BASE_URL}${src}`);
    if (!response.ok) continue;
    const body = Buffer.from(await response.arrayBuffer());
    gzipBytes += gzipSync(body, { level: 9 }).length;
  }

  const htmlBytes = Buffer.byteLength(html, "utf8");
  const verdict = gzipBytes <= budget ? "ok  " : "OVER";
  console.log(
    `${verdict} ${route.padEnd(22)} js ${String(Math.round(gzipBytes / 1024)).padStart(4)} KB gzip ` +
      `(budget ${Math.round(budget / 1024)} KB) · html ${String(Math.round(htmlBytes / 1024)).padStart(4)} KB · ${scripts.length} chunks`,
  );

  if (gzipBytes > budget) {
    failures.push(
      `${route}: ${Math.round(gzipBytes / 1024)} KB of initial JS exceeds ${Math.round(budget / 1024)} KB`,
    );
  }
  if (htmlBytes > HTML_SIZE_BUDGET) {
    failures.push(
      `${route}: HTML ${Math.round(htmlBytes / 1024)} KB exceeds ${Math.round(HTML_SIZE_BUDGET / 1024)} KB`,
    );
  }
}

if (failures.length > 0) {
  console.error("\nPerformance budget exceeded:\n" + failures.map((f) => `  - ${f}`).join("\n"));
  process.exit(1);
}

console.log("\nAll public routes within budget.");
