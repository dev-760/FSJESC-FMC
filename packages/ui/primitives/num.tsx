import { cn } from "@fsjesc/config/cn";
import { directionArrow } from "@fsjesc/config/format";
import type { SemanticTone } from "../financial/semantic";

/**
 * `Num` — the single rendering path for every number on the platform.
 *
 * Rule: **no numeric value is ever rendered except through this component.** That
 * is what guarantees tabular alignment across a dense table, consistent rounding,
 * and consistent sign treatment. A bare `{value}` in JSX is a bug, not a shortcut.
 *
 * Props map to the brief's four requirements:
 *   `signed`   always print +/− so a positive number is distinguishable
 *   `tone`     colour follows the value's meaning, never replaces it
 *   `size`     type scale step
 *   `unit`     a trailing unit (MAD, %, x) rendered in the secondary colour so
 *              the figure itself stays the brightest thing in the cell
 */

export interface NumProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Integer centimes (MAD) or a plain count. Rendered with `decimals` places. */
  cents?: bigint | number;
  /** A decimal figure that is not money — a percentage, a ratio, a multiple. */
  value?: number;
  decimals?: number;
  signed?: boolean;
  tone?: SemanticTone;
  size?: NumSize;
  unit?: string;
  /** Rendered as an em dash rather than a zero. */
  dashWhenZero?: boolean;
}

const TONE_CLASS: Record<SemanticTone, string> = {
  positive: "text-bull",
  negative: "text-bear",
  neutral: "text-foreground",
  warning: "text-warning-text",
  information: "text-info",
};

const SIZE_CLASS = {
  "2xs": "text-2xs",
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl",
  xl: "text-3xl",
} as const;

export type NumSize = keyof typeof SIZE_CLASS;

const formatters = new Map<number, Intl.NumberFormat>();

function getFormatter(decimals: number): Intl.NumberFormat {
  const clamped = Math.max(0, Math.min(8, Math.trunc(decimals)));
  let fmt = formatters.get(clamped);
  if (!fmt) {
    fmt = new Intl.NumberFormat("fr-MA", {
      minimumFractionDigits: clamped,
      maximumFractionDigits: clamped,
    });
    formatters.set(clamped, fmt);
  }
  return fmt;
}

export function Num({
  cents,
  value,
  decimals = 2,
  signed = false,
  tone = "neutral",
  size = "md",
  unit,
  dashWhenZero = false,
  className,
  ...props
}: NumProps) {
  const numeric = cents !== undefined ? Number(cents) / 100 : (value ?? 0);

  if (dashWhenZero && numeric === 0) {
    return (
      <span className={cn("numeric text-foreground-muted", SIZE_CLASS[size], className)} {...props}>
        &mdash;
      </span>
    );
  }

  const text = getFormatter(decimals).format(Math.abs(numeric));

  const prefix = numeric < 0 ? "−" : signed && numeric > 0 ? "+" : "";

  return (
    <span
      className={cn("numeric", TONE_CLASS[tone], SIZE_CLASS[size], className)}
      // The sign lives in the text, so a screen reader announces "minus 42" rather
      // than relying on colour or a glyph.
      {...props}
    >
      {prefix}
      {text}
      {unit ? <span className="text-foreground-muted">{unit}</span> : null}
    </span>
  );
}

/**
 * `Delta` — a signed percentage move.
 *
 * Always renders a sign, and a direction glyph. Colour is the third signal, never
 * the first: a reader who cannot distinguish bull from bear by hue still gets the
 * information from the glyph and the sign (Part 9.2).
 */
export function Delta({
  bps,
  size = "sm",
  className,
  showGlyph = true,
}: {
  bps: bigint;
  size?: Exclude<NumSize, "md"> | "md";
  className?: string;
  showGlyph?: boolean;
}) {
  const tone: SemanticTone = bps > 0n ? "positive" : bps < 0n ? "negative" : "neutral";
  const arrow = directionArrow(bps);

  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1",
        TONE_CLASS[tone],
        SIZE_CLASS[size],
        className,
      )}
    >
      <Num value={Number(bps) / 100} decimals={2} unit="%" signed tone={tone} size={size} />
      {showGlyph ? <span aria-hidden>{arrow}</span> : null}
    </span>
  );
}
