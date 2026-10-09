"use client";

import { Text } from "tamagui";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView } from "@/components/page";
import { api, formatDate, type AdminArticle } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

export default function ArticlesPage() {
  const { resource, retry } = useResource((signal) => api.articles(), []);

  const columns: Column<AdminArticle>[] = [
    {
      header: "Title",
      width: 360,
      render: (article) => (
        <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
          {article.title}
        </Text>
      ),
    },
    {
      header: "Category",
      width: 160,
      render: (article) => (
        <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary" textTransform="uppercase">
          {article.category ?? "—"}
        </Text>
      ),
    },
    {
      header: "Updated",
      width: 140,
      render: (article) =>
        article.updatedAt ? (
          <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
            {formatDate(article.updatedAt)}
          </Text>
        ) : (
          <Text fontSize="$2" color="$foregroundMuted">
            —
          </Text>
        ),
    },
    {
      header: "Status",
      width: 110,
      render: (article) => <StatusBadge status={article.status ?? "draft"} />,
    },
  ];

  return (
    <AppShell title="Articles">
      <PageHeader
        title="Articles"
        lead="Published education material in the club's topic library."
      />

      <Card padding="$4">
        <ResourceView resource={resource} onRetry={retry} loading={null}>
          {(articles) =>
            articles.length > 0 ? (
              <DataTable
                columns={columns}
                rows={articles}
                rowKey={(article) => article.id}
              />
            ) : (
              <EmptyState
                title="No articles published"
                description="Topics appear here once they are written and published."
              />
            )
          }
        </ResourceView>
      </Card>
    </AppShell>
  );
}