---
title: "Market orders, and what it costs you to stop waiting"
category: execution
date: 2026-02-05
summary: "The instruction delegating price to the market to guarantee execution. How the Casablanca electronic trading engine handles continuous trading and depth."
essential: true
related:
  - limit-orders
  - slippage
  - what-is-a-financial-market
---

# Market orders, and what it costs you to stop waiting

*For the members of the Financial Market Club, FSJES*

A market order (*ordre au marche*) says: *transact immediately, at whatever price is currently available in the order book*. It surrenders control over price to achieve certainty of execution.

That trade-off is the central concern of trade execution. When a member of our club sends an order through a Moroccan brokerage firm (*societe de bourse*), understanding the difference between the displayed quotation on the screen and the executed fill price prevents expensive surprises.

## What happens inside the order book?

There is no single "price" on an exchange. There is a two-sided queue called the **central order book** (*carnet d'ordres*). On the Bourse de Casablanca, the electronic trading system matches buyers and sellers based on strict price-time priority (*priorite de prix puis de temps*).

Consider an order book for BCP shares quoted on the Casablanca exchange:

| Bid Quantity | Bid Price (MAD) | Ask Price (MAD) | Ask Quantity |
| :--- | :--- | :--- | :--- |
| 500 | 290.00 | 291.50 | 300 |
| 1,200 | 289.50 | 292.00 | 800 |
| 3,000 | 289.00 | 293.00 | 2,500 |

If you enter a market buy order for 200 shares, your order executes instantly against the best ask price at 291.50 MAD.

However, if you submit a market buy order for 1,500 shares, the best ask level (300 shares at 291.50 MAD) is immediately exhausted. Your order "walks up the book":
- 300 shares fill at 291.50 MAD = 87,450 MAD
- 800 shares fill at 292.00 MAD = 233,600 MAD
- Remaining 400 shares fill at 293.00 MAD = 117,200 MAD

Your average fill price is:

$$\frac{87,450 + 233,600 + 117,200}{1,500} = 292.17 \text{ MAD}$$

You intended to buy at 291.50 MAD, but your own size pushed your average execution price up by 0.67 dirhams per share. That difference is not a fee; it is the price of demanding immediacy against finite book depth.

## Continuous trading versus fixing on the Bourse de Casablanca

The Bourse de Casablanca operates two distinct trading modes depending on liquidity:

1. **Continuous trading (*cotation en continu*):** Applied to the most liquid stocks (Attijariwafa, Maroc Telecom, BCP, LafargeHolcim, Cosumar). Orders enter the book throughout the session (09:30 to 15:30) and match continuously whenever bids and asks overlap.
2. **Fixing (*cotation au fixing*):** Applied to less liquid mid- and small-cap stocks. Orders accumulate in the book without execution until designated auction times (e.g., 12:30 and 15:30). The trading algorithm computes a single fixing price (*cours d'equilibre*) that maximizes the volume of shares executed.

Submitting an aggressive market order during a fixing auction on a thin stock can result in severe price dislocations, because there is no continuous liquidity to absorb the order.

## When to use a market order

Market orders are appropriate only when:
- The order size is small relative to visible depth at the best bid/ask.
- The bid-ask spread is tight (a fraction of a dirham).
- Immediacy is paramount (for instance, exiting a deteriorating position before market close).

In less liquid Moroccan equities, market orders should be avoided in favor of disciplined limit orders that place an explicit ceiling on what you are willing to pay.

### For discussion

1. In the order book table above, what is the bid-ask spread in dirhams? What percentage of the mid-price does this spread represent?
2. If an investor submits a market sell order for 2,000 shares in the order book above, calculate their average realized execution price.
3. Why does the Bourse de Casablanca implement static and dynamic circuit breakers (*seuils de reservation* at +/- 6% or +/- 10%) to protect market participants from catastrophic market order sweeps?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Harris, *Trading and Exchanges: Market Microstructure for Practitioners*, chapters 4 and 7. Bourse de Casablanca, Reglement General de la Bourse de Casablanca (rules on continuous trading, fixing, and price thresholds). AMMC circular on order execution.*
