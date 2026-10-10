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

interface Challenge {
  id: string;
  name: string;
  description: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedTime: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: "inflation-shock",
    name: "Inflation Shock",
    description:
      "Navigate a simulated inflation scenario. Build a portfolio that can withstand sudden price increases and interest rate changes.",
    difficulty: "INTERMEDIATE",
    estimatedTime: "30 minutes",
  },
];

export default function ChallengesPage() {
  const [completedChallenges] = useState<Set<string>>(new Set());

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return "bg-positive/10 text-positive border-positive/20";
      case "INTERMEDIATE":
        return "bg-warning/10 text-warning border-warning/20";
      case "ADVANCED":
        return "bg-negative/10 text-negative border-negative/20";
      default:
        return "bg-neutral/10 text-neutral border-neutral/20";
    }
  };

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Trading Challenges</h1>
          <p className="text-foreground-secondary">
            Test your trading skills with realistic market scenarios.
          </p>
        </div>

        <Alert tone="information" title="Educational scenarios">
          <p className="text-sm">
            All challenges use simulated market data and fictional instruments. Results are for
            educational purposes only and do not constitute investment advice.
          </p>
        </Alert>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {CHALLENGES.map((challenge) => {
            const isCompleted = completedChallenges.has(challenge.id);

            return (
              <div key={challenge.id} className="bg-surface-sunken rounded-lg p-6">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight">{challenge.name}</h3>
                    <Badge className={getDifficultyColor(challenge.difficulty)}>
                      {challenge.difficulty}
                    </Badge>
                  </div>
                  {isCompleted && (
                    <Badge className="bg-positive/10 text-positive border-positive/20">
                      Completed
                    </Badge>
                  )}
                </div>

                <p className="text-foreground-secondary mb-4 text-sm">{challenge.description}</p>

                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="label">Estimated Time</span>
                    <span>{challenge.estimatedTime}</span>
                  </div>
                </div>

                <Button asChild className="w-full">
                  <Link href={`/challenges/${challenge.id}`}>
                    {isCompleted ? "Retry Challenge" : "Start Challenge"}
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
