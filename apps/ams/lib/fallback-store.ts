/**
 * Client-side fallback store for AMS (`apps/ams/lib/fallback-store.ts`).
 *
 * When AMS is deployed standalone on Vercel without `AMS_API_ORIGIN` pointing
 * to a live landing backend (or when the database/upstream is unreachable),
 * `/api/admin/*` calls seamlessly fall back to this `localStorage`-persisted
 * state engine so every screen, filter, and CRUD mutation works interactively.
 */

import {
  ALL_MARKET_ASSETS,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_DESCRIPTIONS,
  MARKET_CATEGORY_LABELS,
} from "@fsjesc/domain/assets";
import type {
  ActivityItem,
  AdminApiRouter,
  AdminApisPayload,
  AdminArticle,
  AdminCompetition,
  AdminEvent,
  AdminMarketInstrument,
  AdminOrder,
  AdminSystemStatus,
  AdminUser,
  ApiProbeResult,
  DashboardStats,
  MacroScenarioId,
  MarketCategoryId,
  PlatformSettings,
} from "./api";

const STORAGE_KEY = "fmc:ams:store:v1";

interface FallbackStoreState {
  settings: PlatformSettings;
  apiRouters: AdminApiRouter[];
  instruments: AdminMarketInstrument[];
  users: AdminUser[];
  events: AdminEvent[];
  articles: AdminArticle[];
  competitions: AdminCompetition[];
  orders: AdminOrder[];
  activity: ActivityItem[];
}

