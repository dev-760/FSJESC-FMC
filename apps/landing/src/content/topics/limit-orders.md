---
title: "Limit orders: putting a price on your patience"
category: execution
date: 2026-02-09
summary: "The order type placing a ceiling on purchase price and a floor on sales. Order validity, queue priority, and adverse selection on the Casablanca exchange."
essential: true
related:
  - market-orders
  - slippage
  - profit-and-loss
---

# Limit orders: putting a price on your patience

*For the members of the Financial Market Club, FSJES*

A limit order (*ordre a cours limite*) states: *execute at this specified price or better, and not at all otherwise*.

A limit order trades urgency for price control. Instead of taking whatever price the market offers, you place a standing offer in the order book and wait for another participant to cross the spread and trade with you. You provide liquidity rather than consuming it.

## The fundamental rules of limit orders

A buy limit order executes at your stated limit price or lower. A sell limit order executes at your stated limit price or higher.

This asymmetry establishes an ironclad boundary:
- A buy limit at 285.00 MAD is a price **ceiling**: the broker cannot fill your order at 285.05 MAD under any circumstances. If an eager seller crosses the spread at 284.50 MAD, you receive the improved fill at 284.50 MAD.
- A sell limit at 310.00 MAD is a price **floor**: you refuse to sell for anything less than 310.00 MAD.

The core risk of a limit order is **non-execution**. If the market moves away from your limit price, your order sits untouched in the order book while prices continue without you.

## Order validity and time-in-force on the Casablanca exchange

When submitting a limit order through a Moroccan brokerage, you must specify its duration of validity (*duree de validite*):

1. **Day order (*ordre jour*):** The default validity. The order rests in the book until the end of the current trading session (15:30) and is automatically cancelled if unfilled.
2. **Good-till-date (*ordre a date determinee*):** The order remains active in the book until a specified future date (maximum 365 days on the Bourse de Casablanca) or until filled.
3. **Good-till-cancelled (*ordre a revocation*):** The order stays in the central book until the investor explicitly cancels it or until the instrument undergoes a corporate action (like a dividend payout).
4. **Immediate-or-cancel / Fill-or-kill (*tout ou rien / immediat ou annule*):** Specialized execution instructions demanding immediate execution against resting liquidity, cancelling any unexecuted portion.

## Queue priority and tick sizes

On the Bourse de Casablanca, incoming orders are organized in the central matching engine according to **price-time priority** (*priorite au meilleur prix, puis au premier entre*).

All orders at the best price are filled before orders at worse prices. Within the same price level, the order that was entered into the system earliest fills first.

Furthermore, a resting limit order frequently experiences a **partial fill**: if you enter a buy limit order for 500 shares of Attijariwafa Bank at 500 MAD, but only 200 shares are offered by an incoming seller, your broker executes a partial fill of 200 shares. The remaining 300 shares continue resting in the order book at 500 MAD until another seller arrives or the order expires.

Furthermore, prices cannot be entered at arbitrary fractions of a centime. The exchange enforces minimum price increments known as **tick sizes** (*pas de cotation*). For a stock trading between 100 MAD and 500 MAD, the tick size might be set at 0.05 MAD or 0.10 MAD. Attempting to place an order at 285.023 MAD will be rejected by the trading terminal.

## The adverse selection problem

Why do limit orders get filled? Because another participant decided to trade against you.

This creates the classic microstructure phenomenon of **adverse selection**:
- If positive news arrives and a stock rallies, your limit sell order is quickly swept by fast-moving buyers before you can cancel it. You sold too early.
- If negative news arrives and a stock crashes, incoming market sellers fill your resting buy limit order on their way down. You bought an asset that continues to decline.

A filled limit order is not automatically a successful trade. It is a trade where the market agreed to your terms, frequently because the counterparty possessed urgent information or liquidity needs.

### For discussion

1. If Marsa Maroc is trading at 320 MAD, explain why a buy limit order placed at 300 MAD might never fill, even if the general market pulls back. What is the opportunity cost?
2. Why does the Bourse de Casablanca purge all resting good-till-cancelled orders when a listed company goes ex-dividend (*detachement du dividende*)?
3. In a volatile trading session, how does placing a limit order protect an investor from paying an unexpected price spike compared to a market order?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Harris, *Trading and Exchanges*, chapter 5 (limit orders and queue dynamics). Bourse de Casablanca, Guide des types d'ordres et regles de negociation. AMMC investor education series.*
