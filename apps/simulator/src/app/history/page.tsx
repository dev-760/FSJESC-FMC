/**
 * History page.
 *
 * Shows orders, executions, and transactions with tabs,
 * SimulatorNav, and market clock.
 */

"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { OrdersTable } from "@fsjesc/ui/simulator/orders-table";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { Num } from "@fsjesc/ui/primitives/num";
import { formatDate } from "@fsjesc/config/format";
import { cn } from "@fsjesc/config/cn";
import type { Order } from "@fsjesc/domain/trading/engine";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "executions" | "transactions">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const res = await fetch("/api/simulator/portfolio");
        if (res.ok) {
          const json = (await res.json()) as {
            orders?: Array<{
              id: string;
              symbol: string;
              side: "BUY" | "SELL";
              type: "MARKET" | "LIMIT";
              requested: number;
              filled: number;
              averageFillCents: string | null;
              status: "FILLED" | "PARTIAL" | "REJECTED" | "CANCELLED";
              placedAt: string;
              feeCents: string;
            }>;
          };
          if (mounted && json.orders) {
            setOrders(
              json.orders.map((o) => ({
                id: o.id,
                symbol: o.symbol,
                side: o.side,
                type: o.type,
                requested: o.requested,
                filled: o.filled,
                averageFillCents: o.averageFillCents ? Number(o.averageFillCents) : 0,
                status: o.status,
                feeCents: BigInt(o.feeCents || "0"),
                placedAt: Math.floor(new Date(o.placedAt).getTime() / 1000),
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    void loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  const filledOrders = orders.filter((o) => o.filled > 0);

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Trading Audit & History
            </h1>
            <p className="text-foreground-secondary text-sm mt-1">
              Deterministic ledger of submitted orders, market fills, and cash transactions
            </p>
          </div>
          <Suspense
              fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}
            >
  <MarketStatus />
            </Suspense>
        </div>

        <div className="space-y-6">
          {/* Segmented Tabs */}
          <div className="flex items-center gap-1.5 border-b border-rule pb-3" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "orders"}
              onClick={() => setActiveTab("orders")}
              className={cn(
                "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all cursor-pointer",
                activeTab === "orders"
                  ? "bg-surface-inset text-bull font-semibold border border-rule-strong shadow-xs"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-sunken",
              )}
            >
              Order Submissions ({orders.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "executions"}
              onClick={() => setActiveTab("executions")}
              className={cn(
                "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all cursor-pointer",
                activeTab === "executions"
                  ? "bg-surface-inset text-bull font-semibold border border-rule-strong shadow-xs"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-sunken",
              )}
            >
              Executed Trades ({filledOrders.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "transactions"}
              onClick={() => setActiveTab("transactions")}
              className={cn(
                "px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all cursor-pointer",
                activeTab === "transactions"
                  ? "bg-surface-inset text-bull font-semibold border border-rule-strong shadow-xs"
                  : "text-foreground-secondary hover:text-foreground hover:bg-surface-sunken",
              )}
            >
              Cash Ledger ({filledOrders.length + 1})
            </button>
          </div>

          {/* Tab: Orders */}
          {activeTab === "orders" && (
            isLoading ? (
              <div className="bg-surface-sunken rounded-lg p-8 text-center animate-pulse border border-rule">
                <p className="text-foreground-muted text-sm">Loading order records from ledger...</p>
              </div>
            ) : (
              <Suspense
              fallback={<div className="border-rule h-48 animate-pulse rounded-lg border" />}
            >
  <OrdersTable orders={orders} />
            </Suspense>
            )
          )}

          {/* Tab: Executions */}
          {activeTab === "executions" && (
            filledOrders.length > 0 ? (
              <OrdersTable orders={filledOrders} />
            ) : (
              <div className="bg-surface-sunken rounded-lg p-10 text-center border border-rule">
                <p className="text-foreground-secondary text-sm">No executed fills yet. Orders will appear here once matched by the simulator.</p>
              </div>
            )
          )}

          {/* Tab: Transactions Ledger */}
          {activeTab === "transactions" && (
            <div className="rounded-lg border border-rule bg-surface-raised overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-sunken border-b border-rule">
                  <tr>
                    <th className="px-4 py-2.5 font-mono label text-2xs">Type</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs">Description</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs text-right">Amount (MAD)</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  <tr className="hover:bg-surface-inset/50 transition-colors">
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded text-2xs font-semibold bg-bull-subtle text-bull border border-bull/30">
                        CREDIT
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-foreground font-medium">Initial Simulator Endowment</td>
                    <td className="px-4 py-2.5 numeric text-right text-bull font-bold">
                      +100,000.00 MAD
                    </td>
                    <td className="px-4 py-2.5 numeric text-right text-foreground-muted">
                      Account Creation
                    </td>
                  </tr>
                  {filledOrders.map((o) => {
                    const gross = BigInt(o.filled * o.averageFillCents);
                    const net = o.side === "BUY" ? -(gross + o.feeCents) : gross - o.feeCents;
                    const isCredit = net >= 0n;

                    return (
                      <tr key={o.id} className="hover:bg-surface-inset/50 transition-colors">
                        <td className="px-4 py-2.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-2xs font-semibold border",
                              isCredit
                                ? "bg-bull-subtle text-bull border-bull/30"
                                : "bg-bear-subtle text-bear border-bear/30",
                            )}
                          >
                            {isCredit ? "CREDIT" : "DEBIT"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-foreground">
                          {o.side} {o.filled} {o.symbol} (Fee: {(Number(o.feeCents) / 100).toFixed(2)} MAD)
                        </td>
                        <td className="px-4 py-2.5 numeric text-right font-medium">
                          <Num cents={net} tone={isCredit ? "positive" : "negative"} signed />
                        </td>
                        <td className="px-4 py-2.5 numeric text-right text-foreground-muted">
                          {formatDate(new Date(o.placedAt * 1000))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
