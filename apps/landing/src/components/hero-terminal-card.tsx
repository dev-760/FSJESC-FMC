"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Activity } from "lucide-react";
import { simulatorUrl } from "@fsjesc/config/app-urls";

interface HeroAssetPreview {
  symbol: string;
  name: string;
  marketLabel: string;
  isinOrRef: string;
  priceMad: string;
  changeMad: string;
  changePct: string;
  positive: boolean;
  sessionNote: string;
  metrics: [
    { label: string; value: string },
    { label: string; value: string },
    { label: string; value: string },
  ];
  /** 18 normalized points in [0, 100] (higher = higher price) */
  series: readonly number[];
}

const HERO_ASSETS: readonly [HeroAssetPreview, ...HeroAssetPreview[]] = [
  {
    symbol: "ATW",
    name: "Attijariwafa Bank",
    marketLabel: "CSE Casablanca · Banques",
    isinOrRef: "ISIN MA0000012445",
    priceMad: "548.50",
    changeMad: "+9.90",
    changePct: "+1.84%",
    positive: true,
    sessionNote: "30-day simulated path · Deterministic GBM",
    metrics: [
      { label: "PER / ROE", value: "14.2x · 15.8%" },
      { label: "Bid / Ask Spread", value: "548.20 / 548.80" },
      { label: "Settlement", value: "T+2 · 5 bps fee" },
    ],
    series: [34, 37, 35, 41, 44, 42, 48, 52, 49, 55, 59, 57, 63, 68, 66, 73, 78, 84],
  },
  {
    symbol: "IAM",
    name: "Itissalat Al-Maghrib (Maroc Telecom)",
    marketLabel: "CSE Casablanca · Télécoms",
    isinOrRef: "ISIN MA0000011488",
    priceMad: "96.40",
    changeMad: "+1.15",
    changePct: "+1.21%",
    positive: true,
    sessionNote: "30-day simulated path · Deterministic GBM",
    metrics: [
      { label: "PER / Div Yield", value: "15.6x · 4.35%" },
      { label: "Bid / Ask Spread", value: "96.30 / 96.50" },
      { label: "Market Cap", value: "84.7B MAD" },
    ],
    series: [42, 40, 43, 45, 44, 47, 46, 50, 53, 51, 55, 58, 56, 60, 62, 65, 67, 71],
  },
  {
    symbol: "BCP",
    name: "Banque Centrale Populaire",
    marketLabel: "CSE Casablanca · Banques",
    isinOrRef: "ISIN MA0000011884",
    priceMad: "298.00",
    changeMad: "+4.20",
    changePct: "+1.43%",
    positive: true,
    sessionNote: "30-day simulated path · Deterministic GBM",
    metrics: [
      { label: "PER / PBR", value: "13.8x · 1.32x" },
      { label: "Bid / Ask Spread", value: "297.80 / 298.20" },
      { label: "Market Cap", value: "60.6B MAD" },
    ],
    series: [38, 41, 39, 43, 46, 45, 49, 51, 54, 52, 57, 61, 59, 64, 67, 66, 71, 75],
  },
  {
    symbol: "SPY",
    name: "SPDR S&P 500 ETF Trust",
    marketLabel: "NYSE Arca · Global ETF (MAD)",
    isinOrRef: "USD → MAD Reference",
    priceMad: "5,842.00",
    changeMad: "+48.60",
    changePct: "+0.84%",
    positive: true,
    sessionNote: "FX-settled in MAD · 500 US Large-Cap Equities",
    metrics: [
      { label: "Expense Ratio", value: "0.09% p.a." },
      { label: "FX Cross", value: "USD/MAD 9.92" },
      { label: "Annual Volatility", value: "14.8% σ" },
    ],
    series: [48, 50, 49, 53, 55, 54, 58, 60, 59, 63, 65, 67, 66, 70, 72, 74, 77, 80],
  },
  {
    symbol: "BTC",
    name: "Bitcoin / Moroccan Dirham",
    marketLabel: "Digital Asset · 24/7 Spot",
    isinOrRef: "BTC-MAD Synthetic",
    priceMad: "674,250.00",
    changeMad: "-8,420.00",
    changePct: "-1.23%",
    positive: false,
    sessionNote: "Continuous 24/7 book · High-beta stress asset",
    metrics: [
      { label: "Annual Volatility", value: "58.4% σ" },
      { label: "Spread Tier", value: "12 bps" },
      { label: "Settlement", value: "Instant · 5 bps" },
    ],
    series: [78, 82, 76, 79, 72, 68, 73, 67, 63, 66, 60, 56, 61, 55, 52, 57, 50, 48],
  },
  {
    symbol: "BDT10Y",
    name: "Morocco 10-Year Bon du Trésor",
    marketLabel: "BKAM Sovereign Curve · Fixed Income",
    isinOrRef: "10Y Benchmark Note",
    priceMad: "984.60",
    changeMad: "+3.40",
    changePct: "+0.35%",
    positive: true,
    sessionNote: "Bank Al-Maghrib Secondary Curve · Modified Duration 7.8y",
    metrics: [
      { label: "Yield to Maturity", value: "3.42% YTM" },
      { label: "Mod. Duration", value: "7.84 years" },
      { label: "DV01 (per 100k)", value: "78.40 MAD" },
    ],
    series: [50, 51, 50, 52, 53, 52, 54, 55, 55, 56, 57, 58, 57, 59, 60, 61, 62, 63],
  },
] as const;

