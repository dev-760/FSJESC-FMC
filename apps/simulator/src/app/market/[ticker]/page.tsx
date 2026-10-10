import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@fsjesc/ui/button";
import { RuledList } from "@fsjesc/ui/layout/container";
import { Alert } from "@fsjesc/ui/alert";
import { QuoteBoard, referenceRows } from "@fsjesc/ui/financial/quote-board";
import { OrderTicketWrapper } from "@fsjesc/ui/simulator/order-ticket-wrapper";
import { InstrumentTerminal } from "@fsjesc/ui/simulator/instrument-terminal";
import { SimulatorNav } from "@fsjesc/ui/simulator/simulator-nav";
import { ASSETS, SECTOR_LABELS } from "@fsjesc/domain/assets";

export function generateStaticParams(): Array<{ ticker: string }> {
  return ASSETS.map((asset) => ({ ticker: asset.ticker.toLowerCase() }));
}

/**
 * Instrument detail.
 *
 * Unknown tickers render the platform 404 page and declare `robots: noindex`. See
 * DECISIONS.md D15 for the HTTP-status caveat on unprerendered parameters.
 */
export async function generateMetadata({
  params,
}: PageProps<"/market/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  const asset = ASSETS.find((candidate) => candidate.ticker.toLowerCase() === ticker.toLowerCase());

  if (!asset) {
    return { title: "Instrument not found", robots: { index: false, follow: false } };
  }

  const description = `${asset.ticker} | ${asset.name}, a fictional instrument on the FSJESC Financial Markets Club simulated market. ${SECTOR_LABELS[asset.sector]} sector. Simulated price, no real security.`;

  return {
    title: `${asset.ticker} | ${asset.name}`,
    description,
    alternates: { canonical: `/market/${asset.ticker.toLowerCase()}` },
  };
}

export default async function InstrumentPage({ params }: PageProps<"/market/[ticker]">) {
  const { ticker } = await params;
  const asset = ASSETS.find((candidate) => candidate.ticker.toLowerCase() === ticker.toLowerCase());

  if (!asset) notFound();

  // The other instruments in the same sector, so a reader comparing behaviour has
  // the comparison to hand rather than having to go back to the board.
  const peers = ASSETS.filter(
    (peer) => peer.sector === asset.sector && peer.ticker !== asset.ticker,
  );
  const allRows = referenceRows(ASSETS);
  const peerRows = allRows.filter((row) => peers.some((peer) => peer.ticker === row.asset.ticker));

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/market"
                className="hover:text-foreground focus-visible:outline-ring rounded focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Market
              </Link>
            </li>
            <li aria-hidden className="text-foreground-muted">
              /
            </li>
            <li aria-current="page" className="numeric text-foreground font-medium">
              {asset.ticker}
            </li>
          </ol>
        </nav>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-12">
          {/* ── Chart & Terminal region ─────────────────────────────── */}
          <div>
            {/* The terminal reads the clock and quotes live, so it is a
                dynamic hole: without a boundary, prerendering the page would
                try to evaluate `new Date()` at build time and fail. */}
            <Suspense
              fallback={
                <div className="border-rule bg-surface h-[32rem] animate-pulse rounded-lg border" />
              }
            >
              <InstrumentTerminal
                ticker={asset.ticker}
                name={asset.name}
                sectorLabel={SECTOR_LABELS[asset.sector]}
                startingPriceCents={asset.startingPriceCents}
                annualVolatility={asset.annualVolatility}
                annualDrift={asset.annualDrift}
                description={asset.description}
              />
            </Suspense>

            <section className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">About this instrument</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>{asset.description}</p>
                <p>
                  Its modelled annual volatility is {(asset.annualVolatility * 100).toFixed(0)}%
                  with a drift of {(asset.annualDrift * 100).toFixed(1)}%. Those two numbers explain
                  most of what a reader will observe: volatility determines how far a price wanders
                  from its trend, and drift determines which way it leans on average. Neither is
                  estimated from a real company.
                </p>
                <p>
                  Choosing a different sector is the point of having six. A portfolio concentrated
                  in telecom behaves measurably differently from one concentrated in retail, and a
                  challenge is only instructive if that difference is visible.
                </p>
              </div>
            </section>

            {peers.length > 0 ? (
              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">
                  Other {SECTOR_LABELS[asset.sector].toLowerCase()} instruments
                </h2>
                <p className="text-foreground-secondary mt-2 max-w-prose text-sm leading-relaxed">
                  Same modelled conditions, different sensitivity. Comparing them is how a
                  sector&rsquo;s risk profile becomes concrete.
                </p>
                <div className="mt-5">
                  <Suspense
              fallback={<div className="border-rule h-64 animate-pulse rounded-lg border" />}
            >
  <QuoteBoard
                      rows={peerRows}
                      caption={`${SECTOR_LABELS[asset.sector]} peers. The change column is a deterministic placeholder until the price model ships.`}
                      showParameters={false}
                      animate={false}
                    />
            </Suspense>
                </div>
              </section>
            ) : null}
          </div>

          {/* ── Reference rail ───────────────────────────────────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <OrderTicketWrapper
              symbol={asset.ticker}
              currentPriceCents={asset.startingPriceCents}
              availableCashCents={10_000_000n}
            />

            <div>
              <p className="label mb-3">Reference data</p>
              <RuledList
                items={[
                  { term: "Ticker", detail: asset.ticker },
                  { term: "Currency", detail: asset.currency },
                  { term: "Sector", detail: SECTOR_LABELS[asset.sector] },
                  {
                    term: "Modelled volatility",
                    detail: `${(asset.annualVolatility * 100).toFixed(0)}% annualised`,
                  },
                  {
                    term: "Modelled drift",
                    detail: `${(asset.annualDrift * 100).toFixed(1)}% annualised`,
                  },
                  { term: "Status", detail: "Tradable in the simulator" },
                ]}
              />
            </div>

            <div>
              <Button asChild fullWidth>
                <Link href="/">Open a portfolio</Link>
              </Button>
              <Button asChild fullWidth variant="secondary" className="mt-2">
                <Link href="/market">Back to the market board</Link>
              </Button>
            </div>

            <Alert tone="warning" title="Not a real security">
              <p>
                {asset.name} is fictional. It does not exist, is not listed anywhere, and cannot be
                bought or sold outside this platform. Any performance attributed to it describes a
                simulation and nothing else.
              </p>
            </Alert>
          </aside>
        </div>
      </div>
    </main>
  );
}
