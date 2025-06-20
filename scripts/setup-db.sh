#!/bin/bash

# Database setup script for diffit.tools

echo "Setting up database..."

# Load environment variables
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Navigate to db package
cd packages/db

# Generate Prisma client
echo "Generating Prisma client..."
pnpm prisma generate

# Run migrations
echo "Running database migrations..."
pnpm prisma migrate deploy

# Seed database (only in development)
if [ "$ENVIRONMENT" != "production" ]; then
  echo "Seeding database..."
  pnpm prisma db seed
fi

echo "Database setup complete!"