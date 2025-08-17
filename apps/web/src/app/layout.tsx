import type { Metadata } from "next";
// import "@/styles/app.css";
import { ThemeProvider } from "@/providers/theme-provider";
import { TRPCProvider } from "@/providers/trpc-provider";
import { PWAInstaller } from "@/components/pwa-installer";

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
      <body>
        <TRPCProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <PWAInstaller />
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}