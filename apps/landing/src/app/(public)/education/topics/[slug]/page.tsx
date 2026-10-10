import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button } from "@fsjesc/ui/button";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import { ArticleBody, ArticleDisclaimer, ArticleHeader } from "@fsjesc/ui/education/article-body";
import { TableOfContents } from "@fsjesc/ui/education/table-of-contents";
import { getAllArticles, getArticle, listArticleSlugs } from "@/infrastructure/content/articles";
import {
  CATEGORY_LABELS,
  articleSlugSchema,
  neighbours,
  resolveRelated,
} from "@fsjesc/domain/education/article";
import { formatDate } from "@fsjesc/config/format";

/**
 * Article pages (Part 7.2).
 *
 * Read mode. The structure is for comprehension first: a title and summary, the
 * table of contents, the body at a readable measure, then the way out — related
 * topics and the neighbouring topic in the reading path.
 *
 * See DECISIONS.md D15 for the HTTP-status caveat on unprerendered parameters.
 */
export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const slugs = await listArticleSlugs();
  return slugs
    .filter((slug) => articleSlugSchema.safeParse(slug).success)
    .map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/education/topics/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const parsed = articleSlugSchema.safeParse(slug);
  if (!parsed.success) {
    return { title: "Topic not found", robots: { index: false, follow: false } };
  }

  try {
    const article = await getArticle(slug);
    return {
      title: article.frontmatter.title,
      description: article.frontmatter.summary,
      alternates: { canonical: `/education/topics/${slug}` },
      openGraph: {
        type: "article",
        title: article.frontmatter.title,
        description: article.frontmatter.summary,
        url: `/education/topics/${slug}`,
        publishedTime: article.frontmatter.date.toISOString(),
      },
    };
  } catch {
    return { title: "Topic not found", robots: { index: false, follow: false } };
  }
}

export default async function TopicPage({ params }: PageProps<"/education/topics/[slug]">) {
  const { slug } = await params;

  let article;
  try {
    article = await getArticle(slug);
  } catch {
    notFound();
  }

  const all = await getAllArticles();
  const related = resolveRelated(article, all);
  const { previous, next } = neighbours(article, all);
  const category = CATEGORY_LABELS[article.frontmatter.category];

  // JSON-LD so an article is identifiable as an article rather than as a page of
  // prose. Serialised from a literal built here; no submitted value reaches it.
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.frontmatter.title,
    description: article.frontmatter.summary,
    datePublished: article.frontmatter.date.toISOString(),
    wordCount: article.wordCount,
    inLanguage: "en",
    author: { "@type": "Organization", name: "FSJESC Financial Markets Club" },
    publisher: { "@type": "Organization", name: "FSJESC Financial Markets Club" },
  };

  return (
    <main id="main-content" className="flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-foreground-secondary flex flex-wrap items-center gap-2 text-sm">
            <li>
              <Link
                href="/education"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Education
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li>
              <Link
                href="/education/topics"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Topics
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              {article.frontmatter.title}
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:gap-16">
          {/* ── Contents rail ────────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <TableOfContents entries={article.tableOfContents} />
          </aside>

          {/* ── Article ──────────────────────────────────────────────── */}
          <article className="min-w-0">
            <ArticleHeader
              title={article.frontmatter.title}
              categoryLabel={category}
              publishedOn={formatDate(article.frontmatter.date)}
              readingTime={`${article.readingTimeMinutes} min read`}
              summary={article.frontmatter.summary}
              essential={article.frontmatter.essential}
            />

            <div className="border-rule mt-10 border-t pt-10">
              <ArticleBody html={article.html} />
            </div>

            <ArticleDisclaimer className="mt-12 max-w-[68ch]" />

            {related.length > 0 ? (
              <section className="mt-12 max-w-[68ch]" aria-labelledby="related-topics">
                <h2 id="related-topics" className="text-lg font-semibold tracking-tight">
                  Related topics
                </h2>
                <ul className="divide-rule border-rule mt-5 divide-y border-y">
                  {related.map((candidate) => (
                    <li key={candidate.slug}>
                      <Link
                        href={`/education/topics/${candidate.slug}`}
                        className="group hover:bg-surface-sunken focus-visible:outline-ring flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                      >
                        <span className="text-foreground text-base font-medium group-hover:underline group-hover:underline-offset-4">
                          {candidate.frontmatter.title}
                        </span>
                        <span className="label whitespace-nowrap">
                          {CATEGORY_LABELS[candidate.frontmatter.category]} ·{" "}
                          {candidate.readingTimeMinutes} min
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {previous || next ? (
              <nav
                aria-label="Reading path"
                className="border-rule bg-rule mt-14 grid gap-px overflow-hidden rounded-lg border sm:grid-cols-2"
              >
                {previous ? (
                  <TopicStep
                    direction="Previous"
                    slug={previous.slug}
                    title={previous.frontmatter.title}
                  />
                ) : (
                  <div className="bg-surface-raised p-5" />
                )}
                {next ? (
                  <TopicStep direction="Next" slug={next.slug} title={next.frontmatter.title} />
                ) : null}
              </nav>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <Link href="/education/topics">All topics</Link>
              </Button>
              <Button asChild>
                <Link href={simulatorUrl()}>Open the simulator</Link>
              </Button>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

function TopicStep({
  direction,
  slug,
  title,
}: {
  direction: "Previous" | "Next";
  slug: string;
  title: string;
}) {
  return (
    <Link
      href={`/education/topics/${slug}`}
      rel={direction === "Previous" ? "prev" : "next"}
      className="group bg-surface-raised hover:bg-surface-sunken focus-visible:outline-ring p-5 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
    >
      <p className="label">{direction}</p>
      <p className="text-foreground mt-2 text-base font-medium group-hover:underline group-hover:underline-offset-4">
        {title}
      </p>
    </Link>
  );
}

/**
 * The content directory, exposed so the sitemap and the topic index read the same
 * source of truth. Re-exported rather than duplicated so no route can drift.
 */
export const contentDirectory = path.join(process.cwd(), "src/content/topics");

export async function contentExists(): Promise<boolean> {
  try {
    await fs.access(contentDirectory);
    return true;
  } catch {
    return false;
  }
}
