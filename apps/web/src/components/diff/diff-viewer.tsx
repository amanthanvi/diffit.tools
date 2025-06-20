"use client";

import { useState, useEffect, useCallback } from "react";
import { DiffViewer as UIDiffViewer, useToast } from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";
// import { trpc } from "@/lib/trpc";

export function DiffViewer() {
  const { leftContent, rightContent, diffMode, syntax } = useDiffStore();
  const [diffs, setDiffs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // Temporarily disabled tRPC - using local processing
  const processDiff = {
    mutate: async (data: any) => {
      console.log("Processing diff locally", data);
      // TODO: Re-enable tRPC after fixing build issues
    },
  };

  const calculateDiff = useCallback(async () => {
    if (!leftContent && !rightContent) {
      setDiffs([]);
      return;
    }

    setIsProcessing(true);
    try {
      // For now, use a simple diff representation
      const lines = leftContent.split('\n');
      const rightLines = rightContent.split('\n');
      
      const simpleDiffs = lines.map((line, i) => ({
        type: 'unchanged',
        content: { left: line, right: rightLines[i] || '' },
        lineNumber: { left: i + 1, right: i + 1 },
      }));
      
      setDiffs(simpleDiffs);

      // TODO: Re-enable tRPC mutation
      if (leftContent || rightContent) {
        await processDiff.mutate({
          leftContent,
          rightContent,
          leftName: "Left",
          rightName: "Right",
          type: syntax === "javascript" ? "CODE" : "TEXT",
          visibility: "PUBLIC",
        });
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
  }, [leftContent, rightContent, diffMode, syntax, processDiff, toast]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      calculateDiff();
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [calculateDiff]);

  // Convert diffs to lines format expected by UIDiffViewer
  const lines = diffs.map((change: any) => ({
    type: (change.type === 'add' ? 'added' : 
          change.type === 'remove' ? 'removed' : 
          change.type === 'modify' ? 'removed' : 'unchanged') as 'added' | 'removed' | 'unchanged' | 'header',
    content: change.content.left || change.content.right || '',
    lineNumber: {
      old: change.lineNumber.left,
      new: change.lineNumber.right,
    },
  }));

  return (
    <UIDiffViewer
      lines={lines}
      mode={diffMode}
      showLineNumbers={true}
      highlightSyntax={syntax !== 'text'}
      language={syntax}
      className="h-full"
    />
  );
}