import { PAGINATION } from "@/config/site";

/**
 * Keyset (cursor) pagination (DECISIONS.md D12).
 *
 * Offset pagination is unsafe for a ledger that grows while a user is reading it:
 * newly inserted rows shift page boundaries and cause both duplicates and omissions.
 * A cursor over a unique, monotonic sort key is stable under concurrent writes.
 */

export interface Cursor {
  /** ISO timestamp of the last row of the previous page. */
  t: string;
  /** Tiebreaker id of the last row. */
  id: string;
}

export interface Page<T> {
  items: T[];
  /** Cursor to pass back for the next page, or `null` at the end. */
  nextCursor: string | null;
  /** True when a further page exists. */
  hasMore: boolean;
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(value: string | null | undefined): Cursor | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      typeof (parsed as Cursor).t === "string" &&
      typeof (parsed as Cursor).id === "string"
    ) {
      return { t: (parsed as Cursor).t, id: (parsed as Cursor).id };
    }
  } catch {
    // Fall through: a malformed cursor is treated as "first page" rather than an
    // error, because a stale bookmark in the URL should not break the page.
  }
  return null;
}

/** Clamp a requested page size into the configured bounds. */
export function resolvePageSize(requested: unknown): number {
  const parsed = typeof requested === "string" ? Number.parseInt(requested, 10) : Number(requested);
  if (!Number.isFinite(parsed)) return PAGINATION.defaultPageSize;
  return Math.min(Math.max(Math.trunc(parsed), 1), PAGINATION.maxPageSize);
}

/**
 * Build a page from one extra row fetched past the limit.
 * Pass `rows.length > pageSize` to learn whether more data exists without a
 * second count query.
 */
export function buildPage<T extends { createdAt: Date; id: string }>(
  rows: readonly T[],
  pageSize: number,
): Page<T> {
  const hasMore = rows.length > pageSize;
  const items = hasMore ? rows.slice(0, pageSize) : [...rows];
  const last = items.at(-1);
  return {
    items,
    hasMore,
    nextCursor:
      hasMore && last ? encodeCursor({ t: last.createdAt.toISOString(), id: last.id }) : null,
  };
}
