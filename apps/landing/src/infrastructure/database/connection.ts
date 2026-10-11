/**
 * Database connection (Part 4.1, N1).
 *
 * Wraps the postgres.js driver with Drizzle ORM. Connection is pooled and
 * reused across requests in development; in production with serverless, a
 * connection per request is the pattern.
 *
 * Money values are returned as strings from NUMERIC columns to preserve
 * precision (D3). They are converted to bigint centimes at the boundary.
 *
 * Supabase compatibility
 * ----------------------
 * `DATABASE_URL` may point at either a local Postgres (docker-compose) or a
 * Supabase project. Two settings matter and are easy to get wrong:
 *
 * 1. Prepared statements. Supabase's connection pooler on port 6543 runs
 *    PgBouncer in *transaction* mode, which does not support prepared
 *    statements — postgres.js would fail with "prepared statement already
 *    exists" or a missing-portal error on every reused connection. Prepared
 *    statements are therefore disabled unless explicitly re-enabled, which is
 *    safe for both a local database and a pooler.
 *
 * 2. Pool size. Supabase caps concurrent connections per project (tighter on
 *    the free tier), so the pool ceiling is configurable and defaults below the
 *    local-development value rather than assuming either.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** True when the URL points at a hosted Supabase Postgres. */
function isSupabaseHost(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith(".supabase.co") || host.endsWith(".pooler.supabase.com");
  } catch {
    return false;
  }
}

/** Shared across the pooled and serverless connections so both behave alike. */
function connectionOptions(url: string) {
  return {
    /**
     * Required for Supabase's transaction-mode pooler (port 6543). Costs a
     * little per-query overhead and buys compatibility with both.
     */
    prepare: process.env.DATABASE_PREPARE === "true",
    /**
     * Supabase requires TLS. A local Postgres in docker-compose does not offer
     * it, so this is decided per host rather than forced globally — forcing it
     * would break local development, which is the default configuration.
     */
    ssl:
      process.env.DATABASE_SSL === "disable"
        ? false
        : process.env.DATABASE_SSL === "require"
          ? "require"
          : isSupabaseHost(url)
            ? "require"
            : false,
    connect_timeout: 10,
  } as const;
}

/**
 * Pool ceiling. Defaults to 5 so a Supabase free-tier project is not
 * exhausted by a single Next instance; the local database tolerates far more.
 */
function poolMax(): number {
  const configured = Number.parseInt(process.env.DATABASE_POOL_MAX ?? "", 10);
  return Number.isFinite(configured) && configured > 0 ? configured : 5;
}

/**
 * Connection pool for development. In serverless production, this should be
 * a single connection per request to avoid connection exhaustion.
 */
let pool: postgres.Sql | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

/**
 * Get or create the database connection.
 *
 * In development, this reuses a single pooled connection. In production with
 * serverless, each invocation gets its own connection.
 */
export function getConnection() {
  const url = databaseUrl();

  pool ??= postgres(url, {
    ...connectionOptions(url),
    max: poolMax(),
    idle_timeout: 20,
  });

  return pool;
}

type Database = ReturnType<typeof createDrizzle>;

function createDrizzle() {
  return drizzle(getConnection(), { schema });
}

let dbInstance: Database | null = null;

export function getDb(): Database {
  dbInstance ??= createDrizzle();
  return dbInstance;
}

/**
 * Drizzle database instance.
 *
 * Lazily initialised on first property access so importing this module during
 * Next.js build-time route config collection ("Collecting page data") does not
 * eagerly invoke `getConnection()` before runtime requests arrive.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, prop, receiver) {
    const instance = getDb();
    const value = Reflect.get(instance, prop, receiver);
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

/**
 * Close the connection pool. Call this in tests or on shutdown.
 */
export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    dbInstance = null;
  }
}

/**
 * For serverless deployments: create a connection that will be closed after
 * the request. Use this in route handlers and server actions.
 */
export function createServerlessConnection() {
  const url = databaseUrl();

  const sql = postgres(url, {
    ...connectionOptions(url),
    max: 1,
    idle_timeout: 5,
  });

  return drizzle(sql, { schema });
}
