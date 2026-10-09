import type {
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Table primitives — the terminal's core instrument.
 *
 * Dense by default: tight row padding, a hairline between rows, column heads set
 * in tracked mono caps. Numeric columns are right-aligned and tabular so a column
 * of figures can be scanned vertically, which is the single most useful thing a
 * financial table can do for a reader.
 *
 * Mobile: use `DataTable`, which reflows these rows into cards rather than
 * shrinking them (Part 9.4).
 */
export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("border-rule-strong border-b", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn(
        "[&_tr]:border-rule [&_tr]:border-b [&_tr:last-child]:border-0",
        className,
      )}
      {...props}
    />
  );
}

export function TableFooter({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tfoot className={cn("border-rule-strong border-t", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn("hover:bg-surface-sunken transition-colors duration-100", className)}
      {...props}
    />
  );
}

export interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
  /** Visually hides the header while keeping it available to screen readers. */
  srOnly?: boolean;
}

export function Th({ className, numeric = false, srOnly = false, scope, ...props }: ThProps) {
  return (
    <th
      scope={scope ?? "col"}
      className={cn(
        "label px-3 py-2 font-medium whitespace-nowrap",
        numeric ? "text-right" : "text-left",
        srOnly && "sr-only",
        className,
      )}
      {...props}
    />
  );
}

export interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  numeric?: boolean;
}

export function Td({ className, numeric = false, ...props }: TdProps) {
  return (
    <td
      className={cn("px-3 py-2 align-middle", numeric && "numeric text-right", className)}
      {...props}
    />
  );
}

export function TableCaption({ className, ...props }: HTMLAttributes<HTMLTableCaptionElement>) {
  return (
    <caption
      className={cn(
        // A caption is annotation, so it belongs under the table. The UA default
        // is `caption-side: top`, which made the board read as a paragraph with a
        // table attached rather than as a table with a note.
        "border-rule text-foreground-muted caption-bottom border-t px-3 py-2.5 text-left text-xs leading-relaxed",
        className,
      )}
      {...props}
    />
  );
}
