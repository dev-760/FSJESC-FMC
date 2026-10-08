import type { Metadata } from "next";
import { PhasePlaceholder, placeholderMetadata } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = placeholderMetadata(
  "Simulator",
  "A paper-trading simulator operating a fictional Moroccan market in MAD. No real money is involved.",
);

export default function SimulatorPage() {
  return (
    <PhasePlaceholder
      phase="the simulator"
      title="Paper-trading simulator"
      summary="Place market and limit orders against a deterministic simulated market denominated in Moroccan dirhams. Every cash movement is recorded in a ledger that cannot be edited."
      whatIsComing={[
        "A portfolio funded with 100,000 MAD of simulated capital",
        "Eight fictional instruments across six sectors, priced by a documented deterministic model",
        "Market and limit orders with a two-step review before anything executes",
        "Positions, executions and transactions, plus volatility, maximum drawdown and concentration analytics",
      ]}
      alternative={{ href: "/education", label: "Start with the education centre" }}
    />
  );
}
