"use client";

import { Text, XStack, YStack } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/data-table";
import {
  PageHeader,
  ResourceView,
  SectionTitle,
  StatCard,
  StatGrid,
  StatSkeleton,
} from "@/components/page";
import { api, formatCount, formatDateTime, formatMAD } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

/**
 * Administration dashboard.
 *
 * Every figure is loaded rather than hardcoded, and a failed request now
 * renders an error state with a retry instead of a grid of zeroes.
 */
export default function DashboardPage() {
  const { resource, retry } = useResource((signal) => api.dashboard(), []);

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title="Platform overview"
        lead="Totals across the simulated trading platform. No real securities or currency are involved."
      />

      <ResourceView resource={resource} onRetry={retry}>
        {(data) => (
          <>
            <StatGrid>
              <StatCard label="Total users" value={formatCount(data.totalUsers)} />
              <StatCard label="Active portfolios" value={formatCount(data.activePortfolios)} />
              <StatCard label="Total volume" value={formatMAD(data.totalVolumeCents)} />
              <StatCard
                label="Competitions"
                value={formatCount(data.activeCompetitions)}
                hint={`${formatCount(data.pendingOrders)} orders pending`}
              />
            </StatGrid>

            <SectionTitle>Recent activity</SectionTitle>
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
                    <YStack flex={1} gap="$1" minWidth={0}>
                      <Text fontSize="$3" color="$foreground" fontWeight="500" numberOfLines={1}>
                        {item.description}
                      </Text>
                      <Text
                        fontFamily="$mono"
                        fontSize="$0"
                        color="$foregroundMuted"
                        textTransform="uppercase"
                        letterSpacing={1}
                      >
                        {item.type}
                      </Text>
                    </YStack>
                    <Text fontSize="$2" color="$foregroundSecondary">
                      {formatDateTime(item.timestamp)}
                    </Text>
                  </XStack>
                ))
              ) : (
                <EmptyState
                  title="No activity recorded"
                  description="Actions taken across the administration surfaces will appear here."
                />
              )}
            </Card>
          </>
        )}
      </ResourceView>
    </AppShell>
  );
}