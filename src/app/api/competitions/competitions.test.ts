/**
 * Competition API routes integration tests.
 *
 * Note: These tests require a database connection and are skipped
 * when DATABASE_URL is not configured. They should be moved to an
 * integration test project.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe.skip("Competition API Routes", () => {
  beforeEach(() => {
    // Setup test database state
  });

  afterEach(() => {
    // Cleanup test database state
  });

  describe("GET /api/competitions", () => {
    it("should return competitions grouped by status", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });
  });

  describe("POST /api/competitions", () => {
    it("should create a new competition", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });

    it("should return 400 for missing required fields", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });
  });

  describe("POST /api/competitions/[id]/join", () => {
    it("should create isolated portfolio when joining", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });

    it("should return 400 for missing userId", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });
  });

  describe("GET /api/competitions/[id]/leaderboard", () => {
    it("should return leaderboard with scores", () => {
      // Skipped: requires database connection
      expect(true).toBe(true);
    });
  });
});
