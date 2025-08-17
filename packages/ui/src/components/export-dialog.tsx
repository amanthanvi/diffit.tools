"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Label } from './label';
import { Switch } from './switch';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { cn } from '../lib/utils';
import { ExportService, type ExportFormat, type ExportOptions, type ExportData } from '../lib/export-service';
import {
  Download,
  FileText,
  FileCode,
  FileImage,
  FileJson,
  Loader2,
  Check,
  AlertCircle,
  Eye,
  Settings,
} from 'lucide-react';

export interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExportData;
  defaultFormat?: ExportFormat;
  onExport?: (format: ExportFormat) => void;
}

interface FormatOption {
  value: ExportFormat;
  label: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
}

const formatOptions: FormatOption[] = [
  {
    value: 'pdf',
    label: 'PDF Document',
    icon: FileImage,
    description: 'Printable document with formatting',
    badge: 'Popular',
  },
  {
    value: 'html',
    label: 'HTML File',
    icon: FileCode,
    description: 'Web page with interactive styling',
  },
  {
    value: 'markdown',
    label: 'Markdown',
    icon: FileText,
    description: 'Formatted text for documentation',
  },
  {
    value: 'json',
    label: 'JSON Data',
    icon: FileJson,
    description: 'Structured data for processing',
  },
  {
    value: 'text',
    label: 'Plain Text',
    icon: FileText,
    description: 'Simple text file',
  },
];

export const ExportDialog: React.FC<ExportDialogProps> = ({
  open,
  onOpenChange,
  data,
  defaultFormat = 'pdf',
  onExport,
}) => {
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>(defaultFormat);
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportSuccess, setExportSuccess] = React.useState(false);
  const [previewContent, setPreviewContent] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'format' | 'options' | 'preview'>('format');
  
  // Export options
  const [options, setOptions] = React.useState<ExportOptions>({
    format: selectedFormat,
    includeMetadata: true,
    includeInsights: true,
    includeLineNumbers: true,
    theme: 'light',
    title: data.metadata?.title || 'Diff Export',
    description: data.metadata?.description,
    timestamp: true,
    highlightSyntax: false,
  });

  // Update options when format changes
  React.useEffect(() => {
    setOptions(prev => ({ ...prev, format: selectedFormat }));
  }, [selectedFormat]);

  // Generate preview
  React.useEffect(() => {
    if (activeTab !== 'preview' || !open) return;

    const generatePreview = async () => {
      try {
        const blob = await ExportService.export(data, options);
        const text = await blob.text();
        
        // Truncate for preview
        const maxLength = 5000;
        if (text.length > maxLength) {
          setPreviewContent(text.substring(0, maxLength) + '\n\n... (truncated for preview)');
        } else {
          setPreviewContent(text);
        }
      } catch (error) {
        console.error('Failed to generate preview:', error);
        setPreviewContent('Failed to generate preview');
      }
    };

    generatePreview();
  }, [activeTab, data, options, open]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const blob = await ExportService.export(data, options);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `diff-${timestamp}.${ExportService.getFileExtension(options.format)}`;
      
      // Download file
      ExportService.download(blob, filename);
      
      setExportSuccess(true);
      onExport?.(options.format);
      
      // Close dialog after success
      setTimeout(() => {
        onOpenChange(false);
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export diff. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const selectedFormatOption = formatOptions.find(f => f.value === selectedFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Export Diff</DialogTitle>
          <DialogDescription>
            Choose a format and customize export options
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="options">Options</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4 mt-4">
            <RadioGroup value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as ExportFormat)}>
              <div className="grid gap-3">
                {formatOptions.map((format) => {
                  const Icon = format.icon;
                  return (
                    <label
                      key={format.value}
                      className={cn(
                        "flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors",
                        selectedFormat === format.value
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50"
                      )}
                    >
                      <RadioGroupItem value={format.value} />
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{format.label}</span>
                          {format.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {format.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format.description}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </RadioGroup>
          </TabsContent>

          <TabsContent value="options" className="space-y-4 mt-4">
            <div className="space-y-4">
              {/* Content Options */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Content</h4>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-metadata" className="text-sm">
                    Include metadata
                  </Label>
                  <Switch
                    id="include-metadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeMetadata: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-insights" className="text-sm">
                    Include statistics
                  </Label>
                  <Switch
                    id="include-insights"
                    checked={options.includeInsights}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeInsights: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="include-line-numbers" className="text-sm">
                    Include line numbers
                  </Label>
                  <Switch
                    id="include-line-numbers"
                    checked={options.includeLineNumbers}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, includeLineNumbers: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="timestamp" className="text-sm">
                    Add timestamp
                  </Label>
                  <Switch
                    id="timestamp"
                    checked={options.timestamp}
                    onCheckedChange={(checked) => 
                      setOptions(prev => ({ ...prev, timestamp: checked }))
                    }
                  />
                </div>
              </div>

              {/* Theme Options (for HTML/PDF) */}
              {(selectedFormat === 'html' || selectedFormat === 'pdf') && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium">Appearance</h4>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="theme" className="text-sm">
                      Color theme
                    </Label>
                    <select
                      id="theme"
                      className="w-32 border rounded px-2 py-1 text-sm"
                      value={options.theme}
                      onChange={(e) => 
                        setOptions(prev => ({ ...prev, theme: e.target.value as 'light' | 'dark' }))
                      }
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Preview</h4>
                <Badge variant="outline" className="text-xs">
                  {selectedFormatOption?.label}
                </Badge>
              </div>
              
              <div className="border rounded-lg p-4 bg-muted/30 max-h-[400px] overflow-auto">
                <pre className="text-xs font-mono whitespace-pre-wrap">
                  {previewContent || 'Generating preview...'}
                </pre>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  This is a preview of the export format. The actual file may contain more content.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : exportSuccess ? (
              <>
                <Check className="h-4 w-4 text-green-600" />
                Exported!
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};