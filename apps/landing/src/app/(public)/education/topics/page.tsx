import type { Metadata } from "next";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import Link from "next/link";
import { Badge } from "@fsjesc/ui/badge";
import { Button } from "@fsjesc/ui/button";
import { Container, SectionHeading } from "@fsjesc/ui/layout/container";
import { EmptyState } from "@fsjesc/ui/feedback";
import { getAllArticles } from "@/infrastructure/content/articles";
import {
  ARTICLE_CATEGORIES,
  CATEGORY_DESCRIPTIONS,
  CATEGORY_LABELS,
  byReadingOrder,
  type Article,
  type ArticleCategory,
} from "@fsjesc/domain/education/article";
import { formatDate } from "@fsjesc/config/format";

export const metadata: Metadata = {
  title: "All topics",
  description:
    "Every published topic in the FSJESC Financial Markets Club education centre, ordered as a reading path from first principles to portfolio construction.",
  alternates: { canonical: "/education/topics" },
};

/**
 * Topic index (Part 7.2).
 *
 * Read mode. A flat alphabetical list of twenty titles would be a browse page, not
 * a reading path, so this is organised two ways at once: grouped by category with
 * what each contains, and ordered inside each group by the sequence a reader
 * should follow.
 *
 * See DECISIONS.md D15 for the HTTP-status caveat on unprerendered parameters.
 */
export default async function TopicsIndexPage() {
  const all = await getAllArticles();

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-14">
        <SectionHeading
          as="h1"
          title="Twenty topics, in the order they build on each other"
          lead="Each takes six to ten minutes. Nothing here recommends an instrument or a strategy. The programme is about mechanics, and the judgement stays yours."
          actions={
            <Button asChild variant="secondary">
              <Link href="/education">About this programme</Link>
            </Button>
          }
        />

        {all.length === 0 ? (
          <div className="mt-12">
            <EmptyState
              title="No topics published yet"
              description="The topic library is being written. The simulator and the sessions are available now."
              action={
                <Button asChild>
                  <Link href={simulatorUrl()}>Open the simulator</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="mt-14 space-y-16">
            {ARTICLE_CATEGORIES.map((category) => (
              <TopicCategory
                key={category}
                category={category}
                articles={byReadingOrder(
                  all.filter((article) => article.frontmatter.category === category),
                )}
                total={all.length}
              />
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}

function TopicCategory({
  category,
  articles,
  total,
}: {
  category: ArticleCategory;
  articles: Article[];
  total: number;
}) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby={`category-${category}`}>
      <div className="border-rule-strong flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b pb-3">
        <h2 id={`category-${category}`} className="text-xl font-semibold tracking-tight">
          {CATEGORY_LABELS[category]}
        </h2>
        <p className="numeric text-foreground-muted text-xs">
          {articles.length} of {total}
        </p>
      </div>
      <p className="measure text-foreground-secondary mt-3 text-sm leading-relaxed">
        {CATEGORY_DESCRIPTIONS[category]}
      </p>

      <ul className="divide-rule border-rule mt-6 divide-y border-b">
        {articles.map((article, index) => (
          <li key={article.slug}>
            <Link
              href={`/education/topics/${article.slug}`}
              className="group hover:bg-surface-sunken focus-visible:outline-ring grid gap-2 py-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-8"
            >
              <span>
                <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="numeric text-foreground-muted text-xs">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-foreground text-lg font-medium group-hover:underline group-hover:underline-offset-4">
                    {article.frontmatter.title}
                  </span>
                  {article.frontmatter.essential ? <Badge tone="accent">Start here</Badge> : null}
                </span>
                <span className="measure text-foreground-secondary mt-1.5 block pl-8 text-sm leading-relaxed">
                  {article.frontmatter.summary}
                </span>
              </span>

              <span className="flex shrink-0 items-baseline gap-4 pl-8 sm:pl-0">
                <time className="numeric text-2xs text-foreground-muted">
                  {formatDate(article.frontmatter.date)}
                </time>
                <span className="numeric text-2xs text-foreground-muted">
                  {article.readingTimeMinutes} min
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
