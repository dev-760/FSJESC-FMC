/**
 * Database schema (Part 4.2, N1, N4, N6).
 *
 * Money columns: NUMERIC(20,2) for cash and notional values, NUMERIC(20,4) for
 * prices and average price precision. These are converted through a lossless
 * string representation at the boundary to bigint centimes in the domain.
 *
 * All timestamps are stored in UTC. All monetary values are in MAD.
 *
 * The audit_log and transactions tables are append-only and never mutated
 * directly — this is the immutability guarantee of N6.
 */

import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  timestamp,
  text,
  uuid,
  numeric,
  integer,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * User roles (Part 7.1, N3).
 *
 * STUDENT: can read education content and use the simulator
 * MEMBER: can curate topics, run sessions, grant MEMBER to students
 * EXECUTIVE: can manage events, articles, competitions, and grant EXECUTIVE
 * ADMINISTRATOR: full system access, bootstrap account
 */
export const roleEnum = pgEnum("role", ["STUDENT", "MEMBER", "EXECUTIVE", "ADMINISTRATOR"]);

/**
 * Users table (Part 4.2.1, N9).
 *
 * Email is the unique identifier. Password is hashed with argon2id.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("STUDENT"),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    emailIdx: index("users_email_idx").on(table.email),
  }),
);

/**
 * User profiles (Part 4.2.1).
 *
 * Optional extended information. Law 09-08 posture: only what the platform
 * needs for operation.
 */
export const profiles = pgTable("profiles", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  studentId: text("student_id").unique(),
  track: text("track"),
  bio: text("bio"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Portfolios (Part 4.2.2, N1).
 *
 * cash_cents: spendable cash in centimes (bigint in domain, NUMERIC here)
 * reserved_cents: cash committed to unsettled purchases
 * realised_pnl_cents: cumulative realised profit/loss in centimes
 */
export const portfolios = pgTable(
  "portfolios",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cashCents: numeric("cash_cents", { precision: 20, scale: 2 }).notNull().default("0"),
    reservedCents: numeric("reserved_cents", { precision: 20, scale: 2 }).notNull().default("0"),
    realisedPnlCents: numeric("realised_pnl_cents", { precision: 20, scale: 2 })
      .notNull()
      .default("0"),
    isCompetition: integer("is_competition").notNull().default(0),
    competitionId: uuid("competition_id").references(() => competitions.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("portfolios_user_id_idx").on(table.userId),
    competitionIdIdx: index("portfolios_competition_id_idx").on(table.competitionId),
  }),
);

/**
 * Positions (Part 4.2.2, N1).
 *
 * average_cost_cents: break-even cost per share including commission (NUMERIC for precision)
 */
export const positions = pgTable(
  "positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    quantity: integer("quantity").notNull(),
    averageCostCents: numeric("average_cost_cents", { precision: 20, scale: 4 }).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    portfolioIdIdx: index("positions_portfolio_id_idx").on(table.portfolioId),
    symbolIdx: index("positions_symbol_idx").on(table.symbol),
    portfolioSymbolKey: primaryKey({ columns: [table.portfolioId, table.symbol] }),
  }),
);

/**
 * Orders (Part 4.2.3, N1, N5).
 *
 * limit_cents: NULL for market orders
 * average_fill_cents: volume-weighted average execution price (NUMERIC for precision)
 * fee_cents: commission paid
 * idempotency_key: for replay-safe submission (N5)
 */
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    side: text("side").notNull(), // "BUY" | "SELL"
    type: text("type").notNull(), // "MARKET" | "LIMIT"
    requested: integer("requested").notNull(),
    filled: integer("filled").notNull().default(0),
    limitCents: numeric("limit_cents", { precision: 20, scale: 4 }),
    averageFillCents: numeric("average_fill_cents", { precision: 20, scale: 4 }),
    feeCents: numeric("fee_cents", { precision: 20, scale: 2 }).notNull().default("0"),
    status: text("status").notNull(), // "FILLED" | "PARTIAL" | "REJECTED" | "CANCELLED"
    reason: text("reason"), // rejection or remainder reason
    idempotencyKey: text("idempotency_key").unique(),
    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
    filledAt: timestamp("filled_at", { withTimezone: true }),
  },
  (table) => ({
    portfolioIdIdx: index("orders_portfolio_id_idx").on(table.portfolioId),
    placedAtIdx: index("orders_placed_at_idx").on(table.placedAt),
    idempotencyKeyIdx: index("orders_idempotency_key_idx").on(table.idempotencyKey),
  }),
);

