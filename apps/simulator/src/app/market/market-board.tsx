"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ArrowRightLeft,
  ExternalLink,
  Globe,
  Layers,
  LayoutGrid,
  Columns3,
  Search,
} from "lucide-react";
import { QuoteBoard } from "@fsjesc/ui/financial/quote-board";
import { Badge } from "@fsjesc/ui/badge";
import { Delta, Num } from "@fsjesc/ui/primitives/num";
import { InstrumentTerminal } from "@fsjesc/ui/simulator/instrument-terminal";
import { OrderTicketWrapper } from "@fsjesc/ui/simulator/order-ticket-wrapper";
import { useSimulatorPortfolio } from "@fsjesc/ui/simulator/simulator-store";
import { market } from "@fsjesc/domain/market";
import {
  ALL_MARKET_ASSETS,
  CSE_SECTOR_SUMMARIES,
  FOREX_CURRENCY_LIST,
  MARKET_CATEGORIES,
  MARKET_CATEGORY_DESCRIPTIONS,
  MARKET_CATEGORY_LABELS,
  SAMPLE_OPTION_CONTRACTS,
  SECTOR_LABELS,
  TREASURY_YIELD_CURVE,
  findMarketAsset,
  type MarketCategoryFilter,
  type Sector,
} from "@fsjesc/domain/assets";
import { cn } from "@fsjesc/config/cn";

interface LocalQuote {
  symbol: string;
  lastCents: bigint;
  bidCents: number;
  askCents: number;
  changeBps: bigint;
  volume: number;
}

const SECTORS = [
  "ALL",
  "BANKING",
  "TELECOM",
  "REAL_ESTATE",
  "ENERGY",
  "RETAIL",
  "INDUSTRY",
] as const;

const REFRESH_MS = 3000;

