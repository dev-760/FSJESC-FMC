import { cn } from "@fsjesc/config/cn";
import type { Candle } from "@fsjesc/domain/market/provider";

/**
 * Sparkline — a price path as a plain SVG polyline.
 *
 * Deliberately not a chart library. A sparkline needs no axes, no interaction and no
 * JavaScript, and rendering 40 prices as markup means it works in a Server
 * Component, in an email, and in a print. Its `title` carries the range in words so
 * the shape is not the only way to get the information.
 *
 * It carries no colour by default. On a watchlist row the adjacent `Delta` already
 * states the direction; a second red-or-green cue is noise, and for a reader who
 * cannot distinguish the hues it is worse than nothing.
 */

export interface SparklineProps {
  candles: readonly Candle[];
  width?: number;
  height?: number;
  /** Optional semantic colouring, for the one case where the shape alone is too thin. */
  tone?: "neutral" | "bull" | "bear";
  className?: string;
  /** Announced in place of the visual. Falls back to a computed range. */
  label?: string;
}

export function Sparkline({
  candles,
  width = 96,
  height = 28,
  tone = "neutral",
  className,
  label,
}: SparklineProps) {
  if (candles.length < 2) {
    return <div className={cn("bg-surface-inset", className)} style={{ width, height }} />;
  }

  const closes = candles.map((candle) => candle.closeCents);
  const first = closes[0] ?? 0;
  const last = closes[closes.length - 1] ?? first;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const span = max - min || 1;

  // One point of padding top and bottom, so the extreme never sits on the edge.
  const x = (index: number): number => (index / (candles.length - 1)) * width;
  const y = (close: number): number => height - 1 - ((close - min) / span) * (height - 2);

  const path = closes
    .map(
      (close, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(2)} ${y(close).toFixed(2)}`,
    )
    .join(" ");
  const area = `${path} L${width} ${height} L0 ${height} Z`;

  const change = last - first;
  const resolved =
    tone !== "neutral" ? tone : change > 0 ? "bull" : change < 0 ? "bear" : "neutral";
  const stroke =
    resolved === "bull"
      ? "var(--bull)"
      : resolved === "bear"
        ? "var(--bear)"
        : "var(--text-secondary)";

  const range =
    label ??
    `${change >= 0 ? "Up" : "Down"} ${Math.abs((change / (first || 1)) * 100).toFixed(2)} percent over ${candles.length} bars`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      role="img"
      aria-label={range}
      preserveAspectRatio="none"
    >
      {/*
        A 0.8px line at this height reads as a drawn edge rather than a hairline, so
        it survives on a non-retina display.
      */}
      <path d={area} fill={stroke} fillOpacity="0.08" />
      <path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth="1.25"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
