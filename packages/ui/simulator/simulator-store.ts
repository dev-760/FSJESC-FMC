"use client";

import { useCallback, useEffect, useState } from "react";
import { market } from "@fsjesc/domain/market/engine";
import { ALL_MARKET_ASSETS, MARKET_CATEGORY_LABELS, SECTOR_LABELS, findMarketAsset } from "@fsjesc/domain/assets";
import {
  commissionFor,
  type MarkedPosition,
  type Order,
  type Side,
} from "@fsjesc/domain/trading/engine";

export type SimOrderType = "MARKET" | "LIMIT" | "STOP";
export type SimOrderStatus = "FILLED" | "PARTIAL" | "PENDING" | "REJECTED" | "CANCELLED";

export interface SimOrder {
  id: string;
  symbol: string;
  side: Side;
  type: SimOrderType;
  requested: number;
  filled: number;
  limitCents?: number;
  stopCents?: number;
  averageFillCents: number;
  status: SimOrderStatus;
  reason?: string;
  feeCents: bigint;
  placedAt: number;
  filledAt?: number;
}

export interface SimPosition {
  symbol: string;
  quantity: number;
  averageCostCents: number;
  openedAt: number;
}

export interface EquityPoint {
  day: number;
  label: string;
  equityCents: number;
  benchmarkCents: number;
}

export interface AllocationSlice {
  key: string;
  label: string;
  color: string;
  valueCents: bigint;
  weightPct: number;
}

export interface EnrichedPosition extends MarkedPosition {
  name: string;
  market: string;
  marketLabel: string;
  sectorLabel: string;
  lastPriceCents: number;
  bidCents: number;
  askCents: number;
  dayChangeBps: bigint;
  weightPct: number;
}

export interface PortfolioTelemetry {
  dayNumber: number;
  totalDays: number;
  dayOffset: number;
  effectiveDate: Date;
  cashCents: bigint;
  reservedCents: bigint;
  availableCashCents: bigint;
  investedCents: bigint;
  totalEquityCents: bigint;
  realisedPnlCents: bigint;
  unrealisedPnlCents: bigint;
  totalPnlCents: bigint;
  dayPnlCents: bigint;
  dayReturnBps: bigint;
  totalReturnBps: bigint;
  positions: EnrichedPosition[];
  orders: SimOrder[];
  pendingOrders: SimOrder[];
  filledOrders: SimOrder[];
  equityCurve: EquityPoint[];
  sectorAllocation: AllocationSlice[];
  marketAllocation: AllocationSlice[];
  riskMetrics: {
    annualizedVolatilityPct: number;
    sharpeRatio: number;
    maxDrawdownPct: number;
    winRatePct: number;
    diversificationScore: number;
    totalFeesPaidCents: bigint;
  };
}

interface StoredSimState {
  version: 2;
  dayOffset: number;
  cashCents: string;
  realisedPnlCents: string;
  positions: Record<string, SimPosition>;
  orders: Array<{
    id: string;
    symbol: string;
    side: Side;
    type: SimOrderType;
    requested: number;
    filled: number;
    limitCents?: number;
    stopCents?: number;
    averageFillCents: number;
    status: SimOrderStatus;
    reason?: string;
    feeCents: string;
    placedAt: number;
    filledAt?: number;
  }>;
  equityHistory: Array<{
    day: number;
    equityCents: number;
  }>;
}

const STORAGE_KEY = "fsjesc_simulator_state_v2";
const STARTING_CASH_CENTS = 10_000_000n; // 100,000.00 MAD
const BASE_SIM_DAY = 42;
const TOTAL_SIM_DAYS = 252;

const ALLOCATION_COLORS = [
  "#12243b", // Deep Navy
  "#d4a94f", // Gold
  "#137a54", // Emerald
  "#3856c8", // Indigo
  "#c23b2b", // Terracotta
  "#b87914", // Amber
  "#617082", // Slate
];

function getEffectiveDate(dayOffset: number): Date {
  return new Date(Date.now() + dayOffset * 86_400_000);
}

/**
 * Create a realistic initial demonstration portfolio anchored to the deterministic
 * market engine so every position, fee, and cash balance reconciles to the centime.
 */
