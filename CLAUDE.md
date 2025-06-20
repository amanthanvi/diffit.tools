# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

diffit.tools is a high-performance web-based diff comparison utility built with Next.js 14 and WebAssembly. It provides secure, fast, and accessible text, file, and PDF comparison with advanced features including real-time validation, export capabilities, and comprehensive security measures. No user accounts are required - all data is stored locally in the browser.

## Development Commands

### Local Development
```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Run specific app
pnpm dev:web      # Main web app
pnpm dev:docs     # Documentation
pnpm dev:marketing # Marketing site
```

### Building
```bash
# Build all packages and apps
pnpm build

# Build WebAssembly modules
pnpm build:wasm

# Build specific app
pnpm build --filter=web
```

### Database Operations (Async)
```bash
# Generate Prisma client
pnpm db:generate

# Push schema changes to database
pnpm db:push

# Run migrations
pnpm db:migrate

# Open Prisma Studio
pnpm db:studio

# Seed database (development only)
pnpm db:seed
```

### Testing & Quality
```bash
# Run tests
pnpm test
pnpm test:watch

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format
```

## Architecture Overview

### Monorepo Structure
- **Turborepo** for build orchestration
- **PNPM workspaces** for dependency management
- **Shared packages** for code reuse

### Apps
- **web**: Main Next.js 14 application with App Router
- **docs**: Documentation site using Nextra
- **marketing**: High-performance landing page with Astro

### Core Packages
- **packages/ui**: Radix UI + Tailwind CSS component library
- **packages/diff-engine**: WebAssembly diff algorithms (Rust)
- **packages/api**: tRPC API layer
- **packages/db**: Prisma ORM and database utilities
- **packages/types**: Shared TypeScript types
- **packages/config**: Shared configurations

### Key Features
1. **No Authentication Required**: All data stored locally in browser
2. **High Performance**: WebAssembly diff engine handles millions of lines
3. **Multiple View Modes**: Split, unified, and inline views
4. **Export Options**: PDF, HTML, Markdown, JSON
5. **Accessibility**: WCAG AA compliant
6. **Dark Mode**: System-aware theme switching

## Environment Configuration

### Required Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://... # For migrations

# Session
SESSION_SECRET_KEY=your-secret-key-min-32-chars

# Environment
ENVIRONMENT=development
NODE_ENV=development

# Monitoring (optional)
SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
```

## Local Storage Architecture

Since there's no authentication, the app uses localStorage for:
- Recent diffs history
- User preferences (theme, view mode)
- Saved diffs with titles and descriptions

Key storage keys:
- `diffit:recentDiffs` - Array of recent diff metadata
- `diffit:preferences` - User preferences object
- `diffit:savedDiffs` - Map of saved diffs by ID

## Development Guidelines

### Code Style
- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Prefer functional components
- Use React hooks appropriately

### Component Guidelines
- Components in `packages/ui` should be generic and reusable
- App-specific components stay in `apps/web/src/components`
- Use Radix UI primitives for accessibility
- Style with Tailwind CSS utilities

### API Design
- Use tRPC for type-safe APIs
- Keep routers focused and small
- Use Zod for input validation
- Handle errors gracefully

### Performance
- Lazy load heavy components
- Use React.memo where appropriate
- Optimize images with next/image
- Minimize bundle size

### Testing
- Write unit tests for utilities
- Integration tests for API routes
- E2E tests for critical flows
- Aim for >80% coverage

## Deployment

### Vercel Deployment
```bash
# Deploy preview
vercel

# Deploy to production
vercel --prod
```

### Environment Setup
1. Set all required env vars in Vercel dashboard
2. Configure domains
3. Set up monitoring (optional)

## Troubleshooting

### Common Issues
1. **WASM not loading**: Ensure `pnpm build:wasm` was run
2. **Database errors**: Check DATABASE_URL is correct
3. **Type errors**: Run `pnpm typecheck` to diagnose

### Debug Commands
```bash
# Check dependency graph
pnpm ls

# Clean all build artifacts
pnpm clean

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```