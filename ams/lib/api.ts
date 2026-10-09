/**
 * API client for AMS.
 *
 * AMS is a separate Next app from the platform it administers (it runs on 3001,
 * the main app on 3000), so it talks to the main app's `/api/admin/*` routes
 * over HTTP rather than importing its handlers.
 *
 * Every call goes through `request`, which turns a non-2xx response into a
 * thrown `ApiError` carrying the status and any message the server sent. That
 * is what lets a page distinguish "the request failed" from "the server
 * returned an empty list" — a distinction the previous implementation did not
 * make, so a failed dashboard request rendered as a dashboard full of zeroes.
 */

/**
 * Base URL of the main application.
 *
 * Defaults to the local development port. Set `NEXT_PUBLIC_MAIN_APP_URL` when
 * the platform is deployed somewhere else.
 */
const BASE_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL ?? "http://localhost:3000";

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
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
      // Admin data is per-user; never serve it from the HTTP cache.
      cache: "no-store",
    });
  } catch (cause) {
    // A network-level failure (server down, DNS, refused connection) reaches
    // here as a TypeError, which on its own tells an operator nothing.
    throw new ApiError(
      `Could not reach the platform at ${BASE_URL}. Check that it is running.`,
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

export interface AdminUser {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  status?: string;
  createdAt?: string;
}

export interface AdminEvent {
  id: string;
  title: string;
  startsAt: string;
  capacity?: number | null;
  registrationCount?: number | null;
  status?: string;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  category?: string;
  status?: string;
  updatedAt?: string;
}

export interface AdminCompetition {
  id: string;
  title: string;
  status?: string;
  startsAt?: string;
  participantCount?: number | null;
}

export interface AdminOrder {
  id: string;
  symbol: string;
  side: string;
  orderType: string;
  quantity: number | string;
  status: string;
  filledPriceCents?: string | number;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  type: string;
  description: string;
  timestamp: string;
}

export interface DashboardStats {
  totalUsers: number;
  activePortfolios: number;
  totalVolumeCents: bigint | string;
  activeCompetitions: number;
  pendingOrders: number;
  recentActivity: ActivityItem[];
}

/* -------------------------------------------------------------------------- */
/* Endpoints                                                                   */
/* -------------------------------------------------------------------------- */

export const api = {
  dashboard: () => request<DashboardStats>("/api/admin/dashboard"),
  users: () => request<AdminUser[]>("/api/admin/users"),
  events: () => request<AdminEvent[]>("/api/admin/events"),
  articles: () => request<AdminArticle[]>("/api/admin/articles"),
  competitions: () => request<AdminCompetition[]>("/api/admin/competitions"),
  orders: () => request<AdminOrder[]>("/api/admin/orders"),
};

/* -------------------------------------------------------------------------- */
/* Formatting                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Monetary values arrive as centimes, sometimes as a `bigint` and sometimes as
 * a string, because JSON has no integer type large enough to be safe. Both are
 * normalised here so no page has to think about it.
 */
export function formatMAD(cents: bigint | string | number | null | undefined): string {
  if (cents === null || cents === undefined) return "—";
  const value = typeof cents === "bigint" ? cents : BigInt(cents);
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