function buildInitialDemoState(): StoredSimState {
  const now = new Date();
  const baseTs = Math.floor(now.getTime() / 1000);
  let cashCents = STARTING_CASH_CENTS;
  const positions: Record<string, SimPosition> = {};
  const orders: StoredSimState["orders"] = [];

  const demoLots: Array<{ symbol: string; qty: number; daysAgo: number; discountBps: number }> = [
    { symbol: "ATW", qty: 25, daysAgo: 18, discountBps: 185 },
    { symbol: "IAM", qty: 120, daysAgo: 14, discountBps: 140 },
    { symbol: "LHM", qty: 12, daysAgo: 9, discountBps: 210 },
    { symbol: "TQM", qty: 15, daysAgo: 5, discountBps: -65 },
  ];

  demoLots.forEach((lot, idx) => {
    try {
      const quote = market.getQuote(lot.symbol, now);
      const entryPriceCents = Math.max(
        5,
        Math.round((quote.lastCents * (10_000 - lot.discountBps)) / 10_000),
      );
      const notional = BigInt(lot.qty * entryPriceCents);
      const fee = commissionFor(notional);
      if (notional + fee <= cashCents) {
        cashCents -= notional + fee;
        const placedAt = baseTs - lot.daysAgo * 86_400;
        positions[lot.symbol] = {
          symbol: lot.symbol,
          quantity: lot.qty,
          averageCostCents: Math.round(Number(notional + fee) / lot.qty),
          openedAt: placedAt,
        };
        orders.push({
          id: `ORD-FMC-${1040 + idx}`,
          symbol: lot.symbol,
          side: "BUY",
          type: "MARKET",
          requested: lot.qty,
          filled: lot.qty,
          averageFillCents: entryPriceCents,
          status: "FILLED",
          feeCents: fee.toString(),
          placedAt,
          filledAt: placedAt,
        });
      }
    } catch {
      // Ignore if symbol missing
    }
  });

  // Add one working LIMIT order on BCP slightly below current ask so the working book is active
  try {
    const bcpQuote = market.getQuote("BCP", now);
    const limitCents = Math.max(5, Math.round((bcpQuote.bidCents * 992) / 1000 / 5) * 5);
    const qty = 40;
    const notional = BigInt(qty * limitCents);
    const fee = commissionFor(notional);
    if (notional + fee <= cashCents) {
      orders.unshift({
        id: "ORD-FMC-1048",
        symbol: "BCP",
        side: "BUY",
        type: "LIMIT",
        requested: qty,
        filled: 0,
        limitCents,
        averageFillCents: 0,
        status: "PENDING",
        reason: `En attente dans le carnet (Limite ${(limitCents / 100).toFixed(2)} MAD)`,
        feeCents: "0",
        placedAt: baseTs - 3600,
      });
    }
  } catch {
    // Ignore
  }

  return {
    version: 2,
    dayOffset: 0,
    cashCents: cashCents.toString(),
    realisedPnlCents: "48500", // +485.00 MAD realized from earlier closed swing trade
    positions,
    orders: orders.sort((a, b) => b.placedAt - a.placedAt),
    equityHistory: [],
  };
}

function buildBlankState(): StoredSimState {
  return {
    version: 2,
    dayOffset: 0,
    cashCents: STARTING_CASH_CENTS.toString(),
    realisedPnlCents: "0",
    positions: {},
    orders: [],
    equityHistory: [],
  };
}

function readStoredState(): StoredSimState {
  if (typeof window === "undefined") {
    return buildInitialDemoState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialDemoState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw) as StoredSimState;
    if (!parsed || parsed.version !== 2) {
      const initial = buildInitialDemoState();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return parsed;
  } catch {
    return buildInitialDemoState();
  }
}

function writeStoredState(state: StoredSimState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("fsjesc:portfolio-updated"));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Evaluate all PENDING orders against current quotes (and optional candle high/low range).
 * Mutates `state` in place and returns the number of newly filled orders.
 */
