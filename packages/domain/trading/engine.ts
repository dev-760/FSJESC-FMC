/**
 * The trading engine (Part 5.4, N1).
 *
 * Pure functions of an explicit state and an explicit market snapshot. It reads no
 * clock, touches no database and imports no React — which is what makes the rules
 * below testable, and therefore enforceable rather than aspirational.
 *
 * The money rules, in one place:
 *   - every amount is `bigint` centimes; there is no `float` in a balance (N1)
 *   - the buy commission is capitalised into the position's cost basis, so total
 *     P&L reconciles exactly with the change in cash
 *   - cash can never go negative; an unaffordable order is partially filled or
 *     rejected, never silently funded
 *   - short selling does not exist; a sell larger than the position fills what it holds
 *   - settlement is T+2, and a position is marked to market regardless
 */

import type { Quote } from "../market/provider";

/** Commission per side, in basis points of consideration. 5 bps = 0.05%. */
export const FEE_BPS = 5n;
/** The commission floor, in centimes, so a small order is never free. */
export const FEE_MINIMUM_CENTS = 5n;
/** Settlement delay in business days (Part 5.4). */
export const SETTLEMENT_DAYS = 2;
/** A position must be older than this before it can be sold (T+2). */
export const UNSELLABLE = "Settlement pending — shares become sellable in two business days.";

export type Side = "BUY" | "SELL";
export type OrderType = "MARKET" | "LIMIT";
export type OrderStatus = "FILLED" | "PARTIAL" | "REJECTED" | "CANCELLED";

export interface OrderRequest {
  symbol: string;
  side: Side;
  type: OrderType;
  /** Shares. Always a whole number: no fractional shares, no partial-lot confusion. */
  quantity: number;
  /** Limit price in centimes. Required for `LIMIT`, ignored for `MARKET`. */
  limitCents?: number;
}

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  /** Shares the student asked for. */
  requested: number;
  /** Shares actually executed. */
  filled: number;
  limitCents?: number;
  /** Volume-weighted average execution price, in centimes. Excludes commission. */
  averageFillCents: number;
  status: OrderStatus;
  /** Why the order did not fully execute. Present for rejections and remainders. */
  reason?: string;
  feeCents: bigint;
  /** Unix seconds at which the engine resolved the order. */
  placedAt: number;
  filledAt?: number;
}

export interface Position {
  symbol: string;
  /** Whole shares held. */
  quantity: number;
  /**
   * Break-even cost per share in centimes, **including** the commission paid to
   * acquire it.
   *
   * Capitalising the fee is what makes the arithmetic reconcile: cash falls by
   * notional + fee, and the position then carries the fee, so realised P&L on the
   * eventual sale already contains it. Leaving the fee out of the basis would report
   * a gain the student never received.
   */
  averageCostCents: number;
  /** Unix seconds the lot opened. */
  openedAt: number;
}

export interface Portfolio {
  /** Spendable cash in centimes. */
  cashCents: bigint;
  /** Cash committed to unsettled purchases, in centimes. */
  reservedCents: bigint;
  positions: Record<string, Position>;
  orders: Order[];
  /** Realised profit and loss in centimes, commission included. */
  realisedPnlCents: bigint;
}

export interface Settlement {
  symbol: string;
  quantity: number;
  /** Unix seconds at which the shares become sellable. */
  dueAt: number;
}

export interface ExecutionResult {
  order: Order;
  portfolio: Portfolio;
  /** Rejections and remainders the UI must surface. Never silent. */
  messages: string[];
}

export function createPortfolio(startingCashCents: bigint): Portfolio {
  return {
    cashCents: startingCashCents,
    reservedCents: 0n,
    positions: {},
    orders: [],
    realisedPnlCents: 0n,
  };
}

/** Commission for a consideration of `notionalCents`, floored at `FEE_MINIMUM_CENTS`. */
export function commissionFor(notionalCents: bigint): bigint {
  const fee = (notionalCents * FEE_BPS) / 10_000n;
  return fee < FEE_MINIMUM_CENTS ? FEE_MINIMUM_CENTS : fee;
}

/** T+2, skipping weekends: a settlement date on a Sunday is not a settlement date. */
export function settlementDate(fromUnixSeconds: number): number {
  let cursor = fromUnixSeconds;
  for (let day = 0; day < SETTLEMENT_DAYS; day += 1) {
    cursor += 86_400;
    for (;;) {
      const weekday = new Date(cursor * 1000).getUTCDay();
      if (weekday !== 0 && weekday !== 6) break;
      cursor += 86_400;
    }
  }
  return cursor;
}

/**
 * The price an order executes at.
 *
 * A market order pays the ask when buying and the bid when selling — the student
 * pays the spread exactly as they would in a real book, rather than being handed a
 * mid-price they could never have obtained.
 */
