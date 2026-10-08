/**
 * The application's error model (Part 8.6).
 *
 * Every error surfaced by an API route or a server action is one of these codes,
 * mapped to a stable HTTP status and a message written for a student to read.
 * Stack traces, SQL, and internal identifiers never reach the client.
 */

export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  INVALID_ORDER: "INVALID_ORDER",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  INSUFFICIENT_HOLDINGS: "INSUFFICIENT_HOLDINGS",
  MARKET_UNAVAILABLE: "MARKET_UNAVAILABLE",
  ASSET_INACTIVE: "ASSET_INACTIVE",
  ORDER_NOT_CANCELLABLE: "ORDER_NOT_CANCELLABLE",
  COMPETITION_NOT_JOINABLE: "COMPETITION_NOT_JOINABLE",
  EVENT_FULL: "EVENT_FULL",
  EVENT_REGISTRATION_CLOSED: "EVENT_REGISTRATION_CLOSED",
  DUPLICATE_REGISTRATION: "DUPLICATE_REGISTRATION",
  EMAIL_ALREADY_REGISTERED: "EMAIL_ALREADY_REGISTERED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  EMAIL_NOT_VERIFIED: "EMAIL_NOT_VERIFIED",
  WEAK_PASSWORD: "WEAK_PASSWORD",
  TOKEN_INVALID_OR_EXPIRED: "TOKEN_INVALID_OR_EXPIRED",
  RATE_LIMITED: "RATE_LIMITED",
  CONFLICT: "CONFLICT",
  INTERNAL: "INTERNAL",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INVALID_ORDER: 422,
  INSUFFICIENT_FUNDS: 422,
  INSUFFICIENT_HOLDINGS: 422,
  MARKET_UNAVAILABLE: 422,
  ASSET_INACTIVE: 422,
  ORDER_NOT_CANCELLABLE: 409,
  COMPETITION_NOT_JOINABLE: 409,
  EVENT_FULL: 409,
  EVENT_REGISTRATION_CLOSED: 409,
  DUPLICATE_REGISTRATION: 409,
  EMAIL_ALREADY_REGISTERED: 409,
  INVALID_CREDENTIALS: 401,
  EMAIL_NOT_VERIFIED: 403,
  WEAK_PASSWORD: 400,
  TOKEN_INVALID_OR_EXPIRED: 400,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  INTERNAL: 500,
};

/**
 * Default, student-readable messages. Deliberately free of jargon and of any
 * promise about returns.
 */
const DEFAULT_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Some of the submitted values are not valid. Please review the form.",
  UNAUTHENTICATED: "You need to sign in to continue.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  FORBIDDEN: "You do not have permission to perform this action.",
  NOT_FOUND: "The requested resource could not be found.",
  INVALID_ORDER: "This order cannot be accepted. Please review the order details.",
  INSUFFICIENT_FUNDS: "Your available simulated cash balance is not sufficient for this order.",
  INSUFFICIENT_HOLDINGS: "You do not hold enough of this asset to complete this order.",
  MARKET_UNAVAILABLE:
    "The simulated market is closed at the moment. Try again during market hours.",
  ASSET_INACTIVE: "This asset is not currently tradable.",
  ORDER_NOT_CANCELLABLE:
    "This order can no longer be cancelled because it has already been resolved.",
  COMPETITION_NOT_JOINABLE: "This competition is not open for registration.",
  EVENT_FULL: "This event has reached capacity.",
  EVENT_REGISTRATION_CLOSED: "Registration for this event is closed.",
  DUPLICATE_REGISTRATION: "You are already registered for this.",
  EMAIL_ALREADY_REGISTERED: "An account already exists with this email address.",
  INVALID_CREDENTIALS: "Email address or password is incorrect.",
  EMAIL_NOT_VERIFIED: "Please verify your email address before continuing.",
  WEAK_PASSWORD: "Password must be at least 12 characters.",
  TOKEN_INVALID_OR_EXPIRED: "This link is invalid or has expired. Please request a new one.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  CONFLICT: "This request conflicts with the current state of the resource.",
  INTERNAL: "Something went wrong on our side. Please try again.",
};

/** Per-code recovery guidance shown in the UI (§9.6). */
const RECOVERY: Record<ErrorCode, string> = {
  VALIDATION_ERROR: "Correct the highlighted fields and submit again.",
  UNAUTHENTICATED: "Sign in to your account to continue.",
  SESSION_EXPIRED: "Sign in again — your previous session has ended.",
  FORBIDDEN: "If you believe this is a mistake, contact a club executive.",
  NOT_FOUND: "Check the address, or return to the previous page.",
  INVALID_ORDER: "Adjust the order and review the estimated values before submitting.",
  INSUFFICIENT_FUNDS:
    "Reduce the quantity or the limit price, or free up cash by selling a position.",
  INSUFFICIENT_HOLDINGS: "Check your open positions for this asset.",
  MARKET_UNAVAILABLE: "Pending limit orders are still evaluated when the market reopens.",
  ASSET_INACTIVE: "Choose another asset from the market list.",
  ORDER_NOT_CANCELLABLE: "Refresh the order list to see its current status.",
  COMPETITION_NOT_JOINABLE: "Check the competition calendar for the next registration window.",
  EVENT_FULL: "Check the events page for upcoming sessions with available capacity.",
  EVENT_REGISTRATION_CLOSED: "Check the events page for future sessions.",
  DUPLICATE_REGISTRATION: "No action needed — you are already registered.",
  EMAIL_ALREADY_REGISTERED: "Try signing in instead, or reset your password.",
  INVALID_CREDENTIALS: "Check the email address and password, then try again.",
  EMAIL_NOT_VERIFIED: "Use the verification link sent to your inbox, or request a new one.",
  WEAK_PASSWORD: "Use at least 12 characters.",
  TOKEN_INVALID_OR_EXPIRED: "Request a fresh verification or password-reset email.",
  RATE_LIMITED: "Wait before trying again.",
  CONFLICT: "Refresh to see the latest state, then retry.",
  INTERNAL: "Try again. If the problem persists, report it to the club team.",
};

