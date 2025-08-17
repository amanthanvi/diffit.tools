"use client";

import * as React from 'react';
import { Button, type ButtonProps } from './button';
import { ShareDialog } from './share-dialog';
import { ShareService, type ShareableData } from '../lib/share-service';
import { 
  Share2, 
  Link, 
  Download, 
  Copy, 
  Check,
  ExternalLink,
  Save,
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

export interface ShareButtonProps extends Omit<ButtonProps, 'onClick'> {
  data: Omit<ShareableData, 'version'>;
  onShare?: (url: string) => void;
  onSave?: () => void;
  onExport?: () => void;
  showDropdown?: boolean;
  shareTitle?: string;
  shareDescription?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  data,
  onShare,
  onSave,
  onExport,
  showDropdown = true,
  shareTitle,
  shareDescription,
  className,
  variant = 'outline',
  size = 'default',
  ...buttonProps
}) => {
  const [showShareDialog, setShowShareDialog] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [quickShareUrl, setQuickShareUrl] = React.useState<string>('');

  // Generate quick share URL
  React.useEffect(() => {
    const url = ShareService.generateShareUrl(data);
    setQuickShareUrl(url);
  }, [data]);

  const handleQuickCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(quickShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare?.(quickShareUrl);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [quickShareUrl, onShare]);

  const handleSaveLocal = React.useCallback(() => {
    const key = ShareService.generateShareCode();
    ShareService.saveToBrowser(key, {
      ...data,
      version: '1.0.0',
    });
    onSave?.();
  }, [data, onSave]);

  const handleExport = React.useCallback(() => {
    // Create a downloadable file
    const shareData = {
      ...data,
      version: '1.0.0',
      metadata: {
        ...data.metadata,
        createdAt: new Date().toISOString(),
      },
    };
    
    const blob = new Blob([JSON.stringify(shareData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    onExport?.();
  }, [data, onExport]);

  if (!showDropdown) {
    return (
      <>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => setShowShareDialog(true)}
          {...buttonProps}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        
        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          data={data}
          title={shareTitle}
          description={shareDescription}
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
            <Share2 className="h-4 w-4" />
            Share
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Share Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleQuickCopy}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                <span>Copy link</span>
              </>
            )}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => setShowShareDialog(true)}>
            <Link className="mr-2 h-4 w-4" />
            <span>Advanced sharing</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => window.open(quickShareUrl, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>Open in new tab</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleSaveLocal}>
            <Save className="mr-2 h-4 w-4" />
            <span>Save locally</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            <span>Export as file</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        data={data}
        title={shareTitle}
        description={shareDescription}
      />
    </>
  );
};

// Quick share badge component
export const ShareBadge: React.FC<{
  url: string;
  className?: string;
}> = ({ url, className }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [url]);

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md",
        "bg-muted hover:bg-muted/80 transition-colors",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-3 w-3 text-green-600" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Link className="h-3 w-3" />
          <span>Share</span>
        </>
      )}
    </button>
  );
};