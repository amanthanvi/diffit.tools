/**
 * Web Worker implementation for diff computation
 * Handles heavy diff operations in a separate thread
 */

// Worker message types
interface WorkerMessage {
  id: string;
  type: 'init' | 'compute' | 'simple' | 'cleanup';
  data?: any;
}

interface WorkerResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
}

interface ComputeDiffRequest {
  left: string;
  right: string;
  options?: {
    algorithm?: 'myers' | 'patience' | 'histogram';
    contextLines?: number;
    ignoreWhitespace?: boolean;
    ignoreCase?: boolean;
    semanticDiff?: boolean;
    syntaxHighlight?: boolean;
    language?: string;
    wordDiff?: boolean;
    lineNumbers?: boolean;
    maxFileSize?: number;
  };
}

// Global state
let wasmModule: any = null;
let wasmInitialized = false;

// Initialize WASM module
async function initWasm(): Promise<void> {
  if (!wasmInitialized) {
    try {
      // Dynamic import for better code splitting
      const wasm = await import('../pkg/diffit_diff_engine');
      await wasm.default();
      wasmModule = wasm;
      wasmModule.init();
      wasmInitialized = true;
      console.log('WASM Diff Engine initialized in worker');
    } catch (error) {
      console.error('Failed to initialize WASM:', error);
      throw error;
    }
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
        result = { initialized: true, version: '2.0.0' };
        break;
        
      case 'compute':
        if (!wasmModule) {
          await initWasm();
        }
        
        const { left, right, options } = data as ComputeDiffRequest;
        
        // Prepare request JSON
        const request = JSON.stringify({
          left: left || '',
          right: right || '',
          options: options || {}
        });
        
        // Call WASM compute_diff
        const responseJson = wasmModule.compute_diff(request);
        result = JSON.parse(responseJson);
        
        if (result.error) {
          throw new Error(result.error);
        }
        break;
        
      case 'simple':
        if (!wasmModule) {
          await initWasm();
        }
        
        const { left: simpleLeft, right: simpleRight } = data;
        const simpleResult = wasmModule.simple_diff(simpleLeft || '', simpleRight || '');
        result = JSON.parse(simpleResult);
        break;
        
      case 'cleanup':
        wasmModule = null;
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