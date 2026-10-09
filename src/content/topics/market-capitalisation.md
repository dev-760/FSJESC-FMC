---
title: "Market capitalisation and what it does not tell you"
category: instruments
date: 2026-02-02
summary: "One number sizing a company, not its valuation. How free float governs the Moroccan MASI index, and why price-earnings multiples require context."
essential: false
related:
  - stocks-and-equities
  - fundamental-analysis
  - risk-and-return
---

# Market capitalisation and what it does not tell you

*For the members of the Financial Market Club, FSJES*

Market capitalisation is the total market value of all outstanding equity shares of a listed company:

$$\text{Market Capitalisation} = \text{Share Price} \times \text{Total Shares Outstanding}$$

On the Bourse de Casablanca, total equity market capitalisation fluctuates between 600 billion and 750 billion Moroccan dirhams, representing roughly 50% to 60% of Morocco's gross domestic product.

Used descriptively, market capitalisation sizes a firm. Used naively as a measure of whether a stock is "expensive" or "cheap", it produces severe errors.

## Total capitalisation versus free float: the MASI index

A company may have a massive nominal market capitalisation, but if 85% of its shares are held permanently by the Moroccan state, a foreign multinational, or a family conglomerate, only 15% is available for daily trading. This tradeable fraction is the **free float** (*flottant*).

The primary benchmark of the Casablanca stock exchange, the Moroccan All Shares Index (MASI), is a free-float market capitalization-weighted index. Weighting by free float prevents large corporations whose shares rarely change hands from dominating the index calculation:

$$\text{MASI Weight}_i = \frac{\text{Free Float}_i \times \text{Price}_i \times \text{Cap Factor}_i}{\sum (\text{Free Float}_j \times \text{Price}_j \times \text{Cap Factor}_j)}$$

To prevent excessive concentration, the Bourse de Casablanca imposes a capping factor (*facteur de plafonnement*), limiting any single stock's weight in the MASI to a maximum ceiling (traditionally 20%). Despite this rule, the top three Moroccan companies (Attijariwafa Bank, Maroc Telecom, and BCP) account for more than 40% of the entire index movement. When these three names rally, the MASI rises, even if dozens of small and medium enterprises on the exchange decline.

## The price-to-earnings trap

The most frequently quoted valuation metric on the Casablanca exchange is the price-to-earnings (P/E) multiple (*cours sur benefice / PER*), dividing share price by earnings per share (EPS).

While a PER of 15x suggests an investor is paying 15 MAD for every 1 MAD of annual net profit, three major pitfalls arise in practice:

1. **Cyclical earnings distortions:** Companies in commodity-sensitive or real estate sectors (such as Managem or Addoha) report peak earnings at the top of an economic expansion, displaying artificially low P/E ratios precisely when the shares are most vulnerable to a downturn.
2. **Accounting treatments:** Net accounting profit reflects depreciation schedules, non-recurring asset sales, and provisions under Moroccan accounting rules (Plan Comptable General Marocain). A firm can report healthy net profits while experiencing negative operating cash flow.
3. **Loss-making companies:** A firm with zero or negative net profit has an undefined P/E ratio, rendering the multiple useless for restructuring candidates.

## Enterprise value: accounting for debt

Market capitalisation measures the value of equity alone. If Company A has a market cap of 10 billion MAD and zero bank debt, while Company B has a market cap of 10 billion MAD but carries 15 billion MAD in net debt, purchasing Company B requires servicing 15 billion MAD of debt before equity holders capture value.

Financial analysts calculate **Enterprise Value (EV)** to assess total capital employed:

$$\text{Enterprise Value} = \text{Market Capitalisation} + \text{Total Debt} - \text{Cash and Equivalents}$$

Comparing companies by EV/EBITDA rather than P/E allows Moroccan financial analysts to evaluate operational profitability independently of how management chose to finance the balance sheet.

While our simulated trading platform allows club members to place orders across large and small market cap shares alike, our simulator cannot replicate real-world institutional float restrictions or off-market block negotiations. Members should remember that instant simulator execution in small-cap counters does not guarantee equivalent liquidity in live Moroccan markets.

### For discussion

1. If Maroc Telecom has 879 million shares trading at 100 MAD, what is its market capitalisation? If its free float is only 20%, what is the market value of shares actually available to the public?
2. Why did the Bourse de Casablanca introduce a dedicated compartment for Small and Medium Enterprises (SMEs), and why do smaller Moroccan stocks typically trade at a liquidity discount relative to blue chips?
3. Explain why a cash-rich company with large liquid reserves can have an Enterprise Value that is lower than its Market Capitalisation.

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Bodie, Kane, and Marcus, *Investments*, chapter 18. Damodaran, *Investment Valuation*, chapter 9. Bourse de Casablanca, Guide methodologique des indices MASI et MADEX. AMMC annual market reports.*
