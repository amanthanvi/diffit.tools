import type { FileNode, FileStatus } from '@diffit/ui';

export interface FolderCompareOptions {
  ignorePatterns?: string[];
  includeHidden?: boolean;
  maxDepth?: number;
  compareContent?: boolean;
}

export interface FileComparisonResult {
  leftTree: FileNode[];
  rightTree: FileNode[];
  mergedTree: FileNode[];
  statistics: {
    filesAdded: number;
    filesRemoved: number;
    filesModified: number;
    filesUnchanged: number;
    foldersAdded: number;
    foldersRemoved: number;
  };
}

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  size?: number;
  children?: Map<string, FileEntry>;
}

export class FolderComparator {
  private options: FolderCompareOptions;
  private idCounter = 0;

  constructor(options: FolderCompareOptions = {}) {
    this.options = {
      ignorePatterns: options.ignorePatterns || ['node_modules', '.git', '.DS_Store'],
      includeHidden: options.includeHidden ?? false,
      maxDepth: options.maxDepth ?? 10,
      compareContent: options.compareContent ?? true,
    };
  }

  /**
   * Compare two folder structures
   */
  compare(leftFiles: File[], rightFiles: File[]): FileComparisonResult {
    // Build file trees from File arrays
    const leftTree = this.buildFileTree(leftFiles, 'left');
    const rightTree = this.buildFileTree(rightFiles, 'right');

    // Merge trees and compute differences
    const mergedTree = this.mergeTrees(leftTree, rightTree);

    // Calculate statistics
    const statistics = this.calculateStatistics(mergedTree);

    return {
      leftTree,
      rightTree,
      mergedTree,
      statistics,
    };
  }

