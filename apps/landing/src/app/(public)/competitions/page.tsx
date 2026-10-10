/**
 * Competitions page.
 *
 * Lists active, upcoming, and completed scenario challenges
 * with prize pools, starting cash, and leaderboard previews.
 */

"use client";

import { simulatorUrl } from "@fsjesc/config/app-urls";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Calendar, Coins, ArrowRight } from "lucide-react";
import { Button } from "@fsjesc/ui/button";
import { Badge } from "@fsjesc/ui/badge";
import { formatDate } from "@fsjesc/config/format";

interface Competition {
  id: string;
  name: string;
  description?: string;
  startingCashCents: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

const FALLBACK_ACTIVE: Competition = {
  id: "comp-spring-2026",
  name: "FSJESC Casablanca Spring Championship",
  description: "Multi-week portfolio optimization challenge across 8 Casablanca instruments. Scored on risk-adjusted Sharpe ratio and maximum drawdown limit.",
  startingCashCents: "10000000",
  status: "ACTIVE",
  startsAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  endsAt: new Date(Date.now() + 14 * 86400000).toISOString(),
};

const FALLBACK_UPCOMING: Competition = {
  id: "comp-banking-rotation",
  name: "Banking & Financial Sector Sprint",
  description: "Concentrated challenge navigating interest rate shifts and simulated earnings releases for BCP, ATW, and BOA.",
  startingCashCents: "5000000",
  status: "UPCOMING",
  startsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
  endsAt: new Date(Date.now() + 21 * 86400000).toISOString(),
};

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<{
    active: Competition[];
    upcoming: Competition[];
    completed: Competition[];
  }>({ active: [], upcoming: [], completed: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch("/api/competitions");
        if (response.ok) {
          const data = (await response.json()) as {
            active: Competition[];
            upcoming: Competition[];
            completed: Competition[];
          };
          if (data.active.length > 0 || data.upcoming.length > 0 || data.completed.length > 0) {
            setCompetitions(data);
          } else {
            setCompetitions({
              active: [FALLBACK_ACTIVE],
              upcoming: [FALLBACK_UPCOMING],
              completed: [],
            });
          }
        } else {
          setCompetitions({
            active: [FALLBACK_ACTIVE],
            upcoming: [FALLBACK_UPCOMING],
            completed: [],
          });
        }
      } catch (err) {
        console.error("Failed to fetch competitions:", err);
        setCompetitions({
          active: [FALLBACK_ACTIVE],
          upcoming: [FALLBACK_UPCOMING],
          completed: [],
        });
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCompetitions();
  }, []);

  const getBadgeTone = (status: string): "positive" | "warning" | "neutral" | "information" => {
    switch (status) {
      case "ACTIVE":
        return "positive";
      case "UPCOMING":
        return "warning";
      case "COMPLETED":
        return "neutral";
      default:
        return "information";
    }
  };

  const CompetitionCard = ({ competition }: { competition: Competition }) => (
    <div className="bg-surface-raised hover:bg-surface-inset rounded-lg border border-rule hover:border-rule-strong p-6 transition-all duration-150 flex flex-col justify-between shadow-xs">
      <div>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-foreground">{competition.name}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge tone={getBadgeTone(competition.status)}>{competition.status}</Badge>
              <span className="text-2xs text-foreground-muted numeric">No real capital</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-md bg-surface-sunken border border-rule flex items-center justify-center text-bull shrink-0">
            <Trophy className="h-4 w-4" />
          </div>
        </div>

        {competition.description && (
          <p className="text-foreground-secondary mb-5 text-sm leading-relaxed">{competition.description}</p>
        )}

        <div className="space-y-2.5 text-xs bg-surface-sunken p-3.5 rounded-md border border-rule mb-6">
          <div className="flex justify-between items-center">
            <span className="label text-2xs text-foreground-muted flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-bull" />
              Starting Endowment
            </span>
            <span className="font-mono font-semibold text-foreground">
              {(Number(competition.startingCashCents) / 100).toLocaleString("fr-MA")} MAD
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label text-2xs text-foreground-muted flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Start Date
            </span>
            <span className="numeric text-foreground-secondary">{formatDate(new Date(competition.startsAt))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="label text-2xs text-foreground-muted flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              End Date
            </span>
            <span className="numeric text-foreground-secondary">{formatDate(new Date(competition.endsAt))}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t border-rule/60">
        <Button asChild variant="secondary" className="flex-1 text-xs">
          <Link href={`/competitions/${competition.id}`}>Leaderboard & Rules</Link>
        </Button>
        {competition.status === "UPCOMING" || competition.status === "ACTIVE" ? (
          <Button asChild variant="bull" className="flex-1 text-xs font-semibold">
            <Link href={`/competitions/${competition.id}/join`} className="flex items-center justify-center gap-1">
              <span>Join Challenge</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        ) : null}
      </div>
    </div>
  );

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="label text-2xs text-bull font-semibold uppercase">Academic Trading League</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              Trading Competitions
            </h1>
            <p className="text-foreground-secondary text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
              Test execution strategies against peers in realistic simulated market scenarios.
              Scoring rewards disciplined risk management and Sharpe ratios over unhedged volatility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href={simulatorUrl()}>Practice in Simulator</Link>
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-surface-sunken h-8 w-1/4 rounded" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, idx) => (
                <div key={idx} className="bg-surface-sunken h-64 rounded-lg border border-rule" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {competitions.active.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-bull animate-pulse" />
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Active Competitions ({competitions.active.length})
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {competitions.active.map((competition) => (
                    <CompetitionCard key={competition.id} competition={competition} />
                  ))}
                </div>
              </section>
            )}

            {competitions.upcoming.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-warning" />
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Upcoming Competitions ({competitions.upcoming.length})
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {competitions.upcoming.map((competition) => (
                    <CompetitionCard key={competition.id} competition={competition} />
                  ))}
                </div>
              </section>
            )}

            {competitions.completed.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <span className="h-2 w-2 rounded-full bg-neutral" />
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    Past Competitions Archive ({competitions.completed.length})
                  </h2>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {competitions.completed.map((competition) => (
                    <CompetitionCard key={competition.id} competition={competition} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
