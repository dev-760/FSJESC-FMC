"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@/lib/cn";
import type { NavItem } from "@/config/navigation";

/**
 * Site header.
 *
 * A terminal's chrome is a thin rule and a row of small caps, not a floating bar.
 * The brand is a typographic lockup plus a ticker glyph: it must read at 16px and
 * be legible to assistive technology (Part 0.4).
 *
 * Keyboard and screen-reader behaviour (Part 9.3):
 *   - the trigger is a real `<button>` with `aria-expanded` and `aria-controls`
 *   - `Escape` closes the panel and returns focus to the trigger
 *   - the current page is marked with `aria-current="page"`
 */
export function SiteHeader({
  navItems,
  accountSlot,
}: {
  navItems: readonly NavItem[];
  accountSlot?: React.ReactNode;
}) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // The panel is closed during render when the path changes, rather than in an
  // effect. An effect would leave the overlay visible for one extra frame after a
  // navigation, and React advises against setState in an effect for exactly this
  // "derive state instead" case. React discards and re-runs the render, so this
  // costs nothing and never loops.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Return focus to the control that opened the panel, so keyboard users are
      // not dropped at the top of the document.
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Prevent the page behind the panel from scrolling.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="border-rule bg-canvas/92 supports-[not(backdrop-filter:blur(0))]:bg-canvas sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="FSJESC Financial Markets Club — home"
          className="focus-visible:outline-ring flex shrink-0 items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <span
            aria-hidden="true"
            className="numeric border-rule-strong bg-surface-sunken text-2xs text-foreground-secondary flex h-7 items-center rounded-sm border px-1.5 font-semibold tracking-tight"
          >
            MAD
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold tracking-tight">FSJESC FMC</span>
            <span className="text-2xs text-foreground-muted mt-0.5">Financial Markets Club</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-sm px-2.5 py-1.5 text-sm transition-colors",
                    "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                    isCurrent(pathname, item.href)
                      ? "bg-surface-inset text-foreground font-medium"
                      : "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
          <ThemeSwitcher />
          <div className="hidden items-center gap-2 sm:flex">{accountSlot}</div>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
          </Button>
        </div>
      </div>

      {open ? (
        <div
          id={panelId}
          className="border-rule bg-canvas fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t lg:hidden"
        >
          <nav aria-label="Primary (mobile)" className="px-4 py-2 sm:px-6">
            <ul className="divide-rule divide-y">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(pathname, item.href) ? "page" : undefined}
                    className={cn(
                      "focus-visible:outline-ring block rounded-sm px-1 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2",
                      isCurrent(pathname, item.href)
                        ? "bg-surface-inset"
                        : "hover:bg-surface-sunken",
                    )}
                  >
                    <span className="text-foreground block text-base font-medium">
                      {item.label}
                    </span>
                    <span className="text-foreground-secondary mt-0.5 block text-sm">
                      {item.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="py-5 sm:hidden">{accountSlot}</div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}

/**
 * A link is "current" when it matches exactly, or when it is a section root and
 * the path is nested inside it (`/events/market-open` highlights `/events`).
 */
function isCurrent(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}
