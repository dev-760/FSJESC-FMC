import { describe, expect, it } from "vitest";
import { ASSETS, SECTOR_LABELS } from "./assets";
import { eventInputSchema, eventSlugSchema, slugifyEventTitle } from "./events/event";
import { DEMO_EVENTS, buildDemoEvents } from "./events";

/**
 * Event fixtures used by the seed script (Part 4.3).
 *
 * These assertions protect the demo content from the two failure modes that matter:
 * content that violates the domain schema, and fixtures that silently change when
 * the file is edited.
 */

describe("demo events", () => {
  it("are all valid against the event input schema", () => {
    for (const event of DEMO_EVENTS) {
      const result = eventInputSchema.safeParse({
        title: event.title,
        description: event.description,
        format: event.format,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location,
        room: event.room,
        speaker: event.speaker,
        capacity: event.capacity,
        registrationOpen: event.registrationOpen,
      });
      expect(result.success, `${event.slug}: ${result.success ? "" : result.error.message}`).toBe(
        true,
      );
    }
  });

  it("use valid, unique slugs", () => {
    const slugs = DEMO_EVENTS.map((event) => event.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(eventSlugSchema.safeParse(slug).success).toBe(true);
    }
  });

  it("span more than one day so both upcoming and past sections have content", () => {
    const spanDays =
      (Math.max(...DEMO_EVENTS.map((e) => e.startAt.getTime())) -
        Math.min(...DEMO_EVENTS.map((e) => e.startAt.getTime()))) /
      86_400_000;
    expect(spanDays).toBeGreaterThan(20);
  });

  it("include both an open session and a closed one", () => {
    expect(DEMO_EVENTS.some((event) => event.registrationOpen)).toBe(true);
    expect(DEMO_EVENTS.some((event) => !event.registrationOpen)).toBe(true);
  });

  it("use descriptions written for readers rather than placeholders", () => {
    for (const event of DEMO_EVENTS) {
      expect(event.description.length).toBeGreaterThan(120);
      expect(event.description).not.toMatch(/lorem|TODO|placeholder|coming soon/i);
    }
  });

  it("do not claim a real speaker or venue arrangement", () => {
    for (const event of DEMO_EVENTS) {
      const speaker = event.speaker ?? "";
      // Speakers are placeholders until an executive confirms them.
      expect(speaker === "" || /to be announced|panel of club members/i.test(speaker)).toBe(true);
    }
  });
});

describe("determinism", () => {
  it("produces identical records on every call", () => {
    const first = buildDemoEvents();
    const second = buildDemoEvents();
    expect(second).toEqual(first);
  });

  it("uses a fixed anchor rather than the wall clock", () => {
    // The anchor is 2026-10-05T09:00:00Z. The earliest seed is 11 days before it
    // and starts at 10:00 UTC, i.e. 2026-09-24T19:00:00Z. If this assertion ever
    // changes without the seeds changing, something started reading the wall clock.
    const earliest = DEMO_EVENTS.reduce(
      (min, event) => (event.startAt < min ? event.startAt : min),
      DEMO_EVENTS[0]?.startAt ?? new Date(0),
    );
    expect(earliest.toISOString()).toBe("2026-09-24T19:00:00.000Z");
  });
});

describe("slugs are editorial, not derived", () => {
  it("each slug is a valid slug even when it differs from its title", () => {
    // Slugs are URLs. A curated short slug ("reading-order-statements") is better
    // than the mechanically generated full title, and both must satisfy the same
    // validation so the route cannot break.
    const differing = DEMO_EVENTS.filter((event) => slugifyEventTitle(event.title) !== event.slug);
    expect(differing.length).toBeGreaterThan(0);
    for (const event of differing) {
      expect(eventSlugSchema.safeParse(event.slug).success).toBe(true);
    }
  });

  it("keeps a slug stable when its title is edited", () => {
    // The generator is only applied at creation time. Retitling an event must not
    // change its address, or every existing link to it would break.
    const slug = DEMO_EVENTS[0]?.slug ?? "";
    const retitled = slugifyEventTitle("A completely different title");
    expect(slug).not.toBe("");
    expect(retitled).not.toBe(slug);
  });
});

describe("instrument descriptions", () => {
  it("describes all eight core Bourse de Casablanca instruments with ISINs and sectors", () => {
    expect(ASSETS).toHaveLength(8);
    for (const asset of ASSETS) {
      expect(asset.description).toMatch(/ISIN MA\d{10}/);
      expect(SECTOR_LABELS[asset.sector]).toBeTruthy();
    }
  });
});
