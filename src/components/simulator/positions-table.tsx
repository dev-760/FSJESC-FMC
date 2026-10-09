/**
 * Positions table component.
 *
 * Displays positions with DataTable for mobile card fallback,
 * clickable symbol links, action buttons, and institutional empty state.
 */

"use client";

import Link from "next/link";
import { Briefcase, ArrowUpRight } from "lucide-react";
import { DataTable, type Column } from "@/components/primitives/data-table";
import { Num } from "@/components/primitives/num";
import { ChangeIndicator } from "@/components/financial/change-indicator";
import { Button } from "@/components/ui/button";
import type { MarkedPosition } from "@/lib/trading/engine";

interface PositionsTableProps {
  positions: readonly MarkedPosition[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const columns: Column<MarkedPosition>[] = [
    {
      header: "Symbol",
      render: (row: unknown) => {
        const pos = row as MarkedPosition;
        return (
          <Link
            href={`/simulator/market/${pos.symbol.toLowerCase()}`}
            className="font-mono font-semibold text-bull hover:text-bull-hover hover:underline transition-colors flex items-center gap-1 group"
          >
            <span>{pos.symbol}</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        );
      },
    },
    {
      header: "Quantity",
      render: (row: unknown) => (
        <span className="font-mono text-foreground font-medium">
          {(row as MarkedPosition).quantity.toLocaleString()} shs
        </span>
      ),
    },
    {
      header: "Avg Cost",
      render: (row: unknown) => <Num cents={BigInt((row as MarkedPosition).averageCostCents)} />,
      numeric: true,
    },
    {
      header: "Market Value",
      render: (row: unknown) => <Num cents={(row as MarkedPosition).marketValueCents} />,
      numeric: true,
    },
    {
      header: "Unrealised P&L",
      render: (row: unknown) => {
        const position = row as MarkedPosition;
        const isPos = position.unrealisedPnlCents >= 0n;
        return (
          <Num
            cents={position.unrealisedPnlCents}
            tone={isPos ? "positive" : "negative"}
            signed
          />
        );
      },
      numeric: true,
    },
    {
      header: "Return",
      render: (row: unknown) => <ChangeIndicator bps={(row as MarkedPosition).returnBps} />,
      numeric: true,
    },
    {
      header: "Action",
      render: (row: unknown) => {
        const pos = row as MarkedPosition;
        return (
          <Button asChild size="sm" variant="secondary" className="h-7 px-2.5 text-2xs">
            <Link href={`/simulator/market/${pos.symbol.toLowerCase()}`}>
              Trade
            </Link>
          </Button>
        );
      },
    },
  ];

  if (positions.length === 0) {
    return (
      <div className="bg-surface-sunken rounded-lg border border-rule p-8 sm:p-12 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-surface-raised border border-rule flex items-center justify-center text-foreground-muted mb-4">
          <Briefcase className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-foreground">No Open Equity Positions</h3>
        <p className="text-foreground-secondary text-sm max-w-md mx-auto mt-1.5 leading-relaxed">
          Your simulator portfolio currently holds only cash capital. Browse the Casablanca instruments to execute your first order.
        </p>
        <div className="mt-5">
          <Button asChild size="sm" variant="bull">
            <Link href="/simulator/market">Browse Market Quotes</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DataTable
      caption="Current marked-to-market positions"
      columns={columns}
      rows={positions}
      rowKey={(position) => position.symbol}
    />
  );
}
