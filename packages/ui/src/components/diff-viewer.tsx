"use client";

import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';
import { Card } from './card';

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged' | 'header';
  content: string;
  lineNumber?: {
    old?: number;
    new?: number;
  };
}

export interface DiffViewerProps {
  lines: DiffLine[];
  mode?: 'split' | 'unified' | 'inline';
  showLineNumbers?: boolean;
  highlightSyntax?: boolean;
  language?: string;
  className?: string;
  onModeChange?: (mode: 'split' | 'unified' | 'inline') => void;
}

const DiffViewer = React.forwardRef<HTMLDivElement, DiffViewerProps>(
  (
    {
      lines,
      mode = 'unified',
      showLineNumbers = true,
      highlightSyntax = false,
      language = 'text',
      className,
      onModeChange,
    },
    ref
  ) => {
    const [selectedMode, setSelectedMode] = React.useState(mode);

    const handleModeChange = (newMode: string) => {
      const validMode = newMode as 'split' | 'unified' | 'inline';
      setSelectedMode(validMode);
      onModeChange?.(validMode);
    };

    const renderLineNumber = (lineNum?: number) => {
      if (!showLineNumbers || !lineNum) return null;
      return (
        <span className="inline-block w-10 text-right pr-2 text-muted-foreground select-none">
          {lineNum}
        </span>
      );
    };

    const renderUnifiedView = () => (
      <div className="font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              'px-4 py-0.5',
              {
                'diff-added': line.type === 'added',
                'diff-removed': line.type === 'removed',
                'bg-muted/50': line.type === 'header',
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
              className={cn('pr-2', {
                'text-[hsl(var(--diff-added))]': line.type === 'added',
                'text-[hsl(var(--diff-removed))]': line.type === 'removed',
              })}
            >
              {line.type === 'added' && '+'}
              {line.type === 'removed' && '-'}
              {line.type === 'unchanged' && ' '}
              {line.type === 'header' && ' '}
            </span>
            <span>{line.content}</span>
          </div>
        ))}
      </div>
    );

    const renderSplitView = () => {
      const leftLines: DiffLine[] = [];
      const rightLines: DiffLine[] = [];

      lines.forEach((line) => {
        if (line.type === 'removed') {
          leftLines.push(line);
          rightLines.push({ type: 'unchanged', content: '' });
        } else if (line.type === 'added') {
          leftLines.push({ type: 'unchanged', content: '' });
          rightLines.push(line);
        } else {
          leftLines.push(line);
          rightLines.push(line);
        }
      });

      return (
        <div className="flex font-mono text-sm">
          <div className="flex-1 border-r">
            {leftLines.map((line, index) => (
              <div
                key={index}
                className={cn(
                  'px-4 py-0.5',
                  {
                    'diff-removed': line.type === 'removed',
                    'bg-muted/50': line.type === 'header',
                    'hover:bg-muted/30': line.type === 'unchanged' && line.content,
                  }
                )}
              >
                {renderLineNumber(line.lineNumber?.old)}
                <span>{line.content}</span>
              </div>
            ))}
          </div>
          <div className="flex-1">
            {rightLines.map((line, index) => (
              <div
                key={index}
                className={cn(
                  'px-4 py-0.5',
                  {
                    'diff-added': line.type === 'added',
                    'bg-muted/50': line.type === 'header',
                    'hover:bg-muted/30': line.type === 'unchanged' && line.content,
                  }
                )}
              >
                {renderLineNumber(line.lineNumber?.new)}
                <span>{line.content}</span>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderInlineView = () => (
      <div className="font-mono text-sm">
        {lines.map((line, index) => {
          if (line.type === 'header') {
            return (
              <div key={index} className="px-4 py-0.5 bg-muted/50">
                {line.content}
              </div>
            );
          }

          const words = String(line.content || '').split(/(\s+)/);
          return (
            <div
              key={index}
              className={cn('px-4 py-0.5', {
                'hover:bg-muted/30': line.type === 'unchanged',
              })}
            >
              {showLineNumbers && (
                <>
                  {renderLineNumber(line.lineNumber?.old)}
                  {renderLineNumber(line.lineNumber?.new)}
                </>
              )}
              {words.map((word, wordIndex) => (
                <span
                  key={wordIndex}
                  className={cn({
                    'bg-[hsl(var(--diff-added-bg))] text-[hsl(var(--diff-added))]':
                      line.type === 'added',
                    'bg-[hsl(var(--diff-removed-bg))] text-[hsl(var(--diff-removed))]':
                      line.type === 'removed',
                  })}
                >
                  {word}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    );

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)}>
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium">Diff View</h3>
            <Select value={selectedMode} onValueChange={handleModeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="View mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unified">Unified</SelectItem>
                <SelectItem value="split">Split</SelectItem>
                <SelectItem value="inline">Inline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="diff-added px-2 py-0.5 rounded">Added</span>
            <span className="diff-removed px-2 py-0.5 rounded">Removed</span>
          </div>
        </div>
        <div className="overflow-auto max-h-[600px]">
          {selectedMode === 'unified' && renderUnifiedView()}
          {selectedMode === 'split' && renderSplitView()}
          {selectedMode === 'inline' && renderInlineView()}
        </div>
      </Card>
    );
  }
);

DiffViewer.displayName = 'DiffViewer';

export { DiffViewer };