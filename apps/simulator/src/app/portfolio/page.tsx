"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Briefcase,
  PieChart,
  Plus,
  RotateCcw,
  ShieldAlert,
  TrendingUp,
  Wallet,
  XCircle,
} from "lucide-react";
import { Num } from "@fsjesc/ui/primitives/num";
import { useSimulatorPortfolio } from "@fsjesc/ui/simulator/simulator-store";

export default function PortfolioPage() {
  const { telemetry, closePosition, resetPortfolio } = useSimulatorPortfolio(3000);
  const [banner, setBanner] = useState<string | null>(null);

  const totalEqNum = Number(telemetry.totalEquityCents) || 1;
  const investedPct = Math.max(
    0,
    Math.min(100, (Number(telemetry.investedCents) / totalEqNum) * 100),
  );
  const cashPct = Math.max(0, Math.min(100, (Number(telemetry.cashCents) / totalEqNum) * 100));
  const isTotalUp = telemetry.totalPnlCents >= 0n;

  return (
    <main id="main-content" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--sim-gold-ink)]">
            <span>Gestion d&apos;Actifs &amp; Contrôle des Risques</span>
            <span>·</span>
            <span>Séance {telemetry.dayNumber} / {telemetry.totalDays}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--sim-ink)]">
            Portefeuille &amp; Risque
          </h1>
          <p className="mt-1 text-sm text-[var(--sim-ink-3)]">
            Exposition par classe d&apos;actifs, indicateurs de risque (Sharpe, volatilité, drawdown) et gestion des lignes actives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              resetPortfolio("demo");
              setBanner("Portefeuille de démonstration FMC restauré.");
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-3.5 py-2 text-xs font-semibold text-[var(--sim-ink)] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5 text-[var(--sim-gold-ink)]" />
            <span>Restaurer Démo FMC</span>
          </button>

          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sim-navy)] hover:bg-[var(--sim-navy-2)] px-4 py-2 text-xs font-semibold text-[#f0d28a] shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Négocier un instrument</span>
          </Link>
        </div>
      </div>

      {banner && (
        <div className="rounded-xl border border-[var(--sim-gold)] bg-[var(--sim-gold-tint)] px-4 py-2.5 text-xs font-medium text-[var(--sim-ink)] flex items-center justify-between">
          <span>{banner}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            className="font-mono text-[11px] text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)] cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* 4-Column KPI Stat Strip */}
      <div className="sim-stats">
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Valeur Nette Liquidative</span>
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
            <span>Performance globale</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Exposition Investie</span>
            <Briefcase className="h-4 w-4 text-[var(--sim-indigo)]" />
          </div>
          <div className="sim-stat__value">
            <Num cents={telemetry.investedCents} />
          </div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--flat">{investedPct.toFixed(1)}%</span>
            <span>sur {telemetry.positions.length} ligne(s) ouverte(s)</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Liquidités Disponibles</span>
            <PieChart className="h-4 w-4 text-[var(--sim-emerald)]" />
          </div>
          <div className="sim-stat__value">
            <Num cents={telemetry.availableCashCents} />
          </div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--flat">{cashPct.toFixed(1)}%</span>
            <span>
              {telemetry.reservedCents > 0n
                ? `Dont ${(Number(telemetry.reservedCents) / 100).toFixed(0)} MAD réservés`
                : "Trésorerie disponible MAD"}
            </span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>P&amp;L Global Cumulé</span>
            <TrendingUp className="h-4 w-4 text-[var(--sim-gold-ink)]" />
          </div>
          <div className="sim-stat__value">
            <Num
              cents={telemetry.totalPnlCents}
              tone={isTotalUp ? "positive" : "negative"}
              signed
            />
          </div>
          <div className="sim-stat__sub">
            <span>Latent :</span>
            <strong className="font-mono text-[var(--sim-ink)]">
              <Num
                cents={telemetry.unrealisedPnlCents}
                size="xs"
                tone={telemetry.unrealisedPnlCents >= 0n ? "positive" : "negative"}
                signed
              />
            </strong>
          </div>
        </div>
      </div>

      {/* Institutional Risk Telemetry Strip */}
      <section className="sim-card">
        <div className="sim-card__head">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[var(--sim-gold-ink)]" />
            <div>
              <h2 className="sim-card__title">Indicateurs de Risque &amp; Performance</h2>
              <p className="sim-card__sub">
                Paramètres calculés sur la composition actuelle du portefeuille (taux sans risque BKAM : 3,00%)
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[var(--sim-border)]">
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Ratio de Sharpe
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-ink)]">
              {telemetry.riskMetrics.sharpeRatio.toFixed(2)}
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Rendement / Risque</span>
          </div>
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Volatilité Ann.
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-ink)]">
              {telemetry.riskMetrics.annualizedVolatilityPct.toFixed(2)}%
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Pondérée par ligne</span>
          </div>
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Drawdown Max (30J)
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-terracotta)]">
              -{telemetry.riskMetrics.maxDrawdownPct.toFixed(2)}%
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Perte max depuis pic</span>
          </div>
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Lignes Gagnantes
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-emerald)]">
              {telemetry.riskMetrics.winRatePct}%
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Positions en plus-value</span>
          </div>
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Score Diversification
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-indigo)]">
              {telemetry.riskMetrics.diversificationScore} / 100
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Indice Herfindahl (HHI)</span>
          </div>
          <div className="p-4">
            <span className="block font-mono text-[10px] uppercase text-[var(--sim-ink-3)]">
              Commissions Payées
            </span>
            <p className="mt-1 font-mono text-xl font-bold text-[var(--sim-ink)]">
              <Num cents={telemetry.riskMetrics.totalFeesPaidCents} size="sm" />
            </p>
            <span className="text-[11px] text-[var(--sim-ink-3)]">Courtage BVC (5 bps)</span>
          </div>
        </div>
      </section>

      {/* 2-Column Allocation Breakdown: Sector vs Market */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="sim-card">
          <div className="sim-card__head">
            <div>
              <h2 className="sim-card__title">Exposition Sectorielle</h2>
              <p className="sim-card__sub">Pondération du portefeuille par secteur économique</p>
            </div>
          </div>
          <div className="sim-card__body space-y-3.5">
            {telemetry.sectorAllocation.map((slice) => (
              <div key={slice.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-[var(--sim-ink)]">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span>{slice.label}</span>
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs">
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
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, slice.weightPct))}%`,
                      backgroundColor: slice.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sim-card">
          <div className="sim-card__head">
            <div>
              <h2 className="sim-card__title">Répartition par Classe d&apos;Actifs &amp; Marché</h2>
              <p className="sim-card__sub">Ventilation entre Bourse de Casablanca, Marchés US, Taux, FX et Liquidités</p>
            </div>
          </div>
          <div className="sim-card__body space-y-3.5">
            {telemetry.marketAllocation.map((slice) => (
              <div key={slice.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-[var(--sim-ink)]">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-xs shrink-0"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span>{slice.label}</span>
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs">
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
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(2, Math.min(100, slice.weightPct))}%`,
                      backgroundColor: slice.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Detailed Open Positions Table */}
      <section className="sim-card">
        <div className="sim-card__head">
          <div>
            <h2 className="sim-card__title">
              Inventaire Détaillé des Positions ({telemetry.positions.length})
            </h2>
            <p className="sim-card__sub">
              Gestion directe des lignes : allègement partiel (-50%), clôture totale au marché ou ouverture dans le terminal
            </p>
          </div>
        </div>

        {telemetry.positions.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm text-[var(--sim-ink-2)]">
              Aucune position ouverte en portefeuille.
            </p>
            <Link
              href="/market"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sim-emerald)] px-4 py-2 text-xs font-semibold text-white"
            >
              Ouvrir le terminal de marché &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-5 py-3">Instrument</th>
                  <th className="px-4 py-3">Marché &amp; Secteur</th>
                  <th className="px-4 py-3 text-right">Quantité</th>
                  <th className="px-4 py-3 text-right">PRU (MAD)</th>
                  <th className="px-4 py-3 text-right">Cours Bid / Ask</th>
                  <th className="px-4 py-3 text-right">Valorisation</th>
                  <th className="px-4 py-3 text-right">P&amp;L Latent</th>
                  <th className="px-4 py-3 text-right">Poids</th>
                  <th className="px-5 py-3 text-right">Actions Rapides</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {telemetry.positions.map((pos) => {
                  const isGain = pos.unrealisedPnlCents >= 0n;
                  return (
                    <tr key={pos.symbol} className="hover:bg-[var(--sim-bg-subtle)]">
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
                              <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                            </div>
                            <span className="font-mono text-[10px] text-[var(--sim-ink-3)]">
                              Coût total :{" "}
                              {((pos.quantity * pos.averageCostCents) / 100).toLocaleString(
                                "fr-MA",
                                { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                              )}{" "}
                              MAD
                            </span>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="block font-semibold text-[var(--sim-ink)]">
                          {pos.market}
                        </span>
                        <span className="text-[11px] text-[var(--sim-ink-3)]">
                          {pos.sectorLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-[var(--sim-ink)]">
                        {pos.quantity}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[var(--sim-ink-2)]">
                        {(pos.averageCostCents / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[11px] text-[var(--sim-ink-2)]">
                        <span className="text-[var(--sim-emerald)]">
                          {(pos.bidCents / 100).toFixed(2)}
                        </span>{" "}
                        /{" "}
                        <span className="text-[var(--sim-terracotta)]">
                          {(pos.askCents / 100).toFixed(2)}
                        </span>
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
                      <td className="px-4 py-3.5 text-right font-mono font-semibold text-[var(--sim-ink)]">
                        {pos.weightPct.toFixed(1)}%
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Link
                            href={`/market/${pos.symbol.toLowerCase()}`}
                            className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--sim-ink)]"
                          >
                            Renforcer
                          </Link>
                          {pos.quantity >= 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = closePosition(pos.symbol, 0.5);
                                setBanner(res.message);
                              }}
                              className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] hover:bg-[var(--sim-bg-muted)] px-2 py-1 font-mono text-[11px] font-semibold text-[var(--sim-ink-2)] cursor-pointer"
                              title="Vendre 50% de la position au marché"
                            >
                              -50%
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const res = closePosition(pos.symbol, 1);
                              setBanner(res.message);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--sim-terracotta)]/30 bg-[var(--sim-terracotta-tint)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--sim-terracotta)] hover:opacity-90 cursor-pointer"
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
    </main>
  );
}
