import type { Metadata } from "next";
import Link from "next/link";
import { forgotPasswordAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { DISC_3 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a password reset link for your FSJESC Financial Markets Club account.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ status?: string; message?: string }>;
}

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sent = params.status === "sent";
  const hasError = params.status === "invalid" || params.status === "failed";
  const errorMessage =
    params.message ??
    (params.status === "failed" ? "Could not process the reset request." : undefined);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-20">
      <Container size="prose">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-block" aria-label="FSJESC FMC Home">
              <FmcLogo variant="mark" height={48} className="mx-auto" />
            </Link>
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Reset your password
            </h1>
            <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
              Enter the email on your account. If it is registered, you will receive a reset link.
            </p>
          </div>

          <div className="border-rule bg-surface rounded-lg border p-6 sm:p-8">
            {sent ? (
              <div
                role="status"
                className="border-rule bg-surface-sunken rounded-md border px-4 py-3 text-sm"
              >
                <p className="text-foreground font-medium">Check your email</p>
                <p className="text-foreground-secondary mt-1 leading-relaxed">
                  If an account exists for that address, a reset link is on its way. The link expires
                  in 30 minutes.
                </p>
              </div>
            ) : (
              <>
                {hasError && errorMessage ? (
                  <div
                    role="alert"
                    className="mb-6 rounded-md border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
                  >
                    <p className="text-negative font-medium">{errorMessage}</p>
                  </div>
                ) : null}

                <form action={forgotPasswordAction} className="space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                    >
                      Email
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

                  <Button type="submit" variant="primary" fullWidth size="lg">
                    Send reset link
                  </Button>
                </form>
              </>
            )}

            <div className="border-rule text-foreground-secondary mt-6 border-t pt-5 text-center text-xs">
              <Link
                href="/sign-in"
                className="text-bull hover:text-bull-hover font-medium underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          </div>

          <p className="text-foreground-muted mt-8 text-center text-xs leading-relaxed">{DISC_3}</p>
        </div>
      </Container>
    </main>
  );
}
