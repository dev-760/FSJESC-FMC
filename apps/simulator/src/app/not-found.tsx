import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@fsjesc/ui/button";
import { Container } from "@fsjesc/ui/layout/container";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { DISC_3 } from "@fsjesc/config/site";
import { landingUrl } from "@fsjesc/config/app-urls";

export const metadata: Metadata = {
  title: "Instrument or workstation not found",
  description:
    "The requested simulator page or instrument ticker does not exist on the FSJESC Financial Markets Club platform.",
  robots: { index: false, follow: true },
};

export default function SimulatorNotFound() {
  return (
    <main id="main-content" className="flex-1">
      <Suspense fallback={null}>
        <SimulatorNav />
      </Suspense>
      <Container size="prose" className="flex flex-col items-center py-24 text-center">
        <p className="numeric text-foreground-muted text-sm font-semibold tracking-widest">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Workstation or ticker not found
        </h1>
        <p className="text-foreground-secondary mt-4 text-base leading-relaxed">
          The instrument symbol or simulator page you requested is not listed in the active
          Casablanca simulation catalog.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/market">Browse Market Catalog</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/dashboard">Open Trading Dashboard</Link>
          </Button>
          <Button asChild variant="secondary">
            <a href={landingUrl()}>Return to Club Site</a>
          </Button>
        </div>

        <p className="border-rule text-foreground-muted mt-12 max-w-prose border-t pt-6 text-xs leading-relaxed">
          {DISC_3}
        </p>
      </Container>
    </main>
  );
}
