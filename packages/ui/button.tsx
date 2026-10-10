import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@fsjesc/config/cn";

/**
 * Button primitive.
 *
 * Restrained by design (Part 0.4): a solid neutral/brand fill, a quiet outline
 * option, and a genuinely plain text option. No glow, no gradient, no
 * scale-on-hover. Hover changes the surface colour and nothing else.
 *
 * Rendered as `<button>` by default, or as the single child element when
 * `asChild` is set, so a `<Link>` can be styled as a button without nesting
 * interactive elements.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md cursor-pointer",
    "text-sm font-medium transition-colors duration-150 transition-transform duration-75",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-bull text-canvas font-semibold hover:bg-bull-hover active:scale-[0.98]",
        bull: "bg-bull text-canvas font-semibold hover:bg-bull-hover active:scale-[0.98]",
        bear: "bg-bear text-white font-semibold hover:bg-red-600 active:scale-[0.98]",
        secondary:
          "border border-rule-strong bg-surface-raised text-foreground hover:bg-surface-sunken active:scale-[0.98]",
        ghost: "text-foreground-secondary hover:bg-surface-sunken hover:text-foreground active:scale-[0.98]",
        subtle: "bg-surface-inset text-foreground hover:bg-surface-sunken active:scale-[0.98]",
        danger:
          "border border-rule-strong bg-surface-raised text-negative hover:bg-negative-subtle active:scale-[0.98]",
        link: "text-bull underline underline-offset-4 hover:text-bull-hover active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-3.5",
        lg: "h-10 px-4",
        icon: "h-9 w-9",
        iconSm: "h-8 w-8",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Forwarded so a parent can move focus, e.g. when closing a menu. */
  ref?: React.Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant,
  size,
  fullWidth,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Component = asChild ? Slot : "button";

  return (
    <Component
      // Buttons inside a form default to `submit`, which submits forms by
      // accident when a button is presentational. Default to `button`.
      {...(asChild ? {} : { type: type ?? "button" })}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
