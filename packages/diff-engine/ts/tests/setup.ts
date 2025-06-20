/**
 * Jest setup file for WebAssembly diff engine tests
 */

// Mock WebAssembly environment
Object.defineProperty(global, 'WebAssembly', {
  value: {
    Module: class MockModule {},
    Memory: class MockMemory {
      constructor() {
        this.buffer = new ArrayBuffer(1024 * 1024); // 1MB
      }
    },
    compile: jest.fn().mockResolvedValue({}),
    instantiate: jest.fn().mockResolvedValue({
      instance: {},
      module: {},
    }),
  },
  writable: true,
});

// Mock Worker for testing
Object.defineProperty(global, 'Worker', {
  value: class MockWorker {
    constructor(url: string) {
      this.url = url;
      this.onmessage = null;
      this.onerror = null;
    }
    
    postMessage = jest.fn();
    addEventListener = jest.fn();
    removeEventListener = jest.fn();
    terminate = jest.fn();
    
    private url: string;
    public onmessage: ((event: MessageEvent) => void) | null;
    public onerror: ((error: ErrorEvent) => void) | null;
  },
  writable: true,
});

// Mock URL.createObjectURL
Object.defineProperty(global.URL, 'createObjectURL', {
  value: jest.fn(() => 'mock-blob-url'),
  writable: true,
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
  writable: true,
});

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Setup cleanup for each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(min: number, max: number): R;
    }
  }
}

// Custom matchers
expect.extend({
  toBeWithinRange(received: number, min: number, max: number) {
    const pass = received >= min && received <= max;
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${min} - ${max}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${min} - ${max}`,
        pass: false,
      };
    }
  },
});

// Error handler for unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};