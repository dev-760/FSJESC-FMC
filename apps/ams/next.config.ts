import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import { withTamagui } from "@tamagui/next-plugin";

/**
 * Secrets live at the monorepo root so one `.env.local` serves every app.
 * Next 16 removed `envDir`, so the root is loaded explicitly here.
 */
loadEnvConfig("../../");

const nextConfig: NextConfig = {
  turbopack: {},
  transpilePackages: ["@fsjesc/domain"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  /**
   * When `AMS_API_ORIGIN` (or `SIMULATOR_API_ORIGIN`) is configured, proxy
   * `/api/*` to the landing app so both share one database and session store.
   * When unset on a standalone deployment, AMS uses its built-in fallback store
   * instead of rewriting to an unreachable localhost origin.
   */
  async rewrites() {
    const configuredOrigin = process.env.AMS_API_ORIGIN ?? process.env.SIMULATOR_API_ORIGIN;
    if (configuredOrigin) {
      return [
        {
          source: "/api/:path*",
          destination: `${configuredOrigin.replace(/\/$/, "")}/api/:path*`,
        },
      ];
    }
    if (process.env.NODE_ENV === "development") {
      return [{ source: "/api/:path*", destination: "http://localhost:3000/api/:path*" }];
    }
    return [];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
        ],
      },
    ];
  },
};

const tamaguiPlugin = withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
});

export default tamaguiPlugin(nextConfig);
