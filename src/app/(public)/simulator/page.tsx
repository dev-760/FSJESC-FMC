import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Scale, ShieldCheck, Zap } from "lucide-react";
import { TerminalPreview } from "@/components/financial/terminal-preview";
import { MarketStatus } from "@/components/simulator/market-status";
import { SimulatorNav } from "@/components/simulator/simulator-nav";
import { RuledList, Section, SectionHeading } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { DISC_1, SIMULATION } from "@/config/site";
import { Num } from "@/components/primitives/num";

export const metadata: Metadata = {
  title: "Trading Simulator | FSJESC Financial Markets Club",
  description:
    "Paper-trading terminal operating a deterministic simulated Moroccan market in MAD. No real money is involved.",
};

const WORKSTATIONS = [
  {
    term: "Trading dashboard",
    detail:
      "Portfolio valuation, open positions, recent orders, and daily equity metrics in one view.",
    href: "/simulator/dashboard",
  },
  {
    term: "Market quotes",
    detail: "Eight Casablanca instruments across banking, telecom and energy, with order depth.",
    href: "/simulator/market",
  },
  {
    term: "Portfolio holdings",
    detail: "Marked-to-market positions, average acquisition costs, and asset allocation.",
    href: "/simulator/portfolio",
  },
  {
    term: "Execution audit",
    detail: "An immutable ledger of every share traded, the price it filled at, and the fee charged.",
    href: "/simulator/history",
  },
] as const;

const STANDARDS = [
  {
    icon: ShieldCheck,
    title: "Deterministic price model",
    detail:
      "Prices evolve on a geometric Brownian motion model, so every member observes the exact same path at each minute.",
  },
  {
    icon: Zap,
    title: "Centime arithmetic",
    detail:
      "Balances, prices and fees are held as integers in Moroccan centimes, so no balance is a floating-point approximation.",
  },
  {
    icon: Scale,
    title: "Stated limits",
    detail: `${DISC_1} No real securities or currency are traded; every execution exists for education.`,
  },
];

export default function SimulatorPage() {
  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <Section spacing="tight" className="border-rule border-b">
        <SectionHeading
          as="h1"
          title="Institutional paper-trading terminal"
          lead="Place market and limit orders against a deterministic simulated Casablanca equity universe. Every cash movement is recorded in an immutable ledger with no floating-point drift."
          actions={
            <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <MarketStatus />
              <Button asChild variant="bull" size="lg">
                <Link href="/simulator/dashboard">
                  <span>Enter dashboard</span>
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          }
        />
        {/* Machine facts belong beside the content they annotate, not above the title. */}
        <p className="label text-2xs mt-6 flex flex-wrap items-center gap-x-2">
          <span>Active simulator engine</span>
          <span aria-hidden className="text-foreground-muted">
            ·
          </span>
          <span className="flex items-baseline gap-1">
            <Num cents={SIMULATION.defaultStartingCashCents} decimals={0} size="sm" unit="MAD" />
            starting capital
          </span>
        </p>
      </Section>

      {/* ── Workstations ────────────────────────────────────────────────── */}
      <Section spacing="tight">
        <SectionHeading title="Four workstations" />
        <div className="mt-10">
          <RuledList items={WORKSTATIONS} />
        </div>
      </Section>

      {/* ── Live preview ────────────────────────────────────────────────── */}
      <Section spacing="tight">
        <SectionHeading
          title="Live market preview"
          lead="Select any ticker to inspect its candles and spread."
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/simulator/market">Open full directory</Link>
            </Button>
          }
        />
        <div className="border-rule bg-surface mt-10 rounded-lg border">
          <TerminalPreview />
        </div>
      </Section>

      {/* ── Standards ───────────────────────────────────────────────────── */}
      <Section spacing="tight" className="border-rule border-t">
        <SectionHeading title="How the model is built" />
        <dl className="mt-10 grid gap-8 sm:grid-cols-3">
          {STANDARDS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <item.icon aria-hidden className="text-foreground-secondary mt-0.5 size-5 shrink-0" />
              <div>
                <dt className="text-foreground text-sm font-medium">{item.title}</dt>
                <dd className="text-foreground-secondary mt-1.5 text-sm leading-relaxed">
                  {item.detail}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </Section>
    </main>
  );
}