"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  CalendarPlus,
  History,
  LayoutDashboard,
  Menu,
  RotateCcw,
  Sparkles,
  Terminal,
  TrendingUp,
  X,
} from "lucide-react";
import { landingUrl } from "@fsjesc/config/app-urls";
import { Num } from "../primitives/num";
import { ThemeSwitcher } from "../layout/theme-switcher";
import { useSimulatorPortfolio } from "./simulator-store";

const NAV_ITEMS = [
  { path: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard, exact: false },
  { path: "/market", label: "Marché & Carnet", icon: TrendingUp, exact: false },
  { path: "/portfolio", label: "Portefeuille & Risque", icon: Briefcase, exact: false },
  { path: "/history", label: "Historique d'ordres", icon: History, exact: false },
  { path: "/", label: "Vue d'ensemble", icon: Terminal, exact: true },
] as const;

const QUICK_TICKERS = [
  { symbol: "ATW", name: "Attijariwafa Bank", market: "CSE" },
  { symbol: "IAM", name: "Maroc Telecom", market: "CSE" },
  { symbol: "BCP", name: "Banque Populaire", market: "CSE" },
  { symbol: "NVDA", name: "NVIDIA Corp.", market: "US" },
  { symbol: "BTC", name: "Bitcoin Spot", market: "CRYPTO" },
] as const;

