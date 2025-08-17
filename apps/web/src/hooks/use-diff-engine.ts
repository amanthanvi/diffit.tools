import { useState, useEffect, useRef, useCallback } from 'react';

export interface DiffOptions {
  algorithm?: 'myers' | 'patience' | 'histogram';
  contextLines?: number;
  ignoreWhitespace?: boolean;
  ignoreCase?: boolean;
  wordDiff?: boolean;
  lineNumbers?: boolean;
}

export interface DiffChange {
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  changes: DiffChange[];
  header: string;
}

export interface DiffInsights {
  additions: number;
  deletions: number;
  modifications: number;
  similarity: number;
  hunks: number;
  changeIntensity: number[];
}

export interface DiffResult {
  hunks: DiffHunk[];
  insights: DiffInsights;
  error?: string;
}

/**
 * React hook for diff engine
 * Falls back to JavaScript implementation if WASM is not available
 */
export function useDiffEngine() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const messageIdRef = useRef(0);
  const pendingMessagesRef = useRef<Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
  }>>(new Map());

  // Initialize worker
  useEffect(() => {
    let mounted = true;

    const initWorker = async () => {
      try {
        // For now, skip the worker and use the fallback
        // This will be replaced with actual WASM worker once built
        console.log('Diff engine: Using JavaScript fallback');
        if (mounted) {
          setIsReady(true);
        }
      } catch (err) {
        console.error('Failed to initialize diff engine:', err);
        if (mounted) {
          setError('Failed to initialize diff engine');
          setIsReady(true); // Still mark as ready to use fallback
        }
      }
    };

    initWorker();

    return () => {
      mounted = false;
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  /**
   * JavaScript fallback diff implementation
   */
  const jsDiff = useCallback((left: string, right: string, options?: DiffOptions): DiffResult => {
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    
    // Apply options
    let processedLeft = leftLines;
    let processedRight = rightLines;
    
    if (options?.ignoreWhitespace) {
      processedLeft = leftLines.map(line => line.trim());
      processedRight = rightLines.map(line => line.trim());
    }
    
    if (options?.ignoreCase) {
      processedLeft = processedLeft.map(line => line.toLowerCase());
      processedRight = processedRight.map(line => line.toLowerCase());
    }
    
    const changes: DiffChange[] = [];
    const maxLen = Math.max(processedLeft.length, processedRight.length);
    let additions = 0;
    let deletions = 0;
    let modifications = 0;
    
    for (let i = 0; i < maxLen; i++) {
      if (i < processedLeft.length && i < processedRight.length) {
        if (processedLeft[i] === processedRight[i]) {
          changes.push({
            type: 'unchanged',
            oldLineNumber: i + 1,
            newLineNumber: i + 1,
            content: leftLines[i], // Use original content
          });
        } else {
          // Show as removed + added for clarity
          changes.push({
            type: 'removed',
            oldLineNumber: i + 1,
            content: leftLines[i],
          });
          changes.push({
            type: 'added',
            newLineNumber: i + 1,
            content: rightLines[i],
          });
          deletions++;
          additions++;
        }
      } else if (i < processedLeft.length) {
        changes.push({
          type: 'removed',
          oldLineNumber: i + 1,
          content: leftLines[i],
        });
        deletions++;
      } else {
        changes.push({
          type: 'added',
          newLineNumber: i + 1,
          content: rightLines[i],
        });
        additions++;
      }
    }
    
    // Group changes into hunks
    const hunks: DiffHunk[] = [];
    let currentHunk: DiffHunk | null = null;
    let hunkChanges: DiffChange[] = [];
    
    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      
      if (change.type !== 'unchanged') {
        if (!currentHunk) {
          const oldStart = change.oldLineNumber || 1;
          const newStart = change.newLineNumber || 1;
          currentHunk = {
            oldStart,
            oldLines: 0,
            newStart,
            newLines: 0,
            changes: [],
            header: '',
          };
        }
        hunkChanges.push(change);
      } else {
        // Add context lines
        const contextLines = options?.contextLines ?? 3;
        if (currentHunk && hunkChanges.length > 0) {
          // Add leading context
          const startContext = Math.max(0, i - contextLines);
          for (let j = startContext; j < i; j++) {
            if (changes[j].type === 'unchanged') {
              hunkChanges.unshift(changes[j]);
            }
          }
          
          // Add trailing context
          const endContext = Math.min(changes.length, i + contextLines);
          for (let j = i; j < endContext; j++) {
            if (changes[j].type === 'unchanged') {
              hunkChanges.push(changes[j]);
            }
          }
          
          // Calculate hunk dimensions
          currentHunk.oldLines = hunkChanges.filter(c => c.oldLineNumber).length;
          currentHunk.newLines = hunkChanges.filter(c => c.newLineNumber).length;
          currentHunk.changes = hunkChanges;
          currentHunk.header = `@@ -${currentHunk.oldStart},${currentHunk.oldLines} +${currentHunk.newStart},${currentHunk.newLines} @@`;
          
          hunks.push(currentHunk);
          currentHunk = null;
          hunkChanges = [];
        }
      }
    }
    
    // Add remaining hunk if any
    if (currentHunk && hunkChanges.length > 0) {
      currentHunk.oldLines = hunkChanges.filter(c => c.oldLineNumber).length;
      currentHunk.newLines = hunkChanges.filter(c => c.newLineNumber).length;
      currentHunk.changes = hunkChanges;
      currentHunk.header = `@@ -${currentHunk.oldStart},${currentHunk.oldLines} +${currentHunk.newStart},${currentHunk.newLines} @@`;
      hunks.push(currentHunk);
    }
    
    // If no hunks but there are changes, create a single hunk
    if (hunks.length === 0 && (additions > 0 || deletions > 0)) {
      hunks.push({
        oldStart: 1,
        oldLines: leftLines.length,
        newStart: 1,
        newLines: rightLines.length,
        changes,
        header: `@@ -1,${leftLines.length} +1,${rightLines.length} @@`,
      });
    }
    
    const similarity = maxLen > 0 
      ? 1 - (additions + deletions) / (maxLen * 2)
      : 1;
    
    return {
      hunks,
      insights: {
        additions,
        deletions,
        modifications,
        similarity,
        hunks: hunks.length,
        changeIntensity: hunks.map(h => {
          const changed = h.changes.filter(c => c.type !== 'unchanged').length;
          return h.changes.length > 0 ? changed / h.changes.length : 0;
        }),
      },
    };
  }, []);

  /**
   * Compute diff between two texts
   */
  const computeDiff = useCallback(async (
    left: string,
    right: string,
    options?: DiffOptions
  ): Promise<DiffResult> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For now, always use the JavaScript fallback
      // Once WASM is built, this will try WASM first
      const result = jsDiff(left, right, options);
      setIsLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Diff computation failed';
      setError(errorMessage);
      setIsLoading(false);
      return {
        hunks: [],
        insights: {
          additions: 0,
          deletions: 0,
          modifications: 0,
          similarity: 0,
          hunks: 0,
          changeIntensity: [],
        },
        error: errorMessage,
      };
    }
  }, [jsDiff]);

  return {
    isReady,
    isLoading,
    error,
    computeDiff,
  };
}