import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

// Removed edge runtime due to Node.js API dependencies

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const uploadSchema = z.object({
  file: z.instanceof(File),
  type: z.enum(["text", "code", "pdf", "document"]),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;

    // Validate input
    const validated = uploadSchema.parse({ file, type });

    // Check file size
    if (validated.file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB" },
        { status: 400 }
      );
    }

    // Process file based on type
    let content: string;
    
    switch (validated.type) {
      case "text":
      case "code":
        content = await validated.file.text();
        break;
      case "pdf":
        // TODO: Implement PDF parsing
        content = "PDF parsing not yet implemented";
        break;
      case "document":
        // TODO: Implement document parsing
        content = "Document parsing not yet implemented";
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
    }

    // Return processed content
    return NextResponse.json({
      filename: validated.file.name,
      content,
      type: validated.type,
      size: validated.file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process file" },
      { status: 500 }
    );
  }
}