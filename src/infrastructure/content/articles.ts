import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { cacheLife, cacheTag } from "next/cache";
import {
  articleSlugSchema,
  frontmatterSchema,
  readingTimeFor,
  type Article,
  type Frontmatter,
} from "@/domain/education/article";
import { AppError, logServerError } from "@/lib/errors";
import { renderMarkdown } from "./markdown";

import { getSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Article content source (Part 7.2).
 *
 * Articles are stored in Supabase (public.articles) with automatic fallback to
 * local content files in src/content/topics for offline resilience.
 *
 * Every export is cached. Content changes on the order of weeks and is invalidated
 * by tag on write ("education" / "education:[slug]").
 *
 * The Supabase read is gated on `isSupabaseConfigured()` rather than relying on
 * a thrown error, so an unconfigured environment costs no network round trip.
 */

const CONTENT_ROOT = path.join(process.cwd(), "src/content/topics");

/** Articles change on the order of weeks, and are invalidated by tag on write. */
const CONTENT_CACHE_LIFE = "weeks" as const;

interface SupabaseArticleRow {
  slug: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  essential: boolean;
  reading_time: number | null;
  related: string[] | null;
  published_at: string;
}

/** All article slugs, sorted. Fetches from Supabase with filesystem fallback. */
export async function listArticleSlugs(): Promise<string[]> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag("education");

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const res = await supabase.from("articles").select("slug").order("slug");
      if (res.data && !res.error && res.data.length > 0) {
        const rows = res.data as unknown as { slug: string }[];
        return rows
          .map((entry) => entry.slug)
          .filter((slug) => articleSlugSchema.safeParse(slug).success)
          .sort();
      }
    } catch {
      // Network or client failure: fall through to filesystem
    }
  }

  // 2. Fallback to filesystem
  try {
    const entries = await readdir(CONTENT_ROOT, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""))
      .filter((slug) => articleSlugSchema.safeParse(slug).success)
      .sort();
  } catch {
    return [];
  }
}

/** Load and render one article from Supabase, with filesystem fallback. */
export async function getArticle(slug: string): Promise<Article> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag("education", `education:${slug}`);

  const parsed = articleSlugSchema.safeParse(slug);
  if (!parsed.success) {
    throw new AppError("NOT_FOUND", "That topic does not exist.");
  }

  // 1. Try Supabase
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const res = await supabase
        .from("articles")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (res.data && !res.error) {
        const row = res.data as unknown as SupabaseArticleRow;
        const frontmatter: Frontmatter = {
          title: row.title,
          category: row.category as Frontmatter["category"],
          date: new Date(row.published_at),
          summary: row.summary,
          readingTime: row.reading_time ?? undefined,
          related: Array.isArray(row.related) ? row.related : [],
          essential: Boolean(row.essential),
        };
        const { html, tableOfContents, wordCount } = renderMarkdown(row.content);
        return {
          slug: row.slug,
          frontmatter,
          html,
          tableOfContents,
          wordCount,
          readingTimeMinutes: row.reading_time ?? readingTimeFor(wordCount),
        };
      }
    } catch {
      // Fall through to filesystem
    }
  }

  // 2. Fallback to filesystem
  const file = path.join(CONTENT_ROOT, `${slug}.md`);
  let source: string;
  try {
    source = await readFile(file, "utf8");
  } catch {
    throw new AppError("NOT_FOUND", "That topic does not exist.");
  }

  return parseArticle(slug, source);
}

