import { Text, styled } from "tamagui";

/**
 * Badge — a status or category marker.
 *
 * This existed as five near-identical copies across the pages, each with a
 * different set of variants, so the same role was rendered differently on
 * different screens. There is now one definition.
 *
 * Tone is never the sole carrier of meaning: a badge is always text, and colour
 * only reinforces it.
 */
const StyledBadge = styled(Text, {
  name: "Badge",
  fontFamily: "$mono",
  fontSize: "$0",
  letterSpacing: 0.6,
  textTransform: "uppercase",
  borderRadius: "$1",
  borderWidth: 1,
  paddingHorizontal: 6,
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
        borderColor: "#00e5994d",
        backgroundColor: "#00e5991f",
        color: "$bull",
      },
      bear: {
        borderColor: "#ef44444d",
        backgroundColor: "#ef44441f",
        color: "$bear",
      },
      info: {
        borderColor: "#3b82f64d",
        backgroundColor: "#3b82f61f",
        color: "$info",
      },
      warning: {
        borderColor: "#fbbf244d",
        backgroundColor: "#fbbf241f",
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

/**
 * Map a domain status onto a badge tone.
 *
 * Centralised so that "active" is emerald everywhere rather than green on one
 * screen and blue on another.
 */
export type StatusTone = NonNullable<BadgeProps["tone"]>;

export function toneForStatus(status: string): StatusTone {
  switch (status.toLowerCase()) {
    case "active":
    case "filled":
    case "completed":
    case "published":
    case "paid":
      return "bull";
    case "cancelled":
    case "failed":
    case "rejected":
    case "suspended":
      return "bear";
    case "pending":
    case "queued":
    case "partially_filled":
    case "draft":
      return "warning";
    case "open":
    case "new":
    case "scheduled":
      return "info";
    default:
      return "neutral";
  }
}

export { StyledBadge };

/**
 * A domain status rendered as a badge.
 *
 * Screens show raw enum values like `PARTIALLY_FILLED`; this turns them into
 * readable text and a consistent tone, so no screen has to remember the mapping.
 */
export function StatusBadge({ status }: { status: string }) {
  const label = status.replace(/_/g, " ");
  return <StyledBadge tone={toneForStatus(status)}>{label}</StyledBadge>;
}