/**
 * Admin events API route.
 *
 * Requires ADMINISTRATOR role.
 */

import { type NextRequest, NextResponse } from "next/server";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@fsjesc/config/errors";
import { requireRole } from "@/infrastructure/auth/utils";



export async function GET(_request: NextRequest) {
  try {
    await requireRole("ADMINISTRATOR");

    const events = await db.select().from(schema.events).orderBy(schema.events.startsAt);

    return NextResponse.json(events);
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
