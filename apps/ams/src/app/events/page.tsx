"use client";

import { Text, XStack } from "tamagui";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView } from "@/components/page";
import { api, formatCount, formatDateTime, type AdminEvent } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function EventsPage() {
  const { resource, retry } = useResource((signal) => api.events(signal), []);

  const columns: Column<AdminEvent>[] = [
    {
      header: "Event",
      width: 320,
      render: (event) => (
        <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
          {event.title}
        </Text>
      ),
    },
    {
      header: "Starts",
      width: 180,
      render: (event) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
          {formatDateTime(event.startsAt)}
        </Text>
      ),
    },
    {
      header: "Registered",
      width: 120,
      numeric: true,
      render: (event) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {formatCount(event.registrationCount ?? 0)}
          {event.capacity ? (
            <Text fontFamily="$mono" color="$foregroundMuted">
              {` / ${formatCount(event.capacity)}`}
            </Text>
          ) : null}
        </Text>
      ),
    },
    {
      header: "Status",
      width: 110,
      render: (event) => <StatusBadge status={event.status ?? "unknown"} />,
    },
  ];

  return (
    <AppShell title="Events">
      <PageHeader
        title="Events"
        lead="Workshops, lectures and discussion sessions."
        action={
          <Button variant="primary" size="md">
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text>Create event</Text>
            </XStack>
          </Button>
        }
      />

      <Card padding="$4">
        <ResourceView resource={resource} onRetry={retry} loading={null}>
          {(events) =>
            events.length > 0 ? (
              <DataTable
                columns={columns}
                rows={events}
                rowKey={(event) => event.id}
              />
            ) : (
              <EmptyState
                title="No events scheduled"
                description="Sessions appear here once they are published to the club calendar."
              />
            )
          }
        </ResourceView>
      </Card>
    </AppShell>
  );
}
