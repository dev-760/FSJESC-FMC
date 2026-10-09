import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Container, Section, SectionHeading } from "@/components/layout/container";
import { EventCard, NoEventsEmptyState } from "@/components/events/event-card";
import { DEMO_EVENTS } from "@/data/events";
import { splitByTime, EVENT_FORMAT_LABELS } from "@/domain/events/event";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  title: "Events",
  description: `Workshops, lectures and discussion sessions run by ${SITE.shortName} at ${SITE.campusShort}.`,
  alternates: { canonical: "/events" },
};

/**
 * Events index (Part 7.8).
 *
 * Events are grouped into upcoming and past, and can be filtered by format. The
 * "current time" used to split them comes from `DEMO_EVENTS`' fixed anchor rather
 * than `Date.now()`, so the page prerenders deterministically under Cache
 * Components (D1, D9). Phase 5 replaces the source with the `events` table and a
 * request-time value behind `<Suspense>`.
 */
export default function EventsPage() {
  const now = referenceNow();
  const { upcoming, past } = splitByTime(DEMO_EVENTS, now);
  const formats = [...new Set(DEMO_EVENTS.map((event) => event.format))].sort();

  return (
    <main id="main-content" className="flex-1">
      <Container className="py-16">
        <SectionHeading
          as="h1"
          title="Sessions and workshops"
          lead="Open to all students of the faculty. Where a session needs lab space or a computer room, registration is capped at capacity."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {formats.map((format) => (
                <Badge key={format} tone="neutral">
                  {EVENT_FORMAT_LABELS[format]}
                </Badge>
              ))}
            </div>
          }
        />

        <Section contained={false} spacing="tight">
          <h2 className="text-lg font-semibold tracking-tight">
            Upcoming
            <span className="numeric text-foreground-muted ml-2 text-sm font-normal">
              {upcoming.length}
            </span>
          </h2>
          {upcoming.length === 0 ? (
            <div className="mt-6">
              <NoEventsEmptyState />
            </div>
          ) : (
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} now={now} className="h-full" />
                </li>
              ))}
            </ul>
          )}
        </Section>

        {past.length > 0 ? (
          <Section contained={false}>
            <h2 className="text-lg font-semibold tracking-tight">
              Past sessions
              <span className="numeric text-foreground-muted ml-2 text-sm font-normal">
                {past.length}
              </span>
            </h2>
            <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} now={now} className="h-full opacity-90" />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        <Section contained={false}>
          <div className="border-rule bg-surface-raised rounded-lg border p-6">
            <h2 className="text-base font-semibold tracking-tight">Attending a session</h2>
            <p className="text-foreground-secondary mt-2 max-w-prose text-sm leading-relaxed">
              Registration is handled from each session page. Capacity is enforced on the server, so
              a session that reports places remaining has that many places left. The count cannot
              overshoot capacity even if several people register at once.
            </p>
            <Link
              href="/contact"
              className="text-accent-text focus-visible:outline-ring mt-4 inline-block rounded text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              Ask about a session you would like to see
            </Link>
          </div>
        </Section>
      </Container>
    </main>
  );
}

/**
 * A deterministic reference time for the demo calendar.
 *
 * `DEMO_EVENTS` is built from a fixed anchor, so using the same anchor here keeps
 * the split stable across builds. Phase 5 replaces this with the request time.
 */
function referenceNow(): Date {
  const first = DEMO_EVENTS[0];
  if (!first) return new Date(0);
  const latest = DEMO_EVENTS.reduce(
    (max, event) => (event.startAt > max ? event.startAt : max),
    first.startAt,
  );
  // Two days before the latest demo event, so some sessions are upcoming and some
  // are past on the public site.
  return new Date(latest.getTime() - 2 * 86_400_000);
}
