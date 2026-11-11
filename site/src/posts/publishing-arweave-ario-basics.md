---
layout: "layouts/post-with-toc.njk"
title: "Arweave and AR.IO from First Principles: Permanent Storage, Gateways, and Names"
description: "Understanding Arweave and AR.IO as a permanent publishing ecosystem"
seodescription: "A practical introduction to Arweave and AR.IO: permanent data, the permaweb, gateways, ArNS names, and their role in independent web publishing."
creationdate: 2026-11-10
keywords: Arweave, AR.IO, independent publishing, permanent storage, permaweb, ArNS, gateways, decentralized storage, blockchain publishing, content preservation
date: 2026-11-10
tags: ['post']
---

## Rationale

In [Nostr from First Principles](../publishing-nostr-basics/) and [Hive from First Principles](../publishing-hive-basics/), I explored two systems that can extend the publishing reach of an independently operated website with distribution, discovery, and conversation.
Both point broadly in the direction of publishing, but they approach it at very different levels of abstraction.

Nostr offers fine-grained protocol building blocks: cryptographic identities, signed events, relays, and a growing collection of NIPs that applications combine into different experiences.

Hive is much more specific.
Its shared blockchain and social data model already understand accounts, posts, comments, votes, communities, rewards, and governance.

In this blog post, we will look at **Arweave** and **AR.IO**.

Arweave is often discussed in connection with the *permaweb*, permanent websites, and durable publishing.
But at its foundation, Arweave is much closer to **naked storage**.
It does not need to know whether a piece of data is an article, an image, an application, or something else.
It stores data and makes that data addressable.

AR.IO belongs in the picture because it provides gateway access, indexing, routing, and naming around the data stored on Arweave.
Within AR.IO, **ArNS** is the human-facing naming layer, much as the Domain Name System (DNS) provides human-facing naming for IP addresses.

Like the two earlier articles, this one approaches the ecosystem by foot.
It starts with Arweave's storage model, follows data from a local file into a permanent transaction, and then examines how AR.IO gateways and names turn those stored bytes into something that can be found and read on the World Wide Web.

## From Arweave to AR.IO and AO

Arweave began with one narrow purpose: permanent information storage.
The network stores data, and its native **AR** token pays for that storage and supports the miners that maintain it.

> Unlike Hive, the base protocol does not need to understand articles, comments, communities, names, or websites.

