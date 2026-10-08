import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { DISC_3 } from "@/config/site";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "The page you requested does not exist on the FSJESC Financial Markets Club platform.",
  robots: { index: false, follow: true },
};

/**
 * 404.
 *
 * Indexable-crawl-safe and honest: it states that the page does not exist rather
 * than implying the content is coming, and offers the destinations a lost visitor
 * actually needs.
 */
export default function NotFound() {
  return (
    <main id="main-content" className="flex-1">
      <Container size="prose" className="flex flex-col items-center py-24 text-center">
        <p className="numeric text-foreground-muted text-sm font-semibold tracking-widest">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Page not found</h1>
        <p className="text-foreground-secondary mt-4 text-base leading-relaxed">
          The address you requested does not exist on this platform. It may have been mistyped, or
          the page may have been moved.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to home</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/education">Browse the education centre</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/contact">Contact the club</Link>
          </Button>
        </div>

        <p className="border-border text-foreground-muted mt-12 max-w-prose border-t pt-6 text-xs leading-relaxed">
          {DISC_3}
        </p>
      </Container>
    </main>
  );
}
