# Deployment Checklist for diffit.tools

## Pre-deployment Steps

### 1. Environment Variables
Set these in Vercel dashboard:
- [ ] `DATABASE_URL` - PostgreSQL connection string (with pgbouncer)
- [ ] `DIRECT_URL` - PostgreSQL direct connection (for migrations)
- [ ] `SESSION_SECRET_KEY` - Session encryption key (32+ chars)
- [ ] `ENVIRONMENT` - Set to "production"
- [ ] `NODE_ENV` - Set to "production"

Optional:
- [ ] `SENTRY_DSN` - For error tracking
- [ ] `SENTRY_AUTH_TOKEN` - For source maps
- [ ] `NEXT_PUBLIC_POSTHOG_KEY` - For analytics
- [ ] `NEXT_PUBLIC_POSTHOG_HOST` - PostHog host

### 2. Database Setup
```bash
# Run migrations
pnpm db:push

# Generate Prisma client
pnpm db:generate
```

### 3. Build WebAssembly (if not in repo)
```bash
pnpm build:wasm
```

## Deployment Commands

### First-time setup:
```bash
# Link to Vercel project
vercel link --project=prj_5fZz8GPJn9fxkco1NYsrFqRkoKe0

# Deploy to production
vercel --prod
```

### Subsequent deployments:
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

## Post-deployment Verification

1. Check application loads at production URL
2. Test diff creation and saving
3. Verify localStorage functionality
4. Check theme switching
5. Test export functionality
6. Monitor error logs (if Sentry configured)

## Notes

- The app uses localStorage for all user data
- No authentication required
- All diffs are stored locally in the browser
- Database is only used for sharing diffs via URLs