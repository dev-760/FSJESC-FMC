/**
 * Leaderboard API route.
 */

import { type NextRequest, NextResponse } from "next/server";
import { competitionService } from "@/application/competitions/competition.service";
import { AppError } from "@/lib/errors";



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const leaderboard = await competitionService.getLeaderboard(id);

    return NextResponse.json(leaderboard);
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
