/**
 * Executive dashboard - MEMBER grants page.
 *
 * Requires EXECUTIVE or ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@fsjesc/ui/button";
import { Badge } from "@fsjesc/ui/badge";
import { Alert } from "@fsjesc/ui/alert";

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export default function ExecutiveGrantsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [grantingId, setGrantingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/executive/users");
        if (response.status === 401 || response.status === 403) {
          setError("Executive or Administrator privileges are required to view and grant member roles.");
          return;
        }
        if (!response.ok) {
          setError("Unable to load student directory at this time.");
          return;
        }
        const data = (await response.json()) as User[];
        setUsers(data);
      } catch (err) {
        console.error("Failed to fetch users:", err);
        setError("Network error while loading student accounts.");
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const handleGrantMember = async (userId: string) => {
    setGrantingId(userId);
    try {
      const response = await fetch(`/api/executive/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MEMBER" }),
      });

      if (response.ok) {
        const data = (await response.json()) as User;
        setUsers((prev) => prev.map((u) => (u.id === userId ? data : u)));
      } else {
        setError("Failed to grant MEMBER role. Verify your executive session permissions.");
      }
    } catch (err) {
      console.error("Failed to grant MEMBER role:", err);
      setError("Network error while updating role.");
    } finally {
      setGrantingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.role.toLowerCase().includes(q)
    );
  });

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="bg-surface-sunken h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-64 rounded-lg" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Home
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              Member Grants
            </li>
          </ol>
        </nav>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">Member Grants</h1>
            <p className="text-foreground-secondary text-sm">
              Grant verified MEMBER status to qualified FSJESC students
            </p>
          </div>
          <div className="w-full sm:w-72">
            <input
              type="search"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter users"
              className="border-rule bg-surface text-foreground focus-visible:outline-ring w-full rounded border px-3 py-2 text-sm focus-visible:outline-2"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6">
            <Alert tone="warning" title="Access or directory notice">
              <p>{error}</p>
            </Alert>
          </div>
        )}

        <div className="bg-surface-raised border-rule overflow-hidden rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken">
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Name</th>
                <th className="label px-4 py-3 text-left">Email</th>
                <th className="label px-4 py-3 text-left">Current Role</th>
                <th className="label px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-foreground-secondary">
                    {users.length === 0
                      ? "No student accounts available to display."
                      : "No users match your search filter."}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-surface-sunken/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{user.name || "–"}</td>
                    <td className="px-4 py-3 numeric text-foreground-secondary">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge tone={user.role === "MEMBER" ? "positive" : "neutral"}>
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.role === "STUDENT" ? (
                        <Button
                          size="sm"
                          disabled={grantingId === user.id}
                          onClick={() => {
                            void handleGrantMember(user.id);
                          }}
                        >
                          {grantingId === user.id ? "Granting..." : "Grant Member"}
                        </Button>
                      ) : (
                        <span className="text-xs text-foreground-muted">Verified</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