function matchPendingOrdersInState(state: StoredSimState, inspectDailyRange = false): string[] {
  const effectiveDate = getEffectiveDate(state.dayOffset);
  const nowSec = Math.floor(effectiveDate.getTime() / 1000);
  let cashCents = BigInt(state.cashCents);
  let realisedPnlCents = BigInt(state.realisedPnlCents);
  const fillMessages: string[] = [];

  for (const ord of state.orders) {
    if (ord.status !== "PENDING") continue;

    let quote;
    try {
      quote = market.getQuote(ord.symbol, effectiveDate);
    } catch {
      continue;
    }

    let dailyLow = quote.bidCents;
    let dailyHigh = quote.askCents;
    if (inspectDailyRange) {
      try {
        const series = market.getSeries(ord.symbol, "1d", effectiveDate);
        const lastCandle = series.candles[series.candles.length - 1];
        if (lastCandle) {
          dailyLow = Math.min(dailyLow, lastCandle.lowCents);
          dailyHigh = Math.max(dailyHigh, lastCandle.highCents);
        }
      } catch {
        // Fallback to quote bid/ask
      }
    }

    let triggered = false;
    let fillPriceCents = ord.side === "BUY" ? quote.askCents : quote.bidCents;

    if (ord.type === "LIMIT" && ord.limitCents) {
      if (ord.side === "BUY" && (quote.askCents <= ord.limitCents || dailyLow <= ord.limitCents)) {
        triggered = true;
        fillPriceCents = Math.min(quote.askCents, ord.limitCents);
      } else if (
        ord.side === "SELL" &&
        (quote.bidCents >= ord.limitCents || dailyHigh >= ord.limitCents)
      ) {
        triggered = true;
        fillPriceCents = Math.max(quote.bidCents, ord.limitCents);
      }
    } else if (ord.type === "STOP" && ord.stopCents) {
      if (ord.side === "BUY" && (quote.lastCents >= ord.stopCents || dailyHigh >= ord.stopCents)) {
        triggered = true;
        fillPriceCents = Math.max(quote.askCents, ord.stopCents);
      } else if (
        ord.side === "SELL" &&
        (quote.lastCents <= ord.stopCents || dailyLow <= ord.stopCents)
      ) {
        triggered = true;
        fillPriceCents = Math.min(quote.bidCents, ord.stopCents);
      }
    }

    if (!triggered) continue;

    if (ord.side === "BUY") {
      const notional = BigInt(ord.requested * fillPriceCents);
      const fee = commissionFor(notional);
      if (notional + fee > cashCents) {
        ord.status = "REJECTED";
        ord.reason = "Liquidités insuffisantes lors du déclenchement de l'ordre";
        continue;
      }

      cashCents -= notional + fee;
      const existing = state.positions[ord.symbol];
      const priorQty = existing?.quantity ?? 0;
      const priorBasis = BigInt(priorQty) * BigInt(existing?.averageCostCents ?? 0);
      const newQty = priorQty + ord.requested;

      state.positions[ord.symbol] = {
        symbol: ord.symbol,
        quantity: newQty,
        averageCostCents: Math.round(Number(priorBasis + notional + fee) / newQty),
        openedAt: existing?.openedAt ?? nowSec,
      };

      ord.filled = ord.requested;
      ord.averageFillCents = fillPriceCents;
      ord.feeCents = fee.toString();
      ord.status = "FILLED";
      ord.reason = undefined;
      ord.filledAt = nowSec;
      fillMessages.push(
        `Ordre ${ord.type} exécuté : ACHAT ${ord.filled} ${ord.symbol} @ ${(fillPriceCents / 100).toFixed(2)} MAD`,
      );
    } else {
      const existing = state.positions[ord.symbol];
      if (!existing || existing.quantity <= 0) {
        ord.status = "REJECTED";
        ord.reason = `Aucune position ouverte sur ${ord.symbol}`;
        continue;
      }
      const held = existing.quantity;
      const fillQty = Math.min(held, ord.requested);
      const notional = BigInt(fillQty * fillPriceCents);
      const fee = commissionFor(notional);
      const proceeds = notional - fee;
      const basis = BigInt(existing.averageCostCents) * BigInt(fillQty);
      const pnl = proceeds - basis;

      cashCents += proceeds;
      realisedPnlCents += pnl;

      const remaining = held - fillQty;
      if (remaining <= 0) {
        delete state.positions[ord.symbol];
      } else {
        state.positions[ord.symbol] = { ...existing, quantity: remaining };
      }

      ord.filled = fillQty;
      ord.averageFillCents = fillPriceCents;
      ord.feeCents = fee.toString();
      ord.status = fillQty < ord.requested ? "PARTIAL" : "FILLED";
      ord.reason =
        fillQty < ord.requested ? `Exécuté partiellement (${fillQty}/${ord.requested})` : undefined;
      ord.filledAt = nowSec;
      fillMessages.push(
        `Ordre ${ord.type} exécuté : VENTE ${fillQty} ${ord.symbol} @ ${(fillPriceCents / 100).toFixed(2)} MAD`,
      );
    }
  }

  state.cashCents = cashCents.toString();
  state.realisedPnlCents = realisedPnlCents.toString();
  return fillMessages;
}

/**
 * Submit a new order (MARKET, LIMIT, or STOP) with L2 depth slippage & working order book support.
 */
