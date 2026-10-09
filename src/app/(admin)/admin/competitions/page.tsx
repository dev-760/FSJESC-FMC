/**
 * Admin competitions management page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

interface Competition {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
}

export default function AdminCompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompetitions = async () => {
      try {
        const response = await fetch("/api/admin/competitions");
        if (response.ok) {
          const data = (await response.json()) as Competition[];
          setCompetitions(data);
        }
      } catch (err) {
        console.error("Failed to fetch competitions:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchCompetitions();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-positive/10 text-positive border-positive/20";
      case "UPCOMING":
        return "bg-warning/10 text-warning border-warning/20";
      case "COMPLETED":
        return "bg-neutral/10 text-neutral border-neutral/20";
      case "DRAFT":
        return "bg-information/10 text-information border-information/20";
      default:
        return "bg-negative/10 text-negative border-negative/20";
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
              Competitions
            </li>
          </ol>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">Competitions</h1>
            <p className="text-foreground-secondary">Manage trading competitions</p>
          </div>
          <Button>Create Competition</Button>
        </div>

        <div className="bg-surface-sunken overflow-hidden rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Name</th>
                <th className="label px-4 py-3 text-left">Status</th>
                <th className="label px-4 py-3 text-left">Starts</th>
                <th className="label px-4 py-3 text-left">Ends</th>
                <th className="label px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {competitions.map((competition) => (
                <tr key={competition.id} className="border-rule border-b last:border-b-0">
                  <td className="px-4 py-3">{competition.name}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusColor(competition.status)}>
                      {competition.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(new Date(competition.startsAt))}
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(new Date(competition.endsAt))}</td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/competitions/${competition.id}`}>View</Link>
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
