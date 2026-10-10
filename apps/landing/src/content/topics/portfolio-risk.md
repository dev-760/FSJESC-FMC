---
title: "Portfolio risk: drawdown, the number that matters"
category: risk-portfolio
date: 2026-03-05
summary: "Maximum drawdown is the path-dependent loss measure investors actually experience. The asymmetric arithmetic of recovery and AMMC stress testing requirements."
essential: true
related:
  - volatility
  - risk-and-return
  - portfolio-allocation
---

# Portfolio risk: drawdown, the number that matters

*For the members of the Financial Market Club, FSJES*

While volatility summarizes the statistical spread of returns, **Maximum Drawdown** describes what actually happened along the historical investment path.

Maximum drawdown measures the percentage decline from a portfolio's highest peak to its subsequent lowest trough over a specific measurement window:

$$\text{Drawdown}(t) = \frac{\text{Portfolio Value}(t) - \text{Peak Value}(t)}{\text{Peak Value}(t)}$$

$$\text{Maximum Drawdown} = \min_{t} (\text{Drawdown}(t))$$

No investor stays awake at night worrying about a 14% annual standard deviation. What causes panic, margin calls, and forced liquidations is observing an account balance fall from 100,000 MAD to 65,000 MAD.

## The asymmetric arithmetic of loss recovery

Losses are fundamentally asymmetric with gains because the capital base shrinks after a drawdown:

| Realized Drawdown | Gain Required to Recover to Breakeven |
| :--- | :--- |
| -10% | +11.1% |
| -20% | +25.0% |
| -30% | +42.9% |
| -40% | +66.7% |
| -50% | +100.0% |
| -60% | +150.0% |
| -75% | +300.0% |
| -90% | +900.0% |

A 50% loss requires a 100% gain simply to return to the starting line. If an equity portfolio drops by half, and subsequently compounds at an optimistic Moroccan market average of 8% per year, it will take over nine years of uninterrupted compounding just to recover the lost principal.

This arithmetic dictates why position sizing and strict drawdown limits (*stop-loss*) are far more critical to long-term success than searching for the highest returning stock.

## Historic market drawdowns in Morocco

The Moroccan equity market has experienced several major drawdown cycles that tested institutional resilience:

1. **The 2008 Global Financial Crisis:** Although Morocco's banking sector was insulated from toxic subprime mortgages, foreign capital withdrawals and broader macroeconomic slowdown caused the MASI to tumble from its June 2008 peak of over 15,000 points down to below 10,000 points, delivering a maximum drawdown exceeding 35%.
2. **The 2012-2013 Stagnation:** A prolonged consolidation driven by real estate debt restructuring and fiscal deficits produced a multi-year grind lower of roughly 25%.
3. **The March 2020 Pandemic Shock:** Amid sudden national lockdown announcements, the MASI plunged by more than 26% within four weeks before Bank Al-Maghrib rate cuts and domestic institutional liquidity stabilized the market.

In each episode, investors who maintained adequate cash reserves and diversified fixed income holdings survived the drawdown intact, while leveraged participants were forced to liquidate at market bottoms.

## AMMC regulatory stress testing

In Morocco, the Autorite Marocaine du Marche des Capitaux (AMMC) requires mutual fund management companies (*societes de gestion d'OPCVM*) to implement rigorous risk management frameworks.

Asset managers must perform regular stress tests simulating historical market crises, calculating potential Value-at-Risk (VaR) and maximum expected drawdown under extreme liquidity dry-ups. Funds are required to categorize risk profiles (from DICI risk scale 1 to 7) so retail Moroccan savers understand the drawdown magnitude they may experience before committing capital.

## Drawdown duration: recovery time and psychological endurance

Drawdown is defined not only by its numerical depth, but also by its temporal duration. A complete drawdown lifecycle consists of three distinct phases:

1. **Peak-to-trough phase (the contraction):** The interval during which portfolio value deteriorates from its prior all-time high down to the lowest recorded valuation point.
2. **Trough-to-recovery phase (the underwater period):** The time required for the remaining capital base to compound back to the previous peak watermark.
3. **New high phase (capital expansion):** The resumption of net positive wealth creation beyond the historic high point.

During prolonged market consolidations on the Casablanca exchange, such as the post-2008 period, participants frequently experience psychological fatigue and capitulate near cyclical bottoms. Incorporating duration into risk models prevents investors from taking exposures whose recovery horizon exceeds their practical financial flexibility.

### For discussion

1. If an FMC member starts with 50,000 MAD, achieves a gain to 80,000 MAD, and then experiences a decline to 60,000 MAD, what is the drawdown percentage? (Note: calculate from the peak, not from the initial starting capital).
2. Why is maximum drawdown a path-dependent measure, while annualized volatility is largely order-independent?
3. How do Moroccan portfolio managers use stop-loss rules and allocation to short-term Treasury debt to prevent a portfolio drawdown from exceeding the threshold where recovery arithmetic becomes mathematically insurmountable?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Magdon-Ismail and Atiya, "Maximum drawdown", *Risk Magazine*. Bodie, Kane, and Marcus, *Investments*, chapter 8. AMMC, Circulaire sur la gestion des risques des societes de gestion d'OPCVM. Bourse de Casablanca, series historiques du MASI (2008-2024).*
