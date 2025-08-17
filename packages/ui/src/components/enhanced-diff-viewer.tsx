"use client";

import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Card } from './card';
import { ScrollArea } from './scroll-area';
import { 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Minimize2,
  FileText,
  GitBranch,
  Layers
} from 'lucide-react';

// Import react-window for virtualization
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import type { DiffLine, DiffHunk } from '../types/diff';

export { type DiffLine, type DiffHunk } from '../types/diff';

export interface EnhancedDiffViewerProps {
  lines: DiffLine[];
  mode?: 'split' | 'unified' | 'inline';
  showLineNumbers?: boolean;
  showMinimap?: boolean;
  virtualizeThreshold?: number;
  height?: number;
  className?: string;
  onModeChange?: (mode: 'split' | 'unified' | 'inline') => void;
  onNavigateToLine?: (lineNumber: number) => void;
}

interface RowData {
  lines: DiffLine[];
  showLineNumbers: boolean;
  mode: 'split' | 'unified' | 'inline';
}

// Row component for virtualized list
const Row = React.memo<ListChildComponentProps<RowData>>(({ index, style, data }) => {
  const line = data.lines[index];
  
  const renderLineNumber = (lineNum?: number) => {
    if (!data.showLineNumbers || !lineNum) return null;
    return (
      <span className="inline-block w-12 text-right pr-2 text-muted-foreground select-none text-xs font-mono">
        {lineNum}
      </span>
    );
  };

  if (data.mode === 'split') {
    return (
      <div style={style} className="flex font-mono text-sm">
        <div className="flex-1 flex">
          {renderLineNumber(line.lineNumber?.old)}
          <div className={cn(
            'flex-1 px-2',
            line.type === 'removed' && 'bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400',
            line.type === 'unchanged' && 'hover:bg-muted/30'
          )}>
            {line.type === 'removed' ? line.content : line.type === 'unchanged' ? line.content : ''}
          </div>
        </div>
        <div className="w-px bg-border" />
        <div className="flex-1 flex">
          {renderLineNumber(line.lineNumber?.new)}
          <div className={cn(
            'flex-1 px-2',
            line.type === 'added' && 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400',
            line.type === 'unchanged' && 'hover:bg-muted/30'
          )}>
            {line.type === 'added' ? line.content : line.type === 'unchanged' ? line.content : ''}
          </div>
        </div>
      </div>
    );
  }

  // Unified and inline modes
  return (
    <div
      style={style}
      className={cn(
        'px-4 py-0.5 font-mono text-sm flex items-center',
        {
          'bg-green-50 dark:bg-green-950/20 border-l-4 border-green-500': line.type === 'added',
          'bg-red-50 dark:bg-red-950/20 border-l-4 border-red-500': line.type === 'removed',
          'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-yellow-500': line.type === 'modified',
          'bg-muted/50 font-semibold': line.type === 'header',
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
        className={cn('pr-2 select-none', {
          'text-green-700 dark:text-green-400': line.type === 'added',
          'text-red-700 dark:text-red-400': line.type === 'removed',
          'text-yellow-700 dark:text-yellow-400': line.type === 'modified',
        })}
      >
        {line.type === 'added' && '+'}
        {line.type === 'removed' && '-'}
        {line.type === 'modified' && '±'}
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

// Minimap component
const Minimap: React.FC<{
  lines: DiffLine[];
  hunks: DiffHunk[];
  currentLine: number;
  totalHeight: number;
  visibleStart: number;
  visibleEnd: number;
  onNavigate: (line: number) => void;
}> = ({ lines, hunks, currentLine, totalHeight, visibleStart, visibleEnd, onNavigate }) => {
  const minimapHeight = 400;
  const scale = minimapHeight / Math.max(lines.length, 1);
  
  return (
    <Card className="w-20 h-[400px] p-2 relative overflow-hidden">
      <div className="absolute inset-0 p-2">
        {/* Render change intensity heatmap */}
        {lines.map((line, index) => {
          const y = index * scale;
          const height = Math.max(scale, 1);
          
          let color = 'transparent';
          let opacity = 0;
          
          if (line.type === 'added') {
            color = 'rgb(34, 197, 94)'; // green-500
            opacity = 0.6;
          } else if (line.type === 'removed') {
            color = 'rgb(239, 68, 68)'; // red-500
            opacity = 0.6;
          } else if (line.type === 'modified') {
            color = 'rgb(250, 204, 21)'; // yellow-400
            opacity = 0.6;
          }
          
          if (color !== 'transparent') {
            return (
              <div
                key={index}
                className="absolute left-2 right-2 cursor-pointer hover:opacity-100 transition-opacity"
                style={{
                  top: `${y}px`,
                  height: `${height}px`,
                  backgroundColor: color,
                  opacity,
                }}
                onClick={() => onNavigate(index)}
              />
            );
          }
          return null;
        })}
        
        {/* Visible area indicator */}
        <div
          className="absolute left-0 right-0 border-2 border-primary/50 bg-primary/10 pointer-events-none"
          style={{
            top: `${visibleStart * scale}px`,
            height: `${(visibleEnd - visibleStart) * scale}px`,
          }}
        />
        
        {/* Current line indicator */}
        <div
          className="absolute left-0 right-0 h-0.5 bg-primary pointer-events-none"
          style={{
            top: `${currentLine * scale}px`,
          }}
        />
      </div>
    </Card>
  );
};

// Main component
const EnhancedDiffViewer = React.forwardRef<HTMLDivElement, EnhancedDiffViewerProps>(
  (
    {
      lines,
      mode = 'unified',
      showLineNumbers = true,
      showMinimap = true,
      virtualizeThreshold = 500,
      height = 600,
      className,
      onModeChange,
      onNavigateToLine,
    },
    ref
  ) => {
    const [currentLine, setCurrentLine] = React.useState(0);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const listRef = React.useRef<List>(null);
    
    // Calculate hunks for minimap
    const hunks = React.useMemo(() => {
      const result: DiffHunk[] = [];
      let currentHunk: DiffHunk | null = null;
      let changeCount = 0;
      let totalCount = 0;
      
      lines.forEach((line, index) => {
        if (line.type !== 'unchanged') {
          if (!currentHunk) {
            currentHunk = {
              startLine: index,
              endLine: index,
              header: '',
              changeIntensity: 0,
            };
          }
          currentHunk.endLine = index;
          changeCount++;
        } else if (currentHunk) {
          const intensity = changeCount / (totalCount || 1);
          result.push({
            startLine: currentHunk.startLine,
            endLine: currentHunk.endLine,
            header: currentHunk.header,
            changeIntensity: intensity,
          });
          currentHunk = null;
          changeCount = 0;
          totalCount = 0;
        }
        totalCount++;
      });
      
      if (currentHunk) {
        const intensity = changeCount / (totalCount || 1);
        const finalHunk: DiffHunk = {
          startLine: (currentHunk as DiffHunk).startLine,
          endLine: (currentHunk as DiffHunk).endLine,
          header: (currentHunk as DiffHunk).header,
          changeIntensity: intensity,
        };
        result.push(finalHunk);
      }
      
      return result;
    }, [lines]);
    
    // Navigate to line
    const navigateToLine = React.useCallback((lineNumber: number) => {
      if (listRef.current) {
        listRef.current.scrollToItem(lineNumber, 'center');
        setCurrentLine(lineNumber);
        onNavigateToLine?.(lineNumber);
      }
    }, [onNavigateToLine]);
    
    // Navigate to next/previous change
    const navigateToNextChange = React.useCallback(() => {
      const nextIndex = lines.findIndex((line, idx) => 
        idx > currentLine && line.type !== 'unchanged'
      );
      if (nextIndex !== -1) {
        navigateToLine(nextIndex);
      }
    }, [currentLine, lines, navigateToLine]);
    
    const navigateToPrevChange = React.useCallback(() => {
      const prevIndex = lines.slice(0, currentLine).reverse().findIndex(
        line => line.type !== 'unchanged'
      );
      if (prevIndex !== -1) {
        navigateToLine(currentLine - prevIndex - 1);
      }
    }, [currentLine, lines, navigateToLine]);
    
    // Handle scroll
    const handleScroll = React.useCallback((props: { scrollOffset: number }) => {
      const itemIndex = Math.floor(props.scrollOffset / 24); // Calculate from scroll offset
      setCurrentLine(itemIndex);
    }, []);
    
    // Calculate visible range
    const itemsPerPage = Math.floor(height / 24);
    const visibleStart = currentLine;
    const visibleEnd = Math.min(currentLine + itemsPerPage, lines.length);
    
    // Decide whether to use virtualization
    const useVirtualization = lines.length > virtualizeThreshold;
    
    const rowData: RowData = {
      lines,
      showLineNumbers,
      mode,
    };
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          isFullscreen && 'fixed inset-0 z-50 bg-background',
          className
        )}
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between p-2 border-b bg-muted/50">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange?.('unified')}
              className={mode === 'unified' ? 'bg-muted' : ''}
            >
              <FileText className="h-4 w-4 mr-1" />
              Unified
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange?.('split')}
              className={mode === 'split' ? 'bg-muted' : ''}
            >
              <GitBranch className="h-4 w-4 mr-1" />
              Split
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange?.('inline')}
              className={mode === 'inline' ? 'bg-muted' : ''}
            >
              <Layers className="h-4 w-4 mr-1" />
              Inline
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToPrevChange}
              disabled={currentLine === 0}
            >
              <ChevronUp className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={navigateToNextChange}
              disabled={currentLine >= lines.length - 1}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Main content area */}
        <div className="flex">
          {/* Diff viewer */}
          <div className="flex-1 overflow-hidden">
            {useVirtualization ? (
              <List
                ref={listRef}
                height={height}
                itemCount={lines.length}
                itemSize={24}
                width="100%"
                itemData={rowData}
                onScroll={handleScroll}
              >
                {Row as any}
              </List>
            ) : (
              <ScrollArea className="h-[600px]">
                <div className="font-mono text-sm">
                  {lines.map((line, index) => (
                    <Row
                      key={index}
                      index={index}
                      style={{ height: 24, width: '100%' }}
                      data={rowData}
                    />
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
          
          {/* Minimap */}
          {showMinimap && (
            <div className="ml-4">
              <Minimap
                lines={lines}
                hunks={hunks}
                currentLine={currentLine}
                totalHeight={lines.length * 24}
                visibleStart={visibleStart}
                visibleEnd={visibleEnd}
                onNavigate={navigateToLine}
              />
            </div>
          )}
        </div>
      </div>
    );
  }
);

EnhancedDiffViewer.displayName = 'EnhancedDiffViewer';

export { EnhancedDiffViewer };