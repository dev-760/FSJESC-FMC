/**
 * Idempotency keys repository (Part 4.2.10, N5).
 *
 * Handles idempotency key storage for replay-safe operations.
 * If a request arrives with an existing key, the stored result is returned
 * instead of re-executing.
 */

import { eq, sql } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class IdempotencyRepository {
  /**
   * Store an idempotency key with its response.
   */
  async set(key: string, response: string, ttlSeconds: number = 86400): Promise<typeof schema.idempotencyKeys.$inferSelect> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const [record] = await db
      .insert(schema.idempotencyKeys)
      .values({
        key,
        response,
        expiresAt,
      })
      .returning();
    if (!record) {
      throw new Error("Failed to set idempotency key");
    }
    return record;
  }

  /**
   * Get an idempotency key record.
   *
   * Returns undefined if the key doesn't exist or has expired.
   */
  async get(key: string): Promise<typeof schema.idempotencyKeys.$inferSelect | undefined> {
    const [record] = await db
      .select()
      .from(schema.idempotencyKeys)
      .where(eq(schema.idempotencyKeys.key, key))
      .limit(1);

    // Check if expired
    if (record && record.expiresAt < new Date()) {
      await this.delete(key);
      return undefined;
    }

    return record;
  }

  /**
   * Check if a key exists and is not expired.
   */
  async exists(key: string): Promise<boolean> {
    const record = await this.get(key);
    return !!record;
  }

  /**
   * Delete an idempotency key.
   */
  async delete(key: string): Promise<void> {
    await db.delete(schema.idempotencyKeys).where(eq(schema.idempotencyKeys.key, key));
  }

  /**
   * Clean up expired keys.
   *
   * This should be called periodically to remove old records.
   */
  async cleanupExpired(): Promise<number> {
    await db
      .delete(schema.idempotencyKeys)
      .where(sql`${schema.idempotencyKeys.expiresAt} < NOW()`);
    // Return count of deleted records - placeholder
    return 0;
  }

  /**
   * Get a key or create it with a default response.
   *
   * Returns the existing record if found, otherwise creates a new one.
   */
  async getOrCreate(
    key: string,
    defaultResponse: string,
    ttlSeconds: number = 86400,
  ): Promise<{ record: typeof schema.idempotencyKeys.$inferSelect; isNew: boolean }> {
    const existing = await this.get(key);
    if (existing) {
      return { record: existing, isNew: false };
    }

    const record = await this.set(key, defaultResponse, ttlSeconds);
    return { record, isNew: true };
  }

  /**
   * Update the response for an existing key.
   */
  async updateResponse(key: string, response: string): Promise<typeof schema.idempotencyKeys.$inferSelect> {
    const [record] = await db
      .update(schema.idempotencyKeys)
      .set({ response })
      .where(eq(schema.idempotencyKeys.key, key))
      .returning();
    if (!record) {
      throw new Error("Failed to update idempotency key");
    }
    return record;
  }

  /**
   * Extend the expiration time for a key.
   */
  async extendExpiration(key: string, ttlSeconds: number = 86400): Promise<typeof schema.idempotencyKeys.$inferSelect> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    const [record] = await db
      .update(schema.idempotencyKeys)
      .set({ expiresAt })
      .where(eq(schema.idempotencyKeys.key, key))
      .returning();
    if (!record) {
      throw new Error("Failed to extend idempotency key expiration");
    }
    return record;
  }
}

export const idempotencyRepository = new IdempotencyRepository();
