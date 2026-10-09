import { z } from "zod";

/**
 * Server-side environment contract (Part 3.5).
 *
 * Parsed eagerly at import time so a misconfigured deployment fails fast with an
 * actionable message instead of surfacing as a confusing `undefined` deep inside
 * a request.
 *
 * NOTE: this module deliberately does not import `server-only`. It is also loaded
 * by `drizzle.config.ts`, `src/infrastructure/database/seed.ts`, and the Vitest
 * process, none of which run under the Next.js server-component condition where
 * that marker package resolves. The client/server boundary is instead enforced
 * structurally: `NEXT_PUBLIC_*` values are parsed separately in `./env-public`
 * and are the only variables a Client Component may read.
 */

const booleanish = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(z.enum(["true", "false", "1", "0", "on", "off", ""]))
  .transform((value) => value === "true" || value === "1" || value === "on");

/** A 32-byte base64 secret, the size Auth.js requires for `AUTH_SECRET`. */
const base64Secret = z
  .string()
  .min(1, "AUTH_SECRET must not be empty")
  .refine((value) => {
    try {
      const decoded = Buffer.from(value, "base64");
      return decoded.length >= 16 && decoded.length <= 64;
    } catch {
      return false;
    }
  }, "AUTH_SECRET must be a base64 string decoding to 16-64 bytes. Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\"");

const postgresUrl = z
  .string()
  .min(1)
  .refine(
    (value) => /^postgres(ql)?:\/\//.test(value),
    "must be a PostgreSQL connection string, e.g. postgresql://user:pass@host:5432/db",
  );

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: postgresUrl,
  TEST_DATABASE_URL: postgresUrl.optional(),
  AUTH_SECRET: base64Secret,
  AUTH_URL: z.url().optional(),
  AUTH_TRUST_HOST: booleanish.default(true),
  BOOTSTRAP_ADMIN_EMAIL: z.email(),
  BOOTSTRAP_ADMIN_PASSWORD: z
    .string()
    .min(12, "BOOTSTRAP_ADMIN_PASSWORD must be at least 12 characters (Part 7.3 password policy)"),
  BOOTSTRAP_ADMIN_NAME: z.string().min(1).default("Platform Administrator"),
  SEED_DEMO: booleanish.default(false),
  MARKET_SEED: z.string().min(1).default("fsjesc-fmc-v1"),
  MAIL_PROVIDER: z.enum(["console", "smtp"]).default("console"),
  MAIL_FROM: z.string().min(1).default("FSJESC Financial Markets Club <no-reply@fsjesc-fmc.local>"),
  SMTP_URL: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

function parseServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env);

  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(
      `Invalid server environment configuration:\n${issues}\n\n` +
        `Copy .env.example to .env.local and fill in the missing or malformed values.`,
    );
  }

  const env = parsed.data;

  // Cross-field rules that a per-field schema cannot express.
  if (env.MAIL_PROVIDER === "smtp" && !env.SMTP_URL) {
    throw new Error(
      "Invalid server environment configuration:\n  - SMTP_URL is required when MAIL_PROVIDER=smtp",
    );
  }
  if (env.NODE_ENV === "production" && env.MAIL_PROVIDER === "console") {
    throw new Error(
      "Invalid server environment configuration:\n  - MAIL_PROVIDER=console is not permitted in production; set MAIL_PROVIDER=smtp and provide SMTP_URL",
    );
  }
  if (env.NODE_ENV === "production" && env.AUTH_TRUST_HOST && !env.AUTH_URL) {
    throw new Error(
      "Invalid server environment configuration:\n  - AUTH_URL must be set in production when AUTH_TRUST_HOST is enabled",
    );
  }

  return env;
}

/**
 * Lazily memoised so that importing this module from a build-time context that
 * never touches the server environment does not throw during prerender.
 */
let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cached ??= parseServerEnv();
  return cached;
}

/**
 * Force validation now. Used by scripts (`db:seed`, CI preflight) and by the
 * instrumentation hook so a broken deployment is reported at boot.
 */
export function assertServerEnv(): ServerEnv {
  return getServerEnv();
}
