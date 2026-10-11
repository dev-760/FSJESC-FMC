"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

const SESSION_KEY = "fmc:ams:session:v1";
const PREFS_KEY = "fmc:ams:prefs:v1";

export interface AmsSession {
  name: string;
  email: string;
  initials: string;
}

export type AmsLocale = "fr" | "en";
export type AmsTheme = "light" | "dark";

export interface ToastItem {
  id: string;
  message: string;
  tone: "info" | "pos" | "neg";
}

interface AmsContextValue {
  session: AmsSession | null;
  signOut: () => void;
  locale: AmsLocale;
  setLocale: (locale: AmsLocale) => void;
  theme: AmsTheme;
  toggleTheme: () => void;
  toasts: ToastItem[];
  toast: (message: string, tone?: "info" | "pos" | "neg") => void;
}

const AmsContext = createContext<AmsContextValue>({
  session: {
    name: "Admin Bureau",
    email: "admin@fmc-fsjes.ma",
    initials: "AB",
  },
  signOut: () => {},
  locale: "fr",
  setLocale: () => {},
  theme: "light",
  toggleTheme: () => {},
  toasts: [],
  toast: () => {},
});

export function useAmsSession(): AmsContextValue {
  return useContext(AmsContext);
}

const AUTH_COPY = {
  fr: {
    ams: "Admin Management System",
    adminAccess: "Accès administrateur",
    heroTitle: "Administration & modération.",
    heroLede:
      "Le panneau d'administration du Financial Markets Club — gestion du contenu, des compétitions, des utilisateurs, des APIs (8 marchés · 110 instruments) et du moteur de simulation.",
    f1: "Gérez articles, événements et compétitions",
    f2: "Modérez les étudiants et attribuez les rôles",
    f3: "Contrôlez le moteur de simulation, les 8 APIs et l'horloge de marché",
    title: "Connexion admin",
    sub: "Accès réservé aux membres du bureau exécutif.",
    email: "Courriel",
    password: "Mot de passe",
    submit: "Se connecter",
    hint: "Démo : n'importe quel mot de passe de 6+ caractères fonctionne.",
    or: "ou",
    sso: "Continuer avec SSO FSJESC",
    back: "← Retour au site du club",
    invalidError: "Courriel valide et mot de passe de 6+ caractères requis.",
    signedInToast: "Connecté au panneau d'administration",
    ssoToast: "Connecté via SSO FSJESC",
  },
  en: {
    ams: "Admin Management System",
    adminAccess: "Admin access",
    heroTitle: "Administration & moderation.",
    heroLede:
      "The Financial Markets Club admin panel — content, competitions, users, market APIs (8 markets · 110 instruments), and simulation engine management.",
    f1: "Manage articles, events, and competitions",
    f2: "Moderate students and assign roles",
    f3: "Control the simulation engine, 8 market APIs, and market clock",
    title: "Admin sign in",
    sub: "Access limited to executive board members.",
    email: "Email",
    password: "Password",
    submit: "Sign in",
    hint: "Demo: any password of 6+ characters works.",
    or: "or",
    sso: "Continue with FSJESC SSO",
    back: "← Back to club site",
    invalidError: "Valid email and password of 6+ characters required.",
    signedInToast: "Signed in to admin console",
    ssoToast: "Signed in via FSJESC SSO",
  },
} as const;

