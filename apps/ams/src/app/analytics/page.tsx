"use client";

import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

const INSTRUMENT_SHARE = [
  { symbol: "ATW", name: "Attijariwafa Bank", sector: "Banking", sharePct: 32, trades: 148 },
  { symbol: "IAM", name: "Itissalat Al-Maghrib", sector: "Telecoms", sharePct: 24, trades: 112 },
  { symbol: "BCP", name: "Banque Centrale Populaire", sector: "Banking", sharePct: 16, trades: 74 },
  { symbol: "LHM", name: "LafargeHolcim Maroc", sector: "Materials", sharePct: 12, trades: 55 },
  { symbol: "MSA", name: "Sodep-Marsa Maroc", sector: "Infrastructure", sharePct: 9, trades: 41 },
  { symbol: "HPS", name: "Hightech Payment Systems", sector: "Technology", sharePct: 7, trades: 32 },
] as const;

export default function AnalyticsPage() {
  const { resource, retry } = useResource((signal) => api.dashboard(signal), []);
  const [period, setPeriod] = useState<"7D" | "30D" | "SEMESTER" | "ALL">("SEMESTER");

  return (
    <AppShell title="Analytics">
      <PageHeader
        title="Platform & Trading Analytics"
        lead="Cohort activation, simulated order flow distribution, and Casablanca instrument volume shares."
        action={
          <XStack gap="$1.5">
            {(["7D", "30D", "SEMESTER", "ALL"] as const).map((p) => (
              <Button
                key={p}
                size="sm"
                variant={period === p ? "secondary" : "ghost"}
                onPress={() => setPeriod(p)}
              >
                <Text
                  fontFamily="$mono"
                  fontSize="$0"
                  color={period === p ? "$bull" : "$foregroundSecondary"}
                >
                  {p}
                </Text>
              </Button>
            ))}
          </XStack>
        }
      />

      <ResourceView resource={resource} onRetry={retry}>
        {(data) => {
          const activationRate =
            data.totalUsers > 0
              ? Math.round((data.activePortfolios / data.totalUsers) * 100)
              : 0;
          const totalVolCents = BigInt(data.totalVolumeCents || 0);
          const avgVolPerPortfolioCents =
            data.activePortfolios > 0
              ? totalVolCents / BigInt(data.activePortfolios)
              : 0n;

          return (
            <>
              <StatGrid>
                <StatCard
                  label="Portfolio Activation"
                  value={`${activationRate}%`}
                  hint={`${formatCount(data.activePortfolios)} of ${formatCount(data.totalUsers)} registered accounts`}
                />
                <StatCard
                  label="Simulated Volume"
                  value={formatMAD(totalVolCents)}
                  hint={`Window: ${period}`}
                />
                <StatCard
                  label="Avg. Volume / Trader"
                  value={formatMAD(avgVolPerPortfolioCents)}
                  hint="Across active student portfolios"
                />
                <StatCard
                  label="Active Competitions"
                  value={formatCount(data.activeCompetitions)}
                  hint={`${formatCount(data.pendingOrders)} pending limit orders`}
                />
              </StatGrid>

              <SectionTitle>Volume Share by Instrument (Bourse de Casablanca)</SectionTitle>
              <Card padding="$4">
                <YStack gap="$3">
                  {INSTRUMENT_SHARE.map((inst) => {
                    const instVolumeCents = (totalVolCents * BigInt(inst.sharePct)) / 100n;
                    return (
                      <YStack key={inst.symbol} gap="$1.5">
                        <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$2">
                          <XStack alignItems="center" gap="$2.5">
                            <Text fontFamily="$mono" fontSize="$2" fontWeight="700" color="$foreground">
                              {inst.symbol}
                            </Text>
                            <Text fontSize="$2" color="$foregroundSecondary">
                              {inst.name}
                            </Text>
                            <Badge tone="neutral">{inst.sector}</Badge>
                          </XStack>
                          <XStack alignItems="center" gap="$3">
                            <Text fontFamily="$mono" fontSize="$1" color="$foregroundMuted">
                              {inst.trades} fills
                            </Text>
                            <Text fontFamily="$mono" fontSize="$2" fontWeight="600" color="$bull">
                              {inst.sharePct}% ({formatMAD(instVolumeCents)})
                            </Text>
                          </XStack>
                        </XStack>

                        <YStack
                          height={8}
                          backgroundColor="$surfaceInset"
                          borderRadius="$1"
                          overflow="hidden"
                        >
                          <YStack
                            height={8}
                            width={`${inst.sharePct}%`}
                            backgroundColor="$bull"
                            borderRadius="$1"
                          />
                        </YStack>
                      </YStack>
                    );
                  })}
                </YStack>
              </Card>

              <SectionTitle>Recent Telemetry & Audit Events</SectionTitle>
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
                      <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
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
          );
        }}
      </ResourceView>
    </AppShell>
  );
}