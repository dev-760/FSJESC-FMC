import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { signInAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { simulatorUrl } from "@fsjesc/config/app-urls";
import { DISC_3, SITE } from "@fsjesc/config/site";

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
  const successNotice =
    params.status === "reset"
      ? "Password updated. Sign in with your new password."
      : params.status === "verified"
        ? "Email verified. You can sign in now."
        : null;
  const errorMessage =
    params.message ?? (params.status === "failed" ? "Invalid email or password." : undefined);

  return (
    <main id="main-content" className="hero-mesh flex-1 py-10 md:py-16">
      <Container size="default">
        <div className="border-rule-strong/80 bg-surface mx-auto grid max-w-5xl overflow-hidden rounded-[22px] border shadow-lg lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left Editorial Brand Panel (.auth-brand from Landing.html) */}
          <div
            className="relative flex flex-col justify-between p-8 text-[#F0EBE0] sm:p-10"
            style={{
              backgroundImage:
                "radial-gradient(460px 260px at 85% 12%, rgba(200, 155, 60, 0.22), transparent 60%), linear-gradient(155deg, #0B1B2B 0%, #142944 100%)",
            }}
          >
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2.5"
                aria-label="FSJESC FMC Home"
              >
                <FmcLogo variant="mark" height={34} />
                <span className="font-serif text-lg font-bold tracking-tight text-[#FAF6EF]">
                  {SITE.shortName}
                </span>
              </Link>

              <div className="mt-8">
                <span className="numeric inline-block rounded-full border border-white/15 bg-white/8 px-2.5 py-0.5 text-2xs font-semibold tracking-wider text-[#D4A94F] uppercase">
                  Student Terminal Access
                </span>
                <h2 className="mt-3 font-serif text-2xl leading-snug font-semibold text-[#FAF6EF] sm:text-3xl">
                  Resume your simulated portfolio and cohort challenges.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1]">
                  Sign in to trade 38 Bourse de Casablanca equities and 72 global instruments in
                  Moroccan dirhams, track your T+2 settlement ledger, and submit competition orders.
                </p>
              </div>

              <ul className="mt-7 space-y-3 text-xs text-[#E2E8F0]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">100,000.00 MAD</strong> starting
                    paper-trading capital with integer-centime precision
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">110 instruments</strong> across CSE
                    Casablanca, US equities, ETFs, futures, FX, crypto &amp; BDT bonds
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">Risk-adjusted scoring</strong> on
                    total return, Sharpe ratio, and maximum drawdown
                  </span>
                </li>
              </ul>
            </div>

            <div className="mt-8 border-t border-white/12 pt-4 text-2xs leading-relaxed text-[#94A3B8]">
              <p className="flex items-center gap-1.5 font-medium text-[#CBD5E1]">
                <ShieldCheck aria-hidden="true" className="size-3.5 text-[#D4A94F]" />
                <span>{SITE.campus}</span>
              </p>
              <p className="mt-1">{DISC_3}</p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="bg-surface flex flex-col justify-center p-7 sm:p-10">
            <div>
              <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                Sign in to your account
              </h1>
              <p className="text-foreground-secondary mt-1.5 text-sm leading-relaxed">
                Enter your credentials to open the simulator and research portal.
              </p>
            </div>

            {successNotice ? (
              <div
                role="status"
                className="mt-5 rounded-lg border border-positive/40 bg-positive-subtle px-4 py-3 text-sm"
              >
                <p className="text-positive font-medium">{successNotice}</p>
              </div>
            ) : null}

            {hasError && errorMessage ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
              >
                <p className="text-negative font-medium">{errorMessage}</p>
              </div>
            ) : null}

            <form action={signInAction} className="mt-6 space-y-5">
              <input
                type="hidden"
                name="callbackUrl"
                value={params.callbackUrl ?? simulatorUrl()}
              />

              <div>
                <label
                  htmlFor="email"
                  className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                >
                  Academic or personal email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@fsjes-casablanca.ma"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="text-foreground-secondary block text-xs font-semibold tracking-wider uppercase"
                  >
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-bull hover:text-bull-hover text-xs font-medium underline underline-offset-4"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div className="pt-1">
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Sign in
                </Button>
              </div>
            </form>

            <div className="border-rule text-foreground-secondary mt-6 border-t pt-5 text-center text-xs">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/create-account"
                className="text-bull hover:text-bull-hover font-semibold underline underline-offset-4"
              >
                Create a student account
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
