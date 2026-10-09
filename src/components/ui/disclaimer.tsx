import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";
import { DISC_2, DISC_3, DISC_4 } from "@/config/site";
import type { ReactNode } from "react";

/**
 * The four fixed disclaimers (Part 0.4), rendered as a consistent component.
 *
 * Referencing them by key everywhere means the wording is identical on every
 * page, is greppable, and can be translated in one place (Part 9.5).
 *
 * `DISC_1` (the simulator banner) is rendered by the root layout rather than here,
 * because it must be present on every route including error pages.
 */

const noticeVariants = cva("rounded-md border px-3 py-2 text-xs leading-relaxed", {
  variants: {
    kind: {
      info: "border-rule bg-surface-raised text-foreground-secondary",
      muted: "border-transparent bg-transparent text-foreground-muted",
      method: "border-rule bg-surface-raised text-foreground-secondary",
    },
  },
  defaultVariants: { kind: "info" },
});

/** `DISC-2` — article footer. */
export function ArticleDisclaimer({ className }: { className?: string }) {
  return (
    <aside className={cn(noticeVariants({ kind: "muted" }), className)}>
      <p className="text-foreground-secondary font-medium">{DISC_2}</p>
    </aside>
  );
}

/** `DISC-3` — analytics and advanced metrics. */
export function MetricsDisclaimer({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <aside className={cn(noticeVariants({ kind: "muted" }), className)}>
      <p>{DISC_3}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </aside>
  );
}

/**
 * `DISC-4` — leaderboard methodology. Rendered with a heading so the scoring
 * method is discoverable, not buried in fine print.
 */
export function MethodologyNotice({
  className,
  title = "How this ranking is calculated",
  children,
}: {
  className?: string;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <aside className={cn(noticeVariants({ kind: "method" }), className)}>
      <p className="text-foreground font-medium">{title}</p>
      <p className="mt-1">{DISC_4}</p>
      {children ? <div className="mt-2">{children}</div> : null}
    </aside>
  );
}

/**
 * Simulated-market marker for a component that shows a price. Not a substitute
 * for `DISC_1` (which the layout already renders) — this is the local reminder
 * next to the figure.
 */
export function SimulatedMarker({
  className,
  variant,
}: {
  className?: string;
  variant?: "inline" | "badge";
}) {
  if (variant === "badge") {
    return (
      <span
        className={cn(
          "border-warning/40 bg-warning-subtle text-2xs text-warning inline-flex items-center rounded border px-1.5 py-0.5 font-medium",
          className,
        )}
      >
        Simulated
      </span>
    );
  }

  return (
    <span className={cn("text-2xs text-foreground-muted", className)}>
      Simulated price · educational environment
    </span>
  );
}

export type { VariantProps };
