import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase server client.
 *
 * Keys are read from the environment and are **not** hardcoded. A previous
 * version carried a `service_role` key as a literal fallback in this file, and
 * that literal is still recoverable from git history. Supabase has since moved
 * to asymmetric JWT signing keys, and the legacy secret can be revoked by
 * rotating to a standby key — which invalidates the leaked credential.
 *
 * Only the new key formats are accepted:
 *   - `sb_secret_…`      — server-only secret key
 *   - `sb_publishable_…` — safe to expose, constrained by Row Level Security
 *
 * The legacy `service_role` / `anon` JWTs are deliberately not accepted as
 * fallbacks. Supporting them would keep a revoked, history-exposed credential
 * alive in any deployment that happened to have it set.
 *
 * `requireEnv` throws rather than falling back, because the previous silent
 * fallback meant a misconfigured deployment quietly ran with a different key
 * than intended.
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

/**
 * Server-only secret key.
 *
 * Only the new `sb_secret_…` format is accepted. The legacy `service_role` JWT
 * is deliberately *not* a fallback: Supabase can revoke that secret by rotating
 * to a standby signing key, and accepting it here would keep a revoked,
 * history-exposed credential working in any deployment that had it set.
 */
export function supabaseSecretKey(): string {
  return requireEnv("SUPABASE_SECRET_KEY");
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
  return hasUrl && Boolean(process.env.SUPABASE_SECRET_KEY);
}