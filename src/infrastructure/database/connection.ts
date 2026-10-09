/**
 * Database connection (Part 4.1, N1).
 *
 * Wraps the postgres.js driver with Drizzle ORM. Connection is pooled and
 * reused across requests in development; in production with serverless, a
 * connection per request is the pattern.
 *
 * Money values are returned as strings from NUMERIC columns to preserve
 * precision (D3). They are converted to bigint centimes at the boundary.
 */

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Connection pool for development. In serverless production, this should be
 * a single connection per request to avoid connection exhaustion.
 */
let pool: postgres.Sql | null = null;

/**
 * Get or create the database connection.
 *
 * In development, this reuses a single pooled connection. In production with
 * serverless, each invocation gets its own connection.
 */
export function getConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!pool) {
    pool = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
  }

  return pool;
}

/**
 * Drizzle database instance.
 */
export const db = drizzle(getConnection(), { schema });

/**
 * Close the connection pool. Call this in tests or on shutdown.
 */
export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

/**
 * For serverless deployments: create a connection that will be closed after
 * the request. Use this in route handlers and server actions.
 */
export function createServerlessConnection() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    idle_timeout: 5,
    connect_timeout: 10,
  });

  return drizzle(sql, { schema });
}
