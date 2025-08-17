"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Progress } from './progress';
import { Badge } from './badge';
import { cn } from '../lib/utils';
import type { DiffInsights } from '../types/diff';

export interface DiffInsightsProps {
  insights: DiffInsights;
  className?: string;
}

export const DiffInsightsPanel = React.forwardRef<HTMLDivElement, DiffInsightsProps>(
  ({ insights, className }, ref) => {
    const changeRate = insights.totalChanges > 0 
      ? ((insights.modifications / insights.totalChanges) * 100).toFixed(1)
      : '0';

    const maxIntensity = Math.max(...(insights.changeIntensity || [0]));

    return (
      <div ref={ref} className={cn("grid gap-4 md:grid-cols-4", className)}>
        {/* Similarity Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Similarity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.similarity}%</div>
            <Progress value={insights.similarity} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Files are {insights.similarity >= 80 ? 'very' : insights.similarity >= 50 ? 'moderately' : 'slightly'} similar
            </p>
          </CardContent>
        </Card>

        {/* Change Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Changes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalChanges}</div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-green-600">+ Added</span>
                <span className="font-medium">{insights.additions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-600">- Removed</span>
                <span className="font-medium">{insights.deletions}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-yellow-600">~ Modified</span>
                <span className="font-medium">{insights.modifications}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hunks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Diff Hunks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.hunks}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Contiguous change blocks
            </p>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                {changeRate}% modifications
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Change Intensity Heatmap */}
        {insights.changeIntensity && insights.changeIntensity.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Change Density</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-0.5 h-12">
                {insights.changeIntensity.slice(0, 20).map((intensity, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 transition-all hover:opacity-80"
                    style={{
                      height: `${(intensity / maxIntensity) * 100}%`,
                      opacity: 0.3 + (intensity / maxIntensity) * 0.7,
                    }}
                    title={`Line ${i * 10}-${(i + 1) * 10}: ${intensity} changes`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Change distribution across file
              </p>
            </CardContent>
          </Card>
        )}

        {/* Semantic Changes (if available) */}
        {insights.semantic && (
          <Card className="md:col-span-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Semantic Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {insights.semantic.functionsAdded.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Functions Added</p>
                    <div className="flex flex-wrap gap-1">
                      {insights.semantic.functionsAdded.map((fn, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {insights.semantic.functionsRemoved.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Functions Removed</p>
                    <div className="flex flex-wrap gap-1">
                      {insights.semantic.functionsRemoved.map((fn, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {fn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {insights.semantic.importsChanged > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Import Changes</p>
                    <Badge variant="secondary" className="text-xs">
                      {insights.semantic.importsChanged} imports modified
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }
);

DiffInsightsPanel.displayName = 'DiffInsightsPanel';