The surrounding ecosystem gradually added higher layers closer to Hive's building blocks.
SmartWeave (<https://github.com/ArweaveTeam/SmartWeave>) introduced smart contracts.
AO later added an actor-oriented computation model.
AO-Core subsequently introduced a more modular protocol architecture, and [HyperBEAM](<https://github.com/permaweb/HyperBEAM>) is its primary Erlang-based implementation.
AO serves a purpose somewhat similar to that of the Ethereum Virtual Machine (EVM), although its process-and-message architecture is quite different from a single shared Ethereum-style virtual machine.

> AO-Core is best understood as a newer, more modular architecture for AO; HyperBEAM implements that architecture.

AR.IO used AO to run the changing state behind its gateway registry and ArNS naming system.
The **ARIO** token was a separate token for participating in the AR.IO network, staking behind gateways, and managing names.
During that time, an ArNS name was controlled by a so-called ANT process on AO, while the publication to which it pointed remained immutable data on Arweave.

> **ANT means *Ar.io Name Token*; historically, it meant *Arweave Name Token*.**<br>
> An [ANT](<https://docs.ar.io/learn/arns/ants/>) is the transferable control object associated with an ArNS name.
> In the current Solana architecture it is a Metaplex Core NFT whose owner can transfer the name and manage its DNS-like records, metadata, and controllers.
> Those records point to Arweave transaction identifiers; the ANT is neither the stored publication itself nor a token used to pay for its storage.

In 2026, AR.IO moved this protocol execution from AO to Solana.
It seems that the decision had several motivations, but important drivers were instability in AO during its HyperBEAM migration, along with Solana's performance, low transaction costs, existing business relationships, and strong NFT ecosystem.
ANTs became Solana NFTs, ARIO became a Solana SPL token, and SOL became necessary for transaction fees.
The files themselves did not move: AR.IO gateways still serve data stored on Arweave.

AR.IO's platform decision and current migration documentation explain that boundary in detail:

* <https://github.com/ar-io/ar-io-solana-contracts/blob/develop/docs/DECISIONS.md>
* <https://docs.ar.io/build/run-a-gateway/manage/solana-migration/>

## Turbo

The practical interface we will use is the [Turbo CLI](<https://github.com/ardriveapp/turbo-sdk>), provided by the `@ardrive/turbo-sdk` package.

Turbo is a kind of front end and abstraction layer for Arweave and AR.IO and introduces its own "currency": **Turbo credits**.
Turbo accepts signed data, arranges its submission to Arweave, handles the underlying storage payment, and returns an identifier and receipt.
Its CLI gives us one convenient interface for checking prices and balances, funding an account, uploading data, and working with related AR.IO services without needing to deal with all the underlying components separately.

> Turbo credits are a prepaid balance with the Turbo service, not AR, ARIO, SOL, or another freely transferable network token.  
> They can be funded through supported cryptocurrencies or conventional payment methods and are consumed when Turbo performs paid operations on our behalf.

The resulting map is therefore:

* **Arweave + AR:** permanent storage and its native payment token.
* **AO + $AO:** a separate computation ecosystem built around Arweave; no longer AR.IO's execution backend.
* **AR.IO + ARIO + SOL:** gateways, incentives, and ArNS state coordinated through Solana.
* **Turbo + Turbo credits:** a managed upload and payment layer, accessed by the CLI we will use below.

These are connected layers, not successive names for the same blockchain or currency.

## Paying Once for Permanent Storage

With Arweave, there is no monthly bill to keep an uploaded file alive.
Instead, you pay for the upload once; a small part of that payment rewards the immediate inclusion of the data, while most of it enters a shared storage endowment from which miners can be paid over time.

> The payment is not a personal escrow account attached to one file; it contributes to the economics of preserving the weave as a whole.

The protocol cannot know what a hard disk, electricity, or an operator's time will cost centuries from now.
It therefore starts with a deliberately conservative approximation.
The [Arweave lightpaper](<https://www.arweave.org/files/arweave-lightpaper.pdf>) describes the upload price as the present cost of keeping **20 replicas for 200 years**.

The 200 years are not meant as an expiry date.
They supply the margin behind the claim of indefinite storage.
If the combined cost of storage hardware, electricity, and operation falls by only 0.5% per year, the infinite sequence of future annual costs is:

```text
1 + 0.995 + 0.995² + 0.995³ + ... = 200
```

In other words, 200 years of storage bought at today's cost can, under that assumption, finance storage "forever".

> The lightpaper calls this decline the *Kryder+ rate* and contrasts the required 0.5% with an estimated historical average of approximately 38.5% per year over the preceding 50 years.
> That large difference is intended as a safety margin, including room for changes in the value of AR.

This is the remarkable part of Arweave's model: the original publisher does not need to renew a subscription.
Miners continue to compete for current rewards, and the endowment is available when the other block rewards and transaction fees are not sufficient to cover the protocol's calculated storage cost.

Turbo hides much of this from us.
We can buy Turbo credits in a convenient currency and spend those credits on an upload, but Turbo ultimately arranges the underlying payment and submission to Arweave.

## Learning It by Foot

The preceding sections explained the roles of Arweave, AR.IO, Turbo, and ArNS.
I will now walk through the complete end-to-end process "by foot", using a deliberately small static website and the Turbo command-line interface.

To show how an unchanged file such as `style.css` can be reused in later versions of `index.html`, the example will contain two related files rather than putting everything into one HTML document:

* `index.html`, containing the page structure and text;
* `style.css`, containing a small amount of presentation styling.

The two files will be stored as separate immutable objects.

An Arweave manifest then maps their permanent identifiers to the familiar paths `index.html` and `style.css`, allowing the HTML document to refer to the stylesheet with an ordinary relative link.

We will publish the first version twice in order to compare two paths.
In the manual path, we will upload each file and construct the manifest ourselves.
In the directory path, Turbo CLI's `upload-folder` command will upload the files and construct the manifest for us.
These paths deliberately create separate immutable objects even though their file contents are initially identical.

We will then change only `index.html` and repeat both paths.
In the manual path, we will explicitly create a new manifest that points to the new HTML object and the original CSS object.
In the directory path, repeating `upload-folder` will upload both files again and construct another manifest: Turbo CLI 2.2.0 does not automatically reuse unchanged files.
Both first versions will remain available under their original manifest identifiers.
Comparing the second versions will show the difference between explicitly reusing an existing object and uploading the whole directory again.

The complete experiment will proceed as follows:

**Prepare the tools and identities**

1. Install the Turbo CLI and inspect its configuration without uploading anything.
2. Explain the wallet roles: upload signer, public address, free-allowance identity, Turbo credit holder and payer, funding source, and ArNS owner.
3. Identify the MetaMask Solana account, register `weisser-zwerg`, and verify its ANT ownership and controller permissions.
4. Create the separate Arweave JWK upload identity, derive its public address, and inspect its Turbo balance and free allowance.

**Publish and update the website**

5. Create the small `index.html` and `style.css` files locally and serve them with a local HTTP server.
6. Check whether the free allowance covers the uploads. If payment is needed, grant the upload identity a limited, temporary spending approval from the MetaMask account's Turbo credits.
7. Publish the first version twice: upload `index.html` and `style.css` separately, then use Turbo CLI's `upload-folder` command to upload the directory and create its manifest automatically. Retain both sets of identifiers and complete receipts, and inspect the objects through an AR.IO gateway.
8. Introduce [Wayfinder](<https://github.com/ar-io/wayfinder>) and use its command-line interface to retrieve the same objects without hard-coding one gateway, examining gateway selection, fallback, and verification.
9. Complete the manual path by creating and uploading a manifest for its two file objects, then compare it with the manifest produced automatically by `upload-folder`.
10. Change only `index.html` and repeat both paths. Manually upload the changed HTML and create a successor manifest that reuses the manual path's original CSS object. Then rerun `upload-folder`, which uploads both files again and generates its successor manifest automatically.
11. Open the first and second manifests from both paths. Verify that all four publications remain accessible. Compare the CSS identifiers: the manual update reuses its original CSS object, whereas the directory upload creates another object containing the same CSS bytes.
12. Create the `test` undername, point it to the manual path's second manifest, and open `https://test_weisser-zwerg.ar.io`. Repeat the Wayfinder retrieval using the name.

The tooling, MetaMask identity, and name registration are initial setup.
For later publications, we can reuse them and repeat the publishing steps.
The upload signer can also be reused or deliberately replaced; any temporary spending approval can expire or be revoked when the work is complete.

The network model differs from both earlier experiments.
With Nostr, I sent the same signed event to several relays; with Hive, I submitted one signed transaction to a shared blockchain.

With Arweave, an update does not overwrite the first publication; it creates new immutable objects.
An ArNS record then provides a mutable, human-readable pointer that can be moved to the new version.

### Install the Turbo CLI and Inspect Its Configuration

The Turbo CLI is distributed as part of the [`@ardrive/turbo-sdk`](<https://www.npmjs.com/package/@ardrive/turbo-sdk>) package.
Its source code and fuller documentation are available in the [Turbo SDK repository](<https://github.com/ardriveapp/turbo-sdk>).

The examples below use Turbo CLI 2.2.0.
That version requires Node.js 18 or newer, so first check which Node.js and npm versions the shell finds:

```bash
node --version
npm --version
```

Install the exact CLI version used in this walkthrough:

```bash
npm install --global @ardrive/turbo-sdk@2.2.0
```

Pinning the version keeps the local command interface stable even if a later Turbo release changes its options.
It does not freeze Turbo's remote service, prices, or policies.

> With version 2.2.0, npm may print two different kinds of warnings.
> Deprecation warnings for packages such as `formidable`, `superagent`, and `uuid` concern transitive dependencies used by the Turbo SDK; they do not mean that the installation failed.
>
> Recent npm versions may also report that some dependencies have install scripts "not yet covered by `allowScripts`".
> npm leaves those scripts blocked until they are explicitly permitted, thereby preventing dependencies from automatically running native build commands during installation.
>
> **Do not approve them merely to silence the warning.**
>
> First run `turbo --version` and `turbo --help`.
> On the Linux x86-64 system used for this walkthrough, Turbo 2.2.0 and the reported native dependencies loaded successfully without granting additional script permissions.
>
> If a later command fails with a concrete missing-native-binding error, inspect the named package and version before allowing anything, and approve only the install script that the failed operation actually requires.
>
> Avoid setting a broad, permanent user-level `allow-scripts` list simply because npm suggested one after installation.

When Node.js is managed by a tool such as [`nvm`](https://github.com/nvm-sh/nvm), a global npm installation belongs to the currently active Node.js installation rather than necessarily being installed for the whole operating system.

Check which executable the shell finds and which version it reports:

```bash
command -v turbo
turbo --version
```

The second command should print:

```text
2.2.0
```

If `command -v turbo` finds nothing, inspect npm's installation prefix:

```bash
npm config get prefix
```

On Linux, the `turbo` executable is normally in the `bin` directory below that prefix.
That directory must be on the shell's `PATH`.

Finally, inspect the CLI's top-level help:

```bash
turbo --help
```

Among other commands, version 2.2.0 reports the following global options:

```text
--dev                    Use the ar.io Testnet Sandbox endpoints
--local                  Use services running on this machine
-g, --gateway <url>      Set a custom crypto gateway URL
-t, --token <type>       Select the wallet or action token type
--payment-url <url>      Set a custom payment service URL
--upload-url <url>       Set a custom upload service URL
```

Without `--dev`, `--local`, or explicit service URLs, the CLI uses the production services.
The default token type is `arweave`, but this is only a command default: installing the package does not create an Arweave wallet, register an account, or choose the identity that we will use later.

### What Does "Wallet" Mean Here?

The word *wallet* is used rather loosely in cryptocurrency systems.
Depending on the context, it can mean:

* an application such as [MetaMask](https://metamask.com/) that manages keys and asks the user to approve signatures;
* the secret key material from which signatures are produced;
* the corresponding public address by which an identity is known;
* or, less precisely, the assets and service balances associated with that address.

The assets themselves are not stored inside the wallet application.
Blockchains and services record which address controls them; the wallet holds the secret needed to prove control.

A cryptographic key pair has two sides:

* The **private or secret key** creates signatures. It must remain private because anyone who obtains it can act as that identity.
* The **public key or address** identifies the signer. It can be shared, queried, and recorded in public transactions.

The exact relationship between public key and address differs between networks, as do the key and signature formats.
Turbo supports Arweave RSA wallets, EVM wallets using `secp256k1`, and Solana wallets using Ed25519.
The CLI's `--token` option tells it which kind of key and native address it is dealing with.
These are not interchangeable representations of one universal Turbo identity.

MetaMask makes the terminology slightly more confusing because one MetaMask *account* contains separate addresses for different networks.
In particular, its EVM address and its Solana address are different.

For ArNS we need the **Solana address**, which MetaMask exposes through the account's network-address selector as described in [MetaMask's Solana documentation](<https://support.metamask.io/configure/networks/navigating-solana/>).
ArNS ownership is public, so using an existing Solana address also makes that address's other public activity linkable to the name.
A separate account within MetaMask provides a separate public address, although accounts derived from the same recovery phrase still share one recovery and security boundary.

#### Five Separate Roles

There are five roles to distinguish in this walkthrough:

<style>
  table.article-table {
    border-collapse: collapse;
    margin: 1em 0;
    width: 100%;
    max-width: 100%;
    font-family: Arial, sans-serif;
  }
  .article-table th, .article-table td {
    border: 1px solid #ccc;
    padding: 0.6em;
    text-align: left;
    overflow-wrap: anywhere;
  }
  .article-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  .article-table code {
    white-space: normal;
  }
</style>

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Role</th>
      <th scope="col">What it does</th>
      <th scope="col">My choice</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Upload signer</td>
      <td>Signs the HTML, CSS, and manifest data submitted through Turbo</td>
      <td>A dedicated Arweave JWK used by the Turbo CLI</td>
    </tr>
    <tr>
      <td>Free-allowance identity</td>
      <td>Receives Turbo's free upload allowance</td>
      <td>The public Arweave address derived from the upload JWK</td>
    </tr>
    <tr>
      <td>Turbo balance holder and payer</td>
      <td>Holds purchased credits and grants limited spending authority to upload identities</td>
      <td>The Solana address of the MetaMask account</td>
    </tr>
    <tr>
      <td>Funding source</td>
      <td>Buys credits for a chosen destination address</td>
      <td>Not fixed; payment can come from a card or a supported cryptocurrency wallet</td>
    </tr>
    <tr>
      <td>ArNS owner</td>
      <td>Owns the ANT representing <code>weisser-zwerg</code> and authorises changes to its records</td>
      <td>The Solana address of a MetaMask account</td>
    </tr>
  </tbody>
</table>

These roles can use the same key, but they do not have to.
Turbo explicitly permits a payment to top up a different destination address, and credits can also be shared between addresses.
Likewise, an ArNS record can point to an Arweave transaction regardless of which identity uploaded it.

> The [Turbo payment documentation](<https://docs.ar.io/build/upload/turbo-credits>) and [AR.IO Console documentation](<https://docs.ar.io/build/guides/working-with-arns/buy-manage-arns-console>) describe these separations from the payment and naming perspectives.

Turbo maintains a service balance for a cryptographic address.
The signer proves control of that address when it performs an authenticated operation, while somebody else may have funded the balance.
In my arrangement, the [MetaMask](https://metamask.com/) address retains purchased credits and can grant the Arweave upload identity a capped or expiring credit share if the free allowance is insufficient.

#### The Free Allowance Belongs to the Upload Identity

At the time of this experiment, individual items of up to 105 KiB are eligible for Turbo's free tier.
The service tracks a lifetime allowance of 10 MiB per wallet and per network subnet; an upload must fit within both remaining allowances.
This is a Turbo service policy rather than an Arweave protocol rule, so it may change.

The allowance is assigned to the upload identity's public Arweave address.
Once we have created the key pair, that address alone will be sufficient to inspect both its remaining free allowance and its credit balance; the queries require no private key and spend nothing.
Our HTML, CSS, and manifests will be small enough to be eligible for the free tier, but we will still sign them with the upload identity so that their provenance remains visible.

#### Why We Separate the Two Keys

The Turbo CLI accepts an Arweave JWK file, whereas MetaMask is designed to keep its Solana secret inside the browser wallet and ask for approval when an application needs a signature.
Exporting the MetaMask recovery phrase or private key merely to make it available to a command-line tool would discard that protection.

We will therefore proceed as follows:

* The MetaMask Solana account will own `weisser-zwerg` and approve ArNS operations in the browser.
* A separate, permission-restricted Arweave JWK file will sign command-line uploads; its public address will receive the free allowance.
* The MetaMask Solana address will retain purchased Turbo credits and share only a limited amount with the upload identity when payment is necessary.
* The MetaMask recovery phrase and private keys will never be entered into a shell, or passed to Turbo.

Separating the roles also limits the effect of a compromised upload key.
An attacker with that key could impersonate the uploader and spend credits held by it or made available through an active share, but would not thereby own `weisser-zwerg`, control the remaining MetaMask balance, or gain the MetaMask key needed to transfer the name.
Conversely, replacing the upload key in the future would not affect the already permanent files or the ability of the ArNS owner to point at a new manifest.

> The Turbo CLI also offers a `--private-key` option.
> We will not use it because command-line arguments can be retained in shell history or exposed to other local processes.
> A protected key file keeps the secret out of the command text, although the file itself must still be secured and backed up appropriately.

### Identify the ArNS Owner

We can now establish which Solana identity in MetaMask will serve as the long-lived owner.
In MetaMask, select the account intended to own `weisser-zwerg`, switch the account's network-address view to Solana, and copy the displayed Solana address, which differs from the Ethereum address.

> As explained below in [Arweave JWK versus Solana Identity](#arweave-jwk-versus-solana-identity), this identity and address will differ from the future Arweave upload identity and address because the two roles work very differently.

Then open the [AR.IO Console](<https://console.ar.io>) and choose to sign in with a Solana wallet.
Select MetaMask's Solana account and, once connected, verify that the address shown by the Console for your account is exactly the one copied from MetaMask.

In the [current Console](<https://github.com/ar-io/ar-io-console/blob/b230e681a20d8db08ffac227a20a0df7b8cca9cf/src/components/modals/WalletSelectionModal.tsx#L190-L245>), this sign-in uses the Wallet Standard `connect` operation.
It gives the Console the account's public address, but does not ask MetaMask to sign a message or transaction.
The Console will request signatures later when we perform operations that actually require them.

> **Do not dismiss a wallet warning automatically.**<br>
> During this experiment, MetaMask displayed a security warning while connecting to the AR.IO Console, describing the address as potentially unsafe and mentioning wallet-draining activity.
> MetaMask's [security-alert documentation](<https://support.metamask.io/configure/wallet/security-alerts/>) advises investigating a warning, but not connecting or signing anything when an item is classified as malicious.
>
> I therefore first verified that the browser was at the exact `https://console.ar.io` URL linked by the [official AR.IO documentation](<https://docs.ar.io/build/guides/working-with-arns/buy-manage-arns-console>)
> and that MetaMask and the Console both displayed my wallet address, [`BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ`](<https://solscan.io/account/BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ>).
> However, I could not find a good reason for MetaMask's warning.

This MetaMask Solana address is intended to own the ArNS name, approve changes to it, and act as the long-lived holder of purchased Turbo credits.
The separate Arweave JWK used for uploads will be created and inspected before the first file is submitted.

### Buying an ArNS Name by Card and Checking Ownership

With the long-lived owner established, I will register `weisser-zwerg` now because I also want to keep it for later projects.
Uploading files does not require an ArNS name.

For this step, I recommend using the [AR.IO Console](<https://console.ar.io>).
Log in with your MetaMask account and open the waffle menu, the app launcher represented by a 3 × 3 grid.
From there, select `Domains > Register a Name` and follow the registration steps, choosing card payment.
After the purchase, check the name's ownership and controller permissions to confirm that your MetaMask Solana address owns the ANT.

I recommend this route because my original purchase through `turbo arns-fiat-quote` in Turbo CLI 2.2.0 required support to complete the ownership handoff.
I paid USD 21.57 for a permanent registration, but the ANT initially belonged to Turbo despite my MetaMask Solana address being supplied as `--address`.
Support subsequently transferred it to my wallet.
I reported the problem in [Turbo SDK issue #546](<https://github.com/ardriveapp/turbo-sdk/issues/546>); the [purchase audit in the appendix](#a-card-purchase-that-required-a-support-handoff) contains the original command and the full account of the recovery.

### Create and Inspect the Upload Signer

For the uploads, we will create an intentionally disposable Arweave JWK: the RSA key pair that the Turbo CLI will use to sign our HTML, CSS, and manifest data items.
This identity receives no AR or Turbo credits of its own.
If paid uploads are needed, we will grant it a capped, temporary spending approval from the credits associated with our MetaMask Solana address; that approval can be revoked at any time.
After the approval expires or is revoked, the key can be retained locally or deleted without affecting the uploaded data or the ArNS name.
We can use a new JWK for each publishing activity when continuity between upload signers is unwanted.

> Protect the key while it is in use: anyone who copies it can sign as that identity and spend through an active credit approval.
>
> Turbo can correlate otherwise separate upload signers through their common payer, whose address is passed in the `x-paid-by` HTTP header.
> This is payment-service information and is not necessarily part of the signed Arweave data item, which identifies the upload signer.
> Durable public continuity comes from `weisser-zwerg`: its ANT is owned by the MetaMask Solana address, and its record points to the published manifest.

We will generate the Arweave JWK with [`@permaweb/wallet`](<https://github.com/permaweb/wallet>).
The tool writes the private JWK to standard output, so we redirect it straight into a protected file.
The shell's `noclobber` option prevents an existing key from being overwritten:

```bash
upload_wallet_dir="${XDG_CONFIG_HOME:-$HOME/.config}/publishing-arweave-ario-basics"
# /home/user/.config/publishing-arweave-ario-basics
upload_wallet_file="$upload_wallet_dir/arweave-upload.jwk.json"
# /home/user/.config/publishing-arweave-ario-basics/arweave-upload.jwk.json

install -d -m 700 -- "$upload_wallet_dir"
(
  umask 077
  set -o noclobber
  npx --yes @permaweb/wallet@0.1.0 > "$upload_wallet_file"
)
stat -c '%a %n' "$upload_wallet_file"
# 600 /home/user/.config/publishing-arweave-ario-basics/arweave-upload.jwk.json
```

The final command should report mode `600` for the key file.

No long-term backup is required for our intentionally disposable use.
Losing the key would not remove data that has already been uploaded.
Retaining an encrypted backup would, however, preserve the option of signing again as the same uploader.

An Arweave JWK contains both public and private RSA parameters.
Its public address is the base64url-encoded SHA-256 hash of the public modulus, n; none of the private parameters are used.
The following local calculation extracts n from the key file and prints the resulting public address without exposing the private key.

```bash
upload_address="$(
  node -e '
    const { createHash } = require("node:crypto");
    const { readFileSync } = require("node:fs");

    const jwk = JSON.parse(readFileSync(process.argv[1], "utf8"));
    if (jwk.kty !== "RSA" || typeof jwk.n !== "string") {
      throw new Error("The file is not an RSA JWK");
    }

    process.stdout.write(
      createHash("sha256")
        .update(Buffer.from(jwk.n, "base64url"))
        .digest("base64url")
    );
  ' "$upload_wallet_file"
)"
printf '%s\n' "$upload_address"
# 6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY
```

We can now inspect the new identity's Turbo state without supplying the private key:

```bash
turbo balance --token arweave --address "$upload_address"
# Turbo Balance for Native Address "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
# Effective Credits: 0
turbo free-status --token arweave --address "$upload_address"
# Turbo free-tier allowance for Native Address "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
# Free bytes remaining: 10485760
```

These two commands send only the public address to Turbo.
When we upload the site files later, we will pass the protected JWK path to `turbo upload-file` with `--wallet-file`.

### Create and Serve the Website Locally

Before uploading anything, we will create and test the small website locally.
It has no external dependencies: the HTML document refers only to the separate stylesheet through the relative path `style.css`.
This gives us two related files whose relationship we can later reproduce with an Arweave manifest.

First, create a working directory:

```bash
site_dir="$PWD/publishing-arweave-ario-basics-site"
install -d -- "$site_dir"
```

Create `index.html` with the first version of the page:

```bash
cat > "$site_dir/index.html" <<'EOF'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Publishing on Arweave by Foot</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p class="kicker">Immutable publishing experiment</p>
    <h1>Hello from Arweave</h1>
    <p>This is version 1 of a tiny website whose HTML and CSS are stored as separate objects.</p>
  </main>
</body>
</html>
EOF
```

Then create the referenced `style.css`:

```bash
cat > "$site_dir/style.css" <<'EOF'
:root {
  font-family: system-ui, sans-serif;
  color: #202124;
  background: #edf1f5;
}

body {
  min-height: 100vh;
  margin: 0;
  display: grid;
  place-items: center;
}

main {
  width: min(36rem, calc(100% - 4rem));
  padding: 2rem;
  border: 0.2rem solid #5b3cc4;
  border-radius: 1rem;
  background: white;
}

.kicker {
  color: #5b3cc4;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
EOF
```

A local HTTP server lets us test the same path-based relationship that the manifest will provide later:

```bash
cd "$site_dir"
python3 -m http.server 8000 --bind 127.0.0.1
# Serving HTTP on 127.0.0.1 port 8000 ...
```

Binding the server to `127.0.0.1` makes it reachable only from the local machine.
Open [http://127.0.0.1:8000/](<http://127.0.0.1:8000/>) in a browser.
The browser first requests `/`, for which Python serves `index.html`, and then follows the document's relative link by requesting `/style.css` separately.
The server log should show successful requests for both paths:

```text
127.0.0.1 - - [...] "GET / HTTP/1.1" 200 -
127.0.0.1 - - [...] "GET /style.css HTTP/1.1" 200 -
```

This server is only a local preview and does not publish anything.
Stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd> after checking the page.
Finally, record the two payload sizes in preparation for checking the Turbo allowance:

```bash
wc -c index.html style.css
# 464 index.html
# 422 style.css
# 886 total
```

The important detail is not the page design but the ordinary relative link between two independent files.
Later, each file will have its own immutable identifier, while a manifest will make those identifiers available again under the familiar paths `index.html` and `style.css`.

### Check Whether the Free Allowance Covers the Uploads

The two files contain only `886` bytes in total, and neither file is larger than `464` bytes.
We can compare that with the upload identity's allowance immediately before publishing:

```bash
turbo free-status --token arweave --address "$upload_address"
# Turbo free-tier allowance for Native Address "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
# Free bytes remaining: 10485760
```

Turbo's [current free-tier rules](<https://docs.ar.io/build/upload/turbo-credits#storage-rate-and-per-item-fee>) require an individual item to be no larger than `105 KiB` and track a lifetime allowance of `10 MiB` per wallet and network subnet.
Both files are far below the per-item limit, and their combined `886` bytes are far below the reported `10,485,760` remaining bytes.
There is also ample room for the signed data-item envelopes that Turbo will add.

The free allowance therefore covers these two uploads.
We do not need to buy credits or create a credit-share approval for them, and the next section can upload them directly with the Arweave JWK.

> The allowance is not a recurring monthly quota: it is a lifetime allowance and does not reset.

#### If the Free Allowance Is Not Enough

For the file uploads in this experiment the following path is unnecessary, but it completes the separation of roles established above: purchased credits remain with the long-lived MetaMask Solana identity, while the disposable Arweave identity receives only a capped and expiring permission to spend some of them.

First, inspect the current paid price for the intended files.
The price command reports a list price even for an item that will ultimately qualify for the free tier, so these results matter only when the allowance is unavailable:

```bash
turbo price --type bytes --value "$(wc -c < index.html)"
# {
#   "byteCount": 464,
#   "amount": 0.01,
#   "currency": "usd",
#   "winc": "12633716",
#   "message": "The current price estimate for 464 bytes is 0.01 usd"
# }
turbo price --type bytes --value "$(wc -c < style.css)"
# ... similar output as above ...
```

The signed data items will be slightly larger than the files themselves.

If the MetaMask address does not yet have enough Turbo credits, assign it to a shell variable and ask Turbo CLI 2.2.0 to create a Stripe Checkout session for a card top-up:

```bash
payer_address="BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"

turbo top-up --token solana --address "$payer_address" --currency usd --value 10
# Got Checkout Session
# {"url":"https://checkout.stripe.com/g/pay/cs_live_a1yDFyx1DhBHtEhal4eZBYapo87vaR5mlw2BDETDGOP0VI292nqLMtLLlB#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdicyc%2FNiknZHVsTmB8Jz8ndW5aaWxzYFowNE9QRHFyRj1kdVVKUm5BSUhUdEtDPHZVdWNrYEtWVWtyXT1cXz18NENLQWkzczwxbV9Mcn9iQ1ZcaTcyZ1JAMUpqdj1GSXRwcGtQdnJOd05mZEFtQUozaDU1N1xvPERgTm8nKSdjd2poVmB3c2B3Jz9xd3BgKSdnZGZuYndqcGthRmppancnPycmNWQ1ZzU8JyknaWR8anBxUXx1YCc%2FJ3Zsa2JpYFpscWBoJ3gl","paymentAmount":1000,"winc":"2084041306212"}
# Opening checkout session in browser...
```

The command needs only the public destination address.
It prints a result containing the Checkout `url`, `paymentAmount`, and expected `winc`, then attempts to open the URL in the default browser.
Creating the session does not itself charge the card; payment happens only after completing Stripe Checkout.
Before paying, verify both the Stripe destination and the Solana address that will receive the credits.
After payment has been processed, check the balance without connecting or exposing the wallet:

```bash
turbo balance --token solana --address "$payer_address"
```

The [`top-up` page in the AR.IO Console](<https://console.ar.io/topup>) provides an alternative graphical path.
Connect MetaMask's Solana account, verify that the Console shows the expected address, choose the amount and payment method, and complete the checkout there.
Either route purchases credits for the same Turbo account, and either is subject to the infrastructure fee discussed in the appendix below.

Next, open the Console's [credit-sharing page](<https://console.ar.io/share>) while connected to the MetaMask Solana account.
The current form accepts an Arweave, Ethereum, or Solana recipient address, requires a share of at least `0.01` credits, and offers `Never`, `1 hour`, `1 day`, `1 week`, and `Custom` expiration choices.
For this short experiment, create an approval with:

* the Arweave upload address in `$upload_address` as the recipient;
* `0.01` credits, the smallest amount accepted by the current Console and more than the live estimates plus a margin; and
* `1 hour` as the expiration.

Review the payer, recipient, cap, and expiration carefully before asking MetaMask to sign.
The approval reserves at most that amount for the uploader; it does not transfer ownership of the credits or reveal the MetaMask private key.
Unused credits become spendable by the payer again when the approval expires or is revoked.
The `Your shares` and `Shared with you` tabs then show approvals created and received, including how much has been spent.

We use the Console for this signed step because our long-lived payer is held in MetaMask.
The equivalent Turbo CLI command for a payer whose Solana secret is already managed as a local key file would be:

```bash
credit_cap="0.01"            # Current Console minimum; choose deliberately for other work
credit_lifetime_seconds=3600 # One hour from the creation of the approval
payer_wallet_file="/path/to/solana-keypair.json"

turbo share-credits --token solana --wallet-file "$payer_wallet_file" --address "$upload_address" --value "$credit_cap" --expires-by-seconds "$credit_lifetime_seconds"
```

Do not export MetaMask's secret merely to run this command.
The Console performs the same kind of signed approval through the connected browser wallet and is the safer interface for our setup.
Turbo documents the cap, expiration, inspection, and revocation model in its [credit-sharing guide](<https://docs.ar.io/build/upload/turbo-credits#credit-sharing>).

The resulting approval can be inspected through its public recipient address:

```bash
turbo list-shares --token arweave --address "$upload_address"
```

A later paid upload can explicitly select the MetaMask account with `--paid-by "$payer_address"`.
Turbo CLI can also discover received approvals automatically, but naming the payer makes the relationship visible in this by-foot experiment.
After the uploads, revoke the approval from the Console's sharing page or let its one-hour lifetime expire.
For a locally managed payer key, the corresponding immediate revocation would be:

```bash
turbo revoke-credits --token solana --wallet-file "$payer_wallet_file" --address "$upload_address"
```

Revocation removes all approvals that this payer has granted to that recipient, so it should not be used casually when several deliberate approvals coexist.

### Upload the First Version Twice

Arweave does not require us to invoke one upload command per file.
Turbo can orchestrate a directory upload, but the underlying result still consists of separate immutable data items for the files and another data item for the manifest.
We will now perform both the explicit and automated workflows so that we can see what the directory abstraction adds.

This deliberately uploads the same file contents twice.
The resulting objects are not redundant for the experiment: they establish two independent publication tracks whose update behaviour we can compare later.
All of these small data items remain comfortably within the free allowance checked above.

Create a state directory next to, rather than inside, the website directory.
Receipts and downloaded verification files must not accidentally become files in the published website:

```bash
publication_state_dir="${site_dir%/}-publication-state"
install -d -m 700 -- "$publication_state_dir"
```

#### Path A: Upload Each File Explicitly

The manual path invokes `turbo upload-file` once for each file.
Unlike a folder upload, this command receives a byte stream without a path from which the SDK could infer the media type, so we attach the appropriate `Content-Type` tag explicitly.
That tag matters: an AR.IO gateway uses it when serving the object to a browser.

Turbo CLI prints the upload service's complete JSON response after the prefix `Uploaded file:`.
The following helper first preserves that raw CLI output and then removes only the prefix to create a JSON receipt file.
The receipt includes the data-item identifier and Turbo's signed acceptance receipt; the shorter `jq` output is only a readable summary.

> `--tags` accepts a variable-length sequence of name/value pairs.
> The following `--quiet` option deliberately marks the end of that sequence.
> Keep a later shell operation separate from the Turbo command; otherwise, its words can accidentally become permanent data-item tags.

```bash
manual_v1_html_receipt="$publication_state_dir/manual-v1-index.receipt.json"
manual_v1_css_receipt="$publication_state_dir/manual-v1-style.receipt.json"

upload_file_and_retain_receipt() {
  local source_file="$1"
  local content_type="$2"
  local receipt_file="$3"
  local cli_output_file="$receipt_file.cli-output"

  if test -e "$receipt_file" || test -e "$cli_output_file"; then
    printf 'Refusing to overwrite existing receipt or CLI output for: %s\n' "$receipt_file" >&2
    return 1
  fi

  (
    set -o noclobber
    turbo upload-file --token arweave --wallet-file "$upload_wallet_file" --file-path "$source_file" --tags Content-Type "$content_type" --quiet > "$cli_output_file"
  ) || return 1

  (
    set -o noclobber
    sed '1s/^Uploaded file: //' "$cli_output_file" > "$receipt_file"
  ) || return 1

  jq -e '
    .id and .owner and .winc and .timestamp and .signature and
    .public and .version and .deadlineHeight
  ' "$receipt_file" >/dev/null || return 1

  jq '{
    id,
    owner,
    winc,
    timestamp,
    version,
    deadlineHeight,
    dataCaches,
    fastFinalityIndexes
  }' "$receipt_file"
}
```

If this helper returns an error after contacting Turbo, inspect both the `.cli-output` and receipt files, as well as the upload state, before retrying.
Do not delete the evidence and submit the same irreversible operation again merely because the final local parsing step failed.

The next two commands are the first irreversible publication operations involving our upload JWK.
Each signs one data item and submits it to Turbo:

```bash
upload_file_and_retain_receipt "$site_dir/index.html" text/html "$manual_v1_html_receipt"
# {
#   "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8",
#   "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "winc": "0",
#   "timestamp": 1794152144869,
#   "version": "0.2.0",
#   "deadlineHeight": 2038342,
#   "dataCaches": [
#     "turbo-gateway.com"
#   ],
#   "fastFinalityIndexes": [
#     "turbo-gateway.com"
#   ]
# }

upload_file_and_retain_receipt "$site_dir/style.css" text/css "$manual_v1_css_receipt"
# {
#   "id": "AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q",
#   "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "winc": "0",
#   "timestamp": 1794152160861,
#   "version": "0.2.0",
#   "deadlineHeight": 2038343,
#   "dataCaches": [
#     "turbo-gateway.com"
#   ],
#   "fastFinalityIndexes": [
#     "turbo-gateway.com"
#   ]
# }
```

A free-tier response should report `"winc": "0"`, but it is still a real permanent upload.
The response's `id` identifies the signed Arweave data item; `owner` identifies our Arweave upload signer; and the receipt fields record Turbo's acceptance and deadline.
Because Turbo does not serve as a permanent receipt archive, retaining the complete responses is part of the publication record.

Extract the two identifiers without copying them by hand:

```bash
manual_v1_html_id="$(jq -er '.id' "$manual_v1_html_receipt")"
manual_v1_css_id="$(jq -er '.id' "$manual_v1_css_receipt")"

printf 'manual index.html: %s\n' "$manual_v1_html_id"
# manual index.html: KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8
printf 'manual style.css:  %s\n' "$manual_v1_css_id"
# manual style.css:  AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
```

At this point the two objects know nothing about each other.
Opening the HTML identifier alone does not make `style.css` resolve to the separately uploaded CSS identifier.
The manual manifest in a later section will provide that missing path mapping.

#### Path B: Upload the Directory with the CLI

The CLI also has an [`upload-folder` command](<https://github.com/ardriveapp/turbo-sdk/tree/v2.2.0#upload-folder>) that uploads the files and creates a manifest in one operation:

```bash
folder_v1_result="$publication_state_dir/folder-v1-result.json"
folder_v1_cli_output="$folder_v1_result.cli-output"

(
  set -o noclobber
  turbo upload-folder --token arweave --wallet-file "$upload_wallet_file" --folder-path "$site_dir" --index-file index.html --quiet > "$folder_v1_cli_output"
)

cat "$folder_v1_cli_output"
# Uploaded folder: {
#   "fileResponses": [
#     {
#       "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg",
#       "timestamp": 1794152377554,
#       "winc": "0",
#       "version": "0.2.0",
#       "deadlineHeight": 2038348,
#       "dataCaches": [
#         "turbo-gateway.com"
#       ],
#       "fastFinalityIndexes": [
#         "turbo-gateway.com"
#       ],
#       "public": "wZgP9Rpfh0nXb5EdzBUg7y2LFMkBp2ADX3gdZhLXHYbz4srlYD6FUGn6Tt-WsSYj8faUyA7bNKj9zzcXiN-bsMC73e0yoQ05A_5I2QnBAgCTuzXePvUVCvSCOg1vdh07hSjvSBd1XiWDHw2J-Z7m6lG3l56PDSCp8t-s0PduONcsjqOePFejzkaJymJxMYp7d0g0GL1i1MrBAbf5ohIobyTYQz7bRHLLUpdSgiCiHbSBp092cIQnHYXGBeWb-lBEtMT9Am5GsHeVXq4eL8H83NBPIN4fIOtwpl7zzBUeaD5lTc3UcXliMjFuFJurVmNhqsP_osJMceybk3VIjdP0biqLqt_nRupdPwwJGQ09iyGv0wfzMBlx7zTZ9pp77ZBX3cDnYmWt2IR-mIgOStfiEHu5BuwNGBvGt7-tzHJp9e6IOofN10apfiuF9iQEQ3gFVQDZ7owQ_IrCq5yWLP7ePwYoB2e7ZbvCkd4JM8oOgEMZkywTOx3gLASGKS7wqUerdlYacWRukqg5MmkQRbzJIiY23pPwrhQSWon5q91jbImO6vTaHVDZnd2GoMFlePAsceNO1MaLS6GMuY-EAwOtaX-R1QZUpJmCzWfV-77AmBmaPDCR0mm3f7jy-3yYSCMAkti4idHVq5dIhOJnibd_LEfQtkTAQ5MQlE4uoa5lkJs",
#       "signature": "EULFm0LRWyvbd--DGS8Bl033zzr_VlWRQ9X84U_4boBpq0SZovKQJKiQGOnJe4S8c7m6Rbcci_HIq8Z8hBYvDlHLtlJDfFV5ZDl8zwyFnf_bjbTHvr3XBbu7-mUhsp31VX-K-BbM2e7FIUj0hiqRuSHtnPF7ZKMYV6oIbh5O_tv6NCQGNNnRDM2ZTClAfoWpaY2cNWT8bZVgsTu6Q_aIM0WztppLN106byKblOD53j7Umv30NYx-Y19YlVdre6v8pJKsgkTZ0mD4HiLd_wsLv8Yk6Bfjv-esRB0i08wQoCTz-xJPtsOAfBfBMGd9Gx3QC3MyI6IUSPWWkeNmCJ4wFXBpQnfYdfoCuEVeJxypD3ngcvojzo7hjQkXWChImeliQU37lCd9_IP98CA9M_pWbBvOfY8RjQlxFRlH4CDSJqqe07iVWx9OA1wLh-LDN7A6yc667lUBwlu3cgWGC49ww4OUjONMp3GchW68pqKmqoe4kd7IPq2stN4-XNnx5Y-Jn1TNz1uu-0UzAw7dhDATYXuqSwm9Jm7ciCZ2ERYWU5iM-6X0ILSqpL4bV82oNm2K8WR4O3cZOU8k3KX9iBSOmBTlP9MzzTE2nLx3l-jY8n-JQlMT4dMECTZLR8VDygKEvknC-6i9ZH5zuEGhWy-iPOIQWVs9X9u83JAQItYRCjU",
#       "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
#     },
#     {
#       "id": "868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs",
#       "timestamp": 1794152377655,
#       "winc": "0",
#       "version": "0.2.0",
#       "deadlineHeight": 2038348,
#       "dataCaches": [
#         "turbo-gateway.com"
#       ],
#       "fastFinalityIndexes": [
#         "turbo-gateway.com"
#       ],
#       "public": "wZgP9Rpfh0nXb5EdzBUg7y2LFMkBp2ADX3gdZhLXHYbz4srlYD6FUGn6Tt-WsSYj8faUyA7bNKj9zzcXiN-bsMC73e0yoQ05A_5I2QnBAgCTuzXePvUVCvSCOg1vdh07hSjvSBd1XiWDHw2J-Z7m6lG3l56PDSCp8t-s0PduONcsjqOePFejzkaJymJxMYp7d0g0GL1i1MrBAbf5ohIobyTYQz7bRHLLUpdSgiCiHbSBp092cIQnHYXGBeWb-lBEtMT9Am5GsHeVXq4eL8H83NBPIN4fIOtwpl7zzBUeaD5lTc3UcXliMjFuFJurVmNhqsP_osJMceybk3VIjdP0biqLqt_nRupdPwwJGQ09iyGv0wfzMBlx7zTZ9pp77ZBX3cDnYmWt2IR-mIgOStfiEHu5BuwNGBvGt7-tzHJp9e6IOofN10apfiuF9iQEQ3gFVQDZ7owQ_IrCq5yWLP7ePwYoB2e7ZbvCkd4JM8oOgEMZkywTOx3gLASGKS7wqUerdlYacWRukqg5MmkQRbzJIiY23pPwrhQSWon5q91jbImO6vTaHVDZnd2GoMFlePAsceNO1MaLS6GMuY-EAwOtaX-R1QZUpJmCzWfV-77AmBmaPDCR0mm3f7jy-3yYSCMAkti4idHVq5dIhOJnibd_LEfQtkTAQ5MQlE4uoa5lkJs",
#       "signature": "dPsoAoOCUVitq30x_IWKihSDgGgn6QZtNTy6jVgPWp5taDwU8HLwtsXi2AVeU2GDh2zPrCaet5DuJxoIw9f1CgUxd98FYrQimB2h1EB_XaLMVLZyhCmeYEBnLq9f4b_yhdUaqgpX3-qehLovzPQuLT4Anw_hMg6w1irjW4AS5DBe26tn7dHM6vwf0-LGtBfeZ4Mbpy296iBMbaMX7D0oZBxpfRfrQ1dSxx1_ze63xvDh0TO_NUQO2Z9lQRtuW-p__968HC2s0yXqdlKIT9GNugwOa1x2H8un65fyO9iJDR0EvdXg4BAn7zQXlRUiaL3YgeEuaMgbFK_BfTaE-qhiq-9tq3WHVP7RlKaqpnaiEMpbVULcVpqt_zC_bphq7wcTlhP8dDzK_g8aWFRdWwrns-tVhy75nHFpRPJTeKNtynOq_4SztkVD3Fj2BsGiOdMmQTWHi_j28KTMzrJXEXAc0xdRfjbPjMQKcUEYJJkLDK-nIbNIttz7CuGCRa5-Svo3poNLZIzcm6UoqtYtDAPe458LiYI8pVf5iW8EqtuJP91QAnHjovokY3I4pXNuIFPfBSuuuJi1M4prskNw3HFx6jcr_1G63uZtwy60LqyLdxBis7QnYbRNHiSurlamqtdl0rKsVD_dYKH-TSRkQ5N4DBFbm0YVPSAKICiJKzZ-5Kg",
#       "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
#     }
#   ],
#   "manifest": {
#     "manifest": "arweave/paths",
#     "version": "0.2.0",
#     "index": {
#       "path": "index.html"
#     },
#     "paths": {
#       "index.html": {
#         "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#       },
#       "style.css": {
#         "id": "868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs"
#       }
#     },
#     "fallback": {
#       "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#     }
#   },
#   "manifestResponse": {
#     "id": "lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE",
#     "timestamp": 1794152377824,
#     "winc": "0",
#     "version": "0.2.0",
#     "deadlineHeight": 2038348,
#     "dataCaches": [
#       "turbo-gateway.com"
#     ],
#     "fastFinalityIndexes": [
#       "turbo-gateway.com"
#     ],
#     "public": "wZgP9Rpfh0nXb5EdzBUg7y2LFMkBp2ADX3gdZhLXHYbz4srlYD6FUGn6Tt-WsSYj8faUyA7bNKj9zzcXiN-bsMC73e0yoQ05A_5I2QnBAgCTuzXePvUVCvSCOg1vdh07hSjvSBd1XiWDHw2J-Z7m6lG3l56PDSCp8t-s0PduONcsjqOePFejzkaJymJxMYp7d0g0GL1i1MrBAbf5ohIobyTYQz7bRHLLUpdSgiCiHbSBp092cIQnHYXGBeWb-lBEtMT9Am5GsHeVXq4eL8H83NBPIN4fIOtwpl7zzBUeaD5lTc3UcXliMjFuFJurVmNhqsP_osJMceybk3VIjdP0biqLqt_nRupdPwwJGQ09iyGv0wfzMBlx7zTZ9pp77ZBX3cDnYmWt2IR-mIgOStfiEHu5BuwNGBvGt7-tzHJp9e6IOofN10apfiuF9iQEQ3gFVQDZ7owQ_IrCq5yWLP7ePwYoB2e7ZbvCkd4JM8oOgEMZkywTOx3gLASGKS7wqUerdlYacWRukqg5MmkQRbzJIiY23pPwrhQSWon5q91jbImO6vTaHVDZnd2GoMFlePAsceNO1MaLS6GMuY-EAwOtaX-R1QZUpJmCzWfV-77AmBmaPDCR0mm3f7jy-3yYSCMAkti4idHVq5dIhOJnibd_LEfQtkTAQ5MQlE4uoa5lkJs",
#     "signature": "hRJ0u7DnvcqCylhFNIqZY4oTiWxugJ925kjEj7iPpHo2C2uE7nhB1dadbxbSTyx9nhK9ZzZ69taDAxzBMkvF8o_5JMy3sMSAJLNnTrDc89iFerPMKfrLJmZUYadyQHN3GofdY8Yy8n35jfif_zuGyYGHaSGN_UI2jHrnqrtVUpDMMqSO2-4pzenaaHQEvVLPWSAJWyg8w87Mb6W2tG0QQ-jye4vA4f81EDugdiD6blbc9sr8QnsfuIZZF8bVNjbk3FZyOVdA6hyeOuCAW6XdvcPOj3MB-uB9OZp631tQAB7qnZp_AH9N-Dw_j5Soe3_bqK_3DMgI7Q15mW63_o61R9Dqt-BZvwDP_S4ToHJpQJMZ9iRn93kliiRRAdPqClOxciRnEsWgAEmqYCSdHQrJOxTIKOq3HHnEWdDxP9y5aGX8Iz1LgunIFY8A1XaaS58Ota4c_HitBIyUXKMKg7lTu1n1e55-Jjc4WVV6wYsxHiEwAG_RVDm8uPaWL8ihKOkWNvUNfD6CKSUnaDsb8XLiLRe5-jpp1sucLikBcWgvZsqjP2GuOUupiIOG3MMBqq7f2YzDUs0367cHOP3lGZpqHfU4J4WkUPD2skRrWRnR1Z1Oy6FvPEF5nUlTl9cz-R3rRGNGUwVX4CIj4_u7Zi6oqr87RgyviaLHSRdsbIRU1Vg",
#     "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
#   }
# }
```

The `--index-file index.html` option selects the website's entry page in the generated manifest.
Despite its name, it does not create a file-reuse index.

As with the individual uploads, keep the complete response and remove only the CLI prefix to obtain JSON:

```bash
(
  set -o noclobber
  sed '1s/^Uploaded folder: //' "$folder_v1_cli_output" > "$folder_v1_result"
)

jq -e '.fileResponses and .manifest.paths and .manifestResponse.id' "$folder_v1_result" >/dev/null

folder_v1_html_id="$(jq -er '.manifest.paths["index.html"].id' "$folder_v1_result")"
folder_v1_css_id="$(jq -er '.manifest.paths["style.css"].id' "$folder_v1_result")"
folder_v1_manifest_id="$(jq -er '.manifestResponse.id' "$folder_v1_result")"

jq '{paths: .manifest.paths, manifestId: .manifestResponse.id}' "$folder_v1_result"
# {
#   "paths": {
#     "index.html": {
#       "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#     },
#     "style.css": {
#       "id": "868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs"
#     }
#   },
#   "manifestId": "lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE"
# }
```

The result contains the file receipts in `fileResponses`, the generated path mapping in `manifest`, and the manifest's receipt in `manifestResponse`.
If the upload succeeded but saving or parsing its output failed, recover the original response before considering another upload.
An upload already performed without redirection can be documented by saving its terminal output to the `.cli-output` file; repeating the upload would create another publication.

My directory upload produced [this website](<https://turbo-gateway.com/lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/>).
Its HTML and CSS identifiers differ from the manual uploads even though the file contents are identical.
An Arweave data-item ID is derived from its signature, and my RSA signer introduces fresh randomness when signing.
Uploading the same bytes again therefore does not recover the earlier identifier.

> The appendix explains Arweave data-item IDs and [how signing, identifiers, and automated reuse fit together](#why-identical-files-can-have-different-arweave-ids).

Turbo CLI 2.2.0 uploads every file again when we repeat `upload-folder`.
The underlying `@ardrive/turbo-sdk` has an optional mechanism for recognising and reusing earlier uploads, but this `turbo upload-folder` CLI command does not expose it.
For this tutorial, we will demonstrate reuse explicitly through the manual manifest and compare that with repeating the directory command.

#### Inspect Both Sets of File Objects Through an AR.IO Gateway

A Turbo receipt shows that the upload service accepted a data item.
We will now independently ask an AR.IO gateway for the stored bytes and compare them with the local files.
The AR.IO gateway [`/raw/` endpoint](<https://docs.ar.io/build/access/fetch-data#raw-data-endpoint>) bypasses manifest resolution and always requests the bytes belonging to the exact identifier.

The following helper retries briefly while a fresh data item is being indexed, saves both the response headers and bytes, and then performs a byte-for-byte comparison:

```bash
gateway_base="https://turbo-gateway.com"
gateway_state_dir="$publication_state_dir/gateway-v1"
install -d -m 700 -- "$gateway_state_dir"

fetch_and_compare() {
  local label="$1"
  local data_id="$2"
  local local_file="$3"
  local header_file="$gateway_state_dir/$label.headers"
  local downloaded_file="$gateway_state_dir/$label.data"

  curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --dump-header "$header_file" --output "$downloaded_file" "$gateway_base/raw/$data_id" || return 1

  cmp -- "$local_file" "$downloaded_file" || return 1
  printf 'Verified %s as %s\n' "$label" "$data_id"

  awk 'BEGIN { IGNORECASE = 1 }
    /^(content-type|content-digest|x-ar-io-data-id|x-ar-io-digest|x-ar-io-verified|x-ar-io-stable):/' \
    "$header_file"
}

fetch_and_compare manual-v1-index "$manual_v1_html_id" "$site_dir/index.html"
# Verified manual-v1-index as KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8
# content-type: text/html; charset=utf-8
# x-ar-io-data-id: KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8
# x-ar-io-stable: false
# x-ar-io-verified: false
# x-ar-io-digest: Ao39PRnb6ZHiEUeKtNH4jMj3xXN2rqc4vKIrw5f07gk
# content-digest: sha-256=:Ao39PRnb6ZHiEUeKtNH4jMj3xXN2rqc4vKIrw5f07gk=:
fetch_and_compare manual-v1-style "$manual_v1_css_id" "$site_dir/style.css"
# Verified manual-v1-style as AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
# content-type: text/css; charset=utf-8
# x-ar-io-data-id: AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
# x-ar-io-stable: false
# x-ar-io-verified: false
# x-ar-io-digest: PAGJqaYEPqgHS5tdpauf8Gqpe-Cx-8CIRNFsO3kiCuI
# content-digest: sha-256=:PAGJqaYEPqgHS5tdpauf8Gqpe+Cx+8CIRNFsO3kiCuI=:
fetch_and_compare folder-v1-index "$folder_v1_html_id" "$site_dir/index.html"
# Verified folder-v1-index as staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg
# content-type: text/html; charset=utf-8
# x-ar-io-data-id: staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg
# x-ar-io-stable: false
# x-ar-io-verified: false
# x-ar-io-digest: Ao39PRnb6ZHiEUeKtNH4jMj3xXN2rqc4vKIrw5f07gk
# content-digest: sha-256=:Ao39PRnb6ZHiEUeKtNH4jMj3xXN2rqc4vKIrw5f07gk=:
fetch_and_compare folder-v1-style "$folder_v1_css_id" "$site_dir/style.css"
# Verified folder-v1-style as 868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs
# content-type: text/css; charset=utf-8
# x-ar-io-data-id: 868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs
# x-ar-io-digest: PAGJqaYEPqgHS5tdpauf8Gqpe-Cx-8CIRNFsO3kiCuI
# content-digest: sha-256=:PAGJqaYEPqgHS5tdpauf8Gqpe+Cx+8CIRNFsO3kiCuI=:
```

A successful `cmp` produces no output; the helper prints `Verified` only after that comparison succeeds.
The gateway headers identify the served data item and its digest.
For a fresh upload, `x-ar-io-verified` or `x-ar-io-stable` may still be `false`: immediate availability, gateway verification, and eventual chain finality are related but distinct states.

The directory upload has already produced a working manifest.
Fetch its raw JSON to inspect the stored mapping, then request the manifest normally to exercise its `index.html` path:

```bash
curl --fail --location "$gateway_base/raw/$folder_v1_manifest_id" | jq .
# {
#   "manifest": "arweave/paths",
#   "version": "0.2.0",
#   "index": {
#     "path": "index.html"
#   },
#   "paths": {
#     "index.html": {
#       "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#     },
#     "style.css": {
#       "id": "868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs"
#     }
#   },
#   "fallback": {
#     "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#   }
# }

curl --fail --location --output "$gateway_state_dir/folder-v1-website.html" "$gateway_base/$folder_v1_manifest_id/"

cmp -- "$site_dir/index.html" "$gateway_state_dir/folder-v1-website.html"
```

The first request uses `/raw/` because a normal request for a manifest does not return the manifest JSON: the gateway resolves its configured index path instead.
The second request deliberately uses that resolution behaviour and should return the original HTML bytes.
The stylesheet is available through the human-readable manifest path `$gateway_base/$folder_v1_manifest_id/style.css`, while the manual track will acquire the equivalent path only after we construct its manifest ourselves.

### Retrieve the Files with Wayfinder

My `curl` commands chose `turbo-gateway.com` explicitly.

> **What is a gateway?** An [AR.IO gateway](<https://docs.ar.io/learn/gateways>) is a web-facing access point to Arweave: it retrieves, caches, and indexes data, resolves ArNS names, and serves content over HTTP.
> Different operators run different gateways, which can serve the same immutable objects under the same IDs.
> Their availability, speed, cached content, and access policies can differ.

The file identifiers themselves do not depend on that gateway, so we should also be able to ask for an object and let a client select where to retrieve it.
That is the role of [Wayfinder](<https://github.com/ar-io/wayfinder>): it provides gateway routing and optional verification for Arweave content, with both a command-line tool and a browser extension.

> **Where does Wayfinder find gateways?** AR.IO maintains a public [Gateway Address Registry (GAR)](<https://docs.ar.io/learn/gateways/gateway-registry>) on Solana, recording registered gateways and their service endpoints, operator details, and staking state.
> The Wayfinder browser extension reads this registry; the CLI version examined below instead discovers candidates through gateway-provided `/ar-io/peers` lists.
>
> To explore the registry yourself, open the [AR.IO Network Portal's gateway list](<https://gateways.ar.io/#/gateways>) and inspect the entries for their hostnames, status, stake, and performance information.
> Browsing these public records does not require connecting a wallet.

The corresponding address is `ar://` followed by a data-item ID, for example:

```text
ar://KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8
```

Wayfinder translates this into an HTTPS request to a gateway.

#### Install and Inspect the CLI

The [Wayfinder CLI](<https://www.npmjs.com/package/@ar.io/wayfinder-cli>) is separate from Turbo.
For this experiment, we will build the tested GitHub revision and install it as the normal `wayfinder` command.
The published package has endpoint problems, described below, so leave its installation command commented out:

```bash
# npm install --global @ar.io/wayfinder-cli@0.0.4
```

I keep locally built tools under `~/.local/src`, outside the website and its publication-state directory.
This is a convenient per-user location rather than a required Linux path.
The directory name includes the source revision so that the checkout remains identifiable.

The [tested revision](<https://github.com/ar-io/wayfinder/tree/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c>) contains CLI 0.0.5 and Core 2.0.2.
Wayfinder is a monorepo, so we install its dependencies, build Core and then the CLI, and finally install the CLI subdirectory globally:

```bash
wayfinder_source_root="$HOME/.local/src"
wayfinder_source_dir="$wayfinder_source_root/wayfinder-a3390ca5"

install -d -- "$wayfinder_source_root"
(
  set -e
  git clone https://github.com/ar-io/wayfinder.git "$wayfinder_source_dir"
  cd -- "$wayfinder_source_dir"
  git checkout --detach a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c

  npm install --ignore-scripts
  npm run build --workspace @ar.io/wayfinder-core
  npm run build --workspace @ar.io/wayfinder-cli
  npm install --global --ignore-scripts "$wayfinder_source_dir/experimental/wayfinder-cli"
)
```

The subshell keeps our current working directory unchanged and stops if a build step fails.
`--ignore-scripts` skips automatic installation hooks; we invoke the required builds explicitly.
Use the same nvm-selected Node.js version as for Turbo: npm installs the command into that version's global bin directory.

> Installing a [local package directory with npm](<https://docs.npmjs.com/cli/v11/commands/npm-install/>) creates a link to the checkout.
> Keep this source directory, its built files, and its `node_modules`: the installed command uses them.
> If CLI 0.0.4 was already installed under the same Node.js version, this installation replaces its global package entry with the local link.

Now inspect the installation from our original working directory:

```bash
hash -r
npm ls --global --depth=0 @ar.io/wayfinder-cli
# @ar.io/wayfinder-cli@0.0.5 -> .../wayfinder-a3390ca5/experimental/wayfinder-cli
npm ls --prefix "$wayfinder_source_dir" --workspace @ar.io/wayfinder-cli @ar.io/wayfinder-core
# The CLI's dependency should resolve to Core 2.0.2 in the checkout.
command -v wayfinder
wayfinder fetch --help
wayfinder config list
```

Keep the downloads outside the website directory:

```bash
wayfinder_state_dir="$publication_state_dir/wayfinder-v1"
install -d -m 700 -- "$wayfinder_state_dir"
```

#### Gateway Selection and Fallback

We can now request the HTML object without choosing a serving gateway ourselves:

```bash
wayfinder fetch "ar://$manual_v1_html_id" --routing fastest --verify hash --output "$wayfinder_state_dir/automatic-index.html" --verbose
cmp -- "$site_dir/index.html" "$wayfinder_state_dir/automatic-index.html"
```

This succeeded with the source build: hash verification completed, and the downloaded 464 bytes matched my original HTML file.

The [Core 2.0.2 defaults](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-core/src/gateways/default.ts>) discover candidates through `https://turbo-gateway.com/ar-io/peers`.
If peer discovery fails or returns no candidates, the provider falls back to `turbo-gateway.com` itself.
Without a routing option, the CLI selects a candidate at random.

Our `--routing fastest` command probes candidate gateways' root URLs with HTTP `HEAD` requests and selects the first successful response; this measures responsiveness rather than the download speed of our particular file.

The `--routing preferred` mode tries the built-in preferred gateway, `turbo-gateway.com`, before falling back to the fastest responding candidate.

These routing decisions happen before downloading the file, so a later download or verification failure can still make the command fail.

> **The published CLI currently has stale endpoint defaults.**
> With npm CLI 0.0.4 and its bundled Core 1.8.0, a request using default routing failed with `No gateways available`: its discovery endpoint at `https://permagate.io/ar-io/peers` had a TLS certificate mismatch.
> Explicit routing modes such as `--routing fastest` instead attempted discovery through `https://arweave.net/ar-io/peers`, which returned HTTP 404.
> That version's [bundled routing implementation](<https://unpkg.com/@ar.io/wayfinder-core@1.8.0/dist/client.js>) also fixes the preferred mode's first gateway to `arweave.net`.
> This is why I commented out the published-package installation and use the pinned source build above, which completes the automatic-routing experiment.

#### Retrieve and Compare Our Four File Objects

We will use automatic routing and hash verification for all four file objects.
Because we also have the originals locally, we can additionally compare the downloaded bytes directly with `cmp`:

```bash
fetch_with_wayfinder_and_compare() {
  local label="$1"
  local data_id="$2"
  local local_file="$3"
  local downloaded_file="$wayfinder_state_dir/$label.data"

  wayfinder fetch "ar://$data_id" --routing fastest --verify hash --output "$downloaded_file" --verbose || return 1
  cmp -- "$local_file" "$downloaded_file" || return 1
  printf 'Matched local bytes for %s: %s\n' "$label" "$data_id"
}

fetch_with_wayfinder_and_compare manual-v1-index "$manual_v1_html_id" "$site_dir/index.html"
fetch_with_wayfinder_and_compare manual-v1-style "$manual_v1_css_id" "$site_dir/style.css"
fetch_with_wayfinder_and_compare folder-v1-index "$folder_v1_html_id" "$site_dir/index.html"
fetch_with_wayfinder_and_compare folder-v1-style "$folder_v1_css_id" "$site_dir/style.css"
```

All four source-build commands completed with hash verification enabled, and their downloads matched the local source files: 464 bytes for each HTML object and 422 bytes for each CSS object.
This establishes that I retrieved my original bytes; it does not establish Arweave chain finality.

#### What Does Wayfinder Verify?

Wayfinder's [verification strategies](<https://docs.ar.io/sdks/wayfinder/wayfinder-core/verification-strategies/>) answer different questions:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Mode</th>
      <th scope="col">What is checked?</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>--verify hash</code></td>
      <td>Computes SHA-256 over the downloaded bytes and compares it with a digest obtained from a trusted gateway. This still depends on that gateway supplying the correct reference digest.</td>
    </tr>
    <tr>
      <td><code>--verify remote</code></td>
      <td>Requires the serving gateway's <code>x-ar-io-verified</code> header to be <code>true</code>. It trusts the gateway's verification report.</td>
    </tr>
    <tr>
      <td><code>--verify disabled</code></td>
      <td>Performs no Wayfinder verification. A separate <code>cmp</code> can still check the bytes when we have a local original.</td>
    </tr>
  </tbody>
</table>

In the source build, hash verification uses `turbo-gateway.com` as the reference gateway, even when routing selects another server for the download.
Thus, automatic selection of the serving gateway still relies on a configured source for the expected digest.
The CLI has no option to replace that reference gateway.

> The older published CLI 0.0.4 used `permagate.io` for this reference digest.
> Its hash-verification attempt failed with a certificate mismatch even when I explicitly downloaded through `turbo-gateway.com`.
> Core 2.0.2 also corrects this default, which is why the source-build commands above can enable hash verification.

Remote verification can be tried separately:

```bash
wayfinder fetch "ar://$manual_v1_html_id" --gateway "$gateway_base" --verify remote --output "$wayfinder_state_dir/manual-v1-index.remote.html" --verbose
```

> Remote verification succeeded on some requests and failed on others because the gateway returned different `x-ar-io-verified` values for the same object.
> I was not able to determine the cause.
> My main retrieval checks therefore use hash verification and compare the downloaded bytes with the local originals.

During my earlier checks with CLI 0.0.4, remote verification succeeded for the two manual uploads.
It rejected the directory-upload objects because the gateway still reported them as unverified, even though their downloaded bytes matched my local files.
That is a missing verification assurance, not evidence that the bytes were altered.

> The CLI's printed `Verification: verified`, `failed`, or `skipped` summary is derived from the gateway's response header, rather than the final outcome of its own hash verification.
> In my source-build checks it printed `Verification: skipped`, although the requested hash verification completed and each command exited successfully.
> With `--verify hash`, the CLI enables strict verification: a verification error makes the command fail. Check its exit status and the local comparison as well as its summary.
> Its `Gateway: unknown` summary also reflects a missing response header, not the absence of a gateway.
> Although `--help` lists `signature`, the [verification factory in this checkout](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-core/src/client.ts>) still does not wire up that mode; it should not be used as evidence of signature verification.

#### Use Wayfinder in the Browser

The [AR.IO Wayfinder browser extension](<https://chromewebstore.google.com/detail/ario-wayfinder/hnhmeknhajanolcoihhkkaaimapnmgil>) provides gateway routing for `ar://` addresses in Chrome or a compatible browser such as Brave.
It has its own release cycle and settings, separate from the CLI.
The store listed extension version 2.0.0 when this section was written.
In my browser experiment on November 9, 2026, I needed the source build and a different Solana RPC endpoint to make it work.

Installing the CLI from source does not update the browser extension, but we can build it from the same pinned checkout and load it through Chrome's developer mode.
The dependencies and Core library are already prepared, so the [extension build](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/README.md#development-build>) needs only one additional command:

```bash
(
  cd -- "$HOME/.local/src/wayfinder-a3390ca5" || exit
  npm run build --workspace @ar.io/wayfinder-extension
)
```

The build writes the unpacked extension to:

```text
~/.local/src/wayfinder-a3390ca5/packages/wayfinder-extension/dist
```

> **The displayed extension version is misleading in this checkout.**
> [PR #257](<https://github.com/ar-io/wayfinder/pull/257>), merged on August 13, 2026, fixes an extension registry-sync failure caused by a retired Solana RPC endpoint.
> The pinned checkout includes that fix and declares extension package version 2.0.1, but its [browser manifest](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/manifest.json>) still declares 2.0.0.
> Chrome will therefore display 2.0.0 for this source build too; that label alone does not distinguish it from the older store release.

To [load the unpacked extension in Chrome](<https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked>):

1. Open `chrome://extensions` and disable the existing store-installed Wayfinder extension, if present, so that the two copies do not interfere.
2. Enable **Developer mode**, click **Load unpacked**, and select the `dist` directory shown above. Navigate from your home directory and show hidden files if necessary to find `.local`.
3. Pin the newly loaded extension's icon to the toolbar.

Keep the built directory: Chrome loads the extension from there.
This copy does not receive Chrome Web Store updates; after a future rebuild, click **Reload** on its card at `chrome://extensions`.

**Connect to the gateway registry**

Even with the source build, the popup first displayed **Syncing...** and then **0 Healthy Gateways**.
The extension reads the Gateway Address Registry through a Solana RPC endpoint: an HTTP API through which it queries the blockchain.
Its default endpoint, `https://api.mainnet-beta.solana.com/`, rejected a `getAccountInfo` request with HTTP 403 and the message `Access forbidden`.

I reproduced the difference with the same JSON-RPC payload: ordinary `curl` received HTTP 200, while adding only an `Origin: chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` header produced HTTP 403.
The dummy extension origin therefore exposed an origin-based restriction in that endpoint's handling of my requests.
The source update had fixed the retired RPC endpoint, but its replacement still rejected my browser requests.

I resolved this by using a mainnet RPC URL from [Helius](<https://www.helius.dev/solana-rpc-nodes>).
Both forms of the account-read test succeeded with that endpoint, and the extension subsequently synchronised its registry:

1. Create a Helius account and obtain your Solana mainnet RPC URL from its [dashboard](<https://dashboard.helius.dev/>).
2. In Wayfinder's **Settings**, select **AR.IO Solana Mainnet** under **Network**, then switch to **Custom**. This retains the mainnet program IDs while allowing the RPC URL to be edited.
3. Replace **Solana RPC URL** with your Helius URL. Leave the values under **Advanced: AR.IO Program IDs** unchanged. Settings save automatically when the field changes; click outside the URL field after editing it.
4. Open the extension's **Gateways** page and use its sync control; an empty list offers **Sync Gateways**. Return to the popup to check the result.

The provider URL has this form; use your own API key:

```text
https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY
```

The popup then reported **181 Healthy Gateways** in my experiment.
Here, replacing the RPC means changing the server used to read the same Solana mainnet data; it requires no source patch, rebuild, wallet connection, or transaction signature.
Keep the API-key URL out of published examples and screenshots.

> **If gateway discovery fails:** open `chrome://extensions`, find the unpacked Wayfinder entry, and click its **service worker** link under **Inspect views**.
> Trigger a sync and inspect the developer tools' **Console** and **Network** tabs.
> The `SolanaError #8100002` I encountered contained `statusCode=403`; the failed request's response body revealed `Access forbidden`.
> The failure already affected the basic `getAccountInfo` read, so it was not evidence of a restriction specific to registry enumeration with `getProgramAccounts`.
> Changing the routing strategy cannot repair a rejected registry request.

**Open the website through Wayfinder**

In Settings, inspect the routing choices: **Top Staked**, **Fastest Ping**, **Balanced** (random selection), and **Static**.
Top Staked is the default; Static fixes one gateway, while the other modes select among candidates.

Use the directory upload's manifest for this browser test:

```text
ar://lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/
ar://lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/style.css
```

The manifest connects `index.html` and `style.css`, so the relative stylesheet link can resolve.
Opening the individual HTML object's ID instead displays the HTML without that manifest's path mapping.

> **Direct `ar://` navigation can invoke an external application.**
> In my Chrome-on-Linux test, it produced an **Open xdg-open?** prompt: Chrome was offering to pass the custom protocol to Linux's application launcher.
> Cancel that prompt and use the HTTP/HTTPS navigation route below; we do not need to register an operating-system handler for this experiment.

This checkout's [navigation handler](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/src/background.ts#L617-L659>) watches HTTP and HTTPS URLs for a query parameter named `q` whose decoded value begins with `ar://`.
I successfully opened the website through [this navigation URL](<https://www.google.com/search?q=ar%3A%2F%2FlhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE%2F>):

```text
https://www.google.com/search?q=ar%3A%2F%2FlhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE%2F
```

The `q=` parameter carries the `ar://` address, with the colon and slashes URL-encoded.
Wayfinder reads that value, selects a gateway, and redirects the tab to an HTTPS URL serving the manifest.
**The redirect is performed by Wayfinder.** Google uses `q` for search queries, but does not perform the Arweave lookup here; Chrome supplies the navigation events that the extension observes.
Without Wayfinder, this URL is simply a Google search.

The handler does not require Google's hostname, so Google is not an essential part of the mechanism.

Inspect the resulting HTTPS address and the extension's gateway and performance views to see which gateway served the request.
The extension's [documentation for this revision](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/README.md>) describes the routing settings and registry refresh controls.

> The extension's verification indicator should be read as the gateway's report.
> Its [routing implementation](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/src/routing.ts>) uses remote verification because it does not inspect the page's full response body itself.
> This differs from calculating the downloaded file's hash locally or verifying its data-item signature.
> My CLI checks above received both `true` and `false` verification headers for the same object, even on cache hits; I did not determine the cause.
> A successful browser redirect establishes that routing worked, while verification must be assessed separately.

Later, after creating the `test` undername and pointing it at our updated manifest, we can use `ar://test_weisser-zwerg` through the same navigation mechanism, with `q=ar%3A%2F%2Ftest_weisser-zwerg`.
The name will select the publication revision, while Wayfinder will select a gateway through which to access it.

### Connect the Manual Uploads with a Manifest

The directory upload already has a working website, while the manual path still consists of two separate file objects.
We will now connect those objects with an [Arweave path manifest](<https://docs.ar.io/build/upload/manifests>): a small JSON document that maps website paths to existing data-item IDs.
Uploading it creates one additional immutable object; the HTML and CSS remain at their original identifiers.

#### Create the Manifest Locally

Keep the manifest in the publication-state directory, outside `$site_dir`, so that a later `upload-folder` run will not include this bookkeeping file in the website.
The following commands read the two IDs from the retained manual receipts and construct the JSON with `jq`:

```bash
manual_v1_manifest_file="$publication_state_dir/manual-v1.manifest.json"
manual_v1_manifest_receipt="$publication_state_dir/manual-v1-manifest.receipt.json"

(
  set -e
  set -o noclobber
  manual_v1_html_id="$(jq -er '.id' "$manual_v1_html_receipt")"
  manual_v1_css_id="$(jq -er '.id' "$manual_v1_css_receipt")"

  jq -n --arg html "$manual_v1_html_id" --arg css "$manual_v1_css_id" '{
    manifest: "arweave/paths",
    version: "0.2.0",
    index: {path: "index.html"},
    paths: {
      "index.html": {id: $html},
      "style.css": {id: $css}
    },
    fallback: {id: $html}
  }' > "$manual_v1_manifest_file"
)

jq . "$manual_v1_manifest_file"
# {
#   "manifest": "arweave/paths",
#   "version": "0.2.0",
#   "index": {
#     "path": "index.html"
#   },
#   "paths": {
#     "index.html": {
#       "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
#     },
#     "style.css": {
#       "id": "AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q"
#     }
#   },
#   "fallback": {
#     "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
#   }
# }
wc -c "$manual_v1_manifest_file"
# 362 /home/user/workspaces/indie-publisher-template/publishing-arweave-ario-basics-site-publication-state/manual-v1.manifest.json
```

The fields have distinct roles:

* `manifest` and `version` identify the path-manifest format. `0.2.0` is the format version, not the website's revision number.
* `index.path` selects `index.html` when the gateway receives a request for the website's root.
* `paths` maps `index.html` and `style.css` to their already uploaded objects. It contains references, not the file contents.
* `fallback.id` selects an object to serve when a requested path is absent from the manifest.

I have included the same fallback behaviour as Turbo CLI's generated manifest: an unknown path returns the HTML page.
That field is optional.
The explicit `style.css` mapping is what makes the HTML's relative stylesheet link work.

Before uploading, compare this document with the manifest retained in the directory-upload result:

```bash
diff -u --label manual-v1 --label folder-v1 <(jq -S . "$manual_v1_manifest_file") <(jq -S '.manifest' "$folder_v1_result")
# --- manual-v1
# +++ folder-v1
# @@ -1,6 +1,6 @@
#  {
#    "fallback": {
# -    "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
# +    "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#    },
#    "index": {
#      "path": "index.html"
# @@ -8,10 +8,10 @@
#    "manifest": "arweave/paths",
#    "paths": {
#      "index.html": {
# -      "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
# +      "id": "staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg"
#      },
#      "style.css": {
# -      "id": "AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q"
# +      "id": "868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs"
#      }
#    },
#    "version": "0.2.0"
```

`jq -S` sorts object keys so that formatting and key order do not distract from the comparison.
Here, `diff` is expected to print differences and return status `1`: the IDs for both file paths and the HTML fallback differ between the two publication tracks.
The format, entry path, and path names should agree.

#### Upload the Manifest and Retain Its Receipt

Use the existing receipt helper, this time with the manifest-specific content type:

```bash
upload_file_and_retain_receipt "$manual_v1_manifest_file" application/x.arweave-manifest+json "$manual_v1_manifest_receipt"
# {
#   "id": "Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs",
#   "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "winc": "0",
#   "timestamp": 1794213021537,
#   "version": "0.2.0",
#   "deadlineHeight": 2038805,
#   "dataCaches": [
#     "turbo-gateway.com"
#   ],
#   "fastFinalityIndexes": [
#     "turbo-gateway.com"
#   ]
# }
```

The `Content-Type` tag tells gateways to interpret the JSON as a path manifest.
The helper signs and uploads only this JSON file and retains the complete response; it does not upload the referenced HTML or CSS again.
This small manifest should also fit within the free allowance checked earlier; inspect the returned `winc` value to confirm the actual charge.

After a successful upload, extract its identifier:

```bash
manual_v1_manifest_id="$(jq -er '.id' "$manual_v1_manifest_receipt")"

printf 'Manual website:    %s/%s/\n' "$gateway_base" "$manual_v1_manifest_id"
# Manual website:    https://turbo-gateway.com/Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs/
#                    ar://Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs/
printf 'Directory website: %s/%s/\n' "$gateway_base" "$folder_v1_manifest_id"
# Directory website: https://turbo-gateway.com/lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/
#                    ar://lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/
```

The new ID identifies the manifest itself, rather than either file.
Keep its receipt alongside the two file receipts: together they record this first manual publication.
If the helper reports an error after contacting Turbo, inspect its retained output before considering another upload, as described in the earlier upload section.

#### Compare the Stored Manifests and the Websites They Serve

First, use the existing `/raw/` helper to retrieve the manual manifest JSON and compare it with the local document:

```bash
fetch_and_compare manual-v1-manifest "$manual_v1_manifest_id" "$manual_v1_manifest_file"
```

Having checked the stored manual manifest, we can now compare how both manifests serve the website:

```bash
(
  set -e
  for track in manual folder; do
    case "$track" in
      manual) manifest_id="$manual_v1_manifest_id" ;;
      folder) manifest_id="$folder_v1_manifest_id" ;;
    esac

    curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$gateway_state_dir/$track-v1-resolved-index.html" "$gateway_base/$manifest_id/"
    cmp -- "$site_dir/index.html" "$gateway_state_dir/$track-v1-resolved-index.html"

    curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$gateway_state_dir/$track-v1-resolved-style.css" "$gateway_base/$manifest_id/style.css"
    cmp -- "$site_dir/style.css" "$gateway_state_dir/$track-v1-resolved-style.css"

    printf '%s v1: manifest root and stylesheet match the local files\n' "$track"
  done
)
```

The root request tests `index.path`; the stylesheet request tests the `style.css` mapping.
Open both website URLs printed above in a browser as well, keeping the trailing slash so that the relative stylesheet URL stays below the manifest's path.
Both should display the same styled first version of the page.

We now have the same publication structure through both paths: two file objects and one manifest per website.
The difference is who assembled the mapping: the manual path used explicit IDs, while `upload-folder` produced it automatically.
In the next step, we will change only the HTML and use that explicit mapping to retain the manual path's original CSS object.

### Update Only the HTML and Publish Both Ways Again

Both first-version websites now have a manifest connecting their HTML and CSS objects.
We will change only the local HTML, then repeat the two publication paths: explicitly reuse the manual path's CSS object, and let `upload-folder` publish the complete directory again.
Use new `v2` filenames for all receipts and manifests so that the first publication's records remain available.

#### Prepare the Second Version Locally

Before editing, retain the first version's source files outside the website directory:

```bash
v1_source_dir="$publication_state_dir/source-v1"
install -d -- "$v1_source_dir"

(
  set -e
  set -o noclobber
  cat "$site_dir/index.html" > "$v1_source_dir/index.html"
  cat "$site_dir/style.css" > "$v1_source_dir/style.css"
)
```

These copies will let us compare the old publication with its original source in the next section.
They are verification material; reusing an uploaded object requires its ID, not a local copy of its bytes.

Now replace the version number in the paragraph, leaving the relative stylesheet link unchanged:

```bash
sed 's/This is version 1/This is version 2/' "$v1_source_dir/index.html" > "$site_dir/index.html"

diff -u "$v1_source_dir/index.html" "$site_dir/index.html"
cmp -- "$v1_source_dir/style.css" "$site_dir/style.css"
```

The `diff` should show only the paragraph's change from `version 1` to `version 2`; its status `1` means the files differ as intended.
The CSS comparison should produce no output and return status `0`.
Use the local HTTP server introduced earlier to preview the page: its text should now say version 2, with the same styling.

#### Path A: Upload the Changed HTML and Reuse the CSS

Start by uploading only the changed HTML through the existing helper:

```bash
manual_v2_html_receipt="$publication_state_dir/manual-v2-index.receipt.json"
manual_v2_manifest_file="$publication_state_dir/manual-v2.manifest.json"
manual_v2_manifest_receipt="$publication_state_dir/manual-v2-manifest.receipt.json"

upload_file_and_retain_receipt "$site_dir/index.html" text/html "$manual_v2_html_receipt"
# {
#   "id": "3PZ2t9dhaLGTNqn8beKRP0iHVCvfRR4CqqFiPD-C9mw",
#   "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "winc": "0",
#   "timestamp": 1794214243932,
#   "version": "0.2.0",
#   "deadlineHeight": 2038815,
#   "dataCaches": [
#     "turbo-gateway.com"
#   ],
#   "fastFinalityIndexes": [
#     "turbo-gateway.com"
#   ]
# }
```

After that upload succeeds, create the successor manifest from the first manual manifest.
Replace the HTML path's ID and the fallback ID, because both should now select the new page:

```bash
(
  set -e
  set -o noclobber
  manual_v2_html_id="$(jq -er '.id' "$manual_v2_html_receipt")"
  jq --arg html "$manual_v2_html_id" '
    .paths["index.html"].id = $html |
    .fallback.id = $html
  ' "$manual_v1_manifest_file" > "$manual_v2_manifest_file"
)

diff -u --label manual-v1 --label manual-v2 <(jq -S . "$manual_v1_manifest_file") <(jq -S . "$manual_v2_manifest_file")
# --- manual-v1
# +++ manual-v2
# @@ -1,6 +1,6 @@
#  {
#    "fallback": {
# -    "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
# +    "id": "3PZ2t9dhaLGTNqn8beKRP0iHVCvfRR4CqqFiPD-C9mw"
#    },
#    "index": {
#      "path": "index.html"
# @@ -8,7 +8,7 @@
#    "manifest": "arweave/paths",
#    "paths": {
#      "index.html": {
# -      "id": "KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8"
# +      "id": "3PZ2t9dhaLGTNqn8beKRP0iHVCvfRR4CqqFiPD-C9mw"
#      },
#      "style.css": {
#        "id": "AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q"
```

Only those two HTML references should differ.
The `paths["style.css"].id` value remains exactly the one recorded in the first manual manifest.
There is no CSS upload command and no new CSS receipt: the second publication will refer to the existing object.
The manifest's `version` remains `0.2.0`, because the manifest format has not changed.

Upload the successor manifest with the same content type as before:

```bash
upload_file_and_retain_receipt "$manual_v2_manifest_file" application/x.arweave-manifest+json "$manual_v2_manifest_receipt"
# {
#   "id": "nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ",
#   "owner": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "winc": "0",
#   "timestamp": 1794214320935,
#   "version": "0.2.0",
#   "deadlineHeight": 2038815,
#   "dataCaches": [
#     "turbo-gateway.com"
#   ],
#   "fastFinalityIndexes": [
#     "turbo-gateway.com"
#   ]
# }
```

After this succeeds, retain its ID and print the new website URL:

```bash
manual_v2_html_id="$(jq -er '.id' "$manual_v2_html_receipt")"
manual_v2_manifest_id="$(jq -er '.id' "$manual_v2_manifest_receipt")"
printf 'Manual version 2: %s/%s/\n' "$gateway_base" "$manual_v2_manifest_id"
# Manual version 2: https://turbo-gateway.com/nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/
#                   ar://nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/
```

This update adds two objects: the new HTML and the new manifest.
It leaves the first manifest and both original file objects intact.
Calling it a *successor* describes how we constructed it; Arweave does not overwrite the old manifest or automatically mark this one as the latest publication.

#### Path B: Upload the Updated Directory Again

Now run the same [`upload-folder` command](<https://github.com/ardriveapp/turbo-sdk/tree/v2.2.0#upload-folder>) against `$site_dir`, saving its output under new names:

```bash
folder_v2_result="$publication_state_dir/folder-v2-result.json"
folder_v2_cli_output="$folder_v2_result.cli-output"

(
  set -e
  set -o noclobber
  if test -e "$folder_v2_result"; then
    printf 'Refusing to overwrite existing result: %s\n' "$folder_v2_result" >&2
    exit 1
  fi

  turbo upload-folder --token arweave --wallet-file "$upload_wallet_file" --folder-path "$site_dir" --index-file index.html --quiet > "$folder_v2_cli_output"
  sed '1s/^Uploaded folder: //' "$folder_v2_cli_output" > "$folder_v2_result"
  jq -e '.fileResponses and .manifest.paths and .manifestResponse.id' "$folder_v2_result" >/dev/null
)
```

The source snapshots, manifests, and receipts remain outside `$site_dir`, so the directory still contains only `index.html` and `style.css`.
Turbo CLI 2.2.0 uploads both files again and creates a new manifest; it does not consult the first directory-upload result to reuse its CSS object.
With the Arweave JWK signer used here, the unchanged stylesheet receives a new signed data-item ID even though its bytes are unchanged.

After the command succeeds, extract the new identifiers and inspect a compact summary:

```bash
folder_v2_html_id="$(jq -er '.manifest.paths["index.html"].id' "$folder_v2_result")"
folder_v2_css_id="$(jq -er '.manifest.paths["style.css"].id' "$folder_v2_result")"
folder_v2_manifest_id="$(jq -er '.manifestResponse.id' "$folder_v2_result")"

jq '{
  paths: .manifest.paths,
  manifestId: .manifestResponse.id,
  fileCharges: [.fileResponses[] | {id, winc}],
  manifestCharge: .manifestResponse.winc
}' "$folder_v2_result"

printf 'Directory version 2: %s/%s/\n' "$gateway_base" "$folder_v2_manifest_id"
# {
#   "paths": {
#     "index.html": {
#       "id": "la8fiFoR63WKQXqfYnbynuG_JfobX3yf1WVZZfPohMs"
#     },
#     "style.css": {
#       "id": "mChucfbAZ-qLs0h9EEyOS1N8MUYLfY7MSA1tqDtyR0Q"
#     }
#   },
#   "manifestId": "SvC3b7uhkk0J5fXyD_a_HhRn-NBEuYOWTKW-U8qdCOs",
#   "fileCharges": [
#     {
#       "id": "la8fiFoR63WKQXqfYnbynuG_JfobX3yf1WVZZfPohMs",
#       "winc": "0"
#     },
#     {
#       "id": "mChucfbAZ-qLs0h9EEyOS1N8MUYLfY7MSA1tqDtyR0Q",
#       "winc": "0"
#     }
#   ],
#   "manifestCharge": "0"
# }
# Directory version 2: https://turbo-gateway.com/SvC3b7uhkk0J5fXyD_a_HhRn-NBEuYOWTKW-U8qdCOs/
```

The complete result retains both file receipts and the manifest receipt; the summary does not replace that record.
The small uploads should still fit the remaining free allowance, and the `winc` fields show what Turbo actually charged.
If an upload succeeds but processing its response fails, recover the retained CLI output before attempting another upload.

The two update paths therefore add different numbers of objects:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Update path</th>
      <th scope="col">New HTML</th>
      <th scope="col">New CSS</th>
      <th scope="col">New manifest</th>
      <th scope="col">Total new objects</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Manual</td>
      <td>Yes</td>
      <td>No; retains the original CSS ID</td>
      <td>Yes</td>
      <td>2</td>
    </tr>
    <tr>
      <td>Directory</td>
      <td>Yes</td>
      <td>Yes; contains unchanged CSS bytes</td>
      <td>Yes</td>
      <td>3</td>
    </tr>
  </tbody>
</table>

In the next section, we will open all four manifest URLs, compare version 1 against the saved source and version 2 against the working directory, and verify the CSS reuse directly from the identifiers and downloaded bytes.

### Compare All Four Publications

We can now check both revisions through both manifests.
Compare version 1 with the saved source in `$v1_source_dir` and version 2 with `$site_dir`; comparing every page with the current HTML would incorrectly reject the older publication.

The following helper checks the root page and stylesheet, retains the manifest JSON, and prints its website URL and CSS identifier:

```bash
comparison_dir="$publication_state_dir/compare-v1-v2"
install -d -- "$comparison_dir"

check_publication() {
  local label="$1" manifest_id="$2" source_dir="$3"

  curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$comparison_dir/$label.html" "$gateway_base/$manifest_id/" || return 1
  cmp -- "$source_dir/index.html" "$comparison_dir/$label.html" || return 1

  curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$comparison_dir/$label.css" "$gateway_base/$manifest_id/style.css" || return 1
  cmp -- "$source_dir/style.css" "$comparison_dir/$label.css" || return 1

  curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$comparison_dir/$label.manifest.json" "$gateway_base/raw/$manifest_id" || return 1
  local css_id
  css_id="$(jq -er '.paths["style.css"].id' "$comparison_dir/$label.manifest.json")" || return 1
  printf '%s matched: %s/%s/\n  CSS: %s\n' "$label" "$gateway_base" "$manifest_id" "$css_id"
}

check_publication manual-v1 "$manual_v1_manifest_id" "$v1_source_dir"
# manual-v1 matched: https://turbo-gateway.com/Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs/
#   CSS: AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
check_publication manual-v2 "$manual_v2_manifest_id" "$site_dir"
# manual-v2 matched: https://turbo-gateway.com/nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/
#   CSS: AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
check_publication folder-v1 "$folder_v1_manifest_id" "$v1_source_dir"
# folder-v1 matched: https://turbo-gateway.com/lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/
#   CSS: 868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs
check_publication folder-v2 "$folder_v2_manifest_id" "$site_dir"
# folder-v2 matched: https://turbo-gateway.com/SvC3b7uhkk0J5fXyD_a_HhRn-NBEuYOWTKW-U8qdCOs/
#   CSS: mChucfbAZ-qLs0h9EEyOS1N8MUYLfY7MSA1tqDtyR0Q
```

Open the four printed website URLs in a browser.
Both first versions should still display **version 1**, and both second versions should display **version 2**, all with the same styling.

Finally, compare the CSS references from the downloaded manifests:

```bash
jq -s '
  map(.paths["style.css"].id) |
  {manualReusesCSS: (.[0] == .[1]), directoryReusesCSS: (.[2] == .[3])}
' "$comparison_dir/manual-v1.manifest.json" "$comparison_dir/manual-v2.manifest.json" "$comparison_dir/folder-v1.manifest.json" "$comparison_dir/folder-v2.manifest.json"
# { "manualReusesCSS": true, "directoryReusesCSS": false }

cmp -- "$comparison_dir/manual-v1.css" "$comparison_dir/manual-v2.css"
cmp -- "$comparison_dir/manual-v1.css" "$comparison_dir/folder-v1.css"
cmp -- "$comparison_dir/manual-v1.css" "$comparison_dir/folder-v2.css"
```

The manual update retains the exact CSS object; the directory update creates another object containing identical bytes.
The earlier websites remain accessible because neither update overwrites their manifests or files.
Next, we will give the second manual publication a human-readable ArNS undername.

### Give the Website an ArNS Undername

An *undername* is a named record beneath an existing ArNS name, similar to a subdomain.
ArNS separates it from the base name with an underscore: `test` beneath `weisser-zwerg` becomes `test_weisser-zwerg`, accessible through a gateway as [`test_weisser-zwerg.ar.io`](<https://test_weisser-zwerg.ar.io/>).
The record belongs to the same [ANT](<https://docs.ar.io/learn/arns/ants/#undernames>) that controls the base name; we do not buy another independently registered name.

My permanent purchase of `weisser-zwerg` included **ten undername slots**, as recorded in the [ownership check in the appendix](#support-handoff-and-independent-verification).
We choose and create the records ourselves within that capacity.
The root record, shown as `@` in the Console, is separate from that allowance.
Creating `test` uses one slot; changing its target later continues to use the same slot.
Additional capacity can be purchased if needed.

The new record will connect the parts we have already prepared:

```text
test_weisser-zwerg
        │
        ▼
manual version 2 manifest
        ├── index.html → version 2 HTML object
        └── style.css  → original CSS object
```

The base name `weisser-zwerg` keeps its existing root target, leaving it available for my other projects.

#### Prepare the Record in the Console

The ANT belongs to the Solana account established in MetaMask, so that identity must authorise the change.
The disposable Arweave upload key has no authority over the name.

First, print the manifest ID to copy into the Console:

```bash
printf '%s\n' "$manual_v2_manifest_id"
# nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ
```

Open the [Console page for `weisser-zwerg`](<https://console.ar.io/domains/weisser-zwerg>) while connected with its MetaMask owner account.
In **Records**, choose **Add record** and enter:

* **Undername:** `test`, without the base name or gateway domain.
* **Protocol:** Arweave.
* **Target (Arweave TX ID):** the manifest ID printed above. Use the manifest's ID, not the HTML object's ID, so that the relative stylesheet path also resolves.
* **Cache time (TTL, seconds):** `3600`.

TTL tells gateways how long they may cache the name's resolution before checking again; it does not expire the undername after one hour.
Leave the optional metadata and priority fields unchanged.

> **An included slot does not make every record update free.**
> The [Console's payment options for changes](<https://docs.ar.io/build/guides/working-with-arns/buy-manage-arns-console#who-pays-for-a-change>) use either SOL from the owner's wallet for a direct transaction or Turbo credits to pay for a sponsored update.
> Review the cost shown before saving. If credits are needed, use the [top-up procedure above](#if-the-free-allowance-is-not-enough) for the long-lived MetaMask account; the upload identity's free allowance does not cover this operation.

With sufficient SOL or directly held Turbo credits, the [Console workflow](<https://docs.ar.io/build/guides/working-with-arns/buy-manage-arns-console#edit-records>) continues with **Save record** and approval in the connected wallet.
I instead wanted to spend credits left over from an earlier experiment.
That exposed a limitation in the Console's handling of shared credits, so I completed the update through the CLI as described below.

#### Share the Remaining Credits from an Earlier Experiment

The earlier [`indie-publisher-demo` experiment](#transferring-an-existing-arns-name) used the locally managed Solana identity [`87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty`](<https://solscan.io/account/87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty>).
After transferring that name to my long-lived owner address, the old identity still held `0.122911751545` Turbo credits.
Those credits were sufficient for the quoted record update, while the MetaMask address had no credits of its own and no SOL.

I shared the entire remaining amount with the MetaMask Solana address, with no expiration.
For a payer whose Solana key is stored locally as a JSON keypair file, the corresponding CLI commands are:

```bash
old_payer_address="87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty"
arns_owner_address="BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
old_payer_wallet_file="/path/to/earlier-solana-keypair.json"

turbo balance --token solana --address "$old_payer_address"

turbo share-credits --token solana --wallet-file "$old_payer_wallet_file" --address "$arns_owner_address" --value 0.122911751545

turbo list-shares --token solana --address "$arns_owner_address"
```

The path and amount must match the payer and balance being used; the value above records my experiment.
Omitting `--expires-by-seconds` leaves the approval without an expiration date.
It remains capped at the shared amount and revocable by the original payer.
For a temporary allowance instead, add an expiration such as `--expires-by-seconds 3600`.
As explained in the [credit-sharing appendix](#turbo-credits%3A-share-spending-authority-rather-than-moving-the-balance), the credits remain associated with the old address: the recipient receives spending authority, not ownership of the balance.

> **Displaying shared credits does not necessarily mean an operation can spend them.**
> In one of my tests, the Console displayed the received `0.122911751545` credits, but saving the record failed with HTTP `402` for insufficient credits after the owner had signed.
> The AR.IO Console's [record-update implementation at the time](<https://github.com/ar-io/ar-io-console/blob/323c6b499f7323f56e0e8a4f39601eaad2c6f882/src/features/arns/records/sponsoredWriter.ts>) called `setArNSRecord` without `paidBy`, the parameter identifying whose shared credits to use.
> The request therefore did not use the available allowance.
> A [direct top-up](<https://console.ar.io/topup>) of the owner's Turbo balance is an alternative; I chose to use the existing allowance through the CLI's explicit `--paid-by` option.

#### Export the Owner's Solana Key through Phantom

Turbo CLI 2.2.0 accepts the payer through `--paid-by`, but it also requires the ANT owner's Solana private key through `--owner-key`.
It has no browser-wallet signing handoff: the checkout URLs used earlier were for card payments, not wallet signatures.
I used [Phantom](<https://phantom.com/download>) to export the owner's Solana private key because that option was not available in [MetaMask](https://metamask.com/)'s browser extension at the time of writing.

Phantom is another wallet application and can [coexist with MetaMask in Chrome](<https://help.phantom.com/articles/12182813094163>).
Importing the same recovery phrase gives it access to the corresponding accounts; it does not transfer assets or change the ANT's owner.
The two applications can control the same Solana identity independently.

The browser-extension steps are:

1. Install Phantom from its official [download page](<https://phantom.com/download>) and choose **I Already Have a Wallet → Import Recovery Phrase**, following its [restoration instructions](<https://help.phantom.com/articles/sign-in-to-or-import-your-phantom-wallet-15079894392851>).
2. Import the recovery phrase for the wallet containing the ArNS owner. Select the Solana account and check that its address is exactly `BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ`. If it differs, resolve that mismatch before continuing.
3. Open **profile avatar → Settings → Manage Accounts → the matching account → Show Private Key → Solana**, as described in Phantom's [private-key export instructions](<https://help.phantom.com/articles/25334064171795>).
4. Copy the Solana private key for the CLI prompt below. Use the exported key, not an Ethereum key or the recovery phrase.

The base58 Solana key exported by Phantom worked unchanged with Turbo.
There was no need to connect Phantom to the Console for this step.

> This gives Phantom access to the accounts covered by the recovery phrase and gives the CLI access to the exported owner's key.
> That key controls the long-lived ArNS identity; it is not the disposable Arweave upload key.
> Keep both secrets out of project files, screenshots, and any other material that might be made public.

#### Set the Record with an Explicit Payer

The command below uses the same owner key in two roles:

* `--private-key` authenticates as the recipient of the credit share, `BT7…VuBoZ`.
* `--owner-key` authorises the record change as the ANT owner, also `BT7…VuBoZ`.
* `--paid-by` selects the original credit holder, `87sw…cyty`, whose active allowance pays for the operation.

The old payer does not need authority over the ANT.
Turbo sponsors the Solana transaction by paying its network fees and charging for the service in Turbo credits.
The owner therefore does not need SOL for this route.
Keep the credit-sharing approval active while submitting the update.

We can inspect the current price first:

```bash
turbo arns-action-price --action set-record
```

I then ran the following command with Turbo CLI 2.2.0.
Running it submits the update and spends credits; the hidden prompt prevents the literal key from being recorded in shell history:

```bash
(
  set +x

  IFS= read -r -s -p 'Solana private key for BT7…VuBoZ: ' arns_owner_key
  printf '\n'
  [ -n "$arns_owner_key" ] || exit 1

  turbo --token solana set-arns-record \
    --private-key "$arns_owner_key" \
    --owner-key "$arns_owner_key" \
    --paid-by 87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty \
    --ant-id GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ \
    --undername test \
    --transaction-id nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ \
    --ttl-seconds 3600
)
```

The variable disappears when the subshell exits, although the CLI receives the key through process arguments while it runs.
Readers following this example must substitute their own payer, ANT, and manifest identifiers.

The command returned:

```json
{
  "message": "ArNS record set!",
  "nonce": "466000d1-925b-4821-8515-994f0f858785",
  "action": "set-record",
  "status": "completed",
  "antId": "GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ",
  "messageId": "5WARfpUcMsnNfNRcXeTf8nayueAR2CrNSE9sVrMSuuEMY6FKSZBEQpzv4NLF3JrcKmcJGEK6uCbZFZGe5di7F1Sj"
}
```

Retain this result, including the [nonce](https://payment.ardrive.io/v1/arns/actions/466000d1-925b-4821-8515-994f0f858785) and transaction identifier.
My update is recorded in [this Solana transaction](<https://solscan.io/tx/5WARfpUcMsnNfNRcXeTf8nayueAR2CrNSE9sVrMSuuEMY6FKSZBEQpzv4NLF3JrcKmcJGEK6uCbZFZGe5di7F1Sj>) on the [`weisser-zwerg` ANT](<https://solscan.io/account/GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ>).
The Console then showed the correct `test` record, and [`test_weisser-zwerg.ar.io`](<https://test_weisser-zwerg.ar.io/>) served the second manual publication successfully.

#### Resolve the Name and Retrieve the Website

Once the record is confirmed, open [`https://test_weisser-zwerg.ar.io/`](<https://test_weisser-zwerg.ar.io/>).
It should display the styled **version 2** page.
Gateways cache name lookups, so a newly created or changed record may not appear everywhere immediately; allow caches to refresh if a gateway still reports the old state or cannot yet find the name.

We can also inspect the gateway's resolution directly and compare its target with our saved manifest ID:

```bash
arns_name="test_weisser-zwerg"
arns_state_dir="$publication_state_dir/arns-test"
install -d -- "$arns_state_dir"

(
  set -e
  # https://turbo-gateway.com/ar-io/resolver/test_weisser-zwerg
  curl --fail --location --retry 12 --retry-delay 5 --retry-all-errors --output "$arns_state_dir/resolution.json" "$gateway_base/ar-io/resolver/$arns_name"
  jq '{txId, ttlSeconds, antId}' "$arns_state_dir/resolution.json"
  jq -e --arg expected "$manual_v2_manifest_id" '.txId == $expected' "$arns_state_dir/resolution.json"
)
# {
#   "txId": "nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ",
#   "ttlSeconds": 3600,
#   "antId": "GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ"
# }
# true
```

The final check should print `true` and return status `0`.
This checks the mutable name's destination separately from the file contents.

Now repeat the Wayfinder retrieval using the name, with automatic gateway selection and hash verification:

```bash
(
  set -e
  wayfinder fetch "ar://$arns_name/" --routing fastest --verify hash --output "$arns_state_dir/index.html" --verbose
  cmp -- "$site_dir/index.html" "$arns_state_dir/index.html"

  wayfinder fetch "ar://$arns_name/style.css" --routing fastest --verify hash --output "$arns_state_dir/style.css" --verbose
  cmp -- "$site_dir/style.css" "$arns_state_dir/style.css"
)
```

Both comparisons should produce no output and succeed.

> Wayfinder may print a misleading verification summary, as explained in [What Does Wayfinder Verify?](#what-does-wayfinder-verify?).

The root request follows the manifest's `index.path`; the second follows its `style.css` mapping.
The [browser extension](#use-wayfinder-in-the-browser) can use `ar://test_weisser-zwerg/` through the same `q=` navigation mechanism introduced earlier.
In my browser, Wayfinder opened [https://test_weisser-zwerg.turbo-gateway.com/](<https://test_weisser-zwerg.turbo-gateway.com/>).

For a later publication, we can change the `test` record to a new manifest ID while keeping this human-readable address.
Earlier manifests and their files remain accessible through their immutable IDs.

## Find Past Publications Again

What if the local receipts and publication IDs are lost?
The uploaded objects still exist, and we can search for them using the **Arweave upload signer's public address**.
In this experiment, that is `6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY`.
The MetaMask Solana address owns the ArNS name and can pay for uploads, but it did not sign these HTML, CSS, or manifest objects.
Searching for uploads by that address would therefore miss them.

No wallet connection, signature, or payment is needed for this lookup.
Even the private JWK is unnecessary if we still know its public address.
If only the JWK remains, derive its address using the local calculation in [Create and Inspect the Upload Signer](#create-and-inspect-the-upload-signer).

> The intentionally disposable upload key can remain disposable, but keep a record of its **public address** if you want to find its uploads again.
> If a new signer was used for each publication, search each of those addresses.
> A common Turbo payer does not provide an equivalent public catalogue of the objects signed by those different identities.

### List the Uploader's Objects

AR.IO gateways expose a [GraphQL search API](<https://docs.ar.io/build/access/find-data>) for indexed transactions and bundled data items, including the files uploaded through Turbo.
The `owners` filter refers to the identity that signed each item.
This gives us a direct lookup independent of the account connected to the Console.

The following commands use only `curl`, `jq`, and the public address.
They work without the walkthrough's earlier shell variables or receipt files and save the results in a new temporary directory outside the website:

```bash
# Replace this example with your Arweave upload signer's public address.
recovery_owner="6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY"
recovery_gateway="https://turbo-gateway.com"
recovery_dir="$(mktemp -d "${TMPDIR:-/tmp}/arweave-recovery.XXXXXX")"
printf 'Recovery results: %s\n' "$recovery_dir"

cat > "$recovery_dir/query.graphql" <<'GRAPHQL'
query Uploads($owner: String!, $after: String) {
  transactions(owners: [$owner], first: 100, after: $after, sort: HEIGHT_DESC) {
    pageInfo { hasNextPage }
    edges {
      cursor
      node {
        id
        data { size type }
        tags { name value }
      }
    }
  }
}
GRAPHQL

(
  set -e
  recovery_after=""
  : > "$recovery_dir/items.jsonl"

  while :; do
    jq -n --rawfile query "$recovery_dir/query.graphql" --arg owner "$recovery_owner" --arg after "$recovery_after" \
      '{query: $query, variables: {owner: $owner, after: (if $after == "" then null else $after end)}}' > "$recovery_dir/request.json"

    curl --fail --silent --show-error --retry 3 --max-time 60 --header 'Content-Type: application/json' --data-binary @"$recovery_dir/request.json" \
      --output "$recovery_dir/page.json" "$recovery_gateway/graphql"

    # GraphQL can report an error even when HTTP returned status 200.
    jq -e 'if (.errors | length) > 0 then error(.errors | tojson) else .data.transactions end' "$recovery_dir/page.json" > /dev/null
    jq -c '.data.transactions.edges[].node' "$recovery_dir/page.json" >> "$recovery_dir/items.jsonl"

    if [ "$(jq -r '.data.transactions.pageInfo.hasNextPage' "$recovery_dir/page.json")" != true ]; then
      break
    fi
    recovery_after="$(jq -er '.data.transactions.edges[-1].cursor' "$recovery_dir/page.json")"
  done

  jq -s . "$recovery_dir/items.jsonl" > "$recovery_dir/items.json"
  jq -r '.[] | [.id, .data.type, .data.size] | @tsv' "$recovery_dir/items.json"
)
# Recovery results: /tmp/arweave-recovery.e29XEU
# 3PZ2t9dhaLGTNqn8beKRP0iHVCvfRR4CqqFiPD-C9mw     text/html       464
# nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ     application/x.arweave-manifest+json     362
# mChucfbAZ-qLs0h9EEyOS1N8MUYLfY7MSA1tqDtyR0Q     text/css        422
# la8fiFoR63WKQXqfYnbynuG_JfobX3yf1WVZZfPohMs     text/html       464
# SvC3b7uhkk0J5fXyD_a_HhRn-NBEuYOWTKW-U8qdCOs     application/x.arweave-manifest+json     281
# Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs     application/x.arweave-manifest+json     362
# 868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs     text/css        422
# staOnOzNTVhTnNTaSKOAQGVEQ8y2zTptH6FkKfpzgRg     text/html       464
# lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE     application/x.arweave-manifest+json     281
# KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8     text/html       464
# ByemZinZMyK48ELeuCvHjCfDz7yOilRbxfLXEbi4nas     text/html       464
# AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q     text/css        422
```

The output lists each object's ID, content type, and size in bytes.
The loop follows the last result's `cursor` while `hasNextPage` is true, so it does not stop after the first 100 objects.
Currently, this lookup returned **12 objects** for my signer, including an earlier extra HTML upload and all four website manifests.
These are individual stored objects, not twelve website versions.

> For an interactive browser view, open the gateway's [GraphQL explorer](<https://turbo-gateway.com/graphql>).
> Paste the query from `query.graphql` and set its variables to `{"owner":"6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY","after":null}`.
> The [gateway API documentation](<https://docs.ar.io/apis/ar-io-node/index-querying/>) explains this explorer and the available search fields.

### Recover the Website Links and File Paths

For a complete website, look for objects with the content type `application/x.arweave-manifest+json`.
We can turn their recovered IDs directly into website URLs:

```bash
jq -r --arg gateway "$recovery_gateway" '.[] | select(.data.type == "application/x.arweave-manifest+json") | "\($gateway)/\(.id)/"' "$recovery_dir/items.json"
```

My results included the [manual first version](<https://turbo-gateway.com/Dy88jh7QtXa9GigK-1Z8Hu21im_2t_ddAHdvYB0bqcs/>), [manual second version](<https://turbo-gateway.com/nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/>), [directory first version](<https://turbo-gateway.com/lhxCor-hhZ9Myp3_KUG343FfL_Y_1IAEKbiaNVeQeYE/>), and [directory second version](<https://turbo-gateway.com/SvC3b7uhkk0J5fXyD_a_HhRn-NBEuYOWTKW-U8qdCOs/>).
Opening those links lets us recognise the versions without the original receipts.
The manifest also restores the connection between filenames and IDs, which an individual file object need not contain.
For example, select the recovered manual second-version manifest and read its JSON through `/raw/`:

```bash
# Choose a manifest ID from your query results; this is my manual version 2.
recovered_manifest_id="nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ"

curl --fail --location --retry 3 --output "$recovery_dir/manifest.json" "$recovery_gateway/raw/$recovered_manifest_id"
jq -r '.paths | to_entries[] | [.key, .value.id] | @tsv' "$recovery_dir/manifest.json"
# index.html  3PZ2t9dhaLGTNqn8beKRP0iHVCvfRR4CqqFiPD-C9mw
# style.css   AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q
```

The signer lookup recovers the uploaded objects; the manifests show which files belong together.
This recovers publication IDs and file mappings, but it does not recreate Turbo's original signed upload receipts.

> A gateway searches its own index, not a guaranteed complete catalogue of everything on Arweave.
> Recent uploads may not be indexed yet, and coverage can differ between gateways, particularly for bundled data items.
> If something is missing, retry later or query another index, such as [Goldsky's Arweave GraphQL endpoint](<https://arweave-search.goldsky.com/graphql>).
> An empty result alone does not prove that the data is gone.

### Recover Previous Targets Through ArNS

If we remember the ArNS name, we have another starting point even if the upload signer's address is lost.
The resolver returns only the current target, but earlier record changes can be reconstructed from the ANT's Solana transaction history.
This follows the name rather than the uploader, so it also works when successive publications use different upload identities.

The recovery process is:

1. Resolve the name to identify its ANT. For example, the [resolver response for `test_weisser-zwerg`](<https://turbo-gateway.com/ar-io/resolver/test_weisser-zwerg>) contains the `antId` as well as the current manifest ID.
2. List transactions involving that ANT with Solana's [`getSignaturesForAddress`](<https://solana.com/docs/rpc/http/getsignaturesforaddress>) method. It returns results from newest to oldest; for a longer history, use the last result's signature as the next request's `before` parameter.
3. Retrieve the transactions with [`getTransaction`](<https://solana.com/docs/rpc/http/gettransaction>), discard failed transactions, and decode the relevant record changes using the [ANT program's instruction and event definitions](<https://github.com/ar-io/ar-io-solana-contracts/blob/e548e28992d1d63242d0f17edd32f0c3161e99c0/programs/ario-ant/src/lib.rs>). Follow the desired undername, here `test`; initialisation, updates, and removals determine its history.
4. Open the recovered Arweave targets. If a target is a manifest, it provides the website's file paths and IDs just as above.

No wallet connection, private key, or payment is required for these reads.
The [ANT's Solscan page](<https://solscan.io/account/GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ>) provides a browser starting point for inspecting its transactions.
The RPC route exposes the underlying data, although the program instructions and events need decoding before their fields become readable.

I checked this against my actual ANT.
Its returned history contained [the successful `set-record` transaction](<https://solscan.io/tx/5WARfpUcMsnNfNRcXeTf8nayueAR2CrNSE9sVrMSuuEMY6FKSZBEQpzv4NLF3JrcKmcJGEK6uCbZFZGe5di7F1Sj>), from which I decoded:

```text
Time:       2026-11-09 11:39:54 UTC
Undername:  test
Target:     nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ
TTL:        3600 seconds
```

That recovers the [manual second version](<https://turbo-gateway.com/nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/>) independently of both the Arweave signer lookup and Turbo's action nonce.
In this experiment, `test` had only this one target assignment in the returned history.
It therefore cannot reveal the other three publications, because the undername never pointed to them.
This method recovers **versions referenced by the name**, rather than every object an uploader ever stored.

> Historical recovery depends on the RPC provider retaining the older transactions; a node's [available ledger history](<https://solana.com/docs/rpc/http/getfirstavailableblock>) can be limited.
> If the name was reassigned to another ANT, we must also follow those registry changes and inspect the earlier ANTs.
> A complete reconstruction follows both the name-to-ANT assignments and the ANT's record changes, rather than assuming today's ANT represents the name's entire past.

### Recover Information Through Turbo

Turbo keeps information about purchases and ArNS actions, so its API is another place to look.
However, retrieving one operation whose nonce we retained is different from discovering operations whose identifiers are lost.

For example, the [action-status endpoint for my undername update](<https://payment.ardrive.io/v1/arns/actions/466000d1-925b-4821-8515-994f0f858785>) still returns the completed operation:

```bash
curl --fail --silent --show-error \
  https://payment.ardrive.io/v1/arns/actions/466000d1-925b-4821-8515-994f0f858785 \
  | jq '{nonce, action, status, antId, messageId, createdDate}'
# {
#   "nonce": "466000d1-925b-4821-8515-994f0f858785",
#   "action": "set-record",
#   "status": "completed",
#   "antId": "GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ",
#   "messageId": "5WARfpUcMsnNfNRcXeTf8nayueAR2CrNSE9sVrMSuuEMY6FKSZBEQpzv4NLF3JrcKmcJGEK6uCbZFZGe5di7F1Sj",
#   "createdDate": "2026-11-09T11:39:54.548Z"
# }
```

Here, `messageId` identifies the **Solana transaction**, not the Arweave publication.
The response does not contain the undername or target manifest ID; following that transaction gives us those details through the ArNS history route above.

The available facilities serve different purposes:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Facility</th>
      <th scope="col">What it retrieves</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/v1/arns/actions/{nonce}</code></td>
      <td>One ArNS action whose nonce is already known.</td>
    </tr>
    <tr>
      <td><code>/v1/arns/purchase/{nonce}</code></td>
      <td>A purchase-status record, including the card-purchase flow, whose nonce is already known.</td>
    </tr>
    <tr>
      <td><code>/v1/arns/my-names/{address}</code></td>
      <td>Turbo's purchased-name records for an address. This is not an authoritative list of current ownership or a history of record targets.</td>
    </tr>
    <tr>
      <td><code>turbo payment-history</code></td>
      <td>The signing identity's top-up history, rather than its uploads or ArNS record changes.</td>
    </tr>
  </tbody>
</table>

The [ArNS API reference](<https://docs.ar.io/apis/turbo/payment-service/arns/>) describes the nonce lookups and purchased-name listing; the [Turbo credit documentation](<https://docs.ar.io/build/upload/turbo-credits/>) explains the separate top-up history.
In my checks, the purchased-name endpoint returned an empty list for both my MetaMask address and the earlier Solana payer, so it did not recover the existing names from those earlier purchases.

At the time of this walkthrough, I found no documented endpoint in the payment service or Turbo SDK 2.2.0 that lists all ArNS actions by wallet, name, or ANT.
Consequently, the action API is useful if a nonce survives in a receipt, chat log, or saved URL, but it is a dead end for discovering the full action history after those nonces are lost.
For that recovery, use the public ArNS transaction history; for uploaded objects that were never assigned to a name, use the Arweave signer lookup.

### Publishing Without a Required Local Database

These recovery paths also matter for the design of a publishing tool.
My goal is to keep the source files and publication configuration in Git, without requiring a separate local database of past publishing activity.
A fresh checkout should be enough to continue publishing once the tool can access the network and the identities needed to authorise the next publication.
A local cache is welcome, but deleting it should cost time rather than essential information.

For the next update, we do not need to reconstruct every past operation.
We need a stable starting point, such as the configured ArNS name, and the current manifest it identifies.
That manifest supplies the file IDs; the remote files and their metadata supply the information needed to recognise unchanged content and reuse it.
The [publishing-tool sketch in the appendix](#what-a-publishing-tool-could-automate) describes this approach.
The tutorial demonstrates the necessary pieces, but the ordinary Turbo CLI commands do not yet assemble them into this workflow automatically.

Recovering the complete revision history is a separate requirement.
The signer lookup needs the earlier public uploader addresses, while ArNS history covers only targets assigned to the name and depends on available transaction history.
For a tool that should retain a complete sequence of its releases, I would make that sequence part of the publication itself: each release could include a small metadata file pointing to the previous manifest, with that file referenced by the new manifest.
Starting from the current ArNS target, the tool could then follow the links backwards without relying on a local activity database or knowing all earlier upload signers.
This would be an additional convention for the publishing tool; the manifests created in this walkthrough do not contain those predecessor links.

> A rebuildable cache and an operation record serve different purposes.
> Confirmed publications can supply the state needed for the next update, but they do not necessarily reveal failed attempts, uploads never linked into a release, or Turbo nonces and original receipts.
> A tool should retain the information needed to reconcile an interrupted or uncertain paid operation before retrying it.
> If exact audit records are required, those must also be retained; they cannot be treated as disposable cached data.
> Such records need not be checked out alongside the sources to continue from a confirmed publication.

## Conclusion

This blog post became longer and more involved than I anticipated.
I expected Arweave to behave like a content-addressed file system, where identical file contents would lead to the same identifier.
Instead, its data-item IDs identify signed objects, and unchanged content is reused by referencing the existing objects' IDs.

Nevertheless, it provides the building blocks for the publishing model I had in mind.
Each revision has its own immutable manifest while sharing unchanged files with earlier revisions, much as Clojure shares structure between versions of its [persistent data structures](<https://en.wikipedia.org/wiki/Persistent_data_structure>).
Chris Okasaki explores these ideas in [Purely Functional Data Structures](<https://www.amazon.de/Purely-Functional-Data-Structures-Okasaki/dp/0521663504/>).
The ArNS record then plays a role similar to a Clojure [atom](<https://clojure.org/reference/atoms>): a mutable reference to the current immutable revision.
Moving that reference leaves the earlier publications intact.

The larger model is now clearer:
Arweave stores immutable data;
manifests assemble those objects into websites;
AR.IO gateways make them accessible, while Wayfinder helps choose gateways and check the retrieved data;
ArNS gives the publication a name that can follow its updates;
Turbo provides a convenient upload and payment interface across these layers.

The practical experiments also showed where the tooling still needs work.
Automatic reuse and recovery are possible, but the CLI does not yet combine them into the workflow I expected.
My next goal is a publishing tool that can continue from a fresh source checkout by reading the current publication, with a local cache to speed things up and no required local database of past releases.
The walkthrough establishes the pieces for that design; it does not yet implement the complete tool.

For independent publishing, this adds another useful role alongside [Nostr](../publishing-nostr-basics/) and [Hive](../publishing-hive-basics/).
Nostr offers distribution through signed events and relays; Hive combines publishing with discovery, discussion, and social incentives.
Arweave and AR.IO provide a foundation for preserving independently addressable editions of a website, with storage paid for upfront.
An independently hosted website can remain the everyday home of the work while these systems provide additional ways to preserve it, distribute it, and bring readers into the conversation.

## Appendix

### Caution: "Permanent" Is Still a Long-Term Claim

The endowment model is ingenious, but its assumptions have not been tested for anything close to 200 years.
Arweave launched in 2018.
Its promise consequently depends on continued protocol operation, sufficient independent storage providers, useful purchasing power for miner rewards, and storage costs developing favourably over a period far longer than the network's history so far.

Some current scale and participation signals deserve some attention.

#### Reduced Growth Rate

On 3 November 2026, block 2,034,768 reported a `weave_size` of 392.9 TB, or 357.35 TiB.
The corresponding value at block 2,013,168 on 2 October was 391.9 TB: approximately 1.0 TB was added over almost 32 days, an average of about 32 GB per day.
Across the roughly 388 days since block 1,771,968, growth averaged about 63 GB per day, so the more recent rate was substantially lower.

These values can be reproduced directly from the immutable block records:

* <https://arweave.net/block/height/2034768>
* <https://arweave.net/block/height/2013168>
* <https://arweave.net/block/height/1771968>

#### Number of Peers

The same day's `/info` responses reported 228 peers at `arweave.net` and 222 at `turbo-gateway.com`.

* <https://arweave.net/info>
* <https://turbo-gateway.com/info>

This means that, at that moment, each gateway could see approximately that many Arweave network endpoints with which it could exchange data.

> An endpoint is a network address, not necessarily an independent participant.
> One mining organisation can operate several nodes or expose several addresses and ports, all of which may appear separately in the peer list.
> Moreover, an Arweave node does not have to store the entire weave; different nodes may retain different parts of it.

These peer figures therefore show that these two gateways could reach a few hundred endpoints, but they do not reveal either the number of independent storage operators or how many complete physical replicas of the weave existed.

#### Gateways in the Leaving State

There was also a caution signal in the access layer.
While preparing [AR.IO Node release 83](<https://github.com/ar-io/ar-io-node/releases/tag/r83>) in September 2026, its maintainers measured 646 registered gateways,
of which 334 were in the `leaving` state because their operators had withdrawn them or because they had been non-responsive for 30 consecutive epochs.
They also attributed 40% of peer errors in that measurement to hostnames that no longer resolved.

#### InterPlanetary File System (IPFS): Interplanetary Shipyard Ends Its IPFS Work

While the InterPlanetary File System (IPFS) is not directly related to the Arweave project, it addresses the related problems of decentralised storage and retrieval.
Unlike Arweave, IPFS does not by itself pay for or guarantee permanent retention; data must [continue to be pinned by someone](<https://docs.ipfs.tech/concepts/persistence/>).
The events in the IPFS ecosystem are therefore not evidence about the health of Arweave, but they provide a useful comparison for the institutional dependencies surrounding decentralised infrastructure.

On 24 August 2026, [Interplanetary Shipyard announced](<https://ipshipyard.com/blog/2026-the-end-of-ipfs-at-shipyard/>) that Protocol Labs would not renew its funding and that Shipyard would end its IPFS-related engineering, maintenance, and infrastructure work on 30 September.
The affected work included dedicated maintenance of widely used projects such as Kubo, Helia, Boxo, Rainbow, IPFS Desktop, and IPFS Companion, as well as public gateways, bootstrap nodes, specifications, and contributions to libp2p.

> Protocol Labs created IPFS and has been its principal institutional sponsor and ecosystem coordinator.
> It has funded maintainers such as Shipyard, controls prominent public domains and associated infrastructure, and supports specifications, interoperability work, grants, and development.

[Protocol Labs responded](<https://blog.ipfs.tech/2026-08-beyond-sponsored-gateways/>) that IPFS had more than a dozen active implementations and described a transition toward direct browser retrieval, self-hosted gateways, specifications, conformance tests, and grants to maintainers instead of continued reliance on a few subsidised public gateways.

The episode nevertheless illustrates a risk shared by decentralised infrastructure.

Arweave's storage endowment funds storage incentives; it does not by itself guarantee the continued maintenance of every client, gateway, indexer, library, or public endpoint required for convenient use.

None of these observations proves that there is a problem with the Arweave data ecosystem.
But they do show that this remains a comparatively small and evolving ecosystem whose strongest claim reaches much further into the future than its operational record.

### Arweave JWK versus Solana Identity

JWK means [JSON Web Key](<https://www.rfc-editor.org/rfc/rfc7517>).
It is a standard JSON representation of cryptographic key material, not something specific to Arweave.
An Arweave wallet key file uses this format to store an RSA key pair.

A Solana identity is also a cryptographic key pair, but it uses a different algorithm, representation, and address format:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Property</th>
      <th scope="col">Arweave JWK</th>
      <th scope="col">Solana identity</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Cryptography</td>
      <td>RSA-4096</td>
      <td>Ed25519</td>
    </tr>
    <tr>
      <td>Typical private file</td>
      <td>JSON object containing the RSA parameters</td>
      <td>JSON array containing 64 bytes, or a base58-encoded secret</td>
    </tr>
    <tr>
      <td>Public address</td>
      <td>Derived by hashing the RSA public modulus with SHA-256 and encoding the result as base64url</td>
      <td>Ed25519 public key encoded as base58</td>
    </tr>
    <tr>
      <td>Typical appearance</td>
      <td><code>sOoqU-GN...</code></td>
      <td><code>87swReCU...</code></td>
    </tr>
    <tr>
      <td>Native network</td>
      <td>Arweave</td>
      <td>Solana</td>
    </tr>
    <tr>
      <td>Can sign Turbo uploads</td>
      <td>Yes</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>Can identify a Turbo credit account</td>
      <td>Yes</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>Can own an ArNS name</td>
      <td>No</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td>Native assets the address can control</td>
      <td>AR</td>
      <td>SOL, ARIO, and other Solana tokens</td>
    </tr>
  </tbody>
</table>

In particular, a Solana identity cannot directly own native AR.
AR belongs to the Arweave network and is controlled through an Arweave address, whereas ARIO is a Solana token and can be controlled through a Solana address.
A wrapped or bridged representation of AR could exist as a token on Solana, but it would be a separate asset backed by that bridge or custodian rather than native AR itself.

Conceptually, both are simply cryptographic identities: whoever controls the private key can produce signatures for the corresponding public address.
Their algorithms, private-key formats, public addresses, and network roles are nevertheless incompatible.
An Arweave JWK cannot be converted into the Solana owner of an ArNS name, nor can a Solana key file be treated as an Arweave JWK.

The phrase *hold Turbo credits* is also only shorthand.
The credits are not contained in either wallet file and are not native assets on Arweave or Solana.
Turbo maintains them in its own service ledger and associates the balance with the respective public address.

#### Turbo Credits: Share Spending Authority Rather Than Moving the Balance

Turbo credits cannot be moved between identities like conventional token balances.
They are non-refundable and non-withdrawable, cannot be exchanged back into fiat or cryptocurrency, and cannot be permanently swept from one Turbo address into another.

Turbo instead provides *credit sharing*, which is better understood as a revocable spending allowance.
This makes the following long-term arrangement possible:

```text
MetaMask Solana address
long-term credit holder
        │
        ├── capped or expiring share → upload identity A
        ├── capped or expiring share → upload identity B
        └── capped or expiring share → automation identity
```

The credits remain associated with the MetaMask Solana address.
Each recipient receives permission to spend only the approved amount and cannot share that allowance onward.
The MetaMask identity can revoke an approval, and any unused credits become available to it again when the approval expires or is revoked.
While an amount is shared, however, the original holder cannot spend that reserved amount elsewhere.

This is preferable to funding disposable upload identities directly.
If credits are purchased for a short-lived uploader, they cannot later be consolidated permanently into the long-lived wallet.
That uploader could share spending authority with the long-lived wallet, but the balance would still belong to the uploader's address, its private key would still have to be retained, and the recipient could not share the credits onward.

The clean arrangement is therefore:

1. Top up the securely retained MetaMask Solana address.
2. Treat that address as the central Turbo payer.
3. Give each operational uploader a limited and, where useful, expiring credit share.
4. Revoke the share when the task is complete.

An upload identity can explicitly select the central payer with Turbo CLI's `--paid-by` option.
During uploads, the CLI can also discover credit-share approvals received by the connected upload identity and use them before its own balance.
The [ArNS record update above](#set-the-record-with-an-explicit-payer) uses an explicit payer instead.

The [Turbo credit documentation](<https://docs.ar.io/build/upload/turbo-credits/>) and the Turbo SDK's [credit-sharing documentation](<https://github.com/ardriveapp/turbo-sdk#turbo-credit-sharing>) describe the current rules and interfaces.

> Keep purchased Turbo credits at a securely retained payer identity and share limited spending authority with operational upload identities.

### A Card Purchase That Required a Support Handoff

As explained earlier in [Buying an ArNS Name by Card and Checking Ownership](#buying-an-arns-name-by-card-and-checking-ownership), my attempt to use the `turbo arns-fiat-quote ...` command required support to complete the ownership handoff.
The payment itself succeeded, but control of the name was delivered to the intended wallet only after support intervened.

The following account records the entire process and the issues I observed.
I also reported the incident in [Turbo SDK issue #546: `arns-fiat-quote` checkout leaves ANT owned by Turbo despite customer owner in purchase status](<https://github.com/ardriveapp/turbo-sdk/issues/546>).

#### What Happened

The following command is a record of the problematic attempt, **not a purchase instruction to follow**:

```text
turbo arns-fiat-quote --name weisser-zwerg --type permabuy --address BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ --currency usd --method checkout-session
```

The initial attempt with `--currency eur` returned HTTP 503 and an error saying that only USD was supported, confusingly referring to a `crypto` payment method even though Stripe checkout had been requested.
Changing the currency to USD produced a Stripe checkout link.
Creating that link did not charge the card; I subsequently paid USD 21.57 by opening the link in a browser and following the checkout instructions.

Turbo's [purchase-status response](<https://payment.ardrive.io/v1/arns/purchase/c4ec08c8-b9d4-4ab8-b733-4c9fd8295928>) reported `success`, `type: "permabuy"`, and my address in its `owner` field.
Reading the registry and ANT independently at Solana's `finalized` commitment showed a different ownership result:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Check</th>
      <th scope="col">Observed result</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Name registration</td>
      <td><code>weisser-zwerg</code>, permanent</td>
    </tr>
    <tr>
      <td>ANT</td>
      <td><a href="https://solscan.io/account/GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ"><code>GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ</code></a></td>
    </tr>
    <tr>
      <td>Address supplied to checkout</td>
      <td><a href="https://solscan.io/account/BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"><code>BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ</code></a></td>
    </tr>
    <tr>
      <td>Actual ANT owner and sole controller</td>
      <td><a href="https://solscan.io/account/D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH"><code>D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH</code></a>, Turbo's address</td>
    </tr>
    <tr>
      <td>Public resolution</td>
      <td><a href="https://weisser-zwerg.ar.io/"><code>weisser-zwerg.ar.io</code></a> returned the default AR.IO image</td>
    </tr>
  </tbody>
</table>

The [registration transaction reported by Turbo](<https://solscan.io/tx/48WJQWrqazDJ7JFWhVDnttGoTwJES86GNhZyvKhWXdJxBQZ5UJQG1P7MwAXeBhyhFGaionBKSNjREgFpGA1gucHo>) was finalized successfully.
Its account list contained Turbo as the only signer and did not contain my `BT7…` address.

#### The Earlier `indie-publisher-demo` Purchase

In an earlier experiment, I purchased the ArNS name `indie-publisher-demo`.
That purchase used card-funded Turbo credits and then a separate `buyArNSName({ owner, ... })` call, with a short-term local Solana identity as the owner.
That API [includes the owner's address and obtains the required transaction signature](<https://github.com/ardriveapp/turbo-sdk/blob/af831de69b4ecdb31b1f1156a03069e24e3e2e5e/packages/turbo-sdk/src/common/payment.ts#L1018-L1090>) from the local identity.
The local identity initially owned the ANT; I later transferred it to MetaMask as described above.

#### Support Handoff and Independent Verification

My wallet initially had neither owner nor controller authority over the `weisser-zwerg` ANT, so I could not administer it through ordinary owner operations.

I therefore contacted [ArDrive support](<https://ardrive.io/contact/>) at `support@ardrive.io` and privately supplied the purchase nonce [`c4ec08c8-b9d4-4ab8-b733-4c9fd8295928`](https://payment.ardrive.io/v1/arns/purchase/c4ec08c8-b9d4-4ab8-b733-4c9fd8295928), ANT identifier, registration transaction identifier, and payment receipt.
Support replied: "Thanks for reporting this. The ANT has been transferred to your wallet."
Support did not explain why the direct checkout left the ANT under Turbo's control.

The handoff completed in Solana transaction [`4oxzzG2Wog5uefhj1RkWZHQt8wwjMZrBfSck6LPfYaow93ptfNbp8FgkJoNHnZ83jx1t3VtotGzJcArSpobKJ4ey`](<https://solscan.io/tx/4oxzzG2Wog5uefhj1RkWZHQt8wwjMZrBfSck6LPfYaow93ptfNbp8FgkJoNHnZ83jx1t3VtotGzJcArSpobKJ4ey>).
Its program log records the ANT transfer from Turbo's address to my MetaMask address, followed by removal of Turbo's controller permission.

Independent reads after the transfer showed:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Property</th>
      <th scope="col">Before support handoff</th>
      <th scope="col">After support handoff</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ANT owner</td>
      <td><a href="https://solscan.io/account/D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH"><code>D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH</code></a></td>
      <td><a href="https://solscan.io/account/BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"><code>BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ</code></a></td>
    </tr>
    <tr>
      <td>Explicit controller entries</td>
      <td>Turbo's address</td>
      <td>None</td>
    </tr>
    <tr>
      <td>Root record</td>
      <td><a href="https://viewblock.io/arweave/tx/AnYvLJTWcG9lr2Ll5MwYWZR2o5uTE39WbpYB0zCxwKM"><code>AnYvLJTWcG9lr2Ll5MwYWZR2o5uTE39WbpYB0zCxwKM</code></a></td>
      <td>Unchanged</td>
    </tr>
    <tr>
      <td>Registration</td>
      <td>Permanent, with ten undernames</td>
      <td>Unchanged</td>
    </tr>
    <tr>
      <td>Public hostname</td>
      <td><a href="https://weisser-zwerg.ar.io/"><code>weisser-zwerg.ar.io</code></a> returned the default AR.IO image</td>
      <td>Unchanged</td>
    </tr>
  </tbody>
</table>

The wallet ownership query now returned both `indie-publisher-demo` and `weisser-zwerg` for my MetaMask address.
The handoff therefore succeeded without changing the permanent registration or its published content.

The transfer cleared the controller list, so Turbo can no longer update this ANT's records using delegated controller authority.
It can still sponsor updates if I sign the Solana transaction as the owner.
Restoring Turbo's controller permission would remove the need for that transaction signature, although its API would still require an owner-signed message authorising each record change.

The successful support handoff proves that this particular purchase could be recovered.
It does not resolve why the direct checkout initially assigned both ownership and control to Turbo.

### Turbo's Infrastructure Fee and Direct Payments

At the time of this experiment, the [AR.IO Console settings](<https://console.ar.io/settings>) displayed an infrastructure fee of 35%, taken from every Turbo credit top-up.
The [Turbo credit documentation](<https://docs.ar.io/build/upload/turbo-credits#infrastructure-fee>) explains that this percentage is deducted from the amount paid rather than added afterwards.
A USD 100 top-up therefore yields USD 65 worth of credits after the 35% deduction.
Turbo says that the fee pays for its infrastructure and, for cryptocurrency top-ups, token liquidity; the percentage can vary by currency and may change.

The saved response from my direct ArNS checkout contained `paymentAmount: 2157` (USD cents) and a `Turbo Infrastructure Fee` entry with `operator: "multiply"` and `operatorMagnitude: 1.5384615384615383`.
This factor is the inverse calculation needed when a quoted amount must remain after the fee:

```text
1 / (1 - 0.35) = 1 / 0.65 = 1.538461538...
```

For example, obtaining USD 100 worth of credits after the deduction would require a payment of approximately USD 153.85.
The USD 53.85 difference is 35% of the final USD 153.85 payment.
The infrastructure fee is therefore still 35%; the 53.85% figure is merely the increase from the desired post-fee amount to the required payment.

The infrastructure fee can be avoided by paying the underlying networks directly instead of purchasing Turbo credits, while still using an SDK:

* For an ArNS name, use the AR.IO SDK to pay the registry in ARIO, with SOL covering Solana network fees and account rent.
* For Arweave storage, use an Arweave SDK to submit the data transaction and pay in AR.

This may require a different SDK from Turbo's.
Paying Turbo with cryptocurrency does not by itself avoid the fee: if the cryptocurrency payment buys Turbo credits, the top-up remains subject to the infrastructure fee.
Direct payment avoids that fee, but the underlying registration, storage and network costs remain, as do any trading or withdrawal fees incurred while acquiring ARIO, SOL or AR.

### Why Identical Files Can Have Different Arweave IDs

My two initial uploads contain identical HTML and CSS bytes, but their data-item identifiers differ.
For example, the [manual CSS object](<https://turbo-gateway.com/raw/AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q>) and the [directory-upload CSS object](<https://turbo-gateway.com/raw/868xLG6Zve3sHmPaKx3HlEZu2od7InAV1k0F-5DpHDs>) have the same contents.
The reason is that an [ANS-104 data-item ID](<https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md#2-dataitem-signature-and-id>) is the SHA-256 hash of the item's signature, encoded as base64url.
It is not simply the hash of the file bytes.

#### What Exactly Is Signed?

Turbo wraps each file in a binary data item containing its signature, the signer's public key, optional fields, tags, and the file bytes.
The signature is calculated over a structured list of byte sequences, not over a JSON document.

* **File bytes** are the actual contents of `style.css`, including whitespace and line endings.
* **Tags** are public name/value metadata. The CLI adds `App-Name`, `App-Version`, and `App-Platform`; the CSS item also carries `Content-Type: text/css`. Tags are part of the signed message, not extra text inserted into the CSS file.
* **Owner** here means the uploader's public key bytes: for my Arweave JWK, the decoded RSA modulus `n`. The public address shown in the receipts is derived from those bytes.
* **Target** is an optional recipient field; a data item does not transfer tokens. **Anchor** is an optional application-supplied value that can distinguish messages. Both are empty in my uploads.

For my RSA signer, the stream-signing implementation in `@dha-team/arbundles` 1.2.0, used by the installed Turbo SDK 2.2.0, constructs the following input.
This is explanatory pseudocode:

```text
signingFields = [
    UTF8("dataitem"),        // identifies this kind of signed message
    UTF8("1"),               // data-item signing format version
    UTF8("1"),               // RSA signature type
    decodeBase64url(jwk.n),  // uploader's public key bytes
    emptyBytes,             // no target
    emptyBytes,             // no anchor
    AvroEncode(tags),        // binary encoding of the ordered metadata
    fileBytes               // actual CSS bytes
]
```

`UTF8` converts text into bytes; `AvroEncode` serialises the tag list into the binary format used by ANS-104.
The `deepHash` function then hashes this structured list using SHA-384, incorporating its list structure and the lengths of its byte sequences.
The result is a deterministic 48-byte digest: identical inputs produce the same digest.
These steps can be seen in the package's [stream signer](<https://unpkg.com/@dha-team/arbundles@1.2.0/build/node/esm/src/stream/index.js>) and [deepHash implementation](<https://unpkg.com/@dha-team/arbundles@1.2.0/build/node/esm/src/deepHash.js>).

#### Where Randomness Enters

My JWK signer uses RSA-PSS with SHA-256.
The signing operation internally generates a fresh random salt, as described by the [RSA-PSS encoding specification](<https://www.rfc-editor.org/rfc/rfc8017.html#section-9.1.1>).
Making that otherwise hidden step explicit gives us:

```text
messageDigest = deepHash(signingFields)          // deterministic

salt          = freshRandomBytes()              // randomness enters here

signature     = RSA-PSS-SHA256-Sign(
                    privateKey,
                    messageDigest,
                    salt
                )

id            = base64url(SHA256(signature))     // deterministic for this signature
```

The SHA-256 operation inside RSA-PSS hashes the digest supplied by `deepHash`; the final SHA-256 operation hashes the resulting signature.
They serve different purposes.
The package's [RSA signer](<https://unpkg.com/@dha-team/arbundles@1.2.0/build/node/esm/src/signing/keys/Rsa4096Pss.js>) delegates the random salt generation to Node's cryptography implementation.

Signing the same inputs again can therefore produce a different signature and a different ID.
Once an item has been signed, however, its signature and ID are fixed.
Retrieving or verifying that existing item does not sign it again, and its identifier remains stable.

> There are three distinct hash values to keep apart:
>
> <table class="article-table">
>   <thead>
>     <tr>
>       <th scope="col">Value</th>
>       <th scope="col">What is hashed?</th>
>       <th scope="col">Algorithm</th>
>     </tr>
>   </thead>
>   <tbody>
>     <tr>
>       <td>Gateway <code>content-digest: sha-256=</code> digest</td>
>       <td>Only the file bytes</td>
>       <td>SHA-256 → 32 bytes</td>
>     </tr>
>     <tr>
>       <td>Signing digest from <code>deepHash</code></td>
>       <td>The structured list containing the file bytes, tags, public key, and other signing fields</td>
>       <td>SHA-384 → 48 bytes</td>
>     </tr>
>     <tr>
>       <td>Data-item ID</td>
>       <td>The resulting signature</td>
>       <td>SHA-256 → 32 bytes</td>
>     </tr>
>   </tbody>
> </table>
>
> The `x-ar-io-digest` and `content-digest` headers report the [gateway content digest](<https://docs.ar.io/build/run-a-gateway/manage/verification-headers>).
> My manual and directory uploads therefore have matching content digests for each unchanged file, even though their data-item IDs differ.

Controlling all inputs, including the salt, could make signing deterministic for a particular key.
But Turbo CLI does not offer a salt-setting option, and this would still depend on the exact key, metadata, and other signed fields.
It would not make an identifier a function of file contents alone, nor recover IDs previously created with random salts.
Reusing an existing item only requires its ID.

> The `signature` and `public` fields in Turbo's acceptance receipt authenticate the service's receipt.
> They are separate from the uploader's signature and public key inside the data item.
> Hashing the receipt's signature is therefore not how we obtain the data-item ID.

#### What the SDK's Folder Index Adds

The SDK's [incremental folder upload](<https://github.com/ardriveapp/turbo-sdk/tree/v2.2.0#incremental-folder-uploads>) checks for an existing item before signing a file again.
Its lookup can be summarised as:

```text
SHA256(file bytes) + SHA256(normalised tags) -> previously uploaded data-item ID
```

Here, `+` means combining two hashes into a lookup key; it does not describe how an Arweave ID is calculated.
Metadata matters because the same bytes served as `text/css` and `text/plain` have different meanings to a browser.

To perform this lookup, the SDK needs a mapping from content-and-tag hashes to previously uploaded IDs.
This is the role of the SDK's folder index, which can use a local cache or retrieve information through a gateway.
The following table explains the available mechanisms, the metadata that supports the lookup, and how its results feed into the publication's manifest.

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Purpose</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>folderIndex</code></td>
      <td>Answers whether matching bytes and tags already have an uploaded ID.</td>
    </tr>
    <tr>
      <td><code>createFileFolderIndex</code></td>
      <td>Keeps that mapping in a local JSON-lines file. This is an optional cache.</td>
    </tr>
    <tr>
      <td><code>createChainFolderIndex</code></td>
      <td>Looks for matching prior uploads through a gateway's GraphQL index, scoped to a specified uploader. It can be used without a persistent local cache.</td>
    </tr>
    <tr>
      <td><code>File-SHA256</code> tag</td>
      <td>Records a file's content hash on uploads made with indexing enabled, allowing the gateway lookup to find candidates.</td>
    </tr>
    <tr>
      <td><code>folderIndexSummary</code></td>
      <td>Reports how many files were uploaded or reused; it does not perform the lookup.</td>
    </tr>
    <tr>
      <td>Manifest</td>
      <td>Maps website paths to the selected IDs, whether newly uploaded or reused.</td>
    </tr>
  </tbody>
</table>

The CLI's `upload-folder` command in version 2.2.0 does not expose the SDK's `folderIndex` option.
My ordinary CLI uploads also lack the `File-SHA256` tag expected by that gateway lookup, so it would not automatically discover them.
This explains why using the SDK's mechanism would require code beyond the CLI commands in this tutorial.

#### What a Publishing Tool Could Automate

I originally expected Arweave to work like a content-addressed file system, where content hashes identify files and make reuse and sharing easy.
I imagined sharing unchanged files between revisions, much as Clojure shares unchanged structure between versions of its [persistent data structures](https://en.wikipedia.org/wiki/Persistent_data_structure).
Chris Okasaki explores these ideas in [Purely Functional Data Structures](https://www.amazon.de/Purely-Functional-Data-Structures-Okasaki/dp/0521663504/).
The ArNS "pointer" would act like a Clojure [atom](https://clojure.org/reference/atoms), holding a reference to the latest revision.

Although Arweave works differently from what I expected, the workflow I envisioned is still possible:
keep a directory of source files, change some of them, and publish a new version that reuses the unchanged files.
This can also work from another computer, without requiring a local deployment database to track previous uploads.
One approach would use the previous manifest as its starting point:

1. Resolve the publication's ArNS name, or accept its previous manifest ID directly.
2. Read that manifest to obtain the earlier file IDs. The manifest lists paths and IDs; the tool would also retrieve the files and their metadata to calculate and compare content hashes.
3. Compare those bytes and relevant metadata with the current local files. Keep the old IDs for matches, upload changed or new files, and omit removed paths from the new manifest.
4. Upload the new manifest and, when authorised, move the ArNS record to it. The earlier manifest and its files remain available.

This approach can use my existing CLI uploads.
The previous publication supplies the information needed for reuse; a local cache would merely avoid repeated downloads.
The object behind an Arweave ID remains immutable, while the mutable ArNS record points to the manifest representing the current publication, akin to a Clojure [atom](https://clojure.org/reference/atoms).

The distinction between continuing from a confirmed publication and preserving its full history is discussed in [Publishing Without a Required Local Database](#publishing-without-a-required-local-database).

An alternative would use the SDK's gateway index and content-hash tags to find reusable objects without downloading every previous file.
When upload identities change, the lookup must still include the earlier uploader addresses.

A complete tool would also handle partial uploads, retain receipts, and report which files it would upload or reuse before publication.
Those are reasonable development tasks, but they go beyond this "by foot" tutorial.
The manual manifest demonstrates the essential operation directly: point an unchanged path at its existing immutable object.

### Transferring an Existing ArNS Name

An earlier acceptance experiment had already registered the permanent ArNS name [`indie-publisher-demo`](<https://console.ar.io/domains/indie-publisher-demo>).
Its ANT was owned by the Solana address [`87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty`](<https://solscan.io/account/87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty>), which had also paid for the registration with Turbo credits.
I now wanted the long-lived MetaMask address established above to own that name instead.

Doing so required transferring the entire ANT.
The transfer changes both who owns the name and who ultimately controls it.

> The transfer does not move the old owner's remaining Turbo credits. As explained above, Turbo credits cannot be transferred.

The ANT identifier recorded by the original purchase receipt was [`Fs99yQbhTpQAtntmfrVrGc2LafQ6ykbD6kbcvhGZ3uqm`](<https://solscan.io/account/Fs99yQbhTpQAtntmfrVrGc2LafQ6ykbD6kbcvhGZ3uqm>).
Before changing anything, I read the ANT's state directly from Solana.
This confirmed the old owner, the two addresses listed as controllers, and the root record pointing to [`W1Wl75og1gCKxvt7sDK_vZIvUM3e031x9PC5ZwFXJsY`](<https://viewblock.io/arweave/tx/W1Wl75og1gCKxvt7sDK_vZIvUM3e031x9PC5ZwFXJsY>).

> A *controller* is a Solana address to which the ANT owner has delegated administrative authority.
> Controllers can perform routine operations such as updating records and name details, but they cannot transfer the ANT or add and remove other controllers; those powers remain with the owner ([ANT ownership and control](<https://docs.ar.io/learn/arns/ants/>)).
>
> This ANT's controller list contained the old owner's address itself and [`D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH`](<https://solscan.io/account/D44zzUcS5n73NokbhCcC4GTibSoL5qY8Tw6Xi52R2ejH>), through which Turbo had been granted controller authority during the original purchase.
> Listing the owner separately as a controller was redundant because ownership already conferred administrative authority.
> Turbo's controller permission allows it to submit sponsored record updates without an owner-signed Solana transaction while that permission remains active.
> However, the [current Turbo API](<https://docs.ar.io/apis/turbo/payment-service/arns/>) still requires an action-specific **message signature** from the on-chain owner for record changes.
> Controller permission therefore does not mean that all later wallet approvals disappear.
> The ANT therefore had one owner and two explicit controller entries.

I then checked the live transfer price and the old address's balance with Turbo CLI 2.2.0:

```console
$ turbo arns-action-price --action transfer
{
  "action": "transfer",
  "wincQty": "103543574689",
  "credits": "0.103543574689"
}

$ turbo balance --token solana --address 87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty
Turbo Balance for Native Address "87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty"
Effective Credits: 0.226580734195
```

The [Turbo SDK 2.2.0](<https://github.com/ardriveapp/turbo-sdk/releases/tag/v2.2.0>) provides both a `transfer-arns-ant` command and the corresponding `transferArNSAnt` API.
The command accepts the ANT owner's base58 secret through `--owner-key`.
To avoid placing that secret on the command line, I instead called the API from a small wrapper.
Before requesting a signature, the wrapper wrote the intended source, destination, ANT identifier, quoted price, and a locally generated attempt identifier to disk.
Turbo's action nonce was then stored by the SDK's `onNonce` callback before the owner signed anything, so an interrupted or uncertain attempt could be inspected rather than repeated.
The transfer completed with Solana transaction [`4PXEXEM3Zhoj3QaYDkMwdATYmGor4xvhoLLx7XhxUYYkLhMFDiR9MyMoQjA4VfMCrQ36P4AsWp1UZisXaWpnuivw`](<https://solscan.io/tx/4PXEXEM3Zhoj3QaYDkMwdATYmGor4xvhoLLx7XhxUYYkLhMFDiR9MyMoQjA4VfMCrQ36P4AsWp1UZisXaWpnuivw>), which subsequently reached `finalized` status.

Independent reads after finalisation showed:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Property</th>
      <th scope="col">Before</th>
      <th scope="col">After</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>ANT owner</td>
      <td><a href="https://solscan.io/account/87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty"><code>87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty</code></a></td>
      <td><a href="https://solscan.io/account/BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"><code>BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ</code></a></td>
    </tr>
    <tr>
      <td>Additional controllers</td>
      <td>Old owner's address and Turbo's controller address</td>
      <td>None</td>
    </tr>
    <tr>
      <td>Root record</td>
      <td><a href="https://viewblock.io/arweave/tx/W1Wl75og1gCKxvt7sDK_vZIvUM3e031x9PC5ZwFXJsY"><code>W1Wl75og1gCKxvt7sDK_vZIvUM3e031x9PC5ZwFXJsY</code></a></td>
      <td>Unchanged</td>
    </tr>
    <tr>
      <td>Old owner's Turbo balance</td>
      <td><code>0.226580734195</code> credits</td>
      <td><code>0.122911751545</code> credits</td>
    </tr>
  </tbody>
</table>

Clearing the controller list was intentional: transferring ownership must not leave the previous owner or its delegates with administrative authority.
The existing publication nevertheless continued to resolve at [`https://indie-publisher-demo.ar.io/`](<https://indie-publisher-demo.ar.io/>), because the transfer did not change its record.
The remaining Turbo credits still belong to the old Solana address, demonstrating again that ANT ownership and the Turbo credit balance are separate things.

### Resume the Walkthrough After a Restart

Closing the terminal or restarting the computer clears the shell variables used throughout this walkthrough.
The files, receipts, and published objects remain available.
We can restore the variables from those saved files without generating another key, uploading anything, or repeating a payment or ArNS update.

The block below assumes that both publication paths and both versions have been completed, with their receipts retained under the filenames used above.
If resuming at an earlier step, use only the groups for which those files already exist.
Review the settings marked `XXX_TODO_XXX`: they contain paths, addresses, names, or choices from my experiment that may differ in yours.
The publication identifiers are read from your receipts and do not need to be copied from mine.

Run this block from the directory containing `publishing-arweave-ario-basics-site` and `publishing-arweave-ario-basics-site-publication-state`.
Paste the block directly into the current Bash shell.
Alternatively, save it as `restore-shell.sh` outside the website directory and run `source /path/to/restore-shell.sh`.
Running it with `bash restore-shell.sh`, or wrapping it in parentheses, would restore the variables only in a child shell that then exits.

```bash
restore_arweave_blog_variables() {
  # XXX_TODO_XXX: Set this to your existing walkthrough website directory.
  site_dir="$PWD/publishing-arweave-ario-basics-site"
  # XXX_TODO_XXX: Adjust this if you kept receipts in a different location.
  publication_state_dir="${site_dir%/}-publication-state"
  v1_source_dir="$publication_state_dir/source-v1"

  # XXX_TODO_XXX: Point to your existing upload key's directory and filename.
  upload_wallet_dir="${XDG_CONFIG_HOME:-$HOME/.config}/publishing-arweave-ario-basics"
  upload_wallet_file="$upload_wallet_dir/arweave-upload.jwk.json"

  # Manual publication: version 1.
  manual_v1_html_receipt="$publication_state_dir/manual-v1-index.receipt.json"
  manual_v1_css_receipt="$publication_state_dir/manual-v1-style.receipt.json"
  manual_v1_manifest_file="$publication_state_dir/manual-v1.manifest.json"
  manual_v1_manifest_receipt="$publication_state_dir/manual-v1-manifest.receipt.json"

  manual_v1_html_id="$(jq -er '.id' "$manual_v1_html_receipt")" || return
  manual_v1_css_id="$(jq -er '.id' "$manual_v1_css_receipt")" || return
  manual_v1_manifest_id="$(jq -er '.id' "$manual_v1_manifest_receipt")" || return
  upload_address="$(jq -er '.owner' "$manual_v1_html_receipt")" || return

  # Manual publication: version 2.
  manual_v2_html_receipt="$publication_state_dir/manual-v2-index.receipt.json"
  manual_v2_manifest_file="$publication_state_dir/manual-v2.manifest.json"
  manual_v2_manifest_receipt="$publication_state_dir/manual-v2-manifest.receipt.json"

  manual_v2_html_id="$(jq -er '.id' "$manual_v2_html_receipt")" || return
  manual_v2_manifest_id="$(jq -er '.id' "$manual_v2_manifest_receipt")" || return

  # Directory publication: version 1.
  folder_v1_result="$publication_state_dir/folder-v1-result.json"
  folder_v1_cli_output="$folder_v1_result.cli-output"

  folder_v1_html_id="$(jq -er '.manifest.paths["index.html"].id' "$folder_v1_result")" || return
  folder_v1_css_id="$(jq -er '.manifest.paths["style.css"].id' "$folder_v1_result")" || return
  folder_v1_manifest_id="$(jq -er '.manifestResponse.id' "$folder_v1_result")" || return

  # Directory publication: version 2.
  folder_v2_result="$publication_state_dir/folder-v2-result.json"
  folder_v2_cli_output="$folder_v2_result.cli-output"

  folder_v2_html_id="$(jq -er '.manifest.paths["index.html"].id' "$folder_v2_result")" || return
  folder_v2_css_id="$(jq -er '.manifest.paths["style.css"].id' "$folder_v2_result")" || return
  folder_v2_manifest_id="$(jq -er '.manifestResponse.id' "$folder_v2_result")" || return

  # XXX_TODO_XXX: Keep this gateway or select the one used for your checks.
  gateway_base="https://turbo-gateway.com"
  gateway_state_dir="$publication_state_dir/gateway-v1"
  # XXX_TODO_XXX: Match the location of your existing Wayfinder checkout.
  wayfinder_source_root="$HOME/.local/src"
  wayfinder_source_dir="$wayfinder_source_root/wayfinder-a3390ca5"
  wayfinder_state_dir="$publication_state_dir/wayfinder-v1"
  comparison_dir="$publication_state_dir/compare-v1-v2"

  # XXX_TODO_XXX: Replace this with your ArNS owner's public Solana address.
  arns_owner_address="BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
  # XXX_TODO_XXX: Keep this alias if that address is also your long-lived Turbo payer.
  payer_address="$arns_owner_address"
  # XXX_TODO_XXX: Replace both values for your earlier payer, or omit them if unused.
  old_payer_address="87swReCUWCbJ6zCVNh61Kv9DkRrgkZrWdq5sTyLNcyty"
  old_payer_wallet_file="$HOME/.config/indie-publisher-newpub/solana-owner.json"

  # XXX_TODO_XXX: Review these parameters before creating a future upload allowance.
  # They do not describe or change the existing non-expiring share from the old payer.
  credit_cap="0.01"
  credit_lifetime_seconds=3600

  # XXX_TODO_XXX: Use your undername and base name, without a gateway domain.
  arns_name="test_weisser-zwerg"
  arns_state_dir="$publication_state_dir/arns-test"

  cd -- "$site_dir" || return
  printf 'Restored variables.\nUpload address: %s\nManual v2 manifest: %s\nWorking directory: %s\n' \
    "$upload_address" "$manual_v2_manifest_id" "$PWD"
}

restore_arweave_blog_variables
unset -f restore_arweave_blog_variables
```

The temporary `arns_owner_key` is deliberately omitted; enter it through the hidden prompt only when an operation requires it.
The optional example's `payer_wallet_file` was a placeholder rather than a saved MetaMask key file, so it is omitted as well.
The old payer's actual key-file path is restored separately as `old_payer_wallet_file`.

Shell functions also disappear when the shell closes.
To use them again, copy only the definitions of `upload_file_and_retain_receipt` and `fetch_and_compare` from [Upload the First Version Twice](#upload-the-first-version-twice), and `check_publication` from [Compare All Four Publications](#compare-all-four-publications).
Restoring those definitions does not call the functions; there is no need to repeat the earlier upload commands.

### Related Technologies: IPFS and Ethereum Swarm

[IPFS, the InterPlanetary File System](<https://docs.ipfs.tech/concepts/what-is-ipfs/>), is a peer-to-peer protocol for addressing and transferring data by content identifiers (CIDs).
A CID identifies content, but does not ensure that somebody keeps storing it.
Long-term availability depends on [keeping copies pinned and available](<https://docs.ipfs.tech/concepts/persistence/>), either on one's own nodes or through a pinning provider.
IPFS itself charges no subscription, but it does not fund that ongoing hosting: someone must continue operating the infrastructure or arranging and, where applicable, paying for a service.

[Swarm, also known as Ethereum Swarm](<https://docs.ethswarm.org/docs/concepts/what-is-swarm/>), is a decentralised storage and communication network that distributes files as chunks across participating nodes.
Storage is funded through prepaid [postage stamp batches](<https://docs.ethswarm.org/docs/concepts/incentives/postage-stamps/>).
Their balance is consumed over time; when it runs out, the stamps expire and nodes can remove the associated data.
Continued retention therefore requires [monitoring the remaining lifetime and topping up the batch](<https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch/>).
Swarm can be paid upfront for a long period, but that is funding for a limited duration rather than an endowment intended to support indefinite retention.

I decided against both for this publishing workflow because I want old editions to remain available without depending on my continued server administration, subscriptions, or top-ups.
The ongoing hosting or funding responsibility is the main difference for me, rather than whether a system supports content addressing or decentralisation.
Arweave's [pay-once storage model](#paying-once-for-permanent-storage) fits that goal better, subject to the economic and infrastructure risks discussed earlier.

### Related Technologies: DNS, Pkarr, ENS, and Unstoppable Domains

ArNS gives a publication a stable, readable name whose target can change.
Other naming systems serve similar purposes, but differ in who allocates names, who controls their records, and who governs the system.

**DNS** is the familiar comparison.
Its infrastructure is distributed, but its namespace follows a [coordinated hierarchy of delegated authority](<https://www.icann.org/resources/pages/about-domain-names-2018-08-30-en>).
A domain holder can manage records and even operate their own DNS servers, while the registration still depends on the relevant registry and registrar arrangements.
Controlling a name's records is therefore different from independently creating the name itself.

**[Pkarr (Public Key Addressable Resource Records)](<https://github.com/pubky/pkarr>)** takes the latter approach: generate a key pair, and the public key becomes the identifier.
The holder signs DNS records and publishes them through BitTorrent's distributed hash table (DHT), allowing others to verify them using that public key.
No registrar, blockchain, or domain purchase is required.
The trade-off is that a public key is not a memorable name such as `weisser-zwerg`.
Also, the DHT does not retain records indefinitely: somebody must [republish the signed records periodically](<https://github.com/pubky/pkarr/blob/main/docs/introduction.md>), although this need not be the key holder.

**[ENS (Ethereum Name Service)](<https://docs.ens.domains/>)** provides readable names such as `alice.eth`, with ownership recorded on Ethereum.
Owners can set records pointing to wallet addresses or website content.
The [ENS DAO governs shared rules](<https://docs.ens.domains/faq/>), including registration pricing; that governance is separate from an owner's control over their name.
An `.eth` registration has an expiry date and requires renewal, although several years can be paid for in advance.

**Unstoppable Domains** also offers blockchain names, including [Brave's `.brave` names](<https://brave.com/blog/brave-tld/>), minted on Polygon and supported by Brave.
These names have no recurring registration fee.
The distinction from ENS is that a company controls the issuance of new names, while owners control their minted names and records, as described in the [Unstoppable Name Service architecture](<https://docs.unstoppabledomains.com/web3/smart-contracts/overview/uns-architecture-overview>).
Brave supplies browser integration; it is not a separate naming protocol here.

These alternative names require compatible applications, browser support, or gateways; they do not automatically resolve everywhere that ordinary DNS names do.
And naming remains separate from storage: owning a name, even without renewal fees, does not pay for retaining the content it points to.

### Publish Directly to Arweave and Pay in AR

The main walkthrough used Turbo to bundle signed data items and submit them to Arweave.
I now want to see the machinery underneath that service by publishing a third version of the same website directly to Arweave, paying its native transaction fees in AR.
We will change only `index.html` and publish a new manifest that continues to reference the manual path's original `style.css` object.
We will package the new HTML and manifest as two signed data items in one native transaction; the existing stylesheet remains reusable even though it was originally uploaded through Turbo.

We will use Arweave's [HTTP API](<https://docs.arweave.org/developers/arweave-node-server/http-api>) through `curl` to inspect balances, query fees, submit transactions, and check their status.
A short JavaScript script will use a bundle-encoding library to prepare the signed data items and [`arweave-js`](<https://github.com/ArweaveTeam/arweave-js>) to construct the outer native transaction.
Despite its name, `arweave-js` is a library, published as the npm package `arweave`, rather than a command-line tool like `turbo`.
Plain JavaScript executed with Node is sufficient; preparation, signing, and submission will remain separate, visible steps.

> The [free allowance used earlier](<https://docs.ar.io/build/upload/turbo-credits/>) is a Turbo service feature.
> Native Arweave mainnet transactions require an AR fee even for small files, so this experiment will cost AR despite its tiny payloads.
> Paying directly avoids Turbo's infrastructure fee, but it does not remove the underlying network and storage costs.

The experiment will proceed as follows:

1. Establish a long-lived AR wallet in Wander, record its public address, and retain its recovery material.
2. Preserve the earlier HTML version, prepare version 3, and inspect the live upload fees while leaving `style.css` unchanged.
3. Acquire native AR for the long-lived payer in Wander; leave the disposable upload signer unfunded.
4. Create, inspect, and sign the HTML data item locally. Use its ID to create and sign the manifest, retaining the original CSS identifier.
5. Package both signed items into one ANS-104 bundle, quote its complete size, and inspect the outer native transaction. Sign that transaction with the funded payer and save it before submission.
6. Submit the saved transaction and check inclusion and confirmations: acceptance by a node does not yet mean it has been mined. Retrieve the website through the manifest item's ID and compare its files with the local originals.

#### Establish the Long-Lived AR Wallet in Wander

For the AR token reserve, we will use [Wander](<https://www.wander.app/>), formerly ArConnect, a self-custodial wallet available as a browser extension and mobile app.
It serves a similar purpose for native AR to the role MetaMask played for our Solana identity.
Here we will use the browser extension and create a separate Arweave wallet for keeping AR beyond this experiment.

> **What is the WNDR token advertised during installation?**<br>
> Wander's [July 2025 fair-launch announcement](<https://www.wander.app/blog/wndr-fair-launch>) introduces WNDR as its own project token in the AO/Arweave ecosystem, with intended benefits such as reduced service fees and access to features.
> The connection to AR is indirect: the announced model lets AR holders direct their future AO token rewards to Wander through the Permaweb Index and receive WNDR in return.
> This redirects the AO rewards; the underlying AR remains under the holder's control.
> WNDR is separate from AR, AO, and ARIO, and does not replace AR for paying native Arweave transaction fees.
> We need neither WNDR nor participation in this launch to hold and send AR with Wander.

Wander manages the same kind of [RSA identity represented by an Arweave JWK](<https://www.wander.app/help/what-is-a-json-keyfile>) that we used for uploads earlier.
The difference is its role: this new identity holds the long-lived AR reserve and will sign and pay for the outer native transaction, while the unfunded command-line signer signs the data items inside it.
Our MetaMask Solana identity continues to own the ArNS name.

> **Keep the wallet open while following the walkthrough.**<br>
> I found Wander's toolbar popup annoying because it closed whenever I clicked elsewhere.
> I would prefer a persistent browser sidebar like the ones I use with MetaMask and Phantom, but I could not find that option in Wander.
> A working alternative is to open Wander's menu/settings and select **Fullscreen**.

1. Open the [official Wander website](<https://www.wander.app/>) and follow its **Download extension** link to the browser's extension store.
2. Open the installed extension, choose to create a new wallet, and set its unlock password. If Wander is already configured, use its [account management screen to add a new account](<https://www.wander.app/help/browser-extensions---settings-how-to-create-or-import-additional-wallets>).
3. To back up the wallet, navigate to **Menu > Manage Accounts > Account 1 > Back up recovery phrase**. Select the intended account if its name differs from `Account 1`.
4. Only then does Wander ask **"Reveal recovery phrase?"**. Follow the prompts to reveal it, record the words in the correct order, and complete any backup confirmation requested by the wallet. Retain the phrase securely outside this project. If you also export a JWK keyfile as a backup, protect it as private key material.
5. With the intended account selected, open **Receive** and [copy its full public Arweave address](<https://www.wander.app/help/browser-extension---how-to-receive-arweave-and-ao-assets>). Compare the copied value with the wallet's display before saving it in your notes.

> The unlock password protects access to the wallet in this browser installation; it is not a substitute for a recovery backup.
> Wander documents [recovery through a seed phrase or keyfile](<https://www.wander.app/help/how-do-i-access-my-wallet-if-i-forget-my-password>).
> Anyone possessing that recovery material can control the wallet's funds, so keep it private.
> The public address can be recorded alongside the publication notes.<br>
> For this experiment the public address is `ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM`.

An Arweave address is a case-sensitive, 43-character string containing letters, digits, `-`, and `_`.
Set the following shell variable to the address copied from Wander:

```bash
# XXX_TODO_XXX: Replace this with the full public Arweave address from Wander.
ar_reserve_address="ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM"
printf '%s\n' "$ar_reserve_address"
```

This is the new reserve address, distinct from both `$upload_address`, our existing command-line signer, and `$arns_owner_address`, our Solana owner.
The shell variable is only a convenient reference; retain the public address in your notes so it remains available after a restart.
Creating this wallet requires no AR payment.

> **Token-fetch warnings in Wander.**<br>
> After installation, Wander showed red exclamation marks for WNDR, PI, USDA, and wAR, with the message "Wander is unable to fetch your token".
> The AR and AO entries displayed zero balances without those warnings.
> I have not established the cause of these warnings.
> For this walkthrough, we need native AR, whose balance we will also check independently through Arweave's HTTP API before submitting the bundle.

This wallet will pay the native transaction fee directly; the disposable upload signer will remain unfunded.

> The reserve wallet and its recovery material are intended to be retained for the long term.

#### What Is a "Funded Wallet"?

There are two different things:

* **Creating a cryptographic identity:** generating a key pair and deriving its address. This happens locally and costs nothing.
* **Creating an account entry in Arweave's balance ledger:** when a previously unknown address first receives AR, the network must start tracking its balance. That first transfer incurs an additional fee.

The implementation checks whether the recipient already exists in the accounts map.
It adds the surcharge when the entry is absent; it is not charged for every subsequent upload or top-up.
The sender pays this fee in addition to the transferred amount.
It is a spent fee, not a recoverable deposit.

Currently we have the following estimates:

<table class="article-table">
  <thead>
    <tr>
      <th scope="col">Component</th>
      <th scope="col">Fee (AR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Transfer fee without a new-account surcharge</td>
      <td><code>0.000042664221</code></td>
    </tr>
    <tr>
      <td>Transfer fee to our previously unfunded upload address</td>
      <td><code>0.265863359239</code></td>
    </tr>
  </tbody>
</table>

At the current quoted $3.27 per AR, that first funding transaction costs approximately $0.87, separately from the AR delivered to the recipient.<br>
This makes creating large numbers of account entries costly.<br>
Turbo avoids this by using two independently signed layers:

```text
Native Arweave transaction
  signed by: Turbo's funded Arweave identity
  AR fee paid by: that same identity
  payload:
    ANS-104 bundle
      signed data item
        signed by: your disposable upload identity
        content: your index.html
```

The inner data item has its own signature, owner, and identifier.
It has no native payment amount or transaction fee field.
The outer transaction pays for storing the whole bundle.

This separation is explicitly one of [ANS-104](<https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md>)'s purposes:
someone else can pay while the original author's identity and signature remain intact, without that author holding funds.

You can verify this against our actual first HTML upload:

* Our HTML item [`KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8`](<https://viewblock.io/arweave/tx/KNBfjAq_B8o_eKBmO8Aj2Non2dQdThS6BZjGLD4U_x8>) is signed by the [`6h59…` identity](<https://viewblock.io/arweave/address/6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY>).
* Its containing native transaction is [`WaDbzRNGW_qxLV4uQRf18rUOnIqMNJYqJ5Mc2A9xhGw`](<https://viewblock.io/arweave/tx/WaDbzRNGW_qxLV4uQRf18rUOnIqMNJYqJ5Mc2A9xhGw>).
* That transaction is signed by [`JNC6vBhjHY1EPwV3pEeNmrsgFMxH5d38_LHsZ7jful8`](<https://viewblock.io/arweave/address/JNC6vBhjHY1EPwV3pEeNmrsgFMxH5d38_LHsZ7jful8>), a different identity.
* Its native fee was `0.017617079614 AR` for the entire bundle, not just our HTML.

You can also inspect the [outer transaction as JSON](<https://arweave.net/tx/WaDbzRNGW_qxLV4uQRf18rUOnIqMNJYqJ5Mc2A9xhGw>).

Our identity therefore appears in permanently stored, signed content without needing an entry in the native AR balance ledger.
Turbo credits are the separate service-payment arrangement; for our small uploads, Turbo's free allowance covered that charge.

We can use the same separation without Turbo. ANS-104 is an open format:

1. A disposable JWK signs the HTML data item.
2. We package that item into a bundle locally.
3. A long-lived, funded Arweave identity signs the outer native transaction and pays in AR.
4. We submit it directly to Arweave.

That requires a bundle-encoding library alongside `arweave-js`, but no Turbo account, credits, or infrastructure fee.
The disposable signer stays unfunded.

For our intended publishing model, one retained funded payer plus disposable data-item signers is the better fit.

#### Prepare Version 3 and Inspect the Live Fees

If you are returning after a restart, first run the block in [Resume the Walkthrough After a Restart](#resume-the-walkthrough-after-a-restart) from the directory containing the website and its publication-state directory.
It restores the earlier variables and changes into `$site_dir`.
If you have already run it in this Bash session, continue here.

First, retain the version 2 source files outside the website directory and create a separate directory for this native-upload experiment:

```bash
v2_source_dir="${publication_state_dir:?Restore the walkthrough variables first}/source-v2"
native_v3_state_dir="$publication_state_dir/native-v3"
ar_node="https://arweave.net"

install -d -- "$v2_source_dir" "$native_v3_state_dir"
(
  set -e
  rg -q -F 'This is version 2 ' "${site_dir:?}/index.html"
  cmp -- "$v1_source_dir/style.css" "$site_dir/style.css"
  set -o noclobber
  cat "$site_dir/index.html" > "$v2_source_dir/index.html"
  cat "$site_dir/style.css" > "$v2_source_dir/style.css"
)
tree "$v2_source_dir"
# .../source-v2
# ├── index.html
# └── style.css
```

The backup block refuses to overwrite an existing snapshot; when resuming, reuse the saved version 2 files.
Now change the HTML's version number, keeping the relative stylesheet link and CSS unchanged:

```bash
sed 's/This is version 2/This is version 3/' "$v2_source_dir/index.html" > "$site_dir/index.html"

diff -u "$v2_source_dir/index.html" "$site_dir/index.html"
cmp -- "$v2_source_dir/style.css" "$site_dir/style.css"
wc -c "$site_dir/index.html" "$site_dir/style.css"
# 464 .../index.html
# 422 .../style.css
# 886 total
```

The `diff` should show only the change from `version 2` to `version 3`.
The CSS comparison should produce no output.

To compare separate uploads with the bundle we will construct, we first estimate the new manifest's size.
The HTML data-item ID will be known after local signing.
Both the old and new IDs have 43 characters, so we can estimate the manifest's exact byte count using a placeholder of the same length and the same JSON formatting:

```bash
native_v3_manifest_estimate_file="$native_v3_state_dir/manifest-size-estimate.json"

jq --arg html "$(printf '%043d' 0)" --arg css "$manual_v1_css_id" '.paths["index.html"].id = $html | .fallback.id = $html | .paths["style.css"].id = $css' \
  "$manual_v2_manifest_file" > "$native_v3_manifest_estimate_file"

native_v3_html_bytes="$(wc -c < "$site_dir/index.html")"
native_v3_manifest_bytes="$(wc -c < "$native_v3_manifest_estimate_file")"
printf 'HTML: %s bytes\nManifest: %s bytes\n' "$native_v3_html_bytes" "$native_v3_manifest_bytes"
# HTML: 464 bytes
# Manifest: 362 bytes
```

This document is only for estimating the fee.
We will create the publication manifest with the real HTML ID later.
The CSS entry already contains the original manual upload's identifier.

The native [transaction-price endpoint](<https://docs.arweave.org/developers/arweave-node-server/http-api#get-transaction-price>) accepts the data size in bytes and returns the upload fee in *winston*, where **1 AR = 1,000,000,000,000 winston**.
These two requests save the current quotes for uploading the HTML and manifest as separate native transactions:

```bash
curl --fail --silent --show-error --max-time 30 https://arweave.net/price/464 --output "$native_v3_state_dir/html-fee.winston"
# 3526829235
curl --fail --silent --show-error --max-time 30 https://arweave.net/price/362 --output "$native_v3_state_dir/manifest-fee.winston"
# 3526829235
```

Uploaded separately, the fee would be **0.0035 AR** (about **$0.0115**) for the 464-byte HTML file and the same amount for the 362-byte manifest.
Together, that would be **0.007 AR** (about **$0.023**), using the quoted exchange rate of **$3.27 per AR**.

> **Small uploads are priced in 256 KiB steps.**<br>
> For native transactions, Arweave calculates the fee from the data size rounded up to a multiple of **256 KiB (262,144 bytes)**, plus a fixed transaction-size allowance.
> At the same network price, a non-empty payload of up to 262,144 bytes therefore has the same minimum upload fee; the next step starts at 262,145 bytes.
> This rule is explicit in the [protocol implementation](<https://github.com/ArweaveTeam/arweave/blob/18d402c714132e1de3962b12ff32a420127e0c02/apps/arweave/src/ar_tx.erl#L222-L237>) and its [boundary tests](<https://github.com/ArweaveTeam/arweave/blob/18d402c714132e1de3962b12ff32a420127e0c02/apps/arweave/src/ar_tx.erl#L970-L981>).
> Bundling allows several small data items to share one native transaction's minimum charge.

#### Bundling

We will publish the version 3 HTML and its manifest together in one ANS-104 bundle, assembled locally without Turbo.
The crucial detail is that the HTML's data-item ID becomes known **when we sign it locally**, before submitting anything to Arweave.
[ANS-104 defines that ID as the SHA-256 hash of the item's signature](<https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md#2-dataitem-signature-and-id>).

The sequence is therefore:

1. Create and sign the version 3 HTML data item locally. Its signature gives us its final ID.
2. Create the manifest referencing that HTML ID and the original, already published CSS ID.
3. Sign the manifest as another data item. Its ID is now known too.
4. Package both signed items into one ANS-104 bundle.
5. Put the bundle into a native transaction, sign it with the funded payer, and submit it.

There is no circular dependency: the manifest needs the HTML item's ID, but neither item needs the enclosing transaction's ID.
The bundle contains the already signed items; packaging them does not change their IDs.
We retain those signed bytes rather than signing the items again, which could produce different IDs.

We therefore have **three IDs but only one native transaction fee**:

* The **HTML item ID** identifies the new page.
* The **manifest item ID** identifies the document through which we access the website.
* The **outer transaction ID** identifies the native transaction carrying both items.

Our tiny bundle, including signatures and metadata, will remain below 256 KiB.
At the quoted price, that means approximately **0.0035 AR ($0.0115)** for both items together, instead of twice that amount.
Before submission, we will query the fee for the completed bundle's actual byte size.
The original stylesheet remains outside the new bundle and is reused through its existing ID.

This is the workflow we will follow: the disposable JWK signs both data items and stays unfunded, while the long-lived identity in Wander signs and pays for the outer native transaction.

#### Acquire Native AR for the Long-Lived Payer

We now need native AR at the long-lived address managed by Wander so that it can pay for the bundle's outer transaction.
The destination is `$ar_reserve_address`; the disposable upload identity at `$upload_address` stays unfunded.

AR can be obtained through an exchange or a fiat-purchase provider:

* **Buy through an exchange and withdraw to Wander.** [CoinGecko's AR markets overview](<https://www.coingecko.com/en/coins/arweave#markets>) lists exchanges and spot trading pairs. For example, Kraken lists [AR with support for the native Arweave network](<https://support.kraken.com/articles/360000678446-cryptocurrencies-available-on-kraken>). An exchange you already use is convenient if it supports AR purchases and native withdrawals for your account and country. Check that withdrawals are available before buying.
* **Use Wander's Buy option.** Wander documents a [fiat-purchase flow through Transak](<https://www.wander.app/help/browser-extension---how-to-buy-ar-tokens-with-a-fiat-currency>). If available in your installation and region, select AR, your payment currency, and a payment method. Transak handles the purchase, payment details, and any required identity verification. Confirm that the receiving address is your intended Wander account.

> **Wander/Transak purchase unavailable on November 11, 2026.**<br>
> While trying to buy €50 worth of AR by card in Wander, I received the message: "AR on mainnet is temporarily unavailable. Please try again later."
> I could not obtain a purchase quote through this route. The message did not explain the cause.

You can also try [Transak's direct AR purchase page](<https://transak.com/buy/ar>) without going through Wander's Buy screen, supplying your public Wander address as the destination.

> **The direct Transak route also failed on November 11, 2026.**<br>
> I tried Transak's website directly and received the same message: "AR on mainnet is temporarily unavailable. Please try again later."
> The page showed this error with €250 entered for a card purchase, so going directly to Transak did not resolve the problem in this experiment.

I am keeping the direct link here in case AR purchases become available again.

> We need **native AR on Arweave**, not ARIO, AO, WNDR, or a wrapped AR token on another network.
> A DEX or bridge route must ultimately deliver native AR to this address as well; for example, everPay documents [withdrawing AR to Arweave](<https://docs.everpay.io/en/docs/guide/SDK/everpay-js/operation-api/withdraw>).
> Merely holding a wrapped token or a balance inside another service does not fund the native transaction.

At the earlier quote, **0.01 AR arriving in Wander** would cover the approximately **0.0035 AR** bundle fee with some margin.

Compare the total amount charged with the amount of AR that will actually arrive; buying and withdrawing the tokens can cost considerably more than our small upload.
Kraken, for example, publishes its [withdrawal fees and minimums](<https://support.kraken.com/articles/360000767986-cryptocurrency-withdrawal-fees-and-minimums>), but the final quote in the service you use is what matters.

Before proceeding, display the public address we recorded earlier and compare it with **Receive** in Wander:

```bash
printf '%s\n' "${ar_reserve_address:?Set the public Wander address from the wallet subsection first}"
# My address: ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM
```

Then complete the funding through the chosen provider:

1. Select **AR / Arweave** as the asset and **Arweave** as the withdrawal network if a network selector is shown.
2. Use the full Wander address as the destination. For an exchange, this is a withdrawal after buying AR; for the integrated purchase flow, check the address supplied to the provider.
3. Review the amount that will arrive, the charges, and any withdrawal waiting period before confirming the purchase or withdrawal.
4. Retain the provider's receipt and, once available, the Arweave transaction ID. Wait for the transfer to appear in Wander.

The [first-funding fee explained above](#what-is-a-funded-wallet) belongs to the incoming transfer and is paid by its sender; the provider may account for it in its charges.
It is separate from the fee our Wander identity will later pay to publish the bundle.

I eventually obtained AR through [Gate](<https://www.gate.com>) and withdrew it over the native Arweave network on November 11, 2026.
Of the **1.800 AR** deducted from my exchange account, Gate charged **0.082 AR** for the withdrawal, and **1.718 AR** arrived in my Wander wallet.
The disposable upload signer remained unfunded.

> **A pleasant surprise: the withdrawal charge was lower than the network fee.**<br>
> The actual [Arweave](https://viewblock.io/arweave/tx/4VFARADAnRbL_cTnV_hFyq2nD2WtuwNkJj6WR6NLDFs) [transaction](<https://arweave.net/tx/4VFARADAnRbL_cTnV_hFyq2nD2WtuwNkJj6WR6NLDFs>) records `reward: "269347524253"`: a total network fee of **0.27 AR**, paid by Gate's sending wallet.
> That was approximately **0.187 AR more** than Gate charged me for this withdrawal.
> The transaction does not itemise the first-funding surcharge separately; nothing further was deducted from the **1.718 AR** received in Wander.

We can independently check the resulting native balance using Arweave's [wallet-balance endpoint](<https://docs.arweave.org/developers/arweave-node-server/http-api#get-a-wallet-balance>):

```bash
curl --fail --silent --show-error --max-time 30 "https://arweave.net/wallet/${ar_reserve_address:?Set the public Wander address first}/balance"
printf '\n'
# 1718000000000
```

The response is an integer in winston: **1 AR = 1,000,000,000,000 winston**.
If it still returns `0`, check the provider's transfer status and transaction ID; the incoming transfer may not yet have been confirmed.

Once the balance is available, we have the funded payer needed for the next steps.
The disposable JWK remains responsible only for signing the HTML and manifest data items; it receives no AR.
We will compare the payer's balance with the completed bundle's fresh fee quote before submission.

#### Create, Inspect, and Sign the HTML and Manifest Data Items

We now prepare the two signed objects that will go inside the bundle.
Both use the existing disposable Arweave JWK at `$upload_wallet_file`; Wander will sign the enclosing transaction in the next step.
Creating and signing these data items happens locally and does not publish anything.

For the ANS-104 encoding, we will use [`@dha-team/arbundles`](<https://github.com/DHA-Team/arbundles>), the same low-level library used by the installed Turbo SDK.

The pinned version below requires Node.js 22 or newer.
Keep the tooling outside `$site_dir` so that it cannot accidentally become part of a later directory upload:

```bash
native_v3_tools_dir="${native_v3_state_dir:?Prepare version 3 first}/tools"
native_v3_html_item_file="$native_v3_state_dir/index.html.ans104"
native_v3_manifest_file="$native_v3_state_dir/manifest.json"
native_v3_manifest_item_file="$native_v3_state_dir/manifest.ans104"

install -d -- "$native_v3_tools_dir"
(
  set -e
  cd -- "$native_v3_tools_dir"
  npm init --yes
  npm install --save-exact --ignore-scripts @dha-team/arbundles@1.2.0
)
```

The following small script has two modes: `inspect` constructs an unsigned data item and displays its public fields; `sign` also signs it, saves its binary representation, and verifies the saved result.
It uses the library's `createData`, `ArweaveSigner`, and `DataItem` APIs.
The private JWK is read from its existing location and is never printed or copied into the publication-state directory.

```bash
cat > "$native_v3_tools_dir/data-item.mjs" <<'EOF'
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { ArweaveSigner, createData, DataItem } from '@dha-team/arbundles';

const [mode, keyFile, sourceFile, contentType, itemFile] = process.argv.slice(2);
assert(['inspect', 'sign'].includes(mode) && keyFile && sourceFile && contentType && itemFile,
  'Usage: node data-item.mjs inspect|sign KEY SOURCE CONTENT_TYPE ITEM_FILE');

const summaryFile = `${itemFile}.json`;
if (mode === 'sign') {
  assert(!existsSync(itemFile) && !existsSync(summaryFile),
    'Signed output already exists; retain it rather than signing again.');
}

const jwk = JSON.parse(readFileSync(keyFile, 'utf8'));
const signer = new ArweaveSigner(jwk);
const data = readFileSync(sourceFile);
const item = createData(data, signer, {
  tags: [{ name: 'Content-Type', value: contentType }],
});

const summary = {
  uploader: createHash('sha256').update(item.rawOwner).digest('base64url'),
  signatureType: item.signatureType,
  target: item.target || null,
  anchor: item.anchor || null,
  tags: item.tags,
  dataBytes: item.rawData.length,
  serializedBytes: item.getRaw().length,
  signed: false,
};

if (mode === 'sign') {
  await item.sign(signer);
  assert(await item.isValid(), 'Data-item signature verification failed.');
  writeFileSync(itemFile, item.getRaw(), { flag: 'wx' });

  // Verify the exact bytes saved to disk, including the original payload.
  const saved = new DataItem(readFileSync(itemFile));
  assert(await saved.isValid(), 'Saved data-item verification failed.');
  assert.equal(saved.id, item.id);
  assert(saved.rawData.equals(data), 'Saved payload differs from the source.');

  summary.signed = true;
  summary.id = saved.id;
  summary.signatureVerified = true;
  writeFileSync(summaryFile, JSON.stringify(summary, null, 2) + '\n', { flag: 'wx' });
}

console.log(JSON.stringify(summary, null, 2));
EOF
```

* `uploader` is the address of the disposable Arweave upload identity we created earlier: the value in `$upload_address`, which is `6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY` in my experiment.
The data item's `owner` field contains this same identity's public key; the script derives the displayed address from that key.
* Signature type `1` means the RSA signer used by our JWK.
* We supply only the `Content-Type` tag and leave the optional target and anchor empty.
* `dataBytes` counts the file contents, while `serializedBytes` also includes the signature, public key, tags, and other ANS-104 fields.
* There is no native `quantity` or `reward` field here: payment belongs to the outer transaction.

**Inspect and sign the HTML.** First check that we still have version 3 and the original stylesheet, then inspect the unsigned HTML item:

```bash
(
  set -e
  rg -q -F 'This is version 3 ' "$site_dir/index.html"
  cmp -- "$v2_source_dir/style.css" "$site_dir/style.css"
  printf 'Expected uploader: %s\n' "$upload_address"
  node "$native_v3_tools_dir/data-item.mjs" inspect "$upload_wallet_file" "$site_dir/index.html" text/html "$native_v3_html_item_file"
)
# Expected uploader: 6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY
# {
#   "uploader": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "signatureType": 1,
#   "target": null,
#   "anchor": null,
#   "tags": [
#     {
#       "name": "Content-Type",
#       "value": "text/html"
#     }
#   ],
#   "dataBytes": 464,
#   "serializedBytes": 1533,
#   "signed": false
# }
```

Check that `uploader` matches `$upload_address`, the tag is `Content-Type: text/html`, and `dataBytes` is `464` for the unchanged example.
There is no final ID yet because we have not signed the item.
Now sign and retain it:

```bash
node "$native_v3_tools_dir/data-item.mjs" sign "$upload_wallet_file" "$site_dir/index.html" text/html "$native_v3_html_item_file"
# {
#   "uploader": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "signatureType": 1,
#   "target": null,
#   "anchor": null,
#   "tags": [
#     {
#       "name": "Content-Type",
#       "value": "text/html"
#     }
#   ],
#   "dataBytes": 464,
#   "serializedBytes": 1533,
#   "signed": true,
#   "id": "OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA",
#   "signatureVerified": true
# }

native_v3_html_id="$(jq -er '.id' "$native_v3_html_item_file.json")"
printf 'Version 3 HTML item: %s\n' "$native_v3_html_id"
# Version 3 HTML item: OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA

tree -L 1 .../publishing-arweave-ario-basics-site-publication-state/native-v3/
# /home/cs/workspaces/indie-publisher-template/publishing-arweave-ario-basics-site-publication-state/native-v3/
# ├── html-fee.winston
# ├── index.html.ans104
# ├── index.html.ans104.json
# ├── manifest-fee.winston
# ├── manifest-size-estimate.json
# └── tools

tree -L 1 .../publishing-arweave-ario-basics-site-publication-state/native-v3/tools
# /home/cs/workspaces/indie-publisher-template/publishing-arweave-ario-basics-site-publication-state/native-v3/tools
# ├── data-item.mjs
# ├── node_modules
# ├── package.json
# └── package-lock.json
```

The result now includes `signed: true`, `signatureVerified: true`, and the final data-item ID.
The `.ans104` file contains the signed binary item; the accompanying `.ans104.json` file is a local inspection summary, not an upload receipt.
Your ID will differ from anyone else's because signing with this RSA-PSS key introduces randomness.

**Create and sign the manifest.** We can now replace the previous manifest's HTML references with that locally obtained ID, including its fallback, while retaining the original CSS identifier:

```bash
(
  set -e
  set -o noclobber
  jq --arg html "${native_v3_html_id:?Sign the HTML first}" \
     --arg css "${manual_v1_css_id:?Restore the original CSS ID}" \
     '.paths["index.html"].id = $html |
      .fallback.id = $html |
      .paths["style.css"].id = $css' \
    "$manual_v2_manifest_file" > "$native_v3_manifest_file"
)

jq . "$native_v3_manifest_file"
# {
#   "manifest": "arweave/paths",
#   "version": "0.2.0",
#   "index": {
#     "path": "index.html"
#   },
#   "paths": {
#     "index.html": {
#       "id": "OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA"
#     },
#     "style.css": {
#       "id": "AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q"
#     }
#   },
#   "fallback": {
#     "id": "OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA"
#   }
# }
wc -c "$native_v3_manifest_file"
# 362 .../native-v3/manifest.json

node "$native_v3_tools_dir/data-item.mjs" inspect "$upload_wallet_file" "$native_v3_manifest_file" application/x.arweave-manifest+json "$native_v3_manifest_item_file"
# {
#   "uploader": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "signatureType": 1,
#   "target": null,
#   "anchor": null,
#   "tags": [
#     {
#       "name": "Content-Type",
#       "value": "application/x.arweave-manifest+json"
#     }
#   ],
#   "dataBytes": 362,
#   "serializedBytes": 1457,
#   "signed": false
# }
```

Check that `index.html` and `fallback` refer to `$native_v3_html_id`, while `style.css` still refers to `$manual_v1_css_id`.
The manifest's own `Content-Type` is `application/x.arweave-manifest+json`; this is what identifies it as a path manifest to a gateway.
Then sign it as the second data item:

```bash
node "$native_v3_tools_dir/data-item.mjs" sign "$upload_wallet_file" "$native_v3_manifest_file" application/x.arweave-manifest+json "$native_v3_manifest_item_file"
# {
#   "uploader": "6h59SG7Jkkpc5rWO2fKlTw6P5MrG2eVttKSlXOufjwY",
#   "signatureType": 1,
#   "target": null,
#   "anchor": null,
#   "tags": [
#     {
#       "name": "Content-Type",
#       "value": "application/x.arweave-manifest+json"
#     }
#   ],
#   "dataBytes": 362,
#   "serializedBytes": 1457,
#   "signed": true,
#   "id": "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k",
#   "signatureVerified": true
# }

native_v3_manifest_id="$(jq -er '.id' "$native_v3_manifest_item_file.json")"
printf 'Version 3 manifest item: %s\n' "$native_v3_manifest_id"
# Version 3 manifest item: k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k
```

> **Keep the signed bytes, not just the IDs.**<br>
> The script refuses to overwrite existing signed output.
> When resuming, read the IDs from the saved summaries and use the existing `.ans104` files.
> Re-signing the HTML could produce a different ID and would require rebuilding and re-signing the manifest that references it.

We now have both final item IDs and their locally verified signed bytes.
Next we will package these exact two items into one bundle and prepare the native transaction that carries them.

#### Bundle the Items and Sign the Native Transaction

The HTML and manifest are already signed, so bundling now means arranging their existing bytes into the [ANS-104 bundle format](<https://github.com/ArweaveTeam/arweave-standards/blob/master/ans/ANS-104.md#12-transaction-body-format>).
We then prepare one native Arweave transaction, inspect its fee and fields, and ask Wander to sign it with the funded reserve identity.
We will save that signed transaction for submission in the next step.

**Package the two existing items.** A bundle starts with an item count, followed by each item's byte length and ID, and then the signed items themselves.
The following script constructs that header and uses `arbundles` to read and verify the result.
It needs no private key and does not re-sign either item:

```bash
native_v3_bundle_file="$native_v3_state_dir/bundle.ans104"
native_v3_signing_dir="$native_v3_state_dir/signing"
native_v3_unsigned_file="$native_v3_signing_dir/unsigned.json"
native_v3_signed_file="$native_v3_state_dir/native-v3.signed.json"

cat > "$native_v3_tools_dir/bundle-items.mjs" <<'EOF'
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { Bundle, DataItem, longTo32ByteArray } from '@dha-team/arbundles';

const [htmlFile, manifestFile, cssId, bundleFile] = process.argv.slice(2);
const items = [htmlFile, manifestFile].map(file => new DataItem(readFileSync(file)));
for (const [index, file] of [htmlFile, manifestFile].entries()) {
  assert(await items[index].isValid(), `Invalid signed item: ${file}`);
  assert.equal(items[index].id, JSON.parse(readFileSync(`${file}.json`)).id);
}

const manifest = JSON.parse(items[1].rawData.toString('utf8'));
assert.equal(manifest.paths['index.html'].id, items[0].id);
assert.equal(manifest.fallback.id, items[0].id);
assert.equal(manifest.paths['style.css'].id, cssId);

const header = Buffer.concat([
  Buffer.from(longTo32ByteArray(items.length)),
  ...items.flatMap(item => [
    Buffer.from(longTo32ByteArray(item.getRaw().length)), item.rawId,
  ]),
]);
const bytes = Buffer.concat([header, ...items.map(item => item.getRaw())]);
const bundle = new Bundle(bytes);
assert(await bundle.verify(), 'Bundle verification failed.');
assert.deepEqual(bundle.getIds(), items.map(item => item.id));
for (let i = 0; i < items.length; i++) {
  assert(bundle.get(i).getRaw().equals(items[i].getRaw()));
}

writeFileSync(bundleFile, bytes, { flag: 'wx' });
console.log(JSON.stringify({ bytes: bytes.length, itemIds: bundle.getIds() }, null, 2));
EOF

node "$native_v3_tools_dir/bundle-items.mjs" "$native_v3_html_item_file" "$native_v3_manifest_item_file" "$manual_v1_css_id" "$native_v3_bundle_file"
# {
#   "bytes": 3150,
#   "itemIds": [
#     "OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA",
#     "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k"
#   ]
# }

native_v3_bundle_bytes="$(wc -c < "$native_v3_bundle_file")"
printf 'Complete bundle: %s bytes\n' "$native_v3_bundle_bytes"
# Complete bundle: 3150 bytes
```

For our files, that is 1,533 bytes for the HTML item, 1,457 bytes for the manifest item, and 160 bytes of bundle headers.
Both item IDs remain unchanged.
The bundle itself does not yet have a native transaction ID; that will come from the outer transaction's signature.

**Quote and construct the outer transaction.** Install the pinned `arweave-js` package in the same tooling directory:

```bash
(
  set -e
  cd -- "$native_v3_tools_dir"
  npm install --save-exact --ignore-scripts arweave@1.15.7
)
install -d -- "$native_v3_signing_dir"
```

Query the node for the complete bundle's fee, a recent transaction anchor, and the payer's current balance:

```bash
(
  set -e
  curl --fail --silent --show-error --max-time 30 "$ar_node/price/$native_v3_bundle_bytes" --output "$native_v3_state_dir/bundle-fee.winston"
  # 3531726853
  curl --fail --silent --show-error --max-time 30 "$ar_node/tx_anchor" --output "$native_v3_state_dir/tx-anchor.txt"
  # OlSX0BUWTwKtJJViE3WQEPhYAfcYZqQuazs3YhmXOE3tZV2WtKkq9cByoKJOYXhj
  curl --fail --silent --show-error --max-time 30 "$ar_node/wallet/${ar_reserve_address:?Set the Wander address}/balance" --output "$native_v3_state_dir/payer-balance.winston"
  # 1718000000000
)
```

These are read-only requests.
The [transaction anchor](<https://docs.arweave.org/developers/arweave-node-server/http-api#get-transaction-anchor>) ties the transaction to recent chain state; it is unrelated to the website's previous publication ID.
Because the complete bundle still fits below 256 KiB, its quote should be close to the earlier **0.0035 AR** estimate, subject to the network's current price.

> Prepare the outer transaction shortly before submitting it: a block anchor is valid only within a recent-block window.
> If you pause long enough for an unsubmitted transaction's anchor to become stale, obtain a fresh anchor and fee quote and prepare and sign a replacement outer transaction, retaining the earlier files separately.
> The signed HTML and manifest items can be reused unchanged; only the outer transaction ID changes.

Now construct and save the unsigned transaction using those responses:

```bash
cat > "$native_v3_tools_dir/prepare-native.mjs" <<'EOF'
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import Arweave from 'arweave';

const [stateDir, payer] = process.argv.slice(2);
assert(/^[A-Za-z0-9_-]{43}$/.test(payer), 'Expected the public Wander address.');
const readText = name => readFileSync(join(stateDir, name), 'utf8').trim();
const reward = readText('bundle-fee.winston');
const balance = readText('payer-balance.winston');
const anchor = readText('tx-anchor.txt');
assert(/^\d+$/.test(reward) && BigInt(reward) > 0n);
assert(/^\d+$/.test(balance) && BigInt(balance) >= BigInt(reward), 'Insufficient AR.');
assert(/^[A-Za-z0-9_-]+$/.test(anchor), 'Invalid transaction anchor.');

const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const transaction = await arweave.createTransaction({
  data: readFileSync(join(stateDir, 'bundle.ans104')),
  last_tx: anchor,
  reward,
  target: '',
  quantity: '0',
});
transaction.addTag('Bundle-Format', 'binary');
transaction.addTag('Bundle-Version', '2.0.0');
transaction.addTag('Content-Type', 'application/octet-stream');

writeFileSync(join(stateDir, 'signing', 'unsigned.json'),
  JSON.stringify(transaction, null, 2) + '\n', { flag: 'wx' });
writeFileSync(join(stateDir, 'signing', 'payer-address.txt'), payer + '\n', { flag: 'wx' });
console.log(JSON.stringify({
  payer,
  balanceAR: arweave.ar.winstonToAr(balance),
  ...transaction.toJSON(),
  data: '(bundle bytes omitted from this display)',
  tags: transaction.tags.map(tag => ({
    name: tag.get('name', { decode: true, string: true }),
    value: tag.get('value', { decode: true, string: true }),
  })),
  feeAR: arweave.ar.winstonToAr(transaction.reward),
}, null, 2));
EOF

node "$native_v3_tools_dir/prepare-native.mjs" "$native_v3_state_dir" "$ar_reserve_address"
# {
#   "payer": "ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM",
#   "balanceAR": "1.718000000000",
#   "format": 2,
#   "id": "",
#   "last_tx": "OlSX0BUWTwKtJJViE3WQEPhYAfcYZqQuazs3YhmXOE3tZV2WtKkq9cByoKJOYXhj",
#   "owner": "",
#   "tags": [
#     {
#       "name": "Bundle-Format",
#       "value": "binary"
#     },
#     {
#       "name": "Bundle-Version",
#       "value": "2.0.0"
#     },
#     {
#       "name": "Content-Type",
#       "value": "application/octet-stream"
#     }
#   ],
#   "target": "",
#   "quantity": "0",
#   "data": "(bundle bytes omitted from this display)",
#   "data_size": "3150",
#   "data_root": "SwSjx4Rrjsho8c46joL4Qio3de_NSTIL-zX4_Zp-P7Q",
#   "reward": "3531726853",
#   "signature": "",
#   "feeAR": "0.003531726853"
# }

tree $native_v3_state_dir/signing/
# .../publishing-arweave-ario-basics-site-publication-state/native-v3/signing/
# ├── payer-address.txt
# └── unsigned.json
```

The saved JSON contains the unsigned transaction in the format expected by arweave-js, including the complete bundle in its base64url-encoded data field and base64url-encoded tag names and values.
For readability, the terminal display hides the bundle bytes, decodes the tags, and adds the intended payer address, its previously retrieved balance, and the fee expressed in AR.
These three additional fields are inspection aids and are not saved as part of the transaction.

The fields to inspect are:

* `format: 2` selects the current native transaction format.
* `target: ""` and `quantity: "0"` mean this transaction stores data without transferring AR to another address.
* `reward` is the single network fee in winston; `feeAR` displays its AR equivalent.
* `data_size` is the complete bundle size, and `data_root` is the Merkle root committing to those data bytes.
* `last_tx` contains the anchor just retrieved.
* `Bundle-Format` and `Bundle-Version` identify the payload as an ANS-104 binary bundle so that gateways can unpack its items.
* `owner`, `signature`, and `id` are still empty. Wander will supply the funded payer's public key and signature, from which the outer transaction ID is derived.

The first-funding surcharge is not relevant to this storage transaction: there is no recipient account to create.

**Sign with Wander in the browser.** Wander exposes its [signing API](<https://docs.wander.app/api/sign>) to browser pages, so we will use a small local page and the browser's developer console.
This keeps the payer's private key inside Wander.
The page loads the same pinned library from disk and serves only the public signing files:

```bash
cp -- "$native_v3_tools_dir/node_modules/arweave/bundles/web.bundle.min.js" "$native_v3_signing_dir/arweave.js"
cat > "$native_v3_signing_dir/index.html" <<'EOF'
<!doctype html>
<meta charset="utf-8">
<title>Sign the Arweave version 3 bundle</title>
<h1>Sign the Arweave version 3 bundle</h1>
<p>Follow the walkthrough in the browser's developer console. This page does not submit transactions.</p>
<script src="./arweave.js"></script>
EOF

python3 -m http.server 8767 --bind 127.0.0.1 --directory "$native_v3_signing_dir"
```

Keep that server running and open [http://127.0.0.1:8767/](<http://127.0.0.1:8767/>) in the browser where Wander is installed.
Select the reserve account in Wander, then open the page's **Developer Tools > Console**; in Chrome on Linux, <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>J</kbd> opens it directly.
The following blocks are **JavaScript for that browser console**, not Bash commands.

First, connect and inspect the unsigned transaction:

```javascript
var nativeArweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
await window.arweaveWallet.connect(
  ['ACCESS_ADDRESS', 'SIGN_TRANSACTION'], { name: 'Arweave by Foot' }
);
var expectedPayer = (await (await fetch('./payer-address.txt')).text()).trim();
var connectedPayer = await window.arweaveWallet.getActiveAddress();
if (connectedPayer !== expectedPayer) throw new Error('Select the intended Wander account.');
var unsignedNativeTx = await (await fetch('./unsigned.json')).json();
var nativeTx = nativeArweave.transactions.fromRaw(unsignedNativeTx);
await nativeTx.prepareChunks(nativeTx.data);
if (nativeTx.data_root !== unsignedNativeTx.data_root) {
  throw new Error('Rebuilt data root differs from the saved transaction.');
}
console.log({
  payer: connectedPayer, dataBytes: nativeTx.data_size,
  target: nativeTx.target, quantity: nativeTx.quantity,
  feeAR: nativeArweave.ar.winstonToAr(nativeTx.reward),
});
```

The saved JSON contains the bundle and its data root, but omits the SDK's in-memory chunk metadata.
`prepareChunks` rebuilds that metadata locally before signing; the check confirms that the data root is unchanged.
Without this step, [Wander's transaction validation](<https://github.com/wanderwallet/Wander/blob/4828cf173ef4b183a442b738ad349148c9edf60f/src/utils/assertions.ts>) rejects the reloaded transaction with `expected to be not undefined`.

If `window.arweaveWallet` is unavailable, unlock Wander, allow it access to this local page, and reload the page.
Choose **Always ask** when granting the connection's signing permissions, so that the next operation presents a confirmation.
Check the payer, bundle size, zero transfer amount, and fee before proceeding.

Now request the signature, review and approve it in Wander, and download the signed transaction:

```javascript
await nativeArweave.transactions.sign(nativeTx);
if (!(await nativeArweave.transactions.verify(nativeTx))) throw new Error('Invalid signature.');
if (await nativeArweave.wallets.ownerToAddress(nativeTx.owner) !== expectedPayer) {
  throw new Error('The transaction was signed by a different account.');
}
console.log({ id: nativeTx.id, feeAR: nativeArweave.ar.winstonToAr(nativeTx.reward) });

var signedNativeBlob = new Blob([JSON.stringify(nativeTx, null, 2) + '\n'], { type: 'application/json' });
var signedNativeURL = URL.createObjectURL(signedNativeBlob);
var signedNativeLink = document.createElement('a');
signedNativeLink.href = signedNativeURL;
signedNativeLink.download = 'native-v3.signed.json';
signedNativeLink.click();
setTimeout(() => URL.revokeObjectURL(signedNativeURL), 1000);
```

This calls `sign`, which returns a signed transaction.
We do not use Wander's [dispatch operation](<https://docs.wander.app/api/dispatch>), which also submits data and may use a bundler.
If the download needs to be repeated, rerun only the download lines beginning with `var signedNativeBlob`; keep the existing `nativeTx` rather than requesting another signature.

> Wander may append `Signing-Client` and `Signing-Client-Version` tags and apply its configured fee multiplier, as shown in its [signing implementation](<https://github.com/wanderwallet/Wander/blob/4828cf173ef4b183a442b738ad349148c9edf60f/src/api/modules/sign/sign.background.ts>).
> The verification below permits those additional tags but requires the fee we inspected.
> If the fee differs, stop and review Wander's fee setting and the signed result before proceeding; do not edit the signed JSON to change the fee.

**Retain and verify the downloaded transaction.** Stop the local server with <kbd>Ctrl</kbd>+<kbd>C</kbd>, return to Bash, and copy the download into the publication-state directory:

```bash
# XXX_TODO_XXX: Adjust this if your browser saved the file elsewhere or added a suffix.
native_v3_download_file="$HOME/Downloads/native-v3.signed.json"
(
  set -o noclobber
  cat -- "$native_v3_download_file" > "$native_v3_signed_file"
)
```

Finally, check the saved file independently with Node: its signature must verify, its payer must be the Wander address, its bundle bytes must match our local bundle exactly, and its transaction fields must match the inspected request.

```bash
cat > "$native_v3_tools_dir/verify-native.mjs" <<'EOF'
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import Arweave from 'arweave';

const [stateDir, signedFile, payer] = process.argv.slice(2);
const arweave = Arweave.init({ host: 'arweave.net', port: 443, protocol: 'https' });
const original = JSON.parse(readFileSync(join(stateDir, 'signing', 'unsigned.json')));
const signed = JSON.parse(readFileSync(signedFile));
const tx = arweave.transactions.fromRaw(signed);
assert(await arweave.transactions.verify(tx), 'Invalid native transaction signature.');
assert.equal(await arweave.wallets.ownerToAddress(tx.owner), payer, 'Unexpected payer.');
for (const field of ['format', 'last_tx', 'target', 'quantity', 'reward', 'data_size', 'data_root', 'data']) {
  assert.equal(signed[field], original[field], `Changed transaction field: ${field}`);
}
assert.deepEqual(signed.tags.slice(0, original.tags.length), original.tags);
for (const tag of signed.tags.slice(original.tags.length)) {
  const name = arweave.utils.b64UrlToString(tag.name);
  assert(['Signing-Client', 'Signing-Client-Version'].includes(name), `Unexpected tag: ${name}`);
}
const bundleBytes = readFileSync(join(stateDir, 'bundle.ans104'));
assert(Buffer.from(tx.data).equals(bundleBytes), 'Bundle payload differs.');
assert.equal(tx.data_size, String(bundleBytes.length));
const rebuilt = await arweave.createTransaction({
  data: bundleBytes, reward: tx.reward, last_tx: tx.last_tx,
});
assert.equal(tx.data_root, rebuilt.data_root, 'Bundle data root differs.');
console.log(JSON.stringify({
  id: tx.id, payer, dataBytes: tx.data_size,
  feeAR: arweave.ar.winstonToAr(tx.reward), signatureVerified: true,
}, null, 2));
EOF

node "$native_v3_tools_dir/verify-native.mjs" "$native_v3_state_dir" "$native_v3_signed_file" "$ar_reserve_address"
# {
#   "id": "T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs",
#   "payer": "ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM",
#   "dataBytes": "3150",
#   "feeAR": "0.003531726853",
#   "signatureVerified": true
# }
native_v3_tx_id="$(jq -er '.id' "$native_v3_signed_file")"
printf 'Signed native transaction: %s\n' "$native_v3_tx_id"
Signed native transaction: T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs

tree -L 2 $native_v3_state_dir/
# .../publishing-arweave-ario-basics-site-publication-state/native-v3/
# ├── bundle.ans104
# ├── bundle-fee.winston
# ├── html-fee.winston
# ├── index.html.ans104
# ├── index.html.ans104.json
# ├── manifest.ans104
# ├── manifest.ans104.json
# ├── manifest-fee.winston
# ├── manifest.json
# ├── manifest-size-estimate.json
# ├── native-v3.signed.json
# ├── payer-balance.winston
# ├── signing
# │   ├── arweave.js
# │   ├── index.html
# │   ├── payer-address.txt
# │   └── unsigned.json
# ├── tools
# │   ├── bundle-items.mjs
# │   ├── data-item.mjs
# │   ├── node_modules
# │   ├── package.json
# │   ├── package-lock.json
# │   ├── prepare-native.mjs
# │   └── verify-native.mjs
# └── tx-anchor.txt
```

We now have three identifiers: the HTML item ID, the manifest item ID, and the outer native transaction ID.
The first two have not changed during bundling or Wander signing.
The saved native transaction contains the bundle and the payer's signature, ready for the separate submission step.
Its signature already authorises that exact transaction, so retain it as the submission artifact rather than signing it again on a retry.

#### Submit the Bundle and Retrieve Version 3

We now have a signed native transaction containing both data items.
Submitting it sends those saved bytes to Arweave.
The outer transaction pays the native AR fee, while the enclosed HTML and manifest retain their original uploader and IDs.

**Submit the saved transaction.** The following small helper uses the same `arweave-js` 1.15.7 installation for two operations: `status` reads the transaction's current state, and `submit` uploads it.
It records each result in a local JSON-lines log, including errors, so that a lost connection does not leave us relying on terminal output alone:

```bash
native_v3_network_log="$native_v3_state_dir/network.jsonl"

cat > "$native_v3_tools_dir/native-network.mjs" <<'EOF'
import assert from 'node:assert/strict';
import { readFileSync, appendFileSync } from 'node:fs';
import Arweave from 'arweave';

const [action, signedFile, nodeUrl, logFile] = process.argv.slice(2);
assert(['status', 'submit'].includes(action), 'Use status or submit.');
const endpoint = new URL(nodeUrl);
const arweave = Arweave.init({
  host: endpoint.hostname,
  port: Number(endpoint.port || (endpoint.protocol === 'https:' ? 443 : 80)),
  protocol: endpoint.protocol.slice(0, -1),
  timeout: 30000,
});
const saved = JSON.parse(readFileSync(signedFile));
const tx = arweave.transactions.fromRaw(saved);
assert(/^[A-Za-z0-9_-]{43}$/.test(tx.id), 'Expected a signed transaction ID.');

let result;
try {
  if (action === 'submit') {
    await tx.prepareChunks(tx.data);
    assert.equal(tx.data_root, saved.data_root, 'Payload does not match its data root.');
    assert.equal(String(tx.data.length), saved.data_size, 'Unexpected payload size.');
    assert(await arweave.transactions.verify(tx), 'Invalid transaction signature.');
    result = await arweave.transactions.post(tx);
    if (result.status < 200 || result.status >= 300) process.exitCode = 1;
  } else {
    result = await arweave.transactions.getStatus(tx.id);
  }
} catch (error) {
  result = { error: error.message };
  process.exitCode = 1;
}

const record = { time: new Date().toISOString(), action, node: nodeUrl, id: tx.id, ...result };
appendFileSync(logFile, JSON.stringify(record) + '\n', { mode: 0o600 });
console.log(JSON.stringify(record, null, 2));
EOF

node "$native_v3_tools_dir/native-network.mjs" status "$native_v3_signed_file" "$ar_node" "$native_v3_network_log"
# {
#   "time": "2026-11-11T07:39:11.789Z",
#   "action": "status",
#   "node": "https://arweave.net",
#   "id": "T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs",
#   "status": 400,
#   "confirmed": null
# }
```

Before the first submission, a `404` is expected: this node does not yet know the transaction.
If the status is already `202` (pending) or `200` with confirmation details, continue with the status checks below rather than submitting again.
My first check instead returned `400`, as recorded above. The SDK's status result omits the response body, so that output alone does not establish the reason; `400` should not be interpreted as a pending transaction.

The next block is the actual publication step.
It first repeats the preceding section's local checks against the prepared transaction and bundle, then sends the signed transaction:

```bash
(
  set -e
  node "$native_v3_tools_dir/verify-native.mjs" "$native_v3_state_dir" "$native_v3_signed_file" "$ar_reserve_address"
  node "$native_v3_tools_dir/native-network.mjs" submit "$native_v3_signed_file" "$ar_node" "$native_v3_network_log"
)
# {
#   "id": "T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs",
#   "payer": "ECvRPFcbiOR2dwhf9st7opzMK33LDIkGXzfu_5njKSM",
#   "dataBytes": "3150",
#   "feeAR": "0.003531726853",
#   "signatureVerified": true
# }
# {
#   "time": "2026-11-11T07:40:47.370Z",
#   "action": "submit",
#   "node": "https://arweave.net",
#   "id": "T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs",
#   "status": 200,
#   "statusText": "OK",
#   "data": {}
# }
```

For this small bundle, the SDK sends the transaction and its complete payload together to the node's [`POST /tx` endpoint](<https://docs.arweave.org/developers/arweave-node-server/http-api#submit-a-transaction>).
The [SDK's `post` implementation](<https://github.com/ArweaveTeam/arweave-js/blob/v1.15.7/src/common/transactions.ts>) reports successful upload as `status: 200`.
That result means the upload completed; it does **not** mean a miner has included the transaction in a block.
The local log is a record of the SDK response.

> **Retry the saved transaction, not the signing process.**<br>
> If submission times out, first check the existing transaction ID: the node may have received it even though its response did not reach us.
> A repeated submission of the same signed transaction retains the same ID and cannot create a second distinct transaction or charge its fee twice on the same chain.
> If the node rejects the transaction, inspect the recorded error before retrying; for example, an expired anchor requires a newly prepared and signed outer transaction, as discussed above.
> Do not edit the signed JSON: changing its anchor or fee invalidates the signature.

**Check inclusion and confirmations.** Run the read-only status command again, and repeat it after a few minutes while the transaction is pending:

```bash
native_v3_tx_id="$(jq -er '.id' "$native_v3_signed_file")"
node "$native_v3_tools_dir/native-network.mjs" status "$native_v3_signed_file" "$ar_node" "$native_v3_network_log"
# {
#   "time": "2026-11-11T07:43:29.787Z",
#   "action": "status",
#   "node": "https://arweave.net",
#   "id": "T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs",
#   "status": 200,
#   "confirmed": {
#     "block_height": 2039958,
#     "block_indep_hash": "4zLJAK7Hgc3XU8FM8-EqZZHjmVkAjnsTg4SmE2P9sUPD0K6UcC3fyMZJCU1IO4eQ",
#     "number_of_confirmations": 2
#   }
# }

printf 'Transaction: https://viewblock.io/arweave/tx/%s\n' "$native_v3_tx_id"
# Transaction: https://viewblock.io/arweave/tx/T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs
printf 'Status API: %s/tx/%s/status\n' "$ar_node" "$native_v3_tx_id"
# Status API: https://arweave.net/tx/T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs/status
```

The [`GET /tx/{id}/status` response](<https://docs.arweave.org/developers/arweave-node-server/http-api#get-transaction-status>) distinguishes the stages:

* `202`, with `confirmed: null` in the SDK result: the transaction is pending.
* `200`, with a `confirmed` object: the transaction has been included in a block. `block_height` and `block_indep_hash` identify that block; `number_of_confirmations` reports its confirmation count.
* `404`: the responding node does not know the transaction. After an attempted upload, this alone does not establish whether another node received it.

For this walkthrough, we will wait for at least **20 confirmations** before treating publication as complete.
This is our chosen checkpoint.
The check concerns the **outer transaction ID**; the two inner item IDs do not have separate native transactions or confirmation counts.

**Retrieve the website and compare its bytes.** Once the bundle is included, a gateway must also discover and index its data items before it can serve the website through the manifest ID.
For this native bundle, we will use `arweave.net` as the retrieval gateway.
In my checks, `turbo-gateway.com` served the outer bundle, but returned `404` for the manifest item inside it.
The same bundle, manifest, and resolved website files were already available through `arweave.net`, and all four downloads matched the local originals.
The variable below applies only to this native-upload experiment; the earlier `$gateway_base` remains available for the preceding walkthrough.

```bash
# echo $gateway_base
# https://turbo-gateway.com
native_v3_gateway="https://arweave.net"
native_v3_fetch_dir="$native_v3_state_dir/retrieved"
native_v3_html_id="$(jq -er '.id' "$native_v3_html_item_file.json")"
# OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA
# https://arweave.net/OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA
# https://turbo-gateway.com/OvEVX6iJ81icbGq4BxrQSnLmc6_sN_8szVO8g9zo2DA
native_v3_manifest_id="$(jq -er '.id' "$native_v3_manifest_item_file.json")"
# k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k
# https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/
# https://turbo-gateway.com/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/
install -d -- "$native_v3_fetch_dir"

(
  set -e
  native_fetch() {
    printf 'Fetching %s\n' "$1" >&2
    curl --fail --silent --show-error --location --max-time 60 --retry 5 --retry-delay 10 --retry-all-errors --output "$2" "$1"
  }

  native_fetch "$native_v3_gateway/raw/$native_v3_tx_id" "$native_v3_fetch_dir/bundle.ans104"
  cmp -- "$native_v3_bundle_file" "$native_v3_fetch_dir/bundle.ans104"

  native_fetch "$native_v3_gateway/raw/$native_v3_manifest_id" "$native_v3_fetch_dir/manifest.json"
  cmp -- "$native_v3_manifest_file" "$native_v3_fetch_dir/manifest.json"
  jq -e --arg html "$native_v3_html_id" --arg css "$manual_v1_css_id" \
    '.paths["index.html"].id == $html and .paths["style.css"].id == $css' \
    "$native_v3_fetch_dir/manifest.json"

  native_fetch "$native_v3_gateway/$native_v3_manifest_id/" "$native_v3_fetch_dir/index.html"
  cmp -- "$site_dir/index.html" "$native_v3_fetch_dir/index.html"

  native_fetch "$native_v3_gateway/$native_v3_manifest_id/style.css" "$native_v3_fetch_dir/style.css"
  cmp -- "$v2_source_dir/style.css" "$native_v3_fetch_dir/style.css"

  printf 'Version 3 verified: bundle, manifest, HTML, and unchanged CSS match.\n'
  printf 'Version 3 website: %s/%s/\n' "$native_v3_gateway" "$native_v3_manifest_id"
)
# Fetching https://arweave.net/raw/T0gT47segLYaI8kXz0Pxsq-A9kH2V00M1h9Awebmbcs
# Fetching https://arweave.net/raw/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k
# true
# Fetching https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/
# Fetching https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/style.css
# Version 3 verified: bundle, manifest, HTML, and unchanged CSS match.
# Version 3 website: https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/
```

Each successful `cmp` is silent; `jq` should print `true`.
The helper prints each requested URL, and the final website URL appears only after all downloads and comparisons succeed.
The `/raw/` requests compare the stored bundle and manifest themselves, while the last two requests test the website paths resolved through the manifest.
With my signed manifest, that URL is [the version 3 website](<https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/>).

> **Storage and gateway indexing are separate.**<br>
> Our HTML and manifest are stored inside the outer bundle.
> A gateway can retrieve that bundle as one sequence of bytes without knowing which individual items it contains.
> To serve the manifest through its own item ID, it also needs a way to locate that item inside the bundle.
>
> AR.IO gateways have two configurable processing stages, controlled by [gateway filters](<https://docs.ar.io/build/run-a-gateway/manage/filters>):
>
> * **Unbundling:** open a bundle and parse the signed data items inside it. `ans104UnbundleFilter` selects which bundles this background process handles.
> * **Indexing:** record the discovered items' identifiers and metadata so that they can be looked up later. `ans104IndexFilter` selects which items enter that index.
>
> On November 11, 2026, Turbo's gateway exposed the following settings through its public [`/ar-io/info` endpoint](<https://turbo-gateway.com/ar-io/info>):
>
> ```json
> {
>   "ans104UnbundleFilter": { "never": true },
>   "ans104IndexFilter": { "never": true }
> }
> ```
>
> Here, `{"never": true}` means that the filter selects nothing.
> This background process therefore neither unpacks new bundles nor adds their contained items to its index.
>
> This is consistent with what I observed: Turbo's gateway could return the complete 3,150-byte bundle, but could not resolve the manifest's individual ID and returned `404`.
>
> `arweave.net`, on the other hand, could resolve it, and the retrieved files matched the local originals.
> The publication was stored successfully; the gateways differed in their ability to locate its contents.
>
> This has consequences for publishing through `ar://` links and Wayfinder, discussed in [Gateway Discovery and the Limits of Automatic Routing](#gateway-discovery-and-the-limits-of-automatic-routing) below.

We have now followed the native path from signed data items to a funded outer transaction and retrieved the website through `arweave.net`.
The HTML and manifest share one AR fee, the original CSS is reused, and the upload identity remains unfunded.
The existing ArNS undername still points to version 2; publishing version 3 does not move that separate mutable pointer.
However, successful retrieval through this gateway leaves an important question: can a reader reach the same publication without knowing which gateway serves it?

#### Gateway Discovery and the Limits of Automatic Routing

I expected a publication stored on Arweave to be accessible through any working gateway, with Wayfinder choosing one automatically.
The experiment exposed a significant limitation in that expectation.
On November 11, 2026, the native transaction had been mined and `arweave.net` served the website correctly, but opening the following address through the Wayfinder browser extension led to Turbo's gateway and a `404` response:

```text
ar://k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/
```

The bytes were stored, yet the reader's attempt to reach them failed.
There are two separate issues here: discovering an item inside its bundle, and recovering when the selected gateway cannot find it.

**An item ID still needs a location lookup.** The manifest ID does not encode the outer transaction ID or its position inside that transaction.
A gateway needs to discover that relationship before it can retrieve the item.
AR.IO supports [several sources for this lookup](<https://docs.ar.io/build/run-a-gateway/manage/cdb64>), including local indexes, other gateways, shared indexes, and GraphQL services.
Each gateway therefore does not need to unpack the entire blockchain itself.
These mechanisms are intended to make discovery automatic, but they do not guarantee that every gateway can resolve every item.
In this experiment, Turbo's gateway could retrieve the outer bundle but could not resolve its manifest item, while `arweave.net` could do both.
The precise reason that Turbo's available lookup mechanisms failed to find this item remains unestablished.

**Wayfinder did not recover from the missing lookup.** The [revision used in this walkthrough](<https://github.com/ar-io/wayfinder/tree/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c>), containing Core 2.0.2, has the following behaviour:

* Its [gateway probes](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-core/src/routing/ping.ts>) ordinarily check the gateway's root URL. They establish that the server responds, not that it can locate this particular publication.
* The browser extension [resolves the address to a gateway URL](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/src/routing.ts#L248-L280>) and redirects the browser there. Its [response handlers](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-extension/src/background.ts#L790-L957>) do not retry another gateway when that page returns `404`.
* Core's separate [download implementation](<https://github.com/ar-io/wayfinder/blob/a3390ca5e9eca6aca81c0c24ef41ac3dfa0c021c/packages/wayfinder-core/src/fetch/wayfinder-fetch.ts#L134-L193>) retries certain network and server failures, but explicitly stops retrying for HTTP `4xx` responses, including `404`.

That last assumption is unsuitable for this situation: a gateway's inability to find an item does not establish that the item does not exist.
I expected Wayfinder to handle this search, but the tested implementation left me to discover a working gateway manually.

**Why Turbo can nevertheless serve its own bundles.** When an upload goes through Turbo, its infrastructure receives the individual data items before bundling them.
It already has their bytes and identifiers.
The [documented bundler integration](<https://docs.ar.io/build/extensions/bundler/#configure-optimistic-indexing>) shares data with the gateway and provides an authenticated API for *optimistic indexing*, allowing items to become accessible before their enclosing transaction settles on Arweave.
Our native upload bypassed that ingestion process: it wrote the bundle directly to Arweave and left gateways to discover its contents afterward.

The `{"never": true}` settings shown above therefore do not mean that Turbo's gateway cannot serve bundled content.
They disable the particular background discovery process we examined; other ingestion and lookup mechanisms can still supply bundled items.
Those settings alone also do not establish that Turbo deliberately excludes uploads made elsewhere, or explain the full cause of this failed lookup.

**Later discovery is possible, but remains unverified.** The failed requests do not establish that the publication will remain inaccessible through Turbo's gateway.
It could recover automatically even with local unbundling disabled:

* A later request could succeed through another configured [lookup source](<https://docs.ar.io/build/run-a-gateway/manage/cdb64>), such as a gateway or GraphQL service that has since learned the item-to-bundle relationship.
* A [shared index](<https://docs.ar.io/build/run-a-gateway/manage/index-sharing/>) could receive an update containing that relationship. If Turbo subscribes to that index, the update could make the item discoverable there.

Both mechanisms exist in AR.IO, but they depend on the gateway's configuration and the coverage of its sources.
Information available at one gateway is not guaranteed to reach every other gateway eventually.

When I checked again approximately an hour after submission on November 11, 2026, `arweave.net` still returned the manifest successfully, while Turbo still returned `404`.
A query to [`arweave.net/graphql`](<https://arweave.net/graphql>) found the manifest, but returned an empty `bundledIn.id` instead of its enclosing transaction ID.
Serving the manifest's bytes and exposing its parent relationship through a discovery API were therefore different things in this case.
A gateway relying on that GraphQL response would not obtain the relationship it needed, even though downloading the manifest directly from `arweave.net` worked.

This does not establish that Turbo used that particular lookup path.
Its public information endpoint did not expose enough configuration to determine that.

> Waiting may resolve this if the missing relationship reaches a lookup source that Turbo uses.
> However, I have not established such a propagation path or a time bound for this publication.

If the cause is indexing lag, a delayed shared-index update, or a temporary failure, time can help.
If the necessary source is absent, incompatible, or never supplies the relationship, waiting alone will not resolve it.
The evidence therefore describes a discovery failure observed at the time of testing, with eventual recovery still unverified; it establishes neither permanent unavailability nor assured eventual availability.

For a publisher, this is a material access limitation.
The successful native upload demonstrated storage and retrieval through a working endpoint; it did not demonstrate reliable access through arbitrary gateways or automatic Wayfinder routing.
Bundling saved a native transaction fee and preserved the separate uploader identity, but the resulting item URLs still depend on discovery infrastructure that can fail independently of storage.

Two concrete issues deserve upstream investigation: Wayfinder's missing fallback after a content `404`, and Turbo's failure to discover this valid, externally submitted bundle.
The [working HTTPS publication URL](<https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/>) gives readers access now, but it binds that access to a known gateway.
For my intended publishing model, making the same immutable identifier reliably reachable without that prior knowledge remains an unresolved requirement.
