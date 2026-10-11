"use client";

export interface SimulatorNavProps {
  className?: string;
}

/**
 * Navigation is now provided globally by `<SimulatorShell />` in the simulator
 * root layout (top `.sim-header` + left `.sim-rail` matching `mockups/Simulator.html`).
 * Kept as a no-op component so route-level `<SimulatorNav />` mounts do not
 * duplicate the shell chrome.
 */
export function SimulatorNav(_props: SimulatorNavProps) {
  return null;
}