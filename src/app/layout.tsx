import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexus AI Trader - Multi-Strategy Autonomous Trend Trading Platform",
  description: "Select multiple trending strategies, set confluence weights, and let Nexus AI execute high-probability trades across Crypto, Equities, & FX.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
