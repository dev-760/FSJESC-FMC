/**
 * Admin system status page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SystemStatus {
  database: "healthy" | "degraded" | "down";
  marketEngine: "healthy" | "degraded" | "down";
  uptime: number;
  version: string;
  lastMigration: string;
}

export default function AdminSystemPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/admin/system");
        if (response.ok) {
          const data = (await response.json()) as SystemStatus;
          setStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch system status:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStatus();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "bg-positive/10 text-positive border-positive/20";
      case "degraded":
        return "bg-warning/10 text-warning border-warning/20";
      case "down":
        return "bg-negative/10 text-negative border-negative/20";
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
              System
            </li>
          </ol>
        </nav>

        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-semibold tracking-tight">System Status</h1>
          <p className="text-foreground-secondary">Platform health and configuration</p>
        </div>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="bg-surface-sunken rounded-lg p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Services</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label">Database</span>
                <Badge className={getStatusColor(status?.database || "down")}>
                  {status?.database || "Unknown"}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="label">Market Engine</span>
                <Badge className={getStatusColor(status?.marketEngine || "down")}>
                  {status?.marketEngine || "Unknown"}
                </Badge>
              </div>
            </div>
          </div>

          <div className="bg-surface-sunken rounded-lg p-6">
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Configuration</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="label">Version</span>
                <span className="font-mono">{status?.version || "Unknown"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="label">Uptime</span>
                <span className="font-mono">
                  {status?.uptime ? `${Math.floor(status.uptime / 3600)}h` : "Unknown"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="label">Last Migration</span>
                <span className="font-mono">{status?.lastMigration || "Unknown"}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface-sunken rounded-lg p-6">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">System Actions</h2>
          <div className="space-y-2">
            <Button variant="secondary" className="w-full justify-start">
              Run Database Migration
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              Seed Demo Data
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              Clear Cache
            </Button>
            <Button variant="secondary" className="w-full justify-start">
              Export Audit Log
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
