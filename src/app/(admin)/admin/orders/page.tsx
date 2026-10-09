/**
 * Admin orders view page (read-only).
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Num } from "@/components/primitives/num";
import { formatDate } from "@/lib/format";

interface Order {
  id: string;
  userId: string;
  ticker: string;
  side: string;
  type: string;
  quantity: string;
  priceCents?: string;
  status: string;
  createdAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/admin/orders");
        if (response.ok) {
          const data = (await response.json()) as Order[];
          setOrders(data);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchOrders();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "FILLED":
        return "bg-positive/10 text-positive border-positive/20";
      case "PENDING":
        return "bg-warning/10 text-warning border-warning/20";
      case "CANCELLED":
        return "bg-negative/10 text-negative border-negative/20";
      case "REJECTED":
        return "bg-negative/10 text-negative border-negative/20";
      default:
        return "bg-neutral/10 text-neutral border-neutral/20";
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-surface-sunken mb-4 h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-64 rounded" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/admin"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Admin
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              Orders
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-foreground-secondary">Read-only view of all trading orders</p>
        </div>

        <div className="bg-surface-sunken overflow-hidden rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Order ID</th>
                <th className="label px-4 py-3 text-left">User</th>
                <th className="label px-4 py-3 text-left">Ticker</th>
                <th className="label px-4 py-3 text-left">Side</th>
                <th className="label px-4 py-3 text-left">Type</th>
                <th className="label px-4 py-3 text-right">Quantity</th>
                <th className="label px-4 py-3 text-right">Price</th>
                <th className="label px-4 py-3 text-left">Status</th>
                <th className="label px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-rule border-b last:border-b-0">
                  <td className="px-4 py-3 font-mono text-sm">{order.id.slice(0, 8)}...</td>
                  <td className="px-4 py-3 font-mono text-sm">{order.userId.slice(0, 8)}...</td>
                  <td className="px-4 py-3">{order.ticker}</td>
                  <td className="px-4 py-3">
                    <Badge tone={order.side === "BUY" ? "positive" : "neutral"}>{order.side}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.type}</td>
                  <td className="px-4 py-3 text-right font-mono">{order.quantity}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {order.priceCents ? (
                      <Num cents={BigInt(order.priceCents)} unit=" MAD" />
                    ) : (
                      "Market"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(new Date(order.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
