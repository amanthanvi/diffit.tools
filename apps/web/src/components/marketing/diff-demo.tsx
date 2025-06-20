"use client";

import { useState } from "react";
import { Button, Card, Tabs, TabsContent, TabsList, TabsTrigger } from "@diffit/ui";

const demoContent = {
  javascript: {
    left: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}`,
    right: `function calculateTotal(items) {
  return items.reduce((total, item) => {
    return total + item.price * (1 - item.discount || 0);
  }, 0);
}`,
  },
  markdown: {
    left: `# Project Setup

1. Install dependencies
2. Configure environment
3. Run the application

## Installation

Use npm to install:
\`\`\`
npm install
\`\`\``,
    right: `# Project Setup Guide

Follow these steps to get started:

1. Install dependencies
2. Configure environment variables
3. Build and run the application

## Installation

Install dependencies using your preferred package manager:

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\``,
  },
  json: {
    left: `{
  "name": "my-app",
  "version": "1.0.0",
  "dependencies": {
    "react": "^17.0.0",
    "react-dom": "^17.0.0"
  }
}`,
    right: `{
  "name": "my-app",
  "version": "2.0.0",
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}`,
  },
};

export function DiffDemo() {
  const [activeTab, setActiveTab] = useState("javascript");

  return (
    <Card className="overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b bg-muted/50 p-4">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="markdown">Markdown</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>
        </div>

        {Object.entries(demoContent).map(([key, content]) => (
          <TabsContent key={key} value={key} className="m-0">
            <div className="grid md:grid-cols-2">
              <div className="border-r">
                <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                  Original
                </div>
                <pre className="overflow-auto p-4 text-sm">
                  <code>{content.left}</code>
                </pre>
              </div>
              <div>
                <div className="bg-muted/50 px-4 py-2 text-sm font-medium">
                  Modified
                </div>
                <pre className="overflow-auto p-4 text-sm">
                  <code>{content.right}</code>
                </pre>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="border-t p-4 text-center">
        <Button asChild>
          <a href="/diff">Try It Yourself</a>
        </Button>
      </div>
    </Card>
  );
}