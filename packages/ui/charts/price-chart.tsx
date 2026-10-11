"use client";

import { useEffect, useRef, useState } from "react";
import {
  CandlestickSeries,
  HistogramSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

import type { Candle, Interval } from "@fsjesc/domain/market/provider";
import { cn } from "@fsjesc/config/cn";

/**
 * The interactive price chart — a client leaf.
 *
 * TradingView Lightweight Charts, because it is the only charting dependency here
 * and it is the one a reader of a trading platform expects. Everything above this
 * file is a Server Component; this is the single island that needs a browser.
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

interface ChartPalette {
  textColor: string;
  gridColor: string;
  borderColor: string;
  crosshairColor: string;
  crosshairLabelBg: string;
  upColor: string;
  downColor: string;
  volumeUp: string;
  volumeDown: string;
}

const LIGHT_PALETTE: ChartPalette = {
  textColor: "#3d5568",
  gridColor: "rgba(228, 216, 194, 0.5)",
  borderColor: "#d4c9b3",
  crosshairColor: "rgba(61, 85, 104, 0.45)",
  crosshairLabelBg: "#142944",
  upColor: "#0f7a5a",
  downColor: "#b4442e",
  volumeUp: "rgba(15, 122, 90, 0.28)",
  volumeDown: "rgba(180, 68, 46, 0.28)",
};

const DARK_PALETTE: ChartPalette = {
  textColor: "#b3c0cb",
  gridColor: "rgba(240, 235, 224, 0.06)",
  borderColor: "#35506d",
  crosshairColor: "rgba(240, 235, 224, 0.3)",
  crosshairLabelBg: "#142944",
  upColor: "#34c792",
  downColor: "#e06a52",
  volumeUp: "rgba(52, 199, 146, 0.32)",
  volumeDown: "rgba(224, 106, 82, 0.32)",
};

function resolvePalette(): ChartPalette {
  if (typeof document === "undefined") return LIGHT_PALETTE;
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark") return DARK_PALETTE;
  if (attr === "light") return LIGHT_PALETTE;
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return DARK_PALETTE;
  }
  return LIGHT_PALETTE;
}

interface HoverCandle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

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
  const candlesMapRef = useRef<Map<number, HoverCandle>>(new Map());
  const [hovered, setHovered] = useState<HoverCandle | null>(null);

  // Create once. The chart reads its data through `setData` below, so changing the
  // interval does not tear down and rebuild the chart — which would reset the user's
  // zoom and pan.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const palette = resolvePalette();

    const chart = createChart(host, {
      autoSize: true,
      height,
      layout: {
        background: { color: "transparent" },
        fontFamily: "var(--font-jetbrains-mono), ui-monospace, SFMono-Regular, monospace",
        fontSize: 11,
        textColor: palette.textColor,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: palette.gridColor },
        horzLines: { color: palette.gridColor },
      },
      rightPriceScale: {
        borderColor: palette.borderColor,
        autoScale: true,
      },
      timeScale: {
        borderColor: palette.borderColor,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
      },
      crosshair: {
        vertLine: { color: palette.crosshairColor, labelBackgroundColor: palette.crosshairLabelBg },
        horzLine: { color: palette.crosshairColor, labelBackgroundColor: palette.crosshairLabelBg },
      },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
    });

    const price = chart.addSeries(CandlestickSeries, {
      upColor: palette.upColor,
      downColor: palette.downColor,
      borderUpColor: palette.upColor,
      borderDownColor: palette.downColor,
      wickUpColor: palette.upColor,
      wickDownColor: palette.downColor,
      priceLineColor: palette.textColor,
      priceLineStyle: 2,
    });

    const volume = showVolume
      ? chart.addSeries(HistogramSeries, {
          priceFormat: { type: "volume" },
          priceScaleId: "volume",
        })
      : null;

    if (volume) {
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.82, bottom: 0 },
      });
    }

    const onCrosshairMove = (param: { time?: Time }) => {
      if (!param.time || typeof param.time !== "number") {
        setHovered(null);
        return;
      }
      const match = candlesMapRef.current.get(param.time);
      setHovered(match ?? null);
    };

    chart.subscribeCrosshairMove(onCrosshairMove);

    // Watch for theme changes via data-theme attribute or OS preference
    const applyTheme = () => {
      const next = resolvePalette();
      chart.applyOptions({
        layout: { textColor: next.textColor },
        grid: {
          vertLines: { color: next.gridColor },
          horzLines: { color: next.gridColor },
        },
        rightPriceScale: { borderColor: next.borderColor },
        timeScale: { borderColor: next.borderColor },
        crosshair: {
          vertLine: { color: next.crosshairColor, labelBackgroundColor: next.crosshairLabelBg },
          horzLine: { color: next.crosshairColor, labelBackgroundColor: next.crosshairLabelBg },
        },
      });
      price.applyOptions({
        upColor: next.upColor,
        downColor: next.downColor,
        borderUpColor: next.upColor,
        borderDownColor: next.downColor,
        wickUpColor: next.upColor,
        wickDownColor: next.downColor,
        priceLineColor: next.textColor,
      });
    };

    const observer =
      typeof MutationObserver !== "undefined"
        ? new MutationObserver(applyTheme)
        : null;
    observer?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    const mediaQuery =
      typeof window !== "undefined" && typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-color-scheme: dark)")
        : null;
    mediaQuery?.addEventListener?.("change", applyTheme);

    chartRef.current = chart;
    priceRef.current = price;
    volumeRef.current = volume;

    return () => {
      observer?.disconnect();
      mediaQuery?.removeEventListener?.("change", applyTheme);
      chart.unsubscribeCrosshairMove(onCrosshairMove);
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

    const palette = resolvePalette();
    const sorted = [...candles].sort((a, b) => a.time - b.time);

    const map = new Map<number, HoverCandle>();
    for (const c of sorted) {
      map.set(c.time, {
        open: c.openCents / 100,
        high: c.highCents / 100,
        low: c.lowCents / 100,
        close: c.closeCents / 100,
        volume: c.volume,
      });
    }
    candlesMapRef.current = map;

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
          color: candle.closeCents >= candle.openCents ? palette.volumeUp : palette.volumeDown,
        })),
      );
    }

    const chart = chartRef.current;
    if (chart) chart.timeScale().fitContent();
  }, [candles, interval, symbol]);

  const summary = label ?? `${symbol} price, ${interval} candles`;
  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : undefined;
  const activeBar: HoverCandle | null =
    hovered ??
    (lastCandle
      ? {
          open: lastCandle.openCents / 100,
          high: lastCandle.highCents / 100,
          low: lastCandle.lowCents / 100,
          close: lastCandle.closeCents / 100,
          volume: lastCandle.volume,
        }
      : null);

  return (
    <figure className={cn("border-rule bg-surface border rounded-md overflow-hidden", className)}>
      <figcaption className="sr-only">{summary}</figcaption>
      {activeBar ? (
        <div className="border-rule bg-surface-sunken/70 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b px-3 py-1.5 text-2xs">
          <div className="flex items-center gap-2">
            <span className="numeric text-foreground font-semibold">{symbol}</span>
            <span className="label text-foreground-muted">{interval.toUpperCase()} · MAD</span>
          </div>
          <div className="numeric flex flex-wrap items-center gap-3">
            <span className="text-foreground-secondary">
              O <strong className="text-foreground font-medium">{activeBar.open.toFixed(2)}</strong>
            </span>
            <span className="text-foreground-secondary">
              H <strong className="text-foreground font-medium">{activeBar.high.toFixed(2)}</strong>
            </span>
            <span className="text-foreground-secondary">
              L <strong className="text-foreground font-medium">{activeBar.low.toFixed(2)}</strong>
            </span>
            <span className="text-foreground-secondary">
              C{" "}
              <strong
                className={cn(
                  "font-semibold",
                  activeBar.close >= activeBar.open ? "text-bull" : "text-bear",
                )}
              >
                {activeBar.close.toFixed(2)}
              </strong>
            </span>
            {showVolume ? (
              <span className="text-foreground-muted hidden sm:inline">
                Vol <strong className="text-foreground-secondary">{activeBar.volume.toLocaleString("en-US")}</strong>
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
      <div ref={hostRef} className="w-full" style={{ height }} role="img" aria-label={summary} />
    </figure>
  );
}
