# AMS - Admin Management System

The FSJESC Admin Management System is a separate Next.js application that shares the database and infrastructure with the main FSJESC-FMC application. It provides a dedicated admin interface for managing users, events, articles, competitions, orders, and system monitoring.

## Architecture

This is a **monorepo admin module** (Option 2):
- Shares the same PostgreSQL database as the main application
- Uses the same database schema from `../src/infrastructure/database/schema.ts`
- Runs on a separate port (3001) for dedicated admin access
- Can be extended with its own API routes or use the main app's API

## UI Framework

This project uses **Tamagui** for UI components, providing:
- Cross-platform styling (works on web, iOS, Android)
- Type-safe styled components
- Built-in animation support
- High performance with automatic optimization

## Project Structure

```
ams/
├── src/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx     # Dashboard
│   │   ├── users/       # User management
│   │   ├── events/      # Event management
│   │   ├── articles/    # Article management
│   │   ├── competitions/# Competition management
│   │   ├── orders/      # Order management
│   │   ├── system/      # System status
│   │   ├── analytics/   # Analytics dashboard
│   │   ├── layout.tsx   # Root layout with TamaguiProvider
│   │   └── globals.css  # Minimal CSS
│   ├── components/      # React components
│   │   ├── sidebar.tsx  # Navigation sidebar
│   │   ├── header.tsx   # Top header
│   │   └── ui/          # Tamagui UI components
│   │       ├── button.tsx
│   │       └── card.tsx
├── lib/                 # Utilities
│   ├── cn.ts           # Class name utility
│   └── db.ts           # Database connection
├── tamagui.config.ts    # Tamagui configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
└── next.config.ts       # Next.js config with Tamagui plugin
```

## Setup

### Prerequisites

- Node.js >= 20.9.0
- pnpm package manager
- PostgreSQL database (shared with main app)
- Environment variables from main app

### Installation

1. Navigate to the AMS directory:
```bash
cd ams
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
# Copy from main app or create .env.local
cp ../.env.local .env.local
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string

### Development

Run the development server on port 3001:
```bash
pnpm dev
```

The admin panel will be available at `http://localhost:3001`

### Build

Build for production:
```bash
pnpm build
```

Start production server:
```bash
pnpm start
```

## Features

### Pages

1. **Dashboard** - Overview with statistics and quick actions
2. **Users** - User management with role assignments
3. **Events** - Club event and session management
4. **Articles** - Educational content management
5. **Competitions** - Trading competition management
6. **Orders** - Trading order monitoring
7. **System** - System health and status monitoring
8. **Analytics** - Platform analytics and metrics

### Tamagui Components

The project uses Tamagui's built-in components:
- `XStack` - Horizontal layout
- `YStack` - Vertical layout
- `Text` - Typography
- `Button` - Interactive buttons
- `Input` - Form inputs
- `Card` - Container components

Custom styled components are created using Tamagui's `styled()` function for type-safe, composable UI elements.

### Database Integration

The AMS uses the same database schema as the main application:
- Imports schema from `../src/infrastructure/database/schema.ts`
- Uses Drizzle ORM for database operations
- Shares all tables: users, portfolios, orders, events, articles, competitions, etc.

### Authentication

Currently, the AMS has placeholder authentication. To integrate with the main app's auth system:

1. Import auth configuration from `../src/infrastructure/auth/`
2. Add authentication middleware to protect admin routes
3. Implement role-based access control (ADMINISTRATOR role required)

## Future Enhancements

- [ ] Integrate with main app's authentication system
- [ ] Add role-based access control
- [ ] Implement real-time data updates
- [ ] Add server actions for CRUD operations
- [ ] Integrate TradingView lightweight-charts for analytics
- [ ] Add export functionality for reports
- [ ] Implement audit log viewer
- [ ] Add notification system

## Integration with Main App

The AMS can:

1. **Use existing API routes**: Call API endpoints from the main app at `http://localhost:3000/api/*`
2. **Share database**: Direct database access through shared schema
3. **Reuse components**: Import components from `../src/components/` if needed
4. **Shared utilities**: Use utilities from `../src/lib/`

## Deployment

Deploy as a separate application:
- Vercel: Create a new project linked to this directory
- Docker: Build separate container with shared database connection
- Self-hosted: Run on a subdomain (e.g., admin.fsjesc-fmc.com)

## License

Same as the main FSJESC-FMC project.
