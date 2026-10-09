# Security Documentation

## Overview

The FSJESC Financial Markets Club platform implements defense-in-depth security across authentication, authorization, data integrity, and operational boundaries. This document outlines the security architecture, implemented controls, and verification procedures.

## Authentication

### Password Security

- **Hashing**: Passwords are hashed using Argon2id via `@node-rs/argon2`
- **Configuration**: Time cost of 3, memory cost of 64MB, parallelism of 4
- **Salting**: Automatic salt generation handled by the hashing library
- **Storage**: Only hashed passwords are stored in the database

### Session Management

- **Storage**: Database-backed sessions (PostgreSQL)
- **Session ID**: Cryptographically random tokens
- **Expiration**: Configurable session lifetime
- **Revocation**: Sessions can be revoked on logout or password change

### Multi-Factor Authentication

Currently not implemented. Planned for future enhancement.

## Authorization

### Role-Based Access Control (RBAC)

The platform uses four roles with hierarchical privileges:

| Role          | Capabilities                                              |
| ------------- | --------------------------------------------------------- |
| STUDENT       | Basic simulator access, read-only education content       |
| MEMBER        | Full simulator access, competition participation          |
| EXECUTIVE     | Content publishing, MEMBER grants, competition management |
| ADMINISTRATOR | Full system access, user management, system configuration |

Role hierarchy: `ADMINISTRATOR > EXECUTIVE > MEMBER > STUDENT`

### Server-Side Enforcement

All protected operations verify roles server-side:

```typescript
import { requireRole } from "@/infrastructure/auth/utils";

// Require specific role
const session = await requireRole("ADMINISTRATOR");
```

Client-side role claims are never trusted for authorization decisions.

### Ownership Checks

Parameterized routes enforce ownership verification:

- Users can only modify their own data
- Executives cannot modify administrators
- Executives cannot grant ADMINISTRATOR role
- Administrators have unrestricted access

Example from `src/app/api/executive/users/[id]/role/route.ts`:

```typescript
// Ownership check: executives cannot promote to ADMINISTRATOR
if (role === "ADMINISTRATOR" && session.user.role !== "ADMINISTRATOR") {
  throw new AppError("FORBIDDEN", "Only administrators can grant ADMINISTRATOR role", 403);
}
```

## Data Integrity

### Financial Mutations

- **Server Authority**: All balance changes, order execution, and P&L calculations are server-authoritative
- **Transactions**: Financial operations use database transactions
- **Precision**: Money is stored as integer `bigint` centimes
- **Validation**: All inputs validated with Zod schemas before processing

### Idempotency

- **Repository**: Idempotency key repository prevents duplicate processing
- **Idempotency Keys**: Generated for state-changing operations
- **Replay Protection**: Idempotent requests return the original result

Example from competition join:

```typescript
const idempotencyKey = generateIdempotencyKey(userId, competitionId);
const existing = await idempotencyRepository.get(idempotencyKey);
if (existing) {
  return existing.result;
}
```

### Audit Logging

All destructive actions are logged to the audit table:

```typescript
await db.insert(schema.auditLog).values({
  userId: session.user.id,
  action: "ROLE_UPDATE",
  entityType: "USER",
  entityId: id,
  details: `Updated role to ${role}`,
  timestamp: new Date(),
});
```

Audit entries include:

- Actor user ID
- Action type
- Entity type and ID
- Details
- Timestamp

## Input Validation

### Runtime Validation

All external inputs are validated using Zod schemas:

```typescript
const schema = z.object({
  ticker: z.string().length(4),
  side: z.enum(["BUY", "SELL"]),
  quantity: z.number().positive(),
  type: z.enum(["MARKET", "LIMIT"]),
  priceCents: z.bigint().optional(),
});
```

### XSS Prevention

- **Markdown**: All Markdown content is sanitized using `rehype-sanitize`
- **HTML Stripping**: Dangerous HTML tags and attributes are removed
- **Output Encoding**: React automatically encodes output
- **Content Security Policy**: CSP headers are configured

### SQL Injection Prevention

- **ORM**: All database queries use Drizzle ORM with parameterized queries
- **No Raw SQL**: Raw SQL is avoided unless necessary and properly escaped
- **Type Safety**: TypeScript strict mode prevents type confusion

## Rate Limiting

### Token Bucket Implementation

In-memory token bucket rate limiter:

