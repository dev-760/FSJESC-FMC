import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container, RuledList, Section, SectionHeading } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { QuoteBoard, referenceRows } from "@/components/financial/quote-board";
import { formatMAD } from "@/lib/format";
import { money } from "@/lib/money";
import { DISC_3, DISC_4, SITE } from "@/config/site";

export const metadata: Metadata = {
  // No `title` override: the root layout's default is `${SITE.name} — ${SITE.tagline}`,
  // which is the right homepage title. A local `title` would replace it rather
  // than pick up the template, because `/` is the root segment.
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
 * The first viewport leads with the quote board rather than a pitch. This is a
 * research platform, and the most persuasive thing it can show is the instrument
 * set itself — real tickers, real modelled parameters, prices a student can
 * interrogate. A visitor who leaves after one screen describes a market board,
 * not a marketing page.
 *
 * Fully static: no request data, no build-time counting, so it prerenders clean
 * under Cache Components (DECISIONS.md D1).
 */
export default function HomePage() {
  return (
    <main id="main-content" className="flex-1">
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

function Hero() {
  const rows = referenceRows().slice(0, 6);

  return (
    <section className="border-rule bg-surface border-b">
      <Container
        size="wide"
        className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-14 lg:py-20"
      >
        <div className="flex flex-col justify-center">
          <h1 className="text-4xl font-semibold tracking-[-0.028em] sm:text-5xl">
            A student terminal for learning how markets actually work.
          </h1>
          <p className="measure text-foreground-secondary mt-6 text-lg leading-relaxed">
            {SITE.shortName} runs a written education programme, a paper-trading simulator priced in
            Moroccan dirhams, and scenario challenges scored on risk as well as return. Everything
            here is deterministic, so a result can be explained rather than merely reported.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/simulator">Enter the simulator</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/education">Explore education</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/competitions">View challenges</Link>
            </Button>
          </div>

          <p className="border-rule-strong measure text-foreground-muted mt-8 border-l pl-4 text-sm leading-relaxed">
            {DISC_4}
          </p>
        </div>

        {/*
          The first viewport is the thesis, not a pitch. A terminal's opening
          screen is a board, so the hero is the actual instrument set — real
          tickers, real modelled parameters — rather than an illustration of one.
          Parameter columns are hidden here because the narrower column would wrap
          the column heads; the full board carries them.
        */}
        <div className="lg:pt-1">
          <QuoteBoard
            rows={rows}
            showParameters={false}
            caption="The instrument set. The change column is a deterministic placeholder until the price model ships."
          />
          <p className="label mt-2.5">
            Six of eight instruments — the full board is on the market page
          </p>
        </div>
      </Container>
    </section>
  );
}

/* ── 2. Club introduction ────────────────────────────────────────────────── */

function ClubIntroduction() {
  return (
    <Section>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <SectionHeading
          as="h2"
          title="Most students meet market risk only as a hypothetical."
          lead={`${SITE.shortName} is a club at ${SITE.campus}. We close the gap between the textbook chapter and the actual consequence.`}
        />
        <div className="text-foreground-secondary space-y-5 text-base leading-relaxed">
          <p>
            A supply-and-demand curve, a volatility formula, a sentence about risk aversion — and
            then the mechanics that decide whether any of it works are left implicit. How an order
            becomes a fill. Why a quoted price differs from an achievable one. What a drawdown feels
            like while it is happening.
          </p>
          <p>
            So the simulator is built to make those mechanics visible. You place real orders against
            a deterministic price model, watch the consequences accumulate in a ledger that cannot
            be edited, and see your own drawdown measured rather than assumed.
          </p>
          <p>
            Members build the programme too: curating topics, designing scenarios, computing and
            presenting competition analytics, running sessions. The standard is academic.
          </p>
        </div>
      </div>
    </Section>
  );
}

/* ── 3. What we do ───────────────────────────────────────────────────────── */

const ACTIVITIES = [
  {
    title: "Workshops and lectures",
    detail:
      "Sessions on accounting, monetary policy, market microstructure and risk measurement. Open to every student of the faculty, capped only where lab space requires it.",
    href: "/events",
    linkLabel: "Session calendar",
  },
  {
    title: "Written education programme",
    detail:
      "A topic library covering instruments, execution mechanics, risk measures and portfolio construction. Each topic defines its terms, shows the arithmetic, and states what a measure does not tell you.",
    href: "/education",
    linkLabel: "Topic library",
  },
  {
    title: "Paper-trading simulator",
    detail:
      "Market and limit orders against a simulated market in MAD. Positions, executions, and a permanent record of every cash movement, with volatility, drawdown and concentration computed from your own history.",
    href: "/simulator",
    linkLabel: "Open a portfolio",
  },
  {
    title: "Scenario challenges",
    detail:
      "Time-boxed exercises under defined macroeconomic assumptions. Scored on total portfolio return, with the lower maximum drawdown winning a tie — never on absolute profit in dirhams.",
    href: "/competitions",
    linkLabel: "Current challenges",
  },
] as const;

function WhatWeDo() {
  return (
    <Section className="border-rule bg-surface-sunken border-y">
      <SectionHeading
        as="h2"
        title="Four activities, one programme"
        lead="Education supplies the concepts, the simulator supplies the practice, and challenges supply the pressure of a deadline."
      />
      <div className="mt-10">
        <RuledList items={ACTIVITIES.map((a) => ({ term: a.title, detail: a.detail }))} />
      </div>
      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
        {ACTIVITIES.map((activity) => (
          <Link
            key={activity.href}
            href={activity.href}
            className="text-accent-text hover:text-accent-hover focus-visible:outline-ring rounded text-sm underline underline-offset-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            {activity.linkLabel}
          </Link>
        ))}
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
    "Risk measures arrive with their formula and a worked example, not just a name.",
  ],
  [
    "State the limits",
    "Where a measure is informative and where it misleads is part of the topic.",
  ],
  ["No recommendations", "Nothing on this platform says what any person should do with money."],
] as const;

function EducationSection() {
  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Concepts before instruments"
        lead="The education programme is written so a topic can be read with no prior market experience, and without being steered toward a conclusion about what to buy."
        actions={
          <Button asChild>
            <Link href="/education">Explore education</Link>
          </Button>
        }
      />
      <div className="mt-10">
        <p className="label mb-3">How we write about markets</p>
        <RuledList
          columns={2}
          items={WRITING_STANDARDS.map(([term, detail]) => ({ term, detail }))}
        />
      </div>
    </Section>
  );
}

/* ── 5. Paper-trading simulator ──────────────────────────────────────────── */

function SimulatorSection() {
  const rows = referenceRows().slice(2, 6);

  return (
    <Section className="border-rule bg-surface border-y">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
        <div>
          <SectionHeading
            as="h2"
            title="A market that behaves the same way every time"
            lead="Eight invented instruments across six sectors, priced in MAD by a hash-seeded deterministic model. The same input yields the same price on every machine — which is what makes a classroom discussion of results possible at all."
          />
          <div className="mt-10">
            <RuledList
              items={[
                {
                  term: "Starting cash",
                  detail: `Each new portfolio is funded with ${formatMAD(money(10_000_000n))} of simulated capital.`,
                },
                {
                  term: "Order types",
                  detail:
                    "Market and limit orders, with a review step before anything executes and a two-step confirmation before submission.",
                },
                {
                  term: "Permanent ledger",
                  detail:
                    "Every cash movement is recorded in an append-only ledger. Records are never edited or deleted.",
                },
                {
                  term: "Risk analytics",
                  detail:
                    "Annualised volatility, maximum drawdown and position concentration, computed from your own simulated history.",
                },
              ]}
            />
          </div>
          <div className="mt-8 flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/simulator">Enter the simulator</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/simulator/market">Browse the market</Link>
            </Button>
          </div>
        </div>

        <div className="lg:sticky lg:top-24">
          <QuoteBoard
            rows={rows}
            caption="A four-instrument excerpt. The full board, with every instrument and its modelled parameters, is on the market page."
            showParameters={false}
            animate={false}
          />
          <Alert tone="warning" className="mt-4">
            <p>
              These are not real securities. No company, index or exchange is represented, and
              nothing corresponds to anything tradable.
            </p>
          </Alert>
        </div>
      </div>
    </Section>
  );
}

/* ── 6. Upcoming workshops ───────────────────────────────────────────────── */

const WORKSHOPS = [
  {
    title: "Reading financial statements",
    format: "Workshop",
    detail:
      "Balance sheet, income statement and cash flow, read line by line. No prior accounting assumed.",
  },
  {
    title: "How central bank policy reaches prices",
    format: "Lecture",
    detail:
      "Transmission from the policy rate to asset prices, with published Bank Al-Maghrib statements as case material.",
  },
  {
    title: "Volatility and drawdown in practice",
    format: "Workshop",
    detail:
      "Compute both measures for a sample series, then discuss what each one fails to tell you.",
  },
] as const;

function WorkshopsSection() {
  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Sessions you can attend"
        lead="Open to every student of the faculty. Where a session needs lab space, registration is capped at capacity."
        actions={
          <Button asChild variant="secondary">
            <Link href="/events">All events</Link>
          </Button>
        }
      />
      <ul className="divide-rule border-rule mt-10 max-w-4xl divide-y border-y">
        {WORKSHOPS.map((workshop) => (
          <li key={workshop.title}>
            <Link
              href="/events"
              className="hover:bg-surface-sunken focus-visible:outline-ring grid gap-2 py-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
            >
              <span className="grid gap-1 sm:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] sm:gap-8">
                <span className="text-foreground text-base font-medium">{workshop.title}</span>
                <span className="text-foreground-secondary text-sm leading-relaxed">
                  {workshop.detail}
                </span>
              </span>
              <span className="label whitespace-nowrap sm:pt-1">{workshop.format}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── 7. Current challenge ────────────────────────────────────────────────── */

const CHALLENGE_BRIEF = [
  { term: "Starting capital", detail: formatMAD(money(10_000_000n)), numeric: true },
  { term: "Duration", detail: "30 minutes" },
  { term: "Objective", detail: "Build a portfolio while keeping drawdown under control" },
  {
    term: "Scored on",
    detail: "Total return, with the lower maximum drawdown as the tie-break",
  },
] as const;

function ChallengeSection() {
  return (
    <Section className="border-rule bg-surface-sunken border-y">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
        <SectionHeading
          as="h2"
          title="Inflation shock"
          lead="A thirty-minute scenario in which inflation rises unexpectedly. You start with 100,000 MAD, build a portfolio under the shock, and are measured on the risk you took as well as the return."
          actions={
            <Button asChild>
              <Link href="/competitions">See the full brief</Link>
            </Button>
          }
        />
        <div>
          <RuledList items={CHALLENGE_BRIEF.map(({ term, detail }) => ({ term, detail }))} />
          <Alert tone="neutral" className="mt-6">
            <p>
              When the window closes you see your final return, maximum drawdown, annualised
              volatility and sector exposure, with feedback on what your positioning did under the
              scenario. The feedback describes your outcome; it does not declare a strategy
              universally correct.
            </p>
          </Alert>
        </div>
      </div>
    </Section>
  );
}

/* ── 8. Educational topics ───────────────────────────────────────────────── */

const TOPIC_PREVIEWS = [
  { title: "What a financial market actually is", category: "Foundations" },
  { title: "Stocks, and what a share entitles you to", category: "Instruments" },
  { title: "Market orders, limit orders, and what a fill means", category: "Execution" },
  { title: "Slippage: why your price is not the quoted price", category: "Execution" },
  { title: "Realized and unrealized profit and loss", category: "Accounting" },
  { title: "Volatility and maximum drawdown", category: "Risk" },
  { title: "Diversification, and what it does not protect you from", category: "Portfolio" },
] as const;

function TopicsSection() {
  return (
    <Section>
      <SectionHeading
        as="h2"
        title="Start where you are"
        lead="Topics are ordered so each builds on the previous one. Each takes about six to ten minutes to read."
        actions={
          <Button asChild variant="secondary">
            <Link href="/education/topics">All topics</Link>
          </Button>
        }
      />
      <ul className="divide-rule border-rule mt-10 max-w-4xl divide-y border-y">
        {TOPIC_PREVIEWS.map((topic) => (
          <li key={topic.title}>
            <Link
              href="/education/topics"
              className="hover:bg-surface-sunken focus-visible:outline-ring grid gap-1 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
            >
              <span className="text-foreground text-base">{topic.title}</span>
              <span className="label whitespace-nowrap">{topic.category}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/* ── 9. Club statistics ──────────────────────────────────────────────────── */

/**
 * Static counts: the homepage prerenders completely, so it must not count rows at
 * request time. Phase 5 replaces these with real figures behind `use cache`.
 */
function StatisticsSection() {
  return (
    <Section className="border-rule bg-surface border-t">
      <SectionHeading
        as="h2"
        title="What the programme currently holds"
        lead="Figures below describe the platform's own contents. They are not performance claims."
      />
      <div className="mt-10">
        <RuledList
          columns={2}
          items={[
            {
              term: "Published topics",
              detail: "20 across six categories, from first principles to portfolio construction.",
            },
            {
              term: "Simulated instruments",
              detail: "8 fictional Moroccan instruments across six sectors.",
            },
            {
              term: "Scenario challenges",
              detail: "6 macro scenarios, each with published assumptions.",
            },
            {
              term: "Starting capital",
              detail: `${formatMAD(money(10_000_000n))} of simulated cash per portfolio.`,
            },
            { term: "Currency", detail: "Moroccan dirham (MAD) throughout. Simulated." },
            {
              term: "Fee model",
              detail: "Zero brokerage commission, so the focus stays on market mechanics.",
            },
          ]}
        />
      </div>
      <p className="text-foreground-muted mt-8 text-xs">{DISC_3}</p>
    </Section>
  );
}

/* ── 10. Call to action ──────────────────────────────────────────────────── */

function CallToAction() {
  return (
    <Section spacing="loose" className="border-rule border-t">
      <Container size="prose" className="text-center">
        <h2 className="text-3xl font-semibold tracking-tight">Join the programme</h2>
        <p className="text-foreground-secondary mt-4 text-base leading-relaxed">
          An account gives you a simulated portfolio, access to competitions, event registration,
          and the member resources. It takes a minute and costs nothing — there is no mechanism to
          move real money on this platform.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Button asChild size="lg">
            <Link href="/create-account">Create an account</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link href="/contact">Ask a question</Link>
          </Button>
        </div>
        <p className="border-rule text-foreground-muted mt-10 border-t pt-6 text-xs leading-relaxed">
          {SITE.name} · {SITE.campus}. Educational project. Nothing on this platform is investment
          advice.
        </p>
      </Container>
    </Section>
  );
}
