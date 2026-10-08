import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Container, DetailRow, Section } from "@/components/layout/container";
import { SimulatedMarker } from "@/components/ui/disclaimer";
import { DEMO_EVENTS } from "@/data/events";
import {
  EVENT_FORMAT_DESCRIPTIONS,
  EVENT_FORMAT_LABELS,
  registrationStatus,
  spotsRemaining,
} from "@/domain/events/event";
import { formatDate, formatDateTimeLong } from "@/lib/format";
import { SITE } from "@/config/site";

/**
 * Event detail (Part 7.8).
 *
 * `generateStaticParams` prerenders one page per demo event. Unknown slugs render
 * the platform 404 page via the `notFound()` call in the page body, and the 404
 * itself declares `robots: noindex`.
 *
 * Known limitation, recorded in DECISIONS.md D15: under Cache Components a
 * parameter that is not in `generateStaticParams` is rendered on demand, and by the
 * time `notFound()` runs the response has already begun streaming — so the HTTP
 * status is 200 even though the body is the 404 page. The status cannot be changed
 * at that point in the lifecycle.
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return DEMO_EVENTS.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: PageProps<"/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = DEMO_EVENTS.find((candidate) => candidate.slug === slug);

  if (!event) {
    return { title: "Event not found", robots: { index: false, follow: false } };
  }

  const description = event.description.slice(0, 160);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      type: "article",
      title: event.title,
      description,
      url: `/events/${event.slug}`,
      publishedTime: event.createdAt.toISOString(),
      modifiedTime: event.updatedAt.toISOString(),
    },
  };
}

export default async function EventDetailPage({ params }: PageProps<"/events/[slug]">) {
  const { slug } = await params;
  const event = DEMO_EVENTS.find((candidate) => candidate.slug === slug);
  if (!event) notFound();

  // Same deterministic reference time as the index, so the status badge agrees
  // between the two pages.
  const now = referenceNow();
  const status = registrationStatus(event, 0, now);
  const remaining = spotsRemaining(event, 0);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    startDate: event.startAt.toISOString(),
    endDate: event.endAt.toISOString(),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: event.location ?? SITE.campus,
    },
    organizer: { "@type": "Organization", name: SITE.name },
  };

  return (
    <main id="main-content" className="flex-1">
      <script
        type="application/ld+json"
        // Serialised from a literal object built above — no user input reaches
        // this string, so there is no injection surface.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <Container className="py-16">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/"
                className="text-foreground-secondary hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Home
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li>
              <Link
                href="/events"
                className="text-foreground-secondary hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Events
              </Link>
            </li>
          </ol>
        </nav>

        <div className="grid gap-12 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <article>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="accent">{EVENT_FORMAT_LABELS[event.format]}</Badge>
              <StatusBadge status={status} />
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
              {event.title}
            </h1>

            <p className="text-foreground-secondary mt-3 text-sm">
              {EVENT_FORMAT_DESCRIPTIONS[event.format]}
            </p>

            <div className="text-foreground-secondary mt-8 space-y-4 text-base leading-relaxed">
              {event.description.split("\n\n").map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            <Section spacing="tight" className="px-0 sm:px-0">
              <h2 className="text-base font-semibold tracking-tight">Who this session is for</h2>
              <p className="text-foreground-secondary mt-2 text-sm leading-relaxed">
                Open to all students of the faculty. No prior market experience is assumed; sessions
                state their prerequisites in the description above.
              </p>
            </Section>

            <Section spacing="tight" className="px-0 sm:px-0">
              <h2 className="text-base font-semibold tracking-tight">What you will take away</h2>
              <ul className="text-foreground-secondary mt-3 space-y-2 text-sm leading-relaxed">
                <li className="flex gap-3">
                  <span aria-hidden className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />A
                  working definition of the concepts the session covers, in your own notes.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />A
                  worked example for each formula used, so the arithmetic is not a black box.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden className="bg-accent mt-2 size-1.5 shrink-0 rounded-full" />
                  An explicit statement of what each measure does not tell you.
                </li>
              </ul>
            </Section>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card padding="lg">
              <CardHeader>
                <CardTitle>Session details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="divide-border divide-y">
                  <DetailRow label="Date">{formatDate(event.startAt)}</DetailRow>
                  <DetailRow label="Starts">{formatDateTimeLong(event.startAt)}</DetailRow>
                  <DetailRow label="Ends">{formatDateTimeLong(event.endAt)}</DetailRow>
                  {event.location ? <DetailRow label="Location">{event.location}</DetailRow> : null}
                  {event.room ? <DetailRow label="Room">{event.room}</DetailRow> : null}
                  {event.speaker ? <DetailRow label="Speaker">{event.speaker}</DetailRow> : null}
                  <DetailRow label="Format">{EVENT_FORMAT_LABELS[event.format]}</DetailRow>
                  <DetailRow label="Capacity">
                    {event.capacity === null ? "Open attendance" : `${event.capacity} places`}
                  </DetailRow>
                  {remaining !== null ? (
                    <DetailRow label="Places left">{remaining}</DetailRow>
                  ) : null}
                </dl>

                <div className="mt-6">
                  {status === "open" ? (
                    <Button asChild fullWidth>
                      <Link href="/create-account">Register — sign in to continue</Link>
                    </Button>
                  ) : (
                    <Button fullWidth disabled>
                      {status === "full"
                        ? "Session at capacity"
                        : status === "closed"
                          ? "Registration closed"
                          : status === "started"
                            ? "Session in progress"
                            : "Session finished"}
                    </Button>
                  )}
                </div>

                <p className="text-foreground-muted mt-3 text-xs leading-relaxed">
                  Registration requires an account so the club can contact attendees about changes.
                </p>
              </CardContent>
            </Card>

            <Alert tone="neutral" title="About club events">
              <p>
                Sessions are run by student volunteers on a best-effort basis. If a session has to
                be moved, registered members are contacted by email.
              </p>
            </Alert>

            <SimulatedMarker variant="inline" />
          </aside>
        </div>
      </Container>
    </main>
  );
}

function StatusBadge({ status }: { status: ReturnType<typeof registrationStatus> }) {
  switch (status) {
    case "open":
      return <Badge tone="positive">Registration open</Badge>;
    case "full":
      return <Badge tone="warning">At capacity</Badge>;
    case "closed":
      return <Badge tone="neutral">Registration closed</Badge>;
    case "started":
      return <Badge tone="neutral">In progress</Badge>;
    case "ended":
      return <Badge tone="neutral">Finished</Badge>;
    default:
      return null;
  }
}

function referenceNow(): Date {
  const first = DEMO_EVENTS[0];
  if (!first) return new Date(0);
  const latest = DEMO_EVENTS.reduce(
    (max, event) => (event.startAt > max ? event.startAt : max),
    first.startAt,
  );
  return new Date(latest.getTime() - 2 * 86_400_000);
}
