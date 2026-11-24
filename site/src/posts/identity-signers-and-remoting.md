---
layout: "layouts/post-with-toc.njk"
title: "Signers and Remoting: From Local Agents to Browser Wallets"
description: "Keeping keys with signers and designing a browser wallet bridge for pak"
seodescription: "The signer pattern and a proposed browser wallet bridge for pak, with comparisons to password managers, Vault, and database proxies."
creationdate: 2026-11-23
keywords: signers, remote signing, browser wallets, SSH agent, GnuPG, passkeys, OIDC, authorization, Nostr, Hive, Beekeeper, Arweave, pak, Playwright, secret management, HashiCorp Vault, database proxies
date: 2026-11-23
tags: ['post']
---

## Rationale

While working through the recent articles about [Nostr](../publishing-nostr-basics/), [Hive](../publishing-hive-basics/), and [Arweave and AR.IO](../publishing-arweave-ario-basics/), I kept encountering the same architectural pattern under different names.
An application needed a signature, and another process or device held the secret and performed the computation required to produce it.

In Nostr, we used [`nak` to run a local bunker](../publishing-nostr-basics/#run-a-local-single-key-bunker-with-nak): a process that holds our private key and answers signing requests through the NIP-46 remote-signing protocol.
A compatible client can ask that bunker to sign an event and then publish the signed result.
We also encountered browser signers such as [nos2x](https://github.com/fiatjaf/nos2x) and the distributed signing arrangement behind [Promenade](../publishing-nostr-basics/#create-a-distributed-promenade-bunker).

In Hive, [Clive](https://github.com/openhive-network/clive) works with [Beekeeper](../publishing-hive-basics/#install-clive-and-start-beekeeper), a separate local wallet and signing service.
Clive constructs operations; Beekeeper supplies the signatures using keys held in its wallets.
The [Hive Keychain](https://hive-keychain.com/) browser extension provides another way for applications to request signatures with the appropriate account authority.

In the Arweave and AR.IO article, we reached the signer through the browser.
For [direct Arweave publication paid in AR](../publishing-arweave-ario-basics/#publish-directly-to-arweave-and-pay-in-ar), [Wander](https://www.wander.app/) signed the prepared transaction.
For [registering and updating an ArNS name on Solana](../publishing-arweave-ario-basics/#register-and-update-an-arns-name-directly-on-solana), [Phantom](https://phantom.com/) signed the Solana transactions.
Both workflows used a local HTTP server, JavaScript in the browser's developer console, and a downloaded signed result that the shell could validate and submit.
The wallet retained the private key throughout that exchange.

The Nostr article already introduced this as the [trusted-signer pattern](../publishing-nostr-basics/#the-trusted-signer-pattern).
To understand that pattern, I want to return to the [distinction between stored state and the processes that act on it](../identity-revisited/#what-keeps-an-entity-together?).

### Data vs. Physically Executing Process

A private key is data.
The code describing a signing algorithm is data too.
Even with the "code is data is code" duality, those stored descriptions need an active mechanism to execute them.
In my earlier [Turing-machine-head analogy](../digital-civil-rights-digital-integrity/#the-role-of-physical-processes), the head is where the machine's rules meet the symbols on its tape.
In an actual computer, physical circuitry executes instructions and transforms stored state.
**A signer is a physically executing process that receives requests, computes responses using its key material, and returns the results.**

A [Trezor](../openssh-fido2-hardwarekey/#additonal-remarks:) makes this distinction tangible.
A key file on USB storage supplies data that another computer can read and use.
A Trezor has its own processor and firmware: it understands a protocol, receives a signing request, performs the operation using its key material, and returns the result.
The device supplies both storage and the active mechanism that makes the stored secret useful.
Similarly, `ssh-agent` is a running process on a physical computer, with key material in memory and a socket through which clients communicate with it.
The stored program needs a running computer to provide that service.

### Localized Secret and Remote Signer Access (IPC)

This arrangement lets us use signing authority across distance while keeping the secret in a chosen place.
Copying a private key to another application gives that application the material needed to sign independently.
With a signer, we can keep the secret in a particular device or running environment and send requests to the process that holds it.
That process can apply its rules to each request and return a signature or signed object.
**The request travels to where the computation happens, and the result travels back; the secret can remain with the signer.**

An inter-process communication mechanism, or **IPC**, and a protocol provide the connection.
That connection might use a local socket, a device protocol over USB, a browser interface, or messages over a network.
It makes the executing process reachable from elsewhere, whether that means another process on the same machine, a container, or another physical device.

### Pattern Overview

Once I started looking for this combination of stored state, an active process, and a communication interface, I recognized it in many other places:

* **SSH authentication agents.** [`ssh-agent`](https://man.openbsd.org/ssh-agent) answers authentication-signing requests from SSH clients.
  The client reaches it through a socket, and agent forwarding can make that interface available in another environment.
  We have used this arrangement when [making the host's SSH agent accessible inside an Incus container](../incus-codex-jail/#the-better-full-replacement:-agent-jail-recursive-profile.yaml).
* **OpenPGP agents.** [`gpg-agent`](https://www.gnupg.org/documentation/manuals/gnupg/Invoking-GPG_002dAGENT.html) manages private-key operations for GnuPG clients and can also serve SSH clients.
  It is an existing example of one agent supporting more than one application protocol.
  My [GPG agent forwarding article](../openpgp-card-hardware-keys-remotely/) shows how to make a local agent available over SSH, including a Trezor-backed setup through `trezor-agent`.
  Remote applications can request signing and decryption while the hardware device remains attached to the local workstation.
* **Hardware wallets, smart cards, and security keys.** Devices such as Trezor, Ledger, YubiKey, and Nitrokey perform supported operations behind a device interface.
  My [SSH article](../openssh-fido2-hardwarekey/) explores this with hardware authenticators; smart-card and HSM integrations also use interfaces such as PKCS#11.
* **Passkeys and platform authenticators.** [WebAuthn](https://www.w3.org/TR/webauthn-3/) lets a website request an authentication assertion from an authenticator, which may be a security key, a phone, or part of the computer itself (for example, [Windows Hello](https://learn.microsoft.com/en-us/windows/win32/webauthn/-webauthn-portal)).
  The signed assertion is bound to the relevant relying party and authentication context.
  TPMs and secure elements provide further ways to keep key operations behind a hardware boundary.
* **Browser and mobile wallets.** MetaMask, Phantom, Wander, nos2x, and Hive Keychain expose signing capabilities to applications through their respective interfaces.
  Some wallets can also use a hardware device as their signing backend, adding another boundary behind the visible wallet interface.
* **Network signing services.** HSMs, network HSMs such as NetHSM, cloud key-management services, and systems such as [Vault Transit](https://developer.hashicorp.com/vault/docs/secrets/transit) let applications request cryptographic operations from a separate service.
  Certificate authorities and software-release signing services apply signing authority to certificates, packages, and other artifacts.
* **Distributed signers.** Threshold-signing systems such as the [FROST arrangement discussed in the Nostr article](../publishing-nostr-basics/#the-trusted-signer-pattern) distribute signing material among participants that cooperate to produce a signature.
  From the requesting application's perspective, that group can still provide one signing interface.

[OpenID Connect, or OIDC](https://openid.net/specs/openid-connect-core-1_0.html), belongs in this picture too.
In a conventional OIDC login, the identity provider authenticates the user and issues an ID token containing claims about that authentication.
With an asymmetrically signed token, the signer acts for the provider operating the service: **the provider signs its statement about the user**, and the receiving application checks it using the provider's public key.
The authority being exercised is therefore the provider's authority to make that assertion.
It is another instance of the signer pattern, with a different party making and signing the claim.

### Protocols

There are also protocols for reaching these authorities.
[WalletConnect](https://github.com/walletconnect) connects applications to compatible wallets, including wallets running on another device.
[Nostr Wallet Connect](https://nips.nostr.com/47) gives an application access to Lightning-wallet operations through encrypted messages over a relay.
Its interface extends beyond returning signatures to operations such as paying an invoice.
These examples connect signing to the broader idea of requesting an authorized operation from a component that controls the necessary secrets and resources.

### The Math

My starting intuition was that, in principle, **one signer ought to be enough for all these use cases**.
The [mathematics is sophisticated](https://livebook.manning.com/book/real-world-cryptography/chapter-7#94), but the number of cryptographic families behind these familiar systems is comparatively small: [RSA](https://livebook.manning.com/book/real-world-cryptography/chapter-7#125), [ECDSA](https://livebook.manning.com/book/real-world-cryptography/chapter-7#136), [Ed25519](https://livebook.manning.com/book/real-world-cryptography/chapter-7#169), and [Schnorr](https://livebook.manning.com/book/real-world-cryptography/chapter-7#54) signatures account for much of what we have encountered.
A service could support several algorithms, manage separate keys, and expose the interfaces that different applications expect.
GnuPG's combined OpenPGP and SSH agent already demonstrates part of that idea.

> **Quantum computing**
>
> A sufficiently powerful, fault-tolerant quantum computer could use Shor's algorithm to break RSA and the elliptic-curve algorithms mentioned here, including ECDSA, Ed25519, and Schnorr.
> An attacker could then recover private keys from public keys and forge signatures.
> [RFC 9958, section 3.2](https://datatracker.ietf.org/doc/html/rfc9958#section-3.2) explains this threat and why these systems need algorithms based on different mathematical problems.
>
> In my [ckenc experiment](https://github.com/cs224/ckenc), I explored post-quantum file encryption by combining CRYSTALS-Kyber with AES.
> Kyber is the basis of **ML-KEM**, standardized in **FIPS 203**, which establishes a shared secret for use with symmetric encryption.
> For digital signatures, **ML-DSA**, derived from CRYSTALS-Dilithium and standardized in **FIPS 204**, provides a quantum-resistant option.
> [NIST's announcement of these standards](https://csrc.nist.gov/news/2024/postquantum-cryptography-fips-approved) explains their respective roles.

### Authentication vs. Authorization

**Authentication establishes who is making a request.**
In our key-based examples, that means proving control of a key that the service associates with an account.
For example, the service sends a fresh challenge, my signer signs it, and the service checks the response against the account's public key.
The proof establishes control of that credential, which is how the service recognizes the account.

**Authorization determines what that requester is allowed to do.**
A publishing service might let me read every article, edit my own articles, and manage the profile belonging to my account.
Editing another author's work or changing their account would require additional permissions.
The service applies those rules after establishing who made the request.

The signer has its own permission decisions to make too.
Recognizing pak as a connected application can be a starting point for allowing it to sign publishing requests.
I might allow routine Nostr posts without another prompt while requiring confirmation for a payment.
Those decisions depend on the requested operation and the permissions I have granted the application.

Parts of authorization can be standardized.
[OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3), for example, defines a framework for granting limited access, with scopes describing the access requested and granted.
Applications can share that mechanism while defining permissions appropriate to their own resources, such as reading a profile or publishing an article.
The application-specific part is deciding which operations a requester may perform on which resources and under what conditions.

> **Where OAuth 2.0 Stops Short**
>
> For the authorization model I want, OAuth 2.0 does only half the job.
> It standardizes how applications request and receive delegated access, but leaves the permission vocabulary largely to the authorization server.
> [RFC 6749, section 3.3](https://www.rfc-editor.org/rfc/rfc6749.html#section-3.3) defines scopes as space-separated strings whose meanings the server supplies.
> A scope called `read` could mean reading a profile, reading documents, or reading every record in a database, depending on the service.
> I would like a common structure that makes the operation and its target explicit.
>
> My preferred starting point is **Subject-Predicate-Object**, or **SPO**: an authenticated subject wants to perform an operation on an object.
> For example, `Alice → read → file:X` identifies who is asking, what they want to do, and which file the request concerns.
> Authentication supplies the subject; authorization checks whether that subject has a grant covering the requested operation on that object.
> Alice might be allowed to read her own file X while being refused access to Bob's file Y.
>
> Microsoft's [Graph permission naming pattern](https://learn.microsoft.com/en-us/graph/permissions-overview#permissions-naming-pattern) provides a concrete step toward a more systematic vocabulary: **`resource.operation.constraint`**.
> The resource identifies a type of object, the operation describes what the application may do, and the constraint narrows the extent of access.
>
> | Microsoft Graph permission | What it permits |
> | --- | --- |
> | `User.Read` | Read the signed-in user's profile. |
> | `Application.ReadWrite.All` | Manage all applications in the tenant. |
> | `Application.ReadWrite.OwnedBy` | Create applications and manage those the calling application creates or owns. |
> <br>
>
> I think of this as a more elaborate **P-O** description, with the subject supplied separately by the authenticated context and the permission grant.
> With delegated access, an application acts on behalf of a signed-in user; with application access, the application acts under its own identity.
> The actual request identifies the particular object, such as file X.
> Knowing the subject and presenting a permission name still requires checking that the grant covers that object and operation.
>
> Graph's delegated permissions are themselves OAuth scopes, so this convention adds structure to the vocabulary used with OAuth.
> What I want to carry forward is that we can standardize more of the permission model: how we describe subjects, operations, objects, and constraints, and how we ask for an access decision.
> Applications would still define their resource types and actual grants, while sharing a way to express and evaluate requests.

A common signer could therefore share cryptographic implementations and request handling while applying the permission rules for each use.
Its adapters would also handle the different formats being signed, such as Nostr events and Solana transactions.
The receiving service or blockchain would enforce its own rules for accepting the signed operation.

### Signer Remoting for pak

For my publishing tools, there is a more immediate question: how does an application reach a signer that already exists?
Signing may happen in a host agent, a browser extension, a hardware device, or a service on another machine.
I use **signer remoting** here for making that signing capability accessible across a process, browser, container, device, or machine boundary.
The application needs a communication path to that process so that it can request operations while the secret remains where signing takes place.

This is the practical motivation for the article and for the **Publishing Army Knife**, or **pak**, introduced in [Identity Revisited](../identity-revisited/).
I want pak to use the wallets already available in my publishing environment.
The manual [Arweave](../publishing-arweave-ario-basics/#publish-directly-to-arweave-and-pay-in-ar) and [ArNS](../publishing-arweave-ario-basics/#register-and-update-an-arns-name-directly-on-solana) workflows give us a concrete starting point: prepare an operation in the shell, ask the browser wallet to sign it, bring back the signed result, validate and preserve it, and then submit it.

The architecture I envisage automates that exchange through a local signing bridge.
A Python component would manage requests and a persistent session; a browser page would connect those requests to wallet-specific JavaScript adapters.
I would open the page once and reuse it across publishing operations, with further interaction governed by the wallet's approval policy.
The bridge could be an independently usable library that pak consumes, with separate responsibilities for transport, session management, wallet access, and result validation.

This article will explore the general signer pattern and the common machinery behind its different implementations, then follow that practical path into signer remoting for pak.
We will examine how existing browser-signing bridges can supply fine-grained, composable parts for that architecture, and how to keep preparing, signing, and submitting an operation explicit as we make the workflow more convenient.

## Existing Bridges Between Command-Line Tools and Browser Wallets

The local-server-and-browser arrangement already exists in several projects.
They automate the hand-off we performed manually in the [Arweave](../publishing-arweave-ario-basics/#publish-directly-to-arweave-and-pay-in-ar) and [ArNS](../publishing-arweave-ario-basics/#register-and-update-an-arns-name-directly-on-solana) walkthroughs: a native program prepares a request, a browser page reaches the wallet, and a result returns to the waiting program.
The interesting question for pak is which parts we can reuse: request handling, communication with the browser, wallet adapters, and the lifetime of the connection.

Three projects provide particularly useful examples.

### nostr-browser-signer-proxy: A Persistent Nostr Bridge

The [Nostr browser-signer proxy](https://github.com/nostrdevkit/nostr/tree/master/signer/nostr-browser-signer-proxy) is a Rust library for using a NIP-07 browser signer from a native application.
A browser extension such as nos2x supplies the signer through `window.nostr`; the proxy makes that interface reachable by code running outside the browser.

Its [example program](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/examples/browser-signer-proxy.rs) closely matches the session I want for pak.
It starts the local server, prints its URL, waits until the browser page is participating, and makes several requests through the same proxy.
The example retrieves the public key, signs an event, constructs an encrypted gift wrap, and keeps running until interrupted.

The exchange works as follows:

1. The native application submits an operation to the proxy.
2. The proxy assigns a request identifier, queues the request, and waits for its response.
3. The browser page polls the server for pending requests.
4. JavaScript calls the corresponding `window.nostr` method, with approval handled by the extension.
5. The page posts the result or error with the same identifier, and the proxy returns it to the waiting caller.

The separation is visible in two small parts of the project: [the Rust implementation](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/src/lib.rs) manages pending requests, response matching, timeouts, and the HTTP server; [the browser JavaScript](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/proxy.js) translates requests into wallet calls.
The server defaults to `127.0.0.1:7400`.
The Rust side also verifies the returned Nostr event's signature before returning it to the caller.

For pak, the reusable foundation is that persistent request-and-response machinery and the browser's NIP-07 integration.
We could adapt the broker into Python while retaining and extending the browser JavaScript.
The Nostr operations would become one adapter behind a shared request interface.
The project's [README labels the library alpha](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/README.md), so a Python port or wrapper would need its own defined contract.

### browser-web3-signer: A Reusable Core and Wallet Adapters

[browser-web3-signer](https://github.com/nikicat/browser-web3-signer) provides a command-line tool and libraries for reaching browser wallets through a local HTTP bridge.
Its supported ecosystems include EVM networks, TRON, and Bitcoin, with wallet integrations such as MetaMask, Rabby, TronLink, Unisat, and Leather.

For example, its CLI can request a signature on a text message:

```bash
browser-web3-signer evm sign-message --message "A browser signing request" --json
```

The command opens an approval page, the browser invokes the selected wallet, and the result returns to the terminal.
The bridge binds to `127.0.0.1`.
Its documentation also describes printing the approval URL and forwarding the local port over SSH when the command runs on another machine.

The project's [architecture](https://github.com/nikicat/browser-web3-signer/blob/9317b89299f4db9ecb7c258add25353e5e2c7983/ARCHITECTURE.md) is particularly relevant to our idea of fine-grained, composable abstractions.
A shared Rust core owns pending requests, the HTTP bridge, and browser launching.
Separate crates supply the request types and wallet integration for each ecosystem.
The browser has a shared interaction layer and wallet-specific adapters too.

There is also a concrete route for calling it from another language.
The TypeScript and Go bindings supervise a `serve` child process and communicate with it through an HTTP control API.
A Python client could use that same process boundary while leaving the Rust implementation intact.
The [process-lifecycle decision](https://github.com/nikicat/browser-web3-signer/blob/9317b89299f4db9ecb7c258add25353e5e2c7983/docs/adr/0002-no-daemon-managed-serve-subprocess.md) distinguishes reusing a caller-owned bridge from running a shared daemon for several independent programs; the latter remains a separate, deferred design.

One browser-side behavior deserves particular attention: [completed-result delivery](https://github.com/nikicat/browser-web3-signer/blob/9317b89299f4db9ecb7c258add25353e5e2c7983/crates/browser-web3-signer-core/web/app-core.js#L189-L219).
Once the wallet returns a result, the page retains it so a failed delivery can be retried without asking the wallet to repeat the operation.
That distinction matters when an operation has already signed or submitted a transaction.

We also need to distinguish the operations themselves.
An EVM `send-transaction` request uses the wallet to submit the transaction and returns its hash; message signing returns a signature.
For pak's separate prepare, sign, and send stages, the adapter must return the kind of result that the particular workflow needs.
Keeping a bridge process alive also leaves the wallet's approval policy in force; session reuse alone does not establish unattended signing.

### request-wallet-sign: One Request In, One Result Out

[request-wallet-sign](https://github.com/escottalexander/request-wallet-sign) takes a compact approach aimed at agents and scripts.
A caller passes a JSON request to a Node.js command, which serves a browser page, waits for the wallet interaction, prints the result as JSON, and exits.

For a message-signing request, the interface looks like this:

```bash
npx request-wallet-sign '{"chainId":1,"message":"A browser signing request"}'
```

The JSON shape selects the operation: `message` requests personal-message signing, `typedData` requests typed-data signing, and a transaction-shaped request uses `eth_sendTransaction`.
The last operation submits through the wallet and returns a transaction hash.
A script or pak wrapper could consume the command's output as it would the result of another subprocess.

The [implementation](https://github.com/escottalexander/request-wallet-sign/blob/1d28a83fc69738111a3ffe55579ea80781c59c6f/bin/index.js) contains the request parsing, HTTP server, browser page, and result handling in one JavaScript file.
That makes it a useful small reference for the complete round trip.
Its normal signing command handles one request; reusing a queue and session for several pak operations would require additional machinery.

Its network arrangement also differs from the loopback-only bridge above.
The server listens on `0.0.0.0` and prints a same-network URL when one is available.
An optional Cloudflare tunnel supplies a public HTTPS URL for signing from another device.
These are distinct communication choices; a pak integration could retain the local bridge while choosing its own binding and connection policy.

### Reusing the Parts in pak

These projects give us concrete implementations to work with:

| Project | Particularly useful parts for pak |
| --- | --- |
| `nostr-browser-signer-proxy` | A persistent queue, request identifiers, response matching, and calls to NIP-07 browser signers. |
| `browser-web3-signer` | A reusable core, ecosystem adapters, a supervised subprocess interface, and retries that preserve a completed result. |
| `request-wallet-sign` | A compact JSON-in/JSON-out CLI and a small implementation of the browser round trip. |

For Python-based pak, reuse could mean 

* supervising an existing helper, 
* adapting its browser JavaScript, or 
* porting a small broker while preserving the request-and-response design.

We can make those choices per component.
The browser-facing adapters for Hive Keychain, Wander, and Phantom would then have to express their own operations through the chosen bridge.

## A Persistent Browser Signing Session for pak

I would bring these components together in a small Python library that pak can use to manage a browser signing session.
The browser would have a dedicated publishing profile, with the wallet extensions, accounts, and permissions configured for that publishing identity.
We could choose how to launch it: visibly when setting it up or interacting with a wallet, and headlessly for routine requests that the configured wallet can handle without further interaction.
One running session would serve a sequence of publishing operations.

### The Components

The proposed library would have a few separate responsibilities:

| Responsibility | Proposed implementation and starting point |
| --- | --- |
| **Queue requests and return their results** | Adapt the [Nostr proxy's broker](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/src/lib.rs) into Python, preserving request identifiers, waiting callers, and timeouts. |
| **Manage the browser and its profile** | Use [Playwright Python](https://playwright.dev/python/docs/api/class-browsertype#browser-type-launch-persistent-context) to start and stop a dedicated browser, open the signing page, and choose visible or headless operation. |
| **Connect requests to browser wallets** | Adapt the Nostr proxy's [browser JavaScript](https://github.com/nostrdevkit/nostr/blob/1d2c6b1aecab0bc657dc27a1374512260af380ba/signer/nostr-browser-signer-proxy/proxy.js), borrow selected [MetaMask integration code](https://github.com/nikicat/browser-web3-signer/blob/9317b89299f4db9ecb7c258add25353e5e2c7983/crates/browser-web3-signer-evm/web/evm.html), and add adapters for Hive Keychain, Phantom's Solana interface, and Wander. |
| **Handle wallet setup and unlocking** | Adapt wallet-specific lifecycle behavior from [walletwright](https://github.com/pedroapfilho/walletwright/blob/03ef0605234c4e5629a825009fc0d36e020c5529/packages/walletwright/src/internal/launch.ts), where useful, into the Python browser manager. |
| **Deliver completed results reliably** | Reuse the [completed-result handling pattern](https://github.com/nikicat/browser-web3-signer/blob/9317b89299f4db9ecb7c258add25353e5e2c7983/crates/browser-web3-signer-core/web/app-core.js#L189-L219) from browser-web3-signer: retain the result and retry its delivery without signing again. |
<br>

The Python helper process would own the request queue and browser lifecycle; the browser page would provide access to the extensions through their JavaScript interfaces.
The adapters would expose operations appropriate to each ecosystem, such as signing a Nostr event or a Solana transaction.
Pak's publishing modules would construct those operations, check the returned content, identity, and signature, preserve the signed artifact, and handle submission.

### Visible Setup and Headless Reuse

For a publishing profile such as Shakespear's, I envisage the following lifecycle:

1. **Open the profile visibly.** Start a dedicated browser window, configure the desired wallet extensions, and select the publishing accounts.
2. **Establish the connection.** Open the local signing page, connect the wallets, and grant the permissions intended for pak's requests.
3. **Preserve the profile.** Close the browser cleanly, retaining the profile directory and the state that each wallet stores there.
4. **Choose the mode for the next session.** Reopen the same profile visibly or headlessly, then reopen the local signing page and establish the connection to the broker.
5. **Reuse that connection.** Sign a profile update, an article, and an announcement through the same running browser session.

Playwright's `launch_persistent_context` provides the browser profile backed by a user-data directory.
Its [extension guide](https://playwright.dev/python/docs/chrome-extensions) also documents running extensions headlessly with Playwright's bundled Chromium and the `chromium` channel.
For this proposed integration, those are the browser capabilities we would build on; the browser and wallet versions would be chosen together when implementing it.

This preserves the profile's durable state and starts a fresh browser process.
The signing page reconnects, and each wallet resumes according to its own rules for stored permissions and unlocking.
A saved profile can retain wallet configuration while still requiring the wallet to be unlocked again.
Remembering permission to use an account and having an unlocked signing session are separate things.

The broker would keep a stable local origin so that the wallet can recognize the same application across sessions.
One browser process would own a given profile at a time.
Switching between visible and headless modes would mean closing that browser cleanly and relaunching the profile in the chosen mode.

The aim is to let already-authorized routine work proceed quietly while retaining a path back to interaction.
When a wallet needs unlocking or an operation needs approval, the library would report that to pak so that I can choose a visible session.
Wallet-specific automation of unlocking or approval would be a separate capability, governed by the permissions intended for that integration.

Walletwright's [wallet compatibility notes](https://github.com/pedroapfilho/walletwright/blob/03ef0605234c4e5629a825009fc0d36e020c5529/packages/walletwright/README.md#requirements-and-notes) report headless support for Phantom, while its MetaMask integration requires a display.
A browser running on a virtual display is another possible background mode for a wallet that needs a graphical environment.
For the publishing library, I would keep a durable operational profile, while borrowing the relevant startup and unlocking behavior from a framework designed around cached test profiles.

### Start with One Complete Nostr Workflow

The first integration would connect Python to the adapted Nostr broker, the browser page, and nos2x, then return a signed event for validation.
Several requests through the same open page would establish the persistent session.
Closing the visibly configured browser and reopening the profile headlessly would then establish which wallet state and permissions survive that transition.

Once that path works, we could add the MetaMask, Hive Keychain, Phantom, and Wander operations behind the same broker and browser lifecycle.
A helper process running the library could remain active across individual pak commands, allowing the next publishing operation to find the existing session.
That would make the browser signer a reusable part of the publishing environment, with its own profile and lifetime, while pak continues to prepare and process each publication explicitly.

## Conclusions

This article has been a quick introduction to the signer pattern and signer remoting, and a record of my current thinking about the pak work.
The proposed Python library, browser bridge, and persistent signing session give me a concrete place to start.

Real implementation will show how far this idea takes us.
Working with the actual wallets will reveal which parts can be shared, which assumptions hold, and where the design needs to change.

## Appendix

### Secret Managers and the Limits of Secret Delivery

Password managers and infrastructure secret stores often appear alongside signers in discussions about protecting credentials.
Their ordinary secret-retrieval interfaces do something different from the signing interfaces discussed in this article:

| Request | What the caller receives |
| --- | --- |
| Retrieve a password from a password manager. | The password, which the caller can use and potentially copy. |
| Read an API key or request database credentials from a secret store. | Credentials that the receiving application can use. |
| Ask a signer to sign a particular object. | A signature or signed object, with the private key remaining at the signer. |
<br>

All three involve active processes.
The distinction is what crosses the interface: the secret itself or the result of an operation using it.
A product can provide both kinds of interface, so we need to examine the feature being used.

#### Password Managers

A password manager gives a human a controlled way to store and retrieve secrets.
I unlock it, choose an account, and ask it to reveal, copy, or fill the corresponding password.
The encrypted store protects the recorded secrets while locked; the application makes them available when I authorize their use.
It also makes it practical to use a different, randomly generated password for each service.

This is useful control over storage and disclosure.
It does not make the system on which I use the password manager irrelevant.
When a password is filled into a website, the browser must handle it in a usable form.
Software with sufficient control over that browser or the operating system may be able to capture it.
The [KeePass security documentation](https://keepass.info/help/base/security.html) discusses both encrypted storage and the limits of protection against spyware on the machine where it runs.

The human remains part of this workflow: I decide when to unlock the manager and which entry to use.
That limits routine disclosure, but once a password has been released, locking the manager again cannot recall a copy held elsewhere.
Invalidating that copy requires changing the credential or revoking it at the service that accepts it.
An existing login session may also have its own lifetime and revocation mechanism.

In this password-retrieval role, the manager is not a signer.

Some password managers also provide signing features: the [1Password SSH agent](https://www.1password.dev/ssh/agent), for example, lets SSH clients request authentication signatures without reading the stored private key.
That feature does implement the signer pattern.

Passkeys stored in [Bitwarden](https://bitwarden.com/help/storing-passkeys/) also implement the signer pattern.
Bitwarden acts as an authenticator: it uses the passkey's private key to produce a signed WebAuthn authentication assertion for the website.
The website verifies the signature with the corresponding public key and does not receive the private key.

The same product can therefore release a website password through one interface and retain an SSH key or passkey behind a signing interface through another.

#### HashiCorp Vault and Similar Systems

With [HashiCorp Vault](https://developer.hashicorp.com/vault/docs/about-vault/what-is-vault), the client is often an automated workload: a container, a background service, or a job in a Kubernetes cluster.
There may be no human present to unlock a password manager or approve each retrieval.
Vault authenticates that workload and applies policies that determine which secrets or operations it may access.

**A database password delivered into a container is available to the application running there.**
The application can use or copy it.
Vault's secret-delivery features control its storage, issuance, distribution, and lifecycle; they do not hide the delivered value from the authorized recipient.
The database client still uses the database's authentication protocol.
If that protocol requires a password, moving the password's storage into Vault preserves that requirement.

Consider a publishing worker that needs read access to an article database.
One arrangement would distribute the same long-lived database password to every worker, perhaps through configuration files or environment variables.
With Vault's [database secrets engine](https://developer.hashicorp.com/vault/docs/secrets/databases), we could instead arrange this workflow:

1. **The worker authenticates to Vault.** In Kubernetes, it could use a service-account token issued by the cluster.
2. **Vault checks its policy.** This worker may request credentials for the article-reader role, with no permission to retrieve unrelated secrets.
3. **Vault creates credentials for that request.** The database role could grant read access to the required tables, with an illustrative lease of fifteen minutes.
4. **The worker receives and uses those credentials.** It connects to the database with the issued username and password.
5. **Vault manages the lease.** Depending on the configuration, the credentials can be renewed or replaced, or Vault can revoke them when the lease ends.

In this example, the worker receives a limited database credential instead of the more powerful credential Vault uses to provision database users.
Separate credentials also make it possible to distinguish workers by their database usernames.
[Leases and revocation](https://developer.hashicorp.com/vault/docs/concepts/lease) provide control over the credentials after issuance, through the backing service's credential-management mechanisms.
The exact revocation behavior, including its effect on existing connections, depends on that service and the integration.

This is where an automated secret manager can help: fewer long-lived shared credentials, narrower permissions, centralized rotation and revocation, and an identifiable recipient for each issuance.
When [audit logging is enabled](https://developer.hashicorp.com/vault/docs/audit), Vault can record its own authentication and secret-access requests.
Logging the application's later database queries remains a separate responsibility.

**Environment variables are one delivery mechanism, not the protection boundary.**
Vault's [Kubernetes Agent Injector](https://developer.hashicorp.com/vault/docs/deploy/kubernetes/injector) commonly writes secrets into files on a shared memory volume for application containers to read.
An application can also retrieve secrets through the API, and startup scripts can export retrieved values into environment variables.
In every case, the application receiving the usable value must be trusted with it.
Changing a password from an environment variable to a file does not prevent the authorized application from reading it.

The delivery choice still affects operational behavior.
Environment variables can be inherited by child processes or accidentally included in diagnostic output.
Mounted files can make updates easier to deliver, but the application must reread them and refresh its connections when credentials change.
For [Kubernetes Secrets consumed as environment variables](https://kubernetes.io/docs/tasks/inject-data-application/distribute-credentials-secure/), updates require a container restart to become visible.
A secret manager cannot refresh a running application's configuration merely by changing the centrally stored value.

There is also a difference between **issuing dynamic credentials** and **retrieving a stored static secret**.
Vault's key-value store, and comparable facilities such as [OpenBao's KV engine](https://openbao.org/docs/secrets/kv/), can return an existing password or API key.
Expiring the client's Vault token prevents further Vault access with that token; it does not invalidate a static password the client has already copied.
That password must be changed or revoked at the system that accepts it.
The lifecycle benefits of dynamic credentials depend on actually using an engine that manages those credentials.

The initial authentication to Vault also needs an explanation.
The [Kubernetes authentication method](https://developer.hashicorp.com/vault/docs/auth/kubernetes) checks the service-account identity against the cluster and maps it to configured Vault roles and policies.
This lets the deployment rely on a platform-issued identity instead of putting one shared Vault password into every container.
The platform-issued token is itself a credential that must be protected.
Vault, the identity provider or orchestrator, and the workload's execution environment remain parts of the trusted system.

A standalone Docker container needs its own authentication arrangement as well.
Running in a container does not itself give it a trusted identity at Vault.
If the deployment supplies a long-lived Vault token through an environment variable, that token is another secret the container can read.
Narrow Vault policies and limited token lifetimes can restrict its authority, but the token still needs protection.

An attacker who takes over the worker may read its delivered credentials and use its permitted Vault access to request more.
HashiCorp's own [security model](https://developer.hashicorp.com/vault/docs/internals/security) explicitly excludes protecting against compromised clients using the privileges associated with their Vault credentials.
I would describe this as **risk mitigation that can contain scope and duration, while retaining trust in the consuming workload**:

* **Scope containment.** A compromised worker's credential may permit reading one database, instead of administering every database.
* **Time limitation.** Short-lived credentials can limit the usefulness of a stolen copy. A compromised workload that can renew credentials or request replacements may retain access until its identity or permissions are revoked.
* **Avoiding some exposure.** Credentials need not be embedded in source code, container images, or deployment files.

What ordinary secret delivery cannot provide is **confidentiality of the delivered secret from its authorized recipient**.
Once the application receives the password, that application, and an attacker with sufficient control over it, can use or copy it.

Finally, Vault also offers an interface that changes the arrangement: the [Transit secrets engine](https://developer.hashicorp.com/vault/docs/secrets/transit).
Its [signing endpoint](https://developer.hashicorp.com/vault/api-docs/secret/transit#sign-data) can receive data and return a signature made with a named key.
With a supported signing key configured as non-exportable, the caller can request the operation while the private key remains inside the Vault service.
**In that role, Vault is a signer**, which is why Transit appeared among the earlier examples.
The isolation is from the calling workload; the Vault server itself still has to be trusted.

For pak, fetching a private publishing key from a secret store would deliver that key to the process that fetches it.
Asking a browser wallet or another compatible signing service to sign an object would keep the key behind that service's interface.
The caller still needs authority to request the operation, and a compromised caller could abuse the operations it is allowed to request.
The distinction is whether the workflow distributes the underlying key or provides controlled access to the process that uses it.

#### Database Proxies and Revocable Access

One related idea I have often considered is a database proxy that keeps the database password outside the application container.
A JDBC application, for example, could connect to a separate trusted proxy service that speaks the database's wire protocol.
The proxy would authenticate the container using its own temporary credential and authenticate to the database using a different credential that stays with the proxy.

```text
Container -- temporary proxy credential --> Proxy -- database credential --> Database
```

The application would receive permission to use the proxy, without receiving the underlying database password.
This resembles the signer pattern: a trusted process keeps the secret and exposes an interface through which another process can request operations using it.
Here, that interface provides database access rather than signatures.

My starting idea was to rotate the container's proxy password whenever a connection is lost and reestablished.
Each new connection would need a fresh credential, and the previous credential would no longer grant access.
The proxy could associate connections with individual containers and let an operator block a suspicious container during live operation.

There are three details I would want to make explicit in such a design:

* **Single-use admission.** A credential invalidated only after disconnection could be copied and used to open another connection before the first closes.
  A connection ticket consumed atomically when the proxy accepts it could prevent that reuse, although whoever presents a stolen ticket first might still obtain access.
* **Separate time limits.** A connection can remain open for a long time.
  The credential's admission deadline and the established session's lifetime need separate rules; neither should depend solely on the client eventually disconnecting.
* **Controlled replacement.** Reconnecting requires a way to obtain the next credential, using an independently established workload identity.
  Blocking the container must also block replacement credentials, or a compromised workload could simply request another one.

**Revoking a credential and terminating an authenticated session are separate operations.**
Changing a password may prevent another login while leaving an existing connection usable.
Vault's database secrets engine approaches this through database-specific credential management and configurable [revocation statements](https://developer.hashicorp.com/vault/api-docs/secret/databases/postgresql).
A proxy remains in the connection path and can track and close the sessions belonging to a blocked workload.
It also needs appropriate handling of associated backend queries and transactions; disconnection cannot undo changes that have already committed.
The workload must have no alternative route that bypasses the access boundary being enforced.

Existing systems implement substantial parts of this arrangement:

* **[AWS RDS Proxy](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-proxy.howitworks.html#rds-proxy-security).** In its standard IAM authentication mode, the application authenticates to the proxy using IAM, while the proxy retrieves database credentials from Secrets Manager and uses them to authenticate to the database.
  This separates the application's authentication from the database password, although it does not implement the exact single-use connection-ticket scheme described above.
* **[Teleport session and identity locking](https://goteleport.com/docs/identity-governance/locking/).** Teleport documents locks that reject new requests and terminate matching active database connections, among other session types.
  Locks can also target machine-identity bot instances.
  The documented locking feature is part of Teleport Enterprise and provides an example of withdrawing access during live operation.

The [AWS IAM database authentication documentation](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.html) illustrates why session control matters: its authentication tokens have a fifteen-minute lifetime, but token expiry does not affect a session after it has been established.
Short-lived authentication alone does not guarantee short-lived access.

Such a proxy and Vault could also work together: the proxy could obtain its database credentials from Vault while keeping them out of application containers.
The proxy would add an active enforcement point to the credential lifecycle managed by Vault.

This provides **credential isolation and a place to revoke ongoing access**, while still trusting the proxy and the identity system behind it.
The container can still misuse permitted database operations until access is withdrawn, and data already read cannot be recalled.
The underlying database password, however, need never be delivered to that container.

#### Limiting Secret Distribution and Controlling Access

The common principle I see is: **avoid distributing the underlying secret, and explicitly control what the alternative material or interface lets its holder do.**
A component can perform its role without possessing that secret.
This reduces what an attacker obtains by compromising the component or copying its stored data, although the remaining material or access may still be useful to the attacker.

Storing password hashes instead of passwords provides a useful comparison with the proxy and signer arrangements:

| Arrangement | What the component holds | What that enables |
| --- | --- | --- |
| Password verification | A stored, salted password hash | Checking whether a supplied password matches |
| Database application using a proxy | A temporary proxy credential | Accessing the database through the proxy |
| Signer client | Permission to access a signing interface | Requesting permitted signing operations |

<br>

The substitutes have different powers.
A stored password hash is a **verifier**: the service can test a supplied password without retaining the original password in its database.
As the [OWASP password-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) explains, stolen hashes can still support offline password guessing.
An appropriate password-hashing algorithm and work factor make each guess expensive; a sufficiently strong password makes recovery harder.
With ordinary password login, the running service still handles the submitted password during verification.
Hashing protects the stored record and does not remove the need to trust the process handling that login.

The proxy credential is instead a **limited access credential**.
It deliberately grants access through an intermediary, with a scope and lifetime that can be managed independently of the database password.
It need not be mathematically derived from that password.
A stolen copy may grant the same proxy access until it is consumed, expires, or is revoked, depending on the design.

Access to a signer is **permission to request operations**.
The private key can remain with the signer while a client requests signatures.
A compromised client might still request harmful signatures within its permitted authority, so the signer's rules and approval mechanism matter alongside keeping the key private.

The authentication protocol determines whether alternative material is itself sufficient to impersonate someone.
[Pass-the-hash attacks](https://attack.mitre.org/techniques/T1550/002/), for example, use stolen password hashes to authenticate in protocols that accept proof based on that material, without recovering the original password.
This differs from a service that stores a salted password verifier and requires the actual password at login.
**Keeping the original secret hidden and limiting the authority of its substitute are separate requirements.**

For a proxy credential or signing interface, I would therefore specify the permitted operations and resources, the identity allowed to use it, its lifetime, and whether requests or credentials can be replayed.
I would also specify how to revoke both future access and any established sessions or continuing permissions.
The comparison is about giving each component only what its role requires, while making the consequences of theft or misuse explicit.

### Hybrid Post-Quantum Key Exchange in TLS 1.3

TLS 1.3 provides a practical example of introducing post-quantum cryptography into an existing protocol.
During the handshake, the client and server negotiate a key-exchange group and establish the shared secret from which they derive the keys that protect their traffic.
The group **X25519MLKEM768** combines the established X25519 elliptic-curve exchange with the post-quantum **ML-KEM-768** mechanism derived from CRYSTALS-Kyber.
Both contribute a secret to the TLS key derivation.
The combination is designed to preserve the secrecy of the resulting keys as long as at least one of the two mechanisms remains secure.
[RFC 10024](https://www.rfc-editor.org/rfc/rfc10024.html) specifies this group and two related combinations.

Backward compatibility comes through TLS's existing negotiation mechanism.
A client can offer both hybrid and conventional groups, and the server selects a group that both support.
Two upgraded endpoints can therefore establish a hybrid shared secret, while an older endpoint can still connect using a conventional group when the configuration permits it.
That fallback retains conventional security.
[RFC 9954](https://www.rfc-editor.org/rfc/rfc9954.html#section-1.4) describes these compatibility goals and the construction behind hybrid key exchange.

OpenSSL **3.5** introduced built-in support for these groups and placed X25519MLKEM768 first in its default preference list.
For the commands below, use OpenSSL 3.5 or newer and check which TLS 1.3 groups your installation provides.
The [OpenSSL group documentation](https://docs.openssl.org/3.5/man3/SSL_CONF_cmd/) and the [list command](https://docs.openssl.org/3.5/man1/openssl-list/) describe these settings.

```bash
openssl version
openssl list -tls1_3 -tls-groups
```

Look for `X25519MLKEM768` in the group list.
Then use `s_client` to check a server, replacing `example.com` with the hostname you want to test.

```bash
openssl s_client \
  -connect example.com:443 \
  -servername example.com \
  -verify_hostname example.com \
  -verify_return_error \
  -tls1_3 \
  -groups X25519MLKEM768 \
  -brief
```

This offers only X25519MLKEM768, so a successful handshake demonstrates that both endpoints support the hybrid exchange.
The `-servername` option supplies the hostname through Server Name Indication (SNI), and `-verify_hostname` checks that the server certificate covers that name.
The `-verify_return_error` option makes certificate verification errors stop the handshake.
The `-brief` option prints a connection summary.
After reading it, press **Ctrl+D** to close the connection.
The [s_client documentation](https://docs.openssl.org/3.5/man1/openssl-s_client/) explains these options.

In a successful connection summary, look for TLS 1.3 and the negotiated group.
An illustrative excerpt is shown below.

```text
Protocol version: TLSv1.3
...
Negotiated TLS1.3 group: X25519MLKEM768
```

To allow conventional fallback, offer X25519 as well.

```bash
openssl s_client \
  -connect example.com:443 \
  -servername example.com \
  -verify_hostname example.com \
  -verify_return_error \
  -tls1_3 \
  -groups X25519MLKEM768:X25519 \
  -brief
```

With this second command, inspect the reported group to see what was actually selected.
A successful connection using X25519 alone has conventional key exchange.
The TLS 1.3 cipher-suite name, such as `TLS_AES_256_GCM_SHA384`, describes the symmetric protection and hash function and can accompany either exchange.

Key establishment and authentication also have separate roles.
The hybrid exchange protects recorded traffic against later decryption by a quantum computer, while the server can still authenticate using an RSA or ECDSA certificate and handshake signature.
Post-quantum authentication requires its own signature algorithms and certificate support.
The [scope of RFC 9954](https://www.rfc-editor.org/rfc/rfc9954.html#section-1.3) makes that distinction explicit.
For the signer discussion in this article, choosing the keys that sign a publication and protecting the TLS connection through which a client reaches a signer remain separate decisions.
