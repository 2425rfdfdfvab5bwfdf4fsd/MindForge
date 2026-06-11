import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Inter } from "next/font/google";
import { TRPCProvider } from "@/lib/trpc/provider";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mindforge.app"),
  title: {
    default: "MindForge — AI Habit Tracker & Accountability Coach",
    template: "%s | MindForge",
  },
  description:
    "MindForge combines neuroscience-backed habit tracking with an AI coach that builds persistent memory — and holds you accountable to who you said you'd be.",
  keywords: [
    "habit tracker",
    "AI accountability coach",
    "behavior change",
    "mental toughness app",
    "self improvement",
    "neuroscience habits",
    "forge score",
  ],
  authors: [{ name: "MindForge", url: "https://mindforge.app" }],
  creator: "MindForge",
  publisher: "MindForge",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "MindForge",
    title: "MindForge — AI Habit Tracker & Accountability Coach",
    description:
      "Neuroscience-backed habit tracking with an AI coach that remembers who you are — and holds you to who you said you'd be.",
  },
  twitter: {
    card: "summary_large_image",
    site: "@mindforgeapp",
    title: "MindForge — AI Habit Tracker & Accountability Coach",
    description:
      "Neuroscience-backed habit tracking with an AI coach that remembers who you are — and holds you to who you said you'd be.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FF6B2B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="font-body bg-forge-base antialiased" suppressHydrationWarning>
        <TRPCProvider>
          <Suspense fallback={null}>
            <PostHogProvider>
              {children}
            </PostHogProvider>
          </Suspense>
        </TRPCProvider>
      </body>
    </html>
  );
}
