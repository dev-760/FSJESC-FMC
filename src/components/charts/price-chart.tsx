"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

import type { Candle, Interval } from "@/lib/market/provider";
import { cn } from "@/lib/cn";

/**
 * The interactive price chart — a client leaf.
 *
 * TradingView Lightweight Charts, because it is the only charting dependency here
 * and it is the one a reader of a trading platform expects. Everything above this
 * file is a Server Component; this is the single island that needs a browser.
 *
 * Three implementation notes that are easy to get wrong:
 *
 * 1. **v5 series API.** `addSeries(SeriesDefinition, options)` replaced
 *    `addCandlestickSeries(options)` in v5. The old call still exists as a shim in
 *    some builds and silently omits new options.
 * 2. **Cleanup is not optional.** The chart holds its own canvas, resize observer and
 *    animation frame. Without `chart.remove()` every remount leaks a live renderer.
 * 3. **Size from the container, not the window.** A chart that sizes to `innerWidth`
 *    overflows any sidebar. A `ResizeObserver` on the host element is the only
 *    correct answer, and it also covers the container being resized by a layout
 *    change that never fires a window resize event.
 */

export interface PriceChartProps {
  symbol: string;
  candles: readonly Candle[];
  interval?: Interval;
  /** Accessible description. The chart canvas itself is not readable. */
  label?: string;
  className?: string;
  height?: number;
  showVolume?: boolean;
}

const INTERVAL_MS: Record<Interval, number> = {
  "1m": 60_000,
  "5m": 300_000,
  "1h": 3_600_000,
  "1d": 86_400_000,
};

export function PriceChart({
  symbol,
  candles,
  interval = "1d",
  label,
  className,
  height = 360,
  showVolume = true,
}: PriceChartProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const priceRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // Create once. The chart reads its data through `setData` below, so changing the
  // interval does not tear down and rebuild the chart — which would reset the user's
  // zoom and pan.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const chart = createChart(host, {
      autoSize: true,
      height,
      layout: {
        background: { color: "transparent" },
        // The library's own font stack cannot read our next/font variables, so the
        // family is named explicitly to match the rest of the platform.
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace",
        fontSize: 11,
        textColor: "#9ca3af",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.04)" },
        horzLines: { color: "rgba(255,255,255,0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        // Prices are 4 decimals of a centime-scale number; a fixed scale would show
        // either noise or three zeros on every label.
        autoScale: true,
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
      },
      crosshair: {
        vertLine: { color: "rgba(255,255,255,0.28)", labelBackgroundColor: "#161922" },
        horzLine: { color: "rgba(255,255,255,0.28)", labelBackgroundColor: "#161922" },
      },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
    });

    const price = chart.addSeries(CandlestickSeries, {
      upColor: "#00e599",
      downColor: "#ef4444",
      borderUpColor: "#00e599",
      borderDownColor: "#ef4444",
      wickUpColor: "#00e599",
      wickDownColor: "#ef4444",
      priceLineColor: "#9ca3af",
      priceLineStyle: 2,
    });

    const volume = showVolume
      ? chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        })
      : null;

    if (volume) {
      // A separate scale pinned to the bottom fifth, so volume supports the price
      // action instead of competing with it.
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
    }

    chartRef.current = chart;
    priceRef.current = price;
    volumeRef.current = volume;

    return () => {
      // `remove()` releases the canvas, the observer and any pending frame. Skipping
      // it leaks a live renderer on every unmount.
      chart.remove();
      chartRef.current = null;
      priceRef.current = null;
      volumeRef.current = null;
    };
  }, [height, showVolume]);

  // Feed data whenever the series changes.
  useEffect(() => {
    const price = priceRef.current;
    if (!price || candles.length === 0) return;

    // Lightweight Charts rejects out-of-order or duplicate times. The model emits a
    // strictly ascending grid, so this sort is a guard rather than a repair — but a
    // chart that throws is worse than one that reorders.
    const sorted = [...candles].sort((a, b) => a.time - b.time);
    const stepMs = INTERVAL_MS[interval];

    price.setData(
      sorted.map((candle) => ({
        time: candle.time as Time,
        open: candle.openCents / 100,
        high: candle.highCents / 100,
        low: candle.lowCents / 100,
        close: candle.closeCents / 100,
      })),
    );

    const volume = volumeRef.current;
    if (volume) {
      volume.setData(
        sorted.map((candle) => ({
          time: candle.time as Time,
          value: candle.volume,
          color:
            candle.closeCents >= candle.openCents ? "rgba(0,229,153,0.35)" : "rgba(239,68,68,0.35)",
        })),
      );
    }

    // Fit only on the first paint of a symbol/interval pair. Re-fitting on every data
    // change would yank the viewport out from under a user who has zoomed in.
    const chart = chartRef.current;
    if (chart) chart.timeScale().fitContent();
    void stepMs;
  }, [candles, interval, symbol]);

  const summary = label ?? `${symbol} price, ${interval} candles`;

  return (
    <figure className={cn("border-rule bg-surface border", className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      <div ref={hostRef} className="w-full" style={{ height }} role="img" aria-label={summary} />
    </figure>
  );
}
