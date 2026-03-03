import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroStress — Predictive Turbine Maintenance",
  description:
    "Calculate the True Age of wind turbines by analyzing terrain and turbulence stress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <ErrorBoundary>
          <TooltipProvider>{children}</TooltipProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
