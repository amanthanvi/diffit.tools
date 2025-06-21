"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { DiffViewer as UIDiffViewer, useToast } from "@diffit/ui";
import { motion, AnimatePresence } from "framer-motion";
import { useDiffStore } from "@/stores/diff-store";
import { cn } from "@/lib/utils";


// Simple line-by-line diff for all view modes
function simpleDiff(oldText: string, newText: string) {
  // Ensure inputs are strings
  const oldStr = String(oldText || '');
  const newStr = String(newText || '');
  
  const oldLines = oldStr.split('\n');
  const newLines = newStr.split('\n');
  
  const diff = [];
  const maxLines = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const oldLine = i < oldLines.length ? oldLines[i] : undefined;
    const newLine = i < newLines.length ? newLines[i] : undefined;
    
    if (oldLine === undefined) {
      // Line added
      diff.push({
        type: 'add',
        content: { left: '', right: newLine },
        lineNumber: { left: null, right: i + 1 }
      });
    } else if (newLine === undefined) {
      // Line removed
      diff.push({
        type: 'remove',
        content: { left: oldLine, right: '' },
        lineNumber: { left: i + 1, right: null }
      });
    } else if (oldLine !== newLine) {
      // Line modified - show as remove + add
      diff.push({
        type: 'remove',
        content: { left: oldLine, right: '' },
        lineNumber: { left: i + 1, right: null }
      });
      diff.push({
        type: 'add',
        content: { left: '', right: newLine },
        lineNumber: { left: null, right: i + 1 }
      });
    } else {
      // Line unchanged
      diff.push({
        type: 'unchanged',
        content: { left: oldLine, right: newLine },
        lineNumber: { left: i + 1, right: i + 1 }
      });
    }
  }
  
  return diff;
}

export function DiffViewer() {
  const { leftContent, rightContent, diffMode, syntax, setDiffMode } = useDiffStore();
  const [diffs, setDiffs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [diffStats, setDiffStats] = useState({ additions: 0, deletions: 0, modifications: 0 });
  const { toast } = useToast();

  const calculateDiff = useCallback(async () => {
    if (!leftContent && !rightContent) {
      setDiffs([]);
      setDiffStats({ additions: 0, deletions: 0, modifications: 0 });
      return;
    }

    setIsProcessing(true);
    try {
      // Ensure content is string
      const leftStr = String(leftContent || '');
      const rightStr = String(rightContent || '');
      
      // Use simple diff algorithm for all modes
      const diffResult = simpleDiff(leftStr, rightStr);
      
      // Calculate statistics
      let additions = 0;
      let deletions = 0;
      let modifications = 0;
      
      diffResult.forEach(change => {
        if (change.type === 'add') additions++;
        else if (change.type === 'remove') deletions++;
        else if (change.type === 'modify') modifications++;
      });
      
      setDiffs(diffResult);
      setDiffStats({ additions, deletions, modifications });
      
      // Store in recent diffs
      if (leftContent || rightContent) {
        const diffId = Date.now().toString();
        localStorage.setItem(`diffit:diff:${diffId}`, JSON.stringify({
          id: diffId,
          leftContent,
          rightContent,
          diffs: diffResult,
          stats: { additions, deletions, modifications },
          createdAt: new Date().toISOString(),
          syntax,
          mode: diffMode
        }));
      }
    } catch (error) {
      console.error("Diff calculation error:", error);
      toast({
        title: "Error",
        description: "Failed to calculate diff",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [leftContent, rightContent, diffMode, syntax, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateDiff();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [calculateDiff]);

  // Convert diffs to lines format expected by UIDiffViewer
  const lines = useMemo(() => {
    return diffs.map((change: any) => ({
      type: (change.type === 'add' ? 'added' : 
            change.type === 'remove' ? 'removed' : 
            change.type === 'modify' ? 'removed' : 'unchanged') as 'added' | 'removed' | 'unchanged' | 'header',
      content: change.content.left || change.content.right || '',
      lineNumber: {
        old: change.lineNumber?.left || undefined,
        new: change.lineNumber?.right || undefined,
      },
    }));
  }, [diffs]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-96">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Stats overlay */}
      <AnimatePresence>
        {diffStats && (diffStats.additions > 0 || diffStats.deletions > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-4 right-4 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 shadow-lg"
          >
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="font-medium">+{diffStats.additions}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="font-medium">-{diffStats.deletions}</span>
              </div>
              {diffStats.modifications > 0 && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <span className="font-medium">~{diffStats.modifications}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <UIDiffViewer
        lines={lines}
        mode={diffMode}
        showLineNumbers={true}
        highlightSyntax={syntax !== 'text'}
        language={syntax}
        className="h-full"
        onModeChange={setDiffMode}
      />
    </div>
  );
}