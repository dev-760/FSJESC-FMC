import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase } from "lucide-react";
import { QuoteBoard, referenceRows } from "@fsjesc/ui/financial/quote-board";
import { OrderTicketWrapper } from "@fsjesc/ui/simulator/order-ticket-wrapper";
import { InstrumentTerminal } from "@fsjesc/ui/simulator/instrument-terminal";
import {
  ALL_MARKET_ASSETS,
  MARKET_CATEGORY_LABELS,
  SECTOR_LABELS,
  findMarketAsset,
} from "@fsjesc/domain/assets";

export function generateStaticParams(): Array<{ ticker: string }> {
  return ALL_MARKET_ASSETS.map((asset) => ({ ticker: asset.ticker.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: PageProps<"/market/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  const asset = findMarketAsset(ticker);

  if (!asset) {
    return { title: "Instrument introuvable", robots: { index: false, follow: false } };
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
    { term: "Symbole Ticker", detail: asset.ticker },
    { term: "Marché", detail: MARKET_CATEGORY_LABELS[asset.market] },
    { term: "Place de Cotation", detail: asset.exchange },
    { term: "Secteur", detail: asset.frenchSector ?? SECTOR_LABELS[asset.sector] },
    ...(asset.isin ? [{ term: "Code ISIN", detail: asset.isin }] : []),
    ...(asset.compartment ? [{ term: "Compartiment", detail: asset.compartment }] : []),
    { term: "Devise d'Origine", detail: asset.displayCurrency },
    { term: "Devise de Règlement", detail: asset.currency },
    { term: "Route API", detail: asset.apiEndpoint.split("?")[0] ?? asset.apiEndpoint },
    {
      term: "Volatilité Modélisée",
      detail: `${(asset.annualVolatility * 100).toFixed(0)}% / an`,
    },
    {
      term: "Dérive Modélisée (μ)",
      detail: `${(asset.annualDrift * 100).toFixed(1)}% / an`,
    },
  ];

  return (
    <main id="main-content" className="space-y-6">
      {/* Top Breadcrumb & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Fil d'Ariane">
          <ol className="flex items-center gap-2 text-xs font-mono text-[var(--sim-ink-3)]">
            <li>
              <Link
                href="/market"
                className="inline-flex items-center gap-1 text-[var(--sim-ink-2)] hover:text-[var(--sim-ink)] font-semibold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Marché &amp; Carnet</span>
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>{MARKET_CATEGORY_LABELS[asset.market]}</li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="font-bold text-[var(--sim-gold-ink)]">
              {asset.ticker}
            </li>
          </ol>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] hover:border-[var(--sim-gold)] px-3 py-1.5 text-xs font-semibold text-[var(--sim-ink)]"
          >
            <Briefcase className="h-3.5 w-3.5 text-[var(--sim-gold-ink)]" />
            <span>Portefeuille &amp; Risque</span>
          </Link>
        </div>
      </div>

      {/* Main 2-Column Instrument Terminal + Order Ticket */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6 min-w-0">
          <div className="sim-card p-5">
            <Suspense
              fallback={<div className="h-[32rem] animate-pulse rounded-xl bg-[var(--sim-bg-subtle)]" />}
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
          </div>

          {peers.length > 0 ? (
            <section className="sim-card p-5">
              <div className="mb-4">
                <h2 className="sim-card__title">
                  Instruments Comparables — {MARKET_CATEGORY_LABELS[asset.market]}
                </h2>
                <p className="sim-card__sub">
                  Comparez les cours et variations des valeurs du même segment
                </p>
              </div>
              <Suspense
                fallback={<div className="h-48 animate-pulse rounded-xl bg-[var(--sim-bg-subtle)]" />}
              >
                <QuoteBoard
                  rows={peerRows}
                  caption={`Comparables ${MARKET_CATEGORY_LABELS[asset.market]}`}
                  showParameters={false}
                  animate={false}
                />
              </Suspense>
            </section>
          ) : null}
        </div>

        {/* Right Sticky Order Ticket & Reference Data */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <Suspense
            fallback={<div className="h-96 animate-pulse rounded-2xl bg-[var(--sim-bg-card)]" />}
          >
            <OrderTicketWrapper
              symbol={asset.ticker}
              currentPriceCents={asset.startingPriceCents}
              availableCashCents={10_000_000n}
            />
          </Suspense>

          <div className="sim-card p-4">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--sim-ink-2)] pb-2.5 border-b border-[var(--sim-border)]">
              Caractéristiques de l&apos;Instrument
            </h3>
            <dl className="mt-2.5 divide-y divide-[var(--sim-border)] text-xs">
              {referenceItems.map((item) => (
                <div key={item.term} className="flex items-center justify-between py-2 gap-2">
                  <dt className="text-[var(--sim-ink-3)]">{item.term}</dt>
                  <dd className="font-mono font-semibold text-[var(--sim-ink)] text-right">
                    {item.detail}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
