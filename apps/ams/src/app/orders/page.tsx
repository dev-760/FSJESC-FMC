"use client";

import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Download, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, TableSkeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView, StatCard, StatGrid } from "@/components/page";
import { api, formatCount, formatDateTime, formatMAD, type AdminOrder } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 13,
  padding: "7px 11px",
};

export default function OrdersPage() {
  const { resource, retry } = useResource((signal) => api.orders(signal), []);
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showOrderTicket, setShowOrderTicket] = useState(false);
  const [symbol, setSymbol] = useState("ATW");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("25");
  const [limitPriceMad, setLimitPriceMad] = useState("485");
  const [notice, setNotice] = useState<string | null>(null);

  const handleSubmitDeskOrder = async () => {
    if (!symbol.trim()) return;
    try {
      const created = await api.createOrder({
        symbol: symbol.trim().toUpperCase(),
        side,
        orderType,
        quantity: Number(quantity) || 10,
        limitPriceMad: orderType === "LIMIT" ? Number(limitPriceMad) || undefined : undefined,
      });
      setNotice(
        `Submitted desk order ${created.id}: ${created.side} ${created.quantity} ${created.symbol} (${created.status}).`,
      );
      setShowOrderTicket(false);
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to submit desk order.");
    }
  };

  const handleUpdateOrderStatus = async (order: AdminOrder, status: string, reason?: string) => {
    await api.updateOrder({ id: order.id, status, reason });
    setNotice(`Order ${order.id} (${order.symbol}) marked as ${status}.`);
    retry();
  };

  const handleExportCsv = (orders: AdminOrder[]) => {
    const header = "OrderID,Trader,Symbol,Market,Side,Type,Quantity,FillPriceCents,Status,PlacedAt";
    const rows = orders.map((o) =>
      [
        o.id,
        o.userEmail ?? "",
        o.symbol,
        o.market ?? "CSE",
        o.side,
        o.orderType,
        o.quantity,
        o.filledPriceCents ?? "",
        o.status,
        o.createdAt,
      ].join(","),
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fsjesc-fmc-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const columns: Column<AdminOrder>[] = [
    {
      header: "Order / Trader",
      width: 210,
      render: (order) => (
        <YStack gap="$0.5">
          <Text fontFamily="$mono" fontSize="$2" fontWeight="600" color="$foreground">
            {order.id}
          </Text>
          <Text fontSize="$1" color="$foregroundMuted" numberOfLines={1}>
            {order.userEmail ?? "Simulator Desk"}
          </Text>
        </YStack>
      ),
    },
    {
      header: "Symbol",
      width: 145,
      render: (order) => (
        <XStack alignItems="center" gap="$1.5">
          <Text fontFamily="$mono" fontSize="$2" fontWeight="700" color="$foreground">
            {order.symbol}
          </Text>
          {order.market ? <Badge tone="neutral">{order.market}</Badge> : null}
        </XStack>
      ),
    },
    {
      header: "Side / Type",
      width: 130,
      render: (order) => (
        <XStack alignItems="center" gap="$1.5">
          <Badge tone={order.side.toUpperCase() === "BUY" ? "bull" : "bear"}>{order.side}</Badge>
          <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
            {order.orderType}
          </Text>
        </XStack>
      ),
    },
    {
      header: "Quantity",
      width: 90,
      numeric: true,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {formatCount(order.quantity)}
        </Text>
      ),
    },
    {
      header: "Fill / Limit",
      width: 135,
      numeric: true,
      render: (order) => (
        <YStack alignItems="flex-end">
          <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
            {order.filledPriceCents
              ? formatMAD(order.filledPriceCents)
              : order.limitPriceCents
                ? `LMT ${formatMAD(order.limitPriceCents)}`
                : "—"}
          </Text>
          {order.feeCents && Number(order.feeCents) > 0 ? (
            <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
              Fee {formatMAD(order.feeCents)}
            </Text>
          ) : null}
        </YStack>
      ),
    },
    {
      header: "Status",
      width: 115,
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: "Placed",
      width: 155,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary">
          {formatDateTime(order.createdAt)}
        </Text>
      ),
    },
    {
      header: "Risk Controls",
      width: 175,
      render: (order) =>
        order.status.toUpperCase() === "PENDING" ? (
          <XStack gap="$1.5">
            <Button
              size="sm"
              variant="primary"
              onPress={() =>
                void handleUpdateOrderStatus(order, "FILLED", "Force-filled by AMS Risk Desk")
              }
            >
              <Text fontSize="$1" color="$canvas">
                Fill
              </Text>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onPress={() =>
                void handleUpdateOrderStatus(order, "CANCELLED", "Cancelled by AMS Risk Desk")
              }
            >
              <Text fontSize="$1" color="$bear">
                Cancel
              </Text>
            </Button>
          </XStack>
        ) : (
          <Text fontSize="$1" color="$foregroundMuted" numberOfLines={1}>
            {order.reason ?? "Settled"}
          </Text>
        ),
    },
  ];

  return (
    <AppShell title="Orders & Risk Desk">
      <PageHeader
        title="Order Book Ledger & Risk Desk"
        lead="Inspect every simulated order across all 8 markets, execute administrative desk orders, force-fill or cancel working limit orders, and export the audit ledger."
        action={
          <XStack gap="$2">
            {resource.status === "ready" ? (
              <Button
                variant="outline"
                size="md"
                onPress={() => handleExportCsv(resource.data)}
              >
                <XStack alignItems="center" gap="$2">
                  <Download size={15} color="#b3c0cb" />
                  <Text>Export CSV</Text>
                </XStack>
              </Button>
            ) : null}
            <Button
              variant="primary"
              size="md"
              onPress={() => setShowOrderTicket((prev) => !prev)}
            >
              <XStack alignItems="center" gap="$2">
                <Plus size={16} />
                <Text color="$canvas" fontWeight="600">
                  {showOrderTicket ? "Close ticket" : "Desk order ticket"}
                </Text>
              </XStack>
            </Button>
          </XStack>
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

      {showOrderTicket ? (
        <Card padding="$4" marginBottom="$4" borderColor="$bull">
          <Text fontSize="$4" fontWeight="600" color="$foreground" marginBottom="$3">
            AMS Administrative Desk Order Ticket (All 110 Instruments Supported)
          </Text>
          <XStack flexWrap="wrap" gap="$3" alignItems="flex-end">
            <YStack gap="$1" width={170}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                TICKER SYMBOL
              </Text>
              <input
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                placeholder="ATW, IAM, NVDA, GC=F, BTC-USD..."
                style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
              />
            </YStack>
            <YStack gap="$1" width={120}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                SIDE
              </Text>
              <select
                value={side}
                onChange={(e) => setSide(e.target.value as "BUY" | "SELL")}
                style={INPUT_STYLE}
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </YStack>
            <YStack gap="$1" width={130}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                ORDER TYPE
              </Text>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as "MARKET" | "LIMIT")}
                style={INPUT_STYLE}
              >
                <option value="MARKET">MARKET</option>
                <option value="LIMIT">LIMIT</option>
              </select>
            </YStack>
            <YStack gap="$1" width={120}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                QUANTITY
              </Text>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={INPUT_STYLE}
              />
            </YStack>
            {orderType === "LIMIT" ? (
              <YStack gap="$1" width={140}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  LIMIT PRICE (MAD)
                </Text>
                <input
                  type="number"
                  value={limitPriceMad}
                  onChange={(e) => setLimitPriceMad(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
            ) : null}
            <Button variant="primary" size="md" onPress={() => void handleSubmitDeskOrder()}>
              <Text color="$canvas" fontWeight="600">
                Route Desk Order
              </Text>
            </Button>
          </XStack>
        </Card>
      ) : null}

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={5} />}>
        {(orders) => {
          const filledOrders = orders.filter((o) => o.status.toUpperCase() === "FILLED");
          const pendingOrders = orders.filter((o) => o.status.toUpperCase() === "PENDING");
          const rejectedOrders = orders.filter(
            (o) => o.status.toUpperCase() === "REJECTED" || o.status.toUpperCase() === "CANCELLED",
          );

          const needle = query.trim().toLowerCase();
          const filtered = orders.filter((o) => {
            if (sideFilter !== "ALL" && o.side.toUpperCase() !== sideFilter) return false;
            if (statusFilter !== "ALL" && o.status.toUpperCase() !== statusFilter) return false;
            if (!needle) return true;
            return (
              o.symbol.toLowerCase().includes(needle) ||
              o.id.toLowerCase().includes(needle) ||
              (o.userEmail ?? "").toLowerCase().includes(needle) ||
              o.status.toLowerCase().includes(needle)
            );
          });

          return (
            <>
              <StatGrid>
                <StatCard label="Total Orders" value={formatCount(orders.length)} />
                <StatCard label="Filled Executions" value={formatCount(filledOrders.length)} />
                <StatCard label="Working Limits" value={formatCount(pendingOrders.length)} />
                <StatCard
                  label="Cancelled / Rejected"
                  value={formatCount(rejectedOrders.length)}
                />
              </StatGrid>

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
                      placeholder="Filter by ticker, trader email, or order ID..."
                      aria-label="Filter orders"
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

                  <XStack gap="$1.5" flexWrap="wrap">
                    {(["ALL", "BUY", "SELL"] as const).map((s) => (
                      <Button
                        key={s}
                        size="sm"
                        variant={sideFilter === s ? "secondary" : "ghost"}
                        onPress={() => setSideFilter(s)}
                      >
                        <Text
                          fontFamily="$mono"
                          fontSize="$0"
                          color={
                            sideFilter === s
                              ? s === "SELL"
                                ? "$bear"
                                : "$bull"
                              : "$foregroundSecondary"
                          }
                        >
                          {s}
                        </Text>
                      </Button>
                    ))}
                    {(["ALL", "FILLED", "PENDING", "REJECTED", "CANCELLED"] as const).map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={statusFilter === st ? "secondary" : "ghost"}
                        onPress={() => setStatusFilter(st)}
                      >
                        <Text
                          fontFamily="$mono"
                          fontSize="$0"
                          color={statusFilter === st ? "$bull" : "$foregroundSecondary"}
                        >
                          {st}
                        </Text>
                      </Button>
                    ))}
                  </XStack>
                </XStack>

                {filtered.length > 0 ? (
                  <DataTable columns={columns} rows={filtered} rowKey={(order) => order.id} />
                ) : (
                  <EmptyState
                    title={
                      needle || sideFilter !== "ALL" || statusFilter !== "ALL"
                        ? "No orders match filter"
                        : "No orders yet"
                    }
                    description="Try clearing the ticker search or status filter."
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