  /**
   * Build a hierarchical tree from flat file list
   */
  private buildFileTree(files: File[], side: 'left' | 'right'): FileNode[] {
    const root = new Map<string, FileEntry>();

    // Process each file
    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      const parts = path.split('/');
      
      // Skip ignored patterns
      if (this.shouldIgnore(path)) continue;

      let currentLevel = root;
      let currentPath = '';

      // Build nested structure
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (i === parts.length - 1) {
          // It's a file
          currentLevel.set(part, {
            name: part,
            path: currentPath,
            type: 'file',
            size: file.size,
          });
        } else {
          // It's a folder
          if (!currentLevel.has(part)) {
            currentLevel.set(part, {
              name: part,
              path: currentPath,
              type: 'folder',
              children: new Map(),
            });
          }
          currentLevel = currentLevel.get(part)!.children!;
        }
      }
    }

    return this.convertToNodeArray(root);
  }

  /**
   * Convert Map structure to FileNode array
   */
  private convertToNodeArray(map: Map<string, FileEntry>, parentPath = ''): FileNode[] {
    const nodes: FileNode[] = [];

    for (const [name, entry] of map) {
      const path = parentPath ? `${parentPath}/${name}` : name;
      const extension = entry.type === 'file' ? name.split('.').pop() : undefined;

      const node: FileNode = {
        id: `node-${this.idCounter++}`,
        name: entry.name,
        path,
        type: entry.type,
        extension,
        size: entry.size,
      };

      if (entry.type === 'folder' && entry.children) {
        node.children = this.convertToNodeArray(entry.children, path);
      }

      nodes.push(node);
    }

    // Sort: folders first, then alphabetically
    return nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Merge two trees and compute status for each node
   */
  private mergeTrees(leftTree: FileNode[], rightTree: FileNode[]): FileNode[] {
    const leftMap = this.createPathMap(leftTree);
    const rightMap = this.createPathMap(rightTree);
    const allPaths = new Set([...leftMap.keys(), ...rightMap.keys()]);
    const merged: FileNode[] = [];

    for (const path of allPaths) {
      const leftNode = leftMap.get(path);
      const rightNode = rightMap.get(path);

      if (leftNode && rightNode) {
        // Node exists in both - check if modified
        const status: FileStatus = this.compareNodes(leftNode, rightNode) ? 'unchanged' : 'modified';
        
        const mergedNode: FileNode = {
          ...rightNode,
          status,
          additions: status === 'modified' ? this.countLines(rightNode) : undefined,
          deletions: status === 'modified' ? this.countLines(leftNode) : undefined,
          similarity: status === 'modified' ? this.calculateSimilarity(leftNode, rightNode) : undefined,
        };

        if (leftNode.children || rightNode.children) {
          mergedNode.children = this.mergeTrees(
            leftNode.children || [],
            rightNode.children || []
          );
        }

        merged.push(mergedNode);
      } else if (leftNode) {
        // Node only in left - removed
        merged.push({
          ...leftNode,
          status: 'removed' as FileStatus,
          children: leftNode.children ? this.markTreeStatus(leftNode.children, 'removed') : undefined,
        });
      } else if (rightNode) {
        // Node only in right - added
        merged.push({
          ...rightNode,
          status: 'added' as FileStatus,
          children: rightNode.children ? this.markTreeStatus(rightNode.children, 'added') : undefined,
        });
      }
    }

    return merged.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Create a map of paths to nodes for easy lookup
   */
  private createPathMap(tree: FileNode[], map = new Map<string, FileNode>()): Map<string, FileNode> {
    for (const node of tree) {
      map.set(node.path, node);
      if (node.children) {
        this.createPathMap(node.children, map);
      }
    }
    return map;
  }

  /**
   * Mark all nodes in a tree with a specific status
   */
  private markTreeStatus(tree: FileNode[], status: FileStatus): FileNode[] {
    return tree.map(node => ({
      ...node,
      status,
      children: node.children ? this.markTreeStatus(node.children, status) : undefined,
    }));
  }

  /**
   * Compare two nodes to check if they're the same
   */
  private compareNodes(left: FileNode, right: FileNode): boolean {
    if (left.type !== right.type) return false;
    if (left.type === 'file' && right.type === 'file') {
      // For now, just compare size
      // In a real implementation, we'd compare content
      return left.size === right.size;
    }
    return true;
  }

  /**
   * Calculate similarity between two files (mock implementation)
   */
  private calculateSimilarity(left: FileNode, right: FileNode): number {
    // Mock implementation - in reality would compare content
    if (left.size === right.size) return 100;
    if (!left.size || !right.size) return 0;
    
    const ratio = Math.min(left.size, right.size) / Math.max(left.size, right.size);
    return Math.round(ratio * 100);
  }

  /**
   * Count lines in a file (mock implementation)
   */
  private countLines(node: FileNode): number {
    // Mock implementation - would need actual content
    if (!node.size) return 0;
    // Estimate ~50 bytes per line
    return Math.max(1, Math.round(node.size / 50));
  }

  /**
   * Check if a path should be ignored
   */
  private shouldIgnore(path: string): boolean {
    if (!this.options.includeHidden && path.includes('/.')) {
      return true;
    }

    for (const pattern of this.options.ignorePatterns || []) {
      if (path.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate statistics from merged tree
   */
  private calculateStatistics(tree: FileNode[]): FileComparisonResult['statistics'] {
    const stats = {
      filesAdded: 0,
      filesRemoved: 0,
      filesModified: 0,
      filesUnchanged: 0,
      foldersAdded: 0,
      foldersRemoved: 0,
    };

    const countNodes = (nodes: FileNode[]) => {
      for (const node of nodes) {
        if (node.type === 'file') {
          switch (node.status) {
            case 'added': stats.filesAdded++; break;
            case 'removed': stats.filesRemoved++; break;
            case 'modified': stats.filesModified++; break;
            case 'unchanged': stats.filesUnchanged++; break;
          }
        } else if (node.type === 'folder') {
          switch (node.status) {
            case 'added': stats.foldersAdded++; break;
            case 'removed': stats.foldersRemoved++; break;
          }
        }

        if (node.children) {
          countNodes(node.children);
        }
      }
    };

    countNodes(tree);
    return stats;
  }
}