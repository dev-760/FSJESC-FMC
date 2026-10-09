import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/**
 * Card — a ruled panel.
 *
 * In a terminal aesthetic the panel is defined by a hairline and a surface
 * difference, never by a shadow. Elevation is declared once: `rule` is the
 * default and carries no shadow; `sunken` recedes instead of floating; `float`
 * is reserved for things that genuinely sit above the page (dialogs, popovers)
 * and is the only variant that may cast one.
 *
 * Cards are never used for decoration. Every card on this platform carries
 * content, and a container that repeats the page background is removed rather
 * than styled (Part 0.4).
 */
const cardVariants = cva("rounded-lg", {
  variants: {
    variant: {
      /** The default: a hairline and a slightly raised surface. */
      rule: "border border-rule bg-surface-raised",
      /** Recedes into the page. Used for secondary blocks inside a panel. */
      sunken: "border border-rule bg-surface-sunken",
      /** The page itself. For full-bleed blocks that need no box. */
      flat: "bg-transparent",
      /** Above the page. Only for genuinely floating surfaces. */
      float: "border border-rule bg-surface-raised shadow-float",
    },
    padding: {
      none: "",
      sm: "p-3",
      md: "p-4",
      lg: "p-6",
      xl: "p-8",
    },
  },
  defaultVariants: {
    variant: "rule",
    padding: "md",
  },
});

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {}

export function Card({ className, variant, padding, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant, padding }), className)} {...props} />;
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-rule flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-3",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-lg font-semibold tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-foreground-secondary text-sm", className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4", className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("border-rule mt-4 flex flex-wrap items-center gap-3 border-t pt-4", className)}
      {...props}
    />
  );
}

export { cardVariants };
