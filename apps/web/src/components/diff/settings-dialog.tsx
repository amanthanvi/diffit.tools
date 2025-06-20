"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  Slider,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@diffit/ui";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Diff Settings</DialogTitle>
          <DialogDescription>
            Customize your diff viewing experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Display Options</Label>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="line-numbers" className="text-sm">
                  Show line numbers
                </Label>
                <Switch id="line-numbers" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="word-wrap" className="text-sm">
                  Word wrap
                </Label>
                <Switch id="word-wrap" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="whitespace" className="text-sm">
                  Show whitespace characters
                </Label>
                <Switch id="whitespace" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="syntax-highlight" className="text-sm">
                  Syntax highlighting
                </Label>
                <Switch id="syntax-highlight" defaultChecked />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Font Size</Label>
            <div className="flex items-center gap-4">
              <Slider
                defaultValue={[14]}
                min={12}
                max={20}
                step={1}
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground w-12">14px</span>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Tab Size</Label>
            <Select defaultValue="4">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
                <SelectItem value="8">8 spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Diff Algorithm</Label>
            <Select defaultValue="myers">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="myers">Myers (Default)</SelectItem>
                <SelectItem value="patience">Patience</SelectItem>
                <SelectItem value="histogram">Histogram</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}