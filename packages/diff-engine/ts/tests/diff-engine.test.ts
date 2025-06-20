/**
 * TypeScript tests for the diff engine
 */

import {
  DiffEngineWrapper,
  DiffWorker,
  StreamingDiffWrapper,
  VirtualScrollWrapper,
  ProgressiveDiffLoader,
  DiffFactory,
  DiffUtils,
} from '../index';

// Mock WASM module for testing
jest.mock('../../pkg', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(undefined),
  DiffEngine: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    computeDiff: jest.fn().mockResolvedValue({
      hunks: [],
      stats: {
        totalLines: 2,
        addedLines: 1,
        removedLines: 1,
        modifiedLines: 0,
        unchangedLines: 0,
        similarity: 0.5,
      },
      fileLanguage: 'javascript',
      isBinary: false,
      isLargeFile: false,
    }),
    getSupportedLanguages: jest.fn().mockReturnValue(['javascript', 'python', 'rust']),
    createStreamingDiff: jest.fn().mockReturnValue({
      addOldChunk: jest.fn(),
      addNewChunk: jest.fn(),
      finalize: jest.fn().mockResolvedValue({
        hunks: [],
        stats: { totalLines: 0, addedLines: 0, removedLines: 0, modifiedLines: 0, unchangedLines: 0, similarity: 1.0 },
        fileLanguage: null,
        isBinary: false,
        isLargeFile: true,
      }),
      getIntermediateResult: jest.fn().mockReturnValue({
        hunks: [],
        stats: { totalLines: 0, addedLines: 0, removedLines: 0, modifiedLines: 0, unchangedLines: 0, similarity: 1.0 },
        fileLanguage: null,
        isBinary: false,
        isLargeFile: true,
      }),
      free: jest.fn(),
    }),
    free: jest.fn(),
  })),
  VirtualScrollManager: jest.fn().mockImplementation(() => ({
    updateViewport: jest.fn().mockReturnValue({
      startIndex: 0,
      endIndex: 20,
      offsetY: 0,
      totalHeight: 20000,
    }),
    getVisibleRange: jest.fn().mockReturnValue({
      startIndex: 0,
      endIndex: 20,
      offsetY: 0,
      totalHeight: 20000,
    }),
    free: jest.fn(),
  })),
  WasmUtils: {
    formatBytes: jest.fn((bytes: number) => `${bytes} B`),
    hash: jest.fn((text: string) => text.length),
    now: jest.fn(() => Date.now()),
    log: jest.fn(),
    logError: jest.fn(),
  },
}));

describe('DiffEngineWrapper', () => {
  let engine: DiffEngineWrapper;

  beforeEach(() => {
    engine = new DiffEngineWrapper();
  });

  afterEach(() => {
    engine.destroy();
  });

  test('should compute basic diff', async () => {
    const oldText = 'line1\nline2\nline3';
    const newText = 'line1\nmodified\nline3';

    const result = await engine.computeDiff(oldText, newText);

    expect(result).toBeDefined();
    expect(result.stats).toBeDefined();
    expect(result.stats.totalLines).toBe(2);
  });

  test('should get supported languages', async () => {
    const languages = await engine.getSupportedLanguages();

    expect(languages).toContain('javascript');
    expect(languages).toContain('python');
    expect(languages).toContain('rust');
  });

  test('should handle diff options', async () => {
    const options = {
      algorithm: 'myers' as const,
      contextLines: 5,
      ignoreWhitespace: true,
      syntaxHighlight: true,
      language: 'javascript',
    };

    const result = await engine.computeDiff('old', 'new', options);
    expect(result).toBeDefined();
  });
});

describe('DiffWorker', () => {
  let worker: DiffWorker;

  beforeEach(() => {
    worker = new DiffWorker();
  });

  afterEach(() => {
    worker.destroy();
  });

  test('should compute diff in worker', async () => {
    // Mock worker for testing
    const mockWorker = {
      postMessage: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      terminate: jest.fn(),
    };

    (worker as any).worker = mockWorker;

    // Simulate successful response
    setTimeout(() => {
      const handler = mockWorker.addEventListener.mock.calls.find(
        call => call[0] === 'message'
      )?.[1];
      
      if (handler) {
        handler({
          data: {
            id: expect.any(String),
            success: true,
            result: {
              hunks: [],
              stats: { totalLines: 2, addedLines: 1, removedLines: 1, modifiedLines: 0, unchangedLines: 0, similarity: 0.5 },
              fileLanguage: 'javascript',
              isBinary: false,
              isLargeFile: false,
            },
          },
        });
      }
    }, 0);

    const result = await worker.computeDiff('old', 'new');
    expect(mockWorker.postMessage).toHaveBeenCalled();
  });
});

describe('StreamingDiffWrapper', () => {
  let streaming: StreamingDiffWrapper;

  beforeEach(() => {
    streaming = new StreamingDiffWrapper();
  });

  afterEach(() => {
    streaming.destroy();
  });

  test('should process streaming diff', async () => {
    await streaming.init();
    
    await streaming.addOldChunk('chunk1\n');
    await streaming.addOldChunk('chunk2\n');
    await streaming.addNewChunk('chunk1\n');
    await streaming.addNewChunk('modified\n');
    
    const result = await streaming.finalize();
    
    expect(result).toBeDefined();
    expect(result.isLargeFile).toBe(true);
  });

  test('should get intermediate results', async () => {
    await streaming.init();
    
    await streaming.addOldChunk('test\n');
    
    const intermediate = streaming.getIntermediateResult();
    expect(intermediate).toBeDefined();
    expect(intermediate.hunks).toEqual([]);
  });
});

