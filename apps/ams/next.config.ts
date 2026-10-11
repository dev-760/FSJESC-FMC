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
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  /**
   * The admin API belongs to the landing app.
   *
   * Proxying `/api/*` through AMS keeps every call site a same-origin relative
   * URL, so the session cookie set on localhost (port-agnostic) or a shared
   * parent domain reaches the handlers without CORS.
   */
  async rewrites() {
    const origin = process.env.AMS_API_ORIGIN ?? process.env.SIMULATOR_API_ORIGIN ?? "http://localhost:3000";
    return [{ source: "/api/:path*", destination: `${origin}/api/:path*` }];
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

const tamaguiPlugin = withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
});

export default tamaguiPlugin(nextConfig);
