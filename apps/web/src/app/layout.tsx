import type { Metadata } from "next";
import "@/styles/app.css";

export const metadata: Metadata = {
  title: "Diffit - Smart Text Comparison Tool",
  description: "Compare text, files, and documents with advanced diff visualization and collaboration features.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}