/**
 * Auth utilities (Part 7.3).
 *
 * Helper functions for authentication and session management.
 * Server-side only.
 */

import "server-only";
import { authProvider } from "./auth-provider";
import type { Session } from "./auth-provider";
import type { UserRole } from "./rbac";
import { unauthenticated, forbidden } from "../../lib/errors";

/**
 * Get the current session.
 *
 * @returns The current session, or null if not authenticated
 */
export function getCurrentSession(): Session | null {
  return authProvider.getSession();
}

/**
 * Check if the current user is authenticated.
 *
 * @returns true if authenticated, false otherwise
 */
export function isAuthenticated(): boolean {
  const session = getCurrentSession();
  return session !== null;
}

/**
 * Get the current user's role from the session.
 *
 * @returns The user's role, or null if not authenticated
 */
export function getCurrentUserRole(): UserRole | null {
  const session = getCurrentSession();
  return session?.user.role ?? null;
}

/**
 * Get the current user's ID from the session.
 *
 * @returns The user's ID, or null if not authenticated
 */
export function getCurrentUserId(): string | null {
  const session = getCurrentSession();
  return session?.user.id ?? null;
}

/**
 * Require authentication, throwing an error if not authenticated.
 *
 * @returns The current session
 * @throws AppError with UNAUTHENTICATED code if not authenticated
 */
export function requireAuth(): Session {
  const session = getCurrentSession();
  if (!session) {
    throw unauthenticated();
  }
  return session;
}

/**
 * Require a specific role, throwing an error if the user doesn't have it.
 *
 * @param requiredRole - The minimum required role
 * @returns The current session
 * @throws AppError with FORBIDDEN code if the user lacks the required role
 */
export async function requireRole(requiredRole: UserRole): Promise<Session> {
  const session = requireAuth();
  const { hasRole } = await import("./rbac");

  if (!hasRole(session.user.role, requiredRole)) {
    throw forbidden(`This action requires ${requiredRole} privileges or higher.`);
  }

  return session;
}
