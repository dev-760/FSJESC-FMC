import { cn } from "@/lib/cn";
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
  className?: string;
}

/**
 * A single headline figure with its label.
 *
 * Not a page section and not an argument — a figure with the units stated. The
 * label sits above the value in tracked mono, because the value should be the
 * brightest thing in the card.
 */
export function KpiCard({ label, value, hint, className }: KpiCardProps) {
  return (
    <div className={cn("border-rule bg-surface border p-4", className)}>
      <p className="label">{label}</p>
      <p className="mt-2">{value}</p>
      {hint ? <p className="text-2xs text-muted-allowed mt-1">{hint}</p> : null}
    </div>
  );
}

/**
 * A row of `KpiCard`s with the platform's grid.
 *
 * Hairlines separate them, not boxes: the strip is a 1px grid with a `gap-px`,
 * so the dividers are the background showing through rather than borders on
 * each tile. That keeps a 4-up strip reading as one instrument panel.
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
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("border-rule bg-rule grid gap-px border", cols[columns], className)}>
      {children}
    </div>
  );
}