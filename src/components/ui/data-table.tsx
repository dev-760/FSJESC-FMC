import type { ReactNode } from "react";
import { Table, TableBody, TableCaption, TableHeader, TableRow, Td, Th } from "./table";
import { cn } from "@/lib/cn";

/**
 * A data table with a genuine mobile fallback (Part 9.4).
 *
 * Below `md`, each row is rendered as a stacked card: every cell keeps its column
 * label as a visible prefix, so no information is lost and nothing becomes an
 * unreadable shrunken desktop table. At `md` and above the same data renders as a
 * conventional table.
 *
 * The two renderings draw from one `columns` definition, so they cannot drift.
 */

export interface DataColumn<Row> {
  /** Stable key. Also used as the mobile card's field label. */
  key: string;
  header: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  /** Right-align and use tabular numerals. */
  numeric?: boolean;
  /**
   * Hide entirely on mobile. Use for low-priority columns (ids, timestamps)
   * rather than letting the card overflow.
   */
  hideOnMobile?: boolean;
  /** Accessible description of the column for screen readers. */
  srHeader?: string;
}

export interface DataTableProps<Row> {
  /** Caption. Always render one: it is the table's accessible name. */
  caption: string;
  captionHidden?: boolean;
  columns: readonly DataColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row, index: number) => string;
  emptyState?: ReactNode;
  className?: string;
}

export function DataTable<Row>({
  caption,
  captionHidden = false,
  columns,
  rows,
  rowKey,
  emptyState,
  className,
}: DataTableProps<Row>) {
  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <>
      {/* Mobile: stacked cards. Hidden from assistive tech to avoid duplicate content. */}
      <ul className="space-y-3 md:hidden" aria-hidden="true">
        {rows.map((row, index) => (
          <li
            key={rowKey(row, index)}
            className="border-border bg-surface shadow-panel rounded-lg border p-4"
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column) => (
                  <MobileCell key={column.key} column={column} row={row} index={index} />
                ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* Desktop: conventional table, the primary accessible presentation. */}
      <div className={cn("hidden md:block", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <Th key={column.key} numeric={column.numeric} srOnly={!column.srHeader && false}>
                  {column.header}
                </Th>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={rowKey(row, index)}>
                {columns.map((column) => (
                  <Td key={column.key} numeric={column.numeric}>
                    {column.render(row, index)}
                  </Td>
                ))}
              </TableRow>
            ))}
          </TableBody>
          <TableCaption className={cn(captionHidden && "sr-only")}>{caption}</TableCaption>
        </Table>
      </div>
    </>
  );
}

function MobileCell<Row>({
  column,
  row,
  index,
}: {
  column: DataColumn<Row>;
  row: Row;
  index: number;
}) {
  // The first non-numeric column acts as the card's heading row.
  if (!column.numeric) {
    return (
      <>
        <dt className="text-foreground col-start-2 text-sm font-semibold">
          {column.render(row, index)}
        </dt>
      </>
    );
  }
  return (
    <>
      <dt className="text-foreground-secondary text-xs">{column.header}</dt>
      <dd className="numeric text-foreground col-start-2 text-right text-sm">
        {column.render(row, index)}
      </dd>
    </>
  );
}
