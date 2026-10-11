"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  CalendarPlus,
  Plus,
  TrendingUp,
  Wallet,
  Activity,
  Award,
  XCircle,
} from "lucide-react";
import { Num } from "@fsjesc/ui/primitives/num";
import { useSimulatorPortfolio } from "@fsjesc/ui/simulator/simulator-store";
import { formatDate } from "@fsjesc/config/format";
import { cn } from "@fsjesc/config/cn";

export default function DashboardPage() {
  const { telemetry, advanceDay, closePosition, cancelOrder } = useSimulatorPortfolio(3000);
  const [curveWindow, setCurveWindow] = useState<10 | 20 | 30>(30);
  const [allocMode, setAllocMode] = useState<"sector" | "market">("sector");
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const isTotalUp = telemetry.totalPnlCents >= 0n;
  const isDayUp = telemetry.dayPnlCents >= 0n;
  const isUnrealUp = telemetry.unrealisedPnlCents >= 0n;

  const cashWeightPct =
    telemetry.totalEquityCents > 0n
      ? (Number(telemetry.cashCents) / Number(telemetry.totalEquityCents)) * 100
      : 100;

  // Slice equity curve to selected window
  const visibleCurve = telemetry.equityCurve.slice(-curveWindow);
  const minEq = Math.min(
    ...visibleCurve.map((p) => Math.min(p.equityCents, p.benchmarkCents)),
    9_800_000,
  );
  const maxEq = Math.max(
    ...visibleCurve.map((p) => Math.max(p.equityCents, p.benchmarkCents)),
    10_200_000,
  );
  const eqSpan = Math.max(1, maxEq - minEq);

  const svgWidth = 680;
  const svgHeight = 230;
  const padX = 16;
  const padY = 20;
  const plotW = svgWidth - padX * 2;
  const plotH = svgHeight - padY * 2;

  const points = visibleCurve.map((pt, idx) => {
    const x =
      visibleCurve.length > 1
        ? padX + (idx / (visibleCurve.length - 1)) * plotW
        : padX + plotW / 2;
    const y = padY + plotH - ((pt.equityCents - minEq) / eqSpan) * plotH;
    const benchY = padY + plotH - ((pt.benchmarkCents - minEq) / eqSpan) * plotH;
    return { ...pt, x, y, benchY };
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath =
    points.length > 0
      ? `${linePath} L${points[points.length - 1]!.x.toFixed(1)},${(padY + plotH).toFixed(1)} L${points[0]!.x.toFixed(1)},${(padY + plotH).toFixed(1)} Z`
      : "";
  const benchPath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.benchY.toFixed(1)}`)
    .join(" ");

  const activePoint = hoverIdx !== null && points[hoverIdx] ? points[hoverIdx] : points[points.length - 1];
  const allocations =
    allocMode === "sector" ? telemetry.sectorAllocation : telemetry.marketAllocation;

  return (
    <main id="main-content" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--sim-gold-ink)]">
            <span>Poste Opérateur FSJESC-FMC</span>
            <span>·</span>
            <span>Séance {telemetry.dayNumber} / {telemetry.totalDays}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--sim-ink)]">
            Tableau de bord
          </h1>
          <p className="mt-1 text-sm text-[var(--sim-ink-3)]">
            Valorisation mark-to-market en temps réel, courbe d&apos;équité, allocation sectorielle et positions actives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              const res = advanceDay(1);
              setActionBanner(
                res.filledMessages.length > 0
                  ? `Jour ${res.newDayNumber} : ${res.filledMessages.join(" · ")}`
                  : `Séance avancée au Jour ${res.newDayNumber} / ${telemetry.totalDays}.`,
              );
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-3.5 py-2 text-xs font-semibold text-[var(--sim-ink)] shadow-2xs transition-colors cursor-pointer"
          >
            <CalendarPlus className="h-4 w-4 text-[var(--sim-gold-ink)]" />
            <span>Avancer d&apos;un jour (J+1)</span>
          </button>

          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sim-navy)] hover:bg-[var(--sim-navy-2)] px-4 py-2 text-xs font-semibold text-[#f0d28a] shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Passer un ordre</span>
          </Link>
        </div>
      </div>

      {actionBanner && (
        <div className="rounded-xl border border-[var(--sim-gold)] bg-[var(--sim-gold-tint)] px-4 py-2.5 text-xs font-medium text-[var(--sim-ink)] flex items-center justify-between">
          <span>{actionBanner}</span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="font-mono text-[11px] text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)] cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 4-Column KPI Stat Strip (.sim-stats) */}
      <div className="sim-stats">
        {/* 1. Net Liquidation Value */}
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Valeur totale (Net Liq.)</span>
            <Wallet className="h-4 w-4 text-[var(--sim-gold-ink)]" />
          </div>
          <div className="sim-stat__value">
            <Num cents={telemetry.totalEquityCents} />
          </div>
          <div className="sim-stat__sub">
            <span className={isTotalUp ? "sim-delta sim-delta--up" : "sim-delta sim-delta--down"}>
              {isTotalUp ? "+" : ""}
              {(Number(telemetry.totalReturnBps) / 100).toFixed(2)}%
            </span>
            <span>vs dotation 100 000 MAD</span>
          </div>
        </div>

        {/* 2. Day P&L */}
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>P&amp;L Jour (Séance J{telemetry.dayNumber})</span>
            <Activity className="h-4 w-4 text-[var(--sim-indigo)]" />
          </div>
          <div className="sim-stat__value">
            <Num
              cents={telemetry.dayPnlCents}
              tone={isDayUp ? "positive" : "negative"}
              signed
            />
          </div>
          <div className="sim-stat__sub">
            <span className={isDayUp ? "sim-delta sim-delta--up" : "sim-delta sim-delta--down"}>
              {isDayUp ? "+" : ""}
              {(Number(telemetry.dayReturnBps) / 100).toFixed(2)}%
            </span>
            <span>variation sur 24h</span>
          </div>
        </div>

        {/* 3. Liquid Cash */}
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Liquidités disponibles</span>
            <TrendingUp className="h-4 w-4 text-[var(--sim-emerald)]" />
          </div>
          <div className="sim-stat__value">
            <Num cents={telemetry.availableCashCents} />
          </div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--flat">{cashWeightPct.toFixed(1)}%</span>
            <span>
              {telemetry.reservedCents > 0n
                ? `Réservé carnet : ${(Number(telemetry.reservedCents) / 100).toFixed(0)} MAD`
                : "Pouvoir d'achat immédiat"}
            </span>
          </div>
        </div>

        {/* 4. Realised & Unrealised P&L */}
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>P&amp;L Latent &amp; Réalisé</span>
            <Award className="h-4 w-4 text-[var(--sim-gold-ink)]" />
          </div>
          <div className="sim-stat__value">
            <Num
              cents={telemetry.unrealisedPnlCents}
              tone={isUnrealUp ? "positive" : "negative"}
              signed
            />
          </div>
          <div className="sim-stat__sub">
            <span>Réalisé :</span>
            <strong className="font-mono text-[var(--sim-ink)]">
              <Num
                cents={telemetry.realisedPnlCents}
                size="xs"
                tone={telemetry.realisedPnlCents >= 0n ? "positive" : "negative"}
                signed
              />
            </strong>
          </div>
        </div>
      </div>

      {/* 2-Column Dashboard Grid: 30-Day Equity Curve + Sector/Market Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] gap-6">
        {/* Equity Curve Card */}
        <section className="sim-card flex flex-col justify-between">
          <div className="sim-card__head">
            <div>
              <h2 className="sim-card__title">Courbe d&apos;équité ({curveWindow} séances)</h2>
              <p className="sim-card__sub">
                Évolution de la valeur liquidative en MAD face à la dotation initiale (100 000 MAD)
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-lg bg-[var(--sim-bg-subtle)] p-1 border border-[var(--sim-border)]">
              {([10, 20, 30] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setCurveWindow(w)}
                  className={cn(
                    "rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition-colors cursor-pointer",
                    curveWindow === w
                      ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs border border-[var(--sim-border)]"
                      : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
                  )}
                >
                  {w}J
                </button>
              ))}
            </div>
          </div>

          <div className="sim-card__body">
            {activePoint && (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-semibold text-[var(--sim-ink-3)]">
                    Séance {activePoint.label}
                  </span>
                  <span className="font-mono text-sm font-bold text-[var(--sim-ink)]">
                    {(activePoint.equityCents / 100).toLocaleString("fr-MA", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    MAD
                  </span>
                </div>
                <div className="flex items-center gap-4 font-mono text-[11px] text-[var(--sim-ink-3)]">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--sim-emerald)]" />
                    Portefeuille FMC
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-0.5 w-3 bg-[var(--sim-gold)]" />
                    Indice Réf.
                  </span>
                </div>
              </div>
            )}

            <div className="relative w-full overflow-hidden">
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-56 overflow-visible"
                role="img"
                aria-label="Courbe d'équité du portefeuille sur 30 séances"
                onMouseLeave={() => setHoverIdx(null)}
              >
                <defs>
                  <linearGradient id="simEquityGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--sim-emerald)" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="var(--sim-emerald)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {[0.2, 0.5, 0.8].map((ratio, idx) => {
                  const y = padY + plotH * ratio;
                  const val = maxEq - ratio * eqSpan;
                  return (
                    <g key={idx}>
                      <line
                        x1={padX}
                        y1={y}
                        x2={svgWidth - padX}
                        y2={y}
                        stroke="var(--sim-border)"
                        strokeDasharray="3 3"
                        strokeWidth="1"
                      />
                      <text
                        x={padX + 4}
                        y={y - 5}
                        fill="var(--sim-ink-4)"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {(val / 100).toFixed(0)} MAD
                      </text>
                    </g>
                  );
                })}

                {/* Benchmark Dashed Line */}
                <path
                  d={benchPath}
                  fill="none"
                  stroke="var(--sim-gold)"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Portfolio Area & Line */}
                <path d={areaPath} fill="url(#simEquityGrad)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="var(--sim-emerald)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Hover Columns */}
                {points.map((pt, idx) => (
                  <g key={pt.day}>
                    <rect
                      x={pt.x - plotW / points.length / 2}
                      y={padY}
                      width={plotW / points.length}
                      height={plotH}
                      fill="transparent"
                      className="cursor-crosshair"
                      onMouseEnter={() => setHoverIdx(idx)}
                    />
                    {(hoverIdx === idx || idx === points.length - 1) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoverIdx === idx ? 5 : 4}
                        fill="var(--sim-emerald)"
                        stroke="var(--sim-bg-card)"
                        strokeWidth="2"
                      />
                    )}
                  </g>
                ))}
              </svg>
            </div>
          </div>

          <div className="border-t border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-5 py-3 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
                Ratio de Sharpe
              </span>
              <span className="font-mono font-bold text-[var(--sim-ink)]">
                {telemetry.riskMetrics.sharpeRatio.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
                Volatilité Ann.
              </span>
              <span className="font-mono font-bold text-[var(--sim-ink)]">
                {telemetry.riskMetrics.annualizedVolatilityPct.toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
                Drawdown Max
              </span>
              <span className="font-mono font-bold text-[var(--sim-terracotta)]">
                -{telemetry.riskMetrics.maxDrawdownPct.toFixed(2)}%
              </span>
            </div>
          </div>
        </section>

        {/* Sector & Market Allocation Card */}
        <section className="sim-card flex flex-col justify-between">
          <div>
            <div className="sim-card__head">
              <div>
                <h2 className="sim-card__title">Allocation Sectorielle</h2>
                <p className="sim-card__sub">Répartition du capital par secteur et marché</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-[var(--sim-bg-subtle)] p-1 border border-[var(--sim-border)]">
                <button
                  type="button"
                  onClick={() => setAllocMode("sector")}
                  className={cn(
                    "rounded px-2 py-1 text-[11px] font-semibold cursor-pointer",
                    allocMode === "sector"
                      ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                      : "text-[var(--sim-ink-3)]",
                  )}
                >
                  Secteurs
                </button>
                <button
                  type="button"
                  onClick={() => setAllocMode("market")}
                  className={cn(
                    "rounded px-2 py-1 text-[11px] font-semibold cursor-pointer",
                    allocMode === "market"
                      ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                      : "text-[var(--sim-ink-3)]",
                  )}
                >
                  Marchés
                </button>
              </div>
            </div>

            <div className="sim-card__body space-y-3.5">
              {allocations.map((slice) => (
                <div key={slice.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium text-[var(--sim-ink)]">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                        style={{ backgroundColor: slice.color }}
                      />
                      <span className="truncate">{slice.label}</span>
                    </span>
                    <div className="flex items-center gap-2.5 font-mono text-xs">
                      <span className="text-[var(--sim-ink-3)]">
                        <Num cents={slice.valueCents} size="xs" />
                      </span>
                      <strong className="w-12 text-right text-[var(--sim-ink)]">
                        {slice.weightPct.toFixed(1)}%
                      </strong>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-[var(--sim-bg-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.max(2, Math.min(100, slice.weightPct))}%`,
                        backgroundColor: slice.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-5 py-3 flex items-center justify-between text-xs">
            <span className="text-[var(--sim-ink-3)]">Score de diversification</span>
            <span className="font-mono font-bold text-[var(--sim-emerald)]">
              {telemetry.riskMetrics.diversificationScore} / 100
            </span>
          </div>
        </section>
      </div>

      {/* Active Positions Table Card */}
      <section className="sim-card">
        <div className="sim-card__head">
          <div>
            <h2 className="sim-card__title">
              Positions Actives ({telemetry.positions.length})
            </h2>
            <p className="sim-card__sub">
              Lignes en portefeuille valorisées en continu au dernier cours du marché
            </p>
          </div>
          <Link
            href="/portfolio"
            className="font-mono text-xs font-semibold text-[var(--sim-indigo)] hover:underline"
          >
            Analyse de risque détaillée &rarr;
          </Link>
        </div>

        {telemetry.positions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-medium text-[var(--sim-ink-2)]">
              Aucune position ouverte actuellement. Votre capital de 100 000,00 MAD est 100% liquide.
            </p>
            <Link
              href="/market"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sim-emerald)] px-4 py-2 text-xs font-semibold text-white"
            >
              Explorer les 110 instruments du marché &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-5 py-3">Instrument</th>
                  <th className="px-4 py-3">Secteur / Marché</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right">PRU (MAD)</th>
                  <th className="px-4 py-3 text-right">Dernier Cours</th>
                  <th className="px-4 py-3 text-right">Valorisation</th>
                  <th className="px-4 py-3 text-right">P&amp;L Latent</th>
                  <th className="px-4 py-3 text-right">Poids</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {telemetry.positions.map((pos) => {
                  const isGain = pos.unrealisedPnlCents >= 0n;
                  return (
                    <tr
                      key={pos.symbol}
                      className="hover:bg-[var(--sim-bg-subtle)] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/market/${pos.symbol.toLowerCase()}`}
                          className="group flex items-center gap-2.5"
                        >
                          <span className="inline-flex h-8 w-11 items-center justify-center rounded-lg bg-[var(--sim-navy)] font-mono text-xs font-bold text-[#f0d28a]">
                            {pos.symbol}
                          </span>
                          <div>
                            <div className="font-semibold text-[var(--sim-ink)] group-hover:text-[var(--sim-indigo)] flex items-center gap-1">
                              <span>{pos.name}</span>
                              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--sim-ink-3)]">
                              {pos.locked ? "Règlement T+2 en cours" : "Disponible à la vente"}
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center rounded-md bg-[var(--sim-bg-muted)] px-2 py-0.5 font-mono text-[10.5px] font-medium text-[var(--sim-ink-2)]">
                          {pos.sectorLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[var(--sim-ink)]">
                        {pos.quantity.toLocaleString("fr-MA")}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[var(--sim-ink-2)]">
                        {(pos.averageCostCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[var(--sim-ink)]">
                        {(pos.lastPriceCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[var(--sim-ink)]">
                        <Num cents={pos.marketValueCents} size="xs" />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono font-semibold">
                            <Num
                              cents={pos.unrealisedPnlCents}
                              size="xs"
                              tone={isGain ? "positive" : "negative"}
                              signed
                            />
                          </span>
                          <span
                            className={
                              isGain
                                ? "sim-delta sim-delta--up mt-0.5"
                                : "sim-delta sim-delta--down mt-0.5"
                            }
                          >
                            {isGain ? "+" : ""}
                            {(Number(pos.returnBps) / 100).toFixed(2)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[var(--sim-ink-2)]">
                        {pos.weightPct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/market/${pos.symbol.toLowerCase()}`}
                            className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--sim-ink)] transition-colors"
                          >
                            Négocier
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              const res = closePosition(pos.symbol, 1);
                              setActionBanner(res.message);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--sim-terracotta)]/30 bg-[var(--sim-terracotta-tint)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--sim-terracotta)] hover:opacity-90 cursor-pointer"
                            title={`Vendre 100% de la position ${pos.symbol} au marché`}
                          >
                            <XCircle className="h-3 w-3" />
                            <span>Clôturer</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Recent & Pending Orders Card */}
      <section className="sim-card">
        <div className="sim-card__head">
          <div>
            <h2 className="sim-card__title">
              Carnet d&apos;Ordres &amp; Exécutions Récentes ({telemetry.orders.length})
            </h2>
            <p className="sim-card__sub">
              Ordres limites en attente dans le carnet L2 et dernières transactions exécutées
            </p>
          </div>
          <Link
            href="/history"
            className="font-mono text-xs font-semibold text-[var(--sim-indigo)] hover:underline"
          >
            Voir tout le journal d&apos;audit &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
              <tr>
                <th className="px-5 py-3">Réf.</th>
                <th className="px-4 py-3">Instrument</th>
                <th className="px-4 py-3">Sens &amp; Type</th>
                <th className="px-4 py-3 text-right">Exécuté / Demandé</th>
                <th className="px-4 py-3 text-right">Cours Exéc. / Limite</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-5 py-3 text-right">Date / Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--sim-border)]">
              {telemetry.orders.slice(0, 8).map((ord) => {
                const priceCents =
                  ord.averageFillCents > 0
                    ? ord.averageFillCents
                    : (ord.limitCents ?? ord.stopCents ?? 0);
                return (
                  <tr key={ord.id} className="hover:bg-[var(--sim-bg-subtle)]">
                    <td className="px-5 py-3 font-mono text-[11px] text-[var(--sim-ink-3)]">
                      {ord.id}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/market/${ord.symbol.toLowerCase()}`}
                        className="font-mono font-bold text-[var(--sim-ink)] hover:text-[var(--sim-indigo)]"
                      >
                        {ord.symbol}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded px-2 py-0.5 font-mono text-[10.5px] font-bold mr-1.5",
                          ord.side === "BUY"
                            ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                            : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                        )}
                      >
                        {ord.side === "BUY" ? "ACHAT" : "VENTE"}
                      </span>
                      <span className="font-mono text-[11px] text-[var(--sim-ink-3)]">
                        {ord.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--sim-ink)]">
                      {ord.filled} / {ord.requested}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--sim-ink)]">
                      {priceCents > 0 ? `${(priceCents / 100).toFixed(2)} MAD` : "Au marché"}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[var(--sim-ink-3)]">
                      <Num cents={ord.feeCents} size="xs" />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold",
                          ord.status === "FILLED"
                            ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                            : ord.status === "PENDING"
                              ? "bg-[var(--sim-amber-tint)] text-[var(--sim-amber)]"
                              : ord.status === "PARTIAL"
                                ? "bg-[var(--sim-indigo-tint)] text-[var(--sim-indigo)]"
                                : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                        )}
                      >
                        {ord.status === "FILLED"
                          ? "EXÉCUTÉ"
                          : ord.status === "PENDING"
                            ? "EN CARNET"
                            : ord.status === "PARTIAL"
                              ? "PARTIEL"
                              : ord.status === "CANCELLED"
                                ? "ANNULÉ"
                                : "REJETÉ"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {ord.status === "PENDING" ? (
                        <button
                          type="button"
                          onClick={() => {
                            cancelOrder(ord.id);
                            setActionBanner(`Ordre ${ord.id} annulé.`);
                          }}
                          className="rounded border border-[var(--sim-terracotta)]/40 bg-[var(--sim-terracotta-tint)] px-2.5 py-1 font-mono text-[10.5px] font-semibold text-[var(--sim-terracotta)] hover:opacity-90 cursor-pointer"
                        >
                          Annuler l&apos;ordre
                        </button>
                      ) : (
                        <span className="font-mono text-[11px] text-[var(--sim-ink-3)]">
                          {formatDate(new Date(ord.placedAt * 1000))}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
