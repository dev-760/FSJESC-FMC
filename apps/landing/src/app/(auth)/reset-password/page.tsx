import type { Metadata } from "next";
import Link from "next/link";
import { resetPasswordAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { AUTH_CONFIG, DISC_3 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your FSJESC Financial Markets Club account.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string; status?: string; message?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const hasError = params.status === "invalid" || params.status === "failed";
  const errorMessage =
    params.message ??
    (params.status === "failed" ? "This reset link is invalid or has expired." : undefined);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-20">
      <Container size="prose">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-block" aria-label="FSJESC FMC Home">
              <FmcLogo variant="mark" height={48} className="mx-auto" />
            </Link>
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Choose a new password
            </h1>
            <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
              Use at least {AUTH_CONFIG.minPasswordLength} characters. After saving, you will sign in
              with the new password.
            </p>
          </div>

          <div className="border-rule bg-surface rounded-lg border p-6 sm:p-8">
            {!token ? (
              <div
                role="alert"
                className="rounded-md border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
              >
                <p className="text-negative font-medium">This reset link is incomplete.</p>
                <p className="text-foreground-secondary mt-1">
                  Request a new link from the{" "}
                  <Link href="/forgot-password" className="text-bull underline underline-offset-4">
                    forgot password
                  </Link>{" "}
                  page.
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

                <form action={resetPasswordAction} className="space-y-5">
                  <input type="hidden" name="token" value={token} />

                  <div>
                    <label
                      htmlFor="password"
                      className="text-foreground-secondary mb-1.5 block text-xs font-semibold tracking-wider uppercase"
                    >
                      New password
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
                      className="focus-visible:outline-ring border-rule bg-canvas text-foreground placeholder:text-foreground-muted w-full rounded-md border px-3.5 py-2.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                    />
                  </div>

                  <Button type="submit" variant="primary" fullWidth size="lg">
                    Save new password
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
