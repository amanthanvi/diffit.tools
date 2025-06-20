import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

const production = process.env.NODE_ENV === 'production';

export default [
  // ES Module build
  {
    input: 'ts/index.ts',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: !production,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
        rootDir: 'ts',
      }),
      production && terser({
        mangle: {
          module: true,
        },
        compress: {
          module: true,
          drop_console: true,
          drop_debugger: true,
        },
      }),
    ].filter(Boolean),
    external: ['../pkg'],
  },
  
  // CommonJS build
  {
    input: 'ts/index.ts',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: !production,
      exports: 'named',
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false, // Already generated in ES build
        rootDir: 'ts',
      }),
      production && terser({
        mangle: {
          module: false,
        },
        compress: {
          module: false,
          drop_console: true,
          drop_debugger: true,
        },
      }),
    ].filter(Boolean),
    external: ['../pkg'],
  },
  
  // Worker build
  {
    input: 'ts/worker.ts',
    output: {
      file: 'dist/worker.js',
      format: 'iife',
      sourcemap: !production,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        rootDir: 'ts',
      }),
      production && terser({
        mangle: {
          module: false,
        },
        compress: {
          module: false,
          drop_console: false, // Keep console for worker debugging
          drop_debugger: true,
        },
      }),
    ].filter(Boolean),
    external: ['../pkg'],
  },
];