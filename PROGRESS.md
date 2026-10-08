# PROGRESS.md

Last updated: Phase 2 complete, including a full design-system pass.

## Done

- **Phase 0 — Repository & planning.** Greenfield repo on `main`. Next.js 16.4 App Router (TypeScript strict, `src/`, Tailwind v4, ESLint 9, Turbopack, `cacheComponents` + `partialPrefetching`). Breaking-change research against `node_modules/next/dist/docs`. `PLAN.md`, `DECISIONS.md` (D1–D16), `README.md`.

- **Phase 1 — Foundation.** All gates green.
  - Hardened `tsconfig` (`noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `allowJs: false`).
  - ESLint 9 flat config, type-aware, `no-explicit-any` as an error, no-unsafe-\* rules, and **layering rules** rejecting `react`/`next`/`drizzle-orm`/`@/infrastructure` imports from `src/domain` and `src/simulator` (N10, mechanically enforced). `server-only` DAL guidance applied per the Next 16 authentication docs.
  - Design tokens, Zod-validated server and public env contracts, `site.ts`, feature flags, i18n catalogue with RTL readiness.
  - `Money` over `bigint` centimes with one half-up rounding rule, string-based decimal parsing (no float path), basis points, largest-remainder `allocate`, percentage change in bps.
  - 24-code error model with HTTP status, student-readable message and recovery guidance.
  - `docker-compose`, drizzle-kit, three-project Vitest with the 90% coverage gate, Playwright desktop + mobile, GitHub Actions CI.
  - 42 unit tests covering money precision beyond 2⁵³, allocation invariants and the one-centime-from-balance boundary.

- **Phase 2 — Public website.** All exit criteria met.
  - Design system: Button, Card, Badge, Table, DataTable (mobile card fallback), Field, Alert, Skeleton, EmptyState, Select, Disclaimer components; `QuoteBoard`, `RuledList`, `ChangeIndicator`, semantic tone utilities.
  - Routes: `/`, `/about`, `/team`, `/contact`, `/events`, `/events/[slug]`, `/education`, `/education/topics`, `/simulator`, `/simulator/market`, `/simulator/market/[ticker]`, `/sign-in`, `/create-account`, plus `not-found`, `error`, `loading`, `sitemap`, `robots`.
  - Accessible layout: skip link, keyboard-operable mobile disclosure with Escape-to-close and focus restore, theme switcher applied before first paint by a static script (no `dangerouslySetInnerHTML`), `aria-current` navigation.
  - Domain + data layers: event model with capacity rules, contact schema, eight fictional instruments.
  - Contact form is a Server Action form with native constraint validation, no Client Component, server-side Zod validation, redirect-carried result codes.
  - SEO: metadata, Open Graph, canonical URLs, sitemap, robots; simulator/dashboard/admin excluded.
  - `scripts/perf-budget.mjs` enforces the 200 KB initial-JS budget on demand.
  - 121 unit tests; 44 Playwright tests green on desktop and mobile.

- **Design pass (this session).** `PRODUCT.md` written from the product brief; the visual world replaced inside its pinned aesthetic (research terminal, confident and dense).
  - Replaced the card-grid world with a terminal: hairlines and surface difference instead of floating boxes, shadows reserved for genuinely floating surfaces, a real type scale, monospace reserved for figures where alignment is the meaning.
  - **Eyebrows removed platform-wide** — they were the most recognisable tell of an assembled page.
  - **Homepage leads with the quote board**, not a pitch: the first viewport is the actual instrument set, so the thesis is the product.
  - **Market page rebuilt as a single dense board.** The previous version grouped instruments into sector card sections, producing six ragged rows of one or two cards and hiding the comparison a reader wants.
  - Instrument page gained a peer-instrument comparison and a ruled reference rail.
  - Section rhythm varied so five consecutive sections no longer share one layout.
  - Authored motion: quote-board rows settle in sequence once, on load. Nothing else moves.
  - `scripts/capture-review.mjs` added so a design review is one batched screenshot round, not a loop.
  - `DESIGN.md` written from the built system. Mechanical detector reports no findings.

### Gates

| Gate | Result |
|---|---|
| `pnpm typecheck` | pass |
| `pnpm lint` | pass |
| `pnpm format:check` | pass |
| `pnpm test:unit` | 121/121 pass |
| `pnpm test:e2e` | 44/44 pass (desktop + mobile) |
| `pnpm perf:budget` | all public routes within 200 KB gzip |
| `pnpm build` | pass |
| Impeccable detector | no findings |

## In progress

Nothing.

## Next

Phase 3 — Education centre: Markdown pipeline (gray-matter → remark → rehype with slug, sanitize, autolink headings), Zod-validated frontmatter, 20 starter topics, TOC, categories, related topics, `DISC_2` footer, XSS payload tests.

## Blockers

None. `docker` is unavailable on this machine, so `pnpm db:up` and the PostgreSQL integration suite cannot run locally; both are CI-ready and the suite self-skips with a visible notice (`DECISIONS.md` D2).

## Open items recorded in DECISIONS.md

- **D15** — an unprerendered route parameter returns HTTP 200 with the 404 body under Cache Components. `dynamicParams` is rejected by the build and `ensureStatic` had no effect. Contained by `robots: noindex`; revisit when Phase 5 moves these routes behind a database.
- **D16** — the contact form has no Client Component (a `useActionState` form cost 32 KB and broke the budget). Consequence: a server-side rejection navigates back and does not restore the typed draft. Browser constraint validation makes that path rare. Flash-cookie draft restoration is the recorded upgrade.
- **D1** — Cache Components is on; `Date.now()` at prerender is a hard build error, so time is always an explicit parameter (D9).