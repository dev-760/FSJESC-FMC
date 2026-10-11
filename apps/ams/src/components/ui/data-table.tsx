import { Text, YStack, styled } from "tamagui";
import { Inbox } from "lucide-react";

/**
 * Data grid — rendered as `.table-wrap` + `<table className="table">` matching `mockups/AMS.html`.
 */

export const HeaderCell = styled(Text, {
  name: "HeaderCell",
  fontFamily: "$mono",
  fontSize: "$0",
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "$foregroundSecondary",
  whiteSpace: "nowrap",
});

export const NumericText = styled(Text, {
  name: "NumericText",
  fontFamily: "$mono",
  fontSize: "$2",
  color: "$foreground",
  textAlign: "right",
  whiteSpace: "nowrap",
});

export const CellText = styled(Text, {
  name: "CellText",
  fontSize: "$2",
  color: "$foregroundSecondary",
  lineHeight: 19,
});

export const StrongText = styled(Text, {
  name: "StrongText",
  fontSize: "$2",
  fontWeight: "600",
  color: "$foreground",
});

export interface Column<T> {
  header: string;
  width: number;
  numeric?: boolean;
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
}: {
  columns: readonly Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={column.numeric ? "num" : undefined}
                style={{ minWidth: Math.min(column.width, 180) }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td key={column.header} className={column.numeric ? "num" : undefined}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: column.numeric ? "flex-end" : "flex-start",
                      alignItems: "center",
                    }}
                  >
                    {column.render(row)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <Inbox size={24} color="var(--text-3)" />
      </div>
      <div className="empty-state__title">{title}</div>
      {description ? <div style={{ marginBottom: action ? 12 : 0 }}>{description}</div> : null}
      {action}
    </div>
  );
}

export function Skeleton({ height = 16, width }: { height?: number; width?: number | string }) {
  return (
    <YStack
      aria-hidden
      height={height}
      width={width}
      backgroundColor="$surfaceInset"
      borderRadius="$2"
      opacity={0.6}
    />
  );
}

export function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <YStack gap="$3" paddingVertical="$2" paddingHorizontal="$4">
      {Array.from({ length: rows }, (_, idx) => (
        <Skeleton key={idx} height={36} />
      ))}
    </YStack>
  );
}

export function LoadingRegion({
  label = "Loading",
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <YStack aria-busy aria-label={label}>
      {children}
    </YStack>
  );
}