"use client";

import { useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TableSkeleton } from "@/components/ui/data-table";
import { PageHeader, ResourceView, SectionTitle } from "@/components/page";
import { api, type PlatformSettings } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "#0f1520",
  border: "1px solid #283449",
  borderRadius: 6,
  color: "#eef2f6",
  fontSize: 13,
  padding: "8px 12px",
  width: "100%",
};

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <XStack
      alignItems="center"
      justifyContent="space-between"
      gap="$4"
      paddingVertical="$3"
      borderBottomWidth={1}
      borderColor="$ruleFaint"
    >
      <YStack flex={1} gap="$0.5">
        <Text fontSize="$3" fontWeight="600" color="$foreground">
          {label}
        </Text>
        <Paragraph fontSize="$2" color="$foregroundSecondary" lineHeight={18}>
          {description}
        </Paragraph>
      </YStack>
      <Button
        size="sm"
        variant={checked ? "primary" : "outline"}
        onPress={() => onChange(!checked)}
      >
        <Text fontFamily="$mono" fontSize="$1" color={checked ? "$canvas" : "$foregroundSecondary"}>
          {checked ? "ENABLED" : "DISABLED"}
        </Text>
      </Button>
    </XStack>
  );
}

function SettingsForm({
  initial,
  onSaved,
}: {
  initial: PlatformSettings;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<PlatformSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const update = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings(draft);
      setNotice(
        `Saved platform configuration at ${new Date().toLocaleTimeString("fr-MA")} (Casablanca).`,
      );
      onSaved();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <YStack gap="$4">
      {notice ? (
        <Card padding="$3" borderColor="$bull">
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <XStack alignItems="center" gap="$2">
              <CheckCircle2 size={16} color="#2dbf8e" />
              <Text fontFamily="$mono" fontSize="$2" color="$bull">
                {notice}
              </Text>
            </XStack>
            <Button size="sm" variant="ghost" onPress={() => setNotice(null)}>
              <Text fontSize="$1" color="$foregroundMuted">
                Dismiss
              </Text>
            </Button>
          </XStack>
        </Card>
      ) : null}

      {/* Section 1: General & Organization */}
      <SectionTitle>1. General & Institutional Identity</SectionTitle>
      <Card padding="$4">
        <YStack gap="$3">
          <XStack flexWrap="wrap" gap="$3">
            <YStack gap="$1" flex={1} minWidth={240}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                PLATFORM NAME
              </Text>
              <input
                value={draft.platformName}
                onChange={(e) => update("platformName", e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={240}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                FACULTY / INSTITUTION
              </Text>
              <input
                value={draft.organizationName}
                onChange={(e) => update("organizationName", e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$3">
            <YStack gap="$1" flex={1} minWidth={240}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                CAMPUS LOCATION
              </Text>
              <input
                value={draft.campusLocation}
                onChange={(e) => update("campusLocation", e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={220}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                BUREAU SUPPORT EMAIL
              </Text>
              <input
                value={draft.supportEmail}
                onChange={(e) => update("supportEmail", e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={220}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                ALLOWED EMAIL DOMAINS
              </Text>
              <input
                value={draft.allowedEmailDomains}
                onChange={(e) => update("allowedEmailDomains", e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
          </XStack>

          <YStack gap="$1">
            <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
              GLOBAL ANNOUNCEMENT BANNER
            </Text>
            <input
              value={draft.announcementBanner}
              onChange={(e) => update("announcementBanner", e.target.value)}
              style={INPUT_STYLE}
            />
          </YStack>

          <ToggleRow
            label="Display Announcement Banner"
            description="Show the announcement ribbon across the landing site and simulator terminal."
            checked={draft.announcementActive}
            onChange={(v) => update("announcementActive", v)}
          />
          <ToggleRow
            label="Open Student Registration"
            description="Allow new students and club members to create accounts and receive a 100,000 MAD sandbox portfolio."
            checked={draft.registrationOpen}
            onChange={(v) => update("registrationOpen", v)}
          />
          <ToggleRow
            label="Require University Email Verification"
            description="Require email token confirmation before granting live simulator order execution."
            checked={draft.requireEmailVerification}
            onChange={(v) => update("requireEmailVerification", v)}
          />
          <ToggleRow
            label="Platform Maintenance Mode"
            description="Temporarily place public and simulator surfaces into read-only maintenance mode."
            checked={draft.maintenanceMode}
            onChange={(v) => update("maintenanceMode", v)}
          />
        </YStack>
      </Card>

      {/* Section 2: Simulator & Trading Engine Parameters */}
      <SectionTitle>2. Simulator & Trading Engine Parameters</SectionTitle>
      <Card padding="$4">
        <YStack gap="$3">
          <XStack flexWrap="wrap" gap="$3">
            <YStack gap="$1" flex={1} minWidth={180}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                DEFAULT STARTING CAPITAL (MAD)
              </Text>
              <input
                type="number"
                value={draft.defaultStartingCashMad}
                onChange={(e) => update("defaultStartingCashMad", Number(e.target.value) || 100000)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={160}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                COMMISSION (BPS)
              </Text>
              <input
                type="number"
                value={draft.commissionBps}
                onChange={(e) => update("commissionBps", Number(e.target.value) || 0)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={160}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                MIN COMMISSION (MAD)
              </Text>
              <input
                type="number"
                value={draft.minCommissionMad}
                onChange={(e) => update("minCommissionMad", Number(e.target.value) || 0)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={160}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                SLIPPAGE MODEL (BPS)
              </Text>
              <input
                type="number"
                value={draft.slippageBps}
                onChange={(e) => update("slippageBps", Number(e.target.value) || 0)}
                style={INPUT_STYLE}
              />
            </YStack>
          </XStack>

          <XStack flexWrap="wrap" gap="$3">
            <YStack gap="$1" flex={1} minWidth={180}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                MAROCLEAR SETTLEMENT REGIME
              </Text>
              <select
                value={draft.settlementRegime}
                onChange={(e) =>
                  update("settlementRegime", e.target.value as "T+0" | "T+1" | "T+2")
                }
                style={INPUT_STYLE}
              >
                <option value="T+0">T+0 Instant Settlement</option>
                <option value="T+1">T+1 Next Business Day</option>
                <option value="T+2">T+2 Standard Casablanca Settlement</option>
              </select>
            </YStack>
            <YStack gap="$1" flex={1} minWidth={180}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                MAX SINGLE POSITION (% NAV)
              </Text>
              <input
                type="number"
                value={draft.maxSinglePositionPct}
                onChange={(e) => update("maxSinglePositionPct", Number(e.target.value) || 25)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={210}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                MARKET SESSION SCHEDULE
              </Text>
              <select
                value={draft.marketSessionMode}
                onChange={(e) =>
                  update(
                    "marketSessionMode",
                    e.target.value as "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED",
                  )
                }
                style={INPUT_STYLE}
              >
                <option value="CONTINUOUS_24_7">CONTINUOUS 24/7 SIMULATION</option>
                <option value="CASABLANCA_HOURS">CASABLANCA HOURS (09:30–15:30)</option>
                <option value="HALTED">TRADING HALTED (CIRCUIT BREAKER)</option>
              </select>
            </YStack>
          </XStack>

          <ToggleRow
            label="Allow Short Selling"
            description="Permit students to open net short positions on futures, forex, and margin-eligible equities."
            checked={draft.allowShortSelling}
            onChange={(v) => update("allowShortSelling", v)}
          />
          <ToggleRow
            label="Allow Fractional Crypto Quantities"
            description="Enable decimal unit sizing on spot crypto instruments (BTC-USD, ETH-USD, SOL-USD)."
            checked={draft.allowFractionalCrypto}
            onChange={(v) => update("allowFractionalCrypto", v)}
          />
        </YStack>
      </Card>

      {/* Section 3: Wassly Market Data API Gateway */}
      <SectionTitle>3. Wassly Market Data API Gateway (https://api.wassly.tech)</SectionTitle>
      <Card padding="$4">
        <YStack gap="$3">
          <XStack flexWrap="wrap" gap="$3">
            <YStack gap="$1" flex={2} minWidth={260}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                UPSTREAM API BASE URL
              </Text>
              <input
                value={draft.marketApiUrl}
                onChange={(e) => update("marketApiUrl", e.target.value)}
                style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={150}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                TIMEOUT (MS)
              </Text>
              <input
                type="number"
                value={draft.marketApiTimeoutMs}
                onChange={(e) => update("marketApiTimeoutMs", Number(e.target.value) || 4000)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={150}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                CSE CACHE TTL (S)
              </Text>
              <input
                type="number"
                value={draft.cseCacheTtlSeconds}
                onChange={(e) => update("cseCacheTtlSeconds", Number(e.target.value) || 60)}
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={150}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                RATE LIMIT / MIN
              </Text>
              <input
                type="number"
                value={draft.rateLimitPerMinute}
                onChange={(e) => update("rateLimitPerMinute", Number(e.target.value) || 120)}
                style={INPUT_STYLE}
              />
            </YStack>
          </XStack>

          <ToggleRow
            label="Enable Live Reference Quotes Feed"
            description="Fetch live quotes from https://api.wassly.tech across all 8 routers alongside deterministic GBM prices."
            checked={draft.enableLiveReferenceFeed}
            onChange={(v) => update("enableLiveReferenceFeed", v)}
          />
          <ToggleRow
            label="Anchor GBM Reference Prices to Upstream Feed"
            description="Periodically synchronize instrument reference prices with the latest upstream close."
            checked={draft.syncReferencePricesToEngine}
            onChange={(v) => update("syncReferencePricesToEngine", v)}
          />
        </YStack>
      </Card>

      {/* Section 4: Platform Feature Flags */}
      <SectionTitle>4. Feature Flags & Terminal Modules</SectionTitle>
      <Card padding="$4">
        <YStack>
          <ToggleRow
            label="Multi-Asset Trading Simulator"
            description="Enable the 110-instrument simulator terminal, order ticket, and portfolio blotter."
            checked={draft.enableSimulator}
            onChange={(v) => update("enableSimulator", v)}
          />
          <ToggleRow
            label="Trading Competitions & Leaderboards"
            description="Enable competition enrollment, cohort portfolios, and live Sharpe/Return rankings."
            checked={draft.enableCompetitions}
            onChange={(v) => update("enableCompetitions", v)}
          />
          <ToggleRow
            label="Daily Scenario Challenges"
            description="Enable interactive market microstructure and valuation challenges."
            checked={draft.enableChallenges}
            onChange={(v) => update("enableChallenges", v)}
          />
          <ToggleRow
            label="Curriculum & Education Library"
            description="Enable public access to Moroccan & global market research briefings."
            checked={draft.enableEducationLibrary}
            onChange={(v) => update("enableEducationLibrary", v)}
          />
          <ToggleRow
            label="Club Events & Workshop Registration"
            description="Allow students to RSVP for upcoming FSJESC-FMC workshops and sessions."
            checked={draft.enableEventsRegistration}
            onChange={(v) => update("enableEventsRegistration", v)}
          />
          <ToggleRow
            label="Live Multi-Asset Header Ticker"
            description="Render the real-time scrolling ticker bar across the landing and simulator headers."
            checked={draft.enableLiveTicker}
            onChange={(v) => update("enableLiveTicker", v)}
          />
          <ToggleRow
            label="CBOE Options Chain Explorer"
            description="Enable the interactive call/put strike chain and implied volatility viewer on the market board."
            checked={draft.enableOptionsChain}
            onChange={(v) => update("enableOptionsChain", v)}
          />
          <ToggleRow
            label="Sovereign BDT & US Treasury Yield Curve Visualizer"
            description="Enable the fixed-income yield curve comparison panel in the simulator."
            checked={draft.enableYieldCurve}
            onChange={(v) => update("enableYieldCurve", v)}
          />
        </YStack>
      </Card>

      <XStack justifyContent="flex-end" marginTop="$2">
        <Button variant="primary" size="lg" onPress={() => void handleSave()} disabled={saving}>
          <XStack alignItems="center" gap="$2">
            <Save size={16} color="#07080b" />
            <Text color="$canvas" fontWeight="700">
              {saving ? "Saving Configuration..." : "Save All Platform Settings"}
            </Text>
          </XStack>
        </Button>
      </XStack>
    </YStack>
  );
}

export default function SettingsPage() {
  const { resource, retry } = useResource((signal) => api.settings(signal), []);

  return (
    <AppShell
      title="Platform Settings"
      action={<Badge tone="bull">LIVE CONFIG</Badge>}
    >
      <PageHeader
        title="Platform Settings, Trading Rules & Feature Flags"
        lead="Centralized configuration for organization details, trading engine fees and settlement rules, Wassly API gateway parameters, and simulator feature flags."
      />

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={6} />}>
        {(settings) => <SettingsForm initial={settings} onSaved={retry} />}
      </ResourceView>
    </AppShell>
  );
}
