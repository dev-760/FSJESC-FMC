# DECISIONS.md

Architecture and stack decisions, alternatives considered, and rationale.
Newest last. Each entry is immutable once merged; supersede with a new entry.

---

## D1 — Cache Components (`cacheComponents: true`) is enabled

**Decision.** Keep the Next.js 16 scaffold defaults `cacheComponents: true` and `partialPrefetching: true`. Public content is served from `"use cache"` scopes with explicit `cacheLife`/`cacheTag`; request-bound data (session, portfolios, orders) is isolated behind `await connection()` inside `<Suspense>` boundaries; financial API responses are `Cache-Control: no-store`.

**Alternatives.**

1. `cacheComponents: false` (classic always-dynamic rendering). Simplest mental model, trivially compatible with any 2024-era blog post.
2. `experimental.dynamicIO` / `experimental.ppr` — **removed** in Next 16 (`HardDeprecatedConfigError`); not an option.
3. `unstable_cache` — still present but explicitly deprecated in favour of `use cache`.

**Rationale.** Option 1 is the only real alternative. It was rejected because the spec targets ISR for public content (§10) and `no-store` for financial responses, which is precisely the cache model Cache Components expresses natively, and because turning it off would require opting out of `partialPrefetching` as well (config validation throws). The cost is real and accepted: `cookies()`/`headers()`/`params` outside `<Suspense>` is a build-time error, and synchronous `Date.now()`/`Math.random()` during prerender is a hard build error. This is mitigated structurally — see D9 — rather than by disabling the flag.

**Consequence for the code.** Time is never read implicitly inside a component. It is always an explicit argument to a pure function, or is obtained from a request-bound helper.

---

## D2 — Integration tests skip when `TEST_DATABASE_URL` is absent

**Decision.** Docker is not installed on the development machine used for this build, so `docker compose up` cannot be exercised locally. Integration tests (`tests/integration/**`) are written in full against a real PostgreSQL database and run in CI with the `db`/`db-test` services. Locally they self-skip with a clear console notice when `TEST_DATABASE_URL` is not set, rather than failing or silently passing.

**Alternatives.**

1. Use an in-memory Postgres substitute (PGlite). Rejected: it diverges from real Postgres semantics (`NUMERIC` precision, transaction isolation, `SELECT … FOR UPDATE`), so a passing suite would not prove the real thing.
2. Skip writing integration tests. Rejected: violates §11.3 and would hide atomicity/double-spend bugs.
3. Ask the user to install Docker. Reasonable, but not blocking: the suite is written now and CI proves it.

**Rationale.** A test that cannot run locally must be _explicit_ about not running. A green local run that silently covered nothing would be a lie in the test report.

**Verification path.** `pnpm test:integration` locally with a Postgres reachable, or CI, which always provides one.

---

## D3 — `postgres` (postgres.js) driver, not `pg`

**Decision.** Use the `postgres` package as the Drizzle driver.

**Alternatives.** `pg` with `node-postgres`; `pg` pool via `@vercel/postgres` or `Neon serverless`.

**Rationale.** `postgres.js` is a single dependency with first-class tagged-template queries, returns `NUMERIC` as **strings** by default (which is what N1 needs — precision preserved, no float parse), supports serverless-friendly connection handling, and is the best-supported Drizzle driver for both local Docker and Supabase/hosted Postgres. `pg` parses `NUMERIC` into JS floats by default, which is an N1 hazard.

---

## D4 — `@node-rs/argon2` instead of the native `argon2` package

**Decision.** Hash and verify passwords with `@node-rs/argon2`.

**Alternatives.** `argon2` (node-gyp build), `bcrypt` (not Argon2; bcrypt truncates at 72 bytes), WebCrypto `PBKDF2` (built in, but Argon2id is the specified algorithm).

**Rationale.** `@node-rs/argon2` ships prebuilt native binaries for Windows/Linux/macOS, so no compiler toolchain is required on developer machines or in CI, and it implements Argon2id as specified. The pure-Rust binding is a drop-in.

