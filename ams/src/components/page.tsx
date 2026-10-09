"use client";

import { Paragraph, Text, XStack, YStack } from "tamagui";
import { AlertTriangle, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Skeleton } from "@/components/ui/data-table";
import type { Resource } from "@/lib/use-resource";

/**
 * Page-level components.
 *
 * These were previously re-declared inside each of the eight pages, with a
 * `StatCard` on the dashboard and a differently-shaped `StyledBadge` on five
 * separate screens.
 */

/** Title and lead for a page. */
export function PageHeader({
  title,
  lead,
  action,
}: {
  title: string;
  lead?: string;
  action?: React.ReactNode;
}) {
  return (
    <XStack
      alignItems="flex-start"
      justifyContent="space-between"
      gap="$4"
      marginBottom="$5"
      flexWrap="wrap"
    >
      <YStack gap="$1" flex={1} minWidth={240}>
        <Text fontSize="$8" fontWeight="700" letterSpacing={-0.6}>
          {title}
        </Text>
        {lead ? (
          <Paragraph fontSize="$3" color="$foregroundSecondary" lineHeight={20}>
            {lead}
          </Paragraph>
        ) : null}
      </YStack>
      {action}
    </XStack>
  );
}

/**
 * A single headline figure.
 *
 * The value is monospaced and tabular so that a row of these aligns on the
 * decimal, which is the whole reason a financial summary is scannable.
 */
export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <Card flex={1} minWidth={180} padding="$4">
      <Text
        fontFamily="$mono"
        fontSize="$0"
        letterSpacing={1.2}
        textTransform="uppercase"
        color="$foregroundSecondary"
      >
        {label}
      </Text>
      <Text fontFamily="$mono" fontSize="$7" fontWeight="700" marginTop="$2" color="$foreground">
        {value}
      </Text>
      {hint ? (
        <Text fontSize="$1" color="$foregroundMuted" marginTop="$1">
          {hint}
        </Text>
      ) : null}
    </Card>
  );
}

/** A row of stat cards that wraps rather than overflowing. */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <XStack flexWrap="wrap" gap="$4" marginBottom="$6">
      {children}
    </XStack>
  );
}

/**
 * Loading placeholder matching the shape of a stat row.
 *
 * Skeletons are sized like the content they stand in for so the layout does not
 * jump when the data lands.
 */
export function StatSkeleton({ count = 4 }: { count?: number }) {
  return (
    <StatGrid>
      {Array.from({ length: count }, (_, index) => (
        <StatCard key={index} label="Loading" value={<Skeleton width={72} height={28} />} />
      ))}
    </StatGrid>
  );
}

/**
 * Error state.
 *
 * Previously a failed request was indistinguishable from an empty one. This
 * states what failed and offers the one action that helps.
 */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card padding="$5" marginBottom="$5">
      <XStack alignItems="flex-start" gap="$3">
        <AlertTriangle size={20} color="#ef4444" />
        <YStack gap="$3" flex={1}>
          <Text fontSize="$3" fontWeight="600" color="$foreground">
            This data could not be loaded
          </Text>
          <Paragraph fontSize="$2" color="$foregroundSecondary" lineHeight={19}>
            {message}
          </Paragraph>
          <YStack alignItems="flex-start">
            <Button variant="outline" size="sm" onPress={onRetry}>
              <XStack alignItems="center" gap="$2">
                <RefreshCw size={14} />
                <Text>Try again</Text>
              </XStack>
            </Button>
          </YStack>
        </YStack>
      </XStack>
    </Card>
  );
}

/** Empty state for a list. */
export function NoResults({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return <EmptyState title={title} description={description} />;
}

/**
 * Render a resource, handling all three states.
 *
 * Typing the loader as a narrowing function means the `ready` branch is the
 * only place `data` is visible, so a page cannot accidentally read it while
 * still loading.
 */
export function ResourceView<T>({
  resource,
  onRetry,
  loading,
  children,
}: {
  resource: Resource<T>;
  onRetry: () => void;
  loading?: React.ReactNode;
  children: (data: T) => React.ReactNode;
}) {
  if (resource.status === "loading") return <>{loading ?? <StatSkeleton />}</>;
  if (resource.status === "error") return <ErrorState message={resource.message} onRetry={onRetry} />;
  return <>{children(resource.data)}</>;
}

/** Section heading inside a page body. */
export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Text fontSize="$5" fontWeight="600" marginTop="$5" marginBottom="$3">
      {children}
    </Text>
  );
}

/** Decorative empty-list glyph, kept here so pages do not import lucide for it. */
export function EmptyGlyph() {
  return <Inbox size={20} color="#6b7280" />;
}