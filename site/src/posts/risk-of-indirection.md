---
layout: "layouts/post.njk"
title: "Risk of Indirection"
description: "Risk involved in acquiring legal titles via a service provider."
creationdate: 2020-05-23T12:43:00+02:00
date: 2020-05-23T12:43:00+02:00
keywords: financial risk, legal title, fungible goods, service provider
tags: ['post']
# eleventyExcludeFromCollections: true
---

## Rational

In cases where you acquire legal titles (shares, money deposits, insurances, ...) via a financial service provider there are several risks associated
with the service provider that I feel are mostly overlooked. In this blog post I try to outline a systematic approach via which you can identify such risks
and find ways on how to mitigate those risks.

I call these risks `risks of indirection`. Most likely there exists a technical term that I am not aware of. I tried to search for these types of risks via
Google, but without success. If you know the technical term I'd be very much interested. Please let me know.

## Approach

I'll lead you through different concrete examples one-by-one to give you a feel for what I am talking about. Towards the end I'll then try to extract the
commonalities and derive a systematic approach for recognizing the involved risks plus some measures on how to mitigate them.

### Direct transactions

Imagine a direct transaction, e.g. you go into a super market and buy an apple. You get the apple and the shopkeeper gets your money.

<img src="/img/2020-05-23-risk-of-indirection/direct-transaction.jpg" alt="direct transaction">

Even in these simple direct transactions there are risks involved, e.g. your apple may be rotten and you only notice later or your money may be
counterfeit money. In this discussion I’ll not talk about those direct risks much more, but keep in mind that they always exist in addition to all the
indirect risks, we’ll look at below.

### Transactions involving legal titles

Let’s make this story a bit more indirect and let’s look at the same picture when you’re buying a house.

<img src="/img/2020-05-23-risk-of-indirection/property-transaction.jpg" alt="property transaction" width="800">

In the above picture time is flowing from left to right. On the left-hand side, the seller is registered in the land register as the owner of the
house and the buyer is in possession of the funds. While this is not mandatory in many countries (in some countries it is) the transaction becomes
safer (less risky) if an independent party (like a notary) also sets up an escrow account and the buyer transfers his funds first to this escrow
account. The notary then takes care of the changes to the land register to make the buyer the new owner of the house and after the successful
transfer of ownership rights via the land register he then transfers the funds from the escrow account to the seller.

> <span style="font-size: smaller;">The escrow account can be set-up with instructions for the bank in place so that money can only flow to either the
> buyer (in case that the transaction would need to be rolled-back) or the seller (in case the transaction goes forward as planned), but not to the
> notary. This set-up ensures that the notary cannot transfer the money to his own account.</span>


We have several new elements here:
* Land register
* Notary
* Escrow account
* Right of possession / legal title


You have more indirection here in this example than in the shop example above as you cannot take real estate into your hand and walk away with
it. You’re not exchanging the physical good any longer, but only a legal title. A legal title enables the holder of that title to use the machinery of
rule-of-law (court, police, …) to enforce his rights. Countries have set-up land registers in order to make it transparent for everyone who needs to
know who has which legal title in relationship to real estate.  In addition, not everybody is allowed to make changes to that register, but there
exist “gate-keepers” (like notaries) who oversee the correct handling of changes to the land register.

While in this example we already have more indirection, due to the fact that we don’t talk about the concrete physical thing any longer (like the
apple in the first example) this scenario is still very transparent. After the transaction you can verify that you have all the prerequisites to
enforce your rights in case you’d need to by getting an excerpt from the land register.

