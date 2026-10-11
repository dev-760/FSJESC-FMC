import type { Metadata } from "next";
import Link from "next/link";
import { verifyEmailAction } from "../actions";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { FmcLogo } from "@fsjesc/ui/brand/fmc-mark";
import { DISC_3 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm the email address on your FSJESC Financial Markets Club account.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ token?: string; status?: string; message?: string }>;
}

export default async function VerifyEmailPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = params.token ?? "";
  const hasError = params.status === "failed";
  const errorMessage =
    params.message ??
    (hasError ? "This verification link is invalid or has expired." : undefined);

  return (
    <main id="main-content" className="flex-1 py-12 md:py-20">
      <Container size="prose">
        <div className="mx-auto max-w-md">
          <div className="mb-8 text-center">
            <Link href="/" className="mb-4 inline-block" aria-label="FSJESC FMC Home">
              <FmcLogo variant="mark" height={48} className="mx-auto" />
            </Link>
            <h1 className="text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
              Verify your email
            </h1>
            <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
              Confirm that this address belongs to you. Verification keeps account recovery working.
            </p>
          </div>

          <div className="border-rule bg-surface rounded-lg border p-6 sm:p-8">
            {!token ? (
              <div
                role="alert"
                className="rounded-md border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
              >
                <p className="text-negative font-medium">This verification link is incomplete.</p>
                <p className="text-foreground-secondary mt-1">
                  Open the link from your email, or{" "}
                  <Link href="/sign-in" className="text-bull underline underline-offset-4">
                    sign in
                  </Link>{" "}
                  to continue.
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

                <form action={verifyEmailAction} className="space-y-5">
                  <input type="hidden" name="token" value={token} />
                  <Button type="submit" variant="primary" fullWidth size="lg">
                    Confirm email address
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
