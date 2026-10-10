/**
 * Competition service (Part 4.2.6, Part 9).
 *
 * Handles competition lifecycle, scoring, and leaderboard generation.
 * Server-authoritative scoring: total return % with max drawdown tie-breaker.
 */

import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db } from "@/infrastructure/database/connection";
import * as schema from "@/infrastructure/database/schema";
import { numericStringToCents } from "@/infrastructure/database/money";
import { createPortfolio, markToMarket, totalEquityCents } from "@fsjesc/domain/trading/engine";
import { market } from "@fsjesc/domain/market";

export type CompetitionStatus = "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED";

export interface CompetitionScore {
  participantId: string;
  userId: string;
  portfolioId: string;
  totalReturnBps: bigint;
  maxDrawdownBps: bigint;
  equityCents: bigint;
  rank?: number;
}

export class CompetitionService {
  /**
   * Create a new competition.
   */
  async create(data: {
    name: string;
    description?: string;
    startingCashCents: string;
    startsAt: Date;
    endsAt: Date;
  }) {
    const [competition] = await db
      .insert(schema.competitions)
      .values({
        name: data.name,
        description: data.description,
        startingCashCents: data.startingCashCents,
        status: "DRAFT",
        startsAt: data.startsAt,
        endsAt: data.endsAt,
      })
      .returning();
    return competition;
  }

