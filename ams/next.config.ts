import type { NextConfig } from "next";
import { withTamagui } from "@tamagui/next-plugin";

const nextConfig: NextConfig = {
  turbopack: {},
  // Point to the parent directory for shared database and infrastructure
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

const tamaguiPlugin = withTamagui({
  config: "./tamagui.config.ts",
  components: ["tamagui"],
});

export default tamaguiPlugin(nextConfig);

