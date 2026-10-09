import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { getPublicEnv } from "@/config/env-public";
import { SITE, DISC_1 } from "@/config/site";
import { SkipLink } from "@/components/layout/skip-link";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AccountSlot } from "@/components/layout/account-slot";
import { visiblePrimaryNav } from "@/config/navigation";
import { LOCALE_CONFIG } from "@/i18n/strings";
import "./globals.css";

/**
 * Typefaces, self-hosted at build by `next/font` — zero runtime font request, and
 * no CDN dependency (Part 10).
 *
 * Inter for body and UI. Inter Tight for headings, at -0.02em tracking.
 * JetBrains Mono for every number, ticker, timestamp and id, with tabular figures
 * applied globally in globals.css.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
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
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.shortName}`,
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
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} | ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07080B",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const navItems = visiblePrimaryNav();

  return (
    // `dir` comes from the locale record, so adding Arabic later needs a new
    // locale entry rather than a layout change (Part 9.5).
    <html
      lang={SITE.locale}
      dir={LOCALE_CONFIG.en.dir}
      data-theme="dark"
      className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="bg-canvas text-foreground flex min-h-full flex-col">
        <SkipLink targetId="main-content" />
        {/*
          The simulated-market notice is a permanent site-wide condition, not a
          page detail (Part 0.4, DISC-1). It sits inside the header stack so the
          56px nav + 32px ticker rhythm is not broken by a third bar.
        */}
        <Suspense fallback={null}>
          <SiteHeader navItems={navItems} disclaimer={DISC_1} accountSlot={<AccountSlot />} />
        </Suspense>
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
