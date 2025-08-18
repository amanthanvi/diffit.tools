/**
 * Stub implementation for diff-engine until WebAssembly build is ready
 */

// Export FolderComparator
export { FolderComparator } from './folder-compare';
export type { FolderCompareOptions, FileComparisonResult } from './folder-compare';

// Export stub diff functions
export function calculateDiff(oldText: string, newText: string, options: any = {}) {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const changes = [];
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = oldLines[i] || '';
    const newLine = newLines[i] || '';
    
    if (oldLine !== newLine) {
      if (i < oldLines.length && i >= newLines.length) {
        // Line was removed
        changes.push({
          type: 'remove',
          lineNumber: { left: i + 1, right: null },
          content: { left: oldLine, right: '' }
        });
      } else if (i >= oldLines.length && i < newLines.length) {
        // Line was added
        changes.push({
          type: 'add',
          lineNumber: { left: null, right: i + 1 },
          content: { left: '', right: newLine }
        });
      } else {
        // Line was modified
        changes.push({
          type: 'modify',
          lineNumber: { left: i + 1, right: i + 1 },
          content: { left: oldLine, right: newLine }
        });
      }
    } else {
      // Line is the same
      changes.push({
        type: 'equal',
        lineNumber: { left: i + 1, right: i + 1 },
        content: { left: oldLine, right: newLine }
      });
    }
  }
  
  return Promise.resolve({
    changes,
    stats: {
      additions: newLines.length - oldLines.length,
      deletions: oldLines.length - newLines.length,
      modifications: changes.filter(c => c.type === 'modify').length
    }
  });
}

// Stub DiffEngine class
export class DiffEngine {
  async init() {
    // No-op for stub
  }
  
  async diff(oldText: string, newText: string, options?: any) {
    return calculateDiff(oldText, newText, options);
  }
}

// Stub types
export interface DiffOptions {
  algorithm?: 'myers' | 'patience' | 'histogram';
  ignoreWhitespace?: boolean;
  contextLines?: number;
}

export interface DiffResult {
  changes: any[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export interface DiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: any[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'modify' | 'equal';
  lineNumber: { left: number | null; right: number | null };
  content: { left: string; right: string };
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

export interface SyntaxToken {
  type: string;
  value: string;
  start: number;
  end: number;
}

export interface SemanticInfo {
  type: string;
  data: any;
}

export interface VisibleRange {
  start: number;
  end: number;
}

// Export default init function
export default async function init() {
  // No-op for stub
  console.log('Diff engine stub initialized');
}