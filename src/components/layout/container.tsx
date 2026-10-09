import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page-level layout primitives.
 *
 * Layout is deliberately plain: a maximum measure for prose, a wider grid for
 * dashboards, and a consistent vertical rhythm between sections. No full-bleed
 * decorative backgrounds, no page-wide grids (Part 0.4).
 */

/** Constrained container with the platform's gutter. */
export function Container({
  children,
  className,
  size = "default",
}: {
  children: ReactNode;
  className?: string;
  size?: "prose" | "default" | "wide" | "full";
}) {
  const width = {
    prose: "max-w-2xl",
    default: "max-w-6xl",
    wide: "max-w-7xl",
    full: "max-w-none",
  }[size];

  return (
    <div className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", width, className)}>{children}</div>
  );
}

/**
 * Vertical section rhythm.
 *
 * By default a `Section` also supplies the platform `Container`, so a page can be
 * written as a bare stack of sections. Set `contained={false}` when an ancestor
 * already provides a `Container` — otherwise the gutter is applied twice and the
 * section sits visibly further in than the content above it.
 */
export function Section({
  children,
  className,
  spacing = "default",
  as: Component = "section",
  contained = true,
}: {
  children: ReactNode;
  className?: string;
  spacing?: "tight" | "default" | "loose";
  as?: "section" | "div" | "article";
  /** Set false when an ancestor already renders a `Container`. */
  contained?: boolean;
}) {
  const padding = {
    tight: "py-8",
    default: "py-14",
    loose: "py-20",
  }[spacing];

  if (!contained) {
    return <Component className={cn(padding, className)}>{children}</Component>;
  }

  return (
    <Component className={cn(padding, className)}>
      <Container>{children}</Container>
    </Component>
  );
}

/**
 * Section heading.
 *
 * No eyebrow. A kicker above a heading is a default this system does not use:
 * the heading carries its own weight, and a small tracked label above it is the
 * most recognisable tell of an assembled page. Where a section needs a machine
 * label (a sector, a date, a status) it belongs beside the content it annotates,
 * not above the title.
 */
export function SectionHeading({
  title,
  lead,
  align = "left",
  as = "h2",
  className,
  actions,
}: {
  title: string;
  lead?: string;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
  actions?: ReactNode;
}) {
  const Heading = as;
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        actions && "sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        <Heading
          className={cn(
            "text-balance",
            as === "h1" ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl",
          )}
        >
          {title}
        </Heading>
        {lead ? (
          <p className="text-foreground-secondary mt-4 text-base leading-relaxed">{lead}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
    </div>
  );
}

/**
 * A ruled definition block — the terminal's replacement for a card grid.
 *
 * Content separated by hairlines and aligned on a shared column, rather than
 * floating in identical boxes.
 *
 * In two columns each pair keeps its own top and bottom rule and the columns are
 * separated by a gutter. An earlier version used `divide-x` with `divide-y`, which
 * produced one vertical hairline and no horizontal separation inside each column —
 * the result read as a four-column table with term and detail as separate cells,
 * losing the pairing that made the list legible.
 */
export function RuledList({
  items,
  columns = 1,
  className,
}: {
  items: readonly { term: string; detail: string }[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        columns === 2
          ? "grid gap-x-14 sm:grid-cols-2"
          : "divide-rule border-rule divide-y border-y",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.term}
          className={cn(
            "border-rule grid gap-1 border-b py-4",
            "sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-x-8",
          )}
        >
          <dt className="text-foreground text-sm font-medium">{item.term}</dt>
          <dd className="text-foreground-secondary text-sm leading-relaxed">{item.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Horizontal rule used to separate major blocks. */
export function Divider({ className, label }: { className?: string; label?: string }) {
  if (label) {
    return (
      <div className="flex items-center gap-3" role="separator">
        <span className="bg-rule h-px flex-1" />
        <span className="text-2xs text-foreground-muted font-medium tracking-widest uppercase">
          {label}
        </span>
        <span className="bg-rule h-px flex-1" />
      </div>
    );
  }
  return <hr className={cn("border-rule border-t", className)} />;
}

/**
 * Small labelled key/value row, e.g. in an event detail sidebar.
 */
export function DetailRow({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-4 py-2", className)}>
      <dt className="text-foreground-secondary text-sm">{label}</dt>
      <dd className="text-foreground text-right text-sm font-medium">{children}</dd>
    </div>
  );
}
