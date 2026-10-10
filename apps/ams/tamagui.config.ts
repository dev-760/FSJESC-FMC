import { createTamagui } from "@tamagui/core";
import { config } from "@tamagui/config";

/**
 * AMS design tokens.
 *
 * These mirror the public site's design system (`src/app/globals.css`) so the
 * administration tool reads as the same product: a dark instrument panel built
 * from hairlines rather than shadows, with emerald reserved for the affirmative
 * and red for the negative.
 *
 * Colour values are copied from the site's `:root` block verbatim rather than
 * re-derived, because a second palette is how two products of one brand drift
 * apart.
 */

/**
 * Surfaces — four levels, from the page inward, matching mockups/AMS.html.
 */
const CANVAS = "#0a1520";
const SURFACE = "#132435";
const SURFACE_RAISED = "#1a2e42";
const SURFACE_INSET = "#1a2e42";
const SURFACE_SUNKEN = "#0f2030";

/** Text from mockups/AMS.html. */
const TEXT_PRIMARY = "#f0ebe0";
const TEXT_SECONDARY = "#9aa5b1";
const TEXT_MUTED = "#6e7a85";

/** Semantics from mockups/AMS.html. */
const BULL = "#2dbf8e";
const BEAR = "#e8745a";
const INFO = "#6b8cd6";
const WARNING = "#e0b858";

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
  bear: BEAR,
  info: INFO,
  warning: WARNING,

  accent: WARNING,
  destructive: BEAR,

  /** Hairline borders matching mockup tokens --border and --border-strong */
  rule: "#1f3549",
  ruleStrong: "#2e4760",
  ruleFaint: "#182a3c",
} as const;

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
    /**
     * The public site sets a single dark theme by decision, and declares
     * `color-scheme: dark` so native controls render dark too. `defaultTheme` is
     * pinned below so the provider can never silently fall back to `light`.
     */
    dark: {
      ...config.themes.dark,
      background: CANVAS,
      backgroundHover: SURFACE_RAISED,
      backgroundPress: SURFACE_INSET,
      backgroundFocus: SURFACE_RAISED,
      color: TEXT_PRIMARY,
      colorHover: TEXT_PRIMARY,
      borderColor: "$rule",
      borderColorHover: "$ruleStrong",
      placeholderColor: TEXT_MUTED,
      shadowColor: "#000000",
    },
  },

  /** Single theme by decision, matching the public site. */
  defaultTheme: "dark",

  settings: {
    ...config.settings,
    /**
     * The public site is dark-only and does not follow the OS preference, so
     * this app must not either — otherwise AMS could render light while the
     * site it administers is dark.
     */
    shouldAddPrefersColorThemes: false,
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module "@tamagui/core" {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends TamaguiConfig {}
}

export default tamaguiConfig;