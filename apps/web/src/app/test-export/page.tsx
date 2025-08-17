"use client";

import { useState } from "react";
import { 
  ExportButton, 
  ExportDialog,
  QuickExportBadge,
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Alert,
  AlertDescription,
} from "@diffit/ui";
import type { DiffLine, DiffInsights, ExportFormat } from "@diffit/ui";
import { FileText, Download, AlertCircle } from "lucide-react";

// Sample diff data
const sampleDiffLines: DiffLine[] = [
  { type: 'unchanged', content: 'function calculateSum(a, b) {', lineNumber: { old: 1, new: 1 } },
  { type: 'removed', content: '  return a + b;', lineNumber: { old: 2 } },
  { type: 'added', content: '  // Add support for third parameter', lineNumber: { new: 2 } },
  { type: 'added', content: '  return a + b + (c || 0);', lineNumber: { new: 3 } },
  { type: 'unchanged', content: '}', lineNumber: { old: 3, new: 4 } },
  { type: 'unchanged', content: '', lineNumber: { old: 4, new: 5 } },
  { type: 'unchanged', content: 'function main() {', lineNumber: { old: 5, new: 6 } },
  { type: 'removed', content: '  const result = calculateSum(5, 3);', lineNumber: { old: 6 } },
  { type: 'added', content: '  const result = calculateSum(5, 3, 2);', lineNumber: { new: 7 } },
  { type: 'removed', content: '  console.log("Result:", result);', lineNumber: { old: 7 } },
  { type: 'added', content: '  console.log("Sum Result:", result);', lineNumber: { new: 8 } },
  { type: 'added', content: '  console.log("Done!");', lineNumber: { new: 9 } },
  { type: 'unchanged', content: '}', lineNumber: { old: 8, new: 10 } },
];

const sampleInsights: DiffInsights = {
  totalChanges: 6,
  additions: 4,
  deletions: 2,
  modifications: 0,
  similarity: 75,
  largestChange: 2,
  fileCount: 1,
  changeIntensity: [0.2, 0.8, 0.1, 0.0, 0.5, 0.3, 0.9, 0.4],
};

const sampleMetadata = {
  title: 'Function Enhancement',
  description: 'Added optional third parameter and improved logging',
  leftFile: 'src/utils/math.js',
  rightFile: 'src/utils/math.js (modified)',
};

