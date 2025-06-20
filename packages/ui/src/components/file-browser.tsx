"use client";

import * as React from 'react';
import { ChevronRight, File, Folder, Search } from 'lucide-react';
import { cn, formatFileSize } from '../lib/utils';
import { Input } from './input';
import { ScrollArea } from './scroll-area';
import { Button } from './button';
import { Skeleton } from './skeleton';

export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modified?: Date;
  children?: FileItem[];
}

export interface FileBrowserProps {
  files: FileItem[];
  selectedPath?: string;
  onSelect?: (file: FileItem) => void;
  onOpen?: (file: FileItem) => void;
  loading?: boolean;
  searchable?: boolean;
  className?: string;
}

const FileBrowser = React.forwardRef<HTMLDivElement, FileBrowserProps>(
  (
    {
      files,
      selectedPath,
      onSelect,
      onOpen,
      loading = false,
      searchable = true,
      className,
    },
    ref
  ) => {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(
      new Set()
    );

    const toggleFolder = (path: string) => {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        if (next.has(path)) {
          next.delete(path);
        } else {
          next.add(path);
        }
        return next;
      });
    };

    const filterFiles = (items: FileItem[], query: string): FileItem[] => {
      if (!query) return items;

      return items.reduce<FileItem[]>((acc, item) => {
        const matchesQuery = item.name
          .toLowerCase()
          .includes(query.toLowerCase());

        if (item.type === 'file' && matchesQuery) {
          acc.push(item);
        } else if (item.type === 'folder' && item.children) {
          const filteredChildren = filterFiles(item.children, query);
          if (filteredChildren.length > 0 || matchesQuery) {
            acc.push({
              ...item,
              children: filteredChildren,
            });
          }
        }

        return acc;
      }, []);
    };

    const renderFileTree = (items: FileItem[], level = 0) => {
      const filteredItems = filterFiles(items, searchQuery);

      return filteredItems.map((item) => {
        const isExpanded = expandedFolders.has(item.path);
        const isSelected = selectedPath === item.path;

        return (
          <div key={item.id}>
            <button
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-sm text-sm',
                isSelected && 'bg-accent',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (item.type === 'folder') {
                  toggleFolder(item.path);
                }
                onSelect?.(item);
              }}
              onDoubleClick={() => {
                if (item.type === 'file') {
                  onOpen?.(item);
                }
              }}
              aria-expanded={item.type === 'folder' ? isExpanded : undefined}
              aria-selected={isSelected}
            >
              {item.type === 'folder' && (
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              )}
              {item.type === 'folder' ? (
                <Folder className="h-4 w-4 shrink-0 text-blue-500" />
              ) : (
                <File className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate flex-1 text-left">{item.name}</span>
              {item.type === 'file' && item.size !== undefined && (
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(item.size)}
                </span>
              )}
            </button>
            {item.type === 'folder' &&
              isExpanded &&
              item.children &&
              renderFileTree(item.children, level + 1)}
          </div>
        );
      });
    };

    if (loading) {
      return (
        <div className={cn('space-y-2 p-4', className)} ref={ref}>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-6 w-2/3" />
        </div>
      );
    }

    return (
      <div className={cn('flex flex-col h-full', className)} ref={ref}>
        {searchable && (
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                aria-label="Search files"
              />
            </div>
          </div>
        )}
        <ScrollArea className="flex-1">
          <div className="p-2" role="tree">
            {renderFileTree(files)}
          </div>
        </ScrollArea>
      </div>
    );
  }
);

FileBrowser.displayName = 'FileBrowser';

export { FileBrowser };