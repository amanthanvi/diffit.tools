import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    '@diffit/auth',
    '@diffit/db',
    '@diffit/diff-engine',
    '@diffit/types',
    '@trpc/server',
    'ws',
  ],
});