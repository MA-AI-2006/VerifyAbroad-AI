import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AppShell } from "@/components/Navigation/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "VerifyAbroad AI",
  description:
    "AI-powered study-abroad safety assistant for Pakistani students to investigate universities, scholarships, consultants, and payment requests.",
  openGraph: {
    title: "VerifyAbroad AI",
    description:
      "AI-powered study-abroad safety assistant for Pakistani students to investigate universities, scholarships, consultants, and payment requests.",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-canvas text-ink-800 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
