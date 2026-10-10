import type { Metadata } from "next";
import Link from "next/link";
import { signInAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { DISC_3 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to the FSJESC Financial Markets Club platform to access your simulated portfolio, competitions, and market research.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ status?: string; message?: string; callbackUrl?: string }>;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const hasError = params.status === "invalid" || params.status === "failed";
  const errorMessage = params.message ?? (params.status === "failed" ? "Invalid email or password." : undefined);

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
              Sign in to your account
            </h1>
            <p className="mt-2 text-sm text-foreground-secondary leading-relaxed">
              Access your simulated portfolio, live quotes, competitions, and market research.
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

            <form action={signInAction} className="space-y-5">
              <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? "/simulator"} />

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
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
                    Password
                  </label>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="bull" fullWidth size="lg">
                  Sign In
                </Button>
              </div>
            </form>

            <div className="border-rule mt-6 border-t pt-5 text-center text-xs text-foreground-secondary">
              Don&apos;t have an account yet?{" "}
              <Link href="/create-account" className="font-medium text-bull hover:text-bull-hover underline underline-offset-4">
                Create an account
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
