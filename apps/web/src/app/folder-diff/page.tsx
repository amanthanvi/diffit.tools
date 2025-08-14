"use client";

import { useState, useCallback } from "react";
import { 
  Folder, 
  FolderOpen, 
  Upload, 
  GitCompare,
  FileText,
  FileCode,
  FileImage,
  Plus,
  Minus,
  Edit,
  ArrowRight,
  ChevronRight,
  ChevronDown,
  Filter
} from "lucide-react";
import { SimpleHeader } from "@/components/layout/simple-header";
import { DiffViewer } from "@/components/diff/diff-viewer-wrapper";
import { 
  Button, 
  Card, 
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  ScrollArea,
  Separator,
  useToast
} from "@diffit/ui";
import { cn } from "@/lib/utils";
import { useDiffStore } from "@/stores/diff-store";

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  status?: 'added' | 'removed' | 'modified' | 'unchanged' | 'renamed';
  oldPath?: string;
  children?: FileNode[];
  content?: string;
  oldContent?: string;
  size?: number;
  lastModified?: Date;
}

interface FolderDiffState {
  leftFolder: FileNode | null;
  rightFolder: FileNode | null;
  selectedFile: FileNode | null;
  expandedPaths: Set<string>;
  filter: 'all' | 'modified' | 'added' | 'removed';
}

