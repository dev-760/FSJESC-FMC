# PROGRESS.md

Last updated: Phase 1 complete.

## Done

- **Phase 0 — Repository & planning.** Greenfield repo initialised on `main` with conventional commits. Next.js 16.4 App Router scaffold (TypeScript strict, `src/` layout, Tailwind v4, ESLint 9, Turbopack, `cacheComponents` + `partialPrefetching`). Next.js 16 breaking-change research completed against `node_modules/next/dist/docs` — Cache Components, `use cache`, async request APIs, `middleware` → `proxy`, two-argument `revalidateTag`, `unstable_cache` deprecation, Vitest/Playwright setup. Full dependency set pinned against the registry. `PLAN.md`, `DECISIONS.md` (D1–D14), `README.md` written.

- **Phase 1 — Foundation.** All exit criteria green.
  - `tsconfig` hardened: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `forceConsistentCasingInFileNames`; `allowJs` off.
  - ESLint 9 flat config with type-aware rules, `@typescript-eslint/no-explicit-any` as an error, no-unsafe-\* rules, and **layering enforcement** rejecting `react`/`next`/`drizzle-orm`/`@/infrastructure` imports from `src/domain` and `src/simulator` (N10). jsx-a11y comes from `eslint-config-next` rather than a duplicate plugin definition.
  - Prettier with the Tailwind plugin; `.prettierignore`; format check green.
  - Design tokens in `globals.css` under `@theme inline`: semantic `positive`/`negative`/`warning`/`information`/`neutral` plus surfaces, borders, text, accent, five chart series. Light and dark themes, both contrast-checked for WCAG 2.2 AA (text ≥ 4.5:1, boundaries ≥ 3:1). Tabular-numeral `.numeric` utility. `prefers-reduced-motion` honoured globally.
  - `src/config/env.ts` — Zod-validated server environment, fail-fast with per-variable messages, cross-field rules (SMTP required when `MAIL_PROVIDER=smtp`; console mail rejected in production; `AUTH_URL` required in production). `src/config/env-public.ts` for the `NEXT_PUBLIC_*` subset.
  - `src/config/site.ts` — club identity, fee-model selection, simulation settings and market calendar, auth/session/Argon2 policy, rate limits, competition scoring defaults, pagination, and the four fixed disclaimers `DISC_1`–`DISC_4`.
  - `src/config/feature-flags.ts` — eight flags, `LIVE_MARKET_DATA` off by design.
  - `src/i18n/strings.ts` — keyed catalogue, `LocaleConfig.dir` present for RTL readiness, typed `t()` keys so a typo is a compile error.
  - `src/lib/money.ts` — N1 implementation: branded `Money` over `bigint` centimes, string-based decimal parsing with no float path, one half-up rounding rule for the whole codebase, basis points, largest-remainder `allocate`, percentage change in bps, Zod input/DB schemas, ledger column-range guard.
  - `src/lib/errors.ts` — 24-code error enum with HTTP status, student-readable message, and recovery guidance per code; Zod errors normalised to `VALIDATION_ERROR`; internal values never serialised.
  - `src/lib/format.ts` — `formatMAD`, bps/percent, date and time in `Africa/Casablanca`, direction arrows so sign is never colour-only.
  - `src/lib/pagination.ts` — keyset cursors; `src/lib/cn.ts`.
  - `docker-compose.yml` (`db` :5432, `db-test` :5433), `drizzle.config.ts`, three-project `vitest.config.mts` with the 90% gate scoped to `domain/` + `simulator/engine/`, `playwright.config.ts` with desktop and mobile projects, GitHub Actions CI.
  - Root layout with IBM Plex Sans/Mono via `next/font`, metadata base, Open Graph, viewport, skip link, and the persistent `DISC_1` banner. Theme applied before first paint by `public/theme-init.js` — a static file, so no `dangerouslySetInnerHTML` is used anywhere.
  - 42 unit tests covering money precision, including float-inexact values, bigint boundaries beyond 2⁵³, allocation invariants, and the one-centime-from-balance boundary.

### Gates

| Gate | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `pnpm format:check` | pass |
| `pnpm test:unit` | 42/42 pass |
| `pnpm build` | pass — `/` and `/_not-found` prerendered static |

## In progress

Nothing. Phase 1 closed.

## Next

Phase 2 — Public website: design system primitives (Button, Card, Badge, Table, Input, Label, Dialog, Tabs, Select, Toast, Skeleton, EmptyState), layout with accessible header/nav and footer, theme switcher, then `/`, `/about`, `/team`, `/contact`, `/events`, `/events/[slug]`, metadata/OG/canonical, sitemap, robots, and `noindex` on simulator/dashboard/admin.

## Blockers

None. `docker` is unavailable on this machine, so `pnpm db:up` and the PostgreSQL integration suite cannot be exercised locally; both are CI-ready and the suite self-skips with a visible notice (`DECISIONS.md` D2).

## Notes for the next phase

- Cache Components is on (D1). Public pages must be fully static or use `use cache`; anything reading `cookies()`/`params`/`searchParams` needs a `<Suspense>` boundary or the build fails.
- `Date.now()` during prerender is a hard build error. `getRequestTime()` is the intended seam (D9) and lands with Phase 4's DAL.
- `src/lib/money.ts` is the only place centimes convert to or from decimals; format through `formatMAD`, never by hand.