export function submitSimulatorOrder(request: {
  symbol: string;
  side: Side;
  type: SimOrderType;
  quantity: number;
  limitCents?: number;
  stopCents?: number;
}): {
  ok: boolean;
  tone: "positive" | "warning" | "negative";
  message: string;
  order: SimOrder;
} {
  const state = readStoredState();
  const symbol = request.symbol.trim().toUpperCase();
  const effectiveDate = getEffectiveDate(state.dayOffset);
  const nowSec = Math.floor(effectiveDate.getTime() / 1000);
  const orderId = `ORD-FMC-${Math.floor(1000 + Math.random() * 9000)}`;

  const reject = (reason: string) => {
    const rejectedOrder: StoredSimState["orders"][number] = {
      id: orderId,
      symbol,
      side: request.side,
      type: request.type,
      requested: request.quantity,
      filled: 0,
      limitCents: request.limitCents,
      stopCents: request.stopCents,
      averageFillCents: 0,
      status: "REJECTED",
      reason,
      feeCents: "0",
      placedAt: nowSec,
    };
    state.orders.unshift(rejectedOrder);
    writeStoredState(state);
    return {
      ok: false,
      tone: "negative" as const,
      message: `Ordre rejeté : ${reason}`,
      order: { ...rejectedOrder, feeCents: 0n },
    };
  };

  if (!Number.isInteger(request.quantity) || request.quantity <= 0) {
    return reject("La quantité doit être un nombre entier positif de titres.");
  }

  let quote;
  try {
    quote = market.getQuote(symbol, effectiveDate);
  } catch {
    return reject(`Instrument ${symbol} introuvable sur le marché.`);
  }

  const cashCents = BigInt(state.cashCents);
  const reservedCents = state.orders
    .filter((o) => o.status === "PENDING" && o.side === "BUY")
    .reduce((sum, o) => {
      const refPrice = o.limitCents ?? o.stopCents ?? quote.askCents;
      const n = BigInt(o.requested * refPrice);
      return sum + n + commissionFor(n);
    }, 0n);
  const spendableCents = cashCents > reservedCents ? cashCents - reservedCents : 0n;

  // Check if LIMIT or STOP order should rest as PENDING in the order book
  if (request.type === "LIMIT") {
    if (!request.limitCents || request.limitCents <= 0) {
      return reject("Un cours limité positif est requis.");
    }
    const isMarketable =
      request.side === "BUY"
        ? quote.askCents <= request.limitCents
        : quote.bidCents >= request.limitCents;

    if (!isMarketable) {
      if (request.side === "BUY") {
        const notional = BigInt(request.quantity * request.limitCents);
        const fee = commissionFor(notional);
        if (notional + fee > spendableCents) {
          return reject(
            `Pouvoir d'achat insuffisant pour réserver ${(Number(notional + fee) / 100).toFixed(2)} MAD.`,
          );
        }
      } else {
        const held = state.positions[symbol]?.quantity ?? 0;
        if (held < request.quantity) {
          return reject(`Vous détenez ${held} titre(s) de ${symbol} (vente à découvert désactivée).`);
        }
      }

      const pendingOrder: StoredSimState["orders"][number] = {
        id: orderId,
        symbol,
        side: request.side,
        type: "LIMIT",
        requested: request.quantity,
        filled: 0,
        limitCents: request.limitCents,
        averageFillCents: 0,
        status: "PENDING",
        reason: `En attente dans le carnet L2 (Limite ${(request.limitCents / 100).toFixed(2)} MAD)`,
        feeCents: "0",
        placedAt: nowSec,
      };
      state.orders.unshift(pendingOrder);
      writeStoredState(state);
      return {
        ok: true,
        tone: "warning",
        message: `Ordre limite ${request.side === "BUY" ? "ACHAT" : "VENTE"} de ${request.quantity} ${symbol} @ ${(request.limitCents / 100).toFixed(2)} MAD placé dans le carnet d'ordres.`,
        order: { ...pendingOrder, feeCents: 0n },
      };
    }
  }

  if (request.type === "STOP") {
    const stopPrice = request.stopCents ?? request.limitCents;
    if (!stopPrice || stopPrice <= 0) {
      return reject("Un seuil de déclenchement Stop positif est requis.");
    }
    const isTriggered =
      request.side === "BUY" ? quote.lastCents >= stopPrice : quote.lastCents <= stopPrice;

    if (!isTriggered) {
      if (request.side === "SELL") {
        const held = state.positions[symbol]?.quantity ?? 0;
        if (held < request.quantity) {
          return reject(`Position insuffisante (${held} titres) pour placer un Stop de vente.`);
        }
      }
      const pendingStop: StoredSimState["orders"][number] = {
        id: orderId,
        symbol,
        side: request.side,
        type: "STOP",
        requested: request.quantity,
        filled: 0,
        stopCents: stopPrice,
        averageFillCents: 0,
        status: "PENDING",
        reason: `Ordre Stop actif (Seuil ${(stopPrice / 100).toFixed(2)} MAD)`,
        feeCents: "0",
        placedAt: nowSec,
      };
      state.orders.unshift(pendingStop);
      writeStoredState(state);
      return {
        ok: true,
        tone: "warning",
        message: `Ordre Stop ${request.side === "BUY" ? "ACHAT" : "VENTE"} de ${request.quantity} ${symbol} enregistré (seuil ${(stopPrice / 100).toFixed(2)} MAD).`,
        order: { ...pendingStop, feeCents: 0n },
      };
    }
  }

  // Immediate execution (Market order or marketable Limit/Stop order)
  // Simulate realistic L2 book sweep for larger quantities (> 200 shares)
  const basePriceCents = request.side === "BUY" ? quote.askCents : quote.bidCents;
  const depthSlippageTicks = Math.min(4, Math.floor(request.quantity / 250));
  const tickCents = 5;
  const fillPriceCents =
    request.side === "BUY"
      ? basePriceCents + depthSlippageTicks * tickCents
      : Math.max(5, basePriceCents - depthSlippageTicks * tickCents);

  if (request.side === "BUY") {
    let fillQty = request.quantity;
    let notional = BigInt(fillQty * fillPriceCents);
    let fee = commissionFor(notional);

    if (notional + fee > spendableCents) {
      // Calculate max affordable shares
      const maxAffordable = Math.floor(
        Number((spendableCents * 10_000n) / (BigInt(fillPriceCents) * 10_005n)),
      );
      if (maxAffordable <= 0) {
        return reject(
          `Liquidités disponibles insuffisantes (${(Number(spendableCents) / 100).toFixed(2)} MAD).`,
        );
      }
      fillQty = maxAffordable;
      notional = BigInt(fillQty * fillPriceCents);
      fee = commissionFor(notional);
    }

    const newCash = cashCents - notional - fee;
    const existing = state.positions[symbol];
    const priorQty = existing?.quantity ?? 0;
    const priorBasis = BigInt(priorQty) * BigInt(existing?.averageCostCents ?? 0);
    const totalQty = priorQty + fillQty;

    state.positions[symbol] = {
      symbol,
      quantity: totalQty,
      averageCostCents: Math.round(Number(priorBasis + notional + fee) / totalQty),
      openedAt: existing?.openedAt ?? nowSec,
    };
    state.cashCents = newCash.toString();

    const partial = fillQty < request.quantity;
    const filledOrder: StoredSimState["orders"][number] = {
      id: orderId,
      symbol,
      side: "BUY",
      type: request.type,
      requested: request.quantity,
      filled: fillQty,
      limitCents: request.limitCents,
      stopCents: request.stopCents,
      averageFillCents: fillPriceCents,
      status: partial ? "PARTIAL" : "FILLED",
      reason: partial
        ? `Exécution partielle (${fillQty}/${request.quantity}) limitée par les liquidités disponibles`
        : undefined,
      feeCents: fee.toString(),
      placedAt: nowSec,
      filledAt: nowSec,
    };
    state.orders.unshift(filledOrder);
    writeStoredState(state);

    // Best-effort non-blocking sync with API if backend session exists
    void fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        symbol,
        side: "BUY",
        type: request.type === "STOP" ? "MARKET" : request.type,
        quantity: fillQty,
        limitCents: request.limitCents,
        idempotencyKey: orderId,
      }),
    }).catch(() => undefined);

    return {
      ok: true,
      tone: partial ? "warning" : "positive",
      message: `Exécuté : ACHAT de ${fillQty} ${symbol} à ${(fillPriceCents / 100).toFixed(2)} MAD (Commission : ${(Number(fee) / 100).toFixed(2)} MAD).`,
      order: { ...filledOrder, feeCents: fee },
    };
  }

  // SELL execution
  const existing = state.positions[symbol];
  if (!existing || existing.quantity <= 0) {
    return reject(`Aucune position ouverte sur ${symbol} (vente à découvert non autorisée).`);
  }
  const held = existing.quantity;

  const fillQty = Math.min(held, request.quantity);
  const notional = BigInt(fillQty * fillPriceCents);
  const fee = commissionFor(notional);
  const proceeds = notional - fee;
  const basis = BigInt(existing.averageCostCents) * BigInt(fillQty);
  const pnl = proceeds - basis;

  const newCash = cashCents + proceeds;
  const newRealised = BigInt(state.realisedPnlCents) + pnl;
  const remaining = held - fillQty;

  if (remaining <= 0) {
    delete state.positions[symbol];
  } else {
    state.positions[symbol] = { ...existing, quantity: remaining };
  }

  state.cashCents = newCash.toString();
  state.realisedPnlCents = newRealised.toString();

  const partial = fillQty < request.quantity;
  const filledOrder: StoredSimState["orders"][number] = {
    id: orderId,
    symbol,
    side: "SELL",
    type: request.type,
    requested: request.quantity,
    filled: fillQty,
    limitCents: request.limitCents,
    stopCents: request.stopCents,
    averageFillCents: fillPriceCents,
    status: partial ? "PARTIAL" : "FILLED",
    reason: partial ? `Exécuté à hauteur des ${fillQty} titres détenus` : undefined,
    feeCents: fee.toString(),
    placedAt: nowSec,
    filledAt: nowSec,
  };
  state.orders.unshift(filledOrder);
  writeStoredState(state);

  void fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      symbol,
      side: "SELL",
      type: request.type === "STOP" ? "MARKET" : request.type,
      quantity: fillQty,
      limitCents: request.limitCents,
      idempotencyKey: orderId,
    }),
  }).catch(() => undefined);

  const pnlFormatted = `${pnl >= 0n ? "+" : ""}${(Number(pnl) / 100).toFixed(2)} MAD`;
  return {
    ok: true,
    tone: partial ? "warning" : "positive",
    message: `Exécuté : VENTE de ${fillQty} ${symbol} à ${(fillPriceCents / 100).toFixed(2)} MAD (P&L réalisé : ${pnlFormatted}).`,
    order: { ...filledOrder, feeCents: fee },
  };
}

