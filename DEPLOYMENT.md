# Diffit.tools Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Supabase Account**: For database (PostgreSQL)
3. **GitHub Repository**: Connected to Vercel

## Environment Variables Required

Set these in Vercel Dashboard > Settings > Environment Variables:

### Required Variables

```bash
# Database (from Supabase)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_REF:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Session Security
SESSION_SECRET_KEY="generate-a-random-32-char-string-here"

# Environment
NODE_ENV="production"
ENVIRONMENT="production"

# API URL (update after deployment)
NEXT_PUBLIC_API_URL="https://your-app-name.vercel.app"
```

### Optional Variables

```bash
# Analytics
NEXT_PUBLIC_POSTHOG_KEY=""
NEXT_PUBLIC_ANALYTICS_ID=""

# Monitoring
SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""

# Feature Flags
ENABLE_WASM_DIFF="true"
ENABLE_COLLABORATION="false"
```

## Deployment Steps

### 1. Initial Setup

1. Fork/Clone this repository
2. Push to your GitHub account

### 2. Vercel Configuration

1. Import project in Vercel dashboard
2. Configure build settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./` (keep as root)
   - **Build Command**: (auto-detected from vercel.json)
   - **Output Directory**: (auto-detected from vercel.json)
   - **Install Command**: (auto-detected from vercel.json)

### 3. Database Setup (Supabase)

1. Create a new Supabase project
2. Go to Settings > Database
3. Copy the connection strings:
   - **Connection string** → `DATABASE_URL`
   - **Direct connection** → `DIRECT_URL`

### 4. Generate Session Secret

Run this command to generate a secure session key:
```bash
openssl rand -base64 32
```

### 5. Deploy

1. Add all environment variables in Vercel
2. Deploy the project
3. Update `NEXT_PUBLIC_API_URL` with your deployed URL

## Post-Deployment

### Update API URL

After initial deployment:
1. Copy your Vercel deployment URL (e.g., `https://diffit-tools.vercel.app`)
2. Update `NEXT_PUBLIC_API_URL` environment variable
3. Redeploy to apply changes

### Database Migrations

If using database features:
```bash
# Run from local machine with production DATABASE_URL
pnpm db:push
```

## Troubleshooting

### Build Failures

1. **Package manager issues**: Ensure you're using PNPM
2. **Environment variables**: Check all required vars are set
3. **Memory issues**: The build uses WebAssembly, may need more memory

### 404 Errors

1. **Favicon**: Already included in `apps/web/public/`
2. **API routes**: Check `/api` routes are properly configured

### Common Issues

- **"Module not found"**: Run `pnpm install` locally and commit lockfile
- **Type errors**: Build is configured to ignore TypeScript errors
- **WASM not loading**: Ensure `ENABLE_WASM_DIFF=true` is set

## Local Testing

Test production build locally:
```bash
pnpm build
pnpm start
```

## Support

For issues specific to this deployment, check:
- Vercel deployment logs
- Browser console for client-side errors
- Vercel Functions logs for API errors