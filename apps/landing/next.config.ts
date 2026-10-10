import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";

/**
 * Secrets live at the monorepo root so one `.env.local` serves every app
 * (landing, simulator, ams).
 *
 * Next 16 removed the `envDir` config option, so the root is loaded explicitly
 * here instead. `loadEnvConfig` is the same loader Next uses internally — see
 * the environment-variables guide, which recommends it for reading `.env*`
 * outside the runtime. Running it at the top of this file means the variables
 * are in `process.env` before anything else in the config evaluates, and before
 * any application module is imported.
 */
loadEnvConfig("../../");

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

  /**
   * Workspace packages ship raw TypeScript rather than a build artefact.
   *
   * There is no compile step between editing a shared component and seeing it in
   * the app, and the packages cannot drift out of sync with a stale `dist/`.
   * Next compiles them as part of this app's own build.
   */
  transpilePackages: ["@fsjesc/ui", "@fsjesc/domain", "@fsjesc/config"],

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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
