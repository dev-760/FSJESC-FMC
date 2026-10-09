"use client";

import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XStack, YStack, Text, styled, Progress } from "tamagui";
import { CheckCircle, XCircle, AlertTriangle, Server, Database, Activity } from "lucide-react";

export default function SystemPage() {
  return (
    <XStack flex={1} height="100vh" backgroundColor="$gray1">
      <Sidebar />
      <YStack flex={1} overflow="hidden">
        <Header />
        <YStack flex={1} style={{ overflowY: "auto" }} padding="$6">
          <YStack marginBottom="$6">
            <Text fontSize="$8" fontWeight="700">System Status</Text>
            <Text color="$gray10">Monitor system health and performance</Text>
          </YStack>

          <XStack flexWrap="wrap" gap="$6">
            <Card flex={1} minWidth={280}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">API Server</Text>
                  <Server size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size={20} color="$green10" />
                  <Text fontSize="$5" fontWeight="600">Operational</Text>
                </XStack>
                <Text fontSize="$1" color="$gray8" marginTop="$2">Uptime: 99.9% (30 days)</Text>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={280}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Database</Text>
                  <Database size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size={20} color="$green10" />
                  <Text fontSize="$5" fontWeight="600">Healthy</Text>
                </XStack>
                <Text fontSize="$1" color="$gray8" marginTop="$2">Latency: 12ms avg</Text>
              </CardContent>
            </Card>

            <Card flex={1} minWidth={280}>
              <CardHeader>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$3" fontWeight="500">Market Engine</Text>
                  <Activity size={16} color="$gray8" />
                </XStack>
              </CardHeader>
              <CardContent>
                <XStack alignItems="center" gap="$2">
                  <CheckCircle size={20} color="$green10" />
                  <Text fontSize="$5" fontWeight="600">Running</Text>
                </XStack>
                <Text fontSize="$1" color="$gray8" marginTop="$2">Processing: 150/sec</Text>
              </CardContent>
            </Card>
          </XStack>

          <Card marginTop="$6">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <XStack flexWrap="wrap" gap="$4">
                <Button variant="outline" flexDirection="column" gap="$2" paddingVertical="$4">
                  <Server size={20} />
                  <Text>Restart API Server</Text>
                </Button>
                <Button variant="outline" flexDirection="column" gap="$2" paddingVertical="$4">
                  <Database size={20} />
                  <Text>Run Database Backup</Text>
                </Button>
                <Button variant="outline" flexDirection="column" gap="$2" paddingVertical="$4">
                  <Activity size={20} />
                  <Text>Clear Cache</Text>
                </Button>
              </XStack>
            </CardContent>
          </Card>
        </YStack>
      </YStack>
    </XStack>
  );
}
