import { NextResponse } from "next/server";

// Temporarily disabled tRPC API route
// TODO: Re-enable after fixing build issues
export async function GET() {
  return NextResponse.json({ message: "tRPC temporarily disabled" });
}

export async function POST() {
  return NextResponse.json({ message: "tRPC temporarily disabled" });
}