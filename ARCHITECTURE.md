# Architecture

## Overview

The FSJESC Financial Markets Club platform follows a clean, layered architecture with clear separation of concerns. The application is built with Next.js 16 App Router, TypeScript, and PostgreSQL.

## Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                        │
│  (Pages, Components, UI - Client & Server Components)       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Application Layer                          │
│  (Services, Use Cases, Business Logic)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Domain Layer                                │
│  (Pure Functions, Trading Engine, Market Model)              │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                Infrastructure Layer                           │
│  (Database, Auth, External Services, Repositories)            │
└─────────────────────────────────────────────────────────────┘
```

## Layer Responsibilities

### Presentation Layer (`src/app/`, `src/components/`)

- **Pages**: Route handlers in `src/app/` using Next.js App Router
- **Components**: React components for UI rendering
- **Forms**: User input handling with client-side validation
- **API Routes**: HTTP endpoints for client-server communication
- **Rules**:
  - Client components marked with `"use client"`
  - Server components are default and preferred for data fetching
  - No business logic in components
  - No direct database access from components

### Application Layer (`src/application/`)

- **Services**: Orchestrate domain operations and coordinate infrastructure
- **Examples**: `competition.service.ts`, `auth.service.ts`
- **Responsibilities**:
  - Coordinate multiple domain operations
  - Handle transactions
  - Enforce business rules
  - Map between domain and infrastructure
- **Rules**:
  - No UI concerns
  - No direct framework dependencies (Next.js, React)
  - Pure business logic coordination

### Domain Layer (`src/lib/`, `src/domain/`)

- **Trading Engine**: Pure functions for order execution, P&L calculation
- **Market Model**: Deterministic price generation and scenarios
- **Money**: Exact arithmetic for financial calculations
- **Rules**:
  - No external dependencies
  - Pure functions (no side effects)
  - Testable in isolation
  - Server-only imports where needed

### Infrastructure Layer (`src/infrastructure/`)

- **Database**: PostgreSQL schema, connection, migrations
- **Repositories**: Data access layer (Drizzle ORM)
- **Auth**: Authentication providers, sessions, RBAC
- **External APIs**: Email, third-party services
- **Rules**:
  - Encapsulates external concerns
  - Provides clean interfaces to application layer
  - Implements repository pattern for data access

## Data Flow

### Read Flow (Query)

```
Client Component
    ↓ fetch()
API Route
    ↓ requireAuth()
Application Service (optional)
    ↓ Repository
Database
    ↓ Result
Application Service (optional)
    ↓ JSON Response
Client Component
```

### Write Flow (Command)

```
Client Component
    ↓ POST with validation
API Route
    ↓ requireAuth() + requireRole()
Application Service
    ↓ Transaction
Repository
    ↓ execute
Database
    ↓ commit
Application Service
    ↓ audit log
    ↓ result
JSON Response
Client Component
```

## Dependency Rules

1. **Presentation → Application**: Allowed via API routes
2. **Presentation → Domain**: Allowed for utilities (formatting, validation)
3. **Application → Domain**: Allowed for core business logic
4. **Application → Infrastructure**: Allowed for data access
5. **Domain → Infrastructure**: Forbidden (pure domain)
6. **Infrastructure → Domain**: Forbidden (data access only)
7. **Infrastructure → Application**: Forbidden (infrastructure is lower layer)

## Module Organization

```
src/
├── app/                    # Next.js App Router
│   ├── (admin)/           # Admin dashboard pages
│   ├── (public)/          # Public pages
│   └── api/               # API routes
├── application/          # Application services
│   ├── competitions/      # Competition logic
│   └── auth/              # Auth coordination
├── components/            # React components
│   ├── ui/                # Primitives (Button, Alert, etc.)
│   ├── financial/         # Financial components
│   └── simulator/         # Simulator-specific
├── infrastructure/        # Infrastructure
│   ├── auth/              # Auth providers, RBAC
│   ├── database/          # Database, repositories
│   └── content/           # Content processing
├── lib/                   # Utilities
│   ├── trading/           # Trading engine
│   ├── market/            # Market model
│   ├── money.ts           # Money arithmetic
│   └── format.ts          # Formatting utilities
└── domain/                # Pure domain (if separated)
```

## Server-Only Boundaries

Critical security and data integrity code is marked with `"server-only"`:

- `src/infrastructure/auth/` - Authentication and session management
- `src/infrastructure/database/` - Database access
- `src/lib/trading/` - Trading engine (financial mutations)
- `src/lib/money.ts` - Money arithmetic

These modules cannot be imported in client components, preventing accidental client-side execution of server-authoritative operations.

## API Route Patterns

### GET (Read)

```typescript
export async function GET(request: NextRequest) {
  await requireAuth(); // Optional: public routes skip this
  const data = await repository.findAll();
  return NextResponse.json(data);
}
```

### POST (Write)

```typescript
export async function POST(request: NextRequest) {
  const session = await requireAuth();
  await requireRole("MEMBER");

  const body = await request.json();
  const validated = schema.parse(body);

  const result = await service.execute(validated, session.user.id);

  return NextResponse.json(result, { status: 201 });
}
```

### Parameterized Routes (Ownership)

```typescript
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAuth();
  const { id } = await params;

  // Ownership check
  const resource = await repository.findById(id);
  if (resource.userId !== session.user.id) {
    throw forbidden("You can only modify your own resources");
  }

  // Proceed with update
}
```

## Concurrency and Transactions

All financial mutations use database transactions:

```typescript
await db.transaction(async (tx) => {
  // Row-level locking
  const portfolio = await tx.query.portfolios
    .findFirst({ where: eq(portfolios.id, portfolioId) })
    .for("update");

  // Validate
  if (BigInt(portfolio.cashCents) < cost) {
    throw new Error("Insufficient funds");
  }

  // Update
  await tx.update(portfolios)
    .set({ cashCents: (BigInt(portfolio.cashCents) - cost).toString() })
    .where(eq(portfolios.id, portfolioId));

  // Insert execution
  await tx.insert(executions).values({ ... });
});
```

## Error Handling

All errors use typed `AppError`:

```typescript
throw new AppError("INSUFFICIENT_FUNDS", "Not enough cash", 400);
```

Error responses are consistent:

```json
{
  "error": "Insufficient funds",
  "code": "INSUFFICIENT_FUNDS"
}
```

## Security Boundaries

1. **Authentication**: `requireAuth()` in protected routes
2. **Authorization**: `requireRole()` for role-gated operations
3. **Ownership**: Explicit checks on parameterized routes
4. **Rate Limiting**: Token bucket on sensitive operations
5. **Audit Logging**: All destructive actions logged
6. **Server-Only**: Critical code cannot run on client

## Testing Strategy

- **Unit Tests**: Pure domain functions (trading engine, market model)
- **Integration Tests**: Application services with test database
- **E2E Tests**: Critical user flows with Playwright
- **Security Tests**: Role escalation, XSS, CSRF, rate limits

## Performance Considerations

- **Server Components**: Default for better performance
- **Data Fetching**: Use Next.js caching where appropriate
- **Database**: Indexed on foreign keys and query patterns
- **Static Generation**: Public content where possible
- **Streaming**: Use for large data sets