/**
 * Cancel a working PENDING order in the order book.
 */
export function cancelSimulatorOrder(orderId: string): boolean {
  const state = readStoredState();
  const target = state.orders.find((o) => o.id === orderId && o.status === "PENDING");
  if (!target) return false;
  target.status = "CANCELLED";
  target.reason = "Annulé par l'opérateur";
  writeStoredState(state);
  return true;
}

/**
 * Close an open position (100% or partial fraction) with a 1-click Market SELL order.
 */
export function closeSimulatorPosition(symbol: string, fraction = 1): {
  ok: boolean;
  message: string;
} {
  const state = readStoredState();
  const pos = state.positions[symbol.toUpperCase()];
  if (!pos || pos.quantity <= 0) {
    return { ok: false, message: `Aucune position active sur ${symbol}.` };
  }
  const qtyToSell = Math.max(1, Math.round(pos.quantity * fraction));
  const res = submitSimulatorOrder({
    symbol: pos.symbol,
    side: "SELL",
    type: "MARKET",
    quantity: qtyToSell,
  });
  return { ok: res.ok, message: res.message };
}

/**
 * Advance the simulated trading session by `days` (default 1 day = J+1),
 * evaluate all pending limit/stop orders against the new session's candle range,
 * and append to the equity history.
 */
