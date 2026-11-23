---
layout: "layouts/post-with-toc.njk"
title: "Identity Revisited: Building a Pseudonymous Publishing Presence"
description: "An architecture walkthrough for establishing and maintaining a publishing identity across the web"
seodescription: "From a pen name to a lasting publishing presence: identities, profiles, credentials, recovery, and an incremental path toward greater privacy."
creationdate: 2026-11-16
keywords: digital identity, pseudonymity, independent publishing, POSSE, IndieWeb, identity management, authentication, account recovery, privacy, Incus
date: 2026-11-16
tags: ['post']
---

## Rationale

> Today I decide to write under the pseudonym Shakespear.
> I want readers to recognize my work across a website and several publishing platforms.
> I want to retain control of that presence, recover from failures, and keep it separate from my other life.
> What must I establish, and what must I keep maintaining?

Choosing the name is easy.
Building a lasting publishing presence around it involves accounts, keys, profiles, places to publish, ways to be found, and arrangements for recovering access when something goes wrong.
Over time, that presence accumulates work, relationships, and a reputation that I want to preserve even as its technical foundations change.

In my recent articles about [Nostr](../publishing-nostr-basics/), [Hive](../publishing-hive-basics/), and [Arweave and AR.IO](../publishing-arweave-ario-basics/), identity kept coming up in different forms: public keys, accounts, signing authorities, and names pointing to published work.
Each ecosystem has its own mechanisms, but I want to use them as parts of one coherent publishing activity.
The [POSSE](https://indieweb.org/POSSE) principle (**Publish on your Own Site, Syndicate Elsewhere**) makes this especially concrete: each "elsewhere" brings another set of identity and access arrangements into the picture.

Some connections between those presences should be public.
A reader who finds Shakespear on one platform should be able to discover the author's website and other accounts, perhaps through a simple linktree-style directory.
I may want to keep other connections private, including those to my everyday accounts, browsing activity, or payment history.

**Establishing a pseudonym means deciding which associations to make visible and which separations to maintain.**

The immediate motivation for this article is a tool I am developing for independent publishing under the working title **Publishing Army Knife**, or **pak** for short.
The project uses an `identity.yaml` file to bring together author information, public identifiers, publishing destinations, and references to credentials.
My understanding of that file's role is still evolving.
Writing this article is part of the design work: I want to clarify what the file should describe, how the tools should use it, and how it can help establish and maintain a publishing presence.

My starting point is the publishing setup explored in the recent articles.
The examples in the Hive and Arweave articles use ordinary internet connections and, where convenient, credit-card payments.
These arrangements are useful starting points for learning the systems and publishing actual work.
They also establish associations that later privacy measures cannot simply erase.

Later stages could add guided account creation and profile configuration, followed by a dedicated [Incus workstation](../incus-agent-jail-recursive-ii-1-concepts/#rationale) with its own browser state and publishing tools.
The description of the publishing persona would remain separate from the configuration of the machine that provides its working environment.
Further along that path, I want to explore enforced privacy routing through NymVPN and payment arrangements using technologies such as shielded Zcash.
These are future architectural requirements whose implementation still needs to be worked out.
At every stage, everyday work inside the environment has to remain convenient enough that preserving the intended separation becomes the normal way of working.

This article will follow that path as an architecture walkthrough, explaining the responsibilities, dependencies, and design choices, with pointers to possible implementations.
I previously explored the broader meaning of identity in [Digital Civil Rights and Digital Integrity](../digital-civil-rights-digital-integrity/#identity).
That philosophical background matters here: an identity has a continuing history while its state, components, and relationships change.
The main walkthrough stands on its own.
The [appendix](#appendix) develops the philosophical argument as a continuous essay; links from the practical sections lead to the deeper reasoning where it helps explain a decision.

## What Must Exist for Shakespear to Publish?

Imagine that a reader discovers one of Shakespear's essays.
They can visit an author page, find earlier work, follow future publications, and get in touch.
If they encounter Shakespear again on another platform, they have a way to connect that appearance with the author they already know.
Months later, the biography or profile picture may have changed, but the publications and relationships still belong to a recognizable, continuing presence.

For our running example, Shakespear will have a publishing home on the web, a Nostr presence, a Hive account, and an e-mail address for correspondence.
I will refer to that publishing home as the `site`, short for website.
The publishing home gives readers a place to return to; the other presences provide additional ways to discover the work, follow the author, and join conversations.
The home could use conventional hosting or the [storage, gateway, and naming arrangements explored in the Arweave and AR.IO article](../publishing-arweave-ario-basics/).
We can decide how to provide that home separately from deciding which author persona it represents.

It helps to distinguish four things that are often bundled together under the word "identity":

| Concept | What it means in Shakespear's case |
| --- | --- |
| **Persona** | The continuing author whom readers know as Shakespear, with a body of work, relationships, and reputation. |
| **Identifier** | A reference to a particular presence: a website address, a Hive account name, or a Nostr public key. |
| **Profile** | The public description associated with a presence: display name, biography, picture, and links. |
| **Credential** | Something used to authenticate or authorize an operation, such as an account password or a private signing key. |

The display name "Shakespear" can appear in several profiles even when the underlying account identifiers differ.
Changing the biography updates the presentation of an existing presence.
Knowing its address lets a reader find it; publishing through it requires the appropriate authority.
The appendix develops the [distinction between referring to an entity and recognizing it again](#referring-to-someone-and-recognizing-them-again), continuing the earlier [discussion of identity](../digital-civil-rights-digital-integrity/#identity).

The visible profiles are only part of the arrangement.
Readers also need ways to discover the work and follow new publications.
Someone must maintain the publishing home, operate the mailbox, control the signing credentials, and pay for services where necessary.
A first map therefore includes the public presences, routes for discovery, and the relationships that keep them usable:

```text
Shakespear: the author persona
|
+-- Public presences
|   +-- site (website): articles, author page, public identity directory
|   +-- Nostr presence: publications, announcements, and conversations
|   +-- Hive account: publications, announcements, and conversations
|   +-- GitHub profile: repositories, contributions, and discussions
|   +-- Keybase profile: public keys and proofs linking accounts
|   +-- Contact address: correspondence with readers
|   `-- OpenPGP public key and fingerprint: encrypted mail and signature verification
|
+-- Discovery and following
|   +-- Website feed -> subscribers and feed directories
|   `-- Search engines -> indexed articles and author pages
|
`-- Operating and maintaining those presences
    +-- site infrastructure
    |   +-- Hosting account (VPS provider, Firebase, ...)
    |   |   +-- Deployment destination -> server or hosted-site project
    |   |   `-- Billing / payment link -> hosting plan or usage charges
    |   +-- WKD endpoint -> public OpenPGP key lookup for the mail domain
    |   +-- DNS provider account -> zone and records for the site
    |   |   `-- Billing / payment link -> DNS charges, if any
    |   `-- Domain registrar account -> registration and renewal
    |       `-- Billing / payment link -> registration and renewal fees
    +-- Mailbox account(s) -> correspondence and selected recovery paths
    +-- GitHub / Keybase accounts -> profile, repository, and proof management
    +-- Search Console / webmaster accounts -> verification and search diagnostics
    +-- Subscription-service accounts -> feed listings and email delivery
    +-- Signing credentials -> publication through the relevant identities
    +-- OpenPGP private keys, backups, and revocation material -> decryption and key management
    `-- Payment sources -> card, wallet, or other funding account
```

This is a map of roles and dependencies; the exact accounts depend on the chosen services.
The public presence can extend beyond articles and social posts: a GitHub profile carries a history of projects and contributions, while Keybase brings together keys and proofs connecting accounts.
My [homepage](https://weisser-zwerg.dev/) already links to my [GitHub](https://github.com/cs224) and [Keybase](https://keybase.io/cs224) profiles as parts of the same identity.
Shakespear could choose similar associations for the author persona.

An **OpenPGP key**, managed with GnuPG for example, gives correspondents a way to encrypt mail to Shakespear and verify signed messages.
Its public key and fingerprint belong in the public directory.
My [OpenPGP Web Key Directory (WKD) setup in the Mailu article](../digital-civil-rights-mailu/#setting-up-openpgp-web-key-directory) shows how compatible mail clients can discover the public key through an HTTPS service for the e-mail domain.
It can share the website's hosting, including when it is served from an `openpgpkey` subdomain.
The corresponding private keys enable decryption and signing; key storage, backups, and revocation arrangements belong to the operational side of the map.

In the conventional hosting option shown here, hosting, DNS, and domain registration may be handled by one provider or by separate accounts.
For each paid service, the operational description should record what we pay for, the amount or pricing basis, when payment or renewal is due, and where to manage or pay the bill.
Those administrative and payment links belong to the operating map; the public directory points readers to the site itself.

Webmaster tools and hosted subscription services are optional additions, explored in the [search and discovery article](../publishing-search-and-discovery/).
Search engines can discover a site without a webmaster account, and readers can subscribe directly to its feed.

A public contact address and an address used for account recovery can be different.
If a domain registrar allows password recovery through a mailbox, continued control of that mailbox becomes part of maintaining the publishing home.
That is the ["skeleton key" relationship discussed in my earlier article on identity and credential management](../digital-civil-rights-privacy-ii/#identity-and-credential-management).
It belongs in our understanding of the setup even though readers normally have no reason to see it.

What looks like a few publishing destinations quickly becomes a collection of places where information, access, and relationships need to be maintained.
Making that manageable is a central purpose of `pak`: bring the arrangement into one description, guide its setup, and help keep it current.
The aim is that an author can operate this presence without having to become an expert in every service.

The [public directory](#making-shakespear-recognizable-across-platforms) draws on the associations Shakespear wants readers to know: the website, author profiles, contact information, and public keys.
The complete operational map may also contain administrative and recovery relationships that should remain private.

Before establishing these relationships, I need to decide how much separation from my other life I want.

* Publishing under a pen name may simply mean that readers see "Shakespear" while service providers know my everyday identity.
* Keeping that connection private from providers, payment services, or observers of network activity is a further requirement.<br>
  It affects the choice of accounts and services, the way they are paid for, and the environment from which they are used.

My earlier [discussion of public and private personas](../digital-civil-rights-networking-i/#a-word-of-caution) already approached this problem through the risk of connecting otherwise separate activities.
The [reverse-Nextcloud publishing proposal](../censorship-resistant-reverse-nextcloud-for-identity-free-publishing/) explored a possible architecture for making writing publicly accessible while concealing its publisher's infrastructure and identity.
Here, those concerns meet the concrete task of establishing an author presence.
Using an everyday mailbox or payment account may be acceptable for the first version, but those connections become part of its history from the moment they are used.

At this stage, we need a clear map of what Shakespear intends to establish, which associations should be public, and which dependencies sustain the presence.
The next step is to understand how the author and the publishing tools obtain the authority to act through each part of that map.

## Credentials and Service Dependencies

To publish Shakespear's essay, a tool needs the relevant public identifier, permission to perform the operation, and access to the services that handle it.

On Nostr, the tool prepares an event, asks a signer to sign it, and sends the signed event to the chosen relays.
The [signer](../publishing-nostr-basics/#the-trusted-signer-pattern) can keep the private key while allowing the tool to request signatures.
That gives us two separate configuration needs: **which identity to use** and **how the tool obtains authority to act through it**.
The appendix explains [how secrets and signers turn control into verifiable evidence](#turning-control-into-evidence), including the different trust arrangements behind passwords, passkeys, and federated login.

The earlier publishing articles illustrate how these requirements differ:

| System | Public identifier | Required authority | Service dependencies |
| --- | --- | --- | --- |
| **[Nostr](../publishing-nostr-basics/)** | Public key carried in signed events | Access to signing under that key | Relays and reader applications |
| **[Hive](../publishing-hive-basics/#several-authorities-instead-of-one-all-powerful-key)** | Account name recorded on the blockchain | Posting authority for publications; separate authority for financial operations | Blockchain, API nodes, and front ends |
| **[Arweave / AR.IO](../publishing-arweave-ario-basics/#five-separate-roles)** | Upload signer address and, separately, an ArNS name | Upload signing and separate authority over the name | Storage network, naming system, gateways, and an upload service such as Turbo if used |

Payment adds another relationship.
In the Arweave walkthrough, the upload signer, the account paying with Turbo credits, and the owner of the ArNS name can differ.
Someone can fund Shakespear's uploads without obtaining the signing key or control of the name.
The configuration needs to preserve these distinctions even when one person manages all the roles.

Holding the required credentials also leaves dependencies on the receiving systems.
A relay may reject a correctly signed event, and a gateway may decline to serve stored content.

This continues the [malicious service provider problem](../digital-civil-rights-privacy/#the-malicious-service-provider-problem) from my earlier privacy article.
Proving that I am entitled to request an action and [trusting the service to carry it out faithfully](#who-can-sustain,-recover,-or-interrupt-an-identity?) are separate concerns.
The architecture should make both the authority we hold and the dependencies we accept visible.

For each part of Shakespear's presence, we therefore need to record which public identifier we use, which operations the tools should be able to perform, and how they obtain the corresponding authority.
That is the arrangement our identity configuration needs to express.

## Making the Arrangement Explicit: identity.yaml

In the `pak` (Publishing Army Knife) tool, `identity.yaml` describes the publishing persona in a form that tools can read.
Its schema defines the accepted fields and which ones are required.
Currently, the minimum is `schema_version` and an `author` section containing a `byline`; services such as Hive or Nostr are optional.
Shakespear can start with that minimum and add information as the presence takes shape:

```yaml
schema_version: 1
author:
  byline: Shakespear

# Added as the corresponding services are established:
contact:
  email: letters@shakespear.example
website:
  url: https://shakespear.example/
hive:
  account: shakespear-demo
  posting_credential: null
```

These are existing schema fields with illustrative addresses and an illustrative account name.
Here, `null` means that access to the posting credential is deliberately unconfigured.
The file can describe an account before the tools are ready to publish through it.
Schema validation checks the structure; writing an account name or domain into the file neither creates it nor proves control over it.
The setup workflow must distinguish intended choices from identifiers and access it has actually checked.

Today, `pak identity-sync` already uses `author.byline` to configure the publication builder.
A shared biography and additional profile settings are proposed extensions.
Recovery and payment relationships also need to be accounted for, but their placement in this file or separate private records remains a design question.

The information has different audiences.
The byline, website, and selected profile links can supply a public directory akin to <https://linktr.ee/> or <https://bio.link/>.
Signer connections and publication destinations serve the tools; recovery relationships may be private even when they contain no passwords.
Publishing that directory therefore means selecting its public fields.
Credential references keep secret values outside this file.
The current implementation uses KWallet for those references; supporting other storage arrangements is further work.

For now, `identity.yaml` supports publishing from the computer we already use.
A later increment would provide Shakespear with a dedicated [Incus workstation](../incus-agent-jail-recursive-ii-1-concepts/#rationale), accessed remotely, with its own browser and publishing tools.
Its setup would combine **persona configuration** from `identity.yaml` with separate **workstation configuration** for the desktop, storage, and networking.

That [provisioning process](../cloud-init-provisioning/) establishes a starting environment.
Months later, Shakespear will have accumulated bookmarks, browser sessions, drafts, credentials, and many small adjustments.
A fresh instance created from the original template would not contain those particulars.
They are the **accumulated state** of an environment that has acquired its own history through use, much like the [database at the start of the appendix](#what-makes-an-entity-an-entity?).

* **Persona configuration:** Shakespear's identifiers, profile information, and connections to publishing services.
* **Workstation configuration:** the operating system, desktop, storage, remote access, and network policy of the environment used to work as Shakespear.
* **Accumulated state:** drafts, browser sessions, bookmarks, credentials, and publication records that develop through use and need their own preservation arrangements.

**Identity therefore cannot be treated solely as a provisioning job.**
Preserving the state that develops beyond the standardized starting point is part of sustaining that identity.
This is a practical consequence of the philosophical argument developed in the appendix: [continuity through changing states](#values-describe-states;-identity-connects-a-history) requires [preserving the particulars and relationships accumulated over time](#who-can-sustain,-recover,-or-interrupt-an-identity?).

Incus [snapshots](https://linuxcontainers.org/incus/docs/main/howto/instances_backup/#use-snapshots-for-instance-backup) provide restorable checkpoints of the state stored in the instance.
They belong in the design from the beginning: over time, the snapshots themselves become part of the material we maintain for Shakespear, alongside the configuration and the live environment.
The snapshot history also needs backups beyond its host, following the [backup and restore approach explored in my home-server article](../home-server-infrastructure/#restore-tests).
State held by external services still depends on those services and their recovery arrangements.

The schema can evolve as these workflows become clearer.
The next step is to connect this description to the operations that establish accounts and maintain their public profiles.

## Establishing Accounts and Maintaining Their Profiles

With an initial `identity.yaml`, Shakespear needs a way to establish each chosen presence and maintain its public presentation.
I envisage two operations:

* **`create`** establishes an account or cryptographic identity and records its identifiers and credential references.
* **`configure`** sets or updates its public profile: display name, biography, picture, website, and related links.

The following commands describe a proposed `pak` interface:

```bash
pak identity nostr create
pak identity nostr configure
pak identity hive create
pak identity hive configure
```

The work behind `create` depends on the destination.
On Nostr, [generating a key pair establishes the identity](../publishing-nostr-basics/#create-a-key-pair-and-derive-its-public-identity).
On Hive, [another account must register the new account on the blockchain](../publishing-hive-basics/#an-account-must-be-created-by-another-account).
The workflow would record the established results in `identity.yaml`.
Someone bringing an existing account would supply its identifiers and credential references, then proceed to `configure`.

For the initial profile, Shakespear might choose the display name **Shakespear** and the biography **"Essays and observations."**
The proposed shared profile fields would let `configure` apply this description to the selected services, with adjustments where their profile formats differ.
The [Nostr profile walkthrough](../publishing-nostr-basics/#publish-the-profile-settings) already demonstrates the underlying operation: sign the profile metadata and publish it to relays.

Months later, the writing has found a focus: **"Essays about cities and the people who build them."**
Shakespear edits the biography in `identity.yaml` and runs the two `configure` commands again.
Editing the file changes the intended profile locally; the commands must submit the updates using each presence's authority and report which destinations accepted them.
The account name or public key stays the same: this is a small example of [identity continuing while its state changes](#values-describe-states;-identity-connects-a-history).

Similarly, `pak identity site create` could guide the establishment of the publishing home.
That might involve registering a domain and choosing hosting, or using an arrangement such as [Arweave with an ArNS name](../publishing-arweave-ario-basics/).
Some steps could be automated; others could provide instructions to follow in a browser, then help check and record the result.
Guided manual steps are part of the intended workflow.
The corresponding `configure` operation would maintain the site's public author information.

These profiles give readers several places to encounter Shakespear.
Their links can then help readers recognize which presences belong together.

## Making Shakespear Recognizable Across Platforms

A reader who discovers Shakespear on Hive should be able to find the website, follow new articles, or continue the conversation on Nostr.
A public author page can provide that map.
I want `pak` to generate this directory from explicitly selected public information in `identity.yaml`, supplemented by links supplied by the website, such as its feed.
An illustrative page could look like this:

```text
Shakespear
Essays about cities and the people who build them.

Read       https://shakespear.example/
Subscribe  https://shakespear.example/feed.xml
Nostr      Profile link and full public key
Hive       Profile of shakespear-demo
GitHub     Profile and public repositories
Keybase    Profile and account proofs
Contact    letters@shakespear.example
OpenPGP    Public key download and full fingerprint
```

This is the **linktree idea** introduced earlier, hosted as part of the publishing home.
The [Nostr walkthrough](../publishing-nostr-basics/#share-the-public-identity) shows how a public key can also be presented as a browser-friendly profile link.
The directory generator would use an explicit selection of fields; recovery addresses, credential references, and administrative relationships belong to the operational description.

A shared byline, portrait, and biography help readers recognize Shakespear at each destination.
The directory claims that these presences belong together.
Links back from the Hive and Nostr profiles provide supporting evidence.
On Nostr, that endorsement can appear in [signed profile metadata](../publishing-nostr-basics/#publish-the-profile-settings), tying it to the public key.
Keybase proofs offer another way to demonstrate control of the linked website or GitHub account.
A reader can follow these connections from an address or key they already trust.
A copied name, portrait, or biography alone gives an impersonator no such continuity with the established presence.
The appendix examines this [gap between familiar appearances and evidence of identity](#referring-to-someone-and-recognizing-them-again).

Following the author also needs a path to new work.
When Shakespear publishes another essay, the website's feed can carry it to subscribers, while short announcements on Nostr and Hive point readers to the article.
This continues my earlier [ActivityPub experiment](../activity-pub-integration-via-fed-brid-gy2/) and the [feed and subscription arrangements](../publishing-search-and-discovery/#feeds,-feed-directories,-and-email-subscriptions) already used on this blog.
The directory helps readers choose where to follow; feeds and announcements keep that choice useful.

[Search and discovery](../publishing-search-and-discovery/#conventional-search:-google,-bing,-and-brave) add another route to the work.
Search engines can discover linked public pages without a webmaster account.
Using [Google Search Console](https://support.google.com/webmasters/answer/10267942), however, introduces a Google account and verification of control over the site.
That account belongs on Shakespear's operational map, including its recovery arrangements.
Using an everyday Google account would link Shakespear's site to that account in Google's records.

## Preserving the Presence Through Change and Failure

Six months into the project, the disk holding Shakespear's workstation fails.
The published essays are still online, but continuing the work now depends on what was preserved elsewhere.
Three things contribute differently to recovery:

* **Configuration** describes the setup to rebuild: tools, settings, public identifiers, and connections to services. A credential reference tells us where to look; it cannot recreate the secret.
* **Backed-up state** preserves the particulars accumulated through use: drafts, bookmarks, publication records, and locally stored credentials.
* **External recovery procedures** may restore access to accounts when credentials are unavailable, subject to each service's rules and the evidence it requires.

In the proposed Incus environment, snapshots would preserve checkpoints of that working history.
Copies kept only on the failed storage would be lost with it, so the design also needs backups elsewhere and [restore tests on another system](../home-server-infrastructure/#restore-tests).

A simplified recovery map could look like this:

```text
Backup stored outside the workstation's host
`-- Configuration, working state, and backed-up credentials

Access to recovery mailbox + provider's required checks
+-- Registrar recovery -> domain administration
`-- Hosting recovery -> website administration
```

The backup and any secret needed to open it must be accessible without the failed machine.
The mailbox needs a surviving access or recovery route too.
Where a service accepts password resets through e-mail, that mailbox becomes the [potential skeleton key discussed in my privacy article](../digital-civil-rights-privacy-ii/#identity-and-credential-management).
Using a personal mailbox for this purpose connects Shakespear's account to it in the provider's records, even if readers never see the address.

Recovery differs between systems.

* For the [Nostr key pair in our walkthrough](../publishing-nostr-basics/#generate-the-key-locally), losing every usable copy of the secret prevents further signing under that public key; a new key pair establishes a different identifier.
* [Hive's named account](../publishing-hive-basics/#several-authorities-instead-of-one-all-powerful-key) can retain its name while authorized changes replace its keys.  
  Its [account-recovery procedure](../publishing-hive-basics/#an-account-must-be-created-by-another-account) also requires cooperation from the recovery account and proof using a recent owner authority.
  It cannot simply compensate for losing every credential.

The same dependency map helps with ordinary changes.
Moving hosting while retaining the domain can preserve the addresses readers know; that continuity still depends on domain renewal and access to its administration.

If a public address or account changes, Shakespear needs to update the directory and reciprocal links, and announce the move through presences readers already recognize.
This connects technical recovery with [the continuity readers recognize](#who-can-sustain,-recover,-or-interrupt-an-identity?): restoring access and sustaining the author persona involve different evidence.

## A Workstation That Makes Separation Practical

A later increment would give Shakespear a dedicated Incus desktop, entered through RDP or a similar remote desktop connection.
This develops the [workstation-container idea from my earlier Incus article](../incus-agent-jail-recursive-ii-1-concepts/#rationale).
Opening its browser would return the author to Shakespear's sessions and bookmarks: publishing platforms, the mailbox, hosting and DNS administration, and payment pages.
Drafts, `pak`, credentials, and eventually a local wallet would share that environment.

**Once inside, ordinary work should be straightforward.**
Writing, publishing, and maintaining accounts should not require repeatedly assembling the right settings and unlocking several layers of credential storage.
If the environment becomes cumbersome, working around it becomes tempting, undermining the separation it was meant to provide.

I would use encrypted storage for the instance, building on the [storage approach explored in my home-server article](../home-server-infrastructure/#unattended-reboot-and-disk-encryption-at-rest).
Within the unlocked workstation, tools should have convenient access to the local credentials or signers they need.
An additional password manager or hardware signer is a choice within that design.
Keeping secrets outside Git and public output is a separate concern from requiring another local vault.
This assumes trust in the Incus host, the computer used to access it, and the software running inside the desktop.
Encryption protects stored data while locked; running programs can use the credentials made available to them.

Remote access and outgoing traffic have separate responsibilities in the proposed architecture:

```text
Author's computer
    |
    | Protected remote desktop connection
    v
Shakespear's Incus workstation
    | Browser, drafts, pak, credentials, optional wallet
    |
    | Outgoing application traffic, including DNS
    v
Enforced network boundary
    |
    | Permitted privacy route(s)
    v
Publishing, administration, mail, and payment services
```

The remote desktop lets me operate the workstation, provided the connection supports [coordination at the pace the work requires](#what-keeps-an-entity-together?).
The appendix develops these physical dependencies through its [robot and digital-limbs examples](#physical-history-and-distributed-digital-limbs).

The network boundary determines how its applications reach external services, continuing the [workstation separation proposed in my privacy article](../digital-civil-rights-privacy-ii/#a-workstation-setup-proposal).
**If the permitted privacy route is unavailable, applications must lose internet access rather than silently use an ordinary connection (kill-switch).**
That must hold during startup and reconnection as well as connection failure, covering the browser, publishing commands, DNS, background activity, and any wallet.

My [NymVPN experiments](../digital-civil-rights-networking-i/#nym-mixnet:-nymvpn) and the [Orivon browser's routing choices](../digital-civil-rights-nextcloud-i/#orivon:-a-web3-browser-with-integrated-nym-mixnet-routing) provide starting points to investigate.
Different applications or tabs could use different permitted routes.
These choices must still obey the workstation's network boundary; a separate wallet process must use a permitted route too.

Routing controls only part of the separation.
[Browser characteristics and recurring behavior](#referring-to-someone-and-recognizing-them-again), as well as reused logins, can connect activities across personas-a concern already developed in my [browser discussion](../digital-civil-rights-privacy-ii/#web-browser).

The workstation configuration would govern remote access, storage, and networking alongside the persona description in `identity.yaml`.
Snapshots and backups would preserve the familiar environment as Shakespear's work and habits accumulate.

## What We Can Build Now and What Comes Next

Shakespear can begin publishing while this architecture develops.
Each increment should make the work easier to manage and leave room for the next:

| Increment | Current position | What it provides |
| --- | --- | --- |
| **Publishing foundation** | Implemented in the current project | Validation of `identity.yaml`, byline synchronization, bundle generation, and Hive/Nostr tools for preparing, signing, and sending articles and standalone announcements. |
| **Establishing and maintaining the presence** | Proposed next steps | The `pak identity … create` and `configure` workflows, shared profiles, a public directory, and records of service accounts, payments, renewals, and recovery dependencies. |
| **A dedicated Incus workstation** | A future companion project | Combine persona and workstation configuration; preserve browser state, credentials, and working history through snapshots and backups. |
| **Stronger separation** | Further implementation and validation | Enforce permitted network routes and introduce wallet and payment arrangements chosen to keep the persona separate from other parts of the author's life. |

The website and Arweave/AR.IO integrations in the current publishing project also remain to be built.
The [Arweave walkthrough](../publishing-arweave-ario-basics/) already provides the manual operations on which that integration can build.

For the present work, ordinary internet connections and credit-card payments are acceptable.
The [Hive](../publishing-hive-basics/) and Arweave walkthroughs show how to establish accounts and publish under those practical starting conditions.
The publishing tools should remain usable on an ordinary computer, with room to adopt different signers, network routes, and payment arrangements as the surrounding environment develops.
NymVPN and shielded Zcash are directions to investigate without making them prerequisites for today's publishing work.

**The tools can evolve, but a particular persona also acquires a history.**
If Shakespear registers a domain using a personal mailbox or pays from an everyday account, those associations may remain in service records.
Adding privacy routing or changing payment methods later cannot undo them.
A persona that needs stronger separation therefore has to be established with that requirement from the beginning, even while the tools are still developing.

The [appendix](#appendix) continues the [earlier discussion of identity](../digital-civil-rights-digital-integrity/#identity) behind these practical choices: an identity develops through use, and sustaining it requires preserving more than its initial configuration.

## Conclusion

I wrote this blog post mainly for myself, to think through the requirements of `pak` and clarify what belongs in `identity.yaml`.
Working through Shakespear's example helped connect the publishing workflow to the accounts, credentials, infrastructure, payments, and accumulated state that sustain it.
Writing has been part of the design process.

I intend to publish `pak` as open source on GitHub once it is "good enough" to be useful to others.
The aim is a practical tool that makes this complexity manageable and can grow through actual use.
This article records the direction I want to take and the reasoning behind it.

## Appendix

The publishing architecture treats Shakespear as a continuing presence whose devices, accounts, and credentials can change.
The following sections develop that account of identity, from physical processes and changing state to recognition and control.

### What Makes an Entity an Entity?

I have heard database administrators complain about a familiar progression, which I also described in my [earlier discussion of fungibility and identity](../digital-civil-rights-digital-integrity/#fungibility-vs.-identity).
A small database starts as an experiment.
It seems harmless and disposable, so nobody plans for backups, redundancy, or continuous availability.
Then people start using it, real records accumulate, and other systems begin to depend on it.
Eventually, the supposedly disposable installation requires all the operational care that its innocent beginning seemed to avoid.

A fresh installation of the same software would discard the records and relationships on which people now rely.
What matters is preserving this particular database's continuing history, even if we replace its disks, move it to another server, or upgrade its software.

At the scale of elementary particles, electrons are [indistinguishable](https://www.feynmanlectures.caltech.edu/III_04.html): one electron has the same intrinsic properties as another.
In that sense they are fungible.
A cat or a database is an organized arrangement of such interchangeable constituents.
The identity that interests me is a **macroscopic phenomenon**: it belongs to this particular whole and its continuing history.

That whole is continually changing.
A cat eats, grows, heals, and exchanges matter with its surroundings while remaining the same cat.
Similarly, the saying that we cannot step into the same river twice captures how the water changes while the river continues.
Neither the cat nor the river depends on keeping a fixed collection of atoms.
What continues is a physical process through which successive configurations belong together.

Identity therefore involves a lifecycle.
Organisms are born, develop, and die; reproduction gives rise to new organisms.
In sexual reproduction, contributions from the parents combine in a new individual.
The child's history is connected to the parents' histories, but the child has an identity of its own.

A [company such as a German GmbH](../digital-civil-rights-digital-integrity/#lifecycle-events) makes these distinctions visible in another setting.
It can continue while its employees, owners, premises, and equipment change.
It also has a beginning and an end, and can participate in mergers or split off part of its operations into another company.
Legal rules determine which company continues, which ends, and which is newly created.
Continuing an entity, combining entities, and creating a new one are different events in their histories.

The database has this process character too: it accepts queries, records changes, and serves the applications that depend on it.
A snapshot captures its state at one moment.
The database continues through a succession of such states.

### Values Describe States; Identity Connects a History

Take a snapshot of our database and restore it into two installations that we then operate independently.
Both begin with exactly the same records, but they are already two separate databases.
An application can write to one without affecting the other.
From that common starting point, each develops its own history.
The snapshot's contents alone cannot tell us which continuing database we mean.

Rich Hickey's [The Value of Values](https://www.youtube.com/watch?v=-6BsiVyC1kM) was an important influence on how I think about this distinction, as I mentioned in my [earlier article](../digital-civil-rights-digital-integrity/#naming-and-references).
A **value**, in this sense, is immutable information.
It can be as simple as a number or as complex as the entire contents of our snapshot.
Copying those contents preserves the value; changing a record produces a different value.
Complexity alone therefore does not turn a value into an entity with identity.

In [Hickey's account of state and identity](https://clojure.org/about/state), **state** is the value associated with an identity at a particular time.
For our database, the snapshot describes such a state.
**Identity** lets us refer to the continuing database as its state changes: yesterday it contained these records; today it contains those records.
Two independent databases can have equal states, just as one database can have different states at different times.

The value also needs to be distinguished from its physical representation.
Two disks can contain the same snapshot.
They are different physical objects, with different locations and histories, while the information they represent is the same.
Replacing a failed disk need not change that information.

Clojure's [atom](https://clojure.org/reference/atoms) gives this distinction a concrete form in a program.
An atom provides a stable reference whose current value might be an immutable map describing an entity.
An update associates a new value with that same reference.
Code that retained the earlier value can still inspect it unchanged.
Keeping a history requires retaining those earlier values; the atom itself holds the current one.

Years before encountering Hickey's talk, [*Java Modeling in Color with UML*](https://www.informit.com/store/java-modeling-in-color-with-uml-enterprise-components-9780130115102), by Peter Coad, Eric Lefebvre, and Jeff De Luca, had drawn my attention to the importance of time in these models.
Its pink *moment-interval* classes represent occurrences such as a sale at a particular moment or a rental extending over an interval.
That was one of my first encounters with modeling activities and their place in an entity's history alongside the entity's properties.

For Shakespear's workstation, a snapshot likewise [preserves a recorded state from which work can continue](#preserving-the-presence-through-change-and-failure).
Provisioning a fresh machine cannot supply the browser sessions, drafts, and publication records accumulated since its first setup.
Those are consequences of what happened while it was being used.
To understand that continuing identity, we also need to consider the processes that produce these changes and what keeps them working together.

### What Keeps an Entity Together?

To answer the next query, our database needs running processes that read and transform its stored state.
In my earlier article, I used the [Turing-machine-head analogy](../digital-civil-rights-digital-integrity/#the-role-of-physical-processes) for this meeting of process and data.
In [Turing's model](https://people.csail.mit.edu/brooks/idocs/Turing_Paper_1936.pdf), a head reads and writes symbols on a tape according to the machine's rules.
In an actual computer, physical circuitry executes instructions using data held in memory and storage.
The stored configuration participates in an ongoing activity.

The many cells of a human body carry out biochemical processes in parallel.
They take in nutrients, transform substances, maintain their structures, and [communicate through signals](https://www.ncbi.nlm.nih.gov/books/NBK26813/).
Thinking computationally, this resembles an enormous parallel system whose many activities depend on one another.
For example, heart muscle cells help maintain the circulation that supplies them and the rest of the body.

My working criterion is **coordination on the timescales required by the entity's characteristic processes**.
The timing matters as much as the existence of a connection.
The contractions that produce a heartbeat must work together quickly enough to pump blood; healing a wound involves coordination over a much longer period.
A body accommodates both.
Its parts need to interact at the pace appropriate to what they are doing.

These entities can be nested: a person contains organs, and organs contain cells.
Each can have an identity and history at its own level.
When speaking about the person, we usually refer to the whole; a surgeon may be concerned with a particular organ, and a biologist with a particular cell.
Their membership in the body involves participation in its continuing organization.
Severing an organ's blood supply interrupts that participation and, without intervention, can kill the organ and endanger the person.

The river shows how broadly I mean coordination here.
Neighboring portions of water influence one another through pressure and motion, producing the continuing flow we recognize as the river.
There is no intention or central controller involved.
Take out a bucket of water and those molecules cease to participate in that flow.
The water still exists, but it now follows a different course of events.
The river continues as other water flows through it.

This leaves room for judgment about where an entity's boundaries lie.
Our two independently operated databases do not become one database merely because they share a network.
If we instead organize several machines to maintain replicas and serve one database, their coordination makes it useful to treat the service as a whole, while still distinguishing its individual machines.
Which processes belong together depends on the organization we are trying to sustain and the level at which we describe it.

That coordination has to happen through physical interactions.
Signals, material, and energy must reach the participating parts in time for their work to continue.
The speed of those interactions therefore constrains how far apart the parts can be while still functioning together.

### Physical History and Distributed Digital Limbs

Follow a cat from the kitchen into the garden, and we can trace its movement through space and time.
Over a longer period it grows, exchanges matter with its surroundings, and replaces some of its cells.
The [physical continuity discussed in my earlier article](../digital-civil-rights-digital-integrity/#time-spatial-continuity) belongs to the continuing organism through these changes.
The same reasoning lets us follow a database through a disk replacement or a move to another server: its state is physically transferred, and the replacement takes over its work.
The components change while the coordinated activity and its history continue.

For a given required response time, slower communication imposes tighter limits on distance.
A cat's body meets its needs through closely connected tissues, nerves, and circulation.
Electronic and optical communication permit a more widely spread organization when the timing requirements allow it.
That organization can branch from circuit-board traces through Ethernet cables, switches, and optical fibres to machines in different buildings or countries.
Wireless links also carry physical signals through electromagnetic fields.
The structure can be long, thin, and extensively branched while remaining physically connected through those communication paths.
The required exchanges may happen at different times; coordination need not mean every component is continuously active or synchronized.
Its state still resides in particular memories and storage devices in those machines.

Imagine a robot reaching for a cup.
With its control system onboard, sensor readings can be processed and turned into motor commands within the robot.
Move that processing to a remote server, and the readings must travel there and the commands return before the movement requires them.
A powerful remote computer is useful only if that round trip is fast enough, the connection carries enough data, and commands arrive reliably.
If the connection fails, the robot must fall back on whatever control remains onboard, perhaps stopping until communication returns.
Moving its "brain" has made the communication path part of the machinery on which its actions depend.

This is the connection to the [Barbapapa metaphor in my digital-integrity article](../digital-civil-rights-digital-integrity/#joining-the-dots:-bridging-entity-with-identity-(ewi)-and-digital-integrity).
The extra limbs stand for devices, accounts, and services through which we remember, communicate, and act.
Some are close at hand; others reach into distant data centres.
Their timing requirements differ: writing in a remote desktop needs prompt responses, while correspondence through a mailbox tolerates much longer delays.
Both extend our activities through stored state, running processes, and physical connections.

These limbs may also [live under someone else's roof](../digital-civil-rights-digital-integrity/#your-digital-identities-live-under-a-stranger%E2%80%99s-roof).
The computers and communication paths have operators who can interrupt access, alter the service, or decide that we may no longer use it.
A functioning network connection does not ensure that the service at the other end will cooperate.
The provider remains an independent actor even where its infrastructure supports activities we experience as part of our own lives.

Shakespear's [workstation, mailbox, publishing site, and platform accounts](#what-must-exist-for-shakespear-to-publish?) form such a branching arrangement.
Replacing the workstation or moving the site can preserve that presence when the necessary state, control, and relationships carry forward.
This is why the architecture needs to record where those dependencies lie and how they can be maintained or replaced.
The public name gives readers a way to refer to the continuing presence as its underlying machinery changes.

### Referring to Someone and Recognizing Them Again

A reader encounters Shakespear through a byline, a profile, or a message in their inbox.
The name refers to the author persona; a username identifies an account within a particular platform; a web or e-mail address gives us somewhere to direct a request or message.
These [names and references](../digital-civil-rights-digital-integrity/#naming-and-references) depend on context and established associations.
Two unrelated accounts can display the same name, while one author can use several names.
A website can move to another server while keeping its address, and an address can later come under someone else's control.
The [public directory and reciprocal profile links](#making-shakespear-recognizable-across-platforms) make the intended associations explicit.

We rarely observe the whole physical history behind these references.
Instead, we encounter someone at different times and decide whether we have met them before.
A familiar face, voice, choice of words, or way of speaking can support that judgment.
So can habits: visiting the same pub on Friday evenings, playing the piano, or frequenting particular places.
Several individually common characteristics can become distinctive in combination.
Recognition draws on what an entity does as well as how it appears.

Digital fingerprinting applies similar reasoning to [observable browser and device characteristics](https://www.w3.org/TR/fingerprinting-guidance/), such as window dimensions, available fonts, and rendering behavior.
These can help link separate visits to the same browser, even when the visitor supplies no name.
Other observations, such as recurring interests, vocabulary, and activity times, may help connect appearances across different accounts.
This continues my [earlier discussion of fingerprinting](../digital-civil-rights-privacy/#protection) and the [networking article's warning about correlating personas](../digital-civil-rights-networking-i/#a-word-of-caution): an observer combines clues to attribute separate observations to a continuing entity.
Recognizing a browser is evidence about its use; it does not by itself establish which person was operating it.

Shakespear's bookmarks are a local record of familiar places and interests.
A bookmark can remain entirely local, while opening the bookmarked page sends requests that the receiving service can observe.
Posts and conversations leave further traces.
Those activities can make habits observable without exposing the bookmark collection itself.
A digital "place" can therefore matter in two ways: as somewhere we exercise authority through an account, and as somewhere our activity leaves recognizable traces.

The same ability to connect observations supports both tracking and fraud detection.
A tracker can build a history around "the same visitor as yesterday" without learning a legal name.
A service can use an unfamiliar device or unusual behavior as a reason to ask for additional verification.
Such judgments remain uncertain: people change their habits and devices, and different people can resemble one another.

An impostor can copy Shakespear's name, portrait, and biography, hoping readers will attribute the new account's messages to the author they already trust.
This is the [unauthorized acting-on-behalf problem](../digital-civil-rights-privacy/#acting-on-behalf:-unauthorized-use-of-another-person%E2%80%99s-identity-for-malicious-purposes.) from my privacy article.
A *Hochstapler* can also deceive under their own name by inventing qualifications or claiming authority they do not possess.

[Coad's UML color model](https://www.informit.com/store/java-modeling-in-color-with-uml-enterprise-components-9780130115102) separates the participant, shown in green, from the role, shown in yellow.
A person can participate as an employee, customer, or owner, and change roles while remaining the same person.
Recognizing that person does not establish their qualifications or permission to act in a claimed role.
Similarly, a service accepting an article in Shakespear's name needs evidence that this particular publication is authorized.

### Turning Control Into Evidence

Shakespear's name and familiar writing style give readers reasons to recognize the author.
To accept a publication, a service needs evidence associated with an account or signing key it recognizes.
A **secret** supplies one basis for that evidence.
The password or private key is a value: copying it does not copy the person, but can let someone else produce evidence that the service accepts.
Its usefulness depends on restricting access and making guessing impractical.
A large space of possible secrets helps only when the chosen value is sufficiently unpredictable.

In an ordinary password login, the user submits the secret over an encrypted connection, and the service checks it against its account record.
The verifier should store a [salted, computationally expensive password hash](https://pages.nist.gov/800-63-4/sp800-63b.html), and limit repeated login attempts.
Remembering a secret keeps it out of casual view, but disclosure, phishing, or predictable choices can defeat that protection.
The service checks knowledge of the password; it cannot infer from that alone who supplied it.

Public-key signatures allow verification without giving the verifier the private key.
The signer uses that key to sign particular data; anyone with the corresponding public key can check the signature against those data.
For a publication, this binds the signed content to the key used.
For authentication, signing a fresh challenge lets the verifier check participation in the current exchange instead of accepting a recorded response from an earlier login.
Neither operation establishes a legal name or guarantees that the human author intended the action.

A **signer** puts a controlled interface around this use of a secret, as in the [trusted-signer pattern from the Nostr article](../publishing-nostr-basics/#the-trusted-signer-pattern).
The application sends a signing request and receives a signature; it need not receive the private key.
The secret is a stored value, and the signer is the process that uses it under particular rules.
An SSH agent, an OpenPGP agent, and a Nostr bunker all provide versions of this arrangement.
A software agent relies on the protection of its host, while secure hardware can make extracting key material substantially harder.
My [SSH hardware-key article](../openssh-fido2-hardwarekey/) and [OpenPGP agent-forwarding walkthrough](../openpgp-card-hardware-keys-remotely/) explore using these mechanisms, including access from another machine.
In either case, a program permitted to use the signer may cause harm without extracting anything.
Which requests the signer accepts therefore matters alongside where the key is stored.
This is the trust decision behind the [convenient local credential access proposed for Shakespear's workstation](#a-workstation-that-makes-separation-practical).

The familiar authentication factors describe conditions around that access: something we **know**, such as a password or PIN; something we **have**, such as an authenticator; and something we **are**, checked through biometrics.
A device can require a PIN or fingerprint before using its key.
The fingerprint is an observable characteristic, not a private cryptographic secret.
With local biometric verification, the remote service receives evidence from the authenticator rather than the fingerprint itself.

[Passkeys](https://fidoalliance.org/passkeys/) apply this arrangement to account login.
Through [WebAuthn](https://www.w3.org/TR/webauthn-2/), an authenticator signs a fresh challenge together with information binding the exchange to the service.
The browser and service check that context, which helps prevent a fake website from collecting a response usable at the real one.
Local user verification can require a PIN or biometric check.
Some passkeys remain bound to one device; others are deliberately synchronized across devices.
Their storage and recovery arrangements therefore differ, even though the receiving service verifies a public-key signature in both cases.
My [earlier discussion of credential portability](../quick-tip-nugget-backup-ios-passwords-and-passkeys-to-keepassxc/#rationale) raised the same concern: access should remain usable when we change the software or provider holding the credentials.

Federated login introduces another participant.
In a typical [OpenID Connect](https://openid.net/specs/openid-connect-core-1_0.html) login, an identity provider authenticates Shakespear and issues a signed assertion about the authenticated account to another service.
That service validates the assertion and trusts the provider's account of the authentication.
The provider signs its own statement; it is not acting as Shakespear's personal signer for an article.
This reuses an established login relationship while creating the provider dependency discussed in my [earlier treatment of social single sign-on](../digital-civil-rights-privacy-ii/#identity-and-credential-management).

Finally, accepted evidence must be matched to the requested operation.
[Hive's posting authority](../publishing-hive-basics/#several-authorities-instead-of-one-all-powerful-key), for example, permits publishing without granting the authority needed to transfer funds.
Shakespear can give a publishing tool that limited capability and keep other authority elsewhere.
The practical questions are which evidence is accepted, who can produce it, and what it permits-including who may replace a credential when access is lost.

### Who Can Sustain, Recover, or Interrupt an Identity?

Shakespear remains the same author after losing a device, but the services used for publishing may no longer accept the evidence the author can provide.
A recovery procedure decides what other evidence can restore control.
That decision is part of the account's authority structure: it determines who can replace the credentials on which future access depends.
Continuity here is partly institutional, because an operator or protocol defines which claims and procedures count.

This is the significance of the [skeleton keys discussed in my privacy article](../digital-civil-rights-privacy-ii/#identity-and-credential-management).
If a service accepts an e-mail link as sufficient authority to replace a password, control of the receiving mailbox provides another route into the account.
Where additional checks are required, the mailbox is one part of that route.
Its importance extends beyond correspondence: the mailbox and its own recovery arrangements participate in controlling every account that relies on it.

A service provider also has powers that the user does not obtain by holding a credential.
It may suspend an account, reject a recovery claim, or discontinue the service.
An operator acting against the user's interests may expose private records or alter pages it controls.
This is the [malicious service provider problem](../digital-civil-rights-privacy/#the-malicious-service-provider-problem): successful authentication cannot make the provider act faithfully.
Cryptographic signatures can make changes to signed material detectable, but they cannot compel an operator to serve that material or keep the service available.

Someone who steals Shakespear's credential gains technical capabilities without becoming the author whose work readers know.
Conversely, the author may continue under a new account or key after losing the old one.
An announcement through a surviving trusted presence, supported by established relationships and publication history, can help readers follow that transition.
Their recognition cannot restore a lost key or override a platform's rules, but it can sustain the persona beyond a particular account.

The [autonomy of our digital extensions](../digital-civil-rights-digital-integrity/#strong-ownership-guarantees-in-the-context-of-digital-integrity) therefore depends on more than successful login.
The Barbapapa limb reaches into machinery operated by others; losing access can interrupt a part of our activity even while we retain the intention and knowledge to carry it on.
Keeping usable copies of our work and accumulated state, and having ways to move to other services, gives us more control over that dependence.
It also leaves us with the responsibility of maintaining those copies and the relationships through which others can find us again.

For Shakespear, some of those relationships should be public.
The website, Nostr presence, Hive account, and public directory deliberately tell readers that these publications belong together.
Connections to the author's other life may need to remain separate.
A personal recovery mailbox or shared administrative account can create an association visible to a provider even when readers see only the pen name.
The intended separation must therefore include recovery and administration as well as ordinary publishing.

Like the database at the start of this appendix, Shakespear's initially simple setup acquires records, habits, dependencies, and relationships worth preserving.
[The persona configuration](#making-the-arrangement-explicit:-identity.yaml) can describe the arrangement, while [snapshots and backups](#preserving-the-presence-through-change-and-failure) preserve accumulated local state and external services hold other parts of the history.
Sustaining Shakespear means carrying that history forward through changes in devices, credentials, providers, and public addresses, with enough control to keep working and enough recognizable continuity for readers to keep following.
