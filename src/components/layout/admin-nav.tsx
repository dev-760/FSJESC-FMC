"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  ADMIN_NAV,
  isAdminNavItemActive,
  type AdminNavItem,
} from "@/config/admin-navigation";

/**
 * Administration navigation.
 *
 * A horizontally scrolling tab strip rather than a sidebar: the admin section is
 * a series of flat list pages with no nesting, so a sidebar would spend a column
 * of a wide screen restating what a tab row already says. It scrolls on narrow
 * viewports instead of collapsing into a menu, because an operator on a laptop
 * is the overwhelmingly common case here.
 */
function AdminNavTab({ item, active }: { item: AdminNavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={[
        "focus-visible:outline-ring flex shrink-0 items-center gap-2 border-b-2 px-1 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2",
        active
          ? "border-accent text-foreground font-medium"
          : "text-foreground-secondary hover:text-foreground border-transparent hover:border-rule-strong",
      ].join(" ")}
    >
      <item.icon aria-hidden className="size-4 shrink-0" />
      {item.label}
    </Link>
  );
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <div className="border-rule bg-surface-sunken border-b">
      <Container size="wide" className="py-10">
        <nav aria-label="Administration">
          <div className="-mb-px flex gap-6 overflow-x-auto">
            {ADMIN_NAV.map((item) => (
              <AdminNavTab
                key={item.href}
                item={item}
                active={isAdminNavItemActive(item, pathname)}
              />
            ))}
          </div>
        </nav>
      </Container>
    </div>
  );
}