---
title: "Slippage: why your price is not the quoted price"
category: execution
date: 2026-02-12
summary: "The gap between the observed screen price and the actual executed fill. How spread, depth, and market impact affect large orders on the Casablanca exchange."
essential: true
related:
  - market-orders
  - limit-orders
  - volatility
---

# Slippage: why your price is not the quoted price

*For the members of the Financial Market Club, FSJES*

Slippage (*glissement de cours*) is the difference between the price an investor expects to receive when initiating an order and the actual average price at which the order executes.

Many beginner traders calculate potential profits based on the last traded price visible on their screen. In real markets, large orders, illiquid stocks, or fast-moving volatility guarantee that your execution price will diverge from the quoted price.

## The four components of slippage

Slippage is not an administrative penalty. It arises from four distinct market mechanisms:

1. **The bid-ask spread:** If the last trade on Cosumar occurred at 220.00 MAD, but the current order book has the best bid at 219.00 MAD and best ask at 221.00 MAD, submitting an immediate market buy order fills at 221.00 MAD. You experience an immediate 1.00 MAD (0.45%) spread slippage relative to the last trade.
2. **Order book depth:** As analyzed in our market orders study, any order whose size exceeds the quantity available at the best bid or ask level must walk deeper into the book, consuming successively worse prices.
3. **Market impact:** The arrival of a substantial order signals buying or selling pressure to other traders and automated market makers. Observing a large buyer, other sellers cancel resting asks or raise their offer prices, pushing quotes higher before the order completes.
4. **Execution latency:** The delay between deciding to trade and your order arriving at the Bourse de Casablanca matching engine. In volatile sessions, prices can shift during this transmission window.

## Slippage grows superlinearly with order size

On a market like the Bourse de Casablanca, where average daily trading volume across the entire market often ranges between 100 million and 300 million dirhams, liquidity is concentrated in a handful of blue-chip stocks.

When an institutional fund manager needs to invest 10 million MAD in a mid-cap stock with only 500,000 MAD of daily volume, executing the order all at once would clear out the entire ask side of the book, triggering severe double-digit slippage.

Because order book depth thins out rapidly as you move away from the touch, **slippage grows non-linearly with size**. Doubling your order size often quadruples the execution slippage.

## How Moroccan institutions mitigate slippage

To protect against severe market impact, Moroccan market participants employ three primary mechanisms:

- **Block trading compartment (*marche de blocs*):** Under Bourse de Casablanca regulations, large orders meeting minimum transaction thresholds (*Taille Minimum de Bloc - TMB*) can be negotiated directly off the central electronic order book within an approved price band based on the central market cours. This prevents massive orders from destabilizing the retail order book.
- **Liquidity animation contracts (*contrats d'animation et de tenue de marche*):** Listed companies frequently contract with Moroccan brokerage firms (approved by the AMMC) to act as liquidity providers (*animateurs*), maintaining permanent bid and ask quotes within a maximum spread to dampen excessive slippage.
- **Algorithmic slicing (TWAP / VWAP):** Institutional traders slice large parent orders into small child orders distributed across days or weeks, allowing natural market flow to absorb each slice without moving the price.

### For discussion

1. If you submit a buy order for 1,000 shares of an industrial company where only 200 shares are offered at 150 MAD and the next 800 shares are offered at 155 MAD, calculate your percentage slippage relative to the best ask.
2. Why is slippage during market opening and closing fixing auctions on the Casablanca exchange often higher than during continuous trading mid-session?
3. How does high price volatility in Moroccan equities increase the expected slippage for market orders?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Almgren and Chriss, "Optimal execution of portfolio transactions", *Journal of Risk*. Harris, *Trading and Exchanges*, chapter 20 (liquidity and transaction costs). Bourse de Casablanca, Reglement du marche de blocs. AMMC regulations on market animation contracts.*
