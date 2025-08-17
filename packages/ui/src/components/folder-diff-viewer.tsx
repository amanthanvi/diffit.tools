"use client";

import * as React from 'react';
import { cn } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Button } from './button';
import { FileTree, type FileNode } from './file-tree';
import { EnhancedDiffViewer } from './enhanced-diff-viewer';
import { DiffInsightsPanel } from './diff-insights';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { ScrollArea } from './scroll-area';
import {
  FolderOpen,
  FileText,
  Upload,
  GitCompare,
  Download,
  Filter,
  X,
} from 'lucide-react';
import type { DiffLine, DiffInsights as DiffInsightsType } from '../types/diff';

export interface FolderDiffViewerProps {
  leftTree: FileNode[];
  rightTree: FileNode[];
  mergedTree: FileNode[];
  statistics?: {
    filesAdded: number;
    filesRemoved: number;
    filesModified: number;
    filesUnchanged: number;
    foldersAdded: number;
    foldersRemoved: number;
  };
  onFileSelect?: (file: FileNode) => void;
  onCompareFiles?: (leftPath: string, rightPath: string) => Promise<{
    lines: DiffLine[];
    insights: DiffInsightsType;
  }>;
  className?: string;
}

export const FolderDiffViewer = React.forwardRef<HTMLDivElement, FolderDiffViewerProps>(
  (
    {
      leftTree,
      rightTree,
      mergedTree,
      statistics,
      onFileSelect,
      onCompareFiles,
      className,
    },
    ref
  ) => {
    const [selectedFile, setSelectedFile] = React.useState<FileNode | null>(null);
    const [diffResult, setDiffResult] = React.useState<{
      lines: DiffLine[];
      insights: DiffInsightsType;
    } | null>(null);
    const [isLoadingDiff, setIsLoadingDiff] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'tree' | 'list'>('tree');
    const [filterStatus, setFilterStatus] = React.useState<string>('all');
    const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set(['/']));

    // Filter tree based on status
    const filteredTree = React.useMemo(() => {
      if (filterStatus === 'all') return mergedTree;

      const filterNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.reduce<FileNode[]>((acc, node) => {
          if (node.type === 'folder') {
            const filteredChildren = node.children ? filterNodes(node.children) : [];
            if (filteredChildren.length > 0) {
              acc.push({
                ...node,
                children: filteredChildren,
              });
            }
          } else if (node.status === filterStatus || filterStatus === 'changed' && node.status !== 'unchanged') {
            acc.push(node);
          }
          return acc;
        }, []);
      };

      return filterNodes(mergedTree);
    }, [mergedTree, filterStatus]);

    // Handle file selection
    const handleFileSelect = React.useCallback(async (node: FileNode) => {
      if (node.type !== 'file') return;

      setSelectedFile(node);
      onFileSelect?.(node);

      // Load diff if the file was modified
      if (node.status === 'modified' && onCompareFiles) {
        setIsLoadingDiff(true);
        try {
          const result = await onCompareFiles(node.path, node.path);
          setDiffResult(result);
        } catch (error) {
          console.error('Failed to load diff:', error);
          setDiffResult(null);
        } finally {
          setIsLoadingDiff(false);
        }
      } else {
        setDiffResult(null);
      }
    }, [onFileSelect, onCompareFiles]);

    // Handle path expansion
    const handleToggleExpand = React.useCallback((path: string) => {
      setExpandedPaths(prev => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    }, []);

    // Expand all modified paths
    const expandModified = React.useCallback(() => {
      const paths = new Set<string>();
      
      const collectPaths = (nodes: FileNode[], parentPath = '') => {
        nodes.forEach(node => {
          if (node.status && node.status !== 'unchanged') {
            // Add all parent paths
            const parts = node.path.split('/');
            for (let i = 1; i <= parts.length; i++) {
              paths.add(parts.slice(0, i).join('/'));
            }
          }
          if (node.children) {
            collectPaths(node.children, node.path);
          }
        });
      };

      collectPaths(mergedTree);
      setExpandedPaths(paths);
    }, [mergedTree]);

    // Collapse all paths
    const collapseAll = React.useCallback(() => {
      setExpandedPaths(new Set());
    }, []);

    // Get all modified files as a flat list
    const modifiedFiles = React.useMemo(() => {
      const files: FileNode[] = [];
      
      const collectFiles = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file' && node.status && node.status !== 'unchanged') {
            files.push(node);
          }
          if (node.children) {
            collectFiles(node.children);
          }
        });
      };

      collectFiles(mergedTree);
      return files.sort((a, b) => {
        // Sort by status, then by path
        const statusOrder = { removed: 0, added: 1, modified: 2 };
        const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
        const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.path.localeCompare(b.path);
      });
    }, [mergedTree]);

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)}>
        {/* Header with statistics */}
        {statistics && (
          <Card className="mb-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <GitCompare className="h-5 w-5" />
                Folder Comparison Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground mb-1">Files</div>
                  <div className="flex gap-2">
                    <Badge variant="default">+{statistics.filesAdded}</Badge>
                    <Badge variant="destructive">-{statistics.filesRemoved}</Badge>
                    <Badge variant="secondary">~{statistics.filesModified}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Folders</div>
                  <div className="flex gap-2">
                    <Badge variant="default">+{statistics.foldersAdded}</Badge>
                    <Badge variant="destructive">-{statistics.foldersRemoved}</Badge>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground mb-1">Total Changes</div>
                  <div className="text-2xl font-bold">
                    {statistics.filesAdded + statistics.filesRemoved + statistics.filesModified}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 flex-1 min-h-0">
          {/* Left panel - File tree */}
          <Card className="w-1/3 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Files</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={expandModified}
                    title="Expand modified"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={collapseAll}
                    title="Collapse all"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'tree' | 'list')}>
                <TabsList className="w-full rounded-none">
                  <TabsTrigger value="tree" className="flex-1">Tree View</TabsTrigger>
                  <TabsTrigger value="list" className="flex-1">Changed Files</TabsTrigger>
                </TabsList>
                
                <div className="p-2 border-b">
                  <select
                    className="w-full text-sm border rounded px-2 py-1"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All files</option>
                    <option value="changed">Changed only</option>
                    <option value="added">Added only</option>
                    <option value="removed">Removed only</option>
                    <option value="modified">Modified only</option>
                  </select>
                </div>

                <TabsContent value="tree" className="mt-0 h-[500px]">
                  <FileTree
                    tree={filteredTree}
                    selectedPath={selectedFile?.path}
                    onSelectFile={handleFileSelect}
                    expandedPaths={expandedPaths}
                    onToggleExpand={handleToggleExpand}
                    showChangeCounts
                    showStatusBadges
                  />
                </TabsContent>
                
                <TabsContent value="list" className="mt-0 h-[500px]">
                  <ScrollArea className="h-full">
                    <div className="p-2 space-y-1">
                      {modifiedFiles.map(file => (
                        <button
                          key={file.id}
                          onClick={() => handleFileSelect(file)}
                          className={cn(
                            'w-full text-left px-3 py-2 rounded hover:bg-muted text-sm',
                            selectedFile?.path === file.path && 'bg-muted'
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate flex-1">{file.path}</span>
                            <Badge
                              variant={
                                file.status === 'added' ? 'default' :
                                file.status === 'removed' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {file.status}
                            </Badge>
                          </div>
                          {file.status === 'modified' && (file.additions || file.deletions) && (
                            <div className="flex gap-2 mt-1 ml-6 text-xs">
                              <span className="text-green-600">+{file.additions || 0}</span>
                              <span className="text-red-600">-{file.deletions || 0}</span>
                              {file.similarity !== undefined && (
                                <span className="text-muted-foreground">{file.similarity}% similar</span>
                              )}
                            </div>
                          )}
                        </button>
                      ))}
                      {modifiedFiles.length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No changed files
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right panel - File diff */}
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedFile ? (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="truncate">{selectedFile.name}</span>
                    {selectedFile.status && (
                      <Badge
                        variant={
                          selectedFile.status === 'added' ? 'default' :
                          selectedFile.status === 'removed' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {selectedFile.status}
                      </Badge>
                    )}
                  </div>
                ) : (
                  'Select a file to view'
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {selectedFile ? (
                <div className="h-full flex flex-col">
                  {selectedFile.status === 'modified' && diffResult ? (
                    <>
                      {diffResult.insights && (
                        <div className="p-4 border-b">
                          <DiffInsightsPanel insights={diffResult.insights} />
                        </div>
                      )}
                      <div className="flex-1 overflow-auto">
                        <EnhancedDiffViewer
                          lines={diffResult.lines}
                          showLineNumbers
                          showMinimap
                          height={400}
                        />
                      </div>
                    </>
                  ) : selectedFile.status === 'added' ? (
                    <div className="p-8 text-center">
                      <Badge variant="default" className="mb-4">New File</Badge>
                      <p className="text-muted-foreground">
                        This file was added in the right folder
                      </p>
                      {selectedFile.size && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Size: {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                  ) : selectedFile.status === 'removed' ? (
                    <div className="p-8 text-center">
                      <Badge variant="destructive" className="mb-4">Removed File</Badge>
                      <p className="text-muted-foreground">
                        This file was removed from the right folder
                      </p>
                      {selectedFile.size && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Size: {(selectedFile.size / 1024).toFixed(2)} KB
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <Badge variant="secondary" className="mb-4">Unchanged</Badge>
                      <p className="text-muted-foreground">
                        This file is identical in both folders
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a file from the tree to view its diff</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);

FolderDiffViewer.displayName = 'FolderDiffViewer';