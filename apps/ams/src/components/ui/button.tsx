import { Button as TamaguiButton, styled } from "tamagui";

/**
 * Button — aligned with `.btn` in `mockups/AMS.html`.
 */
const StyledButton = styled(TamaguiButton, {
  name: "Button",
  borderRadius: "$3",
  borderWidth: 1,
  borderColor: "transparent",
  fontWeight: "500",

  variants: {
    variant: {
      primary: {
        backgroundColor: "#142944",
        borderColor: "#142944",
        color: "#ffffff",
        hoverStyle: { backgroundColor: "#1d3759", borderColor: "#1d3759" },
        pressStyle: { backgroundColor: "#142944" },
      },
      secondary: {
        backgroundColor: "$surfaceRaised",
        borderColor: "$rule",
        color: "$foreground",
        hoverStyle: { backgroundColor: "$surfaceInset", borderColor: "$ruleStrong" },
      },
      ghost: {
        backgroundColor: "transparent",
        borderColor: "transparent",
        color: "$foregroundSecondary",
        hoverStyle: { backgroundColor: "$surfaceInset", color: "$foreground" },
      },
      outline: {
        backgroundColor: "$surfaceRaised",
        borderColor: "$rule",
        color: "$foreground",
        hoverStyle: { backgroundColor: "$surfaceInset", borderColor: "$ruleStrong" },
      },
      destructive: {
        backgroundColor: "var(--neg-bg)",
        borderColor: "var(--neg-border)",
        color: "$bear",
        hoverStyle: { opacity: 0.9 },
      },
    } as const,

    size: {
      sm: { height: 28, paddingHorizontal: 10, fontSize: "$2", borderRadius: "$2" },
      md: { height: 34, paddingHorizontal: 13, fontSize: "$3" },
      lg: { height: 38, paddingHorizontal: 18, fontSize: "$4" },
      icon: { height: 32, width: 32, padding: 0 },
    } as const,

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

export const ButtonLink = styled(StyledButton, {
  name: "ButtonLink",
  hoverStyle: { opacity: 0.85 },
});

export { StyledButton };