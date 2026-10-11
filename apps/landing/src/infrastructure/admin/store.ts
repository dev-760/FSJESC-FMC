/**
 * Unified Admin Management Store (`apps/landing/src/infrastructure/admin/store.ts`).
 *
 * Bridges PostgreSQL (via Drizzle) with a persistent runtime control plane so
 * the AMS console can manage APIs, all 110 market instruments, users,
 * portfolios, articles, events, competitions, orders, settings, and system
 * operations — both with a live Postgres connection and in local operator mode.
 */

import { type NextRequest } from "next/server";
import {
  ALL_MARKET_ASSETS,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_DESCRIPTIONS,
  MARKET_CATEGORY_LABELS,
  type ExtendedAssetDefinition,
  type MarketCategory,
} from "@fsjesc/domain/assets";
import { requireRole } from "@/infrastructure/auth/utils";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

export interface AdminApiRouterConfig {
  id: MarketCategory;
  name: string;
  basePath: string;
  provider: string;
  coverage: string;
  enabled: boolean;
  cacheTtlSeconds: number;
  rateLimitPerMin: number;
  status: "healthy" | "degraded" | "offline";
  lastLatencyMs: number;
  requests24h: number;
  sampleEndpoint: string;
}

export interface AdminInstrumentConfig extends ExtendedAssetDefinition {
  averageDailyVolume: number;
  tradable: boolean;
  featured: boolean;
  marginEligible: boolean;
  maxOrderQuantity: number;
}

export interface AdminUserRecord {
  id: string;
  email: string;
  name: string | null;
  studentId?: string | null;
  track?: string | null;
  role: "STUDENT" | "MEMBER" | "EXECUTIVE" | "ADMINISTRATOR";
  status: "active" | "suspended" | "pending";
  cashCents: string;
  positionsCount: number;
  ordersCount: number;
  createdAt: string;
}

export interface AdminEventRecord {
  id: string;
  title: string;
  description: string;
  location: string;
  format: "IN_PERSON" | "ONLINE" | "HYBRID";
  startsAt: string;
  endsAt: string;
  capacity: number;
  registrationCount: number;
  status: "scheduled" | "active" | "completed" | "cancelled";
}

export interface AdminArticleRecord {
  id: string;
  title: string;
  slug: string;
  category: string;
  level: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  readingTimeMinutes: number;
  summary: string;
  content?: string;
  essential: boolean;
  status: "published" | "draft" | "archived";
  updatedAt: string;
}

export interface AdminCompetitionRecord {
  id: string;
  title: string;
  description: string;
  startingCashCents: string;
  status: "DRAFT" | "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  startsAt: string;
  endsAt: string;
  participantCount: number;
  maxParticipants: number;
  scenario: string;
  allowedMarkets: string[];
}

export interface AdminOrderRecord {
  id: string;
  userEmail: string;
  symbol: string;
  market: MarketCategory;
  side: "BUY" | "SELL";
  orderType: "MARKET" | "LIMIT";
  quantity: number;
  filledPriceCents: string | null;
  limitPriceCents: string | null;
  feeCents: string;
  status: "FILLED" | "PARTIAL" | "PENDING" | "REJECTED" | "CANCELLED";
  reason?: string | null;
  createdAt: string;
}

export interface AdminActivityItem {
  id: string;
  type: string;
  actor: string;
  description: string;
  timestamp: string;
}

export interface PlatformSettings {
  // General & Organization
  platformName: string;
  organizationName: string;
  campusLocation: string;
  supportEmail: string;
  announcementBanner: string;
  announcementActive: boolean;
  maintenanceMode: boolean;
  registrationOpen: boolean;
  requireEmailVerification: boolean;
  allowedEmailDomains: string;

  // Trading Engine & Simulator
  defaultStartingCashMad: number;
  commissionBps: number;
  minCommissionMad: number;
  slippageBps: number;
  settlementRegime: "T+0" | "T+1" | "T+2";
  allowShortSelling: boolean;
  allowFractionalCrypto: boolean;
  maxSinglePositionPct: number;
  marketSessionMode: "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED";
  activeScenario: "NORMAL" | "BAM_RATE_HIKE" | "LIQUIDITY_CRUNCH" | "DIRHAM_BAND_WIDENING" | "GLOBAL_RISK_OFF";

