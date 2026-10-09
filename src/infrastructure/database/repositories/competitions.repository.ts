/**
 * Competitions repository (Part 4.2.6).
 *
 * Handles competition lifecycle and participant management.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class CompetitionsRepository {
  /**
   * Get all competitions.
   */
  async getAll(): Promise<typeof schema.competitions.$inferSelect[]> {
    return db.select().from(schema.competitions).orderBy(desc(schema.competitions.createdAt));
  }

  /**
   * Get a competition by ID.
   */
  async findById(id: string): Promise<typeof schema.competitions.$inferSelect | undefined> {
    const [competition] = await db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.id, id))
      .limit(1);
    return competition;
  }

  /**
   * Find a competition by name.
   */
  async findByName(name: string): Promise<typeof schema.competitions.$inferSelect | undefined> {
    const [competition] = await db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.name, name))
      .limit(1);
    return competition;
  }

  /**
   * Get competitions by status.
   */
  async getByStatus(
    status: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED",
  ): Promise<typeof schema.competitions.$inferSelect[]> {
    return db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.status, status))
      .orderBy(schema.competitions.startsAt);
  }

  /**
   * Get active competitions.
   */
  async getActive(): Promise<typeof schema.competitions.$inferSelect[]> {
    return this.getByStatus("ACTIVE");
  }

  /**
   * Get upcoming competitions.
   */
  async getUpcoming(): Promise<typeof schema.competitions.$inferSelect[]> {
    return this.getByStatus("UPCOMING");
  }

  /**
   * Create a new competition.
   */
  async create(data: {
    name: string;
    description?: string;
    startingCashCents: string;
    status?: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
    startsAt?: Date;
    endsAt?: Date;
  }): Promise<typeof schema.competitions.$inferSelect> {
    const [competition] = await db
      .insert(schema.competitions)
      .values({
        name: data.name,
        description: data.description,
        startingCashCents: data.startingCashCents,
        status: data.status ?? "DRAFT",
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      })
      .returning();
    if (!competition) {
      throw new Error(`Failed to create competition: ${data.name}`);
    }
    return competition;
  }

  /**
   * Update a competition.
   */
  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      status?: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
      startsAt?: Date;
      endsAt?: Date;
    },
  ): Promise<typeof schema.competitions.$inferSelect> {
    const [competition] = await db
      .update(schema.competitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.competitions.id, id))
      .returning();
    if (!competition) {
      throw new Error(`Competition not found: ${id}`);
    }
    return competition;
  }

  /**
   * Add a participant to a competition.
   */
  async addParticipant(data: {
    competitionId: string;
    userId: string;
    portfolioId: string;
  }): Promise<typeof schema.competitionParticipants.$inferSelect> {
    const [participant] = await db.insert(schema.competitionParticipants).values(data).returning();
    if (!participant) {
      throw new Error(`Failed to add participant to competition: ${data.competitionId}`);
    }
    return participant;
  }

  /**
   * Get participants for a competition.
   */
  async getParticipants(competitionId: string): Promise<typeof schema.competitionParticipants.$inferSelect[]> {
    return db
      .select()
      .from(schema.competitionParticipants)
      .where(eq(schema.competitionParticipants.competitionId, competitionId))
      .orderBy(schema.competitionParticipants.joinedAt);
  }

  /**
   * Check if a user is participating in a competition.
   */
  async isParticipant(competitionId: string, userId: string): Promise<boolean> {
    const [participant] = await db
      .select()
      .from(schema.competitionParticipants)
      .where(
        and(
          eq(schema.competitionParticipants.competitionId, competitionId),
          eq(schema.competitionParticipants.userId, userId),
        ),
      )
      .limit(1);
    return !!participant;
  }

  /**
   * Get a user's competition participation.
   */
  async getUserParticipation(userId: string): Promise<typeof schema.competitionParticipants.$inferSelect[]> {
    return db
      .select()
      .from(schema.competitionParticipants)
      .where(eq(schema.competitionParticipants.userId, userId));
  }

  /**
   * Get competition participant by user and competition.
   */
  async getParticipant(
    competitionId: string,
    userId: string,
  ): Promise<typeof schema.competitionParticipants.$inferSelect | undefined> {
    const [participant] = await db
      .select()
      .from(schema.competitionParticipants)
      .where(
        and(
          eq(schema.competitionParticipants.competitionId, competitionId),
          eq(schema.competitionParticipants.userId, userId),
        ),
      )
      .limit(1);
    return participant;
  }

  /**
   * Delete a competition.
   */
  async delete(id: string): Promise<void> {
    await db.delete(schema.competitions).where(eq(schema.competitions.id, id));
  }
}

export const competitionsRepository = new CompetitionsRepository();
