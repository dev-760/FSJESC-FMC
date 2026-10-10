import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { directionArrow, formatPercentFromBps } from "@fsjesc/config/format";
import { cn } from "@fsjesc/config/cn";
import { toneForBps, toneTextClass } from "./semantic";

/**
 * A signed percentage change with its direction stated three ways: sign, arrow
 * glyph, and colour. Colour alone is never the signal (Part 9.2).
 *
 * The arrow is `aria-hidden`; the sign is part of the text, so a screen reader
 * announces "+2.40% ↑" as "+2.40 percent" — the meaning survives without the glyph.
 */
export function ChangeIndicator({
  bps,
  decimals = 2,
  className,
  showArrow = true,
  size = "md",
}: {
  bps: bigint;
  decimals?: number;
  className?: string;
  showArrow?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const tone = toneForBps(bps);
  const Arrow = bps > 0n ? ArrowUpRight : bps < 0n ? ArrowDownRight : ArrowRight;

  return (
    <span
      className={cn(
        "numeric inline-flex items-center gap-0.5 font-medium",
        toneTextClass[tone],
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        size === "lg" && "text-base",
        className,
      )}
    >
      {formatPercentFromBps(bps, decimals)}
      {showArrow ? <Arrow aria-hidden className="size-3.5 shrink-0" /> : null}
    </span>
  );
}

/**
 * Plain-text direction for contexts where an icon is not appropriate (table
 * columns, chart tooltips, CSV export).
 */
export function directionGlyph(bps: bigint): string {
  return directionArrow(bps);
}
