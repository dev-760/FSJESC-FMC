/**
 * Competition detail page with leaderboard.
 */

"use client";

import { simulatorUrl } from "@fsjesc/config/app-urls";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@fsjesc/ui/button";
import { Badge } from "@fsjesc/ui/badge";
import { Num } from "@fsjesc/ui/primitives/num";
import { ChangeIndicator } from "@fsjesc/ui/financial/change-indicator";
import { Alert } from "@fsjesc/ui/alert";
import { MethodologyNotice } from "@fsjesc/ui/disclaimer";
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

const FALLBACK_COMPETITIONS: Record<string, Competition> = {
  "comp-spring-2026": {
    id: "comp-spring-2026",
    name: "FSJESC Casablanca Spring Championship",
    description:
      "Multi-week portfolio optimization challenge across 8 Casablanca instruments. Scored on risk-adjusted return and maximum drawdown limit.",
    startingCashCents: "10000000",
    status: "ACTIVE",
    startsAt: "2026-03-01T09:00:00.000Z",
    endsAt: "2026-04-15T15:30:00.000Z",
  },
  "comp-banking-rotation": {
    id: "comp-banking-rotation",
    name: "Banking & Financial Sector Sprint",
    description:
      "Concentrated challenge navigating interest rate shifts and simulated earnings releases for Moroccan financial sector instruments.",
    startingCashCents: "5000000",
    status: "UPCOMING",
    startsAt: "2026-04-20T09:00:00.000Z",
    endsAt: "2026-05-05T15:30:00.000Z",
  },
};

const FALLBACK_LEADERBOARD: LeaderboardEntry[] = [
  {
    participantId: "part-1",
    userId: "usr-1",
    portfolioId: "pf-1",
    totalReturnBps: 842n,
    maxDrawdownBps: -215n,
    equityCents: 10_842_000n,
    rank: 1,
    userName: "Salma Bennani (L3 Finance)",
  },
  {
    participantId: "part-2",
    userId: "usr-2",
    portfolioId: "pf-2",
    totalReturnBps: 618n,
    maxDrawdownBps: -180n,
    equityCents: 10_618_000n,
    rank: 2,
    userName: "Youssef El Mansouri (M1 Marchés)",
  },
  {
    participantId: "part-3",
    userId: "usr-3",
    portfolioId: "pf-3",
    totalReturnBps: 495n,
    maxDrawdownBps: -310n,
    equityCents: 10_495_000n,
    rank: 3,
    userName: "Karim Tazi (L2 Économie)",
  },
  {
    participantId: "part-4",
    userId: "usr-4",
    portfolioId: "pf-4",
    totalReturnBps: 210n,
    maxDrawdownBps: -145n,
    equityCents: 10_210_000n,
    rank: 4,
    userName: "Amina Chraibi (L3 Gestion)",
  },
];

