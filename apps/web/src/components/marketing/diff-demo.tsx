"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Code2, FileText, Zap } from "lucide-react";
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@diffit/ui";
import { DiffViewer } from "@diffit/ui";
import { cn } from "@/lib/utils";

const demoExamples = {
  code: {
    title: "Code Refactoring",
    left: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}`,
    right: `const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};`,
  },
  text: {
    title: "Document Revision",
    left: `The quick brown fox jumps over the lazy dog.
This is a simple paragraph that demonstrates
text comparison capabilities.`,
    right: `The swift brown fox leaps over the lazy dog.
This is an enhanced paragraph that demonstrates
advanced text comparison capabilities with
additional features.`,
  },
  json: {
    title: "JSON Configuration",
    left: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^17.0.2",
    "webpack": "^4.46.0"
  }
}`,
    right: `{
  "name": "my-app",
  "version": "2.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "webpack": "^5.88.0",
    "typescript": "^5.0.0"
  },
  "type": "module"
}`,
  },
};

export function DiffDemo() {
  const [activeExample, setActiveExample] = useState<keyof typeof demoExamples>("code");
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [diffLines, setDiffLines] = useState<any[]>([]);

  // Generate diff lines for the current example
  useEffect(() => {
    const example = demoExamples[activeExample];
    const leftLines = example.left.split('\n');
    const rightLines = example.right.split('\n');
    
    const lines = [];
    const maxLength = Math.max(leftLines.length, rightLines.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (i >= leftLines.length) {
        lines.push({
          type: 'added' as const,
          content: rightLines[i],
          lineNumber: { new: i + 1 },
        });
      } else if (i >= rightLines.length) {
        lines.push({
          type: 'removed' as const,
          content: leftLines[i],
          lineNumber: { old: i + 1 },
        });
      } else if (leftLines[i] !== rightLines[i]) {
        lines.push({
          type: 'removed' as const,
          content: leftLines[i],
          lineNumber: { old: i + 1 },
        });
        lines.push({
          type: 'added' as const,
          content: rightLines[i],
          lineNumber: { new: i + 1 },
        });
      } else {
        lines.push({
          type: 'unchanged' as const,
          content: leftLines[i],
          lineNumber: { old: i + 1, new: i + 1 },
        });
      }
    }
    
    setDiffLines(lines);
  }, [activeExample]);

  // Auto-cycle through examples
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          const examples = Object.keys(demoExamples) as (keyof typeof demoExamples)[];
          const currentIndex = examples.indexOf(activeExample);
          const nextIndex = (currentIndex + 1) % examples.length;
          setActiveExample(examples[nextIndex]);
          return 0;
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, activeExample]);

  const handleReset = () => {
    setProgress(0);
    setActiveExample("code");
  };

  return (
    <Card className="overflow-hidden border-gray-200 dark:border-gray-700 shadow-2xl">
      {/* Controls */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Live Demo</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReset}
                className="h-8 w-8"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Tabs value={activeExample} onValueChange={(v) => setActiveExample(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="code" className="gap-2">
                <Code2 className="h-4 w-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="text" className="gap-2">
                <FileText className="h-4 w-4" />
                Text
              </TabsTrigger>
              <TabsTrigger value="json" className="gap-2">
                <Zap className="h-4 w-4" />
                JSON
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Demo Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeExample}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <h4 className="mb-4 text-sm font-medium text-gray-600 dark:text-gray-400">
              {demoExamples[activeExample].title}
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-500">BEFORE</div>
                <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {demoExamples[activeExample].left}
                  </pre>
                </Card>
              </div>
              <div>
                <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-500">AFTER</div>
                <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    {demoExamples[activeExample].right}
                  </pre>
                </Card>
              </div>
            </div>
            
            <div>
              <div className="mb-2 text-xs font-medium text-gray-500 dark:text-gray-500">DIFF OUTPUT</div>
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <DiffViewer
                  lines={diffLines}
                  mode="unified"
                  showLineNumbers={true}
                  highlightSyntax={activeExample === "code"}
                  language={activeExample === "code" ? "javascript" : "text"}
                  className="max-h-64"
                />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        
        <div className="mt-6 flex items-center justify-center">
          <Button
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20"
            onClick={() => window.location.href = '/diff'}
          >
            Try It Yourself
          </Button>
        </div>
      </div>
    </Card>
  );
}