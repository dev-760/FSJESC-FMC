"use client";

import { useMemo, useState } from "react";
import { Paragraph, Text, XStack, YStack } from "tamagui";
import { CheckCircle2, Plus, RotateCcw, Search, Trash2, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, EmptyState, Skeleton, type Column } from "@/components/ui/data-table";
import { PageHeader, ResourceView, StatCard, StatGrid } from "@/components/page";
import { api, formatCount, formatDate, formatMAD, type AdminUser } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--surface-raised)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  color: "var(--text)",
  fontSize: 13,
  padding: "7px 11px",
};

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
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteTrack, setInviteTrack] = useState("Master Finance & Ingénierie Financière");
  const [inviteRole, setInviteRole] = useState("STUDENT");
  const [inviteCashMad, setInviteCashMad] = useState("100000");
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (resource.status !== "ready") return [];
    const needle = query.trim().toLowerCase();
    return resource.data.filter((user) => {
      if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
      if (!needle) return true;
      return [user.name, user.email, user.role, user.status, user.track, user.studentId]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [resource, query, roleFilter]);

  const handleCreateUser = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const created = await api.createUser({
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        track: inviteTrack.trim() || undefined,
        role: inviteRole,
        startingCashMad: Number(inviteCashMad) || 100_000,
      });
      setNotice(`Provisioned account ${created.email} (${created.role}) with ${inviteCashMad} MAD.`);
      setInviteEmail("");
      setInviteName("");
      setShowInviteForm(false);
      retry();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Failed to create user.");
    }
  };

  const handleRoleChange = async (user: AdminUser, newRole: string) => {
    await api.updateUser({ id: user.id, role: newRole });
    setNotice(`Updated role for ${user.email} to ${newRole}.`);
    retry();
  };

  const handleToggleStatus = async (user: AdminUser) => {
    const nextStatus = user.status === "suspended" ? "active" : "suspended";
    await api.updateUser({ id: user.id, status: nextStatus });
    setNotice(`Account ${user.email} is now ${nextStatus.toUpperCase()}.`);
    retry();
  };

  const handleResetPortfolio = async (user: AdminUser) => {
    await api.updateUser({ id: user.id, portfolioAction: "RESET_100K" });
    setNotice(`Reset simulator portfolio for ${user.email} to 100,000.00 MAD.`);
    retry();
  };

  const handleCreditPortfolio = async (user: AdminUser, amountMad: number) => {
    await api.updateUser({
      id: user.id,
      portfolioAction: "CREDIT_CASH",
      creditAmountMad: amountMad,
    });
    setNotice(`Credited +${amountMad.toLocaleString("fr-MA")} MAD to ${user.email}.`);
    retry();
  };

  const handleDeleteUser = async (user: AdminUser) => {
    await api.deleteUser(user.id);
    setNotice(`Deleted user account ${user.email}.`);
    retry();
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "Member / Track",
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
            {user.track ? (
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary" numberOfLines={1}>
                {user.track}
              </Text>
            ) : null}
          </YStack>
        </XStack>
      ),
    },
    {
      header: "RBAC Role",
      width: 155,
      render: (user) => (
        <select
          value={user.role}
          onChange={(e) => void handleRoleChange(user, e.target.value)}
          aria-label={`Role for ${user.email}`}
          style={{ ...INPUT_STYLE, padding: "5px 8px", fontSize: 12, fontFamily: "monospace" }}
        >
          <option value="STUDENT">STUDENT</option>
          <option value="MEMBER">MEMBER</option>
          <option value="EXECUTIVE">EXECUTIVE</option>
          <option value="ADMINISTRATOR">ADMINISTRATOR</option>
        </select>
      ),
    },
    {
      header: "Standing",
      width: 105,
      render: (user) => <StatusBadge status={user.status ?? "active"} />,
    },
    {
      header: "Portfolio Cash",
      width: 145,
      numeric: true,
      render: (user) => (
        <YStack alignItems="flex-end">
          <Text fontFamily="$mono" fontSize="$2" fontWeight="600" color="$bull">
            {formatMAD(user.cashCents ?? "10000000")}
          </Text>
          <Text fontFamily="$mono" fontSize="$0" color="$foregroundMuted">
            {user.positionsCount ?? 0} pos · {user.ordersCount ?? 0} orders
          </Text>
        </YStack>
      ),
    },
    {
      header: "Joined",
      width: 115,
      render: (user) =>
        user.createdAt ? (
          <Text fontFamily="$mono" fontSize="$1" color="$foregroundSecondary">
            {formatDate(user.createdAt)}
          </Text>
        ) : (
          <Text fontSize="$2" color="$foregroundMuted">
            —
          </Text>
        ),
    },
    {
      header: "Portfolio & Account Actions",
      width: 280,
      render: (user) => (
        <XStack gap="$1.5" flexWrap="wrap">
          <Button
            size="sm"
            variant="outline"
            onPress={() => void handleResetPortfolio(user)}
          >
            <XStack alignItems="center" gap="$1">
              <RotateCcw size={12} color="#b3c0cb" />
              <Text fontSize="$1">Reset 100k</Text>
            </XStack>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onPress={() => void handleCreditPortfolio(user, 25_000)}
          >
            <XStack alignItems="center" gap="$1">
              <Wallet size={12} color="#2dbf8e" />
              <Text fontSize="$1" color="$bull">
                +25k MAD
              </Text>
            </XStack>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleToggleStatus(user)}
          >
            <Text
              fontSize="$1"
              color={user.status === "suspended" ? "$bull" : "$warning"}
            >
              {user.status === "suspended" ? "Activate" : "Suspend"}
            </Text>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void handleDeleteUser(user)}
          >
            <Trash2 size={13} color="#e8745a" />
          </Button>
        </XStack>
      ),
    },
  ];

  const roles = ["ALL", "ADMINISTRATOR", "EXECUTIVE", "MEMBER", "STUDENT"];

  return (
    <AppShell title="Users & Portfolios">
      <PageHeader
        title="Users, RBAC Roles & Simulator Portfolios"
        lead="Provision club members, assign role-based privileges, suspend or activate accounts, and reset or credit 100,000 MAD simulator portfolios."
        action={
          <Button
            variant="primary"
            size="md"
            onPress={() => setShowInviteForm((prev) => !prev)}
          >
            <XStack alignItems="center" gap="$2">
              <Plus size={16} />
              <Text color="$canvas" fontWeight="600">
                {showInviteForm ? "Close form" : "Provision user"}
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

      {showInviteForm ? (
        <Card padding="$4" marginBottom="$4" borderColor="$bull">
          <Text fontSize="$4" fontWeight="600" color="$foreground" marginBottom="$3">
            Provision Club Account & Simulator Portfolio
          </Text>
          <XStack flexWrap="wrap" gap="$3" alignItems="flex-end">
            <YStack gap="$1" flex={1} minWidth={180}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                FULL NAME
              </Text>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="e.g. Zineb Bennani"
                aria-label="Full name"
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={210}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                UNIVERSITY EMAIL
              </Text>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="student@fsjesc.uh2c.ma"
                aria-label="University email"
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" flex={1} minWidth={200}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                ACADEMIC TRACK
              </Text>
              <input
                value={inviteTrack}
                onChange={(e) => setInviteTrack(e.target.value)}
                placeholder="Master Finance / Licence Éco"
                aria-label="Academic track"
                style={INPUT_STYLE}
              />
            </YStack>
            <YStack gap="$1" minWidth={140}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                RBAC ROLE
              </Text>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                aria-label="Role"
                style={INPUT_STYLE}
              >
                <option value="STUDENT">STUDENT</option>
                <option value="MEMBER">MEMBER</option>
                <option value="EXECUTIVE">EXECUTIVE</option>
                <option value="ADMINISTRATOR">ADMINISTRATOR</option>
              </select>
            </YStack>
            <YStack gap="$1" width={140}>
              <Text fontFamily="$mono" fontSize="$0" color="$foregroundSecondary">
                STARTING MAD
              </Text>
              <input
                type="number"
                value={inviteCashMad}
                onChange={(e) => setInviteCashMad(e.target.value)}
                aria-label="Starting cash MAD"
                style={INPUT_STYLE}
              />
            </YStack>
            <Button variant="primary" size="md" onPress={() => void handleCreateUser()}>
              <Text color="$canvas" fontWeight="600">
                Create Account
              </Text>
            </Button>
          </XStack>
        </Card>
      ) : null}

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
        {(users) => {
          const activeCount = users.filter((u) => u.status !== "suspended").length;
          const execCount = users.filter(
            (u) => u.role === "ADMINISTRATOR" || u.role === "EXECUTIVE",
          ).length;
          const totalCapitalCents = users.reduce(
            (sum, u) => sum + BigInt(u.cashCents ?? "10000000"),
            0n,
          );

          return (
            <>
              <StatGrid>
                <StatCard label="Total Accounts" value={formatCount(users.length)} />
                <StatCard label="Active Standing" value={formatCount(activeCount)} />
                <StatCard label="Admins & Bureau" value={formatCount(execCount)} />
                <StatCard
                  label="Aggregate Cash Pool"
                  value={formatMAD(totalCapitalCents)}
                  hint="Spendable MAD across portfolios"
                />
              </StatGrid>

              <Card padding="$4">
                <XStack flexWrap="wrap" alignItems="center" justifyContent="space-between" gap="$3">
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
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder="Search name, email, role or academic track..."
                      aria-label="Search users"
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

                  <XStack flexWrap="wrap" gap="$1.5">
                    {roles.map((r) => (
                      <Button
                        key={r}
                        size="sm"
                        variant={roleFilter === r ? "secondary" : "ghost"}
                        onPress={() => setRoleFilter(r)}
                      >
                        <Text
                          fontFamily="$mono"
                          fontSize="$0"
                          color={roleFilter === r ? "$bull" : "$foregroundSecondary"}
                        >
                          {r}
                        </Text>
                      </Button>
                    ))}
                  </XStack>
                </XStack>

                <Paragraph fontSize="$1" color="$foregroundMuted" paddingTop="$3" paddingBottom="$2">
                  {filtered.length === users.length
                    ? `${filtered.length} accounts`
                    : `${filtered.length} of ${users.length} accounts`}
                </Paragraph>

                {filtered.length > 0 ? (
                  <DataTable columns={columns} rows={filtered} rowKey={(user) => user.id} />
                ) : (
                  <EmptyState
                    title={query || roleFilter !== "ALL" ? "No users match that filter" : "No users yet"}
                    description={
                      query || roleFilter !== "ALL"
                        ? "Try a different name, email address or role filter."
                        : "Accounts appear here once they register on the platform."
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