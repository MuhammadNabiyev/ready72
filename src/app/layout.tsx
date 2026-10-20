import type { Metadata, Viewport } from "next";
import { Overpass, Overpass_Mono } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Overpass descends from Highway Gothic, the typeface of road signs: built to be read at a glance, from a distance, in bad light.
const sans = Overpass({
  variable: "--font-overpass",
  subsets: ["latin"],
});
const mono = Overpass_Mono({
  variable: "--font-overpass-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ready72 — know if your household can last 72 hours",
  description:
    "Tell Ready72 who lives in your home and which disasters you face. Get the exact water, food, medicine and gear you need, a readiness score, a shopping list, and stress tests like “evacuate in 15 minutes”.",
};

export const viewport: Viewport = {
  themeColor: "#f1f1ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas"
        >
          Skip to content
        </a>
        {children}
        <Toaster />
        <SwRegister />
      </body>
    </html>
  );
}
