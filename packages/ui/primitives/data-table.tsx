import { cn } from "@fsjesc/config/cn";
import { Num } from "./num";
import type { ReactNode } from "react";

/**
 * `DataTable` — the one table on the platform.
 *
 * Built for a dense terminal, so the defaults lean institutional:
 *   - numeric columns are right-aligned and monospaced, always
 *   - the header is a tracked mono label row with hairline rules, not a bold bar
 *   - row rules are hairlines, so the eye follows a column across the page
 *
 * `numeric` columns declare themselves. A table cannot infer that "Change" is a
 * number and "Sector" is not, and guessing wrong is how a right-aligned text
 * column appears.
 */

export type ColumnAlign = "left" | "right" | "center";

export interface Column<T> {
  /** Column header. Short by design — a wrapped header breaks the grid. */
  header: string;
  /** Rendered right-aligned and in the numeric face. */
  numeric?: boolean;
  align?: ColumnAlign;
  width?: string;
  render: (row: T, index: number) => ReactNode;
  /** Announced to assistive technology when the visible header is abbreviated. */
  headerHint?: string;
  /**
   * Omitted from the mobile card. Use for low-priority columns (ids, timestamps)
   * rather than letting the card overflow.
   */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  /** Hidden visually, required in the accessibility tree. */
  captionHidden?: boolean;
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T, index: number) => string;
  /** Rendered under the header, right-aligned. Machine facts, not a legend. */
  meta?: ReactNode;
  /** Replaces the empty state. */
  empty?: ReactNode;
  /** Rows that highlight the left edge. For the current or selected row. */
  isHighlighted?: (row: T) => boolean;
  className?: string;
}

const ALIGN: Record<ColumnAlign, string> = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
};

export function DataTable<T>({
  caption,
  captionHidden = true,
  columns,
  rows,
  rowKey,
  meta,
  empty,
  isHighlighted,
  className,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className={cn("border-rule bg-surface border", className)}>
        <p className="label border-rule border-b px-4 py-2.5">{caption}</p>
        <div className="px-4 py-10 text-center">
          {empty ?? <p className="text-foreground-secondary text-sm">Nothing to show.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("border-rule bg-surface border", className)}>
      <div className="border-rule flex items-baseline justify-between gap-4 border-b px-4 py-2.5">
        <p className="label">{caption}</p>
        {meta ? <p className="text-2xs text-foreground-secondary">{meta}</p> : null}
      </div>

      {/*
        Below `md`, each row becomes a stacked card where every cell keeps its column
        label as a visible prefix — no information is lost and nothing turns into an
        unreadable shrunken table (Part 9.4). Both renderings draw from the one
        `columns` definition, so they cannot drift.
      */}
      <ul className="divide-rule divide-y md:hidden" aria-label={caption}>
        {rows.map((row, rowIndex) => {
          const visibleCols = columns.filter((column) => !column.hideOnMobile);
          return (
            <li key={rowKey(row, rowIndex)} className="px-4 py-3">
              <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1.5">
                {visibleCols.map((column, colIdx) => (
                  <MobileCell
                    key={column.header}
                    column={column}
                    row={row}
                    index={rowIndex}
                    isLead={colIdx === 0 && !column.numeric}
                  />
                ))}
              </dl>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full border-collapse text-sm">
          <caption className={captionHidden ? "sr-only" : "px-4 py-3 text-left"}>{caption}</caption>
          <thead>
            <tr className="border-rule border-b">
              {columns.map((column) => (
                <th
                  key={column.header}
                  scope="col"
                  style={column.width ? { width: column.width } : undefined}
                  className={cn(
                    "label text-2xs px-4 py-2 font-normal whitespace-nowrap",
                    column.numeric ? "text-right" : ALIGN[column.align ?? "left"],
                  )}
                >
                  {column.header}
                  {column.headerHint ? (
                    <span className="sr-only">, {column.headerHint}</span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const highlighted = isHighlighted?.(row) ?? false;
              return (
                <tr
                  key={rowKey(row, rowIndex)}
                  className={cn(
                    "border-rule border-b transition-colors last:border-b-0",
                    highlighted ? "bg-surface-inset" : "hover:bg-surface-sunken",
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.header}
                      className={cn(
                        "px-4 py-2.5 align-middle",
                        column.numeric ? "text-right" : ALIGN[column.align ?? "left"],
                        // Row rules divide; a vertical rule appears only where a row is
                        // highlighted, which is where the eye needs the edge.
                        highlighted && "border-l-info border-l-2",
                      )}
                    >
                      {column.render(row, rowIndex)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * One cell of the mobile card.
 *
 * The first non-numeric column becomes the card's heading, which keeps the symbol or
 * name at the top where the thumb lands.
 */
function MobileCell<T>({
  column,
  row,
  index,
  isLead,
}: {
  column: Column<T>;
  row: T;
  index: number;
  isLead: boolean;
}) {
  if (isLead) {
    return (
      <>
        <dt className="sr-only">{column.header}</dt>
        <dd className="text-foreground col-span-2 mb-1 text-sm font-semibold">
          {column.render(row, index)}
        </dd>
      </>
    );
  }

  return (
    <>
      <dt className="text-foreground-secondary text-xs">{column.header}</dt>
      <dd className={cn("text-right text-sm", column.numeric && "numeric")}>
        {column.render(row, index)}
      </dd>
    </>
  );
}

/**
 * A symbol cell: ticker in the numeric face, name beneath in secondary text.
 *
 * One component so a ticker always looks like a ticker — on the watchlist, in the
 * order ticket, and in a competition leaderboard.
 */
export function SymbolCell({
  symbol,
  name,
  muted,
}: {
  symbol: string;
  name?: string;
  muted?: boolean;
}) {
  return (
    <span className="flex flex-col">
      <span className={cn("numeric font-medium", muted && "text-foreground-secondary")}>
        {symbol}
      </span>
      {name ? (
        <span className="text-2xs text-foreground-secondary truncate font-normal">{name}</span>
      ) : null}
    </span>
  );
}

/**
 * A price cell: last price, with the change beneath it.
 *
 * The two figures share a right edge so the digits line up, which is the only reason
 * this is a component rather than two `<td>`s at each call site.
 */
export function PriceCell({
  cents,
  changeBps,
  size = "sm",
}: {
  cents: number;
  changeBps?: bigint;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const tone =
    changeBps === undefined
      ? "neutral"
      : changeBps > 0n
        ? "positive"
        : changeBps < 0n
          ? "negative"
          : "neutral";
  return (
    <span className="flex flex-col items-end">
      <Num cents={cents} size={size} tone="neutral" />
      {changeBps !== undefined ? (
        <Num value={Number(changeBps) / 100} decimals={2} signed size="2xs" tone={tone} />
      ) : null}
    </span>
  );
}
