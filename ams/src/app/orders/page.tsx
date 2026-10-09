"use client";

import { Text } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge, toneForStatus } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView } from "@/components/page";
import { api, formatCount, formatDateTime, formatMAD, type AdminOrder } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

/**
 * The order ledger.
 *
 * This was previously a single row of nine inline `<Text>` children with no
 * header, so nothing told the reader that "100" was a quantity or "125.50" a
 * price. It is now a real grid: a header that names every column, fixed widths
 * so the columns align, and monospaced figures that line up on the decimal.
 */
export default function OrdersPage() {
  const { resource, retry } = useResource((signal) => api.orders(), []);

  const columns: Column<AdminOrder>[] = [
    {
      header: "Order",
      width: 140,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
          {order.id}
        </Text>
      ),
    },
    {
      header: "Symbol",
      width: 100,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" fontWeight="600" color="$foreground">
          {order.symbol}
        </Text>
      ),
    },
    {
      header: "Side",
      width: 80,
      render: (order) => (
        <Badge tone={order.side.toUpperCase() === "BUY" ? "bull" : "bear"}>{order.side}</Badge>
      ),
    },
    {
      header: "Type",
      width: 110,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary" textTransform="uppercase">
          {order.orderType}
        </Text>
      ),
    },
    {
      header: "Quantity",
      width: 110,
      numeric: true,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {formatCount(order.quantity)}
        </Text>
      ),
    },
    {
      header: "Fill price",
      width: 130,
      numeric: true,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {order.filledPriceCents ? formatMAD(order.filledPriceCents) : "—"}
        </Text>
      ),
    },
    {
      header: "Status",
      width: 130,
      render: (order) => <StatusBadge status={order.status} />,
    },
    {
      header: "Placed",
      width: 170,
      render: (order) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
          {formatDateTime(order.createdAt)}
        </Text>
      ),
    },
  ];

  return (
    <AppShell title="Orders">
      <PageHeader
        title="Orders"
        lead="Every simulated order and the price it executed at. This ledger is append-only."
      />

      <Card padding="$4">
        <ResourceView resource={resource} onRetry={retry} loading={null}>
          {(orders) =>
            orders.length > 0 ? (
              <DataTable
                columns={columns}
                rows={orders}
                rowKey={(order) => order.id}
              />
            ) : (
              <EmptyState
                title="No orders yet"
                description="Orders appear here as soon as members start trading in the simulator."
              />
            )
          }
        </ResourceView>
      </Card>
    </AppShell>
  );
}