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

/** Surfaces — four levels, from the page inward. */
const CANVAS = "#07080b";
const SURFACE = "#0f1117";
const SURFACE_RAISED = "#161922";
const SURFACE_INSET = "#1c2029";
const SURFACE_SUNKEN = "#0a0b10";

/** Text. */
const TEXT_PRIMARY = "#f9fafb";
const TEXT_SECONDARY = "#9ca3af";
const TEXT_MUTED = "#6b7280";

/** Semantics. */
const BULL = "#00e599";
const BEAR = "#ef4444";
const INFO = "#3b82f6";
const WARNING = "#fbbf24";

/**
 * The site's hairline language, expressed as opaque colours.
 *
 * The public site draws its rules with `rgb(255 255 255 / 0.08)`. Tamagui's
 * `borderColor` resolves through a palette index rather than an alpha channel,
 * so the equivalent is that same white composited onto the surface the rule
 * sits on. Blending rather than substituting a grey is what keeps a 1px divider
 * here reading identically to one on the public site.
 */
function overSurface(alpha: number, base: string): string {
  const n = parseInt(base.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((channel) =>
    Math.round(channel * (1 - alpha) + 255 * alpha),
  );
  return `#${channels.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

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

  accent: BULL,
  destructive: BEAR,

  /** The standard 8% rule. */
  rule: overSurface(0.08, SURFACE_RAISED),
  /** Emphasised 16% rule — active nav, table headers. */
  ruleStrong: overSurface(0.16, SURFACE_RAISED),
  /** Barely-there 4% rule inside a row. */
  ruleFaint: overSurface(0.04, SURFACE_RAISED),
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