"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fsjesc-theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        document.documentElement.setAttribute("data-theme", stored);
      }
    } catch {
      // LocalStorage access may be restricted
    }
  }, []);

  function toggle() {
    // If not currently light, toggle to light; otherwise toggle to dark.
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      document.documentElement.setAttribute("data-theme", next);
      localStorage.setItem("fsjesc-theme", next);
    } catch {
      // LocalStorage access may be restricted
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Theme: ${theme}`}
      className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs text-foreground-secondary hover:text-foreground hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-ring transition-colors"
    >
      {theme === "dark" ? (
        <Moon className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Sun className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      <span>Theme: {theme}</span>
    </button>
  );
}