export default function FolderDiffPage() {
  const [state, setState] = useState<FolderDiffState>({
    leftFolder: null,
    rightFolder: null,
    selectedFile: null,
    expandedPaths: new Set(),
    filter: 'all'
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { setLeftContent, setRightContent } = useDiffStore();

  // Handle folder selection using File System Access API
  const selectFolder = useCallback(async (side: 'left' | 'right') => {
    try {
      // Check if File System Access API is available
      if (!('showDirectoryPicker' in window)) {
        toast({
          title: "Browser not supported",
          description: "Please use Chrome, Edge, or Opera for folder comparison",
          variant: "destructive"
        });
        return;
      }

      // @ts-ignore - File System Access API
      const dirHandle = await window.showDirectoryPicker();
      setLoading(true);
      
      const folderStructure = await readDirectoryRecursive(dirHandle, '');
      
      setState(prev => ({
        ...prev,
        [side === 'left' ? 'leftFolder' : 'rightFolder']: folderStructure
      }));
      
      toast({
        title: "Folder loaded",
        description: `${folderStructure.name} has been loaded successfully`
      });
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        toast({
          title: "Error loading folder",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Read directory recursively
  const readDirectoryRecursive = async (
    dirHandle: any, 
    path: string
  ): Promise<FileNode> => {
    const node: FileNode = {
      name: dirHandle.name || 'root',
      path: path || '/',
      type: 'directory',
      children: []
    };

    // Read all entries
    for await (const entry of dirHandle.values()) {
      const entryPath = path ? `${path}/${entry.name}` : entry.name;
      
      if (entry.kind === 'file') {
        // Skip certain files
        if (shouldSkipFile(entry.name)) continue;
        
        const file = await entry.getFile();
        node.children?.push({
          name: entry.name,
          path: entryPath,
          type: 'file',
          size: file.size,
          lastModified: new Date(file.lastModified),
          content: file.size < 1024 * 1024 ? await file.text() : '' // Only read files < 1MB
        });
      } else if (entry.kind === 'directory') {
        // Skip certain directories
        if (shouldSkipDirectory(entry.name)) continue;
        
        const childNode = await readDirectoryRecursive(entry, entryPath);
        node.children?.push(childNode);
      }
    }

    // Sort children: directories first, then files
    node.children?.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return node;
  };

  // Check if file should be skipped
  const shouldSkipFile = (name: string): boolean => {
    const skipPatterns = [
      /^\.DS_Store$/,
      /^Thumbs\.db$/,
      /\.pyc$/,
      /\.pyo$/,
      /\.class$/,
      /\.o$/,
      /\.obj$/,
      /\.exe$/,
      /\.dll$/,
      /\.so$/,
      /\.dylib$/
    ];
    return skipPatterns.some(pattern => pattern.test(name));
  };

  // Check if directory should be skipped
  const shouldSkipDirectory = (name: string): boolean => {
    const skipDirs = [
      'node_modules',
      '.git',
      '.svn',
      '.hg',
      '__pycache__',
      '.next',
      'dist',
      'build',
      '.turbo',
      '.vercel'
    ];
    return skipDirs.includes(name) || name.startsWith('.');
  };

  // Compare folders and mark differences
  const compareFolders = useCallback(() => {
    if (!state.leftFolder || !state.rightFolder) return;
    
    const compared = compareTrees(state.leftFolder, state.rightFolder);
    setState(prev => ({ ...prev, leftFolder: compared.left, rightFolder: compared.right }));
    
    toast({
      title: "Comparison complete",
      description: "Folders have been compared successfully"
    });
  }, [state.leftFolder, state.rightFolder, toast]);

  // Compare two file trees
  const compareTrees = (
    left: FileNode, 
    right: FileNode
  ): { left: FileNode, right: FileNode } => {
    const leftMap = new Map<string, FileNode>();
    const rightMap = new Map<string, FileNode>();
    
    // Build maps for efficient lookup
    buildFileMap(left, leftMap);
    buildFileMap(right, rightMap);
    
    // Mark statuses
    markTreeStatus(left, rightMap, 'left');
    markTreeStatus(right, leftMap, 'right');
    
    return { left, right };
  };

  // Build a map of path to FileNode
  const buildFileMap = (node: FileNode, map: Map<string, FileNode>, basePath = '') => {
    const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
    map.set(fullPath, node);
    
    if (node.children) {
      for (const child of node.children) {
        buildFileMap(child, map, fullPath);
      }
    }
  };

  // Mark status of nodes in tree
  const markTreeStatus = (
    node: FileNode, 
    otherMap: Map<string, FileNode>, 
    side: 'left' | 'right',
    basePath = ''
  ) => {
    const fullPath = basePath ? `${basePath}/${node.name}` : node.name;
    const otherNode = otherMap.get(fullPath);
    
    if (!otherNode) {
      node.status = side === 'left' ? 'removed' : 'added';
    } else if (node.type === 'file') {
      if (node.content !== otherNode.content) {
        node.status = 'modified';
      } else {
        node.status = 'unchanged';
      }
    } else {
      node.status = 'unchanged';
    }
    
    if (node.children) {
      for (const child of node.children) {
        markTreeStatus(child, otherMap, side, fullPath);
      }
    }
  };

  // Toggle folder expansion
  const toggleExpanded = (path: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { ...prev, expandedPaths: newExpanded };
    });
  };

  // Select file for diff view
  const selectFile = (file: FileNode) => {
    if (file.type === 'file') {
      setState(prev => ({ ...prev, selectedFile: file }));
      
      // Find corresponding file in other tree
      const otherFolder = state.leftFolder?.path === file.path.split('/')[0] 
        ? state.rightFolder 
        : state.leftFolder;
      
      if (otherFolder) {
        const otherFile = findFileByPath(otherFolder, file.path);
        setLeftContent(file.status === 'added' ? '' : file.content || '');
        setRightContent(
          file.status === 'removed' ? '' : 
          otherFile?.content || file.content || ''
        );
      }
    }
  };

  // Find file by path in tree
  const findFileByPath = (node: FileNode, path: string): FileNode | null => {
    if (node.path === path) return node;
    
    if (node.children) {
      for (const child of node.children) {
        const found = findFileByPath(child, path);
        if (found) return found;
      }
    }
    
    return null;
  };

  // Render file tree node
  const renderTreeNode = (node: FileNode, depth = 0) => {
    const isExpanded = state.expandedPaths.has(node.path);
    const isSelected = state.selectedFile?.path === node.path;
    
    // Apply filter
    if (state.filter !== 'all' && node.status !== state.filter && node.type === 'file') {
      return null;
    }
    
    const statusColors = {
      added: 'text-green-600 dark:text-green-400',
      removed: 'text-red-600 dark:text-red-400',
      modified: 'text-yellow-600 dark:text-yellow-400',
      unchanged: 'text-gray-500',
      renamed: 'text-blue-600 dark:text-blue-400'
    };
    
    const statusIcons = {
      added: <Plus className="h-3 w-3" />,
      removed: <Minus className="h-3 w-3" />,
      modified: <Edit className="h-3 w-3" />,
      unchanged: null,
      renamed: <ArrowRight className="h-3 w-3" />
    };

    return (
      <div key={node.path}>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 hover:bg-muted/50 cursor-pointer rounded",
            isSelected && "bg-muted",
            depth > 0 && "ml-4"
          )}
          onClick={() => node.type === 'directory' ? toggleExpanded(node.path) : selectFile(node)}
        >
          {node.type === 'directory' && (
            <button 
              className="p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.path);
              }}
            >
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
          )}
          
          {node.type === 'directory' ? (
            isExpanded ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          
          <span className={cn("text-sm flex-1", node.status && statusColors[node.status])}>
            {node.name}
          </span>
          
          {node.status && node.status !== 'unchanged' && (
            <div className="flex items-center gap-1">
              {statusIcons[node.status]}
              <Badge variant="secondary" className="text-xs py-0 px-1">
                {node.status}
              </Badge>
            </div>
          )}
        </div>
        
        {node.type === 'directory' && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <SimpleHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Folder Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Compare entire folders and directories to see what changed
          </p>
        </div>

        {/* Folder Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Original Folder</h3>
              <Button onClick={() => selectFolder('left')} disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </div>
            {state.leftFolder && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{state.leftFolder.name}</p>
                <p>{state.leftFolder.children?.length || 0} items</p>
              </div>
            )}
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Modified Folder</h3>
              <Button onClick={() => selectFolder('right')} disabled={loading}>
                <Upload className="mr-2 h-4 w-4" />
                Select Folder
              </Button>
            </div>
            {state.rightFolder && (
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">{state.rightFolder.name}</p>
                <p>{state.rightFolder.children?.length || 0} items</p>
              </div>
            )}
          </Card>
        </div>

        {/* Compare Button */}
        {state.leftFolder && state.rightFolder && (
          <div className="flex justify-center mb-6">
            <Button 
              onClick={compareFolders}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <GitCompare className="mr-2 h-5 w-5" />
              Compare Folders
            </Button>
          </div>
        )}

        {/* Results View */}
        {state.leftFolder && state.rightFolder && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* File Tree */}
            <Card className="lg:col-span-1">
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-2">File Structure</h3>
                <Tabs value={state.filter} onValueChange={(v) => setState(prev => ({ ...prev, filter: v as any }))}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="modified">Modified</TabsTrigger>
                    <TabsTrigger value="added">Added</TabsTrigger>
                    <TabsTrigger value="removed">Removed</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <ScrollArea className="h-[600px] p-4">
                {renderTreeNode(state.leftFolder)}
              </ScrollArea>
            </Card>

            {/* Diff View */}
            <Card className="lg:col-span-2">
              <div className="p-4 border-b">
                <h3 className="font-semibold">
                  {state.selectedFile ? state.selectedFile.name : 'Select a file to compare'}
                </h3>
              </div>
              {state.selectedFile ? (
                <div className="p-4">
                  <DiffViewer />
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <FileCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a file from the tree to view differences</p>
                </div>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}