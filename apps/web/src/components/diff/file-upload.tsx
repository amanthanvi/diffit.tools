"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, Check, X, Loader2 } from "lucide-react";
import { Button, useToast } from "@diffit/ui";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  onUpload: (content: string, file?: File) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
  label?: string;
}

export function FileUpload({
  onUpload,
  accept = {
    "text/*": [],
    "application/json": [".json"],
    "application/javascript": [".js"],
    "application/typescript": [".ts", ".tsx"],
    "application/x-python": [".py"],
    "application/x-java": [".java"],
    "application/xml": [".xml"],
    "application/x-yaml": [".yaml", ".yml"],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className,
  label = "Upload File",
}: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setIsLoading(true);

      try {
        if (file.size > maxSize) {
          throw new Error(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        }

        // Read file content directly in browser
        const reader = new FileReader();
        const content = await new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });

        setUploadedFile(file);
        onUpload(content, file);
        
        toast({
          title: "File uploaded",
          description: `${file.name} has been loaded`,
        });
        
        // Reset after a delay
        setTimeout(() => {
          setUploadedFile(null);
        }, 3000);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to read file";
        setError(errorMsg);
        toast({
          title: "Upload failed",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [onUpload, maxSize, toast]
  );

  const handleClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = Object.entries(accept)
      .map(([type, exts]) => [type, ...exts])
      .flat()
      .join(",");
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (label !== "Upload File") {
    // Compact mode for toolbar
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={isLoading}
        className={cn("h-8 w-8", className)}
        title={label}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : uploadedFile ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
      </Button>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 p-8 text-center transition-all hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/20",
        isLoading && "pointer-events-none opacity-50",
        className
      )}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Reading file...</p>
          </motion.div>
        ) : uploadedFile ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <Check className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm font-medium">File uploaded!</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {uploadedFile.name}
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <X className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">Error</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{error}</p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center"
          >
            <Upload className="mb-4 h-8 w-8 text-gray-400" />
            <p className="mb-2 text-sm font-medium">
              Drag & drop a file here
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">or</p>
            <Button variant="outline" size="sm" className="mt-2">
              Browse Files
            </Button>
            <p className="mt-4 text-xs text-gray-600 dark:text-gray-400">
              Supports text files up to 10MB
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function getFileType(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  
  const typeMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cs: "csharp",
    go: "go",
    rs: "rust",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    html: "html",
    css: "css",
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    md: "markdown",
    xml: "xml",
  };

  return typeMap[ext || ""] || "text";
}