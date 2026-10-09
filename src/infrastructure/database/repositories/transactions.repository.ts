/**
 * Transactions repository (Part 4.2.4, N1, N6).
 *
 * Handles the immutable transaction ledger. Transactions are append-only
 * and never mutated directly.
 */

import { eq, and, or, lt, desc } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { db } from "../connection";
import * as schema from "../schema";

export class TransactionsRepository {
  /**
   * Create a new transaction record.
   *
   * This is append-only. Never update or delete transactions.
   */
  async create(data: {
    portfolioId: string;
    type: "DEPOSIT" | "WITHDRAWAL" | "BUY" | "SELL" | "FEE" | "DIVIDEND" | "ADJUSTMENT";
    amountCents: string;
    symbol?: string;
    referenceId?: string;
    description: string;
  }): Promise<typeof schema.transactions.$inferSelect> {
    const [transaction] = await db
      .insert(schema.transactions)
      .values({
        portfolioId: data.portfolioId,
        type: data.type,
        amountCents: data.amountCents,
        symbol: data.symbol,
        referenceId: data.referenceId,
        description: data.description,
      })
      .returning();
    if (!transaction) {
      throw new Error("Failed to create transaction");
    }
    return transaction;
  }

  /**
   * Get transactions for a portfolio with pagination.
   */
  async getTransactions(
    portfolioId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{ transactions: typeof schema.transactions.$inferSelect[]; nextCursor?: string }> {
    const decoded = decodeCursor(cursor);
    const conditions = [eq(schema.transactions.portfolioId, portfolioId)];

    if (decoded) {
      const cursorDate = new Date(decoded.t);
      conditions.push(
        or(
          lt(schema.transactions.createdAt, cursorDate),
          and(eq(schema.transactions.createdAt, cursorDate), lt(schema.transactions.id, decoded.id)),
        )!,
      );
    }

    const query = db
      .select()
      .from(schema.transactions)
      .where(and(...conditions))
      .orderBy(desc(schema.transactions.createdAt), desc(schema.transactions.id))
      .limit(limit + 1);

    const transactions = await query;

    if (transactions.length > limit) {
      const last = transactions[limit - 1];
      const nextCursor = last
        ? encodeCursor({ t: last.createdAt.toISOString(), id: last.id })
        : undefined;
      return { transactions: transactions.slice(0, limit), nextCursor };
    }

    return { transactions };
  }

  /**
   * Get transactions by type for a portfolio.
   */
  async getTransactionsByType(
    portfolioId: string,
    type: string,
  ): Promise<typeof schema.transactions.$inferSelect[]> {
    return db
      .select()
      .from(schema.transactions)
      .where(
        and(eq(schema.transactions.portfolioId, portfolioId), eq(schema.transactions.type, type)),
      )
      .orderBy(desc(schema.transactions.createdAt));
  }

  /**
   * Get transactions by reference ID (e.g., for a specific order).
   */
  async getTransactionsByReference(referenceId: string): Promise<typeof schema.transactions.$inferSelect[]> {
    return db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.referenceId, referenceId))
      .orderBy(schema.transactions.createdAt);
  }

  /**
   * Get a transaction by ID.
   */
  async findById(id: string): Promise<typeof schema.transactions.$inferSelect | undefined> {
    const [transaction] = await db
      .select()
      .from(schema.transactions)
      .where(eq(schema.transactions.id, id))
      .limit(1);
    return transaction;
  }

  /**
   * Get the total deposits for a portfolio.
   */
  async getTotalDeposits(portfolioId: string): Promise<string> {
    const all = await db
      .select({ amountCents: schema.transactions.amountCents })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.portfolioId, portfolioId),
          eq(schema.transactions.type, "DEPOSIT"),
        ),
      );

    const total = all.reduce((sum, row) => {
      return sum + BigInt(Math.round(parseFloat(row.amountCents) * 100));
    }, 0n);

    return (Number(total) / 100).toFixed(2);
  }

  /**
   * Get the total withdrawals for a portfolio.
   */
  async getTotalWithdrawals(portfolioId: string): Promise<string> {
    const all = await db
      .select({ amountCents: schema.transactions.amountCents })
      .from(schema.transactions)
      .where(
        and(
          eq(schema.transactions.portfolioId, portfolioId),
          eq(schema.transactions.type, "WITHDRAWAL"),
        ),
      );

    const total = all.reduce((sum, row) => {
      return sum + BigInt(Math.round(parseFloat(row.amountCents) * 100));
    }, 0n);

    return (Number(total) / 100).toFixed(2);
  }
}

export const transactionsRepository = new TransactionsRepository();