/**
 * Executions (Part 4.2.3, N1, N6).
 *
 * Individual fills of an order. One order may have multiple executions for
 * partial fills. These are append-only records.
 */
export const executions = pgTable(
  "executions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    symbol: text("symbol").notNull(),
    quantity: integer("quantity").notNull(),
    priceCents: numeric("price_cents", { precision: 20, scale: 4 }).notNull(),
    feeCents: numeric("fee_cents", { precision: 20, scale: 2 }).notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    orderIdIdx: index("executions_order_id_idx").on(table.orderId),
    executedAtIdx: index("executions_executed_at_idx").on(table.executedAt),
  }),
);

/**
 * Transactions (Part 4.2.4, N1, N6).
 *
 * Immutable ledger of every cash movement. Never deleted or mutated.
 * type: "DEPOSIT" | "WITHDRAWAL" | "BUY" | "SELL" | "FEE" | "DIVIDEND" | "ADJUSTMENT"
 */
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    amountCents: numeric("amount_cents", { precision: 20, scale: 2 }).notNull(),
    symbol: text("symbol"), // NULL for DEPOSIT/WITHDRAWAL
    referenceId: uuid("reference_id"), // orderId for BUY/SELL/FEE
    description: text("description").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    portfolioIdIdx: index("transactions_portfolio_id_idx").on(table.portfolioId),
    createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
    referenceIdIdx: index("transactions_reference_id_idx").on(table.referenceId),
  }),
);

/**
 * Assets (Part 4.2.5).
 *
 * The eight fictional instruments. These are static and seeded once.
 */
export const assets = pgTable("assets", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector").notNull(),
  currency: text("currency").notNull().default("MAD"),
  startingPriceCents: numeric("starting_price_cents", { precision: 20, scale: 2 }).notNull(),
  annualDrift: numeric("annual_drift", { precision: 10, scale: 6 }).notNull(),
  annualVolatility: numeric("annual_volatility", { precision: 10, scale: 6 }).notNull(),
  averageDailyVolume: integer("average_daily_volume").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Competitions (Part 4.2.6).
 *
 * status: "DRAFT" | "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
 */
export const competitions = pgTable(
  "competitions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    startingCashCents: numeric("starting_cash_cents", { precision: 20, scale: 2 }).notNull(),
    status: text("status").notNull().default("DRAFT"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    statusIdx: index("competitions_status_idx").on(table.status),
    startsAtIdx: index("competitions_starts_at_idx").on(table.startsAt),
  }),
);

/**
 * Competition participants (Part 4.2.6).
 *
 * Links users to competition portfolios. Created when a user joins a competition.
 */
export const competitionParticipants = pgTable(
  "competition_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    portfolioId: uuid("portfolio_id")
      .notNull()
      .references(() => portfolios.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    competitionIdIdx: index("competition_participants_competition_id_idx").on(table.competitionId),
    userIdIdx: index("competition_participants_user_id_idx").on(table.userId),
    portfolioIdIdx: index("competition_participants_portfolio_id_idx").on(table.portfolioId),
    competitionUserKey: primaryKey({ columns: [table.competitionId, table.userId] }),
  }),
);

/**
 * Events (Part 4.2.7).
 *
 * Club sessions and events.
 */
export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    location: text("location").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    capacity: integer("capacity").notNull(),
    isPublished: integer("is_published").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    startsAtIdx: index("events_starts_at_idx").on(table.startsAt),
    isPublishedIdx: index("events_is_published_idx").on(table.isPublished),
  }),
);

/**
 * Articles (Part 4.2.8).
 *
 * Published education content. Links to markdown files in src/content/topics.
 */
