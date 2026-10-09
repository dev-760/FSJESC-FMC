"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Input } from "tamagui";
import { Search, Plus, MoreVertical, Calendar, MapPin, Users } from "lucide-react";

const StyledBadge = styled(YStack, {
  name: "Badge",
  borderRadius: "$12",
  paddingHorizontal: "$2.5",
  paddingVertical: "$0.5",
  variants: {
    variant: {
      green: {
        backgroundColor: "$green3",
        color: "$green11",
      },
      yellow: {
        backgroundColor: "$yellow3",
        color: "$yellow11",
      },
    },
  },
});

export default function EventsPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <YStack>
              <Text fontSize="$8" fontWeight="700">Events</Text>
              <Text color="$gray10">Manage club events and sessions</Text>
            </YStack>
            <Button>
              <Plus size={16} />
              Create Event
            </Button>
          </XStack>

          <Card>
            <CardHeader>
              <XStack justifyContent="space-between" alignItems="center">
                <CardTitle>All Events</CardTitle>
                <XStack backgroundColor="$gray2" borderRadius="$2" padding="$2" position="relative" alignItems="center">
                  <YStack position="absolute" left={8} zIndex={1}>
                    <Search size={16} color="#888" />
                  </YStack>
                  <Input
                    placeholder="Search events..."
                    paddingLeft={32}
                    paddingRight={16}
                    paddingVertical={8}
                    backgroundColor="transparent"
                    borderWidth={0}
                  />
                </XStack>
              </XStack>
            </CardHeader>
            <CardContent>
              <YStack space="$4">
                <YStack borderRadius="$3" borderWidth={1} borderColor="$border" padding="$4" hoverStyle={{ backgroundColor: "$gray2" }}>
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1}>
                      <Text fontWeight="600">Trading Workshop: Technical Analysis</Text>
                      <Text fontSize="$2" color="$gray10" marginTop="$2">
                        Learn the fundamentals of technical analysis and chart patterns
                      </Text>
                      <XStack flexWrap="wrap" gap="$4" marginTop="$3">
                        <XStack alignItems="center" gap="$1">
                          <Calendar size={16} />
                          <Text fontSize="$2" color="$gray8">Oct 15, 2024 at 2:00 PM</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <MapPin size={16} />
                          <Text fontSize="$2" color="$gray8">Room 101, Building A</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Users size={16} />
                          <Text fontSize="$2" color="$gray8">25/50 registered</Text>
                        </XStack>
                      </XStack>
                    </YStack>
                    <XStack marginLeft="$4" alignItems="center" gap="$2">
                      <StyledBadge variant="green">
                        <Text fontSize="$1">Published</Text>
                      </StyledBadge>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </XStack>
                  </XStack>
                </YStack>

                <YStack borderRadius="$3" borderWidth={1} borderColor="$border" padding="$4" hoverStyle={{ backgroundColor: "$gray2" }}>
                  <XStack justifyContent="space-between" alignItems="flex-start">
                    <YStack flex={1}>
                      <Text fontWeight="600">Guest Speaker: Wall Street Insights</Text>
                      <Text fontSize="$2" color="$gray10" marginTop="$2">
                        Industry veteran shares experiences from working at top financial firms
                      </Text>
                      <XStack flexWrap="wrap" gap="$4" marginTop="$3">
                        <XStack alignItems="center" gap="$1">
                          <Calendar size={16} />
                          <Text fontSize="$2" color="$gray8">Oct 20, 2024 at 4:00 PM</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <MapPin size={16} />
                          <Text fontSize="$2" color="$gray8">Auditorium</Text>
                        </XStack>
                        <XStack alignItems="center" gap="$1">
                          <Users size={16} />
                          <Text fontSize="$2" color="$gray8">78/100 registered</Text>
                        </XStack>
                      </XStack>
                    </YStack>
                    <XStack marginLeft="$4" alignItems="center" gap="$2">
                      <StyledBadge variant="green">
                        <Text fontSize="$1">Published</Text>
                      </StyledBadge>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
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
