import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom'],
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
  onSuccess: 'cp src/styles/globals.css dist/styles.css',
});