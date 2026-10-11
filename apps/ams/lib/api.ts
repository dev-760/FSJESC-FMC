/**
 * API client for AMS (`apps/ams/lib/api.ts`).
 *
 * AMS proxies `/api/*` to the landing app (see `next.config.ts` rewrites), so
 * every call uses a same-origin relative URL.
 *
 * Provides full read/write management methods for:
 * - Dashboard telemetry (`/api/admin/dashboard`)
 * - APIs, 8 Market Routers & 110 Instruments (`/api/admin/apis`)
 * - Users, Roles & Portfolios (`/api/admin/users`)
 * - Curriculum Articles & Content (`/api/admin/articles`)
 * - Club Events & Workshops (`/api/admin/events`)
 * - Trading Competitions (`/api/admin/competitions`)
 * - Orders & Risk Desk (`/api/admin/orders`)
 * - Platform Settings & Feature Flags (`/api/admin/settings`)
 * - System Health & Maintenance (`/api/admin/system`)
 */

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-ams-operator": "1",
        ...init?.headers,
      },
      credentials: "same-origin",
      cache: "no-store",
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(
      "Could not reach the platform API. Check that the landing app is running.",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(await readErrorMessage(response), response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string; message?: string };
    return body.error ?? body.message ?? `Request failed with status ${response.status}.`;
  } catch {
    return `Request failed with status ${response.status}.`;
  }
}

/* -------------------------------------------------------------------------- */
/* Domain types                                                                */
/* -------------------------------------------------------------------------- */

export type MarketCategoryId =
  | "ALL"
  | "CSE"
  | "STOCKS"
  | "ETFS"
  | "FUTURES"
  | "CRYPTO"
  | "FOREX"
  | "BONDS"
  | "OPTIONS";

export type MacroScenarioId =
  | "NORMAL"
  | "BAM_RATE_HIKE"
  | "LIQUIDITY_CRUNCH"
  | "DIRHAM_BAND_WIDENING"
  | "GLOBAL_RISK_OFF";

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  studentId?: string | null;
  track?: string | null;
  role: "STUDENT" | "MEMBER" | "EXECUTIVE" | "ADMINISTRATOR" | string;
  status?: "active" | "suspended" | "pending" | string;
  cashCents?: string;
  positionsCount?: number;
  ordersCount?: number;
  createdAt?: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  description?: string;
  location?: string;
  format?: "IN_PERSON" | "ONLINE" | "HYBRID";
  startsAt: string;
  endsAt?: string;
  capacity?: number | null;
  registrationCount?: number | null;
  status?: "scheduled" | "active" | "completed" | "cancelled" | string;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  category?: string;
  level?: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
  readingTimeMinutes?: number;
  summary?: string;
  content?: string;
  essential?: boolean;
  status?: "published" | "draft" | "archived" | string;
  updatedAt?: string;
}

export interface AdminCompetition {
  id: string;
  title: string;
  description?: string;
  startingCashCents?: string;
  status?: "DRAFT" | "OPEN" | "ACTIVE" | "COMPLETED" | "CANCELLED" | string;
  startsAt?: string;
  endsAt?: string;
  participantCount?: number | null;
  maxParticipants?: number;
  scenario?: string;
  allowedMarkets?: string[];
}

export interface AdminOrder {
  id: string;
  userEmail?: string;
  symbol: string;
  market?: MarketCategoryId;
  side: string;
  orderType: string;
  quantity: number | string;
  filledPriceCents?: string | number | null;
  limitPriceCents?: string | number | null;
  feeCents?: string | number;
  status: string;
  reason?: string | null;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  actor?: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  activePortfolios: number;
  totalVolumeCents: bigint | string;
  activeCompetitions: number;
  pendingOrders: number;
  tradableInstruments?: number;
  totalInstruments?: number;
  healthyRouters?: number;
  totalRouters?: number;
  marketApiUrl?: string;
  activeScenario?: string;
  marketSessionMode?: string;
  recentActivity: ActivityItem[];
}

export interface AdminSystemStatus {
  database: "healthy" | "degraded" | "down";
  marketEngine: "healthy" | "degraded" | "down";
  apiGateway?: "healthy" | "degraded" | "down";
  marketApiUrl?: string;
  activeScenario?: string;
  marketSessionMode?: string;
  enabledRouters?: number;
  totalRouters?: number;
  tradableInstruments?: number;
  totalInstruments?: number;
  uptime: number;
  version: string;
  lastMigration: string;
}

