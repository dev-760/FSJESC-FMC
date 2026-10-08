import type { Metadata } from "next";
import { PhasePlaceholder, placeholderMetadata } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = placeholderMetadata(
  "Create an account",
  "Create an account to access the FSJESC Financial Markets Club simulator, competitions and event registration.",
);

export default function CreateAccountPage() {
  return (
    <PhasePlaceholder
      phase="authentication"
      title="Create your account"
      summary="An account gives you a simulated portfolio, access to competitions, event registration, and the education centre. It costs nothing — there is no mechanism to move real money on this platform."
      whatIsComing={[
        "Registration with an optional student ID and academic track; nothing else is collected",
        "A password policy of at least twelve characters, hashed with argon2id before storage",
        "Email verification, auto-confirmed in development and required in production",
        "Rate-limited registration and immediate deletion of your account on request",
      ]}
      alternative={{ href: "/about", label: "Read about the club first" }}
    />
  );
}
