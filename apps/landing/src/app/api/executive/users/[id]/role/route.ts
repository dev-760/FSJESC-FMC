/**
 * Executive user role update API route.
 *
 * Requires EXECUTIVE or ADMINISTRATOR role.
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@fsjesc/config/errors";
import { requireRole } from "@/infrastructure/auth/utils";



export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireRole("EXECUTIVE");

    const { id } = await params;
    const body = await request.json() as { role: string };
    const { role } = body;

    if (!role) {
      throw new AppError("VALIDATION_ERROR", "role is required");
    }

    // Validate role
    const validRoles = ["STUDENT", "MEMBER", "EXECUTIVE", "ADMINISTRATOR"];
    if (!validRoles.includes(role)) {
      throw new AppError("VALIDATION_ERROR", "Invalid role");
    }

    // Ownership check: executives cannot promote to or modify ADMINISTRATOR role
    if (role === "ADMINISTRATOR" && session.user.role !== "ADMINISTRATOR") {
      throw new AppError("FORBIDDEN", "Only administrators can grant ADMINISTRATOR role", {
        status: 403,
      });
    }

    // Ownership check: executives cannot modify other executives or administrators
    const [targetUser] = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    if (!targetUser) {
      throw new AppError("NOT_FOUND", "User not found", { status: 404 });
    }

    if (targetUser.role === "ADMINISTRATOR" && session.user.role !== "ADMINISTRATOR") {
      throw new AppError("FORBIDDEN", "Cannot modify administrator users", { status: 403 });
    }

    // Log audit entry
    await db.insert(schema.auditLog).values({
      actorId: session.user.id,
      action: "ROLE_UPDATE",
      entityType: "USER",
      entityId: id,
      changes: `Updated role to ${role}`,
    });

    // Update user role
    const updatedUsers = await db
      .update(schema.users)
      .set({ role: role as "STUDENT" | "MEMBER" | "EXECUTIVE" | "ADMINISTRATOR", updatedAt: new Date() })
      .where(eq(schema.users.id, id))
      .returning();

    if (!updatedUsers[0]) {
      throw new AppError("NOT_FOUND", "User not found after update", { status: 404 });
    }

    const user = updatedUsers[0];

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
