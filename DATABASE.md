# Database Schema

## Overview

The database uses PostgreSQL 17 with Drizzle ORM. All monetary values use exact numeric types to prevent floating-point errors. Currency is MAD (Moroccan Dirham).

## Monetary Columns

All money and price columns use PostgreSQL `NUMERIC` with appropriate precision:

- **Cash amounts**: `NUMERIC(20,2)` - stored as strings, converted to `bigint` centimes in domain
- **Prices**: `NUMERIC(20,4)` - for price precision (4 decimal places)
- **Notional values**: `NUMERIC(20,2)` - for position sizes

**Never use floating-point types for money.**

## Tables

### users

User accounts with authentication and roles.

| Column         | Type        | Description                               |
| -------------- | ----------- | ----------------------------------------- |
| id             | UUID        | Primary key                               |
| email          | TEXT        | Unique identifier                         |
| password_hash  | TEXT        | Argon2id hash                             |
| role           | ENUM        | STUDENT, MEMBER, EXECUTIVE, ADMINISTRATOR |
| email_verified | TIMESTAMPTZ | When email was verified                   |
| created_at     | TIMESTAMPTZ | Account creation                          |
| updated_at     | TIMESTAMPTZ | Last update                               |

**Indexes**: `users_email_idx` on email

### profiles

Extended user information (optional).

| Column     | Type        | Description                    |
| ---------- | ----------- | ------------------------------ |
| user_id    | UUID        | FK to users.id (CASCADE)       |
| name       | TEXT        | Display name                   |
| student_id | TEXT        | University student ID (unique) |
| track      | TEXT        | Academic track                 |
| bio        | TEXT        | User bio                       |
| updated_at | TIMESTAMPTZ | Last update                    |

### portfolios

User portfolios for trading.

| Column             | Type              | Description                                 |
| ------------------ | ----------------- | ------------------------------------------- |
| id                 | UUID              | Primary key                                 |
| user_id            | UUID              | FK to users.id (CASCADE)                    |
| cash_cents         | NUMERIC(20,2)     | Available cash (string, domain uses bigint) |
| reserved_cents     | NUMERIC(20,2)     | Cash in pending orders                      |
| realised_pnl_cents | NUMERIC(20,2)     | Cumulative realised P&L                     |
| is_competition     | INTEGER (boolean) | Competition portfolio flag                  |
| competition_id     | UUID              | FK to competitions.id (CASCADE)             |
| created_at         | TIMESTAMPTZ       | Portfolio creation                          |
| updated_at         | TIMESTAMPTZ       | Last update                                 |

**Indexes**: `portfolios_user_id_idx` on user_id

### positions

Current holdings in a portfolio.

| Column              | Type          | Description                     |
| ------------------- | ------------- | ------------------------------- |
| id                  | UUID          | Primary key                     |
| portfolio_id        | UUID          | FK to portfolios.id (CASCADE)   |
| ticker              | TEXT          | Instrument symbol (4 chars)     |
| quantity            | NUMERIC(20,2) | Position size (positive = long) |
| average_price_cents | NUMERIC(20,4) | Average entry price             |
| updated_at          | TIMESTAMPTZ   | Last update                     |

**Indexes**: `positions_portfolio_id_ticker_idx` on (portfolio_id, ticker)

### orders

Trading orders.

| Column          | Type          | Description                          |
| --------------- | ------------- | ------------------------------------ |
| id              | UUID          | Primary key                          |
| portfolio_id    | UUID          | FK to portfolios.id (CASCADE)        |
| ticker          | TEXT          | Instrument symbol                    |
| side            | ENUM          | BUY, SELL                            |
| type            | ENUM          | MARKET, LIMIT                        |
| quantity        | NUMERIC(20,2) | Order quantity                       |
| price_cents     | NUMERIC(20,4) | Limit price (null for market)        |
| status          | ENUM          | PENDING, FILLED, CANCELLED, REJECTED |
| filled_quantity | NUMERIC(20,2) | Quantity filled so far               |
| filled_at       | TIMESTAMPTZ   | When order was filled                |
| rejected_reason | TEXT          | Why order was rejected               |
| created_at      | TIMESTAMPTZ   | Order creation                       |
| updated_at      | TIMESTAMPTZ   | Last update                          |

