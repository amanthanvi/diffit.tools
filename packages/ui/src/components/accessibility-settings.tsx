"use client";

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Button } from './button';
import { Label } from './label';
import { Switch } from './switch';
import { RadioGroup, RadioGroupItem } from './radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Separator } from './separator';
import { cn } from '../lib/utils';
import { useAccessibility } from '../providers/accessibility-provider';
import {
  Settings,
  Eye,
  Keyboard,
  Volume2,
  MousePointer,
  FileText,
  Palette,
  ZoomIn,
  Move,
  Monitor,
  Sun,
  Moon,
  Contrast,
  Type,
  Square,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface AccessibilitySettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  open,
  onOpenChange,
}) => {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const [hasChanges, setHasChanges] = React.useState(false);

  const handleSettingChange = React.useCallback((updates: any) => {
    updateSettings(updates);
    setHasChanges(true);
  }, [updateSettings]);

  const handleReset = React.useCallback(() => {
    resetSettings();
    setHasChanges(false);
  }, [resetSettings]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Accessibility Settings
          </DialogTitle>
          <DialogDescription>
            Customize your experience with accessibility features
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="visual" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="visual" className="text-xs">
              <Eye className="h-4 w-4" />
              <span className="sr-only">Visual</span>
            </TabsTrigger>
            <TabsTrigger value="navigation" className="text-xs">
              <Keyboard className="h-4 w-4" />
              <span className="sr-only">Navigation</span>
            </TabsTrigger>
            <TabsTrigger value="screen-reader" className="text-xs">
              <Volume2 className="h-4 w-4" />
              <span className="sr-only">Screen Reader</span>
            </TabsTrigger>
            <TabsTrigger value="interaction" className="text-xs">
              <MousePointer className="h-4 w-4" />
              <span className="sr-only">Interaction</span>
            </TabsTrigger>
            <TabsTrigger value="content" className="text-xs">
              <FileText className="h-4 w-4" />
              <span className="sr-only">Content</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Display Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="high-contrast" className="flex items-center gap-2">
                    <Contrast className="h-4 w-4" />
                    High Contrast Mode
                  </Label>
                  <Switch
                    id="high-contrast"
                    checked={settings.highContrast}
                    onCheckedChange={(checked) => handleSettingChange({ highContrast: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="reduced-motion" className="flex items-center gap-2">
                    <Move className="h-4 w-4" />
                    Reduce Motion
                  </Label>
                  <Switch
                    id="reduced-motion"
                    checked={settings.reducedMotion}
                    onCheckedChange={(checked) => handleSettingChange({ reducedMotion: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Font Size
                  </Label>
                  <RadioGroup
                    value={settings.fontSize}
                    onValueChange={(value) => handleSettingChange({ fontSize: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="small" id="font-small" />
                      <Label htmlFor="font-small" className="text-sm">Small</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="font-medium" />
                      <Label htmlFor="font-medium" className="text-sm">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="font-large" />
                      <Label htmlFor="font-large" className="text-sm">Large</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="extra-large" id="font-extra-large" />
                      <Label htmlFor="font-extra-large" className="text-sm">Extra Large</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Keyboard Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="keyboard-nav">Enable Keyboard Navigation</Label>
                  <Switch
                    id="keyboard-nav"
                    checked={settings.keyboardNavigation}
                    onCheckedChange={(checked) => handleSettingChange({ keyboardNavigation: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="skip-links">Show Skip Links</Label>
                  <Switch
                    id="skip-links"
                    checked={settings.skipLinks}
                    onCheckedChange={(checked) => handleSettingChange({ skipLinks: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Focus Indicator Style</Label>
                  <RadioGroup
                    value={settings.focusIndicator}
                    onValueChange={(value) => handleSettingChange({ focusIndicator: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="focus-default" />
                      <Label htmlFor="focus-default" className="text-sm">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="enhanced" id="focus-enhanced" />
                      <Label htmlFor="focus-enhanced" className="text-sm">Enhanced</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="focus-custom" />
                      <Label htmlFor="focus-custom" className="text-sm">Custom (High Visibility)</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Keyboard Shortcuts</CardTitle>
                <CardDescription className="text-xs">Common keyboard shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">j</kbd>
                    <span>Next change</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">k</kbd>
                    <span>Previous change</span>
                  </div>
                  <div className="flex justify-between">
                    <kbd className="px-2 py-1 bg-muted rounded">?</kbd>
                    <span>Show all shortcuts</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screen-reader" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Screen Reader Support</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="screen-reader-mode">Screen Reader Mode</Label>
                  <Switch
                    id="screen-reader-mode"
                    checked={settings.screenReaderMode}
                    onCheckedChange={(checked) => handleSettingChange({ screenReaderMode: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="announce-updates">Announce Updates</Label>
                  <Switch
                    id="announce-updates"
                    checked={settings.announceUpdates}
                    onCheckedChange={(checked) => handleSettingChange({ announceUpdates: checked })}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Verbosity Level</Label>
                  <RadioGroup
                    value={settings.verbosity}
                    onValueChange={(value) => handleSettingChange({ verbosity: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="brief" id="verbosity-brief" />
                      <Label htmlFor="verbosity-brief" className="text-sm">Brief</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="normal" id="verbosity-normal" />
                      <Label htmlFor="verbosity-normal" className="text-sm">Normal</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="verbose" id="verbosity-verbose" />
                      <Label htmlFor="verbosity-verbose" className="text-sm">Verbose</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="interaction" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Interaction Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Click Target Size
                  </Label>
                  <RadioGroup
                    value={settings.clickTargetSize}
                    onValueChange={(value) => handleSettingChange({ clickTargetSize: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="default" id="target-default" />
                      <Label htmlFor="target-default" className="text-sm">Default</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="large" id="target-large" />
                      <Label htmlFor="target-large" className="text-sm">Large (44px minimum)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="extra-large" id="target-extra-large" />
                      <Label htmlFor="target-extra-large" className="text-sm">Extra Large (48px minimum)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="auto-complete">Auto-complete Help</Label>
                  <Switch
                    id="auto-complete"
                    checked={settings.autoCompleteHelp}
                    onCheckedChange={(checked) => handleSettingChange({ autoCompleteHelp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="confirm-dangerous">Confirm Dangerous Actions</Label>
                  <Switch
                    id="confirm-dangerous"
                    checked={settings.confirmDangerousActions}
                    onCheckedChange={(checked) => handleSettingChange({ confirmDangerousActions: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Alt Text Display</Label>
                  <RadioGroup
                    value={settings.altTextDisplay}
                    onValueChange={(value) => handleSettingChange({ altTextDisplay: value })}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="auto" id="alt-auto" />
                      <Label htmlFor="alt-auto" className="text-sm">Auto</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="always" id="alt-always" />
                      <Label htmlFor="alt-always" className="text-sm">Always Show</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="alt-never" />
                      <Label htmlFor="alt-never" className="text-sm">Never Show</Label>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Label htmlFor="captions">Enable Captions</Label>
                  <Switch
                    id="captions"
                    checked={settings.captionsEnabled}
                    onCheckedChange={(checked) => handleSettingChange({ captionsEnabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="simplified">Simplified Language</Label>
                  <Switch
                    id="simplified"
                    checked={settings.simplifiedLanguage}
                    onCheckedChange={(checked) => handleSettingChange({ simplifiedLanguage: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={() => onOpenChange(false)}>
              <Check className="h-4 w-4 mr-2" />
              Apply Settings
            </Button>
          </div>
        </div>

        {hasChanges && (
          <Badge variant="secondary" className="absolute top-4 right-12">
            Unsaved changes
          </Badge>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Accessibility Quick Toggle Button
export const AccessibilityToggle: React.FC<{
  className?: string;
}> = ({ className }) => {
  const [showSettings, setShowSettings] = React.useState(false);
  const { isHighContrast, isReducedMotion, updateSettings } = useAccessibility();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className={cn("relative", className)}
        onClick={() => setShowSettings(true)}
        aria-label="Accessibility settings"
      >
        <Settings className="h-4 w-4" />
        {(isHighContrast || isReducedMotion) && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full" />
        )}
      </Button>
      <AccessibilitySettings open={showSettings} onOpenChange={setShowSettings} />
    </>
  );
};