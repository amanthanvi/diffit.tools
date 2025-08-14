"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { DiffViewer as UIDiffViewer, type DiffLine } from "@diffit/ui";

export default function PrintPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [lines, setLines] = useState<DiffLine[]>([]);

  useEffect(() => {
    try {
      const payload = params?.payload as string;
      if (payload) {
        const decoded = JSON.parse(atob(payload));
        setData(decoded);
        
        // Generate diff lines for display
        const leftLines = (decoded.leftContent || '').split('\n');
        const rightLines = (decoded.rightContent || '').split('\n');
        const diffLines: DiffLine[] = [];
        const maxLines = Math.max(leftLines.length, rightLines.length);
        
        for (let i = 0; i < maxLines; i++) {
          const leftLine = i < leftLines.length ? leftLines[i] : undefined;
          const rightLine = i < rightLines.length ? rightLines[i] : undefined;
          
          if (leftLine === undefined) {
            diffLines.push({
              type: 'added',
              content: rightLine || '',
              lineNumber: { new: i + 1 }
            });
          } else if (rightLine === undefined) {
            diffLines.push({
              type: 'removed',
              content: leftLine,
              lineNumber: { old: i + 1 }
            });
          } else if (leftLine !== rightLine) {
            diffLines.push({
              type: 'removed',
              content: leftLine,
              lineNumber: { old: i + 1 }
            });
            diffLines.push({
              type: 'added',
              content: rightLine,
              lineNumber: { new: i + 1 }
            });
          } else {
            diffLines.push({
              type: 'unchanged',
              content: leftLine,
              lineNumber: { old: i + 1, new: i + 1 }
            });
          }
        }
        
        setLines(diffLines);
      }
    } catch (error) {
      console.error('Failed to parse print data:', error);
    }
  }, [params]);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="print-page">
      <style jsx global>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          .print-page {
            width: 100%;
            max-width: none;
            padding: 20px;
          }
          .no-print {
            display: none !important;
          }
          .diff-added {
            background-color: #d4f4d4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .diff-removed {
            background-color: #f4d4d4 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
        @media screen {
          .print-page {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px;
            background: white;
            min-height: 100vh;
          }
        }
        .diff-added {
          background-color: #d4f4d4;
        }
        .diff-removed {
          background-color: #f4d4d4;
        }
        .header {
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 24px;
          font-weight: bold;
          margin: 0 0 10px 0;
        }
        .header p {
          color: #6b7280;
          margin: 0;
        }
      `}</style>
      
      <div className="header">
        <h1>Diff Report</h1>
        {data.includeTimestamp && (
          <p>Generated: {data.timestamp}</p>
        )}
      </div>

      <div className="diff-content">
        <UIDiffViewer
          lines={lines}
          mode="unified"
          showLineNumbers={data.includeLineNumbers}
          highlightSyntax={false}
          language="text"
        />
      </div>

      <button 
        className="no-print fixed bottom-4 right-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        onClick={() => window.print()}
      >
        Print to PDF
      </button>
    </div>
  );
}