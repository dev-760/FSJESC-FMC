import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";

/**
 * robots.txt (Part 10).
 *
 * Indexable: the public site and the education centre — that is the club's
 * outreach surface.
 *
 * Not indexable: dashboards, administration, executive tools, and the design
 * review gallery. Those are either private, or development-only surfaces whose
 * appearance in search results would be misleading.
 */
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? SITE.url).replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/admin", "/executive", "/design-review", "/api/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
