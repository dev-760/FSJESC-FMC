import type { Metadata } from "next";
import { PhasePlaceholder, placeholderMetadata } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = placeholderMetadata(
  "Competitions",
  "Scenario-based trading challenges run by the FSJESC Financial Markets Club, scored on return with maximum drawdown as the tie-break.",
);

export default function CompetitionsPage() {
  return (
    <PhasePlaceholder
      phase="competitions"
      title="Competitions and challenges"
      summary="Time-boxed challenges under defined macroeconomic assumptions. You are scored on portfolio return, with the lower maximum drawdown winning a tie — never on absolute profit in dirhams."
      whatIsComing={[
        "Scenario challenges including an inflation shock, an interest-rate hike and a market panic",
        "A leaderboard showing return, portfolio value and maximum drawdown, with the scoring methodology stated",
        "An isolated portfolio per participant, funded at the competition's starting capital",
        "Feedback on return, drawdown, volatility and sector exposure once the window closes",
      ]}
      alternative={{ href: "/events", label: "Attend a briefing session" }}
    />
  );
}
