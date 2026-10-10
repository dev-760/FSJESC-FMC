import { describe, expect, it } from "vitest";

import {
  FEE_BPS,
  commissionFor,
  createPortfolio,
  executeOrder,
  executionPrice,
  markToMarket,
  pendingSettlements,
  settlementDate,
  spendableShares,
  totalEquityCents,
  type Portfolio,
  type Position,
} from "@fsjesc/domain/trading/engine";
import type { Quote } from "@fsjesc/domain/market/provider";

const AT = new Date("2026-03-16T14:30:00Z");

function quote(lastCents: number, overrides: Partial<Quote> = {}): Quote {
  return {
    symbol: "MARI",
    lastCents,
    bidCents: lastCents - 5,
    askCents: lastCents + 5,
    changeBps: 0n,
    changeCents: 0n,
    volume: 1_000,
    asOf: Math.floor(AT.getTime() / 1000),
    ...overrides,
  };
}

/** 100,000.00 MAD in centimes — the starting cash of every student account. */
const STARTING_CASH = 10_000_000n;

/**
 * Asserted lookups, not indexed ones.
 *
 * `noUncheckedIndexedAccess` makes `positions.MARI` and `marks[0]` possibly
 * undefined. These helpers make the failure legible: "expected a MARI position" says
 * which invariant broke, where `undefined.quantity` says nothing.
 */
function positionOf(portfolio: Portfolio, symbol: string): Position {
  const position = portfolio.positions[symbol];
  if (!position) throw new Error(`expected a ${symbol} position`);
  return position;
}

function firstOf<T>(items: readonly T[]): T {
  const item = items[0];
  if (item === undefined) throw new Error("expected at least one item");
  return item;
}

describe("commission", () => {
  it("applies 5 basis points", () => {
    // 1,000,000 cents = 10,000.00 MAD; 5 bps = 5.00 MAD = 500 cents.
    expect(commissionFor(1_000_000n)).toBe(500n);
  });

  it("matches the documented rate", () => {
    const notional = 2_500_000n;
    expect(commissionFor(notional)).toBe((notional * FEE_BPS) / 10_000n);
  });

  it("floors at a minimum so a tiny order is never free", () => {
    expect(commissionFor(100n)).toBe(5n);
    expect(commissionFor(0n)).toBe(5n);
  });

  it("never exceeds the notional on a very small order", () => {
    // A commission larger than the trade would be a bug a student would find
    // immediately; the floor is small enough that it cannot happen.
    expect(commissionFor(10n)).toBeLessThan(10n);
  });
});

describe("settlementDate", () => {
  it("settles two business days later", () => {
    // Monday 2026-03-16 → Wednesday 2026-03-18.
    const from = Math.floor(AT.getTime() / 1000);
    const due = new Date(settlementDate(from) * 1000);
    expect(due.getUTCDate()).toBe(18);
    expect(due.getUTCDay()).toBe(3);
  });

  it("skips a weekend", () => {
    // Friday 2026-03-20 → Tuesday 2026-03-24 (Monday is a business day).
    const friday = Math.floor(new Date("2026-03-20T15:00:00Z").getTime() / 1000);
    const due = new Date(settlementDate(friday) * 1000);
    expect(due.getUTCDate()).toBe(24);
  });

  it("never lands on a weekend", () => {
    for (let day = 9; day <= 27; day += 1) {
      const from = Math.floor(
        new Date(`2026-03-${String(day).padStart(2, "0")}T15:00:00Z`).getTime() / 1000,
      );
      const weekday = new Date(settlementDate(from) * 1000).getUTCDay();
      expect(weekday).not.toBe(0);
      expect(weekday).not.toBe(6);
    }
  });
});

