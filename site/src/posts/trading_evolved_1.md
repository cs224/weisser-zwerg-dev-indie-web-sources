---
layout: "layouts/post-with-toc.njk"
title: "Trading Evolved: ingest CSI-Data futures data into the Quantopian Zipline pythonic algorithmic trading and backtesting environment."
description: "Andreas F. Clenow uses Futures data from CSI-Data for his trend following backtests; this blog post shows how to set-up the required environment."
creationdate: 2020-12-29T10:34:00+01:00
date: 2020-12-29T10:34:00+01:00
keywords: finance, investing, trend-following, futures, csi-data, csidata, zipline, ingest, bundle, csi_futures_data, python
tags: ['post']
# eleventyExcludeFromCollections: true
---

This blog post is part of the [Investing via Financial Futures Contracts](../series-futures-investing) series.

## Rationale

In my last blog-post [Investing: Abstract View](../investing-abstract-view) I described a high level view on trading and the possibilities you have
available for implementing your trading strategies.

Since I've read Andreas F. Clenow's books:
* [Following the Trend: Diversified Managed Futures Trading](https://www.amazon.de/-/en/Andreas-F-Clenow/dp/1118410858)
* [Trading Evolved](https://www.amazon.de/-/en/Andreas-F-Clenow/dp/109198378X)

I am sold on the idea that the only "proper" way to implement trading strategies is to use financial
[futures](https://en.wikipedia.org/wiki/Futures_contract).

The reasons are:
* Futures provide you with a single interface to a wide variety of financial assets: stocks/equities, commodities (agricultural and non-agricultural),
  interest rates (bonds) and currencies.
* Futures naturally exist as long and short. Whenever you buy a future contract somebody else sells that contract or vice versa, so they always exist
  as pairs. This means that you can easily go short on any asset for which a future exists. In stock trading this is not the case. Even, if in
  principle you are able to [short-sell](https://www.amazon.de/-/en/gp/product/0071759344) stocks, in practice exactly at the time when you'd like to
  short-sell you cannot, because nobody lends you the stocks you want to short-sell or even worse you have to get out of your short position, because
  the lender of your stock wants his stock back and he can demand that on a daily basis. Short selling is essential for some strategies like
  [pairs-trading](https://nbviewer.jupyter.org/github/quantopian/research_public/blob/master/notebooks/lectures/Introduction_to_Pairs_Trading/notebook.ipynb)
  and you do not want to be restricted in your implementation of your ideas by technical shortcomings.
* When you stay with stocks/equities the level of diversification is severely hampered. In finance this is called [correlation
  tightening](https://www.springerprofessional.de/correlation-tightening/15102122): "In falling markets, the only thing that rises is correlation."
  When you talk to banks and they propose an investment strategy to you they talk about how a well diversified portfolio can protect you from the worst
  downturns. At the same time they neglect to mention that in principle they're right, but in practice you cannot achieve diversification as long as
  you stay with stocks/equities. As soon as you switch over to the universe of exchange traded futures you have a much wider variety of products to
  trade and you actually **CAN** achieve diversification.
* Trading futures is cheaper from a transaction cost perspective. Futures typically exist in large quantities, but trading one such large quantity
  costs 2€ or less.
* When trading futures you only need a fraction of the capital you would need if you invested in stocks/equities. You only have to provide the initial
  margin, which is typically a small fraction of the nominal position value.
* ... read Andreas' books to discover more reasons ...

Of course there are also a couple of downsides to using financial futures like the fact that you have to regularly roll your positions or how they are
treated from a tax perspective in your jurisdiction, but I consider those issues to be purely technical issues that can be overcome. All in all I do
not understand why neither advisors at banks nor financial journalists advertise the advantages of futures trading much more. Everybody always only
talks about stocks and never about the extended universe you can access via futures. In case you don't plan to trade futures yourself you could make
use of [UCITS](https://en.wikipedia.org/wiki/Undertakings_for_Collective_Investment_in_Transferable_Securities_Directive_2009) funds like (just as an
example) the [Alma (Platinum) Quantica Managed Futures](https://www.almacapital.com/funds/quantica-managed-futures/) fund (or any other UCITS futures
fund) to participate in the extended universe that futures offer.

I did not want to take Andreas' word for granted on how great futures are and so I implemented the trading strategies he desribed in "Trading Evolved"
myself. Below you can find the step by step instructions to follow to create the required set-up. In a [next blog post](../trading_evolved_2) I'll
then report about the results of replicating Andreas' futures trading strategies.

**_Disclaimer: I will mention some commercial offerings just to make it easier for you to get started. I am not profiting in any way from doing so._**

### Why?

You might ask yourself why the following is relevant? Even after reading Andreas' books, which are very well written, it was still quite some effort
to assemble and compile all the relevant information to get started with [backtesting](https://www.investopedia.com/terms/b/backtesting.asp). It seems
that the naming of future contracts is not as standardized as the naming of stocks (using
[ISIN](https://en.wikipedia.org/wiki/International_Securities_Identification_Number)). It took me quite some time to find the contracts that Andreas
mentioned in his books and cross check their characteristics (like the `Full Point Value` and the corresponding `multiplier` and `minor_fx_adj` values
in zipline).

Some information sources that helped me in the context of CSI Data were the following:
* CSI Data [Factsheet](http://www.csidata.com/factsheets.php?type=commodity&format=htmltable&exchangeid=) gives you a comprehensive overview of all
  (futures) data that CSI provides.
* The [Point and Tick Values](http://www.csidata.com/?page_id=3271) definitions as given by CSI Data.

### Environments: Linux and Windows

I implemented the [backtesting](https://www.investopedia.com/terms/b/backtesting.asp) via [zipline](https://github.com/quantopian/zipline) on
Linux. In principle all of the backtesting environment is independent of the operating system, but in practice I used symbolic links in several places
of my implementation, which Windows does not support (MacOSX is fine). You would have to modify the code in those places to make the code run on
Windows, too.

To download the futures data from CSI you need a Windows machine or [VM](https://www.virtualbox.org/) available, because CSI only allows the download
of data via its rich-client `Unfair Advantage` software (see below).

## Quantopian: Zipline

Andreas uses [Quantopian: Zipline](https://github.com/quantopian/zipline) as his back testing environment for the python programming language. In
addition he suggests to use futures data from [CSI](http://www.csidata.com/). CSI describes itself as: "a low cost information vendor of summary world
financial market data." In order to make the data from CSI available to zipline you have to write a zipline `bundle`. Below I'll describe the whole
set-up process.

### Anaconda

As a first step, please install [Anaconda](https://www.anaconda.com/products/individual#Downloads). Anaconda is a package manager for python and
data-science packages.

### andreas_clenow_trading_evolved

Next clone the [andreas_clenow_trading_evolved](https://github.com/cs224/andreas_clenow_trading_evolved) github project:

    > git clone https://github.com/cs224/andreas_clenow_trading_evolved.git
    > cd andreas_clenow_trading_evolved

and use the scripts in `0000-py36zl-conda-env` to create the `py36zl` python/anaconda environment:

    > cd 0000-py36zl-conda-env
    > ./env-create.sh

You can switch into this environment via:

    > conda activate py36zl

Andreas describes in his book the steps you have to manually perform to fix a couple of minor issues in zipline for making it ready to handle futures
data. To spare you the trouble I've forked zipline from the quantopian original and have applied the changes. You can see the differences here:
[cs224:20201009-modifications](https://github.com/quantopian/zipline/compare/master...cs224:20201009-modifications)

In order to install this version of zipline make sure you've activated the `py36zl` environment as described above and then execute:

    > git clone https://github.com/cs224/zipline.git
    > cd zipline
    > git checkout 20201009-modifications
    > pip install -e .

### CSI Data

Before going into details on how to ingest data for use in zipline you have to have some data. I personally bought the [History
Only](https://csidata2.com/cgi-bin/ua_order_form_nw.pl) package (click on the "History Only" "Subscription Type") for "World Futures" for 20
years. This is 350 USD, which is not bad.

Once you have the data you have to download and instlal the [Unfair Advantage](http://www.csidata.com/?page_id=55) software package. I
suggest that you use one of the "(Software + Database)" packages. Once you have installed `Unfair Advantage` you have to download the data you want
via this application and you have to do that within 30 days. The `Unfair Advantage` software is an old Windows native application and it is damn slow!
For only 100 base symbols expect to wait something like 3 to 6 hours. For the full futures database expect 48 to 72 hours. Actually the download speed
degrades over time. It might be useful to split the symbols you want into chuncks and then download chuck by chunck. I've written to the CSI support
to report my issues and they mentioned that they're working on a new version of this software. Hopefully they release this new version soon.

Actually the `Unfair Advantage` UI is overwhelming. I only used the feature to define a portfolio by providing a space separated list of base symbols
that you can find via the CSI Data [Factsheet](http://www.csidata.com/factsheets.php?type=commodity&format=htmltable&exchangeid=) and then exported
the portfolio as a CSV. I initally tried to export as an excel file, but ran into trouble, e.g. go for the CSV/ASCII export!

The default data-format is `DNOHLCviVI`:
* D = Date
* N = Delivery Number
* O = Open
* H = High
* L = Low
* C = Close
* v = contract volume
* i = contract open interest
* V = total volume
* I = total open interest

If you want to use the `csi_futures_data` bundle that I'll introduce below you need to keep that format.

As a start I suggest you open the file `futures_markets_lookup.xlsx` and copy the symbols from the `csi_symbol` column and make a portfolio of those
symbols in the `Unfair Advantage` application. You can then download the data for those symbols. This should generate a file system hierarchy as follows:

    .
    ├── AC
    │   ├── AC_0000$_Spot.CSV
    │   ├── AC_2005M.CSV
    │   ├── AC_2005N.CSV
    │   ├── AC_2005Q.CSV
    │   ├── AC_2005U.CSV
    │   ├── AC_2005V.CSV
    │   ├── ...
    ...
    │   ├── AD_2025M.CSV
    │   └── AD_2025U.CSV
    ├── BO2
    │   ├── BO20000$.CSV
    │   ├── BO22000V.CSV
    │   ├── BO22000Z.CSV
    │   ├── BO22001F.CSV

    ...
    │   ├── YI_2024N.CSV
    │   ├── YI_2024Z.CSV
    │   └── YI_2025N.CSV
    └── YM
        ├── YM_0000$.CSV
        ├── YM_2000Z.CSV
        ├── YM_2001H.CSV
    ...

Once you have that file hierarchy you can use the `csi_futures_data` bundle to ingest that data.

### csi_futures_data bundle

Above you already cloned the [andreas_clenow_trading_evolved](https://github.com/cs224/andreas_clenow_trading_evolved) github project. In that project
you'll also find a `csi_futures_data` sub-folder. In there is a symbolic link that will point to `PATH_TO_YOUR_CSI_DATA_DIRECTORY`. As the name
suggests you have to set this link to point to the real CSI data directory.

    > cd csi_futures_data
    > rm data
    > ln -s PATH_TO_YOUR_REAL_CSI_DATA_DIRECTORY data

Make sure you've activated the zipline anaconda environment.

    > conda activate py36zl

And then execute the shell script `install_csi_futures_data.sh`.

    > ./install_csi_futures_data.sh

This shell script will install or overwrite the file `$HOME/.zipline/extension.py`. In case you use zipline only for working with the futures
described in this blog post this behaviour should be fine. If you use zipline for other purposes aswell this behaviour might not be what you want,
then just uncomment the last few lines in the script and add these lines yourself manually to the `$HOME/.zipline/extension.py` file.

In addition this script will create a symbolic link `csi_futures_data` in the `/data/bundles` subdirectory of the zipline python package.

Running the script several times should be fine if you don't mind the overwrite of `$HOME/.zipline/extension.py`.

Now you should be able to verify that the bunde was installed correctly:

    > zipline bundles

Once that is done you can start the ingest process:

    > zipline clean --bundle csi_futures_data --before `date -d "+1 days" --iso-8601`
    > zipline ingest --bundle csi_futures_data

When you ingest the data for the first time the line that cleans the old data might not be necessary, but it should also not hurt. It just makes sure
that you start with a clean slate.

The ingest process will take roughly 30 minutes and it should provide you with a visual indicator for the remaining time.

Now you should be ready to get started with zipline.

### CSI futures data cross verification

The notebook
[csi_futures_data_validate.ipynb](https://nbviewer.jupyter.org/github/cs224/andreas_clenow_trading_evolved/blob/main/csi_futures_data_validate.ipynb),
which is included in the [andreas_clenow_trading_evolved](https://github.com/cs224/andreas_clenow_trading_evolved) github project walks you through
some of the data cross validations I performed manually to verify that my understanding of the data is correct and the universe is complete
(enough) to follow Andreas' example code. This notebook can also (re-)generate the `futures_markets_lookup.xlsx` file that you used above.

In the `csi_futures_data.py` package there is also a `get_bundle_market_symbols(market)` method that will return a list of symbols that Andreas used
in `Trading Evolved` for his strategies. `market` has to be one of the following values: `['trend_following_markets', 'time_return_markets',
'counter_trend_markets' 'curve_trading_markets']`. Andreas used different future universes for the different strategies he described in `Trading
Evolved`.

### First steps with the CSI futures data in zipline

The code in the notebook
[futures_in_zipline.ipynb](https://nbviewer.jupyter.org/github/cs224/andreas_clenow_trading_evolved/blob/main/futures_in_zipline.ipynb) that is
included in the [andreas_clenow_trading_evolved](https://github.com/cs224/andreas_clenow_trading_evolved) github project should get you started with
working with the futures data you ingested into zipline.


## Other Links

* [CapTrader](https://www.captrader.com/en/) is a reseller of [Interactive Brokers
  U.K. Limited](https://www1.interactivebrokers.com/en/index.php?f=1338) (this may change after Brexit) who offers futures trading to German clients.
* [Trading Evolved](https://www.followingthetrend.com/trading-evolved/) web-site:
  * [Source Code](https://www.dropbox.com/s/tj85sufbsi820ya/Trading%20Evolved.zip?dl=0)
  * [Random Test Data](https://www.dropbox.com/s/etocgt9zgeedo22/data.zip?dl=0)
