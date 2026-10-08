import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/layout/container";
import { EmptyState } from "@/components/ui/feedback";
import { SIMULATOR } from "@/data/assets";

export const metadata: Metadata = {
  title: "All topics",
  description: "Every published topic in the FSJESC Financial Markets Club education centre.",
  alternates: { canonical: "/education/topics" },
};

/**
 * Topic index.
 *
 * The topic library lands in Phase 3. This route exists now so the sitemap and
 * the education links resolve, and it reads the same content directory the
 * renderer will use, so adding a Markdown file is all that is required.
 */
export default async function TopicsIndexPage() {
  const slugs = await listTopicSlugs();

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-16">
        <SectionHeading
          as="h1"
          title="All topics"
          lead="Ordered so that each topic builds on the previous one. Read them in order if the mechanics are new to you."
          actions={
            <Link
              href="/education"
              className="text-accent-text focus-visible:outline-ring rounded text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              About the education centre
            </Link>
          }
        />

        <Section spacing="tight" className="px-0 sm:px-0">
          {slugs.length === 0 ? (
            <EmptyState
              title="No topics published yet"
              description="The topic library is being written. Sessions and the simulator are available now if you would rather start there."
              action={
                <Link
                  href="/events"
                  className="text-accent-text rounded text-sm underline underline-offset-4"
                >
                  See upcoming sessions
                </Link>
              }
            />
          ) : (
            <ul className="divide-border border-border divide-y border-y">
              {slugs.map((slug) => (
                <li key={slug}>
                  <Link
                    href={`/education/topics/${slug}`}
                    className="hover:bg-surface-subtle focus-visible:outline-ring flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2"
                  >
                    <span className="text-base font-medium">{humanise(slug)}</span>
                    <Badge>Read</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section spacing="tight" className="px-0 sm:px-0">
          <h2 className="text-base font-semibold tracking-tight">While you wait</h2>
          <p className="text-foreground-secondary mt-2 max-w-prose text-sm leading-relaxed">
            The simulator is the fastest way to see the mechanics the education programme describes.
            A new portfolio starts with 100,000 MAD of simulated capital across {SIMULATOR.length}{" "}
            fictional instruments.
          </p>
        </Section>
      </Container>
    </main>
  );
}

async function listTopicSlugs(): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(process.cwd(), "src/content/topics"), {
      withFileTypes: true,
    });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""))
      .sort();
  } catch {
    // The content directory is created in Phase 3.
    return [];
  }
}

function humanise(slug: string): string {
  const first = slug.split("-")[0] ?? slug;
  return (
    first.charAt(0).toUpperCase() + first.slice(1) + slug.slice(first.length).replace(/-/g, " ")
  );
}
