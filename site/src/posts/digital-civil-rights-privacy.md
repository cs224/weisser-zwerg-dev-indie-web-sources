---
layout: "layouts/post-with-toc.njk"
title: "Digital Civil Rights and Privacy: An Overview (Part I)"
description: "Exploring the Landscape, Setting Goals, and Paving the Way Forward."
creationdate: 2024-11-09
keywords: digital civil rights, privacy, landscape, goals
date: 2024-11-09
tags: ['post']
---

## Rationale

Some time ago, I discovered the [Privacy Handbuch](https://www.privacy-handbuch.de/changelog.htm) (Privacy Handbook) website.
Sadly, its creator had to halt his work due to health issues in April 2024.
Since then, I've been contemplating stepping into this field and contributing my part.
This first post seeks to explore the larger landscape and establish some general objectives for future discussions.
Upcoming posts may dive deeper into specific areas within digital civil rights and privacy.

## Perspective: Comparing the Real World to the Digital World.

To comprehend our goals, we'll examine real-world scenarios and draw parallels with its digital counterpart.
If you dislike certain behaviors of individuals, businesses, organizations or government in reality, then you probably don't want similar behavior online either.

<!-- XXX Below is a visual representation outlining an overview. Further on, I will go deeper into each aspect depicted in this image for better understanding. -->

The Digital Civil Rights and Privacy topics I will discuss here fall broadly into the following areas:

1. Acting on Behalf (Identity Theft, Online Impersonation, Account Takeover Fraud): Unauthorized use of another person's identity for malicious purposes.
1. Observing / Gaining Private Data:
    1. Metadata (Stalking, Digital Surveillance, Metadata Analysis, Behavioral Tracking, Online Profiling): The collection and analysis of metadata to infer user behavior and preferences without explicit consent. Metadata may also be used to create social graphs of who knows whom or who interacts with whom.
    1. Data (Privacy of Correspondence, Communications Privacy, End-to-End Encryption, Data Confidentiality): Ensuring that messages remain confidential between sender and recipient.
1. Freedom of Expression (Censorship, Silencing, Heckler's Veto): A situation in which a party who disagrees with a speaker's message is able to unilaterally trigger events that result in the speaker being silenced.
1. Other:
    1. Property
    1. Safety
    1. Digital Legacy: Collection, management, and transfer of an individual's digital assets, such as social media accounts, emails, online subscriptions, and other digital records, after their death.
    1. Right to Forget
    1. Right to an Analogue Life / No Coercion to Digital Means

Often, you hear people discuss the threat or adversary model they want to protect against — whether it's individual hackers or more powerful entities like government actors.
These terms are crucial in conversations where experts determine what protection and countermeasures are needed based on an adversary's resources, legal power, and reach.

In this article, I aim at raising awareness about the different aspects of your digital life that you might want to protect rather than focusing solely on appropriate countermeasures for various situations.
However, I will also provide a few hints at solutions where it seems fitting in this overview discussion.
Future blog posts may delve deeper into practical ways to achieve a certain level of protection.

Whenever there's a choice to be made, I will opt to ensure your digital rights through technical means rather than solely relying on commitments given by service providers in legal documents[^sophos].

### Trade-Offs between Digital Civil Rights and Law Enforcement

I learned in school that the German government intentionally doesn't perfect its law enforcement capabilities to an extreme level[^rasterfahndung].
The reason behind this is to ensure that if a totalitarian regime ever tries to take control again, there's always room for resistance.
I have always been in favor of this argument.
Even though everything seems fine today, we never know what the world might look like a few years down the line.
We must not create a world where complete control makes resistance impossible.
A fully digital world brings us closer to that level of full control.

This situation is similar to insisting that the democratic voting process should always happen on paper because fraud on physical paper is much more difficult than fraud in purely electronic voting processes.

In many discussions about the relative value of liberty vs. safety, a quote from Benjamin Franklin is often brought up:

> Those who would give up essential liberty to purchase a little temporary safety deserve neither liberty nor safety.

Critics argue that this quote has been taken out of context and originally meant more the opposite of what it's commonly used to convey.
Nevertheless, the sentence clearly establishes a hierarchy between the values of safety and liberty - a perspective I personally believe is accurate.
Both are crucial, but when they are in conflict, the importance of maintaining freedom and the ability to resist[^widerstandsrecht] outweighs that of safety.

When people try to define the essential aspects of democracy, they often mention characteristics such as division of power, freedom of the press, rule of law, and so on.
However, I believe that Rainer Mausfeld hit the nail on its head in his book [Hybris und Nemesis](https://www.amazon.de/Hybris-Nemesis-zivisilatorischen-Abgrund-Einsichten/dp/3864894077)[^mausfeld]  when he put the protection against a concentration of power — whether it's government power or the power of rich oligarchies, industry cartels, or any other form of concentrated power — at the center of democracy.
As strengthening law enforcement always means more power to authorities, I believe that his ideas align with prioritizing liberty over safety.

Historically, the go-to arguments for limiting civil liberties and increasing government control have been terrorism and child pornography.
In both cases, it becomes evident that we are dealing with pretextual arguments when you consider how little attention is given to existing tools designed to protect from terrorist attacks or safeguard children from abuse.
If the core concerns were truly protection from terrorist threats or shielding children from harm, these instruments would be consistently and thoroughly utilized to their fullest extent.
I encourage readers to conduct their own research into the numerous failures in using such tools effectively.

To put the "weak and helpless" at the center of arguments and to bet on empathy for those (perceived) disadvantaged groups is a common theme for expanding government powers.
I recommend Thomas Sowell's 1996 book [The Vision Of The Anointed: Self-congratulation As A Basis For Social Policy](https://www.amazon.de/Vision-Anointed-Self-Congratulation-Social-Policy/dp/046508995X) for more insights into strategies used for expanding government powers and the numerous historical failures to achieve the promised results by introducing the proposed policies.

Before any new restrictions on civil liberties are proposed, evidence should be provided that existing measures have been exhausted.
Furthermore, if truly novel mechanisms and an expansion of law enforcement powers are required, I propose that success criteria should be defined prior to implementation and assessed after one or two years.
If the success criteria are not met, the extension of government power should be revoked again.

## Acting on Behalf: Unauthorized use of another person's identity for malicious purposes.

Unauthorized use of your identity can lead to serious consequences.
Think of it as someone impersonating you at a bank teller with a fake ID card to steal money from your account.
To protect yourself in the real world, we have proofs of identity that are hard to counterfeit like signatures or ID cards.

In the digital world, passwords were traditionally used for this purpose most.
However, they come with their own set of problems — like needing to remember them and ideally having a different password for every service.
This is where two-factor authentication (2FA) comes in.
The idea behind 2FA is to use at least two factors out of something you know (like a password), something you possess (like a smartphone), something you are (biometric identifiers like fingerprints), something you do (gait or walking patterns), and somewhere you are (proximity to trusted devices or networks).

I have previously discussed this topic to some degree in my blog post [Step Up Your SSH Game](../openssh-fido2-hardwarekey).
Personally, I prefer hardware solutions that are single-minded security devices combining two factors in and of themselves, e.g. you own them and need to enter a PIN or similar on those devices via an integrated touchscreen to activate them.

Additionally, I want the ability to create backups by, for example, having an on-paper copy of the device's seed phrase.
As an example of a seed phrase, people often use 12, 18, or 24 mnemonic words chosen from the [BIP 39 English](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) wordlist.

Up until now, my favorite device for proving digital identity was the [Trezor Model T](https://trezor.io/trezor-model-t).
It serves multiple purposes - a crypto wallet, a [FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) authenticator, a PGP key for several accounts, and more.
However, with new vendors and products entering the market constantly, there might be better options out there now.

Conclusion: Protecting your digital identity is crucial in this interconnected world.
Using 2FA and hardware keys are effective ways to ensure that your online presence remains secure from unauthorized access.

### The Malicious Service Provider Problem

Even after you have proven your identity to your service provider, you still need to trust that they will fulfill your wishes exactly as you requested. A malicious service provider could still cause harm to you and it would be difficult for you to prove that it was not you who caused the damage.

Possible solutions to the malicious service provider problem include:
* The service provider opensources their software, allowing independent third-party code review. However, you'd still need to trust them to run the reviewed software and not a modified version of it. A small protection here could be whistleblowers who are familiar with the inner workings of the service provider and feel compelled to act against its dishonest practices.
* The service provider is a collaborative compute effort like a blockchain, where many would need to collude against you in order to harm you fraudulently. This makes such attacks less likely but not impossible.
* You could also consider hosting an open-source version of the service yourself on your home server for added security and control over the software.

## Observing / Gaining Private Data

### Data vs. Metadata

Data refers to the actual information or payload, while metadata encompasses all the details surrounding it, like who you're sending it to, when and where you send it from, and more.

For instance, consider sending a letter. The content of your message is protected by the envelope, but aspects like its destination address, weight, size, time of year when you send it, and so on are not safeguarded.
A curious postman observing these patterns might infer personal information like the birthday based on these metadata clues like regular deliveries to a home address at a given day of the year.

Another scenario could be a conversation at a supermarket.
Even if a private investigator can't hear your discussion due to environmental noise or distance, they may still note behavioral data like shopping frequency, location, purchases, and acquaintances — this might feel intrusive and can make you feel uncomfortable.
Or replace "private investigator" with "stalker," and you get the idea.
We never know how others utilize this metadata they collect.

The key takeaway here: Metadata should be just as concerning to you as the data itself. As former head of the National Security Agency Gen. Michael Hayden reportedly [said](https://abcnews.go.com/blogs/headlines/2014/05/ex-nsa-chief-we-kill-people-based-on-metadata) that the U.S. government "kill[s] people based on metadata." 

### Protection

While the payload data itself can be safeguarded by (end-to-end) encryption, protecting metadata requires anonymity.
If there are no identifiers to link metadata with, meaningful analysis becomes impossible.

It's crucial to distinguish between anonymity and pseudonymity.
For instance, signing up for a digital service under a placeholder name or "nom de plume" might seem anonymous initially, but is not enough if you use it consistently over time.
Enough accumulated metadata can eventually reveal your identity.

This concept applies to blockchain wallets in Bitcoin transactions too.
If you interact frequently with different wallets, a social graph can be constructed.
Using cryptocurrency for purchases online where delivery details are involved could potentially reveal your identity, too.

On the other hand, if people don't have identifiers like blockchain wallet addresses or IP addresses to attach metadata to, no patterns can be analyzed.
A service provider might claim not to log or record these identifiers, but how would you know they're telling the truth?

**Fingerprinting**: From now on, I will refer to identifier collection as "fingerprinting."
Just like a fingerprint, if you only collect small partial fingerprints, it may not be enough to reveal someones identity.
But if you gather enough partial prints, it might be possible to reconstruct the full print. 
Modern fingerprinting techniques can identify users with surprising accuracy based on relatively small amounts of data collected from a variety of sources —  e.g., device settings, behavior, and network data, like the device's user agent string, screen resolution, and even mouse movement patterns.
While traditional identifiers like IP addresses or blockchain wallet addresses are useful for linking metadata, sophisticated techniques such as device fingerprinting or behavioral analysis can serve as a "bag of identifiers" and still make identification possible.

Visit the [Fingerprint](https://fingerprint.com) website and try to remain anonymous after your first visit.
You'll notice that most browsers' “incognito” mode won't work[^mullvad], and using a VPN also won't help.
The goal is to remain completely anonymous on every visit to this site.

**Relationship to 2FA**: There is a connection between fingerprinting and the factors used for two-factor authentication (2FA).
Both use identifying characteristics from the same pool of characteristics, but with 2FA you aim for maximum certainty that a given characteristic identifies an individual.
For fingerprinting, some level of probabilistic certainty suffices.
Furthermore, fingerprinting techniques can also serve positive purposes, like being employed in fraud detection and prevention.

## Freedom of Expression

Freedom of expression refers to the right of individuals to openly express their thoughts, opinions, ideas, and beliefs without undue interference, censorship, or retaliation from authorities or others.
This fundamental human right allows people to speak, write, or communicate in other ways (such as art, media, or protest) without fear of punishment or repression, within the boundaries of the law.
The principle is central to ensuring an open exchange of ideas, promoting individual autonomy, and enabling societal progress.

This freedom of expression comes in different shapes and forms.
On a very basic level you want [guarantees of the confidentiality of the spoken word](https://www.gesetze-im-internet.de/stgb/__201.html).
In the digital age, freedom of expression is no longer just about the spoken word; it extends to our online interactions as well.
This includes protecting one-to-one communication and group conversations in closed forums or chat groups.
However, there are ongoing efforts at an EU level that may compromise these protections of confidentiality.
Here are two resources that provide more information on this issue:

* [Stop Scanning Me](https://stopscanningme.eu/en)
* [Chatkontrolle Stoppen](https://chat-kontrolle.eu)

A technical way to ensure freedom of expression for one-to-one or closed group communications is by using messengers that offer end-to-end encryption.
To maintain this level of security, it's crucial to choose a messenger service that cannot be shut down or degraded by governments or other entities.
This setup not only protects your messages from being intercepted but also ensures that no one can prevent you from communicating at all.

The [Messenger-Matrix](https://www.messenger-matrix.de) provides a comprehensive review of various messaging apps and their respective privacy features.
This can help you choose the right app for your needs.
Personally, I find the [Briar](https://briarproject.org) messenger quite intriguing due to its approach to avoiding central service providers as hubs, thus reducing the risk of metadata collection.
It also offers a degree of anonymity through its integration with the [Tor Network](https://www.torproject.org).
For more in-depth information about this app, you might want to check out these talks:

* Torsten Grote: [Briar: Resilient P2P Messaging for Everyone](https://media.ccc.de/v/34c3-8937-briar)
* Nico Alt: [Diving deep into Briar at the XMPP Meetup Berlin](https://www.youtube.com/watch?v=sKuljekMzTc)

A form of one-to-many communication in the real world is distributing flyers.
The equivalent of [anonymously distributing flyers](https://en.wikipedia.org/wiki/Hans_and_Sophie_Scholl) by throwing them from high up into the air so that they scatter and land on a group of people down on the streets is posting content online anonymously — without revealing your identity — and having it discovered through search engines.

Another form of one-to-many communication is publishing online newspapers.
Here, trained journalists investigate real-world events and publish their stories to subscribers and readers of the newspaper.
As these publishers rely on income from their work for the (online) newspaper, it is crucial to ensure they can participate in financial payment systems.
Recently, there have been numerous reports about [de-banking of publishers](https://www.hintergrund.de/kurzmeldung/oppositionelle-medien-verlieren-bankkonten)[^robbraxmannewcontrol].
It remains an open question how to guarantee the continued operation of publishers in light of such threats.

But not only are those who receive money transactions at risk from de-banking actions; individuals contributing to causes they support are also monitored and may face similar repressive measures[^banktransfercontrol].

These events demonstrate that freedom of expression cannot be treated independently from other concerns, like guaranteed access to financial payment systems.
In a constitutional state, it is assumed that everything that is not prohibited is allowed, and there must not be any room for retaliative actions like de-banking from neither the authorities nor others.

## Other Areas of Digital Life

Although not as central to the topic of Digital Civil Rights and Privacy as the previously mentioned areas, there are other important aspects of digital life that deserve attention.
These may not be as immediately central, but they still play a critical role in shaping our digital rights.

One key pitfall to be aware of is the tendency to import concepts from the physical world, where they have clear meanings and long-established histories for millenia, into the digital realm.
This transfer is often accompanied by an unwarranted distortion of those concepts, expanding or altering their scope and/or meaning in ways that can lead to misinterpretations and abuses.

The practice of transferring physical-world concepts to the digital sphere isn't just an academic concern; it has real-world consequences.
For example, the concept of "privacy" in the physical world is relatively straightforward — people generally expect to have control over their personal space and information.
But when applied to digital spaces, privacy becomes murkier.
In the digital realm, the boundaries of privacy are constantly shifting, and our data is often collected, stored, and shared without our full understanding or consent.

Similarly, "ownership" is another concept that can lose its clarity online.
In the physical world, ownership typically means having control over an item and the ability to transfer or sell it.
However, in digital environments, ownership is frequently blurred, especially with intangible assets like software or digital content.

Another danger of importing physical-world concepts without considering their digital implications is the potential for overreach.
The expansion of certain concepts — such as "security" or "safety" — can justify overly restrictive measures that erode freedoms.

These distortions can have far-reaching effects, particularly when legal frameworks struggle to keep pace with technological advancements.
These gaps in legal protections often leave individuals vulnerable to exploitation.

The digital realm operates under different rules, and we must develop a better understanding of how traditional rights and protections can — and should — apply in this new space.

### Intellectual Property Rights

One area where society has gained experience for at least a couple of decades is intellectual property rights (IPR).
In the physical world, property rights are useful because if person A owns an object - say, a car - then person B cannot also own it simultaneously.
There's an exclusion principle at work: either one person can use the item or another, but not both.

This exclusion principle doesn't apply in the intellectual or digital world.
The concept of intellectual property rights predates the widespread availability of digital devices because the issue was already arising in relation to art forms like literature and music earlier on.
While there is a clear need to ensure that creators of intellectual or digital assets are compensated for their work, there's no exclusion principle at play here.
Both person A and B can read different copies of a book without affecting each other's experience.

Additionally, digital assets don't age, degrade or require ongoing maintenance like physical objects.
A digital asset can endure for decades with minimal upkeep, making it fundamentally different from physical goods, which often require care or replacement over time.

There is an old German saying[^glueck]: "Joy is the only thing that doubles when you divide (share) it."
This idea speaks to the nature of knowledge and intellectual property — sharing it can foster creativity, allows others to build upon existing ideas, and drive progress.
Just as joy is amplified when shared, so too can the value of knowledge increase when it is shared and built upon by others.

Therefore, it's not entirely clear that the same or even similar principles governing physical property should be applied to the world of intellectual property.
While intellectual property laws are crucial for compensating creators, they need to be reconsidered and adapted according to the unique characteristics of digital assets. 
The focus should shift from rigidly applying physical property principles to more flexible approaches that encourage innovation, collaboration, and access to knowledge.
Overreaching intellectual property laws can cause more harm than good, and instead of fostering societal progress, they often hinder it.

### (Psychological) Safety and Hate Speech Laws

The potential for overreach was already mentioned above as one danger of importing physical-world concepts into the non-physical world without considering their implications.

Consider, for instance, the terms "security" and "safety."
Traditionally, safety referred to the absence of physical harm.
However, today there's a growing push to broaden this definition to include emotional and psychological dimensions.
From a guarantee of absence — meaning no physical harm — we transition to a guarantee of presence — ensuring psychological well-being[^absurditysafety].
While this may seem well-intentioned, it can lead to conflicts with more fundamental principles like truth and freedom of expression.
By using such linguistic tricks, some groups in society try to justify overly restrictive measures that erode our freedoms.


The 2002 book [Software for Your Head: Core Protocols for Creating and Maintaining Shared Vision](https://www.amazon.com/Software-Your-Head-Protocols-Maintaining/dp/0201604566) by Jim and Michele McCarthy has a [chapter](https://www.scribd.com/document/38642278/Software-for-Your-Head) about this conflict on page 101 (print page number 63): "Antipattern: No Hurt Feelings":


```
PROBLEM
You don't want to hurt the feelings of your teammates, so you fail to add the value you have to the team's product.

SUPPOSED SOLUTION
If you can't find a way to tell a truth or perform an act of leadership that doesn't upset people, don't do it.

ACTUAL SOLUTION
Focus on team results, not team members' feelings.
```

The authors continue to say

> The conflict-avoidant might better be called the "resolution avoidant."  Resolution Avoidance is not a well-intentioned sensitivity but a type of neurotic cowardice.

This distortion of historically tried and tested concepts like safety to new areas resembles carefully designed linguistic artistry, used to obscure rather than enlighten.
In what follows, I will adapt a [Hayek](https://en.wikipedia.org/wiki/Friedrich_Hayek) quote originally speaking about "social justice" to the current case of how activists use the term "(psychological) safety":

> According to Hayek, "the term '(psychological) safety' is not, as most people probably feel, an innocent expression of good will towards the less fortunate," but has become in practice "a dishonest insinuation that one ought to agree to a demand of some special interest which can give no real reason for it.”<br>
> ...<br>
> The dangerous aspect is that "the concept of '(psychological) safety'... is the Trojan Horse through which totalitarianism" will enter.

And here's a link to what [Andrew Doyle](https://en.wikipedia.org/wiki/Andrew_Doyle_(comedian)) has to say about [Why We Should Abolish Hate Speech Laws](https://youtube.com/watch?v=n2uOxftwgZg).

### Digital Legacy

When it comes to physical legacy, the process is clear and inheritance laws are based on time-tested procedures.
However, for digital assets like ebooks, music, films, software licenses, or video games, we're still figuring out how best to handle them.

When you purchase a digital product like an ebook or a music track, you're often not actually buying ownership of the item but rather a limited license to use it under certain conditions.
This means that, unlike physical books or CDs, these digital goods can be revoked or restricted at any time.

There is an increasing trend of platforms requiring users to agree to terms that include provisions for account termination[^microsoft] — often with little warning or recourse — that adds another layer of insecurity to digital ownership. 
Often, in such scenarios, platforms also don't offer you the option to save or transfer your digital assets locally before you lose access to your account and there is no higher instances to appeal to, like courts.

In many cases, digital platforms have no standard process for transferring ownership of accounts or assets after the account holder's death[^tod].
This is particularly concerning when it comes to valuable digital content, such as family photos, documents, or even intellectual property.

Ideally, the laws around digital legacy should evolve in a way that grants users more autonomy and ensures that their digital property is passed on according to their wishes, just as physical property is.
Until then, it's critical for individuals to take proactive steps[^nachlass] to manage and back up their digital assets, ensuring that important information and content is preserved for the future.

### Right to Forget

I already mentioned above that digital assets do not age or decay.
This has an interesting consequence - once information is published online, it can remain accessible for a very long period of time in public memory.
In analogy to "out of sight, out of mind" from past analogue millennia, humans should continue to have the right that old mistakes get forgotten over time.


### Right to an Analogue Life

From banking to healthcare, education to government services, more aspects of daily life are being moved online, making it harder for people to engage fully without digital devices or internet access.
For whatever reason people choose to avoid digitalization and digital devices, they should have the right to participate in society with similar ease and convenience using non-digital methods.

Currently, we still have older generations among us who find it overwhelming to learn how to navigate the digital world fluently. We shouldn't exclude[^analogue] them from participating in society.

And even as we move forward, we must maintain space for those who prefer an analogue lifestyle.
Many individuals, by choice or necessity, prefer a simpler, analogue lifestyle, whether it's for reasons of privacy, personal values, or simply preference.
These individuals should not be excluded from participating in society or made to feel that they are second-class citizens because they don't embrace digital methods.

Earlier, in the section [Trade-Offs between Digital Civil Rights and Law Enforcement](#trade-offs-between-digital-civil-rights-and-law-enforcement), I discussed the dangers of creating a world where total control makes resistance impossible.
A fully digital world brings us closer to that level of full control, making the "Right to an Analogue Life" crucial as a safeguard against authoritarian tendencies.

Preserving the "Right to an Analogue Life" means creating a society that values choice and diversity of lifestyle.
It means ensuring that those who choose to avoid or limit their use of digital technologies are still able to participate in society on equal footing.
As we continue to build a digital future, we must remember the importance of maintaining options for those who want — or need — a non-digital life.

## Conclusions and Outlook

In this first part of a 2-part blog post series, I've provided a conceptual overview of Digital Civil Rights and Privacy.
In the next installment, we will explore the technical details needed to achieve our goals.

We will look at a "Bill of Materials," which outlines the essential ingredients to safeguard our Digital Civil Rights and Privacy through technological means.

Additionally, we'll examine a "Trust Dependency Tree" that illustrates how various functions or guarantees in our digital lives depend on more fundamental ones, allowing us to progress towards a trusted setup step by step .

We will also discuss key services that can be consumed privately without unintentionally revealing information about ourselves, such as news, messaging, publishing, e-commerce, and financial services, among others.

<!-- 

### Key Services

* News
* One-to-One Messaging
* One-to-Many Messaging / Publishing
* Many-to-Many Messaging / Organizing Interest Groups
* Financial Services / Banking
* E-Commerce / Shopping

### Trust Tree / Bill of Materials

* Hardware
* Software
* Networking Service Providers (ISP, DNS, ...)
* Other Service Providers

-->

### Organizations and Individuals protecting your Digital Civil Rights and Privacy

And finally, here is a brief, incomplete list of organizations and individuals working to safeguard your digital civil rights and privacy:

* [European Digital Rights (EDRi)](https://edri.org)
* [Digitalcourage e. V.](https://digitalcourage.de)
* [Kuketz IT-Security](https://www.kuketz-blog.de)
* [Privacy Handbuch](https://www.privacy-handbuch.de)
* [Privacy Guides](https://www.privacyguides.org/en)
* [UNREDACTED](https://unredacted.org)
* [Reclaim The Net](https://reclaimthenet.org)


## Footnotes

[^rasterfahndung]: The German term here is [Rasterfahndung](https://de.wikipedia.org/wiki/Rasterfahndung).
[^widerstandsrecht]: [Widerstandsrecht](https://www.gesetze-im-internet.de/gg/art_20.html): According to Article 20(4) of Germany's constitution, this principle ensures that citizens have the right to resist.
[^mausfeld]: Here is a talk of Rainer Mausfeld: [ÖDP-Vortrag // Prof. Dr. Rainer Mausfeld: Demokratie am Abgrund?](https://youtu.be/AHR9WJCj3qU).
[^mullvad]: The [Mullvad Browser](https://mullvad.net/en/browser) is only available for computers, not mobile devices. However, if you're using a computer, I recommend it as it's derived from the Tor browser but without the Tor network capabilities.
[^banktransfercontrol]: There have been reports in Germany of [banks blocking bank transfers](https://www.welt.de/vermischtes/article250083610/Spende-an-AfD-Sparkasse-wollte-Kunden-Ueberweisung-verweigern.html) based solely on moral grounds with no legal basis.
[^glueck]: German Proverb: Das Glück ist das einzige, das sich verdoppelt, wenn man es teilt.
[^absurditysafety]: As a side note, this shift from guaranteeing the absence of physical harm to guaranteeing psychological well-being becomes even more absurd when you consider that suddenly the physical harm done to children in gender clinics seems less important than the psychological well-being of transgender activists. I invite you to explore stories around the [WPATH-Files](https://www.tichyseinblick.de/kolumnen/aus-aller-welt/wpath-emails-aerzte-hormonbehandlung) and/or read about the UK [Cass-Report](https://unherd.com/2024/04/the-liberal-lessons-of-the-cass-report/).
[^microsoft]: [Microsofts Verhaltenskodex - Beleidigungen können zu Account-Sperren führen](https://www.gamestar.de/artikel/microsofts-verhaltenskodex-beleidigungen-koennen-zu-account-sperren-fuehren,3327822.html)
[^tod]: [Facebook, Google und der Tod So regeln Sie Ihren digitalen Nach­las](https://www.test.de/Digitaler-Nachlass-Wie-Sie-Ihren-Erben-das-Leben-leichter-machen-5028585-0)
[^nachlass]: [Digitale Vorsorge, digitaler Nachlass: Was passiert mit meinen Daten?](https://www.verbraucherzentrale.de/wissen/digitale-welt/datenschutz/digitale-vorsorge-digitaler-nachlass-was-passiert-mit-meinen-daten-12002)
[^analogue]: Deutsche Bahn: [Schritt für Schritt gegen das Recht auf analoges Leben](https://netzpolitik.org/2023/deutsche-bahn-schritt-fuer-schritt-gegen-das-recht-auf-analoges-leben): Die Deutsche Bahn schafft die Bahncard aus Plastik ab.
[^sophos]: As an example of why trusting service providers promises in legal documents is not sufficient have a look at the [Sophos](https://www.heise.de/meinung/Analyse-und-Kommentar-Sophos-und-der-gebrochene-Schwur-10010073.html) case, where they spied on their own customers. Here is [Fefes Blog](https://blog.fefe.de/?ts=99ce1acd) on this issue.
[^sophos]: As an example of why trusting service providers' promises in legal documents is not sufficient, have a look at the [Sophos](https://www.heise.de/meinung/Analyse-und-Kommentar-Sophos-und-der-gebrochene-Schwur-10010073.html) case, where they spied on their own customers. Here is [Fefe's blog](https://blog.fefe.de/?ts=99ce1acd) on this issue.
[^robbraxmannewcontrol]: Rob Braxman Tech: [A New Control Tool to Disrupt Freedom and Free Speech - YouTube](https://www.youtube.com/watch?v=MmO2Lxz_Uu8): Debanking