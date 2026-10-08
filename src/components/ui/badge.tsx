import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Badge — a status or category marker.
 *
 * Terminal chips: small, square-cornered, tracked, and always paired with text.
 * Tone is never the sole signal (Part 9.2), and the label is what a screen reader
 * reads, so colour never carries meaning alone.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-xs border px-1.5 py-0.5 font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "border-rule-strong bg-surface-inset text-foreground-secondary",
        accent: "border-accent/30 bg-accent-subtle text-accent-text",
        positive: "border-positive/35 bg-positive-subtle text-positive",
        negative: "border-negative/35 bg-negative-subtle text-negative",
        warning: "border-warning/35 bg-warning-subtle text-warning",
        information: "border-information/30 bg-information-subtle text-information",
      },
      size: {
        sm: "text-2xs",
        md: "text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "sm" },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

export { badgeVariants };
