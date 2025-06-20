"use client";

export const dynamic = 'force-dynamic';

import { Metadata } from "next";
import { Card, Button } from "@diffit/ui";
import { FileText, Clock, Trash2, Download, Share2 } from "lucide-react";
import { useRecentDiffsStore } from "@/stores/recent-diffs-store";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function MyDiffsPage() {
  const { recentDiffs, removeDiff, clearAll } = useRecentDiffsStore();

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Diffs</h1>
          <p className="text-muted-foreground">
            Your recently created diffs are stored locally in your browser.
          </p>
        </div>
        {recentDiffs.length > 0 && (
          <Button
            variant="outline"
            onClick={clearAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Clear All
          </Button>
        )}
      </div>

      {/* Recent Diffs List */}
      {recentDiffs.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No diffs yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first diff to see it here.
          </p>
          <Link href="/diff">
            <Button>Create a Diff</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4">
          {recentDiffs.map((diff) => (
            <Card key={diff.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium mb-1">
                    {diff.title || "Untitled Diff"}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {diff.description || "No description"}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(diff.createdAt), { addSuffix: true })}
                    </span>
                    <span>
                      {diff.leftLines} vs {diff.rightLines} lines
                    </span>
                    {diff.syntax !== "text" && (
                      <span className="capitalize">{diff.syntax}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/diff?id=${diff.id}`}>
                    <Button size="sm" variant="outline">
                      View
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement share functionality
                      alert("Share functionality coming soon!");
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // TODO: Implement export functionality
                      alert("Export functionality coming soon!");
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeDiff(diff.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}