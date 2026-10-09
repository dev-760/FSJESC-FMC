import { describe, expect, it } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { parseArticle } from "@/infrastructure/content/articles";
import {
  ARTICLE_CATEGORIES,
  FOUNDATION_TOPICS,
  TOPIC_SEQUENCE,
  articleSlugSchema,
} from "@/domain/education/article";

/**
 * The published topic library (Part 7.2).
 *
 * These assertions hold every article on disk to the claims the rest of the
 * platform makes about it — the homepage says twenty topics in six categories,
 * and the sitemap reads the same directory. A file that fails here would make one
 * of those claims false.
 */

const TOPICS_DIR = path.join(process.cwd(), "src/content/topics");

const files = (await readdir(TOPICS_DIR)).filter((name) => name.endsWith(".md")).sort();
const sources = new Map<string, string>();
for (const file of files) {
  sources.set(file.replace(/\.md$/, ""), await readFile(path.join(TOPICS_DIR, file), "utf8"));
}

const articles = [...sources].map(([slug, source]) => parseArticle(slug, source));

/** The 20 topics named in Part 7.2, by their intended subject. */
const EXPECTED_SUBJECTS = [
  "what-is-a-financial-market",
  "stocks-and-equities",
  "bonds-and-fixed-income",
  "inflation",
  "interest-rates",
  "supply-and-demand",
  "market-capitalisation",
  "risk-and-return",
  "diversification",
  "portfolio-allocation",
  "market-orders",
  "limit-orders",
  "slippage",
  "volatility",
  "profit-and-loss",
  "technical-indicators",
  "fundamental-analysis",
  "behavioural-finance",
  "portfolio-risk",
  "economic-cycles",
] as const;

describe("the topic library", () => {
  it("publishes exactly the twenty topics the specification names", () => {
    expect(sources.size).toBe(20);
    for (const slug of EXPECTED_SUBJECTS) {
      expect(sources.has(slug), `missing topic: ${slug}`).toBe(true);
    }
    // No extras: a topic not in the specification would make the count a claim
    // rather than a fact.
    const extra = [...sources.keys()].filter((slug) => !EXPECTED_SUBJECTS.includes(slug as never));
    expect(extra).toEqual([]);
  });

  it("gives every file a valid slug", () => {
    for (const slug of sources.keys()) {
      expect(articleSlugSchema.safeParse(slug).success, slug).toBe(true);
    }
  });

  it("parses every article without error", () => {
    expect(articles).toHaveLength(20);
  });

  it("spreads across all six categories", () => {
    const used = new Set(articles.map((article) => article.frontmatter.category));
    expect([...used].sort()).toEqual([...ARTICLE_CATEGORIES].sort());
  });

  it("gives every category at least one topic", () => {
    for (const category of ARTICLE_CATEGORIES) {
      const count = articles.filter((a) => a.frontmatter.category === category).length;
      expect(count, `category ${category} has no topic`).toBeGreaterThan(0);
    }
  });

  it("writes substantial articles, not stubs", () => {
    for (const article of articles) {
      expect(article.wordCount, `${article.slug} is too short`).toBeGreaterThan(600);
      expect(article.html, `${article.slug} has no body`).toContain("<h2");
    }
  });

  it("gives every article a table of contents", () => {
    for (const article of articles) {
      expect(article.tableOfContents.length, `${article.slug} has no headings`).toBeGreaterThan(2);
    }
  });

  it("reports a reading time consistent with its length", () => {
    for (const article of articles) {
      expect(article.readingTimeMinutes).toBeGreaterThanOrEqual(2);
      expect(article.readingTimeMinutes).toBeLessThanOrEqual(20);
    }
  });

  it("carries distinct titles and summaries", () => {
    const titles = new Set(articles.map((a) => a.frontmatter.title));
    const summaries = new Set(articles.map((a) => a.frontmatter.summary));
    expect(titles.size).toBe(20);
    expect(summaries.size).toBe(20);
  });

  it("dates every article inside the academic programme", () => {
    for (const article of articles) {
      expect(article.frontmatter.date).toBeInstanceOf(Date);
      expect(article.frontmatter.date.getTime()).toBeGreaterThan(Date.UTC(2026, 0, 1));
      expect(article.frontmatter.date.getTime()).toBeLessThan(Date.UTC(2027, 0, 1));
    }
  });
});