export function advanceSimulatorDay(days = 1): {
  newDayNumber: number;
  filledMessages: string[];
} {
  const state = readStoredState();
  state.dayOffset = Math.min(TOTAL_SIM_DAYS - BASE_SIM_DAY, state.dayOffset + days);
  const filledMessages = matchPendingOrdersInState(state, true);

  // Compute current equity to record on the equity curve
  const effectiveDate = getEffectiveDate(state.dayOffset);
  let invested = 0n;
  for (const pos of Object.values(state.positions)) {
    try {
      const q = market.getQuote(pos.symbol, effectiveDate);
      invested += BigInt(pos.quantity) * BigInt(q.lastCents);
    } catch {
      invested += BigInt(pos.quantity) * BigInt(pos.averageCostCents);
    }
  }
  const totalEq = Number(BigInt(state.cashCents) + invested);
  const currentDay = BASE_SIM_DAY + state.dayOffset;
  state.equityHistory = [
    ...state.equityHistory.filter((pt) => pt.day !== currentDay),
    { day: currentDay, equityCents: totalEq },
  ].slice(-60);

  writeStoredState(state);
  return {
    newDayNumber: currentDay,
    filledMessages,
  };
}

/**
 * Reset portfolio either to a blank 100,000 MAD cash account (`mode = "blank"`)
 * or to the FMC multi-asset demonstration portfolio (`mode = "demo"`).
 */
export function resetSimulatorPortfolio(mode: "blank" | "demo" = "blank"): void {
  const next = mode === "demo" ? buildInitialDemoState() : buildBlankState();
  writeStoredState(next);
}

/**
 * Compute full live marked-to-market telemetry from stored state and the deterministic market engine.
 */
