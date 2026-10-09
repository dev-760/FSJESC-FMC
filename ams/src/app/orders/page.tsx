"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Input } from "tamagui";
import { Search, MoreVertical, ShoppingCart, TrendingUp, TrendingDown } from "lucide-react";

const StyledBadge = styled(YStack, {
  name: "Badge",
  borderRadius: "$12",
  paddingHorizontal: "$2.5",
  paddingVertical: "$0.5",
  variants: {
    variant: {
      green: { backgroundColor: "$green3", color: "$green11" },
      yellow: { backgroundColor: "$yellow3", color: "$yellow11" },
      red: { backgroundColor: "$red3", color: "$red11" },
    },
  },
});

export default function OrdersPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <YStack>
              <Text fontSize="$8" fontWeight="700">Orders</Text>
              <Text color="$gray10">View and manage trading orders</Text>
            </YStack>
          </XStack>

          <Card>
            <CardHeader>
              <XStack justifyContent="space-between" alignItems="center">
                <CardTitle>Recent Orders</CardTitle>
                <XStack backgroundColor="$gray2" borderRadius="$2" padding="$2" position="relative" alignItems="center">
                  <YStack position="absolute" left={8} zIndex={1}>
                    <Search size={16} color="#888" />
                  </YStack>
                  <Input placeholder="Search orders..." paddingLeft={32} paddingRight={16} paddingVertical={8} backgroundColor="transparent" borderWidth={0} />
                </XStack>
              </XStack>
            </CardHeader>
            <CardContent>
              <YStack>
                <YStack borderBottomWidth={1} borderColor="$border" padding="$4" hoverStyle={{ backgroundColor: "$gray2" }}>
                  <XStack justifyContent="space-between" alignItems="center">
                    <Text fontFamily="monospace" fontSize="$2">#ORD-001</Text>
                    <Text fontWeight="600">AMS</Text>
                    <Text>MARKET</Text>
                    <XStack alignItems="center" gap="$1"><TrendingUp size={16} color="#16a34a" /><Text color="$green10">BUY</Text></XStack>
                    <Text>100</Text>
                    <Text>125.50 MAD</Text>
                    <StyledBadge variant="green"><Text fontSize="$1">FILLED</Text></StyledBadge>
                    <Text fontSize="$2" color="$gray8">2 min ago</Text>
                    <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                  </XStack>
                </YStack>
              </YStack>
            </CardContent>
          </Card>
        </YStack>
      </YStack>
    </XStack>
  );
}
