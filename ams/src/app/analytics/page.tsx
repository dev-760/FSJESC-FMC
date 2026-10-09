"use client";

import { Text, XStack } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-table";
import {
  PageHeader,
  ResourceView,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/page";
import { api, formatCount, formatDateTime, formatMAD } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

/**
 * Analytics.
 *
 * Derived from the same dashboard aggregate rather than maintaining a second,
 * separately-maintained set of numbers — the previous version duplicated the
 * counters with no stated source, so the two pages could disagree.
 */
export default function AnalyticsPage() {
  const { resource, retry } = useResource((signal) => api.dashboard(), []);

  return (
    <AppShell title="Analytics">
      <PageHeader
        title="Analytics"
        lead="Platform aggregates, derived from the same source as the dashboard."
      />

      <ResourceView resource={resource} onRetry={retry}>
        {(data) => (
          <>
            <StatGrid>
              <StatCard label="Users" value={formatCount(data.totalUsers)} />
              <StatCard label="Portfolios" value={formatCount(data.activePortfolios)} />
              <StatCard label="Volume" value={formatMAD(data.totalVolumeCents)} />
              <StatCard label="Pending orders" value={formatCount(data.pendingOrders)} />
            </StatGrid>

            <SectionTitle>Activity feed</SectionTitle>
            <Card>
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((item) => (
                  <XStack
                    key={item.id}
                    alignItems="center"
                    justifyContent="space-between"
                    gap="$4"
                    paddingVertical="$3"
                    paddingHorizontal="$4"
                    borderBottomWidth={1}
                    borderColor="$ruleFaint"
                  >
                    <Text fontSize="$3" color="$foreground" flex={1} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text fontSize="$2" color="$foregroundSecondary">
                      {formatDateTime(item.timestamp)}
                    </Text>
                  </XStack>
                ))
              ) : (
                <EmptyState
                  title="Nothing to analyse yet"
                  description="Once members start trading, activity will appear here."
                />
              )}
            </Card>
          </>
        )}
      </ResourceView>
    </AppShell>
  );
}