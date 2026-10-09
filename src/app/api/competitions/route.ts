/**
 * Competitions API routes (Part 9).
 *
 * API endpoints for competition management.
 */

import { type NextRequest, NextResponse } from "next/server";
import { competitionService } from "@/application/competitions/competition.service";
import { AppError } from "@/lib/errors";



// GET /api/competitions - List all competitions
export async function GET() {
  try {
    const active = await competitionService.getActiveCompetitions();
    const upcoming = await competitionService.getUpcomingCompetitions();
    const completed = await competitionService.getCompletedCompetitions();

    return NextResponse.json({
      active,
      upcoming,
      completed,
    });
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

// POST /api/competitions - Create a competition
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as {
      name: string;
      description?: string;
      startingCashCents: number;
      startsAt: string | number | Date;
      endsAt: string | number | Date;
    };

    const { name, description, startingCashCents, startsAt, endsAt } = body;

    if (!name || !startingCashCents || !startsAt || !endsAt) {
      throw new AppError("VALIDATION_ERROR", "Required fields missing");
    }

    const competition = await competitionService.create({
      name,
      description,
      startingCashCents: String(startingCashCents),
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
    });

    return NextResponse.json(competition, { status: 201 });
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