describe("executionPrice", () => {
  it("charges the ask when buying and the bid when selling", () => {
    const book = quote(10_000);
    expect(executionPrice(book, "BUY")).toBe(10_005);
    expect(executionPrice(book, "SELL")).toBe(9_995);
  });

  it("makes a round trip cost money", () => {
    // Buying and immediately selling at the same quote must lose exactly the two
    // spreads plus two commissions. A student who does not see a loss is looking
    // at a bug, not at a free lunch.
    const book = quote(10_000);
    const portfolio = createPortfolio(STARTING_CASH);
    const afterBuy = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 1 },
      book,
      AT,
      "o1",
    );
    const afterSell = executeOrder(
      afterBuy.portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 1 },
      book,
      AT,
      "o2",
    );

    // The round-trip loss is measured against the starting cash, not between the two
    // intermediate balances — the gap between them is only the sale proceeds.
    const loss = STARTING_CASH - afterSell.portfolio.cashCents;
    const fees = afterBuy.order.feeCents + afterSell.order.feeCents;
    const spreadCost = BigInt(book.askCents - book.bidCents);

    expect(loss).toBe(fees + spreadCost);
    // The buy commission is capitalised into the basis, so realised P&L accounts for
    // it exactly once and reconciles with the change in cash.
    expect(afterSell.portfolio.realisedPnlCents).toBe(-loss);
    expect(afterSell.portfolio.realisedPnlCents).toBe(
      afterSell.portfolio.cashCents - STARTING_CASH,
    );
  });
});

describe("executeOrder — buying", () => {
  it("debits cash by the notional plus commission", () => {
    const portfolio = createPortfolio(STARTING_CASH);
    const book = quote(4_800);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      book,
      AT,
      "o1",
    );

    const notional = BigInt(100 * book.askCents);
    const fee = commissionFor(notional);
    expect(result.portfolio.cashCents).toBe(STARTING_CASH - notional - fee);
    expect(result.order.status).toBe("FILLED");
  });

  it("records the position and a break-even cost that includes commission", () => {
    const portfolio = createPortfolio(STARTING_CASH);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10 },
      quote(4_800),
      AT,
      "o1",
    );
    const position = positionOf(result.portfolio, "MARI");
    expect(position.quantity).toBe(10);
    // Paid 4,805 at the ask, plus 24 cents of commission over 10 shares = 4,807.
    expect(position.averageCostCents).toBe(4_807);
  });

  it("averages the cost across two purchases at different prices", () => {
    let portfolio = createPortfolio(STARTING_CASH);
    portfolio = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10 },
      quote(4_000),
      AT,
      "o1",
    ).portfolio;
    portfolio = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 30 },
      quote(4_400),
      AT,
      "o2",
    ).portfolio;

    const position = positionOf(portfolio, "MARI");
    expect(position.quantity).toBe(40);
    // (10 × 4,005 + 5 fee + 30 × 4,405 + 66 fee) / 40 = 4,306.775 → 4,307
    expect(position.averageCostCents).toBe(4_307);
  });

  it("does not create realised P&L on a purchase", () => {
    const result = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      quote(4_800),
      AT,
      "o1",
    );
    expect(result.portfolio.realisedPnlCents).toBe(0n);
  });
});

describe("executeOrder — selling", () => {
  function holding(quantity: number, priceCents: number): Portfolio {
    const portfolio = createPortfolio(STARTING_CASH);
    const bought = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity },
      quote(priceCents),
      AT,
      "o1",
    );
    return bought.portfolio;
  }

  it("credits proceeds net of commission", () => {
    const portfolio = holding(50, 4_800);
    const before = portfolio.cashCents;
    const book = quote(5_000);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 20 },
      book,
      AT,
      "o2",
    );

    const proceeds = BigInt(20 * book.bidCents) - commissionFor(BigInt(20 * book.bidCents));
    expect(result.portfolio.cashCents).toBe(before + proceeds);
  });

  it("realises the gain over average cost", () => {
    const portfolio = holding(50, 4_800);
    const book = quote(5_000);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 20 },
      book,
      AT,
      "o2",
    );

    const costBasis = BigInt(20 * positionOf(portfolio, "MARI").averageCostCents);
    const proceeds = BigInt(20 * book.bidCents) - result.order.feeCents;
    expect(result.portfolio.realisedPnlCents).toBe(proceeds - costBasis);
  });

  it("keeps average cost unchanged after a partial disposal", () => {
    const portfolio = holding(50, 4_800);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 20 },
      quote(5_000),
      AT,
      "o2",
    );
    expect(positionOf(result.portfolio, "MARI").quantity).toBe(30);
    expect(positionOf(result.portfolio, "MARI").averageCostCents).toBe(
      positionOf(portfolio, "MARI").averageCostCents,
    );
  });

  it("closes the position when the whole lot is sold", () => {
    const portfolio = holding(50, 4_800);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 50 },
      quote(5_000),
      AT,
      "o2",
    );
    expect(result.portfolio.positions.MARI).toBeUndefined();
  });

  it("records a loss when the price fell", () => {
    const portfolio = holding(50, 5_000);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 50 },
      quote(4_000),
      AT,
      "o2",
    );
    expect(result.portfolio.realisedPnlCents).toBeLessThan(0n);
  });
});

