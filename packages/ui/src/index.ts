// Core Components
export * from './components/button';
export * from './components/avatar';
export * from './components/badge';
export * from './components/card';
export * from './components/checkbox';
export * from './components/dialog';
export * from './components/dropdown-menu';
export * from './components/toast';
export * from './components/toaster';
export * from './components/skeleton';
export * from './components/switch';
export * from './components/input';
export * from './components/label';
export * from './components/select';
export * from './components/separator';
export * from './components/slider';
export * from './components/tabs';
export * from './components/toggle-group';
export * from './components/radio-group';
export * from './components/scroll-area';
export * from './components/progress';
export * from './components/alert';

// Advanced Components
export * from './components/command-palette';
export * from './components/diff-viewer';
export * from './components/virtualized-diff-viewer';
// Use simplified version temporarily to avoid react-window issues
export { EnhancedDiffViewer } from './components/enhanced-diff-viewer-simple';
export type { EnhancedDiffViewerProps } from './components/enhanced-diff-viewer-simple';
export * from './components/diff-insights';
export * from './components/diff-filters';
export * from './components/file-tree';
export * from './components/folder-diff-viewer';
export * from './components/share-dialog';
export * from './components/share-button';
export * from './components/export-dialog';
export * from './components/export-button';
export * from './components/pwa-install-prompt';
export * from './components/aria-live-region';
export * from './components/accessibility-settings';
export * from './components/file-browser';
export * from './components/code-editor';
export * from './components/theme-customizer';
export * from './components/toolbar';

// Hooks
export * from './hooks/use-theme';
export * from './hooks/use-toast';
export * from './hooks/use-service-worker';

// Utilities
export * from './lib/utils';
export * from './lib/animations';
export * from './lib/share-service';
export * from './lib/export-service';
export * from './lib/keyboard-navigation';

// Providers
export * from './providers/accessibility-provider';

// Re-export types
export type { Theme } from './hooks/use-theme';
export type { DiffLine, DiffHunk, DiffInsights, FileStatus } from './types/diff';
export type { DiffOptions } from './components/diff-filters';
export type { FileNode } from './components/file-tree';