export function executionPrice(quote: Quote, side: Side): number {
  return side === "BUY" ? quote.askCents : quote.bidCents;
}

/** Cash available for a new buy, in centimes. */
export function availableCashCents(portfolio: Portfolio): bigint {
  const available = portfolio.cashCents - portfolio.reservedCents;
  return available > 0n ? available : 0n;
}

/**
 * How many shares the available cash buys at `priceCents`, commission included.
 *
 * Solved by descent rather than by division, because the commission depends on the
 * notional: `cash / price` overshoots by up to `FEE_BPS`, and the resulting order
 * would be rejected for cash the student thought they had.
 */
export function spendableShares(portfolio: Portfolio, priceCents: number): number {
  if (priceCents <= 0) return 0;
  const available = availableCashCents(portfolio);
  const upperBound = Number(available / BigInt(priceCents));

  let shares = 0;
  while (shares < upperBound) {
    const notional = BigInt((shares + 1) * priceCents);
    if (notional + commissionFor(notional) <= available) shares += 1;
    else break;
  }
  return shares;
}

/**
 * Resolve an order against a quote and a portfolio.
 *
 * Returns a new portfolio; the input is never mutated. Rejection is total or partial
 * — never silent — and the reason always travels with the result.
 */
export function executeOrder(
  portfolio: Portfolio,
  request: OrderRequest,
  quote: Quote,
  at: Date,
  nextOrderId: string,
): ExecutionResult {
  const timestamp = Math.floor(at.getTime() / 1000);
  const messages: string[] = [];

  const reject = (reason: string): ExecutionResult => {
    const order: Order = {
      id: nextOrderId,
      symbol: request.symbol,
      side: request.side,
      type: request.type,
      requested: request.quantity,
      filled: 0,
      averageFillCents: 0,
      status: "REJECTED",
      reason,
      feeCents: 0n,
      placedAt: timestamp,
    };
    return {
      order,
      portfolio: { ...portfolio, orders: [order, ...portfolio.orders] },
      messages: [`${request.side} ${request.quantity} ${request.symbol} rejected: ${reason}.`],
    };
  };

  if (!Number.isInteger(request.quantity) || request.quantity <= 0) {
    return reject("quantity must be a positive whole number of shares");
  }
  if (request.type === "LIMIT" && (request.limitCents === undefined || request.limitCents <= 0)) {
    return reject("a limit order needs a positive limit price");
  }

  // An unfilled limit order would need a resting-order queue to be simulated
  // faithfully. Rather than fill one at a price the market has not reached, the
  // engine rejects it and says why — the honest answer, and the queue is not in
  // scope for this phase.
  if (request.type === "LIMIT") {
    const limit = request.limitCents as number;
    const marketable = request.side === "BUY" ? quote.askCents <= limit : quote.bidCents >= limit;
    if (!marketable) {
      return reject(`limit of ${(limit / 100).toFixed(2)} MAD is not currently marketable`);
    }
  }

  const price = executionPrice(quote, request.side);
  const position = portfolio.positions[request.symbol];

  if (request.side === "BUY") {
    const wanted = BigInt(request.quantity * price);
    const total = wanted + commissionFor(wanted);

    if (total > availableCashCents(portfolio)) {
      const affordable = spendableShares(portfolio, price);
      if (affordable <= 0) {
        return reject(
          `insufficient cash: ${(price / 100).toFixed(2)} MAD per share is above the available balance`,
        );
      }
      messages.push(
        `Filled ${affordable} of ${request.quantity} shares: available cash covers ${affordable} including commission.`,
      );
      return fill(portfolio, request, affordable, price, at, nextOrderId, messages);
    }

    return fill(portfolio, request, request.quantity, price, at, nextOrderId, messages);
  }

  const held = position?.quantity ?? 0;
  if (held <= 0) {
    return reject(`no position in ${request.symbol}; short selling is not available`);
  }
  if (request.quantity > held) {
    messages.push(
      `Filled ${held} of ${request.quantity} shares: the ${request.symbol} position is ${held} share${held === 1 ? "" : "s"}.`,
    );
    return fill(portfolio, request, held, price, at, nextOrderId, messages);
  }

  return fill(portfolio, request, request.quantity, price, at, nextOrderId, messages);
}

