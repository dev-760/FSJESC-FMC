import type { Metadata } from "next";
import { Fraunces, Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { loadEnvConfig } from "@next/env";
import "./globals.css";

/**
 * Secrets live at the monorepo root so one `.env.local` serves every app.
 * Next 16 removed `envDir`, so the root is loaded explicitly here.
 */
loadEnvConfig("../../");

/** Same three faces as the landing app, so the two read as one product. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600"],
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  weight: ["600", "700"],
  display: "swap",
});

// Fraunces backs --font-display, which globals.css uses for headings. It has to
// be loaded in every app that renders a heading, not just the landing site.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Simulator",
    template: "%s | Simulator",
  },
  description:
    "Paper-trading terminal operating a deterministic simulated Moroccan market in MAD. No real money is involved.",
  robots: { index: false, follow: false },
};

/**
 * The simulator is a tool, not a page of the marketing site.
 *
 * It deliberately does not import the site's header, footer or skip link: those
 * belong to the landing app, and a duplicated shell here would drift from it.
 * What it does share is the type scale and the colour tokens, so a chart in the
 * simulator looks like the same instrument panel as the one on the home page.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${inter.variable} ${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="bg-canvas text-foreground flex min-h-full flex-col">{children}</body>
    </html>
  );
}