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

I suggest you start by understanding Nostr as a collection of protocol building blocks, so-called [NIPs](https://nips.nostr.com/), from which applications can be assembled.
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

### Install `nak`

`nak` is a command-line tool for creating and inspecting keys, constructing and signing events, talking to relays, and encoding Nostr identifiers. Its source code and releases are available here:

* https://github.com/fiatjaf/nak
* https://github.com/fiatjaf/nak/releases

The examples below were tested with `nak v0.21.2`. Pinning the version matters for a reproducible walkthrough because commands and defaults can change.

The shortest installation command is the project's installer:

```bash
curl -sSL https://raw.githubusercontent.com/fiatjaf/nak/master/install.sh | sh
```

For the exact version used here, you can instead download the official Linux x86-64 release artifact and verify the checksum before installing it:

```bash
nak_download="$(mktemp)"

curl -fL https://github.com/fiatjaf/nak/releases/download/v0.21.2/nak-v0.21.2-linux-amd64 -o "$nak_download"

printf '0acd56fea6ab1b9a0a68c8615670c6f8eff9e8878922442e387b94ee15266bb8  %s\n' "$nak_download" | sha256sum --check

install -d -m 755 "$HOME/.local/bin"
install -m 755 "$nak_download" "$HOME/.local/bin/nak"
rm -f "$nak_download"
```

Finally, check which executable the shell finds and which version it reports:

```bash
command -v nak
nak --version
```

> If `command -v nak` finds nothing after installation, `$HOME/.local/bin` is not yet on the shell's `PATH`.
> Add it to your PATH in your `~/.bashrc` or similar.

### Create a Key Pair and Derive Its Public Identity

A Nostr identity begins with a key pair, not with an account at a provider:

* The **secret key** creates signatures. Anyone who has it can act as the identity.
* The **public key** identifies the author and lets everyone verify those signatures.

Both keys commonly appear in two representations.
The protocol and command-line tools often use 64-character hexadecimal strings.
People usually exchange the NIP-19 encodings: an `nsec1...` string for the secret key and an `npub1...` string for the public key.
These are not four different keys.
Hex and `nsec` represent the same secret; public-key hex and `npub` represent the same public key.
The relevant encoding specification is [NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md).

#### Generate the key locally

Create a private directory, restrict its permissions, and let `nak` generate the secret directly into a file:

```bash
nostr_key_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nostr-by-foot"
install -d -m 700 "$nostr_key_dir"

(
    umask 077
    nak key generate > "$nostr_key_dir/identity.hex"
    chmod 600 "$nostr_key_dir/identity.hex"
)
```

`identity.hex` is the identity's unencrypted secret key. It should never be committed to Git, pasted into a website, included in a shell argument, or shown in a screenshot.
Before publishing anything under the identity, you should also make a tested backup in a suitable password manager or offline store.
If the only copy is lost, the identity is lost; if somebody copies it, the identity is compromised.

The public-key hex value can be derived whenever needed:

```bash
nak key public < "$nostr_key_dir/identity.hex"
```

The more recognizable `npub` form is only one additional encoding step:

```bash
nak key public < "$nostr_key_dir/identity.hex" | nak encode npub
```

Both results are public and may be shared. You can save them without creating another secret:

```bash
nak key public < "$nostr_key_dir/identity.hex" > "$nostr_key_dir/identity.pubkey.hex"
nak encode npub < "$nostr_key_dir/identity.pubkey.hex" > "$nostr_key_dir/identity.npub"
```

For completeness, the secret can also be displayed in its `nsec` form:

```bash
nak encode nsec < "$nostr_key_dir/identity.hex"
```

That command prints the full secret to the terminal.
Use it only when you deliberately need the NIP-19 form for a secure backup or a trusted signer.
An `nsec` is not a username or login token with limited scope; it conveys the same complete authority as the hexadecimal secret.

Similarly, a [NIP-05](https://github.com/nostr-protocol/nips/blob/master/05.md) name such as `author@example.org` can help people discover or verify a public key, but it is not the key itself.

#### The trusted-signer pattern

There are two basic ways for an application to create a signature.
It can read the private key and sign by itself, or it can send a signing request to a separate trusted process or device and receive the resulting signature.
The second arrangement creates a boundary around the private key:

```text
application  →  unsigned object or signing request  →  trusted signer
application  ←  signature or signed object          ←  trusted signer
```

This idea appears under many names in different ecosystems:

* SSH uses `ssh-agent`.
* OpenPGP commonly uses `gpg-agent`.
* Hardware wallets, smart cards, YubiKeys, HSMs, and managed signing services put the signer in a separate device or service.
* Hive uses signers such as Beekeeper or Hive Keychain.
* Nostr speaks of signers, browser signers, remote signers, and **bunkers**.

These tools follow a similar pattern, but they are not interchangeable.
Each understands particular key types, request formats, and signing protocols.
“Challenge-response” conveys the general intuition, although “signing request and response” is more precise: the application asks another component to sign a specific object.

A signer can itself have different internal structures:

* A **single-key signer**, such as a local `nak bunker`, holds the complete private key in one process or device.
* A **distributed threshold signer** divides the signing material into `n` shares held by different participants. In a `t`-of-`n` arrangement, at least `t` participants must cooperate; fewer than `t` cannot create a signature.

[FROST](https://www.rfc-editor.org/rfc/rfc9591.html), short for *Flexible Round-Optimized Schnorr Threshold*, is a protocol for the second arrangement.
Each selected participant produces a partial Schnorr signature, which a coordinator combines into one ordinary signature under the identity's existing public key.
To the requesting application and anyone verifying the result, the group can therefore look like a single signer.
No individual remote participant needs the complete private key during normal signing, although a threshold of participants can still collude.

The separation also does not make every request safe.
A compromised application may abuse an unlocked or unrestricted signer without ever extracting its key.
A useful signer therefore combines key isolation with visible approvals, narrowly scoped permissions, or enforceable policies.

#### Avoid giving every application the secret

In Nostr, [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) standardizes a remote-signing boundary and calls the remote signer a **bunker**.

A `bunker://...` string is a connection capability. It tells a client how to reach a signer and normally includes a connection secret. It is not the original `nsec`, but it is still sensitive: a client holding an unrestricted bunker capability may ask the signer to create valid events in your name.

#### Run a local single-key bunker with `nak`

`nak bunker` runs a [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) signer while keeping the full secret in that process. In this example, a subshell limits the lifetime of the environment variable; the key does not appear in the process's command-line arguments:

```bash
(
  IFS= read -r NOSTR_SECRET_KEY < "$nostr_key_dir/identity.hex"
  export NOSTR_SECRET_KEY

  exec nak bunker --qrcode --persist --profile by-foot wss://relay.damus.io wss://nos.lol
)
```

The process prints a connection URI and, with `--qrcode`, a QR code for clients that support [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md).
Treat both as secrets and do not copy them into an article, Git, logs, or screenshots.
The signer must remain running to answer requests.
This setup isolates ordinary clients from the key, but the machine running `nak` still has the complete key.

The relay addresses above are explicit transport choices for this example, not a claim that they are permanent or universally suitable. Relay selection is the next step of the experiment.

#### Create a distributed Promenade bunker

I set up my first Nostr identity via the <https://start.nostr.net/> website, which offers to create a [Promenade](https://pkg.go.dev/fiatjaf.com/promenade) bunker.
Promenade looks like a normal [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) bunker to the application using it.
Behind that single interface, however, it divides the signing capability among several remote signers.

During the one-time setup, my computer read the existing secret and divided it into three encrypted shares.
Each selected signer receives one share, which is not sufficient to sign anything by itself.
The setup component that performs this initial split is called the **trusted dealer** because it temporarily has access to the complete secret.

Promenade uses [FROST](https://www.rfc-editor.org/rfc/rfc9591.html), which was introduced above.
Its coordinator acts as the organizer: it receives a signing request, asks enough of the remote signers to participate, and combines their contributions into the final signature.
The application receives an ordinary signed Nostr event and does not need to understand those internal steps.

In the chosen **2-of-3** arrangement, no single remote signer can act alone.
Any two signers can cooperate to create a signature, so one signer may be unavailable without stopping the system.
The trade-off is that two colluding signers could also misuse the identity: Promenade distributes trust rather than eliminating it.

During the setup of my first Nostr identity via <https://start.nostr.net/>, the browser failed while subscribing for signer acknowledgements.
The bug report is here: [failed to get enough signers - ERROR: bad req: provided filter is not an object](https://github.com/dtonon/nstart/issues/42)

I created a workaround as the standalone [nostr-bunker-setup](https://github.com/cs224/nostr-bunker-setup) project accompanying this article.
It pins `promenade-trusted-dealer` 0.4.3 and `@nostr/tools` 2.16.2.

From the project directory, you should first install the dependencies and run its offline tests:

```bash
npm ci --ignore-scripts
npm test
node bunker.mjs help
```

You can then calculate the expected public identity, prepare a private state parent outside every Git checkout, and review an offline provisioning plan:

```bash
nostr_key_file="${XDG_CONFIG_HOME:-$HOME/.config}/nostr-by-foot/identity.hex"
nostr_npub="$(nak key public < "$nostr_key_file" | nak encode npub)"
nostr_state_parent="${XDG_CONFIG_HOME:-$HOME/.config}/nostr-bunker"

install -d -m 700 "$nostr_state_parent"

node bunker.mjs preview --key-file "$nostr_key_file" --expect-npub "$nostr_npub"
```

`preview` opens no network connection, creates no shares, signs nothing, and writes no state. It shows the exact coordinator, signer public keys, relays, threshold, dependency versions, and trust warnings.

Provisioning is a separate, explicit external write. Run it only after backing up the key and reviewing `config.json`:

```bash
node bunker.mjs provision --key-file "$nostr_key_file" --expect-npub "$nostr_npub" \
  --state-dir "$nostr_state_parent/attempt-1" \
  --key-backed-up \
  --accept-remote-signers \
  --accept-coordinator-ack-only
```

The attempt directory must not already exist.

> **On success, its mode-600 `connection.json` contains the private `bunker://` capability.**

Public output contains only a capability-free summary.
If a request times out then inspect the retained state instead of rerunning the operation blindly: a remote signer may have received a share even when its acknowledgement did not return.

Finally, you can test the resulting bunker without publishing the test event:

```bash
node bunker.mjs sign-check --state-dir "$nostr_state_parent/attempt-1" --confirm-remote-sign "$nostr_npub"
```

A distributed bunker changes the failure and trust model; it does not make impersonation impossible.
Two of the configured signers can cooperate, and possession of the unrestricted connection capability can authorize signing requests.

> **You should therefore protect the `bunker://` value like a credential even though it is not the original key.**

#### Browser signers: the password-manager analogy

Web clients often support [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md), a small browser interface exposed as `window.nostr`.
Instead of asking you to paste an `nsec`, the website asks a browser extension for the public key or a signature.

There are two useful variants:

* Extensions such as [nos2x](https://github.com/fiatjaf/nos2x) and [Alby](https://github.com/getAlby/lightning-browser-extension) can act as local browser signers. The web page receives signatures through [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) rather than receiving the private key.
* [Bunker46 Extension](https://bunker46.github.io/extension/) is a bridge: it exposes [NIP-07](https://github.com/nostr-protocol/nips/blob/master/07.md) to the website but forwards requests to a separate [NIP-46](https://github.com/nostr-protocol/nips/blob/master/46.md) bunker. The browser extension stores the connection and permission choices, not the identity's private key.

[Bunker46](https://bunker46.github.io/extension/) is therefore a natural front end for either a signer you operate yourself or another compatible bunker.

The password-manager comparison is helpful, but incomplete. A password manager normally returns a credential to a login form.
A Nostr signer performs a cryptographic action with lasting consequences.
You still need to inspect what a client asks you to sign, limit remembered permissions, and revoke application connections you no longer use.

### Select a Few Relays

For this first experiment you can use three public relays. `nos.lol` and `nostr.mom` currently advertise the same operator public key, so this provides three relay addresses but only two operator identities:

```bash
nostr_relays=(
  wss://relay.damus.io
  wss://nos.lol
  wss://nostr.mom
)
```

This is a practical starter set, not a permanent recommendation. Relays can change their policies, require payment or authentication, reject particular event kinds, limit message sizes, or disappear. You can inspect each relay's current information document without publishing anything:

```bash
for nostr_relay in "${nostr_relays[@]}"; do
  printf '\n%s\n' "$nostr_relay"
  nak relay "$nostr_relay"
done
```

The returned JSON describes the relay, supported NIPs, software, and advertised limitations. For your own selection you can research alternatives and current availability through:

* Nostr.watch: <https://nostr.watch/relays>
* Nostr Relays: <https://nostr.co.uk/relays/>

Using more than one relay gives the same signed event more than one storage and retrieval path. It does not guarantee permanent retention, universal visibility, or replication between those relays.

#### Add Relay Hints to the Public Identity

Now that you have selected some relays, you can combine their addresses with the public key in an `nprofile1...` value. [NIP-19](https://github.com/nostr-protocol/nips/blob/master/19.md#shareable-identifiers-with-extra-metadata) defines this as a shareable identifier carrying a public key and optional relay hints:

```bash
nostr_pubkey="$(<"$nostr_key_dir/identity.pubkey.hex")"

nostr_nprofile="$(
  nak encode nprofile \
    --relay wss://relay.damus.io \
    --relay wss://nos.lol \
    --relay wss://nostr.mom \
    "$nostr_pubkey"
)"

printf '%s\n' "$nostr_nprofile"
printf '%s\n' "$nostr_nprofile" > "$nostr_key_dir/identity.nprofile"
nak decode "$nostr_nprofile"
```

An `nprofile` is a portable locator, not another identity. The embedded public key is still the identity; the relay addresses merely tell a client where it might begin looking for that identity's events. They do not prove that the relays contain anything, require a client to use them, or replace a separately published relay list.

#### Publish the Profile Settings

The name is slightly misleading: an `nprofile` does not contain the profile settings shown by clients such as Primal or YakiHonne. It contains the public key and optional relay hints that help a client find the identity's events.

The actual profile is a signed **kind-0 metadata event**. Its `content` field contains a JSON object. [NIP-01](https://github.com/nostr-protocol/nips/blob/master/01.md) defines the core `name`, `about`, and `picture` fields. [NIP-24](https://github.com/nostr-protocol/nips/blob/master/24.md) documents additional widely used fields such as `display_name`, `website`, and `banner`.

Create the profile metadata as a normal JSON file:

```bash
cat > "$nostr_key_dir/profile.json" <<'EOF'
{
  "name": "cs224",
  "display_name": "cs224",
  "about": "Blogging enthusiast",
  "website": "https://weisser-zwerg.dev/",
  "picture": "https://weisser-zwerg.dev/android-chrome-256x256.png"
}
EOF
chmod 600 "$nostr_key_dir/profile.json"
```

The image is not embedded in the event. `picture` is a URL from which clients can load it.

Next, construct and sign the kind-0 event locally. As before, the subshell keeps the secret out of the command-line arguments and limits the lifetime of the environment variable:

```bash
(
  IFS= read -r NOSTR_SECRET_KEY < "$nostr_key_dir/identity.hex"
  export NOSTR_SECRET_KEY

  nak event --kind 0 --content @"$nostr_key_dir/profile.json" < /dev/null > "$nostr_key_dir/profile.event.json"
)
```

You can inspect both the event envelope and the JSON stored inside its `content` field before sending it anywhere:

```bash
jq . "$nostr_key_dir/profile.event.json"
jq -r '.content | fromjson' "$nostr_key_dir/profile.event.json"
nak verify < "$nostr_key_dir/profile.event.json"
```

`nak verify` prints nothing when the signature is valid and exits unsuccessfully when verification fails.

Finally, publish this **exact signed event** to the selected relays:

```bash
nak event --nevent wss://relay.damus.io wss://nos.lol wss://nostr.mom < "$nostr_key_dir/profile.event.json"
```

The relay addresses are repeated deliberately. This makes the publication command self-contained and prevents a new shell with an undefined `nostr_relays` array from silently printing the event without sending it anywhere. Successful output includes a connection and publication result for each relay.

Kind 0 is a replaceable event kind: clients normally use the newest profile event they can find for a public key. When you update the profile, publish a complete replacement containing every field you want to retain. A field omitted from the new event may disappear once clients discover it.

The relays may now hold both parts needed by a client: the kind-0 event containing the profile settings and other events published by the same public key. The `nprofile` value merely packages that public key with hints about which relays the client might query first.

#### Share the Public Identity

After publishing the profile event, you can share the identity in several useful forms. Read the saved `npub` and `nprofile`, then construct a browser-friendly link through njump (<https://njump.me/>):

```bash
nostr_npub="$(<"$nostr_key_dir/identity.npub")"
nostr_nprofile="$(<"$nostr_key_dir/identity.nprofile")"
nostr_njump_url="https://njump.me/$nostr_nprofile"

printf 'npub:     %s\n' "$nostr_npub"
printf 'nprofile: %s\n' "$nostr_nprofile"
printf 'njump:    %s\n' "$nostr_njump_url"
```

For the identity created while writing this article, the command produced:

```text
npub:     npub186p4s8lrfcaxs0yqqkkast4sqlswyf9myz5gwhkhjsfu9suq49uqj74xyc
nprofile: nprofile1qqsraq6crl35uwng8jqqttwc96cq0c8zyjajp2y8tmtegy7zcwq2j7qpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dsqs7amnwvaz7tmwdaehgu3wd4hk6vvahya
njump:    https://njump.me/nprofile1qqsraq6crl35uwng8jqqttwc96cq0c8zyjajp2y8tmtegy7zcwq2j7qpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dsqs7amnwvaz7tmwdaehgu3wd4hk6vvahya
```

You can open the resulting  public Nostr profile here: [cs224](https://njump.me/nprofile1qqsraq6crl35uwng8jqqttwc96cq0c8zyjajp2y8tmtegy7zcwq2j7qpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dsqs7amnwvaz7tmwdaehgu3wd4hk6vvahya).

These outputs serve different purposes:

* The `npub1...` value is the human-readable encoding of the public key. It identifies the same identity everywhere and contains no relay information.
* The `nprofile1...` value contains that public key plus relay hints, making it easier for a client to begin looking for the profile and other events.
* The `https://njump.me/nprofile1...` URL makes the Nostr identifier usable in an ordinary web browser. njump reads the identifier, queries relays, and renders the profile as a web page.

They are not three identities. The public key is the identity; `npub` and `nprofile` are encodings, while njump is one gateway for viewing Nostr data. If njump disappears, the `npub`, `nprofile`, signed profile event, and events stored by the relays remain usable elsewhere.

You can now put the `npub`, the more informative `nprofile`, or the njump URL on a website or in another public profile. Never publish the corresponding `nsec`, hexadecimal secret key, or private `bunker://` connection.

### Construct and Sign a Small Event Locally

For the first ordinary message, use a short public text note. Nostr represents this as a **kind-1 event**, as defined by [NIP-01](<https://github.com/nostr-protocol/nips/blob/master/01.md>).

First, save the message as plain text:

```bash
nostr_key_dir="${XDG_CONFIG_HOME:-$HOME/.config}/nostr-by-foot"
nostr_note_file="$nostr_key_dir/hello-note.txt"
nostr_event_file="$nostr_key_dir/hello-note.event.json"

cat > "$nostr_note_file" <<'EOF'
Hello, Nostr! I am learning how one signed event can be published to several relays.
EOF
```

Now ask `nak` to construct and sign the event:

```bash
(
  set -e
  IFS= read -r NOSTR_SECRET_KEY < "$nostr_key_dir/identity.hex"
  test -n "$NOSTR_SECRET_KEY"
  export NOSTR_SECRET_KEY

  nak event --kind 1 --content @"$nostr_note_file" < /dev/null > "$nostr_event_file"
)
```

No relay address appears in this command, so nothing is sent over the network. `nak` writes the completed signed event to `hello-note.event.json`.

Inspect it locally:

```bash
cat $nostr_event_file | jq .
{
  "kind": 1,
  "id": "f292825be64138d64e6b24f53700c4dab30ee0f331142fbb6d74d5c0052522f1",
  "pubkey": "3e83581fe34e3a683c8005add82eb007e0e224bb20a8875ed79413c2c380a978",
  "created_at": 1793075252,
  "tags": [],
  "content": "Hello, Nostr! I am learning how one signed event can be published to several relays.\n",
  "sig": "4dfca24d19fbd43dd27f39ed994fee4be09ce65ea491edccc7bb87723aad036096ba690313ee55bed3545389ba8830fff643e84090d0c2ff64e0f4126561633b"
}

# The pubkey is the hex version of the pubkey:
cat $nostr_key_dir/identity.pubkey.hex
3e83581fe34e3a683c8005add82eb007e0e224bb20a8875ed79413c2c380a978
```

The event now contains the message, its creation time, the author's public key, an event ID derived from all of its unsigned fields, and a signature created with the secret key.
The relay is deliberately absent: the signed event exists independently of any particular server.

Keep this file unchanged for the following steps.
Running the construction command again would normally produce a different `created_at`, event ID, and signature.
To demonstrate relay-independent transport, the next step will send this one already-signed event to several relays rather than constructing a new event for each destination.


