import { z } from "zod";

/**
 * Client-safe environment contract. Only `NEXT_PUBLIC_*` variables, and only
 * display-level settings. Anything secret belongs in `./env`.
 *
 * Next.js inlines `NEXT_PUBLIC_*` at build time, so these values are frozen for
 * the lifetime of a build. Runtime changes require a rebuild.
 */

const featureFlag = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    const normalized = value.trim().toLowerCase();
    return normalized === "on" || normalized === "true" || normalized === "1";
  });

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("FSJESC Financial Markets Club"),
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
  NEXT_PUBLIC_CONTACT_EMAIL: z.email().default("contact@fsjesc-fmc.local"),
  NEXT_PUBLIC_FEATURE_SIMULATOR: featureFlag,
  NEXT_PUBLIC_FEATURE_ADMIN: featureFlag,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let cached: PublicEnv | undefined;

export function getPublicEnv(): PublicEnv {
  if (cached) return cached;
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_CONTACT_EMAIL: process.env.NEXT_PUBLIC_CONTACT_EMAIL,
    NEXT_PUBLIC_FEATURE_SIMULATOR: process.env.NEXT_PUBLIC_FEATURE_SIMULATOR,
    NEXT_PUBLIC_FEATURE_ADMIN: process.env.NEXT_PUBLIC_FEATURE_ADMIN,
  });
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid public environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}
