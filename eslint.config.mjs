import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

/** Files/directories where the full type-aware rule set would only produce noise. */
const nonApp = ["**/*.config.*", "**/*.d.ts"];

/**
 * Layering rules (Part 3.1). Dependencies point inward only:
 * presentation -> application -> domain -> (nothing). Infrastructure is
 * implementable by application/domain via interfaces, never the reverse.
 */
const layering = {
  files: ["src/domain/**/*.{ts,tsx}", "src/simulator/**/*.{ts,tsx}"],
  ignores: [...nonApp],
  rules: {
    // N10 — the trading engine and market simulator are pure TypeScript.
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: ["react", "react/*", "next", "next/*"],
            message:
              "N10: the domain and simulator layers must be pure TypeScript (no React or Next.js imports).",
          },
          {
            group: ["drizzle-orm", "drizzle-orm/*", "next-auth", "postgres", "@node-rs/argon2"],
            message:
              "N10: the domain and simulator layers must not depend on infrastructure packages.",
          },
          {
            group: ["@/infrastructure/*", "@/app/*", "@/components/*"],
            message: "Part 3.1: layers depend inward only.",
          },
        ],
      },
    ],
  },
};

const applicationLayering = {
  files: ["src/application/**/*.{ts,tsx}"],
  ignores: [...nonApp],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          // Presentation-layer modules are forbidden. `next/navigation`,
          // `next/cache` and `next/headers` are server framework primitives —
          // `redirect`, `revalidatePath`, `cookies()` — which a Server Action
          // legitimately needs, so they stay permitted.
          {
            group: [
              "react",
              "react/*",
              "react-dom",
              "react-dom/*",
              "next/link",
              "next/image",
              "next/head",
              "next/script",
              "next/form",
              "@/app/*",
              "@/components/*",
            ],
            message: "Part 3.1: application services must not depend on the presentation layer.",
          },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      // Global Definition of Done: no unexplained `any`. Domain code has none at all.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // Float arithmetic on money is a correctness bug, not a style choice (N1).
      eqeqeq: ["error", "always"],
      "no-console": ["error", { allow: ["warn", "error"] }],
      "prefer-const": "error",
    },
  },
  // jsx-a11y is already contributed by eslint-config-next; re-adding its flat
  // config would redefine the plugin and fail config validation.
  layering,
  applicationLayering,
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      // Console output is legitimate in route handlers and server components.
      "no-console": "off",
    },
  },
  {
    files: ["**/*.test.{ts,tsx}", "tests/**/*.{ts,tsx}", "src/infrastructure/database/seed.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "no-console": "off",
    },
  },
  prettier,
  {
    // Config files, spec files and build scripts are plain JS outside the app's
    // tsconfig project, so type-aware linting cannot be applied to them.
    // `extends` is used rather than spreading, because spreading `disableTypeChecked`
    // would be overwritten by this object's own `rules` key.
    files: [
      "*.config.mts",
      "*.config.ts",
      "*.config.mjs",
      "scripts/**/*.mjs",
      "tests/setup/**/*.ts",
    ],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { parserOptions: { projectService: false, project: false } },
    rules: {
      // Build scripts and config generators report to the terminal; that is their
      // entire purpose.
      "no-console": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    "next-env.d.ts",
    "drizzle/**",
    "public/**",
  ]),
]);

export default eslintConfig;
