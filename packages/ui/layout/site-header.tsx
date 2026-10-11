"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "../button";
import { FmcLogo } from "../brand/fmc-mark";
import { ThemeSwitcher } from "./theme-switcher";
import { cn } from "@fsjesc/config/cn";
import type { NavItem } from "@fsjesc/config/navigation";
import { SITE } from "@fsjesc/config/site";

/**
 * The site header: a 56px editorial navigation bar.
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
  const [activePath, setActivePath] = useState(pathname);

  useEffect(() => {
    setActivePath(pathname || (typeof window !== "undefined" ? window.location.pathname : ""));
  }, [pathname]);

  const currentPath = activePath || pathname;

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
    <header className="bg-canvas/90 supports-[not(backdrop-filter:blur(0))]:bg-canvas border-rule sticky top-0 z-40 border-b backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-5 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${SITE.name}, home`}
          className="focus-visible:outline-ring group flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
        >
          <FmcLogo variant="mark" height={28} alt="" />
          <span className="flex items-center gap-2 leading-none">
            <span className="font-serif text-base font-bold tracking-tight text-foreground">
              {SITE.shortName}
            </span>
            <span
              aria-hidden="true"
              className="bg-rule-strong hidden h-3.5 w-px sm:inline-block"
            />
            <span className="text-2xs text-foreground-secondary hidden font-medium sm:inline-block">
              {SITE.locale === "en" ? "Financial Markets Club" : SITE.name}
            </span>
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-0.5">
            {navItems.map((item) => {
              const active = isCurrent(currentPath, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative inline-flex items-center rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                      active
                        ? "bg-surface-inset/80 text-foreground font-semibold"
                        : "text-foreground-secondary hover:bg-surface-inset/60 hover:text-foreground font-medium",
                    )}
                  >
                    {item.label}
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="bg-brand absolute inset-x-2.5 -bottom-[9px] h-0.5 rounded-full"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeSwitcher compact />
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

      {open ? (
        <div
          id={panelId}
          className="border-rule bg-canvas fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto border-t lg:hidden"
        >
          <nav aria-label="Primary (mobile)" className="px-4 sm:px-6">
            <ul className="divide-rule divide-y">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isCurrent(currentPath, item.href) ? "page" : undefined}
                    className={cn(
                      "focus-visible:outline-ring block rounded-md px-2 py-4 focus-visible:outline-2 focus-visible:-outline-offset-2",
                      isCurrent(currentPath, item.href)
                        ? "bg-surface-inset"
                        : "hover:bg-surface-sunken",
                    )}
                  >
                    <span className="text-foreground block text-base font-semibold">
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
        The permanent simulated-market notice (Part 0.4, DISC-1), visible and accessible
        on every page as mandated by exit criteria.
      */}
      <aside
        role="note"
        aria-label="Simulated market notice"
        className="border-rule bg-surface-sunken/90 border-t px-4 py-1 text-center text-2xs text-foreground-secondary"
      >
        <p className="mx-auto flex max-w-7xl items-center justify-center gap-2">
          <span aria-hidden="true" className="bg-brand inline-block size-1.5 shrink-0 rounded-full" />
          <span>{disclaimer}</span>
        </p>
      </aside>
    </header>
  );
}

/**
 * A link is "current" when it matches exactly, or when it is a section root and the
 * path is nested inside it (`/education/topics` highlights `/education`).
 */
function isCurrent(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const p = pathname.replace(/\/+$/, "") || "/";
  const h = href.replace(/\/+$/, "") || "/";
  if (p === h) return true;
  if (h === "/") return false;
  return p.startsWith(`${h}/`);
}
