"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled } from "tamagui";
import {
  Users,
  FileText,
  Calendar,
  Trophy,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";

const StatCard = styled(YStack, {
  name: "StatCard",
  backgroundColor: "$gray2",
  borderRadius: "$3",
  padding: "$4",
  space: "$2",
});

export default function DashboardPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <YStack marginBottom="$6">
            <Text fontSize="$8" fontWeight="700">
              Dashboard
            </Text>
            <Text color="$gray10">
              Welcome to the Admin Management System
            </Text>
          </YStack>

          <XStack flexWrap="wrap" gap="$4" marginBottom="$6">
            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Total Users
                </Text>
                <Users size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                1,234
              </Text>
              <Text fontSize="$1" color="$gray8">
                +12% from last month
              </Text>
            </StatCard>

            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Active Articles
                </Text>
                <FileText size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                45
              </Text>
              <Text fontSize="$1" color="$gray8">
                +3 this week
              </Text>
            </StatCard>

            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Upcoming Events
                </Text>
                <Calendar size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                8
              </Text>
              <Text fontSize="$1" color="$gray8">
                Next: Tomorrow
              </Text>
            </StatCard>

            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Active Competitions
                </Text>
                <Trophy size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                3
              </Text>
              <Text fontSize="$1" color="$gray8">
                156 participants
              </Text>
            </StatCard>

            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Total Orders
                </Text>
                <ShoppingCart size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                2,847
              </Text>
              <Text fontSize="$1" color="$gray8">
                +28% from last week
              </Text>
            </StatCard>

            <StatCard flex={1} minWidth={280}>
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$3" fontWeight="500">
                  Trading Volume
                </Text>
                <TrendingUp size={16} color="$gray8" />
              </XStack>
              <Text fontSize="$7" fontWeight="700">
                1.2M MAD
              </Text>
              <Text fontSize="$1" color="$gray8">
                +15% from last month
              </Text>
            </StatCard>
          </XStack>

          <XStack flexWrap="wrap" gap="$6">
            <Card flex={1} minWidth={400}>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <YStack space="$4">
                  <YStack
                    borderBottomWidth={1}
                    borderColor="$border"
                    paddingBottom="$4"
                  >
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack>
                        <Text fontWeight="600">New user registered</Text>
                        <Text fontSize="$2" color="$gray8">
                          student@example.com
                        </Text>
                      </YStack>
                      <Text fontSize="$2" color="$gray8">
                        2 hours ago
                      </Text>
                    </XStack>
                  </YStack>
                  <YStack
                    borderBottomWidth={1}
                    borderColor="$border"
                    paddingBottom="$4"
                  >
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack>
                        <Text fontWeight="600">Article published</Text>
                        <Text fontSize="$2" color="$gray8">
                          Introduction to Options
                        </Text>
                      </YStack>
                      <Text fontSize="$2" color="$gray8">
                        5 hours ago
                      </Text>
                    </XStack>
                  </YStack>
                  <YStack>
                    <XStack justifyContent="space-between" alignItems="flex-start">
                      <YStack>
                        <Text fontWeight="600">Competition started</Text>
                        <Text fontSize="$2" color="$gray8">
                          Fall Trading Challenge
                        </Text>
                      </YStack>
                      <Text fontSize="$2" color="$gray8">
                        1 day ago
                      </Text>
                    </XStack>
                  </YStack>
                </YStack>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={400}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <YStack space="$2">
                  <Button
                    width="100%"
                    textAlign="left"
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$border"
                  >
                    <YStack>
                      <Text fontWeight="600">Create New Event</Text>
                      <Text fontSize="$2" color="$gray8">
                        Schedule a new club event
                      </Text>
                    </YStack>
                  </Button>
                  <Button
                    width="100%"
                    textAlign="left"
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$border"
                  >
                    <YStack>
                      <Text fontWeight="600">Publish Article</Text>
                      <Text fontSize="$2" color="$gray8">
                        Share educational content
                      </Text>
                    </YStack>
                  </Button>
                  <Button
                    width="100%"
                    textAlign="left"
                    backgroundColor="transparent"
                    borderWidth={1}
                    borderColor="$border"
                  >
                    <YStack>
                      <Text fontWeight="600">Start Competition</Text>
                      <Text fontSize="$2" color="$gray8">
                        Launch a trading challenge
                      </Text>
                    </YStack>
                  </Button>
                </YStack>
              </CardContent>
            </Card>
          </XStack>
        </YStack>
      </YStack>
    </XStack>
  );
}
