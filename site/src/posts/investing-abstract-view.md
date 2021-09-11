---
layout: "layouts/post-with-toc.njk"
title: "Investing: Abstract View"
description: "There are only few abstract goals in investing: mean-reversion, trend-following."
creationdate: 2020-12-06T13:15:00+01:00
date: 2020-12-06T13:15:00+01:00
keywords: finance, investing, mean-reversion, trend-following
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Investing via Financial Futures Contracts](../series-futures-investing) series.

## Rational

While I am working in finance for close to 20 years I never looked in detail at what exactly do you aim for when you want to invest your own
money. Yes, sure, you want that your funds are growing, but how exactly do you try to achieve that? Surprisingly, it seems, that there are only two
core strategies you can chose from:

* Buying-cheap and selling-high (mean-reversion).
* Identifying a mechanic (in the sense of celestial mechanics) and betting on it (trend-following).

I'd be happy to hear from you if you think that there are other core strategies!

## My path so far ...

I basically read the following books and information sources to get my arms around the topic of investing your own money and growing your funds:

* [Assetmanagement: Portfoliobewertung, Investmentstrategien und Risikoanalyse](https://www.amazon.de/-/en/gp/product/379103829X/) by Dietmar Franzen and Klaus Schäfer.
* [Quantopian lectures](https://github.com/quantopian/research_public): sadly Quantopian stopped their original business and joined
  [Robinhood](https://www.benzinga.com/fintech/20/11/18242600/quantopian-joins-robinhood-to-democratize-finance-for-all), which also resulted in them
  taking down their web-site with all the great lecture content. On github you can still clone the
  [research_public](https://github.com/quantopian/research_public) repository, which contains the notebooks for the lectures. On YouTube you can also
  still find the videos for the [Quantopian Lecture Series](https://youtube.com/playlist?list=PLRFLF1OxMm_UL7WUWM31iynp0jMVf_vLW).  There is a gist
  [Quantopian Lectures Saved (github.com)](https://gist.github.com/ih2502mk/50d8f7feb614c8676383431b056f4291) providing an overview.
* [Time Series Analysis by State Space Methods](https://www.amazon.de/-/en/gp/product/019964117X) by James Durbin and Siem Jan Koopman.
  * Before reading the book I'd recommend the tutorial series [Kalman and Bayesian Filters in
    Python](https://nbviewer.jupyter.org/github/rlabbe/Kalman-and-Bayesian-Filters-in-Python/blob/master/table_of_contents.ipynb).This gives you a good understanding and intuition of what Kalman Filters do.
  * Another excellent source of information is [Estimating time series models by state space methods in Python:
    Statsmodels](http://www.chadfulton.com/research.html) by [Chad Fulton](https://github.com/ChadFulton/fulton_statsmodels_2017) describing the
    [statsmodels implementation](https://www.statsmodels.org/stable/statespace.html#statespace). In general the [blog
    posts](http://www.chadfulton.com/topics.html) of Chad Fulton are very good information sources, too.
* [Optimal Investment](https://www.amazon.de/-/en/L-C-G-Rogers/dp/3642352014) by L. C. G. Rogers.
  * I strongly recommend the [video teaching](https://appliedprobability.blog/category/control-for-finance/page/2/) series of [Neil
    Walton](https://sites.google.com/site/neilwaltonswebsite/home) about [Stochastic
    Control](https://appliedprobability.files.wordpress.com/2020/05/stochastic_control_2020_may.pdf) and his [Applied Probability
    Notes](https://appliedprobability.blog/index) blog posts. For the video teching series there is also a [YouTube
    Playlist](https://www.youtube.com/playlist?list=PLGboZ4litMr_TOwUANH-s-uFnczzy2uuW), but it lacks some videos that you find if you follow the
    [blog posts](https://appliedprobability.blog/category/control-for-finance/page/2/) series
* [Postmodern Portfolio Theory: Navigating Abnormal Markets and Investor Behavior](https://www.amazon.de/-/en/James-Ming-Chen/dp/1137544635) by James Ming Chen.
* [Trading Evolved](https://www.amazon.de/-/en/Andreas-F-Clenow/dp/109198378X) by Andreas F. Clenow.

In retrospect, I have to say that none of the books was very helpful in understanding on a high level what you actually are trying to do. This
understanding only emerged by talking to several people who do trade their own money for many years.

## Buying-cheap and selling-high (mean-reversion).

This is a very general pattern that not only applies to the investment world. Merchants are trying to buy low and sell high and the difference is
their profit. In the finance world this principle seems to have gotten the name [mean
reversion](https://en.wikipedia.org/wiki/Mean_reversion_(finance)). The mathematical theory behind it is well explained in the Quantopian lecture
[Integration, Cointegration, and
Stationarity](https://nbviewer.jupyter.org/github/quantopian/research_public/blob/master/notebooks/lectures/Integration_Cointegration_and_Stationarity/notebook.ipynb). You
basically try to identify a time series that moves around a mean and if the time series goes below the mean you buy and if it goes above the mean you
sell. This time series does not necessarily need to be a "primary" time series like the time series of a concrete stock, but it can be a constructed
time series out of several other assets, e.g. the time series of a portfolio of stocks. In the Quantopian lecture they also mention some statistical
tests with which you can get some confidence in how far the time series that you constructed is really stationary and can be used for mean-reversion
trading. I have my trouble with such an approach, because, in finance, I do not believe that you can predict the future from observations of the
past. But decide for yourself.

## Identifying a mechanic and betting on it (trend-following).

The other very general pattern is to identify a mechanism, a mechanic in the sense of celestial mechanics, based on which you predict the directional
movement of prices going either up or down. You may even be as sophisticated as coming up with a price target.

What do I mean by mechanism/mechanic? I personally like the idea of "old-tech" vs. "new-tech" very much. Good examples of that would be Kodak
vs. digital cameras. Or video rental shops vs. Netflix. If you think about it you'll come up with other examples. The idea is to identify such
market/technology "trends" and bet on them. The betting on them would work for example with a technique called
[pairs-trading](https://en.wikipedia.org/wiki/Pairs_trade). Again, a very good introduction and explanation is given in the Quantopian lecture
[Introduction to Pairs
Trading](https://nbviewer.jupyter.org/github/quantopian/research_public/blob/master/notebooks/lectures/Introduction_to_Pairs_Trading/notebook.ipynb). The
idea is to "neutralize" all other market aspects as much as possible and get this trend in an as pure form as possible so that you can bet your money
on only that mechanic without contamination from other market impacts.

### Behavioural finance: the lemmings in us.

I am tempted to count [techncal analysis](https://en.wikipedia.org/wiki/Technical_analysis) as a third method, but in principle it is only a special
case of the trend-following idea, only that the trend is less founded in basic real-world trends and more in a kind of self-fulfilling
prophecy. Technical analysis only works, because there are enough people out there who believe in technical analysis. It is somehow like bitcoin or
gold, where most of the value of bitcoin and gold stem from the fact that other people believe in the value.

> <span style="font-size:smaller"> **2021-05-16 Update**: Somehow the lemmings scheme often feels like a [Ponzi
> scheme](https://en.wikipedia.org/wiki/Ponzi_scheme). If you are early you will make money from the people who are late to the party.</span>

## And all the rest ...

And all the rest is mostly about risk management. You would not want to put all your eggs into one basket
([diversification](https://en.wikipedia.org/wiki/Diversification_(finance))) or bet all your life's savings on a charlatan (see for example the
[Madoff investment scandal](https://en.wikipedia.org/wiki/Madoff_investment_scandal)). You have to put some risk management around your investment
activities as a sort of safety net in case that your theories do not work as foreseen.

In principle, what you should do, is a sort of optimization under constraints, where the optimization goal is to maximize your profits but constrained
by the amount of risk you want to take on that path. The following two books give a good overview:

* [Optimal Investment](https://www.amazon.de/-/en/L-C-G-Rogers/dp/3642352014) by L. C. G. Rogers.
* [Postmodern Portfolio Theory: Navigating Abnormal Markets and Investor Behavior](https://www.amazon.de/-/en/James-Ming-Chen/dp/1137544635) by James Ming Chen.

The online material from [Neil Walton](https://sites.google.com/site/neilwaltonswebsite/home) about [Stochastic Control for
Finance](https://www.youtube.com/playlist?list=PLGboZ4litMr_TOwUANH-s-uFnczzy2uuW) and his [Applied Probability
Notes](https://appliedprobability.blog/index/) are also very good learning resources!


## And what about ...

And what about arbitrage or offering services? Yes, sure, there are other ways on how to earn money in the investment world:

* You could do arbitrage trading and try to identify market distortions across locations or across time.
* You could participate in legal front-running like described in [Flash Boys](https://www.amazon.de/-/en/Michael-Lewis/dp/0393351599) by Michael Lewis.
* You could open up an exchange and earn transaction fees.
* You could become a data provider and sell market data.
* You could offer services around credit ratings.
* You could become a market maker for options in some underlying. That's a service you can charge some money for. Your job would be to hedge the
  options so that you're sure you make your profit.
* ... any many other activities ...

All of those activities most likely are even safer and better ways to make money, but they lack the core aspect of what I think about when I hear the
term "investing": the randomness, the uncertainty. In addition many of these activities would require a complete organization to perform the job,
e.g. you would have difficulties to do that on your own.
