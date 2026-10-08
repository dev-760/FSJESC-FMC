import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { getPublicEnv } from "@/config/env-public";
import { SITE, DISC_1 } from "@/config/site";
import { SkipLink } from "@/components/layout/skip-link";
import "./globals.css";

/**
 * Typeface: IBM Plex Sans for interface text, IBM Plex Mono for figures.
 * Self-hosted by `next/font` (Part 10) — no third-party font request at runtime.
 */
const plexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

function siteUrl(): URL {
  try {
    return new URL(getPublicEnv().NEXT_PUBLIC_APP_URL);
  } catch {
    return new URL(SITE.url);
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.shortName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  keywords: [
    "financial education",
    "financial markets",
    "paper trading",
    "simulation",
    "student club",
    "FSJES Casablanca",
    "economics",
  ],
  category: "education",
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1117" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang={SITE.locale} className={`${plexSans.variable} ${plexMono.variable} h-full`}>
      <head>
        {/*
          Applies the stored colour scheme before first paint to avoid a flash.
          This is deliberately a render-blocking synchronous script in <head>:
          deferring it would reintroduce exactly the flash it exists to prevent.
          It lives in public/theme-init.js rather than inline so that no
          dangerouslySetInnerHTML is required (Part 8.4), and it is same-origin
          and cacheable, so a strict `script-src 'self'` CSP is sufficient.
        */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts -- must run before first paint */}
        <script src="/theme-init.js" />
      </head>
      <body className="bg-canvas text-foreground flex min-h-full flex-col">
        <SkipLink targetId="main-content" />
        {/* The simulated-market notice is a permanent site-wide condition, not a
            page detail (Part 0.4, DISC-1). */}
        <div
          role="note"
          className="border-border bg-surface-inset text-2xs text-foreground-secondary border-b px-4 py-1.5 text-center font-medium tracking-wide"
        >
          {DISC_1}
        </div>
        {children}
      </body>
    </html>
  );
}
