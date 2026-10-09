"use client";

import { create } from "zustand";

import type { Interval } from "@/lib/market/provider";

/**
 * Terminal view state — and nothing else.
 *
 * Zustand holds **ephemeral view state only**: which symbol is selected, which
 * interval, whether the order panel is open. Every one of these is a UI preference
 * with no financial meaning.
 *
 * What Zustand deliberately does *not* hold, and must never hold:
 *   - cash, positions, orders, P&L, fees → server-authoritative, from the database
 *   - the session, the role, entitlements → server-authoritative, from the session
 *   - any price the user could trade against → re-derived from the engine on the
 *     server at execution time
 *
 * The rule that keeps this honest: if a student could lose or gain money by changing
 * something in this store, it belongs in the wrong place. `DEVICES.md` states it;
 * `D17` records that the brief's own "persist the portfolio in Zustand" suggestion is
 * rejected for exactly this reason.
 */

export interface TerminalViewState {
  symbol: string;
  interval: Interval;
  /** Adds a comparison series. View-only; it changes nothing about the data. */
  showVolume: boolean;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: Interval) => void;
  setShowVolume: (show: boolean) => void;
}

export const useTerminalView = create<TerminalViewState>()((set) => ({
  symbol: "MARI",
  interval: "1d",
  showVolume: true,
  setSymbol: (symbol) => set({ symbol }),
  setInterval: (interval) => set({ interval }),
  setShowVolume: (showVolume) => set({ showVolume }),
}));

/** The intervals offered, in the order a reader scans them. */
export const INTERVALS: readonly { value: Interval; label: string }[] = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "1h", label: "1h" },
  { value: "1d", label: "1D" },
];
