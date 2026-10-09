import { Button as TamaguiButton, styled } from "tamagui";

/**
 * Button.
 *
 * The palette matches the public site: emerald is the affirmative action, the
 * secondary action is a hairline rather than a filled slab, and there is no
 * gradient, glow or hover lift — a control in this aesthetic moves colour, not
 * position.
 *
 * The previous version referenced `$color` for its foreground, which resolves to
 * the theme's own colour variable rather than to a text token, and `$border`,
 * which does not exist. Both are fixed here.
 */
const StyledButton = styled(TamaguiButton, {
  name: "Button",
  borderRadius: "$2",
  borderWidth: 1,
  borderColor: "transparent",

  variants: {
    variant: {
      /** The affirmative action — one per view. */
      primary: {
        backgroundColor: "$bull",
        borderColor: "$bull",
        color: "$canvas",
        hoverStyle: { backgroundColor: "#22f0aa", borderColor: "#22f0aa" },
        pressStyle: { backgroundColor: "$bull" },
      },
      /** The standard secondary action. */
      secondary: {
        backgroundColor: "$surfaceInset",
        borderColor: "$rule",
        color: "$foreground",
        hoverStyle: { backgroundColor: "$surfaceRaised", borderColor: "$ruleStrong" },
      },
      /** Quiet action for dense rows. */
      ghost: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        color: "$foregroundSecondary",
        hoverStyle: { backgroundColor: "$surfaceInset", color: "$foreground" },
      },
      /**
       * Hairline-only action. Kept as a distinct name from `secondary` because
       * a rule without a fill is the quieter of the two, and pages need to
       * choose between them.
       */
      outline: {
        backgroundColor: "transparent",
        borderColor: "$rule",
        color: "$foreground",
        hoverStyle: { backgroundColor: "$surfaceInset", borderColor: "$ruleStrong" },
      },
      /** Destructive action, gated behind a confirmation in practice. */
      destructive: {
        backgroundColor: "$bear",
        borderColor: "$bear",
        color: "$canvas",
        hoverStyle: { opacity: 0.9 },
      },
    } as const,

    size: {
      sm: { height: 32, paddingHorizontal: 12, fontSize: "$2" },
      md: { height: 38, paddingHorizontal: 16, fontSize: "$3" },
      lg: { height: 44, paddingHorizontal: 20, fontSize: "$4" },
      icon: { height: 34, width: 34, padding: 0 },
    } as const,

    /** Full-width actions in a narrow column. */
    block: {
      true: { alignSelf: "stretch" },
    } as const,
  },

  defaultVariants: {
    variant: "secondary",
    size: "md",
  },
});

export type ButtonProps = React.ComponentProps<typeof StyledButton>;

export function Button({ ...props }: ButtonProps) {
  return <StyledButton {...props} />;
}

/**
 * Button-sized link.
 *
 * `asChild` was previously accepted and then discarded, so every call site
 * passing it silently produced a real `<button>` where a link was intended.
 * `ButtonLink` states the intent in the name instead of pretending to support
 * polymorphism it does not implement.
 */
export const ButtonLink = styled(StyledButton, {
  name: "ButtonLink",
  hoverStyle: { opacity: 0.85 },
});

export { StyledButton };