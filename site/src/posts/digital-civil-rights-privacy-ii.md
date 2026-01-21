---
layout: "layouts/post-with-toc.njk"
title: "Digital Civil Rights and Privacy: A Practical Guide (Part II)"
description: "Crafting a Plan for your Online Freedom."
seodescription: "Action plan for digital civil rights: trust your device, anonymize networking with Tor/mixnets, avoid phone/IoT leaks, then pick messengers, browsers and credential tools, and design a VM-based workstation setup."
creationdate: 2024-11-15
keywords: digital civil rights, privacy, to-do list, work breakdown structure, WBS, online freedom
date: 2024-11-15
tags: ['post']
---

## Rationale

In the [first part](../digital-civil-rights-privacy) of this 2-part blog post series, I provided a conceptual overview of Digital Civil Rights and Privacy, setting the stage for practical steps toward online freedom.
In this second part, we'll create a high-level action plan — a [Work Breakdown Structure](https://www.workbreakdownstructure.com) (WBS) — that outlines the core tasks and services needed to secure our digital rights and privacy.

We won't cover every aspect in depth here; those discussions are for individual solution-focused blog posts to come.
Instead, we'll focus on the essentials, outlining the areas we need to address and the underlying services required to fulfill these needs.

From a methodological perspective, I'll consider my own requirements — ones I believe many will share — and from there, build out a "dependency tree."
By using this approach, we'll identify the foundational building blocks or services that need to be developed and prioritized to achieve our goals of digital freedom and privacy.
This structure will offer a clear path toward a stronger, more secure online presence, with control over personal data in your own hands.

## Without trust in your digital device, there's no way forward.

Many articles about digital freedom and privacy start by discussing higher-level concerns such as which browser you are using.
However, it doesn't matter which browser you choose if you cannot trust the device (hardware and software) on which the browser is running.
If your device is secretly spying on you, all additional security measures won't help.

I already mentioned in the first part of this blog post series that I will opt to ensure your digital rights through technical means rather than solely relying on commitments given by service providers in legal documents.
As an example of why trusting service providers' promises in legal documents is not sufficient, consider the [Sophos](https://www.heise.de/meinung/Analyse-und-Kommentar-Sophos-und-der-gebrochene-Schwur-10010073.html) case where they spied on their own customers.

As operating system providers like Microsoft or Apple continue to integrate more and more AI services that will send your private data to their cloud servers, you'll lose more and more control over your personal information.
Additionally, they will "encourage" you to agree to their service agreements, essentially giving them "voluntary" permission to monitor your activities.
Check out the following articles to understand how dominant operating system providers are turning your personal computer into a totalitarian surveillance machine:

