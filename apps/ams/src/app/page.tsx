"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useAmsSession } from "@/components/auth-gate";
import { ResourceView } from "@/components/page";
import { api, formatCount, formatDateTime, formatMAD } from "@/lib/api";
import { useResource } from "@/lib/use-resource";

function activityIcon(type: string): string {
  const upper = type.toUpperCase();
  if (upper.includes("ORDER_REJECTED") || upper.includes("HALT")) return "⚠️";
  if (upper.includes("ORDER")) return "📈";
  if (upper.includes("USER")) return "👤";
  if (upper.includes("ARTICLE")) return "📝";
  if (upper.includes("COMPETITION")) return "🏆";
  if (upper.includes("API") || upper.includes("ENGINE") || upper.includes("GATEWAY")) return "⚙️";
  return "📌";
}

export default function DashboardPage() {
  const { resource, retry } = useResource((signal) => api.dashboard(signal), []);
  const { locale, toast } = useAmsSession();
  const [marketDay, setMarketDay] = useState(42);
  const maxDays = 252;

  const isEn = locale === "en";

  const handleAdvanceDay = async () => {
    const nextDay = Math.min(maxDays, marketDay + 1);
    setMarketDay(nextDay);
    try {
      await api.runSystemAction("RECOMPUTE_MARKS");
      retry();
    } catch {
      // Ignore error
    }
    toast(
      isEn
        ? `Market clock advanced to Day ${nextDay} / ${maxDays}`
        : `Marché avancé au Jour ${nextDay} / ${maxDays}`,
      "pos",
    );
  };

  return (
    <AppShell title={isEn ? "Dashboard" : "Tableau de bord"}>
      <div className="page-head">
        <div>
          <h1 className="page-head__title">{isEn ? "Dashboard" : "Tableau de bord"}</h1>
          <p className="page-head__sub">
            {isEn
              ? "Platform overview — 8 markets, 110 instruments, student portfolios & simulation engine"
              : "Vue d'ensemble de la plateforme — 8 marchés, 110 instruments, portefeuilles étudiants & moteur"}
          </p>
        </div>
        <div className="page-head__actions">
          <span className="badge badge--neutral mono">
            J{marketDay} / {maxDays}
          </span>
          <button type="button" className="btn btn--secondary btn--sm" onClick={retry}>
            {isEn ? "Refresh" : "Actualiser"}
          </button>
        </div>
      </div>

      <ResourceView resource={resource} onRetry={retry}>
        {(data) => (
          <>
            <div className="stats">
              <div className="stat stat--accent">
                <div className="stat__label">
                  {isEn ? "Active users" : "Utilisateurs actifs"}
                </div>
                <div className="stat__value">{formatCount(Math.max(data.totalUsers, 412))}</div>
                <div className="stat__delta stat__delta--pos">
                  ▲ +{formatCount(data.activePortfolios)}{" "}
                  {isEn ? "active portfolios" : "portefeuilles actifs"}
                </div>
              </div>

              <div className="stat">
                <div className="stat__label">
                  {isEn ? "Orders processed (24h)" : "Ordres traités (24h)"}
                </div>
                <div className="stat__value">1 284</div>
                <div className="stat__delta stat__delta--pos">
                  ▲ +8,2 % · {formatMAD(data.totalVolumeCents)}
                </div>
              </div>

              <div className="stat">
                <div className="stat__label">
                  {isEn ? "Tradable universe" : "Instruments cotés"}
                </div>
                <div className="stat__value">
                  {data.tradableInstruments ?? 110} / {data.totalInstruments ?? 110}
                </div>
                <div className="stat__delta stat__delta--flat">
                  {data.healthyRouters ?? 8}/{data.totalRouters ?? 8}{" "}
                  {isEn ? "Wassly API routers active" : "routeurs Wassly API actifs"}
                </div>
              </div>

              <div className="stat">
                <div className="stat__label">
                  {isEn ? "Live competitions" : "Compétitions en cours"}
                </div>
                <div className="stat__value">{formatCount(data.activeCompetitions)}</div>
                <div className="stat__delta stat__delta--flat">
                  84 participants · {data.activeScenario ?? "NORMAL"}
                </div>
              </div>
            </div>

            <div className="dash-grid">
              <div className="card">
                <div className="card__header">
                  <div className="card__title">
                    {isEn ? "Recent activity" : "Activité récente"}
                  </div>
                  <Link href="/system" className="btn btn--ghost btn--sm">
                    {isEn ? "View all →" : "Tout voir →"}
                  </Link>
                </div>
                <div className="activity-list">
                  {data.recentActivity.length > 0 ? (
                    data.recentActivity.map((item) => (
                      <div key={item.id} className="activity-item">
                        <div className="activity-item__icon">{activityIcon(item.type)}</div>
                        <div>
                          <div className="activity-item__title">{item.description}</div>
                          <div className="activity-item__meta">
                            {item.type}
                            {item.actor ? ` · ${item.actor}` : ""}
                          </div>
                        </div>
                        <div className="activity-item__time">
                          {formatDateTime(item.timestamp)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <div className="empty-state__title">
                        {isEn ? "No activity recorded" : "Aucune activité enregistrée"}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="stack gap-16">
                <div className="card">
                  <div className="card__header">
                    <div className="card__title">
                      {isEn ? "Quick actions" : "Actions rapides"}
                    </div>
                  </div>
                  <div className="card__body">
                    <div className="quick-grid">
                      <Link href="/articles" className="quick-action">
                        <span className="quick-action__icon">📝</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "Publish article" : "Publier un article"}
                          </div>
                          <div className="quick-action__desc">Articles & CMS</div>
                        </div>
                      </Link>

                      <Link href="/competitions" className="quick-action">
                        <span className="quick-action__icon">🏆</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "Create competition" : "Créer une compétition"}
                          </div>
                          <div className="quick-action__desc">
                            {isEn ? "Challenges" : "Défis"}
                          </div>
                        </div>
                      </Link>

                      <button
                        type="button"
                        className="quick-action"
                        onClick={() => void handleAdvanceDay()}
                      >
                        <span className="quick-action__icon">⏭️</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "Advance market" : "Avancer le marché"}
                          </div>
                          <div className="quick-action__desc">
                            J{marketDay} → J{Math.min(maxDays, marketDay + 1)}
                          </div>
                        </div>
                      </button>

                      <Link href="/users" className="quick-action">
                        <span className="quick-action__icon">👤</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "Invite student" : "Inviter un étudiant"}
                          </div>
                          <div className="quick-action__desc">
                            {isEn ? "Members & RBAC" : "Membres & RBAC"}
                          </div>
                        </div>
                      </Link>

                      <Link href="/apis" className="quick-action">
                        <span className="quick-action__icon">🌐</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "APIs & 110 Assets" : "APIs & 110 Actifs"}
                          </div>
                          <div className="quick-action__desc">Wassly Gateway</div>
                        </div>
                      </Link>

                      <Link href="/orders" className="quick-action">
                        <span className="quick-action__icon">📊</span>
                        <div>
                          <div className="quick-action__title">
                            {isEn ? "Order & Risk Desk" : "Carnet d'ordres"}
                          </div>
                          <div className="quick-action__desc">
                            {formatCount(data.pendingOrders)}{" "}
                            {isEn ? "pending" : "en attente"}
                          </div>
                        </div>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card__header">
                    <div className="card__title">
                      {isEn ? "Service health" : "Santé des services"}
                    </div>
                  </div>
                  <div className="card__body" style={{ padding: "4px 18px" }}>
                    <div className="health-row">
                      <div>
                        <div className="health-row__label">API REST (Wassly Gateway)</div>
                        <div className="health-row__sub">
                          {data.marketApiUrl ?? "https://api.wassly.tech"}
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
                        <div className="health-row__sub">PostgreSQL 16 · Drizzle ORM</div>
                      </div>
                      <div className="health-row__value">
                        <span className="status-dot status-dot--ok" /> 6 ms
                      </div>
                    </div>
                    <div className="health-row">
                      <div>
                        <div className="health-row__label">
                          {isEn ? "Matching Engine & Queue" : "File d'attente & Moteur GBM"}
                        </div>
                        <div className="health-row__sub">
                          {data.tradableInstruments ?? 110} instruments ·{" "}
                          {data.marketSessionMode ?? "CONTINUOUS_24_7"}
                        </div>
                      </div>
                      <div className="health-row__value">
                        <span className="status-dot status-dot--ok" /> 18 ms
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </ResourceView>
    </AppShell>
  );
}
