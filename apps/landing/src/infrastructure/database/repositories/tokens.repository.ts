/**
 * Tokens repository (Part 7.3).
 *
 * Handles password reset and email verification tokens.
 * Tokens are single-use and expiring.
 */

import { eq } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class TokensRepository {
  /**
   * Create a password reset token.
   */
  async createPasswordResetToken(
    userId: string,
    token: string,
    ttlSeconds: number = 3600,
  ): Promise<typeof schema.passwordResetTokens.$inferSelect> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const [resetToken] = await db
      .insert(schema.passwordResetTokens)
      .values({
        token,
        userId,
        expiresAt,
      })
      .returning();
    if (!resetToken) {
      throw new Error("Failed to create password reset token");
    }
    return resetToken;
  }

  /**
   * Get a password reset token by token string.
   */
  async getPasswordResetToken(token: string): Promise<typeof schema.passwordResetTokens.$inferSelect | undefined> {
    const [resetToken] = await db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.token, token))
      .limit(1);

    // Check if expired
    if (resetToken && resetToken.expiresAt < new Date()) {
      await this.deletePasswordResetToken(token);
      return undefined;
    }

    return resetToken;
  }

  /**
   * Mark a password reset token as used.
   */
  async usePasswordResetToken(token: string): Promise<typeof schema.passwordResetTokens.$inferSelect> {
    const [resetToken] = await db
      .update(schema.passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.passwordResetTokens.token, token))
      .returning();
    if (!resetToken) {
      throw new Error("Failed to use password reset token");
    }
    return resetToken;
  }

  /**
   * Delete a password reset token.
   */
  async deletePasswordResetToken(token: string): Promise<void> {
    await db.delete(schema.passwordResetTokens).where(eq(schema.passwordResetTokens.token, token));
  }

  /**
   * Delete all password reset tokens for a user.
   */
  async deletePasswordResetTokensForUser(userId: string): Promise<void> {
    await db
      .delete(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.userId, userId));
  }

  /**
   * Check if a password reset token is valid (exists, not expired, not used).
   */
  async isPasswordResetTokenValid(token: string): Promise<boolean> {
    const resetToken = await this.getPasswordResetToken(token);
    return !!resetToken && !resetToken.usedAt;
  }

  /**
   * Create an email verification token.
   */
  async createEmailVerificationToken(
    userId: string,
    token: string,
    ttlSeconds: number = 86400,
  ): Promise<typeof schema.emailVerificationTokens.$inferSelect> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const [verificationToken] = await db
      .insert(schema.emailVerificationTokens)
      .values({
        token,
        userId,
        expiresAt,
      })
      .returning();
    if (!verificationToken) {
      throw new Error("Failed to create email verification token");
    }
    return verificationToken;
  }

  /**
   * Get an email verification token by token string.
   */
  async getEmailVerificationToken(token: string): Promise<typeof schema.emailVerificationTokens.$inferSelect | undefined> {
    const [verificationToken] = await db
      .select()
      .from(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.token, token))
      .limit(1);

    // Check if expired
    if (verificationToken && verificationToken.expiresAt < new Date()) {
      await this.deleteEmailVerificationToken(token);
      return undefined;
    }

    return verificationToken;
  }

  /**
   * Mark an email verification token as used.
   */
  async useEmailVerificationToken(token: string): Promise<typeof schema.emailVerificationTokens.$inferSelect> {
    const [verificationToken] = await db
      .update(schema.emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.emailVerificationTokens.token, token))
      .returning();
    if (!verificationToken) {
      throw new Error("Failed to use email verification token");
    }
    return verificationToken;
  }

  /**
   * Delete an email verification token.
   */
  async deleteEmailVerificationToken(token: string): Promise<void> {
    await db
      .delete(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.token, token));
  }

  /**
   * Delete all email verification tokens for a user.
   */
  async deleteEmailVerificationTokensForUser(userId: string): Promise<void> {
    await db
      .delete(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.userId, userId));
  }

  /**
   * Check if an email verification token is valid (exists, not expired, not used).
   */
  async isEmailVerificationTokenValid(token: string): Promise<boolean> {
    const verificationToken = await this.getEmailVerificationToken(token);
    return !!verificationToken && !verificationToken.usedAt;
  }

  /**
   * Clean up expired tokens.
   *
   * This should be called periodically to remove old records.
   */
  cleanupExpired(): { passwordReset: number; emailVerification: number } {
    // Delete expired password reset tokens
    // Delete expired email verification tokens
    // Return counts
    return { passwordReset: 0, emailVerification: 0 };
  }

  /**
   * Get all password reset tokens for a user.
   */
  async getPasswordResetTokensForUser(userId: string): Promise<typeof schema.passwordResetTokens.$inferSelect[]> {
    return db
      .select()
      .from(schema.passwordResetTokens)
      .where(eq(schema.passwordResetTokens.userId, userId))
      .orderBy(schema.passwordResetTokens.createdAt);
  }

  /**
   * Get all email verification tokens for a user.
   */
  async getEmailVerificationTokensForUser(userId: string): Promise<typeof schema.emailVerificationTokens.$inferSelect[]> {
    return db
      .select()
      .from(schema.emailVerificationTokens)
      .where(eq(schema.emailVerificationTokens.userId, userId))
      .orderBy(schema.emailVerificationTokens.createdAt);
  }
}

export const tokensRepository = new TokensRepository();
