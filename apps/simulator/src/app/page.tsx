import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Briefcase,
  History,
  LayoutDashboard,
  Scale,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { TerminalPreview } from "@fsjesc/ui/financial/terminal-preview";
import { DISC_1 } from "@fsjesc/config/site";

export const metadata: Metadata = {
  title: "Vue d'ensemble | FSJESC · Simulateur",
  description:
    "Salle des marchés académique FSJESC-FMC : négociation multi-actifs en dirhams marocains (MAD) sur 8 marchés et 110 instruments.",
};

const WORKSTATIONS = [
  {
    icon: LayoutDashboard,
    title: "Tableau de bord",
    badge: "Poste Principal",
    detail:
      "Valorisation mark-to-market en temps réel, courbe d'équité sur 30 séances, allocation sectorielle et suivi des positions.",
    href: "/dashboard",
  },
  {
    icon: TrendingUp,
    title: "Marché & Carnet L2",
    badge: "110 Instruments · 8 Marchés",
    detail:
      "Terminal 3-panneaux avec carnet d'ordres L2, graphiques chandeliers, synthèse Bourse de Casablanca, courbe des taux, FX et options.",
    href: "/market",
  },
  {
    icon: Briefcase,
    title: "Portefeuille & Risque",
    badge: "Sharpe · Volatilité · HHI",
    detail:
      "Indicateurs de risque institutionnels, exposition par secteur et marché, allègement partiel (-50%) ou clôture en 1 clic.",
    href: "/portfolio",
  },
  {
    icon: History,
    title: "Historique & Grand Livre",
    badge: "Audit CSV · T+2",
    detail:
      "Journal immuable des ordres soumis, ordres limites en attente dans le carnet, exécutions détaillées et grand livre espèces.",
    href: "/history",
  },
] as const;

const STANDARDS = [
  {
    icon: ShieldCheck,
    title: "Modèle de prix déterministe (GBM)",
    detail:
      "Les cours évoluent selon un mouvement brownien géométrique continu ancré sur les données de référence, garantissant une reproductibilité parfaite entre analystes.",
  },
  {
    icon: Zap,
    title: "Arithmétique exacte au centime (BigInt)",
    detail:
      "Soldes espèces, prix d'exécution et commissions de courtage (5 bps) sont calculés en centimes entiers sans aucune dérive de virgule flottante.",
  },
  {
    icon: Scale,
    title: "Cadre strictement académique",
    detail: `${DISC_1} Aucune transaction réelle n'est routée en bourse ; le simulateur est conçu pour la formation aux marchés financiers.`,
  },
];

export default function SimulatorPage() {
  return (
    <main id="main-content" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--sim-gold-ink)]">
            <span>FSJESC Financial Markets Club</span>
            <span>·</span>
            <span>Architecture Multi-Marchés</span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--sim-ink)]">
            Salle des Marchés &amp; Simulateur d&apos;Exécution
          </h1>
          <p className="mt-1 text-sm text-[var(--sim-ink-3)] max-w-2xl">
            Exécutez des ordres au marché, à cours limité et Stop sur 110 instruments cotés (Bourse de Casablanca, Actions US, ETF, Futures, Crypto, Forex, Obligations et Options).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/market"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-4 py-2 text-xs font-semibold text-[var(--sim-ink)] transition-colors"
          >
            <span>Ouvrir le Carnet L2</span>
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--sim-navy)] hover:bg-[var(--sim-navy-2)] px-4 py-2 text-xs font-semibold text-[#f0d28a] shadow-sm transition-colors"
          >
            <span>Accéder au Tableau de bord</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* 4-Column KPI Stat Strip */}
      <div className="sim-stats">
        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Dotation Initiale</span>
          </div>
          <div className="sim-stat__value">100 000 MAD</div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--up">Capital virtuel</span>
            <span>Réinitialisable en 1 clic</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Univers Coté</span>
          </div>
          <div className="sim-stat__value">110 Actifs</div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--flat">8 Marchés</span>
            <span>Dont 38 valeurs CSE</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Moteur d&apos;Exécution</span>
          </div>
          <div className="sim-stat__value">Carnet L2</div>
          <div className="sim-stat__sub">
            <span className="sim-delta sim-delta--up">5 niveaux</span>
            <span>Marché, Limite &amp; Stop</span>
          </div>
        </div>

        <div className="sim-stat">
          <div className="sim-stat__label">
            <span>Frais &amp; Règlement</span>
          </div>
          <div className="sim-stat__value">5 bps · T+2</div>
          <div className="sim-stat__sub">
            <span>Courtage capitalisé au PRU</span>
          </div>
        </div>
      </div>

      {/* 4 Workstation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {WORKSTATIONS.map((ws) => {
          const Icon = ws.icon;
          return (
            <Link
              key={ws.href}
              href={ws.href}
              className="sim-card p-5 hover:border-[var(--sim-gold)] transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--sim-navy)] text-[#f0d28a]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-[var(--sim-bg-muted)] px-2.5 py-0.5 font-mono text-[10.5px] font-semibold text-[var(--sim-ink-2)]">
                    {ws.badge}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-[var(--sim-ink)] group-hover:text-[var(--sim-indigo)] flex items-center gap-1.5">
                  <span>{ws.title}</span>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="mt-1.5 text-xs text-[var(--sim-ink-3)] leading-relaxed">
                  {ws.detail}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--sim-border)] flex items-center justify-between font-mono text-[11px] font-semibold text-[var(--sim-gold-ink)]">
                <span>Ouvrir le poste de travail</span>
                <span>&rarr;</span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Live Terminal Preview Card */}
      <section className="sim-card overflow-hidden">
        <div className="sim-card__head">
          <div>
            <h2 className="sim-card__title">Aperçu Temps Réel du Flux de Cotation</h2>
            <p className="sim-card__sub">
              Sélectionnez un instrument pour inspecter sa série OHLCV et sa fourchette Bid/Ask
            </p>
          </div>
          <Link
            href="/market"
            className="font-mono text-xs font-semibold text-[var(--sim-indigo)] hover:underline"
          >
            Ouvrir le terminal 3-panneaux &rarr;
          </Link>
        </div>
        <div className="p-2 sm:p-4">
          <Suspense
            fallback={<div className="h-[24rem] animate-pulse rounded-lg border border-rule" />}
          >
            <TerminalPreview />
          </Suspense>
        </div>
      </section>

      {/* Architectural Standards */}
      <section className="sim-card p-5">
        <h2 className="sim-card__title mb-4">Architecture &amp; Garanties du Modèle</h2>
        <div className="grid gap-6 sm:grid-cols-3">
          {STANDARDS.map((item) => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-[var(--sim-bg-subtle)] border border-[var(--sim-border)] p-2 text-[var(--sim-gold-ink)] shrink-0">
                <item.icon aria-hidden className="size-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-[var(--sim-ink)]">{item.title}</h3>
                <p className="mt-1 text-xs text-[var(--sim-ink-3)] leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}