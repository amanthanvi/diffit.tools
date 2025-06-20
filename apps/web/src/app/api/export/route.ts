import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const exportSchema = z.object({
  diffId: z.string(),
  format: z.enum(["pdf", "html", "markdown", "json"]),
  includeLineNumbers: z.boolean().default(true),
  includeTimestamp: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = exportSchema.parse(body);

    // TODO: Fetch diff data from database
    const diffData = {
      id: validated.diffId,
      leftContent: "Sample left content",
      rightContent: "Sample right content",
      createdAt: new Date().toISOString(),
    };

    let content: string;
    let contentType: string;
    let filename: string;

    switch (validated.format) {
      case "pdf":
        // TODO: Implement PDF generation
        content = "PDF export not yet implemented";
        contentType = "application/pdf";
        filename = `diff-${validated.diffId}.pdf`;
        break;

      case "html":
        content = generateHTMLExport(diffData, validated);
        contentType = "text/html";
        filename = `diff-${validated.diffId}.html`;
        break;

      case "markdown":
        content = generateMarkdownExport(diffData, validated);
        contentType = "text/markdown";
        filename = `diff-${validated.diffId}.md`;
        break;

      case "json":
        content = JSON.stringify(diffData, null, 2);
        contentType = "application/json";
        filename = `diff-${validated.diffId}.json`;
        break;
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json(
      { error: "Failed to export diff" },
      { status: 500 }
    );
  }
}

function generateHTMLExport(
  diffData: any,
  options: z.infer<typeof exportSchema>
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>Diff Export - ${diffData.id}</title>
  <style>
    body { font-family: monospace; }
    .diff-added { background-color: #d4f4d4; }
    .diff-removed { background-color: #f4d4d4; }
  </style>
</head>
<body>
  <h1>Diff Export</h1>
  ${options.includeTimestamp ? `<p>Created: ${diffData.createdAt}</p>` : ""}
  <pre>${diffData.leftContent}</pre>
  <pre>${diffData.rightContent}</pre>
</body>
</html>
  `;
}

function generateMarkdownExport(
  diffData: any,
  options: z.infer<typeof exportSchema>
): string {
  return `# Diff Export

${options.includeTimestamp ? `Created: ${diffData.createdAt}\n` : ""}

## Left Content
\`\`\`
${diffData.leftContent}
\`\`\`

## Right Content
\`\`\`
${diffData.rightContent}
\`\`\`
`;
}