**Parameters.** `memoryCost: 19456` KiB (19 MiB), `timeCost: 2`, `parallelism: 1` — the OWASP-recommended baseline for Argon2id. Configurable in `src/config/site.ts`.

---

## D5 — Auth.js v5 with database sessions, wrapped in an internal `AuthProvider`

**Decision.** Implement authentication with `next-auth@5` (v5 beta) using the Drizzle adapter, the credentials provider, and **database sessions**. All domain/application code depends on an internal `AuthProvider` interface (`signUp`, `logIn`, `logOut`, `getSession`, `requestPasswordReset`, `confirmPasswordReset`, `updateProfile`, `verifyEmail`), never on `next-auth` directly.

**Alternatives.**

1. Hand-rolled session system. Rejected: Auth.js handles the subtle parts (session rotation, CSRF on session cookies, cookie flags, adapter protocol) and is pinned by the spec.
2. JWT sessions. Rejected: **revocation** requires role changes (granting `MEMBER`, promoting to `EXECUTIVE`) to take effect immediately. With database sessions, a role change is visible on the next request because the session row is re-read. N3 is materially easier to satisfy this way.
3. Third-party hosted auth. Rejected: out of scope, and it would put student personal data outside the club's control (Law 09-08 posture, §8.7).

**Risk accepted.** `next-auth@5` is a beta. Mitigation: the `AuthProvider` seam (spec §7.3) means swapping the implementation later touches exactly one file plus the route handler, and no domain code. A failing build is caught by the Phase 4 gate.

---

## D6 — Tailwind CSS v4 with CSS-first tokens (`@theme`)

**Decision.** Use Tailwind v4 (already installed by the scaffold). Define the entire design system — colors, spacing, type scale, radii, shadows — as CSS custom properties in `src/app/globals.css` under `@theme`, with no `tailwind.config.js`.

**Alternatives.** Tailwind v3 with a JS config; CSS Modules + vanilla CSS.

**Rationale.** Tailwind v4 is the current stable major, its `@theme` block generates the same utilities as a v3 config while keeping tokens in one CSS file that can be read top-to-bottom, and it removes a JS/CSS duplication risk. Dark mode uses the `light-dark()` CSS function and a `data-theme` attribute on `<html>`, which keeps tokens in CSS rather than duplicating every value.

---

## D7 — Money is `{ amountCents: bigint; currency: "MAD" }`

**Decision.** Monetary values are integers of **centimes** held in `bigint`, wrapped in a branded `Money` type in `src/lib/money.ts`. Quantities are integers (no fractional shares). Prices in the domain are integer centimes too; the ×4-precision `NUMERIC(20,4)` columns exist to satisfy the §4.1 schema requirement and for average-price precision, and are converted through a lossless string representation at the boundary.

**Alternatives.**

1. Integer cents everywhere including DB. Cleaner, but deviates from the pinned schema (`NUMERIC(20,2)` / `NUMERIC(20,4)`).
2. Decimal.js / Prisma.Decimal in the domain. Rejected: adds a dependency to the pure domain layer and gives `bigint` the same guarantees with less machinery.
3. `number` with rounding helpers. **Rejected — violates N1.**

**Rationale.** `bigint` has exact arbitrary-width integer semantics, so sums of centimes are exact at any magnitude and no rounding is needed for addition/subtraction. Multiplication (`price × quantity`) is the only operation that can produce a fraction, and it is routed through an explicit, documented, half-up-rounding helper (`multiplyMoney`) rather than implicit float behaviour. `Money` is branded at the type level so a raw `bigint` cannot be passed where money is expected.

---

## D8 — Lazy limit-order matching, no background workers

**Decision.** Pending limit orders are matched **lazily**: any server touch of a portfolio (order placement, portfolio read, competition scoring) runs a matching pass that walks the deterministic price path from each order's `lastEvaluatedAt` to now, executing at the first crossing price with a correct `executed_at`.

**Alternatives.**

1. Background worker / cron sweeping orders every N seconds. Rejected: needs a separate process, is not available in every deployment target, and introduces timing nondeterminism.
2. Evaluate only against the current price. Rejected: a limit order could then fill at a price the market already passed, with the wrong timestamp — dishonest and untestable.

