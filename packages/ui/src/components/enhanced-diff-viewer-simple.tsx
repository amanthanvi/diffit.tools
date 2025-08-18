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

// Main component - simplified version without virtualization for now
const EnhancedDiffViewer = React.forwardRef<HTMLDivElement, EnhancedDiffViewerProps>(
  (
    {
      lines,
      mode = 'unified',
      showLineNumbers = true,
      showMinimap = false,
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
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    
    // Navigate to line
    const navigateToLine = React.useCallback((lineNumber: number) => {
      setCurrentLine(lineNumber);
      onNavigateToLine?.(lineNumber);
      // Scroll to the element
      if (scrollAreaRef.current) {
        const element = scrollAreaRef.current.querySelector(`[data-line-index="${lineNumber}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
    
    const renderLineNumber = (lineNum?: number) => {
      if (!showLineNumbers || !lineNum) return null;
      return (
        <span className="inline-block w-12 text-right pr-2 text-muted-foreground select-none text-xs font-mono">
          {lineNum}
        </span>
      );
    };
    
    const renderLine = (line: DiffLine, index: number) => {
      if (mode === 'split') {
        return (
          <div key={index} data-line-index={index} className="flex font-mono text-sm">
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
          key={index}
          data-line-index={index}
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
          {showLineNumbers && (
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
            <ScrollArea className={`h-[${height}px]`} ref={scrollAreaRef}>
              <div className="font-mono text-sm">
                {lines.map((line, index) => renderLine(line, index))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    );
  }
);

EnhancedDiffViewer.displayName = 'EnhancedDiffViewer';

export { EnhancedDiffViewer };