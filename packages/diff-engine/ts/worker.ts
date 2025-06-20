/**
 * Web Worker implementation for diff computation
 * Handles heavy diff operations in a separate thread
 */

import init, { DiffEngine, DiffOptions, DiffResult } from '../pkg';

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'init' | 'computeDiff' | 'getSupportedLanguages' | 'cleanup';
  data?: any;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

// Global state
let diffEngine: DiffEngine | null = null;
let wasmInitialized = false;

// Initialize WASM module
async function initWasm(): Promise<void> {
  if (!wasmInitialized) {
    await init();
    diffEngine = new DiffEngine();
    wasmInitialized = true;
  }
}

// Message handler
self.onmessage = async function(e: MessageEvent<WorkerMessage>) {
  const { id, type, data } = e.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'init':
        await initWasm();
        result = { initialized: true };
        break;
        
      case 'computeDiff':
        if (!diffEngine) {
          throw new Error('WASM not initialized');
        }
        
        const { oldText, newText, options } = data;
        diffEngine.setOptions(options || {});
        result = await diffEngine.computeDiff(oldText, newText);
        break;
        
      case 'getSupportedLanguages':
        if (!diffEngine) {
          throw new Error('WASM not initialized');
        }
        
        result = diffEngine.getSupportedLanguages();
        break;
        
      case 'cleanup':
        if (diffEngine) {
          diffEngine.free();
          diffEngine = null;
        }
        wasmInitialized = false;
        result = { cleaned: true };
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const response: WorkerResponse = {
      id,
      success: true,
      result,
    };
    
    self.postMessage(response);
    
  } catch (error) {
    const response: WorkerResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
    
    self.postMessage(response);
  }
};

// Handle worker errors
self.onerror = function(error) {
  console.error('Diff worker error:', error);
};

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', function(event) {
  console.error('Diff worker unhandled rejection:', event.reason);
});

// Initialize on startup
initWasm().catch(error => {
  console.error('Failed to initialize WASM in worker:', error);
});