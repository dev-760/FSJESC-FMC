import type { Metadata } from "next";
import Link from "next/link";
import { signUpAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { DISC_3 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Create an account",
  description:
    "Create an account to access the FSJESC Financial Markets Club simulator, competitions, and financial education.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ status?: string; message?: string }>;
}

export default async function CreateAccountPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasError = params.status === "invalid" || params.status === "failed";
  const errorMessage = params.message ?? (params.status === "failed" ? "Failed to create account. Please check your details." : undefined);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-20">
      <Container size="prose">
        <div className="mx-auto max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4 transition-transform hover:scale-105" aria-label="FSJESC FMC Home">
              <FmcLogo variant="mark" height={48} className="mx-auto" />
            </Link>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary leading-relaxed">
              Start trading in the simulation engine with 100,000 MAD in virtual paper-trading capital.
            </p>
          </div>

          {/* Card */}
          <div className="border-rule bg-surface rounded-xl border p-6 shadow-sm sm:p-8">
            {hasError && errorMessage ? (
              <div
                role="alert"
                className="mb-6 rounded-md border border-negative/40 bg-negative-subtle px-4 py-3 text-sm text-foreground"
              >
                <p className="font-medium text-negative">{errorMessage}</p>
              </div>
            ) : null}

            <form action={signUpAction} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1.5">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Youssef El Mansouri"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1.5">
                  Academic or Personal Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@fsjes-casablanca.ma"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1.5">
                  Password (min. 8 characters)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label htmlFor="track" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1.5">
                    Track / Filière
                  </label>
                  <input
                    id="track"
                    name="track"
                    type="text"
                    placeholder="Économie / Gestion"
                    className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </div>

                <div>
                  <label htmlFor="studentId" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary mb-1.5">
                    Student ID (optional)
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="Apogée / CNE"
                    className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" variant="bull" fullWidth size="lg">
                  Create Free Account
                </Button>
              </div>
            </form>

            <div className="border-rule mt-6 border-t pt-5 text-center text-xs text-foreground-secondary">
              Already have an account?{" "}
              <Link href="/sign-in" className="font-medium text-bull hover:text-bull-hover underline underline-offset-4">
                Sign in
              </Link>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-foreground-muted leading-relaxed">
            {DISC_3}
          </p>
        </div>
      </Container>
    </main>
  );
}
