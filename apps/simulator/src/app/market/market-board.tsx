"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Search } from "lucide-react";
import { MarketStatus } from "@fsjesc/ui/simulator/market-status";
import { QuoteBoard } from "@fsjesc/ui/financial/quote-board";
import { Badge } from "@fsjesc/ui/badge";
import { Delta, Num } from "@fsjesc/ui/primitives/num";
import { market } from "@fsjesc/domain/market";
import type { Sector } from "@fsjesc/domain/assets";
import { SECTOR_LABELS } from "@fsjesc/domain/assets";
import { cn } from "@fsjesc/config/cn";

/**
 * A quote as it arrives over HTTP.
 *
 * The engine works in `bigint` centimes, which JSON cannot represent, so the
 * API serialises money as a decimal string and the delta as a number. Parsing
 * back to `bigint` here keeps every downstream calculation exact — formatting a
 * float would reintroduce the drift the integer model exists to prevent.
 */
interface WireQuote {
  symbol: string;
  lastCents: string;
  changeBps: number;
}

function parseQuote(wire: WireQuote): { symbol: string; lastCents: bigint; changeBps: bigint } {
  return {
    symbol: wire.symbol,
    lastCents: BigInt(wire.lastCents),
    changeBps: BigInt(wire.changeBps),
  };
}

type Quote = ReturnType<typeof parseQuote>;

const SECTORS = ["ALL", "BANKING", "TELECOM", "REAL_ESTATE", "ENERGY", "RETAIL", "INDUSTRY"] as const;

/** How often the board refreshes. Matches the site-wide quote cadence. */
const REFRESH_MS = 3000;

export function MarketBoard() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [failed, setFailed] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  const load = useCallback(async (signal: AbortSignal) => {
    const response = await fetch("/api/market/quotes", { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`Quotes request failed: ${response.status}`);
    const wire = (await response.json()) as WireQuote[];
    setQuotes(wire.map(parseQuote));
    setFailed(false);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const refresh = async () => {
      try {
        await load(controller.signal);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to refresh quotes:", error);
        setFailed(true);
      }
    };

    void refresh();
    const timer = setInterval(refresh, REFRESH_MS);

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [load]);

  const filteredQuotes = useMemo(
    () =>
      quotes.filter((quote) => {
        const instrument = market.getInstrument(quote.symbol);
        const matchesSearch =
          quote.symbol.toLowerCase().includes(search.toLowerCase()) ||
          (instrument?.name.toLowerCase().includes(search.toLowerCase()) ?? false);
        const matchesSector = selectedSector === "ALL" || instrument?.sector === selectedSector;
        return matchesSearch && matchesSector;
      }),
    [quotes, search, selectedSector],
  );

  const isLoading = quotes.length === 0 && !failed;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header with title and market status */}
      <div className="mb-6 flex flex-col gap-4 border-b border-rule pb-6 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Casablanca Market Board
          </h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Deterministic simulated instruments priced in Moroccan dirhams (MAD)
          </p>
        </div>
        <Suspense fallback={<div className="h-5 w-32 animate-pulse rounded bg-surface-inset" />}>
          <MarketStatus />
        </Suspense>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
        <div
          className="flex items-center gap-1 overflow-x-auto pb-1"
          role="group"
          aria-label="Sector filters"
        >
          {SECTORS.map((sector) => (
            <button
              key={sector}
              type="button"
              onClick={() => setSelectedSector(sector)}
              aria-pressed={selectedSector === sector}
              className={cn(
                "cursor-pointer whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                "focus-visible:outline-2 focus-visible:outline-ring",
                selectedSector === sector
                  ? "border border-rule-strong bg-surface-inset font-semibold text-bull"
                  : "border border-transparent text-foreground-secondary hover:bg-surface-sunken hover:text-foreground",
              )}
            >
              {sector === "ALL" ? "All Sectors" : SECTOR_LABELS[sector]}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-foreground-muted"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticker or company…"
            aria-label="Search instruments"
            className="w-full rounded-md border border-rule bg-surface-raised py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-foreground-muted focus-visible:outline-2 focus-visible:outline-ring"
          />
        </div>
      </div>

      {failed ? (
        <div
          role="alert"
          className="rounded-lg border border-negative/40 bg-negative-subtle px-4 py-3 text-sm"
        >
          Quotes are unavailable. The board will keep trying every {REFRESH_MS / 1000}s.
        </div>
      ) : null}

      {isLoading ? (
        <div className="animate-pulse space-y-6">
          <div className="h-64 rounded-lg border border-rule bg-surface-sunken" />
        </div>
      ) : (
        <div className="space-y-8">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="label text-sm font-semibold text-foreground-secondary">
                Continuous Order Board
              </h2>
              <span className="numeric text-2xs text-foreground-muted">
                Updated every {REFRESH_MS / 1000}s
              </span>
            </div>
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-lg border border-rule" />}
            >
              <QuoteBoard
                rows={filteredQuotes.map((quote) => {
                  const instrument = market.getInstrument(quote.symbol);
                  return {
                    asset: {
                      ticker: quote.symbol,
                      name: instrument?.name ?? quote.symbol,
                      sector: (instrument?.sector as Sector) ?? "INDUSTRY",
                      description: "",
                      currency: "MAD" as const,
                      startingPriceCents: Number(quote.lastCents),
                      annualVolatility: instrument?.annualVolatility ?? 0.2,
                      annualDrift: instrument?.annualDrift ?? 0.05,
                    },
                    changeBps: quote.changeBps,
                  };
                })}
                caption="Simulated Casablanca BVC quotations"
              />
            </Suspense>
          </div>

          <div className="border-t border-rule pt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Tradeable Instruments ({filteredQuotes.length})
              </h2>
            </div>

            {filteredQuotes.length === 0 ? (
              <div className="rounded-lg border border-rule bg-surface-sunken p-8 text-center">
                <p className="text-sm text-foreground-muted">
                  No instruments match your search filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredQuotes.map((quote) => {
                  const instrument = market.getInstrument(quote.symbol);
                  const isUp = quote.changeBps >= 0n;

                  return (
                    <Link
                      key={quote.symbol}
                      href={`/market/${quote.symbol.toLowerCase()}`}
                      className="group flex flex-col justify-between rounded-lg border border-rule bg-surface-raised p-4 transition-colors duration-150 hover:border-rule-strong hover:bg-surface-inset focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-base font-bold text-bull">
                            {quote.symbol}
                          </span>
                          {instrument ? (
                            <Badge tone="neutral" size="sm">
                              {SECTOR_LABELS[instrument.sector as Sector]}
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 truncate text-xs text-foreground-secondary">
                          {instrument?.name ?? quote.symbol}
                        </p>
                      </div>

                      <div className="mt-4 flex items-end justify-between border-t border-rule/60 pt-3">
                        <div>
                          <p className="numeric text-2xl font-bold tracking-tight text-foreground">
                            <Num cents={quote.lastCents} />
                          </p>
                          <div className="mt-0.5 flex items-center gap-1.5">
                            {isUp ? (
                              <ArrowUpRight aria-hidden className="h-3.5 w-3.5 text-bull" />
                            ) : (
                              <ArrowDownRight aria-hidden className="h-3.5 w-3.5 text-bear" />
                            )}
                            <Delta bps={quote.changeBps} size="xs" />
                          </div>
                        </div>

                        <span className="flex items-center gap-0.5 text-2xs font-medium text-foreground-muted transition-colors group-hover:text-bull">
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
  );
}