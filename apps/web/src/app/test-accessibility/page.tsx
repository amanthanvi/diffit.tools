"use client";

import { useState } from "react";
import { 
  AccessibilityToggle,
  AriaLiveRegion,
  ScreenReaderOnly,
  VisuallyHidden,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Badge,
  Alert,
  AlertDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Switch,
} from "@diffit/ui";
import {
  Eye,
  Keyboard,
  Volume2,
  MousePointer,
  AlertCircle,
  Check,
  Info,
  ChevronRight,
  Settings,
  ZoomIn,
  Contrast,
  Move,
} from "lucide-react";

export default function TestAccessibilityPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<any>(null);
  const [formErrors, setFormErrors] = useState<any>({});
  const [testInput, setTestInput] = useState("");
  
  const runAccessibilityTest = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      setNotification({
        id: Date.now().toString(),
        message: 'Accessibility test completed successfully',
        type: 'success',
      });
    }, 2000);
  };

  const testFormValidation = () => {
    const errors: any = {};
    if (!testInput) {
      errors.testInput = 'This field is required';
    }
    setFormErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setNotification({
        id: Date.now().toString(),
        message: 'Form submitted successfully',
        type: 'success',
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-2">Accessibility Testing</h1>
          <p className="text-muted-foreground">
            Test and configure accessibility features
          </p>
        </div>
        <AccessibilityToggle />
      </div>

      <main id="main-content">
        <Tabs defaultValue="features" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="screen-reader">Screen Reader</TabsTrigger>
            <TabsTrigger value="forms">Forms</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Visual Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Contrast className="h-4 w-4" />
                      High Contrast Mode
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Increases contrast for better visibility
                    </p>
                    <div className="flex gap-2">
                      <div className="w-12 h-12 bg-primary rounded" />
                      <div className="w-12 h-12 bg-secondary rounded" />
                      <div className="w-12 h-12 bg-accent rounded" />
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <ZoomIn className="h-4 w-4" />
                      Font Size Controls
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adjustable text size for readability
                    </p>
                    <div className="space-y-1">
                      <p className="text-xs">Extra Small Text</p>
                      <p className="text-sm">Small Text</p>
                      <p className="text-base">Normal Text</p>
                      <p className="text-lg">Large Text</p>
                    </div>
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Use the settings button in the top right to configure accessibility options
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navigation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Keyboard Navigation Test</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Try navigating with keyboard only. Tab through elements, use arrow keys for navigation.
                </p>

                <div className="grid grid-cols-3 gap-2" role="grid">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                    <Button
                      key={num}
                      variant="outline"
                      className="h-20"
                      aria-label={`Button ${num}`}
                    >
                      {num}
                    </Button>
                  ))}
                </div>

                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Keyboard Shortcuts</h4>
                  <ul className="space-y-1 text-sm">
                    <li><kbd>Tab</kbd> - Navigate forward</li>
                    <li><kbd>Shift+Tab</kbd> - Navigate backward</li>
                    <li><kbd>Arrow Keys</kbd> - Navigate grid</li>
                    <li><kbd>Enter/Space</kbd> - Activate button</li>
                    <li><kbd>Escape</kbd> - Close dialogs</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screen-reader" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Screen Reader Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Hidden Content Examples</h4>
                    <p>
                      Visible text with 
                      <ScreenReaderOnly> (screen reader only content)</ScreenReaderOnly>
                    </p>
                    <Button aria-label="Delete item (this action cannot be undone)">
                      Delete
                      <ScreenReaderOnly> - Warning: This action cannot be undone</ScreenReaderOnly>
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Visually Hidden Focus Test</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Tab to reveal hidden focusable content
                    </p>
                    <VisuallyHidden focusable>
                      This text is hidden until focused
                    </VisuallyHidden>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Accessible Forms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <form onSubmit={(e) => { e.preventDefault(); testFormValidation(); }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="test-input">
                        Required Field
                        <span aria-label="required" className="text-destructive ml-1">*</span>
                      </Label>
                      <Input
                        id="test-input"
                        value={testInput}
                        onChange={(e) => setTestInput(e.target.value)}
                        aria-required="true"
                        aria-invalid={!!formErrors.testInput}
                        aria-describedby={formErrors.testInput ? "test-input-error" : undefined}
                      />
                      {formErrors.testInput && (
                        <p id="test-input-error" className="text-sm text-destructive mt-1">
                          {formErrors.testInput}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="email-input">
                        Email Address
                        <ScreenReaderOnly> (optional)</ScreenReaderOnly>
                      </Label>
                      <Input
                        id="email-input"
                        type="email"
                        placeholder="user@example.com"
                        aria-describedby="email-help"
                      />
                      <p id="email-help" className="text-sm text-muted-foreground mt-1">
                        We'll never share your email
                      </p>
                    </div>

                    <fieldset>
                      <legend className="text-sm font-medium mb-2">Preferences</legend>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch id="notifications" />
                          <Label htmlFor="notifications">Enable notifications</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch id="updates" />
                          <Label htmlFor="updates">Automatic updates</Label>
                        </div>
                      </div>
                    </fieldset>

                    <Button type="submit">
                      Submit Form
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button onClick={runAccessibilityTest}>
              Run Accessibility Test
            </Button>
            <Button variant="outline" onClick={() => setShowSettings(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Open Settings
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const event = new CustomEvent('ui:show-shortcuts');
                document.dispatchEvent(event);
              }}
            >
              <Keyboard className="h-4 w-4 mr-2" />
              Show Shortcuts
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ARIA Live Regions */}
      <AriaLiveRegion 
        message={notification?.message}
        priority={notification?.type === 'error' ? 'assertive' : 'polite'}
      />
    </div>
  );
}