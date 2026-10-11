"use client";

import Link from "next/link";
import { Text, XStack, YStack } from "tamagui";
import {
  Activity,
  FileText,
  Globe,
  ShoppingCart,
  Sliders,
  Trophy,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
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

const QUICK_LINKS = [
  {
    title: "APIs & 110 Markets",
    description: "Manage https://api.wassly.tech routers, probe endpoints, and configure 110 instruments.",
    href: "/apis",
    icon: Globe,
    badge: "8 Routers",
  },
  {
    title: "Users & Portfolios",
    description: "Provision accounts, assign RBAC roles, and reset or credit 100,000 MAD portfolios.",
    href: "/users",
    icon: Users,
    badge: "RBAC + Cash",
  },
  {
    title: "Articles & Curriculum",
    description: "Publish and edit Moroccan & global market briefings and essential reading tracks.",
    href: "/articles",
    icon: FileText,
    badge: "CMS",
  },
  {
    title: "Competitions & Scenarios",
    description: "Launch trading cohorts, set starting capital, and activate macro scenario shocks.",
    href: "/competitions",
    icon: Trophy,
    badge: "Cohorts",
  },
  {
    title: "Orders & Risk Desk",
    description: "Inspect the append-only execution ledger, cancel pending limits, or route desk orders.",
    href: "/orders",
    icon: ShoppingCart,
    badge: "Execution",
  },
  {
    title: "Settings & Engine",
    description: "Configure commissions, slippage, settlement regimes, feature flags, and maintenance.",
    href: "/settings",
    icon: Sliders,
    badge: "Config",
  },
] as const;

export default function DashboardPage() {
  const { resource, retry } = useResource((signal) => api.dashboard(signal), []);

  return (
    <AppShell
      title="Dashboard"
      action={
        <Button variant="secondary" size="sm" onPress={retry}>
          <Text fontSize="$2">Refresh telemetry</Text>
        </Button>
      }
    >
      <PageHeader
        title="Executive Operations & Control Center"
        lead="Unified administration across the Wassly Market Data API gateway, 110 multi-asset simulator instruments, club members, educational content, and trading engine settings."
      />

      <ResourceView resource={resource} onRetry={retry}>
        {(data) => (
          <>
            <StatGrid>
              <StatCard
                label="Registered Users"
                value={formatCount(data.totalUsers)}
                hint={`${formatCount(data.activePortfolios)} active trading portfolios`}
              />
              <StatCard
                label="Simulated Volume"
                value={formatMAD(data.totalVolumeCents)}
                hint={`${formatCount(data.pendingOrders)} working limit orders`}
              />
              <StatCard
                label="Market Universe"
                value={`${data.tradableInstruments ?? 110} / ${data.totalInstruments ?? 110}`}
                hint="Tradable across 8 asset classes"
              />
              <StatCard
                label="Wassly API Routers"
                value={`${data.healthyRouters ?? 8} / ${data.totalRouters ?? 8}`}
                hint={data.marketApiUrl ?? "https://api.wassly.tech"}
              />
              <StatCard
                label="Active Competitions"
                value={formatCount(data.activeCompetitions)}
                hint={`Scenario: ${data.activeScenario ?? "NORMAL"}`}
              />
            </StatGrid>

            <SectionTitle>Control Surfaces</SectionTitle>
            <XStack flexWrap="wrap" gap="$3" marginBottom="$5">
              {QUICK_LINKS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ textDecoration: "none", flex: "1 1 300px" }}
                  >
                    <Card
                      padding="$4"
                      height="100%"
                      hoverStyle={{ backgroundColor: "$surfaceInset", borderColor: "$ruleStrong" }}
                    >
                      <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                        <XStack alignItems="center" gap="$2.5">
                          <Icon size={18} color="#2dbf8e" />
                          <Text fontSize="$3" fontWeight="600" color="$foreground">
                            {item.title}
                          </Text>
                        </XStack>
                        <Badge tone="bull">{item.badge}</Badge>
                      </XStack>
                      <Text fontSize="$2" color="$foregroundSecondary" lineHeight={19}>
                        {item.description}
                      </Text>
                    </Card>
                  </Link>
                );
              })}
            </XStack>

            <XStack alignItems="center" justifyContent="space-between" marginTop="$4" marginBottom="$3">
              <Text fontSize="$5" fontWeight="600">
                Recent Audit & Telemetry Stream
              </Text>
              <XStack alignItems="center" gap="$2">
                <Activity size={15} color="#2dbf8e" />
                <StatusBadge status={data.marketSessionMode ?? "CONTINUOUS_24_7"} />
              </XStack>
            </XStack>

            <Card>
              {data.recentActivity.length > 0 ? (
                data.recentActivity.map((item, idx) => (
                  <XStack
                    key={item.id}
                    alignItems="center"
                    justifyContent="space-between"
                    gap="$4"
                    paddingVertical="$3"
                    paddingHorizontal="$4"
                    borderBottomWidth={idx === data.recentActivity.length - 1 ? 0 : 1}
                    borderColor="$ruleFaint"
                    flexWrap="wrap"
                  >
                    <YStack flex={1} gap="$1" minWidth={240}>
                      <Text fontSize="$3" color="$foreground" fontWeight="500">
                        {item.description}
                      </Text>
                      <XStack alignItems="center" gap="$2">
                        <Badge tone="info">{item.type}</Badge>
                        {item.actor ? (
                          <Text fontFamily="$mono" fontSize="$1" color="$foregroundMuted">
                            by {item.actor}
                          </Text>
                        ) : null}
                      </XStack>
                    </YStack>
                    <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
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
