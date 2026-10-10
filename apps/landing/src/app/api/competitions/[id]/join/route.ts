/**
 * Join competition API route.
 */

import { type NextRequest, NextResponse } from "next/server";
import { competitionService } from "@/application/competitions/competition.service";
import { AppError } from "@fsjesc/config/errors";
import { requireAuth } from "@/infrastructure/auth/utils";



export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const session = await requireAuth();

    const { id } = await params;
    const body = await request.json() as { userId: string };
    const { userId } = body;

    // Ownership check: users can only join competitions for themselves
    if (userId !== session.user.id) {
      throw new AppError("FORBIDDEN", "You can only join competitions for yourself", {
        status: 403,
      });
    }

    const result = await competitionService.joinCompetition(userId, id);

    return NextResponse.json(result, { status: 201 });
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
