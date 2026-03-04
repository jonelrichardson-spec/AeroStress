import type { Metadata } from "next";
import { Suspense } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroStress — Predictive Turbine Maintenance",
  description:
    "Calculate the True Age of wind turbines by analyzing terrain and turbulence stress.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-background text-foreground"
        style={{ backgroundColor: "#1c1917", color: "#ffffff" }}
      >
        <ErrorBoundary>
          <TooltipProvider>
            <Suspense
              fallback={
                <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background text-foreground">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <p className="font-mono text-sm text-muted-foreground">Loading...</p>
                </div>
              }
            >
              {children}
            </Suspense>
          </TooltipProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
