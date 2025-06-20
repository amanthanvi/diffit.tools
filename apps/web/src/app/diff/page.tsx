"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  Upload, 
  Download, 
  Share2, 
  Settings, 
  Command,
  Eye,
  Code2,
  FileCode,
  Zap,
  GitCompare,
  Sparkles,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Search,
  Hash,
  Type,
  Clock,
  BarChart3,
  AlertCircle
} from "lucide-react";

import { SimpleHeader } from "@/components/layout/simple-header";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { DiffToolbar } from "@/components/diff/diff-toolbar";
import { FileUpload } from "@/components/diff/file-upload";
import { ExportDialog } from "@/components/diff/export-dialog";
import { SettingsDialog } from "@/components/diff/settings-dialog";
import { ShareDialog } from "@/components/diff/share-dialog";
import { CommandPalette } from "@/components/command-palette";
import { Button } from "@diffit/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@diffit/ui";
import { Badge } from "@diffit/ui";
import { Card } from "@diffit/ui";
import { Separator } from "@diffit/ui";
import { cn } from "@/lib/utils";
import { useDiffStore } from "@/stores/diff-store";
import { useRecentDiffsStore } from "@/stores/recent-diffs-store";
import { useHotkeys } from "@/hooks/use-hotkeys";

interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
  similarity: number;
}

