"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { MarketTicker } from "../financial/market-ticker";
import { SessionIndicator } from "../financial/session-indicator";
import { Button } from "../button";
import { cn } from "@fsjesc/config/cn";
import type { NavItem } from "@fsjesc/config/navigation";
import { SITE } from "@fsjesc/config/site";

/**
 * The site header: a 56px nav bar over a 32px ticker strip.
 *
 * The rhythm is fixed and stated once here rather than re-derived per page. Sticky
 * chrome on a scrolling page is the default on a trading platform, and a header
 * that changes height between routes is the clearest possible sign that it was
 * assembled rather than designed.
 *
 * `SIMULATED DATA` is permanent and site-wide, not a page detail, so it lives in the
 * header stack rather than being repeated on each surface (Part 0.4, DISC-1).
 *
 * Keyboard and screen-reader behaviour (Part 9.3):
 *   - the trigger is a real `<button>` with `aria-expanded` and `aria-controls`
 *   - `Escape` closes the panel and returns focus to the trigger
 *   - the current page is marked with `aria-current="page"`
 */
export function SiteHeader({
  navItems,
  disclaimer,
  accountSlot,
}: {
  navItems: readonly NavItem[];
  disclaimer: string;
  accountSlot?: React.ReactNode;
}) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Closed during render when the path changes, rather than in an effect. An effect
  // would leave the panel visible for a frame after a navigation, and React advises
  // against setState in an effect for exactly this "derive state" case.
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
      // Return focus to the control that opened the panel, so keyboard users are not
      // dropped at the top of the document.
      triggerRef.current?.focus();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  // Stop the page behind the panel scrolling, and restore the previous value rather
  // than clearing it — another component may have set it.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <header className="bg-canvas/95 supports-[not(backdrop-filter:blur(0))]:bg-canvas border-rule sticky top-0 z-40 border-b backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${SITE.name}, home`}
          className="focus-visible:outline-ring flex shrink-0 items-center gap-2.5 rounded focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          {/*
            A `MAD` badge rather than a logo mark. The currency is the one fact every
            visitor needs before they trust any number on the page.
          */}
          <span
            aria-hidden="true"
            className="numeric border-rule-strong bg-surface-sunken text-2xs text-foreground-secondary flex h-6 items-center rounded-xs border px-1.5 font-semibold"
          >
            MAD
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-sm font-semibold">{SITE.shortName}</span>
            <span className="text-2xs text-foreground-secondary mt-0.5 hidden sm:block">
              {SITE.locale === "en" ? "Financial Markets Club" : SITE.name}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
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

        <div className="ml-auto flex items-center gap-3 lg:ml-0">
          <SessionIndicator />
          <div className="hidden items-center gap-1.5 sm:flex">{accountSlot}</div>
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

      <MarketTicker />

      {open ? (
        <div
          id={panelId}
          className="border-rule bg-canvas fixed inset-x-0 top-22 bottom-0 z-40 overflow-y-auto border-t lg:hidden"
        >
          <nav aria-label="Primary (mobile)" className="px-4 sm:px-6">
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

      {/*
        The full disclaimer, once, in the document rather than only in the ticker
        label. Screen readers reach it, and it is what a reader who wants the exact
        wording is looking for.
      */}
      <p className="sr-only">{disclaimer}</p>
    </header>
  );
}

/**
 * A link is "current" when it matches exactly, or when it is a section root and the
 * path is nested inside it (`/education/topics` highlights `/education`).
 */
function isCurrent(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}