const MINI_WATCHLIST = [
  { symbol: "LHM", name: "LafargeHolcim Maroc", price: "1,910.00", change: "+1.10%", pos: true },
  { symbol: "TQM", name: "Taqa Morocco", price: "1,365.00", change: "+1.52%", pos: true },
  { symbol: "MNG", name: "Managem", price: "2,680.00", change: "-0.45%", pos: false },
  { symbol: "AAPL", name: "Apple Inc. (MAD)", price: "2,265.00", change: "+0.92%", pos: true },
] as const;

export function HeroTerminalCard() {
  const [selectedSymbol, setSelectedSymbol] = useState<string>("ATW");
  const active = HERO_ASSETS.find((a) => a.symbol === selectedSymbol) ?? HERO_ASSETS[0];

  // Build SVG coordinates in 560x140 space
  const width = 560;
  const height = 140;
  const padX = 8;
  const padY = 14;
  const pts = active.series.map((val, idx) => {
    const x = padX + (idx / (active.series.length - 1)) * (width - padX * 2);
    const y = height - padY - (val / 100) * (height - padY * 2);
    return { x, y };
  });

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const lastPt = pts[pts.length - 1] ?? { x: width - padX, y: height / 2 };
  const firstPt = pts[0] ?? { x: padX, y: height / 2 };
  const areaPath = `${linePath} L${lastPt.x.toFixed(1)},${height} L${firstPt.x.toFixed(1)},${height} Z`;

  const strokeColor = active.positive ? "var(--bull)" : "var(--bear)";

  return (
    <div className="border-rule-strong/80 bg-surface relative overflow-hidden rounded-[22px] border p-5 shadow-lg sm:p-6">
      {/* Subtle radial gold glow in top-right corner matching Landing.html .ticker-card::before */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full opacity-60 blur-2xl"
        style={{
          background: "radial-gradient(circle, var(--brand-glow) 0%, transparent 70%)",
        }}
      />

      {/* Interactive Asset Selector Tabs */}
      <div className="border-rule relative flex items-center justify-between gap-2 border-b pb-3.5">
        <div
          role="tablist"
          aria-label="Preview instrument in terminal card"
          className="flex flex-wrap items-center gap-1"
        >
          {HERO_ASSETS.map((item) => {
            const isSelected = item.symbol === active.symbol;
            return (
              <button
                key={item.symbol}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedSymbol(item.symbol)}
                className={`numeric cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  isSelected
                    ? "bg-brand-navy text-canvas shadow-xs"
                    : "bg-surface-sunken text-foreground-secondary hover:bg-surface-inset hover:text-foreground"
                }`}
              >
                {item.symbol}
              </button>
            );
          })}
        </div>

        <span className="border-rule bg-surface-sunken text-foreground-secondary hidden items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-medium sm:inline-flex">
          <Activity aria-hidden="true" className="text-bull size-3" />
          <span>Interactive Preview</span>
        </span>
      </div>

      {/* Instrument Header & Quote */}
      <div className="relative mt-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="numeric bg-brand-subtle text-warning-text rounded px-1.5 py-0.5 text-2xs font-bold">
              {active.symbol}
            </span>
            <span className="text-foreground text-sm font-semibold">{active.name}</span>
          </div>
          <p className="numeric text-2xs text-foreground-muted mt-1">
            {active.marketLabel} · {active.isinOrRef}
          </p>
        </div>

        <Link
          href={simulatorUrl(`market/${active.symbol.toLowerCase()}`)}
          className="border-rule bg-surface-sunken hover:bg-surface-inset text-foreground inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-2xs font-semibold transition-colors"
        >
          <span>Open book</span>
          <ArrowUpRight aria-hidden="true" className="size-3" />
        </Link>
      </div>

      {/* Price & Change Display */}
      <div className="mt-3.5 flex flex-wrap items-baseline gap-3">
        <span className="numeric text-foreground text-3xl font-semibold tracking-tight sm:text-4xl">
          {active.priceMad}{" "}
          <span className="text-foreground-secondary text-sm font-normal">MAD</span>
        </span>
        <span
          className={`numeric inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            active.positive ? "bg-bull-subtle text-bull" : "bg-bear-subtle text-bear"
          }`}
        >
          <span>{active.changeMad} MAD</span>
          <span>({active.changePct})</span>
        </span>
      </div>
      <p className="text-2xs text-foreground-muted mt-1">{active.sessionNote}</p>

      {/* SVG Area Chart */}
      <div className="border-rule bg-surface-sunken/60 mt-4 overflow-hidden rounded-xl border p-2.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-32 w-full overflow-visible sm:h-36"
          role="img"
          aria-label={`Simulated 30-day price trajectory for ${active.name}`}
        >
          <defs>
            <linearGradient id={`heroAreaGrad-${active.symbol}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.24" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {/* Horizontal reference lines */}
          <line
            x1="0"
            y1="35"
            x2={width}
            y2="35"
            stroke="var(--rule)"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1="70"
            x2={width}
            y2="70"
            stroke="var(--rule)"
            strokeDasharray="3 3"
          />
          <line
            x1="0"
            y1="105"
            x2={width}
            y2="105"
            stroke="var(--rule)"
            strokeDasharray="3 3"
          />
          {/* Area fill */}
          <path d={areaPath} fill={`url(#heroAreaGrad-${active.symbol})`} />
          {/* Price line */}
          <path
            d={linePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Current price dot */}
          <circle
            cx={lastPt.x}
            cy={lastPt.y}
            r="4.5"
            fill={strokeColor}
            stroke="var(--surface)"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* 3-Column Instrument Telemetry */}
      <div className="border-rule mt-4 grid grid-cols-3 gap-2 border-t pt-3.5">
        {active.metrics.map((m) => (
          <div key={m.label}>
            <p className="label text-[10px]">{m.label}</p>
            <p className="numeric text-foreground mt-0.5 text-xs font-semibold">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Bottom Mini Watchlist Strip */}
      <div className="border-rule mt-3.5 border-t pt-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="label text-[10px]">Casablanca &amp; Global Cross-Asset Book</span>
          <Link
            href={simulatorUrl("market")}
            className="text-accent-text hover:text-accent-hover text-2xs font-semibold"
          >
            All 110 assets →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {MINI_WATCHLIST.map((w) => (
            <Link
              key={w.symbol}
              href={simulatorUrl(`market/${w.symbol.toLowerCase()}`)}
              className="border-rule bg-surface-sunken/80 hover:bg-surface-inset flex items-center justify-between rounded-lg border px-2.5 py-1.5 text-2xs transition-colors"
            >
              <span className="numeric text-foreground font-semibold">{w.symbol}</span>
              <span
                className={`numeric font-medium ${w.pos ? "text-bull" : "text-bear"}`}
              >
                {w.change}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
