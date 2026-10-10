import { z } from "zod";

/**
 * Event domain model (Part 4.2, §7.8).
 *
 * Pure TypeScript — no database, no React. The same shape is produced by the
 * repository layer and consumed by the application services, so validation rules
 * are stated once and hold whether events come from the database or from demo
 * data (N7, N10).
 */

export const EVENT_FORMATS = ["WORKSHOP", "LECTURE", "DISCUSSION", "PANEL", "COMPETITION"] as const;

export type EventFormat = (typeof EVENT_FORMATS)[number];

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  WORKSHOP: "Workshop",
  LECTURE: "Lecture",
  DISCUSSION: "Discussion",
  PANEL: "Panel",
  COMPETITION: "Competition",
};

export const EVENT_FORMAT_DESCRIPTIONS: Record<EventFormat, string> = {
  WORKSHOP: "Hands-on session with exercises",
  LECTURE: "Formal presentation on a defined topic",
  DISCUSSION: "Open discussion between participants",
  PANEL: "Several speakers on one question",
  COMPETITION: "Briefing for an upcoming challenge",
};

export interface EventRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  format: EventFormat;
  /** UTC (Part 1.4). */
  startAt: Date;
  endAt: Date;
  location: string | null;
  room: string | null;
  speaker: string | null;
  /** `null` means unlimited capacity. */
  capacity: number | null;
  registrationOpen: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const eventFormatSchema = z.enum(EVENT_FORMATS);

export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters").max(160),
    description: z.string().trim().min(20, "Description must be at least 20 characters").max(5_000),
    format: eventFormatSchema,
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    location: z.string().trim().max(200).nullish(),
    room: z.string().trim().max(120).nullish(),
    speaker: z.string().trim().max(200).nullish(),
    capacity: z.number().int().positive().max(10_000).nullish(),
    registrationOpen: z.boolean().default(true),
  })
  .refine((value) => value.endAt > value.startAt, {
    message: "The end time must be after the start time",
    path: ["endAt"],
  })
  .refine((value) => value.endAt.getTime() - value.startAt.getTime() <= 24 * 60 * 60 * 1_000, {
    message: "An event cannot span more than 24 hours",
    path: ["endAt"],
  });

export type EventInput = z.input<typeof eventInputSchema>;
export type EventUpdateInput = Partial<EventInput> & { slug?: string };

/**
 * A short, URL-safe identifier. Slugs are user-visible in `/events/[slug]`, so
 * they are generated rather than typed by hand and validated on the way in.
 */
export const eventSlugSchema = z
  .string()
  .min(3)
  .max(120)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "must be lowercase alphanumeric words separated by single hyphens",
  );

export function slugifyEventTitle(title: string): string {
  const base = title
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
  return base.length >= 3 ? base : `event-${base.length}`;
}

/**
 * Registration availability, derived — never stored as a separate flag that
 * could disagree with `capacity` and `registrationOpen`.
 */
export function registrationStatus(
  event: EventRecord,
  registeredCount: number,
  now: Date,
): "open" | "full" | "closed" | "started" | "ended" {
  if (now >= event.endAt) return "ended";
  if (now >= event.startAt) return "started";
  if (!event.registrationOpen) return "closed";
  if (event.capacity !== null && registeredCount >= event.capacity) return "full";
  return "open";
}

export function canRegister(event: EventRecord, registeredCount: number, now: Date): boolean {
  return registrationStatus(event, registeredCount, now) === "open";
}

export function spotsRemaining(event: EventRecord, registeredCount: number): number | null {
  if (event.capacity === null) return null;
  return Math.max(event.capacity - registeredCount, 0);
}

/** Upcoming first, soonest first. Used by the homepage and the events index. */
export function sortByStartAsc(events: readonly EventRecord[]): EventRecord[] {
  return [...events].sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
}

export function splitByTime(
  events: readonly EventRecord[],
  now: Date,
): { upcoming: EventRecord[]; past: EventRecord[] } {
  const upcoming: EventRecord[] = [];
  const past: EventRecord[] = [];
  for (const event of events) {
    (event.endAt > now ? upcoming : past).push(event);
  }
  return {
    upcoming: sortByStartAsc(upcoming),
    past: [...past].sort((a, b) => b.startAt.getTime() - a.startAt.getTime()),
  };
}
