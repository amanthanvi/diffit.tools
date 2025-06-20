import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  noExternal: ['superjson'], // Bundle superjson to avoid ESM issues
  external: [
    '@diffit/auth',
    '@diffit/db',
    '@diffit/diff-engine',
    '@diffit/types',
    '@trpc/server',
    'ws',
    'crypto',
    'stream',
    'buffer',
  ],
});