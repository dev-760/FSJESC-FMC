/**
 * Competition detail API route.
 */

import { type NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { AppError } from "@/lib/errors";



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [competition] = await db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.id, id))
      .limit(1);

    if (!competition) {
      throw new AppError("NOT_FOUND", "Competition not found", { status: 404 });
    }

    return NextResponse.json(competition);
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
