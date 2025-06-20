module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/ts/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/ts/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/ts/tests/setup.ts'],
  collectCoverageFrom: [
    'ts/**/*.ts',
    '!ts/**/*.test.ts',
    '!ts/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'WebWorker'],
        module: 'ESNext',
        moduleResolution: 'node',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
      },
    },
  },
};