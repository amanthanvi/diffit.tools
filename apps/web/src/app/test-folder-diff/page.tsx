"use client";

import { useState, useRef, useCallback } from "react";
import { FolderDiffViewer, type FileNode } from "@diffit/ui";
import { FolderComparator } from "@diffit/diff-engine";
import { Button } from "@diffit/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@diffit/ui";
import { Upload, FolderOpen } from "lucide-react";

// Mock file data for testing
const createMockFiles = (prefix: string): File[] => {
  const files: File[] = [];
  
  // Create mock File objects
  const createFile = (path: string, content: string): File => {
    const blob = new Blob([content], { type: 'text/plain' });
    const file = new File([blob], path.split('/').pop() || 'file.txt', {
      type: 'text/plain',
    });
    // Add webkitRelativePath for folder structure
    Object.defineProperty(file, 'webkitRelativePath', {
      value: path,
      writable: false,
    });
    return file;
  };

  // Create a mock folder structure
  files.push(createFile(`${prefix}/src/index.js`, 'console.log("Hello");'));
  files.push(createFile(`${prefix}/src/utils.js`, 'export const util = () => {};'));
  files.push(createFile(`${prefix}/package.json`, '{"name": "test", "version": "1.0.0"}'));
  files.push(createFile(`${prefix}/README.md`, '# Test Project'));
  
  if (prefix === 'right') {
    // Add some changes for the right folder
    files.push(createFile(`${prefix}/src/new-file.js`, 'const newFeature = true;'));
    files[0] = createFile(`${prefix}/src/index.js`, 'console.log("Hello, World!");');
    files.push(createFile(`${prefix}/src/components/Button.jsx`, 'export const Button = () => <button>Click</button>;'));
  }
  
  return files;
};

export default function TestFolderDiffPage() {
  const [leftFiles, setLeftFiles] = useState<File[]>([]);
  const [rightFiles, setRightFiles] = useState<File[]>([]);
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const leftInputRef = useRef<HTMLInputElement>(null);
  const rightInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList, side: 'left' | 'right') => {
    const fileArray = Array.from(files);
    if (side === 'left') {
      setLeftFiles(fileArray);
    } else {
      setRightFiles(fileArray);
    }
  }, []);

  const handleCompare = useCallback(() => {
    if (leftFiles.length === 0 && rightFiles.length === 0) {
      // Use mock data if no files selected
      const mockLeft = createMockFiles('left');
      const mockRight = createMockFiles('right');
      setLeftFiles(mockLeft);
      setRightFiles(mockRight);
      
      const comparator = new FolderComparator();
      const result = comparator.compare(mockLeft, mockRight);
      setComparisonResult(result);
    } else if (leftFiles.length > 0 && rightFiles.length > 0) {
      const comparator = new FolderComparator();
      const result = comparator.compare(leftFiles, rightFiles);
      setComparisonResult(result);
    }
  }, [leftFiles, rightFiles]);

  const handleFileCompare = useCallback(async (leftPath: string, rightPath: string) => {
    // Mock implementation - in real app would load and compare file contents
    const mockDiff = {
      lines: [
        { type: 'unchanged' as const, content: 'Line 1', lineNumber: { old: 1, new: 1 } },
        { type: 'removed' as const, content: 'Old line', lineNumber: { old: 2 } },
        { type: 'added' as const, content: 'New line', lineNumber: { new: 2 } },
        { type: 'unchanged' as const, content: 'Line 3', lineNumber: { old: 3, new: 3 } },
      ],
      insights: {
        totalChanges: 2,
        additions: 1,
        deletions: 1,
        modifications: 0,
        similarity: 75,
        hunks: 1,
      },
    };
    
    return new Promise<typeof mockDiff>((resolve) => {
      setTimeout(() => resolve(mockDiff), 500);
    });
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Folder Diff Viewer</h1>
      
      {!comparisonResult ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Folders to Compare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Left Folder</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    ref={leftInputRef}
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files!, 'left')}
                    className="hidden"
                  />
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <Button
                    variant="outline"
                    onClick={() => leftInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Folder
                  </Button>
                  {leftFiles.length > 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {leftFiles.length} files selected
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Right Folder</label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <input
                    ref={rightInputRef}
                    type="file"
                    webkitdirectory=""
                    directory=""
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files!, 'right')}
                    className="hidden"
                  />
                  <FolderOpen className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <Button
                    variant="outline"
                    onClick={() => rightInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Folder
                  </Button>
                  {rightFiles.length > 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {rightFiles.length} files selected
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button onClick={handleCompare} size="lg">
                Compare Folders
              </Button>
              <Button 
                onClick={() => {
                  setLeftFiles([]);
                  setRightFiles([]);
                  handleCompare();
                }}
                variant="secondary"
                size="lg"
              >
                Use Mock Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div>
          <Button
            onClick={() => {
              setComparisonResult(null);
              setLeftFiles([]);
              setRightFiles([]);
            }}
            className="mb-4"
            variant="outline"
          >
            ← Back to Selection
          </Button>
          
          <FolderDiffViewer
            leftTree={comparisonResult.leftTree}
            rightTree={comparisonResult.rightTree}
            mergedTree={comparisonResult.mergedTree}
            statistics={comparisonResult.statistics}
            onCompareFiles={handleFileCompare}
          />
        </div>
      )}
    </div>
  );
}

// Add type declarations for webkitdirectory
declare module 'react' {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    webkitdirectory?: string;
    directory?: string;
  }
}