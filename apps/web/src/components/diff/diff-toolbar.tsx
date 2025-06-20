"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Share2,
  Settings,
  Copy,
  Save,
  Undo,
  Redo,
  Columns2,
  FileText,
  Code2,
  Hash,
  Palette,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  EyeOff
} from "lucide-react";
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Separator,
  ToggleGroup,
  ToggleGroupItem
} from "@diffit/ui";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useDiffStore } from "@/stores/diff-store";
import { ExportDialog } from "@/components/diff/export-dialog";
import { ShareDialog } from "@/components/diff/share-dialog";
import { SettingsDialog } from "@/components/diff/settings-dialog";

const syntaxOptions = [
  { value: "text", label: "Plain Text" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "ruby", label: "Ruby" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "sql", label: "SQL" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "json", label: "JSON" },
  { value: "yaml", label: "YAML" },
  { value: "markdown", label: "Markdown" },
  { value: "xml", label: "XML" },
];

const diffModes = [
  { value: "unified", label: "Unified" },
  { value: "split", label: "Split" },
  { value: "inline", label: "Inline" },
];

interface DiffToolbarProps {
  diffMode?: 'split' | 'unified' | 'inline';
  onDiffModeChange?: (mode: 'split' | 'unified' | 'inline') => void;
  onExport?: () => void;
  onSettings?: () => void;
  onShare?: () => void;
}

export function DiffToolbar({ 
  diffMode: propDiffMode,
  onDiffModeChange,
  onExport, 
  onSettings, 
  onShare 
}: DiffToolbarProps = {}) {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [currentChange, setCurrentChange] = useState(1);
  const [totalChanges] = useState(5); // Will be calculated from actual diff

  const {
    syntax,
    setSyntax,
    diffMode: storeDiffMode,
    setDiffMode: setStoreDiffMode,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    saveDiff,
  } = useDiffStore();

  const diffMode = propDiffMode || storeDiffMode;
  const setDiffMode = onDiffModeChange || setStoreDiffMode;

  const handleSave = () => {
    const diffId = saveDiff();
    router.push(`/my-diffs?saved=${diffId}`);
  };

  const handleCopy = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
  };

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      setExportOpen(true);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      setShareOpen(true);
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    } else {
      setSettingsOpen(true);
    }
  };

  const navigateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && currentChange > 1) {
      setCurrentChange(currentChange - 1);
    } else if (direction === 'next' && currentChange < totalChanges) {
      setCurrentChange(currentChange + 1);
    }
  };

  return (
    <>
      <div className="border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-4">
            {/* View Mode Selector */}
            <ToggleGroup 
              type="single" 
              value={diffMode} 
              onValueChange={(value) => value && setDiffMode(value as any)}
              className="bg-white dark:bg-gray-900 rounded-lg p-1 shadow-sm"
            >
              <ToggleGroupItem 
                value="split" 
                aria-label="Split view"
                className="data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300"
              >
                <Columns2 className="h-4 w-4 mr-1" />
                Split
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="unified" 
                aria-label="Unified view"
                className="data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300"
              >
                <FileText className="h-4 w-4 mr-1" />
                Unified
              </ToggleGroupItem>
              <ToggleGroupItem 
                value="inline" 
                aria-label="Inline view"
                className="data-[state=on]:bg-blue-100 dark:data-[state=on]:bg-blue-900 data-[state=on]:text-blue-700 dark:data-[state=on]:text-blue-300"
              >
                <Code2 className="h-4 w-4 mr-1" />
                Inline
              </ToggleGroupItem>
            </ToggleGroup>

            {/* Syntax Selector */}
            <Select value={syntax} onValueChange={setSyntax}>
              <SelectTrigger className="w-[140px] h-9 bg-white dark:bg-gray-900 shadow-sm">
                <Palette className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {syntaxOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Additional Options */}
            <div className="flex items-center gap-2 border-l pl-4 border-gray-300 dark:border-gray-600">
              <Button 
                variant="ghost" 
                size="sm" 
                className={cn(
                  "gap-1",
                  showLineNumbers && "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                )}
                onClick={() => setShowLineNumbers(!showLineNumbers)}
              >
                <Hash className="h-4 w-4" />
                Lines
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Search className="h-4 w-4" />
                Find
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 mr-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
                className="h-8 w-8"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={!canRedo}
                title="Redo (Ctrl+Shift+Z)"
                className="h-8 w-8"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 mr-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => navigateChange('prev')}
                disabled={currentChange === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
                {currentChange} of {totalChanges}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={() => navigateChange('next')}
                disabled={currentChange === totalChanges}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleShare}
              className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 hover:bg-green-50 dark:hover:bg-green-900/20"
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  Export as HTML
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  Export as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport}>
                  Export as JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSettings}
              className="h-8 w-8"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}