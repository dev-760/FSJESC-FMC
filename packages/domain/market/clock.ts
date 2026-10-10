/**
 * The market clock (Part 5.3).
 *
 * The simulated market runs continuously — a student in Casablanca should be able
 * to trade at any hour — so this is a **display** of the real-world New York
 * session, not a gate on orders. It exists because "is New York open?" is a
 * legitimate question, and answering it wrongly would be worse than not answering
 * it.
 *
 * Pure functions of an explicit `at`. No clock is read here (D9).
 */

/** ET is UTC−5 (EST) or UTC−4 (EDT). Derived from the date, never assumed. */
const ET_STANDARD_OFFSET_HOURS = -5;

const DAY = 86_400_000;
const HOUR = 3_600_000;
const MINUTE = 60_000;

/** Sunday is 0. */
const SUNDAY = 0;
const SATURDAY = 6;

/**
 * US daylight saving: second Sunday in March 02:00 local, to first Sunday in
 * November 02:00 local. Computed rather than hardcoded, so the rule lives in one
 * place and any year's dates can be checked by hand.
 */
function isEasternDaylightSaving(date: Date): boolean {
  const year = date.getUTCFullYear();
  const starts = nthSunday(year, 2);
  const ends = nthSunday(year, 10);
  const instant = date.getTime();
  return instant >= starts && instant < ends;
}

/** The nth (1-based) Sunday of a month, in UTC milliseconds. */
function nthSunday(year: number, monthIndex: number): number {
  const firstOfMonth = Date.UTC(year, monthIndex, 1);
  const firstWeekday = new Date(firstOfMonth).getUTCDay();
  const daysIn = (7 - firstWeekday) % 7;
  return firstOfMonth + (daysIn + 14) * DAY;
}

/** The ET offset in milliseconds at an instant. */
function easternOffset(date: Date): number {
  return (ET_STANDARD_OFFSET_HOURS + (isEasternDaylightSaving(date) ? 1 : 0)) * HOUR;
}

/** The ET wall clock at an instant, as if it were UTC. */
function easternAsUtc(date: Date): Date {
  return new Date(date.getTime() + easternOffset(date));
}

/** Minutes since ET midnight, plus the ET weekday. */
export function easternMinutes(at: Date): { minutes: number; weekday: number } {
  const local = easternAsUtc(at);
  return { minutes: local.getUTCHours() * 60 + local.getUTCMinutes(), weekday: local.getUTCDay() };
}

/** `HH:MM` in ET, zero-padded — the label the header's session indicator shows. */
export function easternLabel(at: Date): string {
  const { minutes } = easternMinutes(at);
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/** Regular session for US cash equities: 09:30–16:00 ET, weekdays. */
const SESSION_OPEN = 9 * 60 + 30;
const SESSION_CLOSE = 16 * 60;

/** Pre-market and after-hours widen the visible window to 04:00–20:00 ET. */
const EXTENDED_OPEN = 4 * 60;
const EXTENDED_CLOSE = 20 * 60;

export type SessionState = "PRE" | "OPEN" | "POST" | "CLOSED";

export function sessionState(at: Date): SessionState {
  const { minutes, weekday } = easternMinutes(at);
  if (weekday === SUNDAY || weekday === SATURDAY) return "CLOSED";
  if (minutes < EXTENDED_OPEN) return "CLOSED";
  if (minutes < SESSION_OPEN) return "PRE";
  if (minutes < SESSION_CLOSE) return "OPEN";
  if (minutes < EXTENDED_CLOSE) return "POST";
  return "CLOSED";
}

export function isMarketOpen(at: Date): boolean {
  return sessionState(at) === "OPEN";
}

const STATE_LABEL: Record<SessionState, string> = {
  PRE: "PRE-MARKET",
  OPEN: "OPEN",
  POST: "AFTER HOURS",
  CLOSED: "CLOSED",
};

export function sessionLabel(at: Date): string {
  return STATE_LABEL[sessionState(at)];
}

/**
 * When the session state next changes.
 *
 * Computed from the ET wall clock, so the answer stays correct across a DST change
 * rather than drifting by an hour twice a year.
 */
export function nextTransition(at: Date): { state: SessionState; at: Date; label: string } {
  const local = easternAsUtc(at);
  const { weekday } = easternMinutes(at);
  const offset = easternOffset(at);
  const startOfDay = Date.UTC(
    local.getUTCFullYear(),
    local.getUTCMonth(),
    local.getUTCDate(),
    0,
    0,
    0,
    0,
  );

  const boundary = (dayOffset: number, atMinutes: number): Date =>
    new Date(startOfDay + dayOffset * DAY + atMinutes * MINUTE - offset);

  if (weekday === SUNDAY) {
    const next = boundary(1, EXTENDED_OPEN);
    return { state: "PRE", at: next, label: easternLabel(next) };
  }
  if (weekday === SATURDAY) {
    const next = boundary(2, EXTENDED_OPEN);
    return { state: "PRE", at: next, label: easternLabel(next) };
  }

  const state = sessionState(at);
  if (state === "CLOSED") {
    const next = boundary(0, EXTENDED_OPEN);
    return { state: "PRE", at: next, label: easternLabel(next) };
  }
  if (state === "PRE") {
    const next = boundary(0, SESSION_OPEN);
    return { state: "OPEN", at: next, label: easternLabel(next) };
  }
  if (state === "OPEN") {
    const next = boundary(0, SESSION_CLOSE);
    return { state: "POST", at: next, label: easternLabel(next) };
  }

  // After hours: the next change is tomorrow's pre-market.
  const next = boundary(1, EXTENDED_OPEN);
  return { state: "CLOSED", at: next, label: easternLabel(next) };
}

/** Minutes remaining until the next transition. */
export function minutesToNextTransition(at: Date): number {
  const next = nextTransition(at);
  return Math.max(0, Math.round((next.at.getTime() - at.getTime()) / MINUTE));
}