### executions

Trade executions (filled orders).

| Column      | Type          | Description               |
| ----------- | ------------- | ------------------------- |
| id          | UUID          | Primary key               |
| order_id    | UUID          | FK to orders.id (CASCADE) |
| price_cents | NUMERIC(20,4) | Execution price           |
| quantity    | NUMERIC(20,2) | Executed quantity         |
| fees_cents  | NUMERIC(20,2) | Trading fees              |
| timestamp   | TIMESTAMPTZ   | Execution time            |

### transactions

Immutable transaction ledger (T+2 settlement).

| Column              | Type          | Description                         |
| ------------------- | ------------- | ----------------------------------- |
| id                  | UUID          | Primary key                         |
| portfolio_id        | UUID          | FK to portfolios.id (CASCADE)       |
| type                | ENUM          | BUY, SELL, DEPOSIT, WITHDRAWAL, FEE |
| amount_cents        | NUMERIC(20,2) | Transaction amount                  |
| balance_after_cents | NUMERIC(20,2) | Balance after transaction           |
| description         | TEXT          | Transaction description             |
| settle_date         | DATE          | Settlement date (T+2)               |
| created_at          | TIMESTAMPTZ   | Transaction creation                |

**Indexes**: `transactions_portfolio_id_idx` on portfolio_id

### assets

Available trading instruments.

| Column           | Type          | Description                  |
| ---------------- | ------------- | ---------------------------- |
| id               | UUID          | Primary key                  |
| ticker           | TEXT          | 4-character symbol (unique)  |
| name             | TEXT          | Instrument name              |
| type             | ENUM          | EQUITY, ETF, BOND, COMMODITY |
| sector           | TEXT          | Industry sector              |
| description      | TEXT          | Instrument description       |
| base_price_cents | NUMERIC(20,4) | Base price for simulation    |
| created_at       | TIMESTAMPTZ   | Asset creation               |
| updated_at       | TIMESTAMPTZ   | Last update                  |

**Indexes**: `assets_ticker_idx` on ticker

### competitions

Trading competitions.

| Column              | Type          | Description                                   |
| ------------------- | ------------- | --------------------------------------------- |
| id                  | UUID          | Primary key                                   |
| name                | TEXT          | Competition name                              |
| description         | TEXT          | Competition description                       |
| starting_cash_cents | NUMERIC(20,2) | Starting capital                              |
| status              | ENUM          | DRAFT, UPCOMING, ACTIVE, COMPLETED, CANCELLED |
| starts_at           | TIMESTAMPTZ   | Competition start                             |
| ends_at             | TIMESTAMPTZ   | Competition end                               |
| created_at          | TIMESTAMPTZ   | Competition creation                          |
| updated_at          | TIMESTAMPTZ   | Last update                                   |

### competition_participants

Competition participants.

| Column         | Type        | Description                     |
| -------------- | ----------- | ------------------------------- |
| id             | UUID        | Primary key                     |
| competition_id | UUID        | FK to competitions.id (CASCADE) |
| user_id        | UUID        | FK to users.id (CASCADE)        |
| portfolio_id   | UUID        | FK to portfolios.id (CASCADE)   |
| joined_at      | TIMESTAMPTZ | When user joined                |

**Indexes**: `competition_participants_competition_user_idx` on (competition_id, user_id)

### events

Club events.

| Column       | Type              | Description       |
| ------------ | ----------------- | ----------------- |
| id           | UUID              | Primary key       |
| title        | TEXT              | Event title       |
| description  | TEXT              | Event description |
| event_date   | TIMESTAMPTZ       | Event date/time   |
| location     | TEXT              | Event location    |
| capacity     | INTEGER           | Max attendees     |
| is_published | INTEGER (boolean) | Published flag    |
| created_at   | TIMESTAMPTZ       | Event creation    |
| updated_at   | TIMESTAMPTZ       | Last update       |

