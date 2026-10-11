import { Text, styled } from "tamagui";

/**
 * Badge — aligned with `.badge` in `mockups/AMS.html`.
 */
const StyledBadge = styled(Text, {
  name: "Badge",
  fontFamily: "$mono",
  fontSize: "$0",
  fontWeight: "600",
  letterSpacing: 0.5,
  textTransform: "uppercase",
  borderRadius: "$round",
  borderWidth: 1,
  paddingHorizontal: 8,
  paddingVertical: 2,
  alignSelf: "flex-start",
  whiteSpace: "nowrap",

  variants: {
    tone: {
      neutral: {
        borderColor: "$rule",
        backgroundColor: "$surfaceInset",
        color: "$foregroundSecondary",
      },
      bull: {
        borderColor: "var(--pos-border)",
        backgroundColor: "var(--pos-bg)",
        color: "$bull",
      },
      bear: {
        borderColor: "var(--neg-border)",
        backgroundColor: "var(--neg-bg)",
        color: "$bear",
      },
      info: {
        borderColor: "var(--action-border)",
        backgroundColor: "var(--action-bg)",
        color: "$info",
      },
      warning: {
        borderColor: "var(--accent-border)",
        backgroundColor: "var(--accent-bg)",
        color: "$warning",
      },
    } as const,

    size: {
      sm: { fontSize: "$0" },
      md: { fontSize: "$1" },
    } as const,
  },

  defaultVariants: {
    tone: "neutral",
    size: "sm",
  },
});

export type BadgeProps = React.ComponentProps<typeof StyledBadge>;

export function Badge(props: BadgeProps) {
  return <StyledBadge {...props} />;
}

export type StatusTone = NonNullable<BadgeProps["tone"]>;

export function toneForStatus(status: string): StatusTone {
  switch (status.toLowerCase()) {
    case "active":
    case "filled":
    case "completed":
    case "published":
    case "paid":
    case "healthy":
    case "live":
      return "bull";
    case "cancelled":
    case "failed":
    case "rejected":
    case "suspended":
    case "offline":
    case "down":
      return "bear";
    case "pending":
    case "queued":
    case "partially_filled":
    case "partial":
    case "draft":
    case "degraded":
      return "warning";
    case "open":
    case "new":
    case "scheduled":
    case "upcoming":
      return "info";
    default:
      return "neutral";
  }
}

export { StyledBadge };

export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <StyledBadge tone={toneForStatus(status)}>{label}</StyledBadge>;
}