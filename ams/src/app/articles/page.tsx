"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Input } from "tamagui";
import { Search, Plus, MoreVertical, FileText, Eye, Star } from "lucide-react";

const StyledBadge = styled(YStack, {
  name: "Badge",
  borderRadius: "$12",
  paddingHorizontal: "$2.5",
  paddingVertical: "$0.5",
  variants: {
    variant: {
      blue: { backgroundColor: "$blue3", color: "$blue11" },
      purple: { backgroundColor: "$purple3", color: "$purple11" },
      green: { backgroundColor: "$green3", color: "$green11" },
      orange: { backgroundColor: "$orange3", color: "$orange11" },
    },
  },
});

export default function ArticlesPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <YStack>
              <Text fontSize="$8" fontWeight="700">Articles</Text>
              <Text color="$gray10">Manage educational content and publications</Text>
            </YStack>
            <Button>
              <Plus size={16} />
              New Article
            </Button>
          </XStack>

          <Card>
            <CardHeader>
              <XStack justifyContent="space-between" alignItems="center">
                <CardTitle>All Articles</CardTitle>
                <XStack backgroundColor="$gray2" borderRadius="$2" padding="$2" position="relative" alignItems="center">
                  <YStack position="absolute" left={8} zIndex={1}>
                    <Search size={16} color="#888" />
                  </YStack>
                  <Input placeholder="Search articles..." paddingLeft={32} paddingRight={16} paddingVertical={8} backgroundColor="transparent" borderWidth={0} />
                </XStack>
              </XStack>
            </CardHeader>
            <CardContent>
              <YStack space="$4">
                <YStack borderRadius="$3" borderWidth={1} borderColor="$border" padding="$4" hoverStyle={{ backgroundColor: "$gray2" }}>
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1}>
                      <XStack alignItems="center" gap="$2">
                        <Text fontWeight="600">Introduction to Stock Markets</Text>
                        <Star size={16} fill="#fbbf24" color="#fbbf24" />
                      </XStack>
                      <Text fontSize="$2" color="$gray10" marginTop="$2">A comprehensive guide to understanding how stock markets work</Text>
                      <XStack flexWrap="wrap" gap="$4" marginTop="$3">
                        <StyledBadge variant="blue"><Text fontSize="$1">Fundamentals</Text></StyledBadge>
                        <XStack alignItems="center" gap="$1"><Eye size={16} /><Text fontSize="$2" color="$gray8">1,234 views</Text></XStack>
                        <Text fontSize="$2" color="$gray8">Published: Jan 10, 2024</Text>
                      </XStack>
                    </YStack>
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
