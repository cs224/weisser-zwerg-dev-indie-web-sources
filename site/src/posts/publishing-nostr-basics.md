---
layout: "layouts/post-with-toc.njk"
title: "Nostr from First Principles: Protocol, Relays, and Application Galaxies"
description: "Understanding Nostr as an ecosystem"
seodescription: "A practical introduction to Nostr: identities, signed events, relays, clients, application galaxies, and its relationship to independent web publishing."
creationdate: 2026-10-25
keywords: Nostr, independent publishing, IndieWeb, decentralized social media, relays, Nostr clients, NIPs, digital identity, content syndication
date: 2026-10-25
tags: ['post']
---

## Rationale

When I started publishing on my own website, the underlying motivation was to own my work and keep control over where it lives.
Publishing should not lock you into a walled garden; it should not mean handing your work and the community you build to a platform that may change its rules, disappear, or remove access without warning.

This is closely related to the ideas of the [IndieWeb](https://indieweb.org/): publish on a domain you control, keep the canonical copy yourself, and use other services for distribution rather than making one of those services the home of your work.
The acronym [POSSE](https://indieweb.org/POSSE) captures one version of this idea: **Publish on your Own Site, Syndicate Elsewhere**.

My earlier website already experimented with parts of that model:

* [RSS feeds](https://weisser-zwerg.dev/feed/feed.xml) made publications available independently of a particular social platform.
* [Webmentions](../webmention-test/) connected separately operated websites.
* A [webring](https://xn--sr8hvo.ws/directory) and [feed directories](https://follow.it/feeds) offered forms of discovery outside search engines.
* [ActivityPub and Mastodon](../activity-pub-integration-via-fed-brid-gy2/) provided another way to announce new material and invite responses.
* [Comments](https://utteranc.es/) could be delegated to a third-party system without making that system the canonical home of the article.

These mechanisms solve different problems, but they also expose an important distinction: **publishing, discovery, and conversation are different things**.
A website can remain the authoritative location of an article while other systems help people find it, discuss it, or carry copies or excerpts of it.

Nostr is interesting in this context because it begins with a cryptographic identity, signed messages, and a collection of independently operated relays.
While each individual concept is simple enough, I found the resulting ecosystem surprisingly difficult to understand.

## Nostr Is Not a Website

The easiest way to misunderstand Nostr is to approach it as a replacement for X, Mastodon, Medium, or Substack.
Those names describe services or recognizable applications.

I suggest you start with understanding Nostr as a collection of protocol building blocks, so-called [NIPs](https://nips.nostr.com/), from which applications can be assembled.
It is the technology under the hood that powers the applications, but those applications can differ wildly and may not even remotely resemble X, Mastodon, Medium, or Substack.

Here are a few examples of things people have built on top of Nostr that have no obvious relationship to conventional publishing:

* [Lantern](https://gitworkshop.dev/fiatjaf.com/lantern), a [Hypothesis](https://web.hypothes.is/about-us) clone.
* [GitWorkshop](https://gitworkshop.dev/about), which looks and feels like GitHub or GitLab but uses an independent protocol on top of a normal Git Smart HTTP server.
* [White Noise](https://www.whitenoise.chat/), a private messenger.

At its simplest, the Nostr model consists of four parts:

1. **A key pair identifies the author.** The private key signs messages; the corresponding public key identifies who signed them.
    * See, for example, [Create your Nostr account](https://start.nostr.net/).
2. **An event carries content and metadata.** A short note, profile, relay list, follow list, long-form article, reaction, or repository announcement can all be represented as different kinds of signed events.
    * See, for example, the Nostr [NIP specifications](https://nips.nostr.com/).
3. **Relays receive and serve events.** They are comparatively simple network services. A publisher may send the same event to several relays, and a reader may query several relays.
    * See, for example, [nostr.watch](https://nostr.watch/relays) or [Nostr Relays](https://nostr.co.uk/relays/).
4. **Clients turn those events into an application.** They decide which relays to contact, which event kinds to understand, how to construct a feed, and what to show or hide.
    * See, for example, [Nostr Clients](https://nostr.co.uk/clients/) or [Awesome Nostr Resources](https://nostr.net/).

You create the key pair that represents your [identity](../digital-civil-rights-digital-integrity/#identity) on your local computer, and you alone control it.
You can use this same identity across all systems that use Nostr as their underlying technology.

Nostr relays and the events stored in them remind me of [Kafka](https://kafka.apache.org/), which originated at LinkedIn. Its core ideas are described in the article [The Log](https://www.linkedin.com/blog/engineering/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying).
A relay does not automatically forward every message to every other relay.
In general, there is no replication or other "smart" interaction happening between independent relays.
It is **YOUR** job as a user of the Nostr system to decide which relays to use, and different relays serve different purposes.
No one guarantees how long they will retain what you send, and relays may apply their own moderation rules.
Applications consuming data from those relays may then impose another layer of moderation.

There is no single Nostr server containing the complete network and no central application defining the one correct user experience.
Two users consulting different relay sets can therefore see different parts of Nostr, even when they use compatible clients.

This is both the source of the system's power and the source of my confusion.
It enables a large set of fine-grained, composable abstractions, but an identity is not inherently tied to a predefined user experience, and there is no single place that can promise to show you everything.

## Application Galaxies

I find it helpful to think of Nostr applications as **galaxies**.
Each galaxy develops around a particular client, use case, relay selection, and community.
The applications share a protocol and may share identities and events, but their user experiences can be very different.

Examples include:

* [Primal](https://primal.net/)- and [Damus](https://damus.io/)-style public microblogging.
* [Fevela](https://fevela.me/)- and [Coracle](https://coracle.social/)-style intentional reading and relay exploration.
* [YakiHonne](https://yakihonne.com/)- and [Habla](https://habla.nostr.info/)-style long-form publishing.
* [Olas](https://olas.app/)-style photo and visual-media publishing.
* [Zap](https://zap.stream/)-style live streaming.
* Messaging, podcasting, and other specialized areas.

This means that asking "How do I use Nostr?" is a little like asking "How do I use HTTP and HTML?"
The answer depends on what you intend to do: follow people, publish an essay, annotate an article, discuss source code, exchange private messages, or something else.

A popular client makes choices about default relays, ranking, moderation, spam filtering, presentation, and discovery.
Users gather around that experience.
The resulting community may feel like a conventional platform even though its identities and at least some of its data can be used elsewhere.

## Learning It by Foot

The best way to understand this model is not to begin with another polished application.
It is to walk through the mechanism once with a command-line tool and let you, the reader, act as the glue:

1. Create a key pair and derive its public identity.
2. Select a few relays.
3. Construct and sign a small event locally.
4. Send the exact same event to more than one relay.
5. Retrieve it again and verify its signature.
6. Open it through different clients and observe how each one presents the same underlying object.
7. Repeat the experiment with a long-form article and compare it with a short announcement.

For these experiments I will use [`nak`](https://github.com/fiatjaf/nak), a small command-line tool for working with Nostr keys, events, relays, and encoded identifiers.
The goal is not to replace convenient clients with shell commands.
It is to make the inner workings of Nostr visible before an application hides them again.

Once those pieces are visible, it becomes easier to evaluate where Nostr fits into independent publishing: not necessarily as the one permanent home of an article, but as a portable identity, a syndication mechanism, a discussion layer, and a family of possible discovery systems.
