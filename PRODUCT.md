# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase answers this: Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4 (CSS-first `@theme` tokens), Radix UI primitives, Drizzle ORM + PostgreSQL, Auth.js v5, Vitest + Playwright. pnpm.

## Users

**Primary — students of FSJES Casablanca (Faculté des Sciences Juridiques, Économiques et Sociales de Casablanca), Morocco.** They arrive meeting market vocabulary for the first time, most of them in an economics or finance undergraduate programme. Two jobs:

1. _Understand_: read a topic well enough to explain a concept — what it is, where the number comes from, and what it does not tell them.
2. _Practise_: place orders against a simulated market and see consequences accumulate, without financial risk.

**Secondary — club members.** Take responsibility for part of the programme: curate and review topics, design scenarios, compute and present competition analytics, run sessions.

**Tertiary — faculty, prospective members, and partner organisations.** Want to judge the club's academic standard from the site alone.

## Product Purpose

A student-led platform for learning, researching and simulating financial markets. It exists because most students meet market mechanics as a chapter in a textbook and meet market risk only as a hypothetical — the gap between those two is where mistakes happen.

Success means a member who finishes a session can explain _where a number came from_, not merely _what it is_.

## Positioning

The prices are produced by a **documented deterministic model**, so a result quoted today is reproduced exactly tomorrow and a classroom can compare notes and both be right. That reproducibility is a teaching advantage, not a compromise.

Second, the simulator is honest about being a simulation: eight invented instruments, MAD-denominated, with a permanent immutable ledger of every cash movement.

## Operating Context

- Moroccan context throughout. MAD is the only currency; timestamps stored in UTC and displayed in `Africa/Casablanca`.
- Moroccan economic and monetary context is used in education content (inflation, monetary policy, Bank Al-Maghrib statements as case material) without fabricating facts.
- Academic-year rhythm: sessions, a topic library, and challenges run through the year; introductions for new members at the start of each year.
- Students work in mixed French/English; English is the launch locale with French and Arabic anticipated.
- Reviewed on ordinary laptops and mid-range phones, often on campus Wi-Fi.

## Capabilities and Constraints

- Four pillars: club website · financial education centre · paper-trading simulator · competitions and challenges.
- Money precision is non-negotiable: integer centimes in `bigint`, never binary floating point.
- The server is the sole authority on balances, prices, roles, P&L and scores. The client is a view.
- Every protected operation verifies role **and** resource ownership server-side.
- Every financial mutation is one database transaction with full rollback; order submission is idempotent.
- All external input is validated server-side. TypeScript types are not validation.
- Historical ledger records are immutable and never silently edited or deleted.
- The trading engine and market simulator are pure TypeScript — no React, no browser APIs, no ORM — so they are independently testable.
- Collecting is limited to what an account needs: email, password hash, optional name/student ID/track. No third-party trackers. Account deletion on request (Law 09-08 posture).
- Open question, not yet decided: whether an authenticated member may export their own transaction history as a file.
- Open question: whether historical real market data is ever introduced, which would need a separate legal review.

## Brand Commitments

Name: **FSJESC Financial Markets Club** (FSJESC FMC). Tagline: _Learn financial markets. Research. Simulate. Analyze. Improve._

Voice: calm, analytical, academically credible. Never promotional.

Binding prohibitions: no "get rich", "10x", "guaranteed profit", "winning strategy", "beat the market", or equivalents in any language. No neon, crypto-dashboard gradients, flashing red/green, casino leaderboards, aggressive profit animation, glassmorphism-as-decoration, glowing buttons, emoji in UI, or decorative illustration carrying no information.

Standing disclaimers are part of the brand, not decoration:

- `DISC-1` — persistent simulator banner: "SIMULATED MARKET — Educational environment. No real money."
- `DISC-2` — article footer: "For educational purposes only. Not investment advice."
- `DISC-3` — analytics/advanced metrics: "Educational metrics. Not personalized financial advice."
- `DISC-4` — leaderboard methodology statement.

**Binding aesthetic direction (confirmed with the user this session):** a financial research terminal / university research portal. Confident and dense. Not a crypto exchange, an influencer site, or a game.

## Evidence on Hand

- `src/data/events.ts` — seven written session records with real descriptions, formats, rooms and capacities.
- `src/data/team.ts` — eight structural role placeholders. **Placeholder content, not real people** — the team page labels this on screen.
- `src/data/assets.ts` — eight fictional instruments with sector, modelled volatility and drift.
- `src/domain/events/event.ts` — the event domain model, validation schema and capacity rules.
- `src/config/site.ts` — club identity, the four disclaimers, fee models, simulation settings, market calendar, auth policy, rate limits.
- Absence future work must not fabricate: no photographs, no logos beyond a typographic lockup, no testimonials, no partner logos, no press, no faculty endorsements, no institutional photography of the campus.

## Product Principles

1. **Show the working.** Where a number appears, the reader can get to how it was produced. Reproducibility is the product's core promise.
2. **Simulation is always labelled.** Not in a footer — adjacent to the figure it qualifies. Nothing on the platform may imply a real market or real money.
3. **Risk is measured, not moralised.** Drawdown and volatility are shown alongside return, and the leaderboard never ranks by absolute profit.
4. **The ledger is permanent.** Nothing a member does can be quietly improved afterwards.
5. **Earn trust by refusal.** No recommendations, no projections presented as forecasts, no dark patterns aimed at engagement.

## Accessibility & Inclusion

WCAG 2.2 AA is the target and is treated as a requirement, not a goal.

- Full keyboard operation of every surface, including the order ticket and any dialog.
- Colour is never the sole carrier of meaning: a signed figure states its sign and direction in text.
- `prefers-reduced-motion` respected; motion is authored in one place rather than scattered.
- Every chart is paired with a data-table alternative, so the information does not depend on being able to see it.
- The simulator must be fully usable on a phone: tables reflow into cards rather than becoming shrunken desktop layouts.
- Figures use tabular numerals and right alignment so columns of digits can be scanned.

## Design Direction

Set in `DESIGN.md`. The one-line commitment: **a research terminal for students — dense, exacting, and legible under fluorescent light on a laptop in a seminar room.**
