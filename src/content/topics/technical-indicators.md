---
title: "Technical indicators: what they can and cannot see"
category: pricing
date: 2026-03-09
summary: "Mathematical transformations of past prices and volumes into trading indicators. The dangers of curve-fitting and the limits of technical analysis in Moroccan markets."
essential: false
related:
  - fundamental-analysis
  - behavioural-finance
  - volatility
---

# Technical indicators: what they can and cannot see

*For the members of the Financial Market Club, FSJES*

A technical indicator is a mathematical transformation applied to a historical time series of prices or trading volumes, intended to extract signals regarding future price direction.

Every technical indicator is derived exclusively from historical data: open, high, low, close, and volume (OHLCV). No technical indicator contains any information that was not already present in past price history. Recognizing this fundamental truth protects club members from treating chart patterns as predictive magic.

## Common indicator categories

Technical indicators generally fall into three structural groups:

1. **Trend-following indicators:**
   - **Moving averages (Moyennes mobiles):** Smooth out short-term market noise over a rolling window (e.g., 20-day, 50-day, or 200-day simple or exponential moving averages). When a shorter moving average crosses above a longer moving average, traders interpret it as a bullish continuation signal.
   - **Characteristics:** Moving averages are strictly lagging indicators. By mathematical construction, they signal a trend only after it is already underway.
2. **Momentum oscillators:**
   - **Relative Strength Index (RSI):** Measures the magnitude of recent price gains relative to recent price losses over a 14-period window, bounded between 0 and 100. Readings above 70 are traditionally labeled "overbought" and below 30 "oversold".
   - **Pitfall:** In a strongly trending Moroccan equity (for example, a sustained rally in banking stocks following a positive earnings season), the RSI can remain persistently "overbought" for months while prices continue to climb.
3. **Volatility bands:**
   - **Bollinger Bands:** Place upper and lower bands two standard deviations away from a 20-day simple moving average. When volatility contracts (a "squeeze"), bands narrow; when price volatility expands, bands widen.

## Microstructure limits on the Bourse de Casablanca

Applying standard technical analysis indicators to the Moroccan equity market presents specific challenges:

- **Low liquidity and fixing auctions:** In thin Moroccan stocks traded by fixing rather than continuous cotation, days can pass with only a handful of shares exchanged. Computing a 14-day RSI or 50-day moving average on a stock that trades twice a week generates erratic, meaningless data.
- **Volume distortion:** On the Casablanca exchange, substantial block trades (*transactions de bloc*) executed between institutional pension funds or banks are often reported off-market at pre-agreed prices. An retail charting tool treating this sudden volume spike as a retail market breakout will generate false signals.
- **Lack of short selling:** In major Western markets, technical traders can easily short stocks when indicators turn bearish. On the Bourse de Casablanca, short selling (*vente a decouvert*) is not widely available to retail participants, meaning negative technical signals can only guide risk reduction or selling of existing holdings.

## Backtesting pitfalls: curve-fitting and data snooping

A common trap among students building trading strategies is **overfitting** (*sur-apprentissage*).

If you test 100 different indicator combinations (varying moving average lengths from 5 to 50, RSI thresholds from 20 to 80) against three years of historical MASI data, pure statistical randomness guarantees that a few parameter combinations will produce astonishing historical returns. When applied to real future market data, this "optimized" strategy inevitably breaks down because the model memorized past historical noise rather than capturing genuine economic reality.

While our simulated trading platform allows club members to experiment with chart indicators and trade timing, our simulator cannot validate technical rule profitability or replace fundamental economic analysis. A simulator provides valuable order practice, but cannot guarantee that mechanical indicators will overcome transaction friction in live markets.

### For discussion

1. If a 50-day moving average on Maroc Telecom shares crosses above the 200-day moving average (a classical "golden cross"), why is this indicator inherently lagging behind corporate earnings announcements?
2. Why does technical analysis tend to work better on liquid, continuously traded Casablanca equities (Attijariwafa Bank, BCP) than on small-cap stocks quoted by fixing?
3. What is the difference between reading volume on the central electronic order book versus volume resulting from pre-arranged institutional block transactions?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Murphy, *Technical Analysis of the Financial Markets*, chapters 9 and 10. Malkiel, *A Random Walk Down Wall Street*, chapter 6 (technical analysis critique). Aronson, *Evidence-Based Technical Analysis*. Bourse de Casablanca trading guides.*