**Rationale.** The spec (§6.4) requires this. Because prices are a pure function of time (D-independent core design in §5.1), the matching pass is deterministic and replayable: the same `(seed, ticker, window)` always yields the same fills and timestamps, on any machine. No timers, no workers, and it is fully unit-testable.

---

## D9 — Time is always an explicit parameter (supports D1)

**Decision.** No component, server function, or repository calls `Date.now()` or `new Date()` to obtain "now" as a side effect of rendering. `now` is passed explicitly into domain and simulator functions. Only two helpers may read the clock — `getRequestTime()` (request-bound, used by route handlers, server actions, and application services) and the simulated market clock in `src/simulator/clock.ts`.

**Rationale.** This is required by Cache Components (D1): synchronous time reads during prerender are a hard build error, and a component that silently reads the clock produces different output in the prerendered shell than at request time. Making time explicit also makes the trading engine and market simulator pure (N10) and makes every financial calculation reproducible in tests.

---

## D10 — In-memory rate limiting, with a documented Redis replacement path

**Decision.** Rate limits (§8.3) are enforced by a token-bucket implementation in `src/infrastructure/rate-limit/`, keyed by IP and/or account, with limits read from `src/config/site.ts`. The interface (`RateLimiter`) is injectable so a Redis-backed implementation can be substituted for multi-instance deployments.

**Alternatives.** Redis/Upstash (needs an external account and credentials — not available); Postgres-backed counters (adds write load to the hot auth path and needs cleanup jobs).

**Rationale.** It satisfies the spec's functional requirement with zero external dependencies and is testable by injection. The known limitation — per-process state, so a multi-instance deployment multiplies the effective limit by the instance count — is stated in `SECURITY.md` rather than hidden.

---

## D11 — Hand-rolled accessible primitives on Radix, no shadcn CLI

**Decision.** Build the component library (`src/components/ui`) directly on Radix UI primitives plus `class-variance-authority`, `clsx`, and `tailwind-merge`, following shadcn-style composition but written in this repository.

**Rationale.** The shadcn CLI is a copy-in scaffolder, not a dependency; running it produces code that must then be reviewed line by line anyway. Writing the primitives directly keeps the design tokens, accessibility behaviour, and Banned-aesthetic constraints (§0.4) under explicit control and in version control. Same result, no unreviewed vendor code.

---

## D12 — Cursor-based pagination only

**Decision.** All list endpoints (orders, executions, transactions, leaderboards) use keyset/cursor pagination, default page size 20.

**Alternatives.** Offset pagination.

**Rationale.** Under offset pagination, rows inserted while a user pages (very likely — their own pending orders filling) shift page boundaries and cause duplicates and omissions. Keyset pagination over a stable, unique, monotonic sort key (`(created_at, id)`) is stable under concurrent writes, which matters for financial ledgers.

---

## D13 — Lead generation for the deterministic price model: FNV-1a + splitmix64

**Decision.** The market price model (§5.1) hashes `(seed, ticker, minuteBucket, streamLabel)` with FNV-1a (32-bit) and expands the digest through `splitmix64` to produce a uniform value in `[0, 1)`. Asset parameters (drift, volatility) come from `src/data/assets.ts`; sector correlation is a shared stream computed per `(seed, sector, minuteBucket)`.

**Alternatives.**

1. `Math.random()` — rejected, non-deterministic, untestable.
2. A cryptographic hash (SHA-256) — rejected: correct, but ~10× slower and no quality advantage for a non-adversarial simulation. FNV-1a + splitmix64 is adequate for statistical realism and trivially portable.
3. Mulberry32 alone — rejected: sequential seeds correlate across adjacent buckets, producing visible stair-stepping in charts. The hash-then-expand order removes that correlation.

**Rationale.** Pure, dependency-free, identical on every platform and Node version (all operations are on 32-bit integers via `Math.imul`, avoiding `*` on large integers which loses precision above 2⁵³). Documented in `MARKET_SIMULATION.md` with reproducibility tests asserting byte-identical output for a fixed seed.

---

## D14 — Packages marked `"private": true`, no `packageManager` drift