describe("executeOrder — rejections", () => {
  const book = quote(4_800);

  function expectRejection(
    portfolio: Portfolio,
    request: Parameters<typeof executeOrder>[1],
    pattern: RegExp,
  ) {
    const result = executeOrder(portfolio, request, book, AT, "o1");
    expect(result.order.status).toBe("REJECTED");
    expect(result.order.reason).toMatch(pattern);
    expect(result.portfolio.cashCents).toBe(portfolio.cashCents);
    expect(result.messages[0]).toMatch(pattern);
    return result;
  }

  it("rejects a zero quantity", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 0 },
      /positive whole number/,
    );
  });

  it("rejects a fractional quantity", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 1.5 },
      /positive whole number/,
    );
  });

  it("rejects a negative quantity", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: -10 },
      /positive whole number/,
    );
  });

  it("rejects selling a position that does not exist", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 1 },
      /short selling is not available/,
    );
  });

  it("never lets cash go negative", () => {
    const portfolio = createPortfolio(100_000n);
    // 100,000 cents of cash against a 4,800-centime price: 20 shares.
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10_000 },
      book,
      AT,
      "o1",
    );
    expect(result.portfolio.cashCents).toBeGreaterThanOrEqual(0n);
  });

  it("partially fills rather than rejecting when some cash is available", () => {
    const portfolio = createPortfolio(200_000n);
    const result = executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 1_000 },
      book,
      AT,
      "o1",
    );
    expect(result.order.status).toBe("PARTIAL");
    expect(result.order.filled).toBeGreaterThan(0);
    expect(result.order.filled).toBeLessThan(1_000);
    expect(result.portfolio.cashCents).toBeGreaterThanOrEqual(0n);
  });

  it("rejects a sell larger than the position and fills what it holds", () => {
    const holding = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 30 },
      book,
      AT,
      "o1",
    ).portfolio;
    const result = executeOrder(
      holding,
      { symbol: "MARI", side: "SELL", type: "MARKET", quantity: 100 },
      book,
      AT,
      "o2",
    );
    expect(result.order.status).toBe("PARTIAL");
    expect(result.order.filled).toBe(30);
    expect(result.portfolio.positions.MARI).toBeUndefined();
  });

  it("rejects a limit order that the market has not reached", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "LIMIT", quantity: 1, limitCents: 4_000 },
      /not currently marketable/,
    );
  });

  it("rejects a limit order with no price", () => {
    expectRejection(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "LIMIT", quantity: 1 },
      /positive limit price/,
    );
  });
});

describe("spendableShares", () => {
  it("never exceeds the number a naive division would give", () => {
    const portfolio = createPortfolio(1_000_000n);
    const price = 4_805;
    const shares = spendableShares(portfolio, price);
    const notional = BigInt(shares * price);
    expect(notional + commissionFor(notional)).toBeLessThanOrEqual(portfolio.cashCents);
  });

  it("cannot afford one more share at the result", () => {
    const portfolio = createPortfolio(1_000_000n);
    const price = 4_805;
    const shares = spendableShares(portfolio, price);
    const notional = BigInt((shares + 1) * price);
    expect(notional + commissionFor(notional)).toBeGreaterThan(portfolio.cashCents);
  });

  it("returns fewer shares than cash divided by price, because of the fee", () => {
    const price = 4_805;
    // Exactly 200 shares of cash, with nothing to spare: naive division says 200,
    // but the 480-centime commission pushes it over. 199 is the honest answer.
    const portfolio = createPortfolio(BigInt(200 * price));
    expect(Number(portfolio.cashCents / BigInt(price))).toBe(200);
    expect(spendableShares(portfolio, price)).toBe(199);
  });

  it("returns zero when the cash will not cover one share plus commission", () => {
    const portfolio = createPortfolio(4_800n);
    expect(spendableShares(portfolio, 4_805)).toBe(0);
  });

  it("respects cash reserved for settlement", () => {
    const portfolio = { ...createPortfolio(1_000_000n), reservedCents: 900_000n };
    // 100,000 cents available, not 1,000,000.
    expect(spendableShares(portfolio, 4_805)).toBe(20);
  });

  it("never returns a negative count when reserved cash exceeds the balance", () => {
    const portfolio = { ...createPortfolio(1_000n), reservedCents: 5_000_000n };
    expect(spendableShares(portfolio, 4_805)).toBe(0);
  });
});

