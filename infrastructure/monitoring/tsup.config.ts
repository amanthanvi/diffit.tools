import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/sentry.ts', 'src/analytics.ts', 'src/performance.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: process.env.NODE_ENV === 'production',
  treeshake: true,
  external: ['react', 'next'],
});