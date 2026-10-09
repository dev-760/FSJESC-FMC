import {
  Activity,
  FileText,
  Newspaper,
  Settings,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";

/**
 * Administration navigation.
 *
 * Kept in one place so every admin surface carries the same chrome. Routes that
 * do not exist are deliberately absent — a navigation entry that 404s is worse
 * than no entry at all, which is why the executive links that had no page were
 * dropped rather than kept as placeholders.
 */
export interface AdminNavItem {
  href: string;
  label: string;
  description: string;
  icon: typeof Users;
}

export const ADMIN_NAV: readonly AdminNavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    description: "Platform totals and recent activity",
    icon: Activity,
  },
  {
    href: "/admin/users",
    label: "Users",
    description: "Accounts and role assignments",
    icon: Users,
  },
  {
    href: "/admin/events",
    label: "Events",
    description: "Sessions, workshops and registration",
    icon: Newspaper,
  },
  {
    href: "/admin/articles",
    label: "Articles",
    description: "Published education material",
    icon: FileText,
  },
  {
    href: "/admin/competitions",
    label: "Competitions",
    description: "Scenario challenges and scoring",
    icon: Trophy,
  },
  {
    href: "/admin/orders",
    label: "Orders",
    description: "The simulated order ledger",
    icon: ShoppingCart,
  },
  {
    href: "/admin/system",
    label: "System",
    description: "Engine health and diagnostics",
    icon: Settings,
  },
];

/** True when `pathname` is the item itself or nested beneath it. */
export function isAdminNavItemActive(item: AdminNavItem, pathname: string): boolean {
  return item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
}