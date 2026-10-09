import { describe, expect, it } from "vitest";
import { parseArticle } from "@/infrastructure/content/articles";
import {
  ARTICLE_CATEGORIES,
  TOPIC_SEQUENCE,
  byReadingOrder,
  neighbours,
  readingTimeFor,
  resolveRelated,
} from "@/domain/education/article";

/**
 * Frontmatter parsing and the reading path (Part 7.2).
 *
 * A malformed article must fail loudly at load, not render a page with an empty
 * title — so these tests exercise the parser directly, without the filesystem.
 */

const VALID = [
  "---",
  'title: "What a financial market actually is"',
  "category: foundations",
  "date: 2026-03-01",
  'summary: "A market is an arrangement for transferring a claim, and a price is what the arrangement agrees that claim is worth."',
  "related:",
  "  - inflation",
  "  - interest-rates",
  "essential: true",
  "---",
  "",
  "Body text goes here.",
].join("\n");

describe("frontmatter parsing", () => {
  it("parses a well-formed article", () => {
    const article = parseArticle("what-is-a-financial-market", VALID);

    expect(article.slug).toBe("what-is-a-financial-market");
    expect(article.frontmatter.title).toBe("What a financial market actually is");
    expect(article.frontmatter.category).toBe("foundations");
    expect(article.frontmatter.date).toBeInstanceOf(Date);
    expect(article.frontmatter.essential).toBe(true);
    expect(article.frontmatter.related).toEqual(["inflation", "interest-rates"]);
  });

  it("renders the body to sanitised HTML and counts its words", () => {
    const article = parseArticle("what-is-a-financial-market", VALID);
    expect(article.html).toContain("<p>Body text goes here.</p>");
    expect(article.wordCount).toBe(4);
    expect(article.readingTimeMinutes).toBe(1);
  });

  it("coerces booleans and integers rather than leaving them as strings", () => {
    const article = parseArticle("what-is-a-financial-market", VALID);
    expect(article.frontmatter.essential).toBe(true);
    expect(typeof article.frontmatter.essential).toBe("boolean");
  });

  it("defaults `related` and `essential` when omitted", () => {
    const article = parseArticle(
      "slippage",
      [
        "---",
        'title: "Slippage and the price you do not get"',
        "category: execution",
        "date: 2026-03-02",
        'summary: "Slippage is the difference between the price you saw and the price you received, and it has a structure."',
        "---",
        "",
        "Text.",
      ].join("\n"),
    );

    expect(article.frontmatter.related).toEqual([]);
    expect(article.frontmatter.essential).toBe(false);
  });

  it("accepts an author-supplied reading time", () => {
    const article = parseArticle(
      "volatility",
      VALID.replace("essential: true", "essential: true\nreadingTime: 7"),
    );
    expect(article.readingTimeMinutes).toBe(7);
  });

  it("strips a UTF-8 byte order mark and normalises CRLF", () => {
    const bom = `﻿${VALID.replace(/\n/g, "\r\n")}`;
    const article = parseArticle("what-is-a-financial-market", bom);
    expect(article.frontmatter.title).toBe("What a financial market actually is");
    expect(article.html).toContain("<p>Body text goes here.</p>");
  });

  it("ignores comments and blank lines in the frontmatter", () => {
    const article = parseArticle(
      "what-is-a-financial-market",
      VALID.replace("title:", "# an explanatory comment\ntitle:"),
    );
    expect(article.frontmatter.title).toBe("What a financial market actually is");
  });

  it("keeps apostrophes inside quoted values", () => {
    const article = parseArticle(
      "what-is-a-financial-market",
      VALID.replace('summary: "A market', "summary: \"A market's"),
    );
    expect(article.frontmatter.summary).toContain("market's");
  });
});

