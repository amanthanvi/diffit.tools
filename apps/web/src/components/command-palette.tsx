"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "lucide-react";
import { CommandPalette, Button } from "@diffit/ui";
import { useHotkeys } from "@/hooks/use-hotkeys";

export function AppCommandPalette() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useHotkeys("cmd+k", () => setOpen(true));
  useHotkeys("ctrl+k", () => setOpen(true));

  const commands = [
    {
      group: "Navigation",
      items: [
        {
          label: "Go to Home",
          keywords: ["home", "main"],
          onSelect: () => router.push("/"),
        },
        {
          label: "Go to Diff",
          keywords: ["diff", "compare"],
          onSelect: () => router.push("/diff"),
        },
        {
          label: "Go to My Diffs",
          keywords: ["my", "diffs", "recent", "history"],
          onSelect: () => router.push("/my-diffs"),
        },
        {
          label: "Go to Settings",
          keywords: ["settings", "preferences"],
          onSelect: () => router.push("/settings"),
        },
      ],
    },
    {
      group: "Actions",
      items: [
        {
          label: "Create New Diff",
          keywords: ["new", "create", "diff"],
          onSelect: () => router.push("/diff"),
        },
        {
          label: "Import File",
          keywords: ["import", "upload", "file"],
          onSelect: () => {
            // Trigger file upload
            const element = document.getElementById("file-upload-left");
            if (element instanceof HTMLElement) {
              element.click();
            }
          },
        },
        {
          label: "Export Diff",
          keywords: ["export", "download", "save"],
          onSelect: () => {
            // Open export dialog
            const element = document.querySelector("[data-export-trigger]");
            if (element instanceof HTMLElement) {
              element.click();
            }
          },
        },
      ],
    },
    {
      group: "Help",
      items: [
        {
          label: "View Documentation",
          keywords: ["docs", "help", "guide"],
          onSelect: () => router.push("/docs"),
        },
        {
          label: "Keyboard Shortcuts",
          keywords: ["shortcuts", "hotkeys"],
          onSelect: () => router.push("/docs/features/shortcuts"),
        },
        {
          label: "View Pricing",
          keywords: ["pricing", "plans", "cost"],
          onSelect: () => router.push("/pricing"),
        },
      ],
    },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="hidden md:inline-flex items-center gap-2"
      >
        <Command className="h-3 w-3" />
        <span className="text-xs text-muted-foreground">⌘K</span>
      </Button>

      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={commands}
      />
    </>
  );
}