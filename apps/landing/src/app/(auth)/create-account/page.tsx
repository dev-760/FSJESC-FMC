import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { signUpAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { AUTH_CONFIG, DISC_3, SITE } from "@fsjesc/config/site";

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
  const errorMessage =
    params.message ??
    (params.status === "failed"
      ? "Failed to create account. Please check your details."
      : undefined);

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
                  Free Student Registration
                </span>
                <h2 className="mt-3 font-serif text-2xl leading-snug font-semibold text-[#FAF6EF] sm:text-3xl">
                  Start with 100,000 MAD in simulated capital.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-[#CBD5E1]">
                  Open a paper-trading portfolio built for students at {SITE.campusShort}. Practice
                  order execution, analyse Bourse de Casablanca sectors, and compete in cohort
                  macroeconomic challenges.
                </p>
              </div>

              <ul className="mt-7 space-y-3 text-xs text-[#E2E8F0]">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">Immediate 100,000.00 MAD</strong>{" "}
                    paper-trading balance upon registration
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">20-topic curriculum</strong> with
                    comprehension checks and worked MAD arithmetic
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[#34C792]" />
                  <span>
                    <strong className="font-semibold text-white">Zero financial risk</strong> — no
                    real money, deposits, or brokerage fees ever
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
                Create your student account
              </h1>
              <p className="text-foreground-secondary mt-1.5 text-sm leading-relaxed">
                Complete your profile to initialize your simulated portfolio and challenge access.
              </p>
            </div>

            {hasError && errorMessage ? (
              <div
                role="alert"
                className="mt-5 rounded-lg border border-negative/40 bg-negative-subtle px-4 py-3 text-sm text-foreground"
              >
                <p className="font-medium text-negative">{errorMessage}</p>
              </div>
            ) : null}

            <form action={signUpAction} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Youssef El Mansouri"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                >
                  Academic or Personal Email
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
                <label
                  htmlFor="password"
                  className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                >
                  Password (min. {AUTH_CONFIG.minPasswordLength} characters)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={AUTH_CONFIG.minPasswordLength}
                  maxLength={AUTH_CONFIG.maxPasswordLength}
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="track"
                    className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                  >
                    Track / Filière
                  </label>
                  <input
                    id="track"
                    name="track"
                    type="text"
                    placeholder="Économie / Gestion"
                    className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </div>

                <div>
                  <label
                    htmlFor="studentId"
                    className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                  >
                    Student ID (optional)
                  </label>
                  <input
                    id="studentId"
                    name="studentId"
                    type="text"
                    placeholder="Apogée / CNE"
                    className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-lg border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Create account
                </Button>
              </div>
            </form>

            <div className="border-rule text-foreground-secondary mt-6 border-t pt-5 text-center text-xs">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-bull hover:text-bull-hover font-semibold underline underline-offset-4"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
