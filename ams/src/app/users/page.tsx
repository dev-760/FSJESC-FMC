"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Input } from "tamagui";
import { Search, Plus, MoreVertical, Shield, User } from "lucide-react";

const StyledBadge = styled(YStack, {
  name: "Badge",
  borderRadius: "$12",
  paddingHorizontal: "$2.5",
  paddingVertical: "$0.5",
  variants: {
    variant: {
      blue: {
        backgroundColor: "$blue3",
        color: "$blue11",
      },
      purple: {
        backgroundColor: "$purple3",
        color: "$purple11",
      },
      orange: {
        backgroundColor: "$orange3",
        color: "$orange11",
      },
      green: {
        backgroundColor: "$green3",
        color: "$green11",
      },
    },
  },
});

export default function UsersPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$6">
            <YStack>
              <Text fontSize="$8" fontWeight="700">
                Users
              </Text>
              <Text color="$gray10">
                Manage user accounts and permissions
              </Text>
            </YStack>
            <Button>
              <Plus size={16} />
              Add User
            </Button>
          </XStack>

          <Card>
            <CardHeader>
              <XStack justifyContent="space-between" alignItems="center">
                <CardTitle>All Users</CardTitle>
                <XStack backgroundColor="$gray2" borderRadius="$2" padding="$2" position="relative" alignItems="center">
                  <YStack position="absolute" left={8} zIndex={1}>
                    <Search size={16} color="#888" />
                  </YStack>
                  <Input
                    placeholder="Search users..."
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
              <YStack>
                <YStack
                  borderBottomWidth={1}
                  borderColor="$border"
                  padding="$4"
                  hoverStyle={{ backgroundColor: "$gray2" }}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$12"
                        backgroundColor="$blue3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <User size={20} color="$blue10" />
                      </YStack>
                      <YStack>
                        <Text fontWeight="600">John Doe</Text>
                        <Text fontSize="$2" color="$gray8">
                          ID: STU001
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$4">
                      <Text>john.doe@example.com</Text>
                      <StyledBadge variant="blue">
                        <Text fontSize="$1">STUDENT</Text>
                      </StyledBadge>
                      <StyledBadge variant="green">
                        <Text fontSize="$1">Active</Text>
                      </StyledBadge>
                      <Text fontSize="$2" color="$gray8">
                        Jan 15, 2024
                      </Text>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </XStack>
                  </XStack>
                </YStack>

                <YStack
                  borderBottomWidth={1}
                  borderColor="$border"
                  padding="$4"
                  hoverStyle={{ backgroundColor: "$gray2" }}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$12"
                        backgroundColor="$purple3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Shield size={20} color="$purple10" />
                      </YStack>
                      <YStack>
                        <Text fontWeight="600">Jane Smith</Text>
                        <Text fontSize="$2" color="$gray8">
                          ID: MEM001
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$4">
                      <Text>jane.smith@example.com</Text>
                      <StyledBadge variant="purple">
                        <Text fontSize="$1">MEMBER</Text>
                      </StyledBadge>
                      <StyledBadge variant="green">
                        <Text fontSize="$1">Active</Text>
                      </StyledBadge>
                      <Text fontSize="$2" color="$gray8">
                        Dec 10, 2023
                      </Text>
                      <Button variant="ghost" size="icon">
                        <MoreVertical size={16} />
                      </Button>
                    </XStack>
                  </XStack>
                </YStack>

                <YStack
                  padding="$4"
                  hoverStyle={{ backgroundColor: "$gray2" }}
                >
                  <XStack justifyContent="space-between" alignItems="center">
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={40}
                        height={40}
                        borderRadius="$12"
                        backgroundColor="$orange3"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Shield size={20} color="$orange10" />
                      </YStack>
                      <YStack>
                        <Text fontWeight="600">Admin User</Text>
                        <Text fontSize="$2" color="$gray8">
                          ID: EXE001
                        </Text>
                      </YStack>
                    </XStack>
                    <XStack alignItems="center" gap="$4">
                      <Text>admin@example.com</Text>
                      <StyledBadge variant="orange">
                        <Text fontSize="$1">EXECUTIVE</Text>
                      </StyledBadge>
                      <StyledBadge variant="green">
                        <Text fontSize="$1">Active</Text>
                      </StyledBadge>
                      <Text fontSize="$2" color="$gray8">
                        Nov 1, 2023
                      </Text>
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
