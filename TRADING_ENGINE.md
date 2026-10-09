# Trading Engine

## Overview

The trading engine is a pure, server-authoritative system for order execution, P&L calculation, and portfolio management. It uses exact `bigint` arithmetic for all financial calculations to prevent floating-point errors.

## Core Principles

1. **Server Authority**: All financial mutations are calculated server-side
2. **Exact Arithmetic**: Money uses `bigint` centimes, never floating-point
3. **Transaction Safety**: All operations use database transactions
4. **No Short Selling**: Positions cannot go negative
5. **T+2 Settlement**: Positions settle 2 business days after execution
6. **Audit Trail**: All mutations are logged immutably

## Order Lifecycle

```
1. Order Submission
   ↓
2. Validation (balance, position, constraints)
   ↓
3. Price Discovery (market or limit)
   ↓
4. Execution (partial or full fill)
   ↓
5. Fee Calculation
   ↓
6. Portfolio Update (cash, position, reserved)
   ↓
7. Execution Record
   ↓
8. Transaction Ledger Entry
   ↓
9. Settlement (T+2)
```

## Order Types

### Market Orders

- Execute immediately at current market price
- Guaranteed execution (if liquidity exists)
- Price uncertainty
- Used for immediate trading

### Limit Orders

- Execute only at specified price or better
- Price certainty
- No execution guarantee
- May remain pending indefinitely

## Order Sides

### BUY

- Increases cash reservation
- Increases position on fill
- Long-only (no short selling)

### SELL

- Requires existing position
- Decreases position on fill
- Increases cash on fill

## Execution Logic

### Market Order Execution

```typescript
function executeMarketOrder(portfolio: Portfolio, order: Order, quote: Quote): Execution {
  const price = quote.priceCents;
  const fees = calculateFees(order.quantity, price);
  const totalCost = order.quantity * price + fees;

  // Validate cash
  if (order.side === "BUY" && portfolio.cashCents < totalCost) {
    throw new Error("Insufficient funds");
  }

  // Validate position for sell
  if (order.side === "SELL") {
    const currentPosition = getPosition(portfolio, order.ticker);
    if (currentPosition.quantity < order.quantity) {
      throw new Error("Insufficient position");
    }
  }

  // Update portfolio
  if (order.side === "BUY") {
    portfolio.cashCents -= totalCost;
    portfolio.reservedCents -= totalCost;
  } else {
    portfolio.cashCents += order.quantity * price - fees;
  }

  // Update position
  updatePosition(portfolio, order, price);

  return {
    orderId: order.id,
    priceCents: price,
    quantity: order.quantity,
    feesCents: fees,
    timestamp: new Date(),
  };
}
```

### Limit Order Execution

```typescript
function executeLimitOrder(portfolio: Portfolio, order: Order, quote: Quote): Execution | null {
  // Check if market price meets limit
  if (order.side === "BUY" && quote.priceCents > order.priceCents) {
    return null; // Price too high
  }
  if (order.side === "SELL" && quote.priceCents < order.priceCents) {
    return null; // Price too low
  }

  // Execute at limit price (better for user)
  const executionPrice = order.priceCents;
  return executeMarketOrder(portfolio, { ...order, priceCents: executionPrice }, quote);
}
```

## Fee Calculation

```typescript
function calculateFees(quantity: bigint, price: bigint): bigint {
  const notional = quantity * price;
  const feeRate = 5n; // 0.05% = 5 basis points
  return (notional * feeRate) / 10_000n;
}
```

Fees are:

- 0.05% of notional value
- Charged on both buy and sell
- Deducted from proceeds on sell, added to cost on buy

## Position Management

### Average Price Calculation

When buying, the average price is weighted:

```typescript
function updatePosition(portfolio: Portfolio, order: Order, executionPrice: bigint): void {
  const existing = getPosition(portfolio, order.ticker);

  if (order.side === "BUY") {
    const newQuantity = existing.quantity + order.quantity;
    const totalCost =
      existing.quantity * existing.averagePriceCents + order.quantity * executionPrice;
    const newAveragePrice = totalCost / newQuantity;

    existing.quantity = newQuantity;
    existing.averagePriceCents = newAveragePrice;
  } else {
    // SELL - reduce position, average price unchanged
    existing.quantity -= order.quantity;
    if (existing.quantity === 0n) {
      removePosition(portfolio, order.ticker);
    }
  }
}
```

### No Short Selling

Selling is only allowed if position quantity >= order quantity:

```typescript
if (order.side === "SELL") {
  const position = getPosition(portfolio, order.ticker);
  if (position.quantity < order.quantity) {
    throw new Error("Cannot sell more than you own");
  }
}
```

## P&L Calculation

### Realized P&L

Realized when a position is fully closed:

```typescript
function calculateRealizedPnL(position: Position, exitPrice: bigint, quantity: bigint): bigint {
  const entryCost = position.averagePriceCents * quantity;
  const exitValue = exitPrice * quantity;
  const fees = calculateFees(quantity, exitPrice);

  return exitValue - entryCost - fees;
}
```

