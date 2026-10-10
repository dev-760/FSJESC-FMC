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
import { unauthenticated, forbidden } from "@fsjesc/config/errors";

/**
 * Get the current session.
 *
 * @returns The current session, or null if not authenticated
 */
export async function getCurrentSession(): Promise<Session | null> {
  return await authProvider.getSession();
}

/**
 * Check if the current user is authenticated.
 *
 * @returns true if authenticated, false otherwise
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getCurrentSession();
  return session !== null;
}

/**
 * Get the current user's role from the session.
 *
 * @returns The user's role, or null if not authenticated
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getCurrentSession();
  return session?.user.role ?? null;
}

/**
 * Get the current user's ID from the session.
 *
 * @returns The user's ID, or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getCurrentSession();
  return session?.user.id ?? null;
}

/**
 * Require authentication, throwing an error if not authenticated.
 *
 * @returns The current session
 * @throws AppError with UNAUTHENTICATED code if not authenticated
 */
export async function requireAuth(): Promise<Session> {
  const session = await getCurrentSession();
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
  const session = await requireAuth();
  const { hasRole } = await import("./rbac");

  if (!hasRole(session.user.role, requiredRole)) {
    throw forbidden(`This action requires ${requiredRole} privileges or higher.`);
  }

  return session;
}
