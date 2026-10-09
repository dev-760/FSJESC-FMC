import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { DetailRow } from "@/components/layout/container";
import { formatDate, formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  EVENT_FORMAT_DESCRIPTIONS,
  EVENT_FORMAT_LABELS,
  registrationStatus,
  spotsRemaining,
  type EventRecord,
} from "@/domain/events/event";

/**
 * Event card.
 *
 * Shows what a visitor needs to decide whether to attend: format, date and time in
 * the site's timezone, location, capacity, and whether registration is possible.
 * Registration state is computed from `capacity`, `registrationOpen` and `now`
 * together, so the badge can never contradict the page behind it.
 */
export function EventCard({
  event,
  registeredCount = 0,
  now,
  className,
}: {
  event: EventRecord;
  registeredCount?: number;
  now: Date;
  className?: string;
}) {
  const status = registrationStatus(event, registeredCount, now);
  const remaining = spotsRemaining(event, registeredCount);

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">{EVENT_FORMAT_LABELS[event.format]}</Badge>
            <StatusBadge status={status} />
          </div>
          <CardTitle className="text-lg">
            <Link
              href={`/events/${event.slug}`}
              className="focus-visible:outline-ring rounded hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {event.title}
            </Link>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1">
        <p className="text-foreground-secondary line-clamp-3 text-sm leading-relaxed">
          {event.description}
        </p>
        <dl className="divide-rule border-rule mt-4 divide-y border-y text-sm">
          <DetailRow label="Date">{formatDate(event.startAt)}</DetailRow>
          <DetailRow label="Time">
            <span className="numeric">
              {formatTime(event.startAt)} – {formatTime(event.endAt)}
            </span>
          </DetailRow>
          {event.location ? <DetailRow label="Location">{event.location}</DetailRow> : null}
          {event.speaker ? <DetailRow label="Speaker">{event.speaker}</DetailRow> : null}
        </dl>
      </CardContent>

      <CardFooter>
        <Button asChild variant="secondary" size="sm">
          <Link href={`/events/${event.slug}`}>
            View details<span className="sr-only"> for {event.title}</span>
          </Link>
        </Button>
        {event.capacity !== null ? (
          <p className="text-foreground-muted text-xs">
            {remaining === 0 ? "At capacity" : `${remaining} of ${event.capacity} places available`}
          </p>
        ) : (
          <p className="text-foreground-muted text-xs">Open attendance</p>
        )}
      </CardFooter>
    </Card>
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

/**
 * Compact event row for the homepage section. Deliberately less detailed than the
 * card: the homepage advertises the next session, it does not replace the events
 * page.
 */
export function EventSummaryRow({ event, now }: { event: EventRecord; now: Date }) {
  const status = registrationStatus(event, 0, now);
  return (
    <li className="border-rule flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b py-4 last:border-b-0">
      <div className="min-w-0 flex-1">
        <Link
          href={`/events/${event.slug}`}
          className="focus-visible:outline-ring rounded text-sm font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {event.title}
        </Link>
        <p className="text-foreground-secondary mt-0.5 text-xs">
          {EVENT_FORMAT_LABELS[event.format]} · {EVENT_FORMAT_DESCRIPTIONS[event.format]} ·{" "}
          {event.location ?? "Location to be confirmed"}
        </p>
      </div>
      <p className="numeric text-foreground-secondary shrink-0 text-xs">
        {formatDate(event.startAt)}, {formatTime(event.startAt)}
      </p>
      <span className="shrink-0">
        {status === "open" ? (
          <Badge tone="positive">Open</Badge>
        ) : status === "full" ? (
          <Badge tone="warning">Full</Badge>
        ) : (
          <Badge tone="neutral">Closed</Badge>
        )}
      </span>
    </li>
  );
}

export function NoEventsEmptyState() {
  return (
    <EmptyState
      icon={<CalendarPlaceholder />}
      title="No events scheduled at the moment"
      description="The club runs sessions through the academic year. Check back for the next workshop, or contact us to propose a topic."
    />
  );
}

/** Neutral calendar glyph. Illustrations that carry no information are avoided. */
function CalendarPlaceholder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-8" aria-hidden focusable="false">
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 10h18M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
