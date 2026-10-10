import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@fsjesc/config/cn";

/**
 * Semantic tone mapping for financial values (Part 9.2).
 *
 * `positive` / `negative` are only ever applied *together* with a sign or arrow,
 * never on their own — see `ChangeIndicator`. A directional glyph is mandatory
 * because colour must never be the sole carrier of meaning.
 */
export type SemanticTone = "positive" | "negative" | "neutral" | "warning" | "information";

export const toneTextClass: Record<SemanticTone, string> = {
  positive: "text-bull",
  negative: "text-bear",
  neutral: "text-foreground-secondary",
  warning: "text-warning",
  information: "text-info",
};

export const toneSurfaceClass: Record<SemanticTone, string> = {
  positive: "bg-bull-subtle text-bull",
  negative: "bg-bear-subtle text-bear",
  neutral: "bg-neutral-subtle text-foreground-secondary",
  warning: "bg-warning-subtle text-warning",
  information: "bg-info-subtle text-info",
};

/** Map a signed basis-point value to a semantic tone. Zero stays neutral. */
export function toneForBps(bps: bigint): SemanticTone {
  if (bps > 0n) return "positive";
  if (bps < 0n) return "negative";
  return "neutral";
}

/** Map a signed centime value to a semantic tone. */
export function toneForCents(cents: bigint): SemanticTone {
  return toneForBps(cents);
}

/**
 * Definition-list layout for a labelled figure. Used wherever a number needs a
 * label but not a full table row.
 */
const figureVariants = cva("flex flex-col gap-0.5", {
  variants: {
    size: {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base",
    },
  },
  defaultVariants: { size: "md" },
});

export interface FigureProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof figureVariants> {
  label: string;
  /** Rendered with tabular numerals. Pass a pre-formatted string. */
  value: ReactNode;
  /** Secondary line, e.g. a change percentage or a timestamp. */
  hint?: ReactNode;
  tone?: SemanticTone;
}

export function Figure({
  label,
  value,
  hint,
  tone = "neutral",
  size,
  className,
  ...props
}: FigureProps) {
  return (
    <div className={cn(figureVariants({ size }), className)} {...props}>
      <dt className="text-foreground-secondary">{label}</dt>
      <dd className={cn("numeric font-medium", toneTextClass[tone])}>{value}</dd>
      {hint ? <dd className="text-2xs text-foreground-muted">{hint}</dd> : null}
    </div>
  );
}

/** Grid of figures, the standard way a dashboard row of numbers is presented. */
export function FigureGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const columnClass = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns];

  return <dl className={cn("grid gap-4", columnClass, className)}>{children}</dl>;
}

/**
 * Signed value with an explicit sign prefix, for prose and dense tables.
 * `formatSigned` should already produce a signed string.
 */
export function SignedValue({
  value,
  tone,
  className,
  ...props
}: { value: string; tone: SemanticTone } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn("numeric", toneTextClass[tone], className)} {...props}>
      {value}
    </span>
  );
}
