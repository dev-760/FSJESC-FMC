import { config } from "@tamagui/config";
import { createTamagui } from "@tamagui/core";

const tamaguiConfig = createTamagui({
  ...config,
  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      primary: "#2563eb",
      secondary: "#64748b",
      accent: "#3b82f6",
      destructive: "#ef4444",
      background: "#ffffff",
      foreground: "#0f172a",
      card: "#ffffff",
      "card-foreground": "#0f172a",
      popover: "#ffffff",
      "popover-foreground": "#0f172a",
      muted: "#f1f5f9",
      "muted-foreground": "#64748b",
    },
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}

export default tamaguiConfig;

