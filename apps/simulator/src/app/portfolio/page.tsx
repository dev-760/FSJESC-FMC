/**
 * Portfolio page.
 *
 * Shows portfolio summary and positions with live mark-to-market.
 */

"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { PortfolioSummary } from "@fsjesc/ui/simulator/portfolio-summary";
import { PositionsTable } from "@fsjesc/ui/simulator/positions-table";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { Num } from "@fsjesc/ui/primitives/num";
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
  const [isLoading, setIsLoading] = useState(true);

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

    const handlePortfolioUpdate = () => {
      if (mounted) void load(false);
    };
    window.addEventListener("fsjesc:portfolio-updated", handlePortfolioUpdate);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener("fsjesc:portfolio-updated", handlePortfolioUpdate);
    };
  }, []);

  const totalEquityNum = Number(data.totalEquityCents) || 1;
  const cashPct = Math.max(0, Math.min(100, (Number(data.cashCents) / totalEquityNum) * 100));
  const investedCents = data.totalEquityCents - data.cashCents;
  const investedPct = Math.max(0, Math.min(100, (Number(investedCents) / totalEquityNum) * 100));

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Portfolio Holdings & Allocation
            </h1>
            <p className="text-foreground-secondary text-sm mt-1">
              Marked-to-market positions, capital deployment weights, and unrealized gain metrics
            </p>
          </div>
          <Suspense
            fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}
          >
            <MarketStatus />
          </Suspense>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-surface-sunken h-48 rounded-lg" />
            <div className="bg-surface-sunken h-64 rounded-lg" />
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

            {/* Capital Allocation Breakdown */}
            <div className="rounded-lg border border-rule bg-surface-raised p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Capital Allocation</h2>
                  <p className="text-xs text-foreground-secondary">
                    Equity exposure vs. uninvested MAD cash reserve
                  </p>
                </div>
                <div className="numeric text-xs text-foreground-secondary flex items-center gap-4">
                  <span>
                    Invested: <strong className="text-foreground">{investedPct.toFixed(1)}%</strong> (<Num cents={investedCents} />)
                  </span>
                  <span>
                    Cash: <strong className="text-foreground">{cashPct.toFixed(1)}%</strong> (<Num cents={data.cashCents} />)
                  </span>
                </div>
              </div>

              <div className="h-3 w-full rounded-full bg-surface-sunken overflow-hidden flex border border-rule">
                <div
                  className="bg-bull h-full transition-all duration-300"
                  style={{ width: `${investedPct}%` }}
                  title={`Invested Equity: ${investedPct.toFixed(1)}%`}
                />
                <div
                  className="bg-surface-inset h-full transition-all duration-300"
                  style={{ width: `${cashPct}%` }}
                  title={`Cash Reserve: ${cashPct.toFixed(1)}%`}
                />
              </div>

              {data.positions.length > 0 && (
                <div className="mt-4 pt-4 border-t border-rule grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {data.positions.map((pos) => {
                    const weightPct = (Number(pos.marketValueCents) / totalEquityNum) * 100;
                    return (
                      <Link
                        key={pos.symbol}
                        href={`/market/${pos.symbol}`}
                        className="rounded border border-rule bg-surface p-3 hover:border-bull transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="numeric font-semibold text-sm text-foreground">{pos.symbol}</span>
                          <span className="numeric text-xs text-bull font-medium">{weightPct.toFixed(1)}%</span>
                        </div>
                        <p className="numeric text-xs text-foreground-secondary mt-1">
                          <Num cents={pos.marketValueCents} />
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold tracking-tight">Open Positions</h2>
                <Link
                  href="/market"
                  className="text-xs font-medium text-bull hover:underline numeric"
                >
                  + Trade Instruments →
                </Link>
              </div>
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