export function computePortfolioTelemetry(): PortfolioTelemetry {
  const state = readStoredState();

  // Check if any pending limit/stop orders are now marketable at current prices
  const fills = matchPendingOrdersInState(state, false);
  if (fills.length > 0) {
    writeStoredState(state);
  }

  const effectiveDate = getEffectiveDate(state.dayOffset);
  const nowSec = Math.floor(effectiveDate.getTime() / 1000);
  const cashCents = BigInt(state.cashCents);
  const realisedPnlCents = BigInt(state.realisedPnlCents);

  // Reserved cash for working BUY orders
  const reservedCents = state.orders
    .filter((o) => o.status === "PENDING" && o.side === "BUY")
    .reduce((sum, o) => {
      const price = o.limitCents ?? o.stopCents ?? 0;
      if (price <= 0) return sum;
      const notional = BigInt(o.requested * price);
      return sum + notional + commissionFor(notional);
    }, 0n);

  const availableCashCents = cashCents > reservedCents ? cashCents - reservedCents : 0n;

  // Mark positions to market
  const rawPositions = Object.values(state.positions);
  let investedCents = 0n;
  let unrealisedPnlCents = 0n;
  let dayPnlCents = 0n;

  const prelimPositions = rawPositions.map((pos) => {
    const asset = findMarketAsset(pos.symbol);
    let lastPriceCents = pos.averageCostCents;
    let bidCents = pos.averageCostCents;
    let askCents = pos.averageCostCents;
    let dayChangeBps = 0n;
    let posDayChangeCents = 0n;

    try {
      const q = market.getQuote(pos.symbol, effectiveDate);
      lastPriceCents = q.lastCents;
      bidCents = q.bidCents;
      askCents = q.askCents;
      dayChangeBps = q.changeBps;
      posDayChangeCents = q.changeCents * BigInt(pos.quantity);
    } catch {
      // Fallback to cost
    }

    const marketValueCents = BigInt(pos.quantity) * BigInt(lastPriceCents);
    const costCents = BigInt(pos.quantity) * BigInt(pos.averageCostCents);
    const unrealised = marketValueCents - costCents;
    const returnBps = costCents > 0n ? (unrealised * 10_000n) / costCents : 0n;

    investedCents += marketValueCents;
    unrealisedPnlCents += unrealised;
    dayPnlCents += posDayChangeCents;

    return {
      ...pos,
      name: asset?.name ?? pos.symbol,
      market: asset?.market ?? "CSE",
      marketLabel: asset ? MARKET_CATEGORY_LABELS[asset.market] : "Bourse de Casablanca",
      sectorLabel: asset ? (asset.frenchSector ?? SECTOR_LABELS[asset.sector]) : "Actions",
      lastPriceCents,
      bidCents,
      askCents,
      dayChangeBps,
      marketValueCents,
      unrealisedPnlCents: unrealised,
      returnBps,
      locked: nowSec - pos.openedAt < 172_800, // T+2 informational badge
    };
  });

  const totalEquityCents = cashCents + investedCents;
  const totalEqNum = Number(totalEquityCents) || 1;

  const positions: EnrichedPosition[] = prelimPositions
    .map((p) => ({
      ...p,
      weightPct: (Number(p.marketValueCents) / totalEqNum) * 100,
    }))
    .sort((a, b) => Number(b.marketValueCents - a.marketValueCents));

  const totalPnlCents = realisedPnlCents + unrealisedPnlCents;
  const totalReturnBps = (totalPnlCents * 10_000n) / STARTING_CASH_CENTS;
  const prevDayEquityCents = totalEquityCents - dayPnlCents;
  const dayReturnBps =
    prevDayEquityCents > 0n ? (dayPnlCents * 10_000n) / prevDayEquityCents : 0n;

  // Orders list
  const orders: SimOrder[] = state.orders.map((o) => ({
    ...o,
    feeCents: BigInt(o.feeCents || "0"),
  }));
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const filledOrders = orders.filter((o) => o.filled > 0);

  // Sector Allocation
  const sectorMap = new Map<string, bigint>();
  for (const pos of positions) {
    sectorMap.set(pos.sectorLabel, (sectorMap.get(pos.sectorLabel) ?? 0n) + pos.marketValueCents);
  }
  const sectorAllocation: AllocationSlice[] = Array.from(sectorMap.entries())
    .sort((a, b) => Number(b[1] - a[1]))
    .map(([label, val], idx) => ({
      key: label,
      label,
      color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length] ?? "#12243b",
      valueCents: val,
      weightPct: (Number(val) / totalEqNum) * 100,
    }));
  if (cashCents > 0n) {
    sectorAllocation.push({
      key: "CASH",
      label: "Liquidités MAD",
      color: "#9aa6b5",
      valueCents: cashCents,
      weightPct: (Number(cashCents) / totalEqNum) * 100,
    });
  }

  // Market Category Allocation
  const marketMap = new Map<string, bigint>();
  for (const pos of positions) {
    marketMap.set(pos.marketLabel, (marketMap.get(pos.marketLabel) ?? 0n) + pos.marketValueCents);
  }
  const marketAllocation: AllocationSlice[] = Array.from(marketMap.entries())
    .sort((a, b) => Number(b[1] - a[1]))
    .map(([label, val], idx) => ({
      key: label,
      label,
      color: ALLOCATION_COLORS[idx % ALLOCATION_COLORS.length] ?? "#12243b",
      valueCents: val,
      weightPct: (Number(val) / totalEqNum) * 100,
    }));
  if (cashCents > 0n) {
    marketAllocation.push({
      key: "CASH",
      label: "Réserve Monétaire (MAD)",
      color: "#9aa6b5",
      valueCents: cashCents,
      weightPct: (Number(cashCents) / totalEqNum) * 100,
    });
  }

  // Build 30-day deterministic Equity Curve ending at current `totalEquityCents`
  const currentDay = BASE_SIM_DAY + state.dayOffset;
  const startEq = Number(STARTING_CASH_CENTS);
  const endEq = Number(totalEquityCents);
  const equityCurve: EquityPoint[] = [];
  const historyByDay = new Map(state.equityHistory.map((h) => [h.day, h.equityCents]));

  for (let i = 29; i >= 0; i -= 1) {
    const dayNum = Math.max(1, currentDay - i);
    const progress = (29 - i) / 29;
    const recorded = historyByDay.get(dayNum);
    // Deterministic wave around the path from startEq to endEq
    const wave =
      i === 0
        ? 0
        : Math.sin(dayNum * 0.65) * 42_000 + Math.cos(dayNum * 1.15) * 24_000;
    const interpolated = Math.round(startEq + (endEq - startEq) * progress + wave);
    const equityCents = i === 0 ? endEq : (recorded ?? interpolated);
    const benchmarkCents = Math.round(
      startEq * (1 + 0.00045 * (29 - i) + Math.sin(dayNum * 0.4) * 0.002),
    );
    equityCurve.push({
      day: dayNum,
      label: `J${dayNum}`,
      equityCents,
      benchmarkCents,
    });
  }

  // Compute Portfolio Risk Metrics
  let weightedVol = 0;
  for (const pos of positions) {
    const asset = findMarketAsset(pos.symbol) ?? ALL_MARKET_ASSETS[0];
    const w = Number(pos.marketValueCents) / totalEqNum;
    weightedVol += w * (asset?.annualVolatility ?? 0.18);
  }
  const annualizedVolatilityPct = Number((weightedVol * 100).toFixed(2));
  const annualizedReturnPct = (Number(totalReturnBps) / 100) * (252 / Math.max(10, currentDay));
  const riskFreeRatePct = 3.0; // BKAM 3.00% reference rate
  const sharpeRatio =
    annualizedVolatilityPct > 0.5
      ? Number(((annualizedReturnPct - riskFreeRatePct) / annualizedVolatilityPct).toFixed(2))
      : 0;

  let peak = startEq;
  let maxDd = 0;
  for (const pt of equityCurve) {
    if (pt.equityCents > peak) peak = pt.equityCents;
    const dd = peak > 0 ? ((peak - pt.equityCents) / peak) * 100 : 0;
    if (dd > maxDd) maxDd = dd;
  }

  const winningPositions = positions.filter((p) => p.unrealisedPnlCents >= 0n).length;
  const winRatePct =
    positions.length > 0 ? Math.round((winningPositions / positions.length) * 100) : 100;

  const hhi = positions.reduce((sum, p) => {
    const share = Number(p.marketValueCents) / (Number(investedCents) || 1);
    return sum + share * share;
  }, 0);
  const diversificationScore =
    positions.length === 0 ? 100 : Math.min(99, Math.max(15, Math.round((1 - hhi * 0.65) * 100)));

  const totalFeesPaidCents = filledOrders.reduce((sum, o) => sum + o.feeCents, 0n);

  return {
    dayNumber: currentDay,
    totalDays: TOTAL_SIM_DAYS,
    dayOffset: state.dayOffset,
    effectiveDate,
    cashCents,
    reservedCents,
    availableCashCents,
    investedCents,
    totalEquityCents,
    realisedPnlCents,
    unrealisedPnlCents,
    totalPnlCents,
    dayPnlCents,
    dayReturnBps,
    totalReturnBps,
    positions,
    orders,
    pendingOrders,
    filledOrders,
    equityCurve,
    sectorAllocation,
    marketAllocation,
    riskMetrics: {
      annualizedVolatilityPct,
      sharpeRatio,
      maxDrawdownPct: Number(maxDd.toFixed(2)),
      winRatePct,
      diversificationScore,
      totalFeesPaidCents,
    },
  };
}