/** Every article. One pass from Supabase, or mapped over listArticleSlugs. */
export async function getAllArticles(): Promise<Article[]> {
  "use cache";
  cacheLife(CONTENT_CACHE_LIFE);
  cacheTag("education");

  // 1. Try Supabase batch fetch
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient();
      const res = await supabase.from("articles").select("*").order("published_at");
      if (res.data && !res.error && res.data.length > 0) {
        const rows = res.data as unknown as SupabaseArticleRow[];
        return rows
          .map((item) => {
            try {
              const frontmatter: Frontmatter = {
                title: item.title,
                category: item.category as Frontmatter["category"],
                date: new Date(item.published_at),
                summary: item.summary,
                readingTime: item.reading_time ?? undefined,
                related: Array.isArray(item.related) ? item.related : [],
                essential: Boolean(item.essential),
              };
              const { html, tableOfContents, wordCount } = renderMarkdown(item.content);
              return {
                slug: item.slug,
                frontmatter,
                html,
                tableOfContents,
                wordCount,
                readingTimeMinutes: item.reading_time ?? readingTimeFor(wordCount),
              };
            } catch (e) {
              logServerError(`content/article:${item.slug}`, e);
              return null;
            }
          })
          .filter((a): a is Article => a !== null);
      }
    } catch {
      // Fall through to slug mapping
    }
  }

  // 2. Fallback
  const slugs = await listArticleSlugs();
  const articles = await Promise.all(
    slugs.map(async (slug) => {
      try {
        return await getArticle(slug);
      } catch (error) {
        logServerError(`content/article:${slug}`, error);
        return null;
      }
    }),
  );
  return articles.filter((article): article is Article => article !== null);
}

/**
 * Parse a Markdown source into an `Article`.
 *
 * Exported separately from the filesystem so the whole pipeline is unit-testable
 * without touching disk — which is how the XSS tests in
 * `src/infrastructure/content/markdown.test.ts` work.
 */
export function parseArticle(slug: string, source: string): Article {
  const { frontmatter, body } = splitFrontmatter(source, slug);

  const parsed = frontmatterSchema.safeParse(frontmatter);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "frontmatter"}: ${issue.message}`)
      .join("; ");
    throw new AppError("VALIDATION_ERROR", `Article "${slug}" has invalid frontmatter: ${issues}`);
  }

  const frontmatterValue: Frontmatter = parsed.data;
  const { html, tableOfContents, wordCount } = renderMarkdown(body);

  return {
    slug,
    frontmatter: frontmatterValue,
    html,
    tableOfContents,
    wordCount,
    readingTimeMinutes: frontmatterValue.readingTime ?? readingTimeFor(wordCount),
  };
}

/**
 * Split YAML frontmatter from the body.
 *
 * `gray-matter` does this, but the delimiter handling is trivial and doing it
 * here keeps one fewer dependency in the render path, and lets a missing or
 * unterminated block produce a precise error rather than an empty object.
 */
function splitFrontmatter(
  source: string,
  slug: string,
): {
  frontmatter: Record<string, unknown>;
  body: string;
} {
  const normalised = source.replace(/^﻿/, "").replace(/\r\n/g, "\n");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(normalised);

  if (!match) {
    throw new AppError(
      "VALIDATION_ERROR",
      `Article "${slug}" has no frontmatter block. Every topic must open with --- on its own line.`,
    );
  }

  const raw = match[1] ?? "";
  const frontmatter: Record<string, unknown> = {};

  // A deliberately small YAML reader: frontmatter here is flat keys plus one list.
  // A full YAML engine would be a larger attack surface for a format that only
  // ever holds strings, a date, a boolean, a number, and one array of strings.
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;

    if (trimmed.startsWith("- ")) {
      // Append to the most recent key, which is the list we are inside.
      const current = Object.keys(frontmatter).at(-1);
      const value = unquote(trimmed.slice(2).trim());
      if (current) {
        const existing = frontmatter[current];
        if (Array.isArray(existing)) existing.push(value);
        else frontmatter[current] = [value];
      }
      continue;
    }

    const separator = trimmed.indexOf(":");
    if (separator === -1) continue;

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    if (key === "") continue;

    if (rawValue === "") {
      // A key with no inline value opens a list.
      frontmatter[key] = [];
      continue;
    }

    frontmatter[key] = coerceScalar(unquote(rawValue));
  }

  return { frontmatter, body: normalised.slice(match[0].length) };
}

function unquote(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

/**
 * Turn a YAML scalar into the type the schema expects.
 *
 * Booleans, integers and ISO dates are converted here rather than being left as
 * strings for Zod to guess at, so `date: 2026-03-01` is a real date and
 * `essential: false` is a real boolean.
 */
function coerceScalar(value: string): unknown {
  if (value === "true") return true;
  if (value === "false") return false;
  if (/^-?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return value;
}
