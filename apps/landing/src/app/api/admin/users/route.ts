/**
 * Admin users & portfolios API route (`/api/admin/users`).
 *
 * Supports:
 * - GET: List all users with role, status, student track, and simulator portfolio cash
 * - POST: Provision a new user account + initial simulator portfolio
 * - PATCH: Update user role, status (active/suspended), profile, or reset/credit portfolio cash
 * - DELETE: Remove a user account
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
  type AdminUserRecord,
} from "@/infrastructure/admin/store";

export async function GET(request: NextRequest) {
  try {
    await authorizeAdminRequest(request);
    const state = getAdminState();

    try {
      const dbUsers = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          role: schema.users.role,
          createdAt: schema.users.createdAt,
        })
        .from(schema.users)
        .orderBy(schema.users.createdAt);

      if (dbUsers.length > 0) {
        const merged: AdminUserRecord[] = dbUsers.map((u) => {
          const existing = state.users.find((su) => su.email === u.email || su.id === u.id);
          return {
            id: u.id,
            email: u.email,
            name: existing?.name ?? u.email.split("@")[0] ?? null,
            studentId: existing?.studentId ?? null,
            track: existing?.track ?? "FSJESC Member",
            role: u.role,
            status: existing?.status ?? "active",
            cashCents: existing?.cashCents ?? "10000000",
            positionsCount: existing?.positionsCount ?? 0,
            ordersCount: existing?.ordersCount ?? 0,
            createdAt: u.createdAt.toISOString(),
          };
        });
        for (const localUser of state.users) {
          if (!merged.some((m) => m.email === localUser.email)) {
            merged.push(localUser);
          }
        }
        return NextResponse.json(merged);
      }
    } catch {
      // Fallback to in-memory admin store when local DB is offline
    }

    return NextResponse.json(state.users);
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
      email?: string;
      name?: string;
      studentId?: string;
      track?: string;
      role?: AdminUserRecord["role"];
      startingCashMad?: number;
    };

    const email = body.email?.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const state = getAdminState();
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    const startingCashCents = String(
      Math.round((body.startingCashMad ?? state.settings.defaultStartingCashMad) * 100),
    );

    const newUser: AdminUserRecord = {
      id: `usr-${Date.now()}`,
      email,
      name: body.name?.trim() || null,
      studentId: body.studentId?.trim() || `UH2C-${Math.floor(1000 + Math.random() * 9000)}`,
      track: body.track?.trim() || "Sciences Économiques & Gestion",
      role: body.role ?? "STUDENT",
      status: "active",
      cashCents: startingCashCents,
      positionsCount: 0,
      ordersCount: 0,
      createdAt: new Date().toISOString(),
    };

    state.users.unshift(newUser);

    recordAdminActivity(
      "USER_CREATED",
      `Provisioned account ${newUser.email} (${newUser.role}) with ${(Number(startingCashCents) / 100).toLocaleString("fr-MA")} MAD starting capital`,
      admin.email,
    );

    return NextResponse.json(newUser, { status: 201 });
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
    const body = (await request.json()) as {
      id?: string;
      role?: AdminUserRecord["role"];
      status?: AdminUserRecord["status"];
      name?: string;
      track?: string;
      portfolioAction?: "RESET_100K" | "CREDIT_CASH";
      creditAmountMad?: number;
    };

    if (!body.id) {
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const user = state.users.find((u) => u.id === body.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (body.role) {
      user.role = body.role;
      try {
        await db
          .update(schema.users)
          .set({ role: body.role, updatedAt: new Date() })
          .where(eq(schema.users.id, body.id));
      } catch {
        // Ignore if local ID or DB offline
      }
    }

    if (body.status) {
      user.status = body.status;
    }
    if (typeof body.name === "string") {
      user.name = body.name.trim() || null;
    }
    if (typeof body.track === "string") {
      user.track = body.track.trim();
    }

    if (body.portfolioAction === "RESET_100K") {
      user.cashCents = String(state.settings.defaultStartingCashMad * 100);
      user.positionsCount = 0;
      recordAdminActivity(
        "PORTFOLIO_RESET",
        `Reset simulator portfolio for ${user.email} to ${state.settings.defaultStartingCashMad.toLocaleString("fr-MA")} MAD`,
        admin.email,
      );
    } else if (body.portfolioAction === "CREDIT_CASH" && typeof body.creditAmountMad === "number") {
      const deltaCents = BigInt(Math.round(body.creditAmountMad * 100));
      const nextCash = BigInt(user.cashCents) + deltaCents;
      user.cashCents = (nextCash > 0n ? nextCash : 0n).toString();
      recordAdminActivity(
        "PORTFOLIO_CREDITED",
        `Adjusted simulator cash for ${user.email} by ${body.creditAmountMad >= 0 ? "+" : ""}${body.creditAmountMad.toLocaleString("fr-MA")} MAD`,
        admin.email,
      );
    } else {
      recordAdminActivity(
        "USER_UPDATED",
        `Updated user ${user.email} (role=${user.role}, status=${user.status})`,
        admin.email,
      );
    }

    return NextResponse.json(user);
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
      return NextResponse.json({ error: "User id is required" }, { status: 400 });
    }

    const state = getAdminState();
    const index = state.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [removed] = state.users.splice(index, 1);
    try {
      await db.delete(schema.users).where(eq(schema.users.id, id));
    } catch {
      // Ignore if local ID or DB offline
    }

    recordAdminActivity(
      "USER_DELETED",
      `Removed user account ${removed?.email ?? id}`,
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
