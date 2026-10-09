/**
 * Orders table component.
 *
 * Displays order history with DataTable for mobile card fallback,
 * clickable ticker links, semantic status badges, and empty states.
 */

"use client";

import Link from "next/link";
import { History, ArrowUpRight } from "lucide-react";
import { DataTable, type Column } from "@/components/primitives/data-table";
import { Num } from "@/components/primitives/num";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import type { Order } from "@/lib/trading/engine";

interface OrdersTableProps {
  orders: readonly Order[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const getBadgeTone = (status: Order["status"]): "positive" | "negative" | "warning" | "neutral" => {
    switch (status) {
      case "FILLED":
        return "positive";
      case "PARTIAL":
        return "warning";
      case "REJECTED":
      case "CANCELLED":
        return "negative";
      default:
        return "neutral";
    }
  };

  const columns: Column<Order>[] = [
    {
      header: "Symbol",
      render: (row: unknown) => {
        const order = row as Order;
        return (
          <Link
            href={`/simulator/market/${order.symbol.toLowerCase()}`}
            className="font-mono font-semibold text-bull hover:text-bull-hover hover:underline transition-colors flex items-center gap-1 group"
          >
            <span>{order.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      },
    },
    {
      header: "Side",
      render: (row: unknown) => {
        const order = row as Order;
        return (
          <span className={order.side === "BUY" ? "text-bull font-semibold" : "text-bear font-semibold"}>
            {order.side}
          </span>
        );
      },
    },
    {
      header: "Type",
      render: (row: unknown) => <span className="label text-2xs text-foreground-secondary">{(row as Order).type}</span>,
    },
    {
      header: "Filled / Req",
      render: (row: unknown) => {
        const order = row as Order;
        return (
          <span className="font-mono text-foreground font-medium">
            {order.filled} / {order.requested}
          </span>
        );
      },
      numeric: true,
    },
    {
      header: "Avg Price",
      render: (row: unknown) => <Num cents={BigInt((row as Order).averageFillCents)} />,
      numeric: true,
    },
    {
      header: "Fee",
      render: (row: unknown) => <Num cents={(row as Order).feeCents} />,
      numeric: true,
    },
    {
      header: "Status",
      render: (row: unknown) => {
        const order = row as Order;
        return (
          <Badge tone={getBadgeTone(order.status)}>{order.status}</Badge>
        );
      },
    },
    {
      header: "Execution Date",
      render: (row: unknown) => (
        <span className="text-xs text-foreground-secondary numeric">
          {formatDate(new Date((row as Order).placedAt * 1000))}
        </span>
      ),
    },
  ];

  if (orders.length === 0) {
    return (
      <div className="bg-surface-sunken rounded-lg border border-rule p-8 sm:p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-surface-raised border border-rule flex items-center justify-center text-foreground-muted mb-4">
          <History className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Orders Placed Yet</h3>
        <p className="text-foreground-secondary text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
          Your order book is currently clean. Select any Moroccan instrument to submit your first market or limit execution.
        </p>
      </div>
    );
  }

  return (
    <DataTable
      caption="Recent orders and fill logs"
      columns={columns}
      rows={orders}
      rowKey={(order) => order.id}
    />
  );
}