describe('VirtualScrollWrapper', () => {
  let virtualScroll: VirtualScrollWrapper;

  beforeEach(() => {
    virtualScroll = new VirtualScrollWrapper();
  });

  afterEach(() => {
    virtualScroll.destroy();
  });

  test('should manage virtual scrolling', async () => {
    await virtualScroll.init(1000, 20);
    
    const range = virtualScroll.updateViewport(100, 25);
    
    expect(range).toBeDefined();
    expect(range.startIndex).toBe(0);
    expect(range.endIndex).toBe(20);
    expect(range.totalHeight).toBe(20000);
  });

  test('should get visible range', async () => {
    await virtualScroll.init(500, 15);
    
    const range = virtualScroll.getVisibleRange();
    
    expect(range).toBeDefined();
    expect(typeof range.startIndex).toBe('number');
    expect(typeof range.endIndex).toBe('number');
  });
});

describe('ProgressiveDiffLoader', () => {
  test('should load small files normally', async () => {
    const loader = new ProgressiveDiffLoader({
      chunkSize: 100,
      onProgress: jest.fn(),
      onChunk: jest.fn(),
    });

    const oldText = 'small\nfile\ncontent';
    const newText = 'small\nmodified\ncontent';

    const result = await loader.loadDiff(oldText, newText);
    
    expect(result).toBeDefined();
    expect(result.stats.totalLines).toBe(2);
  });

  test('should report progress for large files', async () => {
    const onProgress = jest.fn();
    const onChunk = jest.fn();
    
    const loader = new ProgressiveDiffLoader({
      chunkSize: 2,
      onProgress,
      onChunk,
    });

    const oldText = Array.from({ length: 10 }, (_, i) => `line${i}`).join('\n');
    const newText = Array.from({ length: 10 }, (_, i) => `modified${i}`).join('\n');

    await loader.loadDiff(oldText, newText);
    
    expect(onProgress).toHaveBeenCalled();
    // Should be called with values between 0 and 1
    const progressValues = onProgress.mock.calls.map(call => call[0]);
    expect(progressValues.some(p => p > 0 && p <= 1)).toBe(true);
  });
});

describe('DiffFactory', () => {
  afterEach(() => {
    DiffFactory.destroyAllWorkers();
  });

  test('should create engine instances', async () => {
    const engine = await DiffFactory.createEngine(false);
    expect(engine).toBeInstanceOf(DiffEngineWrapper);
    
    DiffFactory.releaseEngine(engine);
  });

  test('should manage worker pool', async () => {
    const worker1 = await DiffFactory.createEngine(true);
    const worker2 = await DiffFactory.createEngine(true);
    
    expect(worker1).toBeDefined();
    expect(worker2).toBeDefined();
    
    DiffFactory.releaseEngine(worker1);
    DiffFactory.releaseEngine(worker2);
  });
});

describe('DiffUtils', () => {
  test('should format bytes', () => {
    expect(DiffUtils.formatBytes(1024)).toBe('1024 B');
    expect(DiffUtils.formatBytes(0)).toBe('0 B');
  });

  test('should hash text', () => {
    const hash1 = DiffUtils.hash('test');
    const hash2 = DiffUtils.hash('test');
    const hash3 = DiffUtils.hash('different');
    
    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  test('should get current time', () => {
    const now = DiffUtils.now();
    expect(typeof now).toBe('number');
    expect(now).toBeGreaterThan(0);
  });

  test('should handle logging', () => {
    expect(() => DiffUtils.log('test message')).not.toThrow();
    expect(() => DiffUtils.logError('test error')).not.toThrow();
  });
});

describe('Error handling', () => {
  test('should handle WASM initialization errors', async () => {
    const engine = new DiffEngineWrapper();
    
    // Mock initialization failure
    const originalInit = engine.init;
    engine.init = jest.fn().mockRejectedValue(new Error('WASM failed to load'));
    
    await expect(engine.computeDiff('old', 'new')).rejects.toThrow('WASM failed to load');
    
    engine.destroy();
  });

  test('should handle diff computation errors', async () => {
    const engine = new DiffEngineWrapper();
    
    // Mock the engine to throw during diff computation
    await engine.init();
    if (engine['engine']) {
      engine['engine'].computeDiff = jest.fn().mockRejectedValue(new Error('Diff failed'));
    }
    
    await expect(engine.computeDiff('old', 'new')).rejects.toThrow('Diff computation failed');
    
    engine.destroy();
  });
});

describe('Memory management', () => {
  test('should properly cleanup resources', () => {
    const engine = new DiffEngineWrapper();
    const streaming = new StreamingDiffWrapper();
    const virtualScroll = new VirtualScrollWrapper();
    
    // These should not throw
    expect(() => engine.destroy()).not.toThrow();
    expect(() => streaming.destroy()).not.toThrow();
    expect(() => virtualScroll.destroy()).not.toThrow();
  });

  test('should handle multiple destroy calls', () => {
    const engine = new DiffEngineWrapper();
    
    engine.destroy();
    expect(() => engine.destroy()).not.toThrow();
  });
});