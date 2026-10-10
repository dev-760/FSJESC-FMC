"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@fsjesc/ui/button";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { landingUrl } from "@fsjesc/config/app-urls";

/**
 * Simulator global error boundary.
 *
 * Catches client-side errors in the terminal workstations and provides a recovery
 * reset button or navigation back to the Terminal Hub.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Simulator workstation error:", error);
  }, [error]);

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-16">
        <div className="rounded-lg border border-bear bg-bear-subtle/30 p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-bear">
            Terminal workstation error
          </h1>
          <p className="mt-3 text-sm text-foreground-secondary leading-relaxed">
            The requested trading terminal view encountered an unexpected issue while communicating
            with the simulation engine. Your simulated cash and portfolio ledger remain secure.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={reset} variant="bull">
              Reset workstation
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Terminal Hub</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href={landingUrl()}>Club Portal</Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
