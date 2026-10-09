# Phase 0 — Stack lock, inventory, and objections

No feature code in this phase. Versions below were read from the npm registry on
the current date, not from memory.

---

## 1. Exact versions

### Runtime

| Package      | Version    | Note                                           |
| ------------ | ---------- | ---------------------------------------------- |
| `next`       | **16.4.0** | App Router, React Server Components, Turbopack |
| `react`      | **19.3.0** |                                                |
| `react-dom`  | **19.3.0** |                                                |
| `typescript` | **5.9.3**  | **not 7.x** — see objection O1                 |

### Styling and primitives

| Package                    | Version             | Note                                                                                                                                                                                                                                                                                                              |
| -------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwindcss`              | **4.3.3**           | v4: CSS-first `@theme`, no `tailwind.config.js`                                                                                                                                                                                                                                                                   |
| `@tailwindcss/postcss`     | **4.3.3**           |                                                                                                                                                                                                                                                                                                                   |
| `lucide-react`             | **1.52.0**          | barrel-free via Next's built-in `optimizePackageImports`                                                                                                                                                                                                                                                          |
| `class-variance-authority` | **0.7.1**           |                                                                                                                                                                                                                                                                                                                   |
| `clsx`                     | **2.1.1**           |                                                                                                                                                                                                                                                                                                                   |
| `tailwind-merge`           | **3.7.0**           |                                                                                                                                                                                                                                                                                                                   |
| `tw-animate-css`           | **1.4.0**           | shadcn/ui animation layer for Tailwind v4                                                                                                                                                                                                                                                                         |
| `@radix-ui/react-*`        | pinned individually | dialog 1.2.0 · tabs 1.1.22 · select 2.3.8 · label 2.1.16 · slot 1.4.0 · tooltip 1.3.0 · dropdown-menu 2.1.25 · popover 1.2.0 · switch 1.3.8 · slider 1.5.0 · accordion 1.2.21 · checkbox 1.3.12 · avatar 1.2.7 · progress 1.1.17 · separator 1.1.16 · toggle-group 1.1.20 · radio-group 1.4.8 · scroll-area 1.3.0 |

### Behaviour

| Package               | Version    | Note                                                                     |
| --------------------- | ---------- | ------------------------------------------------------------------------ |
| `motion`              | **14.0.0** | the package is now `motion`; `framer-motion` is the legacy name — see O2 |
| `react-hook-form`     | **7.89.0** |                                                                          |
| `@hookform/resolvers` | **5.9.1**  |                                                                          |
| `zustand`             | **5.0.15** | `persist` middleware, localStorage                                       |
| `zod`                 | **4.6.5**  |                                                                          |

### Charts

| Package              | Version    | Note                                          |
| -------------------- | ---------- | --------------------------------------------- |
| `lightweight-charts` | **5.2.1**  | TradingView. **v5 API** — see §5              |
| `recharts`           | **3.10.1** | only for the simple non-financial line charts |

### Tooling

| Package                          | Version         |
| -------------------------------- | --------------- |
| `eslint` / `eslint-config-next`  | 9.39.5 / 16.4.0 |
| `typescript-eslint`              | 8.71.1          |
| `vitest` / `@vitest/coverage-v8` | 5.0.3           |
| `@playwright/test`               | 1.64.0          |
| `@testing-library/react`         | 16.3.3          |

### Fonts

`next/font/google` (self-hosted at build, zero runtime CDN request): **Inter** 400/500/600, **Inter Tight** 600/700, **JetBrains Mono** 400/500/600. The brief's font choice is explicit and overrides the design system's existing IBM Plex pairing.

---

## 2. The blocker I have to raise before writing code

**This repository is not the product in the brief.** It is a different product with a different currency, a different data model, and a different persistence architecture.

|                       | In this repo now                                                                               | In the brief                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Club                  | FSJESC FMC, Casablanca                                                                         | `{CLUB_NAME}` at `{UNIVERSITY}`                                      |
| Currency              | MAD (Part 1.4 of the original spec)                                                            | USD, `$100,000.00`                                                   |
| Instruments           | 8 **fictional** Moroccan instruments (`MARI`, `CASA`, …), determinism is a teaching feature    | **Real** tickers `AAPL NVDA TSLA MSFT AMZN SPY QQQ` + indices and FX |
| Persistence           | PostgreSQL 17 + Drizzle + Auth.js v5 database sessions                                         | "**No real backend**", Zustand `persist` → localStorage              |
| Auth                  | Argon2id, hashed single-use tokens, RBAC server-side                                           | `AuthProvider` interface with a mock, SSO/Google demo flows          |
| Education             | 20 published Markdown topics in 6 categories, sanitised pipeline                               | Resource Vault of `.xlsx` / `.pdf` / notebooks                       |
| Rendering             | Cache Components on; the initial-JS budget is measured at 190 KB gzip against a 200 KB ceiling | A heavily client-driven terminal; see O3                             |
| Assets / dependencies | ~40 files, 201 unit tests, 44 e2e tests                                                        | none of the above exists                                             |

Most of these are not cosmetic — the currency, the data layer, and the auth model are the ones that determine the schema of everything else.

**I need one answer before Phase 1**, because the options produce very different work:

- **A. Replace.** Treat this as a new product. Retire the FSJESC domain, the money-in-MAD layer, the Postgres/Auth.js stack and the 20 topics; build the brief in this repo. Keeps the CI, the Playwright setup, the ESLint layering rules and the money-precision discipline, which all transfer directly.
- **B. Fresh repo.** Build the brief in a new directory. Nothing here is reused; nothing here is lost.
- **C. Adapt this repo.** Keep FSJESC's architecture (Postgres, server-side authority, real auth) and layer the brief's visual language and pages on top, substituting the content. The brief says "no real backend", so this contradicts it directly — flagging rather than deciding.

I'll proceed on **A** the moment you confirm, or tell me B or C.

---

## 3. File tree

```
src/
├── app/
│   ├── layout.tsx                     root: fonts, ticker, header, footer, metadata
│   ├── globals.css                    design tokens in @theme
│   ├── page.tsx                       / landing
│   ├── not-found.tsx · error.tsx · loading.tsx
│   ├── robots.ts · sitemap.ts
│   ├── about/ · education/ · team/ · contact/ · events/
│   ├── simulator/  (page + _components/*)
│   ├── competitions/
│   └── auth/  signin/ · signup/ · signup/_components/wizard/
├── components/
│   ├── ui/          shadcn primitives (data-table, dialog, tabs, select, …)
│   ├── primitives/  Num · Delta · KpiCard · SectionHeader · Badge · EmptyState
│   │                 Skeleton · Countdown · Marquee · AvatarPlaceholder
│   ├── layout/      Header · Ticker · Footer · MobileDrawer · Section
│   ├── charts/      PriceChart (lightweight-charts) · EquityCurve (recharts)
│   │                 Sparkline · ChartSummary (a11y text alternative)
│   └── simulator/   Watchlist · OrderTicket · PositionsDock · ConfirmOrderDialog
├── content/         club.ts · desks.ts · tracks.ts · members.ts · events.ts
│                    resources.ts · competitions.ts · traders.ts · firmWalls.ts
├── lib/
│   ├── market/      provider.ts (MarketDataProvider) · engine.ts (seeded GBM)
│   │                series.ts (OHLCV) · indicators.ts (SMA, volume) · clock.ts
│   ├── trading/     types.ts · validation.ts · fills.ts · positions.ts
│   │                metrics.ts · engine.ts (pure order lifecycle)
│   ├── store/       auth-store.ts · portfolio-store.ts · ui-store.ts (zustand+persist)
│   ├── forms/       schemas.ts (shared zod) · use-contact-form.ts …
│   └── utils.ts · format.ts · cn.ts · seo.ts
├── hooks/           use-market-clock · use-tick · use-countdown · use-mounted
├── types/           domain.d.ts
└── styles/
tests/
├── unit/            trading/* · market/* · format/*
├── e2e/             simulator.spec.ts · auth.spec.ts · smoke.spec.ts
└── setup/
```

---

## 4. Component inventory

**Built first, reused everywhere:** `Num` (mono, signed, colour-coded, never colour-alone) · `Delta` · `KpiCard` · `SectionHeader` · `Badge` · `EmptyState` · `Skeleton` · `Countdown` · `Marquee` · `DataTable` (36px rows, sticky header, sticky first column, horizontal scroll, mobile card fallback) · `AvatarPlaceholder` (deterministic gradient, grayscale→colour on hover, optional `src`).

**shadcn/ui, generated:** button · input · label · select · dialog · tabs · dropdown-menu · tooltip · switch · slider · accordion · checkbox · radio-group · avatar · progress · separator · toggle-group · scroll-area · textarea · card · table.

**Domain components:** `Header` · `Ticker` · `Footer` · `MobileDrawer` · `PriceChart` · `Sparkline` · `ChartSummary` · `Watchlist` · `OrderTicket` · `PositionsDock` · `ConfirmOrderDialog` · `CountdownBadge` · `ResourceTable` · `EventCard` · `CompetitionsCountdown` · `SignInForm` · `SignupWizard` · `WelcomeTour`.

**Total: 20 shared primitives · 19 shadcn components · 21 domain components.**

---

## 5. `lightweight-charts` v5 — verified, not assumed

You flagged this, so I read the installed typings rather than working from memory. Two API facts that change the implementation:

1. **v5 removed the v4 convenience methods.** `chart.addCandlestickSeries()` is deprecated. The current signature is:

   ```ts
   chart.addSeries<T extends SeriesType>(definition: SeriesDefinition<T>, options?: SeriesPartialOptionsMap[T], paneIndex?: number): ISeriesApi<T, HorzScaleItem>
   ```

   Series are created from exported definitions — `CandlestickSeries`, `LineSeries`, `HistogramSeries`, `AreaSeries`, `BarSeries`, `BaselineSeries`. **All `addSeries` calls in this build use the v5 form.** The `paneIndex` argument is also new in v5 and is how the volume histogram gets its own pane under the price chart rather than a shared price scale.

2. **`setData` is strictly typed per series type.** Candlestick data is `{ time, open, high, low, close }[]`; the histogram takes `{ time, value, color }[]`. Passing candle objects to a histogram is a compile error, which is the behaviour we want.

The chart will be a client leaf: `createChart` touches `ResizeObserver` and the canvas, so it never runs on the server.

---

## 6. Install commands

```bash
pnpm add next@16.4.0 react@19.3.0 react-dom@19.3.0 \
  motion@14.0.0 react-hook-form@7.89.0 @hookform/resolvers@5.9.1 \
  zustand@5.0.15 zod@4.6.5 \
  lightweight-charts@5.2.1 recharts@3.10.1 \
  lucide-react@1.52.0 clsx@2.1.1 tailwind-merge@3.7.0 class-variance-authority@0.7.1

pnpm add -D tailwindcss@4.3.3 @tailwindcss/postcss@4.3.3 tw-animate-css@1.4.0 \
  @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-select \
  @radix-ui/react-label @radix-ui/react-slot @radix-ui/react-tooltip \
  @radix-ui/react-dropdown-menu @radix-ui/react-popover @radix-ui/react-switch \
  @radix-ui/react-slider @radix-ui/react-accordion @radix-ui/react-checkbox \
  @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-separator \
  @radix-ui/react-toggle-group @radix-ui/react-radio-group @radix-ui/react-scroll-area
```

shadcn/ui components are added per-component, not all at once, so each file is reviewed before it lands:

```bash
pnpm dlx shadcn@latest init        # Tailwind v4, CSS variables, alias @
pnpm dlx shadcn@latest add button input label select dialog tabs dropdown-menu \
  tooltip switch slider checkbox radio-group avatar progress separator \
  toggle-group scroll-area textarea card table
```

---

## 7. Objections — things I disagree with

**O1 — Do not move to TypeScript 7. `latest` is now 7.0.2.** TypeScript 7 is the native port; `typescript-eslint` 8.71 and the Next 16 typecheck pipeline are built against the 5.x/6.x compiler API. Pinning 5.9.3 costs nothing and removes a real upgrade risk from a build that is otherwise on the latest of everything.

**O2 — The package is `motion`, not `framer-motion`.** The brief names both. `motion@14` is the current distribution and is what the docs target; `framer-motion` is a legacy alias frozen at v12. I will install `motion@14.0.0` and import from `motion/react`. This is a naming correction, not a substitution.

**O3 — `next/dynamic(..., { ssr: false })` cannot be called from a Server Component.** The Next 16 docs are explicit: _"the `ssr: false` option will only work for Client Components."_ The brief asks for charts dynamically imported with `ssr: false`; I will honour the intent by making each chart a Client Component that does the `ssr: false` import itself. Identical result, no build error.

**O4 — This brief needs Cache Components off, and that is a real trade.** The repo currently runs `cacheComponents: true`. That is right for a mostly-static marketing site and wrong for this product: a terminal is request-bound and client-driven, and the flag forces Suspense boundaries around data that here is already client state. I want to disable it and record why, rather than discover the friction across four phases. The cost is losing ISR for `/about` and `/education`. **Say the word and I will leave it on instead** — I will not change it silently.

**O5 — "Alumni marquee" and "Wall of Trust" over Citadel, Jane Street and Bridgewater.** These are real firms, and printing their names as wordmarks on a student page invites the inference of an affiliation or a placement that the brief's own `[CURRENCY]` placeholders contradict. The brief says all names are placeholder data to be replaced, so this is a scope flag rather than a blocker: I will render the marquee from `/content/firmWalls.ts` as specified, with the placeholder banner visible, and I will not assert any relationship in the copy.

**O6 — Light theme is out of scope, so `#07080B` is the only canvas.** Noting that the entire contrast budget therefore has to hold on one theme, and that the given `--text-muted #6B7280` on `#07080B` is **4.15:1** — below AA for body text. The brief already scopes muted to non-essential text ≥14px, which is the correct rule; I will enforce it in the token definitions so it cannot be applied to essential copy by accident, and I will flag any component where that is hard.

**O7 — "stop-loss converts to a market order when last price touches the stop"** needs one decision I will make and flag: with a 1s tick and no intrabar data, a stop can fill at the stop price or at the next tick, whichever is worse for the trader. Filling optimistically at the stop price is the common simulation shortcut and it flatters results. I will fill at the worse of stop and next tick, document it in the engine, and test it.

---

## 8. Acceptance checklist — Phase 0

| Item                                                                    | Status                                  |
| ----------------------------------------------------------------------- | --------------------------------------- |
| Exact versions stated for every package in the fixed stack              | pass                                    |
| `lightweight-charts` API verified against installed typings, not memory | pass                                    |
| File tree delivered                                                     | pass                                    |
| Component inventory delivered                                           | pass                                    |
| Install + shadcn commands delivered                                     | pass                                    |
| Objections raised                                                       | 7 (O1–O7)                               |
| Feature code                                                            | none, as required                       |
| Product conflict resolved                                               | **blocked — awaiting the answer in §2** |

Stopping here for Phase 0. Tell me **A**, **B**, or **C**, and whether to take O4 (disable Cache Components) or leave it on, and I will start Phase 1.
