/**
 * Admin dashboard overview page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, DismissibleNotice } from "@/components/ui/alert";
import { EmptyState, LoadingRegion, Skeleton } from "@/components/ui/feedback";
import { KpiCard, KpiStrip } from "@/components/primitives";
import { Num } from "@/components/primitives/num";
import { Container, SectionHeading } from "@/components/layout/container";
import { formatDateTime } from "@/lib/format";
import { ADMIN_NAV } from "@/config/admin-navigation";

interface DashboardStats {
  totalUsers: number;
  activePortfolios: number;
  totalVolumeCents: bigint;
  activeCompetitions: number;
  pendingOrders: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: DashboardStats };

export default function AdminDashboardPage() {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [dismissed, setDismissed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    async function run() {
      try {
        const response = await fetch("/api/admin/dashboard", { signal: controller.signal });
        if (!response.ok) {
          setState({
            status: "error",
            message: `The server responded with ${response.status}.`,
          });
          return;
        }
        setState({ status: "ready", data: (await response.json()) as DashboardStats });
      } catch (error) {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "The request could not be completed.",
        });
      }
    }

    void run();
    return () => controller.abort();
  }, [attempt]);

  if (state.status === "loading") {
    return (
<main id="main-content" className="flex-1">
      <Container size="wide" className="py-10">
        <LoadingRegion label="Loading platform statistics">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="mt-3 w-80" />
          <Skeleton className="mt-10 h-32 w-full" />
        </LoadingRegion>
      </Container>
    </main>
  );
}

  if (state.status === "error") {
    return (
      <main id="main-content" className="flex-1">
      <Container size="wide" className="py-10">
        <Alert
          tone="negative"
          assertive
          title="Platform statistics could not be loaded"
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setState({ status: "loading" });
                setAttempt((value) => value + 1);
              }}
            >
              Try again
            </Button>
          }
        >
{state.message}
        </Alert>
      </Container>
    </main>
  );
}

  const { data } = state;

  return (
    <main id="main-content" className="flex-1">
      <Container size="wide" className="py-10">
      <SectionHeading as="h1" title="Administration" lead="Platform overview and management." />

      {dismissed ? null : (
        <DismissibleNotice
          className="mt-8"
          tone="warning"
          onDismiss={() => setDismissed(true)}
          dismissLabel="Dismiss notice"
          title="Simulated platform"
        >
          Every figure below comes from the paper-trading engine. No real securities or currency
          are involved.
        </DismissibleNotice>
      )}

      <KpiStrip columns={4} className="mt-10">
        <KpiCard label="Total users" value={<Num value={data.totalUsers} decimals={0} size="xl" />} />
        <KpiCard
          label="Active portfolios"
          value={<Num value={data.activePortfolios} decimals={0} size="xl" />}
        />
        <KpiCard
          label="Total volume"
          value={<Num cents={BigInt(data.totalVolumeCents ?? "0")} size="xl" unit=" MAD" />}
        />
        <KpiCard
          label="Active competitions"
          value={<Num value={data.activeCompetitions} decimals={0} size="xl" />}
          hint={`${data.pendingOrders} orders pending`}
        />
      </KpiStrip>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Administration surfaces</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {ADMIN_NAV.filter((item) => item.href !== "/admin").map((item) => (
                <li key={item.href}>
                  <Button asChild variant="secondary" className="w-full justify-start">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentActivity.length > 0 ? (
              <ul className="divide-rule divide-y">
                {data.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-medium">{activity.description}</p>
                      <p className="label text-2xs mt-0.5">{activity.type}</p>
                    </div>
                    <time
                      dateTime={activity.timestamp}
                      className="text-foreground-secondary shrink-0 text-sm"
                    >
                      {formatDateTime(activity.timestamp)}
                    </time>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                padding="sm"
                title="No activity recorded"
                description="Actions taken in the administration surfaces will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </Container>
    </main>
  );
}