export interface AdminApiRouter {
  id: MarketCategoryId;
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

export interface AdminMarketInstrument {
  ticker: string;
  name: string;
  market: MarketCategoryId;
  sector: string;
  currency: string;
  exchange: string;
  startingPriceCents: number;
  annualDrift: number;
  annualVolatility: number;
  averageDailyVolume: number;
  description: string;
  apiEndpoint: string;
  compartment?: string;
  isin?: string;
  tradable: boolean;
  featured: boolean;
  marginEligible: boolean;
  maxOrderQuantity: number;
}

export interface AdminApisPayload {
  gateway: {
    baseUrl: string;
    apiKeyConfigured: boolean;
    timeoutMs: number;
    enableLiveReferenceFeed: boolean;
    syncReferencePricesToEngine: boolean;
    activeScenario: MacroScenarioId;
    marketSessionMode: "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED";
  };
  routers: AdminApiRouter[];
  marketSummary: Array<{
    id: MarketCategoryId;
    label: string;
    shortLabel: string;
    badge: string;
    description: string;
    apiRouter: string;
    totalCount: number;
    tradableCount: number;
    featuredCount: number;
  }>;
  instruments: AdminMarketInstrument[];
}

export interface ApiProbeResult {
  ok: boolean;
  status: number;
  latencyMs: number;
  url: string;
  source: "LIVE_UPSTREAM" | "SIMULATED_FALLBACK";
  payload: unknown;
}

export interface PlatformSettings {
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

  defaultStartingCashMad: number;
  commissionBps: number;
  minCommissionMad: number;
  slippageBps: number;
  settlementRegime: "T+0" | "T+1" | "T+2";
  allowShortSelling: boolean;
  allowFractionalCrypto: boolean;
  maxSinglePositionPct: number;
  marketSessionMode: "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED";
  activeScenario: MacroScenarioId;

  marketApiUrl: string;
  marketApiKeyConfigured: boolean;
  marketApiTimeoutMs: number;
  enableLiveReferenceFeed: boolean;
  syncReferencePricesToEngine: boolean;
  cseCacheTtlSeconds: number;
  globalQuotesCacheTtlSeconds: number;
  rateLimitPerMinute: number;

