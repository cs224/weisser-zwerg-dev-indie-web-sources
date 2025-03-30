---
layout: "layouts/post-with-toc.njk"
title: "Digital Civil Rights and Privacy: Embracing Digital Integrity"
description: "Digital Integrity (Recht auf digitale Unversehrtheit) is a more comprehensive approach to what life in the digital age entails."
creationdate: 2025-03-30
keywords: digital civil rights, privacy, digital integrity
date: 2025-03-30
tags: ['post']
---

## Rationale

Through my work with the [nym mixnet](../digital-civil-rights-networking-nym-node-operator-guide) and [nymvpn](../digital-civil-rights-networking-i/#nym-mixnet%3A-nymvpn), I discovered the growing [Digital Integrity](https://www.youtube.com/watch?v=iH82h9VErH0) movement in Switzerland.  
In some Swiss cantons - like [Geneva](https://nym.com/blog/victory-in-geneva-the-right-to-digital-integrity-incorporated-into-the-constitution) - this principle has already been incorporated into constitutional law, highlighting that as our lives become more digital, our rights need to expand beyond traditional data protection.

In a 2018 statement[^nymteachdigitalintegrity], francophone data protection authorities led by the [CNIL](https://www.cnil.fr/en/home) declared:

> personal data are constituent elements of the human person, who therefore has inalienable rights over them.

The primary contribution of the "right to [digital integrity](https://en.wikipedia.org/wiki/Digital_integrity)" is that it takes a more comprehensive approach to what life in the digital age entails,
going beyond the [GDPR](https://en.wikipedia.org/wiki/General_Data_Protection_Regulation) (General Data Protection Regulation, the EU's most important data privacy law).
What is at stake is not simply data protection, but the reality that many of us live substantial parts of our lives online - and these digital lives deserve protection to safeguard our autonomy.
This autonomy implies that our digital integrity must not be violated.

> At its core, Digital Integrity emphasizes that our online actions and data deserve the same respect and legal protection as our physical selves, ensuring autonomy, privacy, and security in the digital realm.

Recent articles - such as [“Nach der Abstimmung in Genf: Was das Recht auf digitale Unversehrtheit bedeutet”](https://www.digitale-verwaltung-schweiz.ch/blog/10-was-bedeutet-das-recht-auf-digitale-unversehrtheit) - indicate that [other Swiss cantons](https://de.wikipedia.org/wiki/Recht_auf_digitale_Unversehrtheit#Schweiz) are also considering similar constitutional changes.

> <a href="https://de.wikipedia.org/wiki/Recht_auf_digitale_Unversehrtheit#/media/Datei:Schweizer_Kantonen_Karte_mit_Namen_und_Hauptstadte_(deutsch)_digitale_unversehrtheit_juli2024_de.svg" target="about:blank"><img src="https://upload.wikimedia.org/wikipedia/de/thumb/b/ba/Schweizer_Kantonen_Karte_mit_Namen_und_Hauptstadte_%28deutsch%29_digitale_unversehrtheit_juli2024_de.svg/640px-Schweizer_Kantonen_Karte_mit_Namen_und_Hauptstadte_%28deutsch%29_digitale_unversehrtheit_juli2024_de.svg.png" style="max-height: 200px"></a>  
> Von rachyandco - <a href="//de.wikipedia.org/w/index.php?title=Vorlage:Own&amp;action=edit&amp;redlink=1" class="new" title="Vorlage:Own (Seite nicht vorhanden)" target="about:blank">Vorlage:Own</a>, <a href="https://creativecommons.org/licenses/by-sa/4.0/" title="Creative Commons Namensnennung-Weitergabe unter gleichen Bedingungen" target="about:blank">CC BY-SA 4.0</a>, <a href="https://de.wikipedia.org/w/index.php?curid=13159414" target="about:blank">Link</a>

This blog post summarizes my thoughts on the right to Digital Integrity, what it means in our daily lives, and why it matters for everyone in our connected age.

## Approach

Digital Integrity can seem like a broad, abstract idea. 
Therefore, we need a systematic framework to identify the opportunities (upsides) we want to enable and the threats (downsides) we aim to protect against.

Although the connection to the concept of "Identity" might not be obvious at first, I encourage you to keep reading.
By the end of this discussion, you will gain a clear and structured view of how Digital Integrity connects to identity - helping you recognize both the advantages to seize and the risks to avoid.

## Identity

To understand my perspective on digital integrity, I need to first explore the concept of identity - or "entity-with-identity" (ewi).

> This shorthand "ewi" simply means any entity[^entityphysicalconfiguration] that can be distinguished from others, whether it's a person, an organization, or a digital node on a network[^valueofvalues].

To grasp how identity arises, it helps to start with the smallest building blocks.
When we look at the world at subatomic scales - elementary particles such as electrons, quarks, and photons - we notice that **individual identity** does not exist.
These particles are essentially indistinguishable from one another.
One electron is the same as another; they do not have any built-in identity.
Their fundamental properties (charge, mass, spin) are universal.
If you swap one electron with another, there is no discernible difference.

- We can't paint an electron green to track it through space.
- We can't pin down its exact position without disturbing its state.
- There is simply no "name tag" for an electron.

And yet, at higher levels of organization - such as molecules, cells, rivers, cats, people, or even entire ecosystems - we clearly see unique forms that are difficult to replicate perfectly.
Their intricate details make each configuration distinct from all others. **So where does this identity come from?**

Why does identity seem to vanish at the particle level but become undeniable at more complex levels?
Some philosophers have proposed "narrative" or "psychological continuity" as explanations[^narrativeorpsychologicalcontinuity]. Instead, I'll focus on ideas rooted in **physical processes and physical continuity**.

### Fungibility vs. Identity

To better understand identity, it helps to contrast it with its opposite: **fungibility** (or interchangeability).
From fully fungible objects to unique entities with their own histories, there's a continuum that includes many "in-between" cases.

* **Fungible Objects:** If you need a liter of water, any liter with the right purity and temperature will do. You don't track which specific water molecules you have because they're all effectively the same.
  * In finance, for example, cash is usually considered fungible - one dollar is as good as another.
<p></p>

* **Pseudo Fungibility:** In the real world, we often treat objects as if they were interchangeable for the sake of convenience. Consider identical screws in a hardware store or a carton of eggs. Each egg might have tiny differences - variations in shell thickness or internal composition - but for practical purposes, we overlook those details and treat them as if they're all the same.
<p></p>

- **Entities with Identity:** For complex objects - like your cat, your phone, or a crucial database - the arrangement of their internal components is so intricate that you can't simply replace them with a perfect copy. Their physical or structural makeup is so detailed that replicating it is extremely difficult, if not impossible. Once you care about a specific object's unique characteristics, that object's identity solidifies.
  * In digital contexts, "entities with identity" can also refer to user accounts, blockchains, or data sets that have irreplaceable records - like non-fungible tokens (NFTs), which represent digital assets that can't be swapped one-for-one.
<p></p>

Let's look at some examples:

* Consider a small, "throwaway" database you spun up to test a software idea.
  Initially, you might see it as fungible - interchangeable - and discardable.
  You don't bother with backups or replication.
  But over time, you store more and more critical information in it, and soon entire teams depend on it being there, always up to date. It becomes indispensable.
  Backups become huge, real-time replication is challenging, and the system can't simply be replaced with a fresh install.
  Its complexity and importance give it a distinct identity.
* Similarly, think about a house or a beloved pet. Each has a complex configuration - whether that's wood, wiring, insulation, or bones, tissues, and behaviors - that is not so easily swapped out for another.
  That complexity makes them stand out. In daily life, we assign them identity - we give the house an address and the pet a name - because these specific configurations matter to us.
  We don't treat them as casually replaceable objects, which is why we recognize them as having a unique identity.

So, one key aspect of identity is a **complex configuration** that's hard to replicate.
This applies even to digital "objects", because all digital data **always** ultimately boils down to physical storage - whether it's [flip-flops](https://en.wikipedia.org/wiki/Flip-flop_(electronics)) wired into larger [Random-Access Memory (RAM)](https://en.wikipedia.org/wiki/Random-access_memory), magnetic domains on a disk drive, optical structures on a CD, or even patterns of neuronal connections in the human brain.

But physical structure alone isn't enough. **Data by itself is inert** (it stays dormant until something interprets or executes it).
Even if you embrace concepts like [code as data](https://en.wikipedia.org/wiki/Code_as_data) (sometimes phrased as "code is data is code"), you still need an active mechanism to interpret or execute that code.
In computer science terms, this mechanism is a "[Turing machine](https://en.wikipedia.org/wiki/Turing_machine) head" - a physical process that reads and manipulates data, making it useful.

### The Role of Physical Processes

A Turing machine head is the key element of a Turing machine where "the rubber meets the road", so to say.
A Turing machine head is the place where a theoretical "tape" of data interacts with a physical reader/writer mechanism. 
The Turing machine is a fundamental model of computation.
It's considered maximally powerful in that any computable function can be carried out by some form of Turing machine.

<a href="/img/digital-civil-rights-digital-integrity-turing-machine-head.gif" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-turing-machine-head.gif" alt="Turing Machine Head" style="max-height: 200px"></a>

A system is called **Turing-complete** if it can simulate any Turing machine.
According to the Church-Turing thesis, any algorithmically describable process can be emulated by a Turing machine, underscoring its status as a universal model of computation.

What I want to emphasize here is that this maximally powerful universal model of computation - anchored by the Turing machine head - provides a solid way to conceptualize physical processes that read and manipulate data.
Thus, the Turing machine is not just a theoretical idea but also **the** practical framework for modeling any data-processing activity, digital or otherwise, within the limits of computation.

### Spatial Locality

When we combine two key ideas - (1) that identity arises from a specific, complex configuration, and (2) that all data-processing occurs via a "Turing machine head" - we arrive at a crucial conclusion: **every entity-with-identity is spatially localized and connected**.

For living beings, this is clear: each organism (from a single cell to a giant redwood) occupies a defined region in space.
Biological cells function like tiny Turing machines, exchanging chemical or electrical signals that can't cross large distances instantly and therefore must stay in relatively close proximity.
Signals are bound by physical constraints (such as diffusion rates for chemicals, or the finite speed of nerve impulses).
In other words, "reliable, timely communication" inherently implies a limit on how far apart these cells can be if they are to stay in sync.

Because no signal can exceed the speed of light, low-latency coordination in the digital world also depends on proximity.
While "dead data" (static files stored anywhere) can be easily spread across the globe without harming a system's overall integrity, "active" data needs to stay close (in network terms) to a Turing machine head (like a server's [CPU](https://en.wikipedia.org/wiki/Central_processing_unit)) for real-time operations.
Whenever we want to perform computations, respond to queries, or provide services, data chunks must interact quickly with a localized processor.
Speed-of-light constraints effectively translate "timely communication" into physical proximity.

Therefore, even systems intentionally built to be distributed - like databases, container orchestration platforms, or blockchains still rely on strong connectivity and synchronization to function as one coherent entity.
A globally dispersed server cluster must maintain frequent updates to remain one cohesive unit.
Whenever communication slows, the system risks splitting into separate parts.
The greater the distance, the harder it is to maintain high-speed back-and-forth updates without risking partitions or data inconsistencies.

Thus, from cells in biology to nodes in a database, continuous, close interaction underpins a shared identity - be it a living creature or a resilient digital system.

Ultimately, identity depends on continuous, localized interaction.
"Distributed" does not mean "disconnected".
It simply describes how numerous localized processes can weave together, through strong connectivity and synchronization, to maintain a cohesive whole: an entity with both **integrity** and **identity**.

### Naming and References

In the context of Rich Hickey's conceptual framework of values[^valueofvalues], a "value" is a timeless, immutable piece of data. A simple example is the integer `8` - my `8` is the same as your `8` because there is no way to distinguish them.

> **Further Background:**  
> To understand the difference between immutable data ("values") and entities-with-identity that have their own lifecycle and state, Rich Hickey's talk on [The Value of Values](https://www.youtube.com/watch?v=-6BsiVyC1kM) offers a deeper exploration.

When we talk about specific, complex configurations - whether they're physical objects, digital systems, or living organisms - we need a way to refer to them unambiguously.
In contrast to immutable values, an entity-with-identity (ewi) is dynamic; it occupies space and often changes over time, which makes it unique in ways a purely abstract value is not.

> In functional programming, "values" never change once created; they're like mathematical truths. An entity-with-identity, however, can undergo updates or transformations while remaining the "same" entity.
> For instance, a server that stores and processes data might evolve - software updates, hardware replacements - yet it retains its core identity in the network.

Names - or references - serve as our shortcut for pointing to these unique, identifiable configurations.
Your cat has a name, your house has a physical address, and a database is reached via a connection string.
In each case, the name is a compact label for a particular, *non-fungible* entity.  

Earlier, we established that any entity-with-identity occupies a connected spatial extent or volume.
One practical way to uniquely reference such an entity is by using a three-dimensional coordinate along with a specific moment in time.
After all, two distinct entities cannot occupy exactly the same 3D coordinates at the exact same instant.

However, this reference scheme isn't unique in the sense that multiple coordinates at a given moment in time may point to the same entity, because entities-with-identity occupy a volume and cannot be reduced to a single coordinate point.
But crucially, only one entity-with-identity can exist at any given set of 3D coordinates at any given time.

### Lifecycle Events

Lifecycle events are best illustrated by companies. 

Companies are a clear example of entities-with-identity. Their legal identity is distinct from the individuals who work there, yet they are still physically anchored in the real world.
The "3D coordinates" of a company could be its office location, the data centers that host its applications, or even the physical servers storing its financial records.
These real-world anchors illustrate how - even though a company is often viewed as an abstract "legal person" - it ultimately ties back to tangible infrastructure and people.

Just like living organisms, companies pass through key lifecycle phases that reflect changes in both their identity and physical (or digital) presence:

- **Birth (Incorporation):** A company begins its existence at a specific point in time - usually upon formal registration or chartering.
- **Mergers and Acquisitions (M&A):** Multiple companies can combine into a larger organization, or one can absorb another. This process changes corporate structures, data flows, and overall identity.
- **Spin-Offs:** A company may separate part of its operations into a new, independent entity - creating a "child" organization with its own identity and lifecycle.
- **Renaming/Rebranding:** An existing company might adopt a new name or brand identity, which can shift how it is perceived and how it manages existing contracts, digital assets, and user data.
- **Restructuring/Reorganization:** Companies often reorganize their operations or legal structure (e.g., changing from a partnership to a corporation). This can affect data governance responsibilities, internal hierarchies, and security policies.
- **Bankruptcy or Insolvency:** When a company can no longer meet its financial obligations, it might enter bankruptcy proceedings. Data - like customer information—can become an asset that is sold or transferred.
- **Relocation or Expansion:** Moving operations to a new physical site or opening new branches.
- **Death (Dissolution):** Companies may cease operations, liquidate their assets, and dissolve, ending their formal existence.

By understanding these lifecycle phases, we can better appreciate how an entity-with-identity may evolve over time.

### Time-Spatial Continuity

Having considered how physical processes and spatial localization underpin identity, we can now offer a more concise definition of an "entity-with-identity" (ewi):

> An entity-with-identity is defined by its unbroken continuity through space and time, as a coherent bundle of physical processes (i.e., Turing machine heads) closely connected to specific, complex physical configurations (e.g. data or state).

This continuity means that an entity-with-identity traces a path - sometimes called a world line - through four dimensions: the three dimensions of space plus time.
Outside of major lifecycle events (e.g., birth, death, merger, fission), it remains trackable via an uninterrupted trajectory.

A real-world entity-with-identity (such as a cat) is a 3D object in space and it exists across time, creating a kind of 4D trajectory. For example:

* At 10:00 a.m., the cat is in the kitchen.
* At 10:05 a.m., it may be on the couch.
* At 2:00 p.m. (four months later), it's still around - maybe older, maybe heavier - but we say it's "the same cat".

Even though its atoms are constantly being replaced (metabolism, shedding fur, etc.), there is no magical teleportation or spontaneous multiplication.
Instead, we can follow its 3D path through time, observing that today's cat is *physically connected* to the cat from four months ago.
That unbroken path is what we point to when we say, "Yes, it's still the same cat".

Philosophically, this ties into the famous saying by Heraclitus, "No man ever steps in the same river twice".
Both the man and the river are flowing, changing.
But, from a practical perspective, we can still talk about "the Danube River" because it retains a certain continuity, even if individual water molecules come and go.
Likewise, each one of us is a continuous, living process in time - a 4D path - so we say we remain "the same person" even though our cells are constantly replaced.

This paradox underscores that while change is constant, continuity is what sustains identity.
A river has a particular channel of flowing water molecules, and a person has a specific physical organism that evolves yet remains connected through time.
We label these entities "the same" because their unbroken chain of space-time continuity holds them together as recognizable wholes.

Hence, time-spatial continuity - the consistent linking of an entity's present state (= specific, complex physical configuration) to its past - forms the bedrock of identity, both in the physical world and in our increasingly digital environments.

## Making the Connection between Entity with Identity and Digital Integrity

In this section, I want to deliver on my promise of a systematic approach that helps us see the opportunities we want to foster and the threats we aim to defend against, all through the lens of the "right to [digital integrity](https://en.wikipedia.org/wiki/Digital_integrity)".

I'll use a few illustrations to emphasize key points. You may or may not be familiar with [Barbapapa](https://en.wikipedia.org/wiki/Barbapapa), a 1970s children's book whose title character (and "species") can morph and reshape itself, and even split into multiple copies (similar to [mitosis](https://en.wikipedia.org/wiki/Mitosis) (cell-division) in biology).

<a href="/img/digital-civil-rights-digital-integrity-barbapapa.jpg" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa.jpg" alt="Barbapapa" style="max-height: 100px"></a>
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-ii.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-ii.png" alt="Barbapapa II" style="max-height: 100px"></a>

Barbapapa's shape-shifting powers are a useful metaphor for how our "digital selves" can extend and transform in the online world.  
Now, let's look at the following illustration:

<a href="/img/digital-civil-rights-digital-integrity-barbapapa-halo.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-halo.png" alt="Barbapapa Halo" style="max-height: 100px"></a>
<p></p>

Imagine the large, central Barbapapa represents **you** as a person - a distinct, complex physical entity (a specific, complex physical configuration bundled together with your physical processes (biological cells, brain activity, ...)).
All the smaller Barbapapas radiating from your "head" symbolize **the digital (complex) configurations you create and maintain** in the online realm.  

> Barbapapas can effortlessly change form or split into multiple copies. This is a playful analogy for how a single person can "branch out" into various online services and devices while remaining one cohesive individual.

Examples of these Digital "Extensions":

1. **Configurations on Your Physical Devices**  
   - Smartphones  
   - Laptops and computers  
   - Even connected home appliances  
<p></p>

2. **Digital Accounts with Service Providers**  
   - Your phone and internet service providers  
   - Social media platforms like Facebook  
   - E-commerce sites like Amazon  
   - Cloud-based services such as Office365  
   - Banking and financial platforms  
<p></p>

Each of these systems can be viewed as an extension of your core self, much like sprouting additional arms would extend your physical abilities.
These extensions often include their own processors (CPUs or other computing units), but **you** are still the driving force: just as your brain controls your arms, you orchestrate these digital tools.

By leveraging these digital extensions, you increase your power and reach - much like an additional set of arms would increase your power and reach.

The **increase in power** comes from two main benefits:  
1. **Enhancing Your Thinking Processes**  
   Digital tools (like search engines, data analytics, or even AI-based assistants) can supercharge how you gather information and solve problems. This is similar to using an excavator instead of a shovel:  
   > Humans have historically leveraged machines to extend their abilities well beyond what their biological bodies alone can do.
<p></p>

2. **Broadening Communication**  
   Instead of being limited to your immediate surroundings, you can now connect in real time with people all over the globe. This development is remarkably modern in human history - just a few centuries ago, nearly all interactions happened face-to-face or took weeks of travel or slow correspondence.
<p></p>

What you aim for is to **open yourself to connections that benefit you** - friends, family, and professional contacts.

However, with these advantages come new vulnerabilities.
Exposing your digital "extensions" to beneficial contacts - friends, family, colleagues - makes sense.
But the same connectivity can bring you into contact with bad actors eager to exploit or deceive you.
Therefore, your other goal is to **protect yourself from those with malicious intentions**.

Hence, the "right to digital integrity" focuses on ensuring that these vital digital extensions remain protected - maintaining your autonomy, privacy, security and safety both offline and online.

### Your Digital Identities Live Under a Stranger's Roof

Most people don't realize a crucial fact about living in today's digital world: most of your online "extensions" of self exist under someone else's roof.

It's obvious that your online accounts - whether for email, social media, or e-commerce - reside on servers controlled by third parties.
But the same principle applies to your so-called "smart" devices: especially your smartphone, but also your internet-connected refrigerator, your increasingly computerized car, or even a future household robot.
You may assume you truly own these gadgets - after all, you bought them - but you rarely control or fully understand their internal workings.
Even highly technical users can't verify that a device's "smart" functions always act in their best interests.
Modern operating systems are extremely opaque and complex, making it hard to know if they're really "on your side" or on someone else's side.

> **Why Ownership Can Be an Illusion**  
> - Many "smart" devices come pre-installed with proprietary firmware or locked bootloaders, preventing you from examining their code.  
> - Even open-source components can be overshadowed by hidden hardware backdoors or vendor-supplied updates.  
> - Internet of Things (IoT) devices often send data to remote servers you have no visibility into, making it hard to confirm how your personal information is used or shared.  

I urge you to pay the same careful attention to where your digital "extensions" live as you would if your children had to live under a stranger's roof.

Look at the following illustration. It portrays how our "digital selves" fan out across various online services - figuratively living under strangers' roofs.  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" alt="Barbapapa in Houses" style="max-height: 200px"></a>

Many of these "homeowners" may be decent and well-intentioned:  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses-happy.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses-happy.png" alt="Barbapapa in Happy Home" style="max-height: 200px"></a>

But some could be malicious actors. If you could feel their cold, creeping, and calculated evil-spirited atmosphere and their hostility were obvious, you'd quickly move on.  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses-evil.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses-evil.png" alt="Barbapapa in Evil Home" style="max-height: 200px"></a>

However, true bad actors are usually skilled at deception. They often conceal their intentions behind a friendly facade so that you and your digital "extensions" stay under the impression that everything is safe:  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses-evil-very.jpg" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses-evil-very.jpg" alt="Barbapapa in very Evil Home" style="max-height: 200px"></a>

In these deceptive environments, you can't simply "pull back the curtain" because those systems are fully controlled by hostile forces - meticulously designed to hide their true nature from you.

### Company Owner Analogy

I want to present another analogy to show the care you should take when your digital "extensions" reside in environments controlled by strangers.

Imagine you're the owner of a company. Would you choose to move into a building owned and operated by your competitor, renting an open workspace with no way to lock up your confidential documents?
And no way to keep your competitor's employees from walking right behind you to watch what's on your screen?

Now, consider an even worse scenario: instead of just a competitor - who might not always be on your side - you move into an open workspace owned by a company that specializes in **corporate espionage**.
They offer low rent, cater to your convenience, and make you feel at home, but the longer you stay under their roof, the more they can exploit your activities and siphon off your intellectual property.

In practical digital terms, this is analogous to using services or devices that transmit and store your sensitive information on servers you don't control.
If these providers are untrustworthy, they can monitor your activities and data or share it with third parties.
Even if they appear friendly, there's no guarantee your information is safe without strong security measures like end-to-end encryption.

And even if you trust your current coworking space landlord, it remains a risky bet.
Next year, they could sell their business or merge with someone else, and your information may end up under new ownership you didn't bargain for.

## Digital Integrity Threat Model

Below is an overview of the main threats that I believe the digital integrity movement should safeguard against.
Recognizing these patterns is crucial for protecting our autonomy in an increasingly connected world.


1. **Denying Life-Cycle Events**  
   Even though we may wish to let certain digital identities or past incidents "die", some platforms or data processors refuse to allow information to be fully removed. This undermines the "[right to forget](https://digitalcourage.de/blog/2014/kommentar-eugh-urteil-zu-google)".  
   - Example 1: Old social media posts that cannot be deleted - ex-partners tagging you in embarrassing photos that you've repeatedly tried to remove.  
   - Example 2: Online mugshot websites that refuse to delete outdated arrest records unless you pay a fee, even if charges were dropped.  
   - Example 3: News outlets archiving minor youthful indiscretions, long after they stop being relevant or fair to display.
<p></p>


2. **Forcing Life-Cycle Events**  
   Sometimes, you have no choice but to create an online account to access essential services, effectively "giving birth" to a new digital extension of yourself in a space that you cannot fully control.  
   - Example 1: [Forced to open an account for train tickets](https://digitalcourage.de/blog/2024/vzbv-forderungspapier-umfrage-digitalzwang-oepnv) when paper tickets are phased out.  
   - Example 2: Pushing digital/electronic patient health records ([ePA](https://www.kuketz-blog.de/opt-out-widerspruch-bei-der-elektronischen-patientenakte-epa-einlegen/)) despite serious [concerns](https://www.ccc.de/de/updates/2024/ende-der-epa-experimente) about privacy and security.  
   - Example 3: Government e-services mandating an e-ID without providing a paper-based workaround - blurring the line between voluntary and [coerced digital participation](https://digitalcourage.de/blog/2023/grundrecht-analoges-leben).
<p></p>

3. **Surveillance and Observation**  
   Companies or agencies can construct a detailed "digital twin" - a psychological or behavioral model of you, like a "crash-test dummy" version of your psyche - through constant data collection.
   This "digital twin" is a profile or model of you built from data on your habits, preferences, and even emotional states. It can be used to predict or influence your behavior.
   - Example 1: The [Facebook–Cambridge Analytica data scandal](https://en.wikipedia.org/wiki/Facebook%E2%80%93Cambridge_Analytica_data_scandal), in which personal data was harvested and used to sway political choices.  
   - Example 2: Smartphone apps tracking location and usage patterns continuously, creating a precise timeline of your activities.  
   - Example 3: Retail loyalty programs combining in-store purchases with online browsing habits to build powerful behavioral profiles.
<p></p>

4. **Seduction**  
   These tactics prey on your existing cravings, encouraging you to indulge in things you already find tempting - even if you know they are harmful - like pushing you to buy more sweets or subscribe to addictive services.
   - Example 1: Being nudged to buy junk food repeatedly through food delivery apps offering "limited-time" discounts.  
   - Example 2: Video game "loot boxes" designed to tempt players into spending more real money for random rewards.  
   - Example 3: Subscription-based services bombarding you with free trials that automatically renew, luring you into long-term commitments.
<p></p>

5. **Nudging**  
   Gently pushing you to do things you do not really want to do, e.g. to share more data or adopt behaviors you did not intend, often under the claim that it is for your own good.
   - Example 1: Frequent pop-ups suggesting you enable constant location sharing to "improve your experience".  
   - Example 2: Auto-enrolled loyalty programs that require extra steps to opt out, steering you into sharing personal information.  
   - Example 3: Frequent prompts to share more personal data "to improve the experience.
<p></p>

6. **Coercion**  
   Using blackmail or the threat of disconnection to cut off your essential digital identities - like your bank accounts - to pressure you into compliance.
   - Example 1: Threatening to freeze your bank account if you do not provide additional personal data that feels intrusive.  
   - Example 2: Holding social media accounts hostage (e.g., "We will ban you permanently if you do not agree to revised terms of service").  
   - Example 3: Punitive measures in a digital ecosystem - like [Microsoft's new service agreement](https://tarnkappe.info/artikel/netzpolitik/microsofts-neuer-servicevertrag-erlaubt-totalueberwachung-aller-nutzer-280856.html), which states all user content may be reviewed. This will lead to deletions and account suspensions and there are [reports of journalists being suspended](https://reitschuster.de/post/nach-falschen-worten-im-chat-microsoft-sperrt-mich/) for language labeled "offensive" in news discussions.
<p></p>

7. **Backchannel Interference**  
   Trying to reshape your core self at a deep level - similar to brainwashing - by altering your thoughts or emotional patterns in ways you did not consent to.
   These methods can range from highly manipulative ad campaigns to more subtle forms of psychological profiling intended to erode personal autonomy.
   - Example 1: [The Integrity Initiative](https://thegrayzone.com/2018/12/17/inside-the-temple-of-covert-propaganda-the-integrity-initiative-and-the-uks-scandalous-information-war/) using clandestine tactics to manipulate public opinion.  
   - Example 2: [Der hausgemachte Desinformationsskandal](https://www.faz.net/aktuell/feuilleton/aus-dem-maschinenraum/debatte-um-gezielte-desinformation-der-britischen-regierung-15957088.html) in the UK, exposing how state-run operations can covertly shape political discourse.  
   - Example 3: Algorithmic "rabbit holes" (such as extreme content on video platforms) that can shift a user's worldview over time through highly targeted content.
<p></p>

The threats above often overlap. Surveillance powers coercion; secudion can become nudging. Recognizing that they function within a larger ecosystem of digital risks helps you guard your autonomy and safeguard your digital integrity.

**Remember:**  
> *"The cloud is just someone else's computer."*

This threat model focuses on personal digital extensions. It doesn't even cover corporate risks like industrial espionage, where businesses store their "crown jewels" on external servers.  

**Some final thoughts**:

A digital "extension" of yourself becomes more valuable the more you customize it.
That customization is synonymous to a richer specific, more complex configuration - like your smartphone with countless personal settings and apps.
Migrating to a new device, even on the same platform, can be a major hassle.

Some digital "extensions" of yourself are critical for your economic well-being.
Bank accounts are the most obvious example, but online marketplaces where you buy and sell goods, as well as professional platforms like LinkedIn, also belong in this category.
Losing access to these essential services is akin to cutting off a physical limb, leaving you feeling handicapped in your daily life.

Some of these digital services are forced upon us - like [electronic patient health records](https://www.kuketz-blog.de/opt-out-widerspruch-bei-der-elektronischen-patientenakte-epa-einlegen/).
In many healthcare systems, opting out can be cumbersome or practically impossible, raising concerns about data security and patient privacy.
Meanwhile, old-fashioned paper sometimes still works better, and caring for these *unwanted* digital extensions can feel like looking after a poorly behaved stranger's child.

Who actually benefits from this push toward digital-only solutions? Probably not you. It's worth asking whether those who profit from such moves truly have your best interests at heart.

## Opportunities We Want to Foster

We're now going to explore the opportunities that encourage people to engage in the digital realm in the first place.
By identifying these positive uses, we can design systems that are more resistant - or at least less vulnerable - to the digital integrity threats outlined earlier.

Broadly, these opportunities fall into two main categories:

1. **Enhancing Your Thinking or Information Gathering and Processing Capabilities**  
2. **Broadening Communication**, where you expose yourself to people who benefit your personal or professional life.

The lists below are by no means complete, but they offer practical examples of how digital tools and services can benefit us.

* Enhancing Your Thinking or Information Gathering and Processing Capabilities
   * Computers (Laptops, Tablets, Smartphones) with their operating systems: These devices serve as our primary interfaces to the digital world.
   * Office / Personal Information Management (Calendar, Address Book, etc.): Tools that keep track of appointments, contacts, and tasks all in one place.
   * Web Browsers: Gateways to the internet, enabling research, entertainment, and communication.
   * Home Automation: From smart thermostats to connected lighting systems - provides convenience and data analysis opportunities in your home.
   * Search Engines: Essential for research, problem-solving, and staying informed.
   * (Price) Comparison Sites:  Useful for finding deals or comparing product features.
   * Artificial Intelligence (AI), including Large Language Models: AI-driven tools can answer questions, summarize text, or even generate code.
   * Endpoint Detection and Response (EDR) / AntiVirus: Helps monitor for security threats and protect your system from viruses or malware.
   * Integrated Development Environments (IDEs): Streamline coding and debugging, boosting productivity for developers.
* Broadening Communication
   * Base Layer: Internet Service Provider / Telco: Your fundamental connection to the online world.
   * 1-to-1 Communication
      - Messengers: such as WhatsApp, Telegram, Signal, Threema, etc.
      - Email
      - Bank Accounts or Crypto Wallets: for direct financial transactions.
   * 1-to-Many Communication:
      - Bi-Directional Platforms
         * Facebook
         * Twitter
         * Marketplaces (e.g., Amazon, LinkedIn)
      - Uni-Directional Platforms
         * Professional Publishing (e.g., online newspapers)         
         * DIY Publishing (e.g., WordPress, personal blogs)  
         * Medium  
         * YouTube

By focusing on these two broad categories - enhanced cognitive capabilities and expanded communication - we can harness digital tools in ways that respect and protect our digital integrity.

## Fostering Opportunities with Digital Integrity

Now that we have an overview of the opportunities drawing people into the digital realm - and an understanding of the threats outlined in our digital integrity threat model - we can begin formulating political objectives that protect us while preserving our freedom to explore the digital world.

### Denying or Forcing Life-Cycle Events

The two main ways we can counteract the denying or forcing of life-cycle events  are:

1. Establishing a legally protected [fundamental right to an analog life](https://digitalcourage.de/blog/2023/grundrecht-analoges-leben).
1. Classifying critical digital services as *utilities* to guarantee fair access and public oversight.

#### Fundamental Right to an Analog Life

​The [fundamental right to an analog life](https://digitalcourage.de/blog/2023/grundrecht-analoges-leben) advocates for individuals to engage in society without mandatory reliance on digital technologies.
This principle asserts that essential service providers must offer non-digital avenues - such as in-person assistance, paper-based communications, or telephone support - to ensure accessibility for all, including those without digital access or proficiency.

Beyond inclusivity, maintaining analog options enhances organizational resilience.
In crises like natural disasters or cyberattacks, digital systems may falter; analog alternatives serve as critical backups, ensuring uninterrupted service delivery.
This redundancy is vital for business continuity, safeguarding operations, preserving customer trust, and ensuring compliance with regulatory standards during unforeseen disruptions. ​

#### Classifying Critical Digital Services as Utilities

Utilities such as water, electricity, and gas are generally considered essential services due to their fundamental role in ensuring public health, safety, and welfare.
Because these services are indispensable to both individual households and entire communities, they are often viewed not merely as consumer goods or conveniences but as necessary conditions for a standard quality of life.
The nature of utilities, therefore, extends beyond ordinary market transactions, since a lack of access can severely impact individual or community well-being and interests.

This recognition of utilities as critical resources underpins their different treatment in the law.
To safeguard equitable access and guarantee consistent provision, governments and regulatory bodies impose specific rules and oversight that might include rate regulations, service obligations, and monopoly protections balanced with strict accountability.
Unlike other commercial services, providers of utilities frequently operate under heightened scrutiny to prevent service interruptions, unaffordable price increases, or exploitative business practices, reflecting the broader public interest these services embody.

By that logic, digital services critical to daily life should get similar legal treatment.

### Surveillance and Observation, Seduction, Nudging, Coercion and Backchannel Interference

#### Legal Objectives

In my view, a core set of political objectives should drive the digital integrity movement:

1. **Physical Off Switches**: Require all devices with audio/video or tracking sensors to include a hardware-based "kill switch". This should cut connection at the physical level - battery included - so users can be certain their phone, computer and sensors are truly off.
1. **Extending "Inviolability or Sanctity of the Home" to Digital Spaces**: Apply the legal concept of "inviolability of the home" to digital realms. No entity (government or private) may intrude into your personal digital environment without proper legal authority.
1. **Ban on Building Detailed Psychological/Behavioral Models**: Forbid the creation of highly personalized models used to predict or influence an individual's psyche.
1. **Ban on Behavioral "Dark Arts" and Mass Manipulation**: Outlaw large-scale psychological targeting or "mass formation" techniques.

Penalize violations harshly - whether by private companies or government agencies.

Physical off-switches will be discussed in detail further down below.

##### Inviolability of the Home (Digital Edition)

The core idea behind the "inviolability" or "sanctity" of the home is that your home is a protected private space. This principle should also apply to the "homes" of your digital extensions. Here are two illustrations that visualize this concept:  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" alt="Barbapapa in Houses" style="max-height: 200px"></a>
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses-happy.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses-happy.png" alt="Barbapapa in Happy Home" style="max-height: 200px"></a>

Drawing on the English common law principle that "a man's home is his castle", we can extend its logic to digital spaces. In practice:
- No Entry Without a Warrant
- Police Must Knock and Announce
- Highest Expectation of Privacy

Translating these principles into the digital sphere defends our core autonomy.
Any attempts to access the digital homes our digital extensions inhabit - whether by service providers, law enforcement, or other authorities - should be subject to the same high legal standards and protective procedures that apply to physical property.

##### Why Banning Psychological Models Makes Dark Arts Harder

If entities can no longer build comprehensive models of your psyche, it drastically limits targeted mind manipulation.
They would have to use broader statistical approaches, which are easier for observers (including regulators) to detect and classify as harmful.
This drop in precision means fewer people end up caught in hyper-personalized campaigns before they realize what's happening - or before someone can warn them.

This increased visibility should not be underestimated.
Take a look at the [America's Digital Shield](https://americasdigitalshield.com) project and how much effort it requires to hold major social media and data corporations responsible for their actions.

##### The Threat of Cognitive Warfare

The new branch of arms called [cognitive warfare](https://www.amazon.de/-/en/Kognitive-Kriegsf%C3%BChrung-Neueste-Manipulationstechniken-Waffengattung/dp/3864894220) drives the weaponization of social sciences like cultural anthropologists, economists, psychologists, who design schemes to fight over us.
Cognitive warfare uses social sciences to fight us as if we are simply [terrain](https://en.wikipedia.org/wiki/Human_Terrain_System).

I'm convinced we can develop algorithms to detect and highlight campaigns that use these manipulative tactics.
Instead of removing the identified content, we could tag it with a detailed, machine-generated explanation of the techniques involved.
This would allow the people affected to file lawsuits for damages and hold those responsible accountable.

For obvious reasons, banning these manipulative practices is not enough on its own.
Foreign state actors or shadowy groups might ignore such bans or operate outside any enforceable jurisdiction.
Thus, personal vigilance and robust defense measures become just as crucial as legal prohibitions.

#### Tracking

Surveillance, seduction, nudging, coercion, and backchannel interference all hinge on collecting detailed data to construct a personalized "digital twin" of your psyche.
Stopping or reducing this data flow makes it much harder to manipulate you.

##### Trusting Your Own Devices

Securing your digital life starts with the devices you actually own.
The first step is to understand what data they send - and to whom.
Ideally, you'd aim at minimizing the cloud services integrated deep within your devices' systems.
When you use a dedicated cloud-based app, at least you are aware you're relying on external servers.
Far more concerning are those hidden or deeply embedded services you may never notice.

For instance, endpoint security tools like Endpoint Detection and Response (EDR) / AntiVirus can monitor your every keystroke or file operation.
While their goal is to protect you, they also introduce a powerful surveillance channel if they’re misused or compromised.

Below are just a few examples of hidden or low-visibility data flows in modern systems:
- Automatic Operating System (OS) Updates
- Autocorrection/Prediction in Virtual Keyboards
- [Microsoft's "Recall" Project](https://www.heise.de/meinung/Microsofts-Recall-laeutet-das-Ende-des-Personal-Computers-ein-9730298.html): Snapshots are taken every five seconds when the content on the screen is different from the previous snapshot. ... The PC thus becomes a totalitarian surveillance machine.
- [App Intents API](https://www.heise.de/news/App-Intents-API-So-soll-Siri-kuenftig-den-Bildschirminhalt-lesen-10007289.html): From iOS 18.2, Apple is preparing for the new "Onscreen Awareness" of the AI ​​assistance system. In the future, Siri will know what users see in order to help them.
- Biometric Identity Recognition (face, voice, etc.)
- Built-in Digital Wallets
- Location-Based Services (e.g., "Find My iPhone", "Find My Friends")

Each of these features can stream data back to vendors or third parties - potentially exposing your personal life to unknown entities.

##### Physical Camera Covers and Kill Switches

A straightforward question: Why do most laptops, tablets, and phones lack a simple hard lens cover or physical kill switch for the camera or microphone?
It would add just about 1.5 cents per unit, yet you still can't buy a device with a built-in opaque cover.
This is why it should be mandatory for devices to include a hardware switch that cuts power at the circuit level (including the battery if needed).
With hardware physically turned off, neither hackers nor hidden processes can spy on you.  

#### Freedom of Expression

Freedom of expression is the fundamental right to share your thoughts, beliefs, and opinions  whether political, religious, or personal - without fear of censorship, punishment, or social or professional backlash.
It means being able to speak your mind, create art, practice your faith, or engage in peaceful protest without worrying about being silenced, "canceled", or penalized simply because your views are unpopular or controversial.

This freedom is essential in a society where ideas can be debated openly, and individuals are not forced to conform out of fear.
Protecting freedom of expression ensures that people from all backgrounds can participate in public life without being excluded or disadvantaged for what they believe.

One straightforward way to protect freedom of expression—without fearing that you will be silenced or penalized - is to allow anonymous interaction in the digital world.
Of course, this anonymity would have to work within legal frameworks (for instance, ensuring taxes are paid and preventing violations of others' rights).
However, [Zero-Knowledge Proofs (ZKPs)](https://livebook.manning.com/book/real-world-cryptography/chapter-15/90) could enable both anonymity and support for other legal goals.

> [Zero-Knowledge Proofs (ZKPs)](https://livebook.manning.com/book/real-world-cryptography/chapter-15/90) are cryptographic techniques that allow one party to prove certain facts to another - such as age, citizenship, or identity - without revealing any underlying personal data.

Just to give a few examples:
* You might have a limit on the number of words you can send anonymously per month. In addition, you could prove (using a zero-knowledge proof) that you are a real human, over 18, and a citizen of a certain country if you want to participate in political discussions.
* You could also have a spending limit (e.g., in euros) on how much you can donate anonymously to support political parties, churches, or other organizations. Control could be placed on the receiving side - groups banned by a court order could be excluded from receiving contributions.

Although more research is required to implement these systems, they appear realistically possible.
As the saying goes, "Someone who truly wants something finds a way; someone who does not want something finds reasons".

Further aspects to keep in mind are:

1. **Importance of End-to-End Encryption**  
End-to-end encryption is crucial for preserving anonymity and free expression online. It ensures that your messages, emails, and other digital communications are only readable by the intended recipients - and not by third parties, internet service providers, or government agencies.
This layer of protection becomes even more significant when paired with zero-knowledge proofs, since the technical strength of the encryption shields user data while the proof allows for regulatory compliance.
Without end-to-end encryption, sensitive information can be intercepted, potentially leading to self-censorship or fear of being monitored, which undermines free speech and personal autonomy.

2. **Integrating Self-Sovereign Identity and Verifiable Credentials**  
Self-Sovereign Identity (SSI) systems, which use verifiable credentials, let individuals prove attributes like age or citizenship without revealing their full identity.
For example, you can show you're over 18 without sharing your birthday or other personal details, thanks to zero-knowledge proofs.
This aligns well with the idea of digital integrity: you remain in control of what information you disclose, effectively balancing freedom of expression with accountability.
When anonymity is necessary - such as whistleblowing or participating in political debates - these technologies allow you to share what's legally required while keeping your identity safe.

## Conclusion

As our lives and identities increasingly extend into the digital realm, the concept of **digital integrity** becomes more important than ever.
We have seen how identity emerges from specific, complex configurations bundled together with computational processes ("Turing machine heads"), and how those processes tether us to time-spatial continuity.
Applying this understanding to the online world creates an analogy between our physical selves and our digital extensions of our selves from social media accounts to workplace collaboration tools.

<a href="/img/digital-civil-rights-digital-integrity-barbapapa-halo.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-halo.png" alt="Barbapapa Halo" style="max-height: 100px"></a>

Through this analogy we see why our digital extensions deserve the same autonomy and protection we expect for our physical selves.

It's also critical to recognize that many of our digital identities "live under a stranger's roof.  
<a href="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" target="about:blank"><img src="/img/digital-civil-rights-digital-integrity-barbapapa-houses.png" alt="Barbapapa in Houses" style="max-height: 100px"></a><br>
In other words, our vital online accounts often reside on servers owned by companies or individuals with their own agendas.
Most people are unaware of just how much control these outside parties have.
As with entrusting your children to live under a stranger's roof, we should pay close attention to where our digital identities really "live".
Think of a company owner who sets up shop in a workspace owned by a competitor specializing in corporate espionage - clearly a poor choice.
The same principle applies to our digital selves: if the host's interests are misaligned with yours, your personal data and autonomy may very well be at risk.

We also explored the many threats that undermine **digital integrity**, from forced or denied lifecycle events (like being unable to delete data or being compelled to open new accounts) through surveillance, seduction, nudging, and even "backchannel interference".
Recognizing these dangers shows us that **digital integrity** is more than just data protection; it's about safeguarding the autonomy, agency, and well-being of our "digital selves".

To shield ourselves, we discussed robust legal principles (like the right to an analog life, or considering essential digital services as utilities) and practical safeguards (like hardware kill switches).
At the same time, we emphasized the opportunities that make the digital world so exciting: the ability to expand our thinking, our communication, and our reach in ways never before possible.

My hope is that this perspective - grounded in a systematic view of identity as rooted in physical processes and physical continuity - will prompt more focused and holistic thinking on the topic of **digital integrity**.
In a world where digital interactions have such profound personal and societal ramifications, we owe it to ourselves to become more deliberate stewards of our online presence.
By doing so, we can embrace the full potential of the digital age while remaining vigilant guardians of our autonomy, privacy, and fundamental rights.

## Footnotes

[^nymteachdigitalintegrity]: See [Digital Integrity - disrupting the personal data economy: Five years in, it is clear the GDPR is not enough](https://nym-teach.com/blog/Digital-integrity-disrupting-the-personal-data-economy.html) 
[^entityphysicalconfiguration]: We will see that an **entity** is a synonym for a (complex) physical configuration difficult or even impossible to replicate.
[^valueofvalues]: See: [The Value of Values with Rich Hickey](https://www.youtube.com/watch?v=-6BsiVyC1kM): Rich Hickey's concept of a "value" in functional programming emphasizes immutability and timelessness, which contrasts with the idea of an ever-changing entity that persists through time.
[^narrativeorpsychologicalcontinuity]: What Matters Is the Organism: If you suffer memory loss, you don't become someone else. You remain you because of the unbroken chain of your body's existence as a single, living entity.