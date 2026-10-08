import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RuledList } from "@/components/layout/container";
import { Alert } from "@/components/ui/alert";
import { QuoteBoard, referenceRows } from "@/components/financial/quote-board";
import { ASSETS, SECTOR_LABELS } from "@/data/assets";
import { formatMAD } from "@/lib/format";
import { money } from "@/lib/money";
import { DISC_1 } from "@/config/site";

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
}: PageProps<"/simulator/market/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  const asset = ASSETS.find((candidate) => candidate.ticker.toLowerCase() === ticker.toLowerCase());

  if (!asset) {
    return { title: "Instrument not found", robots: { index: false, follow: false } };
  }

  const description = `${asset.ticker} — ${asset.name}, a fictional instrument on the FSJESC Financial Markets Club simulated market. ${SECTOR_LABELS[asset.sector]} sector. Simulated price, no real security.`;

  return {
    title: `${asset.ticker} — ${asset.name}`,
    description,
    alternates: { canonical: `/simulator/market/${asset.ticker.toLowerCase()}` },
  };
}

export default async function InstrumentPage({ params }: PageProps<"/simulator/market/[ticker]">) {
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
  const price = money(asset.startingPriceCents);

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="text-foreground-secondary flex items-center gap-2 text-sm">
            <li>
              <Link
                href="/simulator/market"
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

        <div className="grid gap-10 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:gap-16">
          {/* ── Chart region ─────────────────────────────────────────── */}
          <div>
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
              <div>
                <p className="label mb-2">{SECTOR_LABELS[asset.sector]}</p>
                <h1 className="text-3xl font-semibold tracking-[-0.028em] sm:text-4xl">
                  {asset.name}
                </h1>
                <p className="numeric text-foreground-secondary mt-1 text-lg">{asset.ticker}</p>
              </div>
              <div className="text-right">
                <p className="numeric text-4xl font-semibold tracking-tight">{formatMAD(price)}</p>
                <p className="label mt-1">Reference price · MAD</p>
              </div>
            </div>

            {/*
              Chart region. Phase 7 fills this with a `lightweight-charts` candle
              series fed by the simulated price model, with a data-table
              alternative alongside it so the information does not depend on being
              able to see it (Part 9.3).
            */}
            <div className="border-rule bg-surface-raised mt-8 overflow-hidden rounded-lg border">
              <div className="border-rule flex items-center justify-between border-b px-4 py-2.5">
                <p className="label">Price history</p>
                <p className="label">Chart arrives with the price model</p>
              </div>
              {/*
                A ruled plot frame with axis furniture. This is geometry, not a
                picture pretending to be one: the gridlines and the y-axis ticks are
                real reference marks, and the series area is left empty rather than
                filled with a decorative squiggle that implies data we do not have.
              */}
              <div
                aria-hidden="true"
                className="bg-surface-sunken relative h-64"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, var(--rule-hairline) 1px, transparent 1px), linear-gradient(to bottom, var(--rule-hairline) 1px, transparent 1px)",
                  backgroundSize: "12.5% 100%, 100% 25%",
                }}
              >
                <div className="border-rule bg-surface absolute inset-y-0 left-0 flex w-16 flex-col justify-between border-r px-2 py-2">
                  {[price, price, price, price, price].map((value, index) => (
                    <span key={index} className="numeric text-2xs text-foreground-muted text-right">
                      {formatMAD(value)}
                    </span>
                  ))}
                </div>
              </div>
              <p className="border-rule text-foreground-muted border-t px-4 py-2.5 text-xs leading-relaxed">
                {DISC_1} The series arrives in Phase 7. Every charted value will also be available
                as a data table.
              </p>
            </div>

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
                  <QuoteBoard
                    rows={peerRows}
                    caption={`${SECTOR_LABELS[asset.sector]} peers. The change column is a deterministic placeholder until the price model ships.`}
                    showParameters={false}
                    animate={false}
                  />
                </div>
              </section>
            ) : null}
          </div>

          {/* ── Reference rail ───────────────────────────────────────── */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
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

            <div className="mt-8">
              <Button asChild fullWidth>
                <Link href="/simulator">Open a portfolio</Link>
              </Button>
              <Button asChild fullWidth variant="secondary" className="mt-2">
                <Link href="/simulator/market">Back to the market board</Link>
              </Button>
            </div>

            <Alert tone="warning" title="Not a real security" className="mt-6">
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
