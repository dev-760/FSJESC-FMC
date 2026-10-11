/**
 * Challenge execution page - INFLATION_SHOCK scenario.
 */

"use client";

import { simulatorUrl } from "@fsjesc/config/app-urls";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@fsjesc/ui/button";
import { Badge } from "@fsjesc/ui/badge";
import { Num } from "@fsjesc/ui/primitives/num";
import { ChangeIndicator } from "@fsjesc/ui/financial/change-indicator";
import { Alert } from "@fsjesc/ui/alert";

interface ChallengeResult {
  finalReturnBps: bigint;
  maxDrawdownBps: bigint;
  volatilityBps: bigint;
  sectorWeightsPct: Record<string, number>;
  tradeCount: number;
}

interface ScenarioMeta {
  title: string;
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  summary: string;
  scenarioText: string;
  goalText: string;
  duration: string;
  volatilityMultiplier: string;
  driftAdjustment: string;
  concepts: string[];
  sampleResult: ChallengeResult;
}

const SCENARIO_CATALOG: Record<string, ScenarioMeta> = {
  "inflation-shock": {
    title: "Inflation Shock",
    difficulty: "INTERMEDIATE",
    summary:
      "Navigate a simulated inflation shock with 2.5× volatility. Build a Moroccan equity and cash allocation that withstands input-cost pressure.",
    scenarioText:
      "Inflation rises sharply across industrial and consumer sectors. Volatility multiplies by 2.5× while nominal drift shifts +2.0% annualised.",
    goalText:
      "Keep maximum drawdown below 10% while preserving purchasing power across 14 simulated trading days.",
    duration: "14 simulated trading days",
    volatilityMultiplier: "2.5×",
    driftAdjustment: "+2.0% p.a.",
    concepts: [
      "Input-cost vs pricing-power dynamics across Bourse de Casablanca sectors",
      "Real vs nominal portfolio return under inflation",
      "Position sizing when volatility doubles",
      "Using cash reserves to dampen portfolio drawdown",
    ],
    sampleResult: {
      finalReturnBps: 420n,
      maxDrawdownBps: -380n,
      volatilityBps: 640n,
      sectorWeightsPct: {
        "Mines & Materials (MNG, CMT)": 35,
        "Banques (ATW, BCP)": 25,
        "Télécommunications (IAM)": 20,
        "Liquid Cash Reserve (MAD)": 20,
      },
      tradeCount: 9,
    },
  },
  "market-crash": {
    title: "Liquidity & Market Crash Stress Test",
    difficulty: "ADVANCED",
    summary:
      "Endure a sharp −15% annualised market correction with 3.0× volatility. Practice capital preservation and limit-order execution.",
    scenarioText:
      "A broad risk-off shock triggers a −15% annualised downward drift and triples return volatility across Moroccan and global equities.",
    goalText:
      "Limit portfolio drawdown using defensive rotation and cash buffers without panic-selling into wide spreads.",
    duration: "7 simulated trading days",
    volatilityMultiplier: "3.0×",
    driftAdjustment: "−15.0% p.a.",
    concepts: [
      "Peak-to-trough maximum drawdown arithmetic",
      "Market order slippage vs limit order patience during sell-offs",
      "Correlation spikes during market corrections",
      "Defensive rebalancing into lower-beta telecom (IAM) and utility (TQM) equities",
    ],
    sampleResult: {
      finalReturnBps: -190n,
      maxDrawdownBps: -460n,
      volatilityBps: 890n,
      sectorWeightsPct: {
        "Télécommunications (IAM)": 30,
        "Énergie & Utilities (TQM)": 25,
        "Banques (ATW)": 15,
        "Liquid Cash Reserve (MAD)": 30,
      },
      tradeCount: 11,
    },
  },
  "bull-run": {
    title: "Bull Run & Allocation Discipline",
    difficulty: "BEGINNER",
    summary:
      "Participate in a sustained +8% annualised expansion while maintaining diversification rules and avoiding concentration risk.",
    scenarioText:
      "Macroeconomic optimism drives a steady +8.0% annualised upward drift at baseline 1.0× volatility over a 90-day window.",
    goalText:
      "Capture market upside while keeping single-instrument concentration below 25% of total equity.",
    duration: "90 simulated trading days",
    volatilityMultiplier: "1.0×",
    driftAdjustment: "+8.0% p.a.",
    concepts: [
      "Compounding drift vs idiosyncratic stock volatility",
      "Rebalancing winners to prevent single-stock concentration",
      "Measuring Sharpe ratio vs raw dirham profit",
      "Transaction cost drag (5 bps fee) from over-trading",
    ],
    sampleResult: {
      finalReturnBps: 780n,
      maxDrawdownBps: -195n,
      volatilityBps: 340n,
      sectorWeightsPct: {
        "Banques (ATW, BCP)": 30,
        "Bâtiment & Matériaux (LHM, TGCC)": 25,
        "Mines (MNG, SMI)": 25,
        "Agroalimentaire & Retail (CSR, LBV)": 20,
      },
      tradeCount: 6,
    },
  },
  "sector-rotation": {
    title: "Casablanca Sector Rotation",
    difficulty: "BEGINNER",
    summary:
      "Rotate capital systematically across Bourse de Casablanca sectors as relative performance shifts between cyclical and defensive industries.",
    scenarioText:
      "Moderate volatility (1.2×) and +3.0% drift reward portfolios that balance high-volatility cyclicals with steady dividend-style sectors.",
    goalText:
      "Maintain balanced exposure across at least four sectors while minimizing turnover fees.",
    duration: "30 simulated trading days",
    volatilityMultiplier: "1.2×",
    driftAdjustment: "+3.0% p.a.",
    concepts: [
      "Comparing annualised volatility across sectors (telecoms vs construction)",
      "Equal-weight vs volatility-weighted position sizing",
      "Evaluating turnover cost against expected drift",
    ],
    sampleResult: {
      finalReturnBps: 510n,
      maxDrawdownBps: -240n,
      volatilityBps: 410n,
      sectorWeightsPct: {
        "Télécommunications (IAM)": 30,
        "Banques (ATW, BCP)": 30,
        "Énergie & Utilities (TQM)": 25,
        "Agroalimentaire (CSR, SBM)": 15,
      },
      tradeCount: 8,
    },
  },
  "volatility-spike": {
    title: "Microstructure Volatility Spike",
    difficulty: "ADVANCED",
    summary:
      "Operate under a 4.0× volatility regime with zero directional drift. Study order book spread expansion and execution discipline.",
    scenarioText:
      "Uncertainty quadruples volatility (4.0×) while mean drift remains 0.0%. Intraday swings test limit-order placement.",
    goalText:
      "Preserve capital and capture mean-reverting fills using limit orders instead of market orders.",
    duration: "14 simulated trading days",
    volatilityMultiplier: "4.0×",
    driftAdjustment: "0.0% p.a.",
    concepts: [
      "Variance drag (½σ²) in Geometric Brownian Motion",
      "Why zero arithmetic drift produces negative geometric drift at high σ",
      "Limit order price improvement vs execution certainty",
    ],
    sampleResult: {
      finalReturnBps: 145n,
      maxDrawdownBps: -520n,
      volatilityBps: 1120n,
      sectorWeightsPct: {
        "Télécommunications (IAM)": 25,
        "Énergie & Utilities (TQM)": 25,
        "Mines (MNG)": 15,
        "Liquid Cash Reserve (MAD)": 35,
      },
      tradeCount: 14,
    },
  },
  "interest-rate-hike": {
    title: "Bank Al-Maghrib Rate Tightening",
    difficulty: "INTERMEDIATE",
    summary:
      "Simulate the portfolio impact of a policy rate hike (−5% drift, 1.5× volatility) across rate-sensitive Moroccan equities and BDT bonds.",
    scenarioText:
      "Monetary tightening introduces a −5.0% annualised headwind and 1.5× volatility over a 30-day adjustment period.",
    goalText:
      "Reduce duration and rate-sensitive exposure while keeping portfolio drawdown contained.",
    duration: "30 simulated trading days",
    volatilityMultiplier: "1.5×",
    driftAdjustment: "−5.0% p.a.",
    concepts: [
      "Discount rate sensitivity of equity valuations and 10Y Bons du Trésor (BDT10Y)",
      "Sector differentiation between banking margins (ATW, BCP) and construction financing costs (LHM, TGCC)",
      "Capital preservation when expected market drift is negative",
    ],
    sampleResult: {
      finalReturnBps: 95n,
      maxDrawdownBps: -290n,
      volatilityBps: 480n,
      sectorWeightsPct: {
        "Banques (ATW, BCP)": 35,
        "Télécommunications (IAM)": 25,
        "Agroalimentaire (CSR)": 15,
        "Liquid Cash Reserve (MAD)": 25,
      },
      tradeCount: 7,
    },
  },
};

