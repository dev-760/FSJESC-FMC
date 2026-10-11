import { createTamagui } from "@tamagui/core";
import { config } from "@tamagui/config";

/**
 * AMS design tokens mapped directly to the CSS custom properties defined in
 * `src/app/globals.css` (ported verbatim from `mockups/AMS.html`).
 *
 * Referencing `var(--*)` ensures that every Tamagui primitive (`YStack`,
 * `XStack`, `Text`, `Paragraph`, `Card`, `Button`) automatically adapts to both
 * the default light theme (`#f3f5f8` / `#ffffff` / `#142944`) and the dark
 * theme (`[data-theme="dark"]`) without requiring a React re-render.
 */

const CANVAS = "var(--bg)";
const SURFACE = "var(--surface)";
const SURFACE_RAISED = "var(--surface)";
const SURFACE_INSET = "var(--surface-2)";
const SURFACE_SUNKEN = "var(--surface-3)";

const TEXT_PRIMARY = "var(--text)";
const TEXT_SECONDARY = "var(--text-2)";
const TEXT_MUTED = "var(--text-3)";

const BULL = "var(--pos)";
const BEAR = "var(--neg)";
const INFO = "var(--action)";
const WARNING = "var(--accent)";

const amsColors = {
  canvas: CANVAS,
  surface: SURFACE,
  surfaceRaised: SURFACE_RAISED,
  surfaceInset: SURFACE_INSET,
  surfaceSunken: SURFACE_SUNKEN,

  foreground: TEXT_PRIMARY,
  foregroundSecondary: TEXT_SECONDARY,
  foregroundMuted: TEXT_MUTED,

  bull: BULL,
  bullHover: "#0d694d",
  bear: BEAR,
  info: INFO,
  warning: WARNING,

  accent: WARNING,
  destructive: BEAR,

  rule: "var(--border)",
  ruleStrong: "var(--border-strong)",
  ruleFaint: "var(--border)",
} as const;

const sharedTheme = {
  background: CANVAS,
  backgroundHover: SURFACE_INSET,
  backgroundPress: SURFACE_INSET,
  backgroundFocus: SURFACE_RAISED,
  color: TEXT_PRIMARY,
  colorHover: TEXT_PRIMARY,
  borderColor: "$rule",
  borderColorHover: "$ruleStrong",
  placeholderColor: TEXT_MUTED,
  shadowColor: "rgba(17, 36, 60, 0.08)",
};

const tamaguiConfig = createTamagui({
  ...config,

  tokens: {
    ...config.tokens,
    color: {
      ...config.tokens.color,
      ...amsColors,
    },
  },

  themes: {
    ...config.themes,
    light: {
      ...config.themes.light,
      ...sharedTheme,
    },
    dark: {
      ...config.themes.dark,
      ...sharedTheme,
    },
  },

  defaultTheme: "light",

  settings: {
    ...config.settings,
    shouldAddPrefersColorThemes: false,
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends TamaguiConfig {}
}

export default tamaguiConfig;