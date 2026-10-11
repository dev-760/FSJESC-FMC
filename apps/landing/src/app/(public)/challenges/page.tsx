/**
 * Challenges page.
 *
 * Lists educational trading challenges.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@fsjesc/ui/button";
import { Badge } from "@fsjesc/ui/badge";
import { Alert } from "@fsjesc/ui/alert";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import { cn } from "@fsjesc/config/cn";

export interface ChallengeDefinition {
  id: string;
  name: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedTime: string;
  volatilityMultiplier: string;
  driftAdjustment: string;
  focusSector: string;
}

const CHALLENGES: readonly ChallengeDefinition[] = [
  {
    id: "bull-run",
    name: "Bull Run & Allocation Discipline",
    description:
      "Participate in a sustained upward drift (+8% annualised) with normal volatility. Practice position sizing and rebalancing across Bourse de Casablanca sectors without over-concentrating.",
    difficulty: "BEGINNER",
    estimatedTime: "20 minutes",
    volatilityMultiplier: "1.0×",
    driftAdjustment: "+8.0% p.a.",
    focusSector: "All 9 CSE Casablanca Sectors",
  },
  {
    id: "sector-rotation",
    name: "Casablanca Sector Rotation",
    description:
      "Reallocate capital across Banking (ATW, BCP, BOA), Telecoms (IAM), and Mining (MNG, CMT) as relative momentum shifts under moderate volatility.",
    difficulty: "BEGINNER",
    estimatedTime: "25 minutes",
    volatilityMultiplier: "1.2×",
    driftAdjustment: "+3.0% p.a.",
    focusSector: "Banques, Télécoms & Mines",
  },
  {
    id: "inflation-shock",
    name: "Inflation Shock",
    description:
      "Navigate a sudden 2.5× surge in market volatility paired with inflationary price drift. Construct a defensive portfolio across MNG, TQM, and CSR that keeps maximum drawdown under control.",
    difficulty: "INTERMEDIATE",
    estimatedTime: "30 minutes",
    volatilityMultiplier: "2.5×",
    driftAdjustment: "+2.0% p.a.",
    focusSector: "Mines, Énergie & Agroalimentaire",
  },
  {
    id: "interest-rate-hike",
    name: "Bank Al-Maghrib Rate Tightening",
    description:
      "Simulate the impact of monetary tightening (−5% annualised drift, 1.5× volatility). Balance rate-sensitive financial holdings (ATW, BCP) and 10Y BDT against cash reserves.",
    difficulty: "INTERMEDIATE",
    estimatedTime: "30 minutes",
    volatilityMultiplier: "1.5×",
    driftAdjustment: "−5.0% p.a.",
    focusSector: "Banques, Bâtiment & BDT 10Y",
  },
  {
    id: "market-crash",
    name: "Liquidity & Market Crash Stress Test",
    description:
      "Endure a sharp downward market correction (−15% annualised drift, 3.0× volatility). Test stop-loss discipline, limit-order execution, and capital preservation.",
    difficulty: "ADVANCED",
    estimatedTime: "35 minutes",
    volatilityMultiplier: "3.0×",
    driftAdjustment: "−15.0% p.a.",
    focusSector: "Defensive Equities & Cash Management",
  },
  {
    id: "volatility-spike",
    name: "Microstructure Volatility Spike",
    description:
      "Operate under a 4.0× volatility regime with zero directional drift. Observe how wide bid-ask spreads and market orders erode returns when volatility spikes.",
    difficulty: "ADVANCED",
    estimatedTime: "40 minutes",
    volatilityMultiplier: "4.0×",
    driftAdjustment: "0.0% p.a.",
    focusSector: "Order Book & Limit Execution",
  },
];

type FilterLevel = "ALL" | "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export default function ChallengesPage() {
  const [filter, setFilter] = useState<FilterLevel>("ALL");

  const getDifficultyTone = (
    difficulty: ChallengeDefinition["difficulty"],
  ): "positive" | "warning" | "negative" => {
    switch (difficulty) {
      case "BEGINNER":
        return "positive";
      case "INTERMEDIATE":
        return "warning";
      case "ADVANCED":
        return "negative";
    }
  };

  const visibleChallenges =
    filter === "ALL" ? CHALLENGES : CHALLENGES.filter((c) => c.difficulty === filter);

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="border-rule flex flex-col justify-between gap-4 border-b pb-6 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Scenario Challenges
            </h1>
            <p className="text-foreground-secondary mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
              Time-boxed macro and microstructure stress tests built on our deterministic price
              engine. Each scenario perturbs drift (μ) and volatility (σ) over a reproducible window.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/competitions">League Competitions</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={simulatorUrl()}>Open Simulator</Link>
            </Button>
          </div>
        </div>

        <Alert tone="information" title="Educational scenario overlays">
          <p className="text-sm">
            All challenges use simulated price paths across real Bourse de Casablanca and global
            reference tickers settled in MAD. Results are for academic study only and never
            constitute investment advice.
          </p>
        </Alert>

        {/* Difficulty filter bar */}
        <div
          role="group"
          aria-label="Filter challenges by difficulty"
          className="flex flex-wrap items-center gap-2"
        >
          {(["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setFilter(level)}
              aria-pressed={filter === level}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                filter === level
                  ? "border-rule-strong bg-brand-navy text-canvas font-semibold shadow-2xs"
                  : "border-rule bg-surface text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              {level === "ALL" ? `All Scenarios (${CHALLENGES.length})` : level}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleChallenges.map((challenge) => (
            <div
              key={challenge.id}
              className="bg-surface border-rule hover:border-brand/60 flex flex-col justify-between rounded-2xl border p-6 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div>
                <div className="mb-3 flex items-start justify-between gap-2">
                  <Badge tone={getDifficultyTone(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                  <span className="numeric text-foreground-muted text-xs">
                    {challenge.estimatedTime}
                  </span>
                </div>

                <h2 className="text-lg font-semibold tracking-tight">{challenge.name}</h2>
                <p className="text-foreground-secondary mt-2 mb-5 text-sm leading-relaxed">
                  {challenge.description}
                </p>

                <dl className="bg-surface-sunken border-rule mb-6 space-y-2 rounded-xl border p-3.5 text-xs">
                  <div className="flex justify-between">
                    <dt className="label text-2xs text-foreground-muted">Volatility Overlay</dt>
                    <dd className="numeric font-semibold">{challenge.volatilityMultiplier}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="label text-2xs text-foreground-muted">Drift Adjustment</dt>
                    <dd className="numeric font-semibold">{challenge.driftAdjustment}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="label text-2xs text-foreground-muted">Focus</dt>
                    <dd className="text-foreground-secondary text-right">{challenge.focusSector}</dd>
                  </div>
                </dl>
              </div>

              <Button asChild className="w-full">
                <Link href={`/challenges/${challenge.id}`}>Inspect &amp; Run Scenario</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
