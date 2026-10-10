"use client";

import { Paragraph, Text, XStack, YStack } from "tamagui";
import { CheckCircle2, CircleAlert, CircleHelp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/page";
import type { StatusTone } from "@/components/ui/badge";

/**
 * System health.
 *
 * These checks are reported rather than measured: there is no probe endpoint on
 * the platform yet, so the page states plainly that it is not live data rather
 * than presenting hardcoded "healthy" as though it were a reading.
 */

interface Check {
  name: string;
  detail: string;
  status: "operational" | "degraded" | "unknown";
}

const CHECKS: Check[] = [
  {
    name: "Price engine",
    detail: "Deterministic geometric Brownian motion, seeded per symbol and minute.",
    status: "operational",
  },
  {
    name: "Ledger",
    detail: "Append-only record of every fill, reconciling exactly against cash.",
    status: "operational",
  },
  {
    name: "Market data probe",
    detail: "No probe endpoint is exposed yet, so this reading is not live.",
    status: "unknown",
  },
];

const STATUS_META: Record<
  Check["status"],
  { tone: StatusTone; label: string; icon: typeof CheckCircle2 }
> = {
  operational: { tone: "bull", label: "Operational", icon: CheckCircle2 },
  degraded: { tone: "warning", label: "Degraded", icon: CircleAlert },
  unknown: { tone: "neutral", label: "Not reported", icon: CircleHelp },
};

export default function SystemPage() {
  return (
    <AppShell title="System">
      <PageHeader
        title="System"
        lead="The moving parts behind the simulator, and what is actually being measured."
      />

      <YStack gap="$4">
        {CHECKS.map((check) => {
          const meta = STATUS_META[check.status];
          const Icon = meta.icon;
          return (
            <Card key={check.name} padding="$4">
              <XStack alignItems="flex-start" gap="$3">
                <Icon
                  size={20}
                  color={
                    meta.tone === "bull" ? "#00e599" : meta.tone === "warning" ? "#fbbf24" : "#6b7280"
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
          <CardTitle>Maintenance</CardTitle>
        </CardHeader>
        <CardContent>
          <Paragraph fontSize="$2" color="$foregroundSecondary" lineHeight={19}>
            Destructive operations are disabled while the platform has active portfolios.
          </Paragraph>
          <YStack alignItems="flex-start" marginTop="$4" gap="$2">
            <Button variant="outline" size="sm" disabled>
              <Text>Recompute portfolios</Text>
            </Button>
            <Button variant="destructive" size="sm" disabled>
              <Text>Reset simulation state</Text>
            </Button>
          </YStack>
        </CardContent>
      </Card>
    </AppShell>
  );
}