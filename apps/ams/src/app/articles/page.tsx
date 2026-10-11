"use client";

import { useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Edit3, Plus, Search, Star, Trash2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, TableSkeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView, StatCard, StatGrid } from "@/components/page";
import { api, formatCount, formatDate, type AdminArticle } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "#0f1520",
  border: "1px solid #283449",
  borderRadius: 6,
  color: "#eef2f6",
  fontSize: 13,
  padding: "8px 12px",
};

const CATEGORIES = [
  "Market Structure",
  "Fixed Income & Macro",
  "Equity Research",
  "FX & Commodities",
  "Derivatives",
  "Portfolio & Risk",
] as const;

export default function ArticlesPage() {
  const { resource, retry } = useResource((signal) => api.articles(signal), []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "published" | "draft">("ALL");
  const [showEditor, setShowEditor] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState<string>("Market Structure");
  const [level, setLevel] = useState<"FOUNDATION" | "INTERMEDIATE" | "ADVANCED">("FOUNDATION");
  const [readingTime, setReadingTime] = useState("10");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [essential, setEssential] = useState(false);
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [notice, setNotice] = useState<string | null>(null);

  const openCreateForm = () => {
    setEditingId(null);
    setTitle("");
    setSlug("");
    setCategory("Market Structure");
    setLevel("FOUNDATION");
    setReadingTime("10");
    setSummary("");
    setContent("");
    setEssential(false);
    setStatus("published");
    setShowEditor(true);
  };

  const openEditForm = (art: AdminArticle) => {
    setEditingId(art.id);
    setTitle(art.title);
    setSlug(art.slug);
    setCategory(art.category ?? "Market Structure");
    setLevel(art.level ?? "FOUNDATION");
    setReadingTime(String(art.readingTimeMinutes ?? 10));
    setSummary(art.summary ?? "");
    setContent(art.content ?? "");
    setEssential(Boolean(art.essential));
    setStatus((art.status as "published" | "draft") ?? "published");
    setShowEditor(true);
  };

  const handleSaveArticle = async () => {
    if (!title.trim()) return;
    try {
      if (editingId) {
        await api.updateArticle({
          id: editingId,
          title: title.trim(),
          slug: slug.trim() || undefined,
          category,
          level,
          readingTimeMinutes: Number(readingTime) || 10,
          summary: summary.trim(),
          content,
          essential,
          status,
        });
        setNotice(`Updated article "${title.trim()}".`);
      } else {
        await api.createArticle({
          title: title.trim(),
          slug: slug.trim() || undefined,
          category,
          level,
          readingTimeMinutes: Number(readingTime) || 10,
          summary: summary.trim(),
          content,
          essential,
          status,
        });
        setNotice(`Published new curriculum briefing "${title.trim()}".`);
      }
      setShowEditor(false);
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to save article.");
    }
  };

  const handleToggleStatus = async (art: AdminArticle) => {
    const nextStatus = art.status === "published" ? "draft" : "published";
    await api.updateArticle({ id: art.id, status: nextStatus });
    setNotice(`Article "${art.title}" is now ${nextStatus.toUpperCase()}.`);
    retry();
  };

  const handleToggleEssential = async (art: AdminArticle) => {
    await api.updateArticle({ id: art.id, essential: !art.essential });
    setNotice(
      `"${art.title}" ${!art.essential ? "marked as Essential Track" : "removed from Essential Track"}.`,
    );
    retry();
  };

  const handleDeleteArticle = async (art: AdminArticle) => {
    await api.deleteArticle(art.id);
    setNotice(`Deleted article "${art.title}".`);
    retry();
  };

  const columns: Column<AdminArticle>[] = [
    {
      header: "Briefing Title & Summary",
      width: 340,
      render: (article) => (
        <YStack gap="$0.5">
          <XStack alignItems="center" gap="$2">
            <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
              {article.title}
            </Text>
            {article.essential ? <Badge tone="bull">ESSENTIAL</Badge> : null}
          </XStack>
          <Text fontSize="$1" color="$foregroundMuted" numberOfLines={1}>
            {article.summary ?? `/${article.slug}`}
          </Text>
        </YStack>
      ),
    },
    {
      header: "Category / Level",
      width: 175,
      render: (article) => (
        <YStack gap="$0.5">
          <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary" textTransform="uppercase">
            {article.category ?? "—"}
          </Text>
          <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
            {article.level ?? "FOUNDATION"} · {article.readingTimeMinutes ?? 10} min
          </Text>
        </YStack>
      ),
    },
    {
      header: "Updated",
      width: 120,
      render: (article) =>
        article.updatedAt ? (
          <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary">
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
      width: 105,
      render: (article) => <StatusBadge status={article.status ?? "draft"} />,
    },
    {
      header: "CMS Actions",
      width: 240,
      render: (article) => (
        <XStack gap="$1.5" flexWrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onPress={() => void handleToggleStatus(article)}
          >
            <Text fontSize="$1">
              {article.status === "published" ? "Unpublish" : "Publish"}
            </Text>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => openEditForm(article)}
          >
            <Edit3 size={13} color="#b3c0cb" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleToggleEssential(article)}
          >
            <Star size={13} color={article.essential ? "#2dbf8e" : "#778592"} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleDeleteArticle(article)}
          >
            <Trash2 size={13} color="#e8745a" />
          </Button>
        </XStack>
      ),
    },
  ];

  return (
    <AppShell title="Articles & Content">
      <PageHeader
        title="Curriculum Articles & Research Briefings"
        lead="Create, edit, and publish educational briefings for the FSJESC-FMC topic library."
        action={
          <Button
            variant="primary"
            size="md"
            onPress={() => (showEditor ? setShowEditor(false) : openCreateForm())}
          >
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text color="$canvas" fontWeight="600">
                {showEditor ? "Close editor" : "New briefing"}
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

      {showEditor ? (
        <Card padding="$4" marginBottom="$4" borderColor="$bull">
          <Text fontSize="$4" fontWeight="600" color="$foreground" marginBottom="$3">
            {editingId ? "Edit Curriculum Briefing" : "Compose New Curriculum Briefing"}
          </Text>
          <YStack gap="$3">
            <XStack flexWrap="wrap" gap="$3">
              <YStack gap="$1" flex={2} minWidth={240}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  TITLE
                </Text>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Understanding Moroccan Sovereign BDT Auctions"
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" flex={1} minWidth={180}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  URL SLUG (OPTIONAL)
                </Text>
                <input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="moroccan-sovereign-bdt-auctions"
                  style={{ ...INPUT_STYLE, fontFamily: "monospace" }}
                />
              </YStack>
            </XStack>

            <XStack flexWrap="wrap" gap="$3">
              <YStack gap="$1" flex={1} minWidth={180}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  CATEGORY
                </Text>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={INPUT_STYLE}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </YStack>
              <YStack gap="$1" width={160}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  DIFFICULTY LEVEL
                </Text>
                <select
                  value={level}
                  onChange={(e) =>
                    setLevel(e.target.value as "FOUNDATION" | "INTERMEDIATE" | "ADVANCED")
                  }
                  style={INPUT_STYLE}
                >
                  <option value="FOUNDATION">FOUNDATION</option>
                  <option value="INTERMEDIATE">INTERMEDIATE</option>
                  <option value="ADVANCED">ADVANCED</option>
                </select>
              </YStack>
              <YStack gap="$1" width={130}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  READING MINS
                </Text>
                <input
                  type="number"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                  style={INPUT_STYLE}
                />
              </YStack>
              <YStack gap="$1" width={150}>
                <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                  STATUS
                </Text>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                  style={INPUT_STYLE}
                >
                  <option value="published">PUBLISHED</option>
                  <option value="draft">DRAFT</option>
                </select>
              </YStack>
            </XStack>

            <YStack gap="$1">
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                EXECUTIVE SUMMARY
              </Text>
              <input
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Concise 1-2 sentence summary shown on topic cards..."
                style={INPUT_STYLE}
              />
            </YStack>

            <YStack gap="$1">
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                MARKDOWN BODY CONTENT
              </Text>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="## Key Takeaways&#10;Write institutional research notes and curriculum explanations in Markdown..."
                style={{ ...INPUT_STYLE, fontFamily: "monospace", resize: "vertical" }}
              />
            </YStack>

            <XStack alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="$3">
              <label style={{ display: "flex", alignItems: "center", gap: 8, color: "#eef2f6", fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={essential}
                  onChange={(e) => setEssential(e.target.checked)}
                />
                Feature in Essential Club Reading Track
              </label>
              <XStack gap="$2">
                <Button variant="ghost" size="md" onPress={() => setShowEditor(false)}>
                  <Text>Cancel</Text>
                </Button>
                <Button variant="primary" size="md" onPress={() => void handleSaveArticle()}>
                  <Text color="$canvas" fontWeight="600">
                    {editingId ? "Save Changes" : "Publish Briefing"}
                  </Text>
                </Button>
              </XStack>
            </XStack>
          </YStack>
        </Card>
      ) : null}

      <ResourceView resource={resource} onRetry={retry} loading={<TableSkeleton rows={5} />}>
        {(articles) => {
          const publishedCount = articles.filter((a) => a.status === "published").length;
          const essentialCount = articles.filter((a) => a.essential).length;
          const needle = query.trim().toLowerCase();
          const filtered = articles.filter((a) => {
            if (statusFilter !== "ALL" && a.status !== statusFilter) return false;
            if (!needle) return true;
            return [a.title, a.category, a.slug, a.summary]
              .filter(Boolean)
              .some((v) => String(v).toLowerCase().includes(needle));
          });

          return (
            <>
              <StatGrid>
                <StatCard label="Total Briefings" value={formatCount(articles.length)} />
                <StatCard label="Published Live" value={formatCount(publishedCount)} />
                <StatCard label="Essential Track" value={formatCount(essentialCount)} />
                <StatCard
                  label="Draft Queue"
                  value={formatCount(articles.length - publishedCount)}
                />
              </StatGrid>

              <Card padding="$4">
                <XStack
                  flexWrap="wrap"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="$3"
                  marginBottom="$3"
                >
                  <XStack
                    alignItems="center"
                    gap="$2"
                    backgroundColor="$surfaceSunken"
                    borderRadius="$2"
                    borderWidth={1}
                    borderColor="$rule"
                    paddingHorizontal="$3"
                    flex={1}
                    maxWidth={360}
                  >
                    <Search size={16} color="#778592" />
                    <input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Filter by title, slug, or category..."
                      aria-label="Filter articles"
                      style={{
                        flex: 1,
                        background: "transparent",
                        border: 0,
                        outline: "none",
                        color: "#eef2f6",
                        fontSize: 14,
                        padding: "10px 0",
                      }}
                    />
                  </XStack>

                  <XStack gap="$1.5">
                    {(["ALL", "published", "draft"] as const).map((st) => (
                      <Button
                        key={st}
                        size="sm"
                        variant={statusFilter === st ? "secondary" : "ghost"}
                        onPress={() => setStatusFilter(st)}
                      >
                        <Text
                          fontFamily="$mono"
                          fontSize="$0"
                          textTransform="uppercase"
                          color={statusFilter === st ? "$bull" : "$foregroundSecondary"}
                        >
                          {st}
                        </Text>
                      </Button>
                    ))}
                  </XStack>
                </XStack>

                <Paragraph fontSize="$1" color="$foregroundMuted" marginBottom="$2">
                  Showing {filtered.length} of {articles.length} briefings
                </Paragraph>

                {filtered.length > 0 ? (
                  <DataTable
                    columns={columns}
                    rows={filtered}
                    rowKey={(article) => article.id}
                  />
                ) : (
                  <EmptyState
                    title={needle ? "No articles match that filter" : "No articles published"}
                    description={
                      needle
                        ? "Try a different topic keyword or category."
                        : "Topics appear here once they are written and published."
                    }
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