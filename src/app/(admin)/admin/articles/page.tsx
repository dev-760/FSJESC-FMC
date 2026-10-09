/**
 * Admin articles management page.
 *
 * Requires ADMINISTRATOR role.
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";

interface Article {
  id: string;
  title: string;
  slug: string;
  category: string;
  isPublished: boolean;
  publishedAt?: string;
  createdAt: string;
}

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        const response = await fetch("/api/admin/articles");
        if (response.ok) {
          const data = (await response.json()) as Article[];
          setArticles(data);
        }
      } catch (err) {
        console.error("Failed to fetch articles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchArticles();
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
              Articles
            </li>
          </ol>
        </nav>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight">Articles</h1>
            <p className="text-foreground-secondary">Manage educational content</p>
          </div>
          <Button>Create Article</Button>
        </div>

        <div className="bg-surface-sunken overflow-hidden rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="border-rule border-b">
                <th className="label px-4 py-3 text-left">Title</th>
                <th className="label px-4 py-3 text-left">Category</th>
                <th className="label px-4 py-3 text-left">Status</th>
                <th className="label px-4 py-3 text-left">Published</th>
                <th className="label px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id} className="border-rule border-b last:border-b-0">
                  <td className="px-4 py-3">{article.title}</td>
                  <td className="px-4 py-3 text-sm">{article.category}</td>
                  <td className="px-4 py-3">
                    <Badge tone={article.isPublished ? "positive" : "neutral"}>
                      {article.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {article.publishedAt ? formatDate(new Date(article.publishedAt)) : "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/admin/articles/${article.id}`}>View</Link>
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
