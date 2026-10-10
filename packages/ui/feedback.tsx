import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@fsjesc/config/cn";

/**
 * Skeleton: a loading placeholder sized like the content it replaces.
 *
 * Used locally, inside the region that is loading — never as a full-page spinner
 * (Part 9.6). Animations respect `prefers-reduced-motion` via the global rule in
 * globals.css.
 */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn("bg-surface-inset animate-pulse rounded", className)}
      {...props}
    />
  );
}

/** Text-shaped skeleton with a sensible default width. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={cn("h-3.5", index === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  );
}

/**
 * Region announced as busy while it loads. The `aria-busy` + visually hidden
 * status text means a screen reader user learns the region is loading without
 * hearing a generic "loading" on every keystroke.
 */
export function LoadingRegion({
  label = "Loading content",
  className,
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy="true" className={className}>
      <span role="status" className="sr-only">
        {label}
      </span>
      {children}
    </div>
  );
}

/**
 * Empty state (Part 9.6).
 *
 * An empty list is a designed state, not an omission: it explains what would
 * appear here and what to do next.
 */
const emptyVariants = cva(
  "rounded-lg border border-dashed border-rule-strong bg-surface-raised",
  {
    variants: {
      padding: {
        sm: "px-4 py-6 text-center",
        md: "px-6 py-12 text-center",
      },
    },
    defaultVariants: { padding: "md" },
  },
);

export interface EmptyStateProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyVariants> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  padding,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div className={cn(emptyVariants({ padding }), className)} {...props}>
      {icon ? (
        <div aria-hidden="true" className="text-foreground-muted mb-3 flex justify-center">
          {icon}
        </div>
      ) : null}
      <p className="text-foreground text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-foreground-secondary mx-auto mt-1 max-w-prose text-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-4 flex justify-center gap-3">{action}</div> : null}
    </div>
  );
}
