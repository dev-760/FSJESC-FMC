import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Supabase Auth JWT verification.
 *
 * This verifies **identity** only, and is additive: Auth.js remains the
 * session mechanism and the only way a browser establishes a session. A
 * Supabase access token is accepted in addition to it, so the two systems can
 * coexist during a gradual migration.
 *
 * Two deliberate constraints:
 *
 * 1. **Identity, not authorization.** A Supabase token proves who the caller
 *    is; it says nothing about what they may do here. Roles in this platform
 *    (STUDENT / MEMBER / EXECUTIVE / ADMINISTRATOR) live in the local `users`
 *    table and are always resolved from it. Trusting a `role` claim from an
 *    external issuer would let anyone who can mint a Supabase token with a
 *    chosen claim escalate to administrator.
 *
 * 2. **Fail closed.** Every failure path returns `null` rather than throwing,
 *    because this runs inside request handling where an unhandled rejection
 *    becomes a 500 that looks like a server fault rather than a bad token.
 *
 * Disabled entirely when SUPABASE_JWKS_URL is unset, so a deployment that does
 * not use Supabase Auth pays nothing and imports nothing at runtime.
 */

export interface SupabaseIdentity {
  /** The `sub` claim — Supabase's user id (a UUID). */
  userId: string;
  email: string | null;
  emailVerified: boolean;
}

interface SupabaseClaims extends JWTPayload {
  email?: string;
  email_verified?: boolean;
}

/** Cached per URL: `createRemoteJWKSet` refetches only on an unknown key id. */
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(url: string) {
  let set = jwksCache.get(url);
  if (!set) {
    set = createRemoteJWKSet(new URL(url));
    jwksCache.set(url, set);
  }
  return set;
}

/** True when Supabase Auth verification is configured. */
export function isSupabaseAuthConfigured(): boolean {
  return Boolean(process.env.SUPABASE_JWKS_URL && supabaseIssuer());
}

/** Expected `iss` — Supabase sets it to `<project url>/auth/v1`. */
function supabaseIssuer(): string | undefined {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  return url ? `${url.replace(/\/$/, "")}/auth/v1` : undefined;
}

/** Extract a bearer token from an Authorization header, if present. */
export function bearerTokenFrom(header: string | null | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() ?? null;
}

/**
 * Verify a Supabase access token.
 *
 * Returns `null` for anything that is not a valid, unexpired token signed by
 * this project's Supabase Auth instance with the `authenticated` audience.
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseIdentity | null> {
  const jwksUrl = process.env.SUPABASE_JWKS_URL;
  const issuer = supabaseIssuer();
  if (!jwksUrl || !issuer) return null;

  try {
    const { payload } = await jwtVerify(token, jwksFor(jwksUrl), {
      issuer,
      audience: "authenticated",
      algorithms: ["RS256"],
    });

    const claims = payload as SupabaseClaims;
    if (typeof claims.sub !== "string" || claims.sub.length === 0) return null;

    return {
      userId: claims.sub,
      email: typeof claims.email === "string" ? claims.email : null,
      emailVerified: claims.email_verified === true,
    };
  } catch {
    return null;
  }
}
