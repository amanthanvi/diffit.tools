"use client";

import { useState } from "react";
import { ShareButton, ShareBadge, Card, CardContent, CardHeader, CardTitle, Button } from "@diffit/ui";
import { useDiffStore } from "@/stores/diff-store";
import { DiffViewer } from "@/components/diff/diff-viewer-wrapper";
import type { ShareableData } from "@diffit/ui";

const sampleLeft = `function calculateSum(a, b) {
  return a + b;
}

function main() {
  const result = calculateSum(5, 3);
  console.log("Result:", result);
}`;

const sampleRight = `function calculateSum(a, b, c = 0) {
  return a + b + c;
}

function main() {
  const result = calculateSum(5, 3, 2);
  console.log("Sum Result:", result);
  console.log("Done!");
}`;

export default function TestSharePage() {
  const { setLeftContent, setRightContent } = useDiffStore();
  const [shareUrl, setShareUrl] = useState<string>("");
  const [showShareBadge, setShowShareBadge] = useState(false);

  // Set sample content on load
  useState(() => {
    setLeftContent(sampleLeft);
    setRightContent(sampleRight);
  });

  const shareData: Omit<ShareableData, 'version'> = {
    type: 'text',
    leftContent: sampleLeft,
    rightContent: sampleRight,
    leftName: 'original.js',
    rightName: 'modified.js',
    options: {
      ignoreWhitespace: false,
      ignoreCase: false,
      contextLines: 3,
    },
    metadata: {
      title: 'Function Enhancement Demo',
      description: 'Added optional parameter and improved logging',
      createdAt: new Date().toISOString(),
    },
  };

  const handleShare = (url: string) => {
    setShareUrl(url);
    setShowShareBadge(true);
    console.log('Shared URL:', url);
  };

  const handleSave = () => {
    console.log('Diff saved locally');
    alert('Diff saved to browser storage!');
  };

  const handleExport = () => {
    console.log('Diff exported');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Test Share Functionality</h1>
        <p className="text-muted-foreground">
          Test the URL-based sharing feature for diffs
        </p>
      </div>

      <div className="space-y-4">
        {/* Share Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Share Options</span>
              <div className="flex items-center gap-2">
                {showShareBadge && shareUrl && (
                  <ShareBadge url={shareUrl} />
                )}
                <ShareButton
                  data={shareData}
                  onShare={handleShare}
                  onSave={handleSave}
                  onExport={handleExport}
                  shareTitle="Function Enhancement Demo"
                  shareDescription="Example of sharing a diff comparison"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Test Different Share Methods:</h3>
                <div className="flex gap-2">
                  <ShareButton
                    data={shareData}
                    showDropdown={false}
                    variant="outline"
                    size="sm"
                    shareTitle="Quick Share Test"
                  />
                  
                  <ShareButton
                    data={{
                      ...shareData,
                      leftContent: "Small content",
                      rightContent: "Small change",
                    }}
                    variant="default"
                    size="sm"
                    shareTitle="Small Diff Test"
                  />
                  
                  <ShareButton
                    data={{
                      ...shareData,
                      leftContent: sampleLeft.repeat(100), // Large content
                      rightContent: sampleRight.repeat(100),
                    }}
                    variant="secondary"
                    size="sm"
                    shareTitle="Large Diff Test"
                  />
                </div>
              </div>

              {shareUrl && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Generated Share URL:</Label>
                  <div className="flex gap-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(shareUrl, '_blank')}
                    >
                      Open
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    URL Length: {shareUrl.length} characters
                  </p>
                </div>
              )}

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Share Data Info:</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <span className="ml-2 font-mono">{shareData.type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Left Size:</span>
                    <span className="ml-2 font-mono">{shareData.leftContent?.length} chars</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Right Size:</span>
                    <span className="ml-2 font-mono">{shareData.rightContent?.length} chars</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Has Metadata:</span>
                    <span className="ml-2 font-mono">{shareData.metadata ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diff Viewer */}
        <Card>
          <CardHeader>
            <CardTitle>Diff Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <DiffViewer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Add missing imports that TypeScript might need
import { Label } from "@diffit/ui";
import { Input } from "@diffit/ui";