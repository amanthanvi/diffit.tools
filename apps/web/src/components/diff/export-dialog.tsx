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
} from "@diffit/ui/dialog";
import { Button } from "@diffit/ui/button";
import { Label } from "@diffit/ui/label";
import { RadioGroup, RadioGroupItem } from "@diffit/ui/radio-group";
import { Checkbox } from "@diffit/ui/checkbox";
import { useToast } from "@diffit/ui/use-toast";
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

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          diffId: "current", // TODO: Use actual diff ID
          format,
          includeLineNumbers,
          includeTimestamp,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diff-export.${format}`;
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