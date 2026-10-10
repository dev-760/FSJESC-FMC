/**
 * Auth.js v5 configuration (Part 7.3, D5).
 *
 * Configures Auth.js with the Drizzle adapter, credentials provider,
 * and database sessions. This is the core configuration that will be
 * used by the AuthProvider implementation.
 *
 * Note: Due to schema incompatibilities with the Drizzle adapter,
 * we're using a custom AuthProvider implementation instead of the
 * full Auth.js handler. This config is kept for reference and
 * future integration.
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AUTH_CONFIG } from "@fsjesc/config/site";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // The authorize function will be implemented in the AuthProvider
      authorize(credentials) {
        // This is a placeholder - actual auth is handled by AuthProvider
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        // TODO: Implement credential verification
        return null;
      },
    }),
  ],

  session: {
    strategy: "database",
    maxAge: AUTH_CONFIG.sessionMaxAgeSeconds,
    updateAge: AUTH_CONFIG.sessionUpdateAgeSeconds,
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },

  callbacks: {
    /**
     * Session callback to include user role in the session.
     * This is critical for RBAC (Part 7.1, N3).
     */
    session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // @ts-expect-error - Custom role field on session user
        (session.user as { role: string }).role = user.role as string;
        session.user.email = user.email;
        session.user.emailVerified = user.emailVerified;
      }
      return session;
    },

    /**
     * JWT callback (not used with database sessions, but required by Auth.js).
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        // @ts-expect-error - Custom role field on token
        (token as { role: string }).role = user.role as string;
      }
      return token;
    },

    /**
     * Redirect callback to control where users are sent after sign-in/out.
     */
    redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    /**
     * Log when a user is created for audit purposes.
     */
    createUser({ user }) {
      // This will be handled by the audit log in the repository layer
      console.error(`User created: ${user.email}`);
    },
    /**
     * Log when a session is created for audit purposes.
     */
    session({ session }) {
      if (session?.user) {
        console.error(`Session created for user: ${session.user.email}`);
      }
    },
  },

  cookies: {
    sessionToken: {
      name: AUTH_CONFIG.cookieName,
      options: {
        httpOnly: true,
        sameSite: AUTH_CONFIG.cookieSameSite,
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  // Trust the host header in production to allow custom domains
  trustHost: true,
};
