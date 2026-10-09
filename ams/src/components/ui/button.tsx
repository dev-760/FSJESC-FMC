import { Button as TamaguiButton, styled } from "tamagui";

const StyledButton = styled(TamaguiButton, {
  name: "Button",
  variants: {
    variant: {
      default: {
        backgroundColor: "$primary",
        color: "$color",
      },
      destructive: {
        backgroundColor: "$destructive",
        color: "$color",
      },
      outline: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "$border",
        color: "$foreground",
      },
      secondary: {
        backgroundColor: "$secondary",
        color: "$color",
      },
      ghost: {
        backgroundColor: "transparent",
        color: "$foreground",
      },
      link: {
        backgroundColor: "transparent",
        color: "$primary",
        textDecorationLine: "underline",
      },
    },
    size: {
      default: {
        height: 40,
        paddingHorizontal: 16,
        fontSize: "$4",
      },
      sm: {
        height: 36,
        paddingHorizontal: 12,
        fontSize: "$3",
      },
      lg: {
        height: 44,
        paddingHorizontal: 32,
        fontSize: "$5",
      },
      icon: {
        height: 40,
        width: 40,
        padding: 0,
      },
    },
  } as const,
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps extends React.ComponentProps<typeof StyledButton> {
  asChild?: boolean;
}

export function Button({ asChild, ...props }: ButtonProps) {
  return <StyledButton {...props} />;
}
