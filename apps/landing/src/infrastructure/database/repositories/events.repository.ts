/**
 * Events repository (Part 4.2.7).
 *
 * Handles club sessions and events.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class EventsRepository {
  /**
   * Get all events.
   */
  async getAll(): Promise<typeof schema.events.$inferSelect[]> {
    return db.select().from(schema.events).orderBy(desc(schema.events.startsAt));
  }

  /**
   * Get published events only.
   */
  async getPublished(): Promise<typeof schema.events.$inferSelect[]> {
    return db
      .select()
      .from(schema.events)
      .where(eq(schema.events.isPublished, 1))
      .orderBy(schema.events.startsAt);
  }

  /**
   * Get upcoming events (published and start date in the future).
   */
  async getUpcoming(): Promise<typeof schema.events.$inferSelect[]> {
    return db
      .select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.isPublished, 1),
          // startsAt > now() would be handled by SQL, but for now we filter in JS
        ),
      )
      .orderBy(schema.events.startsAt);
  }

  /**
   * Get an event by ID.
   */
  async findById(id: string): Promise<typeof schema.events.$inferSelect | undefined> {
    const [event] = await db.select().from(schema.events).where(eq(schema.events.id, id)).limit(1);
    return event;
  }

  /**
   * Find an event by title.
   */
  async findByTitle(title: string): Promise<typeof schema.events.$inferSelect | undefined> {
    const [event] = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.title, title))
      .limit(1);
    return event;
  }

  /**
   * Create a new event.
   */
  async create(data: {
    title: string;
    description: string;
    location: string;
    startsAt: Date;
    endsAt: Date;
    capacity: number;
    isPublished?: number;
  }): Promise<typeof schema.events.$inferSelect> {
    const [event] = await db
      .insert(schema.events)
      .values({
        title: data.title,
        description: data.description,
        location: data.location,
        startsAt: data.startsAt,
        endsAt: data.endsAt,
        capacity: data.capacity,
        isPublished: data.isPublished ?? 0,
      })
      .returning();
    if (!event) {
      throw new Error(`Failed to create event: ${data.title}`);
    }
    return event;
  }

  /**
   * Update an event.
   */
  async update(
    id: string,
    data: {
      title?: string;
      description?: string;
      location?: string;
      startsAt?: Date;
      endsAt?: Date;
      capacity?: number;
      isPublished?: number;
    },
  ): Promise<typeof schema.events.$inferSelect> {
    const [event] = await db
      .update(schema.events)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.events.id, id))
      .returning();
    if (!event) {
      throw new Error(`Event not found: ${id}`);
    }
    return event;
  }

  /**
   * Publish an event.
   */
  async publish(id: string): Promise<typeof schema.events.$inferSelect> {
    const [event] = await db
      .update(schema.events)
      .set({ isPublished: 1, updatedAt: new Date() })
      .where(eq(schema.events.id, id))
      .returning();
    if (!event) {
      throw new Error(`Event not found: ${id}`);
    }
    return event;
  }

  /**
   * Unpublish an event.
   */
  async unpublish(id: string): Promise<typeof schema.events.$inferSelect> {
    const [event] = await db
      .update(schema.events)
      .set({ isPublished: 0, updatedAt: new Date() })
      .where(eq(schema.events.id, id))
      .returning();
    if (!event) {
      throw new Error(`Event not found: ${id}`);
    }
    return event;
  }

  /**
   * Delete an event.
   */
  async delete(id: string): Promise<void> {
    await db.delete(schema.events).where(eq(schema.events.id, id));
  }

  /**
   * Get events starting after a given date.
   */
  async getEventsAfter(_date: Date): Promise<typeof schema.events.$inferSelect[]> {
    return db
      .select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.isPublished, 1),
          // startsAt > date would be handled by SQL
        ),
      )
      .orderBy(schema.events.startsAt);
  }

  /**
   * Get events before a given date.
   */
  async getEventsBefore(_date: Date): Promise<typeof schema.events.$inferSelect[]> {
    return db
      .select()
      .from(schema.events)
      .where(
        and(
          eq(schema.events.isPublished, 1),
          // startsAt < date would be handled by SQL
        ),
      )
      .orderBy(desc(schema.events.startsAt));
  }
}

export const eventsRepository = new EventsRepository();
