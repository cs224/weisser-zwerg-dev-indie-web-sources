---
layout: "layouts/post-with-toc.njk"
title: "Groupware: replacing Microsoft Exchange at home (on-prem)"
description: 'Or how a small family can run an "Exchange alternative" with open standards.'
# seodescription: "Run OpenAI Codex or Claude Code inside an Incus system container jail. Learn step by step setup with network ACLs and bind mounts to limit secrets and reduce supply chain attacks."
creationdate: 2026-02-26
keywords: groupware, Microsoft Exchange, Outlook, personal information management, PIM, SOGo, grommunio, iMIP (RFC 6047), iTIP (RFC 5546), CalDAV Scheduling (RFC 6638), iCalendar, processcalendar (RFC 9671)
date: 2026-02-26
tags: ['post']
---

## Rationale

If you want a fully self-hosted replacement for Microsoft Outlook and Microsoft Exchange (across its different incarnations), you will almost always end up looking at so-called groupware solutions.

A groupware stack consists of email (messages), calendaring (events + scheduling), contacts (address book), plus the glue that turns "a message containing an invite" into "a calendar event with accept/decline flows".

A standards-based ("open protocols") setup can deliver this, but the integration point can be either **client-driven** or **server-driven**, depending on which standards you choose and how your components are wired.
This difference between client-driven and server-driven is one of the key concepts in this post, and we will explore it in detail below.

**This is a concepts-only post**: the goal is to get the mental model right before touching implementation.

