/**
 * Auth module exports (Part 7.3).
 *
 * Centralized exports for all authentication-related functionality.
 */

export {
  authProvider,
  type AuthProvider,
  type Session,
  type SignUpData,
  type SignInData,
  type PasswordResetConfirmData,
  type UserProfile,
} from "./auth-provider";
export { authConfig } from "./auth.config";
export {
  hasRole,
  hasAnyRole,
  ownsResource,
  requireRole,
  requireOwnership,
  type UserRole,
} from "./rbac";
export {
  rateLimiter,
  checkLoginRateLimit,
  checkAccountLoginRateLimit,
  checkRegistrationRateLimit,
  checkPasswordResetRateLimit,
  checkOrderSubmissionRateLimit,
  checkGeneralApiRateLimit,
  getRemainingLoginAttempts,
  getRemainingRegistrationAttempts,
  type RateLimiter,
  type RateLimitConfig,
} from "./rate-limit";
export {
  getCurrentSession,
  isAuthenticated,
  getCurrentUserRole,
  getCurrentUserId,
  requireAuth,
  requireAuth as requireAuthUtil,
} from "./utils";
export {
  requireAuthMiddleware,
  requireRoleMiddleware,
  requireOwnershipMiddleware,
  chainMiddleware,
} from "./middleware";
