"use client";

import { XStack, Text } from "tamagui";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, User } from "lucide-react";

export function Header() {
  return (
    <XStack
      height={64}
      alignItems="center"
      justifyContent="space-between"
      paddingHorizontal="$6"
      backgroundColor="$background"
      borderBottomWidth={1}
      borderColor="$border"
    >
      <XStack alignItems="center" gap="$4">
        <Text fontSize="$5" fontWeight="600">
          Admin Dashboard
        </Text>
      </XStack>

      <XStack alignItems="center" gap="$4">
        <Button variant="ghost" size="icon">
          <Bell size={20} />
        </Button>

        <Button variant="ghost" size="icon">
          <User size={20} />
        </Button>

        <Button variant="ghost" size="icon">
          <LogOut size={20} />
        </Button>
      </XStack>
    </XStack>
  );
}
