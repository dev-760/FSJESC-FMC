/**
 * Portfolio summary component.
 *
 * Displays marked-to-market equity, liquid cash, P&L breakdown,
 * return rate, and asset allocation bar.
 */

import { Wallet, DollarSign, TrendingUp, Percent } from "lucide-react";
import { Num } from "../primitives/num";
import { cn } from "@fsjesc/config/cn";

interface PortfolioSummaryProps {
  totalEquityCents: bigint;
  cashCents: bigint;
  realisedPnlCents: bigint;
  unrealisedPnlCents: bigint;
  className?: string;
}

export function PortfolioSummary({
  totalEquityCents,
  cashCents,
  realisedPnlCents,
  unrealisedPnlCents,
  className,
}: PortfolioSummaryProps) {
  const totalPnlCents = realisedPnlCents + unrealisedPnlCents;
  const initialCapitalCents =
    totalEquityCents > totalPnlCents ? totalEquityCents - totalPnlCents : 10_000_000n;
  const returnBps =
    initialCapitalCents > 0n ? (totalPnlCents * 10_000n) / initialCapitalCents : 0n;
  const isPositive = totalPnlCents >= 0n;

  const investedCents = totalEquityCents > cashCents ? totalEquityCents - cashCents : 0n;
  const investedPct = totalEquityCents > 0n ? Math.min(100, Math.max(0, Number((investedCents * 100n) / totalEquityCents))) : 0;
  const cashPct = 100 - investedPct;

  return (
    <div className={cn("bg-surface-raised rounded-lg border border-rule p-4 sm:p-6 space-y-6 shadow-xs", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
            Portfolio Performance
          </h3>
          <p className="label text-2xs text-foreground-muted mt-0.5">
            Marked-to-Market Valuation · MAD Base Currency
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-surface-sunken border border-rule text-2xs font-mono text-foreground-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-bull" />
            Live MTM
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Value */}
        <div className="bg-surface-sunken p-3.5 sm:p-4 rounded-md border border-rule">
          <div className="flex items-center justify-between text-foreground-muted mb-1.5">
            <span className="label text-2xs">Total Equity</span>
            <Wallet className="h-4 w-4" />
          </div>
          <p className="numeric text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            <Num cents={totalEquityCents} />
          </p>
          <p className="text-2xs text-foreground-muted mt-1">MAD Portfolio Worth</p>
        </div>

        {/* Liquid Cash */}
        <div className="bg-surface-sunken p-3.5 sm:p-4 rounded-md border border-rule">
          <div className="flex items-center justify-between text-foreground-muted mb-1.5">
            <span className="label text-2xs">Liquid Cash</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <p className="numeric text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            <Num cents={cashCents} />
          </p>
          <p className="text-2xs text-foreground-muted mt-1">Buying Power Available</p>
        </div>

        {/* Total P&L */}
        <div className="bg-surface-sunken p-3.5 sm:p-4 rounded-md border border-rule">
          <div className="flex items-center justify-between text-foreground-muted mb-1.5">
            <span className="label text-2xs">Net P&L</span>
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="numeric text-xl sm:text-2xl font-bold tracking-tight">
            <Num
              cents={totalPnlCents}
              tone={isPositive ? "positive" : "negative"}
              signed
            />
          </p>
          <div className="flex items-center justify-between text-2xs text-foreground-muted mt-1">
            <span>Unreal: <Num cents={unrealisedPnlCents} size="2xs" tone={unrealisedPnlCents >= 0n ? "positive" : "negative"} signed /></span>
          </div>
        </div>

        {/* Return Rate */}
        <div className="bg-surface-sunken p-3.5 sm:p-4 rounded-md border border-rule">
          <div className="flex items-center justify-between text-foreground-muted mb-1.5">
            <span className="label text-2xs">Total Return</span>
            <Percent className="h-4 w-4" />
          </div>
          <p className="numeric text-xl sm:text-2xl font-bold tracking-tight">
            <Num
              value={Number(returnBps) / 100}
              decimals={2}
              unit="%"
              signed
              tone={isPositive ? "positive" : "negative"}
            />
          </p>
          <p className="text-2xs text-foreground-muted mt-1">Net Portfolio Gain/Loss</p>
        </div>
      </div>

      {/* Asset Allocation Ratio Bar */}
      <div className="space-y-2 bg-surface-sunken p-3.5 rounded-md border border-rule">
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground-secondary font-medium">Capital Allocation</span>
          <div className="flex items-center gap-4 text-2xs font-mono">
            <span className="flex items-center gap-1.5 text-bull">
              <span className="h-2 w-2 rounded-xs bg-bull" />
              Equities: {investedPct}%
            </span>
            <span className="flex items-center gap-1.5 text-info">
              <span className="h-2 w-2 rounded-xs bg-info" />
              Cash: {cashPct}%
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-surface-inset overflow-hidden flex" aria-hidden="true">
          <div
            className="bg-bull h-full transition-all duration-500 ease-out"
            style={{ width: `${investedPct}%` }}
          />
          <div
            className="bg-info h-full transition-all duration-500 ease-out"
            style={{ width: `${cashPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}
