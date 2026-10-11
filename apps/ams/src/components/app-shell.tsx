"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  BarChart3,
  Calendar,
  FileText,
  Globe,
  LayoutDashboard,
  Sliders,
  ShoppingCart,
  Trophy,
  Users,
} from "lucide-react";
import { AuthGate, FmcLogoMark, useAmsSession } from "@/components/auth-gate";

export interface AppNavItem {
  name: string;
  href: string;
  icon: typeof Users;
}

export const APP_NAV: readonly AppNavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "APIs & Markets", href: "/apis", icon: Globe },
  { name: "Users & Portfolios", href: "/users", icon: Users },
  { name: "Articles & Content", href: "/articles", icon: FileText },
  { name: "Events & Sessions", href: "/events", icon: Calendar },
  { name: "Competitions", href: "/competitions", icon: Trophy },
  { name: "Orders & Risk Desk", href: "/orders", icon: ShoppingCart },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Platform Settings", href: "/settings", icon: Sliders },
  { name: "System Health", href: "/system", icon: Activity },
];

const SHELL_COPY = {
  fr: {
    ams: "Admin Management System",
    production: "Production",
    superadmin: "● Super administrateur",
    menuSettings: "Paramètres",
    menuSite: "Site du club",
    menuSignout: "Se déconnecter",
    railOverview: "Vue d'ensemble",
    railDashboard: "Tableau de bord",
    railAnalytics: "Analytique",
    railContent: "Contenu",
    railArticles: "Articles",
    railEvents: "Événements",
    railCompetitions: "Compétitions",
    railOperations: "Opérations",
    railOrders: "Ordres",
    railUsers: "Utilisateurs",
    railApis: "APIs & Marchés",
    railSystem: "Système",
    railSystemHealth: "Moteur & santé",
    railSettings: "Paramètres",
    railBackToSite: "Retour au site",
  },
  en: {
    ams: "Admin Management System",
    production: "Production",
    superadmin: "● Super admin",
    menuSettings: "Settings",
    menuSite: "Club site",
    menuSignout: "Sign out",
    railOverview: "Overview",
    railDashboard: "Dashboard",
    railAnalytics: "Analytics",
    railContent: "Content",
    railArticles: "Articles",
    railEvents: "Events",
    railCompetitions: "Competitions",
    railOperations: "Operations",
    railOrders: "Orders",
    railUsers: "Users",
    railApis: "APIs & Markets",
    railSystem: "System",
    railSystemHealth: "Engine & health",
    railSettings: "Settings",
    railBackToSite: "Back to site",
  },
} as const;

