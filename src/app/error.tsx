"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logServerError } from "@/lib/errors";

/**
 * Global error boundary.
 *
 * Deliberately shows no stack trace, no digest internals, and no exception
 * message: those go to the server log, and the visitor gets a plain sentence and
 * a way forward (Part 8.6).
 *
 * `reset` retries the render without a full reload, which is the right recovery
 * for a transient server-side failure.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logServerError("app/error-boundary", error);
  }, [error]);

  return (
    <main id="main-content" className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-24">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="text-foreground-secondary mt-4 text-base leading-relaxed">
        The page could not be displayed because of an unexpected error. Nothing you did caused this.
        You can try again, or return to the home page.
      </p>
      <p className="text-foreground-muted mt-2 text-xs">
        If it keeps happening, please tell us what you were doing so we can investigate.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/">Back to home</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/contact">Report a problem</Link>
        </Button>
      </div>
    </main>
  );
}
