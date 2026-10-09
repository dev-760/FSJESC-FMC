/**
 * Market directory page.
 *
 * Shows all instruments with quotes, sector filtering, instant search,
 * and live continuous prices.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { MarketStatus } from "@/components/simulator/market-status";
import { QuoteBoard } from "@/components/financial/quote-board";
import { SimulatorNav } from "@/components/simulator/simulator-nav";
import { Badge } from "@/components/ui/badge";
import { Num, Delta } from "@/components/primitives/num";
import { market } from "@/lib/market";
import type { Quote } from "@/lib/market/provider";
import { SECTOR_LABELS, type Sector } from "@/data/assets";
import { cn } from "@/lib/cn";

const SECTORS = ["ALL", "BANKING", "TELECOM", "REAL_ESTATE", "ENERGY", "RETAIL", "INDUSTRY"] as const;

export default function MarketPage() {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    try {
      return market.getQuotes(new Date());
    } catch {
      return [];
    }
  });
  const isLoading = quotes.length === 0;
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  useEffect(() => {
    let mounted = true;

    const fetchQuotes = () => {
      try {
        const data = market.getQuotes(new Date());
        if (mounted) {
          setQuotes(data);
        }
      } catch (err) {
        console.error("Failed to fetch quotes:", err);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 3000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredQuotes = useMemo(() => {
    return quotes.filter((quote) => {
      const instrument = market.getInstrument(quote.symbol);
      const matchesSearch =
        quote.symbol.toLowerCase().includes(search.toLowerCase()) ||
        (instrument?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchesSector =
        selectedSector === "ALL" || (instrument?.sector === selectedSector);
      return matchesSearch && matchesSector;
    });
  }, [quotes, search, selectedSector]);

  return (
    <main id="main-content" className="flex-1">
      <SimulatorNav />

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header with Title and Market Status */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-rule pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
              Casablanca Market Board
            </h1>
            <p className="text-foreground-secondary text-sm mt-1">
              Deterministic simulated instruments priced in Moroccan dirhams (MAD)
            </p>
          </div>
          <MarketStatus />
        </div>

        {/* Filter and Search Bar */}
        <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Sector Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1" role="group" aria-label="Sector filters">
            {SECTORS.map((sector) => (
              <button
                key={sector}
                type="button"
                onClick={() => setSelectedSector(sector)}
                aria-pressed={selectedSector === sector}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer",
                  "focus-visible:outline-2 focus-visible:outline-ring",
                  selectedSector === sector
                    ? "bg-surface-inset text-bull font-semibold border border-rule-strong"
                    : "text-foreground-secondary hover:text-foreground hover:bg-surface-sunken border border-transparent",
                )}
              >
                {sector === "ALL" ? "All Sectors" : SECTOR_LABELS[sector]}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-foreground-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search ticker or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-raised border border-rule rounded-md pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-foreground-muted focus-visible:outline-2 focus-visible:outline-ring"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6 animate-pulse">
            <div className="bg-surface-sunken h-64 rounded-lg border border-rule" />
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }, (_, idx) => (
                <div key={idx} className="bg-surface-sunken h-36 rounded-lg border border-rule" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Detailed Quote Board */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold label text-foreground-secondary">Continuous Order Board</h2>
                <span className="text-2xs numeric text-foreground-muted">Updated every 3s</span>
              </div>
              <QuoteBoard
                rows={filteredQuotes.map((quote) => {
                  const instrument = market.getInstrument(quote.symbol);
                  return {
                    asset: {
                      ticker: quote.symbol,
                      name: instrument?.name || quote.symbol,
                      sector: (instrument?.sector as Sector) || "INDUSTRY",
                      description: "",
                      currency: "MAD" as const,
                      startingPriceCents: Number(quote.lastCents),
                      annualVolatility: instrument?.annualVolatility || 0.2,
                      annualDrift: instrument?.annualDrift || 0.05,
                    },
                    changeBps: quote.changeBps,
                  };
                })}
                caption="Simulated Casablanca BVC quotations"
              />
            </div>

            {/* Instrument Cards Grid */}
            <div className="border-t border-rule pt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Tradeable Instruments ({filteredQuotes.length})
                </h2>
              </div>

              {filteredQuotes.length === 0 ? (
                <div className="bg-surface-sunken rounded-lg border border-rule p-8 text-center">
                  <p className="text-foreground-muted text-sm">No instruments match your search filter.</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                  {filteredQuotes.map((quote) => {
                    const instrument = market.getInstrument(quote.symbol);
                    const isUp = quote.changeBps >= 0n;

                    return (
                      <Link
                        key={quote.symbol}
                        href={`/simulator/market/${quote.symbol.toLowerCase()}`}
                        className="group bg-surface-raised hover:bg-surface-inset rounded-lg p-4 border border-rule hover:border-rule-strong transition-all duration-150 flex flex-col justify-between focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-bold text-base text-bull group-hover:text-bull-hover">
                              {quote.symbol}
                            </span>
                            {instrument && (
                              <Badge tone="neutral" size="sm">
                                {SECTOR_LABELS[instrument.sector as Sector]}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-foreground-secondary truncate mt-1">
                            {instrument?.name ?? quote.symbol}
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-rule/60 flex items-end justify-between">
                          <div>
                            <p className="numeric text-2xl font-bold tracking-tight text-foreground">
                              <Num cents={quote.lastCents} />
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {isUp ? (
                                <ArrowUpRight className="h-3.5 w-3.5 text-bull" />
                              ) : (
                                <ArrowDownRight className="h-3.5 w-3.5 text-bear" />
                              )}
                              <Delta bps={quote.changeBps} size="xs" />
                            </div>
                          </div>

                          <span className="text-2xs font-medium text-foreground-muted group-hover:text-bull transition-colors flex items-center gap-0.5">
                            Trade &rarr;
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
