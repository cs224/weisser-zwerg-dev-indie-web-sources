---
layout: "layouts/post-with-toc.njk"
title: "Series: Monte Carlo Methods"
description: "A series about Monte Carlo methods and generating samples from probability distributions."
creationdate: 2021-09-10T10:45:00+02:00
date: 2021-09-10T10:45:00+02:00
keywords: monte-carlo,sampling,statistics,importance-sampling,markow-chain-monte-carlo,sequential-monte-carlo,particle-filtering,bayesian-statistical-methods
tags: ['post']
# eleventyExcludeFromCollections: true
---

This is a series about [Monte Carlo](https://en.wikipedia.org/wiki/Monte_Carlo_method) methods and sampling from [statistical
models](https://en.wikipedia.org/wiki/Statistical_model). For a long time I avoided "stepping down" into the "cellar" of [Bayesian
statistics](https://en.wikipedia.org/wiki/Bayesian_statistics) and tried to stay at high level tools like [Stan](https://mc-stan.org/) or
[PyMC3](https://docs.pymc.io/) until I realized that (too) often I needed a finer grained approach.

The purpose of this blog post series is to give you a working understanding of fine-grained composable abstractions
([FCA](https://web.archive.org/web/20130117175652/http://blog.getprismatic.com/blog/2012/4/5/software-engineering-at-prismatic.html)) that you can use
to build adapted solutions for your problems. Along the way you might also develop a deeper understanding of statistical modelling. At least I benefited
a lot from the deeper understanding you gain from implementing the whole process end-to-end.

In principle there are only 2 core building blocks for Monte Carlo simulation:

* [Importance Sampling](https://en.wikipedia.org/wiki/Importance_sampling) and its variations / synonyms like Sequential Importance Sampling (SIS), Sequential Monte Carlo (SMC), Particle Filters, ...
* [Markov chain Monte Carlo (MCMC)](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo) and its variations like Metropolis-Hastings (MH), Hamiltonian (or Hybrid) Monte Carlo (HMC, NUTS), Gibbs sampling, ...


## Blog Posts

* [Monte Carlo: Fundamental Concepts](../monte-carlo-fundamental-concepts)
* ... more to be published soon ...


## Further Reading

For a general overview of the [Bayesian](https://en.wikipedia.org/wiki/Bayesian_statistics) approach to statistics I recommend the following books:
* 2014: [Doing Bayesian Data Analysis](https://www.amazon.com/-/de/dp/0124058884/): A Tutorial with R, JAGS, and Stan by [John Kruschke](http://doingbayesiandataanalysis.blogspot.com/)
* 2020: [Statistical Rethinking](https://www.amazon.com/-/de/dp/036713991X): A Bayesian Course with Examples in R and STAN by [Richard McElreath](https://elevanth.org/blog/)


For a text book with a clear and comprehensive presentation of Monte Carlo / simulation methods I'd suggest to start with:
* 2020: [Machine Learning: A Bayesian and Optimization Perspective](https://www.amazon.com/-/de/dp/0128188030) by [Sergios
  Theodoridis](https://sergiostheodoridis.wordpress.com/).<br>The author is very careful and diligent with notation and gives good algorithm
  descriptions as pseudo code.


The following two books are more specialized on Importance Sampling / Sequential Monte Carlo and Markov Chain Monte Carlo respectively:
* 2001: [Sequential Monte Carlo Methods in Practice](https://www.amazon.com/-/de/dp-0387951466/dp/0387951466/) by Arnaud Doucet, Nando de Freitas, Neil Gordon
* 2011: [Handbook of Markov Chain Monte Carlo](https://www.amazon.com/-/de/dp-B008GXJVF8/dp/B008GXJVF8/) by Steve Brooks, Andrew Gelman, Galin Jones, Xiao-Li Meng


I also regularly encounter pointers to the following book, but did not read it myself yet:
* 2004: [Monte Carlo Statistical Methods](https://www.amazon.com/-/de/dp/0387212396/) by Christian Robert, George Casella

I put the publishing year in front of the above references, because this is a fast-moving field and while the underlying core principles remain the
same the state-of-the-art is evolving.
