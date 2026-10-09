import { z } from "zod";

/**
 * Article domain model (Part 7.2).
 *
 * Pure TypeScript: no filesystem, no React, no unified pipeline. The loader in
 * `src/infrastructure/content` produces these records, and the presentation layer
 * renders them. Keeping the contract here means validation rules are stated once
 * and hold whether an article came from disk, from the database in a later phase,
 * or from a test fixture (N7, N10).
 */

/**
 * Topic categories. Six, deliberately few — a category that cannot hold two
 * topics is not a category.
 */
export const ARTICLE_CATEGORIES = [
  "foundations",
  "instruments",
  "pricing",
  "execution",
  "accounting",
  "risk-portfolio",
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ArticleCategory, string> = {
  foundations: "Foundations",
  instruments: "Instruments",
  pricing: "Pricing and analysis",
  execution: "Execution",
  accounting: "Accounting",
  "risk-portfolio": "Risk and portfolio",
};

/**
 * Short descriptions of what each category contains. Used on the index so a
 * reader can choose a path rather than browsing a flat list.
 */
export const CATEGORY_DESCRIPTIONS: Record<ArticleCategory, string> = {
  foundations: "What a market is, and the economic conditions that move prices.",
  instruments: "What you actually own when you own something, and what it entitles you to.",
  pricing: "How a price is thought about — from past prices, from fundamentals, from behaviour.",
  execution: "How an intention becomes a fill, and what it costs you to get one.",
  accounting: "Recording outcomes correctly, so a portfolio can be read back honestly.",
  "risk-portfolio": "Measuring risk, and deciding how much of it to carry.",
};

/** Topics that must be readable before others make sense. */
export const FOUNDATION_TOPICS: readonly string[] = [
  "what-is-a-financial-market",
  "inflation",
  "interest-rates",
  "supply-and-demand",
  "economic-cycles",
];

export interface TableOfContentsEntry {
  id: string;
  text: string;
  depth: number;
}

/**
 * Frontmatter.
 *
 * Validated with Zod at load time, so a malformed article is a build error rather
 * than a page that renders half a title. `readingTime` is optional because it is
 * derived from the body — an author-supplied number would silently go stale.
 */
export const frontmatterSchema = z.object({
  title: z.string().trim().min(8, "A title needs at least 8 characters").max(140),
  category: z.enum(ARTICLE_CATEGORIES),
  date: z.coerce.date(),
  summary: z.string().trim().min(40, "A summary needs at least 40 characters").max(400),
  /** Optional author-supplied reading time in minutes; computed when absent. */
  readingTime: z.number().int().positive().max(60).optional(),
  /** Slugs of related topics, for the related-topics block. */
  related: z.array(z.string()).max(6).default([]),
  /** Marks material that must be read before using the simulator. */
  essential: z.boolean().default(false),
});

export type Frontmatter = z.infer<typeof frontmatterSchema>;

export interface Article {
  slug: string;
  frontmatter: Frontmatter;
  /**
   * Sanitised HTML. Safe to render with `dangerouslySetInnerHTML` and safe by
   * construction: see the pipeline in `src/infrastructure/content/markdown.ts`,
   * where sanitisation runs *before* the trusted slug and anchor transforms.
   */
  html: string;
  /** Headings extracted from the rendered tree, so TOC ids always match the output. */
  tableOfContents: TableOfContentsEntry[];
  /** Words in the body, excluding frontmatter and headings. */
  wordCount: number;
  /** Minutes to read at 220 words per minute, rounded up, minimum 1. */
  readingTimeMinutes: number;
}

/** Words per minute used for the reading-time estimate. */
export const READING_SPEED_WPM = 220;

export function readingTimeFor(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / READING_SPEED_WPM));
}

/** Slug rules. Slugs are URLs, so they are validated on the way in. */
export const articleSlugSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "must be lowercase alphanumeric words separated by single hyphens",
  );

/**
 * The reading path, in the order a reader should meet the topics.
 *
 * Foundations first, then what you own, then how a price is formed, then how an
 * intention becomes a fill, then how the outcome is recorded, then how much of
 * the risk to carry. Topics not listed here sort after the listed ones,
 * alphabetically, so adding a topic never silently reorders the path.
 *
 * No duplicates: a repeated entry would consume a slot without adding a topic,
 * and the count is asserted against the platform's published claim.
 */
export const TOPIC_SEQUENCE: readonly string[] = [
  ...FOUNDATION_TOPICS,
  "stocks-and-equities",
  "bonds-and-fixed-income",
  "market-capitalisation",
  "market-orders",
  "limit-orders",
  "slippage",
  "profit-and-loss",
  "volatility",
  "risk-and-return",
  "diversification",
  "portfolio-allocation",
  "portfolio-risk",
  "technical-indicators",
  "fundamental-analysis",
  "behavioural-finance",
];

export function sequenceIndex(slug: string): number {
  const index = TOPIC_SEQUENCE.indexOf(slug);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

/** Sort into the reading path. Stable for slugs that are not in the sequence. */
export function byReadingOrder<T extends { slug: string }>(articles: readonly T[]): T[] {
  return [...articles].sort((a, b) => {
    const delta = sequenceIndex(a.slug) - sequenceIndex(b.slug);
    return delta !== 0 ? delta : a.slug.localeCompare(b.slug);
  });
}

/** Group by category, preserving the reading-path order inside each group. */
export function byCategory<T extends { slug: string; frontmatter: Frontmatter }>(
  articles: readonly T[],
): Map<ArticleCategory, T[]> {
  const grouped = new Map<ArticleCategory, T[]>();
  for (const article of byReadingOrder(articles)) {
    const bucket = grouped.get(article.frontmatter.category) ?? [];
    bucket.push(article);
    grouped.set(article.frontmatter.category, bucket);
  }
  return grouped;
}

/**
 * Which topics come next and which precede this one. A reader finishing a topic
 * should be told where to go next; that is wayfinding, not decoration.
 */
export function neighbours<T extends { slug: string }>(
  article: T,
  all: readonly T[],
): { previous?: T; next?: T } {
  const ordered = byReadingOrder(all);
  const index = ordered.findIndex((candidate) => candidate.slug === article.slug);
  if (index === -1) return {};
  return {
    ...(index > 0 ? { previous: ordered[index - 1] } : {}),
    ...(index < ordered.length - 1 ? { next: ordered[index + 1] } : {}),
  };
}

/**
 * Resolve a topic's declared relations, dropping any that do not exist.
 *
 * The `related` list is read from the article's own frontmatter, so the caller
 * passes an article-shaped value; a caller that only has slugs can pass
 * `{ slug, frontmatter: { related: [...] } }` without constructing a full record.
 */
export function resolveRelated<T extends { slug: string; frontmatter: { related: string[] } }>(
  article: T,
  all: readonly T[],
): T[] {
  const declared = new Set(all.map((candidate) => candidate.slug));
  const wanted = article.frontmatter?.related ?? [];
  return wanted
    .filter((slug: string) => slug !== article.slug && declared.has(slug))
    .map((slug: string) => all.find((candidate) => candidate.slug === slug))
    .filter((candidate): candidate is T => Boolean(candidate));
}
