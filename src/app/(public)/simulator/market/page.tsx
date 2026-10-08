import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RuledList } from "@/components/layout/container";
import { QuoteBoard, referenceRows } from "@/components/financial/quote-board";
import { ASSETS, SECTORS, SECTOR_LABELS } from "@/data/assets";

export const metadata: Metadata = {
  title: "Market overview",
  description:
    "The eight fictional instruments of the simulated Moroccan market, with modelled volatility and drift. Simulated prices, no real securities.",
  alternates: { canonical: "/simulator/market" },
};

/**
 * Market overview (Part 7.4).
 *
 * The previous version grouped instruments into sector sections, which produced
 * six ragged rows of one or two cards each — a layout that wasted most of the
 * page and hid the thing a reader actually wants: every instrument, aligned, and
 * comparable at a glance. A market is a board. This is one.
 *
 * Phase 7 replaces the static reference price with the deterministic price model
 * and adds a live series column; the column set is stable so that is a value
 * change rather than a redesign.
 */
export default function MarketPage() {
  const rows = referenceRows(ASSETS);
  const bySector = SECTORS.map((sector) => ({
    sector,
    label: SECTOR_LABELS[sector],
    count: ASSETS.filter((asset) => asset.sector === sector).length,
  }));

  return (
    <main id="main-content" className="flex-1">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="lg:max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-[-0.028em]">The simulated market</h1>
          <p className="measure text-foreground-secondary mt-5 text-lg leading-relaxed">
            Eight invented instruments across six sectors, denominated in Moroccan dirhams. Every
            price is produced by a deterministic model, so a figure quoted today is reproduced
            exactly tomorrow.
          </p>
        </div>

        <div className="mt-10">
          <QuoteBoard
            rows={rows}
            caption="Reference prices are the model's opening values. Modelled volatility and drift are the two parameters that generate each instrument's price path; they are chosen to make a sector's behaviour instructive, not observed from any real business."
          />
        </div>

        <div className="mt-10 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/simulator">Open a portfolio</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/education">Read how pricing works</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sector coverage</h2>
            <p className="measure text-foreground-secondary mt-3 text-sm leading-relaxed">
              The six sectors exist so a challenge can produce different outcomes depending on where
              a portfolio is concentrated — a lesson no single-sector board could teach.
            </p>
          </div>
          <RuledList
            items={bySector.map(({ sector, label, count }) => ({
              term: label,
              detail: `${count} ${count === 1 ? "instrument" : "instruments"} — ${ASSETS.filter(
                (a) => a.sector === sector,
              )
                .map((a) => a.ticker)
                .join(", ")}`,
            }))}
          />
        </div>

        <div className="mt-14">
          <Alert tone="warning" title="These are not real securities">
            <div className="mt-1 space-y-2.5">
              {[
                "No company, index or exchange is represented here, and nothing on this board corresponds to anything tradable outside the platform.",
                "The change column is a deterministic placeholder so the board's layout is honest about its own state. It is replaced by the price model in Phase 7 and labelled as a measured move at that point.",
                "Performance attributed to these instruments describes a simulation and nothing else. The model is specified in full so a result can be checked rather than believed.",
              ].map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </Alert>
        </div>
      </div>
    </main>
  );
}
