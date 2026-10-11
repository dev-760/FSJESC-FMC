"use client";

import { useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import {
  Activity,
  CheckCircle2,
  Play,
  RefreshCw,
  Search,
  Sliders,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, TableSkeleton, type Column } from "@/components/ui/data-table";
import {
  PageHeader,
  ResourceView,
  SectionTitle,
  StatCard,
  StatGrid,
} from "@/components/page";
import {
  api,
  formatCount,
  type AdminApiRouter,
  type AdminMarketInstrument,
  type ApiProbeResult,
  type MacroScenarioId,
  type MarketCategoryId,
} from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const SCENARIOS: ReadonlyArray<{
  id: MacroScenarioId;
  label: string;
  description: string;
}> = [
  {
    id: "NORMAL",
    label: "Normal Continuous Regime",
    description: "Baseline annual drift and historical volatility across all 8 asset classes.",
  },
  {
    id: "BAM_RATE_HIKE",
    label: "BAM +50 bps Rate Shock",
    description: "Bank Al-Maghrib surprise hike: elevates Moroccan BDT bond volatility and reprices banking equities.",
  },
  {
    id: "LIQUIDITY_CRUNCH",
    label: "Casablanca Liquidity Crunch",
    description: "Widens effective spread impact and increases volatility by +35% across thin compartments.",
  },
  {
    id: "DIRHAM_BAND_WIDENING",
    label: "Dirham FX Band Widening",
    description: "Simulates a wider MAD fluctuation band against the 60% EUR / 40% USD basket.",
  },
  {
    id: "GLOBAL_RISK_OFF",
    label: "Global Risk-Off & VIX Spike",
    description: "Sharp volatility expansion across US tech equities, spot crypto, and CBOE options chains.",
  },
];

const PRESET_PROBES = [
  { label: "CSE: IAM Quote", endpoint: "/api/v1/cse/quote?ticker=IAM" },
  { label: "CSE: ATW Quote", endpoint: "/api/v1/cse/quote?ticker=ATW" },
  { label: "CSE: Market Summary", endpoint: "/api/v1/cse/summary" },
  { label: "Stocks: NVDA Quote", endpoint: "/api/v1/stocks/quote?symbol=NVDA" },
  { label: "ETFs: SPY Quote", endpoint: "/api/v1/etfs/quote?symbol=SPY" },
  { label: "Futures: Gold (GC=F)", endpoint: "/api/v1/futures/quote?symbol=GC%3DF" },
  { label: "Crypto: BTC-USD", endpoint: "/api/v1/crypto/quote?symbol=BTC-USD" },
  { label: "Forex: EUR/USD Rate", endpoint: "/api/v1/forex/rate?base=EUR&target=USD" },
  { label: "Bonds: Yield Curve", endpoint: "/api/v1/bonds/yield-curve" },
  { label: "Options: AAPL Expirations", endpoint: "/api/v1/options/expirations?symbol=AAPL" },
  { label: "Gateway Healthz", endpoint: "/api/v1/health/healthz" },
] as const;

const INPUT_STYLE: React.CSSProperties = {
  background: "#0f1520",
  border: "1px solid #283449",
  borderRadius: 6,
  color: "#eef2f6",
  fontSize: 13,
  padding: "8px 12px",
};

export default function ApisAndMarketsPage() {
  const { resource, retry } = useResource((signal) => api.apis(signal), []);
  const [marketFilter, setMarketFilter] = useState<MarketCategoryId>("ALL");
  const [query, setQuery] = useState("");
  const [probeEndpoint, setProbeEndpoint] = useState("/api/v1/cse/quote?ticker=IAM");
  const [probeResult, setProbeResult] = useState<ApiProbeResult | null>(null);
  const [probing, setProbing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [editPriceMad, setEditPriceMad] = useState("");
  const [editVolatilityPct, setEditVolatilityPct] = useState("");
  const [editDriftPct, setEditDriftPct] = useState("");

  const handleRunProbe = async (customEndpoint?: string) => {
    const target = customEndpoint ?? probeEndpoint;
    if (customEndpoint) setProbeEndpoint(customEndpoint);
    setProbing(true);
    try {
      const res = await api.probeEndpoint(target);
      setProbeResult(res);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Endpoint probe failed.");
    } finally {
      setProbing(false);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      const res = await api.syncAllRouters();
      setNotice(
        `[SYNC OK] Swept all 8 routers on https://api.wassly.tech in ${res.latencyMs}ms (${res.liveHealthy ? "Live Upstream" : "Deterministic Fallback"}).`,
      );
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to sync routers.");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleRouter = async (router: AdminApiRouter) => {
    await api.updateApiRouter({ routerId: router.id, enabled: !router.enabled });
    setNotice(
      `Router ${router.basePath} (${router.name}) ${!router.enabled ? "ENABLED" : "DISABLED"}.`,
    );
    retry();
  };

  const handleUpdateRouterTtl = async (router: AdminApiRouter, cacheTtlSeconds: number) => {
    await api.updateApiRouter({ routerId: router.id, cacheTtlSeconds });
    setNotice(`Updated cache TTL for ${router.basePath} to ${cacheTtlSeconds}s.`);
    retry();
  };

  const handleScenarioChange = async (scenario: MacroScenarioId) => {
    await api.setMacroScenario(scenario);
    setNotice(`Activated macro simulation regime: ${scenario}.`);
    retry();
  };

  const handleToggleInstrument = async (inst: AdminMarketInstrument) => {
    await api.updateInstrument({ ticker: inst.ticker, tradable: !inst.tradable });
    setNotice(
      `${inst.ticker} (${inst.name}) is now ${!inst.tradable ? "TRADABLE" : "HALTED"}.`,
    );
    retry();
  };

  const handleToggleFeatured = async (inst: AdminMarketInstrument) => {
    await api.updateInstrument({ ticker: inst.ticker, featured: !inst.featured });
    retry();
  };

  const handleStartEditInstrument = (inst: AdminMarketInstrument) => {
    setEditingTicker(inst.ticker);
    setEditPriceMad((inst.startingPriceCents / 100).toFixed(2));
    setEditVolatilityPct((inst.annualVolatility * 100).toFixed(1));
    setEditDriftPct((inst.annualDrift * 100).toFixed(1));
  };

  const handleSaveInstrumentEdit = async (ticker: string) => {
    const priceCents = Math.round((Number(editPriceMad) || 100) * 100);
    const annualVolatility = Math.max(0.01, (Number(editVolatilityPct) || 20) / 100);
    const annualDrift = (Number(editDriftPct) || 5) / 100;
    await api.updateInstrument({
      ticker,
      startingPriceCents: priceCents,
      annualVolatility,
      annualDrift,
    });
    setEditingTicker(null);
    setNotice(`Saved pricing & GBM parameters for ${ticker}.`);
    retry();
  };

  const handleBulkToggleMarket = async (market: string, tradable: boolean) => {
    const res = await api.bulkToggleMarket(market, tradable);
    setNotice(
      `${tradable ? "Enabled" : "Halted"} trading on ${res.updatedCount} instruments in ${market}.`,
    );
    retry();
  };

  const instrumentColumns: Column<AdminMarketInstrument>[] = [
    {
      header: "Ticker",
      width: 150,
      render: (inst) => (
        <YStack gap="$0.5">
          <XStack alignItems="center" gap="$1.5">
            <Text fontFamily="$mono" fontSize="$2" fontWeight="700" color="$foreground">
              {inst.ticker}
            </Text>
            {inst.featured ? <Badge tone="bull">★</Badge> : null}
          </XStack>
          <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
            {inst.exchange}
          </Text>
        </YStack>
      ),
    },
    {
      header: "Instrument",
      width: 220,
      render: (inst) => (
        <YStack gap="$0.5">
          <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
            {inst.name}
          </Text>
          <Text fontSize="$1" color="$foregroundSecondary" numberOfLines={1}>
            {inst.sector} {inst.compartment ? `· ${inst.compartment}` : ""}
          </Text>
        </YStack>
      ),
    },
    {
      header: "Market",
      width: 95,
      render: (inst) => <Badge tone="info">{inst.market}</Badge>,
    },
    {
      header: "Ref Price",
      width: 130,
      numeric: true,
      render: (inst) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {(inst.startingPriceCents / 100).toLocaleString("fr-MA", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {inst.currency}
        </Text>
      ),
    },
    {
      header: "GBM Vol / Drift",
      width: 140,
      numeric: true,
      render: (inst) => (
        <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary" textAlign="right">
          σ {(inst.annualVolatility * 100).toFixed(1)}% · μ {(inst.annualDrift * 100).toFixed(1)}%
        </Text>
      ),
    },
    {
      header: "API Route",
      width: 190,
      render: (inst) => (
        <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted" numberOfLines={1}>
          {inst.apiEndpoint}
        </Text>
      ),
    },
    {
      header: "Status",
      width: 95,
      render: (inst) => (
        <StatusBadge status={inst.tradable ? "active" : "suspended"} />
      ),
    },
    {
      header: "Controls",
      width: 240,
      render: (inst) => (
        <XStack gap="$1.5" flexWrap="wrap">
          <Button
            size="sm"
            variant={inst.tradable ? "outline" : "primary"}
            onPress={() => void handleToggleInstrument(inst)}
          >
            <Text fontSize="$1" color={inst.tradable ? "$foreground" : "$canvas"}>
              {inst.tradable ? "Halt" : "Enable"}
            </Text>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => handleStartEditInstrument(inst)}
          >
            <Sliders size={13} color="#b3c0cb" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleRunProbe(inst.apiEndpoint)}
          >
            <Play size={13} color="#2dbf8e" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleToggleFeatured(inst)}
          >
            <Text fontSize="$1" color={inst.featured ? "$bull" : "$foregroundMuted"}>
              ★
            </Text>
          </Button>
        </XStack>
      ),
    },
  ];

  return (
    <AppShell
      title="APIs & Markets"
      action={
        <Button variant="primary" size="sm" onPress={() => void handleSyncAll()} disabled={syncing}>
          <XStack alignItems="center" gap="$2">
            <RefreshCw size={14} color="#07080b" />
            <Text color="$canvas" fontWeight="600" fontSize="$2">
              {syncing ? "Probing 8 Routers..." : "Sync All 8 API Routers"}
            </Text>
          </XStack>
        </Button>
      }
    >
      <PageHeader
        title="Wassly Market Data API & 110-Instrument Catalog"
        lead="Configure the https://api.wassly.tech upstream routers, test live endpoints, trigger macro scenario shocks, and manage tradability and GBM parameters for all 110 instruments."
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

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={6} />}>
        {(data) => {
          const totalTradable = data.instruments.filter((i) => i.tradable).length;
          const enabledRouters = data.routers.filter((r) => r.enabled).length;
          const totalRequests24h = data.routers.reduce((s, r) => s + r.requests24h, 0);
          const avgLatency = Math.round(
            data.routers.reduce((s, r) => s + r.lastLatencyMs, 0) / data.routers.length,
          );

          const needle = query.trim().toLowerCase();
          const filteredInstruments = data.instruments.filter((inst) => {
            if (marketFilter !== "ALL" && inst.market !== marketFilter) return false;
            if (!needle) return true;
            return (
              inst.ticker.toLowerCase().includes(needle) ||
              inst.name.toLowerCase().includes(needle) ||
              inst.sector.toLowerCase().includes(needle) ||
              (inst.isin ?? "").toLowerCase().includes(needle)
            );
          });

          return (
            <>
              <StatGrid>
                <StatCard
                  label="Upstream Gateway"
                  value="ONLINE"
                  hint={data.gateway.baseUrl}
                />
                <StatCard
                  label="Active API Routers"
                  value={`${enabledRouters} / ${data.routers.length}`}
                  hint={`Avg latency: ${avgLatency} ms`}
                />
                <StatCard
                  label="Tradable Instruments"
                  value={`${totalTradable} / ${data.instruments.length}`}
                  hint="Across 8 global & Moroccan markets"
                />
                <StatCard
                  label="24h Upstream Calls"
                  value={formatCount(totalRequests24h)}
                  hint={`Active regime: ${data.gateway.activeScenario}`}
                />
              </StatGrid>

              {/* Macro Scenario Overlay Bar */}
              <SectionTitle>Macro Regime & Volatility Scenario Overlay</SectionTitle>
              <Card padding="$4" marginBottom="$5">
                <Paragraph fontSize="$2" color="$foregroundSecondary" marginBottom="$3">
                  Select the active macro scenario applied to the simulator pricing engine across all 110 instruments:
                </Paragraph>
                <XStack flexWrap="wrap" gap="$2.5">
                  {SCENARIOS.map((sc) => {
                    const active = data.gateway.activeScenario === sc.id;
                    return (
                      <Card
                        key={sc.id}
                        flex={1}
                        minWidth={210}
                        padding="$3"
                        borderColor={active ? "$bull" : "$rule"}
                        backgroundColor={active ? "$surfaceInset" : "$surface"}
                      >
                        <XStack alignItems="center" justifyContent="space-between" marginBottom="$1.5">
                          <Text fontFamily="$mono" fontSize="$1" fontWeight="700" color={active ? "$bull" : "$foreground"}>
                            {sc.label}
                          </Text>
                          {active ? <Badge tone="bull">ACTIVE</Badge> : null}
                        </XStack>
                        <Paragraph fontSize="$1" color="$foregroundSecondary" lineHeight={17} marginBottom="$3">
                          {sc.description}
                        </Paragraph>
                        <Button
                          size="sm"
                          variant={active ? "primary" : "outline"}
                          onPress={() => void handleScenarioChange(sc.id)}
                        >
                          <Text fontSize="$1" color={active ? "$canvas" : "$foreground"}>
                            {active ? "Active Regime" : "Activate Scenario"}
                          </Text>
                        </Button>
                      </Card>
                    );
                  })}
                </XStack>
              </Card>

              {/* 8 Upstream API Routers */}
              <SectionTitle>Upstream API Routers ({data.gateway.baseUrl})</SectionTitle>
              <XStack flexWrap="wrap" gap="$3" marginBottom="$5">
                {data.routers.map((router) => (
                  <Card key={router.id} flex={1} minWidth={300} padding="$4">
                    <XStack alignItems="center" justifyContent="space-between" marginBottom="$2">
                      <XStack alignItems="center" gap="$2">
                        <Badge tone={router.enabled ? "bull" : "bear"}>{router.id}</Badge>
                        <Text fontSize="$3" fontWeight="600" color="$foreground">
                          {router.name}
                        </Text>
                      </XStack>
                      <StatusBadge status={router.enabled ? "active" : "suspended"} />
                    </XStack>

                    <Text fontFamily="$mono" fontSize="$1" color="$bull" marginBottom="$1">
                      {router.basePath} · {router.provider}
                    </Text>
                    <Paragraph fontSize="$1" color="$foregroundSecondary" lineHeight={18} marginBottom="$3">
                      {router.coverage}
                    </Paragraph>

                    <XStack
                      alignItems="center"
                      justifyContent="space-between"
                      paddingVertical="$2"
                      borderTopWidth={1}
                      borderBottomWidth={1}
                      borderColor="$ruleFaint"
                      marginBottom="$3"
                    >
                      <YStack>
                        <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
                          LATENCY
                        </Text>
                        <Text fontFamily="$mono" fontSize="$2" color="$foreground">
                          {router.lastLatencyMs} ms
                        </Text>
                      </YStack>
                      <YStack>
                        <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
                          CACHE TTL
                        </Text>
                        <Text fontFamily="$mono" fontSize="$2" color="$foreground">
                          {router.cacheTtlSeconds}s
                        </Text>
                      </YStack>
                      <YStack>
                        <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
                          RATE LIMIT
                        </Text>
                        <Text fontFamily="$mono" fontSize="$2" color="$foreground">
                          {router.rateLimitPerMin}/min
                        </Text>
                      </YStack>
                      <YStack>
                        <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
                          24H CALLS
                        </Text>
                        <Text fontFamily="$mono" fontSize="$2" color="$foreground">
                          {formatCount(router.requests24h)}
                        </Text>
                      </YStack>
                    </XStack>

                    <XStack alignItems="center" justifyContent="space-between" gap="$2" flexWrap="wrap">
                      <XStack gap="$1.5">
                        <Button
                          size="sm"
                          variant={router.enabled ? "outline" : "primary"}
                          onPress={() => void handleToggleRouter(router)}
                        >
                          <Text fontSize="$1" color={router.enabled ? "$foreground" : "$canvas"}>
                            {router.enabled ? "Disable Router" : "Enable Router"}
                          </Text>
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onPress={() => void handleRunProbe(router.sampleEndpoint)}
                        >
                          <XStack alignItems="center" gap="$1.5">
                            <Zap size={12} color="#2dbf8e" />
                            <Text fontSize="$1">Probe</Text>
                          </XStack>
                        </Button>
                      </XStack>
                      <XStack alignItems="center" gap="$1">
                        {[15, 30, 60, 300].map((ttl) => (
                          <Button
                            key={ttl}
                            size="sm"
                            variant={router.cacheTtlSeconds === ttl ? "secondary" : "ghost"}
                            onPress={() => void handleUpdateRouterTtl(router, ttl)}
                          >
                            <Text
                              fontFamily="$mono"
                              fontSize="$0"
                              color={router.cacheTtlSeconds === ttl ? "$bull" : "$foregroundMuted"}
                            >
                              {ttl}s
                            </Text>
                          </Button>
                        ))}
                      </XStack>
                    </XStack>
                  </Card>
                ))}
              </XStack>

              {/* Interactive Live API Endpoint Probe */}
              <SectionTitle>Interactive Live API Endpoint Probe</SectionTitle>
              <Card padding="$4" marginBottom="$5">
                <Paragraph fontSize="$2" color="$foregroundSecondary" marginBottom="$3">
                  Test any upstream `/api/v1/*` route on {data.gateway.baseUrl} and inspect round-trip latency and JSON payload:
                </Paragraph>

                <XStack flexWrap="wrap" gap="$1.5" marginBottom="$3">
                  {PRESET_PROBES.map((preset) => (
                    <Button
                      key={preset.endpoint}
                      size="sm"
                      variant={probeEndpoint === preset.endpoint ? "secondary" : "ghost"}
                      onPress={() => void handleRunProbe(preset.endpoint)}
                    >
                      <Text
                        fontFamily="$mono"
                        fontSize="$0"
                        color={probeEndpoint === preset.endpoint ? "$bull" : "$foregroundSecondary"}
                      >
                        {preset.label}
                      </Text>
                    </Button>
                  ))}
                </XStack>

                <XStack gap="$2" alignItems="center" flexWrap="wrap">
                  <input
                    value={probeEndpoint}
                    onChange={(e) => setProbeEndpoint(e.target.value)}
                    placeholder="/api/v1/cse/quote?ticker=IAM"
                    aria-label="API endpoint path"
                    style={{ ...INPUT_STYLE, flex: 1, minWidth: 260, fontFamily: "monospace" }}
                  />
                  <Button
                    variant="primary"
                    size="md"
                    onPress={() => void handleRunProbe()}
                    disabled={probing}
                  >
                    <XStack alignItems="center" gap="$2">
                      <Activity size={15} color="#07080b" />
                      <Text color="$canvas" fontWeight="600">
                        {probing ? "Probing..." : "Execute GET Probe"}
                      </Text>
                    </XStack>
                  </Button>
                </XStack>

                {probeResult ? (
                  <YStack
                    marginTop="$4"
                    padding="$3"
                    backgroundColor="$surfaceSunken"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor="$rule"
                    gap="$2"
                  >
                    <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$2">
                      <XStack alignItems="center" gap="$2">
                        <Badge tone={probeResult.ok ? "bull" : "bear"}>
                          HTTP {probeResult.status}
                        </Badge>
                        <Badge tone="info">{probeResult.latencyMs} ms</Badge>
                        <Badge tone={probeResult.source === "LIVE_UPSTREAM" ? "bull" : "warning"}>
                          {probeResult.source}
                        </Badge>
                      </XStack>
                      <Text fontFamily="$mono" fontSize="$1" color="$foregroundMuted">
                        {probeResult.url}
                      </Text>
                    </XStack>
                    <pre
                      style={{
                        margin: 0,
                        padding: 12,
                        background: "#070a0f",
                        borderRadius: 6,
                        color: "#2dbf8e",
                        fontSize: 12,
                        maxHeight: 260,
                        overflow: "auto",
                        fontFamily: "monospace",
                      }}
                    >
                      {JSON.stringify(probeResult.payload, null, 2)}
                    </pre>
                  </YStack>
                ) : null}
              </Card>

              {/* Inline Instrument Parameter Editor Modal/Drawer */}
              {editingTicker ? (
                <Card padding="$4" marginBottom="$4" borderColor="$bull">
                  <XStack alignItems="center" justifyContent="space-between" marginBottom="$3">
                    <Text fontSize="$4" fontWeight="600" color="$foreground">
                      Configure Instrument Parameters: {editingTicker}
                    </Text>
                    <Button size="sm" variant="ghost" onPress={() => setEditingTicker(null)}>
                      <Text fontSize="$1">Cancel</Text>
                    </Button>
                  </XStack>
                  <XStack flexWrap="wrap" gap="$3" alignItems="flex-end">
                    <YStack gap="$1" minWidth={180}>
                      <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                        STARTING / REF PRICE
                      </Text>
                      <input
                        type="number"
                        step="0.01"
                        value={editPriceMad}
                        onChange={(e) => setEditPriceMad(e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </YStack>
                    <YStack gap="$1" minWidth={180}>
                      <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                        ANNUAL VOLATILITY σ (%)
                      </Text>
                      <input
                        type="number"
                        step="0.5"
                        value={editVolatilityPct}
                        onChange={(e) => setEditVolatilityPct(e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </YStack>
                    <YStack gap="$1" minWidth={180}>
                      <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                        ANNUAL DRIFT μ (%)
                      </Text>
                      <input
                        type="number"
                        step="0.5"
                        value={editDriftPct}
                        onChange={(e) => setEditDriftPct(e.target.value)}
                        style={INPUT_STYLE}
                      />
                    </YStack>
                    <Button
                      variant="primary"
                      size="md"
                      onPress={() => void handleSaveInstrumentEdit(editingTicker)}
                    >
                      <Text color="$canvas" fontWeight="600">
                        Save GBM & Price Config
                      </Text>
                    </Button>
                  </XStack>
                </Card>
              ) : null}

              {/* 110-Instrument Multi-Asset Catalog */}
              <SectionTitle>
                Multi-Asset Instrument Catalog ({filteredInstruments.length} of {data.instruments.length})
              </SectionTitle>
              <Card padding="$4">
                <XStack
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="$3"
                  marginBottom="$3"
                >
                  <XStack
                    alignItems="center"
                    gap="$2"
                    backgroundColor="$surfaceSunken"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor="$rule"
                    paddingHorizontal="$3"
                    flex={1}
                    maxWidth={360}
                  >
                    <Search size={16} color="#778592" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter 110 instruments by ticker, name, ISIN, sector..."
                      aria-label="Filter instruments"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: 0,
                        outline: "none",
                        color: "#eef2f6",
                        fontSize: 14,
                        padding: "10px 0",
                      }}
                    />
                  </XStack>

                  <XStack gap="$2">
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => void handleBulkToggleMarket(marketFilter, true)}
                    >
                      <Text fontSize="$1">Enable All ({marketFilter})</Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onPress={() => void handleBulkToggleMarket(marketFilter, false)}
                    >
                      <Text fontSize="$1" color="$bear">
                        Halt All ({marketFilter})
                      </Text>
                    </Button>
                  </XStack>
                </XStack>

                <XStack flexWrap="wrap" gap="$1.5" marginBottom="$4">
                  {(
                    [
                      "ALL",
                      "CSE",
                      "STOCKS",
                      "ETFS",
                      "FUTURES",
                      "CRYPTO",
                      "FOREX",
                      "BONDS",
                      "OPTIONS",
                    ] as const
                  ).map((cat) => (
                    <Button
                      key={cat}
                      size="sm"
                      variant={marketFilter === cat ? "secondary" : "ghost"}
                      onPress={() => setMarketFilter(cat)}
                    >
                      <Text
                        fontFamily="$mono"
                        fontSize="$0"
                        color={marketFilter === cat ? "$bull" : "$foregroundSecondary"}
                      >
                        {cat}
                      </Text>
                    </Button>
                  ))}
                </XStack>

                {filteredInstruments.length > 0 ? (
                  <DataTable
                    columns={instrumentColumns}
                    rows={filteredInstruments}
                    rowKey={(inst) => inst.ticker}
                  />
                ) : (
                  <EmptyState
                    title="No instruments match filter"
                    description="Try clearing the search query or switching the market category tab."
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
