/**
 * History page.
 *
 * Shows orders, executions, and transactions with tabs,
 * SimulatorNav, and market clock.
 */

"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { Download } from "lucide-react";
import { OrdersTable } from "@fsjesc/ui/simulator/orders-table";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { Num } from "@fsjesc/ui/primitives/num";
import { Button } from "@fsjesc/ui/button";
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
    const handlePortfolioUpdate = () => {
      if (mounted) void loadOrders();
    };
    window.addEventListener("fsjesc:portfolio-updated", handlePortfolioUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("fsjesc:portfolio-updated", handlePortfolioUpdate);
    };
  }, []);

  const filledOrders = useMemo(() => orders.filter((o) => o.filled > 0), [orders]);

  // Compute chronological ledger entries with running cash balance
  const ledgerEntries = useMemo(() => {
    const sortedAsc = [...filledOrders].sort((a, b) => a.placedAt - b.placedAt);
    let runningBalanceCents = 10_000_000n; // 100,000.00 MAD initial endowment
    const rows: Array<{
      id: string;
      isCredit: boolean;
      description: string;
      amountCents: bigint;
      balanceCents: bigint;
      timestampLabel: string;
    }> = [
      {
        id: "initial-endowment",
        isCredit: true,
        description: "Initial Simulator Endowment (Starting Capital)",
        amountCents: 10_000_000n,
        balanceCents: runningBalanceCents,
        timestampLabel: "Account Creation",
      },
    ];

    for (const o of sortedAsc) {
      const gross = BigInt(o.filled * o.averageFillCents);
      const net = o.side === "BUY" ? -(gross + o.feeCents) : gross - o.feeCents;
      runningBalanceCents += net;
      rows.push({
        id: o.id,
        isCredit: net >= 0n,
        description: `${o.side} ${o.filled} ${o.symbol} @ ${(o.averageFillCents / 100).toFixed(2)} MAD (Fee: ${(Number(o.feeCents) / 100).toFixed(2)} MAD)`,
        amountCents: net,
        balanceCents: runningBalanceCents,
        timestampLabel: formatDate(new Date(o.placedAt * 1000)),
      });
    }

    return rows.reverse();
  }, [filledOrders]);

  const handleExportCsv = () => {
    const headers = [
      "OrderID",
      "Symbol",
      "Side",
      "Type",
      "Requested",
      "Filled",
      "AvgFillPriceMAD",
      "FeeMAD",
      "Status",
      "Timestamp",
    ];
    const csvRows = [
      headers.join(","),
      ...orders.map((o) =>
        [
          o.id,
          o.symbol,
          o.side,
          o.type,
          o.requested,
          o.filled,
          (o.averageFillCents / 100).toFixed(2),
          (Number(o.feeCents) / 100).toFixed(2),
          o.status,
          new Date(o.placedAt * 1000).toISOString(),
        ].join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fsjesc-fmc-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
          <div className="flex flex-wrap items-center gap-3">
            <Suspense
              fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}
            >
              <MarketStatus />
            </Suspense>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              className="gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Segmented Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 border-b border-rule pb-3" role="tablist">
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
              Cash Ledger ({ledgerEntries.length})
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

          {/* Tab: Executions (Dedicated settlement breakdown) */}
          {activeTab === "executions" && (
            filledOrders.length > 0 ? (
              <div className="rounded-lg border border-rule bg-surface-raised overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-surface-sunken border-b border-rule">
                    <tr>
                      <th className="px-4 py-2.5 font-mono label text-2xs">Fill ID</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs">Instrument</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs">Side</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Shares</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Fill Price</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Gross Value</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Fee (5 bps)</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Net Settlement</th>
                      <th className="px-4 py-2.5 font-mono label text-2xs text-right">Executed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/50">
                    {filledOrders.map((o) => {
                      const grossCents = BigInt(o.filled * o.averageFillCents);
                      const netCents =
                        o.side === "BUY" ? -(grossCents + o.feeCents) : grossCents - o.feeCents;
                      return (
                        <tr key={o.id} className="hover:bg-surface-inset/50 transition-colors">
                          <td className="px-4 py-2.5 numeric text-foreground-muted">
                            EXE-{o.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="px-4 py-2.5 numeric font-semibold text-foreground">
                            {o.symbol}
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded text-2xs font-semibold border",
                                o.side === "BUY"
                                  ? "bg-bull-subtle text-bull border-bull/30"
                                  : "bg-bear-subtle text-bear border-bear/30"
                              )}
                            >
                              {o.side}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 numeric text-right">{o.filled}</td>
                          <td className="px-4 py-2.5 numeric text-right">
                            <Num cents={BigInt(o.averageFillCents)} />
                          </td>
                          <td className="px-4 py-2.5 numeric text-right">
                            <Num cents={grossCents} />
                          </td>
                          <td className="px-4 py-2.5 numeric text-right text-foreground-secondary">
                            <Num cents={o.feeCents} />
                          </td>
                          <td className="px-4 py-2.5 numeric text-right font-semibold">
                            <Num
                              cents={netCents}
                              tone={netCents >= 0n ? "positive" : "negative"}
                              signed
                            />
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
            ) : (
              <div className="bg-surface-sunken rounded-lg p-10 text-center border border-rule">
                <p className="text-foreground-secondary text-sm">
                  No executed fills yet. Orders will appear here once matched by the simulator.
                </p>
              </div>
            )
          )}

          {/* Tab: Transactions Ledger */}
          {activeTab === "transactions" && (
            <div className="rounded-lg border border-rule bg-surface-raised overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-surface-sunken border-b border-rule">
                  <tr>
                    <th className="px-4 py-2.5 font-mono label text-2xs">Type</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs">Description</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs text-right">Amount (MAD)</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs text-right">Running Balance</th>
                    <th className="px-4 py-2.5 font-mono label text-2xs text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule/50">
                  {ledgerEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-surface-inset/50 transition-colors">
                      <td className="px-4 py-2.5">
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-2xs font-semibold border",
                            entry.isCredit
                              ? "bg-bull-subtle text-bull border-bull/30"
                              : "bg-bear-subtle text-bear border-bear/30"
                          )}
                        >
                          {entry.isCredit ? "CREDIT" : "DEBIT"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-foreground font-medium">
                        {entry.description}
                      </td>
                      <td className="px-4 py-2.5 numeric text-right font-semibold">
                        <Num
                          cents={entry.amountCents}
                          tone={entry.isCredit ? "positive" : "negative"}
                          signed
                        />
                      </td>
                      <td className="px-4 py-2.5 numeric text-right font-medium text-foreground">
                        <Num cents={entry.balanceCents} />
                      </td>
                      <td className="px-4 py-2.5 numeric text-right text-foreground-muted">
                        {entry.timestampLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
