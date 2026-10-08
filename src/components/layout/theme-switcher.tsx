"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useCallback, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "fsjesc-fmc-theme";
const ORDER: readonly Theme[] = ["light", "dark", "system"];

const LABELS: Record<Theme, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const SERVER_SNAPSHOT: Theme = "system";

/**
 * Theme switcher.
 *
 * The stored choice is applied by `public/theme-init.js` before first paint, so
 * this component only has to reflect and update the choice — it never gates
 * rendering on it. That is what prevents a theme flash (Part 9.4).
 *
 * `useSyncExternalStore` rather than `useState` plus an effect: localStorage is an
 * external store, and reading it in an effect would mean the first client render
 * disagreed with the server render and then corrected itself. The subscribe
 * callback also lets another tab's change be reflected here.
 */
export function ThemeSwitcher({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readStoredTheme, () => SERVER_SNAPSHOT);

  const apply = useCallback((next: Theme) => {
    try {
      if (next === "system") {
        window.localStorage.removeItem(STORAGE_KEY);
        document.documentElement.removeAttribute("data-theme");
      } else {
        window.localStorage.setItem(STORAGE_KEY, next);
        document.documentElement.setAttribute("data-theme", next);
      }
    } catch {
      // Storage can be unavailable (private mode, hardened settings). The visual
      // change still applies for this page view; it simply will not persist.
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const cycle = useCallback(() => {
    const index = ORDER.indexOf(readStoredTheme());
    apply(ORDER[(index + 1) % ORDER.length] ?? "system");
  }, [apply]);

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={cycle}
      aria-label={`Theme: ${LABELS[theme]}. Activate to change.`}
    >
      <Icon aria-hidden />
    </Button>
  );
}

const THEME_EVENT = "fsjesc-fmc:theme-change";

/**
 * Subscribe to changes from this tab and from other tabs. The `storage` event
 * fires in other tabs only, so a local event covers same-tab updates.
 */
function subscribeToTheme(onChange: () => void): () => void {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readStoredTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : "system";
  } catch {
    return "system";
  }
}
