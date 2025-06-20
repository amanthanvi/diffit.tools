# @diffit/db

Database package for diffit.tools v2.0 using Prisma with PostgreSQL.

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Run migrations:
```bash
pnpm db:migrate
```

4. Seed the database (optional):
```bash
pnpm db:seed
```

## Available Scripts

- `pnpm build` - Build the package
- `pnpm dev` - Build in watch mode
- `pnpm db:generate` - Generate Prisma Client
- `pnpm db:push` - Push schema changes to database
- `pnpm db:migrate` - Create and apply migrations
- `pnpm db:migrate:deploy` - Apply migrations in production
- `pnpm db:migrate:reset` - Reset database and reapply migrations
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:seed` - Seed the database with sample data

## Usage

```typescript
import { prisma, db } from '@diffit/db';

// Using the Prisma client directly
const user = await prisma.user.findUnique({
  where: { email: 'user@example.com' }
});

// Using typed helpers
const user = await db.user.findByEmail('user@example.com');
const diff = await db.diff.findBySlug('abc123');

// Transactions
import { withTransaction } from '@diffit/db';

const result = await withTransaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  const diff = await tx.diff.create({ data: { ...diffData, userId: user.id } });
  return { user, diff };
});
```

## Database Schema

The database includes the following models:

- **User** - User accounts with Clerk integration
- **Diff** - Text/file comparisons with metadata
- **Collection** - Groups of related diffs
- **Comment** - Collaborative comments on diffs
- **ApiKey** - API keys for programmatic access
- **Usage** - Usage tracking for billing/analytics
- **FileMetadata** - Metadata for uploaded files
- **DiffAnalytics** - Analytics data for diffs

## Migrations

Create a new migration:
```bash
pnpm db:migrate -- --name add_new_field
```

Check migration status:
```bash
pnpm tsx src/migrations.ts status
```

## Connection Management

The package includes automatic connection pooling and retry logic:

```typescript
import { connectDatabase, checkDatabaseHealth } from '@diffit/db';

// Connect with custom pool options
await connectDatabase({
  connectionLimit: 30,
  maxIdleTime: 60,
  queueLimit: 0
});

// Check database health
const health = await checkDatabaseHealth();
console.log(health); // { status: 'healthy', latency: 23 }
```

## Development

The package includes comprehensive seed data for development:

- 3 test users (free, pro, enterprise plans)
- Sample diffs with various types and visibility
- Collections, comments, and usage data
- API keys for testing

Run `pnpm db:seed` to populate your development database.