/**
 * Role-based access control (RBAC) (Part 7.1, N3).
 *
 * Defines user roles and provides helper functions for checking permissions.
 * All authorization checks are server-side only.
 */

import { type roleEnum } from "../database/schema";
import { forbidden } from "../../lib/errors";

/**
 * User roles (Part 7.1, N3).
 *
 * STUDENT: can read education content and use the simulator
 * MEMBER: can curate topics, run sessions, grant MEMBER to students
 * EXECUTIVE: can manage events, articles, competitions, and grant EXECUTIVE
 * ADMINISTRATOR: full system access, bootstrap account
 */
export type UserRole = (typeof roleEnum.enumValues)[number];

/**
 * Role hierarchy for permission escalation checks.
 * Higher roles inherit all permissions of lower roles.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  STUDENT: 0,
  MEMBER: 1,
  EXECUTIVE: 2,
  ADMINISTRATOR: 3,
} as const;

/**
 * Check if a user has a required role or higher.
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if the user has the required role or higher
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a user has any of the specified roles.
 *
 * @param userRole - The user's current role
 * @param allowedRoles - Array of allowed roles
 * @returns true if the user has any of the allowed roles
 */
export function hasAnyRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Check if a user owns a resource.
 *
 * This is a generic ownership check that can be used for resources
 * that have a userId field. The actual database lookup should be
 * performed by the caller.
 *
 * @param resourceUserId - The userId of the resource owner
 * @param currentUserId - The userId of the current user
 * @param userRole - The user's role (executives and admins can access any resource)
 * @returns true if the user owns the resource or has elevated privileges
 */
export function ownsResource(
  resourceUserId: string,
  currentUserId: string,
  userRole: UserRole,
): boolean {
  // Executives and administrators can access any resource
  if (hasRole(userRole, "EXECUTIVE")) {
    return true;
  }

  // Otherwise, check ownership
  return resourceUserId === currentUserId;
}

/**
 * Assert that a user has a required role, throwing an error if not.
 * This is a convenience function for use in server actions and route handlers.
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @throws AppError with FORBIDDEN code if the user lacks the required role
 */
export function requireRole(userRole: UserRole, requiredRole: UserRole): void {
  if (!hasRole(userRole, requiredRole)) {
    throw forbidden(`This action requires ${requiredRole} privileges or higher.`);
  }
}

/**
 * Assert that a user owns a resource, throwing an error if not.
 *
 * @param resourceUserId - The userId of the resource owner
 * @param currentUserId - The userId of the current user
 * @param userRole - The user's role
 * @throws AppError with FORBIDDEN code if the user doesn't own the resource
 */
export function requireOwnership(
  resourceUserId: string,
  currentUserId: string,
  userRole: UserRole,
): void {
  if (!ownsResource(resourceUserId, currentUserId, userRole)) {
    throw forbidden("You do not have permission to access this resource.");
  }
}