function createInitialState(): FallbackStoreState {
  const now = new Date();
  const iso = (offsetHours: number) =>
    new Date(now.getTime() + offsetHours * 3600_000).toISOString();

  const settings: PlatformSettings = {
    platformName: "FSJESC Financial Markets Club",
    organizationName: "FSJES Ain Chock — Université Hassan II de Casablanca",
    campusLocation: "Km 8, Route d'El Jadida, B.P. 8110 Oasis, Casablanca",
    supportEmail: "contact@fmc-fsjes.ma",
    announcementBanner:
      "Spring 2026 Casablanca Equity & Global Multi-Asset Trading Challenge is now live — 110 instruments across 8 markets enabled.",
    announcementActive: true,
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: false,
    allowedEmailDomains: "fsjesc.uh2c.ma, uh2c.ac.ma, etu.uh2c.ac.ma, fmc-fsjes.ma, *",

    defaultStartingCashMad: 100_000,
    commissionBps: 10,
    minCommissionMad: 15,
    slippageBps: 5,
    settlementRegime: "T+2",
    allowShortSelling: false,
    allowFractionalCrypto: true,
    maxSinglePositionPct: 25,
    marketSessionMode: "CONTINUOUS_24_7",
    activeScenario: "NORMAL",

    marketApiUrl: "https://api.wassly.tech",
    marketApiKeyConfigured: true,
    marketApiTimeoutMs: 4000,
    enableLiveReferenceFeed: true,
    syncReferencePricesToEngine: true,
    cseCacheTtlSeconds: 60,
    globalQuotesCacheTtlSeconds: 30,
    rateLimitPerMinute: 120,

    enableSimulator: true,
    enableCompetitions: true,
    enableChallenges: true,
    enableEducationLibrary: true,
    enableEventsRegistration: true,
    enableLiveTicker: true,
    enableOptionsChain: true,
    enableYieldCurve: true,
  };

  const apiRouters: AdminApiRouter[] = [
    {
      id: "CSE",
      name: "Bourse de Casablanca (CSE)",
      basePath: "/api/v1/cse",
      provider: "CSE Official Scraper + yfinance .CS Fallback",
      coverage: "38 Listed Moroccan Equities, MASI, MADEX, 11 Sector Indices",
      enabled: true,
      cacheTtlSeconds: 60,
      rateLimitPerMin: 60,
      status: "healthy",
      lastLatencyMs: 142,
      requests24h: 4820,
      sampleEndpoint: "/api/v1/cse/quote?ticker=IAM",
    },
    {
      id: "STOCKS",
      name: "Global Equities (US & Europe)",
      basePath: "/api/v1/stocks",
      provider: "Yahoo Finance (yfinance v1)",
      coverage: "14 Large-Cap US & European Equities, OHLCV, Fundamentals, Search",
      enabled: true,
      cacheTtlSeconds: 30,
      rateLimitPerMin: 120,
      status: "healthy",
      lastLatencyMs: 185,
      requests24h: 3610,
      sampleEndpoint: "/api/v1/stocks/quote?symbol=NVDA",
    },
    {
      id: "ETFS",
      name: "Exchange-Traded Funds (ETFs)",
      basePath: "/api/v1/etfs",
      provider: "Yahoo Finance ETF Feed",
      coverage: "12 Index, Sector, Commodity & Bond ETFs + Top Holdings & Expense Ratios",
      enabled: true,
      cacheTtlSeconds: 60,
      rateLimitPerMin: 90,
      status: "healthy",
      lastLatencyMs: 164,
      requests24h: 1940,
      sampleEndpoint: "/api/v1/etfs/quote?symbol=SPY",
    },
    {
      id: "FUTURES",
      name: "Index & Commodity Futures",
      basePath: "/api/v1/futures",
      provider: "CME / NYMEX / COMEX / ICE via yfinance",
      coverage: "10 Continuous Front-Month Contracts (ES=F, NQ=F, GC=F, CL=F, BZ=F, ZB=F)",
      enabled: true,
      cacheTtlSeconds: 30,
      rateLimitPerMin: 90,
      status: "healthy",
      lastLatencyMs: 198,
      requests24h: 2150,
      sampleEndpoint: "/api/v1/futures/quote?symbol=GC%3DF",
    },
    {
      id: "CRYPTO",
      name: "Digital Assets & Crypto Spot",
      basePath: "/api/v1/crypto",
      provider: "CoinMarketCap / Yahoo Crypto Bridge",
      coverage: "10 Major Spot Pairs (BTC-USD, ETH-USD, SOL-USD, BNB-USD, XRP-USD, ADA-USD)",
      enabled: true,
      cacheTtlSeconds: 15,
      rateLimitPerMin: 150,
      status: "healthy",
      lastLatencyMs: 118,
      requests24h: 5430,
      sampleEndpoint: "/api/v1/crypto/quote?symbol=BTC-USD",
    },
    {
      id: "FOREX",
      name: "Foreign Exchange (FX Spot & Crosses)",
      basePath: "/api/v1/forex",
      provider: "Frankfurter (ECB Reference) + BAM Dirham Desk",
      coverage: "8 Spot Pairs (USD/MAD, EUR/MAD, EUR/USD, GBP/USD, USD/JPY) + 33-Currency Matrix",
      enabled: true,
      cacheTtlSeconds: 45,
      rateLimitPerMin: 120,
      status: "healthy",
      lastLatencyMs: 94,
      requests24h: 3190,
      sampleEndpoint: "/api/v1/forex/rate?base=EUR&target=USD",
    },
    {
      id: "BONDS",
      name: "Sovereign Bonds, Treasury Yields & BAM Rates",
      basePath: "/api/v1/bonds",
      provider: "US Treasury / FRED + Bank Al-Maghrib BDT Curve",
      coverage: "10 Sovereign Benchmarks (US 3M–30Y, Fed Funds, BAM 2.75%, Morocco BDT 2Y–10Y)",
      enabled: true,
      cacheTtlSeconds: 300,
      rateLimitPerMin: 60,
      status: "healthy",
      lastLatencyMs: 132,
      requests24h: 1480,
      sampleEndpoint: "/api/v1/bonds/yield-curve",
    },
    {
      id: "OPTIONS",
      name: "Listed Equity & Index Options (CBOE)",
      basePath: "/api/v1/options",
      provider: "CBOE / Yahoo Options Chain Engine",
      coverage: "8 Liquid Call/Put Contracts (AAPL, NVDA, SPY, TSLA, MSFT, QQQ, AMZN, META)",
      enabled: true,
      cacheTtlSeconds: 45,
      rateLimitPerMin: 60,
      status: "healthy",
      lastLatencyMs: 215,
      requests24h: 1120,
      sampleEndpoint: "/api/v1/options/expirations?symbol=AAPL",
    },
  ];

  const instruments: AdminMarketInstrument[] = ALL_MARKET_ASSETS.map((asset, index) => ({
    ...asset,
    averageDailyVolume: 50_000 + (index % 15) * 12_500,
    tradable: true,
    featured: index < 16 || asset.market !== "CSE",
    marginEligible: asset.market === "FUTURES" || asset.market === "FOREX",
    maxOrderQuantity: asset.market === "OPTIONS" ? 500 : 10_000,
  }));

  const users: AdminUser[] = [
    {
      id: "U-01",
      email: "y.elamrani@fsjes.ma",
      name: "Yassine El Amrani",
      studentId: "FMC-ADM-001",
      track: "Master M2 Finance & Ingénierie Financière",
      role: "ADMINISTRATOR",
      status: "active",
      cashCents: "11842000",
      positionsCount: 7,
      ordersCount: 142,
      createdAt: "2024-09-12T09:00:00.000Z",
    },
    {
      id: "U-02",
      email: "l.benjelloun@fsjes.ma",
      name: "Lina Benjelloun",
      studentId: "FMC-EXE-002",
      track: "Master M1 Finance Quantitative",
      role: "EXECUTIVE",
      status: "active",
      cashCents: "11589000",
      positionsCount: 5,
      ordersCount: 118,
      createdAt: "2024-09-14T09:00:00.000Z",
    },
    {
      id: "U-03",
      email: "k.ouazzani@fsjes.ma",
      name: "Karim Ouazzani",
      studentId: "FMC-MEM-003",
      track: "Master M2 Finance de Marché",
      role: "MEMBER",
      status: "active",
      cashCents: "11410500",
      positionsCount: 6,
      ordersCount: 96,
      createdAt: "2024-09-18T09:00:00.000Z",
    },
    {
      id: "U-04",
      email: "s.tazi@fsjes.ma",
      name: "Sofia Tazi",
      studentId: "FMC-EXE-004",
      track: "Master M1 Audit & Contrôle",
      role: "EXECUTIVE",
      status: "active",
      cashCents: "11277500",
      positionsCount: 4,
      ordersCount: 88,
      createdAt: "2024-09-20T09:00:00.000Z",
    },
    {
      id: "U-05",
      email: "m.idrissi@fsjes.ma",
      name: "Mehdi Idrissi",
      studentId: "FMC-STU-005",
      track: "Licence L3 Sciences Économiques",
      role: "STUDENT",
      status: "active",
      cashCents: "11195000",
      positionsCount: 4,
      ordersCount: 74,
      createdAt: "2024-10-02T09:00:00.000Z",
    },
    {
      id: "U-06",
      email: "a.cherkaoui@fsjes.ma",
      name: "Amine Cherkaoui",
      studentId: "FMC-MEM-006",
      track: "Master M1 Banque & Marchés",
      role: "MEMBER",
      status: "active",
      cashCents: "10864000",
      positionsCount: 3,
      ordersCount: 65,
      createdAt: "2024-10-08T09:00:00.000Z",
    },
    {
      id: "U-07",
      email: "n.alaoui@fsjes.ma",
      name: "Nadia Alaoui",
      studentId: "FMC-STU-007",
      track: "Licence L3 Gestion Financière",
      role: "STUDENT",
      status: "active",
      cashCents: "10751000",
      positionsCount: 3,
      ordersCount: 52,
      createdAt: "2024-10-15T09:00:00.000Z",
    },
    {
      id: "U-08",
      email: "o.berrada@fsjes.ma",
      name: "Omar Berrada",
      studentId: "FMC-STU-008",
      track: "Licence L2 Économie & Gestion",
      role: "STUDENT",
      status: "suspended",
      cashCents: "9622000",
      positionsCount: 1,
      ordersCount: 31,
      createdAt: "2024-11-01T09:00:00.000Z",
    },
    {
      id: "U-09",
      email: "y.toumi@fsjes.ma",
      name: "Youssef Toumi",
      studentId: "FMC-STU-009",
      track: "Licence L1 Sciences Économiques",
      role: "STUDENT",
      status: "pending",
      cashCents: "10000000",
      positionsCount: 0,
      ordersCount: 0,
      createdAt: "2025-03-19T09:00:00.000Z",
    },
  ];

  const events: AdminEvent[] = [
    {
      id: "E-01",
      title: "Séminaire : Lecture d'un bilan bancaire (ATW, BCP, BOA)",
      description:
        "Analyse approfondie du PNB, coût du risque et ratios prudentiels BAM sur le secteur bancaire coté à Casablanca.",
      location: "Amphi B · FSJESC",
      format: "IN_PERSON",
      startsAt: iso(48),
      endsAt: iso(50),
      capacity: 120,
      registrationCount: 84,
      status: "scheduled",
    },
    {
      id: "E-02",
      title: "Atelier Python : Backtesting d'une stratégie momentum sur le MASI",
      description:
        "Construction et validation d'un portefeuille quantitatif sur les valeurs liquides de la Bourse de Casablanca.",
      location: "Salle Info 3",
      format: "HYBRID",
      startsAt: iso(120),
      endsAt: iso(122),
      capacity: 60,
      registrationCount: 42,
      status: "scheduled",
    },
    {
      id: "E-03",
      title: "Challenge Inter-universitaire de Trading — Finale",
      description:
        "Session finale en direct sur 110 instruments (Actions CSE, US Equities, Forex, Obligations BDT et Futures).",
      location: "Grand Amphi",
      format: "IN_PERSON",
      startsAt: iso(240),
      endsAt: iso(244),
      capacity: 200,
      registrationCount: 156,
      status: "scheduled",
    },
    {
      id: "E-04",
      title: "Conférence : Politique monétaire de Bank Al-Maghrib",
      description:
        "Retour sur le taux directeur à 2,75 %, la courbe des Bons du Trésor et la liquidité interbancaire.",
      location: "Amphi A",
      format: "IN_PERSON",
      startsAt: iso(-120),
      endsAt: iso(-118),
      capacity: 150,
      registrationCount: 118,
      status: "completed",
    },
  ];

  const articles: AdminArticle[] = [
    {
      id: "ART-01",
      title: "Lecture du carnet d'ordres : liquidité, spread et profondeur",
      slug: "lecture-du-carnet-dordres-liquidite-spread",
      category: "Microstructure",
      level: "FOUNDATION",
      readingTimeMinutes: 8,
      summary:
        "Comprendre le pré-ouverture, le matching continu (09h30–15h30), les seuils de réservation et le règlement Maroclear T+2.",
      essential: true,
      status: "published",
      updatedAt: "2025-03-14T10:00:00.000Z",
    },
    {
      id: "ART-02",
      title: "Construire un portefeuille équipondéré vs pondéré par la volatilité",
      slug: "portefeuille-equipondere-vs-volatilite",
      category: "Gestion",
      level: "INTERMEDIATE",
      readingTimeMinutes: 11,
      summary:
        "Comparaison empirique du ratio de Sharpe et du drawdown maximal sur les valeurs du compartiment Principal F.",
      essential: true,
      status: "published",
      updatedAt: "2025-03-02T10:00:00.000Z",
    },
    {
      id: "ART-03",
      title: "Ratio de Sharpe, Sortino et drawdown maximal : guide pratique",
      slug: "ratio-de-sharpe-sortino-drawdown-maximal",
      category: "Risque",
      level: "FOUNDATION",
      readingTimeMinutes: 9,
      summary:
        "Comment le simulateur FSJESC FMC évalue la performance ajustée du risque lors des compétitions officielles.",
      essential: true,
      status: "published",
      updatedAt: "2025-02-19T10:00:00.000Z",
    },
    {
      id: "ART-04",
      title: "Politique monétaire de Bank Al-Maghrib et courbe des taux BDT",
      slug: "politique-monetaire-bam-courbe-taux-bdt",
      category: "Macro",
      level: "INTERMEDIATE",
      readingTimeMinutes: 12,
      summary:
        "Transmission des décisions de taux directeur sur les Bons du Trésor 2Y–10Y et la valorisation des banques cotées.",
      essential: true,
      status: "draft",
      updatedAt: "2025-03-18T10:00:00.000Z",
    },
    {
      id: "ART-05",
      title: "Valorisation par DCF : hypothèses, sensibilité et pièges classiques",
      slug: "valorisation-dcf-hypotheses-sensibilite",
      category: "Valorisation",
      level: "ADVANCED",
      readingTimeMinutes: 14,
      summary:
        "Application aux blue chips marocaines : Attijariwafa Bank (ATW), Maroc Telecom (IAM), LafargeHolcim (LHM) et Taqa Morocco (TQM).",
      essential: false,
      status: "draft",
      updatedAt: "2025-03-20T10:00:00.000Z",
    },
    {
      id: "ART-06",
      title: "Introduction aux obligations souveraines et duration modifiée",
      slug: "introduction-obligations-souveraines-duration",
      category: "Taux",
      level: "FOUNDATION",
      readingTimeMinutes: 10,
      summary:
        "Sensibilité taux, convexité et couverture obligataire dans le terminal multi-actifs.",
      essential: false,
      status: "published",
      updatedAt: "2025-01-28T10:00:00.000Z",
    },
  ];

  const competitions: AdminCompetition[] = [
    {
      id: "C-01",
      title: "Challenge Printemps 2025 — Actions MASI",
      description:
        "Compétition phare du semestre sur les 38 valeurs de la Bourse de Casablanca et les actifs globaux. Classement par ratio de Sharpe.",
      startingCashCents: "10000000",
      status: "ACTIVE",
      startsAt: "2025-03-01T09:00:00.000Z",
      endsAt: "2025-04-30T18:00:00.000Z",
      participantCount: 64,
      maxParticipants: 100,
      scenario: "NORMAL",
      allowedMarkets: ["CSE", "STOCKS", "ETFS", "FOREX", "BONDS"],
    },
    {
      id: "C-02",
      title: "Sprint Volatilité — Semaine des Résultats",
      description:
        "Sprint intensif de 5 jours pendant les publications financières avec gestion stricte du drawdown maximal.",
      startingCashCents: "5000000",
      status: "OPEN",
      startsAt: "2025-04-07T09:00:00.000Z",
      endsAt: "2025-04-14T18:00:00.000Z",
      participantCount: 28,
      maxParticipants: 60,
      scenario: "BAM_RATE_HIKE",
      allowedMarkets: ["CSE", "BONDS", "FOREX"],
    },
    {
      id: "C-03",
      title: "Tournoi d'Automne 2024",
      description:
        "Cohorte inaugurale d'investissement fondamental sur les valeurs de rendement de la Bourse de Casablanca.",
      startingCashCents: "10000000",
      status: "COMPLETED",
      startsAt: "2024-10-01T09:00:00.000Z",
      endsAt: "2024-12-15T18:00:00.000Z",
      participantCount: 82,
      maxParticipants: 90,
      scenario: "NORMAL",
      allowedMarkets: ["CSE"],
    },
  ];

  const orders: AdminOrder[] = [
    {
      id: "ORD-9482",
      userEmail: "y.elamrani@fsjes.ma",
      symbol: "ATW",
      market: "CSE",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 30,
      filledPriceCents: "48520",
      limitPriceCents: "48520",
      feeCents: "1456",
      status: "FILLED",
      createdAt: iso(-0.2),
    },
    {
      id: "ORD-9481",
      userEmail: "l.benjelloun@fsjes.ma",
      symbol: "IAM",
      market: "CSE",
      side: "BUY",
      orderType: "MARKET",
      quantity: 80,
      filledPriceCents: "10500",
      limitPriceCents: null,
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-0.45),
    },
    {
      id: "ORD-9480",
      userEmail: "k.ouazzani@fsjes.ma",
      symbol: "LHM",
      market: "CSE",
      side: "SELL",
      orderType: "LIMIT",
      quantity: 15,
      filledPriceCents: null,
      limitPriceCents: "192000",
      feeCents: "0",
      status: "PENDING",
      reason: "En attente sur le carnet d'ordres (limite 1 920,00 MAD)",
      createdAt: iso(-0.8),
    },
    {
      id: "ORD-9479",
      userEmail: "s.tazi@fsjes.ma",
      symbol: "BCP",
      market: "CSE",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 40,
      filledPriceCents: "29500",
      limitPriceCents: "29500",
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-1.2),
    },
    {
      id: "ORD-9478",
      userEmail: "o.berrada@fsjes.ma",
      symbol: "HPS",
      market: "CSE",
      side: "BUY",
      orderType: "MARKET",
      quantity: 500,
      filledPriceCents: null,
      limitPriceCents: null,
      feeCents: "0",
      status: "REJECTED",
      reason: "Liquidités disponibles insuffisantes (dépasse le plafond de 100 000 MAD)",
      createdAt: iso(-1.9),
    },
    {
      id: "ORD-9477",
      userEmail: "m.idrissi@fsjes.ma",
      symbol: "TQM",
      market: "CSE",
      side: "SELL",
      orderType: "MARKET",
      quantity: 20,
      filledPriceCents: "136000",
      limitPriceCents: null,
      feeCents: "2720",
      status: "FILLED",
      createdAt: iso(-2.6),
    },
    {
      id: "ORD-9476",
      userEmail: "a.cherkaoui@fsjes.ma",
      symbol: "MSA",
      market: "CSE",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 50,
      filledPriceCents: null,
      limitPriceCents: "52800",
      feeCents: "0",
      status: "CANCELLED",
      reason: "Annulé par l'opérateur",
      createdAt: iso(-3.4),
    },
  ];

  const activity: ActivityItem[] = [
    {
      id: "act-01",
      type: "ORDER_FILLED",
      actor: "y.elamrani@fsjes.ma",
      description: "Ordre ORD-9482 exécuté — Achat 30 ATW @ 485,20 MAD (Y. El Amrani)",
      timestamp: iso(-0.05),
    },
    {
      id: "act-02",
      type: "USER_PROVISIONED",
      actor: "y.toumi@fsjes.ma",
      description: "Nouvel étudiant inscrit — Youssef Toumi (L1 Sciences Éco)",
      timestamp: iso(-0.25),
    },
    {
      id: "act-03",
      type: "ORDER_REJECTED",
      actor: "o.berrada@fsjes.ma",
      description: "Ordre ORD-9478 rejeté — Liquidités insuffisantes (O. Berrada · 500 HPS)",
      timestamp: iso(-0.6),
    },
    {
      id: "act-04",
      type: "ARTICLE_UPDATED",
      actor: "s.tazi@fsjes.ma",
      description: "Brouillon enregistré — Valorisation par DCF (S. Tazi)",
      timestamp: iso(-1.0),
    },
    {
      id: "act-05",
      type: "ENGINE_TICK",
      actor: "system@fmc-fsjes.ma",
      description: "Horloge de marché avancée — Jour 42 / 252 (Seed FMC-2025-A17 · 110 instruments)",
      timestamp: iso(-3.0),
    },
  ];

  return {
    settings,
    apiRouters,
    instruments,
    users,
    events,
    articles,
    competitions,
    orders,
    activity,
  };
}

