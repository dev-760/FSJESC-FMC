import { describe, expect, it } from "vitest";
import {
  EVENT_FORMATS,
  canRegister,
  eventFormatSchema,
  eventInputSchema,
  eventSlugSchema,
  registrationStatus,
  slugifyEventTitle,
  spotsRemaining,
  splitByTime,
  type EventRecord,
} from "./event";

/**
 * Event domain rules (Part 4.2, §7.8, §11.1).
 */

function makeEvent(overrides: Partial<EventRecord> = {}): EventRecord {
  const startAt = new Date("2026-10-20T09:00:00.000Z");
  return {
    id: "event-1",
    slug: "test-event",
    title: "Test session",
    description: "A session used in these tests.",
    format: "WORKSHOP",
    startAt,
    endAt: new Date(startAt.getTime() + 2 * 3_600_000),
    location: "FSJES Casablanca",
    room: null,
    speaker: null,
    capacity: 10,
    registrationOpen: true,
    createdAt: new Date("2026-09-01T00:00:00.000Z"),
    updatedAt: new Date("2026-09-01T00:00:00.000Z"),
    ...overrides,
  };
}

const BEFORE = new Date("2026-10-19T09:00:00.000Z");
const DURING = new Date("2026-10-20T10:00:00.000Z");
const AFTER = new Date("2026-10-20T12:00:00.000Z");

describe("input validation", () => {
  const valid = {
    title: "Reading financial statements",
    description: "A guided walkthrough of the three primary financial statements.",
    format: "WORKSHOP",
    startAt: "2026-10-20T09:00:00.000Z",
    endAt: "2026-10-20T11:00:00.000Z",
    capacity: 40,
    registrationOpen: true,
  };

  it("accepts a well-formed event", () => {
    const parsed = eventInputSchema.parse(valid);
    expect(parsed.startAt).toBeInstanceOf(Date);
    expect(parsed.title).toBe("Reading financial statements");
  });

  it("rejects a short title", () => {
    expect(() => eventInputSchema.parse({ ...valid, title: "Ab" })).toThrow();
  });

  it("rejects a short description", () => {
    expect(() => eventInputSchema.parse({ ...valid, description: "Too short" })).toThrow();
  });

  it("rejects an unknown format", () => {
    expect(() => eventInputSchema.parse({ ...valid, format: "WEBINAR" })).toThrow();
    for (const format of EVENT_FORMATS) {
      expect(eventFormatSchema.safeParse(format).success).toBe(true);
    }
  });

  it("rejects an end time before the start", () => {
    expect(() => eventInputSchema.parse({ ...valid, endAt: "2026-10-20T08:00:00.000Z" })).toThrow(
      /end time must be after/i,
    );
  });

  it("rejects an event spanning more than a day", () => {
    expect(() => eventInputSchema.parse({ ...valid, endAt: "2026-10-21T10:00:00.000Z" })).toThrow(
      /cannot span more than 24 hours/i,
    );
  });

  it("rejects a non-positive or absurd capacity", () => {
    expect(() => eventInputSchema.parse({ ...valid, capacity: 0 })).toThrow();
    expect(() => eventInputSchema.parse({ ...valid, capacity: -5 })).toThrow();
    expect(() => eventInputSchema.parse({ ...valid, capacity: 10_001 })).toThrow();
  });

  it("treats capacity and location as optional", () => {
    const parsed = eventInputSchema.parse({
      ...valid,
      capacity: undefined,
      location: undefined,
      room: undefined,
      speaker: undefined,
    });
    expect(parsed.capacity).toBeUndefined();
  });

  it("does not mutate the input object", () => {
    const input = { ...valid };
    eventInputSchema.parse(input);
    expect(typeof input.startAt).toBe("string");
  });
});

describe("slug generation", () => {
  it("produces a valid slug from a title", () => {
    const slug = slugifyEventTitle("Reading financial statements for beginners");
    expect(slug).toBe("reading-financial-statements-for-beginners");
    expect(eventSlugSchema.safeParse(slug).success).toBe(true);
  });

  it("strips accents and punctuation", () => {
    expect(slugifyEventTitle("Économie & Finance: Atelier 2")).toBe("economie-finance-atelier-2");
    expect(slugifyEventTitle("Session (2026) — Part 1")).toBe("session-2026-part-1");
  });

  it("never produces leading, trailing, or doubled hyphens", () => {
    for (const title of ["  spaced  out  ", "!!!", "a--b", "-lead-and-trail-"]) {
      const slug = slugifyEventTitle(title);
      expect(slug).not.toMatch(/^-|-$|--/);
    }
  });

  it("falls back to a valid slug for input with no usable characters", () => {
    const slug = slugifyEventTitle("###");
    expect(slug).toMatch(/^event-/);
    expect(eventSlugSchema.safeParse(slug).success).toBe(true);
  });

  it("bounds the length", () => {
    const slug = slugifyEventTitle("word ".repeat(60));
    expect(slug.length).toBeLessThanOrEqual(100);
  });
});

