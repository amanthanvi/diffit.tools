"use client";

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Label } from './label';
import { Switch } from './switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Slider } from './slider';
import { Button } from './button';
import { cn } from '../lib/utils';
import { Settings2, RotateCcw } from 'lucide-react';

export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreComments: boolean;
  contextLines: number;
  algorithm: 'myers' | 'patience' | 'histogram';
  showLineNumbers: boolean;
  showMinimap: boolean;
  virtualizeThreshold: number;
}

export interface DiffFiltersProps {
  options: DiffOptions;
  onOptionsChange: (options: Partial<DiffOptions>) => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

const DEFAULT_OPTIONS: DiffOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreComments: false,
  contextLines: 3,
  algorithm: 'myers',
  showLineNumbers: true,
  showMinimap: true,
  virtualizeThreshold: 500,
};

export const DiffFilters = React.forwardRef<HTMLDivElement, DiffFiltersProps>(
  ({ options, onOptionsChange, onReset, className, compact = false }, ref) => {
    const handleToggle = (key: keyof DiffOptions) => (checked: boolean) => {
      onOptionsChange({ [key]: checked });
    };

    const handleAlgorithmChange = (value: string) => {
      onOptionsChange({ algorithm: value as DiffOptions['algorithm'] });
    };

    const handleContextLinesChange = (value: number[]) => {
      onOptionsChange({ contextLines: value[0] });
    };

    const handleVirtualizeThresholdChange = (value: number[]) => {
      onOptionsChange({ virtualizeThreshold: value[0] });
    };

    const handleReset = () => {
      if (onReset) {
        onReset();
      } else {
        onOptionsChange(DEFAULT_OPTIONS);
      }
    };

    if (compact) {
      return (
        <div ref={ref} className={cn("flex items-center gap-4 p-2 border rounded-lg bg-muted/30", className)}>
          <Settings2 className="h-4 w-4 text-muted-foreground" />
          
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={options.ignoreWhitespace}
                onCheckedChange={handleToggle('ignoreWhitespace')}
              />
              <span className="text-sm">Ignore whitespace</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={options.ignoreCase}
                onCheckedChange={handleToggle('ignoreCase')}
              />
              <span className="text-sm">Ignore case</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch
                checked={options.ignoreComments}
                onCheckedChange={handleToggle('ignoreComments')}
              />
              <span className="text-sm">Ignore comments</span>
            </label>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <Label className="text-sm">Algorithm:</Label>
            <Select value={options.algorithm} onValueChange={handleAlgorithmChange}>
              <SelectTrigger className="w-28 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="myers">Myers</SelectItem>
                <SelectItem value="patience">Patience</SelectItem>
                <SelectItem value="histogram">Histogram</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="ml-2"
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <Card ref={ref} className={cn("", className)}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Diff Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Comparison Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Comparison</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="ignore-whitespace" className="text-sm cursor-pointer">
                  Ignore whitespace
                </Label>
                <Switch
                  id="ignore-whitespace"
                  checked={options.ignoreWhitespace}
                  onCheckedChange={handleToggle('ignoreWhitespace')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="ignore-case" className="text-sm cursor-pointer">
                  Ignore case
                </Label>
                <Switch
                  id="ignore-case"
                  checked={options.ignoreCase}
                  onCheckedChange={handleToggle('ignoreCase')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="ignore-comments" className="text-sm cursor-pointer">
                  Ignore comments
                </Label>
                <Switch
                  id="ignore-comments"
                  checked={options.ignoreComments}
                  onCheckedChange={handleToggle('ignoreComments')}
                />
              </div>
            </div>
          </div>

          {/* Algorithm Selection */}
          <div className="space-y-2">
            <Label htmlFor="algorithm" className="text-sm">
              Diff Algorithm
            </Label>
            <Select value={options.algorithm} onValueChange={handleAlgorithmChange}>
              <SelectTrigger id="algorithm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="myers">
                  <div>
                    <div className="font-medium">Myers</div>
                    <div className="text-xs text-muted-foreground">Fast, standard algorithm</div>
                  </div>
                </SelectItem>
                <SelectItem value="patience">
                  <div>
                    <div className="font-medium">Patience</div>
                    <div className="text-xs text-muted-foreground">Better for structured code</div>
                  </div>
                </SelectItem>
                <SelectItem value="histogram">
                  <div>
                    <div className="font-medium">Histogram</div>
                    <div className="text-xs text-muted-foreground">Improved patience algorithm</div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Context Lines */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="context-lines" className="text-sm">
                Context Lines
              </Label>
              <span className="text-sm text-muted-foreground">{options.contextLines}</span>
            </div>
            <Slider
              id="context-lines"
              min={0}
              max={10}
              step={1}
              value={[options.contextLines]}
              onValueChange={handleContextLinesChange}
              className="w-full"
            />
          </div>

          {/* Display Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Display</h4>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-line-numbers" className="text-sm cursor-pointer">
                  Show line numbers
                </Label>
                <Switch
                  id="show-line-numbers"
                  checked={options.showLineNumbers}
                  onCheckedChange={handleToggle('showLineNumbers')}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-minimap" className="text-sm cursor-pointer">
                  Show minimap
                </Label>
                <Switch
                  id="show-minimap"
                  checked={options.showMinimap}
                  onCheckedChange={handleToggle('showMinimap')}
                />
              </div>
            </div>
          </div>

          {/* Performance Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="virtualize-threshold" className="text-sm">
                Virtualize after (lines)
              </Label>
              <span className="text-sm text-muted-foreground">{options.virtualizeThreshold}</span>
            </div>
            <Slider
              id="virtualize-threshold"
              min={100}
              max={2000}
              step={100}
              value={[options.virtualizeThreshold]}
              onValueChange={handleVirtualizeThresholdChange}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Use virtual scrolling for better performance with large files
            </p>
          </div>

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="w-full"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    );
  }
);

DiffFilters.displayName = 'DiffFilters';

export { DEFAULT_OPTIONS };