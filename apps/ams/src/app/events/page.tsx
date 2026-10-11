"use client";

import { useState } from "react";
import { Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, TableSkeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView, StatCard, StatGrid } from "@/components/page";
import { api, formatCount, formatDateTime, type AdminEvent } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 13,
  padding: "7px 11px",
};

export default function EventsPage() {
  const { resource, retry } = useResource((signal) => api.events(signal), []);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Amphi 4 — FSJES Ain Chock, Casablanca");
  const [format, setFormat] = useState<"IN_PERSON" | "ONLINE" | "HYBRID">("IN_PERSON");
  const [startsAt, setStartsAt] = useState("2026-05-10T15:00");
  const [capacity, setCapacity] = useState("100");
  const [notice, setNotice] = useState<string | null>(null);

  const handleCreateEvent = async () => {
    if (!title.trim()) return;
    try {
      const created = await api.createEvent({
        title: title.trim(),
        description: description.trim() || undefined,
        location: location.trim(),
        format,
        startsAt: new Date(startsAt).toISOString(),
        capacity: Number(capacity) || 80,
      });
      setNotice(`Scheduled event "${created.title}" (${created.format}).`);
      setTitle("");
      setDescription("");
      setShowCreateForm(false);
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create event.");
    }
  };

  const handleStatusChange = async (event: AdminEvent, status: string) => {
    await api.updateEvent({ id: event.id, status });
    setNotice(`Event "${event.title}" status updated to ${status.toUpperCase()}.`);
    retry();
  };

  const handleDeleteEvent = async (event: AdminEvent) => {
    await api.deleteEvent(event.id);
    setNotice(`Removed event "${event.title}".`);
    retry();
  };

  const columns: Column<AdminEvent>[] = [
    {
      header: "Session & Venue",
      width: 340,
      render: (event) => (
        <YStack gap="$0.5">
          <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
            {event.title}
          </Text>
          <Text fontSize="$1" color="$foregroundMuted" numberOfLines={1}>
            {event.location ?? "FSJES Ain Chock"}
          </Text>
        </YStack>
      ),
    },
    {
      header: "Format",
      width: 110,
      render: (event) => <Badge tone="info">{event.format ?? "IN_PERSON"}</Badge>,
    },
    {
      header: "Starts (Casablanca)",
      width: 170,
      render: (event) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
          {formatDateTime(event.startsAt)}
        </Text>
      ),
    },
    {
      header: "Registrations",
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
      render: (event) => <StatusBadge status={event.status ?? "scheduled"} />,
    },
    {
      header: "Controls",
      width: 220,
      render: (event) => (
        <XStack gap="$1.5" alignItems="center">
          <select
            value={event.status ?? "scheduled"}
            onChange={(e) => void handleStatusChange(event, e.target.value)}
            aria-label={`Status for ${event.title}`}
            style={{ ...INPUT_STYLE, padding: "5px 8px", fontSize: 12, fontFamily: "monospace" }}
          >
            <option value="scheduled">SCHEDULED</option>
            <option value="active">ACTIVE</option>
            <option value="completed">COMPLETED</option>
            <option value="cancelled">CANCELLED</option>
          </select>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleDeleteEvent(event)}
          >
            <Trash2 size={13} color="#e8745a" />
          </Button>
        </XStack>
      ),
    },
  ];

  return (
    <AppShell title="Events & Sessions">
      <PageHeader
        title="Club Events, Workshops & Desk Briefings"
        lead="Schedule in-person amphitheater sessions, hybrid workshops, and online market briefings."
        action={
          <Button
            variant="primary"
            size="md"
            onPress={() => setShowCreateForm((prev) => !prev)}
          >
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text color="$canvas" fontWeight="600">
                {showCreateForm ? "Close form" : "Schedule event"}
              </Text>
            </XStack>
          </Button>
        }
      />

      {notice ? (
        <Card padding="$3" marginBottom="$4" borderColor="$bull">
          <XStack alignItems="center" justifyContent="space-between" gap="$3">
            <XStack alignItems="center" gap="$2">
              <CheckCircle2 size={16} color="#2dbf8e" />
              <Text fontFamily="$mono" fontSize="$2" color="$bull">
                {notice}
              </Text>
            </XStack>
            <Button size="sm" variant="ghost" onPress={() => setNotice(null)}>
              <Text fontSize="$1" color="$foregroundMuted">
                Dismiss
              </Text>
            </Button>
          </XStack>
        </Card>
      ) : null}

      {showCreateForm ? (
        <Card padding="$4" marginBottom="$4" borderColor="$bull">
          <Text fontSize="$4" fontWeight="600" color="$foreground" marginBottom="$3">
            Schedule Club Workshop or Session
          </Text>
          <YStack gap="$3">
            <XStack flexWrap="wrap" gap="$3">
              <YStack gap="$1" flex={2} minWidth={240}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  SESSION TITLE
                </Text>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Fixed Income & BAM Monetary Policy Workshop"
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" flex={1} minWidth={220}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  VENUE / STREAM LINK
                </Text>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Amphi 4 — FSJES Ain Chock"
                  style={INPUT_STYLE}
                />
              </YStack>
            </XStack>

            <XStack flexWrap="wrap" gap="$3" alignItems="flex-end">
              <YStack gap="$1" width={150}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  FORMAT
                </Text>
                <select
                  value={format}
                  onChange={(e) =>
                    setFormat(e.target.value as "IN_PERSON" | "ONLINE" | "HYBRID")
                  }
                  style={INPUT_STYLE}
                >
                  <option value="IN_PERSON">IN PERSON</option>
                  <option value="HYBRID">HYBRID</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </YStack>
              <YStack gap="$1" minWidth={210}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  DATE & TIME (CASABLANCA)
                </Text>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" width={120}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  CAPACITY
                </Text>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" flex={1} minWidth={220}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  DESCRIPTION
                </Text>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Agenda and prerequisites..."
                  style={INPUT_STYLE}
                />
              </YStack>
              <Button variant="primary" size="md" onPress={() => void handleCreateEvent()}>
                <Text color="$canvas" fontWeight="600">
                  Publish Event
                </Text>
              </Button>
            </XStack>
          </YStack>
        </Card>
      ) : null}

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={4} />}>
        {(events) => {
          const totalRegistrations = events.reduce(
            (sum, e) => sum + (e.registrationCount ?? 0),
            0,
          );
          const scheduledCount = events.filter((e) => e.status === "scheduled").length;

          return (
            <>
              <StatGrid>
                <StatCard label="Total Sessions" value={formatCount(events.length)} />
                <StatCard label="Upcoming Scheduled" value={formatCount(scheduledCount)} />
                <StatCard label="Total Registrations" value={formatCount(totalRegistrations)} />
              </StatGrid>

              <Card padding="$4">
                {events.length > 0 ? (
                  <DataTable columns={columns} rows={events} rowKey={(event) => event.id} />
                ) : (
                  <EmptyState
                    title="No events scheduled"
                    description="Sessions appear here once they are published to the club calendar."
                  />
                )}
              </Card>
            </>
          );
        }}
      </ResourceView>
    </AppShell>
  );
}
