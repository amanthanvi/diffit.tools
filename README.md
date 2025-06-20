# diffit.tools

A high-performance, web-based diff comparison utility built with Next.js 14, WebAssembly, and modern web technologies. No account required - all data is stored locally in your browser.

## Features

- **High-Performance Diff Engine** - WebAssembly-powered diff calculations handling millions of lines
- **Multiple View Modes** - Unified, split, and inline diff views
- **Syntax Highlighting** - Support for 20+ programming languages
- **No Account Required** - All data stored locally in your browser
- **Export Options** - Export to PDF, HTML, Markdown, or JSON
- **Dark Mode** - System-aware theme switching
- **Accessibility** - WCAG AA compliant with full keyboard navigation

## Architecture

This monorepo is organized using Turborepo and PNPM workspaces:

### Apps

- **`apps/web`** - Next.js 14 main application with App Router
- **`apps/docs`** - Nextra-powered documentation site
- **`apps/marketing`** - Astro-based landing page for optimal performance

### Packages

- **`packages/ui`** - Shared UI components (Radix UI + Tailwind CSS)
- **`packages/diff-engine`** - WebAssembly-powered diff algorithms
- **`packages/api`** - tRPC API routers and business logic
- **`packages/db`** - Prisma ORM schema and database utilities
- **`packages/types`** - Shared TypeScript type definitions
- **`packages/config`** - Shared configuration files

### Infrastructure

- **`infrastructure/vercel`** - Vercel deployment configurations
- **`infrastructure/monitoring`** - Monitoring and observability setup

## Prerequisites

- Node.js 18+ (use `.nvmrc`)
- PNPM 8+
- PostgreSQL 14+ (for production)
- Rust toolchain (for WebAssembly)

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/diffit.tools.git
cd diffit.tools
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

4. Set up the database:
```bash
pnpm db:push
pnpm db:seed # Optional: seed with sample data
```

5. Start the development servers:
```bash
pnpm dev
```

This will start:
- Web app: http://localhost:3000
- Documentation: http://localhost:3001
- Marketing site: http://localhost:3002

## Scripts

### Development
- `pnpm dev` - Start all apps in development mode
- `pnpm build` - Build all apps and packages
- `pnpm lint` - Lint all packages
- `pnpm test` - Run all tests
- `pnpm type-check` - Type check all packages

### Database
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Prisma Studio
- `pnpm db:generate` - Generate Prisma client
- `pnpm db:migrate` - Run migrations

### Deployment
- `pnpm deploy:preview` - Deploy preview to Vercel
- `pnpm deploy:production` - Deploy to production

## Development Workflow

1. Create a feature branch:
```bash
git checkout -b feature/my-feature
```

2. Make changes and test locally:
```bash
pnpm dev
pnpm test
```

3. Build and type-check:
```bash
pnpm build
pnpm type-check
```

4. Create a changeset:
```bash
pnpm changeset
```

5. Submit a pull request

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: tRPC, Prisma, PostgreSQL
- **Diff Engine**: WebAssembly (Rust)
- **Deployment**: Vercel
- **Monitoring**: Sentry, Vercel Analytics

## License

MIT