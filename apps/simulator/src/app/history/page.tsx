"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Receipt,
  Search,
  XCircle,
} from "lucide-react";
import { Num } from "@fsjesc/ui/primitives/num";
import { useSimulatorPortfolio } from "@fsjesc/ui/simulator/simulator-store";
import { formatDate } from "@fsjesc/config/format";
import { cn } from "@fsjesc/config/cn";

export default function HistoryPage() {
  const { telemetry, cancelOrder } = useSimulatorPortfolio(3000);
  const [activeTab, setActiveTab] = useState<
    "orders" | "pending" | "executions" | "transactions"
  >("orders");
  const [searchQuery, setSearchQuery] = useState("");
  const [sideFilter, setSideFilter] = useState<"ALL" | "BUY" | "SELL">("ALL");

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return telemetry.orders.filter((o) => {
      const matchSide = sideFilter === "ALL" || o.side === sideFilter;
      const matchSearch =
        q.length === 0 ||
        o.symbol.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q) ||
        o.status.toLowerCase().includes(q);
      return matchSide && matchSearch;
    });
  }, [telemetry.orders, searchQuery, sideFilter]);

  const filledOrders = useMemo(
    () => filteredOrders.filter((o) => o.filled > 0),
    [filteredOrders],
  );
  const pendingOrders = useMemo(
    () => filteredOrders.filter((o) => o.status === "PENDING"),
    [filteredOrders],
  );

  // Compute chronological cash ledger entries with running balance
  const ledgerEntries = useMemo(() => {
    const sortedAsc = [...telemetry.filledOrders].sort((a, b) => a.placedAt - b.placedAt);
    let runningBalanceCents = 10_000_000n;
    const rows: Array<{
      id: string;
      isCredit: boolean;
      description: string;
      amountCents: bigint;
      balanceCents: bigint;
      timestampLabel: string;
    }> = [
      {
        id: "initial-endowment",
        isCredit: true,
        description: "Dotation Initiale Académique FSJESC-FMC (Capital de départ)",
        amountCents: 10_000_000n,
        balanceCents: runningBalanceCents,
        timestampLabel: "Ouverture du compte",
      },
    ];

    for (const o of sortedAsc) {
      const gross = BigInt(o.filled * o.averageFillCents);
      const net = o.side === "BUY" ? -(gross + o.feeCents) : gross - o.feeCents;
      runningBalanceCents += net;
      rows.push({
        id: o.id,
        isCredit: net >= 0n,
        description: `${o.side === "BUY" ? "ACHAT" : "VENTE"} ${o.filled} ${o.symbol} @ ${(o.averageFillCents / 100).toFixed(2)} MAD (Commission : ${(Number(o.feeCents) / 100).toFixed(2)} MAD)`,
        amountCents: net,
        balanceCents: runningBalanceCents,
        timestampLabel: formatDate(new Date(o.placedAt * 1000)),
      });
    }

    return rows.reverse();
  }, [telemetry.filledOrders]);

  const handleExportCsv = () => {
    const headers = [
      "OrderID",
      "Symbol",
      "Side",
      "Type",
      "Requested",
      "Filled",
      "AvgFillOrLimitMAD",
      "FeeMAD",
      "Status",
      "Timestamp",
    ];
    const csvRows = [
      headers.join(","),
      ...telemetry.orders.map((o) =>
        [
          o.id,
          o.symbol,
          o.side,
          o.type,
          o.requested,
          o.filled,
          ((o.averageFillCents || o.limitCents || o.stopCents || 0) / 100).toFixed(2),
          (Number(o.feeCents) / 100).toFixed(2),
          o.status,
          new Date(o.placedAt * 1000).toISOString(),
        ].join(","),
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fsjesc-fmc-journal-ordres-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main id="main-content" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--sim-gold-ink)]">
            <span>Journal d&apos;Audit &amp; Règlement-Livraison</span>
            <span>·</span>
            <span>Séance {telemetry.dayNumber} / {telemetry.totalDays}</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--sim-ink)]">
            Historique d&apos;Ordres &amp; Grand Livre
          </h1>
          <p className="mt-1 text-sm text-[var(--sim-ink-3)]">
            Traçabilité intégrale des ordres soumis, ordres limites en attente dans le carnet L2, exécutions et mouvements espèces.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-4 py-2 text-xs font-semibold text-[var(--sim-ink)] shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="h-4 w-4 text-[var(--sim-gold-ink)]" />
          <span>Exporter CSV</span>
        </button>
      </div>

      {/* 4-Column KPI Stat Strip */}
      <div className="sim-stats">
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Total d&apos;Ordres Soumis</span>
            <FileSpreadsheet className="h-4 w-4 text-[var(--sim-gold-ink)]" />
          </div>
          <div className="sim-stat__value">{telemetry.orders.length}</div>
          <div className="sim-stat__sub">
            <span>Depuis l&apos;ouverture du compte</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Ordres Exécutés (Fills)</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--sim-emerald)]" />
          </div>
          <div className="sim-stat__value">{telemetry.filledOrders.length}</div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--up">100% conformes</span>
            <span>Règlement T+2</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Ordres en Carnet (Actifs)</span>
            <Clock className="h-4 w-4 text-[var(--sim-amber)]" />
          </div>
          <div className="sim-stat__value">{telemetry.pendingOrders.length}</div>
          <div className="sim-stat__sub">
            <span>
              Réservé :{" "}
              <strong className="font-mono text-[var(--sim-ink)]">
                <Num cents={telemetry.reservedCents} size="xs" />
              </strong>
            </span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Commissions Payées</span>
            <Receipt className="h-4 w-4 text-[var(--sim-indigo)]" />
          </div>
          <div className="sim-stat__value">
            <Num cents={telemetry.riskMetrics.totalFeesPaidCents} />
          </div>
          <div className="sim-stat__sub">
            <span>Tarif académique : 5 bps / ordre</span>
          </div>
        </div>
      </div>

      {/* Main Ledger Card */}
      <section className="sim-card">
        {/* Tabs + Search/Filter Toolbar */}
        <div className="sim-card__head">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist">
            {(
              [
                { id: "orders", label: `Tous les ordres (${filteredOrders.length})` },
                { id: "pending", label: `En attente carnet (${pendingOrders.length})` },
                { id: "executions", label: `Exécutions (${filledOrders.length})` },
                { id: "transactions", label: `Grand livre espèces (${ledgerEntries.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-[var(--sim-navy)] text-[#f0d28a] shadow-2xs"
                    : "text-[var(--sim-ink-3)] hover:bg-[var(--sim-bg-subtle)] hover:text-[var(--sim-ink)]",
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-0.5">
              {(["ALL", "BUY", "SELL"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSideFilter(s)}
                  className={cn(
                    "rounded px-2.5 py-1 font-mono text-[11px] font-semibold cursor-pointer",
                    sideFilter === s
                      ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                      : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
                  )}
                >
                  {s === "ALL" ? "Tous" : s === "BUY" ? "Achats" : "Ventes"}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--sim-ink-3)]" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filtrer par ticker ou réf..."
                className="rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] py-1 pl-8 pr-3 text-xs text-[var(--sim-ink)]"
              />
            </div>
          </div>
        </div>

        {/* Tab 1 & 2: Orders / Pending Orders */}
        {(activeTab === "orders" || activeTab === "pending") && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-5 py-3">Réf. Ordre</th>
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3">Sens</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3 text-right">Exécuté / Demandé</th>
                  <th className="px-4 py-3 text-right">Cours Exéc. / Cible</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3">Statut / Motif</th>
                  <th className="px-5 py-3 text-right">Horodatage / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {(activeTab === "pending" ? pendingOrders : filteredOrders).length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[var(--sim-ink-3)]">
                      Aucun ordre ne correspond aux critères sélectionnés.
                    </td>
                  </tr>
                ) : (
                  (activeTab === "pending" ? pendingOrders : filteredOrders).map((o) => {
                    const displayPrice =
                      o.averageFillCents > 0
                        ? o.averageFillCents
                        : (o.limitCents ?? o.stopCents ?? 0);
                    return (
                      <tr key={o.id} className="hover:bg-[var(--sim-bg-subtle)]">
                        <td className="px-5 py-3 font-mono text-[11px] text-[var(--sim-ink-3)]">
                          {o.id}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={`/market/${o.symbol.toLowerCase()}`}
                            className="font-mono font-bold text-[var(--sim-ink)] hover:text-[var(--sim-indigo)]"
                          >
                            {o.symbol}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center rounded px-2 py-0.5 font-mono text-[10.5px] font-bold",
                              o.side === "BUY"
                                ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                                : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                            )}
                          >
                            {o.side === "BUY" ? "ACHAT" : "VENTE"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-[var(--sim-ink-2)]">
                          {o.type}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-semibold text-[var(--sim-ink)]">
                          {o.filled} / {o.requested}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--sim-ink)]">
                          {displayPrice > 0 ? `${(displayPrice / 100).toFixed(2)} MAD` : "Marché"}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-[var(--sim-ink-3)]">
                          <Num cents={o.feeCents} size="xs" />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span
                              className={cn(
                                "inline-flex w-fit items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold",
                                o.status === "FILLED"
                                  ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                                  : o.status === "PENDING"
                                    ? "bg-[var(--sim-amber-tint)] text-[var(--sim-amber)]"
                                    : o.status === "PARTIAL"
                                      ? "bg-[var(--sim-indigo-tint)] text-[var(--sim-indigo)]"
                                      : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                              )}
                            >
                              {o.status === "FILLED"
                                ? "EXÉCUTÉ"
                                : o.status === "PENDING"
                                  ? "EN CARNET"
                                  : o.status === "PARTIAL"
                                    ? "PARTIEL"
                                    : o.status === "CANCELLED"
                                      ? "ANNULÉ"
                                      : "REJETÉ"}
                            </span>
                            {o.reason && (
                              <span className="text-[11px] text-[var(--sim-ink-3)]">
                                {o.reason}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {o.status === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => cancelOrder(o.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-[var(--sim-terracotta)]/40 bg-[var(--sim-terracotta-tint)] px-2.5 py-1 font-mono text-[10.5px] font-semibold text-[var(--sim-terracotta)] hover:opacity-90 cursor-pointer"
                            >
                              <XCircle className="h-3 w-3" />
                              <span>Annuler</span>
                            </button>
                          ) : (
                            <span className="font-mono text-[11px] text-[var(--sim-ink-3)]">
                              {formatDate(new Date(o.placedAt * 1000))}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Executions (Fills) */}
        {activeTab === "executions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-5 py-3">ID Exécution</th>
                  <th className="px-4 py-3">Instrument</th>
                  <th className="px-4 py-3">Sens</th>
                  <th className="px-4 py-3 text-right">Titres</th>
                  <th className="px-4 py-3 text-right">Cours Exécuté</th>
                  <th className="px-4 py-3 text-right">Montant Brut</th>
                  <th className="px-4 py-3 text-right">Commission (5 bps)</th>
                  <th className="px-4 py-3 text-right">Règlement Net</th>
                  <th className="px-5 py-3 text-right">Date d&apos;Exécution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {filledOrders.map((o) => {
                  const grossCents = BigInt(o.filled * o.averageFillCents);
                  const netCents =
                    o.side === "BUY" ? -(grossCents + o.feeCents) : grossCents - o.feeCents;
                  return (
                    <tr key={o.id} className="hover:bg-[var(--sim-bg-subtle)]">
                      <td className="px-5 py-3 font-mono text-[11px] text-[var(--sim-ink-3)]">
                        EXE-{o.id.slice(-4)}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-[var(--sim-ink)]">
                        {o.symbol}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "rounded px-2 py-0.5 font-mono text-[10.5px] font-bold",
                            o.side === "BUY"
                              ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                              : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                          )}
                        >
                          {o.side === "BUY" ? "ACHAT" : "VENTE"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">{o.filled}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <Num cents={BigInt(o.averageFillCents)} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <Num cents={grossCents} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-[var(--sim-ink-3)]">
                        <Num cents={o.feeCents} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold">
                        <Num
                          cents={netCents}
                          size="xs"
                          tone={netCents >= 0n ? "positive" : "negative"}
                          signed
                        />
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--sim-ink-3)]">
                        {formatDate(new Date(o.placedAt * 1000))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Cash Ledger */}
        {activeTab === "transactions" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[var(--sim-bg-subtle)] border-b border-[var(--sim-border)] font-mono text-[10.5px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                <tr>
                  <th className="px-5 py-3">Sens</th>
                  <th className="px-4 py-3">Libellé de l&apos;écriture</th>
                  <th className="px-4 py-3 text-right">Flux Espèces (MAD)</th>
                  <th className="px-4 py-3 text-right">Solde Après Opération</th>
                  <th className="px-5 py-3 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {ledgerEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[var(--sim-bg-subtle)]">
                    <td className="px-5 py-3">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 font-mono text-[10.5px] font-bold",
                          entry.isCredit
                            ? "bg-[var(--sim-emerald-tint)] text-[var(--sim-emerald)]"
                            : "bg-[var(--sim-terracotta-tint)] text-[var(--sim-terracotta)]",
                        )}
                      >
                        {entry.isCredit ? "CRÉDIT" : "DÉBIT"}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--sim-ink)]">
                      {entry.description}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      <Num
                        cents={entry.amountCents}
                        size="xs"
                        tone={entry.isCredit ? "positive" : "negative"}
                        signed
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--sim-ink)]">
                      <Num cents={entry.balanceCents} size="xs" />
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-[11px] text-[var(--sim-ink-3)]">
                      {entry.timestampLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
