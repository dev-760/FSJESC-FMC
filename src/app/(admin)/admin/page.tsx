/**
 * Admin dashboard overview page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Num } from "@/components/primitives/num";

interface DashboardStats {
  totalUsers: number;
  activePortfolios: number;
  totalVolumeCents: bigint;
  activeCompetitions: number;
  pendingOrders: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/dashboard");
        if (response.ok) {
          const data = (await response.json()) as DashboardStats;
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

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
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">Admin Dashboard</h1>
          <p className="text-foreground-secondary">Platform overview and management</p>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="bg-surface-sunken rounded-lg p-6">
            <p className="label">Total Users</p>
            <p className="mt-2 font-mono text-3xl font-semibold">{stats?.totalUsers ?? 0}</p>
          </div>
          <div className="bg-surface-sunken rounded-lg p-6">
            <p className="label">Active Portfolios</p>
            <p className="mt-2 font-mono text-3xl font-semibold">{stats?.activePortfolios ?? 0}</p>
          </div>
          <div className="bg-surface-sunken rounded-lg p-6">
            <p className="label">Total Volume</p>
            <p className="mt-2 font-mono text-3xl font-semibold">
              <Num cents={BigInt(stats?.totalVolumeCents ?? "0")} unit=" MAD" />
            </p>
          </div>
          <div className="bg-surface-sunken rounded-lg p-6">
            <p className="label">Active Competitions</p>
            <p className="mt-2 font-mono text-3xl font-semibold">
              {stats?.activeCompetitions ?? 0}
            </p>
          </div>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="bg-surface-sunken rounded-lg p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Quick Actions</h2>
            <div className="space-y-2">
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/events">Manage Events</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/articles">Manage Articles</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/competitions">Manage Competitions</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/orders">View Orders</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/admin/system">System Status</Link>
              </Button>
            </div>
          </div>

          <div className="bg-surface-sunken rounded-lg p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Executive Tools</h2>
            <div className="space-y-2">
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/executive/events">Event Management</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/executive/articles">Article Publishing</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/executive/team">Team Management</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/executive/competitions">Competition Setup</Link>
              </Button>
              <Button asChild variant="secondary" className="w-full justify-start">
                <Link href="/executive/grants">Member Grants</Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-surface-sunken rounded-lg p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">Recent Activity</h2>
          {stats?.recentActivity && stats.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="border-rule flex items-start justify-between border-b pb-3 last:border-b-0 last:pb-0"
                >
                  <div>
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-foreground-secondary text-sm">{activity.type}</p>
                  </div>
                  <p className="text-foreground-secondary text-sm">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-foreground-muted">No recent activity</p>
          )}
        </div>
      </div>
    </main>
  );
}
