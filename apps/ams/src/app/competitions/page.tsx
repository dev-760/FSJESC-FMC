"use client";

import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, TableSkeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView, StatCard, StatGrid } from "@/components/page";
import { api, formatCount, formatDate, formatMAD, type AdminCompetition } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 13,
  padding: "7px 11px",
};

const ALL_MARKETS = ["CSE", "STOCKS", "ETFS", "FUTURES", "CRYPTO", "FOREX", "BONDS", "OPTIONS"] as const;

export default function CompetitionsPage() {
  const { resource, retry } = useResource((signal) => api.competitions(signal), []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startingCashMad, setStartingCashMad] = useState("100000");
  const [maxParticipants, setMaxParticipants] = useState("100");
  const [scenario, setScenario] = useState("NORMAL");
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([
    "CSE",
    "STOCKS",
    "ETFS",
    "FOREX",
    "BONDS",
  ]);
  const [notice, setNotice] = useState<string | null>(null);

  const toggleMarket = (mkt: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(mkt) ? prev.filter((m) => m !== mkt) : [...prev, mkt],
    );
  };

  const handleCreateCompetition = async () => {
    if (!title.trim()) return;
    try {
      const created = await api.createCompetition({
        title: title.trim(),
        description: description.trim() || undefined,
        startingCashMad: Number(startingCashMad) || 100_000,
        maxParticipants: Number(maxParticipants) || 100,
        scenario,
        allowedMarkets: selectedMarkets,
        status: "OPEN",
      });
      setNotice(`Launched competition "${created.title}" (${startingCashMad} MAD starting capital).`);
      setTitle("");
      setDescription("");
      setShowCreateForm(false);
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create competition.");
    }
  };

  const handleStatusChange = async (comp: AdminCompetition, nextStatus: string) => {
    await api.updateCompetition({ id: comp.id, status: nextStatus });
    setNotice(`Competition "${comp.title}" transitioned to ${nextStatus}.`);
    retry();
  };

  const handleDeleteCompetition = async (comp: AdminCompetition) => {
    await api.deleteCompetition(comp.id);
    setNotice(`Removed competition "${comp.title}".`);
    retry();
  };

  const columns: Column<AdminCompetition>[] = [
    {
      header: "Competition Cohort",
      width: 310,
      render: (competition) => (
        <YStack gap="$0.5">
          <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
            {competition.title}
          </Text>
          <XStack gap="$1" flexWrap="wrap">
            {(competition.allowedMarkets ?? ["CSE"]).slice(0, 5).map((m) => (
              <Badge key={m} tone="neutral">
                {m}
              </Badge>
            ))}
          </XStack>
        </YStack>
      ),
    },
    {
      header: "Starting Cash",
      width: 140,
      numeric: true,
      render: (competition) => (
        <Text fontFamily="$mono" fontSize="$2" color="$bull" textAlign="right">
          {formatMAD(competition.startingCashCents ?? "10000000")}
        </Text>
      ),
    },
    {
      header: "Scenario",
      width: 140,
      render: (competition) => (
        <Badge tone="info">{competition.scenario ?? "NORMAL"}</Badge>
      ),
    },
    {
      header: "Starts",
      width: 120,
      render: (competition) =>
        competition.startsAt ? (
          <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary">
            {formatDate(competition.startsAt)}
          </Text>
        ) : (
          <Text fontSize="$2" color="$foregroundMuted">
            —
          </Text>
        ),
    },
    {
      header: "Traders",
      width: 110,
      numeric: true,
      render: (competition) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {formatCount(competition.participantCount ?? 0)}
          {competition.maxParticipants ? (
            <Text fontFamily="$mono" color="$foregroundMuted">
              {` / ${competition.maxParticipants}`}
            </Text>
          ) : null}
        </Text>
      ),
    },
    {
      header: "Status",
      width: 110,
      render: (competition) => <StatusBadge status={competition.status ?? "DRAFT"} />,
    },
    {
      header: "Lifecycle Controls",
      width: 210,
      render: (competition) => (
        <XStack gap="$1.5" alignItems="center">
          <select
            value={competition.status ?? "DRAFT"}
            onChange={(e) => void handleStatusChange(competition, e.target.value)}
            aria-label={`Status for ${competition.title}`}
            style={{ ...INPUT_STYLE, padding: "5px 8px", fontSize: 12, fontFamily: "monospace" }}
          >
            <option value="DRAFT">DRAFT</option>
            <option value="OPEN">OPEN</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleDeleteCompetition(competition)}
          >
            <Trash2 size={13} color="#e8745a" />
          </Button>
        </XStack>
      ),
    },
  ];

  return (
    <AppShell title="Competitions">
      <PageHeader
        title="Trading Competitions & Scenario Cohorts"
        lead="Configure multi-asset trading championships, starting capital allocations, allowed asset classes, and macro stress scenarios."
        action={
          <Button
            variant="primary"
            size="md"
            onPress={() => setShowCreateForm((prev) => !prev)}
          >
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text color="$canvas" fontWeight="600">
                {showCreateForm ? "Close form" : "New competition"}
              </Text>
            </XStack>
          </Button>
        }
      />

      {notice ? (
        <Card padding="$3" marginBottom="$4" borderColor="$bull">
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

      {showCreateForm ? (
        <Card padding="$4" marginBottom="$4" borderColor="$bull">
          <Text fontSize="$4" fontWeight="600" color="$foreground" marginBottom="$3">
            Configure New Trading Competition Cohort
          </Text>
          <YStack gap="$3">
            <XStack flexWrap="wrap" gap="$3">
              <YStack gap="$1" flex={2} minWidth={240}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  COMPETITION TITLE
                </Text>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Casablanca MASI & Global Macro Challenge"
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" width={160}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  STARTING CAPITAL (MAD)
                </Text>
                <input
                  type="number"
                  value={startingCashMad}
                  onChange={(e) => setStartingCashMad(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" width={140}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  MAX TRADERS
                </Text>
                <input
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" width={190}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  MACRO SCENARIO
                </Text>
                <select
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  style={INPUT_STYLE}
                >
                  <option value="NORMAL">NORMAL</option>
                  <option value="BAM_RATE_HIKE">BAM_RATE_HIKE</option>
                  <option value="LIQUIDITY_CRUNCH">LIQUIDITY_CRUNCH</option>
                  <option value="DIRHAM_BAND_WIDENING">DIRHAM_BAND_WIDENING</option>
                  <option value="GLOBAL_RISK_OFF">GLOBAL_RISK_OFF</option>
                </select>
              </YStack>
            </XStack>

            <YStack gap="$1">
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                ALLOWED MARKETS (8 ASSET CLASSES)
              </Text>
              <XStack flexWrap="wrap" gap="$2">
                {ALL_MARKETS.map((mkt) => {
                  const active = selectedMarkets.includes(mkt);
                  return (
                    <Button
                      key={mkt}
                      size="sm"
                      variant={active ? "secondary" : "ghost"}
                      onPress={() => toggleMarket(mkt)}
                    >
                      <Text
                        fontFamily="$mono"
                        fontSize="$0"
                        color={active ? "$bull" : "$foregroundMuted"}
                      >
                        {active ? `✓ ${mkt}` : mkt}
                      </Text>
                    </Button>
                  );
                })}
              </XStack>
            </YStack>

            <XStack flexWrap="wrap" gap="$3" alignItems="flex-end">
              <YStack gap="$1" flex={1} minWidth={240}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  RULES & SCORING SUMMARY
                </Text>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Scored on Sharpe ratio, net return, and <10% max drawdown..."
                  style={INPUT_STYLE}
                />
              </YStack>
              <Button variant="primary" size="md" onPress={() => void handleCreateCompetition()}>
                <Text color="$canvas" fontWeight="600">
                  Launch Competition
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Card>
      ) : null}

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={4} />}>
        {(competitions) => {
          const activeCount = competitions.filter(
            (c) => c.status === "ACTIVE" || c.status === "OPEN",
          ).length;
          const totalParticipants = competitions.reduce(
            (s, c) => s + (c.participantCount ?? 0),
            0,
          );

          return (
            <>
              <StatGrid>
                <StatCard label="Total Cohorts" value={formatCount(competitions.length)} />
                <StatCard label="Active / Open" value={formatCount(activeCount)} />
                <StatCard label="Enrolled Traders" value={formatCount(totalParticipants)} />
              </StatGrid>

              <Card padding="$4">
                {competitions.length > 0 ? (
                  <DataTable
                    columns={columns}
                    rows={competitions}
                    rowKey={(competition) => competition.id}
                  />
                ) : (
                  <EmptyState
                    title="No competitions configured"
                    description="A competition appears here once its scenario assumptions are published."
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