export default function TestExportPage() {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [lastExportedFormat, setLastExportedFormat] = useState<ExportFormat | null>(null);
  const [exportHistory, setExportHistory] = useState<Array<{ format: ExportFormat; timestamp: Date }>>([]);

  const handleExport = (format: ExportFormat) => {
    setLastExportedFormat(format);
    setExportHistory(prev => [...prev, { format, timestamp: new Date() }]);
    console.log(`Exported as ${format}`);
  };

  const largeDiffLines: DiffLine[] = Array.from({ length: 1000 }, (_, i) => ({
    type: i % 3 === 0 ? 'added' : i % 3 === 1 ? 'removed' : 'unchanged',
    content: `Line ${i + 1}: ${i % 3 === 0 ? 'Added content' : i % 3 === 1 ? 'Removed content' : 'Unchanged content'}`,
    lineNumber: {
      old: i % 3 !== 0 ? i + 1 : undefined,
      new: i % 3 !== 1 ? i + 1 : undefined,
    },
  } as DiffLine));

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Test Export Functionality</h1>
        <p className="text-muted-foreground">
          Test the multi-format export feature for diffs
        </p>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Export</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Options</TabsTrigger>
          <TabsTrigger value="large">Large Diff</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Quick Export Options</span>
                <ExportButton
                  lines={sampleDiffLines}
                  insights={sampleInsights}
                  metadata={sampleMetadata}
                  onExport={handleExport}
                />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Export with Different Configurations:</h3>
                  <div className="flex flex-wrap gap-2">
                    <ExportButton
                      lines={sampleDiffLines}
                      insights={sampleInsights}
                      metadata={sampleMetadata}
                      onExport={handleExport}
                      showDropdown={false}
                      variant="outline"
                      size="sm"
                    />
                    
                    <ExportButton
                      lines={sampleDiffLines}
                      insights={sampleInsights}
                      onExport={handleExport}
                      quickFormats={['pdf', 'html']}
                      variant="secondary"
                      size="sm"
                    />
                    
                    <ExportButton
                      lines={sampleDiffLines}
                      onExport={handleExport}
                      quickFormats={['markdown', 'json', 'text']}
                      variant="default"
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-3">Quick Export Badges:</h3>
                  <div className="flex gap-2">
                    <QuickExportBadge
                      format="pdf"
                      data={{
                        lines: sampleDiffLines,
                        insights: sampleInsights,
                        metadata: { ...sampleMetadata, createdAt: new Date().toISOString() },
                      }}
                    />
                    <QuickExportBadge
                      format="html"
                      data={{
                        lines: sampleDiffLines,
                        insights: sampleInsights,
                        metadata: { ...sampleMetadata, createdAt: new Date().toISOString() },
                      }}
                    />
                    <QuickExportBadge
                      format="markdown"
                      data={{
                        lines: sampleDiffLines,
                        insights: sampleInsights,
                        metadata: { ...sampleMetadata, createdAt: new Date().toISOString() },
                      }}
                    />
                  </div>
                </div>

                {lastExportedFormat && (
                  <Alert>
                    <Download className="h-4 w-4" />
                    <AlertDescription>
                      Last exported as <strong>{lastExportedFormat.toUpperCase()}</strong>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Export History</CardTitle>
            </CardHeader>
            <CardContent>
              {exportHistory.length > 0 ? (
                <div className="space-y-2">
                  {exportHistory.slice(-5).reverse().map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>Exported as {item.format.toUpperCase()}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No exports yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Export Dialog</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Test the advanced export dialog with preview and custom options
                </p>
                
                <Button onClick={() => setShowExportDialog(true)}>
                  <Download className="h-4 w-4 mr-2" />
                  Open Export Dialog
                </Button>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Available Formats:</h4>
                    <div className="space-y-1">
                      {(['pdf', 'html', 'markdown', 'json', 'text'] as ExportFormat[]).map(format => (
                        <div key={format} className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {format.toUpperCase()}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {format === 'pdf' && 'Best for printing'}
                            {format === 'html' && 'Web-ready with styling'}
                            {format === 'markdown' && 'For documentation'}
                            {format === 'json' && 'Machine-readable'}
                            {format === 'text' && 'Plain text format'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Export Options:</h4>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      <li>• Include/exclude metadata</li>
                      <li>• Include/exclude statistics</li>
                      <li>• Include/exclude line numbers</li>
                      <li>• Light/dark theme (HTML/PDF)</li>
                      <li>• Custom title and description</li>
                      <li>• Timestamp options</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="large" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Large Diff Export Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This tests export performance with a 1000-line diff
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <ExportButton
                    lines={largeDiffLines}
                    insights={{
                      ...sampleInsights,
                      totalChanges: 666,
                      additions: 333,
                      deletions: 333,
                    }}
                    metadata={{
                      title: 'Large Diff Test',
                      description: '1000 lines of changes',
                    }}
                    onExport={handleExport}
                    variant="outline"
                  />
                  
                  <Badge variant="secondary">
                    {largeDiffLines.length} lines
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>Performance considerations:</p>
                  <ul className="mt-2 space-y-1 ml-4">
                    <li>• HTML and Text exports are fastest</li>
                    <li>• PDF uses browser print dialog</li>
                    <li>• JSON includes all raw data</li>
                    <li>• Markdown is optimized for readability</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={{
          lines: sampleDiffLines,
          insights: sampleInsights,
          metadata: { ...sampleMetadata, createdAt: new Date().toISOString() },
        }}
        onExport={handleExport}
      />
    </div>
  );
}