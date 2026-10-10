"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, LayoutDashboard, TrendingUp, Briefcase, History, Terminal } from "lucide-react";
import { cn } from "@fsjesc/config/cn";
import { landingUrl } from "@fsjesc/config/app-urls";
import { SIMULATION } from "@fsjesc/config/site";
import { money } from "@fsjesc/config/money";
import { Num } from "@fsjesc/ui/primitives/num";
import { FmcLogo } from "../brand/fmc-mark";

export interface SimulatorNavProps {
  className?: string;
}

/**
 * Tabs are matched against app-relative paths.
 *
 * The simulator serves these routes at its own root (`/`, `/dashboard`,
 * `/market`…), so a `/simulator/…` prefix belongs to neither this app nor the
 * landing app any more.
 *
 * The links themselves are relative too: they are rendered *inside* this app, so
 * an absolute URL would make every tab depend on the `SIMULATOR_URL` env var
 * and defeat client-side navigation. Absolute URLs belong to links that cross
 * the app boundary — which is what the "back to site" link below is for.
 */
const NAV_TABS = [
  { path: "/", label: "Terminal Hub", icon: Terminal, exact: true },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, exact: false },
  { path: "/market", label: "Market Quotes", icon: TrendingUp, exact: false },
  { path: "/portfolio", label: "Portfolio", icon: Briefcase, exact: false },
  { path: "/history", label: "Order History", icon: History, exact: false },
] as const;

export function SimulatorNav({ className }: SimulatorNavProps) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-b border-rule bg-surface/80 backdrop-blur-sm -mt-2 mb-8",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="focus-visible:outline-ring flex shrink-0 items-center gap-2 rounded focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Simulator Hub"
          >
            <FmcLogo variant="mark" height={24} alt="" />
            <span className="hidden font-semibold text-xs tracking-tight sm:inline">FMC</span>
          </Link>
          <nav aria-label="Simulator sections" className="flex items-center gap-1 sm:gap-2">
          {NAV_TABS.map((tab) => {
            const active = tab.exact ? pathname === tab.path : pathname.startsWith(tab.path);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.path}
                href={tab.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  active
                    ? "bg-surface-inset text-bull font-semibold shadow-xs border border-rule-strong"
                    : "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
                )}
              >
                <Icon
                  aria-hidden
                  className={cn("h-4 w-4 shrink-0", active ? "text-bull" : "text-foreground-muted")}
                />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        </div>

        <div className="hidden items-center gap-3 text-xs md:flex">
          <span className="label text-2xs text-foreground-muted">Default balance:</span>
          {/* Read from config rather than typed in, so the figure shown can never
              disagree with the figure a new portfolio is actually funded with. */}
          <span className="numeric rounded border border-rule bg-surface-sunken px-2 py-0.5 font-semibold text-foreground">
            <Num
              cents={money(SIMULATION.defaultStartingCashCents).amountCents}
              size="sm"
              unit=" MAD"
            />
          </span>

          <Link
            href={landingUrl()}
            className="flex items-center gap-1.5 rounded-md px-2 py-1.5 font-medium text-foreground-secondary transition-colors hover:bg-surface-sunken hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2"
          >
            <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
            Club site
          </Link>
        </div>
      </div>
    </div>
  );
}