export interface AppErrorOptions {
  /** Field-level or object-level detail, safe to show a user. Never internal. */
  details?: unknown;
  /** Recovery guidance; defaults to the code's standard advice. */
  recovery?: string;
  /** HTTP status override for cases the code mapping does not cover. */
  status?: number;
  cause?: unknown;
}

/**
 * The only error type application services are expected to throw for conditions a
 * user can understand. Anything else escaping a handler becomes a generic
 * `INTERNAL` response.
 */
export class AppError extends Error {
  override readonly name = "AppError";
  readonly code: ErrorCode;
  readonly details: unknown;
  readonly recovery: string;
  readonly status: number;

  constructor(code: ErrorCode, message?: string, options: AppErrorOptions = {}) {
    super(message ?? DEFAULT_MESSAGE[code], { cause: options.cause });
    this.code = code;
    this.details = options.details;
    this.recovery = options.recovery ?? RECOVERY[code];
    this.status = options.status ?? STATUS_BY_CODE[code];
  }

  /** The wire shape from Part 8.6. */
  toJSON(): ApiErrorBody {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        recovery: this.recovery,
      },
    };
  }
}

export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
    recovery?: string;
  };
}

export const errorStatus = (code: ErrorCode): number => STATUS_BY_CODE[code];
export const defaultErrorMessage = (code: ErrorCode): string => DEFAULT_MESSAGE[code];
export const defaultRecovery = (code: ErrorCode): string => RECOVERY[code];

/* -------------------------------------------------------------------------- */
/* Constructors                                                                 */
/* -------------------------------------------------------------------------- */

export const validationError = (message?: string, details?: unknown): AppError =>
  new AppError("VALIDATION_ERROR", message, { details });

export const unauthenticated = (message?: string): AppError =>
  new AppError("UNAUTHENTICATED", message);

export const sessionExpired = (): AppError => new AppError("SESSION_EXPIRED");

export const forbidden = (message?: string): AppError => new AppError("FORBIDDEN", message);

export const notFound = (what = "The requested resource"): AppError =>
  new AppError("NOT_FOUND", `${what} could not be found.`);

export const insufficientFunds = (availableCents: bigint, requiredCents: bigint): AppError =>
  new AppError("INSUFFICIENT_FUNDS", undefined, {
    details: {
      availableCents: availableCents.toString(),
      requiredCents: requiredCents.toString(),
      shortfallCents: (requiredCents - availableCents).toString(),
    },
  });

export const insufficientHoldings = (ticker: string, owned: bigint, requested: bigint): AppError =>
  new AppError("INSUFFICIENT_HOLDINGS", undefined, {
    details: {
      ticker,
      ownedQuantity: owned.toString(),
      requestedQuantity: requested.toString(),
    },
  });

export const rateLimited = (retryAfterSeconds: number): AppError =>
  new AppError("RATE_LIMITED", undefined, { details: { retryAfterSeconds } });

export const internalError = (cause?: unknown): AppError =>
  new AppError("INTERNAL", undefined, { cause });

/* -------------------------------------------------------------------------- */
/* Normalisation                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Convert an unknown thrown value into an `AppError`, without leaking internals.
 *
 * A `ZodError` becomes `VALIDATION_ERROR` with field-level details. Anything
 * unrecognised becomes `INTERNAL`, and the original value is attached only as a
 * `cause` for server-side logging — never serialised to the client.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  const maybeZod = error as { name?: string; issues?: unknown } | null;
  if (maybeZod && maybeZod.name === "ZodError" && Array.isArray(maybeZod.issues)) {
    const details = maybeZod.issues.map((issue) => {
      const entry = issue as { path?: unknown[]; message?: string };
      return {
        path: Array.isArray(entry.path) ? entry.path.join(".") : "",
        message: entry.message ?? "Invalid value",
      };
    });
    return new AppError("VALIDATION_ERROR", undefined, { details, cause: error });
  }

  return internalError(error);
}

/** Log an error server-side without printing secrets (N9, Part 8.5). */
export function logServerError(context: string, error: unknown): void {
  if (error instanceof AppError) {
    if (error.status >= 500) {
      console.error(`[${context}] ${error.code}: ${error.message}`, error.cause ?? "");
    }
    return;
  }
  console.error(`[${context}] unexpected error`, error);
}
