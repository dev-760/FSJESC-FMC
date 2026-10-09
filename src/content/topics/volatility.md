---
title: "Volatility: measuring how much a price moves"
category: risk-portfolio
date: 2026-02-19
summary: "The standard deviation of returns, annualization across trading sessions, volatility clustering, and the dispersion of Moroccan equity sectors."
essential: true
related:
  - portfolio-risk
  - slippage
  - risk-and-return
---

# Volatility: measuring how much a price moves

*For the members of the Financial Market Club, FSJES*

Volatility measures the dispersion of an asset's returns around its average over time. In financial economics, it is computed as the standard deviation of logarithmic returns:

$$\sigma = \sqrt{\frac{1}{N - 1} \sum_{t=1}^{N} (r_t - \bar{r})^2}$$

Volatility does not measure whether an investment will make or lose money. It measures how violently price fluctuates along the path. A stock can exhibit high volatility and deliver outstanding multi-year returns, or display low volatility while slowly decaying in value.

## Annualizing volatility

Daily volatility is scaled to an annual benchmark by multiplying by the square root of the number of trading sessions in a year (typically 252 trading days on the Bourse de Casablanca):

$$\sigma_{\text{annuel}} = \sigma_{\text{quotidien}} \times \sqrt{252}$$

The square root scaling relies on the classical random walk assumption that daily returns are independent and identically distributed (i.i.d.).

In real markets, this independence assumption fails:
- **Volatility clustering:** Periods of high volatility are followed by high volatility, and calm days cluster together (a phenomenon formalized by Robert Engle in ARCH/GARCH modeling).
- **Fat tails (*leptokurtose*):** Extreme return events occur far more frequently in financial markets than predicted by a standard Gaussian bell curve. Stress tests assuming three standard deviations routinely underestimate crash frequency.

## Volatility across Moroccan sectors

The Moroccan equity market offers a compelling study in sectoral volatility divergence.

On the Bourse de Casablanca:
1. **Low-volatility defensive stalwarts:** Companies with stable, regulated, or domestic cash flows (such as Maroc Telecom, Cosumar, and established retail banks like BCP) traditionally demonstrate annualized volatilities between 10% and 15%.
2. **Medium-volatility cyclical stocks:** Industrial manufacturers, building materials (LafargeHolcim Maroc, Ciments du Maroc), and port operators (Marsa Maroc) fluctuate between 15% and 25% annualized volatility as construction and trade cycles wax and wane.
3. **High-volatility speculative assets:** Mining firms tied to global metal commodity prices (Managem, SMI) and real estate development companies (Addoha, Alliances) have historically posted annualized volatilities exceeding 35% to 50%, reflecting high financial leverage and sensitivity to macro sentiment.

Because MASI is heavily weighted toward low-volatility banks and telecom, the headline Moroccan index frequently appears calm (annualized volatility around 8% to 12%), masking large volatility swings occurring within individual constituent stocks.

## Historical volatility versus implied volatility

Analysts distinguish between two distinct perspectives on volatility:

- **Historical (realized) volatility:** Calculated retrospectively from past closing prices over a specified window (such as 30, 90, or 252 trading days). It records how turbulent price action was over historical intervals.
- **Implied volatility:** Derived prospectively from options premiums using mathematical models like Black-Scholes. It reflects the market consensus forecast of future uncertainty over the contract lifespan.

Because Morocco does not currently feature an active exchange-traded equity derivatives market, participants on the Bourse de Casablanca rely primarily on realized volatility metrics and Parkinson high-low estimators to assess ongoing regime shifts.

## Volatility is a proxy for risk, not risk itself

A common mistake is treating volatility as identical to risk. Volatility treats upside rallies and downside crashes equally: a 5% surge and a 5% drop generate the exact same variance.

For a student investor, permanent capital destruction (such as corporate bankruptcy or terminal dilution) is the true risk, not temporary price fluctuation. To assess true downside exposure, investors pair volatility with path-dependent measures like Maximum Drawdown.

### For discussion

1. If Attijariwafa Bank shares have a daily return standard deviation of 0.8%, calculate its annualized volatility assuming 252 trading days.
2. Why does computing volatility over a quiet summer period on the Casablanca exchange give an artificially low risk forecast for the autumn trading months?
3. If an investor holds a portfolio of five stocks, can the portfolio's total volatility be lower than the volatility of every individual stock it contains? Under what mathematical condition?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Bodie, Kane, and Marcus, *Investments*, chapter 5 (risk and return). Hull, *Options, Futures, and Other Derivatives*, chapter 15 (volatility and historical estimation). Bank Al-Maghrib, Rapport annuel sur la stabilite financiere. Bourse de Casablanca market statistics.*