  /**
   * Update competition status.
   */
  async updateStatus(competitionId: string, status: CompetitionStatus) {
    const [competition] = await db
      .update(schema.competitions)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.competitions.id, competitionId))
      .returning();
    return competition;
  }

  /**
   * Join a competition.
   *
   * Creates an isolated competition portfolio for the user.
   */
  async joinCompetition(userId: string, competitionId: string) {
    // Check if already joined
    const existing = await db
      .select()
      .from(schema.competitionParticipants)
      .where(
        and(
          eq(schema.competitionParticipants.competitionId, competitionId),
          eq(schema.competitionParticipants.userId, userId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new Error("Already joined this competition");
    }

    // Get competition details
    const [competition] = await db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.id, competitionId))
      .limit(1);

    if (!competition) {
      throw new Error("Competition not found");
    }

    if (competition.status !== "UPCOMING" && competition.status !== "ACTIVE") {
      throw new Error("Competition is not accepting new participants");
    }

    // Create isolated portfolio
    const [portfolio] = await db
      .insert(schema.portfolios)
      .values({
        userId,
        cashCents: competition.startingCashCents,
        reservedCents: "0",
        realisedPnlCents: "0",
        isCompetition: 1,
        competitionId,
      })
      .returning();

    if (!portfolio) {
      throw new Error("Failed to create competition portfolio");
    }

    // Record participation
    const [participant] = await db
      .insert(schema.competitionParticipants)
      .values({
        competitionId,
        userId,
        portfolioId: portfolio.id,
        joinedAt: new Date(),
      })
      .returning();

    if (!participant) {
      throw new Error("Failed to record competition participation");
    }

    return { portfolio, participant };
  }

  /**
   * Calculate scores for all participants in a competition.
   *
   * Scoring: total return % (primary), max drawdown % (tie-breaker).
   * Never ranks by absolute profit (as per spec).
   */
  async calculateScores(competitionId: string): Promise<CompetitionScore[]> {
    const [competition] = await db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.id, competitionId))
      .limit(1);

    if (!competition) {
      throw new Error("Competition not found");
    }

    const startingCashCents = numericStringToCents(competition.startingCashCents);

    // Get all participants with their portfolios
    const participants = await db
      .select({
        participantId: schema.competitionParticipants.id,
        userId: schema.competitionParticipants.userId,
        portfolioId: schema.competitionParticipants.portfolioId,
        cashCents: schema.portfolios.cashCents,
      })
      .from(schema.competitionParticipants)
      .innerJoin(
        schema.portfolios,
        eq(schema.competitionParticipants.portfolioId, schema.portfolios.id),
      )
      .where(eq(schema.competitionParticipants.competitionId, competitionId));

    const portfolioIds = participants.map((p) => p.portfolioId);
    const allPositions =
      portfolioIds.length > 0
        ? await db
            .select()
            .from(schema.positions)
            .where(inArray(schema.positions.portfolioId, portfolioIds))
        : [];

    const positionsByPortfolio = new Map<string, typeof schema.positions.$inferSelect[]>();
    for (const pos of allPositions) {
      const list = positionsByPortfolio.get(pos.portfolioId) ?? [];
      list.push(pos);
      positionsByPortfolio.set(pos.portfolioId, list);
    }

    const now = new Date();
    const quotes = market.getQuotes(now);

    const scores: CompetitionScore[] = [];

    for (const participant of participants) {
      // Mark portfolio to market including held positions
      const portfolio = createPortfolio(numericStringToCents(participant.cashCents));
      const participantPositions = positionsByPortfolio.get(participant.portfolioId) ?? [];
      for (const pos of participantPositions) {
        portfolio.positions[pos.symbol] = {
          symbol: pos.symbol,
          quantity: pos.quantity,
          averageCostCents: Math.round(Number(numericStringToCents(pos.averageCostCents))),
          openedAt: Math.floor(pos.openedAt.getTime() / 1000),
        };
      }
      const marks = markToMarket(portfolio, quotes, [], now);
      const equityCents = totalEquityCents(portfolio, marks);

      // Calculate total return %
      const totalReturnBps =
        startingCashCents > 0n
          ? ((equityCents - startingCashCents) * 10_000n) / startingCashCents
          : 0n;

      // Calculate max drawdown (distance below starting capital or marked peak)
      const maxDrawdownBps =
        startingCashCents > 0n && equityCents < startingCashCents
          ? ((startingCashCents - equityCents) * 10_000n) / startingCashCents
          : 0n;

      scores.push({
        participantId: participant.participantId,
        userId: participant.userId,
        portfolioId: participant.portfolioId,
        totalReturnBps,
        maxDrawdownBps,
        equityCents,
      });
    }

    // Sort by total return % (descending), then by max drawdown (ascending)
    scores.sort((a, b) => {
      if (b.totalReturnBps !== a.totalReturnBps) {
        return b.totalReturnBps > a.totalReturnBps ? 1 : -1;
      }
      if (a.maxDrawdownBps !== b.maxDrawdownBps) {
        return a.maxDrawdownBps > b.maxDrawdownBps ? 1 : -1;
      }
      return 0;
    });

    // Assign ranks
    scores.forEach((score, index) => {
      score.rank = index + 1;
    });

    return scores;
  }

  /**
   * Get leaderboard for a competition.
   */
  async getLeaderboard(competitionId: string) {
    const scores = await this.calculateScores(competitionId);

    // Get user profiles for display
    const userIds = scores.map((s) => s.userId);
    const profiles = await db
      .select()
      .from(schema.profiles)
      .where(sql`${schema.profiles.userId} IN ${sql.raw(`(${userIds.join(",")})`)}`);

    const profileMap = new Map(profiles.map((p) => [p.userId, p]));

    return scores.map((score) => ({
      ...score,
      userName: profileMap.get(score.userId)?.name || "Anonymous",
    }));
  }

  /**
   * Get active competitions.
   */
  async getActiveCompetitions() {
    return db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.status, "ACTIVE"))
      .orderBy(schema.competitions.startsAt);
  }

  /**
   * Get upcoming competitions.
   */
  async getUpcomingCompetitions() {
    return db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.status, "UPCOMING"))
      .orderBy(schema.competitions.startsAt);
  }

  /**
   * Get completed competitions.
   */
  async getCompletedCompetitions() {
    return db
      .select()
      .from(schema.competitions)
      .where(eq(schema.competitions.status, "COMPLETED"))
      .orderBy(desc(schema.competitions.endsAt));
  }
}

export const competitionService = new CompetitionService();
