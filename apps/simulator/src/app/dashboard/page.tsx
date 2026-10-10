/**
 * Simulator dashboard page.
 *
 * Shows portfolio summary, positions, and recent orders.
 * Uses polling for live updates.
 */

"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { PortfolioSummary } from "@fsjesc/ui/simulator/portfolio-summary";
import { PositionsTable } from "@fsjesc/ui/simulator/positions-table";
import { OrdersTable } from "@fsjesc/ui/simulator/orders-table";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { Alert } from "@fsjesc/ui/alert";
import type { MarkedPosition, Order } from "@fsjesc/domain/trading/engine";

interface DashboardData {
  cashCents: bigint;
  realisedPnlCents: bigint;
  totalEquityCents: bigint;
  unrealisedPnlCents: bigint;
  positions: MarkedPosition[];
  orders: Order[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    cashCents: 10_000_000n,
    realisedPnlCents: 0n,
    totalEquityCents: 10_000_000n,
    unrealisedPnlCents: 0n,
    positions: [],
    orders: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load(isInitial: boolean) {
      try {
        const res = await fetch("/api/simulator/portfolio");
        if (!res.ok) throw new Error("Failed to fetch portfolio");
        const json = (await res.json()) as {
          cashCents?: string;
          realisedPnlCents?: string;
          totalEquityCents?: string;
          unrealisedPnlCents?: string;
          positions?: Array<{
            symbol: string;
            quantity: number;
            averageCostCents: number;
            marketValueCents: string;
            unrealisedPnlCents: string;
            returnBps: string;
            locked: boolean;
          }>;
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

        if (!mounted) return;

        setData({
          cashCents: BigInt(json.cashCents || "10000000"),
          realisedPnlCents: BigInt(json.realisedPnlCents || "0"),
          totalEquityCents: BigInt(json.totalEquityCents || "10000000"),
          unrealisedPnlCents: BigInt(json.unrealisedPnlCents || "0"),
          positions: (json.positions || []).map((p) => ({
            symbol: p.symbol,
            quantity: p.quantity,
            averageCostCents: p.averageCostCents,
            marketValueCents: BigInt(p.marketValueCents),
            unrealisedPnlCents: BigInt(p.unrealisedPnlCents),
            returnBps: BigInt(p.returnBps),
            locked: p.locked,
            openedAt: Date.now() / 1000,
          })),
          orders: (json.orders || []).map((o) => ({
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
          })),
        });

        if (isInitial) setIsLoading(false);
      } catch {
        if (mounted && isInitial) {
          setError("Failed to load portfolio data");
          setIsLoading(false);
        }
      }
    }

    void load(true);
    const interval = setInterval(() => {
      if (mounted) void load(false);
    }, 4000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <div className="space-y-6 sm:space-y-8 animate-pulse">
            <div className="bg-surface-sunken h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-48 sm:h-64 rounded" />
            <div className="bg-surface-sunken h-48 sm:h-64 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
          <Alert tone="negative" assertive>
            <p className="font-medium">Failed to load portfolio data</p>
            <p className="mt-1">{error}</p>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Trading Dashboard
            </h1>
            <p className="text-foreground-secondary text-sm mt-1">
              Live portfolio valuation, open positions, and active executions
            </p>
          </div>
          <Suspense
              fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}
            >
  <MarketStatus />
            </Suspense>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <Suspense
              fallback={<div className="border-rule h-64 animate-pulse rounded-lg border" />}
            >
  <PortfolioSummary
              totalEquityCents={data.totalEquityCents}
              cashCents={data.cashCents}
              realisedPnlCents={data.realisedPnlCents}
              unrealisedPnlCents={data.unrealisedPnlCents}
            />
            </Suspense>

          <div>
            <h2 className="mb-4 text-base sm:text-lg font-semibold tracking-tight">Positions</h2>
            <Suspense
              fallback={<div className="border-rule h-48 animate-pulse rounded-lg border" />}
            >
  <PositionsTable positions={data.positions} />
            </Suspense>
          </div>

          <div>
            <h2 className="mb-4 text-base sm:text-lg font-semibold tracking-tight">Recent Orders</h2>
            <Suspense
              fallback={<div className="border-rule h-48 animate-pulse rounded-lg border" />}
            >
  <OrdersTable orders={data.orders} />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  );
}