describe("markToMarket", () => {
  it("values a position at the last price", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const marks = markToMarket(portfolio, [quote(5_000)], [], AT);
    expect(marks).toHaveLength(1);
    expect(firstOf(marks).marketValueCents).toBe(BigInt(100 * 5_000));
  });

  it("reports unrealised P&L in cents and basis points", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const mark = firstOf(markToMarket(portfolio, [quote(5_000)], [], AT));
    // Break-even basis 100 × 4,807 = 480,700; marked value 100 × 5,000 = 500,000.
    expect(mark.unrealisedPnlCents).toBe(19_300n);
    expect(mark.returnBps).toBe(401n);
  });

  it("flags a position still inside the settlement window as locked", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const ledger = [
      { symbol: "MARI", quantity: 10, dueAt: Math.floor(AT.getTime() / 1000) + 3600 },
    ];
    expect(firstOf(markToMarket(portfolio, [quote(4_800)], ledger, AT)).locked).toBe(true);
    expect(
      firstOf(markToMarket(portfolio, [quote(4_800)], ledger, new Date(AT.getTime() + 7_200_000)))
        .locked,
    ).toBe(false);
  });

  it("falls back to cost when a position has no quote", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const mark = firstOf(markToMarket(portfolio, [], [], AT));
    expect(mark.unrealisedPnlCents).toBe(0n);
  });
});

describe("totalEquityCents", () => {
  it("is cash plus the marked value of every position", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const marks = markToMarket(portfolio, [quote(4_800)], [], AT);
    const expected = portfolio.cashCents + BigInt(100 * 4_800);
    expect(totalEquityCents(portfolio, marks)).toBe(expected);
  });

  it("equals the starting cash when the mark equals the entry price", () => {
    const portfolio = executeOrder(
      createPortfolio(STARTING_CASH),
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 100 },
      quote(4_800),
      AT,
      "o1",
    ).portfolio;
    const marks = markToMarket(portfolio, [quote(4_805)], [], AT);
    // Bought at the ask, marked at the mid: equity is short exactly the spread.
    expect(totalEquityCents(portfolio, marks)).toBeLessThan(STARTING_CASH);
  });
});

describe("pendingSettlements", () => {
  it("returns only entries due in the future", () => {
    const now = Math.floor(AT.getTime() / 1000);
    const ledger = [
      { symbol: "MARI", quantity: 10, dueAt: now - 1 },
      { symbol: "CASA", quantity: 5, dueAt: now + 1 },
    ];
    expect(pendingSettlements(ledger, AT)).toHaveLength(1);
    expect(firstOf(pendingSettlements(ledger, AT)).symbol).toBe("CASA");
  });
});

describe("immutability", () => {
  it("never mutates the portfolio it is given", () => {
    const portfolio = createPortfolio(STARTING_CASH);

    // `bigint` has no JSON representation, so it is stringified on the way out.
    const snapshot = (): string =>
      String(
        JSON.stringify(portfolio, (_key, entry: unknown) =>
          typeof entry === "bigint" ? entry.toString() : entry,
        ),
      );

    const before = snapshot();
    executeOrder(
      portfolio,
      { symbol: "MARI", side: "BUY", type: "MARKET", quantity: 10 },
      quote(4_800),
      AT,
      "o1",
    );
    expect(snapshot()).toBe(before);
  });
});
