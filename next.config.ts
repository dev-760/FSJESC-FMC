import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * Cache Components (Part 10).
   *
   * Data fetching is dynamic by default and every cache scope is explicit: public
   * content uses `"use cache"` with a `cacheLife`, and request-bound data
   * (sessions, portfolios, orders) is isolated behind `await connection()`
   * inside `<Suspense>`. See DECISIONS.md D1.
   */
  cacheComponents: true,
  partialPrefetching: true,

  /**
   * Barrel files.
   *
   * Next.js rewrites barrel imports to direct module paths for a default list that
   * already includes `lucide-react`, so icon imports cost only the icon used. Radix
   * is imported by subpath (`@radix-ui/react-select`, never a barrel) for the same
   * reason. No `optimizePackageImports` entry is needed.
   */

  /**
   * Argon2 is a native module. Keeping it out of the server bundle lets Node load
   * the platform binary directly instead of bundling it.
   */
  serverExternalPackages: ["@node-rs/argon2"],

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
