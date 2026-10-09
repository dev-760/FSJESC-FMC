# Deployment

## Overview

This guide covers deploying the FSJESC Financial Markets Club platform to production. The platform is built with Next.js 16 and requires PostgreSQL 17.

## Prerequisites

- Node.js >= 20.9.0
- pnpm >= 12.9.1
- PostgreSQL 17
- Domain name (optional)
- SSL certificate (recommended)

## Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"
TEST_DATABASE_URL="postgresql://user:password@host:5433/test_database"

# Auth
AUTH_SECRET="32-byte-base64-secret"
AUTH_TRUST_HOST="true"
AUTH_URL="https://your-domain.com"

# Bootstrap Admin
BOOTSTRAP_ADMIN_EMAIL="admin@your-domain.com"
BOOTSTRAP_ADMIN_PASSWORD="secure-password-12-chars"
BOOTSTRAP_ADMIN_NAME="Platform Administrator"

# Seed Data
SEED_DEMO="false"
MARKET_SEED="fsjesc-fmc-v1"

# Email
MAIL_PROVIDER="smtp"  # or "console" for development
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-email"
SMTP_PASSWORD="your-password"
SMTP_FROM="noreply@your-domain.com"

# App
NEXT_PUBLIC_APP_NAME="FSJESC Financial Markets Club"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_CONTACT_EMAIL="contact@your-domain.com"
```

## Database Setup

### Production Database

1. Create PostgreSQL database:

```bash
createdb fsjesc_fmc
```

2. Run migrations:

```bash
pnpm db:migrate
```

3. Seed initial data:

```bash
SEED_DEMO="true" pnpm db:seed
```

### Connection Pooling

Configure connection pooling for production:

```typescript
// drizzle.config.ts
export default {
  schema: "./src/infrastructure/database/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  pool: {
    min: 2,
    max: 10,
  },
} satisfies DrizzleConfig;
```

## Build Process

### Production Build

```bash
pnpm build
```

This creates:

- Optimized production build
- Static assets in `.next/static`
- Server bundle in `.next/server`

### Build Verification

```bash
pnpm verify
```

Runs:

- Type checking
- Linting
- Unit tests
- Build check

## Deployment Options

### Vercel (Recommended)

1. Install Vercel CLI:

```bash
pnpm add -g vercel
```

2. Login:

```bash
vercel login
```

3. Deploy:

```bash
vercel --prod
```

4. Set environment variables in Vercel dashboard

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable pnpm && pnpm build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t fsjesc-fmc .
docker run -p 3000:3000 --env-file .env fsjesc-fmc
```

### VPS (DigitalOcean, AWS, etc.)

1. Install Node.js and pnpm
2. Clone repository
3. Install dependencies:

```bash
pnpm install
```

4. Build:

```bash
pnpm build
```

5. Start production server:

```bash
pnpm start
```

Use PM2 for process management:

```bash
pnpm add -g pm2
pm2 start npm --name "fsjesc-fmc" -- start
pm2 save
pm2 startup
```

## SSL Configuration

### Using Let's Encrypt (Certbot)

1. Install Certbot:

```bash
sudo apt-get install certbot python3-certbot-nginx
```

2. Obtain certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

3. Auto-renewal is configured automatically

### Using Cloudflare

1. Add domain to Cloudflare
2. Configure DNS to point to your server
3. Enable SSL/TLS in Cloudflare dashboard
4. Set SSL mode to "Full" or "Full (Strict)"

## Monitoring

### Application Monitoring

Consider using:

- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **Vercel Analytics**: Performance metrics (if using Vercel)

### Database Monitoring

- Enable PostgreSQL slow query log
- Monitor connection pool usage
- Set up alerts for connection exhaustion

### Health Checks

Add health check endpoint:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { db } from "@/infrastructure/database/connection";

export async function GET() {
  try {
    await db.execute("SELECT 1");
    return NextResponse.json({ status: "healthy", database: "connected" });
  } catch (error) {
    return NextResponse.json({ status: "unhealthy", database: "disconnected" }, { status: 503 });
  }
}
```

## Backup Strategy

### Database Backups

Automate daily backups:

```bash
# Using pg_dump
pg_dump fsjesc_fmc > backup_$(date +%Y%m%d).sql

# Compress
gzip backup_$(date +%Y%m%d).sql
```

Store backups securely (offsite or cloud storage).

### Restoration

```bash
gunzip backup_20260101.sql.gz
psql fsjesc_fmc < backup_20260101.sql
```

## Security Checklist

Before going to production:

- [ ] Change all default passwords
- [ ] Rotate `AUTH_SECRET` to a secure random value
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure CORS to restrict origins
- [ ] Set up rate limiting on API routes
- [ ] Enable database connection encryption
- [ ] Configure environment-specific logging
- [ ] Set up log aggregation
- [ ] Configure backup and recovery
- [ ] Review and test RBAC configuration
- [ ] Ensure all secrets are in environment variables
- [ ] Disable debug mode in production
- [ ] Set up monitoring and alerting

## Performance Optimization

### Database

- Add indexes on frequently queried columns
- Enable query caching where appropriate
- Use connection pooling
- Regularly vacuum and analyze tables

### Application

- Enable Next.js caching for static content
- Use CDN for static assets
- Optimize images (WebP, lazy loading)
- Minimize JavaScript bundle size
- Enable compression (gzip/brotli)

### Caching Strategy

```typescript
// Static pages - revalidate daily
export const revalidate = 86400;

// Dynamic data - revalidate every minute
export const revalidate = 60;

// Real-time data - no caching
export const dynamic = "force-dynamic";
export const revalidate = 0;
```

## Scaling Considerations

### Horizontal Scaling

Next.js supports horizontal scaling:

- Deploy multiple instances behind a load balancer
- Use sticky sessions for auth (if needed)
- Database connection pool per instance

### Database Scaling

- Use managed PostgreSQL (AWS RDS, Google Cloud SQL)
- Enable read replicas for read-heavy workloads
- Consider partitioning for large tables

## CI/CD

### GitHub Actions

Example workflow:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: "--prod"
```

## Troubleshooting

### Build Failures

- Check Node.js version matches requirement
- Verify all environment variables are set
- Ensure PostgreSQL is accessible
- Check for insufficient memory during build

### Runtime Errors

- Check database connection string
- Verify `AUTH_SECRET` is set
- Review logs for authentication errors
- Check for migration mismatches

### Performance Issues

- Monitor database query times
- Check for N+1 queries
- Review bundle size
- Enable caching where appropriate

## Rollback Procedure

If deployment fails:

1. Revert to previous commit:

```bash
git revert HEAD
git push
```

2. Or rollback on Vercel:

```bash
vercel rollback
```

3. If database migration caused issues:

```bash
pnpm db:rollback  # If using versioned migrations
```

## Support

For deployment issues:

1. Check logs: `vercel logs` or server logs
2. Review documentation: `README.md`, `ARCHITECTURE.md`
3. Check GitHub issues
4. Contact: `contact@fsjesc-fmc.local`