/**
 * Convert `SimOrder` to `@fsjesc/domain/trading/engine` `Order` for legacy components.
 */
export function toDomainOrder(order: SimOrder): Order {
  return {
    id: order.id,
    symbol: order.symbol,
    side: order.side,
    type: order.type === "STOP" ? "LIMIT" : order.type,
    requested: order.requested,
    filled: order.filled,
    limitCents: order.limitCents ?? order.stopCents,
    averageFillCents: order.averageFillCents,
    status: order.status === "PENDING" ? "PARTIAL" : order.status,
    reason: order.reason,
    feeCents: order.feeCents,
    placedAt: order.placedAt,
    filledAt: order.filledAt,
  };
}

/**
 * React hook subscribing to live simulator portfolio telemetry (updates every 3s and on any trade/day action).
 */
export function useSimulatorPortfolio(pollMs = 3000): {
  telemetry: PortfolioTelemetry;
  refresh: () => void;
  advanceDay: (days?: number) => { newDayNumber: number; filledMessages: string[] };
  resetPortfolio: (mode?: "blank" | "demo") => void;
  closePosition: (symbol: string, fraction?: number) => { ok: boolean; message: string };
  cancelOrder: (orderId: string) => boolean;
} {
  const [telemetry, setTelemetry] = useState<PortfolioTelemetry>(() =>
    computePortfolioTelemetry(),
  );

  const refresh = useCallback(() => {
    setTelemetry(computePortfolioTelemetry());
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, pollMs);
    const onUpdate = () => refresh();
    window.addEventListener("fsjesc:portfolio-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("fsjesc:portfolio-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [pollMs, refresh]);

  const advanceDay = useCallback((days = 1) => {
    const res = advanceSimulatorDay(days);
    setTelemetry(computePortfolioTelemetry());
    return res;
  }, []);

  const resetPortfolio = useCallback((mode: "blank" | "demo" = "blank") => {
    resetSimulatorPortfolio(mode);
    setTelemetry(computePortfolioTelemetry());
  }, []);

  const closePosition = useCallback((symbol: string, fraction = 1) => {
    const res = closeSimulatorPosition(symbol, fraction);
    setTelemetry(computePortfolioTelemetry());
    return res;
  }, []);

  const cancelOrder = useCallback((orderId: string) => {
    const ok = cancelSimulatorOrder(orderId);
    setTelemetry(computePortfolioTelemetry());
    return ok;
  }, []);

  return {
    telemetry,
    refresh,
    advanceDay,
    resetPortfolio,
    closePosition,
    cancelOrder,
  };
}
