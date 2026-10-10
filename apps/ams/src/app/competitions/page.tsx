"use client";

import { Text } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView } from "@/components/page";
import { api, formatCount, type AdminCompetition } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function CompetitionsPage() {
  const { resource, retry } = useResource((signal) => api.competitions(signal), []);

  const columns: Column<AdminCompetition>[] = [
    {
      header: "Competition",
      width: 340,
      render: (competition) => (
        <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
          {competition.title}
        </Text>
      ),
    },
    {
      header: "Participants",
      width: 130,
      numeric: true,
      render: (competition) => (
        <Text fontFamily="$mono" fontSize="$2" color="$foreground" textAlign="right">
          {formatCount(competition.participantCount ?? 0)}
        </Text>
      ),
    },
    {
      header: "Status",
      width: 120,
      render: (competition) => <StatusBadge status={competition.status ?? "unknown"} />,
    },
  ];

  return (
    <AppShell title="Competitions">
      <PageHeader
        title="Competitions"
        lead="Scenario challenges scored on return and risk rather than absolute profit."
      />

      <Card padding="$4">
        <ResourceView resource={resource} onRetry={retry} loading={null}>
          {(competitions) =>
            competitions.length > 0 ? (
              <DataTable
                columns={columns}
                rows={competitions}
                rowKey={(competition) => competition.id}
              />
            ) : (
              <EmptyState
                title="No competitions configured"
                description="A competition appears here once its scenario assumptions are published."
              />
            )
          }
        </ResourceView>
      </Card>
    </AppShell>
  );
}