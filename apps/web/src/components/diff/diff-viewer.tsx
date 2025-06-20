"use client";

import { useState, useEffect, useCallback } from "react";
import { DiffViewer as UIDiffViewer } from "@diffit/ui/diff-viewer";
import { useDiffStore } from "@/stores/diff-store";
import { trpc } from "@/providers/trpc-provider";
import { useToast } from "@diffit/ui/use-toast";

export function DiffViewer() {
  const { leftContent, rightContent, diffMode, syntax } = useDiffStore();
  const [diffs, setDiffs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const processDiff = trpc.diff.create.useMutation({
    onSuccess: (data) => {
      setDiffs(data.diffs);
      toast({
        title: "Diff created",
        description: "Your diff has been processed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateDiff = useCallback(async () => {
    if (!leftContent && !rightContent) return;

    setIsProcessing(true);
    try {
      // Use WebAssembly diff engine
      const { calculateDiff } = await import("@diffit/diff-engine");
      const result = await calculateDiff(leftContent, rightContent, {
        mode: diffMode,
        syntax,
      });
      setDiffs(result);

      // Save to backend if user is logged in
      if (leftContent || rightContent) {
        processDiff.mutate({
          leftContent,
          rightContent,
          mode: diffMode,
          syntax,
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

  return (
    <UIDiffViewer
      diffs={diffs}
      leftContent={leftContent}
      rightContent={rightContent}
      mode={diffMode}
      syntax={syntax}
      isProcessing={isProcessing}
      className="h-full"
    />
  );
}