export function FmcLogoMark({
  size = "lg",
  style,
}: {
  size?: "md" | "lg";
  style?: React.CSSProperties;
}) {
  return (
    <svg
      className={`logo-mark logo-mark--${size}`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={style}
    >
      <rect x="14" y="14" width="172" height="172" rx="42" stroke="currentColor" strokeWidth="7" />
      <g stroke="currentColor" strokeWidth="6.5" strokeLinecap="square">
        <path d="M48 46 H132 V64 H68 V148 H48 V46 Z" />
        <path d="M68 96 H112 V114 H68 Z" />
        <path d="M128 66 L152 148 H134 L122 104" />
        <path d="M134 104 V148 H152" />
      </g>
      <path
        d="M34 154 L76 114 L102 138 L166 66"
        stroke="#C89B3C"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AmsSession | null>(() => {
    if (typeof window === "undefined") {
      return {
        name: "Admin Bureau",
        email: "admin@fmc-fsjes.ma",
        initials: "AB",
      };
    }
    try {
      const savedSession = window.sessionStorage.getItem(SESSION_KEY);
      if (savedSession === "SIGNED_OUT") {
        return null;
      }
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession) as AmsSession;
        if (parsedSession?.email) {
          return parsedSession;
        }
      }
    } catch {
      // Ignore storage errors
    }
    return {
      name: "Admin Bureau",
      email: "admin@fmc-fsjes.ma",
      initials: "AB",
    };
  });

  const [locale, setLocaleState] = useState<AmsLocale>(() => {
    if (typeof window === "undefined") return "fr";
    try {
      const savedPrefs = window.localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs) as { locale?: AmsLocale };
        if (parsed.locale === "fr" || parsed.locale === "en") return parsed.locale;
      }
    } catch {
      // Ignore
    }
    return "fr";
  });

  const [theme, setThemeState] = useState<AmsTheme>(() => {
    if (typeof window === "undefined") return "light";
    try {
      const savedPrefs = window.localStorage.getItem(PREFS_KEY);
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs) as { theme?: AmsTheme };
        if (parsed.theme === "dark" || parsed.theme === "light") return parsed.theme;
      }
    } catch {
      // Ignore
    }
    return "light";
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Form state when signed out
  const [email, setEmail] = useState("admin@fmc-fsjes.ma");
  const [password, setPassword] = useState("demo1234");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toast = useCallback((message: string, tone: "info" | "pos" | "neg" = "info") => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  }, [theme, locale]);

  const setLocale = useCallback((nextLocale: AmsLocale) => {
    setLocaleState(nextLocale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = nextLocale;
    }
    try {
      const raw = window.localStorage.getItem(PREFS_KEY);
      const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, locale: nextLocale }));
    } catch {
      // Ignore
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => {
      const next = prevTheme === "dark" ? "light" : "dark";
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = next;
      }
      try {
        const raw = window.localStorage.getItem(PREFS_KEY);
        const prev = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        window.localStorage.setItem(PREFS_KEY, JSON.stringify({ ...prev, theme: next }));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "SIGNED_OUT");
    } catch {
      // Ignore
    }
  }, []);

  const handleSignIn = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const cleanEmail = email.trim();
      const copy = AUTH_COPY[locale];
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || password.length < 6) {
        setErrorMsg(copy.invalidError);
        return;
      }
      setErrorMsg(null);
      const localPart = cleanEmail.split("@")[0] ?? "Admin";
      const formattedName =
        cleanEmail === "admin@fmc-fsjes.ma"
          ? "Admin Bureau"
          : localPart
              .split(/[._-]/)
              .filter(Boolean)
              .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
              .join(" ") || "Admin Bureau";
      const initials = formattedName
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      const nextSession: AmsSession = {
        name: formattedName,
        email: cleanEmail,
        initials: initials || "AB",
      };
      setSession(nextSession);
      try {
        window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      } catch {
        // Ignore
      }
      toast(copy.signedInToast, "pos");
    },
    [email, locale, password, toast],
  );

  const handleSso = useCallback(() => {
    const copy = AUTH_COPY[locale];
    const nextSession: AmsSession = {
      name: "Admin Bureau",
      email: "admin@fmc-fsjes.ma",
      initials: "AB",
    };
    setSession(nextSession);
    try {
      window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
    } catch {
      // Ignore
    }
    toast(copy.ssoToast, "pos");
  }, [locale, toast]);

  const contextValue = useMemo<AmsContextValue>(
    () => ({
      session,
      signOut,
      locale,
      setLocale,
      theme,
      toggleTheme,
      toasts,
      toast,
    }),
    [session, signOut, locale, setLocale, theme, toggleTheme, toasts, toast],
  );

  const copy = AUTH_COPY[locale];
  const landingUrl = process.env.NEXT_PUBLIC_APP_URL ?? "/";

  if (!session) {
    return (
      <AmsContext.Provider value={contextValue}>
        <div id="auth-screen" className="auth-screen">
          <div className="auth-panel auth-panel--brand">
            <div className="auth-logo">
              <FmcLogoMark size="lg" />
              <div className="auth-logo__text">
                <span className="auth-logo__name">FSJESC FMC</span>
                <span className="auth-logo__app">{copy.ams}</span>
              </div>
            </div>
            <h2 className="auth-hero-title">{copy.heroTitle}</h2>
            <p className="auth-tagline">{copy.heroLede}</p>
            <ul className="auth-features">
              <li className="auth-feature">
                <span className="auth-feature__icon" aria-hidden="true">
                  📝
                </span>
                <span>{copy.f1}</span>
              </li>
              <li className="auth-feature">
                <span className="auth-feature__icon" aria-hidden="true">
                  👥
                </span>
                <span>{copy.f2}</span>
              </li>
              <li className="auth-feature">
                <span className="auth-feature__icon" aria-hidden="true">
                  ⚙️
                </span>
                <span>{copy.f3}</span>
              </li>
            </ul>
          </div>

          <div className="auth-panel auth-panel--form">
            <form className="auth-form" id="signin-form" onSubmit={handleSignIn} noValidate>
              <div className="auth-logo" style={{ marginBottom: 20 }}>
                <FmcLogoMark size="lg" style={{ color: "var(--text)" }} />
                <div className="auth-logo__text">
                  <span className="auth-logo__name" style={{ color: "var(--text)" }}>
                    AMS
                  </span>
                  <span className="auth-logo__app" style={{ color: "var(--text-3)" }}>
                    {copy.adminAccess}
                  </span>
                </div>
              </div>
              <h1>{copy.title}</h1>
              <p className="sub">{copy.sub}</p>

              {errorMsg ? (
                <div id="signin-error" className="error" role="alert">
                  {errorMsg}
                </div>
              ) : null}

              <div className="field" style={{ marginBottom: 12 }}>
                <label className="field__label" htmlFor="email">
                  {copy.email}
                </label>
                <input
                  className="input mono"
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="admin@fmc-fsjes.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="field" style={{ marginBottom: 18 }}>
                <label className="field__label" htmlFor="password">
                  {copy.password}
                </label>
                <input
                  className="input mono"
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <span className="field__hint">{copy.hint}</span>
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--block"
                style={{ height: 38 }}
              >
                {copy.submit}
              </button>

              <div className="or">{copy.or}</div>
              <button type="button" className="oauth" onClick={handleSso}>
                {copy.sso}
              </button>

              <div className="foot">
                <a href={landingUrl}>{copy.back}</a>
              </div>
            </form>
          </div>
        </div>
      </AmsContext.Provider>
    );
  }

  return <AmsContext.Provider value={contextValue}>{children}</AmsContext.Provider>;
}
