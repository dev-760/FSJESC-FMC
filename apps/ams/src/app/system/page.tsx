"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAmsSession } from "@/components/auth-gate";
import { api } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

interface AuditEntry {
  time: string;
  actor: string;
  action: string;
  target: string;
  ip: string;
}

const INITIAL_AUDIT_LOG: AuditEntry[] = [
  {
    time: "10:42:11",
    actor: "system",
    action: "Tick marché",
    target: "Jour 42 / 252 · 110 instruments",
    ip: "127.0.0.1",
  },
  {
    time: "10:38:02",
    actor: "admin@fmc-fsjes.ma",
    action: "Passerelle Wassly API",
    target: "8 routeurs synchronisés (https://api.wassly.tech)",
    ip: "192.168.1.14",
  },
  {
    time: "10:30:19",
    actor: "admin@fmc-fsjes.ma",
    action: "Rôle modifié",
    target: "O. Berrada → suspendu",
    ip: "192.168.1.42",
  },
  {
    time: "10:05:44",
    actor: "editor@fmc-fsjes.ma",
    action: "Article publié",
    target: "Lecture du carnet d'ordres : liquidité, spread et profondeur",
    ip: "192.168.1.22",
  },
  {
    time: "09:30:00",
    actor: "system",
    action: "Ouverture Bourse de Casablanca",
    target: "Compartiment Principal F (38 actions CSE)",
    ip: "127.0.0.1",
  },
];

