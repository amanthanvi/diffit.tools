"use client";

import { Card } from "@diffit/ui/card";
import { Label } from "@diffit/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@diffit/ui/select";
import { RadioGroup, RadioGroupItem } from "@diffit/ui/radio-group";
import { Button } from "@diffit/ui/button";
import { Separator } from "@diffit/ui/separator";
import { useTheme } from "next-themes";
import { useDiffStore } from "@/stores/diff-store";
import { useRecentDiffsStore } from "@/stores/recent-diffs-store";
import { Monitor, Moon, Sun, FileText, Layout, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { diffMode, setDiffMode, syntax, setSyntax } = useDiffStore();
  const { clearAll } = useRecentDiffsStore();

  const syntaxOptions = [
    { value: "text", label: "Plain Text" },
    { value: "javascript", label: "JavaScript" },
    { value: "typescript", label: "TypeScript" },
    { value: "python", label: "Python" },
    { value: "java", label: "Java" },
    { value: "css", label: "CSS" },
    { value: "html", label: "HTML" },
    { value: "json", label: "JSON" },
    { value: "markdown", label: "Markdown" },
  ];

  return (
    <div className="container py-8 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your preferences and customize your experience.
          </p>
        </div>

        {/* Appearance Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <Label className="text-base mb-3 block">Theme</Label>
              <RadioGroup value={theme} onValueChange={setTheme}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex items-center cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex items-center cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="system" id="system" />
                  <Label htmlFor="system" className="flex items-center cursor-pointer">
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>

        {/* Diff Settings */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Diff Preferences</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diff-mode" className="text-base mb-2 block">
                Default View Mode
              </Label>
              <Select value={diffMode} onValueChange={(value: any) => setDiffMode(value)}>
                <SelectTrigger id="diff-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="split">
                    <div className="flex items-center">
                      <Layout className="mr-2 h-4 w-4" />
                      Split View
                    </div>
                  </SelectItem>
                  <SelectItem value="unified">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Unified View
                    </div>
                  </SelectItem>
                  <SelectItem value="inline">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4" />
                      Inline View
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div>
              <Label htmlFor="syntax" className="text-base mb-2 block">
                Default Syntax Highlighting
              </Label>
              <Select value={syntax} onValueChange={setSyntax}>
                <SelectTrigger id="syntax">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {syntaxOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Data Management</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-medium mb-2">Clear Local Data</h3>
              <p className="text-sm text-muted-foreground mb-4">
                This will remove all your locally stored diffs. This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all local diffs? This action cannot be undone.")) {
                    clearAll();
                    alert("All local diffs have been cleared.");
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Diffs
              </Button>
            </div>
          </div>
        </Card>

        {/* About */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">Version:</span> 2.0.0
            </p>
            <p>
              <span className="font-medium">Storage:</span> All data is stored locally in your browser
            </p>
            <p className="text-muted-foreground">
              Diffit is a professional text comparison tool that helps you compare and analyze differences between texts, code, and documents.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}