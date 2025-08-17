/**
 * TypeScript wrapper for the WebAssembly diff engine
 * Provides a clean, async API with proper error handling and memory management
 */

import init, {
  DiffEngine as WasmDiffEngine,
  StreamingDiffProcessor as WasmStreamingDiffProcessor,
  VirtualScrollManager as WasmVirtualScrollManager,
  WasmUtils,
} from '../pkg';

export * from '../pkg/index';

// Re-export types for convenience
export type {
  DiffOptions,
  DiffResult,
  DiffHunk,
  DiffChange,
  DiffStats,
  SyntaxToken,
  SemanticInfo,
  VisibleRange,
} from '../pkg/index';

// Worker thread implementation for heavy computations
export class DiffWorker {
  private worker: Worker | null = null;
  private wasmInitialized = false;

  constructor() {
    if (typeof Worker !== 'undefined') {
      this.initWorker();
    }
  }

  private async initWorker(): Promise<void> {
    try {
      // Create worker with embedded WASM module
      const workerCode = `
        importScripts('${this.getWasmUrl()}');
        
        let diffEngine = null;
        let wasmInitialized = false;
        
        async function initWasm() {
          if (!wasmInitialized) {
            await wasm_bindgen();
            diffEngine = new wasm_bindgen.DiffEngine();
            wasmInitialized = true;
          }
        }
        
        self.onmessage = async function(e) {
          const { id, type, data } = e.data;
          
          try {
            await initWasm();
            
            let result;
            switch (type) {
              case 'computeDiff':
                diffEngine.setOptions(data.options);
                result = await diffEngine.computeDiff(data.oldText, data.newText);
                break;
              case 'getSupportedLanguages':
                result = diffEngine.getSupportedLanguages();
                break;
              default:
                throw new Error('Unknown message type: ' + type);
            }
            
            self.postMessage({ id, success: true, result });
          } catch (error) {
            self.postMessage({ id, success: false, error: error.message });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      this.worker = new Worker(URL.createObjectURL(blob));
    } catch (error) {
      console.warn('Failed to create diff worker:', error);
    }
  }

  private getWasmUrl(): string {
    // In a real implementation, this would point to the actual WASM file
    return '/node_modules/@diffit/diff-engine/pkg/index.js';
  }

  async computeDiff(
    oldText: string,
    newText: string,
    options: DiffOptions = {}
  ): Promise<DiffResult> {
    if (this.worker) {
      return this.sendWorkerMessage('computeDiff', { oldText, newText, options });
    } else {
      // Fallback to main thread
      const engine = new DiffEngineWrapper();
      return engine.computeDiff(oldText, newText, options);
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    if (this.worker) {
      return this.sendWorkerMessage('getSupportedLanguages', {});
    } else {
      const engine = new DiffEngineWrapper();
      return engine.getSupportedLanguages();
    }
  }

  private sendWorkerMessage(type: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = Math.random().toString(36);
      
      const handler = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.worker!.removeEventListener('message', handler);
          if (e.data.success) {
            resolve(e.data.result);
          } else {
            reject(new Error(e.data.error));
          }
        }
      };

      this.worker.addEventListener('message', handler);
      this.worker.postMessage({ id, type, data });
    });
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

// High-level wrapper with automatic memory management
export class DiffEngineWrapper {
  private engine: WasmDiffEngine | null = null;
  private initialized = false;

  async init(): Promise<void> {
    if (!this.initialized) {
      await init();
      this.engine = new WasmDiffEngine();
      this.initialized = true;
    }
  }

  async computeDiff(
    oldText: string,
    newText: string,
    options: DiffOptions = {}
  ): Promise<DiffResult> {
    await this.init();
    
    if (!this.engine) {
      throw new Error('WASM engine not initialized');
    }

    try {
      this.engine.setOptions(options);
      return await this.engine.computeDiff(oldText, newText);
    } catch (error) {
      throw new Error(`Diff computation failed: ${error}`);
    }
  }

  async getSupportedLanguages(): Promise<string[]> {
    await this.init();
    
    if (!this.engine) {
      throw new Error('WASM engine not initialized');
    }

    return this.engine.getSupportedLanguages();
  }

  destroy(): void {
    if (this.engine) {
      this.engine.free();
      this.engine = null;
    }
    this.initialized = false;
  }
}

// Streaming diff processor wrapper
export class StreamingDiffWrapper {
  private processor: WasmStreamingDiffProcessor | null = null;
  private initialized = false;

  async init(options: DiffOptions = {}): Promise<void> {
    if (!this.initialized) {
      await init();
      const engine = new WasmDiffEngine();
      engine.setOptions(options);
      this.processor = engine.createStreamingDiff();
      engine.free(); // We only need the processor
      this.initialized = true;
    }
  }

  async addOldChunk(chunk: string): Promise<void> {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }
    this.processor.addOldChunk(chunk);
  }

  async addNewChunk(chunk: string): Promise<void> {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }
    this.processor.addNewChunk(chunk);
  }

  async finalize(): Promise<DiffResult> {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }
    return await this.processor.finalize();
  }

  getIntermediateResult(): DiffResult {
    if (!this.processor) {
      throw new Error('Processor not initialized');
    }
    return this.processor.getIntermediateResult();
  }

  destroy(): void {
    if (this.processor) {
      this.processor.free();
      this.processor = null;
    }
    this.initialized = false;
  }
}

// Virtual scroll manager wrapper
export class VirtualScrollWrapper {
  private manager: WasmVirtualScrollManager | null = null;
  private initialized = false;

  async init(totalLines: number, viewportHeight: number): Promise<void> {
    if (!this.initialized) {
      await init();
      this.manager = new WasmVirtualScrollManager(totalLines, viewportHeight);
      this.initialized = true;
    }
  }

  updateViewport(scrollTop: number, viewportHeight: number): VisibleRange {
    if (!this.manager) {
      throw new Error('Manager not initialized');
    }
    return this.manager.updateViewport(scrollTop, viewportHeight);
  }

  getVisibleRange(): VisibleRange {
    if (!this.manager) {
      throw new Error('Manager not initialized');
    }
    return this.manager.getVisibleRange();
  }

  destroy(): void {
    if (this.manager) {
      this.manager.free();
      this.manager = null;
    }
    this.initialized = false;
  }
}

// Utility functions
export class DiffUtils {
  static formatBytes(bytes: number): string {
    return WasmUtils.formatBytes(bytes);
  }

  static hash(text: string): number {
    return WasmUtils.hash(text);
  }

  static now(): number {
    return WasmUtils.now();
  }

  static log(message: string): void {
    WasmUtils.log(message);
  }

  static logError(message: string): void {
    WasmUtils.logError(message);
  }
}

// Progressive diff loader for large files
export class ProgressiveDiffLoader {
  private chunkSize: number;
  private onProgress?: (progress: number) => void;
  private onChunk?: (chunk: DiffResult) => void;

  constructor(options: {
    chunkSize?: number;
    onProgress?: (progress: number) => void;
    onChunk?: (chunk: DiffResult) => void;
  } = {}) {
    this.chunkSize = options.chunkSize || 1000; // lines per chunk
    this.onProgress = options.onProgress;
    this.onChunk = options.onChunk;
  }

  async loadDiff(
    oldText: string,
    newText: string,
    options: DiffOptions = {}
  ): Promise<DiffResult> {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    // If files are small, process normally
    if (oldLines.length <= this.chunkSize && newLines.length <= this.chunkSize) {
      const engine = new DiffEngineWrapper();
      try {
        return await engine.computeDiff(oldText, newText, options);
      } finally {
        engine.destroy();
      }
    }

    // Use streaming for large files
    const streaming = new StreamingDiffWrapper();
    try {
      await streaming.init(options);

      // Process old file in chunks
      const oldChunks = this.chunkArray(oldLines, this.chunkSize);
      for (let i = 0; i < oldChunks.length; i++) {
        await streaming.addOldChunk(oldChunks[i].join('\n'));
        this.onProgress?.(((i + 1) / oldChunks.length) * 0.5);
      }

      // Process new file in chunks
      const newChunks = this.chunkArray(newLines, this.chunkSize);
      for (let i = 0; i < newChunks.length; i++) {
        await streaming.addNewChunk(newChunks[i].join('\n'));
        
        // Emit intermediate results
        if (this.onChunk && i % 5 === 0) {
          const intermediate = streaming.getIntermediateResult();
          this.onChunk(intermediate);
        }
        
        this.onProgress?.(0.5 + ((i + 1) / newChunks.length) * 0.5);
      }

      return await streaming.finalize();
    } finally {
      streaming.destroy();
    }
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}

// Factory for creating diff instances
export class DiffFactory {
  private static workerPool: DiffWorker[] = [];
  private static maxWorkers = navigator.hardwareConcurrency || 4;

  static async createEngine(useWorker = true): Promise<DiffEngineWrapper | DiffWorker> {
    if (useWorker && typeof Worker !== 'undefined') {
      // Try to reuse existing worker
      if (this.workerPool.length > 0) {
        return this.workerPool.pop()!;
      }
      
      // Create new worker if under limit
      if (this.workerPool.length < this.maxWorkers) {
        return new DiffWorker();
      }
    }

    // Fallback to main thread
    return new DiffEngineWrapper();
  }

  static releaseEngine(engine: DiffEngineWrapper | DiffWorker): void {
    if (engine instanceof DiffWorker && this.workerPool.length < this.maxWorkers) {
      this.workerPool.push(engine);
    } else {
      engine.destroy();
    }
  }

  static destroyAllWorkers(): void {
    this.workerPool.forEach(worker => worker.destroy());
    this.workerPool = [];
  }
}

// Export folder comparison utilities
export { FolderComparator, type FolderCompareOptions, type FileComparisonResult } from './folder-compare';

// Export main instances for easy usage
export const diffEngine = new DiffEngineWrapper();
export const diffWorker = new DiffWorker();

// Cleanup on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    diffEngine.destroy();
    diffWorker.destroy();
    DiffFactory.destroyAllWorkers();
  });
}