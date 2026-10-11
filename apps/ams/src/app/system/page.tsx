"use client";

import { useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import {
  CheckCircle2,
  CircleAlert,
  CircleHelp,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  RotateCcw,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, type StatusTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader, StatCard, StatGrid } from "@/components/page";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

interface Check {
  name: string;
  detail: string;
  status: "operational" | "degraded" | "unknown";
}

const STATUS_META: Record<
  Check["status"],
  { tone: StatusTone; label: string; icon: typeof CheckCircle2 }
> = {
  operational: { tone: "bull", label: "Operational", icon: CheckCircle2 },
  degraded: { tone: "warning", label: "Degraded", icon: CircleAlert },
  unknown: { tone: "neutral", label: "Standby", icon: CircleHelp },
};

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m ${Math.floor(seconds % 60)}s`;
}

export default function SystemPage() {
  const { resource, retry } = useResource((signal) => api.system(signal), []);
  const [maintenanceNotice, setMaintenanceNotice] = useState<string | null>(null);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const sys = resource.status === "ready" ? resource.data : null;

  const handleMaintenanceAction = async (
    action:
      | "RECOMPUTE_MARKS"
      | "FLUSH_API_CACHE"
      | "RESET_DEMO_PORTFOLIOS"
      | "HALT_TRADING"
      | "RESUME_TRADING",
  ) => {
    setRunningAction(action);
    try {
      const res = await api.runSystemAction(action);
      setMaintenanceNotice(res.message);
      retry();
    } catch (err) {
      setMaintenanceNotice(err instanceof Error ? err.message : "Operation failed.");
    } finally {
      setRunningAction(null);
    }
  };

  const checks: Check[] = [
    {
      name: "PostgreSQL Ledger & Runtime Control Store",
      detail: sys
        ? `Database & runtime state store probed (${sys.database}). Last schema migration: ${sys.lastMigration}.`
        : "Append-only record of every fill, reconciling exactly against cash.",
      status: sys
        ? sys.database === "healthy"
          ? "operational"
          : "degraded"
        : "operational",
    },
    {
      name: "Multi-Asset GBM Price Engine (110 Instruments)",
      detail: sys
        ? `Session mode: ${sys.marketSessionMode ?? "CONTINUOUS_24_7"} · Active scenario: ${sys.activeScenario ?? "NORMAL"} · ${sys.tradableInstruments ?? 110}/${sys.totalInstruments ?? 110} instruments tradable.`
        : "Continuous geometric Brownian motion seeded per symbol and minute bucket.",
      status: sys
        ? sys.marketEngine === "healthy"
          ? "operational"
          : "degraded"
        : "operational",
    },
    {
      name: "Wassly Market Data API Gateway (https://api.wassly.tech)",
      detail: sys
        ? `Upstream endpoint: ${sys.marketApiUrl ?? "https://api.wassly.tech"} · ${sys.enabledRouters ?? 8}/${sys.totalRouters ?? 8} routers enabled (CSE, Stocks, ETFs, Futures, Crypto, Forex, Bonds, Options).`
        : "Bridges Bourse de Casablanca, Yahoo Finance, Frankfurter FX, FRED Treasury, and CBOE Options.",
      status: sys
        ? sys.apiGateway === "healthy"
          ? "operational"
          : "degraded"
        : "operational",
    },
    {
      name: "Bourse de Casablanca & Global Session Clock",
      detail:
        "Synchronized to Africa/Casablanca (09:30–15:30 Mon–Fri) alongside US/EU/Crypto continuous simulation schedules.",
      status: "operational",
    },
  ];

  return (
    <AppShell title="System Health">
      <PageHeader
        title="System Health, Diagnostics & Maintenance"
        lead="Live probe status of the database, 110-instrument pricing engine, Wassly API gateway, and administrative maintenance operations."
        action={
          <Button variant="secondary" size="sm" onPress={retry}>
            <XStack alignItems="center" gap="$2">
              <RefreshCw size={14} color="#b3c0cb" />
              <Text fontSize="$2">Run diagnostic probe</Text>
            </XStack>
          </Button>
        }
      />

      {sys ? (
        <StatGrid>
          <StatCard label="Database & Store" value={sys.database.toUpperCase()} />
          <StatCard
            label="Market Engine"
            value={sys.marketEngine.toUpperCase()}
            hint={`Mode: ${sys.marketSessionMode ?? "CONTINUOUS_24_7"}`}
          />
          <StatCard
            label="Wassly API Routers"
            value={`${sys.enabledRouters ?? 8} / ${sys.totalRouters ?? 8}`}
            hint={sys.marketApiUrl ?? "https://api.wassly.tech"}
          />
          <StatCard
            label="Process Uptime"
            value={formatUptime(sys.uptime)}
            hint={`Build v${sys.version} · ${sys.lastMigration}`}
          />
        </StatGrid>
      ) : null}

      <YStack gap="$4">
        {checks.map((check) => {
          const meta = STATUS_META[check.status];
          const Icon = meta.icon;
          return (
            <Card key={check.name} padding="$4">
              <XStack alignItems="flex-start" gap="$3">
                <Icon
                  size={20}
                  color={
                    meta.tone === "bull"
                      ? "#2dbf8e"
                      : meta.tone === "warning"
                        ? "#e0b858"
                        : "#778592"
                  }
                />
                <YStack flex={1} gap="$2">
                  <XStack alignItems="center" gap="$3" flexWrap="wrap">
                    <Text fontSize="$4" fontWeight="600" color="$foreground">
                      {check.name}
                    </Text>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </XStack>
                  <Paragraph fontSize="$2" color="$foregroundSecondary" lineHeight={19}>
                    {check.detail}
                  </Paragraph>
                </YStack>
              </XStack>
            </Card>
          );
        })}
      </YStack>

      <Card marginTop="$6" padding="$4">
        <CardHeader>
          <CardTitle>Maintenance, Cache & Circuit Breaker Controls</CardTitle>
        </CardHeader>
        <CardContent>
          <Paragraph fontSize="$2" color="$foregroundSecondary" lineHeight={19}>
            Execute live operational tasks across the simulator ledger, upstream Wassly API caches,
            and order matching circuit breakers. Every operation is logged to the immutable audit trail.
          </Paragraph>

          {maintenanceNotice ? (
            <Card padding="$3" marginTop="$3" borderColor="$bull">
              <Text fontFamily="$mono" fontSize="$2" color="$bull">
                {maintenanceNotice}
              </Text>
            </Card>
          ) : null}

          <XStack flexWrap="wrap" alignItems="center" marginTop="$4" gap="$3">
            <Button
              variant="secondary"
              size="md"
              disabled={runningAction !== null}
              onPress={() => void handleMaintenanceAction("RECOMPUTE_MARKS")}
            >
              <XStack alignItems="center" gap="$2">
                <RefreshCw size={14} color="#2dbf8e" />
                <Text>Recompute Portfolio Marks</Text>
              </XStack>
            </Button>

            <Button
              variant="secondary"
              size="md"
              disabled={runningAction !== null}
              onPress={() => void handleMaintenanceAction("FLUSH_API_CACHE")}
            >
              <XStack alignItems="center" gap="$2">
                <Zap size={14} color="#2dbf8e" />
                <Text>Flush Wassly API Caches</Text>
              </XStack>
            </Button>

            <Button
              variant="outline"
              size="md"
              disabled={runningAction !== null}
              onPress={() => void handleMaintenanceAction("RESET_DEMO_PORTFOLIOS")}
            >
              <XStack alignItems="center" gap="$2">
                <RotateCcw size={14} color="#e0b858" />
                <Text>Reset All Sandbox Portfolios (100k MAD)</Text>
              </XStack>
            </Button>

            {sys?.marketSessionMode === "HALTED" ? (
              <Button
                variant="primary"
                size="md"
                disabled={runningAction !== null}
                onPress={() => void handleMaintenanceAction("RESUME_TRADING")}
              >
                <XStack alignItems="center" gap="$2">
                  <PlayCircle size={15} color="#07080b" />
                  <Text color="$canvas" fontWeight="600">
                    Resume Continuous Trading
                  </Text>
                </XStack>
              </Button>
            ) : (
              <Button
                variant="destructive"
                size="md"
                disabled={runningAction !== null}
                onPress={() => void handleMaintenanceAction("HALT_TRADING")}
              >
                <XStack alignItems="center" gap="$2">
                  <PauseCircle size={15} color="#07080b" />
                  <Text color="$canvas" fontWeight="600">
                    Engage Trading Halt (Circuit Breaker)
                  </Text>
                </XStack>
              </Button>
            )}
          </XStack>
        </CardContent>
      </Card>
    </AppShell>
  );
}