* [Microsoft's Recall heralds the end of the personal computer](https://www.heise.de/meinung/Microsofts-Recall-laeutet-das-Ende-des-Personal-Computers-ein-9730298.html): Snapshots are taken every five seconds when the content on the screen is different from the previous snapshot. ... The PC thus becomes a totalitarian surveillance machine.
* [App Intents API: This is how Siri will read the screen content in the future](https://www.heise.de/news/App-Intents-API-So-soll-Siri-kuenftig-den-Bildschirminhalt-lesen-10007289.html): From iOS 18.2, Apple is preparing for the new "Onscreen Awareness" of the AI ​​assistance system. In the future, Siri will know what users see in order to help them.
* [How iPhone child-safety photo scanning works — and why privacy advocates are worried](https://www.washingtonpost.com/technology/2021/08/19/apple-iphone-child-safety-features)
* [Why the iPhone 16 Should Scare You Shitless!](https://www.youtube.com/watch?v=_c8UrgGG3NA)
* [This Is What a Digital Coup Looks Like | Carole Cadwalladr | TED](https://www.youtube.com/watch?v=TZOoT8AbkNE)
    * [Cadwalladr](https://en.wikipedia.org/wiki/Carole_Cadwalladr) she was a finalist for the 2019 Pulitzer Prize for her role in exposing the Facebook–Cambridge Analytica.

Even if Microsoft and/or Apple were to offer you the choice to opt-in or opt-out of these features, operating systems are so complex that it's nearly impossible for users to verify whether they keep their promises.
Moreover, (foreign) governments might compel them to enable certain features secretly without user knowledge or recourse.

Just as a side note: Even with e-mail providers, if they offer you a "free" spam filtering service, it means that you give the provider permission to access and evaluate your emails automatically (using AI technology).
For instance, [GMX](https://www.gmx.net) no longer allows users to opt out of their spam filtering system. This means that every time you send or receive an email, its content is scanned by their system.
I've always preferred my own local spam filter and was disappointed when I found that the option to disable GMX's spam filter in settings had been quietly removed without any prior notice.

I didn't conduct my own research and analysis to assess the trustworthiness of devices and operating systems, instead I rely on trusted third-party opinions I find credible.
You will need to make your own decision about how you want to proceed or consider reducing your digital attack surface by adopting a more analog lifestyle.

* [Kuketz: These systems/devices I use privately or for business purposes](https://www.kuketz-blog.de/kuketz-diese-systeme-geraete-nutze-ich-privat-bzw-geschaeftlich)
    * The current PC operating system I use is Debian GNU/Linux – stable, secure and data protection-friendly.
    * Smartphone: I use a Google Pixel 8 with GrapheneOS as my smartphone – completely Google-free.
* [GrapheneOS: The gold standard among Android ROMs](https://www.kuketz-blog.de/grapheneos-der-goldstandard-unter-den-android-roms-custom-roms-teil7)

## Networking

Just as crucial as trust in your device is ensuring that you can access the internet anonymously.
In the [first part](../digital-civil-rights-privacy) of this blog post series, I explained why anonymity is crucial in preventing fingerprinting and tracking.


The Tor network has been the most popular method for anonymous network access.
However, [recent reports](https://www.bleepingcomputer.com/news/security/tor-says-its-still-safe-amid-reports-of-police-deanonymizing-users) suggest that law enforcement agencies have managed to deanonymize users on the Tor network.
For more information about the (alleged) technicalities involved in this issue, you can read [Darknet: Investigators used timing analysis to deanonymize Tor users](https://www.heise.de/news/Boystown-Ermittlungen-Mit-der-Stoppuhr-auf-Taeterfang-im-Darknet-9885038.html).
While Tor claims it's ["still safe"](https://blog.torproject.org/tor-is-still-safe), some degree of skepticism is well placed.

For a comparative look at different network anonymity solutions, you might find [VPNs, Tor, I2P — how does Nym compare?](https://blog.nymtech.net/vpns-tor-i2p-how-does-nym-compare-8576824617b8) helpful.
This 2020 article highlights several options for protecting your online identity, including VPNs, Tor, I2P, and Nym.

In terms of requirements, you should prioritize open-source [mixnets](https://nymtech.net/about/mixnet) that are free or offer an anonymous payment option.
Moreover, there should be an incentive system in place to encourage many participants to contribute to the mixnet.
A robust mixnet with numerous nodes makes it significantly harder for even the most sophisticated adversaries to monitor a significant fraction of all nodes.
This will increase your chances of staying anonymous substantially.

### Cell Phone Network

You should also keep in mind that even a "dumb phone" like the classic [Nokia 8210](https://en.wikipedia.org/wiki/Nokia_8210) can still be tracked through their regular ping messages to nearby cell towers.
This kind of tracking can expose your movement patterns, social connections, and other metadata you might prefer to keep private.
If you truly want to protect your digital privacy, consider turning off your SIM card when you don’t need to use the cell phone network.
Often, it's possible to connect to a public Wi-Fi network instead, from where you can secure your online activity using privacy tools like mixnets, as previously mentioned.

## Don't Self-Sabotage Your Privacy

All your efforts to secure your digital privacy can be undermined if you self-sabotage your efforts by using networked smart home or internet-of-things (IoT) devices that are not trustworthy.
While marketed for their convenience, usability, or safety features, devices like Amazon Alexa or smart TVs with microphones and cameras often pose significant privacy risks.
Any device with a microphone, camera, or sensor that could capture your personal data should be treated with suspicion and deserves careful scrutiny.
A category of devices that I find particularly concerning are smart watches or other health monitoring gadgets that share information about your emotional state via proxy variables like heartbeat frequency or blood pressure or other biometric data, with third parties.
Furthermore, be particularly cautious of gadgets that are capable of listening in on your local Wi-Fi or Bluetooth traffic.

The Red Flags to Watch For:
* Networked (either Wi-Fi or Bluetooth): If a device connects to a network, it becomes easier for outside parties to cheaply collect data.
    * Segregating these devices into a "guest network" can limit its access to your main network and prevent it from serving as a gateway to your other devices, but it doesn’t prevent the device from otherwise spying on you.
* Sensors: While basic sensors like temperature or humidity may be harmless, be wary of any that can reveal information about you or your interactions with others like microphones, cameras, location (GPS) sensors, self-monitoring health sensors and so forth.

These red flags are manageable if you use devices running fully open-source software such as [ESP32](https://en.wikipedia.org/wiki/ESP32) with [Tasmota](https://tasmota.github.io/docs/) or similar, which communicate only with fully open-source locally installed home automation systems like [Home Assistant](../odroid-m1-dockerized-homeassistant) or its equivalents.
This setup allows you to maintain full control over your data.
The risks start to escalate significantly when you rely solely on manufacturers' promises for non-open source devices.

## A Workstation Setup Proposal

In this section, I'll share my current thoughts on how an ideal local workstation setup should look to address digital civil rights and privacy concerns as well as IT security.
Since I haven't tested this setup in real life yet, I don’t have firsthand experience to judge its feasibility or practical characteristics.
However, I'm eager for your feedback!
Please feel free to share your thoughts using the comment feature at the bottom of this blog post.

The following picture outlines the idea:

<!--
<object data="/img/privacy-and-security-host-setup.svg" type="image/svg+xml" style="max-width: 100%">
<img src="/img/privacy-and-security-host-setup.svg" alt="Privacy and Security Host Setup">
</object>
-->

<a href="/img/privacy-and-security-host-setup.svg" target="about:blank"><img src="/img/privacy-and-security-host-setup.svg" alt="Privacy and Security Host Setup" style="max-width: 100%"></a>


You start with a minimal host OS installation, such as a trusted open-source operating system like Linux or its equivalent.
This host OS provides an anonymous network connection either through the Tor network or a mixnet or similar.
You can also choose to provide an anonymous network connection at the level of your guest VMs (see below).
In addition, the host OS network layer is monitored by a local open-source [Network Security Monitoring](https://levelblue.com/blogs/security-essentials/open-source-intrusion-detection-tools-a-quick-overview) tool for detecting any unusual network activity.
This host OS would also serve as a runtime environment for guest virtual machines (VMs) and/or containers to segregate your real compute workloads like your user applications from the host OS.
You'd perform everyday activities such as checking emails, working with documents, or browsing the internet inside these VMs.
Each VM would run an open-source [Endpoint Detection and Response (EDR)](https://github.com/ComodoSecurity/openedr) tool for guest OS and application level anomaly detection.

Containers can offer similar benefits to VMs and are generally more lightweight and efficient in terms of resource usage but are typically restricted to the same OS as the host OS.
Virtual Machines can run any operating system and can provide a layer of security when working with less trustworthy operating systems.
Using Virtual Machines (VMs) instead of containers can be advantageous, especially for applications that require specific or less trustworthy operating systems.
If certain applications are only available for specific OSes, you might run some VMs using those less trustworthy OSes.
This means that even if an application running on a VM is compromised, it won't affect your main computer or other VMs.

One of the most significant threats to your privacy and IT security, in my opinion, is [supply chain attacks](https://en.wikipedia.org/wiki/Supply_chain_attack).
These are instances where an attacker manages to compromise one of your software vendor's software management and distribution infrastructure, using it to infect their clients' computers.
Instead of attacking you directly, they exploit the vendor's systems - such as updates or distribution channels - to insert malicious code.
When you update your software from this compromised vendor, the malware is unknowingly installed, spreading the attack through your trusted supplier to you.
This method works well because it takes advantage of the trust and access given to vendors, making it more challenging for security defenses to detect.

This kind of attack can also affect open-source software[^xzbackdoor].
You might only have a better chance of someone in the community detecting it earlier due to the transparent nature of open-source software development.
However, you need mechanisms for learning about potential threats and react promptly.

This is where network security monitoring and endpoint detection and response tools come into play, acting as "scanners" for your local compute activities.
If some of these activities appear suspicious or out of the ordinary, then the purpose of those security tools is to flag the anomalies and alert you.
You might then decide to shutdown the VM in question until the software vendor has analyzed and resolved the situation.
Once resolved, you may either reinstall the compromised VM with its set of applications from scratch or repair it.
This approach mirrors the concept of [bulkheads](https://en.wikipedia.org/wiki/Bulkhead_(partition)) in ships, where you won't lose the entire ship if water enters just one compartment.


From the above setup, I would anticipate several benefits:
1. The minimal host OS configuration reduces the potential attack surface of the core system.
1. The bulkhead approach minimizes risks through a divide-and-conquer strategy.
1. You have both network and operating system/application level IT security scanners for anomaly detection and response, all in one compact local setup. This is beneficial for identifying any unusual activities.
1. All your network anonymization activities are centralized through the host OS network connection. This ensures better control over your online privacy.
1. You have the flexibility to run operating systems and applications that you may not fully trust in a very limited scope. Even if these low-trust components were to leak information, the amount of data they could access would be limited.

If you have an opinion on the setup described above or any proposals for a similar or better configuration, I'd love to hear from you.
If you've already successfully operated such a system and gained real-world experience, please do share!
Use the comment section below to respond.

### Physical Security Considerations

In addition to measures that protect you from remote attacks and infringements, don't forget about physical security protections.
These come into play in case someone gains access to your device.

**Disk Encryption**: One key consideration here is using disk encryption.
For Linux, there are different approaches like [LUKS](https://en.wikipedia.org/wiki/Linux_Unified_Key_Setup) or [fscrypt](https://github.com/google/fscrypt), among others.
If you need a cross-platform solution, [VeraCrypt](https://en.wikipedia.org/wiki/VeraCrypt) might be worth exploring.
Remember that disk encryption only works when the device is off.
While the device is running, secret keys used to decrypt data are in memory and can be read by experts from memory.
A special case are notebooks in hibernate mode; even though they appear off, they may still retain their state, offering similar vulnerabilities as if the device were running.
Ideally, configure your notebook to truly shut down rather than sleep modes for quicker startup.

**OPAL**: [OPAL](https://en.wikipedia.org/wiki/Opal_Storage_Specification) is a specification for [self-encrypting drives](https://wiki.archlinux.org/title/Self-encrypting_drives) (SED).
It's a feature of your hardware disk that you could use to achieve disk encryption via hardware means.
As most OPAL implementations are manufactured in regions of the world you might not necessarily trust, I recommend software-based solutions like those implemented in the Linux kernel.
If you’d like to set it up on your Linux machine then have a look at [sedutil](https://github.com/Drive-Trust-Alliance/sedutil) from the [Drive-Trust-Alliance](https://www.drivetrust.com) and its documentation [Encrypting Your Drive](https://github.com/Drive-Trust-Alliance/sedutil/wiki/Encrypting-your-drive).

**Biometric Access**: There's debate about whether biometric access methods like fingerprint or facial recognition enhance or weaken physical security.
Personally, I prefer a PIN, ideally combined with [PIN scrambling](https://grapheneos.org/features#pin-scrambling), as others might still be able to force you to reveal your PIN but it's not as straightforward as simply placing the device in front of your face.

**Bluetooth Peripherals**: Another aspect to keep in mind regarding physical security is Bluetooth peripherals. Not all of them use encrypted channels for communication with your main device.

The above list is by no means exhaustive and only touches on some key aspects of physical security.
If you're concerned about the physical security of your IT devices, I suggest you continue with further research on your own.

## Functions and Services

After laying the groundwork necessary to protect your digital civil rights and privacy through technical means, it's time to explore individual functions and services you might want to use.
The below list will be a continuous work in progress, and whenever I write more detailed solution-focused blog posts, I'll update this list and provide links to those posts.

**Key Services**:

* Communication
    * One-to-One Messaging
    * Many-to-Many Messaging / Organizing Interest Groups
* News
    * One-to-Many Messaging / Publishing
* Financial Services / Banking
* E-Commerce / Shopping

**Convenience Services**:

* Cloud Storage: Controlled Remote Access to Your Data

### Messengers: One-to-One and Many-to-Many Group Messaging

A core function block to guarantee your digital civil rights and privacy in the digital world is confidential conversations with peers.
Only by communicating with other humans can you form interest groups, exchange thoughts, and shape opinions.
While e-mail still plays a significant role in online communication, I personally don't see how it could be operated in a privacy-preserving manner within its current ecosystem.
I will elaborate more on e-mail further down to clarify my point.

The go-to alternative for private and confidential conversations online is messenger services.
In my previous blog post, I mentioned the [Messenger-Matrix](https://www.messenger-matrix.de),
which provides an overview of various messaging apps and their respective privacy features to help you choose the right one for your needs.

Personally, I find [Briar](https://briarproject.org) quite interesting due to its decentralized approach that avoids central service providers as hubs, thus reducing the risk of metadata collection.
This peer-to-peer method also makes it extremely difficult even for powerful government adversaries to implement a [heckler's veto](https://en.wikipedia.org/wiki/Heckler%27s_veto) and unilaterally silence you.
Additionally, it offers anonymity through integration with the [Tor Network](https://www.torproject.org).

For more information about Briar, check out these talks:

* Torsten Grote: [Briar: Resilient P2P Messaging for Everyone](https://media.ccc.de/v/34c3-8937-briar)
* Nico Alt: [Diving deep into Briar at the XMPP Meetup Berlin](https://www.youtube.com/watch?v=sKuljekMzTc)

Other messengers worth considering are [Session](https://getsession.org) and [SimpleX](https://simplex.chat).
While Session focuses on minimizing or avoiding metadata but still relies on a centralized infrastructure, SimpleX uses a federated infrastructure and avoids user IDs altogether, making metadata collection extremely difficult if not impossible.

#### E-Mail

If you and your peers were able to operate your own e-mail servers, then I could imagine that a sufficient level of privacy both on the data payload and metadata levels could be achieved. However, operating your own e-mail server is substantially harder than using an existing messenger service.

The following two articles shed light on some of the difficulties you would face if you decided to manage your own e-mail server:
* [There is something wrong in e-mail land: Between complexity and unequal power relations](https://www.heise.de/news/Es-ist-was-faul-im-E-Mail-Land-Zwischen-Komplexitaet-und-ungleichen-Machtverhaeltnissen-4259518.html?seite=all)
* [Self-managed mail server: What you need today](https://www.heise.de/ratgeber/Mailserver-in-Eigenregie-Was-Sie-heute-brauchen-9329490.html)

Standard free e-mail services like the previously already mentioned [GMX](https://www.gmx.net) are a privacy nightmare.
From a metadata perspective, privacy is always an issue because the service provider needs to know your recipients and can track how often you communicate with whom and for how long.
But also from an e-mail payload perspective, the relentless push to "improve" your experience with unrequested features — like a server-side spam filter that can access all your communication — is at odds with your privacy concerns.
For instance, GMX no longer allows users to opt out of their spam filtering system, meaning every time you send or receive an e-mail, its content is scanned by their servers.

And then there are offerings like:
* [Proton Mail](https://proton.me) or
* [Tuta](https://tuta.com) (formerly Tutanota)

<section class="roundedBorder">
The following is my current understanding of their services and how they function. If I'm wrong, please let me know in the comments below.
</section>

They claim that the private keys are generated and decrypted only locally within your browser.
This is done to ensure that they don't have access to your private keys on their servers, but despite their efforts, it remains challenging to guarantee this.
Public-private key pairs are created under their control, which means backdoors could potentially be hidden in very subtle ways.

I understand that simplifying things for non-technical users is necessary, but it raises privacy concerns.
They may offer [offline public-private key generation](https://proton.me/support/importing-openpgp-private-key), but they still require the import of private keys into their eco-system, leading to similar concerns as if you created them via their tooling in the first place.

A better approach for tech-savvy users could involve an open-source tool like [Proton Mail Bridge](https://proton.me/mail/bridge) interfacing with your local GPG infrastructure.
This would allow more control over encryption and decryption processes locally. Additionally, it would open up the possibility of using hardware keys.

And regarding metadata: An e-mail service needs certain kinds of metadata that you'd prefer to keep private in order to function properly.
To be fair, both providers are aware of privacy concerns around metadata and have made strides to limit exposure like promising to store only minimal metadata and deleting IP addresses associated with e-mail activity.
However, this still relies on their promises rather than technical guarantees.

In summary, the route via traditional e-mail seems blocked due to the current infrastructure limitations and obstacles set by [established players](https://proton.me/blog/search-risk-google) in the field.
It seems that a more decentralized system would be needed for true privacy.

### Web-Browser

Another core function block for safeguarding your digital rights and privacy in the online world is access to the [World Wide Web](https://en.wikipedia.org/wiki/World_Wide_Web) (WWW) through a web browser, with an emphasis on minimizing opportunities for fingerprinting.

If you'd like to skip the following "little" rant about cookie banners and consent, feel free to jump ahead.

> Imagine a real-world scenario where a person is standing unclothed in a shop display window, feeling uncomfortable as people watch from the street.
> What would you suggest they do?
> Most likely, you might recommend something simple like put on your clothes, or close the curtain, or move to a more private room.
> The common thread among all these "natural" suggestions here is that they tell the person to take action within their own power, resolving the situation without relying on others.
>
> An alternative solution that I'd call "unnatural" might be to ask everyone on the street to look away, maybe even making them sign an agreement under threat of punishment.
> The reasons why I'd call this solution unnatural are manyfold:
> 1. It shifts the burden to others, even though the person with the problem can solve it themselves.
> 1. It's inefficient — instead of one task for the unclothed person it turns into "work" for every person on the street.
> 1. Enforcing such agreements would involve costly policing to make sure no one is looking.<br>This would add to the inefficience from the previous point even more inefficiency on top.
> 1. And even with threats, some might still look, feeling the risk of getting caught is low.
>
> So, what does this analogy have to do with annoying cookie consent banners and web privacy?
> In the online world, we've taken an approach similar to asking passersby to look away.
> Instead of asking consumers (the unclothed person in the window) to use a browser that protects them from tracking, we ask service providers (people on the street) to publish privacy policies promising not to track (not to look at the unclothed persons).
> Furthermore, we ask "exhibitionist" consumers to give their explicit consent if they enjoy being watched.
>
> In addition these cookie banners are now so prevalent, disruptive, and annoying that most consumers bombarded by cookie banners will simply "click them away" to get on with their business,
> rather than choosing to click the right button that would correspond to their privacy preferences — if they even read the policy to understand the implications.
>
> This solution is burdensome for everyone: users have to endure annoying banners, service providers must implement and maintain them, and regulators must verify compliance.
> We have made the world a worse place for everyone.
> Despite all this, there’s still uncertainty about whether companies adhere to these promises, as penalties for breaches may be considered worth the risk compared to the potential gains.
>
> It's like a conspiracy among data collectors who want our information, finding ways that look like solutions and blaming consumers if they complain about too much data being collected by saying it's in their hands to read all privacy policies and click the right button on cookie banners.
>
> A real solution could be much simpler: require browsers to prevent tracking methods like fingerprinting (similar to adding curtains) and enforce strict penalties on service providers who attempt to bypass these protections.
> Just as we would punish stalkers for installing surveillance cameras in someone’s private space, we should hold data collectors accountable for intrusions on users' privacy.

Fingerprinting opportunities extend beyond cookies and cookies are an essential part of the World Wide Web, where the single request based nature of the web needs to be extended to longer running interactions that require sessions, such as shopping baskets in online stores or similar.

People have been incredibly innovative and resourceful in finding different ways to identify individuals without relying on cookies. Some of these methods include:
* [Supercookies](https://www.heise.de/hintergrund/Security-Funktion-HSTS-als-Supercookie-2511258.html) that use [HTTP Strict Transport Security](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) (HSTS), which is meant to be a security feature.
    * Dissertation of Steven Tyler Englehardt: [Automated discovery of privacy violations on the web](https://senglehardt.com/papers/princeton_phd_dissertation_englehardt.pdf)
* [Canvas-Fingerprinting](https://www.heise.de/news/User-Tracking-Werbefirmen-setzen-bereits-haeufig-nicht-loeschbare-Cookie-Nachfolger-ein-2264381.html)
* [Evercookies](https://samy.pl/evercookie)
* And [several others](https://www.heise.de/news/WWW-Tracking-Methoden-werden-brutaler-Browser-Hersteller-schauen-weg-3718112.html?seite=all)

I already mentioned in the first part of this series the [Fingerprint](https://fingerprint.com) website and I asked you to try to avoid re-recognition after your first visit.
You'll notice that most browsers' “incognito” mode won't work, and using a VPN also won't help. The goal is to remain completely anonymous on every visit to this site.

In the initial part of this series, I had included one of my recommended web browsers, [Mullvad Browser](https://mullvad.net/en/browser), in a footnote.
It is only available for computers, not mobile devices.
However, if you're using a computer, I recommend it as it's derived from the Tor browser but without the Tor network capabilities.

The article [Secure and Privacy-Friendly Browsers: My Recommendations](https://www.kuketz-blog.de/sichere-und-datenschutzfreundliche-browser-meine-empfehlungen-teil-1/) examines other browsers including ones for mobile devices.
Your goal should be to use a browser that is winning in the arms race against the data collection industry using technical means.

The following is a citation from the [GrapheneOS](https://grapheneos.org/usage#web-browsing) project:
> Chromium-based browsers like Vanadium provide the strongest sandbox implementation, leagues ahead of the alternatives.

As the Mullvad Browser is derived from Firefox (using Mozilla's [Gecko](https://en.wikipedia.org/wiki/Gecko_(software)) engine), it's important to consider the pros and cons of both approaches.
I found that Tor browser and its derivatives are more effective at avoiding fingerprinting compared to Chromium-based browsers, but you should make your own decision.
Here is some background on the ResistFingerprinting (RFP) efforts in the Tor browser:

> [ResistFingerprinting](https://wiki.mozilla.org/Security/Fingerprinting) (RFP) : The Tor browser is specifically designed to have an identical fingerprint for all users.
> No matter what device or operating system the user uses, the browser's fingerprint should be the same as that of every device running the Tor browser.
> This is achieved through various anti-fingerprinting techniques such as ResistFingerprinting (RFP).
> RFP minimizes browser identification by websites by modifying or masking, by default, a number of browser characteristics that could be used to create a fingerprint.
> These include, but are not limited to, time zone settings, browser window size, and supported fonts.

### Identity and Credential Management

Another core function block for safeguarding your digital rights and privacy in the online world is a good way to manage your identities and credentials.
The following is my current understanding and viewpoint, and I'd love to hear your thoughts in the comments below.

**(Social) Single-Sign-On**:
Before I start, let me share some cautionary thoughts on social single-sign-on ([SSO](https://en.wikipedia.org/wiki/Single_sign-on)) services like "sign-in via Google, Facebook, LinkedIn, Apple, etc."
First of all, from a privacy perspective, you might not want to share metadata information about your visits to third-party sites with big tech companies.
That’s none of their business to know which services you consume or how often you visit those sites.<br> 
Secondly, there is an increasing trend where platforms require users to agree to terms that include provisions for account termination[^microsoft].
If you violate these terms, even unknowingly, they might terminate your account and you lose access to all the services you signed up via their SSO mechanism.
These terminations can happen suddenly, without much warning or recourse.
In summary, I advise against using social single-sign-on (SSO) services.

**Skeleton Keys**:
Another crucial aspect of your digital identity management setup is skeleton keys.
These are like universal access passes that can open multiple locks.
For instance, e-mail accounts used for password recovery on third-party websites function as skeleton keys.
Your credentials to those e-mail accounts do not just unlock your e-mail account but also other sites linked to it via a password recovery mechanism.
When you sign up on a new site ABC, you're usually asked for an e-mail address.
This e-mail serves two purposes: it verifies your identity with an activation link and provides a recovery path if you forget your password.
If an attacker gains access to those e-mail accounts, they can trigger the password recovery mechanism and gain access to other sites too.
Therefore, these e-mail accounts act like skeleton keys. They unlock more than just their own lock.
This makes them a significant security risk if compromised.
Therefore, protecting these skeleton keys is essential.
I recommend using a [FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) hardware key.
I have previously discussed aspects of digital identity security in my blog post [Step Up Your SSH Game](../openssh-fido2-hardwarekey).
While my previous favorite device for proving digital identity was the [Trezor Model T](https://trezor.io/trezor-model-t), new products on the market may now even better serve your needs.
In conclusion, understanding skeleton keys is a crucial part of managing your online identity.
Protect these keys with utmost care and consider using FIDO2 hardware keys for enhanced security.

**Password Managers**:
A special kind of skeleton key is a password manager. 
Nowadays, they do more than just store passwords; they also provide [one-time password](https://en.wikipedia.org/wiki/One-time_password) (OTP) and software [FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) (aka [passkeys](https://fidoalliance.org/passkeys)) capabilities.
My ideal solution would consist of a browser that acts as a password manager and syncs its stored passwords with a (self-hosted) cloud service in such a way that the service can never see the passwords in cleartext.
Then, you treat the (self-hosted) cloud service as a universal skeleton key that you can only access via a FIDO2 hardware key, as discussed above.
This is actually how Google Chrome or Microsoft Edge work, but with the caveat that you have to trust them.
Both promise to store your passwords and other credentials like passkeys in an encrypted format on their servers so that even they cannot access it,
but there's always the risk of hidden backdoors due to mistakes or malicious intent.

[KeePassXC](https://keepassxc.org) is a cross-platform password manager that [integrates](https://keepassxc.org/docs/KeePassXC_GettingStarted#_setup_browser_integration) with various browsers.
For Android, there's [KeePassDX](https://www.keepassdx.com).
The video [Complete Guide: KeePassXC | Free, Open-Source, Android Sync | Self-hosted password manager](https://www.youtube.com/watch?v=jL7gfM27EUA) demonstrates how to sync your passwords using [Syncthing](https://syncthing.net) across all your devices.
[KeePassXC](https://keepassxc.org/docs/) supports the KeePass 2.x ([.kdbx](https://keepass.info/help/kb/kdbx.html)) password database formats for its native password database files, making it easy to migrate to other compatible managers.
It also [handles](https://keepassxc.org/docs/KeePassXC_UserGuide) Timed One-Time Passwords ([TOTP](https://en.wikipedia.org/wiki/Time-based_one-time_password)) that you will know from two-factor authentication apps like Google Authenticator.
Additionally, KeePassXC supports [passkeys](https://fidoalliance.org/passkeys), which are software [FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) keys.


KeePassXC lets you store your TOTP secrets. This could weaken the security of two-factor authentication (2FA) if all credentials are stored in one place.
The KeePassXC team says:

> We believe that storing both together can still be more secure than not using 2FA at all, but to maximize the security gain from using 2FA, you should always store TOTP secrets in a separate database, secured with a different password, possibly even on a different computer.

KeePassXC [supports](https://github.com/keepassxreboot/keepassxc-browser/pull/1173) filling TOTP codes from another database.
This feature allows users to fill out 2FA fields using credentials stored in the second database while keeping their main set of login details secure in the primary one.

**Privacy Considerations**: 
Any site that requires you to login will have many more ways to track you than any site that you can access without logging in, even if you use pseudonyms (placeholder name or "nom de plume").
Using [free and disposable email providers](https://gist.github.com/drakodev/e85c1fd6d9ac8634786d6139e0066fa0) can help avoid spam and reduce the risk of being identified by services requiring sign-up.
However, this method may not guarantee complete privacy as staying anonymous is still a better option.

## Conclusions and Outlook

This blog post is already quite lengthy, but it only begins to cover the steps needed to protect your Digital Civil Rights and Privacy using technical methods.
I will continue publishing more detailed solution-focused posts in the future and update this one with links to those resources to create an extensive guide.
My aim is to keep this page up-to-date to serve as a comprehensive starting point for anyone interested in protecting their digital rights and privacy through technology.

Please feel free to share your thoughts on this topic by leaving comments at the bottom of this page.

## Appendix

* 2024-11-15 [What To Use Instead of PGP](https://soatok.blog/2024/11/15/what-to-use-instead-of-pgp/)
* 2025-01-14 [Session Round 2](https://soatok.blog/2025/01/20/session-round-2/): Last week, I wrote a blog post succinctly titled, [Don't Use Session](https://soatok.blog/2025/01/14/dont-use-session-signal-fork/).

## Footnotes

[^xzbackdoor]: Have a look at the story behind the [xz backdoor](https://www.heise.de/hintergrund/Eine-Analyse-der-xz-Hintertuer-Teil-1-9788145.html) to get an idea of the level of sophistication these supply chain attacks have reached.
[^microsoft]: [Microsofts Verhaltenskodex - Beleidigungen können zu Account-Sperren führen](https://www.gamestar.de/artikel/microsofts-verhaltenskodex-beleidigungen-koennen-zu-account-sperren-fuehren,3327822.html)
