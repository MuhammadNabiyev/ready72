import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, DM_Mono, Newsreader } from "next/font/google";
import { SwRegister } from "@/components/sw-register";
import { Toaster } from "@/components/ui";
import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

// Newsreader: an editorial serif with optical sizes, for the headlines.
// Atkinson Hyperlegible Next: designed for legibility under stress, for everything else.
const display = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});
const sans = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
});
const mono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Ready72 — know if your household can last 72 hours",
  description:
    "Tell Ready72 who lives in your home and which disasters you face. Get the exact water, food, medicine and gear you need, a readiness score, a shopping list, and stress tests like “evacuate in 15 minutes”.",
};

export const viewport: Viewport = {
  themeColor: "#eef3f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable}`} suppressHydrationWarning>
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
