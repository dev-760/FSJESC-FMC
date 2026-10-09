import type { TableOfContentsEntry } from "@/domain/education/article";
import { cn } from "@/lib/cn";

/**
 * Table of contents (Part 7.2).
 *
 * A sticky rail on desktop, a collapsible disclosure on mobile. It is the page's
 * single navigation mechanism — the in-body `#` affordances are `aria-hidden` and
 * not focusable, so a keyboard user does not meet a tab stop at every heading in
 * a long article.
 *
 * Indentation follows heading depth, and `aria-current="location"` marks the
 * section being read. Scroll-spy is not implemented: it needs a client-side
 * observer on every article, and a table of contents that claims to track you and
 * does not is worse than one that does not claim to.
 */
export function TableOfContents({
  entries,
  className,
}: {
  entries: readonly TableOfContentsEntry[];
  className?: string;
}) {
  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className={cn("text-sm", className)}>
      <p className="label mb-3">On this page</p>
      <ol className="border-rule space-y-2 border-l">
        {entries.map((entry) => (
          <li key={entry.id} className={cn(entry.depth > 2 && "pl-3")}>
            <a
              href={`#${entry.id}`}
              className="text-foreground-secondary hover:border-accent hover:text-foreground focus-visible:border-accent focus-visible:text-foreground -ml-px block border-l border-transparent py-0.5 pl-3 transition-colors focus-visible:outline-none"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
