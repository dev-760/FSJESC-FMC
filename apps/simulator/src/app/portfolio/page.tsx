/**
 * Portfolio page.
 *
 * Shows portfolio summary and positions with live mark-to-market.
 */

"use client";

import { useEffect, useState } from "react";
import { Suspense } from "react";
import { PortfolioSummary } from "@fsjesc/ui/simulator/portfolio-summary";
import { PositionsTable } from "@fsjesc/ui/simulator/positions-table";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import type { MarkedPosition } from "@fsjesc/domain/trading/engine";

interface PortfolioData {
  cashCents: bigint;
  realisedPnlCents: bigint;
  totalEquityCents: bigint;
  unrealisedPnlCents: bigint;
  positions: MarkedPosition[];
}

export default function PortfolioPage() {
  const [data, setData] = useState<PortfolioData>({
    cashCents: 10_000_000n,
    realisedPnlCents: 0n,
    totalEquityCents: 10_000_000n,
    unrealisedPnlCents: 0n,
    positions: [],
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load(isInitial: boolean) {
      try {
        const res = await fetch("/api/simulator/portfolio");
        if (!res.ok) throw new Error("Failed to load portfolio");
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
        });

        if (isInitial) setIsLoading(false);
      } catch (err) {
        console.error("Failed to load portfolio:", err);
        if (mounted && isInitial) setIsLoading(false);
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

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Portfolio Holdings
            </h1>
            <p className="text-foreground-secondary text-sm mt-1">
              Marked-to-market positions, cash reserves, and unrealized gain metrics
            </p>
          </div>
          <Suspense
              fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}
            >
  <MarketStatus />
            </Suspense>
        </div>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="bg-surface-sunken h-64 rounded" />
          </div>
        ) : (
          <div className="space-y-8">
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
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Positions</h2>
              <Suspense
              fallback={<div className="border-rule h-48 animate-pulse rounded-lg border" />}
            >
  <PositionsTable positions={data.positions} />
            </Suspense>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
