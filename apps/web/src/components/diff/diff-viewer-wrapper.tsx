"use client";

import { useMemo } from "react";
import { 
  DiffViewer as UIDiffViewer, 
  VirtualizedDiffViewer,
  type DiffLine 
} from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";

export function DiffViewer() {
  const { leftContent, rightContent, diffMode } = useDiffStore();

  const lines = useMemo(() => {
    // Simple line-by-line diff for now (will be replaced with WASM engine)
    const leftLines = (leftContent || '').split('\n');
    const rightLines = (rightContent || '').split('\n');
    const diffLines: DiffLine[] = [];
    const maxLines = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLines; i++) {
      const leftLine = i < leftLines.length ? leftLines[i] : undefined;
      const rightLine = i < rightLines.length ? rightLines[i] : undefined;
      
      if (leftLine === undefined) {
        // Line added
        diffLines.push({
          type: 'added',
          content: rightLine || '',
          lineNumber: { new: i + 1 }
        });
      } else if (rightLine === undefined) {
        // Line removed
        diffLines.push({
          type: 'removed',
          content: leftLine,
          lineNumber: { old: i + 1 }
        });
      } else if (leftLine !== rightLine) {
        // Line modified - show as remove + add
        diffLines.push({
          type: 'removed',
          content: leftLine,
          lineNumber: { old: i + 1 }
        });
        diffLines.push({
          type: 'added',
          content: rightLine,
          lineNumber: { new: i + 1 }
        });
      } else {
        // Line unchanged
        diffLines.push({
          type: 'unchanged',
          content: leftLine,
          lineNumber: { old: i + 1, new: i + 1 }
        });
      }
    }
    
    return diffLines;
  }, [leftContent, rightContent]);

  // Temporarily disable virtualized viewer to debug production issue
  // Use virtualized viewer for large diffs (>1000 lines)
  // const isLargeDiff = lines.length > 1000;
  
  // if (isLargeDiff) {
  //   return (
  //     <VirtualizedDiffViewer
  //       lines={lines}
  //       mode={diffMode}
  //       showLineNumbers={true}
  //       highlightSyntax={false}
  //       language="text"
  //       height={600}
  //     />
  //   );
  // }
  
  return (
    <UIDiffViewer
      lines={lines}
      mode={diffMode}
      showLineNumbers={true}
      highlightSyntax={false}
      language="text"
    />
  );
}