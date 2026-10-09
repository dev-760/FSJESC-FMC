import { Paragraph, ScrollView, Text, XStack, YStack, styled } from "tamagui";
import { Inbox } from "lucide-react";

/**
 * Data grid.
 *
 * The pages previously hand-rolled "tables" as a row of flex children with
 * hand-tuned gaps. That gave no alignment between columns and no header row, so
 * nothing on screen said that "100" was a quantity or "125.50" a price.
 *
 * `@tamagui/table` is not a dependency of this app, so the grid is built from
 * stack primitives with explicit column widths: a shared width per column is
 * what actually produces the alignment, and it is the part the hand-rolled
 * version was missing. A monospaced, tabular header row states each column's
 * meaning.
 */

/** Tracked uppercase mono header — states what a column holds. */
export const HeaderCell = styled(Text, {
  name: "HeaderCell",
  fontFamily: "$mono",
  fontSize: "$0",
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "$foregroundSecondary",
  whiteSpace: "nowrap",
});

/** Numeric body text: tabular figures so digits align down the column. */
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
  /** Fixed width. Without this a column cannot align down its length. */
  width: number;
  /** Right-align numeric columns. */
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
    <YStack>
      {/* Horizontal rather than vertical: a data table is bounded by its row
          count, and width is the axis that overflows first on a laptop. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <YStack minWidth={columns.reduce((sum, c) => sum + c.width, 0)}>
          <XStack
            borderBottomWidth={1}
            borderColor="$ruleStrong"
            paddingVertical="$2"
            gap="$3"
          >
            {columns.map((column) => (
              <HeaderCell key={column.header} width={column.width}>
                {column.header}
              </HeaderCell>
            ))}
          </XStack>

          {rows.map((row, index) => (
            <XStack
              key={rowKey(row)}
              alignItems="center"
              gap="$3"
              paddingVertical="$3"
              borderBottomWidth={index === rows.length - 1 ? 0 : 1}
              borderColor="$ruleFaint"
              hoverStyle={{ backgroundColor: "$surfaceSunken" }}
            >
              {columns.map((column) => (
                <YStack key={column.header} width={column.width}>
                  {column.render(row)}
                </YStack>
              ))}
            </XStack>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}

/**
 * Empty state.
 *
 * An empty list is a designed state, not an omission: it says what would appear
 * here and what to do next.
 */
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
    <YStack
      alignItems="center"
      justifyContent="center"
      paddingVertical="$8"
      paddingHorizontal="$4"
      gap="$2"
    >
      <Inbox size={24} color="#6b7280" />
      <Text fontSize="$3" fontWeight="600" color="$foreground" textAlign="center">
        {title}
      </Text>
      {description ? (
        <Paragraph
          fontSize="$2"
          color="$foregroundSecondary"
          textAlign="center"
          maxWidth={380}
          lineHeight={19}
        >
          {description}
        </Paragraph>
      ) : null}
      {action}
    </YStack>
  );
}

/**
 * A loading placeholder sized like the content it replaces.
 *
 * Deliberately static: an animation here would need CSS that this component
 * layer has no way to express, and a steady grey block is a perfectly legible
 * loading state on its own.
 */
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

/**
 * Loading region.
 *
 * `aria-busy` plus an accessible label means a screen reader learns the region
 * is loading without hearing a generic "loading" on every keystroke.
 */
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