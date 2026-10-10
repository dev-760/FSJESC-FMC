/**
 * Competition detail page with leaderboard.
 */

"use client";

import { simulatorUrl } from "@fsjesc/config/app-urls";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@fsjesc/ui/button";
import { Num } from "@fsjesc/ui/primitives/num";
import { ChangeIndicator } from "@fsjesc/ui/financial/change-indicator";
import { Alert } from "@fsjesc/ui/alert";
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

interface LeaderboardEntry {
  participantId: string;
  userId: string;
  portfolioId: string;
  totalReturnBps: bigint;
  maxDrawdownBps: bigint;
  equityCents: bigint;
  rank: number;
  userName: string;
}

export default function CompetitionDetailPage() {
  const params = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch competition details
        const compResponse = await fetch(`/api/competitions/${String(params.id)}`);
        if (compResponse.ok) {
          const compData = (await compResponse.json()) as Competition;
          setCompetition(compData);
        }

        // Fetch leaderboard
        const lbResponse = await fetch(`/api/competitions/${String(params.id)}/leaderboard`);
        if (lbResponse.ok) {
          const lbData = (await lbResponse.json()) as LeaderboardEntry[];
          setLeaderboard(lbData);
        }
      } catch (err) {
        console.error("Failed to fetch competition data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [params.id]);

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/competitions/${String(params.id)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "demo-user-id" }),
      });

      if (response.ok) {
        setHasJoined(true);
      }
    } catch (err) {
      console.error("Failed to join competition:", err);
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-surface-sunken mb-4 h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-64 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (!competition) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Alert tone="warning">Competition not found</Alert>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/competitions"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Competitions
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              {competition.name}
            </li>
          </ol>
        </nav>

        <div className="space-y-8">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{competition.name}</h1>
                <p className="text-foreground-secondary mt-2">{competition.description}</p>
              </div>
              {!hasJoined &&
                (competition.status === "UPCOMING" || competition.status === "ACTIVE") && (
                  <Button
                    onClick={() => {
                      void handleJoin();
                    }}
                  >
                    Join Competition
                  </Button>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="label">Starting Cash</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <Num cents={BigInt(competition.startingCashCents)} unit=" MAD" />
                </p>
              </div>
              <div>
                <p className="label">Status</p>
                <p className="mt-1 text-2xl font-semibold">{competition.status}</p>
              </div>
              <div>
                <p className="label">Starts</p>
                <p className="mt-1 text-lg">{formatDate(new Date(competition.startsAt))}</p>
              </div>
              <div>
                <p className="label">Ends</p>
                <p className="mt-1 text-lg">{formatDate(new Date(competition.endsAt))}</p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Leaderboard</h2>
            <Alert tone="information" title="Scoring methodology">
              <p className="text-sm">
                Rankings are based on total return percentage. Max drawdown is used as a
                tie-breaker. This methodology rewards risk-adjusted performance rather than absolute
                profit.
              </p>
            </Alert>

            {leaderboard.length > 0 ? (
              <div className="bg-surface-sunken overflow-hidden rounded-lg">
                <table className="w-full">
                  <thead>
                    <tr className="border-rule border-b">
                      <th className="label px-4 py-3 text-left">Rank</th>
                      <th className="label px-4 py-3 text-left">Participant</th>
                      <th className="label px-4 py-3 text-right">Total Return</th>
                      <th className="label px-4 py-3 text-right">Max Drawdown</th>
                      <th className="label px-4 py-3 text-right">Equity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.participantId}
                        className="border-rule border-b last:border-b-0"
                      >
                        <td className="px-4 py-3 font-mono font-semibold">{entry.rank}</td>
                        <td className="px-4 py-3">{entry.userName}</td>
                        <td className="px-4 py-3 text-right">
                          <ChangeIndicator bps={entry.totalReturnBps} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ChangeIndicator bps={entry.maxDrawdownBps} />
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          <Num cents={entry.equityCents} unit=" MAD" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-surface-sunken rounded-lg p-8 text-center">
                <p className="text-foreground-muted">No participants yet</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/competitions">Back to Competitions</Link>
            </Button>
            <Button asChild>
              <Link href={simulatorUrl()}>Open Simulator</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