export default function ChallengeDetailPage() {
  const params = useParams();
  const slug = String(params.id ?? "inflation-shock");
  const scenario = SCENARIO_CATALOG[slug] ?? SCENARIO_CATALOG["inflation-shock"]!;

  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);

  const handleStart = () => {
    setIsStarted(true);
  };

  const handleComplete = () => {
    setResult(scenario.sampleResult);
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
                {scenario.title}
              </li>
            </ol>
          </nav>

          <div className="space-y-8">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Badge
                  tone={
                    scenario.difficulty === "BEGINNER"
                      ? "positive"
                      : scenario.difficulty === "INTERMEDIATE"
                        ? "warning"
                        : "negative"
                  }
                >
                  {scenario.difficulty}
                </Badge>
                <span className="numeric text-foreground-muted text-xs">
                  σ {scenario.volatilityMultiplier} · μ {scenario.driftAdjustment}
                </span>
              </div>
              <h1 className="mb-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                {scenario.title}
              </h1>
              <p className="text-foreground-secondary mb-6 max-w-2xl leading-relaxed">
                {scenario.summary}
              </p>

              <Alert tone="information" title="Scenario Parameters & Objective">
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Macro / Market Overlay:</strong> {scenario.scenarioText}
                  </p>
                  <p>
                    <strong>Objective:</strong> {scenario.goalText}
                  </p>
                  <p>
                    <strong>Window Duration:</strong> {scenario.duration} ·{" "}
                    <strong>Starting Endowment:</strong> 100,000 MAD
                  </p>
                </div>
              </Alert>
            </div>

            <div className="bg-surface-raised border-rule rounded-lg border p-6">
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                Key Mechanics Studied in This Scenario
              </h2>
              <ul className="text-foreground-secondary space-y-2.5 text-sm">
                {scenario.concepts.map((concept) => (
                  <li key={concept} className="flex items-start gap-2.5">
                    <span className="bg-bull mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" />
                    <span>{concept}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleStart} size="lg">
                Start Scenario Evaluation
              </Button>
              <Button asChild variant="secondary" size="lg">
                <Link href={simulatorUrl()}>Open Full Simulator</Link>
              </Button>
            </div>
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
              <Badge tone="positive" className="mb-2">
                Scenario Evaluated
              </Badge>
              <h1 className="mb-2 text-3xl font-semibold tracking-tight">
                {scenario.title} — Post-Scenario Debrief
              </h1>
              <p className="text-foreground-secondary text-sm sm:text-base">
                Quantitative evaluation of portfolio resilience under the {scenario.title} parameters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-surface-raised border-rule rounded-lg border p-4">
                <p className="label">Net Period Return</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <ChangeIndicator bps={result.finalReturnBps} />
                </p>
              </div>
              <div className="bg-surface-raised border-rule rounded-lg border p-4">
                <p className="label">Max Drawdown</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <Num
                    value={Number(result.maxDrawdownBps) / 100}
                    decimals={2}
                    unit="%"
                    tone="negative"
                  />
                </p>
              </div>
              <div className="bg-surface-raised border-rule rounded-lg border p-4">
                <p className="label">Realised Volatility</p>
                <p className="mt-1 font-mono text-2xl font-semibold">
                  <Num
                    value={Number(result.volatilityBps) / 100}
                    decimals={2}
                    unit="%"
                    tone="neutral"
                  />
                </p>
              </div>
              <div className="bg-surface-raised border-rule rounded-lg border p-4">
                <p className="label">Executed Trades</p>
                <p className="numeric mt-1 text-2xl font-semibold">{result.tradeCount}</p>
              </div>
            </div>

            <div>
              <h2 className="mb-4 text-lg font-semibold tracking-tight">
                Moroccan Sector Allocation Weights
              </h2>
              <div className="bg-surface-raised border-rule rounded-lg border p-6">
                <div className="space-y-4">
                  {Object.entries(result.sectorWeightsPct).map(([sector, weightPct]) => (
                    <div key={sector} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{sector}</span>
                        <span className="numeric font-semibold">
                          <Num value={weightPct} decimals={0} unit="%" size="sm" />
                        </span>
                      </div>
                      <div className="bg-surface-inset h-2 w-full overflow-hidden rounded-full">
                        <div
                          className="bg-bull h-full rounded-full"
                          style={{ width: `${weightPct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Alert tone="information" title="Methodology & Risk Debrief">
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Drawdown Control:</strong> Peak-to-trough drawdown reached{" "}
                  {(Math.abs(Number(result.maxDrawdownBps)) / 100).toFixed(2)}% under a{" "}
                  {scenario.volatilityMultiplier} volatility multiplier.
                </p>
                <p>
                  <strong>Diversification:</strong> Allocating across{" "}
                  {Object.keys(result.sectorWeightsPct).length} distinct buckets prevented single-name
                  idiosyncratic shocks from dominating portfolio variance.
                </p>
                <p>
                  <strong>Execution Discipline:</strong> {result.tradeCount} executions kept exchange
                  fee drag (5 bps per fill) below{" "}
                  {((result.tradeCount * 5) / 100).toFixed(2)}% of capital.
                </p>
              </div>
            </Alert>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/challenges">Back to All Challenges</Link>
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCompleted(false);
                  setIsStarted(false);
                }}
              >
                Reset Scenario
              </Button>
              <Button asChild>
                <Link href={simulatorUrl()}>Trade Live in Simulator</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="bg-surface-raised border-rule space-y-6 rounded-lg border p-6 sm:p-8">
          <div>
            <Badge tone="warning" className="mb-2">
              Scenario Active
            </Badge>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">
              {scenario.title} — Simulation Window Active
            </h1>
            <p className="text-foreground-secondary max-w-2xl text-sm sm:text-base leading-relaxed">
              The {scenario.title} overlay (σ {scenario.volatilityMultiplier}, μ{" "}
              {scenario.driftAdjustment}) is active. Execute your trades in the simulator terminal or
              generate the post-scenario risk evaluation below.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={simulatorUrl()}>Open Simulator Terminal</Link>
            </Button>

            <Button variant="secondary" size="lg" onClick={handleComplete}>
              Evaluate Scenario Performance
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
