"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ShareService, type ShareableData } from "@diffit/ui";
import { EnhancedDiffViewer, DiffInsightsPanel, Card, CardContent, CardHeader, CardTitle, Badge, Button, Alert, AlertDescription } from "@diffit/ui";
import { useDiffEngine } from "@/hooks/use-diff-engine";
import type { DiffLine, DiffInsights } from "@diffit/ui";
import { 
  Share2, 
  Copy, 
  Download, 
  Check, 
  AlertCircle,
  Clock,
  User,
  FileText,
  Home,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function SharedDiffPage() {
  const [shareData, setShareData] = useState<ShareableData | null>(null);
  const [diffLines, setDiffLines] = useState<DiffLine[]>([]);
  const [diffInsights, setDiffInsights] = useState<DiffInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { computeDiff } = useDiffEngine();

  // Get the share data from URL
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    
    if (!hash) {
      setError("No share data found in URL");
      setIsLoading(false);
      return;
    }

    try {
      // Parse the share data from URL
      const data = ShareService.parseShareUrl(window.location.href);
      
      if (!data) {
        setError("Invalid or corrupted share data");
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (data.metadata?.expiresAt) {
        const expiryDate = new Date(data.metadata.expiresAt);
        if (expiryDate < new Date()) {
          setError("This shared diff has expired");
          setIsLoading(false);
          return;
        }
      }

      setShareData(data);

      // Compute the diff
      if (data.leftContent !== undefined && data.rightContent !== undefined) {
        computeDiff(
          data.leftContent,
          data.rightContent,
          {
            ignoreWhitespace: data.options?.ignoreWhitespace || false,
            ignoreCase: data.options?.ignoreCase || false,
            contextLines: data.options?.contextLines || 3,
            lineNumbers: true,
          }
        ).then(result => {
          // Convert to DiffLine format
          const lines: DiffLine[] = [];
          
          for (const hunk of result.hunks) {
            for (const change of hunk.changes) {
              if (change.type === 'added') {
                lines.push({
                  type: 'added',
                  content: change.content,
                  lineNumber: { new: change.newLineNumber }
                });
              } else if (change.type === 'removed') {
                lines.push({
                  type: 'removed',
                  content: change.content,
                  lineNumber: { old: change.oldLineNumber }
                });
              } else if (change.type === 'modified') {
                lines.push({
                  type: 'removed',
                  content: change.content.split('\n')[0]?.replace(/^-/, '') || '',
                  lineNumber: { old: change.oldLineNumber }
                });
                lines.push({
                  type: 'added',
                  content: change.content.split('\n')[1]?.replace(/^\+/, '') || '',
                  lineNumber: { new: change.newLineNumber }
                });
              } else {
                lines.push({
                  type: 'unchanged',
                  content: change.content,
                  lineNumber: { 
                    old: change.oldLineNumber, 
                    new: change.newLineNumber 
                  }
                });
              }
            }
          }

          setDiffLines(lines);
          if (result.insights) {
            setDiffInsights(result.insights);
          }
          setIsLoading(false);
        }).catch(err => {
          console.error("Failed to compute diff:", err);
          setError("Failed to process diff data");
          setIsLoading(false);
        });
      } else {
        setError("Missing diff content");
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Failed to parse share data:", err);
      setError("Failed to load shared diff");
      setIsLoading(false);
    }
  }, [computeDiff]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleDownload = () => {
    if (!shareData) return;
    
    const blob = new Blob([JSON.stringify(shareData, null, 2)], {
      type: 'application/json',
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diff-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-lg font-medium">Loading shared diff...</p>
          <p className="text-sm text-muted-foreground mt-2">Please wait while we process the data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Error Loading Diff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <div className="flex gap-2">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </Link>
              <Button 
                variant="default" 
                className="flex-1"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!shareData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">No diff data available</p>
            <Link href="/">
              <Button variant="outline" className="w-full mt-4">
                <Home className="h-4 w-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Diffit
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Shared Diff</Badge>
                {shareData.type && (
                  <Badge variant="outline">{shareData.type}</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      {shareData.metadata && (
        <div className="container mx-auto px-4 py-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{shareData.metadata.title || "Untitled Diff"}</span>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {shareData.metadata.createdAt && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(shareData.metadata.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {shareData.metadata.expiresAt && (
                    <Badge variant="outline" className="text-xs">
                      Expires {new Date(shareData.metadata.expiresAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardTitle>
              {shareData.metadata.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {shareData.metadata.description}
                </p>
              )}
            </CardHeader>
          </Card>
        </div>
      )}

      {/* File names */}
      {(shareData.leftName || shareData.rightName) && (
        <div className="container mx-auto px-4 pb-4">
          <div className="flex items-center gap-4 text-sm">
            {shareData.leftName && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{shareData.leftName}</span>
              </div>
            )}
            {shareData.leftName && shareData.rightName && (
              <span className="text-muted-foreground">→</span>
            )}
            {shareData.rightName && (
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{shareData.rightName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <div className="space-y-4">
          {/* Insights */}
          {diffInsights && (
            <DiffInsightsPanel insights={diffInsights} />
          )}

          {/* Diff Viewer */}
          <Card>
            <CardContent className="p-0">
              <EnhancedDiffViewer
                lines={diffLines}
                showLineNumbers={true}
                showMinimap={true}
                height={600}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t py-4">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Powered by{" "}
              <Link href="/" className="font-medium hover:underline">
                Diffit.tools
              </Link>
            </p>
            <p>
              No data is stored on our servers. All diff data is contained in the URL.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}