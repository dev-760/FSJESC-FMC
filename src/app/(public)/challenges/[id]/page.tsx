/**
 * Challenge execution page - INFLATION_SHOCK scenario.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChangeIndicator } from "@/components/financial/change-indicator";
import { Alert } from "@/components/ui/alert";

interface ChallengeResult {
  finalReturnBps: bigint;
  maxDrawdownBps: bigint;
  volatilityBps: bigint;
  sectorExposure: Record<string, bigint>;
  tradeCount: number;
}

export default function ChallengeDetailPage() {
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const handleStart = () => {
    setIsStarted(true);
    // In a real implementation, this would initialize the challenge state
    // and redirect to the simulator with challenge parameters
  };

  const handleComplete = () => {
    // Simulate challenge completion with feedback
    setResult({
      finalReturnBps: 1250n, // 12.5%
      maxDrawdownBps: 850n, // 8.5%
      volatilityBps: 450n, // 4.5%
      sectorExposure: {
        Technology: 4000n,
        Finance: 3000n,
        Energy: 2000n,
        Consumer: 1000n,
      },
      tradeCount: 15,
    });
    setIsCompleted(true);
  };

  if (!isStarted) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
              <li>
                <Link
                  href="/challenges"
                  className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  Challenges
                </Link>
              </li>
              <li aria-hidden className="text-foreground-muted">
                /
              </li>
              <li aria-current="page" className="text-foreground">
                Inflation Shock
              </li>
            </ol>
          </nav>

          <div className="space-y-8">
            <div>
              <h1 className="mb-4 text-3xl font-semibold tracking-tight">Inflation Shock</h1>
              <p className="text-foreground-secondary mb-6">
                Navigate a simulated inflation scenario. Build a portfolio that can withstand sudden
                price increases and interest rate changes.
              </p>

              <Alert tone="information" title="Challenge Overview">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Scenario:</strong> Inflation rises sharply across all sectors. Central
                    bank raises interest rates in response.
                  </p>
                  <p>
                    <strong>Goal:</strong> Minimize portfolio drawdown while maintaining reasonable
                    returns. Diversification and defensive positioning are key.
                  </p>
                  <p>
                    <strong>Duration:</strong> 30 simulated trading days
                  </p>
                  <p>
                    <strong>Starting Capital:</strong> 100,000 MAD
                  </p>
                </div>
              </Alert>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Key Concepts</h2>
              <ul className="text-foreground-secondary list-inside list-disc space-y-2">
                <li>Interest rate sensitivity of different sectors</li>
                <li>Inflation hedges and defensive assets</li>
                <li>Portfolio diversification strategies</li>
                <li>Risk management during market stress</li>
              </ul>
            </div>

            <Button onClick={handleStart} size="lg">
              Start Challenge
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (isCompleted && result) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h1 className="mb-4 text-3xl font-semibold tracking-tight">Challenge Complete!</h1>
              <p className="text-foreground-secondary">
                Here&apos;s your performance feedback for the Inflation Shock scenario.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="label">Final Return</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <ChangeIndicator bps={result.finalReturnBps} />
                </p>
              </div>
              <div>
                <p className="label">Max Drawdown</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <ChangeIndicator bps={result.maxDrawdownBps} />
                </p>
              </div>
              <div>
                <p className="label">Volatility</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <ChangeIndicator bps={result.volatilityBps} />
                </p>
              </div>
              <div>
                <p className="label">Trade Count</p>
                <p className="mt-1 font-mono text-2xl font-semibold">{result.tradeCount}</p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">Sector Exposure</h2>
              <div className="bg-surface-sunken rounded-lg p-6">
                <div className="space-y-3">
                  {Object.entries(result.sectorExposure).map(([sector, exposureBps]) => (
                    <div key={sector} className="flex items-center justify-between">
                      <span className="label">{sector}</span>
                      <span className="font-mono">
                        <ChangeIndicator bps={exposureBps} />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Alert tone="information" title="Performance Analysis">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Risk-Adjusted Return:</strong> Your portfolio showed{" "}
                  {result.finalReturnBps > 0n ? "positive" : "negative"} returns with moderate
                  drawdown during the inflation shock.
                </p>
                <p>
                  <strong>Volatility:</strong> Portfolio volatility was{" "}
                  {result.volatilityBps < 500n
                    ? "low"
                    : result.volatilityBps < 1000n
                      ? "moderate"
                      : "high"}
                  , indicating {result.volatilityBps < 500n ? "stable" : "variable"} performance.
                </p>
                <p>
                  <strong>Diversification:</strong> Sector exposure{" "}
                  {Object.keys(result.sectorExposure).length > 2
                    ? "shows good diversification"
                    : "could be improved"}
                  .
                </p>
                <p>
                  <strong>Trading Activity:</strong> {result.tradeCount} trades indicates{" "}
                  {result.tradeCount < 10
                    ? "conservative"
                    : result.tradeCount < 20
                      ? "moderate"
                      : "active"}{" "}
                  trading style.
                </p>
              </div>
            </Alert>

            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href="/challenges">Back to Challenges</Link>
              </Button>
              <Button
                onClick={() => {
                  setIsCompleted(false);
                  setIsStarted(false);
                }}
              >
                Retry Challenge
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // In-progress state - would integrate with simulator
  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div>
            <h1 className="mb-4 text-3xl font-semibold tracking-tight">
              Inflation Shock - In Progress
            </h1>
            <p className="text-foreground-secondary mb-6">
              Challenge is active. Open the simulator to complete the scenario.
            </p>
          </div>

          <Button asChild size="lg">
            <Link href="/simulator">Open Simulator</Link>
          </Button>

          <Button variant="secondary" onClick={handleComplete}>
            Complete Challenge (Demo)
          </Button>
        </div>
      </div>
    </main>
  );
}
