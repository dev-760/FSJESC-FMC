# PLAN.md — FSJESC Financial Markets Club Platform

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (see HANDOFF.md)

Product position: **educational financial-education + paper-trading simulation platform**.
Simulated market. MAD base currency. No real money. Institutional, analytical, educational.

---

## Non-negotiables (tracked continuously)

- [ ] **N1** Money precision — `bigint` minor units (centimes) wrapped in `Money`; `NUMERIC(20,2)` money / `NUMERIC(20,4)` prices in DB; convert only at boundaries.
- [ ] **N2** Server authority — client is request + view only.
- [ ] **N3** Server-side authorization — role + ownership verified server-side on every protected operation.
- [ ] **N4** Atomicity — every financial mutation is one DB transaction, full rollback on failure.
- [ ] **N5** Idempotency — order submission and money-moving mutations accept idempotency keys.
- [ ] **N6** Auditability — immutable `transactions` ledger + `audit_log`; no silent mutation/deletion.
- [ ] **N7** Runtime validation — Zod on all external input, server-side.
- [ ] **N8** Honesty — everything labeled as simulation; no fabricated data sources or integrations.
- [ ] **N9** Secret hygiene — server-only env; `HttpOnly; Secure; SameSite` cookies.
- [ ] **N10** Domain independence — `domain/` + `simulator/` are pure TypeScript (no React/browser/ORM imports).

---

## Phase checklist

### Phase 0 — Repository & planning

- [x] Inspect repository (empty → greenfield), record tooling availability
- [x] `git init` on `main`
- [x] Scaffolding moved into repo root
- [x] `PLAN.md`, `DECISIONS.md`, `PROGRESS.md`
- [x] Pin dependency set verified against registry

### Phase 1 — Foundation

Exit: build + typecheck + lint green; CI green.

