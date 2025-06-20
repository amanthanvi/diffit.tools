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
} from "lucide-react";
import { Button } from "@diffit/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@diffit/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@diffit/ui/select";
import { Separator } from "@diffit/ui/separator";
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

export function DiffToolbar() {
  const router = useRouter();
  const [exportOpen, setExportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    syntax,
    setSyntax,
    diffMode,
    setDiffMode,
    canUndo,
    canRedo,
    undo,
    redo,
    clear,
    saveDiff,
  } = useDiffStore();

  const handleSave = () => {
    const diffId = saveDiff();
    router.push(`/my-diffs?saved=${diffId}`);
  };

  const handleCopy = () => {
    // TODO: Implement copy functionality
    console.log("Copy diff");
  };

  return (
    <>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Select value={syntax} onValueChange={setSyntax}>
            <SelectTrigger className="w-[140px] h-8">
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

          <Select value={diffMode} onValueChange={setDiffMode}>
            <SelectTrigger className="w-[100px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {diffModes.map((mode) => (
                <SelectItem key={mode.value} value={mode.value}>
                  {mode.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            title="Copy link"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            title="Save diff"
          >
            <Save className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
            title="Share diff"
          >
            <Share2 className="h-4 w-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Export diff">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                Export as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                Export as Markdown
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setExportOpen(true)}>
                Export as JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="outline" size="sm" onClick={clear}>
            Clear
          </Button>
        </div>
      </div>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </>
  );
}