let memoryStore: FallbackStoreState | null = null;

function loadStore(): FallbackStoreState {
  if (memoryStore) return memoryStore;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FallbackStoreState;
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.instruments)) {
          memoryStore = parsed;
          return memoryStore;
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  memoryStore = createInitialState();
  saveStore(memoryStore);
  return memoryStore;
}

function saveStore(state: FallbackStoreState): void {
  memoryStore = state;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }
}

function logActivity(state: FallbackStoreState, type: string, description: string): void {
  state.activity.unshift({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    actor: "admin@fmc-fsjes.ma",
    description,
    timestamp: new Date().toISOString(),
  });
  if (state.activity.length > 50) {
    state.activity.length = 50;
  }
}

function parseBody(init?: RequestInit): Record<string, unknown> {
  if (!init?.body || typeof init.body !== "string") return {};
  try {
    return JSON.parse(init.body) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function handleFallbackRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const state = loadStore();
  const method = (init?.method ?? "GET").toUpperCase();
  const url = new URL(path, "http://localhost");
  const pathname = url.pathname;
  const body = parseBody(init);

  // 1. Dashboard (`/api/admin/dashboard`)
  if (pathname === "/api/admin/dashboard") {
    const totalVolumeCents = state.orders
      .filter((o) => o.status === "FILLED")
      .reduce((acc, o) => {
        const price = Number(o.filledPriceCents ?? 10000);
        return acc + price * Number(o.quantity);
      }, 0);

    const payload: DashboardStats = {
      totalUsers: state.users.length,
      activePortfolios: state.users.filter((u) => u.status === "active").length,
      totalVolumeCents: String(totalVolumeCents),
      activeCompetitions: state.competitions.filter(
        (c) => c.status === "ACTIVE" || c.status === "OPEN",
      ).length,
      pendingOrders: state.orders.filter((o) => o.status === "PENDING").length,
      tradableInstruments: state.instruments.filter((i) => i.tradable).length,
      totalInstruments: state.instruments.length,
      healthyRouters: state.apiRouters.filter((r) => r.enabled && r.status === "healthy").length,
      totalRouters: state.apiRouters.length,
      marketApiUrl: state.settings.marketApiUrl,
      activeScenario: state.settings.activeScenario,
      marketSessionMode: state.settings.marketSessionMode,
      recentActivity: state.activity.slice(0, 12),
    };
    return payload as T;
  }

  // 2. APIs & Markets (`/api/admin/apis`)
  if (pathname === "/api/admin/apis") {
    if (method === "GET") {
      const marketSummary = MARKET_CATEGORIES.filter((m) => m !== "ALL").map((cat) => {
        const list = state.instruments.filter((i) => i.market === cat);
        return {
          id: cat as MarketCategoryId,
          label: MARKET_CATEGORY_LABELS[cat],
          shortLabel: cat,
          badge: cat,
          description: MARKET_CATEGORY_DESCRIPTIONS[cat],
          apiRouter: `/api/v1/${cat.toLowerCase()}`,
          totalCount: list.length,
          tradableCount: list.filter((i) => i.tradable).length,
          featuredCount: list.filter((i) => i.featured).length,
        };
      });

      const payload: AdminApisPayload = {
        gateway: {
          baseUrl: state.settings.marketApiUrl,
          apiKeyConfigured: state.settings.marketApiKeyConfigured,
          timeoutMs: state.settings.marketApiTimeoutMs,
          enableLiveReferenceFeed: state.settings.enableLiveReferenceFeed,
          syncReferencePricesToEngine: state.settings.syncReferencePricesToEngine,
          activeScenario: state.settings.activeScenario,
          marketSessionMode: state.settings.marketSessionMode,
        },
        routers: state.apiRouters,
        marketSummary,
        instruments: state.instruments,
      };
      return payload as T;
    }

    if (method === "PATCH") {
      const target = String(body.target ?? "");
      if (target === "router") {
        const router = state.apiRouters.find((r) => r.id === body.routerId);
        if (router) {
          if (typeof body.enabled === "boolean") {
            router.enabled = body.enabled;
            router.status = body.enabled ? "healthy" : "offline";
          }
          if (typeof body.cacheTtlSeconds === "number") router.cacheTtlSeconds = body.cacheTtlSeconds;
          if (typeof body.rateLimitPerMin === "number") router.rateLimitPerMin = body.rateLimitPerMin;
          logActivity(state, "API_ROUTER_UPDATED", `Routeur ${router.id} mis à jour (${router.enabled ? "actif" : "désactivé"})`);
          saveStore(state);
          return { ok: true, router } as T;
        }
      }
      if (target === "instrument") {
        const inst = state.instruments.find((i) => i.ticker === body.ticker);
        if (inst) {
          if (typeof body.tradable === "boolean") inst.tradable = body.tradable;
          if (typeof body.featured === "boolean") inst.featured = body.featured;
          if (typeof body.annualDrift === "number") inst.annualDrift = body.annualDrift;
          if (typeof body.annualVolatility === "number") inst.annualVolatility = body.annualVolatility;
          if (typeof body.startingPriceCents === "number") inst.startingPriceCents = body.startingPriceCents;
          if (typeof body.maxOrderQuantity === "number") inst.maxOrderQuantity = body.maxOrderQuantity;
          logActivity(state, "INSTRUMENT_UPDATED", `Instrument ${inst.ticker} mis à jour`);
          saveStore(state);
          return { ok: true, instrument: inst } as T;
        }
      }
      if (target === "bulk_market") {
        const market = String(body.market ?? "");
        const tradable = Boolean(body.tradable);
        let updatedCount = 0;
        for (const inst of state.instruments) {
          if (market === "ALL" || inst.market === market) {
            inst.tradable = tradable;
            updatedCount += 1;
          }
        }
        logActivity(state, "MARKET_BULK_TOGGLE", `${updatedCount} instruments ${market} → ${tradable ? "négociables" : "suspendus"}`);
        saveStore(state);
        return { ok: true, updatedCount } as T;
      }
      if (target === "scenario") {
        const scenario = (body.scenario as MacroScenarioId) ?? "NORMAL";
        state.settings.activeScenario = scenario;
        logActivity(state, "MACRO_SCENARIO_SET", `Scénario macroéconomique activé : ${scenario}`);
        saveStore(state);
        return { ok: true, activeScenario: scenario } as T;
      }
      if (target === "gateway") {
        if (typeof body.marketApiUrl === "string") state.settings.marketApiUrl = body.marketApiUrl;
        if (typeof body.enableLiveReferenceFeed === "boolean")
          state.settings.enableLiveReferenceFeed = body.enableLiveReferenceFeed;
        if (typeof body.syncReferencePricesToEngine === "boolean")
          state.settings.syncReferencePricesToEngine = body.syncReferencePricesToEngine;
        if (typeof body.marketSessionMode === "string")
          state.settings.marketSessionMode = body.marketSessionMode as PlatformSettings["marketSessionMode"];
        logActivity(state, "GATEWAY_UPDATED", "Configuration passerelle Wassly API mise à jour");
        saveStore(state);
        return { ok: true } as T;
      }
    }

    if (method === "POST") {
      const action = String(body.action ?? "");
      if (action === "PROBE") {
        const endpoint = String(body.endpoint ?? "/api/v1/cse/summary");
        const cleanUrl = `${state.settings.marketApiUrl.replace(/\/$/, "")}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
        const result: ApiProbeResult = {
          ok: true,
          status: 200,
          latencyMs: 124,
          url: cleanUrl,
          source: "SIMULATED_FALLBACK",
          payload: {
            status: "ok",
            endpoint,
            provider: "Wassly Market Gateway + Deterministic CSE Engine",
            instrumentsActive: state.instruments.filter((i) => i.tradable).length,
            timestamp: new Date().toISOString(),
          },
        };
        return result as T;
      }
      if (action === "SYNC_ALL") {
        for (const r of state.apiRouters) {
          if (r.enabled) {
            r.status = "healthy";
            r.lastLatencyMs = 95 + Math.floor(Math.random() * 90);
            r.requests24h += 12;
          }
        }
        logActivity(state, "API_GATEWAY_SYNC", "Synchronisation complète des 8 routeurs et 110 instruments effectuée");
        saveStore(state);
        return {
          ok: true,
          liveHealthy: true,
          latencyMs: 132,
          routers: state.apiRouters,
        } as T;
      }
    }
  }

  // 3. Users (`/api/admin/users`)
  if (pathname === "/api/admin/users") {
    if (method === "GET") {
      return state.users as T;
    }
    if (method === "POST") {
      const startingCashMad = Number(body.startingCashMad ?? state.settings.defaultStartingCashMad);
      const newUser: AdminUser = {
        id: `U-${String(state.users.length + 1).padStart(2, "0")}`,
        email: String(body.email ?? "etudiant@fsjes.ma").trim().toLowerCase(),
        name: String(body.name ?? "Nouvel Étudiant").trim(),
        studentId: String(body.studentId ?? `UH2C-2026-${100 + state.users.length}`),
        track: String(body.track ?? "Master Finance & Ingénierie Financière"),
        role: String(body.role ?? "STUDENT"),
        status: "active",
        cashCents: String(Math.round(startingCashMad * 100)),
        positionsCount: 0,
        ordersCount: 0,
        createdAt: new Date().toISOString(),
      };
      state.users.unshift(newUser);
      logActivity(state, "USER_CREATED", `Étudiant invité — ${newUser.name} (${newUser.email})`);
      saveStore(state);
      return newUser as T;
    }
    if (method === "PATCH") {
      const target = state.users.find((u) => u.id === body.id);
      if (target) {
        if (typeof body.role === "string") target.role = body.role;
        if (typeof body.status === "string") target.status = body.status;
        if (typeof body.name === "string") target.name = body.name;
        if (typeof body.track === "string") target.track = body.track;
        if (body.portfolioAction === "RESET_100K") {
          target.cashCents = String(state.settings.defaultStartingCashMad * 100);
          target.positionsCount = 0;
        } else if (body.portfolioAction === "CREDIT_CASH") {
          const addCents = Math.round(Number(body.creditAmountMad ?? 10_000) * 100);
          target.cashCents = String(Number(target.cashCents ?? 0) + addCents);
        }
        logActivity(state, "USER_UPDATED", `Compte mis à jour — ${target.name ?? target.email}`);
        saveStore(state);
        return target as T;
      }
    }
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (id) {
        state.users = state.users.filter((u) => u.id !== id);
        logActivity(state, "USER_DELETED", `Utilisateur ${id} supprimé`);
        saveStore(state);
      }
      return { ok: true } as T;
    }
  }

  // 4. Events (`/api/admin/events`)
  if (pathname === "/api/admin/events") {
    if (method === "GET") return state.events as T;
    if (method === "POST") {
      const startsAt = String(body.startsAt ?? new Date(Date.now() + 7 * 86400_000).toISOString());
      const created: AdminEvent = {
        id: `E-${String(state.events.length + 1).padStart(2, "0")}`,
        title: String(body.title ?? "Nouvel événement"),
        description: String(body.description ?? ""),
        location: String(body.location ?? "Amphi B · FSJESC"),
        format: (body.format as AdminEvent["format"]) ?? "IN_PERSON",
        startsAt,
        endsAt: new Date(new Date(startsAt).getTime() + 2 * 3600_000).toISOString(),
        capacity: Number(body.capacity ?? 100),
        registrationCount: 0,
        status: "scheduled",
      };
      state.events.unshift(created);
      logActivity(state, "EVENT_CREATED", `Événement programmé — ${created.title}`);
      saveStore(state);
      return created as T;
    }
    if (method === "PATCH") {
      const evt = state.events.find((e) => e.id === body.id);
      if (evt) {
        Object.assign(evt, body);
        logActivity(state, "EVENT_UPDATED", `Événement mis à jour — ${evt.title}`);
        saveStore(state);
        return evt as T;
      }
    }
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (id) {
        state.events = state.events.filter((e) => e.id !== id);
        logActivity(state, "EVENT_DELETED", `Événement ${id} supprimé`);
        saveStore(state);
      }
      return { ok: true } as T;
    }
  }

  // 5. Articles (`/api/admin/articles`)
  if (pathname === "/api/admin/articles") {
    if (method === "GET") return state.articles as T;
    if (method === "POST") {
      const title = String(body.title ?? "Nouvel article");
      const slug =
        String(body.slug ?? "").trim() ||
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
      const created: AdminArticle = {
        id: `ART-${String(state.articles.length + 1).padStart(2, "0")}`,
        title,
        slug,
        category: String(body.category ?? "Microstructure"),
        level: (body.level as AdminArticle["level"]) ?? "FOUNDATION",
        readingTimeMinutes: Number(body.readingTimeMinutes ?? 8),
        summary: String(body.summary ?? ""),
        content: String(body.content ?? ""),
        essential: Boolean(body.essential),
        status: (body.status as AdminArticle["status"]) ?? "published",
        updatedAt: new Date().toISOString(),
      };
      state.articles.unshift(created);
      logActivity(state, "ARTICLE_CREATED", `Article créé — ${created.title}`);
      saveStore(state);
      return created as T;
    }
    if (method === "PATCH") {
      const art = state.articles.find((a) => a.id === body.id);
      if (art) {
        Object.assign(art, body, { updatedAt: new Date().toISOString() });
        logActivity(state, "ARTICLE_UPDATED", `Article modifié — ${art.title}`);
        saveStore(state);
        return art as T;
      }
    }
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (id) {
        state.articles = state.articles.filter((a) => a.id !== id);
        logActivity(state, "ARTICLE_DELETED", `Article ${id} supprimé`);
        saveStore(state);
      }
      return { ok: true } as T;
    }
  }

  // 6. Competitions (`/api/admin/competitions`)
  if (pathname === "/api/admin/competitions") {
    if (method === "GET") return state.competitions as T;
    if (method === "POST") {
      const cashMad = Number(body.startingCashMad ?? 100_000);
      const created: AdminCompetition = {
        id: `C-${String(state.competitions.length + 1).padStart(2, "0")}`,
        title: String(body.title ?? "Nouvelle compétition"),
        description: String(body.description ?? ""),
        startingCashCents: String(Math.round(cashMad * 100)),
        status: String(body.status ?? "OPEN"),
        startsAt: String(body.startsAt ?? new Date().toISOString()),
        endsAt: String(body.endsAt ?? new Date(Date.now() + 30 * 86400_000).toISOString()),
        participantCount: 0,
        maxParticipants: Number(body.maxParticipants ?? 100),
        scenario: String(body.scenario ?? "NORMAL"),
        allowedMarkets: Array.isArray(body.allowedMarkets)
          ? (body.allowedMarkets as string[])
          : ["CSE", "STOCKS", "ETFS", "FOREX", "BONDS"],
      };
      state.competitions.unshift(created);
      logActivity(state, "COMPETITION_CREATED", `Compétition créée — ${created.title}`);
      saveStore(state);
      return created as T;
    }
    if (method === "PATCH") {
      const comp = state.competitions.find((c) => c.id === body.id);
      if (comp) {
        if (typeof body.startingCashMad === "number") {
          comp.startingCashCents = String(Math.round(body.startingCashMad * 100));
        }
        Object.assign(comp, body);
        logActivity(state, "COMPETITION_UPDATED", `Compétition mise à jour — ${comp.title}`);
        saveStore(state);
        return comp as T;
      }
    }
    if (method === "DELETE") {
      const id = url.searchParams.get("id");
      if (id) {
        state.competitions = state.competitions.filter((c) => c.id !== id);
        logActivity(state, "COMPETITION_DELETED", `Compétition ${id} supprimée`);
        saveStore(state);
      }
      return { ok: true } as T;
    }
  }

  // 7. Orders (`/api/admin/orders`)
  if (pathname === "/api/admin/orders") {
    if (method === "GET") return state.orders as T;
    if (method === "POST") {
      const symbol = String(body.symbol ?? "ATW").toUpperCase();
      const inst = state.instruments.find((i) => i.ticker === symbol);
      const refPrice = inst?.startingPriceCents ?? 15000;
      const orderType = (body.orderType as "MARKET" | "LIMIT") ?? "MARKET";
      const limitCents = body.limitPriceMad
        ? String(Math.round(Number(body.limitPriceMad) * 100))
        : String(refPrice);
      const created: AdminOrder = {
        id: `ORD-${9483 + state.orders.length}`,
        userEmail: "admin@fmc-fsjes.ma",
        symbol,
        market: (inst?.market as MarketCategoryId) ?? "CSE",
        side: (body.side as "BUY" | "SELL") ?? "BUY",
        orderType,
        quantity: Number(body.quantity ?? 10),
        filledPriceCents: orderType === "MARKET" ? String(refPrice) : null,
        limitPriceCents: orderType === "LIMIT" ? limitCents : null,
        feeCents: orderType === "MARKET" ? "1500" : "0",
        status: orderType === "MARKET" ? "FILLED" : "PENDING",
        createdAt: new Date().toISOString(),
      };
      state.orders.unshift(created);
      logActivity(state, "ORDER_DESK_INJECTED", `Ordre ${created.id} injecté (${created.side} ${created.quantity} ${created.symbol})`);
      saveStore(state);
      return created as T;
    }
    if (method === "PATCH") {
      const ord = state.orders.find((o) => o.id === body.id);
      if (ord) {
        if (typeof body.status === "string") ord.status = body.status;
        if (typeof body.reason === "string") ord.reason = body.reason;
        if (ord.status === "FILLED" && !ord.filledPriceCents) {
          const inst = state.instruments.find((i) => i.ticker === ord.symbol);
          ord.filledPriceCents = ord.limitPriceCents ?? String(inst?.startingPriceCents ?? 15000);
          ord.feeCents = "1500";
        }
        logActivity(state, "ORDER_MODIFIED", `Ordre ${ord.id} → ${ord.status}`);
        saveStore(state);
        return ord as T;
      }
    }
  }

  // 8. Settings (`/api/admin/settings`)
  if (pathname === "/api/admin/settings") {
    if (method === "GET") return state.settings as T;
    if (method === "PATCH") {
      Object.assign(state.settings, body);
      logActivity(state, "SETTINGS_UPDATED", "Paramètres de la plateforme enregistrés");
      saveStore(state);
      return state.settings as T;
    }
  }

  // 9. System (`/api/admin/system`)
  if (pathname === "/api/admin/system") {
    if (method === "GET") {
      const payload: AdminSystemStatus = {
        database: "healthy",
        marketEngine: state.settings.marketSessionMode === "HALTED" ? "degraded" : "healthy",
        apiGateway: "healthy",
        marketApiUrl: state.settings.marketApiUrl,
        activeScenario: state.settings.activeScenario,
        marketSessionMode: state.settings.marketSessionMode,
        enabledRouters: state.apiRouters.filter((r) => r.enabled).length,
        totalRouters: state.apiRouters.length,
        tradableInstruments: state.instruments.filter((i) => i.tradable).length,
        totalInstruments: state.instruments.length,
        uptime: 86_400 * 14 + 3420,
        version: "2.4.0-casablanca",
        lastMigration: "0006_multi_asset_wassly_gateway",
      };
      return payload as T;
    }
    if (method === "POST") {
      const action = String(body.action ?? "");
      if (action === "HALT_TRADING") {
        state.settings.marketSessionMode = "HALTED";
        logActivity(state, "TRADING_HALTED", "Suspension d'urgence du moteur de cotation");
        saveStore(state);
        return { ok: true, message: "Cotation suspendue sur les 8 marchés." } as T;
      }
      if (action === "RESUME_TRADING") {
        state.settings.marketSessionMode = "CONTINUOUS_24_7";
        logActivity(state, "TRADING_RESUMED", "Reprise de la cotation continue sur les 8 marchés");
        saveStore(state);
        return { ok: true, message: "Cotation continue relancée." } as T;
      }
      if (action === "RESET_DEMO_PORTFOLIOS") {
        const cashCents = String(state.settings.defaultStartingCashMad * 100);
        for (const u of state.users) {
          u.cashCents = cashCents;
          u.positionsCount = 0;
        }
        logActivity(state, "PORTFOLIOS_RESET", `Tous les portefeuilles réinitialisés à ${state.settings.defaultStartingCashMad} MAD`);
        saveStore(state);
        return { ok: true, message: "Tous les portefeuilles étudiants ont été réinitialisés." } as T;
      }
      if (action === "FLUSH_API_CACHE") {
        logActivity(state, "CACHE_FLUSHED", "Cache des 8 routeurs Wassly API purgé");
        saveStore(state);
        return { ok: true, message: "Cache API purgé avec succès." } as T;
      }
      if (action === "RECOMPUTE_MARKS") {
        logActivity(state, "MARKS_RECOMPUTED", "Valorisation mark-to-market recalculée sur 110 instruments");
        saveStore(state);
        return { ok: true, message: "Valorisation mark-to-market recalculée sur 110 instruments." } as T;
      }
    }
  }

  return undefined as T;
}
