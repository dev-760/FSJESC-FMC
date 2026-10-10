import type { ReactNode } from "react";
import { DISC_2 } from "@fsjesc/config/site";
import { cn } from "@fsjesc/config/cn";

/**
 * The single place in the application that renders HTML from Markdown.
 *
 * `dangerouslySetInnerHTML` is used here and nowhere else (Part 8.4). The string
 * it receives is produced by the pipeline in
 * `src/infrastructure/content/markdown.ts`, where sanitisation runs *before* the
 * slug and anchor steps — so every attribute in the output is one this codebase
 * wrote. That ordering is the security property, and it is pinned by tests.
 *
 * The renderer adds no further markup beyond the article body, so there is no
 * second opportunity for injected content to survive.
 */
export function ArticleBody({ html, className }: { html: string; className?: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className={cn("article-body measure", className)}
    />
  );
}

/**
 * `DISC-2` — the standing article footer.
 *
 * Rendered from the fixed disclaimer constant so its wording is identical on every
 * article and greppable, and so it can be translated in one place (Part 9.5).
 */
export function ArticleDisclaimer({ className }: { className?: string }) {
  return (
    <aside className={cn("border-rule bg-surface-sunken rounded-md border px-4 py-3", className)}>
      <p className="text-foreground-secondary text-xs leading-relaxed">{DISC_2}</p>
    </aside>
  );
}

/**
 * The article header.
 *
 * The category is a tracked mono label *beside* the title rather than an eyebrow
 * above it — the machine-readable fact annotates the article, it does not
 * introduce it. No kicker above a heading anywhere on this platform.
 */
export function ArticleHeader({
  title,
  categoryLabel,
  publishedOn,
  readingTime,
  summary,
  essential,
  isPremiumHint,
}: {
  title: string;
  categoryLabel: string;
  publishedOn: string;
  readingTime: string;
  summary: string;
  essential: boolean;
  isPremiumHint?: ReactNode;
}) {
  return (
    <header>
      <p className="label">
        {categoryLabel}
        <span aria-hidden className="px-2">
          ·
        </span>
        <time>{publishedOn}</time>
        <span aria-hidden className="px-2">
          ·
        </span>
        {readingTime}
      </p>
      <h1 className="mt-3 text-4xl font-semibold tracking-[-0.028em]">{title}</h1>
      <p className="measure text-foreground-secondary mt-5 text-lg leading-relaxed">{summary}</p>
      {essential ? (
        <p className="border-warning/35 bg-warning-subtle text-foreground mt-6 rounded-md border px-3 py-2 text-sm">
          Read this before using the simulator. It defines terms the rest of the programme assumes.
        </p>
      ) : null}
      {isPremiumHint}
    </header>
  );
}
