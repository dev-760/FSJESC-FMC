/**
 * Public asset location. The three apps each carry a copy under
 * `public/brand/`, so a root-relative path resolves in all of them without a
 * build-time base URL.
 */
const BRAND_BASE = "/brand";

/**
 * The FSJESC FMC brand lockups.
 *
 * WHY PNG AND NOT `Branding/*.svg`:
 * both SVGs in Branding/ are Image Trace output of a raster — no `viewBox`,
 * a fixed 1254x1254, ~800 `<path>` elements and ~300 near-identical fills from
 * anti-aliasing. They cannot scale and cannot be recoloured, so they are not
 * usable. The PNGs are the real artwork and are fine, so those are what ships.
 *
 * The source PNGs are 1254x1254 with the artwork sitting in the middle at
 * different scales per variant (light content is 878x452, dark is 925x469) and
 * very large vertical margins (top 399, bottom 403 on the light mark). Left
 * alone, a mark in a 28px header box renders as ~11px of actual artwork.
 * `scripts/brand-assets.py` therefore trims each file to its content bounding
 * box and downsamples it: the header mark is 264px wide and ~27 KB instead of
 * 126 KB. Regenerate with `pnpm brand:assets` after replacing the source art.
 *
 * Theme switching uses `<picture>` + a `prefers-color-scheme` source rather
 * than JS state, so the correct mark is in the very first paint. There is no
 * toggle in the design, so this is the only switch that can change it.
 */

export type FmcLogoProps = {
  /**
   * Full lockup: the monogram plus the wordmark and strapline. Sits in the
   * footer and the hero. Roughly 1.54:1.
   */
  variant?: "mark" | "wordmark";
  /** Rendered height in px; width follows the artwork's aspect ratio. */
  height?: number;
  /**
   * Accessible name. Required unless the image sits next to a visible text
   * wordmark — a logo with no alt is announced as an unlabelled graphic.
   */
  alt?: string;
  className?: string;
};

export function FmcLogo({
  variant = "mark",
  height = 28,
  alt,
  className,
}: FmcLogoProps) {
  const base = BRAND_BASE;
  const light = `${base}/${variant}-light.png`;
  const dark = `${base}/${variant}-dark.png`;

  return (
    <picture>
      <source srcSet={dark} media="(prefers-color-scheme: dark)" />
      {/* eslint-disable-next-line @next/next/no-img-element --
          Deliberately not next/image: this is a two-variant <picture> swap driven
          by prefers-color-scheme, and a 27 KB logo does not justify the
          optimiser round-trip or the srcset width ladder. */}
      <img
        src={light}
        alt={alt ?? ""}
        height={height}
        className={className}
        style={{ height, width: "auto", display: "block" }}
      />
    </picture>
  );
}

export default FmcLogo;