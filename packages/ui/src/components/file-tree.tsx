"use client";

import * as React from 'react';
import { cn } from '../lib/utils';
import { Button } from './button';
import { ScrollArea } from './scroll-area';
import { Badge } from './badge';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Minus,
  Edit,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
} from 'lucide-react';
import type { FileStatus } from '../types/diff';

export { type FileStatus } from '../types/diff';

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  status?: FileStatus;
  children?: FileNode[];
  size?: number;
  extension?: string;
  additions?: number;
  deletions?: number;
  similarity?: number;
}

export interface FileTreeProps {
  tree: FileNode[];
  selectedPath?: string;
  onSelectFile?: (node: FileNode) => void;
  onSelectFolder?: (node: FileNode) => void;
  showStatusBadges?: boolean;
  showFileSize?: boolean;
  showChangeCounts?: boolean;
  expandedPaths?: Set<string>;
  onToggleExpand?: (path: string) => void;
  className?: string;
}

const getFileIcon = (node: FileNode) => {
  if (node.type === 'folder') {
    return Folder;
  }

  const ext = node.extension?.toLowerCase();
  if (!ext) return File;

  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'rs', 'go', 'rb', 'php'].includes(ext)) {
    return FileCode;
  }
  // Text/Document files
  if (['md', 'txt', 'doc', 'docx', 'pdf', 'rtf'].includes(ext)) {
    return FileText;
  }
  // Image files
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
    return FileImage;
  }
  // Video files
  if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return FileVideo;
  }
  // Audio files
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return FileAudio;
  }
  // Archive files
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
    return FileArchive;
  }

  return File;
};

const getStatusColor = (status?: FileStatus) => {
  switch (status) {
    case 'added':
      return 'text-green-600 dark:text-green-400';
    case 'removed':
      return 'text-red-600 dark:text-red-400';
    case 'modified':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'moved':
      return 'text-blue-600 dark:text-blue-400';
    default:
      return 'text-muted-foreground';
  }
};

