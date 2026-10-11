/**
 * Admin competitions API route (`/api/admin/competitions`).
 *
 * Supports GET, POST, PATCH, and DELETE for trading competitions and scenario cohorts.
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
  type AdminCompetitionRecord,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    try {
      const dbCompetitions = await db
        .select()
        .from(schema.competitions)
        .orderBy(schema.competitions.startsAt);

      if (dbCompetitions.length > 0) {
        const merged: AdminCompetitionRecord[] = dbCompetitions.map((c) => {
          const existing = state.competitions.find((sc) => sc.id === c.id || sc.title === c.name);
          return {
            id: c.id,
            title: c.name,
            description: c.description ?? existing?.description ?? "",
            startingCashCents: c.startingCashCents,
            status: (c.status as AdminCompetitionRecord["status"]) ?? "DRAFT",
            startsAt: c.startsAt?.toISOString() ?? new Date().toISOString(),
            endsAt: c.endsAt?.toISOString() ?? new Date(Date.now() + 86400_000 * 14).toISOString(),
            participantCount: existing?.participantCount ?? 0,
            maxParticipants: existing?.maxParticipants ?? 100,
            scenario: existing?.scenario ?? "NORMAL",
            allowedMarkets: existing?.allowedMarkets ?? ["CSE", "STOCKS", "ETFS", "FOREX", "BONDS"],
          };
        });
        for (const localComp of state.competitions) {
          if (!merged.some((m) => m.title === localComp.title)) {
            merged.push(localComp);
          }
        }
        return NextResponse.json(merged);
      }
    } catch {
      // Fallback to in-memory admin store
    }

    return NextResponse.json(state.competitions);
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
      description?: string;
      startingCashMad?: number;
      status?: AdminCompetitionRecord["status"];
      startsAt?: string;
      endsAt?: string;
      maxParticipants?: number;
      scenario?: string;
      allowedMarkets?: string[];
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Competition title is required" }, { status: 400 });
    }

    const startsDate = body.startsAt ? new Date(body.startsAt) : new Date();
    const endsDate = body.endsAt
      ? new Date(body.endsAt)
      : new Date(startsDate.getTime() + 14 * 86400_000);
    const startingCashCents = String(Math.round((body.startingCashMad ?? 100_000) * 100));

    const newComp: AdminCompetitionRecord = {
      id: `comp-${Date.now()}`,
      title,
      description:
        body.description?.trim() ||
        "Multi-asset simulated trading competition scored on risk-adjusted return and drawdown control.",
      startingCashCents,
      status: body.status ?? "OPEN",
      startsAt: startsDate.toISOString(),
      endsAt: endsDate.toISOString(),
      participantCount: 0,
      maxParticipants: Number(body.maxParticipants) || 100,
      scenario: body.scenario ?? "NORMAL",
      allowedMarkets:
        body.allowedMarkets && body.allowedMarkets.length > 0
          ? body.allowedMarkets
          : ["CSE", "STOCKS", "ETFS", "FUTURES", "CRYPTO", "FOREX", "BONDS", "OPTIONS"],
    };

    const state = getAdminState();
    state.competitions.unshift(newComp);

    try {
      await db.insert(schema.competitions).values({
        name: newComp.title,
        description: newComp.description,
        startingCashCents: newComp.startingCashCents,
        status: newComp.status,
        startsAt: startsDate,
        endsAt: endsDate,
      });
    } catch {
      // Ignore if DB offline
    }

    recordAdminActivity(
      "COMPETITION_CREATED",
      `Created competition "${newComp.title}" (${(Number(startingCashCents) / 100).toLocaleString("fr-MA")} MAD starting capital, status=${newComp.status})`,
      admin.email,
    );

    return NextResponse.json(newComp, { status: 201 });
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
    const body = (await request.json()) as Partial<AdminCompetitionRecord> & {
      id?: string;
      startingCashMad?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "Competition id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const comp = state.competitions.find((c) => c.id === body.id);
    if (!comp) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) comp.title = body.title.trim();
    if (typeof body.description === "string") comp.description = body.description.trim();
    if (typeof body.startingCashMad === "number" && body.startingCashMad > 0) {
      comp.startingCashCents = String(Math.round(body.startingCashMad * 100));
    }
    if (body.status) comp.status = body.status;
    if (typeof body.maxParticipants === "number" && body.maxParticipants > 0) {
      comp.maxParticipants = body.maxParticipants;
    }
    if (body.scenario) comp.scenario = body.scenario;
    if (Array.isArray(body.allowedMarkets)) comp.allowedMarkets = body.allowedMarkets;

    try {
      if (body.status) {
        await db
          .update(schema.competitions)
          .set({ status: body.status, updatedAt: new Date() })
          .where(eq(schema.competitions.id, body.id));
      }
    } catch {
      // Ignore if local ID or DB offline
    }

    recordAdminActivity(
      "COMPETITION_UPDATED",
      `Updated competition "${comp.title}" -> status=${comp.status}, scenario=${comp.scenario}`,
      admin.email,
    );

    return NextResponse.json(comp);
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
      return NextResponse.json({ error: "Competition id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const idx = state.competitions.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }
    const [removed] = state.competitions.splice(idx, 1);

    try {
      await db.delete(schema.competitions).where(eq(schema.competitions.id, id));
    } catch {
      // Ignore if local ID or DB offline
    }

    recordAdminActivity(
      "COMPETITION_DELETED",
      `Removed competition "${removed?.title ?? id}"`,
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
