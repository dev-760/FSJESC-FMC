/**
 * Assets repository (Part 4.2.5).
 *
 * Handles the eight fictional instruments. These are static and seeded once.
 */

import { eq } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class AssetsRepository {
  /**
   * Get all assets.
   */
  async getAll(): Promise<typeof schema.assets.$inferSelect[]> {
    return db.select().from(schema.assets);
  }

  /**
   * Get an asset by ticker.
   */
  async findByTicker(ticker: string): Promise<typeof schema.assets.$inferSelect | undefined> {
    const [asset] = await db
      .select()
      .from(schema.assets)
      .where(eq(schema.assets.ticker, ticker))
      .limit(1);
    return asset;
  }

  /**
   * Get assets by sector.
   */
  async getBySector(sector: string): Promise<typeof schema.assets.$inferSelect[]> {
    return db.select().from(schema.assets).where(eq(schema.assets.sector, sector));
  }

  /**
   * Create an asset (used during seeding).
   */
  async create(data: {
    ticker: string;
    name: string;
    sector: string;
    currency?: string;
    startingPriceCents: string;
    annualDrift: string;
    annualVolatility: string;
    averageDailyVolume: number;
  }): Promise<typeof schema.assets.$inferSelect> {
    const [asset] = await db
      .insert(schema.assets)
      .values({
        ticker: data.ticker,
        name: data.name,
        sector: data.sector,
        currency: data.currency ?? "MAD",
        startingPriceCents: data.startingPriceCents,
        annualDrift: data.annualDrift,
        annualVolatility: data.annualVolatility,
        averageDailyVolume: data.averageDailyVolume,
      })
      .returning();
    if (!asset) {
      throw new Error(`Failed to create asset: ${data.ticker}`);
    }
    return asset;
  }

  /**
   * Upsert an asset (create or update).
   */
  async upsert(data: {
    ticker: string;
    name: string;
    sector: string;
    currency?: string;
    startingPriceCents: string;
    annualDrift: string;
    annualVolatility: string;
    averageDailyVolume: number;
  }): Promise<typeof schema.assets.$inferSelect> {
    const existing = await this.findByTicker(data.ticker);
    if (existing) {
      const [asset] = await db
        .update(schema.assets)
        .set({
          name: data.name,
          sector: data.sector,
          currency: data.currency ?? "MAD",
          startingPriceCents: data.startingPriceCents,
          annualDrift: data.annualDrift,
          annualVolatility: data.annualVolatility,
          averageDailyVolume: data.averageDailyVolume,
        })
        .where(eq(schema.assets.ticker, data.ticker))
        .returning();
      if (!asset) {
        throw new Error(`Failed to update asset: ${data.ticker}`);
      }
      return asset;
    }
    return this.create(data);
  }

  /**
   * Check if an asset exists by ticker.
   */
  async exists(ticker: string): Promise<boolean> {
    const [asset] = await db
      .select({ id: schema.assets.ticker })
      .from(schema.assets)
      .where(eq(schema.assets.ticker, ticker))
      .limit(1);
    return !!asset;
  }

  /**
   * Get all unique sectors.
   */
  async getSectors(): Promise<string[]> {
    const results = await db.selectDistinct({ sector: schema.assets.sector }).from(schema.assets);
    return results.map((r) => r.sector);
  }
}

export const assetsRepository = new AssetsRepository();
