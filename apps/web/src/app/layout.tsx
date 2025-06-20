import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { TRPCProvider } from "@/providers/trpc-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@diffit/ui/toaster";
import { cn } from "@diffit/ui/lib/utils";

import "@diffit/ui/styles/globals.css";
import "@/styles/app.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Diffit - Professional Text Comparison & Collaboration",
    template: "%s | Diffit",
  },
  description: "Compare text, code, and documents with advanced diff algorithms. Collaborate in real-time, track changes, and export comparisons.",
  keywords: ["diff", "text comparison", "code review", "collaboration", "document comparison"],
  authors: [{ name: "Diffit Team" }],
  creator: "Diffit",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://diffit.tools",
    title: "Diffit - Professional Text Comparison",
    description: "Compare text, code, and documents with advanced diff algorithms",
    siteName: "Diffit",
    images: [
      {
        url: "https://diffit.tools/og-image.png",
        width: 1200,
        height: 630,
        alt: "Diffit - Text Comparison Tool",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Diffit - Professional Text Comparison",
    description: "Compare text, code, and documents with advanced diff algorithms",
    images: ["https://diffit.tools/og-image.png"],
    creator: "@diffit",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(inter.variable, jetbrainsMono.variable)}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TRPCProvider>
            {children}
            <Toaster />
            <Analytics />
            <SpeedInsights />
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}