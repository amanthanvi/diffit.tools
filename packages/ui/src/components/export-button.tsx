"use client";

import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { ExportDialog } from './export-dialog';
import { ExportService, type ExportFormat, type ExportData } from '../lib/export-service';
import { 
  Download,
  FileText,
  FileCode,
  FileImage,
  FileJson,
  ChevronDown,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '../lib/utils';
import type { DiffLine, DiffInsights } from '../types/diff';

export interface ExportButtonProps extends Omit<ButtonProps, 'onClick'> {
  lines: DiffLine[];
  insights?: DiffInsights;
  metadata?: {
    title?: string;
    description?: string;
    leftFile?: string;
    rightFile?: string;
  };
  onExport?: (format: ExportFormat) => void;
  showDropdown?: boolean;
  quickFormats?: ExportFormat[];
}

const formatIcons: Record<ExportFormat, React.ElementType> = {
  pdf: FileImage,
  html: FileCode,
  markdown: FileText,
  json: FileJson,
  text: FileText,
};

const formatLabels: Record<ExportFormat, string> = {
  pdf: 'Export as PDF',
  html: 'Export as HTML',
  markdown: 'Export as Markdown',
  json: 'Export as JSON',
  text: 'Export as Text',
};

export const ExportButton: React.FC<ExportButtonProps> = ({
  lines,
  insights,
  metadata,
  onExport,
  showDropdown = true,
  quickFormats = ['pdf', 'html', 'markdown'],
  className,
  variant = 'outline',
  size = 'default',
  ...buttonProps
}) => {
  const [showExportDialog, setShowExportDialog] = React.useState(false);
  const [selectedFormat, setSelectedFormat] = React.useState<ExportFormat>('pdf');

  const exportData: ExportData = React.useMemo(() => ({
    lines,
    insights,
    metadata: {
      ...metadata,
      createdAt: new Date().toISOString(),
    },
  }), [lines, insights, metadata]);

  const handleQuickExport = React.useCallback(async (format: ExportFormat) => {
    try {
      const options = {
        format,
        includeMetadata: true,
        includeInsights: true,
        includeLineNumbers: true,
        theme: 'light' as const,
        title: metadata?.title,
        description: metadata?.description,
        timestamp: true,
        highlightSyntax: false,
      };

      const blob = await ExportService.export(exportData, options);
      
      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `diff-${timestamp}.${ExportService.getFileExtension(format)}`;
      
      // Download file
      ExportService.download(blob, filename);
      
      onExport?.(format);
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
      alert(`Failed to export as ${format}. Please try again.`);
    }
  }, [exportData, metadata, onExport]);

  const handleDialogExport = React.useCallback((format: ExportFormat) => {
    onExport?.(format);
  }, [onExport]);

  if (!showDropdown) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowExportDialog(true)}
          {...buttonProps}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        
        <ExportDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          data={exportData}
          defaultFormat={selectedFormat}
          onExport={handleDialogExport}
        />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={cn("gap-2", className)}
            {...buttonProps}
          >
            <Download className="h-4 w-4" />
            Export
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Quick Export</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {quickFormats.map((format) => {
            const Icon = formatIcons[format];
            return (
              <DropdownMenuItem
                key={format}
                onClick={() => handleQuickExport(format)}
              >
                <Icon className="mr-2 h-4 w-4" />
                <span>{formatLabels[format]}</span>
              </DropdownMenuItem>
            );
          })}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            onClick={() => {
              setShowExportDialog(true);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>More options...</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        data={exportData}
        defaultFormat={selectedFormat}
        onExport={handleDialogExport}
      />
    </>
  );
};

// Quick export badge for inline use
export const QuickExportBadge: React.FC<{
  format: ExportFormat;
  data: ExportData;
  className?: string;
}> = ({ format, data, className }) => {
  const [isExporting, setIsExporting] = React.useState(false);
  const Icon = formatIcons[format];

  const handleExport = React.useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const options = {
        format,
        includeMetadata: true,
        includeInsights: true,
        includeLineNumbers: true,
        theme: 'light' as const,
        timestamp: true,
        highlightSyntax: false,
      };

      const blob = await ExportService.export(data, options);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `diff-${timestamp}.${ExportService.getFileExtension(format)}`;
      
      ExportService.download(blob, filename);
    } catch (error) {
      console.error(`Failed to export as ${format}:`, error);
    } finally {
      setIsExporting(false);
    }
  }, [format, data, isExporting]);

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
        "bg-muted hover:bg-muted/80 transition-colors disabled:opacity-50",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{format.toUpperCase()}</span>
    </button>
  );
};