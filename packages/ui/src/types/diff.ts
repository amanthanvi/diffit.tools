export type FileStatus = 'added' | 'removed' | 'modified' | 'unchanged' | 'moved';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header' | 'modified';
  content: string;
  lineNumber?: {
    old?: number;
    new?: number;
  };
}

export interface DiffHunk {
  startLine: number;
  endLine: number;
  header: string;
  changeIntensity: number; // 0-1 for heatmap
}

export interface DiffInsights {
  totalChanges: number;
  additions: number;
  deletions: number;
  modifications: number;
  similarity: number;
  hunks: number;
  changeIntensity?: number[];
  semantic?: {
    functionsAdded: string[];
    functionsRemoved: string[];
    importsChanged: number;
  };
}