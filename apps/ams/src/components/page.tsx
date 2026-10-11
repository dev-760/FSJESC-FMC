"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { EmptyState, Skeleton } from "@/components/ui/data-table";
import type { Resource } from "@/lib/use-resource";

/**
 * Page-level components styled to match `mockups/AMS.html`.
 */

/** Title and lead for a page (`.page-head`). */
export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-head__title">{title}</h1>
        {lead ? <p className="page-head__sub">{lead}</p> : null}
      </div>
      {action ? <div className="page-head__actions">{action}</div> : null}
    </div>
  );
}

/**
 * A single headline figure (`.stat` with top 3px gold bar `#d4a94f`).
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <div className="stat">
      <div className="stat__label">{label}</div>
      <div className="stat__value">{value}</div>
      {hint ? <div className="stat__delta stat__delta--pos">{hint}</div> : null}
    </div>
  );
}

/** A 4-column responsive row of stat cards (`.stats`). */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="stats">{children}</div>;
}

function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <StatGrid>
      {Array.from({ length: count }, (_, index) => (
        <StatCard key={index} label="Chargement" value={<Skeleton width={72} height={28} />} />
      ))}
    </StatGrid>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <AlertTriangle size={20} color="var(--neg)" />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
            Impossible de charger ces données
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "var(--text-2)", lineHeight: 1.5 }}>
            {message}
          </p>
          <div>
            <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
              <RefreshCw size={14} />
              <span>Réessayer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NoResults({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return <EmptyState title={title} description={description} />;
}

export function ResourceView<T>({
  resource,
  onRetry,
  loading,
  children,
}: {
  resource: Resource<T>;
  onRetry: () => void;
  loading?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "loading") return <>{loading ?? <StatSkeleton />}</>;
  if (resource.status === "error") return <ErrorState message={resource.message} onRetry={onRetry} />;
  return <>{children(resource.data)}</>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: "var(--font-serif)",
        fontSize: 18,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        color: "var(--text)",
        marginTop: 22,
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}