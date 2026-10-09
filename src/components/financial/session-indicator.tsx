"use client";

import { useSyncExternalStore } from "react";

import { easternLabel, sessionState, type SessionState } from "@/lib/market/clock";
import { cn } from "@/lib/cn";

/**
 * The session indicator: ET clock plus the US cash session state.
 *
 * The simulated market never closes, so this is a *reference*, not a gate — and the
 * copy says so in the accessible name. A student who reads "CLOSED" and concludes
 * they cannot trade would be misreading the platform, so the tooltip and the
 * screen-reader label both state that orders are always accepted.
 *
 * Hydration-safe by construction: the server snapshot is `null`, so the first client
 * render emits a placeholder of identical size rather than a clock the server
 * guessed.
 */

const TICK_MS = 1_000;

const STATE_TONE: Record<SessionState, string> = {
  OPEN: "text-bull",
  PRE: "text-warning",
  POST: "text-warning",
  CLOSED: "text-foreground-muted",
};

const STATE_LABEL: Record<SessionState, string> = {
  OPEN: "Market open",
  PRE: "Pre-market",
  POST: "After hours",
  CLOSED: "Market closed",
};

const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let now: Date | null = null;

function start(): void {
  if (timer !== undefined) return;
  const update = (): void => {
    now = new Date();
    for (const listener of listeners) listener();
  };
  update();
  timer = setInterval(update, TICK_MS);
}

function subscribe(listener: () => void): () => void {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): Date | null => now;
const getServerSnapshot = (): Date | null => null;

export function SessionIndicator({ className }: { className?: string }) {
  const at = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const state = at ? sessionState(at) : null;
  const label = at ? easternLabel(at) : "--:--";

  return (
    <div
      className={cn("hidden items-center gap-2 md:flex", className)}
      title="United States cash session, Eastern Time. Simulated prices move continuously and orders are always accepted."
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-1.5 w-1.5 shrink-0 rounded-full",
          state === "OPEN" ? "bg-bull" : state === null ? "bg-rule-strong" : "bg-warning",
        )}
      />
      {/*
        One accessible string, updated once a second. Splitting the state and the
        clock into separate live regions would queue two announcements per tick.
      */}
      <span className="label text-2xs" aria-live="off">
        <span className="sr-only">
          {state ? `${STATE_LABEL[state]}, Eastern Time` : "Loading market session"}. Simulated
          prices move continuously; orders are accepted at any time.
        </span>
        <span aria-hidden="true" className={cn("font-medium", state && STATE_TONE[state])}>
          {state ? STATE_LABEL[state] : "ET"}
        </span>
        <span aria-hidden="true" className="numeric text-foreground-secondary ml-1.5">
          {label}
        </span>
      </span>
    </div>
  );
}