**Decision.** `package.json` keeps `"private": true` and pins `packageManager: "pnpm@12.9.1"`. The scaffold's `name` was regenerated to `fsjesc-fmc` (npm forbids capitals in package names).

**Rationale.** This is an application, not a library. Pinning the package manager enables Corepack enforcement and reproducible installs in CI.

---

## D15 — Unprerendered route parameters return HTTP 200 with the 404 page (known limitation)

**Decision.** Accept, document, and contain. A parameter that is not produced by `generateStaticParams` is rendered on demand; by the time `notFound()` runs, the response has already begun streaming, so the status is `200` even though the body is the platform's 404 page and the route declares `robots: noindex`.

**Measured.** `GET /events/no-such-event` and `GET /simulator/market/nope` both return `200` with the 404 body (`NEXT_HTTP_ERROR_FALLBACK;404` in the RSC payload, `robots: noindex, nofollow` in the metadata).

**Alternatives tried.**

1. `export const dynamicParams = false` — rejected at build time: `Route segment config "dynamicParams" is not compatible with nextConfig.cacheComponents`.
2. `export const ensureStatic = "navigation"` — accepted by the build but had no effect; the route stayed `◐ (Partial Prerender)` in the build output and the status stayed `200`.
3. Validate the parameter in `proxy.ts` and return a bare 404 — rejected: it produces an empty body, losing the 404 page's recovery links, and adds request-time work to every matching request for a two-route problem.

**Containment.** The body is a genuine 404 page with navigation; the metadata is `noindex, nofollow`; no event or instrument content is served for an unknown parameter. The end-to-end suite asserts the rendered content and the `noindex` metadata rather than the status code, so the behaviour is pinned even though the status is not.

**If this matters more than PPR.** Disabling `cacheComponents` restores a true 404 status, at the cost of losing static prerendering and `use cache` for the whole site. That trade is recorded here so it can be revisited deliberately rather than discovered later. Phase 5 moves events and instruments behind a database, at which point these routes stop being static parameter families and the question should be re-examined.

**Why it is recorded rather than hidden.** A 200 on a missing page is a real defect. Writing a test that asserts `200` and calling it correct would be worse than naming the limitation.
---

## D16 — The contact form is a no-JavaScript Server Action form, and a server rejection loses the draft

**Decision.** The contact form is a Server Component rendering `<form action={submitContactMessage}>` with native browser constraint validation left enabled. No Client Component, no `useActionState`. On success the action redirects to `?status=received`; on a validation failure it redirects to `?status=invalid&fields=…` and the page renders the errors.

**Measured.** `useActionState` adds ~32 KB gzip of React's form-action runtime to `/contact`, taking it from 190 KB to 222 KB and breaking the Part 10 budget of 200 KB initial JS. The framework floor for this stack is 190 KB, so there is roughly 10 KB of headroom on every public page. `scripts/perf-budget.mjs` measures this on demand rather than trusting a claim.

**Alternatives.**

1. `useActionState` Client Component — rejected: exceeds the budget, and the form stops working without JavaScript.
2. Echo the draft through an HttpOnly flash cookie and re-render it — rejected for now: it adds a signed-cookie round trip and a 4 KB size ceiling for a 4,000-character message. Recorded here as the upgrade path if draft preservation becomes a requirement.
3. Accept losing the draft on server rejection — **chosen.**

**Rationale.** With browser validation enabled, an empty required field, a malformed address, and a message under 30 characters are all blocked before a request is made. The server-side rejection path is therefore reached only when the browser and server constraint sets disagree — rare, and it still produces a correct, explained error message rather than a silent failure.

**Honest limitation.** A server-side rejection navigates away and does not restore what was typed. The end-to-end test asserts the guarantee that actually exists (the error is reported) rather than asserting draft preservation, which this design does not provide. The browser-constraint behaviour is asserted separately.

**Why this matters for later phases.** Any interactive surface on a public page costs against the same ~10 KB headroom. Phase 8's order ticket is the first surface that genuinely needs client state; it lives under `/simulator`, which is a separate code-split route and not measured against the public-page budget. That separation is deliberate.
