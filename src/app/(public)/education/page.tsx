import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container, RuledList, Section, SectionHeading } from "@/components/layout/container";
import { getAllArticles } from "@/infrastructure/content/articles";
import {
  ARTICLE_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  FOUNDATION_TOPICS,
  byReadingOrder,
} from "@/domain/education/article";
import { DISC_2, SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Financial education",
  description: `${SITE.shortName}'s education centre: twenty topics on markets, instruments, execution mechanics, accounting and risk, written for students meeting them for the first time.`,
  alternates: { canonical: "/education" },
};

const WRITING_STANDARDS = [
  {
    term: "Define before using",
    detail:
      "Every technical term is defined at first use, in the topic where it matters. Nothing is assumed to be known.",
  },
  {
    term: "Show the arithmetic",
    detail:
      "Risk measures arrive with their formula and a worked example, because a measure you cannot reproduce is a measure you cannot check.",
  },
  {
    term: "State the limits",
    detail:
      "Where a measure is informative and where it misleads is part of the topic, not a footnote to it.",
  },
  {
    term: "Name the evidence",
    detail:
      "External economic facts come from authoritative published sources, cited and dated. Nothing is estimated and presented as fact.",
  },
  {
    term: "No recommendations",
    detail:
      "Nothing on this platform says what any person should do with money, and no topic implies that a particular strategy is correct.",
  },
  {
    term: "Say what is not covered",
    detail:
      "Where a topic explains something the simulator cannot practise, it says so rather than letting the gap pass unremarked.",
  },
];

const NOT_COVERED = [
  {
    term: "What to buy",
    detail:
      "No topic names an instrument to hold or a strategy to use. Where a method is described, the conditions under which it stops working are described with it.",
  },
  {
    term: "What will happen next",
    detail:
      "Topics explain mechanisms and measurement. Forecasting is a different activity with a much poorer record, and the platform does not present estimates as predictions.",
  },
  {
    term: "Company valuation",
    detail:
      "The simulator's instruments have a sector, a drift, and a volatility; they carry no balance sheet, earnings report, or share count. Valuing a business requires separate accounting frameworks, which this simulation does not model.",
  },
  {
    term: "Behaviour in the simulator",
    detail:
      "Prices come from a deterministic model with no agents and no beliefs. There is no crowding to observe, because there is nobody to crowd. Your own order history is yours to analyse.",
  },
  {
    term: "Your own circumstances",
    detail:
      "The right allocation depends on your horizon, your liabilities and what you would actually do at a 40% decline. No platform can settle that, and this one does not try.",
  },
];

/**
 * Education centre (Part 7.2).
 *
 * Read mode. This page's job is wayfinding: what the programme contains, the order
 * it should be read in, and an honest statement of what it will not tell you.
 */
export default async function EducationPage() {
  const all = byReadingOrder(await getAllArticles());
  const foundations = all.filter((article) => FOUNDATION_TOPICS.includes(article.slug));
  const wordTotal = all.reduce((sum, article) => sum + article.wordCount, 0);

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-14">
        <SectionHeading
          as="h1"
          title="Concepts before instruments"
          lead="Most students meet market mechanics as a chapter in a textbook and market risk as a hypothetical. This programme closes that gap through twenty concise topics, ordered so each builds on the last."
          actions={
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/education/topics">Browse all topics</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/simulator">Open the simulator</Link>
              </Button>
            </div>
          }
        />

        <div className="border-rule mt-12 grid gap-4 border-y py-6 sm:grid-cols-4">
          {[
            { term: "Topics", value: String(all.length) },
            { term: "Categories", value: String(ARTICLE_CATEGORIES.length) },
            { term: "Words", value: wordTotal.toLocaleString("en-US") },
            { term: "Reading time", value: `${Math.round(wordTotal / 220 / 60)} h` },
          ].map((stat) => (
            <div key={stat.term}>
              <p className="label">{stat.term}</p>
              <p className="numeric mt-1 text-2xl font-semibold tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* ── The reading path ─────────────────────────────────────────── */}
        <Section contained={false}>
          <SectionHeading
            as="h2"
            title="Where to start"
            lead="Five topics, in order. They need no prior market experience, and they define the vocabulary the rest of the programme assumes."
          />
          <ol className="divide-rule border-rule mt-10 divide-y border-y">
            {foundations.map((article, index) => (
              <li key={article.slug}>
                <Link
                  href={`/education/topics/${article.slug}`}
                  className="group hover:bg-surface-sunken focus-visible:outline-ring grid gap-2 py-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
                >
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="numeric text-foreground-muted text-xs">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-foreground text-lg font-medium group-hover:underline group-hover:underline-offset-4">
                      {article.frontmatter.title}
                    </span>
                  </span>
                  <span className="numeric text-2xs text-foreground-muted pl-8 sm:pl-0">
                    {article.readingTimeMinutes} min
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </Section>

        {/* ── Categories ──────────────────────────────────────────────── */}
        <Section contained={false} className="border-rule border-t">
          <SectionHeading
            as="h2"
            title="What the programme covers"
            lead="Six categories. Each exists because the questions in it are genuinely different, not because a syllabus needed a heading."
          />
          <div className="mt-10">
            <RuledList
              columns={2}
              items={ARTICLE_CATEGORIES.map((category) => ({
                term: CATEGORY_LABELS[category],
                detail: CATEGORY_DESCRIPTIONS[category],
              }))}
            />
          </div>
        </Section>

        {/* ── How we write ────────────────────────────────────────────── */}
        <Section contained={false} className="bg-surface-sunken border-rule border-t">
          <SectionHeading
            as="h2"
            title="How we write about markets"
            lead="These are editorial rules, not aspirations. They are why a topic sometimes spends three paragraphs on what a measure does not tell you."
          />
          <div className="mt-10">
            <RuledList items={WRITING_STANDARDS} />
          </div>
        </Section>

        {/* ── What it will not tell you ───────────────────────────────── */}
        <Section contained={false} className="border-rule border-t">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            <SectionHeading
              as="h2"
              title="What this programme will not tell you"
              lead="Being explicit about a limit is part of teaching the subject honestly, so these are stated rather than left to be discovered."
            />
            <RuledList items={NOT_COVERED} />
          </div>
        </Section>

        {/* ── Close ───────────────────────────────────────────────────── */}
        <Section contained={false} spacing="loose" className="border-rule border-t">
          <Container size="prose" className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight">Ready to start?</h2>
            <p className="measure text-foreground-secondary mx-auto mt-4 text-base leading-relaxed">
              Twenty topics take about four hours. After that the simulator will make much more
              sense, because you will know what each number in it is telling you.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-2">
              <Button asChild size="lg">
                <Link href="/education/topics">Browse all topics</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/simulator">Open the simulator</Link>
              </Button>
            </div>
            <p className="border-rule text-foreground-muted mt-10 border-t pt-6 text-xs leading-relaxed">
              {DISC_2}
            </p>
          </Container>
        </Section>
      </Container>
    </main>
  );
}
