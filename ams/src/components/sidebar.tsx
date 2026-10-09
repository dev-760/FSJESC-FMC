"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { YStack, XStack, Text, styled } from "tamagui";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Trophy,
  ShoppingCart,
  Settings,
  BarChart3,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Users", href: "/users", icon: Users },
  { name: "Events", href: "/events", icon: Calendar },
  { name: "Articles", href: "/articles", icon: FileText },
  { name: "Competitions", href: "/competitions", icon: Trophy },
  { name: "Orders", href: "/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "System", href: "/system", icon: Settings },
];

const StyledNavLink = styled(Link, {
  name: "NavLink",
  display: "flex",
  alignItems: "center",
  gap: "$3",
  borderRadius: "$2",
  paddingHorizontal: "$3",
  paddingVertical: "$2",
  variants: {
    active: {
      true: {
        backgroundColor: "$gray3",
        color: "$gray12",
      },
      false: {
        color: "$gray10",
        hoverStyle: {
          backgroundColor: "$gray2",
        },
      },
    },
  },
});

export function Sidebar() {
  const pathname = usePathname();

  return (
    <YStack
      flex={1}
      width={256}
      height="100vh"
      backgroundColor="$gray1"
      borderRightWidth={1}
      borderColor="$border"
    >
      <XStack
        height={64}
        alignItems="center"
        paddingHorizontal="$6"
        borderBottomWidth={1}
        borderColor="$border"
      >
        <Text fontSize="$6" fontWeight="700">
          AMS
        </Text>
        <Text marginLeft="$2" fontSize="$2" color="$gray8">
          Admin
        </Text>
      </XStack>

      <YStack flex={1} padding="$4" space="$1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <StyledNavLink key={item.name} href={item.href} active={isActive}>
              <Icon size={20} />
              <Text>{item.name}</Text>
            </StyledNavLink>
          );
        })}
      </YStack>

      <YStack borderTopWidth={1} borderColor="$border" padding="$4">
        <Text fontSize="$1" color="$gray8">
          <Text>FSJESC Admin Management</Text>
          <Text marginTop="$1">v0.1.0</Text>
        </Text>
      </YStack>
    </YStack>
  );
}
