import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase server client.
 *
 * Keys are read from the environment and are **not** hardcoded. A previous
 * version carried a `service_role` key as a literal fallback in this file, which
 * is committed to version control. A service-role key bypasses Row Level
 * Security entirely, so anyone holding it has full read/write access to every
 * table in the project.
 *
 * Both key formats are supported:
 *   - `sb_secret_…`    — current format for the secret (server-only) key
 *   - `service_role`   — legacy JWT format
 *
 * `requireEnv` throws rather than falling back, because the previous silent
 * fallback meant a misconfigured deployment quietly ran with a different key
 * than intended. Failing loudly at the first request is the safer behaviour.
 */

function requireEnv(...names: string[]): string {
  for (const name of names) {
    const value = process.env[name];
    if (value) return value;
  }
  throw new Error(
    `None of ${names.join(", ")} is set. Copy .env.example to .env.local and fill it in. ` +
      `The secret key must never be committed.`,
  );
}

/** Project URL, preferring the unprefixed name for server-side use. */
export function supabaseUrl(): string {
  return requireEnv("SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL");
}

/** Server-only secret key. New `sb_secret_…` format, or the legacy JWT. */
export function supabaseSecretKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY");
}

let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) return cached;

  cached = createClient(supabaseUrl(), supabaseSecretKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

/**
 * True when Supabase is configured.
 *
 * Lets callers degrade rather than throw: with Supabase unset, articles are
 * read from `src/content/topics` instead.
 */
export function isSupabaseConfigured(): boolean {
  const hasUrl = Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY);
  return hasUrl && hasKey;
}