export function SimulatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { telemetry, advanceDay, resetPortfolio } = useSimulatorPortfolio(3000);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resetMenuOpen, setResetMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleAdvanceDay = () => {
    const res = advanceDay(1);
    if (res.filledMessages.length > 0) {
      showToast(
        `Jour ${res.newDayNumber} / ${telemetry.totalDays} — ${res.filledMessages.join(" · ")}`,
      );
    } else {
      showToast(
        `Séance avancée au Jour ${res.newDayNumber} / ${telemetry.totalDays}. Valorisation MTM mise à jour.`,
      );
    }
  };

  const isPositiveTotal = telemetry.totalPnlCents >= 0n;

  return (
    <div className="sim-shell">
      {/* Top Application Header (.sim-header) */}
      <header className="sim-header">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] text-[var(--sim-ink)] cursor-pointer"
            aria-label="Menu de navigation"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 text-decoration-none focus-visible:outline-2 focus-visible:outline-ring rounded-lg"
          >
            <span
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg font-serif text-sm font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #12243b 0%, #1b3352 100%)",
                color: "#f0d28a",
                border: "1px solid rgba(212, 169, 79, 0.45)",
                boxShadow: "0 2px 6px rgba(15, 29, 46, 0.14)",
              }}
              aria-hidden="true"
            >
              F·M
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-[var(--sim-ink)] leading-tight">
                FSJESC <span className="text-[var(--sim-gold-ink)]">·</span> Simulateur
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--sim-ink-3)] hidden sm:inline">
                Salle des Marchés Académique
              </span>
            </div>
          </Link>

          {/* Market Session Clock + Interactive Day Stepper */}
          <div className="hidden md:flex items-center gap-2 ml-2">
            <div className="sim-clock" title="Séance continue multi-actifs (252 séances annuelles)">
              <span className="sim-clock__dot" aria-hidden="true" />
              <span>Séance continue</span>
              <span className="text-[var(--sim-ink-4)]">·</span>
              <strong className="text-[var(--sim-ink)] font-semibold">
                Jour {telemetry.dayNumber} / {telemetry.totalDays}
              </strong>
            </div>

            <button
              type="button"
              onClick={handleAdvanceDay}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] hover:bg-[var(--sim-bg-muted)] hover:border-[var(--sim-gold)] px-3 py-1.5 font-mono text-xs font-semibold text-[var(--sim-ink)] transition-colors cursor-pointer"
              title="Avancer d'une séance boursière (J+1) et évaluer les ordres limites en attente"
            >
              <CalendarPlus className="h-3.5 w-3.5 text-[var(--sim-gold-ink)]" />
              <span>J+1</span>
            </button>
          </div>
        </div>

        {/* Right HUD: Live Portfolio Valuation, Reset Menu, Theme Switcher */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Quick Portfolio Equity & Cash Pill */}
          <div className="hidden xl:flex items-center gap-4 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-3.5 py-1.5 text-xs">
            <div>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                Valeur Nette
              </span>
              <div className="flex items-center gap-1.5 font-mono font-semibold text-[var(--sim-ink)]">
                <Num cents={telemetry.totalEquityCents} size="xs" />
                <span
                  className={
                    isPositiveTotal ? "sim-delta sim-delta--up" : "sim-delta sim-delta--down"
                  }
                >
                  {isPositiveTotal ? "+" : ""}
                  {(Number(telemetry.totalReturnBps) / 100).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="h-6 w-px bg-[var(--sim-border)]" aria-hidden="true" />

            <div>
              <span className="block font-mono text-[10px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                Liquidités Disp.
              </span>
              <span className="font-mono font-semibold text-[var(--sim-ink)]">
                <Num cents={telemetry.availableCashCents} size="xs" />
              </span>
            </div>

            {telemetry.pendingOrders.length > 0 && (
              <>
                <div className="h-6 w-px bg-[var(--sim-border)]" aria-hidden="true" />
                <Link
                  href="/history"
                  className="font-mono text-[11px] font-semibold text-[var(--sim-amber)] hover:underline"
                >
                  {telemetry.pendingOrders.length} ordre(s) actif(s)
                </Link>
              </>
            )}
          </div>

          {/* Portfolio Reset Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setResetMenuOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] hover:bg-[var(--sim-bg-muted)] px-2.5 py-1.5 text-xs font-medium text-[var(--sim-ink-2)] transition-colors cursor-pointer"
              title="Gérer ou réinitialiser le portefeuille"
            >
              <RotateCcw className="h-3.5 w-3.5 text-[var(--sim-ink-3)]" />
              <span className="hidden sm:inline">Portefeuille</span>
            </button>

            {resetMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] p-2 shadow-lg z-50">
                <p className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--sim-ink-3)]">
                  Dotation & Scénarios FMC
                </p>
                <button
                  type="button"
                  onClick={() => {
                    resetPortfolio("demo");
                    setResetMenuOpen(false);
                    showToast(
                      "Portefeuille de démonstration FMC chargé (positions ATW, IAM, LHM, TQM + ordre limite BCP).",
                    );
                  }}
                  className="w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[var(--sim-bg-subtle)] transition-colors cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[var(--sim-gold-ink)] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--sim-ink)]">
                      Charger le portefeuille Démo FMC
                    </div>
                    <div className="text-[11px] text-[var(--sim-ink-3)]">
                      4 positions actives Bourse de Casablanca + 1 ordre limite en carnet
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetPortfolio("blank");
                    setResetMenuOpen(false);
                    showToast(
                      "Portefeuille réinitialisé à 100 000,00 MAD en liquidités (aucune position).",
                    );
                  }}
                  className="mt-1 w-full flex items-start gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-[var(--sim-bg-subtle)] transition-colors cursor-pointer"
                >
                  <RotateCcw className="h-4 w-4 text-[var(--sim-terracotta)] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-[var(--sim-ink)]">
                      Réinitialiser à 100 000 MAD (Vierge)
                    </div>
                    <div className="text-[11px] text-[var(--sim-ink-3)]">
                      Clôture toutes les positions et repart de 100 000,00 MAD liquide
                    </div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <ThemeSwitcher />

          {/* User Badge */}
          <div className="hidden sm:flex items-center gap-2 pl-1">
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              style={{
                backgroundColor: "var(--sim-navy)",
                color: "#f0d28a",
                border: "1px solid rgba(212, 169, 79, 0.4)",
              }}
              title="Session Analyste FSJESC-FMC"
            >
              FM
            </span>
          </div>
        </div>
      </header>

      {/* Toast Notification Bar for fills / day advance */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="bg-[var(--sim-navy)] text-[#f0d28a] border-b border-[rgba(212,169,79,0.3)] px-6 py-2 text-xs font-mono flex items-center justify-between gap-4"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-[var(--sim-navy)] text-white px-4 py-4 border-b border-white/10 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-mono text-xs text-[#f0d28a]">
              Séance · Jour {telemetry.dayNumber} / {telemetry.totalDays}
            </span>
            <button
              type="button"
              onClick={handleAdvanceDay}
              className="rounded-full bg-white/10 px-3 py-1 font-mono text-xs text-[#f0d28a]"
            >
              Avancer J+1
            </button>
          </div>
          <nav aria-label="Navigation mobile du simulateur" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = item.exact
                ? pathname === item.path
                : pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className="sim-rail__item"
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Body Grid: Left Navy Rail (.sim-rail) + Main Workspace (.sim-main) */}
      <div className="sim-body">
        <aside className="sim-rail" aria-label="Navigation principale du simulateur">
          <div className="space-y-6">
            <div>
              <div className="sim-rail__label">Négociation</div>
              <nav aria-label="Sections du simulateur" className="space-y-1 mt-1">
                {NAV_ITEMS.map((item) => {
                  const active = item.exact
                    ? pathname === item.path
                    : pathname.startsWith(item.path);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      aria-current={active ? "page" : undefined}
                      className="sim-rail__item"
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            {/* Quick Instrument Desk Shortcuts */}
            <div>
              <div className="sim-rail__label">Accès Direct Carnet L2</div>
              <div className="space-y-1 mt-1">
                {QUICK_TICKERS.map((item) => {
                  const targetPath = `/market/${item.symbol.toLowerCase()}`;
                  const active = pathname.toLowerCase() === targetPath;
                  return (
                    <Link
                      key={item.symbol}
                      href={targetPath}
                      aria-current={active ? "page" : undefined}
                      className="sim-rail__item justify-between py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-xs font-bold text-[#f0d28a]">
                          {item.symbol}
                        </span>
                        <span className="truncate text-xs text-white/70">{item.name}</span>
                      </div>
                      <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/60">
                        {item.market}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Rail Footer */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-xs">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#f0d28a]">
                <span>Moteur Continu</span>
                <span>T+2 · 5 bps</span>
              </div>
              <p className="mt-1.5 text-[11px] text-white/70 leading-relaxed">
                110 instruments sur 8 marchés (CSE, US, ETF, Futures, Crypto, FX, Taux, Options).
              </p>
            </div>

            <Link
              href={landingUrl()}
              className="sim-rail__item text-white/75 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span>Retour au site du Club</span>
            </Link>
          </div>
        </aside>

        <div className="sim-main">{children}</div>
      </div>
    </div>
  );
}
