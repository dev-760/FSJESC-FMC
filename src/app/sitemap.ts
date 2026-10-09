import type { MetadataRoute } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";
import { SITE } from "@/config/site";

/**
 * `sitemap.xml` (Part 10).
 *
 * Generated at build time: the route list comes from the filesystem and from
 * `src/data`, never from a request, so nothing here is request-bound and the
 * route needs no Suspense boundary under Cache Components (D1).
 *
 * Next.js serialises and escapes the returned array, so no hand-written XML and
 * no string interpolation of untrusted values.
 */

const NOW = new Date();

interface RouteSpec {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}

const PUBLIC_ROUTES: readonly RouteSpec[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/education", changeFrequency: "weekly", priority: 0.9 },
  { path: "/education/topics", changeFrequency: "weekly", priority: 0.7 },
  { path: "/simulator", changeFrequency: "daily", priority: 0.9 },
  { path: "/simulator/market", changeFrequency: "daily", priority: 0.85 },
  { path: "/competitions", changeFrequency: "daily", priority: 0.8 },
  { path: "/events", changeFrequency: "weekly", priority: 0.8 },
  { path: "/team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
  { path: "/sign-in", changeFrequency: "yearly", priority: 0.3 },
  { path: "/create-account", changeFrequency: "yearly", priority: 0.4 },
];

/**
 * Private or development-only surfaces that must not be indexed (Part 10).
 * Mirrored by the `disallow` list in `robots.ts`.
 */
export const NO_INDEX_PREFIXES = [
  "/dashboard",
  "/admin",
  "/executive",
  "/design-review",
  "/api/",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const entries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${base}${route.path}`,
    lastModified: NOW,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  entries.push(...(await articleEntries(base)));
  entries.push(...(await eventEntries(base)));
  entries.push(...(await assetEntries(base)));

  return entries;
}

async function assetEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { ASSETS } = await import("@/data/assets");
    return ASSETS.map((asset) => ({
      url: `${base}/simulator/market/${asset.ticker.toLowerCase()}`,
      lastModified: NOW,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch {
    return [];
  }
}

async function articleEntries(base: string): Promise<MetadataRoute.Sitemap> {
  const slugs = await listMarkdownSlugs(path.join(process.cwd(), "src/content/topics"));
  return slugs.map((slug) => ({
    url: `${base}/education/topics/${slug}`,
    lastModified: NOW,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));
}

async function eventEntries(base: string): Promise<MetadataRoute.Sitemap> {
  try {
    const { DEMO_EVENTS } = await import("@/data/events");
    return DEMO_EVENTS.filter((event) => event.endAt > NOW).map((event) => ({
      url: `${base}/events/${event.slug}`,
      lastModified: NOW,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));
  } catch {
    // The `events` table replaces this source in Phase 5. A missing source must
    // not fail the whole sitemap.
    return [];
  }
}

async function listMarkdownSlugs(directory: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.replace(/\.md$/, ""))
      .sort();
  } catch {
    // The directory appears in Phase 3; before then there are simply no topics.
    return [];
  }
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL ?? SITE.url).replace(/\/$/, "");
}