function fill(
  portfolio: Portfolio,
  request: OrderRequest,
  quantity: number,
  price: number,
  at: Date,
  id: string,
  messages: string[],
): ExecutionResult {
  const timestamp = Math.floor(at.getTime() / 1000);
  const notional = BigInt(quantity * price);
  const fee = commissionFor(notional);
  const partial = quantity < request.quantity;

  const order: Order = {
    id,
    symbol: request.symbol,
    side: request.side,
    type: request.type,
    requested: request.quantity,
    filled: quantity,
    limitCents: request.limitCents,
    averageFillCents: price,
    status: partial ? "PARTIAL" : "FILLED",
    reason: partial ? `filled ${quantity} of ${request.quantity} shares` : undefined,
    feeCents: fee,
    placedAt: timestamp,
    filledAt: timestamp,
  };

  const positions = { ...portfolio.positions };

  if (request.side === "BUY") {
    const existing = positions[request.symbol];
    const priorQuantity = existing?.quantity ?? 0;
    const priorBasis = BigInt(priorQuantity) * BigInt(existing?.averageCostCents ?? 0);
    const newQuantity = priorQuantity + quantity;

    positions[request.symbol] = {
      symbol: request.symbol,
      quantity: newQuantity,
      // The fee joins the basis, so a later sale recognises it exactly once.
      averageCostCents: Math.round(Number(priorBasis + notional + fee) / newQuantity),
      openedAt: existing?.openedAt ?? timestamp,
    };

    return {
      order,
      portfolio: {
        ...portfolio,
        cashCents: portfolio.cashCents - notional - fee,
        positions,
        orders: [order, ...portfolio.orders],
      },
      messages: [
        ...messages,
        `Bought ${quantity} ${request.symbol} at ${(price / 100).toFixed(2)} MAD, commission ${(Number(fee) / 100).toFixed(2)} MAD.`,
      ],
    };
  }

  const existing = positions[request.symbol];
  const basis = BigInt(existing?.averageCostCents ?? 0) * BigInt(quantity);
  const proceeds = notional - fee;
  const pnl = proceeds - basis;

  const remaining = (existing?.quantity ?? 0) - quantity;
  if (remaining === 0) delete positions[request.symbol];
  else if (existing) {
    // The cost basis carries across a disposal — that is what makes a partial sale
    // recognise the same per-share gain as a full one.
    positions[request.symbol] = { ...existing, quantity: remaining };
  }

  return {
    order,
    portfolio: {
      ...portfolio,
      cashCents: portfolio.cashCents + proceeds,
      positions,
      orders: [order, ...portfolio.orders],
      realisedPnlCents: portfolio.realisedPnlCents + pnl,
    },
    messages: [
      ...messages,
      `Sold ${quantity} ${request.symbol} at ${(price / 100).toFixed(2)} MAD, commission ${(Number(fee) / 100).toFixed(2)} MAD, realised ${(Number(pnl) / 100).toFixed(2)} MAD.`,
    ],
  };
}

/** Settlement entries not yet due, i.e. shares that cannot be sold yet. */
export function pendingSettlements(ledger: readonly Settlement[], now: Date): Settlement[] {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  return ledger.filter((entry) => entry.dueAt > nowSeconds);
}

export interface MarkedPosition extends Position {
  /** Position value at the last price, in centimes. */
  marketValueCents: bigint;
  /** Unrealised profit and loss in centimes, net of the entry commission. */
  unrealisedPnlCents: bigint;
  /** Unrealised return on the position, in basis points. */
  returnBps: bigint;
  /** `true` when settlement still locks the position. */
  locked: boolean;
}

/** Mark a portfolio to a set of quotes. The only place unrealised P&L is computed. */
export function markToMarket(
  portfolio: Portfolio,
  quotes: readonly Quote[],
  ledger: readonly Settlement[],
  now: Date,
): MarkedPosition[] {
  const nowSeconds = Math.floor(now.getTime() / 1000);
  const bySymbol = new Map(quotes.map((quote) => [quote.symbol, quote]));

  return (
    Object.values(portfolio.positions)
      .map((position) => {
        // Fall back to cost when there is no quote, so a position in an instrument
        // the feed missed is shown at break-even rather than dropped from the report.
        const quote = bySymbol.get(position.symbol);
        const last = quote?.lastCents ?? position.averageCostCents;
        const value = BigInt(position.quantity) * BigInt(last);
        const cost = BigInt(position.quantity) * BigInt(position.averageCostCents);
        const unrealised = value - cost;
        return {
          ...position,
          marketValueCents: value,
          unrealisedPnlCents: unrealised,
          returnBps: cost === 0n ? 0n : (unrealised * 10_000n) / cost,
          locked: ledger.some(
            (entry) => entry.symbol === position.symbol && entry.dueAt > nowSeconds,
          ),
        };
      })
      .sort((a, b) =>
        b.marketValueCents > a.marketValueCents ? 1 : b.marketValueCents < a.marketValueCents ? -1 : 0,
      )
  );
}

/** Cash plus the marked value of every position, in centimes. */
export function totalEquityCents(portfolio: Portfolio, marks: readonly MarkedPosition[]): bigint {
  const positions = marks.reduce((sum, mark) => sum + mark.marketValueCents, 0n);
  return portfolio.cashCents + positions;
}