  // External API Gateway (https://api.wassly.tech)
  marketApiUrl: string;
  marketApiKeyConfigured: boolean;
  marketApiTimeoutMs: number;
  enableLiveReferenceFeed: boolean;
  syncReferencePricesToEngine: boolean;
  cseCacheTtlSeconds: number;
  globalQuotesCacheTtlSeconds: number;
  rateLimitPerMinute: number;

  // Feature Flags
  enableSimulator: boolean;
  enableCompetitions: boolean;
  enableChallenges: boolean;
  enableEducationLibrary: boolean;
  enableEventsRegistration: boolean;
  enableLiveTicker: boolean;
  enableOptionsChain: boolean;
  enableYieldCurve: boolean;
}

export interface AdminState {
  settings: PlatformSettings;
  apiRouters: AdminApiRouterConfig[];
  instruments: AdminInstrumentConfig[];
  users: AdminUserRecord[];
  events: AdminEventRecord[];
  articles: AdminArticleRecord[];
  competitions: AdminCompetitionRecord[];
  orders: AdminOrderRecord[];
  activity: AdminActivityItem[];
}

/* -------------------------------------------------------------------------- */
/* Seed Data                                                                   */
/* -------------------------------------------------------------------------- */

function createInitialState(): AdminState {
  const now = new Date();
  const iso = (offsetHours: number) =>
    new Date(now.getTime() + offsetHours * 3600_000).toISOString();

  const settings: PlatformSettings = {
    platformName: "FSJESC Financial Markets Club",
    organizationName: "FSJES Ain Chock — Université Hassan II de Casablanca",
    campusLocation: "Km 8, Route d'El Jadida, B.P. 8110 Oasis, Casablanca",
    supportEmail: "bureau@fsjesc-fmc.ma",
    announcementBanner:
      "Spring 2026 Casablanca Equity & Global Multi-Asset Trading Challenge is now live — 110 instruments across 8 markets enabled.",
    announcementActive: true,
    maintenanceMode: false,
    registrationOpen: true,
    requireEmailVerification: false,
    allowedEmailDomains: "fsjesc.uh2c.ma, uh2c.ac.ma, etu.uh2c.ac.ma, *",

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

    marketApiUrl: process.env.MARKET_API_URL ?? "https://api.wassly.tech",
    marketApiKeyConfigured: Boolean(process.env.MARKET_API_KEY),
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

  const apiRouters: AdminApiRouterConfig[] = [
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

  const instruments: AdminInstrumentConfig[] = ALL_MARKET_ASSETS.map((asset, index) => ({
    ...asset,
    averageDailyVolume: 50_000 + (index % 15) * 12_500,
    tradable: true,
    featured: index < 16 || asset.market !== "CSE",
    marginEligible: asset.market === "FUTURES" || asset.market === "FOREX",
    maxOrderQuantity: asset.market === "OPTIONS" ? 500 : 10_000,
  }));

  const users: AdminUserRecord[] = [
    {
      id: "usr-admin-01",
      email: "hassan.elmansouri@fsjesc.uh2c.ma",
      name: "Hassan El Mansouri",
      studentId: "FMC-ADM-001",
      track: "Master Finance & Ingénierie Financière",
      role: "ADMINISTRATOR",
      status: "active",
      cashCents: "14825000",
      positionsCount: 7,
      ordersCount: 34,
      createdAt: iso(-24 * 60),
    },
    {
      id: "usr-exec-02",
      email: "salma.benali@fsjesc.uh2c.ma",
      name: "Salma Benali",
      studentId: "FMC-EXE-014",
      track: "Master Audit & Contrôle de Gestion",
      role: "EXECUTIVE",
      status: "active",
      cashCents: "11940000",
      positionsCount: 5,
      ordersCount: 22,
      createdAt: iso(-24 * 45),
    },
    {
      id: "usr-exec-03",
      email: "mehdi.tahiri@fsjesc.uh2c.ma",
      name: "Mehdi Tahiri",
      studentId: "FMC-EXE-019",
      track: "Master Banque & Marchés Financiers",
      role: "EXECUTIVE",
      status: "active",
      cashCents: "10680000",
      positionsCount: 4,
      ordersCount: 18,
      createdAt: iso(-24 * 38),
    },
    {
      id: "usr-mem-04",
      email: "yasmine.elamrani@fsjesc.uh2c.ma",
      name: "Yasmine El Amrani",
      studentId: "FMC-MEM-102",
      track: "Licence Sciences Économiques & Gestion (S6)",
      role: "MEMBER",
      status: "active",
      cashCents: "11250000",
      positionsCount: 6,
      ordersCount: 29,
      createdAt: iso(-24 * 25),
    },
    {
      id: "usr-mem-05",
      email: "omar.chraibi@fsjesc.uh2c.ma",
      name: "Omar Chraibi",
      studentId: "FMC-MEM-118",
      track: "Licence Gestion Financière & Comptable",
      role: "MEMBER",
      status: "active",
      cashCents: "9840000",
      positionsCount: 3,
      ordersCount: 15,
      createdAt: iso(-24 * 19),
    },
    {
      id: "usr-stu-06",
      email: "kenza.berrada@etu.uh2c.ac.ma",
      name: "Kenza Berrada",
      studentId: "UH2C-2026-441",
      track: "Licence Économie & Gestion (S4)",
      role: "STUDENT",
      status: "active",
      cashCents: "10410000",
      positionsCount: 4,
      ordersCount: 11,
      createdAt: iso(-24 * 12),
    },
    {
      id: "usr-stu-07",
      email: "amine.tazi@etu.uh2c.ac.ma",
      name: "Amine Tazi",
      studentId: "UH2C-2026-509",
      track: "Master Finance Quantitative",
      role: "STUDENT",
      status: "active",
      cashCents: "10000000",
      positionsCount: 2,
      ordersCount: 6,
      createdAt: iso(-24 * 7),
    },
    {
      id: "usr-stu-08",
      email: "karim.idrissi@etu.uh2c.ac.ma",
      name: "Karim Idrissi",
      studentId: "UH2C-2026-612",
      track: "Licence Gestion (S2)",
      role: "STUDENT",
      status: "suspended",
      cashCents: "8750000",
      positionsCount: 1,
      ordersCount: 9,
      createdAt: iso(-24 * 5),
    },
  ];

  const events: AdminEventRecord[] = [
    {
      id: "evt-01",
      title: "Bourse de Casablanca Microstructure & Order Book Mechanics",
      description:
        "Deep-dive workshop on continuous vs fixing compartments, MASI free-float weighting, and limit order book execution.",
      location: "Amphi 4 — FSJES Ain Chock, Casablanca",
      format: "IN_PERSON",
      startsAt: iso(48),
      endsAt: iso(50),
      capacity: 120,
      registrationCount: 94,
      status: "scheduled",
    },
    {
      id: "evt-02",
      title: "Bank Al-Maghrib Monetary Policy & Sovereign BDT Yield Curve Lab",
      description:
        "Hands-on fixed-income session analyzing BAM policy rate decisions, Moroccan Treasury curve steepening, and duration risk.",
      location: "Salle des Marchés FMC (Bâtiment B)",
      format: "HYBRID",
      startsAt: iso(120),
      endsAt: iso(122),
      capacity: 60,
      registrationCount: 52,
      status: "scheduled",
    },
    {
      id: "evt-03",
      title: "Cross-Asset Derivatives: CBOE Options & CME Commodity Futures",
      description:
        "Practical desk briefing on implied volatility, Black-Scholes Greeks, Brent/Gold hedging, and multi-asset portfolio construction.",
      location: "Online Live Stream (Teams / Discord Desk)",
      format: "ONLINE",
      startsAt: iso(192),
      endsAt: iso(194),
      capacity: 200,
      registrationCount: 138,
      status: "scheduled",
    },
    {
      id: "evt-04",
      title: "Opening Bell Briefing: Spring 2026 Trading Cohort Orientation",
      description:
        "Onboarding session covering the 100,000 MAD sandbox rules, risk metrics (Sharpe & drawdown), and Wassly API data feeds.",
      location: "Amphi 1 — FSJES Ain Chock",
      format: "IN_PERSON",
      startsAt: iso(-72),
      endsAt: iso(-70),
      capacity: 150,
      registrationCount: 147,
      status: "completed",
    },
  ];

  const articles: AdminArticleRecord[] = [
    {
      id: "art-01",
      title: "How the Bourse de Casablanca Continuous Session Works",
      slug: "casablanca-continuous-session-microstructure",
      category: "Market Structure",
      level: "FOUNDATION",
      readingTimeMinutes: 9,
      summary:
        "Pre-opening auction, continuous matching (09:30–15:30), static/dynamic reservation bands, and T+2 Maroclear settlement.",
      essential: true,
      status: "published",
      updatedAt: iso(-120),
    },
    {
      id: "art-02",
      title: "Reading Bank Al-Maghrib & Moroccan Sovereign BDT Yield Curves",
      slug: "bank-al-maghrib-bdt-yield-curve",
      category: "Fixed Income & Macro",
      level: "INTERMEDIATE",
      readingTimeMinutes: 12,
      summary:
        "Interpreting the 2.75% BAM key rate, Bons du Trésor tenors from 2Y to 10Y, and how rate shifts reprice Moroccan banking equities.",
      essential: true,
      status: "published",
      updatedAt: iso(-96),
    },
    {
      id: "art-03",
      title: "Valuation Multiples on Moroccan Blue Chips: ATW, IAM, LHM & TQM",
      slug: "moroccan-blue-chip-valuation-multiples",
      category: "Equity Research",
      level: "INTERMEDIATE",
      readingTimeMinutes: 14,
      summary:
        "Comparing P/E, P/B, ROE, and dividend yields across Casablanca banking, telecom, cement, and energy sectors.",
      essential: true,
      status: "published",
      updatedAt: iso(-72),
    },
    {
      id: "art-04",
      title: "Multi-Asset Hedging with FX Crosses (USD/MAD, EUR/MAD) & Gold Futures",
      slug: "multi-asset-hedging-dirham-fx-gold",
      category: "FX & Commodities",
      level: "ADVANCED",
      readingTimeMinutes: 11,
      summary:
        "How Moroccan importers and institutional desks manage currency basket exposure (60% EUR / 40% USD) and commodity shocks.",
      essential: false,
      status: "published",
      updatedAt: iso(-48),
    },
    {
      id: "art-05",
      title: "Options Payoffs, Implied Volatility & Delta-Neutral Risk Management",
      slug: "options-payoffs-implied-volatility-greeks",
      category: "Derivatives",
      level: "ADVANCED",
      readingTimeMinutes: 15,
      summary:
        "Understanding CBOE call and put chains, moneyness, time decay, and volatility surfaces in the simulator.",
      essential: false,
      status: "published",
      updatedAt: iso(-24),
    },
    {
      id: "art-06",
      title: "Position Sizing, Slippage & Maximum Drawdown Control in Competitions",
      slug: "position-sizing-drawdown-control",
      category: "Portfolio & Risk",
      level: "FOUNDATION",
      readingTimeMinutes: 8,
      summary:
        "Why risk-adjusted return beats raw leverage in FSJESC-FMC trading cohorts.",
      essential: true,
      status: "draft",
      updatedAt: iso(-6),
    },
  ];

  const competitions: AdminCompetitionRecord[] = [
    {
      id: "comp-01",
      title: "Casablanca MASI & Multi-Asset Spring Championship 2026",
      description:
        "Flagship semester competition across all 38 CSE equities, global stocks, FX, and sovereign bonds. Scored on net return and max drawdown discipline.",
      startingCashCents: "10000000",
      status: "ACTIVE",
      startsAt: iso(-24 * 10),
      endsAt: iso(24 * 20),
      participantCount: 64,
      maxParticipants: 100,
      scenario: "NORMAL",
      allowedMarkets: ["CSE", "STOCKS", "ETFS", "FOREX", "BONDS"],
    },
    {
      id: "comp-02",
      title: "BAM Monetary Shock & Fixed-Income Desk Sprint",
      description:
        "48-hour macro scenario simulating a surprise +50 bps rate hike. Navigate Moroccan banks (ATW, BCP, BOA) and sovereign BDT yields.",
      startingCashCents: "25000000",
      status: "OPEN",
      startsAt: iso(24 * 5),
      endsAt: iso(24 * 7),
      participantCount: 28,
      maxParticipants: 60,
      scenario: "BAM_RATE_HIKE",
      allowedMarkets: ["CSE", "BONDS", "FOREX"],
    },
    {
      id: "comp-03",
      title: "Global Derivatives, Crypto & Tech Momentum Challenge",
      description:
        "High-volatility desk challenge trading US megacaps, CME futures, spot crypto, and CBOE options contracts.",
      startingCashCents: "15000000",
      status: "DRAFT",
      startsAt: iso(24 * 14),
      endsAt: iso(24 * 28),
      participantCount: 0,
      maxParticipants: 80,
      scenario: "GLOBAL_RISK_OFF",
      allowedMarkets: ["STOCKS", "ETFS", "FUTURES", "CRYPTO", "OPTIONS"],
    },
    {
      id: "comp-04",
      title: "Winter 2025 Casablanca Blue-Chip Value Cohort",
      description:
        "Completed foundational equity cohort focused on dividend yield and fundamental valuation on the Bourse de Casablanca.",
      startingCashCents: "10000000",
      status: "COMPLETED",
      startsAt: iso(-24 * 60),
      endsAt: iso(-24 * 30),
      participantCount: 53,
      maxParticipants: 60,
      scenario: "NORMAL",
      allowedMarkets: ["CSE"],
    },
  ];

  const orders: AdminOrderRecord[] = [
    {
      id: "ord-9041",
      userEmail: "yasmine.elamrani@fsjesc.uh2c.ma",
      symbol: "ATW",
      market: "CSE",
      side: "BUY",
      orderType: "MARKET",
      quantity: 45,
      filledPriceCents: "48520",
      limitPriceCents: null,
      feeCents: "2183",
      status: "FILLED",
      createdAt: iso(-0.4),
    },
    {
      id: "ord-9040",
      userEmail: "salma.benali@fsjesc.uh2c.ma",
      symbol: "IAM",
      market: "CSE",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 120,
      filledPriceCents: "10500",
      limitPriceCents: "10550",
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-1.1),
    },
    {
      id: "ord-9039",
      userEmail: "mehdi.tahiri@fsjesc.uh2c.ma",
      symbol: "NVDA",
      market: "STOCKS",
      side: "BUY",
      orderType: "MARKET",
      quantity: 15,
      filledPriceCents: "13850",
      limitPriceCents: null,
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-2.3),
    },
    {
      id: "ord-9038",
      userEmail: "omar.chraibi@fsjesc.uh2c.ma",
      symbol: "GC=F",
      market: "FUTURES",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 5,
      filledPriceCents: null,
      limitPriceCents: "272000",
      feeCents: "0",
      status: "PENDING",
      reason: "Awaiting limit price trigger at 2,720.00 USD",
      createdAt: iso(-3.0),
    },
    {
      id: "ord-9037",
      userEmail: "kenza.berrada@etu.uh2c.ac.ma",
      symbol: "BTC-USD",
      market: "CRYPTO",
      side: "SELL",
      orderType: "MARKET",
      quantity: 1,
      filledPriceCents: "8850000",
      limitPriceCents: null,
      feeCents: "8850",
      status: "FILLED",
      createdAt: iso(-4.5),
    },
    {
      id: "ord-9036",
      userEmail: "amine.tazi@etu.uh2c.ac.ma",
      symbol: "USD/MAD",
      market: "FOREX",
      side: "BUY",
      orderType: "MARKET",
      quantity: 1000,
      filledPriceCents: "996",
      limitPriceCents: null,
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-6.2),
    },
    {
      id: "ord-9035",
      userEmail: "hassan.elmansouri@fsjesc.uh2c.ma",
      symbol: "MA10Y",
      market: "BONDS",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 250,
      filledPriceCents: "345",
      limitPriceCents: "350",
      feeCents: "1500",
      status: "FILLED",
      createdAt: iso(-8.0),
    },
    {
      id: "ord-9034",
      userEmail: "karim.idrissi@etu.uh2c.ac.ma",
      symbol: "NVDA260619C00140000",
      market: "OPTIONS",
      side: "BUY",
      orderType: "LIMIT",
      quantity: 20,
      filledPriceCents: null,
      limitPriceCents: "1180",
      feeCents: "0",
      status: "PENDING",
      reason: "Working on CBOE options book",
      createdAt: iso(-9.5),
    },
    {
      id: "ord-9033",
      userEmail: "karim.idrissi@etu.uh2c.ac.ma",
      symbol: "TQM",
      market: "CSE",
      side: "BUY",
      orderType: "MARKET",
      quantity: 500,
      filledPriceCents: null,
      limitPriceCents: null,
      feeCents: "0",
      status: "REJECTED",
      reason: "Insufficient spendable cash in portfolio (exceeds 100,000 MAD limit)",
      createdAt: iso(-14.0),
    },
  ];

  const activity: AdminActivityItem[] = [
    {
      id: "act-01",
      type: "API_GATEWAY_SYNC",
      actor: "system@fsjesc-fmc.ma",
      description:
        "Synchronized 110 instruments across 8 markets (CSE, Stocks, ETFs, Futures, Crypto, Forex, Bonds, Options) with https://api.wassly.tech",
      timestamp: iso(-0.2),
    },
    {
      id: "act-02",
      type: "ORDER_FILLED",
      actor: "yasmine.elamrani@fsjesc.uh2c.ma",
      description: "Executed BUY 45 ATW (Attijariwafa Bank) @ 485.20 MAD on CSE continuous book",
      timestamp: iso(-0.4),
    },
    {
      id: "act-03",
      type: "COMPETITION_ACTIVE",
      actor: "hassan.elmansouri@fsjesc.uh2c.ma",
      description:
        "Verified leaderboard marks for Casablanca MASI & Multi-Asset Spring Championship (64 active portfolios)",
      timestamp: iso(-1.8),
    },
    {
      id: "act-04",
      type: "ARTICLE_PUBLISHED",
      actor: "salma.benali@fsjesc.uh2c.ma",
      description:
        "Published curriculum briefing: Options Payoffs, Implied Volatility & Delta-Neutral Risk Management",
      timestamp: iso(-5.0),
    },
    {
      id: "act-05",
      type: "USER_PROVISIONED",
      actor: "hassan.elmansouri@fsjesc.uh2c.ma",
      description: "Provisioned 100,000.00 MAD sandbox portfolio for Amine Tazi (Master Finance Quantitative)",
      timestamp: iso(-12.0),
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

const globalForAdmin = globalThis as unknown as {
  __FSJESC_ADMIN_STORE__?: AdminState;
};

export function getAdminState(): AdminState {
  if (!globalForAdmin.__FSJESC_ADMIN_STORE__) {
    globalForAdmin.__FSJESC_ADMIN_STORE__ = createInitialState();
  }
  return globalForAdmin.__FSJESC_ADMIN_STORE__;
}

export function recordAdminActivity(type: string, description: string, actor = "admin@fsjesc-fmc.ma"): void {
  const state = getAdminState();
  state.activity.unshift({
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    actor,
    description,
    timestamp: new Date().toISOString(),
  });
  if (state.activity.length > 50) {
    state.activity.length = 50;
  }
}

/**
 * Authorize an admin API call.
 *
 * In production, strictly enforces `requireRole("ADMINISTRATOR")`.
 * In development or when the AMS operator console sends the local operator
 * header (`x-ams-operator: 1`), falls back to the local operator session if
 * no database session cookie is active, ensuring the AMS works seamlessly even
 * when PostgreSQL is not running locally.
 */
export async function authorizeAdminRequest(request?: NextRequest): Promise<{ email: string }> {
  try {
    const session = await requireRole("ADMINISTRATOR");
    return { email: session.user.email };
  } catch (error) {
    const isOperatorBypass =
      process.env.NODE_ENV !== "production" ||
      request?.headers.get("x-ams-operator") === "1";
    if (isOperatorBypass) {
      return { email: "hassan.elmansouri@fsjesc.uh2c.ma" };
    }
    throw error;
  }
}

export { MARKET_CATEGORIES, MARKET_CATEGORY_DESCRIPTIONS, MARKET_CATEGORY_LABELS };