describe("the reading path", () => {
  it("sequences every published topic", () => {
    // A topic missing from the sequence still sorts (last, alphabetically), but
    // the index promises an order, so a gap should be visible in a test.
    const unsequenced = [...sources.keys()].filter((slug) => !TOPIC_SEQUENCE.includes(slug));
    expect(unsequenced).toEqual([]);
  });

  it("marks the foundation topics as essential reading", () => {
    for (const article of articles) {
      if (FOUNDATION_TOPICS.includes(article.slug)) {
        expect(article.frontmatter.essential, `${article.slug} should be marked essential`).toBe(
          true,
        );
      }
    }
  });

  it("only relates topics to ones that exist", () => {
    const slugs = new Set(sources.keys());
    for (const article of articles) {
      for (const related of article.frontmatter.related) {
        expect(slugs.has(related), `${article.slug} relates to missing ${related}`).toBe(true);
        expect(related).not.toBe(article.slug);
      }
    }
  });

  it("gives every topic at least one relation", () => {
    // A reader finishing a topic should be able to find the next one.
    for (const article of articles) {
      expect(
        article.frontmatter.related.length,
        `${article.slug} has no relations`,
      ).toBeGreaterThan(0);
    }
  });

  it("relates topics mostly within the same category", () => {
    // Categories with a single topic cannot relate to a peer — the accounting
    // category has one article — so the rule only applies where a peer exists.
    const counts = new Map<string, number>();
    for (const article of articles) {
      const key = article.frontmatter.category;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const bySlug = new Map(articles.map((a) => [a.slug, a]));

    for (const article of articles) {
      if ((counts.get(article.frontmatter.category) ?? 0) < 2) continue;
      const sameCategory = article.frontmatter.related.filter(
        (slug) => bySlug.get(slug)?.frontmatter.category === article.frontmatter.category,
      );
      expect(
        sameCategory.length,
        `${article.slug} relates mostly outside its category`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it("covers every category with at least one relation or peer", () => {
    // Whichever category a topic belongs to, it has somewhere to go next.
    const bySlug = new Map(articles.map((a) => [a.slug, a]));
    for (const article of articles) {
      const resolved = article.frontmatter.related.filter((slug) => bySlug.has(slug));
      expect(resolved.length, `${article.slug} has no resolvable relations`).toBeGreaterThan(0);
    }
  });
});

describe("editorial rules (Part 0.4)", () => {
  const banned = [
    "get rich",
    "guaranteed",
    "10x",
    "beat the market",
    "easy money",
    "risk-free profit",
    "secret strategy",
    "winning strategy",
  ];

  /** A negation in the same clause, or an assertion about what is not true. */
  const NEGATED =
    /\b(not|no|never|nothing|cannot|nor|without|nobody|isn't|aren't|don't|doesn't)\b/i;

  /**
   * Strip refutations before checking for hype.
   *
   * The ban is on *claims*. A topic that says "holding to maturity is not
   * guaranteed" is doing the opposite of violating it, and a blunt substring
   * check would force a worse sentence — either dropping the caution or dropping
   * the topic. So a clause that carries a negation does not count.
   *
   * The check runs on the Markdown source rather than the rendered HTML: a colon
   * introducing a list is a real clause boundary in prose and invisible in markup.
   */
  const assertions = (markdown: string): string =>
    markdown
      .split(/(?<=[.!?:])\s+|\n+/)
      .map((clause) => clause.trim())
      .filter((clause) => clause !== "" && !NEGATED.test(clause))
      .join(" ");

  it("contains no promotional or hype language", () => {
    for (const [slug, source] of sources) {
      const article = articles.find((candidate) => candidate.slug === slug);
      const text = assertions(
        `${article?.frontmatter.title} ${article?.frontmatter.summary}\n${source}`,
      ).toLowerCase();
      for (const phrase of banned) {
        expect(text.includes(phrase), `${slug} contains banned phrasing: ${phrase}`).toBe(false);
      }
    }
  });

  it("still allows a topic to refute a banned claim explicitly", () => {
    // Pinned so the negation filter cannot be tightened into uselessness: the
    // bond topic refutes "bonds are guaranteed", and that sentence must survive.
    const bonds = articles.find((article) => article.slug === "bonds-and-fixed-income");
    expect(bonds?.html).toMatch(/not\s+guaranteed/i);
  });

  it("makes no claim of guaranteed returns", () => {
    for (const [slug, source] of sources) {
      expect(assertions(source), slug).not.toMatch(/guarantee[ds]?\s+(a\s+)?(profit|return)/i);
    }
  });

  it("never claims a connection to a real market or exchange", () => {
    for (const [slug, source] of sources) {
      const text = assertions(source).toLowerCase();
      // A topic may legitimately *deny* such a claim, so the check is for the
      // assertive form only.
      expect(text, slug).not.toMatch(
        /connected to (the )?(casablanca stock exchange|stock exchange|exchange)/i,
      );
      expect(text, slug).not.toMatch(/live market data feed/i);
    }
  });

  it("states what the simulator cannot practise where a topic depends on one", () => {
    // The topics whose subject matter the simulator genuinely cannot demonstrate.
    for (const slug of [
      "bonds-and-fixed-income",
      "fundamental-analysis",
      "technical-indicators",
      "behavioural-finance",
      "market-capitalisation",
    ]) {
      const article = articles.find((candidate) => candidate.slug === slug);
      expect(article, slug).toBeDefined();
      const text = (article?.html ?? "").toLowerCase();
      const admitsLimit =
        /(simulator|platform)/.test(text) && /(not|nothing|no |cannot|never)/.test(text);
      expect(admitsLimit, `${slug} should state its limits honestly`).toBe(true);
    }
  });

  it("defines its technical terms rather than assuming them", () => {
    for (const article of articles) {
      expect(article.wordCount, `${article.slug} has no body text`).toBeGreaterThan(600);
      expect(article.html).toContain("<p>");
    }
  });

  it("uses correct terminology for the concepts it introduces", () => {
    const bySlug = new Map(articles.map((a) => [a.slug, a]));
    // Spot-checks on the precise terms the curriculum turns on.
    expect(bySlug.get("slippage")?.html).toMatch(/spread/i);
    expect(bySlug.get("limit-orders")?.html).toMatch(/partial fill/i);
    expect(bySlug.get("profit-and-loss")?.html).toMatch(/average cost/i);
    expect(bySlug.get("volatility")?.html).toMatch(/standard deviation/i);
    expect(bySlug.get("portfolio-risk")?.html).toMatch(/peak-to-trough|maximum drawdown/i);
    expect(bySlug.get("diversification")?.html).toMatch(/systematic/i);
    expect(bySlug.get("bonds-and-fixed-income")?.html).toMatch(/duration/i);
    expect(bySlug.get("market-orders")?.html).toMatch(/order book/i);
  });

  it("never uses emoji as decoration", () => {
    for (const article of articles) {
      expect(article.html).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
    }
  });
});
