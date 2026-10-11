import type { Metadata } from "next";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@fsjesc/ui/button";
import { Container, RuledList, Section, SectionHeading } from "@fsjesc/ui/layout/container";
import { Alert } from "@fsjesc/ui/alert";
import { KpiCard, KpiStrip } from "@fsjesc/ui/primitives/index";
import { Num } from "@fsjesc/ui/primitives/num";
import { formatMAD } from "@fsjesc/config/format";
import { money } from "@fsjesc/config/money";
import { DISC_3, DISC_4, SIMULATION, SITE } from "@fsjesc/config/site";
import {
  ALL_MARKET_ASSETS,
  CSE_REAL_ASSETS,
  CSE_SECTOR_SUMMARIES,
} from "@fsjesc/domain/assets";
import { DEMO_EVENTS } from "@fsjesc/domain/events";
import { HeroTerminalCard } from "@/components/hero-terminal-card";

export const metadata: Metadata = {
  description: SITE.description,
  alternates: { canonical: "/" },
};

/**
 * Homepage (Part 7.1).
 *
 * Section order is mandated by the spec: Hero → Club introduction → What we do →
 * Financial education → Paper-trading simulator → Upcoming workshops → Current
 * challenge → Educational topics → Club statistics → Call to action.
 *
 * Fully static: no request data, no build-time counting, so it prerenders clean
 * under Cache Components (DECISIONS.md D1).
 */
export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        alternateName: SITE.shortName,
        url: SITE.url,
        description: SITE.description,
        parentOrganization: {
          "@type": "CollegeOrUniversity",
          name: "Faculté des Sciences Juridiques, Économiques et Sociales de Casablanca",
          alternateName: "FSJES Casablanca",
        },
      },
      {
        "@type": "Website",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        publisher: { "@id": `${SITE.url}/#organization` },
      },
    ],
  };

  return (
    <main id="main-content" className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <ClubIntroduction />
      <WhatWeDo />
      <EducationSection />
      <SimulatorSection />
      <WorkshopsSection />
      <ChallengeSection />
      <TopicsSection />
      <StatisticsSection />
      <CallToAction />
    </main>
  );
}

/* ── 1. Hero ─────────────────────────────────────────────────────────────── */

const HERO_MARKET_PILLS = [
  { label: "CSE Casablanca", count: 38, sample: "ATW" },
  { label: "Global Stocks", count: 16, sample: "AAPL" },
  { label: "ETFs", count: 12, sample: "SPY" },
  { label: "Futures", count: 12, sample: "ES" },
  { label: "Crypto", count: 10, sample: "BTC" },
  { label: "Forex", count: 8, sample: "USDMAD" },
  { label: "Bonds & BDT", count: 6, sample: "BDT10Y" },
  { label: "Options", count: 8, sample: "AAPL-CALL" },
] as const;

