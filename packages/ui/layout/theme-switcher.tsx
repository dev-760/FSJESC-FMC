"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

function applyDocumentTheme(mode: "light" | "dark" | "system") {
  if (typeof document === "undefined") return;
  if (mode === "light" || mode === "dark") {
    document.documentElement.setAttribute("data-theme", mode);
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
  const media =
    mode === "dark" ? "all" : mode === "light" ? "not all" : "(prefers-color-scheme: dark)";
  document
    .querySelectorAll("source[data-fmc-dark-source]")
    .forEach((el) => el.setAttribute("media", media));
}

export function ThemeSwitcher({ compact = false }: { compact?: boolean } = {}) {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("fsjesc-theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        applyDocumentTheme(stored);
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
      applyDocumentTheme(next);
      localStorage.setItem("fsjesc-theme", next);
    } catch {
      // LocalStorage access may be restricted
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={`Toggle colour theme (current: ${theme})`}
        title={`Theme: ${theme}`}
        className="border-rule bg-surface text-foreground-secondary hover:text-foreground hover:bg-surface-inset hover:border-rule-strong focus-visible:outline-ring inline-flex size-8 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 cursor-pointer"
      >
        {theme === "dark" ? (
          <Moon className="size-3.5" aria-hidden="true" />
        ) : (
          <Sun className="size-3.5" aria-hidden="true" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Theme: ${theme}`}
      className="border-rule bg-surface inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs text-foreground-secondary hover:text-foreground hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-ring transition-colors cursor-pointer"
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
