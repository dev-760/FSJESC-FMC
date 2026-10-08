import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Container, Section } from "@/components/layout/container";

/**
 * Placeholder for a surface that arrives in a later phase.
 *
 * Links in the navigation and on the homepage point here so that no advertised
 * destination is a dead end. The page states plainly what is not yet built rather
 * than presenting an empty shell that looks like a broken feature.
 */
export function PhasePlaceholder({
  phase,
  title,
  summary,
  whatIsComing,
  alternative,
}: {
  phase: string;
  title: string;
  summary: string;
  whatIsComing: readonly string[];
  alternative: { href: string; label: string };
}) {
  return (
    <main id="main-content" className="flex-1">
      <Container size="prose" className="py-20">
        <p className="text-2xs text-foreground-muted font-semibold tracking-widest uppercase">
          Arriving in {phase}
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-foreground-secondary mt-4 text-base leading-relaxed">{summary}</p>

        <div className="border-border-strong bg-surface-subtle mt-10 rounded-lg border border-dashed p-6">
          <h2 className="text-sm font-semibold tracking-tight">What will be here</h2>
          <ul className="text-foreground-secondary mt-3 space-y-2 text-sm leading-relaxed">
            {whatIsComing.map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <Section spacing="tight" className="px-0 sm:px-0">
          <h2 className="text-sm font-semibold tracking-tight">Available now</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href={alternative.href}>{alternative.label}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
        </Section>
      </Container>
    </main>
  );
}

export const placeholderMetadata = (title: string, description: string): Metadata => ({
  title,
  description,
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
});
