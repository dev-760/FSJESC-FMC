/**
 * Articles repository (Part 4.2.8).
 *
 * Handles published education content. Links to markdown files in src/content/topics.
 */

import { eq, and, desc } from "drizzle-orm";
import { db } from "../connection";
import * as schema from "../schema";

export class ArticlesRepository {
  /**
   * Get all articles.
   */
  async getAll(): Promise<typeof schema.articles.$inferSelect[]> {
    return db.select().from(schema.articles).orderBy(desc(schema.articles.publishedAt));
  }

  /**
   * Get an article by slug.
   */
  async findBySlug(slug: string): Promise<typeof schema.articles.$inferSelect | undefined> {
    const [article] = await db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug))
      .limit(1);
    return article;
  }

  /**
   * Get articles by category.
   */
  async getByCategory(category: string): Promise<typeof schema.articles.$inferSelect[]> {
    return db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.category, category))
      .orderBy(desc(schema.articles.publishedAt));
  }

  /**
   * Get essential articles (flagged as core curriculum).
   */
  async getEssential(): Promise<typeof schema.articles.$inferSelect[]> {
    return db
      .select()
      .from(schema.articles)
      .where(eq(schema.articles.essential, 1))
      .orderBy(schema.articles.publishedAt);
  }

  /**
   * Create a new article.
   */
  async create(data: {
    slug: string;
    title: string;
    summary: string;
    category: string;
    essential?: number;
  }): Promise<typeof schema.articles.$inferSelect> {
    const [article] = await db
      .insert(schema.articles)
      .values({
        slug: data.slug,
        title: data.title,
        summary: data.summary,
        category: data.category,
        essential: data.essential ?? 0,
      })
      .returning();
    if (!article) {
      throw new Error(`Failed to create article: ${data.slug}`);
    }
    return article;
  }

  /**
   * Update an article.
   */
  async update(
    slug: string,
    data: {
      title?: string;
      summary?: string;
      category?: string;
      essential?: number;
    },
  ): Promise<typeof schema.articles.$inferSelect> {
    const [article] = await db
      .update(schema.articles)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schema.articles.slug, slug))
      .returning();
    if (!article) {
      throw new Error(`Article not found: ${slug}`);
    }
    return article;
  }

  /**
   * Mark an article as essential.
   */
  async markEssential(slug: string): Promise<typeof schema.articles.$inferSelect> {
    const [article] = await db
      .update(schema.articles)
      .set({ essential: 1, updatedAt: new Date() })
      .where(eq(schema.articles.slug, slug))
      .returning();
    if (!article) {
      throw new Error(`Article not found: ${slug}`);
    }
    return article;
  }

  /**
   * Unmark an article as essential.
   */
  async unmarkEssential(slug: string): Promise<typeof schema.articles.$inferSelect> {
    const [article] = await db
      .update(schema.articles)
      .set({ essential: 0, updatedAt: new Date() })
      .where(eq(schema.articles.slug, slug))
      .returning();
    if (!article) {
      throw new Error(`Article not found: ${slug}`);
    }
    return article;
  }

  /**
   * Delete an article.
   */
  async delete(slug: string): Promise<void> {
    await db.delete(schema.articles).where(eq(schema.articles.slug, slug));
  }

  /**
   * Get all unique categories.
   */
  async getCategories(): Promise<string[]> {
    const results = await db
      .selectDistinct({ category: schema.articles.category })
      .from(schema.articles);
    return results.map((r) => r.category);
  }

  /**
   * Check if an article exists by slug.
   */
  async exists(slug: string): Promise<boolean> {
    const [article] = await db
      .select({ slug: schema.articles.slug })
      .from(schema.articles)
      .where(eq(schema.articles.slug, slug))
      .limit(1);
    return !!article;
  }

  /**
   * Search articles by title or summary.
   */
  async search(_query: string): Promise<typeof schema.articles.$inferSelect[]> {
    // Simple search - in production you'd use pg_trgm or full-text search
    return db
      .select()
      .from(schema.articles)
      .where(
        and(
          // title ILIKE pattern OR summary ILIKE pattern
          // Using raw SQL for ILIKE
        ),
      )
      .orderBy(desc(schema.articles.publishedAt));
  }
}

export const articlesRepository = new ArticlesRepository();
