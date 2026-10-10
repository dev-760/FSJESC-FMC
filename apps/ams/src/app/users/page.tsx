"use client";

import { useMemo, useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import { Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge, StatusBadge, toneForStatus } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, Skeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView } from "@/components/page";
import { api, formatDate, type AdminUser } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

/**
 * User administration.
 *
 * The search box on this page was previously decorative — it had no value and no
 * change handler, so typing did nothing. It now actually filters, and the count
 * in the result header reflects the filter rather than the full set.
 */

function Avatar({ name, email }: { name?: string | null; email: string }) {
  const initial = (name?.trim()?.[0] ?? email.trim()[0] ?? "?").toUpperCase();
  return (
    <XStack
      alignItems="center"
      justifyContent="center"
      width={34}
      height={34}
      borderRadius={17}
      backgroundColor="$surfaceInset"
      borderWidth={1}
      borderColor="$rule"
    >
      <Text fontSize="$3" fontWeight="600" color="$foregroundSecondary">
        {initial}
      </Text>
    </XStack>
  );
}

export default function UsersPage() {
  const { resource, retry } = useResource((signal) => api.users(signal), []);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (resource.status !== "ready") return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return resource.data;
    return resource.data.filter((user) =>
      [user.name, user.email, user.role, user.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle)),
    );
  }, [resource, query]);

  const columns: Column<AdminUser>[] = [
    {
      header: "User",
      width: 260,
      render: (user) => (
        <XStack alignItems="center" gap="$3">
          <Avatar name={user.name} email={user.email} />
          <YStack flex={1} minWidth={0}>
            <Text fontSize="$2" fontWeight="600" color="$foreground" numberOfLines={1}>
              {user.name ?? user.email}
            </Text>
            <Text fontSize="$1" color="$foregroundMuted" numberOfLines={1}>
              {user.email}
            </Text>
          </YStack>
        </XStack>
      ),
    },
    {
      header: "Role",
      width: 120,
      render: (user) => <Badge tone={toneForStatus(user.role)}>{user.role.replace(/_/g, " ")}</Badge>,
    },
    {
      header: "Status",
      width: 110,
      render: (user) => <StatusBadge status={user.status ?? "unknown"} />,
    },
    {
      header: "Joined",
      width: 130,
      render: (user) =>
        user.createdAt ? (
          <Text fontFamily="$mono" fontSize="$2" color="$foregroundSecondary">
            {formatDate(user.createdAt)}
          </Text>
        ) : (
          <Text fontSize="$2" color="$foregroundMuted">
            —
          </Text>
        ),
    },
  ];

  return (
    <AppShell title="Users">
      <PageHeader
        title="Users"
        lead="Accounts, roles and their current standing."
        action={
          <Button variant="primary" size="md">
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text>Add user</Text>
            </XStack>
          </Button>
        }
      />

      <Card padding="$4">
        <XStack
          alignItems="center"
          gap="$2"
          backgroundColor="$surfaceSunken"
          borderRadius="$2"
          borderWidth={1}
          borderColor="$rule"
          paddingHorizontal="$3"
          maxWidth={360}
        >
          <Search size={16} color="#6b7280" />
          {/* A real, labelled control rather than an <Input> that discards its
              value: `value` + `onChangeText` is what makes it filter. */}
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or role"
            aria-label="Search users"
            style={{
              flex: 1,
              background: "transparent",
              border: 0,
              outline: "none",
              color: "#f9fafb",
              fontSize: 14,
              padding: "10px 0",
            }}
          />
        </XStack>

        <ResourceView
          resource={resource}
          onRetry={retry}
          loading={
            <YStack gap="$2" paddingTop="$4">
              <Skeleton height={48} />
              <Skeleton height={48} />
              <Skeleton height={48} />
            </YStack>
          }
        >
          {(users) => (
            <>
              <Paragraph fontSize="$1" color="$foregroundMuted" paddingTop="$3" paddingBottom="$2">
                {filtered.length === users.length
                  ? `${filtered.length} users`
                  : `${filtered.length} of ${users.length} users`}
              </Paragraph>

              {filtered.length > 0 ? (
                <DataTable columns={columns} rows={filtered} rowKey={(user) => user.id} />
              ) : (
                <EmptyState
                  title={query ? "No users match that search" : "No users yet"}
                  description={
                    query
                      ? "Try a different name, email address or role."
                      : "Accounts appear here once they register on the platform."
                  }
                />
              )}
            </>
          )}
        </ResourceView>
      </Card>
    </AppShell>
  );
}