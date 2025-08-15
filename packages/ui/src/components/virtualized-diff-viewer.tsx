"use client";

import * as React from 'react';
import { cn } from '../lib/utils';
import { DiffLine } from './diff-viewer';

// Lazy load react-window to avoid SSR issues
const List = React.lazy(() => 
  import('react-window').then(module => ({ default: module.FixedSizeList }))
);

export interface VirtualizedDiffViewerProps {
  lines: DiffLine[];
  mode?: 'split' | 'unified' | 'inline';
  showLineNumbers?: boolean;
  highlightSyntax?: boolean;
  language?: string;
  className?: string;
  height?: number;
  width?: number;
  itemHeight?: number;
  onModeChange?: (mode: 'split' | 'unified' | 'inline') => void;
}

interface RowData {
  lines: DiffLine[];
  showLineNumbers: boolean;
  mode: 'split' | 'unified' | 'inline';
}

const Row = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: RowData;
}>(({ index, style, data }) => {
  const line = data.lines[index];
  
  const renderLineNumber = (lineNum?: number) => {
    if (!data.showLineNumbers || !lineNum) return null;
    return (
      <span className="inline-block w-12 text-right pr-2 text-muted-foreground select-none text-xs">
        {lineNum}
      </span>
    );
  };

  return (
    <div
      style={style}
      className={cn(
        'px-4 py-0.5 font-mono text-sm flex items-center',
        {
          'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500': line.type === 'added',
          'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500': line.type === 'removed',
          'bg-muted/50': line.type === 'header',
          'hover:bg-muted/30': line.type === 'unchanged',
        }
      )}
    >
      {data.showLineNumbers && (
        <>
          {renderLineNumber(line.lineNumber?.old)}
          {renderLineNumber(line.lineNumber?.new)}
        </>
      )}
      <span
        className={cn('pr-2', {
          'text-green-700 dark:text-green-400': line.type === 'added',
          'text-red-700 dark:text-red-400': line.type === 'removed',
        })}
      >
        {line.type === 'added' && '+'}
        {line.type === 'removed' && '-'}
        {line.type === 'unchanged' && ' '}
        {line.type === 'header' && ' '}
      </span>
      <span className="flex-1 overflow-hidden text-ellipsis whitespace-pre">
        {line.content}
      </span>
    </div>
  );
});

Row.displayName = 'DiffRow';

const VirtualizedDiffViewer = React.forwardRef<HTMLDivElement, VirtualizedDiffViewerProps>(
  (
    {
      lines,
      mode = 'unified',
      showLineNumbers = true,
      highlightSyntax = false,
      language = 'text',
      className,
      height = 600,
      width = '100%',
      itemHeight = 24,
      onModeChange,
    },
    ref
  ) => {
    const itemData: RowData = React.useMemo(
      () => ({
        lines,
        showLineNumbers,
        mode,
      }),
      [lines, showLineNumbers, mode]
    );

    // Calculate optimal item height based on content
    const calculatedItemHeight = showLineNumbers ? itemHeight + 2 : itemHeight;

    return (
      <div ref={ref} className={cn('diff-viewer', className)}>
        <div className="border rounded-lg overflow-hidden bg-background">
          <React.Suspense fallback={
            <div className="flex items-center justify-center" style={{ height }}>
              <span className="text-muted-foreground">Loading diff viewer...</span>
            </div>
          }>
            <List
              height={height}
              itemCount={lines.length}
              itemSize={calculatedItemHeight}
              width={width}
              itemData={itemData}
              overscanCount={10}
            >
              {Row}
            </List>
          </React.Suspense>
        </div>
      </div>
    );
  }
);

VirtualizedDiffViewer.displayName = 'VirtualizedDiffViewer';

export { VirtualizedDiffViewer };