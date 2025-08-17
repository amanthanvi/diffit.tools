"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './dialog';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Alert, AlertDescription } from './alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Badge } from './badge';
import { Progress } from './progress';
import { Switch } from './switch';
import { cn } from '../lib/utils';
import { ShareService, type ShareableData } from '../lib/share-service';
import {
  Copy,
  Check,
  Share2,
  Link,
  Download,
  Mail,
  Twitter,
  AlertCircle,
  Loader2,
  QrCode,
  Clock,
  Shield,
} from 'lucide-react';

export interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: Omit<ShareableData, 'version'>;
  title?: string;
  description?: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onOpenChange,
  data,
  title = 'Share Diff',
  description = 'Share this diff with others via a link',
}) => {
  const [shareUrl, setShareUrl] = React.useState<string>('');
  const [shortUrl, setShortUrl] = React.useState<string>('');
  const [copied, setCopied] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [shareMode, setShareMode] = React.useState<'link' | 'qr' | 'email'>('link');
  const [includeMetadata, setIncludeMetadata] = React.useState(true);
  const [expiresIn, setExpiresIn] = React.useState<'never' | '1h' | '24h' | '7d' | '30d'>('7d');
  const [shareTitle, setShareTitle] = React.useState(data.metadata?.title || '');
  const [shareDescription, setShareDescription] = React.useState(data.metadata?.description || '');

  // Calculate share size
  const shareSize = React.useMemo(() => {
    const shareData = {
      ...data,
      metadata: includeMetadata ? {
        createdAt: data.metadata?.createdAt || new Date().toISOString(),
        title: shareTitle || undefined,
        description: shareDescription || undefined,
        expiresAt: expiresIn !== 'never' ? calculateExpiryDate(expiresIn) : undefined,
      } : undefined,
    };
    
    return ShareService.getShareSize(shareData);
  }, [data, includeMetadata, shareTitle, shareDescription, expiresIn]);

  // Generate share URL
  React.useEffect(() => {
    if (!open) return;
    
    setIsGenerating(true);
    
    const shareData = {
      ...data,
      metadata: includeMetadata ? {
        createdAt: data.metadata?.createdAt || new Date().toISOString(),
        title: shareTitle || undefined,
        description: shareDescription || undefined,
        expiresAt: expiresIn !== 'never' ? calculateExpiryDate(expiresIn) : undefined,
      } : undefined,
    };
    
    const url = ShareService.generateShareUrl(shareData);
    setShareUrl(url);
    
    // Generate short URL (mock)
    ShareService.createShortLink(url).then(setShortUrl);
    
    setIsGenerating(false);
  }, [open, data, includeMetadata, shareTitle, shareDescription, expiresIn]);

  const handleCopy = React.useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, []);

  const handleShare = React.useCallback(async () => {
    if (!navigator.share) {
      handleCopy(shortUrl || shareUrl);
      return;
    }

    try {
      await navigator.share({
        title: shareTitle || 'Diff Comparison',
        text: shareDescription || 'Check out this diff comparison',
        url: shortUrl || shareUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Failed to share:', error);
      }
    }
  }, [shareUrl, shortUrl, shareTitle, shareDescription, handleCopy]);

  const handleEmailShare = React.useCallback(() => {
    const subject = encodeURIComponent(shareTitle || 'Diff Comparison');
    const body = encodeURIComponent(
      `${shareDescription || 'Check out this diff comparison'}\n\n${shortUrl || shareUrl}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }, [shareUrl, shortUrl, shareTitle, shareDescription]);

  const handleTwitterShare = React.useCallback(() => {
    const text = encodeURIComponent(
      `${shareTitle || 'Check out this diff'} ${shortUrl || shareUrl}`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`);
  }, [shareUrl, shortUrl, shareTitle]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Metadata Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-metadata">Include metadata</Label>
              <Switch
                id="include-metadata"
                checked={includeMetadata}
                onCheckedChange={setIncludeMetadata}
              />
            </div>

            {includeMetadata && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="share-title">Title (optional)</Label>
                  <Input
                    id="share-title"
                    placeholder="Enter a title for this diff"
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="share-description">Description (optional)</Label>
                  <Input
                    id="share-description"
                    placeholder="Add a description"
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expires-in">Link expires in</Label>
                  <select
                    id="expires-in"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={expiresIn}
                    onChange={(e) => setExpiresIn(e.target.value as typeof expiresIn)}
                  >
                    <option value="1h">1 hour</option>
                    <option value="24h">24 hours</option>
                    <option value="7d">7 days</option>
                    <option value="30d">30 days</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Size Warning */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Share size</span>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "font-mono",
                  shareSize.canShare ? "text-green-600" : "text-red-600"
                )}>
                  {formatBytes(shareSize.compressed)}
                </span>
                <Badge variant={shareSize.percentage < 50 ? "default" : "secondary"}>
                  {shareSize.percentage}% compressed
                </Badge>
              </div>
            </div>
            <Progress value={(shareSize.compressed / 32768) * 100} className="h-2" />
            
            {!shareSize.canShare && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This diff is too large for URL sharing. Consider using the download option instead.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Share Tabs */}
          <Tabs value={shareMode} onValueChange={(v) => setShareMode(v as typeof shareMode)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="link">
                <Link className="h-4 w-4 mr-2" />
                Link
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label>Share link</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={shortUrl || shareUrl}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(shortUrl || shareUrl)}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleTwitterShare}
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleEmailShare}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="mt-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="bg-white p-4 rounded-lg border">
                  {/* QR Code would be generated here */}
                  <div className="w-48 h-48 bg-muted flex items-center justify-center">
                    <QrCode className="h-24 w-24 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code to open the diff on another device
                </p>
              </div>
            </TabsContent>

            <TabsContent value="email" className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Send this diff via email with a secure link
                </p>
                <Button
                  className="w-full"
                  onClick={handleEmailShare}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Open Email Client
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          {/* Privacy Notice */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Privacy:</strong> Shared links contain the diff data in the URL. 
              No data is stored on our servers. Anyone with the link can view the diff.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleShare} disabled={!shareSize.canShare}>
            {isGenerating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4 mr-2" />
            )}
            Share
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper functions
function calculateExpiryDate(duration: '1h' | '24h' | '7d' | '30d'): string {
  const now = new Date();
  switch (duration) {
    case '1h':
      now.setHours(now.getHours() + 1);
      break;
    case '24h':
      now.setDate(now.getDate() + 1);
      break;
    case '7d':
      now.setDate(now.getDate() + 7);
      break;
    case '30d':
      now.setDate(now.getDate() + 30);
      break;
  }
  return now.toISOString();
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}