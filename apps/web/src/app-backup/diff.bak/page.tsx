"use client";

export const dynamic = 'force-dynamic';

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { DiffToolbar } from "@/components/diff/diff-toolbar";
import { FileUpload } from "@/components/diff/file-upload";
import { Header } from "@/components/layout/header";
import { useDiffStore } from "@/stores/diff-store";

export default function DiffPage() {
  const searchParams = useSearchParams();
  const diffId = searchParams.get("id");
  const { loadDiff } = useDiffStore();

  useEffect(() => {
    if (diffId) {
      loadDiff(diffId);
    }
  }, [diffId, loadDiff]);

  return (
    <>
      <Header />
      <main className="flex h-[calc(100vh-4rem)] flex-col">
        <DiffToolbar />
        <div className="flex-1 overflow-hidden">
          <DiffViewer />
        </div>
        <FileUpload />
      </main>
    </>
  );
}