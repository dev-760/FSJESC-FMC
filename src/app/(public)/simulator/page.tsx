import type { Metadata } from "next";
import Link from "next/link";
import { LayoutDashboard, TrendingUp, Briefcase, History, ArrowRight, ShieldCheck, Zap, Scale } from "lucide-react";
import { TerminalPreview } from "@/components/financial/terminal-preview";
import { MarketStatus } from "@/components/simulator/market-status";
import { SimulatorNav } from "@/components/simulator/simulator-nav";
import { Button } from "@/components/ui/button";
import { DISC_1 } from "@/config/site";

export const metadata: Metadata = {
  title: "Trading Simulator | FSJESC Financial Markets Club",
  description: "Paper-trading terminal operating a deterministic simulated Moroccan market in MAD. No real money is involved.",
};

export default function SimulatorPage() {
  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        {/* Terminal Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-rule pb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="label text-2xs text-bull font-semibold uppercase tracking-widest">
                Active Simulator Engine
              </span>
              <span className="text-foreground-muted">·</span>
              <span className="label text-2xs text-foreground-secondary">
                100,000 MAD Starting Capital
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Institutional Paper-Trading Terminal
            </h1>
            <p className="text-foreground-secondary text-base max-w-2xl mt-2 leading-relaxed">
              Place real-time market and limit orders against a deterministic simulated Casablanca equity universe.
              All cash movements are recorded in an immutable ledger with zero floating-point drift.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <MarketStatus />
            <Button asChild variant="bull" size="lg">
              <Link href="/simulator/dashboard" className="flex items-center gap-2">
                <span>Enter Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Workstation Gateway Tiles */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/simulator/dashboard"
            className="group rounded-lg border border-rule bg-surface-raised hover:bg-surface-inset p-5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="w-10 h-10 rounded-md bg-surface-sunken border border-rule flex items-center justify-center text-bull mb-3 group-hover:scale-105 transition-transform">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-bull transition-colors">
              Trading Dashboard
            </h3>
            <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
              Real-time portfolio valuation, open positions, recent orders, and daily equity metrics.
            </p>
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-bull mt-4">
              Open Dashboard &rarr;
            </span>
          </Link>

          <Link
            href="/simulator/market"
            className="group rounded-lg border border-rule bg-surface-raised hover:bg-surface-inset p-5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="w-10 h-10 rounded-md bg-surface-sunken border border-rule flex items-center justify-center text-bull mb-3 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-bull transition-colors">
              Market Quotes
            </h3>
            <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
              Explore 8 Casablanca stocks across banking, telecom, and energy with live order depth.
            </p>
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-bull mt-4">
              Browse Quotes &rarr;
            </span>
          </Link>

          <Link
            href="/simulator/portfolio"
            className="group rounded-lg border border-rule bg-surface-raised hover:bg-surface-inset p-5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="w-10 h-10 rounded-md bg-surface-sunken border border-rule flex items-center justify-center text-bull mb-3 group-hover:scale-105 transition-transform">
              <Briefcase className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-bull transition-colors">
              Portfolio Holdings
            </h3>
            <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
              Track marked-to-market positions, average acquisition costs, and asset allocation.
            </p>
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-bull mt-4">
              View Holdings &rarr;
            </span>
          </Link>

          <Link
            href="/simulator/history"
            className="group rounded-lg border border-rule bg-surface-raised hover:bg-surface-inset p-5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-ring"
          >
            <div className="w-10 h-10 rounded-md bg-surface-sunken border border-rule flex items-center justify-center text-bull mb-3 group-hover:scale-105 transition-transform">
              <History className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-foreground group-hover:text-bull transition-colors">
              Execution Audit
            </h3>
            <p className="text-xs text-foreground-secondary mt-1.5 leading-relaxed">
              Auditable transaction ledger recording every share traded, filled price, and fee.
            </p>
            <span className="inline-flex items-center gap-1 text-2xs font-medium text-bull mt-4">
              View Audit Log &rarr;
            </span>
          </Link>
        </div>

        {/* Live Terminal Preview */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Live Market Preview</h2>
              <p className="text-xs text-foreground-secondary mt-0.5">
                Select any ticker to preview candles and price spreads in real-time
              </p>
            </div>
            <Button asChild size="sm" variant="secondary">
              <Link href="/simulator/market">Open Full Directory</Link>
            </Button>
          </div>

          <div className="rounded-lg overflow-hidden border border-rule shadow-sm">
            <TerminalPreview />
          </div>
        </div>

        {/* Rules & Standards Callout */}
        <div className="grid gap-4 sm:grid-cols-3 border-t border-rule pt-8 text-xs text-foreground-secondary">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-bull shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground text-sm">Deterministic GBM Model</h4>
              <p className="mt-1 leading-relaxed">
                Prices evolve on a Geometric Brownian Motion model. Every student observes the exact same price path at each minute.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-warning shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground text-sm">Centime Math Integrity</h4>
              <p className="mt-1 leading-relaxed">
                All balances, prices, and fees are stored as 64-bit integers in Moroccan centimes to eliminate IEEE 754 precision drift.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Scale className="h-5 w-5 text-info shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-foreground text-sm">Honesty Disclosure</h4>
              <p className="mt-1 leading-relaxed">
                {DISC_1} No real securities or currency are traded. All executions are strictly for educational research.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