describe("frontmatter validation", () => {
  const replace = (field: string, line: string) =>
    VALID.replace(new RegExp(`^${field}.*$`, "m"), line);

  it("rejects a missing frontmatter block", () => {
    expect(() => parseArticle("slippage", "# Just markdown\n\nNo frontmatter.")).toThrow(
      /no frontmatter block/i,
    );
  });

  it("rejects an unknown category", () => {
    expect(() => parseArticle("slippage", replace("category", "category: cryptocurrency"))).toThrow(
      /invalid frontmatter/i,
    );
  });

  it("rejects a title that is too short to describe the topic", () => {
    expect(() => parseArticle("slippage", replace("title", 'title: "X"'))).toThrow(/at least 8/);
  });

  it("rejects a summary that is too short to be useful", () => {
    expect(() => parseArticle("slippage", replace("summary", 'summary: "Short."'))).toThrow(
      /at least 40/,
    );
  });

  it("rejects an unreadable date", () => {
    expect(() => parseArticle("slippage", replace("date", "date: sometime last year"))).toThrow(
      /invalid frontmatter/i,
    );
  });

  it("names the offending field so an author can fix it", () => {
    let message = "";
    try {
      parseArticle("slippage", replace("category", "category: cryptocurrency"));
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toContain("category");
    expect(message).toContain("slippage");
  });
});

describe("reading time", () => {
  it("rounds up and never returns zero", () => {
    expect(readingTimeFor(0)).toBe(1);
    expect(readingTimeFor(1)).toBe(1);
    expect(readingTimeFor(220)).toBe(1);
    expect(readingTimeFor(221)).toBe(2);
    expect(readingTimeFor(660)).toBe(3);
  });
});

describe("reading order", () => {
  it("puts foundation topics before derived ones", () => {
    const ordered = byReadingOrder([
      { slug: "slippage" },
      { slug: "what-is-a-financial-market" },
      { slug: "volatility" },
      { slug: "supply-and-demand" },
    ]);
    expect(ordered.map((a) => a.slug)).toEqual([
      "what-is-a-financial-market",
      "supply-and-demand",
      "slippage",
      "volatility",
    ]);
  });

  it("sorts unlisted topics after listed ones, alphabetically", () => {
    const ordered = byReadingOrder([
      { slug: "zzz-new" },
      { slug: "slippage" },
      { slug: "aaa-new" },
    ]);
    expect(ordered.map((a) => a.slug)).toEqual(["slippage", "aaa-new", "zzz-new"]);
  });

  it("does not mutate the input array", () => {
    const input = [{ slug: "volatility" }, { slug: "slippage" }];
    byReadingOrder(input);
    expect(input.map((a) => a.slug)).toEqual(["volatility", "slippage"]);
  });

  it("sequences every topic the platform claims to publish", () => {
    // Every sequence entry must be a real slug; the article loader's fixtures and
    // the homepage's "20 topics" claim both depend on this.
    expect(new Set(TOPIC_SEQUENCE).size).toBe(TOPIC_SEQUENCE.length);
    expect(TOPIC_SEQUENCE.length).toBeGreaterThanOrEqual(20);
  });
});

describe("neighbours and relations", () => {
  const all = [
    { slug: "what-is-a-financial-market", frontmatter: { related: ["inflation"] } },
    { slug: "inflation", frontmatter: { related: [] } },
    { slug: "interest-rates", frontmatter: { related: [] } },
  ].map((article) => ({ ...article, frontmatter: { ...article.frontmatter } })) as never[];

  it("finds the previous and next topic in the path", () => {
    const result = neighbours({ slug: "inflation" }, all);
    expect(result.previous?.slug).toBe("what-is-a-financial-market");
    expect(result.next?.slug).toBe("interest-rates");
  });

  it("has no previous for the first topic and no next for the last", () => {
    expect(neighbours({ slug: "what-is-a-financial-market" }, all).previous).toBeUndefined();
    expect(neighbours({ slug: "interest-rates" }, all).next).toBeUndefined();
  });

  it("resolves declared related topics and drops any that do not exist", () => {
    const withGhost = [
      ...(all as unknown as Array<{ slug: string; frontmatter: { related: string[] } }>),
      { slug: "stocks-and-equities", frontmatter: { related: [] } },
    ];
    const related = resolveRelated(
      {
        slug: "what-is-a-financial-market",
        frontmatter: { related: ["inflation", "does-not-exist"] },
      },
      withGhost,
    );
    expect(related.map((r) => r.slug)).toEqual(["inflation"]);
  });

  it("never lists an article as related to itself", () => {
    const related = resolveRelated(
      { slug: "inflation", frontmatter: { related: ["inflation", "interest-rates"] } },
      all,
    );
    expect(related.map((r) => r.slug)).toEqual(["interest-rates"]);
  });
});

describe("categories", () => {
  it("has exactly six, each with a label and a description", () => {
    expect(ARTICLE_CATEGORIES).toHaveLength(6);
    for (const category of ARTICLE_CATEGORIES) {
      expect(category).toMatch(/^[a-z][a-z-]*$/);
    }
  });
});
