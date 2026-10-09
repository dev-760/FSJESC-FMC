/**
 * Rate limiting (Part 8.3, D10).
 *
 * Implements in-memory token-bucket rate limiting for per-IP and per-account
 * limits. The interface is injectable so a Redis-backed implementation can be
 * substituted for multi-instance deployments.
 *
 * Known limitation: per-process state, so a multi-instance deployment multiplies
 * the effective limit by the instance count. This is documented in SECURITY.md.
 */

import { RATE_LIMITS } from "../../config/site";

/**
 * Rate limit bucket state.
 */
interface Bucket {
  tokens: number;
  lastRefill: number; // timestamp in milliseconds
}

/**
 * Rate limit configuration.
 */
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

/**
 * Rate limiter interface.
 */
export interface RateLimiter {
  /**
   * Check if a request is allowed under the rate limit.
   *
   * @param key - Unique identifier for the bucket (e.g., IP address or user ID)
   * @param config - Rate limit configuration
   * @returns true if the request is allowed, false otherwise
   */
  check(key: string, config: RateLimitConfig): boolean;

  /**
   * Get the remaining tokens for a bucket.
   *
   * @param key - Unique identifier for the bucket
   * @param config - Rate limit configuration
   * @returns Number of remaining tokens
   */
  getRemaining(key: string, config: RateLimitConfig): number;

  /**
   * Reset a bucket to full capacity.
   *
   * @param key - Unique identifier for the bucket
   */
  reset(key: string): void;

  /**
   * Clean up expired buckets.
   */
  cleanup(): void;
}

/**
 * In-memory token-bucket rate limiter implementation.
 */
class InMemoryRateLimiter implements RateLimiter {
  private buckets = new Map<string, Bucket>();
  private readonly cleanupIntervalMs = 60_000; // Clean up every minute
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
  }

  /**
   * Refill tokens based on elapsed time.
   */
  private refill(bucket: Bucket, config: RateLimitConfig): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;

    if (elapsed >= config.windowMs) {
      // Full refill if window has passed
      bucket.tokens = config.maxRequests;
      bucket.lastRefill = now;
    } else {
      // Partial refill based on elapsed time
      const tokensToAdd = Math.floor((elapsed / config.windowMs) * config.maxRequests);
      bucket.tokens = Math.min(config.maxRequests, bucket.tokens + tokensToAdd);
      bucket.lastRefill = now;
    }
  }

  check(key: string, config: RateLimitConfig): boolean {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      // Create new bucket
      bucket = {
        tokens: config.maxRequests - 1, // Consume one token for this request
        lastRefill: now,
      };
      this.buckets.set(key, bucket);
      return true;
    }

    // Refill tokens based on elapsed time
    this.refill(bucket, config);

    // Check if we have tokens
    if (bucket.tokens > 0) {
      bucket.tokens -= 1;
      return true;
    }

    return false;
  }

  getRemaining(key: string, config: RateLimitConfig): number {
    const bucket = this.buckets.get(key);

    if (!bucket) {
      return config.maxRequests;
    }

    this.refill(bucket, config);
    return bucket.tokens;
  }

  reset(key: string): void {
    this.buckets.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    const maxWindowMs = Math.max(
      ...Object.values(RATE_LIMITS).flatMap((limit) => {
        const windows: number[] = [];
        if ("perIpPerMinute" in limit) windows.push(60_000);
        if ("perIpPerHour" in limit) windows.push(3_600_000);
        if ("perAccountPerHour" in limit) windows.push(3_600_000);
        if ("perUserPerMinute" in limit) windows.push(60_000);
        return windows;
      }),
    );

    // Remove buckets that haven't been used in the longest window
    Array.from(this.buckets.entries()).forEach(([key, bucket]) => {
      if (now - bucket.lastRefill > maxWindowMs) {
        this.buckets.delete(key);
      }
    });
  }

  /**
   * Stop the cleanup timer. Call this when shutting down the application.
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/**
 * Global rate limiter instance.
 */
