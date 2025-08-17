"use client";

import { useMemo, useEffect, useState, useCallback } from "react";
import { 
  DiffViewer as UIDiffViewer, 
  VirtualizedDiffViewer,
  EnhancedDiffViewer,
  DiffInsightsPanel,
  DiffFilters,
  DEFAULT_OPTIONS,
  type DiffLine,
  type DiffInsights,
  type DiffOptions
} from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";
import { useDiffEngine } from "@/hooks/use-diff-engine";

export function DiffViewer() {
  const { leftContent, rightContent, diffMode } = useDiffStore();
  const { computeDiff, isReady } = useDiffEngine();
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [diffInsights, setDiffInsights] = useState<DiffInsights | null>(null);
  const [isComputing, setIsComputing] = useState(false);
  const [diffOptions, setDiffOptions] = useState<DiffOptions>(DEFAULT_OPTIONS);
  const [showFilters, setShowFilters] = useState(false);

  const handleOptionsChange = useCallback((updates: Partial<DiffOptions>) => {
    setDiffOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const handleReset = useCallback(() => {
    setDiffOptions(DEFAULT_OPTIONS);
  }, []);

  useEffect(() => {
    if (!isReady || !leftContent && !rightContent) {
      setDiffLines([]);
      setDiffInsights(null);
      return;
    }

    const runDiff = async () => {
      setIsComputing(true);
      try {
        const result = await computeDiff(
          leftContent || '',
          rightContent || '',
          {
            ignoreWhitespace: diffOptions.ignoreWhitespace,
            ignoreCase: diffOptions.ignoreCase,
            contextLines: diffOptions.contextLines,
            lineNumbers: diffOptions.showLineNumbers,
          }
        );

        // Convert our diff result to DiffLine format
        const lines: DiffLine[] = [];
        
        for (const hunk of result.hunks) {
          for (const change of hunk.changes) {
            if (change.type === 'added') {
              lines.push({
                type: 'added',
                content: change.content,
                lineNumber: { new: change.newLineNumber }
              });
            } else if (change.type === 'removed') {
              lines.push({
                type: 'removed',
                content: change.content,
                lineNumber: { old: change.oldLineNumber }
              });
            } else if (change.type === 'modified') {
              // Split modified into removed + added for display
              lines.push({
                type: 'removed',
                content: change.content.split('\n')[0]?.replace(/^-/, '') || '',
                lineNumber: { old: change.oldLineNumber }
              });
              lines.push({
                type: 'added',
                content: change.content.split('\n')[1]?.replace(/^\+/, '') || '',
                lineNumber: { new: change.newLineNumber }
              });
            } else {
              lines.push({
                type: 'unchanged',
                content: change.content,
                lineNumber: { 
                  old: change.oldLineNumber, 
                  new: change.newLineNumber 
                }
              });
            }
          }
        }

        setDiffLines(lines);
        
        // Set insights if available
        if (result.insights) {
          setDiffInsights(result.insights);
        }
      } catch (error) {
        console.error('Diff computation failed:', error);
        // Fallback to empty diff
        setDiffLines([]);
        setDiffInsights(null);
      } finally {
        setIsComputing(false);
      }
    };

    runDiff();
  }, [leftContent, rightContent, isReady, computeDiff, diffOptions]);

  // Show loading state
  if (isComputing && diffLines.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Computing diff...</div>
      </div>
    );
  }

  // Show empty state
  if (!leftContent && !rightContent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">
          Enter or paste text in the editors to see the diff
        </div>
      </div>
    );
  }

  // Use the enhanced viewer with automatic virtualization and minimap
  return (
    <div className="space-y-4">
      {/* Insights Panel */}
      {diffInsights && (
        <DiffInsightsPanel
          insights={diffInsights}
          className="mb-4"
        />
      )}
      
      {/* Filters Bar */}
      <DiffFilters
        options={diffOptions}
        onOptionsChange={handleOptionsChange}
        onReset={handleReset}
        compact={true}
        className="mb-4"
      />
      
      {/* Diff Viewer */}
      <EnhancedDiffViewer
        lines={diffLines}
        mode={diffMode}
        showLineNumbers={diffOptions.showLineNumbers}
        showMinimap={diffOptions.showMinimap}
        virtualizeThreshold={diffOptions.virtualizeThreshold}
        height={600}
        onModeChange={(newMode) => {
          // Update the store if mode change handler is available
          // You may need to add this to your diff store
          console.log('Mode changed to:', newMode);
        }}
        onNavigateToLine={(lineNumber) => {
          console.log('Navigated to line:', lineNumber);
        }}
      />
    </div>
  );
}