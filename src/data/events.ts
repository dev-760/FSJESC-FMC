import type { EventRecord } from "@/domain/events/event";

/**
 * Demo events.
 *
 * These records exist so the public site has content before the database is
 * connected, and so the seed script has a source. Times are relative to a fixed
 * anchor rather than to "now" at module load, because a module that calls
 * `Date.now()` on import is both untestable and incompatible with the prerender
 * rules described in `DECISIONS.md` D9.
 *
 * Phase 5 loads events from the `events` table; these are the seed fixtures.
 */

/** Fixed anchor for the demo calendar: 2026-10-05T09:00:00Z. */
const ANCHOR = Date.UTC(2026, 9, 5, 9, 0, 0);
const DAY = 86_400_000;
const HOUR = 3_600_000;

function at(
  daysFromAnchor: number,
  hourUtc: number,
  durationHours: number,
): { startAt: Date; endAt: Date } {
  const start = ANCHOR + daysFromAnchor * DAY + hourUtc * HOUR;
  return { startAt: new Date(start), endAt: new Date(start + durationHours * HOUR) };
}

interface DemoEventSeed {
  slug: string;
  title: string;
  description: string;
  format: EventRecord["format"];
  startDaysFromAnchor: number;
  startHourUtc: number;
  durationHours: number;
  location: string | null;
  room: string | null;
  speaker: string | null;
  capacity: number | null;
  registrationOpen: boolean;
}

const SEEDS: readonly DemoEventSeed[] = [
  {
    slug: "reading-order-statements",
    title: "Reading financial statements for beginners",
    description:
      "A guided walkthrough of the income statement, balance sheet and cash-flow statement. " +
      "Participants read a simplified set of statements and identify where operating, " +
      "investing and financing decisions appear. No prior accounting knowledge is assumed.",
    format: "WORKSHOP",
    startDaysFromAnchor: 3,
    startHourUtc: 10,
    durationHours: 2,
    location: "FSJES Casablanca",
    room: "Room to be confirmed",
    speaker: null,
    capacity: 40,
    registrationOpen: true,
  },
  {
    slug: "central-bank-policy-explained",
    title: "How central bank policy reaches prices",
    description:
      "An introduction to how a policy-rate decision is transmitted into short-term market " +
      "rates, and from there into asset prices. We use published statements from Bank " +
      "Al-Maghrib as case material and discuss the transmission lags involved.",
    format: "LECTURE",
    startDaysFromAnchor: 8,
    startHourUtc: 14,
    durationHours: 1.5,
    location: "FSJES Casablanca",
    room: "Amphitheatre B",
    speaker: "Guest speaker, to be announced",
    capacity: 120,
    registrationOpen: true,
  },
  {
    slug: "risk-measurements-clinic",
    title: "Clinic: volatility and drawdown in practice",
    description:
      "A working session on two risk measures students meet in theory, annualised " +
      "volatility and maximum drawdown. Participants compute both for a sample price " +
      "series and discuss what each measure does and does not tell you about an outcome.",
    format: "WORKSHOP",
    startDaysFromAnchor: 12,
    startHourUtc: 9,
    durationHours: 2.5,
    location: "FSJES Casablanca",
    room: "Computer room 2",
    speaker: null,
    capacity: 25,
    registrationOpen: true,
  },
  {
    slug: "market-microstructure-roundtable",
    title: "Roundtable: what makes a price move",
    description:
      "A moderated discussion on order flow, liquidity and the difference between a quoted " +
      "price and a price you could actually trade at. Contributors present short positions " +
      "first, followed by open discussion.",
    format: "PANEL",
    startDaysFromAnchor: 16,
    startHourUtc: 15,
    durationHours: 2,
    location: "FSJES Casablanca",
    room: "Seminar room 4",
    speaker: "Panel of club members",
    capacity: 35,
    registrationOpen: true,
  },
  {
    slug: "inflation-shock-briefing",
    title: "Briefing: the inflation shock challenge",
    description:
      "A briefing session for the upcoming Inflation Shock scenario challenge. We explain " +
      "the scenario assumptions, how the scenario is applied to the simulated market, and " +
      "how a portfolio is evaluated on return and risk once the window closes.",
    format: "COMPETITION",
    startDaysFromAnchor: 21,
    startHourUtc: 11,
    durationHours: 1,
    location: "FSJES Casablanca",
    room: "Room to be confirmed",
    speaker: null,
    capacity: 60,
    registrationOpen: true,
  },
  {
    slug: "new-members-introduction",
    title: "Introduction session for new members",
    description:
      "An open session for students joining the club this year. Covers the annual programme, " +
      "how the education centre and simulator fit together, and how member-only resources " +
      "work. No registration required.",
    format: "DISCUSSION",
    startDaysFromAnchor: -4,
    startHourUtc: 13,
    durationHours: 1.5,
    location: "FSJES Casablanca",
    room: "Amphitheatre A",
    speaker: null,
    capacity: null,
    registrationOpen: false,
  },
  {
    slug: "portfolio-review-seminar",
    title: "Seminar: reviewing a portfolio allocation",
    description:
      "A recorded and repeated session on portfolio construction. Members presented a " +
      "sample allocation for critique, focusing on concentration and the difference between " +
      "diversification in names and diversification in exposures.",
    format: "DISCUSSION",
    startDaysFromAnchor: -11,
    startHourUtc: 10,
    durationHours: 2,
    location: "FSJES Casablanca",
    room: "Seminar room 2",
    speaker: null,
    capacity: 30,
    registrationOpen: false,
  },
];

/** Build the demo event records. Deterministic: same output on every call. */
export function buildDemoEvents(): EventRecord[] {
  const createdAt = new Date(ANCHOR - 30 * DAY);
  return SEEDS.map((seed) => {
    const { startAt, endAt } = at(seed.startDaysFromAnchor, seed.startHourUtc, seed.durationHours);
    return {
      id: `demo-event-${seed.slug}`,
      slug: seed.slug,
      title: seed.title,
      description: seed.description,
      format: seed.format,
      startAt,
      endAt,
      location: seed.location,
      room: seed.room,
      speaker: seed.speaker,
      capacity: seed.capacity,
      registrationOpen: seed.registrationOpen,
      createdAt,
      updatedAt: createdAt,
    };
  });
}

export const DEMO_EVENTS: readonly EventRecord[] = buildDemoEvents();
