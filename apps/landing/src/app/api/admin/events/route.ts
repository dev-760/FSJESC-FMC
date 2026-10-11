/**
 * Admin events API route (`/api/admin/events`).
 *
 * Supports GET, POST, PATCH, and DELETE for club workshops, lectures, and sessions.
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
  type AdminEventRecord,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    try {
      const dbEvents = await db.select().from(schema.events).orderBy(schema.events.startsAt);
      if (dbEvents.length > 0) {
        const merged: AdminEventRecord[] = dbEvents.map((e) => {
          const existing = state.events.find((se) => se.id === e.id || se.title === e.title);
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            location: e.location,
            format: existing?.format ?? "IN_PERSON",
            startsAt: e.startsAt.toISOString(),
            endsAt: e.endsAt.toISOString(),
            capacity: e.capacity,
            registrationCount: existing?.registrationCount ?? 0,
            status:
              existing?.status ??
              (e.isPublished ? "scheduled" : "cancelled"),
          };
        });
        for (const localEvt of state.events) {
          if (!merged.some((m) => m.title === localEvt.title)) {
            merged.push(localEvt);
          }
        }
        return NextResponse.json(merged);
      }
    } catch {
      // Fallback to in-memory admin store
    }

    return NextResponse.json(state.events);
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
      location?: string;
      format?: AdminEventRecord["format"];
      startsAt?: string;
      endsAt?: string;
      capacity?: number;
      status?: AdminEventRecord["status"];
    };

    const title = body.title?.trim();
    if (!title) {
      return NextResponse.json({ error: "Event title is required" }, { status: 400 });
    }

    const startsDate = body.startsAt ? new Date(body.startsAt) : new Date(Date.now() + 86400_000 * 3);
    const endsDate = body.endsAt
      ? new Date(body.endsAt)
      : new Date(startsDate.getTime() + 2 * 3600_000);

    const newEvent: AdminEventRecord = {
      id: `evt-${Date.now()}`,
      title,
      description:
        body.description?.trim() ||
        "FSJESC Financial Markets Club interactive workshop and trading desk session.",
      location: body.location?.trim() || "Amphi 4 — FSJES Ain Chock, Casablanca",
      format: body.format ?? "IN_PERSON",
      startsAt: startsDate.toISOString(),
      endsAt: endsDate.toISOString(),
      capacity: Number(body.capacity) || 80,
      registrationCount: 0,
      status: body.status ?? "scheduled",
    };

    const state = getAdminState();
    state.events.unshift(newEvent);

    try {
      await db.insert(schema.events).values({
        title: newEvent.title,
        description: newEvent.description,
        location: newEvent.location,
        startsAt: startsDate,
        endsAt: endsDate,
        capacity: newEvent.capacity,
        isPublished: 1,
      });
    } catch {
      // Ignore if DB offline
    }

    recordAdminActivity(
      "EVENT_CREATED",
      `Scheduled event "${newEvent.title}" (${newEvent.format}, capacity ${newEvent.capacity})`,
      admin.email,
    );

    return NextResponse.json(newEvent, { status: 201 });
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
    const body = (await request.json()) as Partial<AdminEventRecord> & { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const event = state.events.find((e) => e.id === body.id);
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (typeof body.title === "string" && body.title.trim()) event.title = body.title.trim();
    if (typeof body.description === "string") event.description = body.description.trim();
    if (typeof body.location === "string" && body.location.trim()) event.location = body.location.trim();
    if (body.format) event.format = body.format;
    if (typeof body.capacity === "number" && body.capacity > 0) event.capacity = body.capacity;
    if (body.startsAt) event.startsAt = new Date(body.startsAt).toISOString();
    if (body.status) event.status = body.status;

    recordAdminActivity(
      "EVENT_UPDATED",
      `Updated event "${event.title}" (status=${event.status}, capacity=${event.capacity})`,
      admin.email,
    );

    return NextResponse.json(event);
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
      return NextResponse.json({ error: "Event id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const idx = state.events.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    const [removed] = state.events.splice(idx, 1);

    try {
      await db.delete(schema.events).where(eq(schema.events.id, id));
    } catch {
      // Ignore if local ID or DB offline
    }

    recordAdminActivity(
      "EVENT_DELETED",
      `Removed event "${removed?.title ?? id}"`,
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