- [ ] Next.js 16 App Router + TypeScript strict (`src/`)
- [ ] `tsconfig` hardening: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`; `any` banned by lint
- [ ] Tailwind CSS v4 design tokens (`@theme`), IBM Plex Sans + Mono via `next/font`
- [ ] Semantic color tokens (positive/negative/warning/neutral/information), light + dark themes, tabular numerals
- [ ] ESLint 9 flat config (`next`, `typescript-eslint`, `jsx-a11y`, `no-explicit-any`, `import` boundaries), Prettier
- [ ] `src/config/env.ts` Zod-validated env (fail fast), `.env.example`
- [ ] `src/config/site.ts`, `src/config/feature-flags.ts`
- [ ] `src/lib/` primitives: `money.ts`, `format.ts`, `errors.ts`, `pagination.ts`, `result.ts`
- [ ] `docker-compose.yml` (`db`, `db-test`)
- [ ] GitHub Actions CI (install → typecheck → lint → unit+integration w/ Postgres → build)
- [ ] Vitest + Playwright scaffolding, coverage gate for `domain/` + `simulator/engine/`
- [ ] Error/not-found/loading conventions, `proxy.ts` skeleton

### Phase 2 — Public website

Exit: all routes responsive; Lighthouse ≥ 90; metadata present.

- [ ] Design system primitives: Button, Card, Badge, Table, Input, Label, Dialog, Tabs, Select, Toast, Skeleton, EmptyState
- [ ] Layout: header/nav (accessible, keyboard), footer, skip-to-content, theme switcher
- [ ] `/` homepage in mandated section order + CTAs
- [ ] `/about`, `/team`, `/contact`, `/events`, `/events/[slug]`
- [ ] DISC-1 banner component, simulation labelling everywhere
- [ ] Metadata + Open Graph, canonical URLs, sitemap, robots
- [ ] `noindex` on simulator/dashboard/admin

### Phase 3 — Education center

Exit: 20 topics render sanitized with TOC.

- [ ] Markdown pipeline: gray-matter → remark → rehype (slug, sanitize, autolink headings) → HTML
- [ ] Frontmatter schema validated with Zod
- [ ] 20 starter topics (accurate, concise, Moroccan context, no recommendations)
- [ ] `/education`, `/education/topics`, `/education/topics/[slug]`
- [ ] TOC, categories, reading time, related topics, DISC-2 footer
- [ ] XSS payload tests

### Phase 4 — Authentication

Exit: auth e2e green; cookie flags verified; RBAC server-side.

- [ ] `AuthProvider` interface + Auth.js v5 implementation (credentials, database sessions, argon2id)
- [ ] Flows: signUp, logIn, logOut, getSession, requestPasswordReset, confirmPasswordReset, updateProfile, email verification
- [ ] Password policy ≥ 12 chars; hashed single-use expiring tokens
- [ ] `MailProvider` + `ConsoleMailProvider`
- [ ] Protected routes (DAL), role gates, `SESSION_EXPIRED` handling
- [ ] Rate limiting (in-memory, configurable)
- [ ] Cookie flags asserted in tests

### Phase 5 — Domain + database

Exit: migrations + seed run clean; repository tests pass.

- [ ] Drizzle schema (all §4.2 tables, constraints, indexes)
- [ ] Migrations + drizzle-kit config
- [ ] Repositories (users, profiles, portfolios, orders, executions, transactions, assets, competitions, events, audit, idempotency)
- [ ] `Money` ↔ DB numeric conversion at boundaries
- [ ] Seed: demo users per role, 8 assets, sample events, ≥ 3 articles, active competition, demo portfolio with order history
- [ ] Seed guard: refuse `NODE_ENV=production` unless `SEED_DEMO=true`

### Phase 6 — Trading engine (pure)

Exit: ≥ 90% coverage on `domain/` + `simulator/engine/`; §11.1–11.2 green; no UI connected.

- [ ] `validateOrder`, `placeOrder`, `executeMarketOrder`, `evaluateLimitOrder`, `cancelOrder`
- [ ] `calculatePosition`, `calculateAveragePrice`, `calculatePortfolioValue`, `calculatePnL`
- [ ] Slippage model (deterministic, documented), `FeeModel` injection
- [ ] Order lifecycle incl. partial fills, expiry, cancellation rules
- [ ] Accounting: realized/unrealized split, average price on adds, full close
- [ ] Analytics: return, daily returns, annualized volatility, max drawdown, concentration (top weight + HHI)
- [ ] Unit + property/edge tests

### Phase 7 — Market simulator

Exit: reproducibility + scenario tests pass; candle consistency proven.

- [ ] Deterministic minute-function price model (hash-seeded PRNG, drift/vol per asset, sector correlation)
- [ ] Candles 1m/5m/1h/1d, internally consistent OHLC, deterministic volume
- [ ] Market clock + calendar config, `isMarketOpen`
- [ ] Scenario engine (6 scenarios, overlays, explicit windows)
- [ ] `MARKET_SIMULATION.md`
- [ ] Quote/candle API routes (poll-ready, `no-store`)

### Phase 8 — Simulator UI

Exit: trading e2e green; two-step confirmation verified; mobile usable.

- [ ] Dashboard (value, cash, today's P&L, return, positions, pending orders, executions)
- [ ] Market view (asset selector, price/change/volume, candles, 1D–1Y)
- [ ] Asset page (chart, stats, description, order ticket)
- [ ] Order ticket + two-step confirmation
- [ ] Portfolio page, positions table (reflows to cards on mobile)
- [ ] History: orders / executions / transactions, filters, cursor pagination
- [ ] Polling transport (~3s, paused when hidden), optional SSE behind flag

### Phase 9 — Competitions & challenges

Exit: join/isolation/leaderboard e2e green; methodology displayed.

- [ ] Lifecycle DRAFT → UPCOMING → ACTIVE → COMPLETED (+CANCELLED)
- [ ] Join creates isolated competition portfolio
- [ ] Server-authoritative scoring: total return %, tie-break lower max drawdown; never absolute MAD profit
- [ ] Leaderboard (rank, participant, return %, value, max drawdown) + DISC-4
- [ ] Challenge INFLATION_SHOCK + feedback (final return, drawdown, volatility, sector exposure, trade count)

### Phase 10 — Admin & executive

Exit: role-gated e2e green; destructive actions confirmed.

- [ ] Admin: Overview, Users, Events, Articles, Assets, Competitions, Orders (read-only), System
- [ ] Executive: events, articles, team, competitions, MEMBER grants
- [ ] Bootstrap admin from env
- [ ] Confirmation on destructive operations + audit log entries

### Phase 11 — Security hardening

Exit: §8.8 tests green.

- [ ] Ownership checks on every parameterized route (tested)
- [ ] Role escalation impossible (tested)
- [ ] CSRF posture of Server Actions verified
- [ ] Rate limits trigger (tested)
- [ ] Cookie flags verified
- [ ] XSS payloads neutralized (articles + profiles)
- [ ] Idempotent replay returns original result
- [ ] Concurrent orders cannot double-spend (parallel requests)
- [ ] `SECURITY.md`

### Phase 12 — QA & docs

Exit: §11.6 green; Part 13 complete.

- [ ] `pnpm typecheck`, `lint`, `test`, `build` green
- [ ] Coverage gate met
- [ ] Keyboard-only navigation pass on key flows
- [ ] `README.md`, `ARCHITECTURE.md`, `DATABASE.md`, `TRADING_ENGINE.md`, `MARKET_SIMULATION.md`, `SECURITY.md`, `DEPLOYMENT.md`, `CONTRIBUTING.md`
- [ ] `PROGRESS.md`, `DECISIONS.md`, `HANDOFF.md`
- [ ] Final report

---

## Environment reality check

| Tool          | Status                            | Consequence                                                                                                                                                         |
| ------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js 24.12 | available                         | satisfies Node 20+ requirement                                                                                                                                      |
| pnpm 12.9.1   | available                         | pinned package manager                                                                                                                                              |
| git 2.52      | available                         | conventional commits                                                                                                                                                |
| **docker**    | **NOT installed on this machine** | `docker compose up` cannot be exercised locally; integration suite is written and CI-ready but auto-skips when `TEST_DATABASE_URL` is unset. See `DECISIONS.md` D2. |

## Working order per phase

inspect → plan → implement → test → typecheck → lint → build (when relevant) → commit → `PROGRESS.md` → ≤10-line status summary.
