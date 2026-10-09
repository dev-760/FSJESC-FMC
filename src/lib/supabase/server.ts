import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase server client.
 *
 * The project URL and key are read from the environment and are **not**
 * hardcoded. A previous version carried a `service_role` key as a literal
 * fallback in this file, which is committed to version control. A service-role
 * key bypasses Row Level Security entirely, so anyone holding it has full
 * read/write access to every table in the project.
 *
 * `requireEnv` throws rather than falling back, because the previous silent
 * fallback meant a misconfigured deployment quietly ran with a different key
 * than intended. Failing loudly at the first request is the safer behaviour.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} is not set. Copy .env.example to .env.local and fill it in. ` +
        `This value must never be committed; see the note in this file.`,
    );
  }
  return value;
}

let cached: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  if (cached) return cached;

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  cached = createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

/** True when Supabase is configured. Lets callers degrade instead of throwing. */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}