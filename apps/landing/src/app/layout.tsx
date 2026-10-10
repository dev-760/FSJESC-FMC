import type { Metadata, Viewport } from "next";
import { Fraunces, Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Suspense } from "react";
import { getPublicEnv } from "@fsjesc/config/env-public";
import { SITE, DISC_1 } from "@fsjesc/config/site";
import { SkipLink } from "@fsjesc/ui/layout/skip-link";
import { SiteHeader } from "@fsjesc/ui/layout/site-header";
import { SiteFooter } from "@fsjesc/ui/layout/site-footer";
import { AccountSlot } from "@fsjesc/ui/layout/account-slot";
import { visiblePrimaryNav } from "@fsjesc/config/navigation";
import { LOCALE_CONFIG } from "@/i18n/strings";
import "./globals.css";

/**
 * Typefaces, self-hosted at build by `next/font` — zero runtime font request, and
 * no CDN dependency (Part 10).
 *
 * Inter for body and UI. Fraunces for headings, which is the mockup's --serif and
 * the voice of the logo wordmark. JetBrains Mono for every number, ticker,
 * timestamp and id, with tabular figures applied globally in globals.css.
 *
 * Inter Tight is kept wired for the dense numeric headings in the terminal apps;
 * landing headlines use Fraunces. Both are loaded, so this is ~1 font more than
 * the previous set — accepted for the brand match, and noted in DESIGN.md.
 */
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
  // Paired light/dark so the browser chrome tracks the OS theme, matching the
  // `prefers-color-scheme` block in globals.css.
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAF6EF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1B2B" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const navItems = visiblePrimaryNav();

  return (
    // `dir` comes from the locale record, so adding Arabic later needs a new
    // locale entry rather than a layout change (Part 9.5).
    // No `data-theme` here on purpose: colour is owned by globals.css, which
    // switches on prefers-color-scheme. A hardcoded attribute here would win
    // over the media query and pin every visitor to one theme.
    <html
      lang={SITE.locale}
      dir={LOCALE_CONFIG.en.dir}
      className={`${inter.variable} ${fraunces.variable} ${interTight.variable} ${jetbrainsMono.variable} h-full`}
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
