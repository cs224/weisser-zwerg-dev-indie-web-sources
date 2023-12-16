---
layout: "layouts/post-with-toc.njk"
title: "Trading Evolved: Futures Trend Following"
description: "Andreas F. Clenow describes a futures trend following algorithm. Here I show my corresponding own backtest results."
creationdate: 2021-04-02T13:47:00+02:00
date: 2021-04-02T13:47:00+02:00
keywords: finance, investing, trend-following, futures, csi-data, zipline, ingest, bundle, csi_futures_data
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Investing via Financial Futures Contracts](../series-futures-investing) series.

## Rationale

In my last blog-post [Trading Evolved: CSI-Data](../trading_evolved_1) I described how to set-up a futures backtesting environment. Since then more than 3 months have passed.
Originally I intended to write more details and publish code, but due to lack of time I decided to at least publish pictures that show the results.

## Chapter 15: Futures Trend Following

Below you can see the results of my own backtests of Andreas F. Clenow's futures trend following algorithm that he describes in Chapter 15 in [Trading
Evolved](https://www.amazon.de/-/en/Andreas-F-Clenow/dp/109198378X). The backtest uses data from [CSI-Data](http://www.csidata.com/) as described in
my last blog-post [Trading Evolved: CSI-Data](../trading_evolved_1). The time window is between 2003-01-03 and 2020-10-01.

The algorithm delivers an annual return of $9.9\%$ with a maximum [drawdown](https://www.investopedia.com/terms/d/drawdown.asp) of $-28.4\%$. The
[Calmar ratio](https://www.investopedia.com/terms/c/calmarratio.asp) is defined as the annual return divided by the maximum drawdown and this is
$9.9/28.4\approx 0.35$. Personally I find the inverse of the Calmar ratio more useful, because it basically says how much time in years you would have
to wait to recover from the worst loss. That would be $1/0.35=2.85$ years (so roughly 3 years).

Just for reference the [S&P 500 (TR)](https://finance.yahoo.com/quote/%5ESP500TR) index[^snp500tr] for the same time period had the same annual return
of $9.9\%$, but a maximum drawdown of $55.25\%$, which means that you would have needed to wait for $5.6$ years to earn back your losses in its worst
drawdown. In the picture below the benchmark is the S&P 500 (TR) index.

This basically indicates that while the returns are similar the risk of losses is lower. This is impressive if you consider how simple/trivial the
algorithm from Andreas' book works! The other noteworthy bit is the Beta close to zero, which basically means that the futures trend following
strategy is mostly uncorrelated to the global stock markets. This is a good thing, because of [correlation
tightening](https://www.springerprofessional.de/correlation-tightening/15102122) that I mentioned in my previous blog post: "In falling markets, the
only thing that rises is correlation." When you stay with stocks/equities the level of diversification is severely hampered. Also note how the trend
following strategy actually earns serious amounts of money exactly at the times when the stock markets plummet.

<object data="/img/2020-11-22-trend.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-11-22-trend.png" alt="futures trend following results">
</object>

I've also invested some time and effort in implementing analysis tools to attribute earnings and losses to individual sectors. In the following
picture you can see which futures sectors in the long or in the short direction earn or lose money:

<object data="/img/2020-11-18-trend-sector-attribution.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-11-18-trend-sector-attribution.png" alt="futures trend following results">
</object>

The blue and orange curve showing the highest earnings belong to interest rate futures in the long direction and non-agricultural futures in the short
direction.

I then went one level deeper to analyse the indivdual contributions in a given sector. For example in the next picture you can see the contributions
of the agricultural futures:

<object data="/img/2020-11-18-trend-detail-attribution.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-11-18-trend-detail-attribution.png" alt="futures trend following results">
</object>

And finally I looked also in individual orders that made or lost money:

<object data="/img/2020-11-18-trend-detail-orders.png" type="image/png" style="max-width: 100%">
<img src="/img/2020-11-18-trend-detail-orders.png" alt="futures trend following results">
</object>

The individual black lines show the active futures contracts for the same underlying but with different maturities. In the green phases the trend
indicator points to an upwards trend and in the red phases it points to a downward trend. It is difficult to see, but in the picture are opening
wedges and closing wedges in red and orange. The red ones are showing when you enter and exit from a trend. The orange wedges show the rolling orders
for rolling positions at the end of the maturity of individual contracts. If the weges form a rectangle you earn money. If they do not form a rectange
you lose money.

All in all, by doing my own backtests and not only believing what somebody else said, I gained confidence in the core idea of the strategy and that it
actually works. What you can also see from the above pictures is that there is quite a bit of room for improvements (with the danger of overfitting),
e.g. you could remove futures or only one side of a future (either the long or the short side) if they consistently lose money. You can also mix a
single strategy like the futures trend model with a counter-trend model like Andreas did in his book. But all of that is beyond the scope of this blog post.


## Footnotes

[^snp500tr]: S&P 500 (TR) is the S&P 500 index that reinvests the returns (see [Total Return Index](https://www.investopedia.com/terms/t/total_return_index.asp) for more details).