describe("slug validation", () => {
  it("accepts hyphenated lowercase slugs", () => {
    expect(eventSlugSchema.safeParse("central-bank-policy-explained").success).toBe(true);
  });

  it("rejects uppercase, spaces, and malformed separators", () => {
    expect(eventSlugSchema.safeParse("Central-Bank").success).toBe(false);
    expect(eventSlugSchema.safeParse("central bank").success).toBe(false);
    expect(eventSlugSchema.safeParse("central--bank").success).toBe(false);
    expect(eventSlugSchema.safeParse("-central").success).toBe(false);
    expect(eventSlugSchema.safeParse("ab").success).toBe(false);
  });
});

describe("registration status", () => {
  it("is open before the event when registration is enabled", () => {
    expect(registrationStatus(makeEvent(), 0, BEFORE)).toBe("open");
  });

  it("is full when the count reaches capacity", () => {
    expect(registrationStatus(makeEvent(), 10, BEFORE)).toBe("full");
  });

  it("stays full beyond capacity rather than going negative", () => {
    expect(registrationStatus(makeEvent(), 12, BEFORE)).toBe("full");
  });

  it("is closed when registration is disabled, even below capacity", () => {
    expect(registrationStatus(makeEvent({ registrationOpen: false }), 0, BEFORE)).toBe("closed");
  });

  it("is started during the event, overriding an open state", () => {
    expect(registrationStatus(makeEvent(), 0, DURING)).toBe("started");
  });

  it("is ended after the event", () => {
    expect(registrationStatus(makeEvent(), 0, AFTER)).toBe("ended");
  });

  it("never reopens a full session", () => {
    expect(canRegister(makeEvent(), 10, BEFORE)).toBe(false);
    expect(canRegister(makeEvent(), 9, BEFORE)).toBe(true);
  });

  it("treats a null capacity as unlimited", () => {
    const event = makeEvent({ capacity: null });
    expect(registrationStatus(event, 1_000, BEFORE)).toBe("open");
    expect(spotsRemaining(event, 1_000)).toBeNull();
    expect(canRegister(event, 1_000, BEFORE)).toBe(true);
  });
});

describe("spots remaining", () => {
  it("subtracts the registered count", () => {
    expect(spotsRemaining(makeEvent({ capacity: 40 }), 12)).toBe(28);
  });

  it("never returns a negative number", () => {
    expect(spotsRemaining(makeEvent({ capacity: 10 }), 25)).toBe(0);
  });
});

describe("splitting by time", () => {
  const events = [
    makeEvent({
      id: "a",
      startAt: new Date("2026-10-30T09:00:00Z"),
      endAt: new Date("2026-10-30T11:00:00Z"),
    }),
    makeEvent({
      id: "b",
      startAt: new Date("2026-10-10T09:00:00Z"),
      endAt: new Date("2026-10-10T11:00:00Z"),
    }),
    makeEvent({
      id: "c",
      startAt: new Date("2026-11-02T09:00:00Z"),
      endAt: new Date("2026-11-02T11:00:00Z"),
    }),
  ];

  it("sorts upcoming soonest first", () => {
    const { upcoming } = splitByTime(events, BEFORE);
    expect(upcoming.map((event) => event.id)).toEqual(["a", "c"]);
  });

  it("sorts past most recent first", () => {
    const { past } = splitByTime(events, new Date("2026-11-01T00:00:00Z"));
    expect(past.map((event) => event.id)).toEqual(["a", "b"]);
  });

  it("does not mutate the input array", () => {
    const original = [...events];
    splitByTime(events, BEFORE);
    expect(events).toEqual(original);
  });

  it("handles an empty list", () => {
    expect(splitByTime([], BEFORE)).toEqual({ upcoming: [], past: [] });
  });

  it("classifies by end time, so a running event is not past", () => {
    const running = makeEvent({
      id: "r",
      startAt: new Date("2026-10-20T08:00:00Z"),
      endAt: new Date("2026-10-20T12:00:00Z"),
    });
    const { upcoming, past } = splitByTime([running], DURING);
    expect(upcoming.map((event) => event.id)).toEqual(["r"]);
    expect(past).toEqual([]);
  });
});
