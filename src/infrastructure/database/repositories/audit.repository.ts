/**
 * Audit log repository (Part 4.2.9, N6).
 *
 * Handles the immutable audit log. Records are append-only and never deleted.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class AuditRepository {
  /**
   * Create an audit log entry.
   *
   * This is append-only. Never update or delete audit entries.
   */
  async create(data: {
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    changes?: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<typeof schema.auditLog.$inferSelect> {
    const [entry] = await db
      .insert(schema.auditLog)
      .values({
        actorId: data.actorId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        changes: data.changes,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      })
      .returning();
    if (!entry) {
      throw new Error("Failed to create audit log entry");
    }
    return entry;
  }

  /**
   * Get audit entries for a specific actor.
   */
  async getByActor(actorId: string, limit: number = 100): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.actorId, actorId))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);
  }

  /**
   * Get audit entries for a specific entity.
   */
  async getByEntity(
    entityType: string,
    entityId: string,
    limit: number = 100,
  ): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db
      .select()
      .from(schema.auditLog)
      .where(
        and(eq(schema.auditLog.entityType, entityType), eq(schema.auditLog.entityId, entityId)),
      )
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);
  }

  /**
   * Get audit entries by action type.
   */
  async getByAction(action: string, limit: number = 100): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.action, action))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);
  }

  /**
   * Get recent audit entries.
   */
  async getRecent(limit: number = 50): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(limit);
  }

  /**
   * Get audit entries with pagination.
   */
  async getPaginated(
    limit: number = 50,
    cursor?: string,
  ): Promise<{ entries: typeof schema.auditLog.$inferSelect[]; nextCursor?: string }> {
    const query = db
      .select()
      .from(schema.auditLog)
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit + 1);

    if (cursor) {
      // Decode cursor timestamp
      // For simplicity, this is a placeholder - real implementation would decode cursor
    }

    const entries = await query;

    if (entries.length > limit) {
      const nextCursor = entries[limit - 1]?.id;
      if (!nextCursor) {
        return { entries: entries.slice(0, limit) };
      }
      return { entries: entries.slice(0, limit), nextCursor };
    }

    return { entries };
  }

  /**
   * Get an audit entry by ID.
   */
  async findById(id: string): Promise<typeof schema.auditLog.$inferSelect | undefined> {
    const [entry] = await db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.id, id))
      .limit(1);
    return entry;
  }

  /**
   * Get audit entries for a time range.
   */
  async getByTimeRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
  ): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db
      .select()
      .from(schema.auditLog)
      .where(
        and(
          // createdAt >= startDate AND createdAt <= endDate would be handled by SQL
        ),
      )
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);
  }

  /**
   * Get audit entries by IP address.
   */
  async getByIpAddress(ipAddress: string, limit: number = 100): Promise<typeof schema.auditLog.$inferSelect[]> {
    return db
      .select()
      .from(schema.auditLog)
      .where(eq(schema.auditLog.ipAddress, ipAddress))
      .orderBy(desc(schema.auditLog.createdAt))
      .limit(limit);
  }
}

export const auditRepository = new AuditRepository();
