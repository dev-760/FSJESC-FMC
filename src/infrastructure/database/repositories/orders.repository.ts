/**
 * Orders repository (Part 4.2.3, N1, N5).
 *
 * Handles order placement, execution, and idempotency.
 */

import { eq, and, or, lt, desc } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "@/lib/pagination";
import { db } from "../connection";
import * as schema from "../schema";

export class OrdersRepository {
  /**
   * Place an order with idempotency check.
   *
   * If the idempotency key exists, returns the existing order.
   * Otherwise, creates a new order.
   */
  async placeOrder(data: {
    portfolioId: string;
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT";
    requested: number;
    limitCents?: string;
    idempotencyKey?: string;
  }): Promise<{ order: typeof schema.orders.$inferSelect; isNew: boolean }> {
    // Check idempotency
    if (data.idempotencyKey) {
      const existing = await db
        .select()
        .from(schema.orders)
        .where(eq(schema.orders.idempotencyKey, data.idempotencyKey))
        .limit(1);

      if (existing.length > 0 && existing[0]) {
        return { order: existing[0], isNew: false };
      }
    }

    const [order] = await db
      .insert(schema.orders)
      .values({
        portfolioId: data.portfolioId,
        symbol: data.symbol,
        side: data.side,
        type: data.type,
        requested: data.requested,
        limitCents: data.limitCents,
        idempotencyKey: data.idempotencyKey,
        status: "FILLED", // Will be updated by trading engine
      })
      .returning();

    if (!order) {
      throw new Error("Failed to place order");
    }

    return { order, isNew: true };
  }

  /**
   * Update an order after execution.
   */
  async updateOrder(
    orderId: string,
    data: {
      filled: number;
      averageFillCents?: string;
      feeCents: string;
      status: "FILLED" | "PARTIAL" | "REJECTED" | "CANCELLED";
      reason?: string;
    },
  ): Promise<typeof schema.orders.$inferSelect> {
    const [order] = await db
      .update(schema.orders)
      .set({
        filled: data.filled,
        averageFillCents: data.averageFillCents,
        feeCents: data.feeCents,
        status: data.status,
        reason: data.reason,
        filledAt: new Date(),
      })
      .where(eq(schema.orders.id, orderId))
      .returning();
    if (!order) {
      throw new Error("Order not found");
    }
    return order;
  }

  /**
   * Get orders for a portfolio with cursor pagination.
   */
  async getOrders(
    portfolioId: string,
    limit: number = 20,
    cursor?: string,
  ): Promise<{ orders: typeof schema.orders.$inferSelect[]; nextCursor?: string }> {
    const decoded = decodeCursor(cursor);
    const conditions = [eq(schema.orders.portfolioId, portfolioId)];

    if (decoded) {
      const cursorDate = new Date(decoded.t);
      conditions.push(
        or(
          lt(schema.orders.placedAt, cursorDate),
          and(eq(schema.orders.placedAt, cursorDate), lt(schema.orders.id, decoded.id)),
        )!,
      );
    }

    const query = db
      .select()
      .from(schema.orders)
      .where(and(...conditions))
      .orderBy(desc(schema.orders.placedAt), desc(schema.orders.id))
      .limit(limit + 1);

    const orders = await query;

    if (orders.length > limit) {
      const last = orders[limit - 1];
      const nextCursor = last
        ? encodeCursor({ t: last.placedAt.toISOString(), id: last.id })
        : undefined;
      return { orders: orders.slice(0, limit), nextCursor };
    }

    return { orders };
  }

  /**
   * Get an order by ID.
   */
  async findById(id: string): Promise<typeof schema.orders.$inferSelect | undefined> {
    const [order] = await db.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
    return order;
  }

  /**
   * Create an execution record.
   */
  async createExecution(data: {
    orderId: string;
    symbol: string;
    quantity: number;
    priceCents: string;
    feeCents: string;
  }): Promise<typeof schema.executions.$inferSelect> {
    const [execution] = await db.insert(schema.executions).values(data).returning();
    if (!execution) {
      throw new Error("Failed to create execution");
    }
    return execution;
  }

  /**
   * Get executions for an order.
   */
  async getExecutions(orderId: string): Promise<typeof schema.executions.$inferSelect[]> {
    return db
      .select()
      .from(schema.executions)
      .where(eq(schema.executions.orderId, orderId))
      .orderBy(schema.executions.executedAt);
  }
}

export const ordersRepository = new OrdersRepository();