  enableSimulator: boolean;
  enableCompetitions: boolean;
  enableChallenges: boolean;
  enableEducationLibrary: boolean;
  enableEventsRegistration: boolean;
  enableLiveTicker: boolean;
  enableOptionsChain: boolean;
  enableYieldCurve: boolean;
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                   */
/* -------------------------------------------------------------------------- */

export const api = {
  // Dashboard
  dashboard: (signal?: AbortSignal) => request<DashboardStats>("/api/admin/dashboard", { signal }),

  // APIs & Markets Gateway
  apis: (signal?: AbortSignal) => request<AdminApisPayload>("/api/admin/apis", { signal }),
  updateApiRouter: (data: {
    routerId: string;
    enabled?: boolean;
    cacheTtlSeconds?: number;
    rateLimitPerMin?: number;
  }) =>
    request<{ ok: boolean; router: AdminApiRouter }>("/api/admin/apis", {
      method: "PATCH",
      body: JSON.stringify({ target: "router", ...data }),
    }),
  updateInstrument: (data: {
    ticker: string;
    tradable?: boolean;
    featured?: boolean;
    annualDrift?: number;
    annualVolatility?: number;
    startingPriceCents?: number;
    maxOrderQuantity?: number;
  }) =>
    request<{ ok: boolean; instrument: AdminMarketInstrument }>("/api/admin/apis", {
      method: "PATCH",
      body: JSON.stringify({ target: "instrument", ...data }),
    }),
  bulkToggleMarket: (market: string, tradable: boolean) =>
    request<{ ok: boolean; updatedCount: number }>("/api/admin/apis", {
      method: "PATCH",
      body: JSON.stringify({ target: "bulk_market", market, tradable }),
    }),
  setMacroScenario: (scenario: MacroScenarioId) =>
    request<{ ok: boolean; activeScenario: MacroScenarioId }>("/api/admin/apis", {
      method: "PATCH",
      body: JSON.stringify({ target: "scenario", scenario }),
    }),
  updateGateway: (data: {
    marketApiUrl?: string;
    enableLiveReferenceFeed?: boolean;
    syncReferencePricesToEngine?: boolean;
    marketSessionMode?: "CONTINUOUS_24_7" | "CASABLANCA_HOURS" | "HALTED";
  }) =>
    request<{ ok: boolean }>("/api/admin/apis", {
      method: "PATCH",
      body: JSON.stringify({ target: "gateway", ...data }),
    }),
  probeEndpoint: (endpoint: string) =>
    request<ApiProbeResult>("/api/admin/apis", {
      method: "POST",
      body: JSON.stringify({ action: "PROBE", endpoint }),
    }),
  syncAllRouters: () =>
    request<{ ok: boolean; liveHealthy: boolean; latencyMs: number; routers: AdminApiRouter[] }>(
      "/api/admin/apis",
      {
        method: "POST",
        body: JSON.stringify({ action: "SYNC_ALL" }),
      },
    ),

  // Users & Portfolios
  users: (signal?: AbortSignal) => request<AdminUser[]>("/api/admin/users", { signal }),
  createUser: (data: {
    email: string;
    name?: string;
    studentId?: string;
    track?: string;
    role?: string;
    startingCashMad?: number;
  }) =>
    request<AdminUser>("/api/admin/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateUser: (data: {
    id: string;
    role?: string;
    status?: string;
    name?: string;
    track?: string;
    portfolioAction?: "RESET_100K" | "CREDIT_CASH";
    creditAmountMad?: number;
  }) =>
    request<AdminUser>("/api/admin/users", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteUser: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/users?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Events
  events: (signal?: AbortSignal) => request<AdminEvent[]>("/api/admin/events", { signal }),
  createEvent: (data: {
    title: string;
    description?: string;
    location?: string;
    format?: "IN_PERSON" | "ONLINE" | "HYBRID";
    startsAt?: string;
    capacity?: number;
  }) =>
    request<AdminEvent>("/api/admin/events", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateEvent: (data: Partial<AdminEvent> & { id: string }) =>
    request<AdminEvent>("/api/admin/events", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteEvent: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/events?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Articles
  articles: (signal?: AbortSignal) => request<AdminArticle[]>("/api/admin/articles", { signal }),
  createArticle: (data: {
    title: string;
    slug?: string;
    category?: string;
    level?: "FOUNDATION" | "INTERMEDIATE" | "ADVANCED";
    readingTimeMinutes?: number;
    summary?: string;
    content?: string;
    essential?: boolean;
    status?: "published" | "draft";
  }) =>
    request<AdminArticle>("/api/admin/articles", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateArticle: (data: Partial<AdminArticle> & { id: string }) =>
    request<AdminArticle>("/api/admin/articles", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteArticle: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/articles?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Competitions
  competitions: (signal?: AbortSignal) =>
    request<AdminCompetition[]>("/api/admin/competitions", { signal }),
  createCompetition: (data: {
    title: string;
    description?: string;
    startingCashMad?: number;
    status?: string;
    startsAt?: string;
    endsAt?: string;
    maxParticipants?: number;
    scenario?: string;
    allowedMarkets?: string[];
  }) =>
    request<AdminCompetition>("/api/admin/competitions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCompetition: (
    data: Partial<AdminCompetition> & { id: string; startingCashMad?: number },
  ) =>
    request<AdminCompetition>("/api/admin/competitions", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCompetition: (id: string) =>
    request<{ ok: boolean }>(`/api/admin/competitions?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  // Orders & Risk Desk
  orders: (signal?: AbortSignal) => request<AdminOrder[]>("/api/admin/orders", { signal }),
  createOrder: (data: {
    symbol: string;
    side: "BUY" | "SELL";
    orderType: "MARKET" | "LIMIT";
    quantity: number;
    limitPriceMad?: number;
  }) =>
    request<AdminOrder>("/api/admin/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateOrder: (data: { id: string; status: string; reason?: string }) =>
    request<AdminOrder>("/api/admin/orders", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  // Settings
  settings: (signal?: AbortSignal) => request<PlatformSettings>("/api/admin/settings", { signal }),
  updateSettings: (updates: Partial<PlatformSettings>) =>
    request<PlatformSettings>("/api/admin/settings", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // System Health & Maintenance
  system: (signal?: AbortSignal) => request<AdminSystemStatus>("/api/admin/system", { signal }),
  runSystemAction: (
    action:
      | "RECOMPUTE_MARKS"
      | "FLUSH_API_CACHE"
      | "RESET_DEMO_PORTFOLIOS"
      | "HALT_TRADING"
      | "RESUME_TRADING",
  ) =>
    request<{ ok: boolean; message: string }>("/api/admin/system", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

export function formatMAD(cents: bigint | string | number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  const value = typeof cents === "bigint" ? cents : BigInt(Math.round(Number(cents)));
  return new Intl.NumberFormat("fr-MA", {
    style: "currency",
    currency: "MAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) / 100);
}

export function formatDateTime(value: string | number | Date): string {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}

export function formatDate(value: string | number | Date): string {
  return new Intl.DateTimeFormat("fr-MA", {
    dateStyle: "medium",
    timeZone: "Africa/Casablanca",
  }).format(new Date(value));
}

export function formatCount(value: number | bigint | string): string {
  return new Intl.NumberFormat("fr-MA", { maximumFractionDigits: 0 }).format(Number(value));
}