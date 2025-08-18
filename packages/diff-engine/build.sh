#!/bin/bash

# Create dist directory if it doesn't exist
mkdir -p dist

# Compile TypeScript files
echo "Building TypeScript files..."

# Build CommonJS version
npx tsc ts/index-stub.ts ts/folder-compare.ts \
  --module commonjs \
  --target es2015 \
  --outDir dist \
  --declaration \
  --esModuleInterop \
  --skipLibCheck \
  --resolveJsonModule

# Rename index-stub to index for CommonJS
if [ -f "dist/index-stub.js" ]; then
  mv dist/index-stub.js dist/index.js
fi
if [ -f "dist/index-stub.d.ts" ]; then
  mv dist/index-stub.d.ts dist/index.d.ts
fi

# Build ESM version
npx tsc ts/index-stub.ts ts/folder-compare.ts \
  --module esnext \
  --target es2015 \
  --outDir dist \
  --esModuleInterop \
  --skipLibCheck \
  --resolveJsonModule

# Rename index-stub to index.esm for ESM
if [ -f "dist/index-stub.js" ]; then
  mv dist/index-stub.js dist/index.esm.js
fi

echo "Build complete!"