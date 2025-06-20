# @diffit/api

The tRPC API layer for diffit.tools v2.0, providing type-safe API endpoints with built-in authentication, rate limiting, and real-time capabilities.

## Features

- **Type-safe API** with tRPC
- **Authentication** with Clerk and API keys
- **Rate limiting** with sliding window algorithm
- **WebSocket support** for real-time updates
- **File uploads** with multipart streaming
- **Caching** with Redis
- **Error handling** with standardized responses
- **Usage tracking** and analytics
- **Webhook support** for integrations

## Routers

### Auth Router (`/auth`)
- `me` - Get current user
- `updateProfile` - Update user profile
- `listApiKeys` - List API keys
- `createApiKey` - Create new API key
- `revokeApiKey` - Revoke API key
- `deleteAccount` - Delete user account

### Diff Router (`/diff`)
- `list` - List diffs with filtering and pagination
- `get` - Get single diff
- `create` - Create new diff
- `update` - Update diff
- `delete` - Delete diff
- `export` - Export diff in various formats
- `share` - Generate share link

### Collection Router (`/collection`)
- `list` - List user's collections
- `get` - Get single collection
- `create` - Create new collection
- `update` - Update collection
- `delete` - Delete collection
- `addDiff` - Add diff to collection
- `removeDiff` - Remove diff from collection

### Comment Router (`/comment`)
- `list` - List comments for a diff
- `get` - Get single comment with replies
- `create` - Create new comment
- `update` - Update comment
- `delete` - Delete comment
- `getThread` - Get comment thread for specific line

### Usage Router (`/usage`)
- `summary` - Get usage summary
- `history` - Get detailed usage history
- `apiKeyUsage` - Get API key usage
- `export` - Export usage data

### Billing Router (`/billing`)
- `plans` - Get available plans
- `subscription` - Get current subscription
- `createCheckout` - Create checkout session
- `updateSubscription` - Update subscription
- `invoices` - List invoices
- `paymentMethods` - Get payment methods
- `usage` - Get usage for billing

### Webhook Router (`/webhook`)
- `list` - List webhooks
- `create` - Create webhook
- `update` - Update webhook
- `delete` - Delete webhook
- `test` - Test webhook
- `logs` - Get webhook logs

## Middleware

### Authentication
```typescript
import { auth, optionalAuth, withPermission } from '@diffit/api/middleware';

// Require authentication
.use(auth)

// Optional authentication
.use(optionalAuth)

// Require specific permission
.use(withPermission('diff:create'))
```

### Rate Limiting
```typescript
import { standardRateLimit, strictRateLimit, apiRateLimit } from '@diffit/api/middleware';

// Standard rate limit (100 requests/15 min)
.use(standardRateLimit)

// Strict rate limit (20 requests/15 min)
.use(strictRateLimit)

// API rate limit (1000 requests/hour)
.use(apiRateLimit)
```

### Usage Tracking
```typescript
import { trackUsage } from '@diffit/api/middleware';

// Track usage with specific type
.use(trackUsage('DIFF_CREATE'))
```

## Error Handling

The API provides standardized error responses:

```typescript
import { errors } from '@diffit/api/utils';

// Throw standardized errors
throw errors.unauthorized();
throw errors.notFound('Diff');
throw errors.badRequest('Invalid input', details);
throw errors.planLimitExceeded('diffs', current, max);
throw errors.featureNotAvailable('Webhooks', 'PRO');
```

## WebSocket Support

Real-time updates for:
- Diff updates
- Comment additions
- User presence
- Collaboration events

```typescript
import { WebSocketHandler, broadcastToRoom, sendToUser } from '@diffit/api/utils';

// Broadcast to room
broadcastToRoom('diff:123', {
  type: 'diff-update',
  data: updatedDiff,
  room: 'diff:123',
});

// Send to specific user
sendToUser('user-123', {
  type: 'notification',
  data: { message: 'Your diff was commented on' },
});
```

## Caching

Built-in caching with Redis:

```typescript
import { withCache, cacheKeys, cacheTTL } from '@diffit/api/utils';

// Cache expensive operations
const result = await withCache(
  redis,
  cacheKeys.diff(slug),
  cacheTTL.diff,
  async () => {
    // Expensive operation
    return await fetchDiff(slug);
  }
);
```

## Usage

### Server Setup

```typescript
import { createHTTPHandler } from '@trpc/server/adapters/standalone';
import { createWSHandler } from '@trpc/server/adapters/ws';
import { appRouter, createContext } from '@diffit/api';

// HTTP handler
const handler = createHTTPHandler({
  router: appRouter,
  createContext,
});

// WebSocket handler
const wsHandler = createWSHandler({
  router: appRouter,
  createContext,
});
```

### Client Usage

```typescript
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from '@diffit/api';

const client = createTRPCClient<AppRouter>({
  url: 'https://api.diffit.tools',
  headers: {
    authorization: 'Bearer YOUR_TOKEN',
  },
});

// Make API calls
const diff = await client.diff.get.query({ slug: 'abc123' });
const newDiff = await client.diff.create.mutate({
  leftContent: 'old',
  rightContent: 'new',
});
```

## Environment Variables

```env
# JWT
JWT_SECRET=your-jwt-secret

# Redis
REDIS_URL=redis://localhost:6379

# Admin
ADMIN_TOKEN=your-admin-token

# App
APP_URL=https://diffit.tools
```

## Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```