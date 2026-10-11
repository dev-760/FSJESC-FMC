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
import {
  ALL_MARKET_ASSETS,
  MARKET_CATEGORY_LABELS,
  SECTOR_LABELS,
  findMarketAsset,
} from "@fsjesc/domain/assets";

export function generateStaticParams(): Array<{ ticker: string }> {
  return ALL_MARKET_ASSETS.map((asset) => ({ ticker: asset.ticker.toLowerCase() }));
}

/**
 * Instrument detail across all 8 API markets (`CSE`, `STOCKS`, `ETFS`, `FUTURES`,
 * `CRYPTO`, `FOREX`, `BONDS`, `OPTIONS`).
 */
export async function generateMetadata({
  params,
}: PageProps<"/market/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  const asset = findMarketAsset(ticker);

  if (!asset) {
    return { title: "Instrument not found", robots: { index: false, follow: false } };
  }

  const description = `${asset.ticker} | ${asset.name} (${asset.exchange} · ${MARKET_CATEGORY_LABELS[asset.market]}). ${SECTOR_LABELS[asset.sector]} sector. Tradeable on the FSJESC Financial Markets Club simulator.`;

  return {
    title: `${asset.ticker} | ${asset.name}`,
    description,
    alternates: { canonical: `/market/${asset.ticker.toLowerCase()}` },
  };
}

export default async function InstrumentPage({ params }: PageProps<"/market/[ticker]">) {
  const { ticker } = await params;
  const asset = findMarketAsset(ticker);

  if (!asset) notFound();

  // Peer instruments in the same market & sector (or same market if sector has few peers)
  const sameMarketAndSector = ALL_MARKET_ASSETS.filter(
    (peer) =>
      peer.market === asset.market &&
      peer.sector === asset.sector &&
      peer.ticker !== asset.ticker,
  );
  const peers =
    sameMarketAndSector.length > 0
      ? sameMarketAndSector.slice(0, 6)
      : ALL_MARKET_ASSETS.filter(
          (peer) => peer.market === asset.market && peer.ticker !== asset.ticker,
        ).slice(0, 6);

  const peerRows = referenceRows(peers);

  const referenceItems = [
    { term: "Ticker", detail: asset.ticker },
    { term: "Market", detail: MARKET_CATEGORY_LABELS[asset.market] },
    { term: "Exchange", detail: asset.exchange },
    { term: "Sector", detail: asset.frenchSector ?? SECTOR_LABELS[asset.sector] },
    ...(asset.isin ? [{ term: "ISIN", detail: asset.isin }] : []),
    ...(asset.compartment ? [{ term: "Compartment", detail: asset.compartment }] : []),
    { term: "Upstream Currency", detail: asset.displayCurrency },
    { term: "Settlement Currency", detail: asset.currency },
    { term: "API Route", detail: asset.apiEndpoint.split("?")[0] ?? asset.apiEndpoint },
    {
      term: "Modelled volatility",
      detail: `${(asset.annualVolatility * 100).toFixed(0)}% annualised`,
    },
    {
      term: "Modelled drift",
      detail: `${(asset.annualDrift * 100).toFixed(1)}% annualised`,
    },
    { term: "Status", detail: "Tradable in the simulator" },
  ];

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
            <li className="text-foreground-secondary">
              {MARKET_CATEGORY_LABELS[asset.market]}
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
                marketLabel={MARKET_CATEGORY_LABELS[asset.market]}
                exchange={asset.exchange}
                isin={asset.isin}
                compartment={asset.compartment}
                frenchSector={asset.frenchSector}
                apiEndpoint={asset.apiEndpoint}
                ratios={asset.ratios}
              />
            </Suspense>

            <section className="mt-12">
              <h2 className="text-xl font-semibold tracking-tight">About this instrument</h2>
              <div className="text-foreground-secondary mt-4 space-y-4 text-base leading-relaxed">
                <p>{asset.description}</p>
                <p>
                  Listed under the <strong>{MARKET_CATEGORY_LABELS[asset.market]}</strong> segment (
                  {asset.exchange}
                  {asset.isin ? `, ISIN ${asset.isin}` : ""}), its modelled annual volatility in the
                  continuous execution engine is {(asset.annualVolatility * 100).toFixed(0)}% with a
                  drift of {(asset.annualDrift * 100).toFixed(1)}%. Upstream reference data is mapped
                  to <code className="font-mono text-xs text-foreground">{asset.apiEndpoint}</code> on{" "}
                  <code className="font-mono text-xs text-foreground">api.wassly.tech</code>.
                </p>
              </div>
            </section>

            {peers.length > 0 ? (
              <section className="mt-12">
                <h2 className="text-xl font-semibold tracking-tight">
                  Peer {MARKET_CATEGORY_LABELS[asset.market]} instruments
                </h2>
                <p className="text-foreground-secondary mt-2 max-w-prose text-sm leading-relaxed">
                  Compare volatility, drift, and price dynamics across related instruments in the{" "}
                  {MARKET_CATEGORY_LABELS[asset.market]} universe.
                </p>
                <div className="mt-5">
                  <Suspense
                    fallback={<div className="border-rule h-64 animate-pulse rounded-lg border" />}
                  >
                    <QuoteBoard
                      rows={peerRows}
                      caption={`${MARKET_CATEGORY_LABELS[asset.market]} peers.`}
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
              <RuledList items={referenceItems} />
            </div>

            <div>
              <Button asChild fullWidth>
                <Link href="/portfolio">View portfolio &amp; holdings</Link>
              </Button>
              <Button asChild fullWidth variant="secondary" className="mt-2">
                <Link href="/market">Back to the market board</Link>
              </Button>
            </div>

            <Alert tone="warning" title="Educational Simulation">
              <p>
                All orders placed on {asset.ticker} ({asset.name}) execute inside the FSJESC-FMC
                educational matching engine using virtual capital in MAD. No real brokerage order is
                routed to {asset.exchange}.
              </p>
            </Alert>
          </aside>
        </div>
      </div>
    </main>
  );
}
