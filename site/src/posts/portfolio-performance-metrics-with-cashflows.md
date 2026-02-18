---
layout: "layouts/post-with-toc.njk"
title: "Portfolio Performance Metrics with External Cashflows"
description: "An exercise in literate programming with nbdev2."
seodescription: "Portfolio performance with deposits/withdrawals: manager vs investor view, TWR and money-weighted XIRR, Dietz, unitization NAV/share, plus a practical nbdev2 Python implementation."
keywords: TWR, MWR, XIRR, IRR, Modified Dietz, unitization, NAV per share, shares outstanding, nbdev, nbdev2, literate programming, Python, Jupyter
creationdate: 2025-12-15
date: 2025-12-15
tags: ['post']
---

## Rationale

For a long time, one question has been bothering me: how do you evaluate portfolio performance when there are external cashflows (deposits and withdrawals)?

Yes, you can calculate daily returns "outside" the cashflows and chain them over time.
That is a good metric to judge a portfolio manager, because it focuses on investment decisions.
But as the portfolio owner, I also want a metric that reflects my real experience: the timing and size of my cashflows matter, and they can change the outcome significantly.

In this post, I explain several common approaches to performance measurement under cashflows, from a conceptual point of view.
I also show a practical Python implementation that I published on GitHub: [portfolio-performance-metrics](https://github.com/cs224/portfolio-performance-metrics).

The main topics are:

* Time-Weighted Return ([TWR](https://en.wikipedia.org/wiki/Time-weighted_return)): period return and annualized return
* Money-Weighted Return ([MWR](https://www.investopedia.com/terms/m/money-weighted-return.asp)) / XIRR ([IRR](https://en.wikipedia.org/wiki/Internal_rate_of_return)): period return and annualized return
* [Modified Dietz](https://en.wikipedia.org/wiki/Modified_Dietz_method): period return and annualized return
* Unitization (a unitization table with NAV-per-share and shares outstanding)

I am a big fan of [literate programming](https://en.wikipedia.org/wiki/Literate_programming), but in practice it often fails because the tooling is weak.
That is why I used this project to learn [nbdev2](https://github.com/AnswerDotAI/nbdev): you write code in Jupyter notebooks first, and then generate clean Python packages and documentation in a second step.
The generated documentation is published via GitHub pages here: [portfolio-performance-metrics](https://cs224.github.io/portfolio-performance-metrics).

Finally, I share the practical lessons I learned while working with `nbdev2`, including what worked well and what I would do differently next time.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.

## Conceptual View

### The core problem: "performance" is ambiguous once cash moves in and out

If a portfolio never receives external cashflows, performance is straightforward. You can compare the start value to the end value, and the percentage change is your return.

As soon as you add **external cashflows** such as deposits, withdrawals, fees paid out of the account, or taxes paid out of the account, that simple comparison breaks. The reason is simple: the portfolio value now changes for two different reasons, and those reasons are mixed together.

> **What is an "external cashflow" in this context?**  
> External cashflows are transfers between you and the portfolio account.
> Typical examples are deposits and withdrawals. Fees and taxes belong here if they leave the account and reduce the portfolio value.
> By contrast, trades inside the portfolio are not external cashflows.
> Buying and selling assets, reinvesting dividends, and daily price changes are internal activity and should be reflected in the valuation, not recorded as external cashflows.
> This distinction matters because TWR and MWR treat external cashflows in a special way, but they assume that internal activity is already included in the portfolio value.

A deposit increases the portfolio value even if the strategy did nothing. A withdrawal decreases the portfolio value even if the strategy did nothing.
Most importantly, the **timing** of deposits and withdrawals can change the outcome for you as an investor, even if the strategy produces the same percentage returns.

> To make this concrete, imagine your portfolio goes through three periods, and the invested base is not constant because you add and remove cash.
>
> Suppose the strategy produces these percentage returns:
>
> * In **period p1**, the strategy return is low.
> * In **period p2**, the strategy return is high.
> * In **period p3**, the strategy return is low again.
>
> Now compare two investors who both hold the same strategy, but who choose different moments for deposits and withdrawals.
>
> **Situation A: you have a large base during the high return period**
> You deposit a large amount before p2 and you withdraw later. The high return in p2 is applied to a large portfolio value. That creates a large absolute profit.
>
> For example, assume p2 has a +10 percent return:
>
> * If the base value at the start of p2 is 200,000, then +10 percent means a gain of 20,000.
> * If p1 and p3 are small or flat, the final outcome is still strongly driven by that 20,000 gain.
>
> **Situation B: you have a small base during the high return period**
> You deposit later, or you withdraw before p2. Now the same +10 percent return is applied to a smaller portfolio value. The strategy did the same thing, but your absolute profit is much smaller.
>
> * If the base value at the start of p2 is 50,000, then +10 percent means a gain of only 5,000.
>
> This difference is the key: the strategy return is a percentage, but the investor outcome is money.
> The money result depends on the percentage return **and** on the **timing** of how much capital was invested at what moment.

So the real question becomes: **performance relative to what?**
In other words, what is the right baseline for a percentage return when the baseline changes over time?

People sometimes call this the "denominator problem". A return is always "something divided by something".
In a cashflow free world the denominator is stable: it is basically your starting capital.
With cashflows, the denominator changes over time, so you must decide what you want to measure.

In practice, there are two valid perspectives, and they lead to different metrics.

1. **Manager or strategy perspective**
   "How good was the investment process, independent of when money was added or removed?"

2. **Investor perspective**
   "How well did my money do, including the effects of my timing decisions?"

**Time Weighted Return** (TWR) is designed for the first perspective. It tries to measure investment performance while neutralizing external cashflows.

**Money Weighted Return** (MWR), often computed as IRR or XIRR, is designed for the second perspective. It measures the return you experienced on the money you actually put in, including timing effects.

**Modified Dietz** is a practical approximation that often sits closer to the investor perspective, especially when you do not have enough valuation data for an exact TWR.

**Unitization** is a bookkeeping method that makes the manager perspective more transparent by turning your portfolio into something that behaves like a small fund with shares and a NAV per share.
The reason I like unitization is that it provides both stories in one table: NAV per share is the clean performance series, similar to TWR, and the number of shares tells you how your invested capital changed over time, which is also what drives the differences you later observe in MWR.

> A useful mental model is this: TWR is about the "sequence of percentage returns" and MWR is about the "sequence of cashflows".
> If you only look at end value minus start value, you combine both sequences into one number.
> That number can be very misleading, because it does not tell you whether the strategy performed well, or whether you simply invested more money at a lucky time.

If you want to see a more detailed explanation about how to read a unitization table then have a look in the appendix [Reading a unitization table: performance and cashflows in one place](#reading-a-unitization-table%3A-performance-and-cashflows-in-one-place).

### How Time Weighted Return (TWR) works

You split the full timeline into sub-periods such that each sub-period ends at a valuation date, and you handle any external cashflow at that boundary.

For a sub-period from $t_{i-1}$ to $t_i$, with:

* $V_{i-1}$ = portfolio valuation at the start of the sub-period
* $V_i$ = portfolio valuation at the end of the sub-period (often "post-flow", see below)
* $CF_i$ = external cashflow at the end date $t_i$ in portfolio view (deposit positive, withdrawal negative)

the sub-period return is:

$$
r_i = \frac{V_i - CF_i}{V_{i-1}} - 1
$$

Then you chain-link:

$$
TWR = \left(\prod_i (1 + r_i)\right) - 1
$$

Exact TWR requires valuations at each date where an external cashflow happens. Without that, you do not know how to separate "market movement" from "cashflow jump" inside the period.

If valuations are missing, you have three options:

* accept that TWR is not computable and report only MWR/Dietz,
* approximate (Modified Dietz),
* or **impute** missing valuations using a modeling assumption (more on this later).

**"Post-flow" vs "pre-flow" convention**: The formula above assumes that $V_i$ is the valuation **after** the external cashflow on date $t_i$ (end-of-day post-flow).
If your data provides valuations **before** the cashflow, the formula must change.
In an implementation, you should pick one convention, document it clearly, and validate inputs accordingly.

### How Money-Weighted Return (MWR / IRR / XIRR) works

**Names: MWR, MWRR, IRR, XIRR**: These names are closely related:

* **MWR / MWRR**: "money-weighted return (rate)"
* **IRR**: internal rate of return (same idea)
* **XIRR**: eXtended IRR with *irregular dates* (calendar day differences)

In portfolio tracking, **XIRR is usually the right version**, because deposits and withdrawals rarely happen in perfectly equal periods.

MWR answers the investor question:

* "Given the dates and sizes of my deposits and withdrawals, what constant annual rate of return would explain my outcome?"

In other words, MWR includes the effect of your timing decisions.

MWR is very useful because it matches how many people intuitively think:

* money in,
* money out,
* and "what interest rate would make those cashflows consistent?"

The defining equation: XIRR is the annual rate (r) that solves:

$$
0 = \sum_{k} \frac{CF_k}{(1+r)^{\tau_k}}
$$

where $\tau_k$ is the year fraction (e.g., ACT/365) from the chosen start date to the cashflow date and the last $CF_k$ is in such a way as to pay the whole portfolio value back to the investor and bring the portfolio value to $0$.

**Period return vs annualized return**

XIRR returns an **annualized** rate.
This is important because annualized IRR can look extreme over short periods. In reporting, it's often better to show **both**:

* annualized MWR (XIRR)
* and the implied period return

**Edge case: multiple IRR solutions**

If the cashflow sequence changes sign more than once (e.g., deposit, withdrawal, deposit, withdrawal), the IRR equation can have:

* multiple solutions,
* or no solution.

Many implementations warn about this. In such cases, MWR is still "defined" as an equation, but numerically it becomes tricky and interpretation becomes weaker. TWR is usually the safer metric for strategy comparison.

**Modified Dietz**: Modified Dietz is commonly used when you do not have enough valuation points to compute exact TWR, but you still want a reasonable performance estimate that accounts for cashflows.

It is best seen as a **time-weighted approximation to the money-weighted idea**, assuming returns are earned roughly evenly through the period.

Dietz is useful because:

* it only needs **start and end valuations** plus cashflow dates and sizes,
* it is easy to compute and explain,
* it often matches XIRR reasonably well when returns are not "too wild".

But Dietz is still an approximation. It does not model compounding and market path exactly. If cashflows are large and timing is extreme, Dietz can deviate from XIRR and TWR.

### Futures portfolios: why the "capital base" becomes slippery

Futures are where many people feel that the usual portfolio performance toolbox stops fitting.
The key problem is that exposure is not the same as invested cash.
With futures, you do not pay the full notional upfront. You post margin and your account is marked-to-market daily.

So what is the "capital" that performance should be measured against?

* required margin?
* account equity?
* cash collateral parked elsewhere?
* notional exposure?

Different answers can produce wildly different "returns" even if the trading is identical.

I personally tend to look at **risk-normalized metrics** in those cases. Sharpe, Sortino, max drawdown, Calmar, return/VaR, etc. are often more meaningful across leveraged strategies.
But this will be the topic of a future blog post

## Implementation overview

The codebase is deliberately small and modular: each metric is implemented as a focused function, and a thin orchestration layer turns a "cashflows + valuations" table into a summary report and a unitization time series.

**Input contract (one table, one convention).** The library expects a CSV/Excel table with case-insensitive columns `date`, `cashflow`, `valuation`.
Cashflows use the **investor view** sign convention (deposits negative, withdrawals positive).
Valuations are assumed to be **post-flow end-of-day** values on their dates, which is why cashflows on the first valuation date are rejected (they should be absorbed into the starting valuation).

**Module layout (mirrors the nbdev docs pages):**

* **`portfolio_performance_metrics.io`**: `load_cashflows(path)` loads CSV/Excel, normalizes columns, aggregates same-day rows (sum flows, keep last non-null valuation), and returns a `LoadResult`.
* **`portfolio_performance_metrics.core`**: domain types (`Flow`), day count (`year_fraction`, ACT/365F), and the "pure math" implementations:
  * `time_weighted_return(...)` (chain-linked, **portfolio-view** flows),
  * `money_weighted_return(...)` (XIRR on **investor-view** cashflows),
  * `modified_dietz(...)` (**portfolio-view** flows, weighted by remaining period),
  * `unitization_series(...)` (NAV/share + shares outstanding, **investor-view** flows).
* **`portfolio_performance_metrics.metrics`**: `compute_metrics(load_result, lenient_missing_valuations=False)` defines the measurement window (first/last valuation), validates inputs, flips flow signs where needed, and produces:
  * a `summary` DataFrame (period + annualized returns for TWR, MWR/XIRR, Dietz),
  * a `nav` DataFrame (unitization series).  
  * In **strict mode** (default), TWR/unitization require a valuation on every cashflow date;  
    **lenient mode** uses cashflow-aware constant-rate interpolation (`impute_sparse_valuations`) to fill missing valuations between known valuation "support points" (details in the Metrics docs page).
* **`portfolio_performance_metrics.cli`**: `build_parser()` + `main()` expose the same pipeline as a CLI, including `--lenient-missing-valuations` and optional Excel export via `--output`.

**Typical usage (library):**

```python
from portfolio_performance_metrics.io import load_cashflows
from portfolio_performance_metrics.metrics import compute_metrics

lr = load_cashflows("cashflows.csv")
res = compute_metrics(lr, lenient_missing_valuations=False)

print(res.summary)   # TWR, MWR/XIRR, Dietz
print(res.nav.head())  # unitization series
```

**Typical usage (CLI):**
```bash
uvx --from git+https://github.com/cs224/portfolio-performance-metrics.git portfolio-performance-metrics tests/fixtures/sample_cashflows.csv
```

For deeper detail, the [online documentation](https://cs224.github.io/portfolio-performance-metrics) pages "Core", "IO", "Metrics", and "CLI" walk through each piece with the corresponding notebook-backed implementation and executable tests.

## `nbdev2` Experience Report

Overall, my `nbdev2` experience was positive. Still, I expect my second `nbdev2` project to go much faster than the first one, simply because the initial setup and mental model take some time to internalize.

If you want to start your own `nbdev2` project, I strongly recommend reading a real repository configuration in detail, not only the official tutorials. In my case, the most important files to understand were:

* `settings.ini`
* `pyproject.toml`
* `nbs/_quarto.yml`
* `Makefile`

In practice, these files define almost everything that can feel "mysterious" at first.
* `settings.ini` tells `nbdev2` how to export notebooks into a Python package, how to name modules, and where to place generated artifacts.
* `pyproject.toml` defines your Python project metadata and dependencies, which becomes especially relevant once you publish to PyPI or build documentation in CI.
* `_quarto.yml` controls how notebooks are rendered into HTML and Markdown, including extensions, math handling, and output formats.
* Finally, a `Makefile` can make your workflow explicit and repeatable, which helps when you come back to the project weeks later or when others want to reproduce your steps.

One preference of mine is to avoid globally installed command suites, including the `nbdev` commands.
Instead, I invoke the tooling via `uv run ...`, so the commands run in the project environment and use the pinned dependencies from the repository.
This makes the project more reproducible and reduces "it works on my machine" problems.

> If you use `uv`, this approach also encourages a clean separation between the system Python and the project Python.
> It becomes clearer which tools are required for development, and it is easier to share the project with others who will clone the repository and run the same commands.

I also try to keep automation explicit.
`nbdev_install_hooks` is convenient, but it can hide important steps behind Git hooks that run "in the background".
For this project, I preferred to keep the workflow in a GNU `Makefile`, with each step written out clearly.
That way, I can see exactly what happens, and I can run the individual steps in isolation when I debug something.

One surprise for me was that `nbdev_prepare` overwrote my README.
I wanted to keep a manually maintained `README.md`, so I decided not to use `nbdev_prepare`.
Instead, I run the individual commands such as `nbdev_export`, `nbdev_test`, and the documentation build steps directly in the `Makefile`.
This also matches my preference for a transparent workflow with less "magic automation".

> Conceptually, `nbdev_prepare` is designed as an "opinionated convenience command" that orchestrates several steps and updates project files.
> That is useful when you fully adopt the default `nbdev` workflow, but it can be counterproductive if you deliberately maintain some files by hand, especially entry point documentation like `README.md`.

Another thing I noticed is that `nbdev` does not strictly enforce conventions such as "clear all notebook output cells before commit" or "execute all notebooks before publishing documentation".
Some projects handle this via hooks, CI checks, or team conventions.
In my case, I added those checks to the `Makefile` so that the behavior is consistent and visible.

I am happy with how `nbdev_proc_nbs` and `quarto render` produce both HTML and Markdown files in `_proc/_docs`.
However, it took me a while to trace several TeX math warnings to their source.
Under the hood, Quarto calls Pandoc twice, once to generate HTML and once to generate Markdown.
The warnings disappeared once I configured `commonmark: variant: +tex_math_dollars` in `_quarto.yml`.

> As a side note, if you want to install Quarto without requiring root access, have a look at [How do I install Quarto without root access?](https://nbdev.fast.ai/getting_started.html#q-why-is-nbdev-asking-for-root-access-how-do-i-install-quarto-without-root-access).

It is also worth noting that `nbdev_test` does not replace `pytest`.
Instead, it adds another testing layer next to `pytest`, with a different goal.
`pytest` remains the right place for "pure" `.py` unit tests, especially for edge cases, parametrized tests, fixtures, and fast feedback during development.
`nbdev_test`, on the other hand, is most valuable for a small number of high value notebook tests that validate the end to end story: examples that should run exactly as shown in the documentation, with outputs that stay correct over time.
In practice, it is normal and even expected to keep most tests in `pytest` and only maintain a handful of carefully chosen notebook test cases that protect the parts users will copy and paste.


I ran into a few other small issues that I do not remember anymore.
The general recommendation remains the same: read the configuration files listed above carefully and compare them with your own project setup.
That is where most practical `nbdev2` questions are answered.


## Appendix

### Reading a unitization table: performance and cashflows in one place

Here you see an example unitization table:

```text
--- Unitization (Nav/Share) ---
      date     valuation   shares  nav_per_share          flow
2025-01-01 100000.000000 1.000000  100000.000000      0.000000
2025-03-01 112000.000000 1.098039  102000.000000 -10000.000000
2025-06-01 118000.000000 1.053403  112017.857143   5000.000000
2025-09-01 125000.000000 1.125431  111068.553269  -8000.000000
2025-12-31 137500.000000 1.125431  122175.408596      0.000000
```

A unitization table is easiest to understand if you read it as if your portfolio were a small fund.

* `nav_per_share` is the "price per unit", often called NAV per share.
* `shares` is how many units exist, sometimes called shares outstanding.
* `valuation` is the total portfolio value. In a consistent unitization table, it is always the product `shares * nav_per_share`.
* `flow` is the external cashflow in your investor sign convention, where deposits are negative and withdrawals are positive.

The key idea is simple: **cashflows change the number of shares, not the NAV per share**. NAV per share is reserved for market performance. Shares are reserved for investor cashflows.

**What NAV per share tells you (the performance story)**:  
NAV per share behaves like an index level. If you want the return of one period, you look at the ratio of NAV per share values between two rows:

$$
r_{\text{period}} = \frac{\text{NAV/share}_{t_1}}{\text{NAV/share}_{t_0}} - 1
$$

This gives you the performance of the strategy for that period, without being distorted by deposits and withdrawals.

For the example table above, the period returns from NAV per share are:

* From **2025-01-01 to 2025-03-01**:  
  (102000 / 100000 - 1 = 0.02), so **+2.00 percent**

* From **2025-03-01 to 2025-06-01**:  
  (112017.857143 / 102000 - 1 $\approx$ 0.098214), so **about +9.82 percent**

* From **2025-06-01 to 2025-09-01**:  
  (111068.553269 / 112017.857143 - 1 $\approx$ -0.008470), so **about minus 0.85 percent**

* From **2025-09-01 to 2025-12-31**:  
  (122175.408596 / 111068.553269 - 1 $\approx$ 0.10), so **+10.00 percent**

If you chain these period returns, you get the full time weighted performance. In this example you can read it directly from the start and end NAV per share:

$$
TWR = \frac{122175.408596}{100000} - 1 \approx 0.221754
$$

So the strategy produced **about +22.18 percent** time weighted return over the whole period.

> This is the practical reason why unitization is popular in fund accounting and managed accounts. Once you have a NAV per share series, you can compute performance for any sub period by taking a ratio.
> You no longer need to rerun a full TWR calculation for every reporting window, because the NAV per share series already contains the time weighted performance information.


**What shares tells you (the cashflow and exposure story)**:  
The `shares` column tells you how the **size of your exposure** changed due to cashflows. In unitization, cashflows are implemented as buying or selling shares at the current NAV per share.

A deposit means you buy additional shares. A withdrawal means you sell shares. This is exactly the part that connects to the investor experience, because it tells you how much of the strategy you owned during each period.

Let us interpret your rows:

* **2025-01-01**  
  You start with 1.000000 shares at NAV per share 100,000.  
  Total value is (1.0 $\times$ 100000 = 100000).

* **2025-03-01, flow = -10,000 (a deposit)**  
  A deposit is negative in investor view, so you buy shares.  
  Shares increase from 1.000000 to 1.098039, an increase of 0.098039 shares.

  The table tells you the implied purchase price. At this date the NAV per share is 102,000, so the deposit buys:  
  (10000 / 102000 $\approx$ 0.098039) shares. This matches exactly.

* **2025-06-01, flow = +5,000 (a withdrawal)**  
  A withdrawal is positive in investor view, so you sell shares.  
  Shares decrease from 1.098039 to 1.053403, a decrease of about 0.044636 shares.  

  The intuition is important here. The NAV per share is now higher, about 112,017.86, so you need to sell fewer shares to withdraw the same cash amount:  
  (5000 / 112017.857143 $\approx$ 0.0446).

* **2025-09-01, flow = -8,000 (a deposit)**  
  Another deposit buys shares. Shares increase from 1.053403 to 1.125431, an increase of about 0.072028 shares.

* **2025-12-31, flow = 0**  
  No external cashflow. Shares stay constant. Only NAV per share changes.

So the shares column answers a very practical question: "How much of this strategy did I own over time?"

**Why unitization helps you understand the difference between TWR and MWR**:  
With unitization, the final portfolio value is clearly the product of two effects:

1. **Performance effect:** NAV per share goes up and down. This is the strategy performance and corresponds to the manager perspective.

2. **Sizing effect:** shares go up and down. This reflects deposits and withdrawals and therefore your changing exposure to the strategy.

MWR, computed via XIRR, uses both effects implicitly. It looks at your cashflows and your final value, and it finds the single annualized rate that makes that cashflow history consistent.

This is why MWR can differ from TWR:

* If you held many shares during periods when NAV per share increased strongly, your MWR tends to be higher than TWR.
* If you held fewer shares during the good periods, or you deposited right before a bad period, your MWR tends to be lower than TWR.

Unitization makes this intuitive because you can see, in one place, both the "price series" (NAV per share) and the "position size" (shares).

A simple rule of thumb that often helps is:

* "NAV per share tells me how well the strategy did."
* "Shares tell me how much of the strategy I owned over time."
* "My portfolio value is shares times NAV per share, so my outcome is a mix of both."

### `nbdev2` Copier Template

I've created a [`nbdev2` Copier Template](https://github.com/cs224/nbdev2-cli-template).
Look a the `README.md` and `smoke_test.sh` script to see how to use it.

```bash
bash nbdev2-cli-template/smoke_test.sh
```
