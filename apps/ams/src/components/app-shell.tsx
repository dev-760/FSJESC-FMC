"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Paragraph, ScrollView, Text, XStack, YStack, styled } from "tamagui";
import {
  Activity,
  BarChart3,
  Calendar,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Sliders,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";
import { AuthGate } from "@/components/auth-gate";

export interface AppNavItem {
  name: string;
  href: string;
  icon: typeof Users;
}

export const APP_NAV: readonly AppNavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "APIs & Markets", href: "/apis", icon: Globe },
  { name: "Users & Portfolios", href: "/users", icon: Users },
  { name: "Articles & Content", href: "/articles", icon: FileText },
  { name: "Events & Sessions", href: "/events", icon: Calendar },
  { name: "Competitions", href: "/competitions", icon: Trophy },
  { name: "Orders & Risk Desk", href: "/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Platform Settings", href: "/settings", icon: Sliders },
  { name: "System Health", href: "/system", icon: Activity },
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
              borderLeftWidth={2}
              borderLeftColor={active ? "$bull" : "transparent"}
              backgroundColor={active ? "$surfaceInset" : "transparent"}
              hoverStyle={{ backgroundColor: "$surfaceInset" }}
            >
              <Icon size={18} color={active ? "#2dbf8e" : "#b3c0cb"} />
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
      gap="$2.5"
      paddingHorizontal="$4"
      borderBottomWidth={1}
      borderColor="$rule"
    >
      <picture>
        <source srcSet="/brand/mark-dark.png" media="(prefers-color-scheme: dark)" />
        <img
          src="/brand/mark-light.png"
          alt="FSJESC FMC"
          height={24}
          style={{ height: 24, width: "auto", display: "block" }}
        />
      </picture>
      <YStack gap={0}>
        <Text fontFamily="$mono" fontSize="$3" fontWeight="700" color="$foreground">
          FSJESC FMC
        </Text>
        <Text fontSize="$1" color="$foregroundMuted">
          AMS Control Center
        </Text>
      </YStack>
    </XStack>
  );
}

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
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (drawerOpen) setDrawerOpen(false);
  }

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <AuthGate>
      <YStack flex={1} minHeight="100vh" backgroundColor="$canvas" flexDirection="row">
        <YStack
          className="ams-sidebar"
          width={256}
          borderRightWidth={1}
          borderColor="$rule"
          backgroundColor="$surfaceSunken"
        >
          <Brand />
          <NavList />
          <YStack padding="$4" borderTopWidth={1} borderColor="$ruleFaint" gap="$1">
            <Text fontFamily="$mono" fontSize="$0" color="$bull">
              ● WASSLY API GATEWAY
            </Text>
            <Paragraph fontSize="$0" color="$foregroundMuted">
              8 Markets · 110 Instruments Active
            </Paragraph>
          </YStack>
        </YStack>

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
            <DrawerToggle onPress={() => setDrawerOpen((open) => !open)} />

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
    </AuthGate>
  );
}