### articles

Educational content.

| Column       | Type              | Description       |
| ------------ | ----------------- | ----------------- |
| id           | UUID              | Primary key       |
| title        | TEXT              | Article title     |
| slug         | TEXT              | URL slug (unique) |
| content      | TEXT              | Markdown content  |
| category     | TEXT              | Content category  |
| is_published | INTEGER (boolean) | Published flag    |
| published_at | TIMESTAMPTZ       | Publication date  |
| created_at   | TIMESTAMPTZ       | Article creation  |
| updated_at   | TIMESTAMPTZ       | Last update       |

**Indexes**: `articles_slug_idx` on slug

### audit_log

Immutable audit trail.

| Column      | Type        | Description              |
| ----------- | ----------- | ------------------------ |
| id          | UUID        | Primary key              |
| user_id     | UUID        | FK to users.id (CASCADE) |
| action      | TEXT        | Action performed         |
| entity_type | TEXT        | Type of entity affected  |
| entity_id   | TEXT        | ID of entity affected    |
| details     | TEXT        | Action details           |
| timestamp   | TIMESTAMPTZ | When action occurred     |

**Never mutated.** Append-only for audit trail.

### password_reset_tokens

Password reset tokens.

| Column     | Type        | Description              |
| ---------- | ----------- | ------------------------ |
| id         | UUID        | Primary key              |
| user_id    | UUID        | FK to users.id (CASCADE) |
| token      | TEXT        | Reset token (hashed)     |
| expires_at | TIMESTAMPTZ | Token expiration         |
| used_at    | TIMESTAMPTZ | When token was used      |
| created_at | TIMESTAMPTZ | Token creation           |

### email_verification_tokens

Email verification tokens.

| Column     | Type        | Description                 |
| ---------- | ----------- | --------------------------- |
| id         | UUID        | Primary key                 |
| user_id    | UUID        | FK to users.id (CASCADE)    |
| token      | TEXT        | Verification token (hashed) |
| expires_at | TIMESTAMPTZ | Token expiration            |
| used_at    | TIMESTAMPTZ | When token was used         |
| created_at | TIMESTAMPTZ | Token creation              |

### idempotency_keys

Idempotency tracking for replay protection.

| Column     | Type        | Description              |
| ---------- | ----------- | ------------------------ |
| id         | UUID        | Primary key              |
| key        | TEXT        | Idempotency key (unique) |
| result     | JSON        | Cached result            |
| expires_at | TIMESTAMPTZ | Key expiration           |
| created_at | TIMESTAMPTZ | Key creation             |

**Indexes**: `idempotency_keys_key_idx` on key

## Constraints

### Foreign Keys

- All foreign keys use `ON DELETE CASCADE` for data integrity
- Prevents orphaned records when parent is deleted

### Uniqueness

- `users.email` - unique
- `profiles.student_id` - unique (if set)
- `assets.ticker` - unique
- `articles.slug` - unique
- `idempotency_keys.key` - unique

### Not Null

- All critical columns are `NOT NULL`
- Optional columns are explicitly nullable

## Migrations

Migrations are managed by Drizzle Kit:

```bash
pnpm db:generate  # Generate migration from schema
pnpm db:migrate    # Apply migrations
pnpm db:push       # Push schema directly (dev only)
```

## Money Handling

### String → BigInt Conversion

```typescript
// Database stores as string: "100000" (1000.00 MAD)
const cents = numericStringToCents("100000"); // 100000n
```

### BigInt → String Conversion

```typescript
// Domain uses bigint: 100000n
const dbValue = centsToNumericString(100000n); // "100000"
```

### Arithmetic

All arithmetic uses `bigint` in domain layer to prevent floating-point errors.

## Seed Data

Seed data is defined in `src/infrastructure/database/seed.ts`:

- 8 fictional MAD-denominated instruments
- Bootstrap administrator account
- Sample competitions (optional)

Run seed:

```bash
pnpm db:seed
```
