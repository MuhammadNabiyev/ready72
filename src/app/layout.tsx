import type { Metadata, Viewport } from "next";
import { Archivo, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui";
import "./globals.css";

const display = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
});
const sans = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});
const mono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Ready72 — know if your household can last 72 hours",
  description:
    "Tell Ready72 who lives in your home and which disasters you face. Get the exact water, food, medicine and gear you need, a readiness score, a shopping list, and stress tests like “evacuate in 15 minutes”.",
};

export const viewport: Viewport = {
  themeColor: "#f6f2e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`}>
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
