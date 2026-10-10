/**
 * Auth middleware (Part 7.3).
 *
 * Middleware functions for protecting routes and checking permissions.
 * These are designed to be used in Next.js middleware.ts or in route handlers.
 */

import { type NextRequest, NextResponse } from "next/server";
import type { UserRole } from "./rbac";

/**
 * Middleware to check authentication.
 *
 * @param request - The Next.js request object
 * @returns NextResponse with redirect if not authenticated, null otherwise
 */
export function requireAuthMiddleware(request: NextRequest): NextResponse | null {
  // Get session token from cookie
  const sessionToken = request.cookies.get("fsjesc-fmc.session")?.value;

  if (!sessionToken) {
    // Redirect to sign-in page with callback URL
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return null;
}

/**
 * Middleware to check role-based access.
 *
 * @param request - The Next.js request object
 * @param requiredRole - The minimum required role
 * @returns NextResponse with redirect if unauthorized, null otherwise
 */
export function requireRoleMiddleware(
  request: NextRequest,
  _requiredRole: UserRole,
): NextResponse | null {
  // First check authentication
  const authResponse = requireAuthMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // TODO: Check user role from session
  // This would require integrating with Auth.js's session handling
  // For now, this is a placeholder

  return null;
}

/**
 * Middleware to check resource ownership.
 *
 * @param request - The Next.js request object
 * @param resourceUserId - The user ID of the resource owner
 * @returns NextResponse with redirect if unauthorized, null otherwise
 */
export function requireOwnershipMiddleware(
  request: NextRequest,
  _resourceUserId: string,
): NextResponse | null {
  // First check authentication
  const authResponse = requireAuthMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  // TODO: Check ownership from session
  // This would require integrating with Auth.js's session handling
  // For now, this is a placeholder

  return null;
}

/**
 * Create a middleware chain for multiple checks.
 *
 * @param middlewares - Array of middleware functions
 * @returns A single middleware function that runs all checks
 */
export function chainMiddleware(...middlewares: ((request: NextRequest) => NextResponse | null)[]) {
  return (request: NextRequest) => {
    for (const middleware of middlewares) {
      const response = middleware(request);
      if (response) {
        return response;
      }
    }
    return null;
  };
}
