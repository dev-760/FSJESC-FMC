import type { Metadata } from "next";
import { PhasePlaceholder, placeholderMetadata } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = placeholderMetadata(
  "Financial education",
  "The FSJESC Financial Markets Club education centre: written material on markets, instruments, execution mechanics and risk.",
);

export default function EducationPage() {
  return (
    <PhasePlaceholder
      phase="the education centre"
      title="Financial education centre"
      summary="A topic library written for students meeting market mechanics for the first time, and useful to those meeting them again. Each topic defines its terms, shows the arithmetic, and states what a measure does not tell you."
      whatIsComing={[
        "Twenty topics across six categories: foundations, instruments, execution, accounting, risk, and portfolio construction",
        "A table of contents generated from each article's headings",
        "Related-topic links and a stated reading time",
        "A standing note that the material is educational and not investment advice",
      ]}
      alternative={{ href: "/events", label: "See upcoming sessions" }}
    />
  );
}
