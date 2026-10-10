---
title: "Realized and unrealized profit and loss"
category: accounting
date: 2026-02-16
summary: "The vital difference between paper mark-to-market valuations and locked cash gains. Moroccan brokerage commissions, exchange fees, and the 15% capital gains tax."
essential: true
related:
  - limit-orders
  - portfolio-allocation
  - market-orders
---

# Realized and unrealized profit and loss

*For the members of the Financial Market Club, FSJES*

In financial accounting, profit and loss (P&L) is divided into two distinct states: **unrealized** (*plus-value ou moins-value latente*) and **realized** (*plus-value ou moins-value realisee*).

Confusing the two is a classic error. An unrealized gain is an estimate based on the last quoted price of an asset you still own; a realized gain is settled cash sitting in your account after all transaction costs and taxes have been deducted.

## Two states of profit and loss

- **Unrealized P&L:** The change in market value of an open position. If you bought 100 shares of Attijariwafa Bank at 480 MAD and the current price is 510 MAD, you have an unrealized gain of 3,000 MAD. If the market drops tomorrow to 460 MAD, that gain vanishes before you touch a single dirham.
- **Realized P&L:** Locked in only when you execute a closing transaction. Selling those 100 shares at 510 MAD converts the open exposure into closed, permanent dirhams.

Selling a profitable position does not create new wealth on the day of the sale; it merely reclassifies existing portfolio value from paper equity into liquid cash.

## Cost basis: Weighted Average Price (PMP)

When an investor buys multiple blocks of the same stock over time at different prices, how do they measure the baseline purchase price?

Under Moroccan market practice and tax regulation, portfolios use the **Prix Moyen Pondere (PMP)** or Weighted Average Cost:

$$\text{PMP} = \frac{\sum (\text{Quantity}_i \times \text{Price}_i)}{\sum \text{Quantity}_i}$$

Suppose you buy:
- Block 1: 50 shares of BCP at 280 MAD (14,000 MAD)
- Block 2: 50 shares of BCP at 300 MAD (15,000 MAD)

Your PMP is:

$$\text{PMP} = \frac{14,000 + 15,000}{100} = 290 \text{ MAD}$$

If you sell 40 shares at 310 MAD, your realized gross profit is $(310 - 290) \times 40 = 800 \text{ MAD}$. Your remaining 60 shares continue to be carried at the PMP of 290 MAD.

## Transaction friction in the Moroccan market

Beginners often overlook transaction costs when calculating P&L. On the Bourse de Casablanca, buying and selling equities incurs several distinct fees:

1. **Brokerage commission (*commission de la societe de bourse*):** Typically 0.40% to 0.70% of the transaction value.
2. **Exchange fee (*commission de la Bourse de Casablanca*):** Approximately 0.10% of transaction value.
3. **Central depository fee (*commission de Maroclear*):** Nominal clearing and custody fee.
4. **Value-Added Tax (TVA):** A 10% tax applied to all brokerage and exchange commission amounts.
5. **Capital Gains Withholding Tax (TPCM - *Taxe sur les Profits de Capitaux Mobiliers*):** Under the Moroccan General Tax Code (*Code General des Impots*), individuals pay a 15% withholding tax on net realized capital gains from listed shares.

Consider buying 100,000 MAD of stock and selling at 105,000 MAD (a gross gain of 5.0%). Round-trip brokerage, exchange fees, and TVA consume roughly 1.3% of the capital (1,300 MAD). Net capital gain before tax is 3,700 MAD. Deducting 15% TPCM (555 MAD) leaves 3,145 MAD in actual pocketed cash: an effective net return of 3.15%, not 5.0%.

In high-turnover trading strategies, execution friction and tax drag routinely make the difference between a profitable and a loss-making record.

### For discussion

1. If an investor holds a portfolio showing +15% unrealized P&L during a bull market, why does the risk profile increase if the portfolio is not rebalanced?
2. If you buy 100 shares of LafargeHolcim at 1,800 MAD and sell them at 1,850 MAD, calculate the net profit after 0.5% brokerage fees (each way), 0.1% Bourse fees (each way), 10% TVA on fees, and 15% TPCM on the net gain.
3. Why does Moroccan tax law permit investors to offset realized capital losses against realized capital gains within the same tax year?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Code General des Impots (Morocco), dispositions relatives a la TPCM. Bourse de Casablanca, Bareme des commissions de negociation et de reglement-livraison. Maroclear, Guide des operations de reglement.*
