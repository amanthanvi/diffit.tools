"use client";

import { useState } from "react";

import { SimpleHeader } from "@/components/layout/simple-header";
import { SimpleButton } from "@/components/simple-button";

export default function DiffPage() {
  const [leftText, setLeftText] = useState("");
  const [rightText, setRightText] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const handleCompare = () => {
    setShowDiff(true);
  };

  const handleClear = () => {
    setLeftText("");
    setRightText("");
    setShowDiff(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <SimpleHeader />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Text Comparison</h1>
          <div className="space-x-4">
            <SimpleButton onClick={handleCompare}>
              Compare
            </SimpleButton>
            <SimpleButton variant="outline" onClick={handleClear}>
              Clear
            </SimpleButton>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium mb-2">Original Text</label>
            <textarea
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your original text here..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Modified Text</label>
            <textarea
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              className="w-full h-96 p-4 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your modified text here..."
            />
          </div>
        </div>

        {showDiff && (leftText || rightText) && (
          <div className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Comparison Result</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-red-600">Original</h3>
                <pre className="text-sm whitespace-pre-wrap break-words bg-red-50 p-4 rounded border min-h-32">
                  {leftText || "(empty)"}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium mb-2 text-green-600">Modified</h3>
                <pre className="text-sm whitespace-pre-wrap break-words bg-green-50 p-4 rounded border min-h-32">
                  {rightText || "(empty)"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}