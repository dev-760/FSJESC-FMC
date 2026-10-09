"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, TrendingUp, Briefcase, History, Terminal } from "lucide-react";
import { cn } from "@/lib/cn";

export interface SimulatorNavProps {
  className?: string;
}

const NAV_TABS = [
  {
    href: "/simulator",
    label: "Terminal Hub",
    icon: Terminal,
    exact: true,
  },
  {
    href: "/simulator/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/simulator/market",
    label: "Market Quotes",
    icon: TrendingUp,
  },
  {
    href: "/simulator/portfolio",
    label: "Portfolio",
    icon: Briefcase,
  },
  {
    href: "/simulator/history",
    label: "Order History",
    icon: History,
  },
];

export function SimulatorNav({ className }: SimulatorNavProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className={cn("border-b border-rule bg-surface/80 backdrop-blur-sm -mt-2 mb-8", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between overflow-x-auto px-4 py-2 sm:px-6 lg:px-8">
        <nav aria-label="Simulator sections" className="flex items-center gap-1 sm:gap-2">
          {NAV_TABS.map((tab) => {
            const active = isActive(tab.href, tab.exact);
            const Icon = tab.icon;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
                  "focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2",
                  active
                    ? "bg-surface-inset text-bull font-semibold shadow-xs border border-rule-strong"
                    : "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-bull" : "text-foreground-muted")} />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3 text-xs">
          <span className="label text-2xs text-foreground-muted">Default Balance:</span>
          <span className="numeric text-foreground font-semibold bg-surface-sunken px-2 py-0.5 rounded border border-rule">
            100,000.00 MAD
          </span>
        </div>
      </div>
    </div>
  );
}
