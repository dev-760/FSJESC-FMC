/**
 * AuthProvider interface and implementation (Part 7.3, D5).
 *
 * Wraps Auth.js v5 with the Drizzle adapter, using credentials provider
 * with argon2id for password hashing (D4). All domain/application code
 * depends on this interface, never on next-auth directly.
 *
 * Server-side only.
 */

import "server-only";
import { hash, verify } from "@node-rs/argon2";
import { randomBytes } from "crypto";
import { eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { db } from "../database/connection";
import * as schema from "../database/schema";
import { usersRepository } from "../database/repositories/users.repository";
import { portfoliosRepository } from "../database/repositories/portfolios.repository";
import { bearerTokenFrom, verifySupabaseToken } from "./supabase-jwt";
import { AUTH_CONFIG } from "@fsjesc/config/site";
import { AppError, ERROR_CODES, rateLimited } from "@fsjesc/config/errors";
import type { UserRole } from "./rbac";
import {
  checkLoginRateLimit,
  checkAccountLoginRateLimit,
  checkPasswordResetRateLimit,
} from "./rate-limit";

/**
 * User profile data.
 */
export interface UserProfile {
  name?: string;
  studentId?: string;
  track?: string;
  bio?: string;
}

/**
 * Session data returned by getSession.
 */
export interface Session {
  user: {
    id: string;
    email: string;
    role: UserRole;
    emailVerified?: Date | null;
  };
  expires: string;
}

/**
 * Sign up data.
 */
export interface SignUpData {
  email: string;
  password: string;
  profile?: UserProfile;
}

/**
 * Sign in data.
 */
export interface SignInData {
  email: string;
  password: string;
}

/**
 * Password reset confirmation data.
 */
export interface PasswordResetConfirmData {
  token: string;
  newPassword: string;
}

/**
 * AuthProvider interface (Part 7.3).
 *
 * All authentication operations go through this interface.
 * The implementation uses Auth.js v5 with the Drizzle adapter.
 */
export interface AuthProvider {
  /**
   * Sign up a new user.
   */
  signUp(data: SignUpData): Promise<{ userId: string; requiresVerification: boolean }>;

  /**
   * Sign in a user.
   */
  logIn(data: SignInData, ip?: string): Promise<Session>;

  /**
   * Sign out the current user.
   */
  logOut(): Promise<void> | void;

  /**
   * Get the current session.
   */
  getSession(): Promise<Session | null>;

  /**
   * Request a password reset email.
   */
  requestPasswordReset(email: string, ip?: string): Promise<void>;

  /**
   * Confirm a password reset with a token.
   */
  confirmPasswordReset(data: PasswordResetConfirmData): Promise<void>;

  /**
   * Update user profile.
   */
  updateProfile(userId: string, profile: UserProfile): Promise<void>;

  /**
   * Verify email with a token.
   */
  verifyEmail(token: string): Promise<void>;
}

/**
 * Auth.js-based AuthProvider implementation.
 */
class AuthJsAuthProvider implements AuthProvider {
  /**
   * Hash a password using argon2id (D4).
   */
  private async hashPassword(password: string): Promise<string> {
    return await hash(password, {
      memoryCost: AUTH_CONFIG.argon2.memoryCost,
      timeCost: AUTH_CONFIG.argon2.timeCost,
      parallelism: AUTH_CONFIG.argon2.parallelism,
    });
  }

  /**
   * Verify a password against a hash.
   */
  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    return await verify(hash, password);
  }

  /**
   * Generate a secure random token.
   */
  private generateToken(): string {
    return randomBytes(32).toString("hex");
  }

  /**
   * Validate password strength.
   */
  private validatePassword(password: string): void {
    if (password.length < AUTH_CONFIG.minPasswordLength) {
      throw new AppError(
        ERROR_CODES.WEAK_PASSWORD,
        `Password must be at least ${AUTH_CONFIG.minPasswordLength} characters.`,
      );
    }
    if (password.length > AUTH_CONFIG.maxPasswordLength) {
      throw new AppError(
        ERROR_CODES.WEAK_PASSWORD,
        `Password must not exceed ${AUTH_CONFIG.maxPasswordLength} characters.`,
      );
    }
  }

  /**
   * Sign up a new user.
   */
  async signUp(data: SignUpData): Promise<{ userId: string; requiresVerification: boolean }> {
    // Validate password
    this.validatePassword(data.password);

    // Check if email already exists
    const existingUser = await usersRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError(ERROR_CODES.EMAIL_ALREADY_REGISTERED);
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await usersRepository.create({
      email: data.email,
      passwordHash,
      role: "STUDENT",
    });

    // Create profile if provided
    if (data.profile) {
      await usersRepository.upsertProfile(user.id, data.profile);
    }

    // Auto-create initial portfolio with starting cash (100,000 MAD)
    try {
      await portfoliosRepository.create({
        userId: user.id,
        startingCashCents: "100000.00",
      });
    } catch {
      // Continue if already exists
    }

    // Generate session token and store in database
    const token = this.generateToken();
    const expires = new Date(Date.now() + AUTH_CONFIG.sessionMaxAgeSeconds * 1000);
    await db.insert(schema.sessions).values({
      sessionToken: token,
      userId: user.id,
      expires,
    });

    try {
      const cookieStore = await cookies();
      cookieStore.set("fsjesc-fmc.session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires,
      });
    } catch {
      // Non-action context
    }

    return {
      userId: user.id,
      requiresVerification: false,
    };
  }

  /**
   * Sign in a user.
   */
  async logIn(data: SignInData, ip?: string): Promise<Session> {
    // Rate limit by IP
    if (ip && !checkLoginRateLimit(ip)) {
      throw rateLimited(60);
    }

    // Find user by email
    const user = await usersRepository.findByEmail(data.email);
    if (!user) {
      throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Rate limit by account
    if (!checkAccountLoginRateLimit(user.id)) {
      throw rateLimited(3600);
    }

    // Verify password
    const isValid = await this.verifyPassword(user.passwordHash, data.password);
    if (!isValid) {
      throw new AppError(ERROR_CODES.INVALID_CREDENTIALS);
    }

    // Create session token and store in database
    const token = this.generateToken();
    const expires = new Date(Date.now() + AUTH_CONFIG.sessionMaxAgeSeconds * 1000);

    await db.insert(schema.sessions).values({
      sessionToken: token,
      userId: user.id,
      expires,
    });

    try {
      const cookieStore = await cookies();
      cookieStore.set("fsjesc-fmc.session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires,
      });
    } catch {
      // Non-action context
    }

    const session: Session = {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      expires: expires.toISOString(),
    };

    return session;
  }

  /**
   * Sign out the current user.
   */
  async logOut(): Promise<void> {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get("fsjesc-fmc.session")?.value;
      if (token) {
        await db.delete(schema.sessions).where(eq(schema.sessions.sessionToken, token));
        cookieStore.delete("fsjesc-fmc.session");
      }
    } catch {
      // Outside request context
    }
  }

  /**
   * Get the current session.
   */
  async getSession(): Promise<Session | null> {
    try {
      // 1. Check Authorization Bearer header (Supabase JWT support)
      try {
        const headerList = await headers();
        const authHeader = headerList.get("authorization");
        const bearer = bearerTokenFrom(authHeader);
        if (bearer) {
          const identity = await verifySupabaseToken(bearer);
          if (identity?.email) {
            const user = await usersRepository.findByEmail(identity.email);
            if (user) {
              return {
                user: {
                  id: user.id,
                  email: user.email,
                  role: user.role,
                  emailVerified: user.emailVerified,
                },
                expires: new Date(Date.now() + 3600 * 1000).toISOString(),
              };
            }
          }
        }
      } catch {
        // Headers not available in current execution context
      }

      // 2. Check Session Cookie
      const cookieStore = await cookies();
      const sessionToken = cookieStore.get("fsjesc-fmc.session")?.value;
      if (!sessionToken) return null;

      const [sessionRow] = await db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.sessionToken, sessionToken))
        .limit(1);

      if (!sessionRow) return null;

      if (new Date() > sessionRow.expires) {
        await db.delete(schema.sessions).where(eq(schema.sessions.sessionToken, sessionToken));
        return null;
      }

      const user = await usersRepository.findById(sessionRow.userId);
      if (!user) return null;

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
        },
        expires: sessionRow.expires.toISOString(),
      };
    } catch {
      return null;
    }
  }

  /**
   * Request a password reset.
   */
  async requestPasswordReset(email: string, _ip?: string): Promise<void> {
    // Find user by email
    const user = await usersRepository.findByEmail(email);
    if (!user) {
      // Don't reveal whether the email exists
      return;
    }

    // Rate limit by account
    if (!checkPasswordResetRateLimit(user.id)) {
      throw rateLimited(3600);
    }

    // Generate reset token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + AUTH_CONFIG.passwordResetTtlMinutes * 60 * 1000);

    // Delete any existing tokens for this user
    await db
      .delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.userId, user.id));

    // Insert new token
    await db.insert(schema.passwordResetTokens).values({
      token,
      userId: user.id,
      expiresAt,
    });

    // TODO: Send password reset email
    // For now, we'll log the token for development
    console.error(`Password reset token for ${email}: ${token}`);
  }

  /**
   * Confirm a password reset.
   */
  async confirmPasswordReset(data: PasswordResetConfirmData): Promise<void> {
    // Validate new password
    this.validatePassword(data.newPassword);

    // Find the token
    const [tokenRecord] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.token, data.token))
      .limit(1);

    if (!tokenRecord) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Check if token has already been used
    if (tokenRecord.usedAt) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Hash new password
    const passwordHash = await this.hashPassword(data.newPassword);

    // Update user password
    await usersRepository.updatePassword(tokenRecord.userId, passwordHash);

    // Mark token as used
    await db
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.token, data.token));
  }

  /**
   * Update user profile.
   */
  async updateProfile(userId: string, profile: UserProfile): Promise<void> {
    await usersRepository.upsertProfile(userId, profile);
  }

  /**
   * Verify email with a token.
   */
  async verifyEmail(token: string): Promise<void> {
    // Find the token
    const [tokenRecord] = await db
      .select()
      .from(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.token, token))
      .limit(1);

    if (!tokenRecord) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Check if token has already been used
    if (tokenRecord.usedAt) {
      throw new AppError(ERROR_CODES.TOKEN_INVALID_OR_EXPIRED);
    }

    // Mark email as verified
    await usersRepository.verifyEmail(tokenRecord.userId);

    // Mark token as used
    await db
      .update(schema.emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.emailVerificationTokens.token, token));
  }
}

/**
 * Global AuthProvider instance.
 */
export const authProvider: AuthProvider = new AuthJsAuthProvider();
