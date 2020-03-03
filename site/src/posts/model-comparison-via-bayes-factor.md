---
layout: "layouts/post.njk"
title: "Model Comparison via Bayes Factor"
description: "Especially for unsupervised learning use-cases model comparison via bayes factor helps you select the best model."
creationdate: 2020-03-03T10:52:04+02:00
date: 2020-03-03T10:52:04+02:00
keywords: machine-learning, artificial-intelligence, data-science, model-comparison, model-selection
tags: ['post']
# eleventyExcludeFromCollections: true
---

{# 
https://pianomanfrazier.com/post/lilypond-in-markdown/
https://www.samroelants.com/blog/configuring-a-blog-with-eleventy/ 
#}

## Rational

If you have a use-case that involves supervised training then methods like cross-validation help you to decide which model works best for your data.
But if you have to deal with unsupervised learning use-cases (like density estimation or similar) then a technique like comparing the bayes factor for different models
may help you to select the "best" model.

While the technique is in principle simple seeing a few examples may help you to get started.

## Coin flip example

The first time I learned about model comparison and the bayes factor was when reading 
[Doing Bayesian Data Analysis: A Tutorial with R, JAGS, and Stan](https://www.amazon.de/Doing-Bayesian-Data-Analysis-Tutorial/dp/0124058884) chapter 10 
"Model Comparison and Hierarchical Modeling". Therefore the example I'd like to start with is the example used in the book in chapter 10.2 "Two Factories of Coins" (p. 268).
You can find the full details of the example in the book, but just quickly: imagine that there are two different factories of coins, 
the first one producing tail-biased coins and the second one producing head-biased coins. We model the tail-biased coin factory as having a tail-bias 
distribution $\theta\sim\mathrm{beta}(\theta\,|\,\omega_1(\kappa-2)+1,(1-\omega_1)(\kappa-2)+1)$ with $\omega_1=0.25, \kappa=12$ and then sampling from a
[bernoulli-distribution](https://en.wikipedia.org/wiki/Bernoulli_distribution) with $p=\theta$. Similarly we model the head-biased coin factory 
via $\theta\sim\mathrm{beta}(\theta\,|\,\omega_2(\kappa-2)+1,(1-\omega_2)(\kappa-2)+1)$ with $\omega_2=0.75, \kappa=12$. Don't worry if you're not fluent in math, we
do the calculations below in `numpy`. Important is that the book solution gives as values to compare against.