const getStatusIcon = (status?: FileStatus) => {
  switch (status) {
    case 'added':
      return Plus;
    case 'removed':
      return Minus;
    case 'modified':
      return Edit;
    default:
      return null;
  }
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(1)} ${units[unitIndex]}`;
};

interface TreeNodeProps {
  node: FileNode;
  level: number;
  isExpanded: boolean;
  isSelected: boolean;
  showStatusBadges: boolean;
  showFileSize: boolean;
  showChangeCounts: boolean;
  onToggle: () => void;
  onSelect: () => void;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isExpanded,
  isSelected,
  showStatusBadges,
  showFileSize,
  showChangeCounts,
  onToggle,
  onSelect,
}) => {
  const Icon = getFileIcon(node);
  const StatusIcon = getStatusIcon(node.status);
  const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

  return (
    <div
      className={cn(
        'group flex items-center gap-1 px-2 py-1 hover:bg-muted/50 cursor-pointer rounded-sm',
        isSelected && 'bg-muted',
        getStatusColor(node.status)
      )}
      style={{ paddingLeft: `${level * 16 + 8}px` }}
      onClick={node.type === 'folder' ? onToggle : onSelect}
    >
      {/* Expand/Collapse icon for folders */}
      {node.type === 'folder' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className="p-0.5 hover:bg-muted rounded"
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          ) : (
            <div className="w-3 h-3" />
          )}
        </button>
      )}

      {/* File/Folder icon */}
      {node.type === 'folder' ? (
        isExpanded ? (
          <FolderOpen className="h-4 w-4 flex-shrink-0" />
        ) : (
          <Folder className="h-4 w-4 flex-shrink-0" />
        )
      ) : (
        <Icon className="h-4 w-4 flex-shrink-0 ml-4" />
      )}

      {/* Status icon */}
      {StatusIcon && (
        <StatusIcon className="h-3 w-3 flex-shrink-0" />
      )}

      {/* File/Folder name */}
      <span className="flex-1 text-sm truncate" title={node.path}>
        {node.name}
      </span>

      {/* Change counts */}
      {showChangeCounts && node.type === 'file' && (node.additions || node.deletions) && (
        <div className="flex items-center gap-1 text-xs">
          {node.additions && (
            <span className="text-green-600 dark:text-green-400">
              +{node.additions}
            </span>
          )}
          {node.deletions && (
            <span className="text-red-600 dark:text-red-400">
              -{node.deletions}
            </span>
          )}
        </div>
      )}

      {/* Status badge */}
      {showStatusBadges && node.status && node.status !== 'unchanged' && (
        <Badge 
          variant={node.status === 'added' ? 'default' : node.status === 'removed' ? 'destructive' : 'secondary'}
          className="text-xs py-0 h-5"
        >
          {node.status}
        </Badge>
      )}

      {/* File size */}
      {showFileSize && node.type === 'file' && node.size && (
        <span className="text-xs text-muted-foreground">
          {formatFileSize(node.size)}
        </span>
      )}

      {/* Similarity percentage for modified files */}
      {node.status === 'modified' && node.similarity !== undefined && (
        <span className="text-xs text-muted-foreground">
          {node.similarity}%
        </span>
      )}
    </div>
  );
};

export const FileTree = React.forwardRef<HTMLDivElement, FileTreeProps>(
  (
    {
      tree,
      selectedPath,
      onSelectFile,
      onSelectFolder,
      showStatusBadges = true,
      showFileSize = false,
      showChangeCounts = true,
      expandedPaths: controlledExpandedPaths,
      onToggleExpand,
      className,
    },
    ref
  ) => {
    const [localExpandedPaths, setLocalExpandedPaths] = React.useState<Set<string>>(
      new Set(['/'])
    );

    const expandedPaths = controlledExpandedPaths || localExpandedPaths;

    const handleToggleExpand = React.useCallback((path: string) => {
      if (onToggleExpand) {
        onToggleExpand(path);
      } else {
        setLocalExpandedPaths(prev => {
          const next = new Set(prev);
          if (next.has(path)) {
            next.delete(path);
          } else {
            next.add(path);
          }
          return next;
        });
      }
    }, [onToggleExpand]);

    const handleSelectNode = React.useCallback((node: FileNode) => {
      if (node.type === 'file' && onSelectFile) {
        onSelectFile(node);
      } else if (node.type === 'folder' && onSelectFolder) {
        onSelectFolder(node);
      }
    }, [onSelectFile, onSelectFolder]);

    const renderTree = React.useCallback((nodes: FileNode[], level = 0): React.ReactNode[] => {
      return nodes.map(node => {
        const isExpanded = expandedPaths.has(node.path);
        const isSelected = selectedPath === node.path;
        const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;

        return (
          <React.Fragment key={node.id}>
            <TreeNode
              node={node}
              level={level}
              isExpanded={isExpanded}
              isSelected={isSelected}
              showStatusBadges={showStatusBadges}
              showFileSize={showFileSize}
              showChangeCounts={showChangeCounts}
              onToggle={() => handleToggleExpand(node.path)}
              onSelect={() => handleSelectNode(node)}
            />
            {hasChildren && isExpanded && renderTree(node.children!, level + 1)}
          </React.Fragment>
        );
      });
    }, [
      expandedPaths,
      selectedPath,
      showStatusBadges,
      showFileSize,
      showChangeCounts,
      handleToggleExpand,
      handleSelectNode,
    ]);

    // Calculate statistics
    const stats = React.useMemo(() => {
      let added = 0;
      let removed = 0;
      let modified = 0;
      let unchanged = 0;

      const countNodes = (nodes: FileNode[]) => {
        nodes.forEach(node => {
          if (node.type === 'file') {
            switch (node.status) {
              case 'added': added++; break;
              case 'removed': removed++; break;
              case 'modified': modified++; break;
              case 'unchanged': unchanged++; break;
            }
          }
          if (node.children) {
            countNodes(node.children);
          }
        });
      };

      countNodes(tree);
      return { added, removed, modified, unchanged, total: added + removed + modified + unchanged };
    }, [tree]);

    return (
      <div ref={ref} className={cn('flex flex-col h-full', className)}>
        {/* Statistics header */}
        <div className="flex items-center gap-2 p-2 border-b text-xs">
          <span className="text-muted-foreground">Files:</span>
          {stats.added > 0 && (
            <Badge variant="default" className="text-xs">
              +{stats.added}
            </Badge>
          )}
          {stats.removed > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{stats.removed}
            </Badge>
          )}
          {stats.modified > 0 && (
            <Badge variant="secondary" className="text-xs">
              ~{stats.modified}
            </Badge>
          )}
          <span className="text-muted-foreground ml-auto">
            {stats.total} total
          </span>
        </div>

        {/* Tree view */}
        <ScrollArea className="flex-1">
          <div className="py-1">
            {renderTree(tree)}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

FileTree.displayName = 'FileTree';