export function MarketBoard() {
  const { telemetry } = useSimulatorPortfolio(3000);
  const [quotes, setQuotes] = useState<LocalQuote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedMarket, setSelectedMarket] = useState<MarketCategoryFilter>("ALL");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");
  const [activeSymbol, setActiveSymbol] = useState<string>("ATW");
  const [layoutMode, setLayoutMode] = useState<"terminal" | "catalog">("terminal");

  // Interactive Forex Converter state (/api/v1/forex/convert)
  const [fxAmount, setFxAmount] = useState<string>("10000");
  const [fxFrom, setFxFrom] = useState<string>("MAD");
  const [fxTo, setFxTo] = useState<string>("USD");

  // Interactive Options Chain state (/api/v1/options/chain)
  const [optionUnderlying, setOptionUnderlying] = useState<string>("ALL");
  const [optionTypeFilter, setOptionTypeFilter] = useState<"ALL" | "CALL" | "PUT">("ALL");

  // Compute deterministic quotes locally from the simulated market engine (and sync with effectiveDate)
  useEffect(() => {
    const computeQuotes = () => {
      const all = market.getQuotes(telemetry.effectiveDate);
      setQuotes(
        all.map((q) => ({
          symbol: q.symbol,
          lastCents: BigInt(q.lastCents),
          bidCents: q.bidCents,
          askCents: q.askCents,
          changeBps: q.changeBps,
          volume: q.volume,
        })),
      );
    };
    computeQuotes();
    const timer = setInterval(computeQuotes, REFRESH_MS);
    return () => clearInterval(timer);
  }, [telemetry.effectiveDate]);

  // Count instruments per market category
  const marketCounts = useMemo(() => {
    const counts: Record<MarketCategoryFilter, number> = {
      ALL: ALL_MARKET_ASSETS.length,
      CSE: 0,
      STOCKS: 0,
      ETFS: 0,
      FUTURES: 0,
      CRYPTO: 0,
      FOREX: 0,
      BONDS: 0,
      OPTIONS: 0,
    };
    for (const asset of ALL_MARKET_ASSETS) {
      counts[asset.market] += 1;
    }
    return counts;
  }, []);

  const tradeableSet = useMemo(
    () => new Set(ALL_MARKET_ASSETS.map((a) => a.ticker.toUpperCase())),
    [],
  );

  const filteredQuotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return quotes.filter((quote) => {
      if (!tradeableSet.has(quote.symbol.toUpperCase())) return false;
      const extended = findMarketAsset(quote.symbol);
      const instrument = market.getInstrument(quote.symbol);

      const matchesMarket =
        selectedMarket === "ALL" || extended?.market === selectedMarket;

      const matchesSector =
        selectedSector === "ALL" ||
        extended?.sector === selectedSector ||
        instrument?.sector === selectedSector;

      const matchesSearch =
        q.length === 0 ||
        quote.symbol.toLowerCase().includes(q) ||
        (extended?.name.toLowerCase().includes(q) ?? false) ||
        (extended?.exchange.toLowerCase().includes(q) ?? false) ||
        (extended?.isin?.toLowerCase().includes(q) ?? false) ||
        (extended?.frenchSector?.toLowerCase().includes(q) ?? false);

      return matchesMarket && matchesSector && matchesSearch;
    });
  }, [quotes, search, selectedMarket, selectedSector, tradeableSet]);

  const activeAsset = useMemo(
    () => findMarketAsset(activeSymbol) ?? ALL_MARKET_ASSETS[0]!,
    [activeSymbol],
  );

  // Forex conversion calculation
  const fxResult = useMemo(() => {
    const parsed = Number.parseFloat(fxAmount);
    const amount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    const fromEntry =
      FOREX_CURRENCY_LIST.find((c) => c.code === fxFrom) ?? FOREX_CURRENCY_LIST[0]!;
    const toEntry =
      FOREX_CURRENCY_LIST.find((c) => c.code === fxTo) ?? FOREX_CURRENCY_LIST[1]!;
    const amountInUsd = amount / fromEntry.ratePerUsd;
    const converted = amountInUsd * toEntry.ratePerUsd;
    const rate = toEntry.ratePerUsd / fromEntry.ratePerUsd;
    return { amount, converted, rate };
  }, [fxAmount, fxFrom, fxTo]);

  // Filtered option contracts
  const filteredOptions = useMemo(() => {
    return SAMPLE_OPTION_CONTRACTS.filter((c) => {
      const matchUnderlying = optionUnderlying === "ALL" || c.underlying === optionUnderlying;
      const matchType = optionTypeFilter === "ALL" || c.type === optionTypeFilter;
      return matchUnderlying && matchType;
    });
  }, [optionUnderlying, optionTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge tone="accent" size="sm">
              8 Classes d&apos;Actifs
            </Badge>
            <Badge tone="neutral" size="sm">
              {ALL_MARKET_ASSETS.length} Instruments Cotés
            </Badge>
            <span className="font-mono text-2xs text-[var(--sim-ink-3)]">
              Flux : api.wassly.tech/api/v1 · Carnet L2 Continu
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--sim-ink)] sm:text-3xl">
            Marché &amp; Carnet d&apos;Ordres
          </h1>
          <p className="mt-1 text-sm text-[var(--sim-ink-3)]">
            {selectedMarket === "ALL"
              ? "Terminal de négociation unifié : Bourse de Casablanca (CSE), Actions US, ETF, Futures, Crypto, Forex, Obligations et Options."
              : MARKET_CATEGORY_DESCRIPTIONS[selectedMarket]}
          </p>
        </div>

        {/* Mode Switcher: 3-Pane Terminal vs Full Multi-Market Catalog */}
        <div className="flex items-center gap-1 rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setLayoutMode("terminal")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              layoutMode === "terminal"
                ? "bg-[var(--sim-navy)] text-[#f0d28a] shadow-2xs"
                : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
            )}
          >
            <Columns3 className="h-3.5 w-3.5" />
            <span>Terminal 3-Panneaux</span>
          </button>
          <button
            type="button"
            onClick={() => setLayoutMode("catalog")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer",
              layoutMode === "catalog"
                ? "bg-[var(--sim-navy)] text-[#f0d28a] shadow-2xs"
                : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Catalogue &amp; Outils ({filteredQuotes.length})</span>
          </button>
        </div>
      </div>

      {/* Primary Market / Asset Class Tabs (all 8 API routers) */}
      <div
        className="flex items-center gap-1.5 overflow-x-auto pb-2"
        role="tablist"
        aria-label="Classes d'actifs du marché"
      >
        {MARKET_CATEGORIES.map((category) => {
          const active = selectedMarket === category;
          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelectedMarket(category)}
              className={cn(
                "flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition-all",
                active
                  ? "border border-[var(--sim-gold)] bg-[var(--sim-navy)] text-[#f0d28a] shadow-xs"
                  : "border border-[var(--sim-border)] bg-[var(--sim-bg-card)] text-[var(--sim-ink-2)] hover:border-[var(--sim-border-strong)] hover:bg-[var(--sim-bg-subtle)]",
              )}
            >
              <span>{MARKET_CATEGORY_LABELS[category]}</span>
              <span
                className={cn(
                  "numeric rounded-full px-1.5 py-0.5 text-[10px]",
                  active
                    ? "bg-white/15 font-bold text-[#f0d28a]"
                    : "bg-[var(--sim-bg-muted)] text-[var(--sim-ink-3)]",
                )}
              >
                {marketCounts[category]}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── 3-PANE TRADING TERMINAL (matches mockups/Simulator.html .market-layout) ── */}
      {layoutMode === "terminal" && (
        <div className="sim-terminal-grid">
          {/* LEFT PANE: Watchlist & Search */}
          <div className="sim-terminal-pane--left">
            <div className="p-3.5 border-b border-[var(--sim-border)] space-y-2.5 bg-[var(--sim-bg-subtle)]">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--sim-ink-2)]">
                  Cotation ({filteredQuotes.length})
                </span>
                <span className="font-mono text-[10px] text-[var(--sim-emerald)]">
                  ● Temps réel
                </span>
              </div>
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[var(--sim-ink-3)]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ticker, société, ISIN..."
                  aria-label="Rechercher un instrument"
                  className="w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-card)] py-1.5 pl-8 pr-2.5 text-xs text-[var(--sim-ink)] placeholder:text-[var(--sim-ink-4)] focus-visible:outline-2 focus-visible:outline-ring"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[var(--sim-border)] max-h-[760px]">
              {filteredQuotes.length === 0 ? (
                <div className="p-6 text-center text-xs text-[var(--sim-ink-3)]">
                  Aucun instrument ne correspond à votre filtre.
                </div>
              ) : (
                filteredQuotes.map((q) => {
                  const asset = findMarketAsset(q.symbol);
                  const isSelected = q.symbol.toUpperCase() === activeAsset.ticker.toUpperCase();
                  const isUp = q.changeBps >= 0n;
                  const heldPos = telemetry.positions.find(
                    (p) => p.symbol.toUpperCase() === q.symbol.toUpperCase(),
                  );

                  return (
                    <button
                      key={q.symbol}
                      type="button"
                      onClick={() => setActiveSymbol(q.symbol)}
                      className={cn(
                        "w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-2 cursor-pointer",
                        isSelected
                          ? "bg-[var(--sim-gold-tint)] border-l-3 border-l-[var(--sim-gold)]"
                          : "hover:bg-[var(--sim-bg-subtle)]",
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-[var(--sim-ink)]">
                            {q.symbol}
                          </span>
                          <span className="rounded bg-[var(--sim-bg-muted)] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold text-[var(--sim-ink-3)]">
                            {asset?.market ?? "CSE"}
                          </span>
                          {heldPos && (
                            <span className="rounded bg-[var(--sim-emerald-tint)] px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-[var(--sim-emerald)]">
                              {heldPos.quantity}t
                            </span>
                          )}
                        </div>
                        <p className="truncate text-[11px] text-[var(--sim-ink-3)] mt-0.5">
                          {asset?.name ?? q.symbol}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono text-xs font-bold text-[var(--sim-ink)]">
                          {(Number(q.lastCents) / 100).toLocaleString("fr-MA", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <span
                          className={cn(
                            "font-mono text-[10.5px] font-semibold",
                            isUp ? "text-[var(--sim-emerald)]" : "text-[var(--sim-terracotta)]",
                          )}
                        >
                          {isUp ? "+" : ""}
                          {(Number(q.changeBps) / 100).toFixed(2)}%
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CENTER PANE: Interactive Chart, OHLCV & L2 Order Book */}
          <div className="sim-terminal-pane--center p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--sim-border)] pb-2.5">
              <div className="flex items-center gap-2 text-xs text-[var(--sim-ink-3)] font-mono">
                <span>Poste Graphique &amp; Profondeur L2</span>
                <span>·</span>
                <strong className="text-[var(--sim-ink)]">{activeAsset.ticker}</strong>
              </div>
              <Link
                href={`/market/${activeAsset.ticker.toLowerCase()}`}
                className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-[var(--sim-indigo)] hover:underline"
              >
                <span>Fiche détaillée de {activeAsset.ticker}</span>
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>

            <InstrumentTerminal
              ticker={activeAsset.ticker}
              name={activeAsset.name}
              sectorLabel={SECTOR_LABELS[activeAsset.sector]}
              startingPriceCents={activeAsset.startingPriceCents}
              annualVolatility={activeAsset.annualVolatility}
              annualDrift={activeAsset.annualDrift}
              description={activeAsset.description}
              marketLabel={MARKET_CATEGORY_LABELS[activeAsset.market]}
              exchange={activeAsset.exchange}
              isin={activeAsset.isin}
              compartment={activeAsset.compartment}
              frenchSector={activeAsset.frenchSector}
              apiEndpoint={activeAsset.apiEndpoint}
              ratios={activeAsset.ratios}
            />
          </div>

          {/* RIGHT PANE: Order Ticket & Active Symbol Working Orders */}
          <div className="sim-terminal-pane--right p-4">
            <OrderTicketWrapper
              symbol={activeAsset.ticker}
              currentPriceCents={activeAsset.startingPriceCents}
              availableCashCents={telemetry.availableCashCents}
            />
          </div>
        </div>
      )}

      {/* ── SPECIALIZED API MARKET PANELS (CSE, BONDS, FOREX, OPTIONS) ───────── */}

      {/* 1. CSE Casablanca Sector Summary (/api/v1/cse/sector-summary) */}
      {(selectedMarket === "CSE" || layoutMode === "catalog") && selectedMarket === "CSE" && (
        <section className="sim-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sim-border)] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-[var(--sim-emerald)]" />
              <h2 className="text-sm font-semibold tracking-tight text-[var(--sim-ink)]">
                Bourse de Casablanca — Synthèse Sectorielle
              </h2>
              <Badge tone="neutral" size="sm">
                /api/v1/cse/sector-summary
              </Badge>
            </div>
            <span className="numeric text-2xs text-[var(--sim-ink-3)]">
              {CSE_SECTOR_SUMMARIES.length} Secteurs Officiels CSE · Compartiment Principal F · 38 Sociétés
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CSE_SECTOR_SUMMARIES.map((sec) => {
              const isPos = sec.averageChangePercent >= 0;
              return (
                <div
                  key={sec.sector}
                  className="flex flex-col justify-between rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-3.5"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold text-[var(--sim-ink)]">{sec.sector}</p>
                        <p className="text-2xs text-[var(--sim-ink-3)]">{sec.englishLabel}</p>
                      </div>
                      <span
                        className={cn(
                          "sim-delta",
                          isPos ? "sim-delta--up" : "sim-delta--down",
                        )}
                      >
                        {isPos ? "+" : ""}
                        {sec.averageChangePercent.toFixed(2)}%
                      </span>
                    </div>
                    <div className="mt-2.5 flex items-center gap-3 text-2xs text-[var(--sim-ink-2)] numeric">
                      <span>Cap: {(sec.totalMarketCapMad / 1e9).toFixed(1)} Mrd MAD</span>
                      <span>·</span>
                      <span className="text-[var(--sim-emerald)]">{sec.gainers} Hausses</span>
                      <span className="text-[var(--sim-terracotta)]">{sec.losers} Baisses</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--sim-border)] pt-2.5">
                    {sec.tickers.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setActiveSymbol(t);
                          setLayoutMode("terminal");
                        }}
                        className="rounded border border-[var(--sim-border)] bg-[var(--sim-bg-card)] px-1.5 py-0.5 font-mono text-2xs font-semibold text-[var(--sim-ink-2)] transition-colors hover:border-[var(--sim-gold)] hover:text-[var(--sim-ink)] cursor-pointer"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Bonds & Treasury Yield Curve (/api/v1/bonds/yield-curve) */}
      {selectedMarket === "BONDS" && (
        <section className="sim-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sim-border)] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--sim-ink)]">
                  Courbe des Taux Souverains (US Treasury FRED vs Maroc BDT BKAM)
                </h2>
                <Badge tone="neutral" size="sm">
                  /api/v1/bonds/yield-curve
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--sim-ink-3)]">
                Rendements souverains sur 11 maturités (1M à 30Y). Cliquez sur une échéance pour négocier la série dans le terminal.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-11">
            {TREASURY_YIELD_CURVE.map((pt) => {
              const tradeable = findMarketAsset(pt.seriesId);
              return (
                <button
                  key={pt.maturity}
                  type="button"
                  onClick={() => {
                    if (tradeable) {
                      setActiveSymbol(pt.seriesId);
                      setLayoutMode("terminal");
                    }
                  }}
                  className="text-left flex flex-col justify-between rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-2.5 transition-colors hover:border-[var(--sim-gold)] cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[var(--sim-ink)]">
                      {pt.maturity}
                    </span>
                    <span className="font-mono text-[10px] text-[var(--sim-ink-3)]">
                      {pt.seriesId}
                    </span>
                  </div>
                  <div className="my-2 space-y-1.5">
                    <div>
                      <div className="flex justify-between text-2xs numeric">
                        <span className="text-[var(--sim-ink-3)]">UST</span>
                        <span className="font-semibold text-[var(--sim-emerald)]">
                          {pt.usYieldPct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--sim-bg-muted)]">
                        <div
                          className="h-full bg-[var(--sim-emerald)]"
                          style={{ width: `${Math.min(100, (pt.usYieldPct / 5.5) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-2xs numeric">
                        <span className="text-[var(--sim-ink-3)]">BDT</span>
                        <span className="font-semibold text-[var(--sim-indigo)]">
                          {pt.moroccoBdtYieldPct.toFixed(2)}%
                        </span>
                      </div>
                      <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--sim-bg-muted)]">
                        <div
                          className="h-full bg-[var(--sim-indigo)]"
                          style={{
                            width: `${Math.min(100, (pt.moroccoBdtYieldPct / 5.5) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Forex Currency Converter (/api/v1/forex/convert) */}
      {selectedMarket === "FOREX" && (
        <section className="sim-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--sim-border)] pb-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[var(--sim-emerald)]" />
              <h2 className="text-sm font-semibold tracking-tight text-[var(--sim-ink)]">
                Convertisseur de Devises Spot FX (BCE Frankfurter &amp; Parités BKAM)
              </h2>
              <Badge tone="neutral" size="sm">
                /api/v1/forex/convert
              </Badge>
            </div>
            <span className="numeric text-2xs text-[var(--sim-ink-3)]">
              1 {fxFrom} = {fxResult.rate.toFixed(4)} {fxTo}
            </span>
          </div>

          <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-[1fr_1fr_auto_1fr_1.2fr]">
            <div>
              <label htmlFor="fx-amount" className="label mb-1 block text-2xs">
                Montant
              </label>
              <input
                id="fx-amount"
                type="number"
                min="0"
                step="any"
                value={fxAmount}
                onChange={(e) => setFxAmount(e.target.value)}
                className="numeric w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-3 py-2 text-sm font-semibold text-[var(--sim-ink)]"
              />
            </div>

            <div>
              <label htmlFor="fx-from" className="label mb-1 block text-2xs">
                Devise Source
              </label>
              <select
                id="fx-from"
                value={fxFrom}
                onChange={(e) => setFxFrom(e.target.value)}
                className="w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-3 py-2 text-sm text-[var(--sim-ink)]"
              >
                {FOREX_CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                setFxFrom(fxTo);
                setFxTo(fxFrom);
              }}
              aria-label="Inverser les devises"
              className="flex h-9.5 cursor-pointer items-center justify-center rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-3 text-[var(--sim-ink-2)] hover:border-[var(--sim-gold)]"
            >
              <ArrowRightLeft className="h-4 w-4" />
            </button>

            <div>
              <label htmlFor="fx-to" className="label mb-1 block text-2xs">
                Devise Cible
              </label>
              <select
                id="fx-to"
                value={fxTo}
                onChange={(e) => setFxTo(e.target.value)}
                className="w-full rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] px-3 py-2 text-sm text-[var(--sim-ink)]"
              >
                {FOREX_CURRENCY_LIST.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-[var(--sim-emerald)]/30 bg-[var(--sim-emerald-tint)] px-4 py-2">
              <span className="label block text-2xs text-[var(--sim-emerald)]">
                Contre-valeur Spot
              </span>
              <p className="numeric text-lg font-bold text-[var(--sim-ink)]">
                {fxResult.converted.toLocaleString("fr-MA", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="font-mono text-xs font-semibold text-[var(--sim-emerald)]">
                  {fxTo}
                </span>
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 4. Options Chain Explorer (/api/v1/options/chain) */}
      {selectedMarket === "OPTIONS" && (
        <section className="sim-card p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--sim-border)] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--sim-ink)]">
                  Chaîne d&apos;Options Listées CBOE
                </h2>
                <Badge tone="neutral" size="sm">
                  /api/v1/options/chain
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-[var(--sim-ink-3)]">
                Prix d&apos;exercice (Strike), volatilité implicite (IV), intérêt ouvert et statut ITM/OTM.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-0.5">
                {["ALL", "AAPL", "SPY", "NVDA", "QQQ", "TSLA"].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setOptionUnderlying(u)}
                    className={cn(
                      "cursor-pointer rounded px-2 py-1 font-mono text-2xs font-semibold transition-colors",
                      optionUnderlying === u
                        ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                        : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] p-0.5">
                {(["ALL", "CALL", "PUT"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setOptionTypeFilter(t)}
                    className={cn(
                      "cursor-pointer rounded px-2 py-1 text-2xs font-semibold transition-colors",
                      optionTypeFilter === t
                        ? "bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                        : "text-[var(--sim-ink-3)] hover:text-[var(--sim-ink)]",
                    )}
                  >
                    {t === "ALL" ? "Calls & Puts" : `${t}S`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-[var(--sim-border)] bg-[var(--sim-bg-subtle)] text-2xs label">
                <tr>
                  <th className="px-3 py-2">Contrat</th>
                  <th className="px-3 py-2">Sous-jacent</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Échéance</th>
                  <th className="px-3 py-2 text-right">Strike</th>
                  <th className="px-3 py-2 text-right">Dernier</th>
                  <th className="px-3 py-2 text-right">Bid / Ask</th>
                  <th className="px-3 py-2 text-right">Vol. Impl.</th>
                  <th className="px-3 py-2 text-right">Open Int.</th>
                  <th className="px-3 py-2 text-center">Statut</th>
                  <th className="px-3 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--sim-border)]">
                {filteredOptions.map((opt) => (
                  <tr key={opt.contractSymbol} className="hover:bg-[var(--sim-bg-subtle)]">
                    <td className="px-3 py-2 font-mono text-2xs font-semibold text-[var(--sim-ink)]">
                      {opt.contractSymbol}
                    </td>
                    <td className="px-3 py-2 font-mono font-bold text-[var(--sim-emerald)]">
                      {opt.underlying}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone={opt.type === "CALL" ? "positive" : "negative"} size="sm">
                        {opt.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 numeric text-[var(--sim-ink-2)]">{opt.expiration}</td>
                    <td className="px-3 py-2 numeric text-right font-semibold">
                      ${opt.strike.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right font-medium">
                      ${opt.lastPrice.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right text-[var(--sim-ink-2)]">
                      ${opt.bid.toFixed(2)} / ${opt.ask.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 numeric text-right text-[var(--sim-ink-2)]">
                      {opt.impliedVolatilityPct.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 numeric text-right text-[var(--sim-ink-3)]">
                      {opt.openInterest.toLocaleString("en-US")}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={opt.inTheMoney ? "accent" : "neutral"} size="sm">
                        {opt.inTheMoney ? "ITM" : "OTM"}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSymbol(opt.tradeableTicker);
                          setLayoutMode("terminal");
                        }}
                        className="font-mono text-2xs font-semibold text-[var(--sim-emerald)] hover:underline cursor-pointer"
                      >
                        Négocier &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ── CATALOG MODE: FULL MULTI-MARKET TABLE & INSTRUMENT CARDS ── */}
      {layoutMode === "catalog" && (
        <div className="space-y-6">
          {/* Sector Filters & Search */}
          <div className="flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center">
            <div
              className="flex items-center gap-1 overflow-x-auto pb-1"
              role="group"
              aria-label="Filtres sectoriels"
            >
              {SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setSelectedSector(sector)}
                  aria-pressed={selectedSector === sector}
                  className={cn(
                    "cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    selectedSector === sector
                      ? "border border-[var(--sim-gold)] bg-[var(--sim-bg-card)] text-[var(--sim-ink)] shadow-2xs"
                      : "text-[var(--sim-ink-3)] hover:bg-[var(--sim-bg-card)] hover:text-[var(--sim-ink)]",
                  )}
                >
                  {sector === "ALL" ? "Tous les secteurs" : SECTOR_LABELS[sector]}
                </button>
              ))}
            </div>

            <div className="relative min-w-[260px]">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--sim-ink-3)]"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher ticker, société, ISIN, bourse…"
                aria-label="Rechercher des instruments"
                className="w-full rounded-xl border border-[var(--sim-border)] bg-[var(--sim-bg-card)] py-1.5 pl-9 pr-3 text-xs text-[var(--sim-ink)]"
              />
            </div>
          </div>

          <div className="sim-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--sim-ink)]">
                Tableau de Cotation Continu — {MARKET_CATEGORY_LABELS[selectedMarket]} (
                {filteredQuotes.length})
              </h2>
              <span className="numeric text-2xs text-[var(--sim-ink-3)]">
                Actualisation toutes les {REFRESH_MS / 1000}s
              </span>
            </div>
            <Suspense
              fallback={<div className="h-64 animate-pulse rounded-lg border border-rule" />}
            >
              <QuoteBoard
                rows={filteredQuotes.map((quote) => {
                  const extended = findMarketAsset(quote.symbol);
                  const instrument = market.getInstrument(quote.symbol);
                  return {
                    asset: {
                      ticker: quote.symbol,
                      name: extended?.name ?? instrument?.name ?? quote.symbol,
                      sector: (extended?.sector ?? instrument?.sector ?? "INDUSTRY") as Sector,
                      description: extended?.description ?? "",
                      currency: "MAD" as const,
                      market: extended?.market,
                      exchange: extended?.exchange,
                      displayCurrency: extended?.displayCurrency,
                      startingPriceCents: Number(quote.lastCents),
                      annualVolatility:
                        extended?.annualVolatility ?? instrument?.annualVolatility ?? 0.2,
                      annualDrift: extended?.annualDrift ?? instrument?.annualDrift ?? 0.05,
                    },
                    changeBps: quote.changeBps,
                  };
                })}
                caption={`${MARKET_CATEGORY_LABELS[selectedMarket]} (${filteredQuotes.length} instruments)`}
              />
            </Suspense>
          </div>

          {/* Grid of Instrument Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredQuotes.map((quote) => {
              const extended = findMarketAsset(quote.symbol);
              const instrument = market.getInstrument(quote.symbol);
              const isUp = quote.changeBps >= 0n;

              return (
                <div
                  key={quote.symbol}
                  className="sim-card p-4 flex flex-col justify-between hover:border-[var(--sim-gold)] transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-base font-bold text-[var(--sim-ink)]">
                        {quote.symbol}
                      </span>
                      <div className="flex items-center gap-1">
                        {extended?.market ? (
                          <Badge tone="accent" size="sm">
                            {extended.market}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-1 truncate text-xs font-medium text-[var(--sim-ink-2)]">
                      {extended?.name ?? instrument?.name ?? quote.symbol}
                    </p>
                    <p className="mt-0.5 truncate text-2xs text-[var(--sim-ink-3)]">
                      {extended?.exchange ?? "Bourse de Casablanca"}
                      {extended?.isin ? ` · ${extended.isin}` : ""}
                    </p>
                  </div>

                  <div className="mt-4 flex items-end justify-between border-t border-[var(--sim-border)] pt-3">
                    <div>
                      <p className="numeric text-xl font-bold tracking-tight text-[var(--sim-ink)]">
                        <Num cents={quote.lastCents} />
                      </p>
                      <div className="mt-0.5 flex items-center gap-1">
                        {isUp ? (
                          <ArrowUpRight className="h-3.5 w-3.5 text-[var(--sim-emerald)]" />
                        ) : (
                          <ArrowDownRight className="h-3.5 w-3.5 text-[var(--sim-terracotta)]" />
                        )}
                        <Delta bps={quote.changeBps} size="xs" />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSymbol(quote.symbol);
                          setLayoutMode("terminal");
                        }}
                        className="rounded-lg bg-[var(--sim-navy)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[#f0d28a] cursor-pointer"
                      >
                        Terminal
                      </button>
                      <Link
                        href={`/market/${quote.symbol.toLowerCase()}`}
                        className="rounded-lg border border-[var(--sim-border)] px-2 py-1 font-mono text-[11px] text-[var(--sim-ink-2)] hover:text-[var(--sim-ink)]"
                      >
                        Fiche
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}