function isActivePath(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function ShellInner({
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { session, signOut, locale, setLocale, theme, toggleTheme, toasts } = useAmsSession();
  const [railOpen, setRailOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (railOpen) setRailOpen(false);
    if (menuOpen) setMenuOpen(false);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRailOpen(false);
        setMenuOpen(false);
      }
    };
    const onClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, []);

  const copy = SHELL_COPY[locale];
  const landingUrl = process.env.NEXT_PUBLIC_APP_URL ?? "/";

  return (
    <div id="app" className="app">
      <header className="app-header">
        <button
          type="button"
          className="icon-btn"
          id="rail-toggle"
          aria-label="Ouvrir la navigation"
          aria-expanded={railOpen}
          onClick={() => setRailOpen((prev) => !prev)}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        <Link href="/" className="brand" aria-label="FSJESC FMC AMS">
          <FmcLogoMark size="md" />
          <span className="brand__text">
            <span className="brand__name">FSJESC FMC</span>
            <span className="brand__app">{copy.ams}</span>
          </span>
        </Link>

        <span className="env-badge">{copy.production}</span>

        <div className="header-spacer" />

        {action ? <div style={{ display: "flex", alignItems: "center", gap: 8 }}>{action}</div> : null}

        <div className="toggle-group" role="group" aria-label="Langue">
          <button
            type="button"
            data-locale="fr"
            aria-pressed={locale === "fr"}
            onClick={() => setLocale("fr")}
          >
            FR
          </button>
          <button
            type="button"
            data-locale="en"
            aria-pressed={locale === "en"}
            onClick={() => setLocale("en")}
          >
            EN
          </button>
        </div>

        <button
          type="button"
          className="icon-btn"
          id="theme-toggle"
          aria-label="Changer de thème"
          onClick={toggleTheme}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              id="theme-icon-path"
              d={
                theme === "dark"
                  ? "M12 3v2M12 19v2M5 12H3M21 12h-2M6 6l-1.5-1.5M19.5 19.5L18 18M6 18l-1.5 1.5M19.5 4.5L18 6M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"
                  : "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              }
            />
          </svg>
        </button>

        <div className="avatar-menu" ref={menuRef}>
          <button
            type="button"
            className="avatar"
            id="avatar-btn"
            aria-label="Menu du compte"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span id="avatar-initials">{session?.initials ?? "AB"}</span>
          </button>
          <div className="menu" id="avatar-menu" data-open={menuOpen ? "true" : "false"} role="menu">
            <div className="menu__header">
              <div className="menu__name" id="account-name">
                {session?.name ?? "Admin Bureau"}
              </div>
              <div className="menu__email" id="account-email">
                {session?.email ?? "admin@fmc-fsjes.ma"}
              </div>
              <div className="menu__role">{copy.superadmin}</div>
            </div>
            <Link
              className="menu__item"
              href="/settings"
              role="menuitem"
              onClick={() => setMenuOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              <span>{copy.menuSettings}</span>
            </Link>
            <a className="menu__item" href={landingUrl} role="menuitem">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{copy.menuSite}</span>
            </a>
            <div className="menu__sep" />
            <button
              type="button"
              className="menu__item menu__item--danger"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                signOut();
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>{copy.menuSignout}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="app-body">
        <div
          className="rail-overlay"
          id="rail-overlay"
          data-open={railOpen ? "true" : "false"}
          onClick={() => setRailOpen(false)}
        />

        <nav
          className="rail"
          id="rail"
          aria-label="Navigation AMS"
          data-open={railOpen ? "true" : "false"}
        >
          <div className="rail__group">
            <div className="rail__label">{copy.railOverview}</div>
            <Link
              className="rail__link"
              href="/"
              aria-current={isActivePath("/", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="3" width="7" height="9" rx="1.5" />
                <rect x="14" y="3" width="7" height="5" rx="1.5" />
                <rect x="14" y="12" width="7" height="9" rx="1.5" />
                <rect x="3" y="16" width="7" height="5" rx="1.5" />
              </svg>
              <span>{copy.railDashboard}</span>
            </Link>
            <Link
              className="rail__link"
              href="/analytics"
              aria-current={isActivePath("/analytics", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
              </svg>
              <span>{copy.railAnalytics}</span>
            </Link>
          </div>

          <div className="rail__group">
            <div className="rail__label">{copy.railContent}</div>
            <Link
              className="rail__link"
              href="/articles"
              aria-current={isActivePath("/articles", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2V5z" />
                <path d="M8 7h6M8 11h6M8 15h4" />
              </svg>
              <span>{copy.railArticles}</span>
              <span className="rail__badge">6</span>
            </Link>
            <Link
              className="rail__link"
              href="/events"
              aria-current={isActivePath("/events", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <rect x="3" y="5" width="18" height="16" rx="2" />
                <path d="M16 3v4M8 3v4M3 11h18" />
              </svg>
              <span>{copy.railEvents}</span>
              <span className="rail__badge">4</span>
            </Link>
            <Link
              className="rail__link"
              href="/competitions"
              aria-current={isActivePath("/competitions", pathname) ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinejoin="round"
              >
                <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" />
                <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
              <span>{copy.railCompetitions}</span>
              <span className="rail__badge">3</span>
            </Link>
          </div>

          <div className="rail__group">
            <div className="rail__label">{copy.railOperations}</div>
            <Link
              className="rail__link"
              href="/orders"
              aria-current={isActivePath("/orders", pathname) ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M4 4h16v4H4zM4 12h16M4 20h10" />
              </svg>
              <span>{copy.railOrders}</span>
            </Link>
            <Link
              className="rail__link"
              href="/users"
              aria-current={isActivePath("/users", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="9" cy="8" r="3.5" />
                <path d="M3 21c0-3.5 3-6 6-6s6 2.5 6 6M16 3.5A3.5 3.5 0 0 1 16 11M19 21c0-2-.5-4-2-5" />
              </svg>
              <span>{copy.railUsers}</span>
              <span className="rail__badge">426</span>
            </Link>
            <Link
              className="rail__link"
              href="/apis"
              aria-current={isActivePath("/apis", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="9" />
                <path d="M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
              </svg>
              <span>{copy.railApis}</span>
              <span className="rail__badge">110</span>
            </Link>
          </div>

          <div className="rail__group">
            <div className="rail__label">{copy.railSystem}</div>
            <Link
              className="rail__link"
              href="/system"
              aria-current={isActivePath("/system", pathname) ? "page" : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
                <circle cx="12" cy="12" r="4" />
              </svg>
              <span>{copy.railSystemHealth}</span>
              <span className="rail__badge rail__badge--warn">●</span>
            </Link>
            <Link
              className="rail__link"
              href="/settings"
              aria-current={isActivePath("/settings", pathname) ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
              </svg>
              <span>{copy.railSettings}</span>
            </Link>
          </div>

          <div className="rail__footer">
            <a className="rail__link" href={landingUrl}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>{copy.railBackToSite}</span>
            </a>
          </div>
        </nav>

        <main className="route-view" id="route-view">
          <div className="page">{children}</div>
        </main>
      </div>

      <div className="toasts" id="toasts" role="region" aria-live="polite" aria-label="Notifications">
        {toasts.map((item) => (
          <div key={item.id} className={`toast toast--${item.tone}`}>
            {item.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export function AppShell({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AuthGate>
      <ShellInner title={title} action={action}>
        {children}
      </ShellInner>
    </AuthGate>
  );
}