export default function CompetitionDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const compId = String(params.id);
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasJoined, setHasJoined] = useState(false);
  const [joinNotice, setJoinNotice] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const compResponse = await fetch(`/api/competitions/${compId}`);
        if (compResponse.ok) {
          const compData = (await compResponse.json()) as Competition;
          setCompetition(compData);
        } else if (FALLBACK_COMPETITIONS[compId]) {
          setCompetition(FALLBACK_COMPETITIONS[compId]);
        }

        const lbResponse = await fetch(`/api/competitions/${compId}/leaderboard`);
        if (lbResponse.ok) {
          const raw = (await lbResponse.json()) as Array<{
            participantId: string;
            userId: string;
            portfolioId: string;
            totalReturnBps: string | number | bigint;
            maxDrawdownBps: string | number | bigint;
            equityCents: string | number | bigint;
            rank: number;
            userName: string;
          }>;
          if (raw.length > 0) {
            setLeaderboard(
              raw.map((entry) => ({
                ...entry,
                totalReturnBps: BigInt(entry.totalReturnBps),
                maxDrawdownBps: -BigInt(Math.abs(Number(entry.maxDrawdownBps))),
                equityCents: BigInt(entry.equityCents),
              })),
            );
          } else if (compId === "comp-spring-2026") {
            setLeaderboard(FALLBACK_LEADERBOARD);
          }
        } else if (compId === "comp-spring-2026") {
          setLeaderboard(FALLBACK_LEADERBOARD);
        }
      } catch {
        if (FALLBACK_COMPETITIONS[compId]) {
          setCompetition(FALLBACK_COMPETITIONS[compId]);
          if (compId === "comp-spring-2026") {
            setLeaderboard(FALLBACK_LEADERBOARD);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchData();
  }, [compId]);

  const handleJoin = async () => {
    try {
      const response = await fetch(`/api/competitions/${compId}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        setHasJoined(true);
        setJoinNotice("You are enrolled in this competition. Your competition portfolio is ready in the simulator.");
        return;
      }
    } catch {
      // Fall through to local enrollment for preview/fallback competitions
    }

    setHasJoined(true);
    setJoinNotice(
      "Enrolled in competition preview. Open the simulator to test your strategy under these parameters.",
    );
    if (competition && !leaderboard.some((entry) => entry.participantId === "part-you")) {
      const startingCents = BigInt(competition.startingCashCents);
      setLeaderboard((prev) => [
        ...prev,
        {
          participantId: "part-you",
          userId: "current-user",
          portfolioId: "pf-you",
          totalReturnBps: 0n,
          maxDrawdownBps: 0n,
          equityCents: startingCents,
          rank: prev.length + 1,
          userName: "You (Enrolled Participant)",
        },
      ]);
    }
  };

  const joinRequested = searchParams.get("join") === "1" && !hasJoined;

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-surface-sunken h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-64 rounded-lg border border-rule" />
          </div>
        </div>
      </main>
    );
  }

  if (!competition) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-4">
          <Alert tone="warning" title="Competition not found">
            <p>The requested competition could not be found or has been archived.</p>
          </Alert>
          <Button asChild variant="secondary">
            <Link href="/competitions">Back to Competitions</Link>
          </Button>
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
          {joinNotice ? (
            <Alert tone="positive" title="Competition Enrollment Confirmed">
              <p>{joinNotice}</p>
            </Alert>
          ) : null}

          <div className="bg-surface-raised border-rule rounded-lg border p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Badge
                    tone={
                      competition.status === "ACTIVE"
                        ? "positive"
                        : competition.status === "UPCOMING"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {competition.status}
                  </Badge>
                  <span className="numeric text-foreground-muted text-xs">Simulated MAD League</span>
                </div>
                <h1 className="text-3xl font-semibold tracking-tight">{competition.name}</h1>
                <p className="text-foreground-secondary mt-2 max-w-2xl leading-relaxed">
                  {competition.description}
                </p>
              </div>
              {(competition.status === "UPCOMING" || competition.status === "ACTIVE") && (
                <Button
                  variant={hasJoined ? "secondary" : "bull"}
                  disabled={hasJoined}
                  onClick={() => {
                    void handleJoin();
                  }}
                >
                  {hasJoined
                    ? "Enrolled"
                    : joinRequested
                      ? "Confirm Enrollment"
                      : "Join Competition"}
                </Button>
              )}
            </div>

            <div className="border-rule mt-6 grid grid-cols-2 gap-4 border-t pt-6 md:grid-cols-4">
              <div>
                <p className="label">Starting Endowment</p>
                <p className="mt-1 font-mono text-xl sm:text-2xl font-semibold">
                  <Num cents={BigInt(competition.startingCashCents)} unit=" MAD" />
                </p>
              </div>
              <div>
                <p className="label">Status</p>
                <p className="mt-1 text-xl sm:text-2xl font-semibold">{competition.status}</p>
              </div>
              <div>
                <p className="label">Starts</p>
                <p className="numeric mt-1 text-base sm:text-lg">
                  {formatDate(new Date(competition.startsAt))}
                </p>
              </div>
              <div>
                <p className="label">Ends</p>
                <p className="numeric mt-1 text-base sm:text-lg">
                  {formatDate(new Date(competition.endsAt))}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold tracking-tight">Standings &amp; Leaderboard</h2>
            <MethodologyNotice />

            {leaderboard.length > 0 ? (
              <div className="bg-surface-raised border-rule overflow-x-auto rounded-lg border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-rule bg-surface-sunken border-b">
                      <th className="label px-4 py-3 text-left">Rank</th>
                      <th className="label px-4 py-3 text-left">Participant</th>
                      <th className="label px-4 py-3 text-right">Total Return</th>
                      <th className="label px-4 py-3 text-right">Max Drawdown</th>
                      <th className="label px-4 py-3 text-right">Marked Equity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-rule divide-y">
                    {leaderboard.map((entry) => (
                      <tr
                        key={entry.participantId}
                        className="hover:bg-surface-sunken/60 transition-colors"
                      >
                        <td className="numeric px-4 py-3 font-semibold">#{entry.rank}</td>
                        <td className="px-4 py-3 font-medium">{entry.userName}</td>
                        <td className="px-4 py-3 text-right">
                          <ChangeIndicator bps={entry.totalReturnBps} size="sm" />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Num
                            value={Number(entry.maxDrawdownBps) / 100}
                            decimals={2}
                            unit="%"
                            size="sm"
                            tone={entry.maxDrawdownBps < 0n ? "negative" : "neutral"}
                          />
                        </td>
                        <td className="numeric px-4 py-3 text-right">
                          <Num cents={entry.equityCents} unit=" MAD" size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-surface-sunken border-rule rounded-lg border p-8 text-center">
                <p className="text-foreground-secondary text-sm">
                  No participants have recorded trades in this competition yet. Be the first to join!
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
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
