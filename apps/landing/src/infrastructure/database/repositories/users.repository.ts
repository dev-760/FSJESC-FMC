/**
 * Users repository (Part 4.2.1, N9).
 *
 * Handles all database operations for users and profiles.
 */

import { eq } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class UsersRepository {
  /**
   * Find a user by email.
   */
  async findByEmail(email: string): Promise<typeof schema.users.$inferSelect | undefined> {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);
    return user;
  }

  /**
   * Find a user by ID.
   */
  async findById(id: string): Promise<typeof schema.users.$inferSelect | undefined> {
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    return user;
  }

  /**
   * Create a new user.
   */
  async create(data: {
    email: string;
    passwordHash: string;
    role?: "STUDENT" | "MEMBER" | "EXECUTIVE" | "ADMINISTRATOR";
  }): Promise<typeof schema.users.$inferSelect> {
    const [user] = await db
      .insert(schema.users)
      .values({
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role ?? "STUDENT",
      })
      .returning();
    if (!user) {
      throw new Error(`Failed to create user: ${data.email}`);
    }
    return user;
  }

  /**
   * Update a user's role.
   */
  async updateRole(
    userId: string,
    role: "STUDENT" | "MEMBER" | "EXECUTIVE" | "ADMINISTRATOR",
  ): Promise<typeof schema.users.$inferSelect> {
    const users = await db
      .update(schema.users)
      .set({ role, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    const user = users[0];
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    return user;
  }

  /**
   * Mark email as verified.
   */
  async verifyEmail(userId: string): Promise<typeof schema.users.$inferSelect> {
    const users = await db
      .update(schema.users)
      .set({ emailVerified: new Date(), updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    const user = users[0];
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    return user;
  }

  /**
   * Update password hash.
   */
  async updatePassword(userId: string, passwordHash: string): Promise<typeof schema.users.$inferSelect> {
    const users = await db
      .update(schema.users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(schema.users.id, userId))
      .returning();
    const user = users[0];
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }
    return user;
  }

  /**
   * Get or create a user profile.
   */
  async upsertProfile(
    userId: string,
    data: Partial<typeof schema.profiles.$inferInsert>,
  ): Promise<typeof schema.profiles.$inferSelect> {
    const existing = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      const profiles = await db
        .update(schema.profiles)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.profiles.userId, userId))
        .returning();
      const profile = profiles[0];
      if (!profile) {
        throw new Error(`Profile not found for user: ${userId}`);
      }
      return profile;
    }

    const profiles = await db
      .insert(schema.profiles)
      .values({ userId, ...data })
      .returning();
    const profile = profiles[0];
    if (!profile) {
      throw new Error(`Failed to create profile for user: ${userId}`);
    }
    return profile;
  }

  /**
   * Get a user's profile.
   */
  async getProfile(userId: string): Promise<typeof schema.profiles.$inferSelect | undefined> {
    const profiles = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, userId))
      .limit(1);
    return profiles[0];
  }
}

export const usersRepository = new UsersRepository();
