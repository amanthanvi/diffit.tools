"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  useToast
} from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [format, setFormat] = useState("pdf");
  const [includeLineNumbers, setIncludeLineNumbers] = useState(true);
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { leftContent, rightContent } = useDiffStore();

  const openPrintView = () => {
    const data = {
      leftContent,
      rightContent,
      includeLineNumbers,
      includeTimestamp,
      timestamp: new Date().toISOString()
    };
    const encodedData = btoa(JSON.stringify(data));
    const printWindow = window.open(`/print/${encodedData}`, '_blank');
    if (printWindow) {
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
        }, 500);
      });
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Generate export content directly without API call since no auth required
      const timestamp = new Date().toISOString();
      let content: string;
      let filename: string;
      let mimeType: string;

      switch (format) {
        case "html":
          content = generateHTMLExport();
          filename = `diff-export-${Date.now()}.html`;
          mimeType = "text/html";
          break;
        case "markdown":
          content = generateMarkdownExport();
          filename = `diff-export-${Date.now()}.md`;
          mimeType = "text/markdown";
          break;
        case "json":
          content = JSON.stringify({
            leftContent,
            rightContent,
            timestamp: includeTimestamp ? timestamp : undefined,
            includeLineNumbers,
          }, null, 2);
          filename = `diff-export-${Date.now()}.json`;
          mimeType = "application/json";
          break;
        case "pdf":
          // Open print-friendly page for PDF export
          openPrintView();
          onOpenChange(false);
          return;
        default:
          throw new Error("Unsupported format");
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: `Your diff has been exported as ${format.toUpperCase()}`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export diff. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const generateHTMLExport = () => {
    const timestamp = new Date().toISOString();
    return `<!DOCTYPE html>
<html>
<head>
  <title>Diff Export</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
      margin: 40px;
      line-height: 1.6;
    }
    .header { border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; margin-bottom: 30px; }
    .diff-container { display: flex; gap: 20px; }
    .diff-side { flex: 1; }
    .diff-side h3 { color: #374151; margin-bottom: 10px; }
    pre { 
      background: #f8f9fa; 
      padding: 15px; 
      border-radius: 6px; 
      overflow-x: auto; 
      white-space: pre-wrap; 
      ${includeLineNumbers ? 'counter-reset: line-number;' : ''}
    }
    ${includeLineNumbers ? `
    .line-numbers pre {
      counter-increment: line-number;
    }
    .line-numbers pre::before {
      content: counter(line-number);
      display: inline-block;
      width: 30px;
      text-align: right;
      margin-right: 15px;
      color: #6b7280;
      border-right: 1px solid #e5e5e5;
      padding-right: 10px;
    }` : ''}
  </style>
</head>
<body>
  <div class="header">
    <h1>Diff Export</h1>
    ${includeTimestamp ? `<p>Generated: ${timestamp}</p>` : ''}
  </div>
  <div class="diff-container">
    <div class="diff-side">
      <h3>Original</h3>
      <div class="${includeLineNumbers ? 'line-numbers' : ''}">
        <pre>${leftContent || '(empty)'}</pre>
      </div>
    </div>
    <div class="diff-side">
      <h3>Modified</h3>
      <div class="${includeLineNumbers ? 'line-numbers' : ''}">
        <pre>${rightContent || '(empty)'}</pre>
      </div>
    </div>
  </div>
</body>
</html>`;
  };

  const generateMarkdownExport = () => {
    const timestamp = new Date().toISOString();
    return `# Diff Export

${includeTimestamp ? `**Generated:** ${timestamp}\n` : ''}

## Original

\`\`\`
${leftContent || '(empty)'}
\`\`\`

## Modified

\`\`\`
${rightContent || '(empty)'}
\`\`\`
`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Diff</DialogTitle>
          <DialogDescription>
            Choose your export format and options
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  PDF Document
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html" />
                <Label htmlFor="html" className="cursor-pointer">
                  HTML File
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="markdown" id="markdown" />
                <Label htmlFor="markdown" className="cursor-pointer">
                  Markdown
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="json" id="json" />
                <Label htmlFor="json" className="cursor-pointer">
                  JSON Data
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="line-numbers"
                  checked={includeLineNumbers}
                  onCheckedChange={(checked) =>
                    setIncludeLineNumbers(checked as boolean)
                  }
                />
                <Label htmlFor="line-numbers" className="cursor-pointer">
                  Include line numbers
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="timestamp"
                  checked={includeTimestamp}
                  onCheckedChange={(checked) =>
                    setIncludeTimestamp(checked as boolean)
                  }
                />
                <Label htmlFor="timestamp" className="cursor-pointer">
                  Include timestamp
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}