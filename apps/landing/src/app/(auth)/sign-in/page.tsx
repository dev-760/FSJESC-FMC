import type { Metadata } from "next";
import Link from "next/link";
import { signInAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { simulatorUrl } from "@fsjesc/config/app-urls";
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
  const successNotice =
    params.status === "reset"
      ? "Password updated. Sign in with your new password."
      : params.status === "verified"
        ? "Email verified. You can sign in now."
        : null;
  const errorMessage =
    params.message ?? (params.status === "failed" ? "Invalid email or password." : undefined);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-20">
      <Container size="prose">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-block" aria-label="FSJESC FMC Home">
              <FmcLogo variant="mark" height={48} className="mx-auto" />
            </Link>
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Sign in to your account
            </h1>
            <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
              Access your simulated portfolio, live quotes, competitions, and market research.
            </p>
          </div>

          <div className="border-rule bg-surface rounded-lg border p-6 sm:p-8">
            {successNotice ? (
              <div
                role="status"
                className="mb-6 rounded-md border border-positive/40 bg-positive-subtle px-4 py-3 text-sm"
              >
                <p className="text-positive font-medium">{successNotice}</p>
              </div>
            ) : null}

            {hasError && errorMessage ? (
              <div
                role="alert"
                className="mb-6 rounded-md border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
              >
                <p className="text-negative font-medium">{errorMessage}</p>
              </div>
            ) : null}

            <form action={signInAction} className="space-y-5">
              <input type="hidden" name="callbackUrl" value={params.callbackUrl ?? simulatorUrl()} />

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
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
                  className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" fullWidth size="lg">
                  Sign in
                </Button>
              </div>
            </form>

            <div className="border-rule text-foreground-secondary mt-6 border-t pt-5 text-center text-xs">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/create-account"
                className="text-bull hover:text-bull-hover font-medium underline underline-offset-4"
              >
                Create an account
              </Link>
            </div>
          </div>

          <p className="text-foreground-muted mt-8 text-center text-xs leading-relaxed">{DISC_3}</p>
        </div>
      </Container>
    </main>
  );
}
