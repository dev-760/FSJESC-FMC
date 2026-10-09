"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { XStack, YStack, Text } from "tamagui";
import { TrendingUp, Users, ShoppingCart, DollarSign, Calendar, BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <YStack marginBottom="$6">
            <Text fontSize="$8" fontWeight="700">Analytics</Text>
            <Text color="$gray10">Platform performance and user engagement metrics</Text>
          </YStack>

          <XStack flexWrap="wrap" gap="$6">
            <Card flex={1} minWidth={200}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Total Revenue</Text>
                  <DollarSign size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <Text fontSize="$7" fontWeight="700">45,231 MAD</Text>
                <Text fontSize="$1" color="$gray8">+20.1% from last month</Text>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={200}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Active Users</Text>
                  <Users size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <Text fontSize="$7" fontWeight="700">+2350</Text>
                <Text fontSize="$1" color="$gray8">+180.1% from last month</Text>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={200}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Orders</Text>
                  <ShoppingCart size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <Text fontSize="$7" fontWeight="700">+12,234</Text>
                <Text fontSize="$1" color="$gray8">+19% from last month</Text>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={200}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Active Now</Text>
                  <TrendingUp size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <Text fontSize="$7" fontWeight="700">+573</Text>
                <Text fontSize="$1" color="$gray8">+201 since last hour</Text>
              </CardContent>
            </Card>
          </XStack>

          <Card marginTop="$6">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <YStack space="$4">
                <YStack borderBottomWidth={1} borderColor="$border" paddingBottom="$4">
                  <XStack alignItems="center" gap="$4">
                    <YStack width={40} height={40} borderRadius="$12" backgroundColor="$blue3" alignItems="center" justifyContent="center">
                      <Users size={20} color="$blue10" />
                    </YStack>
                    <YStack flex={1}>
                      <Text fontWeight="600">New user registrations spike</Text>
                      <Text fontSize="$2" color="$gray8">+45 new users in the last hour</Text>
                    </YStack>
                    <XStack alignItems="center" gap="$1"><Calendar size={16} /><Text fontSize="$2" color="$gray8">2 hours ago</Text></XStack>
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
