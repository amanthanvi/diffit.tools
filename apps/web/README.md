# Diffit Web Application

The main web application for Diffit v2.0, built with Next.js 14 App Router.

## Features

- **Next.js 14 App Router**: Modern React framework with server components
- **TypeScript**: Full type safety across the application
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Clerk Authentication**: Secure user authentication and management
- **tRPC**: End-to-end typesafe APIs
- **WebAssembly Diff Engine**: High-performance diff calculations
- **Real-time Collaboration**: Live sharing and commenting on diffs
- **PWA Support**: Progressive Web App with offline capabilities
- **Analytics**: PostHog integration for user analytics
- **Error Monitoring**: Sentry integration for error tracking

## Getting Started

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

## Environment Variables

See `.env.example` for required environment variables.

## Project Structure

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components
├── hooks/           # Custom React hooks
├── lib/             # Utility libraries
├── providers/       # React context providers
├── services/        # External service integrations
├── stores/          # Zustand state stores
├── styles/          # Global styles
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## Key Pages

- `/` - Marketing landing page
- `/diff` - Main diff viewer
- `/dashboard` - User dashboard
- `/collections` - Diff collections
- `/settings` - User settings
- `/pricing` - Pricing plans
- `/docs` - Documentation

## Performance Optimizations

- Edge runtime for API routes
- Image optimization with Next.js Image
- Font optimization with Next.js Font
- Code splitting and lazy loading
- Partial prerendering for static content
- WebAssembly for diff calculations

## Accessibility

- WCAG AA compliant
- Keyboard navigation support
- Screen reader optimized
- Focus management
- ARIA labels and descriptions

## Testing

```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type checking
pnpm type-check
```

## Deployment

The app is optimized for deployment on Vercel with automatic preview deployments for pull requests.