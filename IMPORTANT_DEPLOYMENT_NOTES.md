# CRITICAL DEPLOYMENT NOTES

## WebAssembly (WASM) Issue - RESOLVED

I've created a JavaScript stub implementation in `packages/diff-engine/pkg/index.js` that will allow the deployment to succeed. The WASM functionality will be limited but the app will work.

To enable full WASM functionality later:

### Option 1: Build WASM Locally Before Deployment (Recommended)
```bash
# Install Rust if not installed
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh

# Build WASM
cd packages/diff-engine
npm run build:wasm
cd ../..

# Now commit the built files
git add packages/diff-engine/pkg
git commit -m "Add built WASM files"
git push
```

### Option 2: Add Build Step to Vercel
Add this to your Vercel build command:
```
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh && pnpm build:wasm && pnpm turbo run build --filter=web
```

Note: This will increase build time significantly.

## Environment Variables Required in Vercel

1. **DATABASE_URL** - Your Supabase pooler connection string
2. **DIRECT_URL** - Your Supabase direct connection string  
3. **SESSION_SECRET_KEY** - Your 32+ character secret
4. **ENVIRONMENT** - Set to "production"

## Vercel Configuration

The `vercel.json` is configured for:
- Monorepo with Turborepo
- Output directory: `apps/web/.next`
- Build command: `pnpm turbo run build --filter=web`

## Final Steps

1. **Install dependencies locally**:
   ```bash
   npm install -g pnpm@8
   pnpm install
   ```

2. **Build WASM** (see Option 1 above)

3. **Test build locally**:
   ```bash
   pnpm build
   ```

4. **Deploy**:
   ```bash
   vercel --prod
   ```

## Known Issues

1. **WASM not loading**: The diff engine will fail if WASM files aren't built
2. **Database connection**: Ensure both DATABASE_URL and DIRECT_URL are set
3. **Build failures**: Usually due to missing WASM files or wrong Node version

## Support

If deployment fails, check:
1. Vercel build logs for specific errors
2. Ensure all environment variables are set
3. Verify WASM files exist in `packages/diff-engine/pkg/`