export default function SystemPage() {
  const { resource, retry } = useResource((signal) => api.system(signal), []);
  const { locale, toast } = useAmsSession();
  const isEn = locale === "en";

  const [day, setDay] = useState(42);
  const maxDays = 252;
  const [seed, setSeed] = useState("FMC-2025-A17");
  const [lastTick, setLastTick] = useState("10:42:00");
  const [orders24h, setOrders24h] = useState(1284);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>(INITIAL_AUDIT_LOG);
  const [runningAction, setRunningAction] = useState<string | null>(null);

  const sys = resource.status === "ready" ? resource.data : null;
  const progress = (day / maxDays) * 100;

  const pushAudit = (action: string, target: string) => {
    const nowTime = new Date().toTimeString().slice(0, 8);
    setAuditLog((prev) => [
      {
        time: nowTime,
        actor: "admin@fmc-fsjes.ma",
        action,
        target,
        ip: "192.168.1.14",
      },
      ...prev,
    ]);
  };

  const handleAdvanceDay = async () => {
    const nextDay = Math.min(maxDays, day + 1);
    const nowTime = new Date().toTimeString().slice(0, 8);
    setDay(nextDay);
    setLastTick(nowTime);
    setOrders24h((n) => n + 18);
    pushAudit("Tick marché manuel", `Calendrier avancé → Jour ${nextDay} / ${maxDays}`);
    toast(
      isEn ? `Market advanced to Day ${nextDay}` : `Marché avancé au Jour ${nextDay}`,
      "pos",
    );
    try {
      await api.runSystemAction("RECOMPUTE_MARKS");
      retry();
    } catch {
      // Ignore
    }
  };

  const handleResetSeed = () => {
    const nextSeed = `FMC-2025-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
    setSeed(nextSeed);
    setLastTick(new Date().toTimeString().slice(0, 8));
    pushAudit("Régénération Seed", `Nouvelle seed stochastique : ${nextSeed}`);
    toast(
      isEn ? `New simulation seed: ${nextSeed}` : `Nouvelle seed active : ${nextSeed}`,
      "info",
    );
  };

  const handleMaintenanceAction = async (
    action:
      | "RECOMPUTE_MARKS"
      | "FLUSH_API_CACHE"
      | "RESET_DEMO_PORTFOLIOS"
      | "HALT_TRADING"
      | "RESUME_TRADING",
  ) => {
    setRunningAction(action);
    try {
      const res = await api.runSystemAction(action);
      pushAudit(`Action système : ${action}`, res.message);
      toast(res.message, "pos");
      retry();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Erreur opérationnelle", "neg");
    } finally {
      setRunningAction(null);
    }
  };

  const handleExportLogs = () => {
    const csv = [
      "Horodatage,Acteur,Action,Cible,IP",
      ...auditLog.map(
        (row) => `"${row.time}","${row.actor}","${row.action}","${row.target}","${row.ip}"`,
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fmc-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(isEn ? "Audit logs exported (CSV)" : "Journal d'audit exporté (CSV)", "pos");
  };

  return (
    <AppShell title={isEn ? "Engine & health" : "Moteur & santé"}>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">{isEn ? "Engine & health" : "Moteur & santé"}</h1>
          <p className="page-head__sub">
            {isEn
              ? "Simulation engine, market clock, Wassly API gateway & infrastructure"
              : "Simulation, horloge de marché, passerelle Wassly API & infrastructure"}
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={retry}>
            {isEn ? "Run probe" : "Sonder les services"}
          </button>
        </div>
      </div>

      {/* Engine Mission Control Deck */}
      <div className="engine-control-deck">
        <div className="deck-primary">
          <div className="deck-indicator">
            <span className="engine-pulse" />
            <span>
              {sys?.marketSessionMode === "HALTED"
                ? isEn
                  ? "Engine halted · Circuit Breaker Active"
                  : "Moteur suspendu · Coupe-circuit actif"
                : isEn
                  ? "Engine active · 252-Day Market Calendar"
                  : "Moteur actif · Calendrier 252 Jours"}
            </span>
          </div>
          <div className="deck-day-display">
            <span className="mono-huge">J{day}</span>
            <span className="mono-total">/ {maxDays}</span>
          </div>
          <p className="deck-desc">
            {isEn
              ? "Working limit and stop orders in the order book are automatically re-evaluated on every daily increment across all 110 instruments."
              : "Les ordres limites et stops du carnet sont automatiquement réévalués à chaque incrément quotidien sur les 110 instruments."}
          </p>
          <div className="deck-progress-track">
            <div className="deck-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="deck-actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => void handleAdvanceDay()}
          >
            <svg
              viewBox="0 0 24 24"
              width="13"
              height="13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            {isEn ? "Advance 1 day" : "Avancer d'un jour"}
          </button>
          <button type="button" className="btn btn--secondary" onClick={handleResetSeed}>
            {isEn ? "Regenerate Seed" : "Régénérer Seed"}
          </button>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card__header">
            <div className="card__title">
              {isEn ? "Simulation engine" : "Moteur de simulation"}
            </div>
          </div>
          <div className="card__body" style={{ padding: "6px 18px" }}>
            <div className="seed-row">
              <div className="seed-row__label">{isEn ? "Active seed" : "Seed active"}</div>
              <div className="seed-row__value">{seed}</div>
            </div>
            <div className="seed-row">
              <div className="seed-row__label">{isEn ? "Last tick" : "Dernier tick"}</div>
              <div className="seed-row__value">{lastTick}</div>
            </div>
            <div className="seed-row">
              <div className="seed-row__label">{isEn ? "Instruments" : "Instruments"}</div>
              <div className="seed-row__value">
                {sys?.tradableInstruments ?? 110} / {sys?.totalInstruments ?? 110}
              </div>
            </div>
            <div className="seed-row">
              <div className="seed-row__label">
                {isEn ? "Orders processed 24h" : "Ordres traités 24h"}
              </div>
              <div className="seed-row__value">{orders24h.toLocaleString("fr-FR")}</div>
            </div>
            <div className="seed-row">
              <div className="seed-row__label">{isEn ? "Uptime" : "Disponibilité"}</div>
              <div className="seed-row__value pos">99,97 %</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__header">
            <div className="card__title">Infrastructure</div>
          </div>
          <div className="card__body" style={{ padding: "6px 18px" }}>
            <div className="health-row">
              <div>
                <div className="health-row__label">API REST (Wassly Gateway)</div>
                <div className="health-row__sub">
                  {sys?.marketApiUrl ?? "https://api.wassly.tech"} · {sys?.enabledRouters ?? 8}/
                  {sys?.totalRouters ?? 8} routeurs
                </div>
              </div>
              <div className="health-row__value">
                <span className="status-dot status-dot--ok" /> 42 ms
              </div>
            </div>
            <div className="health-row">
              <div>
                <div className="health-row__label">
                  {isEn ? "Database (Postgres)" : "Base de données (Postgres)"}
                </div>
                <div className="health-row__sub">
                  PostgreSQL 16 · {sys?.lastMigration ?? "0006_multi_asset_wassly_gateway"}
                </div>
              </div>
              <div className="health-row__value">
                <span className="status-dot status-dot--ok" /> 6 ms
              </div>
            </div>
            <div className="health-row">
              <div>
                <div className="health-row__label">
                  {isEn ? "Job queue (Redis)" : "File d'attente (Redis)"}
                </div>
                <div className="health-row__sub">Worker pool · {sys?.version ?? "v2.4.0"}</div>
              </div>
              <div className="health-row__value">
                <span className="status-dot status-dot--ok" /> 18 ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance & Circuit Breaker Controls */}
      <div className="card">
        <div className="card__header">
          <div className="card__title">
            {isEn
              ? "Maintenance, Cache & Circuit Breaker Controls"
              : "Opérations de maintenance, cache & coupe-circuit"}
          </div>
        </div>
        <div className="card__body">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={runningAction !== null}
              onClick={() => void handleMaintenanceAction("RECOMPUTE_MARKS")}
            >
              {isEn ? "Recompute portfolio marks" : "Recalculer la valorisation mark-to-market"}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={runningAction !== null}
              onClick={() => void handleMaintenanceAction("FLUSH_API_CACHE")}
            >
              {isEn ? "Flush Wassly API caches" : "Purger le cache Wassly API"}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={runningAction !== null}
              onClick={() => void handleMaintenanceAction("RESET_DEMO_PORTFOLIOS")}
            >
              {isEn
                ? "Reset all student portfolios (100k MAD)"
                : "Réinitialiser les portefeuilles (100 000 MAD)"}
            </button>
            {sys?.marketSessionMode === "HALTED" ? (
              <button
                type="button"
                className="btn btn--primary"
                disabled={runningAction !== null}
                onClick={() => void handleMaintenanceAction("RESUME_TRADING")}
              >
                {isEn ? "Resume continuous trading" : "Reprendre la cotation continue"}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--danger"
                disabled={runningAction !== null}
                onClick={() => void handleMaintenanceAction("HALT_TRADING")}
              >
                {isEn ? "Engage trading halt (Circuit breaker)" : "Suspendre la cotation (Coupe-circuit)"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="card">
        <div className="card__header">
          <div className="card__title">{isEn ? "Audit log" : "Journal d'audit"}</div>
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={handleExportLogs}
          >
            {isEn ? "Export logs" : "Exporter les logs"}
          </button>
        </div>
        <div className="card__body card__body--tight">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{isEn ? "Timestamp" : "Horodatage"}</th>
                  <th>{isEn ? "Actor" : "Acteur"}</th>
                  <th>Action</th>
                  <th>{isEn ? "Target" : "Cible"}</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((entry, idx) => (
                  <tr key={`${entry.time}-${idx}`}>
                    <td className="num dim mono">{entry.time}</td>
                    <td className="audit-actor">{entry.actor}</td>
                    <td>{entry.action}</td>
                    <td className="dim">{entry.target}</td>
                    <td className="audit-ip">{entry.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}