import { cn } from "@fsjesc/config/cn";
import type { ReactNode } from "react";

/**
 * Product-level primitives.
 *
 * The unstyled primitive layer lives in `components/ui/` (Button, Card, Badge,
 * Skeleton, EmptyState, Alert, Table, Field, …). This module holds only the
 * composites that are specific to this product's vocabulary — a KPI figure and
 * the ruled strip that carries them.
 *
 * Do not redefine a primitive here. `Badge`, `Skeleton`, `LoadingRegion` and
 * `EmptyState` previously existed in both modules with different prop APIs,
 * which meant a page could render two different-looking badges; there is now a
 * single definition of each, in `components/ui/`.
 */

export interface KpiCardProps {
  label: string;
  /** Rendered through `Num` — this component never formats a figure itself. */
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
  className?: string;
}

/**
 * A single headline figure with its label.
 *
 * Not a page section and not an argument — a figure with the units stated. The
 * label sits above the value in tracked mono, because the value should be the
 * brightest thing in the card.
 */
export function KpiCard({ label, value, hint, accent = true, className }: KpiCardProps) {
  return (
    <div
      className={cn(
        "border-rule bg-surface relative overflow-hidden rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-sm",
        accent && "pl-6 before:bg-brand before:absolute before:inset-y-0 before:left-0 before:w-1",
        className,
      )}
    >
      <p className="label">{label}</p>
      <p className="mt-2">{value}</p>
      {hint ? <p className="text-2xs text-foreground-secondary mt-1.5">{hint}</p> : null}
    </div>
  );
}

/**
 * A row of `KpiCard`s with the platform's grid.
 */
export function KpiStrip({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols = {
    2: "sm:grid-cols-2",
    3: "sm:grid-cols-2 lg:grid-cols-3",
    4: "sm:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("grid gap-4", cols[columns], className)}>
      {children}
    </div>
  );
}