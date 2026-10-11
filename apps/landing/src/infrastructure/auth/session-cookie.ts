/**
 * Session cookie helpers.
 *
 * Centralises the cookie name and flags so every write (sign-up, sign-in)
 * and clear (sign-out) agrees. An optional AUTH_COOKIE_DOMAIN lets a
 * production deployment share the session across landing / simulator / AMS
 * subdomains.
 */

import "server-only";
import { cookies } from "next/headers";
import { AUTH_CONFIG } from "@fsjesc/config/site";
import { getServerEnv } from "@fsjesc/config/env";

export function sessionCookieOptions(expires: Date) {
  const env = getServerEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: AUTH_CONFIG.cookieSameSite,
    path: "/",
    expires,
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  } as const;
}

export async function setSessionCookie(token: string, expires: Date): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CONFIG.cookieName, token, sessionCookieOptions(expires));
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const env = getServerEnv();
  cookieStore.set(AUTH_CONFIG.cookieName, "", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: AUTH_CONFIG.cookieSameSite,
    path: "/",
    expires: new Date(0),
    ...(env.AUTH_COOKIE_DOMAIN ? { domain: env.AUTH_COOKIE_DOMAIN } : {}),
  });
}
