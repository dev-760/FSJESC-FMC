/**
 * Admin users management page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/admin/users");
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

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return "bg-negative/10 text-negative border-negative/20";
      case "EXECUTIVE":
        return "bg-warning/10 text-warning border-warning/20";
      case "MEMBER":
        return "bg-information/10 text-information border-information/20";
      default:
        return "bg-neutral/10 text-neutral border-neutral/20";
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
                href="/admin"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Admin
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="text-foreground">
              Users
            </li>
          </ol>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">Users</h1>
            <p className="text-foreground-secondary">Manage user accounts and roles</p>
          </div>
        </div>

        <div className="bg-surface-sunken overflow-hidden rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Email</th>
                <th className="label px-4 py-3 text-left">Role</th>
                <th className="label px-4 py-3 text-left">Status</th>
                <th className="label px-4 py-3 text-left">Created</th>
                <th className="label px-4 py-3 text-left">Last Login</th>
                <th className="label px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-rule border-b last:border-b-0">
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge className={getRoleColor(user.role)}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={user.isActive ? "positive" : "neutral"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(new Date(user.createdAt))}</td>
                  <td className="px-4 py-3 text-sm">
                    {user.lastLoginAt ? formatDate(new Date(user.lastLoginAt)) : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/users/${user.id}`}>View</Link>
                    </Button>
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