function Hero() {
  return (
    <section className="hero-mesh border-rule bg-canvas border-b">
      <Container size="wide" className="pt-10 pb-14 lg:pt-14 lg:pb-20">
        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-12">
          {/* Left Column: Editorial Headline, CTAs & Market Pills */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 inline-flex items-center gap-2 self-start rounded-full border border-rule-strong/80 bg-surface/90 px-3 py-1 shadow-2xs">
              <span aria-hidden="true" className="bg-brand size-2 rounded-full" />
              <span className="label text-foreground font-semibold tracking-wider">
                Student Academic Initiative · {SITE.campusShort}
              </span>
            </div>

            <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.35rem]">
              A student research terminal for learning how markets{" "}
              <em className="text-accent-text font-serif italic font-medium">actually work</em>.
            </h1>

            <p className="measure text-foreground-secondary mt-5 text-base leading-relaxed sm:text-lg">
              {SITE.shortName} combines a 20-topic written curriculum, a multi-asset paper-trading
              terminal covering {CSE_REAL_ASSETS.length} Bourse de Casablanca equities and 72 global
              instruments settled in Moroccan dirhams, and macroeconomic scenario challenges scored
              on risk as well as return.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="shadow-xs">
                <Link href={simulatorUrl()}>
                  <span>Enter the simulator</span>
                  <ArrowRight aria-hidden className="ml-1.5 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/education">Explore education</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/competitions">Scenario challenges</Link>
              </Button>
            </div>

            {/* 8-Market Quick Access Pill Bar */}
            <div className="mt-8">
              <p className="label mb-2.5">
                Direct market coverage ({ALL_MARKET_ASSETS.length} tradeable assets)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {HERO_MARKET_PILLS.map((m) => (
                  <Link
                    key={m.label}
                    href={simulatorUrl(`market/${m.sample.toLowerCase()}`)}
                    className="border-rule bg-surface hover:bg-surface-inset hover:border-brand/70 focus-visible:outline-ring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs shadow-2xs transition-all hover:-translate-y-0.5 focus-visible:outline-2"
                  >
                    <span className="text-foreground font-medium">{m.label}</span>
                    <span className="numeric bg-surface-sunken text-foreground-muted rounded px-1.5 py-0.2 text-2xs font-semibold">
                      {m.count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <p className="border-brand/70 measure text-foreground-secondary mt-7 border-l-2 pl-4 text-xs leading-relaxed">
              {DISC_4}
            </p>
          </div>

          {/* Right Column: Interactive Market Terminal Card */}
          <div className="lg:pl-2">
            <HeroTerminalCard />
          </div>
        </div>

        {/* Institutional Key Figures Bar (.stat--accent style) */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border-rule bg-surface relative overflow-hidden rounded-xl border p-5 pl-6 shadow-xs before:bg-brand before:absolute before:inset-y-0 before:left-0 before:w-1">
            <p className="label">Bourse de Casablanca</p>
            <p className="numeric text-foreground mt-1.5 text-2xl font-semibold">
              {CSE_REAL_ASSETS.length}{" "}
              <span className="text-foreground-secondary text-xs font-normal">
                Principal F Equities
              </span>
            </p>
            <p className="text-2xs text-foreground-muted mt-1">
              ATW · IAM · BCP · LHM · TQM · MNG · CSR · MSA
            </p>
          </div>

          <div className="border-rule bg-surface relative overflow-hidden rounded-xl border p-5 pl-6 shadow-xs before:bg-brand before:absolute before:inset-y-0 before:left-0 before:w-1">
            <p className="label">Global &amp; Macro</p>
            <p className="numeric text-foreground mt-1.5 text-2xl font-semibold">
              8{" "}
              <span className="text-foreground-secondary text-xs font-normal">Asset Classes</span>
            </p>
            <p className="text-2xs text-foreground-muted mt-1">
              CSE · Stocks · ETFs · Futures · Crypto · FX · Bonds · Options
            </p>
          </div>

          <div className="border-rule bg-surface relative overflow-hidden rounded-xl border p-5 pl-6 shadow-xs before:bg-brand before:absolute before:inset-y-0 before:left-0 before:w-1">
            <p className="label">Starting Portfolio</p>
            <p className="numeric text-foreground mt-1.5 text-2xl font-semibold">
              100,000{" "}
              <span className="text-foreground-secondary text-xs font-normal">MAD</span>
            </p>
            <p className="text-2xs text-foreground-muted mt-1">
              Integer-centime accounting · T+2 settlement
            </p>
          </div>

          <div className="border-rule bg-surface relative overflow-hidden rounded-xl border p-5 pl-6 shadow-xs before:bg-brand before:absolute before:inset-y-0 before:left-0 before:w-1">
            <p className="label">Written Curriculum</p>
            <p className="numeric text-foreground mt-1.5 text-2xl font-semibold">
              20{" "}
              <span className="text-foreground-secondary text-xs font-normal">
                Published Topics
              </span>
            </p>
            <p className="text-2xs text-foreground-muted mt-1">
              Worked arithmetic, formulas &amp; comprehension checks
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── 2. Club introduction ────────────────────────────────────────────────── */

const LEARNING_STEPS = [
  {
    num: "01",
    badge: "Theory",
    icon: BookOpen,
    title: "Read the mechanics first",
    detail:
      "Study order types, book depth, bid-ask spreads, bond duration, and Bank Al-Maghrib monetary transmission in concise 8-minute briefs with worked examples.",
    href: "/education",
    cta: "Read curriculum",
  },
  {
    num: "02",
    badge: "Practice",
    icon: LineChart,
    title: "Execute on a 110-asset book",
    detail:
      "Deploy 100,000 MAD across 38 Bourse de Casablanca equities and 72 global instruments. Every fill records spread cost, 5 bps commission, and T+2 settlement.",
    href: simulatorUrl(),
    cta: "Open terminal",
  },
  {
    num: "03",
    badge: "Evaluation",
    icon: Trophy,
    title: "Compete under macro stress",
    detail:
      "Enter time-boxed scenario challenges (BAM policy rate hikes, inflation shocks, sector rotations) ranked on total return with lower maximum drawdown breaking ties.",
    href: "/competitions",
    cta: "Join challenges",
  },
] as const;

function ClubIntroduction() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <SectionHeading
          as="h2"
          title="Most students meet market risk only as a hypothetical."
          lead={`${SITE.shortName} is a student academic initiative at ${SITE.campus}. We close the gap between the textbook formula and the actual execution ledger.`}
        />
        <div className="text-foreground-secondary space-y-4 text-base leading-relaxed">
          <p>
            A supply-and-demand curve, a volatility formula, and a paragraph about risk aversion
            often leave the operational mechanics implicit. How a limit order rests in a book, why a
            quoted mid-price differs from an achievable fill, and how a drawdown compounds while a
            position is still inside its T+2 settlement window require direct observation.
          </p>
          <p>
            The terminal makes those mechanics explicit. You trade real Moroccan and international
            tickers against a reproducible price engine, inspect fundamental ratios and yield
            curves, and watch every decision accumulate in an append-only audit ledger.
          </p>
        </div>
      </div>

      {/* 3-Step Progression Cards (.step from Landing.html) */}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {LEARNING_STEPS.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.num}
              className="border-rule bg-surface hover:border-brand/60 flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="numeric bg-brand-subtle text-warning-text inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold tracking-wider">
                    <span>STEP {step.num}</span>
                    <span>·</span>
                    <span>{step.badge}</span>
                  </span>
                  <span className="border-rule bg-surface-sunken text-foreground-secondary inline-flex size-9 items-center justify-center rounded-lg border">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-foreground-secondary mt-2.5 text-sm leading-relaxed">
                  {step.detail}
                </p>
              </div>
              <div className="border-rule mt-6 border-t pt-4">
                <Link
                  href={step.href}
                  className="text-accent-text hover:text-accent-hover inline-flex items-center gap-1.5 text-xs font-semibold transition-colors"
                >
                  <span>{step.cta}</span>
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ── 3. What we do ───────────────────────────────────────────────────────── */

const ACTIVITIES = [
  {
    title: "Workshops and lectures",
    detail:
      "Sessions on financial statement analysis, Bank Al-Maghrib monetary policy, market microstructure, and risk measurement. Open to every student of the faculty.",
    href: "/events",
  },
  {
    title: "Written education programme",
    detail:
      "A 20-topic library covering equities, sovereign bonds, order execution, and portfolio risk. Each topic defines its terms, shows the arithmetic, and states what a measure does not tell you.",
    href: "/education",
  },
  {
    title: "Multi-asset paper-trading simulator",
    detail:
      "Market and limit orders across 38 Bourse de Casablanca equities, US stocks, ETFs, futures, crypto, forex, bonds, and options settled in MAD with full risk telemetry.",
    href: simulatorUrl(),
  },
  {
    title: "Scenario challenges & competitions",
    detail:
      "Time-boxed exercises under defined macroeconomic assumptions, scored on total portfolio return with lower maximum drawdown winning any tie.",
    href: "/competitions",
  },
] as const;

const PLATFORM_GATEWAYS = [
  {
    icon: BookOpen,
    title: "Education Centre",
    meta: "20 topics · 6 categories",
    desc: "Structured readings from market foundations and order types to bond duration and behavioural finance.",
    href: "/education",
    tone: "bg-info-subtle text-info",
  },
  {
    icon: LineChart,
    title: "Market Simulator",
    meta: "110 assets · 8 markets",
    desc: "Interactive trading terminal with CSE equities, global stocks, ETFs, futures, FX, yield curves, and options.",
    href: simulatorUrl(),
    tone: "bg-bull-subtle text-bull",
  },
  {
    icon: Trophy,
    title: "Competitions",
    meta: "Risk-adjusted rankings",
    desc: "Cohort tournaments evaluated on return and maximum drawdown over fixed competition windows.",
    href: "/competitions",
    tone: "bg-brand-subtle text-warning-text",
  },
  {
    icon: Target,
    title: "Scenario Challenges",
    meta: "6 stress-test briefs",
    desc: "Focused exercises testing execution discipline, slippage control, and macro rate sensitivity.",
    href: "/challenges",
    tone: "bg-bear-subtle text-bear",
  },
  {
    icon: Calendar,
    title: "Events & Clinics",
    meta: "Campus & online sessions",
    desc: "Workshops, central bank policy lectures, and post-competition debriefs at FSJES Casablanca.",
    href: "/events",
    tone: "bg-info-subtle text-info",
  },
  {
    icon: Award,
    title: "Club & Governance",
    meta: "Team, mission & grants",
    desc: "Meet the student executive board, review our academic charter, and inspect transparent club budget grants.",
    href: "/about",
    tone: "bg-brand-subtle text-warning-text",
  },
] as const;

function WhatWeDo() {
  return (
    <Section className="border-rule bg-surface-sunken border-y">
      <SectionHeading
        as="h2"
        title="Four activities, one programme"
        lead="Education supplies the concepts, the simulator supplies the execution book, and scenario challenges supply the discipline of a deadline."
      />
      <div className="mt-10">
        <RuledList
          items={ACTIVITIES.map((a) => ({
            term: a.title,
            detail: a.detail,
            href: a.href,
          }))}
        />
      </div>

      {/* 6-Gateway Platform Directory */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <p className="label">Explore the platform</p>
          <span className="numeric text-2xs text-foreground-muted">6 integrated modules</span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_GATEWAYS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                href={item.href}
                className="border-rule bg-surface hover:border-brand/70 focus-visible:outline-ring group flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex size-10 items-center justify-center rounded-xl ${item.tone}`}
                    >
                      <Icon aria-hidden className="size-5" />
                    </span>
                    <span className="numeric border-rule bg-surface-sunken text-foreground-secondary rounded-full border px-2.5 py-0.5 text-2xs font-medium">
                      {item.meta}
                    </span>
                  </div>
                  <h3 className="group-hover:text-accent-text mt-4 text-lg font-semibold transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-foreground-secondary mt-2 text-xs leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                <span className="text-accent-text mt-5 inline-flex items-center gap-1.5 text-xs font-semibold">
                  <span>Open {item.title.toLowerCase()}</span>
                  <ArrowRight
                    aria-hidden
                    className="size-3.5 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ── 4. Financial education ──────────────────────────────────────────────── */

const WRITING_STANDARDS = [
  [
    "Define before using",
    "Every technical term is defined at first use, in the topic where it matters.",
  ],
  [
    "Show the arithmetic",
    "Risk measures arrive with their mathematical formula and a worked numerical example in MAD alongside the term.",
  ],
  [
    "State the limits",
    "Where a measure is informative and where it misleads is an explicit section of every article.",
  ],
  [
    "No recommendations",
    "Nothing on this platform tells any person what to buy, sell, or do with real money.",
  ],
] as const;

const CURRICULUM_MODULES = [
  {
    code: "MOD-01",
    level: "Beginner",
    dotClass: "bg-bull",
    badgeClass: "bg-bull-subtle text-bull",
    topicsCount: "7 topics · ~55 min total",
    title: "Market Foundations & Order Microstructure",
    summary:
      "Price formation, bid-ask spreads, market vs. limit orders, order book depth, and execution slippage.",
    highlights: ["Bid-Ask Spread", "Limit Order Book", "Slippage & Fees"],
    sampleHref: "/education/topics/what-is-a-financial-market",
  },
  {
    code: "MOD-02",
    level: "Intermediate",
    dotClass: "bg-brand",
    badgeClass: "bg-brand-subtle text-warning-text",
    topicsCount: "7 topics · ~65 min total",
    title: "Equities, Sovereign Bonds & Macro Transmission",
    summary:
      "Balance sheet valuation, Bons du Trésor yield curves, inflation, Bank Al-Maghrib policy rates, and economic cycles.",
    highlights: ["PER & ROE Ratios", "BDT Yield Curve", "BAM Policy Rate"],
    sampleHref: "/education/topics/bonds-and-fixed-income",
  },
  {
    code: "MOD-03",
    level: "Advanced",
    dotClass: "bg-info",
    badgeClass: "bg-info-subtle text-info",
    topicsCount: "6 topics · ~60 min total",
    title: "Portfolio Construction, Risk & Behavioural Biases",
    summary:
      "Annualised volatility, maximum drawdown, correlation breakdown, position sizing, and cognitive biases in trading.",
    highlights: ["Max Drawdown", "Sharpe & Volatility", "Correlation Stress"],
    sampleHref: "/education/topics/volatility",
  },
] as const;

function EducationSection() {
  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Concepts before instruments"
        lead="The education programme is written so a topic can be read with no prior market experience, and without being steered toward a conclusion about what to buy."
        actions={
          <>
            <Button asChild>
              <Link href="/education">Explore education</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/education/topics">All 20 topics</Link>
            </Button>
          </>
        }
      />

      {/* 3 Curriculum Modules */}
      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {CURRICULUM_MODULES.map((mod) => (
          <Link
            key={mod.code}
            href={mod.sampleHref}
            className="border-rule bg-surface hover:border-brand/70 focus-visible:outline-ring group flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="numeric text-xs font-bold tracking-wider text-accent-text">
                  {mod.code}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${mod.badgeClass}`}
                >
                  <span aria-hidden="true" className={`size-1.5 rounded-full ${mod.dotClass}`} />
                  <span>{mod.level}</span>
                </span>
              </div>
              <h3 className="group-hover:text-accent-text mt-3.5 text-lg font-semibold text-foreground transition-colors">
                {mod.title}
              </h3>
              <p className="text-foreground-secondary mt-2 text-xs leading-relaxed">
                {mod.summary}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {mod.highlights.map((tag) => (
                  <span
                    key={tag}
                    className="border-rule bg-surface-sunken text-foreground-secondary rounded-md border px-2 py-0.5 text-2xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="border-rule mt-5 flex items-center justify-between border-t pt-3.5">
              <span className="numeric text-2xs text-foreground-muted">{mod.topicsCount}</span>
              <span className="text-accent-text inline-flex items-center gap-1 text-xs font-semibold">
                <span>Start module</span>
                <ArrowRight
                  aria-hidden
                  className="size-3.5 transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12">
        <p className="label mb-3">How we write about markets</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {WRITING_STANDARDS.map(([term, detail]) => (
            <div
              key={term}
              className="border-rule bg-surface-sunken/70 flex items-start gap-3 rounded-xl border p-4"
            >
              <CheckCircle2 aria-hidden="true" className="text-bull mt-0.5 size-4 shrink-0" />
              <div>
                <h3 className="font-sans text-sm font-semibold text-foreground">{term}</h3>
                <p className="text-foreground-secondary mt-1 text-xs leading-relaxed">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ── 5. Paper-trading simulator ──────────────────────────────────────────── */

const MARKET_COVERAGE_ROWS = [
  {
    market: "CSE Casablanca",
    endpoint: "/api/v1/cse",
    count: 38,
    currency: "MAD",
    tickers: ["ATW", "IAM", "BCP", "LHM", "TQM", "MNG"],
    desc: "38 real Bourse de Casablanca Principal F equities with ISINs, official French sectors, and PER/PBR/ROE ratios.",
  },
  {
    market: "Global Equities",
    endpoint: "/api/v1/stocks",
    count: 16,
    currency: "USD → MAD",
    tickers: ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN", "JPM"],
    desc: "Large-cap technology, financial, healthcare, and energy equities listed on NASDAQ and NYSE.",
  },
  {
    market: "Exchange-Traded Funds",
    endpoint: "/api/v1/etfs",
    count: 12,
    currency: "USD → MAD",
    tickers: ["SPY", "QQQ", "IWM", "GLD", "TLT", "EEM"],
    desc: "S&P 500, NASDAQ-100, Russell 2000, gold bullion, long-duration US Treasury, and emerging market ETFs.",
  },
  {
    market: "Index & Commodity Futures",
    endpoint: "/api/v1/futures",
    count: 12,
    currency: "USD → MAD",
    tickers: ["ES", "NQ", "GC", "CL", "NG", "ZB"],
    desc: "CME, COMEX, NYMEX, and CBOT benchmark futures across equity indices, crude oil, gold, and treasury bonds.",
  },
  {
    market: "Cryptocurrencies",
    endpoint: "/api/v1/crypto",
    count: 10,
    currency: "USD → MAD",
    tickers: ["BTC", "ETH", "SOL", "BNB", "XRP", "AVAX"],
    desc: "24/7 digital assets enabling round-the-clock volatility and high-beta risk management exercises.",
  },
  {
    market: "Foreign Exchange (FX)",
    endpoint: "/api/v1/forex",
    count: 8,
    currency: "MAD / G10",
    tickers: ["USDMAD", "EURMAD", "EURUSD", "GBPUSD", "USDJPY"],
    desc: "Moroccan Dirham crosses (USD/MAD, EUR/MAD) and major G10 pairs powered by ECB Frankfurter reference rates.",
  },
  {
    market: "Bonds & Yield Curve",
    endpoint: "/api/v1/bonds",
    count: 6,
    currency: "MAD / USD",
    tickers: ["BDT10Y", "US2Y", "US10Y", "US30Y"],
    desc: "Moroccan 10-Year Bons du Trésor (BKAM) and US Treasury constant-maturity rates (FRED 1M–30Y curve).",
  },
  {
    market: "Listed Equity Options",
    endpoint: "/api/v1/options",
    count: 8,
    currency: "USD → MAD",
    tickers: ["AAPL-CALL", "AAPL-PUT", "SPY-CALL", "NVDA-CALL"],
    desc: "Standardized 30-day ATM call and put contracts illustrating delta, gamma, implied volatility, and theta decay.",
  },
] as const;

function SimulatorSection() {
  return (
    <Section className="border-rule bg-surface border-y">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div>
          <SectionHeading
            as="h2"
            title="110 real-world instruments across eight markets, settled in MAD"
            lead="Trade 38 Bourse de Casablanca equities alongside global stocks, ETFs, futures, crypto, forex, sovereign bonds, and options. A deterministic price engine paired with live reference feeds ensures every classroom exercise is reproducible."
          />
          <div className="mt-10">
            <RuledList
              items={[
                {
                  term: "Starting cash",
                  detail: `Each new portfolio is funded with ${formatMAD(money(SIMULATION.defaultStartingCashCents))} of simulated capital held in integer centimes.`,
                },
                {
                  term: "Order book & execution",
                  detail:
                    "Market and limit orders with pre-trade impact review. A buy fills at the ask and a sell at the bid, so the spread costs you exactly what it would in a live order book.",
                },
                {
                  term: "Capitalised fee basis",
                  detail:
                    "A 5 bps (0.05%) institutional commission is capitalised into a position's break-even cost basis, so realised P&L reconciles to the centime with cash changes.",
                },
                {
                  term: "Permanent T+2 ledger",
                  detail:
                    "Positions settle T+2 business days and every cash movement is recorded in an append-only ledger that is never edited or deleted.",
                },
                {
                  term: "Risk & sector analytics",
                  detail:
                    "Annualised volatility, maximum drawdown, Sharpe ratio, and multi-market exposure computed directly from your portfolio history.",
                },
              ]}
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={simulatorUrl()}>
                <span>Enter the simulator</span>
                <ArrowRight aria-hidden className="ml-1.5 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href={simulatorUrl("market")}>Browse all 110 instruments</Link>
            </Button>
          </div>
        </div>

        {/* Sticky Price Model & CSE Sector Snapshot */}
        <div className="space-y-5 lg:sticky lg:top-24">
          <div className="border-rule-strong/80 bg-surface-sunken overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-rule bg-surface flex items-center justify-between border-b px-5 py-3.5">
              <p className="label text-foreground font-semibold">The price &amp; execution model</p>
              <span className="numeric bg-brand-subtle text-warning-text rounded-full px-2.5 py-0.5 text-2xs font-semibold">
                GBM + Reference API
              </span>
            </div>
            <div className="space-y-4 p-5">
              <pre className="numeric text-foreground bg-surface border-rule rounded-xl border p-4 text-xs leading-relaxed shadow-2xs">
                <code>{`S(t) = S(0) · exp(
  (μ − σ²/2)·t + σ·√t·Z(t)
)`}</code>
              </pre>
              <RuledList
                items={[
                  {
                    term: "S(0)",
                    detail: "Calibrated opening reference price in integer centimes.",
                  },
                  {
                    term: "μ, σ",
                    detail: "Sector-calibrated annual drift and volatility parameters.",
                  },
                  {
                    term: "Z(t)",
                    detail:
                      "Deterministic standard normal path derived from (seed, symbol, minute).",
                  },
                ]}
              />
              <p className="text-2xs text-muted-allowed leading-relaxed">
                Recomputable from published parameters so every student in a seminar room observes
                the exact same quote book at the same timestamp.
              </p>
            </div>
          </div>

          <Alert tone="warning">
            <p>
              <strong>Educational paper-trading environment:</strong> While tickers, ISINs, and
              sector classifications reflect real Bourse de Casablanca and international
              instruments, all orders, portfolios, and MAD balances are 100% simulated.
            </p>
          </Alert>
        </div>
      </div>

      {/* 8-Market Coverage Matrix */}
      <div className="mt-14">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <p className="label">Multi-Asset Market Catalog (8 API Routers · 110 Instruments)</p>
          <Link
            href={simulatorUrl("market")}
            className="text-accent-text hover:text-accent-hover inline-flex items-center gap-1 text-xs font-semibold"
          >
            <span>Open full market board in Simulator</span>
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MARKET_COVERAGE_ROWS.map((row) => (
            <div
              key={row.market}
              className="border-rule bg-canvas hover:border-rule-strong flex flex-col justify-between rounded-xl border p-4 shadow-2xs transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-foreground text-sm font-semibold">{row.market}</span>
                  <span className="numeric border-rule bg-surface rounded-full border px-2 py-0.5 text-2xs font-semibold">
                    {row.count}
                  </span>
                </div>
                <p className="numeric text-2xs text-foreground-muted mt-0.5">
                  {row.endpoint} · {row.currency}
                </p>
                <p className="text-foreground-secondary mt-2.5 text-xs leading-relaxed">
                  {row.desc}
                </p>
              </div>
              <div className="border-rule mt-3.5 flex flex-wrap gap-1 border-t pt-2.5">
                {row.tickers.map((sym) => (
                  <Link
                    key={sym}
                    href={simulatorUrl(`market/${sym.toLowerCase()}`)}
                    className="numeric border-rule bg-surface hover:bg-surface-inset text-foreground-secondary hover:text-foreground rounded-md border px-1.5 py-0.5 text-2xs font-medium transition-colors"
                  >
                    {sym}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bourse de Casablanca Official Sector Breakdown */}
      <div className="mt-10">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers aria-hidden className="text-foreground-secondary size-4" />
            <p className="label">
              Bourse de Casablanca — {CSE_SECTOR_SUMMARIES.length} Official Sectors (
              {CSE_REAL_ASSETS.length} Listed Equities)
            </p>
          </div>
          <span className="numeric text-2xs text-foreground-muted">
            /api/v1/cse/sector-summary · Principal F
          </span>
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {CSE_SECTOR_SUMMARIES.map((sec) => {
            const isPos = sec.averageChangePercent >= 0;
            return (
              <div
                key={sec.sector}
                className="border-rule bg-surface-sunken/60 flex flex-col justify-between rounded-xl border p-4 shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-semibold text-foreground">{sec.englishLabel}</p>
                      <p className="text-2xs text-foreground-muted">{sec.sector}</p>
                    </div>
                    <span
                      className={`numeric rounded-full px-2 py-0.5 text-2xs font-semibold ${
                        isPos ? "bg-bull-subtle text-bull" : "bg-bear-subtle text-bear"
                      }`}
                    >
                      {isPos ? "+" : ""}
                      {sec.averageChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <p className="numeric text-2xs text-foreground-secondary mt-2">
                    Cap: {(sec.totalMarketCapMad / 1e9).toFixed(1)}B MAD · {sec.companyCount}{" "}
                    {sec.companyCount === 1 ? "company" : "companies"}
                  </p>
                </div>
                <div className="border-rule mt-3 flex flex-wrap gap-1 border-t pt-2.5">
                  {sec.tickers.map((t) => (
                    <Link
                      key={t}
                      href={simulatorUrl(`market/${t.toLowerCase()}`)}
                      className="numeric text-2xs border-rule bg-surface hover:bg-surface-inset text-foreground rounded-md border px-1.5 py-0.5 font-medium transition-colors"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ── 6. Upcoming workshops ───────────────────────────────────────────────── */

const MONTH_ABBR = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAY",
  "JUN",
  "JUL",
  "AUG",
  "SEP",
  "OCT",
  "NOV",
  "DEC",
] as const;

function WorkshopsSection() {
  const upcomingEvents = DEMO_EVENTS.filter((e) => e.registrationOpen).slice(0, 4);

  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Sessions you can attend"
        lead="Open to every student of the faculty. Where a session requires computer-room space, registration is capped at room capacity."
        actions={
          <Button asChild variant="secondary">
            <Link href="/events">All events ({DEMO_EVENTS.length})</Link>
          </Button>
        }
      />
      <ul className="mt-10 space-y-3.5">
        {upcomingEvents.map((event) => {
          const day = String(event.startAt.getUTCDate()).padStart(2, "0");
          const month = MONTH_ABBR[event.startAt.getUTCMonth()] ?? "OCT";
          return (
            <li key={event.slug}>
              <Link
                href={`/events/${event.slug}`}
                className="border-rule bg-surface hover:border-brand/70 focus-visible:outline-ring group grid gap-4 rounded-2xl border p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 sm:grid-cols-[5.25rem_minmax(0,1fr)_auto] sm:items-center sm:gap-6"
              >
                <div className="border-rule bg-surface-sunken flex items-baseline justify-center gap-2 rounded-xl border py-3 sm:flex-col sm:items-center sm:gap-0.5">
                  <span className="font-serif text-3xl font-bold leading-none text-foreground">
                    {day}
                  </span>
                  <span className="numeric text-2xs text-warning-text font-bold tracking-widest uppercase">
                    {month}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="group-hover:text-accent-text text-foreground text-base font-semibold transition-colors">
                      {event.title}
                    </span>
                    <span className="border-rule bg-surface-sunken text-foreground-secondary rounded-full border px-2.5 py-0.5 text-2xs font-medium uppercase">
                      {event.format}
                    </span>
                  </div>
                  <p className="text-foreground-secondary mt-1.5 line-clamp-2 text-sm leading-relaxed">
                    {event.description}
                  </p>
                  <p className="numeric text-2xs text-foreground-muted mt-2">
                    {event.location ?? SITE.campusShort}
                    {event.room ? ` · ${event.room}` : ""}
                    {event.capacity ? ` · Cap ${event.capacity} seats` : ""}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end">
                  <span className="bg-bull-subtle text-bull inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-2xs font-semibold">
                    <span aria-hidden="true" className="bg-bull size-1.5 rounded-full" />
                    <span>Registration Open</span>
                  </span>
                  <span className="text-accent-text inline-flex items-center gap-1 text-xs font-semibold">
                    <span>Register / Details</span>
                    <ArrowRight
                      aria-hidden
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                    />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/* ── 7. Current challenge ────────────────────────────────────────────────── */

const CHALLENGE_BRIEF = [
  { term: "Starting capital", detail: formatMAD(money(10_000_000n)) },
  { term: "Scenario shock", detail: "+25 bps Bank Al-Maghrib rate hike & unexpected CPI print" },
  { term: "Universe", detail: "38 Bourse de Casablanca equities & Moroccan 10Y Bons du Trésor" },
  { term: "Objective", detail: "Reposition sector exposure while keeping maximum drawdown controlled" },
  {
    term: "Scored on",
    detail: "Total portfolio return (%), with lower maximum drawdown breaking ties",
  },
] as const;

const SAMPLE_STANDINGS = [
  {
    rank: 1,
    name: "Y. El Amrani",
    cohort: "M2 Finance",
    returnPct: "+8.42%",
    sharpe: "1.84",
    drawdown: "-1.18%",
  },
  {
    rank: 2,
    name: "L. Benjelloun",
    cohort: "M1 Finance",
    returnPct: "+7.15%",
    sharpe: "1.62",
    drawdown: "-1.45%",
  },
  {
    rank: 3,
    name: "K. Ouazzani",
    cohort: "L3 Économie",
    returnPct: "+6.80%",
    sharpe: "1.55",
    drawdown: "-1.92%",
  },
  {
    rank: 4,
    name: "S. Tazi",
    cohort: "L3 Gestion",
    returnPct: "+5.94%",
    sharpe: "1.41",
    drawdown: "-1.60%",
  },
  {
    rank: 5,
    name: "M. Idrissi",
    cohort: "M1 Finance",
    returnPct: "+5.20%",
    sharpe: "1.29",
    drawdown: "-2.10%",
  },
] as const;

function rankBadgeClass(rank: number): string {
  if (rank === 1) return "bg-brand text-[#0B1B2B] font-bold shadow-2xs";
  if (rank === 2) return "bg-surface-inset text-foreground font-bold border border-rule-strong";
  if (rank === 3) return "bg-warning-subtle text-warning-text font-bold border border-brand/40";
  return "bg-surface-sunken text-foreground-secondary font-semibold";
}

function ChallengeSection() {
  return (
    <Section className="border-rule bg-surface-sunken border-y">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5.5fr)_minmax(0,6.5fr)] lg:items-start">
        <div>
          <SectionHeading
            as="h2"
            title="Scenario challenge: Inflation & policy rate shock"
            lead="A macro stress-test in which inflation rises unexpectedly and Bank Al-Maghrib tightens liquidity. You start with 100,000 MAD, allocate across rate-sensitive and defensive CSE sectors, and are evaluated on risk as well as return."
            actions={
              <>
                <Button asChild>
                  <Link href="/competitions">Enter competitions</Link>
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/challenges">Practice challenges</Link>
                </Button>
              </>
            }
          />
          <div className="border-rule bg-surface mt-8 rounded-2xl border px-5 py-2 shadow-xs">
            <RuledList items={CHALLENGE_BRIEF.map(({ term, detail }) => ({ term, detail }))} />
          </div>
        </div>

        {/* Cohort Leaderboard Standings Preview (.lb-row from Landing.html) */}
        <div className="space-y-4">
          <div className="border-rule-strong/80 bg-surface overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-rule bg-surface-sunken flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
              <div className="flex items-center gap-2">
                <Trophy aria-hidden className="text-warning-text size-4" />
                <p className="label text-foreground font-semibold">
                  Sample Competition Standings · Macro BAM Shock
                </p>
              </div>
              <span className="numeric bg-bull-subtle text-bull rounded-full px-2.5 py-0.5 text-2xs font-semibold">
                Ranked by Return · Tie-break: Max DD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-rule bg-surface-sunken/60 border-b text-2xs text-foreground-secondary uppercase">
                    <th className="py-3 pl-5 pr-2 font-semibold">Rank</th>
                    <th className="px-3 py-3 font-semibold">Participant</th>
                    <th className="px-3 py-3 font-semibold">Cohort</th>
                    <th className="px-3 py-3 text-right font-semibold">Return</th>
                    <th className="px-3 py-3 text-right font-semibold">Sharpe</th>
                    <th className="py-3 pl-3 pr-5 text-right font-semibold">Max DD</th>
                  </tr>
                </thead>
                <tbody className="divide-rule divide-y">
                  {SAMPLE_STANDINGS.map((row) => (
                    <tr key={row.rank} className="hover:bg-surface-sunken/70 transition-colors">
                      <td className="py-3 pl-5 pr-2">
                        <span
                          className={`numeric inline-flex size-6 items-center justify-center rounded-full text-2xs ${rankBadgeClass(
                            row.rank,
                          )}`}
                        >
                          {row.rank}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-semibold text-foreground">{row.name}</td>
                      <td className="numeric text-2xs text-foreground-secondary px-3 py-3">
                        {row.cohort}
                      </td>
                      <td className="numeric text-bull px-3 py-3 text-right font-semibold">
                        {row.returnPct}
                      </td>
                      <td className="numeric px-3 py-3 text-right text-foreground">
                        {row.sharpe}
                      </td>
                      <td className="numeric text-bear py-3 pl-3 pr-5 text-right">
                        {row.drawdown}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-rule bg-surface-sunken flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-2xs text-foreground-secondary">
              <span>100,000.00 MAD initial equity · Zero leverage</span>
              <Link
                href="/competitions"
                className="text-accent-text hover:text-accent-hover inline-flex items-center gap-1 font-semibold"
              >
                <span>View full leaderboard methodology</span>
                <ArrowRight aria-hidden className="size-3" />
              </Link>
            </div>
          </div>

          <Alert tone="neutral">
            <p>
              When a competition window closes, participants receive a full debrief: total return,
              maximum drawdown, annualised volatility, and sector attribution under the scenario.
            </p>
          </Alert>
        </div>
      </div>
    </Section>
  );
}

/* ── 8. Educational topics ───────────────────────────────────────────────── */

const TOPIC_PREVIEWS = [
  {
    num: "01",
    slug: "what-is-a-financial-market",
    title: "What a financial market actually is",
    category: "Foundations",
    readTime: "7 min",
  },
  {
    num: "02",
    slug: "stocks-and-equities",
    title: "Stocks and equities: what a share entitles you to",
    category: "Instruments",
    readTime: "8 min",
  },
  {
    num: "03",
    slug: "bonds-and-fixed-income",
    title: "Bonds, fixed income, and Moroccan Bons du Trésor",
    category: "Instruments",
    readTime: "10 min",
  },
  {
    num: "04",
    slug: "market-orders",
    title: "Market orders: immediate execution and its price",
    category: "Execution",
    readTime: "7 min",
  },
  {
    num: "05",
    slug: "limit-orders",
    title: "Limit orders: price protection and non-execution risk",
    category: "Execution",
    readTime: "8 min",
  },
  {
    num: "06",
    slug: "slippage",
    title: "Slippage: why your fill price differs from the mid quote",
    category: "Execution",
    readTime: "8 min",
  },
  {
    num: "07",
    slug: "profit-and-loss",
    title: "Realized and unrealized profit and loss (P&L)",
    category: "Accounting",
    readTime: "9 min",
  },
  {
    num: "08",
    slug: "volatility",
    title: "Volatility: measuring dispersion without confusing it for risk",
    category: "Risk",
    readTime: "10 min",
  },
  {
    num: "09",
    slug: "diversification",
    title: "Diversification, correlation, and what it cannot protect you from",
    category: "Portfolio",
    readTime: "9 min",
  },
  {
    num: "10",
    slug: "interest-rates",
    title: "Interest rates and how policy decisions reach asset prices",
    category: "Macro",
    readTime: "11 min",
  },
] as const;

function TopicsSection() {
  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Start where you are"
        lead="Topics are ordered so each builds on the previous one. Every article links directly to its full reading, mathematical definitions, and comprehension questions."
        actions={
          <Button asChild variant="secondary">
            <Link href="/education/topics">Browse all 20 topics</Link>
          </Button>
        }
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {TOPIC_PREVIEWS.map((topic) => (
          <li key={topic.slug}>
            <Link
              href={`/education/topics/${topic.slug}`}
              className="border-rule bg-surface hover:border-brand/70 focus-visible:outline-ring group flex items-center justify-between gap-4 rounded-xl border px-4 py-3.5 shadow-2xs transition-all hover:-translate-y-0.5 hover:shadow-sm focus-visible:outline-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="numeric bg-surface-sunken text-foreground-secondary group-hover:bg-brand-subtle group-hover:text-warning-text inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-2xs font-bold transition-colors">
                  {topic.num}
                </span>
                <span className="group-hover:text-accent-text text-foreground truncate text-sm font-medium transition-colors sm:text-base">
                  {topic.title}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2.5">
                <span className="numeric text-2xs text-foreground-muted hidden sm:inline">
                  {topic.readTime}
                </span>
                <span className="label border-rule bg-surface-sunken rounded-full border px-2.5 py-0.5 text-2xs">
                  {topic.category}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── 9. Club statistics ──────────────────────────────────────────────────── */

function StatisticsSection() {
  return (
    <Section className="border-rule bg-surface border-t">
      <SectionHeading
        as="h2"
        title="What the programme currently holds"
        lead="Figures below describe the platform's own catalog and accounting rules. They are verifiable specifications, not performance claims."
      />

      <KpiStrip columns={4} className="mt-10">
        <KpiCard
          label="Tradeable instruments"
          value={<Num value={ALL_MARKET_ASSETS.length} decimals={0} size="xl" />}
          hint="Across 8 Moroccan & global markets"
        />
        <KpiCard
          label="CSE Casablanca equities"
          value={<Num value={CSE_REAL_ASSETS.length} decimals={0} size="xl" />}
          hint="Principal F · 9 official sectors"
        />
        <KpiCard
          label="Published topics"
          value={<Num value={20} decimals={0} size="xl" />}
          hint="Across six curriculum categories"
        />
        <KpiCard
          label="Starting capital"
          value={<Num cents={SIMULATION.defaultStartingCashCents} size="xl" />}
          hint="Simulated cash per portfolio"
        />
      </KpiStrip>

      <div className="mt-10">
        <RuledList
          columns={2}
          items={[
            {
              term: "Currency & accounting",
              detail:
                "Portfolios are denominated in Moroccan dirhams (MAD) and stored in integer centimes (BigInt) so floating-point rounding never corrupts a balance.",
            },
            {
              term: "Fee model",
              detail:
                "5 basis points (0.05%) institutional commission with a 0.05 MAD minimum floor, capitalised directly into each position's break-even cost basis.",
            },
            {
              term: "T+2 settlement",
              detail:
                "Equity purchases settle T+2 business days, skipping weekends. Unsettled shares are flagged in the portfolio ledger.",
            },
            {
              term: "No short selling or margin",
              detail:
                "Cash-only accounts. A sell order larger than the held position partially fills what is held and reports the exact adjustment.",
            },
          ]}
        />
      </div>
      <p className="text-muted-allowed mt-8 text-xs">{DISC_3}</p>
    </Section>
  );
}

/* ── 10. Call to action (.cta deep navy & gold from Landing.html) ────────── */

function CallToAction() {
  return (
    <Section spacing="loose" className="border-rule bg-canvas border-t">
      <div
        className="relative overflow-hidden rounded-[22px] border border-[#24384F] bg-[#0B1B2B] p-8 text-[#F0EBE0] shadow-lg sm:p-12 lg:p-14"
        style={{
          backgroundImage:
            "radial-gradient(600px 300px at 88% 15%, rgba(200, 155, 60, 0.20), transparent 60%), radial-gradient(500px 280px at 12% 100%, rgba(46, 74, 139, 0.28), transparent 60%), linear-gradient(135deg, #0B1B2B 0%, #142944 100%)",
        }}
      >
        <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1">
              <Sparkles aria-hidden className="size-3.5 text-[#D4A94F]" />
              <span className="numeric text-2xs font-semibold tracking-wider text-[#F0EBE0] uppercase">
                {SITE.name} · {SITE.campusShort}
              </span>
            </div>
            <h2 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-[#FAF6EF] sm:text-4xl">
              Open your simulated portfolio and join the next cohort challenge.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#CBD5E1]">
              An account provides a 100,000.00 MAD multi-asset paper-trading portfolio, access to
              cohort competitions, workshop registration, and the full 20-topic curriculum.
              Registration is free for students and contains no mechanism to move real money.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/create-account"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#C89B3C] px-5 text-sm font-semibold text-[#0B1B2B] shadow-sm transition-colors hover:bg-[#D4A94F]"
              >
                <span>Create a student account</span>
                <ArrowRight aria-hidden className="size-4" />
              </Link>
              <Link
                href={simulatorUrl()}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/25 bg-white/10 px-4 text-sm font-medium text-[#FAF6EF] transition-colors hover:bg-white/15"
              >
                <span>Launch simulator</span>
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md px-3.5 text-sm font-medium text-[#CBD5E1] transition-colors hover:bg-white/8 hover:text-white"
              >
                <span>Contact the board</span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/6 p-6 backdrop-blur-xs">
            <div className="flex items-center justify-between border-b border-white/15 pb-3">
              <p className="numeric text-2xs font-semibold tracking-wider text-[#D4A94F] uppercase">
                What your student account includes
              </p>
              <ShieldCheck aria-hidden className="size-4 text-[#34C792]" />
            </div>
            <ul className="mt-2 divide-y divide-white/10 text-xs">
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#CBD5E1]">Initial paper-trading allocation</span>
                <span className="numeric font-semibold text-[#FAF6EF]">100,000.00 MAD</span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#CBD5E1]">Bourse de Casablanca equities</span>
                <span className="numeric font-semibold text-[#FAF6EF]">38 Listed Companies</span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#CBD5E1]">Global Stocks, ETFs, Futures, FX, Crypto</span>
                <span className="numeric font-semibold text-[#FAF6EF]">72 Instruments</span>
              </li>
              <li className="flex items-center justify-between py-2.5">
                <span className="text-[#CBD5E1]">Written curriculum &amp; quizzes</span>
                <span className="numeric font-semibold text-[#FAF6EF]">20 Topics</span>
              </li>
              <li className="flex items-center justify-between pt-2.5">
                <span className="text-[#CBD5E1]">Real money or brokerage fees</span>
                <span className="numeric font-semibold text-[#34C792]">None (100% Educational)</span>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-white/12 pt-5 text-xs leading-relaxed text-[#94A3B8]">
          {SITE.name} · {SITE.campus}. Educational project. Nothing on this platform is investment
          advice.
        </p>
      </div>
    </Section>
  );
}