### Unrealized P&L

Mark-to-market for open positions:

```typescript
function calculateUnrealizedPnL(position: Position, currentPrice: bigint): bigint {
  const currentValue = currentPrice * position.quantity;
  const entryValue = position.averagePriceCents * position.quantity;

  return currentValue - entryValue;
}
```

### Total Equity

```typescript
function totalEquityCents(portfolio: Portfolio, marks: Map<string, bigint>): bigint {
  const cash = portfolio.cashCents;
  const positionsValue = Array.from(marks.entries()).reduce((sum, [ticker, price]) => {
    const position = getPosition(portfolio, ticker);
    return sum + position.quantity * price;
  }, 0n);

  return cash + positionsValue;
}
```

## Portfolio Marking

Mark-to-market updates all positions with current prices:

```typescript
function markToMarket(portfolio: Portfolio, quotes: Quote[], now: Date): Map<string, bigint> {
  const marks = new Map<string, bigint>();

  for (const quote of quotes) {
    const position = getPosition(portfolio, quote.ticker);
    if (position.quantity > 0n) {
      marks.set(quote.ticker, quote.priceCents);
    }
  }

  return marks;
}
```

## Concurrency Control

### Row-Level Locking

Prevents double-spend on concurrent orders:

```typescript
await db.transaction(async (tx) => {
  const portfolio = await tx.query.portfolios
    .findFirst({ where: eq(portfolios.id, portfolioId) })
    .for("update"); // Row lock

  // Validate and update
  if (BigInt(portfolio.cashCents) < totalCost) {
    throw new Error("Insufficient funds");
  }

  await tx
    .update(portfolios)
    .set({ cashCents: (BigInt(portfolio.cashCents) - totalCost).toString() })
    .where(eq(portfolios.id, portfolioId));
});
```

### Idempotency

Prevents duplicate order submission:

```typescript
const idempotencyKey = generateIdempotencyKey(userId, orderId);
const existing = await idempotencyRepository.get(idempotencyKey);
if (existing) {
  return existing.result; // Return cached result
}

// Execute order
const result = await executeOrder(order);

// Cache result
await idempotencyRepository.set(idempotencyKey, result);
```

## Order States

| State     | Description                               | Transitions                 |
| --------- | ----------------------------------------- | --------------------------- |
| PENDING   | Order submitted, awaiting execution       | FILLED, CANCELLED, REJECTED |
| FILLED    | Order fully executed                      | None (terminal)             |
| CANCELLED | Order cancelled by user                   | None (terminal)             |
| REJECTED  | Order rejected (insufficient funds, etc.) | None (terminal)             |

## Rejection Reasons

- **INSUFFICIENT_FUNDS**: Not enough cash for buy order
- **INSUFFICIENT_POSITION**: Not enough position for sell order
- **MARKET_CLOSED**: Market not open for trading
- **INVALID_QUANTITY**: Quantity must be positive
- **INVALID_PRICE**: Limit price must be positive

## Settlement (T+2)

Positions settle 2 business days after execution:

```typescript
function settlePosition(execution: Execution): void {
  const settleDate = addBusinessDays(execution.timestamp, 2);

  await db.insert(transactions).values({
    portfolioId: execution.portfolioId,
    type: execution.side === "BUY" ? "BUY" : "SELL",
    amountCents: execution.quantity * execution.priceCents,
    balanceAfterCents: calculateBalanceAfter(execution),
    description: `Settled ${execution.ticker} ${execution.side}`,
    settleDate,
    timestamp: new Date(),
  });
}
```

## Analytics

### Max Drawdown

Maximum peak-to-trough decline:

```typescript
function calculateMaxDrawdown(equityHistory: bigint[]): bigint {
  let peak = 0n;
  let maxDrawdown = 0n;

  for (const equity of equityHistory) {
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = peak - equity;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  }

  return maxDrawdown;
}
```

### Volatility

Standard deviation of returns:

```typescript
function calculateVolatility(returns: bigint[]): bigint {
  const mean = returns.reduce((sum, r) => sum + r, 0n) / BigInt(returns.length);
  const variance =
    returns.reduce((sum, r) => {
      const diff = r - mean;
      return sum + diff * diff;
    }, 0n) / BigInt(returns.length);

  return sqrt(variance); // Approximate sqrt for bigint
}
```

## Testing

The trading engine has comprehensive unit tests covering:

- Order execution (market and limit)
- Fee calculation
- Position management
- P&L calculation
- Portfolio marking
- Edge cases (insufficient funds, insufficient position)
- Concurrency (double-spend prevention)

Run tests:

```bash
pnpm test:unit trading-engine
```

## Performance Considerations

- All calculations use `bigint` for exact arithmetic
- No floating-point operations
- Minimal memory allocation (bigint is primitive)
- Database transactions are short-lived
- Row-level locking prevents long-held locks
