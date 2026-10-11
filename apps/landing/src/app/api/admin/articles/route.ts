/**
 * Admin articles & curriculum API route (`/api/admin/articles`).
 *
 * Supports GET, POST, PATCH, and DELETE for educational articles and research notes.
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@fsjesc/config/errors";
import {
  authorizeAdminRequest,
  getAdminState,
  recordAdminActivity,
  type AdminArticleRecord,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    try {
      const dbArticles = await db
        .select()
        .from(schema.articles)
        .orderBy(schema.articles.publishedAt);

      if (dbArticles.length > 0) {
        const merged: AdminArticleRecord[] = dbArticles.map((a) => {
          const existing = state.articles.find((sa) => sa.slug === a.slug || sa.id === a.id);
          return {
            id: a.id,
            title: a.title,
            slug: a.slug,
            category: a.category,
            level: existing?.level ?? "FOUNDATION",
            readingTimeMinutes: existing?.readingTimeMinutes ?? 10,
            summary: a.summary,
            content: existing?.content,
            essential: a.essential === 1,
            status: existing?.status ?? "published",
            updatedAt: a.updatedAt.toISOString(),
          };
        });
        for (const localArt of state.articles) {
          if (!merged.some((m) => m.slug === localArt.slug)) {
            merged.push(localArt);
          }
        }
        return NextResponse.json(merged);
      }
    } catch {
      // Fallback to in-memory admin store
    }

    return NextResponse.json(state.articles);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const body = (await request.json()) as {
      title?: string;
      slug?: string;
      category?: string;
      level?: AdminArticleRecord["level"];
      readingTimeMinutes?: number;
      summary?: string;
      content?: string;
      essential?: boolean;
      status?: AdminArticleRecord["status"];
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Article title is required" }, { status: 400 });
    }

    const slug =
      body.slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-") ||
      title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const state = getAdminState();
    const newArticle: AdminArticleRecord = {
      id: `art-${Date.now()}`,
      title,
      slug,
      category: body.category?.trim() || "Market Structure",
      level: body.level ?? "FOUNDATION",
      readingTimeMinutes: Number(body.readingTimeMinutes) || 10,
      summary:
        body.summary?.trim() ||
        "FSJESC-FMC educational briefing on Moroccan and global financial markets.",
      content: body.content ?? "",
      essential: Boolean(body.essential),
      status: body.status ?? "published",
      updatedAt: new Date().toISOString(),
    };

    state.articles.unshift(newArticle);

    try {
      await db.insert(schema.articles).values({
        slug: newArticle.slug,
        title: newArticle.title,
        summary: newArticle.summary,
        category: newArticle.category,
        essential: newArticle.essential ? 1 : 0,
      });
    } catch {
      // Ignore if DB offline
    }

    recordAdminActivity(
      "ARTICLE_CREATED",
      `Created article "${newArticle.title}" (${newArticle.category}, ${newArticle.status})`,
      admin.email,
    );

    return NextResponse.json(newArticle, { status: 201 });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const body = (await request.json()) as Partial<AdminArticleRecord> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Article id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const article = state.articles.find((a) => a.id === body.id);
    if (!article) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) article.title = body.title.trim();
    if (typeof body.category === "string" && body.category.trim()) article.category = body.category.trim();
    if (body.level) article.level = body.level;
    if (typeof body.readingTimeMinutes === "number") article.readingTimeMinutes = body.readingTimeMinutes;
    if (typeof body.summary === "string") article.summary = body.summary.trim();
    if (typeof body.content === "string") article.content = body.content;
    if (typeof body.essential === "boolean") article.essential = body.essential;
    if (body.status) article.status = body.status;
    article.updatedAt = new Date().toISOString();

    recordAdminActivity(
      "ARTICLE_UPDATED",
      `Updated article "${article.title}" (status=${article.status}, essential=${article.essential})`,
      admin.email,
    );

    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const admin = await authorizeAdminRequest(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Article id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const idx = state.articles.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }
    const [removed] = state.articles.splice(idx, 1);

    try {
      await db.delete(schema.articles).where(eq(schema.articles.id, id));
    } catch {
      // Ignore if local ID or DB offline
    }

    recordAdminActivity(
      "ARTICLE_DELETED",
      `Deleted article "${removed?.title ?? id}"`,
      admin.email,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }
    return NextResponse.json(
      { error: "Internal server error", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
