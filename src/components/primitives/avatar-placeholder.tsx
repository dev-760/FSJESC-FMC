import { cn } from "@/lib/cn";

/**
 * Deterministic avatar placeholder.
 *
 * A student has no uploaded photo, and a stock face would misrepresent them. So the
 * initial is derived from the name and the background from a hash of it — the same
 * person always gets the same tile, with no stored asset and no request.
 *
 * The hue is deliberately desaturated. A colourful avatar grid draws the eye away
 * from the figures, which are the content.
 */

const HUES = ["text-info", "text-bull", "text-warning", "text-series-4", "text-series-5"] as const;

function hash(text: string): number {
  let value = 0;
  for (let index = 0; index < text.length; index += 1) {
    value = (value * 31 + text.charCodeAt(index)) >>> 0;
  }
  return value;
}

/** First letter of the first word, or `?` when there is nothing to take. */
function initialOf(name: string): string {
  const first = name.trim().split(/\s+/)[0] ?? "";
  return first.charAt(0).toUpperCase() || "?";
}

export function AvatarPlaceholder({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions = {
    sm: "h-7 w-7 text-2xs",
    md: "h-9 w-9 text-xs",
    lg: "h-14 w-14 text-lg",
  }[size];

  const hue = HUES[hash(name) % HUES.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        "numeric border-rule bg-surface-inset flex shrink-0 items-center justify-center rounded-full border font-semibold",
        hue,
        dimensions,
        className,
      )}
    >
      {initialOf(name)}
    </span>
  );
}

/**
 * A person row: avatar, name, role.
 *
 * Names are rendered at full weight even when they are placeholders, because the
 * accessibility audit flagged role metadata that was only available through colour
 * and hover states.
 */
export function PersonCell({
  name,
  role,
  size = "md",
}: {
  name: string;
  role?: string;
  size?: "sm" | "md";
}) {
  return (
    <span className="flex items-center gap-2.5">
      <AvatarPlaceholder name={name} size={size} />
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{name}</span>
        {role ? <span className="text-2xs text-foreground-secondary truncate">{role}</span> : null}
      </span>
    </span>
  );
}
