---
title: "Diversification, and what it does not protect you from"
category: risk-portfolio
date: 2026-02-26
summary: "Diversification reduces idiosyncratic risk while leaving systematic risk untouched. Sector correlations on the Bourse de Casablanca and the Markowitz frontier."
essential: false
related:
  - portfolio-allocation
  - risk-and-return
  - volatility
---

# Diversification, and what it does not protect you from

*For the members of the Financial Market Club, FSJES*

Harry Markowitz, the father of Modern Portfolio Theory, famously described diversification as the only "free lunch" in finance: by combining assets whose returns do not move in perfect lockstep, an investor can reduce total portfolio variance without sacrificing expected return.

However, understanding what diversification actually eliminates, and what it leaves completely untouched, is essential for every club member managing investment capital.

## Idiosyncratic risk versus systematic risk

Total portfolio risk decomposes into two distinct elements:

$$\text{Total Risk} = \text{Idiosyncratic Risk (Diversifiable)} + \text{Systematic Risk (Market)}$$

1. **Idiosyncratic risk (*risque specifique*):** The risk unique to an individual company or specific microeconomic event. A factory fire at a sugar refinery (Cosumar), a management dispute, an unexpected regulatory fine on a telecom operator, or a bad loan at a single commercial bank. Because these company-specific events are largely uncorrelated, holding a diversified basket of 15 to 25 distinct businesses across diverse sectors causes these shocks to cancel out.
2. **Systematic risk (*risque systematique / risque de marche*):** The macro risk that affects the entire economy simultaneously. A sudden shift in Bank Al-Maghrib policy rates, an inflation shock from imported energy prices, a severe multi-year drought across Morocco, or global liquidity tightening. Systematic risk cannot be eliminated by adding more Moroccan equities, because all listed companies operate under the same national macroeconomic conditions.

## The mathematics of correlation

For a two-asset portfolio holding weights $w_1$ and $w_2$, portfolio variance is given by:

$$\sigma_p^2 = w_1^2 \sigma_1^2 + w_2^2 \sigma_2^2 + 2 w_1 w_2 \sigma_1 \sigma_2 \rho_{12}$$

Where $\rho_{12}$ is the correlation coefficient between asset returns, ranging from -1 to +1.

If $\rho_{12} = +1$, the assets move in perfect synchronization, and diversification yields zero variance reduction. If $\rho_{12} < +1$, portfolio volatility is strictly less than the weighted average of individual volatilities.

Consider two stocks on the Bourse de Casablanca:
- Attijariwafa Bank ($\sigma_1 = 16\%$)
- Cosumar ($\sigma_2 = 14\%$)

Because banking profitability depends on credit margins and interest rate spreads, while sugar refining depends on agricultural harvests and global raw commodity inputs, their historical correlation is low ($\rho \approx 0.25$). A 50/50 allocation achieves an expected portfolio volatility of roughly 11.6%, substantially lower than either stock held in isolation.

## The illusion of line-item count

A frequent retail mistake is confusing the count of holdings with genuine diversification. Holding ten technology stocks or five Moroccan banking equities (Attijariwafa, BCP, BMCE, CIH, CDM) is not ten diverse positions; it is one large sectoral exposure sliced into multiple tickets.

Furthermore, during severe financial stress or macroeconomic panics, historical correlations tend to spike toward +1. When global risk appetite evaporates, market participants sell liquid assets indiscriminately, causing sectors that appeared uncorrelated during tranquil periods to fall together.

## The limits of Moroccan domestic diversification

An investor who diversifies exclusively across the Bourse de Casablanca remains 100% exposed to single-country systematic risk: Moroccan fiscal deficits, dirham foreign exchange exposure, and local regulatory decisions. True institutional diversification, practiced by funds like the Caisse de Depot et de Gestion (CDG) and major insurance portfolios, seeks cross-asset allocation into Moroccan sovereign debt, real estate (OPCI), private equity, and international foreign currency assets where authorized by the Office des Changes.

### For discussion

1. If you hold 100,000 MAD divided equally across Attijariwafa Bank, BCP, and BMCE Bank of Africa, explain why this portfolio carries high sector concentration risk despite holding three different company names.
2. Why does the correlation between Moroccan equities and international markets increase during global liquidity shocks?
3. How does adding a 30% allocation in Moroccan Treasury bonds (*Bons du Tresor*) dampen the total volatility of an equity portfolio during an economic downturn?

---

*For the members of the Financial Market Club, FSJES.*

*Sources: Markowitz, "Portfolio Selection", *Journal of Finance*. Bodie, Kane, and Marcus, *Investments*, chapter 7 (optimal risky portfolios). CDG Capital Research, Analyses de correlations sectorielles sur la Bourse de Casablanca. AMMC market structure reports.*
