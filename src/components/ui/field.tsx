import {
  cloneElement,
  isValidElement,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Form field wrapper.
 *
 * Owns the label/description/error association so no form has to remember the
 * `htmlFor`/`aria-describedby` wiring by hand — the most common source of
 * inaccessible forms.
 */
const controlClass = [
  "w-full rounded-md border border-border-strong bg-surface px-3 text-sm text-foreground",
  "placeholder:text-foreground-muted",
  "focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-ring",
  "disabled:cursor-not-allowed disabled:bg-surface-subtle disabled:opacity-60",
  "aria-[invalid=true]:border-negative",
].join(" ");

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(controlClass, "h-10 py-2", className)} {...props} />;
}

export function NativeSelect({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(controlClass, "h-10 cursor-pointer appearance-none py-2 pr-8", className)}
      {...props}
    />
  );
}

export interface FieldProps {
  id: string;
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function Field({
  id,
  label,
  description,
  error,
  required,
  children,
  className,
}: FieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [descriptionId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
        {label}
        {required ? (
          <span className="text-negative ml-0.5" aria-hidden>
            *
          </span>
        ) : null}
        {required ? <span className="sr-only"> (required)</span> : null}
      </label>
      {description ? (
        <p id={descriptionId} className="text-foreground-secondary text-xs">
          {description}
        </p>
      ) : null}
      {attachControlProps(children, { describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} className="text-negative text-xs font-medium">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Attaches `aria-describedby` / `aria-invalid` to the single control child, so
 * `Field` works with any control without every primitive having to accept the
 * props. Non-element children are passed through untouched.
 */
function attachControlProps(
  child: ReactNode,
  { describedBy, invalid }: { describedBy: string | undefined; invalid: boolean },
): ReactNode {
  if (!isValidElement(child)) return child;
  const existing = child.props as { "aria-describedby"?: string; "aria-invalid"?: boolean };
  return cloneElement(child, {
    "aria-describedby":
      [existing["aria-describedby"], describedBy].filter(Boolean).join(" ") || undefined,
    ...(invalid || existing["aria-invalid"] ? { "aria-invalid": true } : {}),
  } as Record<string, unknown>);
}
