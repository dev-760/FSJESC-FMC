"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Paragraph, ScrollView, Text, XStack, YStack, styled } from "tamagui";
import {
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Settings,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";

/**
 * Application shell.
 *
 * This replaces a shell that was copy-pasted into all eight pages and a sidebar
 * pinned at a fixed 256px with no collapse, which meant the navigation was
 * unreachable below roughly 800px. The sidebar now becomes an overlay drawer
 * under the `md` breakpoint, and the page owns scrolling rather than a
 * `100vh` column with an inner scroll area.
 */

export interface AppNavItem {
  name: string;
  href: string;
  icon: typeof Users;
}

export const APP_NAV: readonly AppNavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Articles", href: "/articles", icon: FileText },
  { name: "Competitions", href: "/competitions", icon: Trophy },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "System", href: "/system", icon: Settings },
];

/** Active when the path matches exactly, or nests beneath the item. */
function isActive(item: AppNavItem, pathname: string): boolean {
  if (item.href === "/") return pathname === "/";
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <YStack flex={1} padding="$3" gap="$1">
      {APP_NAV.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            style={{ textDecoration: "none" }}
          >
            <XStack
              alignItems="center"
              gap="$3"
              paddingVertical="$2"
              paddingHorizontal="$3"
              borderRadius="$2"
              /* A selected item is marked by a left rule as well as a surface
                 change, so the state does not rely on background colour alone. */
              borderLeftWidth={2}
              borderLeftColor={active ? "$bull" : "transparent"}
              backgroundColor={active ? "$surfaceInset" : "transparent"}
              hoverStyle={{ backgroundColor: "$surfaceInset" }}
            >
              <Icon size={18} color={active ? "#00e599" : "#9ca3af"} />
              <Text fontSize="$3" color={active ? "$foreground" : "$foregroundSecondary"}>
                {item.name}
              </Text>
            </XStack>
          </Link>
        );
      })}
    </YStack>
  );
}

function Brand() {
  return (
    <XStack
      height={56}
      alignItems="center"
      gap="$2"
      paddingHorizontal="$4"
      borderBottomWidth={1}
      borderColor="$rule"
    >
      <Text fontFamily="$mono" fontSize="$4" fontWeight="700" color="$bull">
        AMS
      </Text>
      <Text fontSize="$1" color="$foregroundMuted">
        Administration
      </Text>
    </XStack>
  );
}

/**
 * The persistent sidebar, hidden below `md` where the drawer takes over.
 *
 * The breakpoint lives in a style object rather than a `md` prop: Tamagui's
 * typed props cover React Native's positioning model, and `position: fixed`
 * is simply not one of the values it accepts on a stack.
 */
const Drawer = styled(YStack, {
  width: 264,
  backgroundColor: "$surfaceSunken",
  borderRightWidth: 1,
  borderColor: "$rule",
  style: { position: "fixed", top: 0, bottom: 0, left: 0, zIndex: 50 },
});

function DrawerToggle({ onPress }: { onPress: () => void }) {
  return (
    <YStack
      aria-label="Open navigation"
      className="ams-drawer-toggle"
      onPress={onPress}
      alignItems="center"
      justifyContent="center"
      width={34}
      height={34}
      borderRadius="$2"
      borderWidth={1}
      borderColor="$rule"
      hoverStyle={{ backgroundColor: "$surfaceInset" }}
      pressStyle={{ backgroundColor: "$surfaceInset" }}
    >
      <Menu size={18} />
    </YStack>
  );
}

export function AppShell({
  title,
  action,
  children,
}: {
  /** Page title. Each page supplies its own rather than a fixed "Dashboard". */
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  /**
   * Close the drawer on navigation.
   *
   * Done during render rather than in an effect: an effect would paint one
   * frame with the drawer still open over the page the user just chose, and it
   * also schedules a second render. Comparing the last-seen path during render
   * is the same pattern the public site's header uses.
   */
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  // Escape closes the drawer, as a keyboard courtesy.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <YStack flex={1} minHeight="100vh" backgroundColor="$canvas" flexDirection="row">
      {/* Persistent sidebar from the `md` breakpoint up; see globals.css. */}
      <YStack
        className="ams-sidebar"
        width={248}
        borderRightWidth={1}
        borderColor="$rule"
        backgroundColor="$surfaceSunken"
      >
        <Brand />
        <NavList />
        <Paragraph padding="$4" fontSize="$0" color="$foregroundMuted">
          FSJESC Administration
        </Paragraph>
      </YStack>

      {/* Overlay drawer on narrow viewports. */}
      {drawerOpen ? (
        <>
          <YStack
            style={{ position: "fixed", inset: 0, backgroundColor: "#07080bcc", zIndex: 40 }}
            onPress={() => setDrawerOpen(false)}
          />
          <Drawer>
            <Brand />
            <NavList onNavigate={() => setDrawerOpen(false)} />
          </Drawer>
        </>
      ) : null}

      <YStack flex={1} minWidth={0}>
        <XStack
          height={56}
          alignItems="center"
          gap="$3"
          paddingHorizontal="$4"
          borderBottomWidth={1}
          borderColor="$rule"
          backgroundColor="$surface"
          style={{ position: "sticky", top: 0, zIndex: 30 }}
        >
          {<DrawerToggle onPress={() => setDrawerOpen((open) => !open)} />}

          <Text fontSize="$4" fontWeight="600" flex={1} numberOfLines={1}>
            {title}
          </Text>

          {action}
        </XStack>

        <ScrollView flex={1} contentContainerStyle={{ padding: 24, paddingBottom: 64 }}>
          {children}
        </ScrollView>
      </YStack>
    </YStack>
  );
}