---
layout: "layouts/post.njk"
title: "Causality, State Based vs. Operation Based Representation"
description: "Judea Pearls Causality and the do()-calculus in a state-based and an operation-based picture."
creationdate: 2020-03-18T08:57:19+02:00
date: 2020-03-18T08:57:19+02:00
keywords: causality, do-calculus, Judea Pearl, Markov-Decision-Process, MDP
tags: ['post']
# eleventyExcludeFromCollections: true
---

## Rational

I am struggling since quite some time with Judea Pearl's causality theory and his [do-calculus](https://en.wikipedia.org/wiki/Causality#Causal_calculus). His work is summarized
in the following three books (in order of publishing and in decreasing order of difficulty):
* [Causality: Models, Reasoning and Inference](https://www.amazon.com/Causality-Reasoning-Inference-Judea-Pearl/dp/052189560X)
* [Causal Inference in Statistics - A Primer](https://www.amazon.com/Causal-Inference-Statistics-Judea-Pearl/dp/1119186846)
* [The Book of Why: The New Science of Cause and Effect](https://www.amazon.com/Book-Why-Science-Cause-Effect/dp/046509760X/)

The main reason I am struggling with his representation is that his representation does not match my intuition. He uses a state-based representation, while my intuition of
causality is operation-based (I'll explain the terminology below). In a follow-up blog-post I'll go into further details about Judea Pearl's causality theory, but in this one
I'll only focus on these representational issues.

### Thinking is writing and writing is thinking / Writing is hard, because thinking is hard

The preceding sub-title and the following quote are [Leslie Lamport](https://scilogs.spektrum.de/hlf/writing-for-mathematical-clarity/)'s words:
* Writing is nature’s way of letting you know how sloppy your thinking is. 
* Mathematics is nature’s way of letting you know how sloppy your writing is. 
* Formal mathematics is nature’s way of letting you know how sloppy your mathematics is.

This blog post develops in parallel to my thinking, e.g. don't take it as the final word ...

## Operation Based vs. State Based representations

The concept of operation-based vs. state-based is quite common in computer science, but I found the best description of the topic in the papers around [Conflict-Free Replicated Data Types (CRDT)](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type).
They make a difference between Commutative Replicated Data Types (CmRDTs or Operation-Based CRDT) and Convergent Replicated Data Types (CvRDTs or State-Based CRDTs). For the
full details I suggest you read the paper [A comprehensive study of Convergent and Commutative Replicated Data Types](https://hal.inria.fr/inria-00555588/).

### State-Based Representation

In state-based representation you only track the state of an object (or the world), e.g. is-the-light-switch-on-p (this is [lisp notation](https://www.cs.cmu.edu/Groups/AI/html/cltl/clm/node69.html) 
where the -p at the end indicates a predicate) with values yes/no.

### Operation-Based Representation

In the operation-based representation you track (or often know) a starting-state and then you track the operations. Imagine a bank account that starts out with 0 credits. The
operations would be [deposit: 10], [withdraw: 5], ... and if you know all the operations then you know the state of the bank account.

Both representations are equivalent and the above mentioned paper shows how to convert from the one to the other.

## Causality Representation vs. my Intuition

My intuition of causality works in the operation based picture. You start out with a world state $W_0$, you apply an action $A$ to it and you end up with a new world state $W_1$.
$$
f: (W_0, A) \mapsto W_1
$$
There is also an implicit [happened-before](https://en.wikipedia.org/wiki/Happened-before) order (e.g. time) in the sequence of actions (at least locally, e.g. when you look at an object like the light switch).

The representation of [Markov-Decision-Processes](https://en.wikipedia.org/wiki/Markov_decision_process) (MDPs) would match my intuition quite well:<br>
<img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Markov_Decision_Process.svg/750px-Markov_Decision_Process.svg.png" width="400px" alt="Markov-Decision-Processe">
<br>You hav states (green) and actions (redish/orange). If you apply an action to a state then you have some transition probabilities to other states. The rewards part of
MDPs is irrelevant for our analysis of causality here.

But the do-calculus of Judea Pearl works "on tables" (each column represents the instantiations of a [random variable](https://en.wikipedia.org/wiki/Random_variable)) 
like in statistics, e.g. it is completely state-based. 

One typical example is the [Rain-Sprinkler-GrassWet](https://en.wikipedia.org/wiki/Bayesian_network) example:<br>
![Rain-Sprinkler-GrassWet](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/SimpleBayesNet.svg/575px-SimpleBayesNet.svg.png)
<br>You have three variables as three columns, one column `RAIN`, one column `SPRINKLER` and one column `GRASS_WET`. This representation lacks actions (like "turn the sprinkler on")
and time.  

In such simple examples like `Rain-Sprinkler-GrassWet` or `LightSwitch-Light` or `Voltage-Current` (like in [Ohm's law](https://en.wikipedia.org/wiki/Ohm%27s_law)) this is fine.
But for more difficult examples it constantly confuses me.

Imagine the example of someone throwing a `projectile` (stone, foot-ball, snow-ball, cotton-ball) and maybe hitting a `window` that then perhaps breaks. In order to work with this
example it would not be sufficient to have a column `projectile` with some value in it. You would need to store the whole trajectory in the "column" `projectile` and then assign 
to each trajectory a probability for the `window` breaking.

I cannot tell exaclty why, but for my intuition it would also make a difference if the `projectile` would be a stone or a snow-ball. In the case of a stone: 
if somebody threw the stone three weeks ago and the window broke you could at least forensically reconstruct the happenings by finding the `projectile` inside the room the window
is part of. But in the case of a snow-ball the window would break and three weeks later the snow-ball is molten and the water is evaporated, e.g. there is no trace left of the 
object that caused the window to break. This is not relevant for forward causality (from cause to effect), but it feels important for the backward reasoning from effect to
most probable cause, especially if you have "missing variables" (like the snow-ball is missing).

## Possible resolution

I am not sure if this will remain my final answer, but for the moment I've settled for [predicates](https://en.wikipedia.org/wiki/First-order_logic) like in logic. In the window example
you would introduce a column `projectile-did-hit-the-window-in-the-past-p` or similar. Once you have converted the operation-based scenario into a (kind-of) state-based picture
you can apply the do-calculus.

I still would hope for another representation more like Markov-Decision-Processes. 

## Update 2020-05-25

* [Causality for Machine Learning](https://arxiv.org/abs/1911.10500) by [Bernhard Schölkopf](https://de.wikipedia.org/wiki/Bernhard_Sch%C3%B6lkopf) is
  a great summary of the current state of affairs. I am especially grateful for sharing his insights how the concept of causality as discussed by the
  machine learning/statistics literature fits into the picture of physics.
* [Elements of Causal Inference: Foundations and Learning
  Algorithms](https://www.amazon.de/Elements-Causal-Inference-Foundations-Computation/dp/0262037319/) by [Jonas Peters](http://web.math.ku.dk/~peters/), [Dominik Janzing](https://www.is.mpg.de/~janzing), [Bernhard Schölkopf](https://de.wikipedia.org/wiki/Bernhard_Sch%C3%B6lkopf)
  is also a great resource for gaining a better understanding of the topic.
