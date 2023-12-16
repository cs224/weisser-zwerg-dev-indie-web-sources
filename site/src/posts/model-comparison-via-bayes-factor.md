---
layout: "layouts/post.njk"
title: "Model Comparison via Bayes Factor"
description: "Especially for unsupervised learning use-cases model comparison via bayes factor helps you select the best model."
creationdate: 2020-03-07T06:52:04+02:00
date: 2020-03-07T06:52:04+02:00
keywords: machine-learning, artificial-intelligence, data-science, model-comparison, model-selection
tags: ['post']
# eleventyExcludeFromCollections: true
---

{# 
https://pianomanfrazier.com/post/lilypond-in-markdown/
https://www.samroelants.com/blog/configuring-a-blog-with-eleventy/ 
#}

## Rationale

If you have a use-case that involves supervised training then methods like cross-validation help you to decide which model works best for your data.
But if you have to deal with unsupervised learning use-cases (like density estimation or similar) then a technique like comparing the bayes factor for different models
may help you to select the "best" model.

While the technique is in principle simple seeing a few examples in code may help you to get started.

## Notation / Level of Detail

In my opinion notation is important. My very personal, subjective feeling is that notation of probability theory is lacking[^lacking-notation]. Often I only understand what the math equations
want to tell me when reading the surrounding text. Good math notation would not require the surrounding text, but only the math equations.  

That is why I decided to be very explicit and "slow" in my explanation of the topic below. Seeing code also may help a lot.

## Code

You can find the associated  code on [github](https://github.com/cs224/model-comparison-via-bayes-factor) or you browse directly the 
[model-comparison-via-bayes-factor.ipynb](https://nbviewer.jupyter.org/github/cs224/model-comparison-via-bayes-factor/blob/master/model-comparison-via-bayes-factor.ipynb?flush_cache=true)
jupyter notebook.

## Coin flip example

The first time I learned about model comparison and the bayes factor was when I read 
[Doing Bayesian Data Analysis: A Tutorial with R, JAGS, and Stan](https://www.amazon.de/Doing-Bayesian-Data-Analysis-Tutorial/dp/0124058884) chapter 10 
"Model Comparison and Hierarchical Modeling". Therefore, the example I'd like to start with is the example used in the book in chapter 10.2 "Two Factories of Coins" (p. 268).
You can find the full details of the example in the book, but just quickly: imagine that there are two different factories of coins, 
the first one producing tail-biased coins and the second one producing head-biased coins. We model the tail-biased coin factory as having a tail-bias 
distribution $\theta\sim\mathrm{beta}(\theta\,|\,\omega_1(\kappa-2)+1,(1-\omega_1)(\kappa-2)+1)$ with $\omega_1=0.25, \kappa=12$ and then sampling from a
[bernoulli-distribution](https://en.wikipedia.org/wiki/Bernoulli_distribution) with $p=\theta$. Similarly we model the head-biased coin factory 
via $\theta\sim\mathrm{beta}(\theta\,|\,\omega_2(\kappa-2)+1,(1-\omega_2)(\kappa-2)+1)$ with $\omega_2=0.75, \kappa=12$. Don't worry if you're not fluent in math, we
do the calculations below in `numpy`. Important is that the book solution gives us values to compare against.

The full model is therefore: 
$$\begin{array}{lcl}
p&\sim&\mathrm{beta}(a_{1/2},b_{1/2})\\
X&\sim&\mathrm{bernoulli}(p)
\end{array}$$
where
$$\begin{array}{lcl}
a_{1/2}&=&\omega_{1/2}(\kappa-2)+1\\
b_{1/2}&=&(1-\omega_{1/2})(\kappa-2)+1
\end{array}$$

Model comparison then works by comparing the value of the likelihood function for the given data after integrating out all model parameters. The likelihood function is the
model probability distribution function seen as a function of the parameters $\theta$ (be aware that $\theta$ stands for a group/set of parameters) and not seen as a function
of the data. 

Let's do this slowly. Let's first construct the probability distribution:
$$
\mathrm{Pr}(X=H/T,p=\theta)=\mathrm{Pr}(X=H/T\,|\,p=\theta)\mathrm{Pr}(\theta)=\mathrm{bernoulli}(X=H/T\,|\,p)\cdot\mathrm{beta}(a,b)
$$
The first probability distribution $\mathrm{Pr}$ on the very left is a joint probability distribution of the data $X$ (which can take on the values $H$ (head) or $T$ (tail)) and the model parameters
(here only one parameter $p$). As you do not know $p$ for sure you have to split that joint probability distribution in a part that gives you the probability of the data under 
the assumption that you know the parameter(s) (this is a conditional probability distribution written as $\mathrm{Pr}(...\,|\,...)$) and the so called prior distribution for 
the parameter(s), in our case $\mathrm{Pr}(\theta)$. In our case the parameter $p$ has to be in the interval between 0 and 1: $p\in[0,1]$. A probability distribution that
ensures that the sampled values are continuous and fall into the interval between 0 and 1 is the [$\mathrm{beta}$](https://en.wikipedia.org/wiki/Beta_distribution) distribution. The $\mathrm{beta}$ distribution is for $\mathrm{beta}(a=1,b=1)$ flat, e.g.
$\mathrm{beta}(a=1,b=1)$ might be an adequate choice for the prior if you'd say "I have no clue, whatsoever, what $p$ might be" (a flat distribution would give every value of 
$p$ the same prior probability). In our case, the example says, we have some clue and expect for example for the tail-biased factory $p$ to be distributed around $0.25$ with a 
breadth given by the [concentration parameter](https://en.wikipedia.org/wiki/Beta_distribution#Mode_and_concentration) $\kappa$.

The above is the probability distribution for one data-point. Now in our example, as given by the book, we have 9 data-points and it says that we have 6 heads and 3 tails, 
e.g. $[T,T,T,H,H,H,H,H,H]$ (or some permutation thereof). In addition we assume that each data-point is independent from the other data-points. This is called an i.i.d. 
([independent and identically distributed](https://en.wikipedia.org/wiki/Independent_and_identically_distributed_random_variables)) random variable. For i.i.d. random variables
the overall probability distribution is given by taking the prior and multiplying it with the conditional probability distribution once for each data-point. In math this is:
$$
\mathrm{Pr}(X_1=H/T,X_2=H/T,X_3=H/T,X_4=H/T,X_5=H/T,X_6=H/T,X_7=H/T,X_8=H/T,X_9=H/T,p=\theta)=
$$
$$
\mathrm{Pr}(\theta)\prod_{i=1}^9\mathrm{Pr}(X_i=H/T\,|\,p=\theta)
$$


Model comparison now uses the idea to compare the probability of the data under the model $\mathrm{Pr}(D\,|\,M)$. This boils down to integrating out the parameters that belong
to the model to obtain a single probability value for the model $p_M$:
 
$$p_M=\int L(D,\theta)\mathrm{d}\theta=\int\mathrm{Pr}(D,\theta)\mathrm{d}\theta$$

Let's see this in action via python code:

```python
# Flip coin 9 times and get 6 heads
samples = np.array([0,0,0,1,1,1,1,1,1])

def fn(a, b):
    return lambda p: stats.bernoulli(p).pmf(samples).prod() * stats.beta(a,b).pdf(p)

scipy.integrate.quad(fn(a,b),0.0,1.0)
```

As the [scipy.stats](https://docs.scipy.org/doc/scipy/reference/stats.html) probability distribution functions (like bernoulli or beta) are functions of the data 
and not of the parameters we have to make the detour of first creating a function `fn` that returns a function of the parameter `p`. If we call `fn(a,b)` it returns
a function that takes a single argument `p` and returns the probability of the model for exactly that value of `p`. `scipy.integrate.quad` then does
the job of integrating that function between the boundaries $p\in[0.0,1.0]$.

If we then look at concrete values of $p_M$ we get the following:
```python
def ok2ab(omega, kappa):
    return omega*(kappa-2)+1,(1-omega)*(kappa-2)+1

a1,b1 = ok2ab(omega1,kappa1)
a2,b2 = ok2ab(omega2,kappa2)

scipy.integrate.quad(fn(a1,b1),0.0,1.0)
> (0.0004993438720702594, 2.322913347907592e-09)

scipy.integrate.quad(fn(a2,b2),0.0,1.0)
> (0.002338556142956198, 2.1998184481120156e-11)
```
The `ok2ab` function is just a helper to convert from an $\omega,\kappa$ parametrization of the $\mathrm{beta}()$ function to the $a, b$ parametrization that
the `scipy.stats.beta` implementation of the $\mathrm{beta}()$ function requires. The value we get for the tail-biased model is $p_{M_T}=0.000499$ and the value we get for the head-biased model is $p_{M_H}=0.002339$, which
match exactly the values as given in [Doing Bayesian Data Analysis: A Tutorial with R, JAGS, and Stan](https://www.amazon.de/Doing-Bayesian-Data-Analysis-Tutorial/dp/0124058884) p.271.

The [bayes-factor](https://en.wikipedia.org/wiki/Bayes_factor) is now simply the relation between the two: $\mathrm{BF}=p_{M_H}/p_{M_T}=4.68$. The [interpretation](https://en.wikipedia.org/wiki/Bayes_factor#Interpretation)
of this value differs in [Doing Bayesian Data Analysis: A Tutorial with R, JAGS, and Stan](https://www.amazon.de/Doing-Bayesian-Data-Analysis-Tutorial/dp/0124058884) p.268 from the 
one given in wikipedia. In the book they say that a factor bigger than $3.0$ or less than $1/3$ should be taken as "substantial" evidence for or against the model. 
In wikipedia the "substantial" classification starts only at $5.0$. But in all real-world scenarios I've seen so far this factor is so huge that these "tiny" differences 
do not matter.

Just to mention it: for this simple example model there is an analytical solution to calculating $p_M$ and in the notebook this analytical solution is implemented 
via the `pD(z,N,a,b)` function (`pD` stands for "probability of the data").

## PyMC3

The above simple example was hopefully instructive enough so that we can now move quicker. Let's see how you would do model comparison via the bayes-factor method in a 
[PyMC3](https://docs.pymc.io/) model. I've simply adapted the example as given in the PyMC3 documentation: [Bayes Factors and Marginal Likelihood](https://docs.pymc.io/notebooks/Bayes_factor.html) 
(be aware that the interface seems to have changed between PyMC3 3.7 and PyMC3 3.8 and I used the newer interface).
```python
priors = ((a1, b1), (a2, b2))
models = []
traces = []
for alpha, beta in priors:
    with pm.Model() as model:
        a = pm.Beta('a', alpha, beta)
        yl = pm.Bernoulli('yl', a, observed=samples)
        trace = pm.sample_smc(4000, n_steps=100, random_seed=42)
        models.append(model)
        traces.append(trace)
models[0].marginal_likelihood
> 0.0004979784247939404
models[1].marginal_likelihood
> 0.002364542043803754
BF_smc = models[1].marginal_likelihood / models[0].marginal_likelihood
BF_smc
> 4.75
```
The [Sequential Monte Carlo](https://docs.pymc.io/notebooks/SMC2_gaussians.html) sampler as implemented in PyMC3 gives you a model property `.marginal_likelihood`. 
This property is the probability of the data given the model (what we called $\mathrm{Pr}(D\,|\,M)$ above). This is only an estimate, but quite useful and close enough
for most of my purposes.

The so called [bayesian information criterion](https://en.wikipedia.org/wiki/Bayesian_information_criterion) (BIC) is an approximation of the $\mathrm{Pr}(D\,|\,M)$.
There are other approximations like the [Akaike information criterion](https://en.wikipedia.org/wiki/Akaike_information_criterion) (AIC) that are similar.

PyMC3 implements in its [model comparison](https://docs.pymc.io/notebooks/model_comparison.html) functionality the [widely-applicable information criterion](https://en.wikipedia.org/wiki/Watanabe%E2%80%93Akaike_information_criterion) 
(WAIC). I did not read the details yet (this is on my TODO list), but for model-comparison purposes these approximations may be useful, too.

### PyMC3 log-likelihood at point-estimate

In case that you'd like to compare the log likelihood of models at a point estimate (e.g. at the point estimate of each free random variable's mean value) you can do that
via the model's `.logp()` method. As PyMC3 is transforming the free variables to facilitate the sampling process you have to take care of the transformations yourself.

Let's assume the following sample data and a model of a simple Gauß distribution:
```python
samples2 = stats.norm(loc=-3, scale=0.5).rvs(size=1000, random_state=np.random.RandomState(42))

with pm.Model() as mcmc_model:
    mcmc_model_m = pm.Uniform('mean', lower=-10., upper=10.) # , transform=None
    mcmc_model_s = pm.Uniform('s', lower=0.1, upper=5.0) # , transform=None
    mcmc_model_gs = pm.Normal('gs', mu=mcmc_model_m, sigma=mcmc_model_s, observed=samples2)

with mcmc_model:
    mcmc_model_trace = pm.sample(2000, tune=1000, init='adapt_diag')
```
We can calculate the model log-likelihood at the `point-estimate` of the underlying parameters $\mu=-3.0$ and $\sigma=0.5$ (assuming a flat [improper prior](https://en.wikipedia.org/wiki/Prior_probability#Improper_priors)) via:
```python
stats.norm(loc=-3, scale=0.5).logpdf(samples2).sum()
> -704.9307117016448
```
With PyMC3 you could do it like:
```python
mcmc_model_gs.logp({'mean_interval__': mcmc_model_m_d.transformation.forward(-3.0).eval(), 's_interval__': mcmc_model.deterministics[1].transformation.forward(0.5).eval()})
> array(-704.9307117)
```
Or if you'd like to use the proper prior:
```python
mcmc_model.logp({'mean_interval__': mcmc_model_m_d.transformation.forward(-3.0).eval(), 's_interval__': mcmc_model.deterministics[1].transformation.forward(0.5).eval()})
> array(-709.00200049)
```
As said above already: as PyMC3 is transforming the free variables to facilitate the sampling process you have to take care of the transformations yourself.

If you'd like to take the point-estimate at the estimated values of the parameters (e.g. their means), you could to it as follows:
```python
mcmc_model_gs.logp(dict([[varobj.name, mcmc_model_trace[varobj.name].mean()] for varobj in mcmc_model.free_RVs]))
> array(-704.28913595)
```

All the code is in the [notebook](https://nbviewer.jupyter.org/github/cs224/model-comparison-via-bayes-factor/blob/master/model-comparison-via-bayes-factor.ipynb?flush_cache=true) so
go there to see all the details. I just showed you the key pieces.

## More advanced use-cases

In even more advanced use-cases, like in generative deep models, the probability distributions are often only given "implicitly" as explained in [Deep Learning](https://www.amazon.de/Deep-Learning-Adaptive-Computation-Machine/dp/0262035618).
You may be able to construct an MCMC ([Markov chain Monte Carlo](https://en.wikipedia.org/wiki/Markov_chain_Monte_Carlo)) chain to draw samples from such a deep network like
for example shown in chapter 20.11 "Drawing samples from Autoencoders" in [Deep Learning](https://www.amazon.de/Deep-Learning-Adaptive-Computation-Machine/dp/0262035618). Once
you can draw samples and at least can approximate the probability distribution you can use the method as given in chapter 18.7 "Estimating the Partition Function"
in [Deep Learning](https://www.amazon.de/Deep-Learning-Adaptive-Computation-Machine/dp/0262035618) to get an estimate of the model log-likelihood via 
[importance sampling](https://en.wikipedia.org/wiki/Importance_sampling).

[^lacking-notation]: To be fair: the notation is not lacking, but it is so verbose that most people abbreviate it and then it becomes lacking. I have no proposal for an improvement, though.


