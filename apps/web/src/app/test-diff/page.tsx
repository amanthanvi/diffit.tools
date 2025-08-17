"use client";

import { DiffViewer } from "@/components/diff/diff-viewer-wrapper";
import { useDiffStore } from "@/stores/diff-store";
import { useEffect } from "react";

const sampleLeft = `function hello() {
  console.log("Hello");
  return "world";
}

const x = 10;
const y = 20;

function calculate(a, b) {
  return a + b;
}`;

const sampleRight = `function hello() {
  console.log("Hello, World!");
  return "universe";
}

const x = 10;
const z = 30;

function calculate(a, b, c) {
  return a + b + c;
}

function newFunction() {
  return "added";
}`;

export default function TestDiffPage() {
  const { setLeftContent, setRightContent } = useDiffStore();

  useEffect(() => {
    // Set sample content
    setLeftContent(sampleLeft);
    setRightContent(sampleRight);
  }, [setLeftContent, setRightContent]);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Diff Viewer with Insights & Filters</h1>
      <DiffViewer />
    </div>
  );
}