export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    category: text("category").notNull(),
    essential: integer("essential").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: index("articles_slug_idx").on(table.slug),
    categoryIdx: index("articles_category_idx").on(table.category),
    publishedAtIdx: index("articles_published_at_idx").on(table.publishedAt),
  }),
);

/**
 * Audit log (Part 4.2.9, N6).
 *
 * Immutable record of all system-level mutations. Never deleted.
 * action: "USER_CREATED" | "ROLE_CHANGED" | "ORDER_PLACED" | "PORTFOLITIO_ADJUSTED" etc.
 */
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    changes: text("changes"), // JSON string of before/after
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    actorIdIdx: index("audit_log_actor_id_idx").on(table.actorId),
    entityIdx: index("audit_log_entity_idx").on(table.entityType, table.entityId),
    createdAtIdx: index("audit_log_created_at_idx").on(table.createdAt),
  }),
);

/**
 * Idempotency keys (Part 4.2.10, N5).
 *
 * Stores the result of idempotent operations. If a request arrives with an
 * existing key, the stored result is returned instead of re-executing.
 * T after duration to allow eventual cleanup.
 */
export const idempotencyKeys = pgTable(
  "idempotency_keys",
  {
    key: text("key").primaryKey(),
    response: text("response").notNull(), // JSON string of the response
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    expiresAtIdx: index("idempotency_keys_expires_at_idx").on(table.expiresAt),
  }),
);

/**
 * Password reset tokens (Part 7.3).
 *
 * Single-use expiring tokens for password reset flow.
 */
export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("password_reset_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("password_reset_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

/**
 * Email verification tokens (Part 7.3).
 *
 * Single-use expiring tokens for email verification.
 */
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    token: text("token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
    expiresAtIdx: index("email_verification_tokens_expires_at_idx").on(table.expiresAt),
  }),
);

/**
 * Auth.js accounts table (Part 7.3, D5).
 *
 * Stores OAuth provider accounts. Required by Auth.js Drizzle adapter.
 */
export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "oauth" | "oidc" | "email"
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => ({
    userIdIdx: index("accounts_user_id_idx").on(table.userId),
    providerAccountIdx: index("accounts_provider_account_id_idx").on(
      table.provider,
      table.providerAccountId,
    ),
    primaryKey: { columns: [table.provider, table.providerAccountId] },
  }),
);

/**
 * Auth.js sessions table (Part 7.3, D5).
 *
 * Stores database sessions. Required by Auth.js Drizzle adapter.
 * Using database sessions instead of JWT for immediate revocation (D5).
 */
export const sessions = pgTable(
  "sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

/**
 * Auth.js verification tokens table (Part 7.3, D5).
 *
 * Stores email verification tokens for Auth.js.
 * Note: We also have a custom emailVerificationTokens table for our own flow.
 */
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    primaryKey: { columns: [table.identifier, table.token] },
  }),
);

/**
 * Drizzle relations.
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),
  portfolios: many(portfolios),
  competitionParticipants: many(competitionParticipants),
  auditLogEntries: many(auditLog),
  passwordResetTokens: many(passwordResetTokens),
  emailVerificationTokens: many(emailVerificationTokens),
  accounts: many(accounts),
  sessions: many(sessions),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  user: one(users, {
    fields: [portfolios.userId],
    references: [users.id],
  }),
  competition: one(competitions, {
    fields: [portfolios.competitionId],
    references: [competitions.id],
  }),
  positions: many(positions),
  orders: many(orders),
  transactions: many(transactions),
  competitionParticipants: many(competitionParticipants),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  portfolio: one(portfolios, {
    fields: [orders.portfolioId],
    references: [portfolios.id],
  }),
  executions: many(executions),
}));

export const competitionsRelations = relations(competitions, ({ many }) => ({
  portfolios: many(portfolios),
  participants: many(competitionParticipants),
}));

export const competitionParticipantsRelations = relations(competitionParticipants, ({ one }) => ({
  competition: one(competitions, {
    fields: [competitionParticipants.competitionId],
    references: [competitions.id],
  }),
  user: one(users, {
    fields: [competitionParticipants.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [competitionParticipants.portfolioId],
    references: [portfolios.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));