I plan two follow-up posts: first, implement [SOGo](https://www.sogo.nu) as an add-on to our existing [Mailu](../digital-civil-rights-mailu/) installation with client-driven meeting-request processing; second, add [grommunio](https://docs.grommunio.com/admin/introduction.html) for selected users to support server-side meeting-request processing.

This two-step approach is necessary because grommunio has a 5 user limit, and the solution I am aiming at is a known pattern ("split delivery" / "mailhub with multiple backends"):
treat Mailu's Postfix as the MX/gateway and routing authority, and treat grommunio as an internal delivery backend for a subset of recipients.
More on that in the follow-up posts.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Microsoft Exchange → Office 365 → Microsoft 365

Before we go deeper, it helps to align on names. In the Microsoft world, product names often refer to different layers at the same time: the underlying mail platform, the subscription bundle you buy, and the client app you use on your devices.

As a user, I had the feeling that Microsoft's email offering was renamed in one straight line from "Exchange" to "Office 365" to "Microsoft 365".
In reality, "Exchange" never disappeared.
Microsoft kept Exchange as the mail and calendaring platform, and later sold it as a cloud service inside various subscription bundles.

A useful mental model is to separate "what runs the mailbox" from "how it is sold":

* **Exchange Server** is the on premises software you install and operate yourself.
* **Exchange Online** is the Microsoft hosted service that provides Exchange mailboxes from Microsoft datacenters, and it is what most people use when they say "email in Office 365" or "email in Microsoft 365".

So on the server side you really have two parallel tracks: Exchange Server and Exchange Online.
Once you make that split, the branding becomes less confusing:
* Exchange Server: The classic on-premises mail server product (SMTP transport, mailbox databases, calendaring, etc.). It has existed since the 1990s and has continued to evolve through successive releases.
* Exchange Online: The Microsoft-hosted version of Exchange (mailboxes and related services operated in Microsoft datacenters). It became broadly mainstream through Office 365, and later Microsoft 365, which are primarily *subscription bundles* rather than a single email product.
* Office 365 vs Microsoft 365: These are packaging/branding umbrellas.
  Email is delivered by Exchange Online within those subscriptions; the bundle names changed over time for marketing and scope reasons (adding security, device management, Windows licensing, collaboration apps, etc.).
  Microsoft still uses both names in the market depending on the plan family.

"Exchange" is the server side platform (on premises or hosted), while "Outlook" is usually the user facing client brand (desktop, mobile, and web).

### Exchange and Microsoft 365 protocol standards

Exchange and Microsoft 365 expose several protocol families in parallel.
Which one matters depends on your client (Outlook desktop, mobile device, third party app) and on whether you use Exchange Server (on premises) or Exchange Online (cloud).

> Autodiscover, MAPI over HTTP, Exchange ActiveSync, and EWS are Microsoft documented protocols, not IETF RFC protocols.
> They usually run over standard HTTPS, but the request and response formats are Microsoft specific.

#### Discovery and configuration

Exchange clients typically start with service discovery:

* **Autodiscover** (Open Specifications id `'MS-OXDISCO'`) returns endpoints and configuration over HTTPS.

#### Outlook connectivity (classic Outlook mailbox access)

For Outlook in Exchange environments, the main mailbox protocol is MAPI:

* **MAPI over HTTP** (Open Specifications id `'MS-OXCMAPIHTTP'`) carries MAPI operations over HTTPS.
* **RPC over HTTP** (also called "Outlook Anywhere") is the legacy predecessor. For **Exchange Online**, it has been unsupported since **October 31, 2017**.

#### Mobile sync

Many mobile stacks use Exchange ActiveSync:

* **Exchange ActiveSync (EAS)** (Open Specifications id `'MS-ASCMD'`) syncs mail, calendar, contacts, and tasks over HTTP(S).
  * For **Exchange Online**, clients must speak **EAS 16.1 or newer** starting **March 1, 2026**.

#### Application and integration APIs

For server side integrations, two names matter:

* **EWS (Exchange Web Services)** is the long used SOAP over HTTPS API for mailbox data.
  * For **Exchange Online**, Microsoft plans a phased disablement starting **October 1, 2026**, with a final shutdown on **April 1, 2027**.
* **Microsoft Graph** is Microsoft's strategic API surface for Microsoft 365, and Microsoft provides EWS to Graph mapping guidance.

#### Internet mail and security standards (also used in Exchange environments)

Even in Exchange environments, email transport and message format are based on IETF standards:

* SMTP transport: [RFC 5321](https://www.rfc-editor.org/rfc/rfc5321)
* Message format: [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322)
* MIME: [RFC 2045](https://www.rfc-editor.org/rfc/rfc2045), [RFC 2046](https://www.rfc-editor.org/rfc/rfc2046), [RFC 2047](https://www.rfc-editor.org/rfc/rfc2047), [RFC 2048](https://www.rfc-editor.org/rfc/rfc2048), [RFC 2049](https://www.rfc-editor.org/rfc/rfc2049)
* Message submission: [RFC 6409](https://www.rfc-editor.org/rfc/rfc6409)
* STARTTLS for SMTP: [RFC 3207](https://www.rfc-editor.org/rfc/rfc3207)
* SMTP AUTH: [RFC 4954](https://www.rfc-editor.org/rfc/rfc4954)
* IMAP4rev2: [RFC 9051](https://www.rfc-editor.org/rfc/rfc9051)
* POP3: [RFC 1939](https://www.rfc-editor.org/rfc/rfc1939)

Common additional mail domain standards you will usually configure alongside Exchange:

* SPF: [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208)
* DKIM: [RFC 6376](https://www.rfc-editor.org/rfc/rfc6376)
* DMARC: [RFC 7489](https://www.rfc-editor.org/rfc/rfc7489)

On the authentication side, Exchange Online moved away from Basic authentication across multiple client protocols, and documents OAuth based approaches instead.

* OAuth 2.0 framework: [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749)
* Bearer tokens: [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750)

#### Scheduling interoperability (when leaving Exchange specific protocols)

When calendar invites leave the Exchange native protocol world and travel via email, they are usually expressed using iCalendar and iTIP semantics:

* iCalendar: [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)
* iTIP (scheduling semantics): [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546)
* iMIP (iTIP over email): [RFC 6047](https://www.rfc-editor.org/rfc/rfc6047)

## Personal Information Management (PIM)

PIM stands for "Personal Information Management".
PIM is an umbrella term for the user facing replacement of Outlook: the desktop, mobile, or web apps where people actually read mail, accept meeting invites, look up contacts, and manage tasks.

A PIM app typically handles the following data types in one place:

* email (messages and folders)
* contacts (address book)
* calendars (events and scheduling)
* tasks (to dos)
* notes, reminders, and search across all of the above

On Linux, there are three common PIM choices if you want an "Outlook like" workflow:

* [Evolution](https://gitlab.gnome.org/GNOME/evolution/-/wikis/home) (GNOME). It aims for a workflow that feels close to classic Outlook, with mail, calendar, contacts, and tasks in one integrated UI.
* [KDE Kontact](https://kontact.kde.org/) plus [Akonadi](https://kontact.kde.org/components/akonadi/). Kontact is the UI suite (KMail, KOrganizer, KAddressBook, and more). Akonadi is the background service that stores, caches, and indexes PIM data and exposes it to the apps.
* [Thunderbird](https://www.thunderbird.net/). Thunderbird is a strong mail client foundation, and it has integrated calendar and task features via its built in calendar component.

If you plan to use open standards based groupware, the protocol support of the PIM client becomes important:
* mail access usually means IMAP (and SMTP submission) or JMAP
* contacts sync usually means CardDAV
* calendar sync usually means CalDAV
* scheduling can be invite by email using iCalendar plus iTIP and iMIP, or CalDAV Scheduling

Not every client supports every protocol equally well, and some combinations require plugins or specific server side compatibility layers.

## Calendar State Management

In the Exchange world, Outlook is both a mail client and a scheduling client.
This matters because meeting invites can be processed either by the client or by the server.
In the client driven model, Outlook reads an incoming invite email, interprets the scheduling intent, then writes or updates the event in the calendar store.
In the server driven model, Exchange processes the invite during delivery, updates the calendar store immediately, and generates the outgoing replies and updates as needed.

The same distinction exists for self hosted setups.
Different stacks differ mainly in where this "invite processing" happens, and that decision affects reliability, automation, and which clients work well.

To make cross domain scheduling work, a set of conceptual steps must succeed.
Think of the list below as a checklist you can test against any setup, regardless of which server or client you use.

### Test matrix

1. **External → you (REQUEST)**
   * Does the invite appear in your calendar store even if you do not open a mail client?
   * Can you accept in a web UI, and does the external organizer receive a proper REPLY?
2. **You → external (REQUEST)**
   * Does the external attendee receive a proper invite email with an iCalendar payload?
   * If they accept using buttons in their mail client, do you:
     * receive an iMIP REPLY email, and
     * see attendee status updated in your calendar store?
3. **Update and Cancel flows**
   * Are SEQUENCE increments handled correctly?
   * Are updates applied to the existing event rather than creating duplicates?
4. **Conflict detection**
   * If there is a time conflict, is the conflict detected?
   * Is the correct kind of response sent back for conflicts, where supported?

Under the hood, scheduling is state management over time.
An event is not just a date and a title.
It is a shared object with identifiers and versioning rules, typically including UID, SEQUENCE, DTSTAMP, ORGANIZER, ATTENDEE, and participation state such as PARTSTAT.
Update and cancel flows are correct only if the processing rules are applied consistently, including rules for duplicate suppression and "newer wins" decisions.

All of the steps above must happen somewhere, but there are only two practical places where they can be implemented:
* **Client side processing** means your mail client must also be a scheduling client. It must understand invite emails, turn them into calendar changes, and generate correct replies.
* **Server side processing** means the server processes meeting requests at mail delivery time. In practice this is "server side iMIP ingestion": 
  mail arrives → server processes meeting request → calendar state changes without relying on a desktop client → outgoing replies or updates are generated without requiring a desktop client to be running.

### Open Standards and Open Protocols

"Open standards" means IETF RFC style documents and widely implemented interoperable protocols.
This matters because Exchange solves groupware as a tightly integrated product, while a self hosted setup usually combines several components that need a shared protocol language.

If we describe groupware in protocol terms, we usually end up with three data planes plus a scheduling layer that ties them together:

* **Mail**: messages and folders
* **Calendar**: events, recurrence, attendees, free busy
* **Contacts**: address book entries
* **Scheduling glue**: rules that turn "an incoming invite message" into "calendar state changes and replies"

#### Baseline protocols: mail, calendar, contacts

Mail is still built on the same Internet standards that Outlook and Exchange also speak:

* SMTP transport: [RFC 5321](https://www.rfc-editor.org/rfc/rfc5321)
* SMTP Submission (client to server sending): [RFC 6409](https://www.rfc-editor.org/rfc/rfc6409)
* Message format: [RFC 5322](https://www.rfc-editor.org/rfc/rfc5322)
* MIME bodies and attachments: [RFC 2045](https://www.rfc-editor.org/rfc/rfc2045) to [RFC 2049](https://www.rfc-editor.org/rfc/rfc2049)
* Mailbox access: IMAP (IMAP4rev2) in [RFC 9051](https://www.rfc-editor.org/rfc/rfc9051), and optionally POP3 in [RFC 1939](https://www.rfc-editor.org/rfc/rfc1939)

Calendar storage and synchronization is typically done via CalDAV, with iCalendar objects as the payload:

* CalDAV (calendar store and sync): [RFC 4791](https://www.rfc-editor.org/rfc/rfc4791)
* iCalendar (event object format): [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)
* Common MIME type for event objects: `'text/calendar'`

Contacts storage and synchronization is typically done via CardDAV, with vCard objects as the payload:

* CardDAV (contacts store and sync): [RFC 6352](https://www.rfc-editor.org/rfc/rfc6352)
* vCard (contact object format): [RFC 6350](https://www.rfc-editor.org/rfc/rfc6350)

> LDAP often appears in self hosted deployments, but usually for identity and directory lookups, not for end user contact sync.
> A common pattern is LDAP for accounts and groups, CardDAV for personal contacts, and CalDAV for calendars.

With IMAP plus SMTP for mail, CalDAV for calendars, and CardDAV for contacts, you already have a functional setup.
What is still missing is consistent scheduling behavior.

#### Scheduling building blocks: iCalendar plus iTIP, then transport

Scheduling interoperability is easiest to reason about if you split it into three layers:

1. **Data model**: iCalendar defines the event object and its fields.
2. **Workflow semantics**: iTIP defines what a scheduling message means.
3. **Transport binding**: how those scheduling messages are delivered.

The core standards are:

* **iCalendar** (the data model): [RFC 5545](https://www.rfc-editor.org/rfc/rfc5545)
* **iTIP** (scheduling semantics such as `'REQUEST'`, `'REPLY'`, `'CANCEL'`, `'COUNTER'`): [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546)

Once you have iTIP, you still need to choose a transport. Two transports show up in most real deployments:

* **iMIP**: iTIP carried over email, usually as a MIME `'text/calendar'` part inside a normal message: [RFC 6047](https://www.rfc-editor.org/rfc/rfc6047)  
  This often becomes client driven: the mail client receives the invite email, interprets it, and updates the calendar store when the user interacts with it.
* **CalDAV Scheduling**: iTIP carried via CalDAV endpoints, enabling server mediated scheduling and "implicit scheduling": [RFC 6638](https://www.rfc-editor.org/rfc/rfc6638)  
  This is server driven by design **inside a scheduling domain**. It works when both organizer and attendee are hosted on servers that participate in the same scheduling environment.

There are designs for cross domain scheduling over HTTP, but they are not widely deployed.
In practice, cross domain scheduling is still most commonly done via iMIP because email already crosses domains reliably.

#### Optional inter-domain path: iSchedule (and why iMIP is still the default)

A protocol family called **iSchedule** defines server-to-server transport for iTIP over HTTP, with DNS SRV based discovery and a dedicated scheduling endpoint model (often described as "iTIP over HTTP" across domains).

Relevant standards context:

* **iTIP** scheduling semantics: [RFC 5546](https://www.rfc-editor.org/rfc/rfc5546)
* **DNS SRV** records used for service discovery patterns: [RFC 2782](https://www.rfc-editor.org/rfc/rfc2782)
* **iSchedule** itself was standardized as an Internet-Draft but did not publish as an RFC: [draft-desruisseaux-ischedule](https://datatracker.ietf.org/doc/draft-desruisseaux-ischedule/)

In practice, this remains an optional path, not a baseline Internet assumption:

* deployment is limited compared to SMTP and iMIP
* many domains do not publish or operate the required discovery and endpoint model
* operational policy and authentication handling is more complex than plain mail transport

So the pragmatic pattern is:

1. Prefer iSchedule when the remote domain explicitly supports it.
2. Fall back to iMIP for universal cross-domain reach.

#### processcalendar and iMIP ingestion at delivery time

If you choose an iMIP based approach but want "calendar updates without opening a client", you need server side iMIP ingestion during mail delivery. Conceptually this means:

1. Detect a message that contains iTIP content, typically a `'text/calendar'` MIME part.
2. Apply the iTIP method to the calendar store using processing rules that avoid duplicates and respect sequence updates.
3. Generate outgoing iMIP replies or updates when required.

The relevant standards piece here is:

* **processcalendar**: a [Sieve](http://sieve.info/) extension for processing calendar objects and scheduling messages during mail filtering and delivery: [RFC 9671](https://www.rfc-editor.org/rfc/rfc9671)

`processcalendar` does not "enable cross domain scheduling" by itself.
Cross domain scheduling is already possible via iMIP because email crosses domains.
`processcalendar` defines a standard way to process iCalendar and iTIP content at mail delivery time, which helps implement reliable server side iMIP ingestion and consistent update and cancel handling.

In a Mailu style setup, the natural integration point is the delivery pipeline, for example via Dovecot's Sieve support when mail is delivered via LMTP or LDA.

#### Anti-abuse controls for server-side iMIP ingestion

If you process calendar messages automatically at delivery time, treat iMIP input as untrusted until policy checks pass.
The goal is not only protocol correctness, but also abuse resistance.

At minimum, define and enforce these controls:

* **Trust boundary and spoofing resistance:** Validate sender authenticity using your normal mail-auth stack (SPF, DKIM, DMARC policy context) before allowing scheduling side effects. Do not treat a calendar MIME part alone as proof of organizer identity.
* **Authentication and authorization checks:** Confirm that the claimed organizer and attendee mapping is allowed for your domain policy (for example, who is allowed to create, update, or cancel events for a mailbox/resource).
* **Replay and duplication handling:** Use idempotent processing keyed on identifiers like UID plus METHOD plus SEQUENCE and message identity, so retried or replayed messages do not repeatedly mutate calendar state.
* **Rate limiting and abuse throttling:** Cap auto-processing throughput per sender/domain/mailbox and degrade to manual review or mailbox-only delivery when behavior looks abusive.

Without these controls, delivery-time automation can be turned into an attack surface (spoofed cancellations, repeated updates, or state churn).

#### Mixed-transport policy: CalDAV Scheduling plus iMIP

If your environment uses both CalDAV Scheduling (RFC 6638) and iMIP (RFC 6047), define one strict policy so events are not processed twice.

At minimum, lock down these rules:

* **Invite authority rule (who may send scheduling mail):** Choose one authoritative sender path per event flow. Either clients send iMIP invites, or the server sends them, but not both for the same organizer/workflow.
* **UID and SEQUENCE rule (state convergence):** Treat UID as the event identity and SEQUENCE as the version gate. Older or equal SEQUENCE updates must not overwrite newer calendar state.
* **Double-send prevention:** When a scheduling action is emitted via one channel (CalDAV scheduling outbox vs iMIP mail generation), suppress emission on the other channel for that same transaction.
* **Double-ingest prevention:** When the same logical update arrives through multiple paths, process it idempotently and apply it once.

In short: one authority for sending, one canonical event identity/version policy, and idempotent ingest across transports.

#### Why many setups still use ActiveSync

Even when you aim for open protocols, mobile client support is uneven.
Some environments prefer one protocol that covers mail, calendar, and contacts on phones.
That is why some groupware stacks offer **Exchange ActiveSync** as an optional compatibility layer, for example SOGo.

ActiveSync is not an IETF standard. The trade off is usually practical: CalDAV and CardDAV where clients support them well, and ActiveSync where it reduces client side friction.

## Four Real-World Architecture Patterns

If you have requirements similar to this post, most self-hosted setups converge on one of four patterns.
In practice, the main decision is:

* do you accept mostly client-driven iMIP behavior, and
* is Outlook-native behavior a hard requirement?

### Pattern 1: Standards-first groupware, accept mostly client-driven iMIP

This is the most common home and small-team path.

* Run a DAV-first groupware layer (often SOGo, sometimes Nextcloud DAV) on top of SMTP and IMAP mail.
* Let clients do most invite processing for cross-domain iMIP.
* Accept that web UI calendar state may lag until a client processes certain invite flows, unless you add extra server-side automation.

Why people choose it: minimal moving parts, good interoperability, and enough scheduling behavior for many real-world setups.

### Pattern 2: SOGo plus Classic Outlook via a CalDAV/CardDAV sync connector

This is the common compromise when Outlook must stay in daily use but you want a standards stack.

* Mail stays IMAP plus SMTP Submission.
* Calendar and contacts are synchronized through a connector.
* You enforce strict anti-duplication policy: one scheduling authority, one UID/SEQUENCE policy, and explicit double-send suppression.

Why people choose it: preserves an open-protocol backend while keeping Outlook usable, at the cost of connector tuning and operational discipline.

### Pattern 3: Suite with built-in server-side iMIP ingestion

This is the path when "mail-driven scheduling automation" is required and client dependence is not acceptable.

* Use a groupware suite that already implements inbound iMIP ingestion, de-duplication, and policy controls in the server calendar subsystem.
* Treat invite processing as a server feature, not a client side workflow.

Why people choose it: consistent server-driven behavior in web and mobile clients without custom glue. Trade-off: heavier platform and often commercial support/licensing models.

### Pattern 4: Outlook-native requirement, use Exchange-protocol-compatible groupware

This is the path when Outlook should behave like it does with Exchange.

* Use a stack that exposes Outlook-native protocol compatibility (for example, grommunio class systems, or suites with dedicated Outlook connectors).
* Keep standards protocols where useful, but do not force CalDAV semantics onto Outlook as the primary model.

Why people choose it: strongest Outlook parity for scheduling, free-busy, and shared mailbox workflows. Trade-off: more stack complexity and less purely standards-first architecture.

In the rest of this post, SOGo-centric designs mostly map to Pattern 1 or Pattern 2, while grommunio maps to Pattern 4 (and can overlap with Pattern 3 when server-side invite processing is enabled).

## SOGo Groupware Server

[SOGo](https://www.sogo.nu) is a groupware server that is designed to reuse existing infrastructure instead of replacing it.
In particular, it sits in front of an existing mail stack and adds the groupware layer: a web UI, shared calendars, shared address books, and client interoperability via standard protocols.

The [SOGo installation](https://www.sogo.nu/files/docs/SOGoInstallationGuide.html) guide states this explicitly: SOGo reuses existing IMAP, SMTP, and database servers, and supports CalDAV, CardDAV, GroupDAV, iMIP, and iTIP.

### Where SOGo fits in a Mailu based setup

If you already run [Mailu](../digital-civil-rights-mailu/), Mailu remains the mail platform:

* Postfix continues to handle SMTP reception and delivery.
* Dovecot continues to provide IMAP mailbox access.

SOGo is added next to that stack. It connects to Mailu's IMAP and SMTP services and exposes groupware features on top, including a webmail UI and DAV endpoints for calendars and contacts.

A practical deployment pattern is to run SOGo as a separate `docker-compose` project and attach it to the same Docker network as Mailu.
This keeps Mailu's internal services reachable for SOGo without changing Mailu's role as the "mail hub".

> This modularity is a strong point for incremental setups.
> You can first get mail correct and reliable (MX, SMTP, DKIM, backups, spam filtering, IMAP access), then add groupware later as a separate component.
> If you remove SOGo again, Mailu continues to work as before because mailbox storage and SMTP routing remain unchanged.

### What SOGo needs from your existing stack

SOGo's architecture assumes it will plug into four existing service types: database, directory or user source, SMTP, IMAP.

In a Mailu setup, the wiring usually looks like this:

* **IMAP**, for reading and managing mailboxes  
  The SOGo configuration uses `SOGoIMAPServer`, and it supports URI forms such as `imaps://host:993` or `imap://host:143/?tls=YES`.
* **SMTP**, for sending mail from the web UI and for emitting scheduling mail (iMIP) and notifications  
  SOGo can send via an SMTP server when `SOGoMailingMechanism` is set to `smtp`, using `SOGoSMTPServer`.
  For sending user mail, this is SMTP Submission (often port 587) rather than port 25. Port 25 is server to server transport.
* **ManageSieve**, optional but useful, for server side mail filtering rules managed from the UI  
  SOGo can be pointed at a ManageSieve endpoint using `SOGoSieveServer`, with URL forms such as `sieve://host:4190/?tls=YES`.
* **A relational database**, required, for calendars, contacts, tasks, and user preferences  
  The guide states that SOGo requires a relational database to store appointments, tasks, contacts, and user preferences.
  In practice, this is usually a dedicated PostgreSQL or MariaDB instance for SOGo data, separate from any mail related databases.

### Authentication and user sources: how SOGo knows your users

SOGo does not automatically inherit Mailu accounts.
It needs an explicit authentication source.
In practice, the two common approaches are:

* **LDAP**, if you already use it for identities.
* **SQL**, if your mail stack already stores users in SQL and you want SOGo to read the same dataset.

For SQL authentication, the guide is specific: `SOGoUserSources` can point to a SQL view or table via `viewURL`, and that view must expose required columns such as `c_uid`, `c_name`, `c_password`, `c_cn`, and `mail`.

> There are some password handling details you have to keep in mind here.
> `c_password` can be plain text, `crypt`, `md5`, or `sha` encoded, and SOGo can be configured with a default `userPasswordAlgorithm`.
> Passwords can also carry an explicit `{scheme}` prefix, which is useful when your existing stack stores Dovecot compatible password schemes.

### Canonical identity mapping across Mailu, SOGo, and grommunio

Whether you use LDAP or SQL, the critical requirement is a canonical identity map across all components.
Without that, organizer and attendee resolution becomes unpredictable.

In practical terms:

* the same primary email address must represent the same person/mailbox in Mailu routing, SOGo user sources, and grommunio mailbox definitions
* aliases should map to one canonical primary identity for scheduling decisions
* organizer and attendee addresses in iCalendar data should resolve to that same canonical identity model

If this mapping drifts, you get failures that look random: replies attached to the wrong organizer identity, attendees treated as external when they are local, and inconsistent free-busy or participation state.

### ActiveSync support: why it matters for phones and tablets

SOGo supports many clients via CalDAV and CardDAV, and it also supports Microsoft ActiveSync for mobile device synchronization.

ActiveSync matters if you want one account configuration on mobile devices that covers mail, calendar, contacts, and tasks without relying on separate CalDAV and CardDAV setup flows.

### The scheduling drawback: client driven meeting request processing

SOGo can participate in standards based scheduling (iCalendar, iTIP, iMIP), but it does not give you the same server side meeting request processing model that Exchange provides.

Practically, this means that meeting requests are processed at the edges:

* an invite arrives as an email (iMIP)
* an e-mail client interprets it and updates the calendar
* replies are generated by the e-mail client, not by the mail delivery pipeline

This is a drawback if you want "mail arrives and the calendar updates automatically" without relying on a particular client being used.

> This is the same distinction as in the previous section: iMIP can be processed client side or server side.
> If you want server side processing, you need either an iMIP ingestion component at delivery time (for example via a Sieve based approach such as processcalendar in [RFC 9671](https://www.rfc-editor.org/rfc/rfc9671)), or a groupware server that implements server side meeting request processing as a product feature.

Because of this, you need at least one mail and calendar client in your environment that can do reliable iMIP processing and send correct replies. On Linux, the usual candidates are:

* [Evolution](https://gitlab.gnome.org/GNOME/evolution/-/wikis/home)
* [KDE Kontact](https://kontact.kde.org/)
* [Thunderbird](https://www.thunderbird.net/)

If your goal is "Exchange like" behavior where invites affect calendar state even when no user opens a mail client, SOGo alone will not give you that.
It remains valuable for webmail, CalDAV and CardDAV endpoints, sharing, and for ActiveSync compatibility, but scheduling automation is limited by the client driven model.

### Why SOGo is still a good step in an incremental build

If you want to evolve toward a home "Exchange alternative", SOGo fits well as a modular step:

1. First, build a reliable mail platform with Mailu (SMTP, IMAP, spam filtering, backups).
2. Then add SOGo alongside it to gain webmail and standards based groupware without replacing the mail core.
3. Only later decide whether you need server side scheduling behavior and, if so, introduce a component that provides it for selected users.

This incremental path matches how many home setups are built: start with mail correctness, then layer groupware features as separate modules, while keeping the ability to change only one layer at a time.

### Outlook as a client in an open standards setup

If you want to keep Microsoft Outlook on Windows as your daily client, you can still use a standards based groupware backend, but you need to be explicit about what Outlook can and cannot do without connectors.

#### Classic Outlook for Windows: mail works, CalDAV and CardDAV need a connector

Classic Outlook can connect to Mailu using IMAP for reading mail and SMTP Submission for sending.
That covers the mail plane, but it does not give you CalDAV and CardDAV based calendar and contact sync.
Outlook does not natively support CalDAV, so you need a plugin for CalDAV based calendars.

For CalDAV and CardDAV, the common approach is to add a third party sync connector, most often [Outlook CalDav Synchronizer](https://caldavsynchronizer.org/), which provides two way sync for calendars and contacts and lists SOGo as a compatible server.

In practical terms, the "Outlook plus open standards groupware" recipe is:

* Use Classic Outlook with IMAP and SMTP Submission for mail.
* Use a CalDAV and CardDAV sync connector to keep Outlook calendar and contacts in sync with the server.
* Optionally still use SOGo's web UI as a fallback for calendar and contact management.

#### New Outlook for Windows: limited for this use case

The newer Outlook for Windows currently does not support COM based add ins, which makes the typical CalDAV and CardDAV connector approach unavailable.
Microsoft support content and Microsoft Q and A threads about CalDAV in new Outlook point users back to Classic Outlook for CalDAV scenarios.

#### Scheduling: Outlook can still participate, but the sync boundary matters

Even without CalDAV native support, Outlook can still handle the email based scheduling layer to some degree because iMIP invites are normal emails with an iCalendar attachment using the `'text/calendar'` MIME type.
Outlook can display these messages and can generate replies.

The catch is calendar state.
Without a CalDAV sync connector, accepted invites and attendee state changes can stay inside Outlook's local calendar store, which means other devices and server side views do not automatically converge.
With a connector in place, those calendar changes can be synchronized back to the CalDAV server, so that SOGo web, DAV clients, and other devices see consistent state.

> Outlook plus a sync connector is still a client driven model: an invite arrives in the mailbox, Outlook processes it, then the connector synchronizes the resulting calendar change to the CalDAV backend.

## grommunio

[grommunio](https://docs.grommunio.com/admin/introduction.html) is a groupware stack that targets "Exchange compatible" behavior, including native interoperability with Microsoft Outlook.
The administrator documentation describes a modular, component based deployment model that can run on a single host or across multiple hosts.

Compared to a pure CalDAV and CardDAV setup, the key difference is protocol coverage.
grommunio exposes Exchange style client protocols such as RPC over HTTP and MAPI over HTTP, and also provides IMAP, POP3, SMTP (including Submission), CalDAV, CardDAV, EWS, and Exchange ActiveSync.

### Why it is interesting in this post

In the previous section, SOGo was a good modular way to add groupware, but it keeps you in a mostly client driven scheduling model.
grommunio is interesting because it can move closer to Exchange like behavior, especially when Outlook clients are involved.

Under the hood, grommunio's core groupware server component is gromox.
The gromox project describes itself as a "drop in replacement for Microsoft Exchange" and lists connectivity options including MAPI over HTTP and EWS, plus an SMTP speaking local delivery agent.

### The 5 user limit and the "selected mailbox" idea

grommunio markets its Community plan as "maximum 5 users" (see [pricing](https://grommunio.com/pricing/)).

> A [community thread](https://community.grommunio.com/d/1862-lizenz-license-community-edition) discusses that the limit is tied to using the precompiled packages.

Because of that, a practical home pattern is to use grommunio only for a small set of mailboxes that really need Outlook native behavior or server side scheduling features, and keep other family mailboxes on the lighter standards based path.

### Mailu can stay the gateway while grommunio handles only some mailboxes

The important idea is to treat Mailu's Postfix as the MX and routing authority, and treat grommunio as an internal delivery backend for a subset of recipients.
This is a direct match to how Postfix is typically used as a mail router: you can map recipients to different delivery transports and next hops using transport maps.

A workable mental model is:

1. All inbound mail arrives at Mailu (MX, anti spam, anti malware, SMTP policy).
2. Mailu decides the mailbox backend per recipient.
3. Mailu delivers either to Mailu's local mailbox store, or forwards to grommunio as the next hop.

You can implement the "deliver to grommunio" hop using SMTP or LMTP as the delivery protocol, depending on how you expose grommunio's delivery endpoint internally.
Postfix supports both SMTP and LMTP transports, and transport maps can point to a specific transport and destination.

For outbound mail from the grommunio users, one common approach is to relay through Mailu as well.
This keeps one consistent outbound identity and policy layer (DKIM signing, rate limiting, reputation management) while still allowing grommunio to provide the groupware experience for those users.
You keep one gateway that holds the public facing responsibilities (MX records, TLS policy, spam filtering, deliverability), and you swap or add mailbox backends behind it without changing DNS or exposing new public services.

#### Operational guardrails for split delivery (must-have)

For this pattern to stay reliable and safe, three controls are non-negotiable:

* **Recipient validation at SMTP time (backscatter prevention):** Mailu must reject unknown recipients during SMTP, not after queueing, so your gateway does not generate backscatter for undeliverable addresses.
* **Explicit loop prevention:** Define and test "do not route back" rules between Mailu and grommunio so forwarded traffic cannot bounce between backends and create "too many hops" failures.
* **Strict single-owner mailbox routing policy:** Each mailbox must have exactly one authoritative backend at any time (Mailu or grommunio), with Mailu acting as the single routing source of truth.

> If both backends consider the same recipient local, you get ambiguous delivery, duplicates, and loop risk.
> Enforce ownership and routing consistency first, then move individual mailboxes.

### Server side meeting request processing in gromox

grommunio does not advertise this as "RFC 6047 iMIP processing" on the front page, but gromox does contain an explicit server side meeting request autoprocessing capability in its local delivery path.

The grommunio man page for `exmdb_local` documents an option called `lda_mrautoproc` with the description "Perform meeting request autoprocessing".
The same text notes that the feature is currently experimental and that it requires `lda_twostep_ruleproc` to be enabled.

In terms of the earlier mental model, this is the practical equivalent of server side iMIP ingestion:

* an invite arrives as an email with a `'text/calendar'` part
* processing happens during delivery
* the calendar store can change without relying on a desktop client being open

> If you use Outlook with grommunio via MAPI over HTTP, the client experience can look like Exchange because Outlook interacts with a server side calendar store directly.
> The "meeting request autoprocessing" part becomes important when invites arrive by email and you want delivery time automation, for example for shared mailboxes, resource mailboxes, or "accept without opening a client" behavior.

### Where grommunio fits in an incremental build

This leads to an incremental approach that matches a home environment:

1. Keep Mailu as the stable mail gateway for the whole domain.
2. Add SOGo for standards based webmail, CalDAV, CardDAV, and ActiveSync, where client driven scheduling is acceptable.
3. Add grommunio behind the same Mailu gateway for a small set of users that need Outlook native protocols or more Exchange like server side behavior.

This keeps changes localized. You can move one mailbox at a time by changing routing at the gateway, without redesigning the full mail setup, but only after the split-delivery guardrails above are enforced.

## Migration Reality: moving without breaking daily workflows

This post is concepts-first, but migration details determine whether the design survives real usage.
In practice, treat migration as three separate data moves with different tools and verification:

1. **Mail migration** (message history and folder structure): move mailbox data first, then verify sent/received paths and folder parity.
2. **Calendar, contacts, and tasks migration**: migrate PIM data with explicit checks for recurrence, attendee state, contact fields, and task status/due dates.
3. **Scheduling behavior migration**: validate invite lifecycle semantics (`REQUEST`, `REPLY`, `CANCEL`) after data migration, not before.

### Recommended migration order

1. Stabilize target mail transport and authentication (Mailu SMTP/IMAP, client login policy, DKIM/SPF/DMARC already correct).
2. Migrate mail history.
3. Migrate calendars and contacts (and tasks if used).
4. Configure clients/connectors and identity mapping.
5. Run scheduling validation tests for internal and external attendees.
6. Cut over users in small batches, then monitor and only then retire old paths.

### Pre-cutover verification checklist

Before declaring cutover complete, verify at least:

* **Mail:** message counts are within expected tolerance per folder; sent mail uses the intended submission path; aliases and forwarding rules behave as designed.
* **Calendar:** recurring events render correctly; attendee lists survive migration; updates and cancellations target existing events rather than creating duplicates.
* **Contacts:** important fields (multiple emails, phone numbers, notes, groups) survive round trips across your primary clients.
* **Tasks (if used):** status, due date, and recurrence fields survive sync and edits.
* **Scheduling semantics:** external `REQUEST` arrives and becomes actionable; `REPLY` returns to organizer; `CANCEL` removes/updates the correct event instance.
* **Cross-client consistency:** web UI, mobile, and desktop clients converge on the same calendar/contact state after sync cycles.
* **Rollback readiness:** you still have a tested rollback path and recent backups for mail plus calendar/contact stores.

## Conclusion

Replacing Exchange at home is less about finding one magic product and more about choosing where scheduling state is processed.
If you keep that single design question explicit, architecture decisions become much easier:

* If client-driven iMIP is acceptable, a standards-first stack (Mailu + SOGo + capable clients) is usually enough.
* If Outlook-native behavior or delivery-time invite automation is required, add an Exchange-compatible backend such as grommunio for selected mailboxes.

The practical migration strategy is incremental:
keep one stable mail gateway, enforce strict routing ownership, move data in phases, and validate scheduling semantics before each cutover step.
Done this way, you can improve groupware behavior without risking daily mail reliability.
