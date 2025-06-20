"use client";

// import { TRPCProvider } from "@/providers/trpc-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import { Toaster } from "@diffit/ui";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    // TODO: Re-enable TRPCProvider after fixing build issues
    // <TRPCProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
        <Toaster />
      </ThemeProvider>
    // </TRPCProvider>
  );
}