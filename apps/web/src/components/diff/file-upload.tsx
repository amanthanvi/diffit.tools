"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@diffit/ui/button";
import { useToast } from "@diffit/ui/use-toast";
import { cn } from "@diffit/ui/lib/utils";
import { useDiffStore } from "@/stores/diff-store";

export function FileUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { setLeftContent, setRightContent } = useDiffStore();
  const { toast } = useToast();

  const handleFile = useCallback(
    async (file: File, side: "left" | "right") => {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Maximum file size is 10MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", getFileType(file));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();
        
        if (side === "left") {
          setLeftContent(data.content);
        } else {
          setRightContent(data.content);
        }

        toast({
          title: "File uploaded",
          description: `${file.name} has been loaded`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to process file",
          variant: "destructive",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [setLeftContent, setRightContent, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, side: "left" | "right") => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file, side);
      }
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, side: "left" | "right") => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file, side);
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-10">
      <div
        className={cn(
          "rounded-lg border-2 border-dashed p-4 transition-all",
          isDragging
            ? "border-primary bg-primary/10"
            : "border-muted-foreground/25 bg-background/95 backdrop-blur"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isDragging ? (
          <div className="flex items-center gap-4">
            <div
              className="flex-1 p-8 text-center"
              onDrop={(e) => handleDrop(e, "left")}
            >
              <Upload className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-medium">Drop for left side</p>
            </div>
            <div className="w-px h-24 bg-border" />
            <div
              className="flex-1 p-8 text-center"
              onDrop={(e) => handleDrop(e, "right")}
            >
              <Upload className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-2 text-sm font-medium">Drop for right side</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag files here or
            </p>
            <label htmlFor="file-upload-left">
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0"
                disabled={isUploading}
                asChild
              >
                <span>browse</span>
              </Button>
            </label>
            <input
              id="file-upload-left"
              type="file"
              className="hidden"
              onChange={(e) => handleFileSelect(e, "left")}
              accept=".txt,.js,.ts,.jsx,.tsx,.py,.java,.cpp,.cs,.go,.rs,.rb,.php,.swift,.kt,.sql,.html,.css,.json,.yaml,.yml,.md,.xml"
            />
          </div>
        )}
      </div>
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