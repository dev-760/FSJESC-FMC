/**
 * Server-side logging.
 *
 * A single narrow module so that logging intent is explicit and reviewable, and so
 * that the ESLint `no-console` rule is disabled in exactly one place rather than
 * scattered across application code.
 *
 * Nothing here may receive a credential, a session token, a password reset token,
 * or a full email address. Audit-relevant events belong in the `audit_log` table
 * (Part 8.5), not in the console log; these functions are for operational
 * diagnostics only.
 */

type LogLevel = "info" | "warn" | "error";

const PREFIX = "[fsjesc-fmc]";

function write(level: LogLevel, message: string, context?: Record<string, unknown>): void {
  const line = context ? `${PREFIX} ${message} ${safeStringify(context)}` : `${PREFIX} ${message}`;

  /* eslint-disable no-console -- the point of this module is to be the one place
     that writes to the console. */
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.info(line);
  /* eslint-enable no-console */
}

/**
 * Operational breadcrumb. Not a substitute for the audit log: this output is not
 * guaranteed to be retained or queryable.
 */
export function logInfo(message: string, context?: Record<string, unknown>): void {
  write("info", message, context);
}

export function logWarn(message: string, context?: Record<string, unknown>): void {
  write("warn", message, context);
}

/**
 * Report an unexpected failure. The original error is passed as the cause so the
 * stack survives in the log; it is never returned to a client (Part 8.6).
 */
export function logError(
  message: string,
  error?: unknown,
  context?: Record<string, unknown>,
): void {
  if (error instanceof Error) {
    write("error", message, { ...context, name: error.name, stack: error.stack });
    return;
  }
  write("error", message, context);
}

/**
 * Serialise context defensively. `JSON.stringify` throws on a circular structure
 * or a `bigint`, and a logging call must never be the thing that breaks a request.
 */
function safeStringify(context: Record<string, unknown>): string {
  try {
    return JSON.stringify(context, (_key, value: unknown) => {
      if (typeof value === "bigint") return value.toString();
      if (value instanceof Error) return { name: value.name, message: value.message };
      return value;
    });
  } catch {
    return "[unserialisable context]";
  }
}