export const rateLimiter = new InMemoryRateLimiter();

/**
 * Check if an IP address is rate limited for login attempts.
 *
 * @param ip - IP address
 * @returns true if the request is allowed, false otherwise
 */
export function checkLoginRateLimit(ip: string): boolean {
  const limit = RATE_LIMITS.login;
  if ("perIpPerMinute" in limit) {
    return rateLimiter.check(ip, {
      maxRequests: limit.perIpPerMinute,
      windowMs: 60_000, // 1 minute
    });
  }
  return true;
}

/**
 * Check if an account is rate limited for login attempts.
 *
 * @param userId - User ID
 * @returns true if the request is allowed, false otherwise
 */
export function checkAccountLoginRateLimit(userId: string): boolean {
  const limit = RATE_LIMITS.login;
  if ("perAccountPerHour" in limit) {
    return rateLimiter.check(userId, {
      maxRequests: limit.perAccountPerHour,
      windowMs: 3_600_000, // 1 hour
    });
  }
  return true;
}

/**
 * Check if an IP address is rate limited for registration attempts.
 *
 * @param ip - IP address
 * @returns true if the request is allowed, false otherwise
 */
export function checkRegistrationRateLimit(ip: string): boolean {
  const limit = RATE_LIMITS.registration;
  if ("perIpPerHour" in limit) {
    return rateLimiter.check(ip, {
      maxRequests: limit.perIpPerHour,
      windowMs: 3_600_000, // 1 hour
    });
  }
  return true;
}

/**
 * Check if an account is rate limited for password reset attempts.
 *
 * @param userId - User ID
 * @returns true if the request is allowed, false otherwise
 */
export function checkPasswordResetRateLimit(userId: string): boolean {
  const limit = RATE_LIMITS.passwordReset;
  if ("perAccountPerHour" in limit) {
    return rateLimiter.check(userId, {
      maxRequests: limit.perAccountPerHour,
      windowMs: 3_600_000, // 1 hour
    });
  }
  return true;
}

/**
 * Check if a user is rate limited for order submission.
 *
 * @param userId - User ID
 * @returns true if the request is allowed, false otherwise
 */
export function checkOrderSubmissionRateLimit(userId: string): boolean {
  const limit = RATE_LIMITS.orderSubmission;
  if ("perUserPerMinute" in limit) {
    return rateLimiter.check(userId, {
      maxRequests: limit.perUserPerMinute,
      windowMs: 60_000, // 1 minute
    });
  }
  return true;
}

/**
 * Check if an IP address is rate limited for general API requests.
 *
 * @param ip - IP address
 * @returns true if the request is allowed, false otherwise
 */
export function checkGeneralApiRateLimit(ip: string): boolean {
  const limit = RATE_LIMITS.generalApi;
  if ("perIpPerMinute" in limit) {
    return rateLimiter.check(ip, {
      maxRequests: limit.perIpPerMinute,
      windowMs: 60_000, // 1 minute
    });
  }
  return true;
}

/**
 * Get remaining login attempts for an IP address.
 *
 * @param ip - IP address
 * @returns Number of remaining attempts
 */
export function getRemainingLoginAttempts(ip: string): number {
  const limit = RATE_LIMITS.login;
  if ("perIpPerMinute" in limit) {
    return rateLimiter.getRemaining(ip, {
      maxRequests: limit.perIpPerMinute,
      windowMs: 60_000,
    });
  }
  return 0;
}

/**
 * Get remaining registration attempts for an IP address.
 *
 * @param ip - IP address
 * @returns Number of remaining attempts
 */
export function getRemainingRegistrationAttempts(ip: string): number {
  const limit = RATE_LIMITS.registration;
  if ("perIpPerHour" in limit) {
    return rateLimiter.getRemaining(ip, {
      maxRequests: limit.perIpPerHour,
      windowMs: 3_600_000,
    });
  }
  return 0;
}
