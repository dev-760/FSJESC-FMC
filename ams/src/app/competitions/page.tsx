"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Input } from "tamagui";
import { Search, Plus, MoreVertical, Trophy, Users, Clock, TrendingUp } from "lucide-react";

const StyledBadge = styled(YStack, {
  name: "Badge",
  borderRadius: "$12",
  paddingHorizontal: "$2.5",
  paddingVertical: "$0.5",
  variants: {
    variant: {
      green: { backgroundColor: "$green3", color: "$green11" },
      blue: { backgroundColor: "$blue3", color: "$blue11" },
      gray: { backgroundColor: "$gray3", color: "$gray11" },
    },
  },
});

export default function CompetitionsPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <YStack>
              <Text fontSize="$8" fontWeight="700">Competitions</Text>
              <Text color="$gray10">Manage trading competitions and challenges</Text>
            </YStack>
            <Button>
              <Plus size={16} />
              Create Competition
            </Button>
          </XStack>

          <Card>
            <CardHeader>
              <XStack justifyContent="space-between" alignItems="center">
                <CardTitle>All Competitions</CardTitle>
                <XStack backgroundColor="$gray2" borderRadius="$2" padding="$2" position="relative" alignItems="center">
                  <YStack position="absolute" left={8} zIndex={1}>
                    <Search size={16} color="#888" />
                  </YStack>
                  <Input placeholder="Search competitions..." paddingLeft={32} paddingRight={16} paddingVertical={8} backgroundColor="transparent" borderWidth={0} />
                </XStack>
              </XStack>
            </CardHeader>
            <CardContent>
              <YStack space="$4">
                <YStack borderRadius="$3" borderWidth={1} borderColor="$border" padding="$4" hoverStyle={{ backgroundColor: "$gray2" }}>
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$2">
                        <Text fontWeight="600">Fall Trading Challenge 2024</Text>
                        <Trophy size={16} color="#fbbf24" />
                      </XStack>
                      <Text fontSize="$2" color="$gray10" marginTop="$2">Test your trading skills in our flagship semester competition</Text>
                      <XStack flexWrap="wrap" gap="$4" marginTop="$3">
                        <XStack alignItems="center" gap="$1"><Users size={16} /><Text fontSize="$2" color="$gray8">156 participants</Text></XStack>
                        <XStack alignItems="center" gap="$1"><Clock size={16} /><Text fontSize="$2" color="$gray8">Oct 25 - Dec 15, 2024</Text></XStack>
                        <XStack alignItems="center" gap="$1"><TrendingUp size={16} /><Text fontSize="$2" color="$gray8">Starting: 10,000 MAD</Text></XStack>
                      </XStack>
                    </YStack>
                    <XStack marginLeft="$4" alignItems="center" gap="$2">
                      <StyledBadge variant="green"><Text fontSize="$1">Active</Text></StyledBadge>
                      <Button variant="ghost" size="icon"><MoreVertical size={16} /></Button>
                    </XStack>
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