```typescript
import { rateLimit } from "@/infrastructure/auth/rate-limit";

const allowed = await rateLimit(userId, 100, 60); // 100 requests per minute
if (!allowed) {
  throw new AppError("RATE_LIMITED", "Too many requests", 429);
}
```

### Configurable Limits

- **Authentication**: 5 attempts per 15 minutes
- **API Routes**: 100 requests per minute per user
- **Sensitive Operations**: Lower limits for destructive actions

## CSRF Protection

### Server Actions

Server Actions are protected by Next.js built-in CSRF tokens.

### API Routes

API routes use:

- SameSite cookie attributes
- CORS restrictions
- Origin validation for state-changing operations

## Cookie Security

All session cookies use:

- **HttpOnly**: Prevents JavaScript access
- **Secure**: Only transmitted over HTTPS
- **SameSite**: `strict` or `lax` depending on context
- **Path**: Restricted to application path

## Concurrent Operations

### Double-Spend Prevention

Order submission uses database row locking:

```typescript
await db.transaction(async (tx) => {
  const portfolio = await tx
    .select()
    .from(schema.portfolios)
    .where(eq(schema.portfolios.id, portfolioId))
    .for("update") // Row lock
    .limit(1);

  // Check balance and reserve funds
  if (BigInt(portfolio.cashCents) < totalCost) {
    throw new AppError("INSUFFICIENT_FUNDS", "Insufficient cash", 400);
  }

  // Update portfolio
  await tx
    .update(schema.portfolios)
    .set({ cashCents: (BigInt(portfolio.cashCents) - totalCost).toString() })
    .where(eq(schema.portfolios.id, portfolioId));
});
```

### Optimistic Concurrency

Version fields are used for optimistic concurrency control where appropriate.

## Security Headers

The platform sets security headers:

- `Content-Security-Policy`: Restricts script sources
- `X-Frame-Options`: Prevents clickjacking
- `X-Content-Type-Options`: Prevents MIME sniffing
- `Referrer-Policy`: Controls referrer information
- `Permissions-Policy`: Restricts browser features

## Secrets Management

### Environment Variables

All secrets are stored in environment variables:

- `DATABASE_URL`: Database connection string
- `AUTH_SECRET`: Session signing secret
- `MAIL_PROVIDER_*`: Email provider credentials

### Server-Only Code

Secrets are never exposed to client-side code:

```typescript
import "server-only";

// This file can only be imported on the server
export const getSecret = () => process.env.DATABASE_URL;
```

## Testing

### Security Test Suite

Located in `src/app/api/security/`:

- `role-escalation.test.ts`: Tests role escalation prevention
- `xss.test.ts`: Tests XSS payload neutralization
- `idempotency.test.ts`: Tests idempotent replay behavior
- `concurrent-operations.test.ts`: Tests double-spend prevention

### Verification Commands

Run security tests:

```bash
pnpm test:security
```

## Known Limitations

### Email Delivery

Email provider is currently console-only for development. Production deployment requires:

- SMTP configuration
- Email template verification
- Rate limiting on email sending

### Auth.js Integration

Full Auth.js v5 integration with Drizzle adapter is deferred. Current implementation uses:

- Custom authentication provider
- Database session storage
- Manual session management

### Docker Limitations

Integration tests requiring PostgreSQL may skip locally if Docker is unavailable. CI should provide PostgreSQL services.

## Security Checklist

Before production deployment:

- [ ] Review and rotate all secrets
- [ ] Configure production SMTP provider
- [ ] Enable HTTPS with valid certificate
- [ ] Review and tighten CSP headers
- [ ] Configure backup and recovery procedures
- [ ] Set up log aggregation and monitoring
- [ ] Review audit log retention policy
- [ ] Configure rate limiting for production traffic
- [ ] Enable database connection pooling
- [ ] Review and test role-based access controls
- [ ] Run full security test suite
- [ ] Perform penetration testing
- [ ] Document incident response procedures

## Incident Response

In case of security incident:

1. **Contain**: Disable affected services if necessary
2. **Investigate**: Review audit logs and access patterns
3. **Remediate**: Patch vulnerabilities and rotate secrets
4. **Notify**: Inform affected users per data breach laws
5. **Document**: Record incident details and prevention measures

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/security)
- [Argon2 Documentation](https://github.com/ranisalt/node-argon2)
- [Zod Validation](https://zod.dev/)
