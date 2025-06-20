#!/bin/bash

# Build verification script for diffit.tools

set -e

echo "🔍 Verifying build readiness..."

# Check Node version
NODE_VERSION=$(node -v)
echo "✓ Node version: $NODE_VERSION"

# Check for required files
echo "Checking required files..."
required_files=(
  "package.json"
  "pnpm-workspace.yaml"
  "turbo.json"
  "vercel.json"
  ".env.example"
  "apps/web/package.json"
  "packages/db/prisma/schema.prisma"
)

for file in "${required_files[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file exists"
  else
    echo "✗ Missing: $file"
    exit 1
  fi
done

# Check for auth references
echo ""
echo "Checking for authentication references..."
AUTH_REFS=$(grep -r "@clerk\|useAuth\|SignIn\|SignUp" apps/web/src packages/api/src packages/types/src 2>/dev/null | grep -v "node_modules" | wc -l || true)
if [ "$AUTH_REFS" -eq "0" ]; then
  echo "✓ No authentication references found"
else
  echo "✗ Found $AUTH_REFS authentication references"
  grep -r "@clerk\|useAuth\|SignIn\|SignUp" apps/web/src packages/api/src packages/types/src 2>/dev/null | grep -v "node_modules" || true
fi

# Check for missing packages
echo ""
echo "Checking for removed packages..."
if [ -d "packages/auth" ]; then
  echo "✗ packages/auth still exists"
  exit 1
else
  echo "✓ packages/auth removed"
fi

if [ -d "packages/billing" ]; then
  echo "✗ packages/billing still exists"
  exit 1
else
  echo "✓ packages/billing removed"
fi

# Check environment variables
echo ""
echo "Checking .env.example..."
if grep -q "CLERK\|STRIPE" .env.example; then
  echo "✗ Found auth/billing variables in .env.example"
  exit 1
else
  echo "✓ .env.example cleaned"
fi

echo ""
echo "✅ Build verification passed!"
echo ""
echo "Next steps:"
echo "1. Install dependencies: pnpm install"
echo "2. Set up environment variables in Vercel"
echo "3. Deploy: vercel --prod"