/**
 * Portfolios repository (Part 4.2.2, N1, N4).
 *
 * Handles portfolio and position operations with transaction support.
 */

import { eq, and, sql } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class PortfoliosRepository {
  /**
   * Get a user's main portfolio (non-competition).
   */
  async getUserPortfolio(userId: string): Promise<typeof schema.portfolios.$inferSelect | undefined> {
    const [portfolio] = await db
      .select()
      .from(schema.portfolios)
      .where(and(eq(schema.portfolios.userId, userId), eq(schema.portfolios.isCompetition, 0)))
      .limit(1);
    return portfolio;
  }

  /**
   * Create a new portfolio.
   */
  async create(data: {
    userId: string;
    startingCashCents: string;
    isCompetition?: number;
    competitionId?: string;
  }): Promise<typeof schema.portfolios.$inferSelect> {
    const [portfolio] = await db
      .insert(schema.portfolios)
      .values({
        userId: data.userId,
        cashCents: data.startingCashCents,
        isCompetition: data.isCompetition ?? 0,
        competitionId: data.competitionId,
      })
      .returning();
    if (!portfolio) {
      throw new Error(`Failed to create portfolio for user: ${data.userId}`);
    }
    return portfolio;
  }

  /**
   * Update portfolio cash (for deposits, withdrawals, and trading).
   * Returns the updated portfolio.
   */
  async updateCash(
    portfolioId: string,
    cashChangeCents: string,
    reservedChangeCents: string = "0",
  ): Promise<typeof schema.portfolios.$inferSelect> {
    const [portfolio] = await db
      .update(schema.portfolios)
      .set({
        cashCents: sql`cash_cents + ${cashChangeCents}`,
        reservedCents: sql`reserved_cents + ${reservedChangeCents}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.portfolios.id, portfolioId))
      .returning();
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    return portfolio;
  }

  /**
   * Update realised P&L.
   */
  async updateRealisedPnl(portfolioId: string, pnlChangeCents: string): Promise<typeof schema.portfolios.$inferSelect> {
    const [portfolio] = await db
      .update(schema.portfolios)
      .set({
        realisedPnlCents: sql`realised_pnl_cents + ${pnlChangeCents}`,
        updatedAt: new Date(),
      })
      .where(eq(schema.portfolios.id, portfolioId))
      .returning();
    if (!portfolio) {
      throw new Error(`Portfolio not found: ${portfolioId}`);
    }
    return portfolio;
  }

  /**
   * Get all positions for a portfolio.
   */
  async getPositions(portfolioId: string): Promise<typeof schema.positions.$inferSelect[]> {
    return db.select().from(schema.positions).where(eq(schema.positions.portfolioId, portfolioId));
  }

  /**
   * Get a specific position.
   */
  async getPosition(portfolioId: string, symbol: string): Promise<typeof schema.positions.$inferSelect | undefined> {
    const [position] = await db
      .select()
      .from(schema.positions)
      .where(
        and(eq(schema.positions.portfolioId, portfolioId), eq(schema.positions.symbol, symbol)),
      )
      .limit(1);
    return position;
  }

  /**
   * Create or update a position.
   */
  async upsertPosition(data: {
    portfolioId: string;
    symbol: string;
    quantity: number;
    averageCostCents: string;
  }): Promise<typeof schema.positions.$inferSelect> {
    const [position] = await db
      .insert(schema.positions)
      .values({
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        quantity: data.quantity,
        averageCostCents: data.averageCostCents,
      })
      .onConflictDoUpdate({
        target: [schema.positions.portfolioId, schema.positions.symbol],
        set: {
          quantity: data.quantity,
          averageCostCents: data.averageCostCents,
          updatedAt: new Date(),
        },
      })
      .returning();

    if (!position) {
      throw new Error(`Failed to upsert position for portfolio: ${data.portfolioId}`);
    }
    return position;
  }

  /**
   * Delete a position (when quantity reaches zero).
   */
  async deletePosition(portfolioId: string, symbol: string): Promise<void> {
    await db
      .delete(schema.positions)
      .where(
        and(eq(schema.positions.portfolioId, portfolioId), eq(schema.positions.symbol, symbol)),
      );
  }

  /**
   * Get portfolio by ID.
   */
  async findById(id: string): Promise<typeof schema.portfolios.$inferSelect | undefined> {
    const [portfolio] = await db
      .select()
      .from(schema.portfolios)
      .where(eq(schema.portfolios.id, id))
      .limit(1);
    return portfolio;
  }
}

export const portfoliosRepository = new PortfoliosRepository();
