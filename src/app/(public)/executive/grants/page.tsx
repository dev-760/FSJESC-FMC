/**
 * Executive dashboard - MEMBER grants page.
 *
 * Requires EXECUTIVE or ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  role: string;
  name?: string;
}

export default function ExecutiveGrantsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/executive/users");
        if (response.ok) {
          const data = (await response.json()) as User[];
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchUsers();
  }, []);

  const handleGrantMember = async (userId: string) => {
    try {
      const response = await fetch(`/api/executive/users/${userId}/role`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "MEMBER" }),
      });

      if (response.ok) {
        // Refresh user list
        const data = (await response.json()) as User;
        setUsers(users.map((u) => (u.id === userId ? data : u)));
      }
    } catch (err) {
      console.error("Failed to grant MEMBER role:", err);
    }
  };

  if (isLoading) {
    return (
      <main id="main-content" className="flex-1">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="bg-surface-sunken mb-4 h-8 w-1/3 rounded" />
            <div className="bg-surface-sunken h-64 rounded" />
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

        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Member Grants</h1>
          <p className="text-foreground-secondary">Grant MEMBER role to qualified students</p>
        </div>

        <div className="bg-surface-sunken overflow-hidden rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Name</th>
                <th className="label px-4 py-3 text-left">Email</th>
                <th className="label px-4 py-3 text-left">Current Role</th>
                <th className="label px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-rule border-b last:border-b-0">
                  <td className="px-4 py-3">{user.name || "–"}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge tone={user.role === "MEMBER" ? "positive" : "neutral"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {user.role === "STUDENT" && (
                      <Button
                        size="sm"
                        onClick={() => {
                          void handleGrantMember(user.id);
                        }}
                      >
                        Grant Member
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
