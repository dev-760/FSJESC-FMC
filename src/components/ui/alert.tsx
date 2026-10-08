import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, Info, TriangleAlert, X } from "lucide-react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Inline alert / callout.
 *
 * Used for errors with recovery guidance (Part 9.6), simulation notices, and
 * educational notes. Severity is conveyed by an icon and a text label in addition
 * to colour (Part 9.2). Errors are announced assertively; everything else is
 * polite, because an error interrupts while a note does not.
 */
const alertVariants = cva("rounded-md border px-4 py-3 text-sm", {
  variants: {
    tone: {
      information: "border-information/30 bg-information-subtle text-foreground",
      neutral: "border-border bg-surface-subtle text-foreground",
      warning: "border-warning/40 bg-warning-subtle text-foreground",
      negative: "border-negative/40 bg-negative-subtle text-foreground",
      positive: "border-positive/30 bg-positive-subtle text-foreground",
    },
  },
  defaultVariants: { tone: "information" },
});

const TONE_ICON = {
  information: Info,
  neutral: Info,
  warning: TriangleAlert,
  negative: AlertTriangle,
  positive: Info,
} as const;

const TONE_LABEL = {
  information: "Information",
  neutral: "Note",
  warning: "Warning",
  negative: "Error",
  positive: "Confirmed",
} as const;

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  title?: string;
  /** Announce immediately. Reserved for errors that block the user's action. */
  assertive?: boolean;
  action?: ReactNode;
}

export function Alert({
  tone = "information",
  title,
  assertive = false,
  action,
  children,
  className,
  ...props
}: AlertProps) {
  const Icon = TONE_ICON[tone ?? "information"];
  const label = TONE_LABEL[tone ?? "information"];

  return (
    <div
      role={assertive ? "alert" : "status"}
      aria-live={assertive ? "assertive" : "polite"}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    >
      <div className="flex gap-3">
        <Icon aria-hidden className="text-foreground-secondary mt-0.5 size-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="sr-only">{label}: </p>
          {title ? <p className="text-foreground font-medium">{title}</p> : null}
          <div className={cn(title && "mt-1", "text-foreground-secondary")}>{children}</div>
          {action ? <div className="mt-3 flex gap-3">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

/** Dismissible variant, for notices a user has seen but need not dismiss. */
export function DismissibleNotice({
  onDismiss,
  dismissLabel,
  children,
  ...props
}: AlertProps & { onDismiss: () => void; dismissLabel: string }) {
  return (
    <Alert {...props}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">{children}</div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label={dismissLabel}
          className="text-foreground-secondary hover:bg-surface-inset hover:text-foreground focus-visible:outline-ring -m-1 shrink-0 rounded p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <X aria-hidden className="size-4" />
        </button>
      </div>
    </Alert>
  );
}
