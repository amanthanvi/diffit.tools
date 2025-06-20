#!/bin/bash

# Deployment script for diffit.tools

set -e

echo "🚀 Starting deployment process..."

# Check if we're on main branch
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
  echo "⚠️  Warning: You're not on the main branch. Current branch: $CURRENT_BRANCH"
  read -p "Continue deployment? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Run pre-deployment checks
echo "Running pre-deployment checks..."

# Type check
echo "Type checking..."
pnpm typecheck

# Lint
echo "Linting..."
pnpm lint

# Test
echo "Running tests..."
pnpm test

# Build
echo "Building application..."
pnpm build

# Deploy to Vercel
echo "Deploying to Vercel..."

if [ "$1" == "--production" ]; then
  echo "Deploying to production..."
  vercel --prod
else
  echo "Deploying to preview..."
  vercel
fi

echo "✅ Deployment complete!"