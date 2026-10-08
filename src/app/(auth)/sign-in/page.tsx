import type { Metadata } from "next";
import { PhasePlaceholder, placeholderMetadata } from "@/components/layout/phase-placeholder";

export const metadata: Metadata = placeholderMetadata(
  "Sign in",
  "Sign in to the FSJESC Financial Markets Club platform to access your simulated portfolio, competitions and event registrations.",
);

export default function SignInPage() {
  return (
    <PhasePlaceholder
      phase="authentication"
      title="Sign in"
      summary="Accounts arrive with the authentication phase: database-backed sessions, argon2id password hashing, and email verification. No credential is ever stored in the browser."
      whatIsComing={[
        "Sign in with email and password, using database sessions in an HttpOnly, Secure, SameSite cookie",
        "Rate-limited sign-in: five attempts per minute per address, ten per hour per account",
        "Password reset by single-use, expiring, hashed token delivered by email",
        "A graceful session-expired state rather than a silent failure",
      ]}
      alternative={{ href: "/education", label: "Browse the education centre instead" }}
    />
  );
}