export default function DiffPage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [showDiff, setShowDiff] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [diffStats, setDiffStats] = useState<DiffStats | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  
  const { setLeftContent, setRightContent, diffMode, setDiffMode } = useDiffStore();
  const { addRecentDiff } = useRecentDiffsStore();

  // Initialize diff store when text changes
  useEffect(() => {
    setLeftContent(leftText);
    setRightContent(rightText);
  }, [leftText, rightText, setLeftContent, setRightContent]);

  // Calculate diff statistics
  useEffect(() => {
    if (showDiff && (leftText || rightText)) {
      // Simple diff stats calculation (will be enhanced with WebAssembly)
      const leftLines = leftText.split('\n');
      const rightLines = rightText.split('\n');
      const maxLines = Math.max(leftLines.length, rightLines.length);
      let additions = 0;
      let deletions = 0;
      let modifications = 0;
      
      for (let i = 0; i < maxLines; i++) {
        if (i >= leftLines.length) {
          additions++;
        } else if (i >= rightLines.length) {
          deletions++;
        } else if (leftLines[i] !== rightLines[i]) {
          modifications++;
        }
      }
      
      const totalChanges = additions + deletions + modifications;
      const similarity = totalChanges === 0 ? 100 : 
        Math.max(0, 100 - (totalChanges / maxLines * 100));
      
      setDiffStats({
        additions,
        deletions,
        modifications,
        similarity: Math.round(similarity)
      });
    }
  }, [showDiff, leftText, rightText]);

  // Keyboard shortcuts
  useHotkeys([
    ['cmd+k', () => setShowCommandPalette(true)],
    ['cmd+e', () => setShowExportDialog(true)],
    ['cmd+s', () => setShowShareDialog(true)],
    ['cmd+,', () => setShowSettingsDialog(true)],
    ['cmd+enter', handleCompare],
    ['cmd+shift+c', handleClear],
    ['cmd+f', () => setIsFullscreen(!isFullscreen)],
  ]);

  const handleCompare = useCallback(() => {
    if (leftText || rightText) {
      setShowDiff(true);
      // Add to recent diffs
      addRecentDiff({
        id: Date.now().toString(),
        title: `Comparison ${new Date().toLocaleString()}`,
        leftContent: leftText,
        rightContent: rightText,
        createdAt: new Date(),
        type: 'text'
      });
    }
  }, [leftText, rightText, addRecentDiff]);

  const handleClear = useCallback(() => {
    setLeftText("");
    setRightText("");
    setShowDiff(false);
    setDiffStats(null);
  }, []);

  const handleCopy = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleFileUpload = useCallback((side: 'left' | 'right', content: string) => {
    if (side === 'left') {
      setLeftText(content);
    } else {
      setRightText(content);
    }
  }, []);

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {!isFullscreen && <SimpleHeader />}
      
      {/* Animated background elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-purple-300 opacity-20 blur-3xl dark:bg-purple-900" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300 opacity-20 blur-3xl dark:bg-blue-900" />
      </div>

      <div className={cn(
        "container mx-auto px-4",
        isFullscreen ? "h-screen py-4" : "py-8"
      )}>
        {/* Modern Header with Stats */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-30" />
                <h1 className="relative text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Advanced Diff Tool
                </h1>
              </div>
              {diffStats && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Badge variant="secondary" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    {diffStats.similarity}% Similar
                  </Badge>
                </motion.div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCommandPalette(true)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Command className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSettingsDialog(true)}
                className="hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Separator orientation="vertical" className="h-8 mx-2" />
              <Button
                onClick={handleCompare}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-600/20"
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Compare
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                className="border-gray-300 dark:border-gray-700"
              >
                Clear
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Diff Stats Bar */}
        {showDiff && diffStats && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500" />
                    <span className="text-sm font-medium">+{diffStats.additions} additions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium">-{diffStats.deletions} deletions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="text-sm font-medium">~{diffStats.modifications} modifications</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowShareDialog(true)}
                    className="gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Input Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="text" className="gap-2">
              <Type className="h-4 w-4" />
              Text
            </TabsTrigger>
            <TabsTrigger value="file" className="gap-2">
              <FileText className="h-4 w-4" />
              File
            </TabsTrigger>
            <TabsTrigger value="code" className="gap-2">
              <Code2 className="h-4 w-4" />
              Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="text" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="h-full border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">Original Text</h3>
                      <div className="flex items-center gap-2">
                        <FileUpload onUpload={(content) => handleFileUpload('left', content)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(leftText)}
                          className="h-8 w-8"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={leftText}
                    onChange={(e) => setLeftText(e.target.value)}
                    className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none bg-transparent"
                    placeholder="Paste or type your original text here..."
                    spellCheck={false}
                  />
                </Card>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="h-full border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-700 dark:text-gray-300">Modified Text</h3>
                      <div className="flex items-center gap-2">
                        <FileUpload onUpload={(content) => handleFileUpload('right', content)} />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(rightText)}
                          className="h-8 w-8"
                        >
                          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={rightText}
                    onChange={(e) => setRightText(e.target.value)}
                    className="w-full h-96 p-4 font-mono text-sm resize-none focus:outline-none bg-transparent"
                    placeholder="Paste or type your modified text here..."
                    spellCheck={false}
                  />
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="file" className="mt-6">
            <Card className="p-8 border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">File Upload</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">Drag and drop files or click to browse</p>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                  <FileUpload onUpload={(content) => handleFileUpload('left', content)} label="Upload Original" />
                  <FileUpload onUpload={(content) => handleFileUpload('right', content)} label="Upload Modified" />
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="mt-6">
            <Card className="p-8 border-gray-200 dark:border-gray-700">
              <div className="text-center">
                <FileCode className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Code Comparison</h3>
                <p className="text-gray-600 dark:text-gray-400">Advanced code diff with syntax highlighting coming soon!</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Diff Result */}
        <AnimatePresence>
          {showDiff && (leftText || rightText) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden">
                <DiffToolbar
                  diffMode={diffMode}
                  onDiffModeChange={setDiffMode}
                  onExport={() => setShowExportDialog(true)}
                  onShare={() => setShowShareDialog(true)}
                />
                <div className="relative">
                  <DiffViewer />
                  {/* Gradient fade at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-white dark:from-gray-900 to-transparent pointer-events-none" />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Dialogs */}
      <CommandPalette open={showCommandPalette} onOpenChange={setShowCommandPalette} />
      <ExportDialog open={showExportDialog} onOpenChange={setShowExportDialog} />
      <SettingsDialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog} />
      <ShareDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
    </div>
  );
}