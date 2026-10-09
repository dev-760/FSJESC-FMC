"use client";

import { useSyncExternalStore } from "react";
import { easternLabel, sessionState, type SessionState } from "@/lib/market/clock";
import { cn } from "@/lib/cn";

const TICK_MS = 1_000;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let currentTime: Date | null = null;

function ensureTimer(): void {
  if (timer !== undefined) return;
  currentTime = new Date();
  timer = setInterval(() => {
    currentTime = new Date();
    for (const listener of listeners) listener();
  }, TICK_MS);
}

function subscribe(listener: () => void): () => void {
  ensureTimer();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = (): Date | null => currentTime;
const getServerSnapshot = (): Date | null => null;

/**
 * Market status component.
 *
 * Displays the live market clock, session state, and pulsing indicator.
 */
export function MarketStatus({ className }: { className?: string }) {
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const state: SessionState = now ? sessionState(now) : "OPEN";
  const label = now ? easternLabel(now) : "--:--";

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs sm:text-sm bg-surface-raised border border-rule px-3 py-1.5 rounded-full",
        className,
      )}
      title="Simulated Casablanca BVC & US reference clock. Orders execute 24/7 against the deterministic model."
    >
      <div className="relative flex items-center justify-center">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            state === "OPEN"
              ? "bg-bull shadow-[0_0_8px_rgba(0,229,153,0.7)]"
              : state === "PRE"
                ? "bg-warning"
                : "bg-rule-strong",
          )}
          aria-hidden="true"
        />
        {state === "OPEN" && (
          <span className="absolute h-3 w-3 rounded-full bg-bull/40 animate-ping" aria-hidden="true" />
        )}
      </div>

      <span className="numeric text-foreground font-medium">{label}</span>
      <span className="text-foreground-muted">·</span>
      <span
        className={cn(
          "label text-2xs",
          state === "OPEN"
            ? "text-bull font-semibold"
            : state === "PRE"
              ? "text-warning"
              : "text-foreground-secondary",
        )}
      >
        {state === "OPEN" ? "Continuous Market" : state === "PRE" ? "Pre-Market" : "After Hours"}
      </span>
      <span className="text-2xs text-foreground-muted hidden sm:inline">(24/7 Match)</span>
    </div>
  );
}
