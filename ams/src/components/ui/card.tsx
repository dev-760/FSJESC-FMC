import { Paragraph, Text, YStack, styled } from "tamagui";

/**
 * Card — a ruled panel.
 *
 * Mirrors the public site's `Card`: the panel is defined by a 1px hairline and a
 * surface step, never by a shadow. Elevation is not available in this aesthetic,
 * so there is no `float` variant here — a raised panel that shadows reads as
 * foreign next to the site it administers.
 *
 * The previous version used `$border`, `$cardForeground`, `$mutedForeground` and
 * `$shadowColor`. None of those are Tamagui tokens or theme variables, so every
 * border rendered as nothing at all and the shadow silently resolved to black.
 */
const StyledCard = styled(YStack, {
  name: "Card",
  backgroundColor: "$surfaceRaised",
  borderRadius: "$4",
  borderWidth: 1,
  borderColor: "$rule",

  variants: {
    /** Recedes into the page — for secondary blocks inside a panel. */
    sunken: {
      true: {
        backgroundColor: "$surfaceSunken",
        borderColor: "$ruleFaint",
      },
    },
    /** Removes the hairline when the card supplies its own divider rhythm. */
    flush: {
      true: {
        borderWidth: 0,
      },
    },
  } as const,
});

const StyledCardHeader = styled(YStack, {
  name: "CardHeader",
  padding: "$4",
  gap: "$2",
  /** A header is a titled region; the rule beneath it does the separating. */
  borderBottomWidth: 1,
  borderColor: "$rule",
});

const StyledCardTitle = styled(Text, {
  name: "CardTitle",
  fontSize: "$5",
  fontWeight: "600",
  color: "$foreground",
});

const StyledCardDescription = styled(Text, {
  name: "CardDescription",
  fontSize: "$2",
  color: "$foregroundSecondary",
  lineHeight: 18,
});

const StyledCardContent = styled(YStack, {
  name: "CardContent",
  padding: "$4",
  gap: "$3",
});

const StyledCardFooter = styled(YStack, {
  name: "CardFooter",
  padding: "$4",
  paddingTop: 0,
  flexDirection: "row",
  alignItems: "center",
  gap: "$2",
});

/** A machine label — the tracked, uppercase mono tag used above a figure. */
export const CardLabel = styled(Text, {
  name: "CardLabel",
  fontFamily: "$mono",
  fontSize: "$0",
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "$foregroundSecondary",
});

export const Card = StyledCard;
export const CardHeader = StyledCardHeader;
export const CardTitle = StyledCardTitle;
export const CardDescription = StyledCardDescription;
export const CardContent = StyledCardContent;
export const CardFooter = StyledCardFooter;

export type CardProps = React.ComponentProps<typeof StyledCard>;

/** Body text at the site's muted-but-readable size. */
export const MutedText = styled(Paragraph, {
  fontSize: "$2",
  color: "$foregroundSecondary",
  lineHeight: 19,
});