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

### Who Runs What: Organizations, Services, and Gateways

The shared branding initially made it difficult for me to distinguish the open networks from the organizations and commercial services around them.
Arweave provides the storage network, while Solana executes the current ArNS and ARIO contracts.
The Console, Turbo, and individual gateways provide ways to use those networks, with different operators and payment arrangements.

#### The Foundation, PDS, and Gateway Operators

The [AR.IO platform terms](<https://ar.io/legal/terms-of-service-and-privacy-policy/>) distinguish the Console's operator from the provider of Turbo credits.
The [AR.IO About page](<https://ar.io/about/>) adds the historical relationship:

<table class="article-table">
  <thead>
    <tr><th>Organization or participants</th><th>Role in the ecosystem</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Stichting ar.io, the AR.IO Foundation</strong></td><td>A Dutch foundation that operates the ar.io platform, including the Console, and supports the ecosystem through development, grants, education, and outreach.</td></tr>
    <tr><td><strong>Permanent Data Solutions, Inc. (PDS)</strong></td><td>The company behind ArDrive and Turbo, and the original developer of the AR.IO network. It also operates Permaweb Services, which provides private gateways for organizations.</td></tr>
    <tr><td><strong>Gateway operators</strong></td><td>Participants who run the open-source gateway software and provide access to Arweave data. The network permits independently operated gateways; running its software does not make an operator part of PDS or the Foundation.</td></tr>
  </tbody>
</table>

Purchasing Turbo credits establishes a commercial relationship with **PDS/ArDrive**.
The Foundation's terms explicitly say that it does not issue or control those credits; responsibility for Turbo's pricing and service lies with its separate provider.
The fact that the purchase happens inside `console.ar.io` does not change that distinction.

Turbo's prominent integration is understandable given PDS's role in developing AR.IO.
Nevertheless, an ecosystem-branded interface can make one commercial service appear inseparable from the protocol, especially when credits and cards are the most visible choices.

#### The Console Also Documents Direct Payments

The [purchase guide for Console 4.11.0](<https://docs.ar.io/build/guides/working-with-arns/buy-manage-arns-console>) describes three routes:

<table class="article-table">
  <thead>
    <tr><th>Payment choice</th><th>What happens</th></tr>
  </thead>
  <tbody>
    <tr><td>Credits or card</td><td>Existing Turbo credits pay for the name, or the card purchases credits first. Turbo covers the registration's Solana costs.</td></tr>
    <tr><td>Crypto → ARIO</td><td>The owner's wallet pays ARIO directly to the registry and SOL for network fees and account deposits. No Turbo infrastructure fee applies.</td></tr>
    <tr><td>Other cryptocurrencies, such as SOL or USDC</td><td>The payment buys Turbo credits first, which then pay for the name. The token transfer can itself require a network fee.</td></tr>
  </tbody>
</table>

The same guide documents record changes paid directly with the owner's SOL, with Turbo credits as another payment option.
Thus, using the Console does not necessarily mean using Turbo for payment, and paying with cryptocurrency does not necessarily mean bypassing Turbo.
The selected route matters.

I verified these options in the documentation; the [direct Solana experiment below](#register-and-update-an-arns-name-directly-on-solana) uses the SDK, and I did not test the Console's direct ARIO purchase route end to end.
Check the options offered by the version actually loaded in the browser.
The separate [fee discussion](#turbo's-infrastructure-fee-and-direct-payments) explains the 35% top-up deduction displayed during this experiment and the costs that remain with direct payment.

#### The Public Domains and Their Infrastructure

The [AR.IO website](<https://ar.io/>), [Console](<https://console.ar.io/>), and [gateway directory](<https://gateways.ar.io/#/gateways>) serve different purposes.

Today, I found that `weisser-zwerg-native.ar.io` and `weisser-zwerg-native.turbo-gateway.com` resolved to the same two IP addresses: `162.55.156.39` and `49.13.45.141`.
Both failed to serve the native-upload publication even when their response headers identified the correct manifest.
For these hostnames, `.ar.io` behaved like an alternative address for Turbo's gateway infrastructure.
This is an inference from the shared addresses and observed behaviour.
There may be load balancing within that deployment; I found no evidence that it selected a gateway from the wider network that could serve this publication.

The [gateway behaviour overview](#gateway-behaviour-overview) records the broader test: seven of 25 gateway domains delivered the complete website through both its immutable ID and its ArNS name.
Other responses included `404`, connection failures, and HTTP 200 JSON wrappers containing the manifest instead of the website.
The tested Wayfinder browser extension also selected Turbo's gateway and did not switch to another gateway after the content request returned `404`.
The [routing analysis](#gateway-discovery-and-the-limits-of-automatic-routing) identifies the tested revision and its limitations.

#### Why Turbo Uploads and Direct Uploads Can Behave Differently

Turbo receives an upload's individual data items before bundling them, so its ingestion service already has their bytes and identifiers.
The [documented bundler integration](<https://docs.ar.io/build/extensions/bundler/#configure-optimistic-indexing>) lets a gateway share that data and receive *optimistic index* entries, making items accessible before their enclosing transaction settles on Arweave.
My direct AR upload bypassed that ingestion path: gateways had to discover the items inside the submitted bundle afterward.

Turbo's [public gateway settings](<https://turbo-gateway.com/ar-io/info>) reported `{"never": true}` for both `ans104UnbundleFilter` and `ans104IndexFilter` during today's checks.
Those settings disabled the background process that unpacks bundles and indexes their items; they did not disable every way of obtaining bundled content.
This explains how serving Turbo uploads can coexist with disabled background unbundling, but does not establish the precise cause of my failed lookup or deliberate exclusion of uploads made elsewhere.

Gateways can also use [other lookup sources](<https://docs.ar.io/build/run-a-gateway/manage/cdb64>) and [shared indexes](<https://docs.ar.io/build/run-a-gateway/manage/index-sharing/>).
Later discovery is possible, but I established neither a propagation path nor a time bound that would make this publication available through Turbo automatically.

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

### Register and Update an ArNS Name Directly on Solana

The preceding experiment published version 3 directly to Arweave and paid for storage in AR.
We will now do the corresponding experiment for naming: register an ArNS name and change its target directly through Solana, paying the underlying costs without Turbo credits.
We will reuse the Solana account from the main walkthrough, [`BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ`](<https://solscan.io/account/BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ>), which I have now funded with SOL.
Its private key will remain in the browser wallet when we sign the transactions.

There are two currencies involved: [ARIO, an SPL token on Solana](<https://docs.ar.io/learn/token/>), pays the ArNS registration price; SOL pays transaction fees and the rent-exempt balances required for new on-chain accounts.
Both are managed through the same Solana wallet.
A simple update to an existing name's target requires only a Solana transaction, no further ARIO transaction.

The experiment will proceed as follows:

1. Choose a new base name, check its availability, and compare lease and permanent registration prices, separating ARIO from SOL costs.
2. Acquire the required ARIO for the existing wallet, retaining enough SOL for fees and account creation.
3. Prepare and inspect the registration, initially pointing the name at the existing version 2 manifest.
4. Sign through the browser wallet, submit through Solana RPC, and independently verify the registry entry, ANT ownership, controller permissions, and target.
5. Update the target to version 3 in a separate transaction, and explain how the same operation applies to an undername.
6. Verify the on-chain record, gateway resolution, and retrieved files, distinguishing naming from the gateway discovery problem observed above.

#### Choose a Name and Inspect the Live Registration Cost

I already own `weisser-zwerg`, so it cannot serve as an example of a fresh registration.
For the following walkthrough I use `weisser-zwerg-native`.
Choose your own base name when following along.

If the earlier shell variables are missing, first run [Resume the Walkthrough After a Restart](#resume-the-walkthrough-after-a-restart).
Keep the new tooling and quote files beside the earlier publication state, outside the website directory:

```bash
native_arns_state_dir="${publication_state_dir:?Restore the walkthrough variables first}/native-arns"
native_arns_tools_dir="$native_arns_state_dir/tools"

# XXX_TODO_XXX: Choose the new base name you want to investigate.
native_arns_name="weisser-zwerg-native"
# XXX_TODO_XXX: Use the existing owner's public Solana address.
arns_owner_address="BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
solana_rpc_url="${SOLANA_RPC_URL:-https://api.mainnet-beta.solana.com}"

install -d -- "$native_arns_tools_dir"
(
  set -e
  cd -- "$native_arns_tools_dir"
  npm init --yes
  npm install --save-exact --ignore-scripts @ar.io/sdk@4.5.2
)
ario_cli="$native_arns_tools_dir/node_modules/.bin/ar.io"
"$ario_cli" --version
# 4.5.2
```

The [AR.IO SDK includes an `ar.io` command-line interface](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/CLI.md>), so these initial read-only checks need no JavaScript helper.
The commands below query Solana through the selected RPC endpoint and require only the public address.
If the public endpoint rejects or rate-limits your requests, set `SOLANA_RPC_URL` to your own mainnet RPC endpoint before running the setup block.

Check three kinds of registry entry: an existing registration, a reserved name, and a returned name that may follow a different purchase path:

```bash
"$ario_cli" get-arns-record --rpc-url "$solana_rpc_url" --name "$native_arns_name"
# ArNS record not found: weisser-zwerg-native

"$ario_cli" get-arns-reserved-name --rpc-url "$solana_rpc_url" --name "$native_arns_name"
# Reserved name not found: weisser-zwerg-native

"$ario_cli" get-arns-returned-name --rpc-url "$solana_rpc_url" --name "$native_arns_name"
# Returned name not found: weisser-zwerg-native
```

These were my results before starting the walkthrough myself: none of the three entries existed for the candidate.
If a command returns an existing entry instead, choose another candidate for this fresh-registration example.

Now request both a one-year lease quote and a permanent-registration quote, saving the complete responses:

```bash
(
  set -e -o pipefail

  "$ario_cli" get-cost-details \
    --rpc-url "$solana_rpc_url" \
    --intent Buy-Name --name "$native_arns_name" \
    --type lease --years 1 \
    --address "$arns_owner_address" --fund-from balance \
    | tee "$native_arns_state_dir/lease.quote.json"

  "$ario_cli" get-cost-details \
    --rpc-url "$solana_rpc_url" \
    --intent Buy-Name --name "$native_arns_name" \
    --type permabuy \
    --address "$arns_owner_address" --fund-from balance \
    | tee "$native_arns_state_dir/permabuy.quote.json"
)
# {
#   "tokenCost": 2285128800,
#   "discounts": [],
#   "gasEstimate": {
#     "totalLamports": 10941924,
#     "feeLamports": 294244,
#     "baseFeeLamports": 15000,
#     "priorityFeeLamports": 279244,
#     "rentLamports": 10647680,
#     "rentReclaimedLamports": 0,
#     "priorityFeeMicroLamports": 349055,
#     "computeUnitLimit": 400000,
#     "signatureCount": 3,
#     "transactionCount": 2
#   },
#   "fundingPlan": {
#     "address": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#     "balance": 0,
#     "stakes": {},
#     "shortfall": 2285128800
#   },
#   "message": "The cost of the provided action is 2,285.1288 ARIO. Insufficient funds for action. There is a shortfall of 2,285.1288 ARIO"
# }
# {
#   "tokenCost": 9521370000,
#   "discounts": [],
#   "gasEstimate": {
#     "totalLamports": 10941924,
#     "feeLamports": 294244,
#     "baseFeeLamports": 15000,
#     "priorityFeeLamports": 279244,
#     "rentLamports": 10647680,
#     "rentReclaimedLamports": 0,
#     "priorityFeeMicroLamports": 349055,
#     "computeUnitLimit": 400000,
#     "signatureCount": 3,
#     "transactionCount": 2
#   },
#   "fundingPlan": {
#     "address": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#     "balance": 0,
#     "stakes": {},
#     "shortfall": 9521370000
#   },
#   "message": "The cost of the provided action is 9,521.37 ARIO. Insufficient funds for action. There is a shortfall of 9,521.37 ARIO"
# }
```

* `--fund-from balance` selects the wallet's liquid ARIO balance as the intended payment source.
* The SDK's [`getCostDetails` implementation](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/io-readable.ts#L2833>) combines the registration price with an estimate of the SOL needed for fees and account creation.
* `tokenCost` is expressed in mARIO, with 1,000,000 mARIO per ARIO.
Within `gasEstimate`, `feeLamports`, `rentLamports`, and `totalLamports` express the fees, rent deposits, and total requirement in lamports, with 1,000,000,000 lamports per SOL.

My quotes were as follows.
The approximate USD equivalents use [CoinGecko's ARIO price](<https://www.coingecko.com/en/coins/ar-io-network>) of $0.001271 per ARIO, checked on the same day; they exclude the separate SOL costs and any fees for acquiring ARIO.

<table class="article-table">
  <thead>
    <tr><th>Component</th><th>One-year lease</th><th>Permanent registration</th></tr>
  </thead>
  <tbody>
    <tr><td>Registration price (<code>tokenCost</code>)</td><td>2,285.1288 ARIO ($2.90)</td><td>9,521.37 ARIO ($12.10)</td></tr>
    <tr><td>Estimated transaction fees (<code>feeLamports</code>)</td><td>0.000294056 SOL</td><td>0.000294276 SOL</td></tr>
    <tr><td>Rent deposits (<code>rentLamports</code>)</td><td>0.010647680 SOL</td><td>0.010647680 SOL</td></tr>
    <tr><td>Total estimated SOL requirement (<code>totalLamports</code>)</td><td>0.010941736 SOL</td><td>0.010941956 SOL</td></tr>
  </tbody>
</table>

The registration price and SOL requirement are separate amounts, not alternatives.
A lease expires unless extended; permanent registration has no scheduled renewal payment.

> The slightly different SOL fee estimates came from separate live queries.

> **Rent is an account deposit, not a recurring bill.**
> Solana requires a [minimum SOL balance for storing account data](<https://solana.com/docs/core/accounts>).
>
> On Solana, an account is a place where data is stored. Your wallet has an account, but the ArNS registration also creates accounts holding information about the name and its ANT.
> Each such account must contain a minimum SOL balance. Your wallet supplies that balance when the account is created. This is what the quote calls rent. The balance stays there; it is not gradually consumed by monthly or yearly charges.
>
> This means that part of the SOL leaves your wallet but remains attached to the records created for your name.
> The quoted rent amount funds the new accounts needed by the registration flow; it is separate from the transaction fees that are spent.
> Recovering such a balance requires closing the relevant account through a supported program operation.

My quote also reported `fundingPlan.balance: 0` and an ARIO shortfall equal to the registration price.
That refers to the available **ARIO**, not the SOL I had just transferred to the account.

The next step is therefore to choose between a one year lease or permabuy and acquire the required ARIO.

#### Acquire the Required ARIO

We can obtain ARIO by swapping part of the SOL already held in the existing owner's wallet.
The [official ARIO acquisition guide](<https://docs.ar.io/learn/token/get-the-token/>) links to Jupiter and Raydium for trading the Solana token.
We will use [Jupiter](<https://jup.ag/>), which finds a swap route through Solana liquidity pools, and approve the swap with the same account in Phantom.

First, verify the token's **mint address**, which identifies ARIO itself rather than the wallet receiving it.
The [official Solana ARIO mint](<https://ar.io/token/>) is:

```text
DcNnMuFxwhgV4WY1HVSaSEgr92bv2b1vUvEKiNxWqHdF
```

You can inspect it on [Solscan](<https://solscan.io/token/DcNnMuFxwhgV4WY1HVSaSEgr92bv2b1vUvEKiNxWqHdF>).
Select this Solana token, not the bridged ARIO on Base; the ticker alone does not establish which asset you are buying.

Before swapping, refresh the registration quote for the lease or permanent purchase you chose above.
Its `fundingPlan.shortfall`, divided by 1,000,000, gives the additional ARIO required.
Use that token amount as the target rather than the approximate USD conversion in the table, and allow a small margin for changes in the registration price before purchase.

> **Keep enough SOL for the next steps.**
> After the swap, the wallet must still cover the registration's quoted SOL requirement, plus a margin for fee changes and the later record update.
> The swap itself also has transaction costs and may need to create an account for holding your ARIO tokens.
> Do not swap the entire SOL balance: owning enough ARIO does not pay these SOL costs.

> **Jupiter requires the SOL amount to sell, not the ARIO amount to buy.**
> On November 13, 2026, my updated registration quote reported a shortfall of 2,399.38512 ARIO, so I wanted to buy 2,500 ARIO with a small buffer.
> I expected to enter that amount in the **Buy** field, but Jupiter's **Market / Ultra** interface only let me edit the SOL amount in **Sell**; the ARIO amount was a calculated result.
> This was not a setting I had missed: [Jupiter's FAQ](<https://support.jup.ag/>) explains that its former **ExactOut** option was removed because it often produced worse pricing.
>
> At the displayed rate of about 63,045 ARIO per SOL, 2,500 ARIO corresponded to approximately 0.03965 SOL.
> Entering 0.04 SOL was therefore a useful starting point for a fresh quote.
> Recheck the resulting output and minimum received after changing the amount; the exchange rate and route can change, so this calculation does not guarantee an exact ARIO amount.

1. Open [Jupiter](<https://jup.ag/>), connect Phantom, and confirm that the connected Solana address matches `$arns_owner_address`.
2. Choose SOL as the token to spend. For the token to receive, paste the full ARIO mint address above into the token selector and verify the selected asset.
3. Enter the SOL amount in **Sell** and inspect the calculated ARIO amount in **Buy**. Adjust the SOL input until the **minimum received** covers the required additional ARIO and your chosen buffer, while preserving the SOL reserve described above.
4. Review the exchange rate, fees, price impact, and slippage tolerance-the permitted movement in price before the swap would fail. Then approve the swap in Phantom. The earlier CoinGecko conversion is a reference value; the swap's actual quote determines what you receive.
5. Wait for confirmation and inspect the transaction through its explorer link. Retain the transaction signature or link with the experiment's other records, and check the resulting ARIO and SOL balances in the wallet.

> **Make ARIO visible in Phantom.**
> After my swap, Jupiter showed 2,505.974996 ARIO, but ARIO was absent from Phantom's main token list.
> The balance was already present on Solana; I had to enable the token's visibility using [Phantom's Manage Tokens settings](<https://help.phantom.com/articles/42969287602963>):
>
> 1. In Phantom's browser extension, open the home view and click the **three dots** to the right of the **Tokens / Perps / Collectibles** row.
> 2. Choose **Manage Tokens**.
> 3. Find **Ar.io Network / ARIO** and turn its toggle on.
>
> Phantom then displayed **2,505.975 ARIO**, rounding the same balance shown by Jupiter.
> This only changes the wallet's display; it does not transfer tokens or require another purchase.

We can independently inspect the ARIO balance through the same read-only CLI used for pricing:

```bash
(
  set -e -o pipefail
  "$ario_cli" balance \
    --rpc-url "$solana_rpc_url" \
    --address "$arns_owner_address" \
    | tee "$native_arns_state_dir/ario-balance.json"
)
```

The response contains `mARIOBalance` and a message expressing the balance in ARIO.
This is the ARIO balance recorded on Solana, separate from the account's Turbo credits.
Run the chosen `get-cost-details` command from the preceding subsection again: `fundingPlan.shortfall: 0` means that the ARIO balance covers that quote.
Check the remaining SOL separately against `gasEstimate.totalLamports`; an ARIO shortfall of zero does not establish that the SOL balance is sufficient.

The swap acquires the payment token; the name is not registered until we submit the registration transaction in the following steps.

#### Detour: Converting Between Tokens, Chains, and Payment Systems

Buying ARIO through Jupiter took this experiment into a topic I have wanted to understand for some time.
Throughout this article, different operations have required different forms of payment: AR for native Arweave storage, ARIO for an ArNS name, SOL for Solana transactions, and Turbo credits for the service that connects several of these operations.
Conversion keeps appearing, even though publishing a website was the original goal.

Compared with buying through a centralised exchange and then withdrawing, the Jupiter experience felt remarkably direct: connect a wallet, inspect the quote, and sign.
That prompted a broader question: why can some conversions work this way, while others require sending funds to an intermediary and waiting for a separate payout?
And what changes when the denomination remains Bitcoin, but the balance lives in [Lightning](<https://lightning.network/>), [Ark](<https://docs.arkadeos.com/primer>), or [Cashu](<https://cashu.space/>)?

This detour is a first map of those mechanisms and their different trust assumptions, with references for a possible later article.

##### Jupiter and Raydium: An Atomic Swap on One Chain

[Raydium](<https://raydium.io/>) is a decentralised exchange protocol on Solana.
Its [automated market makers](<https://docs.raydium.io/protocol-overview>) use liquidity pools: other participants supply tokens, and program rules determine how a trade changes the pool balances and the price.
We can trade against a pool without finding someone who wants precisely the opposite trade at that moment.

[Jupiter](<https://jup.ag/>) helps find and execute a route through available liquidity.
Its [swap infrastructure](<https://developers.jup.ag/docs/swap>) compares routes and quotes, including offers from market makers, and prepares a transaction for the wallet to sign.
Raydium can supply pools along such a route; its [aggregator documentation](<https://docs.raydium.io/integration-guides/aggregator>) explains how those pools participate.
Jupiter is therefore more than another frontend for one Raydium pool.

The attractive property is **atomic execution**: when the swap's instructions run in one Solana transaction, either all of them succeed or their state changes are rolled back.
The swap cannot complete just the part that takes my SOL while failing to deliver the required ARIO.
A failed transaction can still cost a network fee, as the [Solana transaction documentation](<https://solana.com/docs/core/transactions>) explains.
Atomicity also does not guarantee a good price or make an incorrectly authorised transaction harmless.

Both assets in this example live on Solana.
SOL is its native currency; ARIO is a Solana token.
These are not Ethereum ERC-20 tokens, but Solana uses [SPL tokens](<https://solana.com/docs/tokens>).
Swaps are not limited to SOL against another token, but two supported Solana tokens can also be exchanged against one another.

Nym provides another example, connecting this topic to my [earlier node-operator guide](../digital-civil-rights-networking-nym-node-operator-guide) and its [2026 update](../digital-civil-rights-networking-nym-node-operator-guide-2026).
The [official NYM token overview](<https://nym.com/token>) lists both [Uniswap](<https://app.uniswap.org/>) for Ethereum ERC-20 NYM and [Osmosis](<https://app.osmosis.zone/?from=OSMO&to=NYM>) for NYM transferred through the Inter-Blockchain Communication protocol, or IBC.
A Uniswap trade gives us NYM on Ethereum; an Osmosis trade gives us a balance on Osmosis.
For bonding or delegation, we need [native NYM on the Nyx blockchain](<https://nym.com/explorer/onboarding/staking-guide>), so either result still needs a suitable transfer or conversion to Nyx.
The ticker alone does not identify the network or the wallet that can receive it.

##### Similar Swap Interfaces Can Hide Different Trust Models

We just dealt with atomic swaps on a single chain. But what happens if more than one chain is involved?
An ordinary Solana swap cannot deliver native AR to my Wander address, because the AR token lives on its own chain, e.g. that balance belongs to a different blockchain.
An interface offering that conversion must add some mechanism for crossing the boundary.

For example, [SimpleSwap advertises a SOL-to-AR route](<https://simpleswap.io/crypto-to-crypto/sol-ar>), while [SwapSpace lists AR exchange offers](<https://swapspace.co/exchange/ar>) from providers.
In a deposit-and-payout flow, I send the input asset to a provider's address and rely on that provider to deliver the output to my destination address.
An account registration might be unnecessary, but there is still a period during which the provider controls my funds.
The word *swap*, or even *aggregator*, does not establish that settlement is atomic.

Nym also maintains its own [NYM swap service](<https://swap.nym.com/>).
Currently, its [public asset list](<https://nym-swap-api.nymtech.cc/api/v1/swap/chains>) included BTC, ETH, Ethereum USDT and USDC, and ERC-20 NYM as inputs for acquiring native NYM.

The service advertises itself as non-custodial and decentralised, but those labels alone do not establish atomic settlement.

> The [client code served during this review](<https://swap.nym.com/_next/static/chunks/0ldwhv4jo910n.js>) describes an order progressing through deposit detection and confirmation to a separate NYM payout, with refund states if something goes wrong.
> I did not establish an on-chain refund mechanism that the user could execute independently of the service.
> I would therefore assess this as a service-mediated conversion, rather than assume it has the HTLC guarantees discussed below.

[Edge Wallet also integrates NYM swaps using Nym-provided liquidity](<https://edge.app/blog/company-news/introducing-nym-token-support-how-to-store-and-use-nym/>); a different wallet interface does not by itself change the underlying settlement mechanism.

An alternative is the community-run [SpectreDAO swap interface](<https://explorer.nym.spectredao.net/swap>), also linked from Nym's token overview.
It uses Skip to combine DEX trades and transfers across chains, with native NYM on Nyx as the destination.
This can automate a route through Osmosis and IBC without making the entire journey one atomic transaction.

> Skip's [cross-chain failure documentation](<https://docs.skip.build/go/advanced-transfer/handling-cross-chain-failure-cases>) explains that a successful swap followed by a failed transfer can leave the purchased asset on an intermediate chain, where it must be recovered or forwarded.
> The route's bridges, destination network, fees, and recovery behaviour therefore remain relevant even when one interface handles the steps.

Another approach is to trade inside a system that represents deposits from other chains.
[Permaswap](<https://app.permaswap.network/explore>) uses assets held through [everPay](<https://docs.everpay.io/en/docs/guide/basic-info>).
The native assets backing those balances are held under everPay's custody arrangements, and returning to native AR involves its [withdrawal mechanism](<https://docs.everpay.io/en/docs/guide/dive/withdraw>).
A threshold of key holders authorises movements of the backing AR; this is a different guarantee from settling both sides inside one Solana transaction.
A convenient internal swap does not remove the deposit and redemption assumptions.

The useful question is therefore: **what ensures that I receive the other side of the exchange: one chain's transaction rules, a cross-chain protocol, or a provider's promise?**

##### Atomic Swaps Can Also Cross Chains

Two independent chains cannot simply execute one shared transaction.
Nevertheless, some pairs support protocols that link their separate transactions without handing both assets to an exchange.

A classic mechanism is a **hash time-locked contract**, or HTLC, described in this [atomic-swap walkthrough](<https://bcoin.io/guides/swaps.html>).
In simplified form:

1. Alice chooses a secret and shares its hash, then locks her asset so that Bob can claim it by revealing the secret. Alice has a refund path after a deadline.
2. Bob locks his asset using the same hash, with a suitably shorter refund deadline.
3. Alice claims Bob's asset by revealing the secret. Bob learns it from that claim and uses it to claim Alice's asset.
4. If the exchange does not proceed, the timeout paths allow recovery of the locked funds.

This requires compatible conditions on both chains, sufficient confirmation time, and participants or their software monitoring and submitting the necessary transactions.
A refund is a transaction to perform, not an instantaneous rollback of both chains.
The arrangement avoids trusting the counterparty with an unconditional deposit, but it still consumes time and network fees.

[Zano's atomic-swap explanation](<https://blog.zano.org/atomic-swaps-part-2/>) and its [Zano/BTC example implementation](<https://github.com/hyle-team/atomic_swap_example>) demonstrate such a construction.
The published example is explicitly a proof of concept using test networks, not a ready-made production exchange.
Zano's [Ionic swaps and Zano Trade](<https://docs.zano.org/docs/use/zano-trade>) address another case: trading ZANO and confidential assets within Zano itself.
That should not be confused with a native BTC/ZANO market.

There are deployed platforms built around cross-chain atomic settlement:

* [Bison Wallet / DCRDEX](<https://dex.decred.org/>) uses an [atomic-swap protocol](<https://github.com/decred/dcrdex/blob/master/spec/atomic.mediawiki>) for supported assets, with order matching separated from custody. 
  * It supports BTC and ZEC, among other assets. Its documented Zcash swaps use transparent addresses.
* The [Komodo wallet technology now offered by Gleec](<https://gleec.com/komodo/wallet/>) uses HTLC-based swaps across supported chains.
* [BasicSwap](<https://basicswapdex.com/faq.html>) supports both secret-hash swaps and constructions using **adaptor signatures**.
  * These link completion of signatures to disclosure of a secret; the [COMIT Bitcoin/Monero explanation](<https://comit.network/blog/2020/10/06/monero-bitcoin/>) shows why this is useful when a chain lacks Bitcoin-style scripting.
  * BasicSwap offers BTC/XMR atomic swaps.

Each implementation supports particular chains and protocols; a working construction for one pair does not make every other pair possible.

> **Privacy also depends on the swap path.**
> Supporting Zcash does not necessarily mean spending directly from its shielded pool: the [audit of DCRDEX's Zcash integration](<https://leastauthority.com/zcg-dcrdex-zcash-integration-final-audit-report/>) describes swaps using transparent transactions.
> Work such as [Zwap's proposed shielded swaps](<https://forum.zcashcommunity.com/t/zwap-trustless-shielded-atomic-swaps-for-zcash-early-access/55874>) is a separate topic to investigate.
>
> Nym also provides a dedicated [ZEC-to-NYM swapper](<https://zcash-swapper.nym.com/swap>).
> Its [announcement and usage guide](<https://nym.com/blog/zec-nym-swapper>) describes paying with shielded Zcash and choosing either native NYM on Nyx or ERC-20 NYM on Ethereum as the destination asset.
> Nym's mixnet protects network traffic; [NYM itself is not a privacy coin](<https://nym.com/token>).

##### Wrapped Assets Move the Question to Issuance and Redemption

Another way to trade assets together is to represent them on the same chain.
A typical cross-chain wrapper works as follows:

1. Native coins are deposited into custody or locked under a bridge's rules.
2. Corresponding tokens are minted on the destination chain.
3. Those tokens can participate in that chain's applications and swaps.
4. Redemption burns or otherwise retires the representation and releases the native coins under the wrapper's rules.

[Wrapped Bitcoin, or WBTC](<https://wbtc.network/>), is a concrete example.
Its [whitepaper](<https://www.wbtc.network/whitepaper>) describes custodians holding BTC and merchants participating in minting and redemption.
WBTC is a token backed by Bitcoin; holding it does not give its holder a Bitcoin private key controlling the backing coins.
Access to redemption also depends on the system's procedures, rather than every wallet having a universal *unwrap* button.

Once two tokens are on one chain, exchanging them can be atomic while the backing of one token still depends on custodians or a bridge.
These are separate guarantees.
Other [bridge designs](<https://ethereum.org/en/developers/docs/bridges/>) use validator groups, threshold signatures, or proofs of events on another chain, with different assumptions about what the destination can verify.

NYM illustrates this distinction beyond Bitcoin wrappers.
Nym's [2024 Gravity Bridge walkthrough](<https://nym.com/blog/nym-for-nym-swapper-app-bridges-native-and-erc20-token>) describes moving between Ethereum ERC-20 NYM and native Nyx NYM, including locking tokens on Ethereum as part of the conversion.

For the Cosmos routes, [IBC token transfers](<https://github.com/lfdt-ibc/ibc/blob/main/spec/app/ics-020-fungible-token-transfer/README.md>) use escrow and corresponding token vouchers, with burning and release when retracing the transfer path.
A token's transfer history identifies the backing route; two assets with the same displayed ticker need not have the same origin or redemption path.
This is why buying NYM on Osmosis and receiving native NYM in a Nyx wallet are distinct steps, even when a router automates both.

Wrapping consequently does more than move the original swap problem elsewhere: it creates an **ongoing backing and redemption obligation** for as long as the representation circulates.
A smooth trading interface does not tell us who can release the backing assets, prevent withdrawals, or issue additional claims.

##### Lightning and Ark: Bitcoin Through Different Payment Mechanisms

Conversion need not change the currency.
Moving between on-chain Bitcoin and a Bitcoin payment system can still change the wallet, the transaction format, the liquidity requirements, and the way funds return to the base chain.

The [Lightning Network](<https://lightning.network/>) uses [payment channels](<https://docs.lightning.engineering/the-lightning-network/payment-channels>): Bitcoin is committed on-chain, while participants exchange signed updates to their balances without publishing every payment on Bitcoin.
Payments can traverse several channels using conditional transfers.
There is no separate native Lightning coin; the balances are denominated in bitcoin, commonly displayed in satoshis.

With a self-custodial Lightning wallet, channel state and recovery mechanisms matter alongside private keys.
Opening and closing channels involve Bitcoin transactions, and routing requires liquidity.
A custodial Lightning wallet instead records a balance with its operator, who handles the channels and payments.
Both can present a similar invoice interface while offering different control over funds.

[Ark](<https://docs.arkadeos.com/primer>) offers another approach to Bitcoin payments.
Instead of maintaining an individual payment channel for every user, an Ark operator coordinates transactions involving **virtual transaction outputs**, or VTXOs.
These represent Bitcoin spending rights supported by a structure of signed transactions that can ultimately be settled on Bitcoin.

Ark's operator assists with fast transfers, but the details matter: [Arkade's security model](<https://docs.arkadeos.com/learn/concepts/security-and-trust-model>) distinguishes settled outputs from transfers whose safety still depends on operator behaviour.
VTXOs also have lifetimes and must be refreshed in time.
Unilateral exit mechanisms can require waiting and paying Bitcoin fees; they are not equivalent to a cost-free withdrawal of any tiny balance.

I encountered this topic through [Coinos](<https://coinos.io/>), which I had used as a custodial wallet for Nostr zaps.
Coinos also offers an [Ark-based self-custodial wallet with Lightning support](<https://f-droid.org/en/packages/io.coinos.fdroid/>).

##### Cashu: Private Tokens Issued by a Mint

[Cashu](<https://cashu.space/>) takes another route: a **mint** issues cryptographic ecash tokens against a balance deposited with it, commonly funded through Lightning.
[Blind signatures](<https://github.com/cashubtc/nuts/blob/main/00.md>) let the mint validate its tokens without directly linking their later redemption to their original issuance.
The tokens can be transferred as data, and the recipient can exchange them at the mint for fresh tokens so that the old proofs cannot be spent again.

> **David Chaum and the origins of ecash.**
> Cashu belongs to the tradition of *Chaumian ecash*, named after [David Chaum](<https://chaum.com/publications/>), who developed the foundations of private electronic cash decades before Bitcoin.
> Three foundational papers provide useful starting points:
>
> 1. [*Blind Signatures for Untraceable Payments*](<https://chaum.com/wp-content/uploads/2022/01/Chaum-blind-signatures.pdf>) - David Chaum, CRYPTO '82; proceedings published in 1983. Introduces blind signatures: an issuer can sign a concealed message without being able to link the resulting unblinded signature to that signing interaction. This is the central idea behind issuing ecash without linking withdrawal to later spending.
> 2. [*Security Without Identification: Transaction Systems to Make Big Brother Obsolete*](<https://www.cs.umd.edu/~mmazurek/414-papers/chaum-identification.pdf>) - David Chaum, 1985. Explains the broader vision: payments, communications, and credentials can provide security without building a linked dossier of each person's activities.
> 3. [*Untraceable Electronic Cash*](<https://chaum.com/wp-content/uploads/2021/12/Untraceable_Electronic_Cash.pdf>) - David Chaum, Amos Fiat, and Moni Naor, CRYPTO '88; proceedings published in 1990. Develops an offline-payment design that preserves the privacy of honest users while allowing repeated spending of the same coin to expose the double-spender.
>
> Cashu carries forward the blind-issuance principle, but it is not a literal implementation of all these historical designs.
> Its ordinary [token-swap operation](<https://github.com/cashubtc/nuts/blob/main/03.md>) contacts the mint to invalidate spent proofs and issue fresh ones; it does not use the third paper's offline identity-revelation mechanism.

This resembles a wrapped asset in one important respect: the holder has a claim on backing controlled elsewhere.
But ordinary Cashu tokens are not entries in a public blockchain contract.
The mint checks spent proofs, and users rely on it remaining solvent and willing to redeem.
Blindness improves privacy; it does not prove that the backing funds exist.

Cashu calls issuing tokens *minting* and redeeming them *melting*.
For example, [NUT-05](<https://github.com/cashubtc/nuts/blob/main/05.md>) describes melting tokens to pay through another payment method.
This can turn a Cashu balance back into a Lightning payment without requiring every recipient to manage a Lightning channel.
The [Cashu FAQ](<https://docs.cashu.space/faq>) explains the custody and privacy trade-offs.

##### Can Audits, Federations, or a DAO Remove the Custodian?

A public reserve address can make some backing observable, and commitments or audits can help compare reserves with issued claims.
However, **proof of reserves is not automatically proof of liabilities**: observing ten BTC does not tell us whether a mint has issued claims for ten or twenty BTC, or whether the funds are encumbered elsewhere.
Cashu's proposed [proof-of-liabilities scheme](<https://gist.github.com/callebtc/ed5228d1d8cbaade0104db5d1cf63939>) is useful further reading on this distinction.
Visibility can help detect misconduct without ensuring that a withdrawal will be honoured.

A DAO or smart contract could administer policies and publish commitments.
If the backing remains in a Bitcoin wallet controlled by an operator, governance on another chain cannot by itself force that operator to sign a Bitcoin withdrawal.
A concrete signing or verification mechanism must connect the two.
[Fedimint](<https://fedimint.org/users/how-it-works>) distributes custody among a federation of guardians, reducing reliance on one operator while retaining trust in a threshold of guardians.

Publishing every ecash transfer on a chain would also change its cost and privacy properties.
Periodic commitments and audits can retain more of the benefit of off-chain payments, but they provide different guarantees from enforcing every movement through a contract.
A cheaper chain reduces transaction costs; it does not automatically solve reserve ownership or redemption.

##### RAILGUN: Private Transfers Enforced by Smart Contracts

[RAILGUN](<https://railgun.org/>) provides a different model for assets that already live on a supported smart-contract chain.
It is a privacy protocol deployed on [Ethereum, Arbitrum, Polygon, and BNB Chain](<https://docs.railgun.org/wiki/learn/getting-started>), not an independent blockchain or a bridge between those networks.

When assets are *shielded*, they enter contracts and are represented by private notes.
Users authorise transfers with zero-knowledge proofs; the contracts check validity and prevent reuse of spent notes without publicly revealing the private transfer's sender, recipient, token, and amount.
The [private-token documentation](<https://docs.railgun.org/wiki/learn/using-private-tokens>) explains this model.
*Unshielding* withdraws assets to a public address on that same chain.
Deposits, withdrawals, and interactions with external applications can still reveal information.

[Railway Wallet](<https://www.railway.xyz/>) is a self-custodial wallet that uses RAILGUN.
Its role is to manage the keys and construct transactions.
[Broadcasters](<https://docs.railgun.org/developer-guide/wallet/broadcasters>) can submit transactions and receive payment for gas and their service, allowing users to avoid directly funding an identifiable public gas-paying address for each private transfer.
The chain's execution costs still exist.

Native BTC cannot be deposited directly into an Ethereum RAILGUN contract.
A supported wrapped representation of BTC can be shielded, but unshielding returns that wrapped token, not native Bitcoin.
Redeeming it on Bitcoin remains a separate operation with the wrapper's own trust assumptions.
Similarly, a [private-wallet DEX swap](<https://docs.railgun.org/wiki/learn/integrating-railgun/example-dex-swaps>) can aim to hide the wallet's connection to a trade while the external DEX's trade amounts remain public.

##### Zaps, Nutzaps, and a Possible Different Backend

These mechanisms meet a concrete publishing use case in Nostr tips.
[NIP-57 zaps](<https://github.com/nostr-protocol/nips/blob/master/57.md>) combine a Lightning payment with Nostr events: a zap request asks for an invoice, and a zap receipt reports its payment.
The payment endpoint can belong to a custodial service or a self-custodial setup.
The Nostr event does not determine how the underlying wallet manages its Bitcoin.

> This "reversal" originally confused me: I want to tip a creator, yet my client first asks the creator's payment service to issue something.
> The distinction is that **an invoice comes before payment; a receipt comes afterwards**.
>
> In the usual [BOLT-11 Lightning payment flow](<https://github.com/lightning/bolts/blob/master/11-payment-encoding.md>), the recipient's node creates a secret, includes its hash in the invoice, and reveals the secret to settle the conditional payment.
> This protects payments that pass through intermediate routing nodes: their incoming and outgoing payments are linked by [hash time-locked contracts (HTLCs)](<https://docs.lightning.engineering/the-lightning-network/multihop-payments/hash-time-lock-contract-htlc>) using the same hash.
> Each intermediary needs the matching secret to claim its incoming payment; that same secret also lets the next node claim the intermediary's outgoing payment.
> The recipient reveals it to collect the payment, and it travels back along the route to settle these linked payments.
> An intermediary therefore earns its routing fee without being able simply to pocket the forwarded amount.
> Timeouts allow locked funds to be reclaimed if the payment does not complete.
>
> Once revealed, the secret is known along the route, so the payment hash must not be reused for another invoice.
> [LNURL-pay](<https://github.com/lnurl/luds/blob/luds/06.md>) and a [Lightning Address](<https://github.com/lnurl/luds/blob/luds/16.md>) such as `bob@example.org` provide a reusable way to request fresh invoices.
> Behind that address must be **a running, reachable service**: an online process that receives the requested amount, obtains a fresh invoice from the recipient's Lightning node, and returns it to the payer.
> A static address alone cannot do this work; it identifies the service that does.
>
> [NIP-57](<https://github.com/nostr-protocol/nips/blob/master/57.md#protocol-flow>) adds the connection to Nostr: the payer signs a zap request (`9734`) and sends it to that service, normally without publishing it to relays.
> The invoice's description hash binds it to this request, which can identify the post being rewarded.
> After payment, the service signs and publishes a zap receipt (`9735`), allowing Nostr clients to display the tip alongside the post.
>
> The same service also observes settlement so that it can publish receipts.
> It can be operated by a custodial provider or by the creator alongside their own Lightning node; a third-party company is not required.
> Clients check the receipt against the signing key advertised by the recipient's service, but **the receipt is that service's payment attestation**, not independent proof of settlement.
> NIP-57 explicitly acknowledges that a dishonest service could issue a false receipt.
>
> For alternatives, [Keysend](<https://docs.lightning.engineering/lightning-network-tools/lnd/send-messages-with-keysend>) supports payments without first requesting an invoice, while [BOLT-12 offers](<https://github.com/lightning/bolts/blob/master/12-offer-encoding.md>) provide reusable offers and invoice requests over Lightning onion messages instead of LNURL's HTTP interface.
> Neither mechanism automatically supplies NIP-57's public Nostr receipt.

[NIP-61 Nutzaps](<https://github.com/nostr-protocol/nips/blob/master/61.md>) use Cashu instead.
The recipient advertises accepted mints and a public key for receiving locked ecash proofs.
The sender publishes a Nutzap containing proofs that only the intended recipient can redeem.
This allows delivery through Nostr without requiring that recipient to issue a Lightning invoice for each tip, but redemption still depends on the mint.
Cashu's privacy also does not make the public Nutzap event private: its recipient and token amounts are visible.

Could RAILGUN provide a backend for something similar with less reliance on a mint?
In principle, a tipping application could send assets between users' private RAILGUN balances, with spending rules enforced by the contracts rather than a Cashu operator's private accounting.
That would be a different system: it would need recipient addressing, chain and token selection, proof generation, fee handling, and a carefully designed notification or receipt mechanism.
It would not be compatible with NIP-61 merely by changing an endpoint, and it would not inherit Cashu's inexpensive off-chain token transfers.
If it used wrapped BTC, the wrapper's custody risk would remain.

This is a possible direction for a later experiment, not an integration demonstrated here.

##### What Do We Receive After Conversion?

The distinctions become clearer if we compare what the resulting balance represents:

<table class="article-table">
  <thead>
    <tr><th>Mechanism</th><th>What we receive</th><th>How we leave that representation</th></tr>
  </thead>
  <tbody>
    <tr><td>SOL → ARIO through Jupiter</td><td>Another token on the same chain</td><td>Spend ARIO directly or exchange it again</td></tr>
    <tr><td>NYM acquired on Uniswap or Osmosis</td><td>NYM on Ethereum or an IBC representation on Osmosis</td><td>Use a suitable bridge or conversion route to obtain native NYM on Nyx for bonding or delegation</td></tr>
    <tr><td>BTC → WBTC</td><td>A token backed by BTC held elsewhere</td><td>Use the wrapper's redemption process or sell the token</td></tr>
    <tr><td>Self-custodial Lightning</td><td>A Bitcoin channel balance</td><td>Settle the channel on Bitcoin or use a service that exchanges a Lightning payment for on-chain BTC</td></tr>
    <tr><td>Ark</td><td>A VTXO with defined Bitcoin spending and exit paths</td><td>Use an assisted withdrawal or the protocol's unilateral exit mechanism</td></tr>
    <tr><td>Cashu</td><td>Ecash proofs issued by a particular mint</td><td>Ask that mint to redeem them, for example by paying a Lightning invoice</td></tr>
    <tr><td>RAILGUN</td><td>Private notes backed by assets in contracts on that chain</td><td>Unshield to a public address; a wrapped asset remains wrapped</td></tr>
  </tbody>
</table>

What interests me across these examples is the possibility of moving between systems without repeatedly returning to a centralised exchange.
The resulting experience can be much smoother, but a balance labelled *BTC* or a button labelled *Swap* does not describe the whole arrangement.
We still need to know what asset we receive, who can spend its backing, how settlement is enforced, and what returning to the native asset requires.

For the ArNS experiment, the immediate conversion is now complete: the existing wallet holds ARIO on Solana, ready to pay for the name registration.

#### Prepare and Inspect the Registration

With ARIO now in the wallet, we can prepare the registration of `weisser-zwerg-native`.
For this experiment I will use a **one-year lease**, which the ARIO acquired above covers.
Its initial target will be the manual path's version 2 manifest, [`nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ`](<https://arweave.net/nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ/>).
We will move it to version 3 in a later, separate operation.

The SDK's high-level [`buyRecord` method](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/io-writeable.ts>) combines preparation, signing, submission, and follow-up work.
To see the machinery and review it before signing, we will instead use its [`buildSpawnAntInstructions` helper](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/spawn-ant.ts>) and the underlying `getBuyNameInstructionAsync` builder from `@ar.io/solana-contracts`.
Together they prepare three operations:

<table class="article-table">
  <thead>
    <tr><th>Instruction</th><th>What it prepares</th><th>Payment</th></tr>
  </thead>
  <tbody>
    <tr><td>Create the ANT asset</td><td>A Metaplex Core asset owned by the existing Phantom/MetaMask Solana address</td><td>SOL for the new account's rent deposit</td></tr>
    <tr><td>Initialize the ANT</td><td>Its configuration, controller list, and root <code>@</code> record pointing at the version 2 manifest</td><td>SOL for the ANT's data accounts</td></tr>
    <tr><td>Buy the name</td><td>An ArNS registry entry associating the chosen name with this ANT</td><td>ARIO from the owner's token account to the protocol treasury, plus SOL for the registration account</td></tr>
  </tbody>
</table>

We can place all three in **one atomic Solana transaction**: if an instruction fails, their state changes are rolled back together, although a submitted transaction can still incur a network fee.
The owner also pays that fee in SOL.

> **The ANT's creation key is temporary; its public address remains its identifier.**
> [Creating its Metaplex asset account](<https://www.metaplex.com/docs/smart-contracts/core/create-asset>) requires a signature from a newly generated key pair as well as the owner's signature.
> The helper below retains that creation key locally in `private/ant-creation.seed`, with file mode `600`, so the next step can use the same ANT address.
> Keep it until the registration transaction has reached `finalized` status and we have independently verified the ANT's ownership and initial record.
> Before then, it may be needed to sign a replacement creation transaction if the first attempt fails or expires.
> While retained, keep it outside any directory served by a web server or committed to Git.
>
> **After successful creation and verification, this private seed can be deleted; no long-term backup is required.**
> It is not needed for later record updates, lease renewals, or ANT transfers.
> Control follows the recorded owner and the ANT's permissions; for example, [transferring an asset requires its owner's or an authorised transfer delegate's signature](<https://www.metaplex.com/docs/smart-contracts/core/transfer>), not its creation key.
> Deleting the creation key leaves the ANT, its public address, and its ownership intact. The owner's wallet key is the one that needs long-term protection.
>
> The other new account addresses are [program-derived addresses (PDAs)](<https://solana.com/docs/core/pda>).
> They are calculated from inputs such as the name or ANT address and have no private keys for us to retain.

Continue with the variables established above, restoring the walkthrough variables first if necessary.
Make the registration choice explicit and add the dependencies that our helper imports directly, using the versions tested alongside SDK 4.5.2:

```bash
# XXX_TODO_XXX: Choose lease or permabuy; the latter requires more ARIO.
native_arns_type="lease"
# XXX_TODO_XXX: Lease duration; ignored by the program for permabuy.
native_arns_years=1
native_arns_initial_manifest_id="${manual_v2_manifest_id:?Restore the version 2 manifest ID first}"
native_arns_plan_file="$native_arns_state_dir/registration.plan.json"

(
  set -e
  cd -- "$native_arns_tools_dir"
  npm install --save-exact --ignore-scripts \
    @ar.io/solana-contracts@1.4.0 @solana/kit@6.10.0 \
    @solana-program/token@0.13.0 @solana-program/compute-budget@0.15.0
)
```

Create the preparation helper:

```bash
cat > "$native_arns_tools_dir/prepare-registration.mjs" <<'EOF'
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import {
  AccountRole, address, appendTransactionMessageInstructions,
  compileTransaction, createKeyPairSignerFromPrivateKeyBytes,
  createNoopSigner, createSolanaRpc, createTransactionMessage,
  fetchEncodedAccounts, getBase64EncodedWireTransaction, pipe,
  setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash,
} from '@solana/kit';
import {
  ARIO_ANT_PROGRAM_ID, ARIO_ARNS_PROGRAM_ID, ARIO_TOKEN_MINT_ADDRESS,
  SolanaARIOReadable, buildSpawnAntInstructions, getArnsSettingsPDA,
  getArnsRegistryPDA, getDemandFactorPDA, getArnsRecordPDA,
  getReservedNamePDA, getReturnedNamePDA,
} from '@ar.io/sdk';
import {
  PurchaseType, fetchArnsConfig, getBuyNameInstructionAsync,
  parseBuyNameInstruction,
} from '@ar.io/solana-contracts/arns';
import { parseInitializeInstruction } from '@ar.io/solana-contracts/ant';
import { parseCreateV1Instruction } from '@ar.io/solana-contracts/mpl-core';
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from '@solana-program/token';
import {
  getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

const [stateDir, name, ownerText, type, yearsText, target] = process.argv.slice(2);
const years = Number(yearsText);
if (!stateDir || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name ?? '') ||
    name.length > 51 || !['lease', 'permabuy'].includes(type) ||
    !Number.isInteger(years) || years < 1 || years > 5 ||
    !/^[A-Za-z0-9_-]{43}$/.test(target ?? '')) {
  throw new Error('Expected: state-directory name owner lease|permabuy years manifest-id');
}
const owner = address(ownerText);
const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com');
const ario = new SolanaARIOReadable({ rpc });
const json = value => JSON.stringify(value,
  (_key, item) => typeof item === 'bigint' ? item.toString() : item, 2) + '\n';
const save = (file, value) => writeFile(join(stateDir, file), json(value));

const [config] = await getArnsSettingsPDA(ARIO_ARNS_PROGRAM_ID);
const [demandFactor] = await getDemandFactorPDA(ARIO_ARNS_PROGRAM_ID);
const [nameRegistry] = await getArnsRegistryPDA(ARIO_ARNS_PROGRAM_ID);
const [arnsRecord] = await getArnsRecordPDA(name, ARIO_ARNS_PROGRAM_ID);
const [reservedNameCheck] = await getReservedNamePDA(name, ARIO_ARNS_PROGRAM_ID);
const [returnedNameCheck] = await getReturnedNamePDA(name, ARIO_ARNS_PROGRAM_ID);
const entries = await fetchEncodedAccounts(rpc,
  [arnsRecord, reservedNameCheck, returnedNameCheck]);
if (entries.some(entry => entry.exists)) {
  throw new Error('This example requires a name with no registered, reserved, or returned entry.');
}
const { data: settings } = await fetchArnsConfig(rpc, config);
if (settings.mint !== ARIO_TOKEN_MINT_ADDRESS) throw new Error('Unexpected ARIO mint');
const quote = await ario.getCostDetails({
  intent: 'Buy-Name', name, type, years, fromAddress: owner, fundFrom: 'balance',
});
const { value: solBalance } = await rpc.getBalance(owner).send();
if (quote.fundingPlan.shortfall > 0) throw new Error(quote.message);
if (solBalance < BigInt(quote.gasEstimate.totalLamports)) {
  throw new Error('SOL balance is below the SDK estimate.');
}

// A new account address needs a creation signature, separate from its owner's signature.
const privateDir = join(stateDir, 'private');
await mkdir(privateDir, { recursive: true, mode: 0o700 });
const seedFile = join(privateDir, 'ant-creation.seed');
let seed;
try { seed = await readFile(seedFile); }
catch (error) {
  if (error.code !== 'ENOENT') throw error;
  seed = randomBytes(32);
  await writeFile(seedFile, seed, { flag: 'wx', mode: 0o600 });
}
const mintSigner = await createKeyPairSignerFromPrivateKeyBytes(seed);
const ownerPlaceholder = createNoopSigner(owner); // Public address only; cannot sign.
const spawn = await buildSpawnAntInstructions({
  signer: ownerPlaceholder, mintSigner, antProgramId: ARIO_ANT_PROGRAM_ID,
  state: { name, transactionId: target, targetProtocol: 0 },
});
const [buyerTokenAccount] = await findAssociatedTokenPda({
  owner, mint: settings.mint, tokenProgram: TOKEN_PROGRAM_ADDRESS,
});
const buy = await getBuyNameInstructionAsync({
  config, demandFactor, nameRegistry, arnsRecord,
  reservedNameCheck, returnedNameCheck, buyerTokenAccount,
  protocolTokenAccount: settings.treasury, buyer: ownerPlaceholder,
  params: {
    name, purchaseType: type === 'lease' ? PurchaseType.Lease : PurchaseType.Permabuy,
    years, ant: spawn.mint,
  },
}, { programAddress: ARIO_ARNS_PROGRAM_ID });

const computeUnitLimit = 800_000; // SDK 4.5.2's combined spawn-and-buy limit.
const priorityFeeMicroLamports = BigInt(quote.gasEstimate.priorityFeeMicroLamports);
const instructions = [
  getSetComputeUnitLimitInstruction({ units: computeUnitLimit }),
  getSetComputeUnitPriceInstruction({ microLamports: priorityFeeMicroLamports }),
  ...spawn.instructions, buy,
];
const { value: lifetime } = await rpc.getLatestBlockhash().send();
const message = pipe(
  createTransactionMessage({ version: 0 }),
  m => setTransactionMessageFeePayer(owner, m),
  m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m),
  m => appendTransactionMessageInstructions(instructions, m),
);
const unsigned = compileTransaction(message);
const wire = getBase64EncodedWireTransaction(unsigned);
const wireBytes = Buffer.from(wire, 'base64').length;
if (wireBytes > 1232) throw new Error(`Transaction too large: ${wireBytes} bytes`);
const simulation = await rpc.simulateTransaction(wire, {
  encoding: 'base64', sigVerify: false, replaceRecentBlockhash: true,
}).send();
await save('registration.simulation.json', simulation);
if (simulation.value.err) {
  throw new Error('Simulation failed; inspect registration.simulation.json before proceeding.');
}

const accountView = account => account
  ? { address: account.address, role: AccountRole[account.role] } : null;
const instructionView = instruction => ({
  programAddress: instruction.programAddress,
  accounts: instruction.accounts?.map(accountView) ?? [],
  dataBase64: Buffer.from(instruction.data).toString('base64'),
});
const decoded = [
  ['Create ANT asset', parseCreateV1Instruction(spawn.instructions[0])],
  ['Initialize ANT and root record', parseInitializeInstruction(spawn.instructions[1])],
  ['Buy name from liquid ARIO', parseBuyNameInstruction(buy)],
].map(([operation, parsed]) => ({
  operation, programAddress: parsed.programAddress, data: parsed.data,
  accounts: Object.fromEntries(Object.entries(parsed.accounts)
    .map(([label, account]) => [label, accountView(account)])),
}));
const plan = {
  preparedAt: new Date().toISOString(), sdkVersion: '4.5.2',
  name, type, years, owner, feePayer: owner, ant: spawn.mint,
  rootRecord: { undername: '@', transactionId: target, targetProtocol: 0 },
  arioMint: settings.mint, buyerTokenAccount, treasury: settings.treasury,
  quote, solBalanceLamports: solBalance,
  computeUnitLimit, priorityFeeMicroLamports,
  transactionBytes: wireBytes, requiredSigners: Object.keys(unsigned.signatures),
  instructions: instructions.map(instructionView), decoded,
};
await save('registration.plan.json', plan);
console.log(json({
  name, type, years, owner, ant: spawn.mint, manifest: target,
  priceARIO: quote.tokenCost / 1_000_000,
  estimatedTotalSOL: quote.gasEstimate.totalLamports / 1_000_000_000,
  transactionBytes: wireBytes, simulatedComputeUnits: simulation.value.unitsConsumed,
  plan: join(stateDir, 'registration.plan.json'),
}));
EOF
```

The script refreshes availability, pricing, and balances, then builds the instructions with the owner's **public address only**.
It saves both their binary data and a decoded representation for inspection.
The two compute-budget instructions preceding the three operations set the execution limit and priority fee; these values are also recorded in the plan.

The script also calls Solana's [`simulateTransaction`](<https://solana.com/docs/rpc/http/simulatetransaction>) with signature verification disabled.
This executes the proposed instructions against the node's current state without committing their effects or charging our wallet.
Even if a simulation log says that the name was purchased, **it is still only a simulation**.

```bash
SOLANA_RPC_URL="$solana_rpc_url" \
  node "$native_arns_tools_dir/prepare-registration.mjs" \
    "$native_arns_state_dir" "$native_arns_name" "$arns_owner_address" \
    "$native_arns_type" "$native_arns_years" "$native_arns_initial_manifest_id"

# {
#   "name": "weisser-zwerg-native",
#   "type": "lease",
#   "years": 1,
#   "owner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "ant": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "manifest": "nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ",
#   "priceARIO": 2399.38512,
#   "estimatedTotalSOL": 0.010940658,
#   "transactionBytes": 1176,
#   "simulatedComputeUnits": "105869",
#   "plan": ".../publishing-arweave-ario-basics-site-publication-state/native-arns/registration.plan.json"
# }
```

In my current check, the one-year lease quote was **2,399.38512 ARIO**, the SDK's total SOL estimate was **0.010941924 SOL**, and the unsigned transaction occupied **1,176 bytes**.
The simulation succeeded and consumed 108,804 compute units.
These are observations from that check; the command obtains fresh values for each run.
Its generated ANT address will also differ from mine.

Now inspect the saved plan rather than relying only on the short terminal summary:

```bash
jq '{name, type, years, owner, feePayer, ant, rootRecord,
     arioMint, buyerTokenAccount, treasury, quote, requiredSigners}' \
  "$native_arns_plan_file"

# {
#   "name": "weisser-zwerg-native",
#   "type": "lease",
#   "years": 1,
#   "owner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "feePayer": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "ant": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "rootRecord": {
#     "undername": "@",
#     "transactionId": "nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ",
#     "targetProtocol": 0
#   },
#   "arioMint": "DcNnMuFxwhgV4WY1HVSaSEgr92bv2b1vUvEKiNxWqHdF",
#   "buyerTokenAccount": "3GwGCvaj6x8tvppYavfSXZ9i2V72cotqJHEBtyjyTFVP",
#   "treasury": "6Sj3DQAynK916KfBHUZxnG4aDKdqFpBVPCNdD4X6Vrj5",
#   "quote": {
#     "tokenCost": 2399385120,
#     "discounts": [],
#     "gasEstimate": {
#       "totalLamports": 10940658,
#       "feeLamports": 292978,
#       "baseFeeLamports": 15000,
#       "priorityFeeLamports": 277978,
#       "rentLamports": 10647680,
#       "rentReclaimedLamports": 0,
#       "priorityFeeMicroLamports": 347472,
#       "computeUnitLimit": 400000,
#       "signatureCount": 3,
#       "transactionCount": 2
#     },
#     "fundingPlan": {
#       "address": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#       "balance": 2505974996,
#       "stakes": {},
#       "shortfall": 0
#     }
#   },
#   "requiredSigners": [
#     "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#     "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg"
#   ]
# }


jq '.decoded' "$native_arns_plan_file"

# [
#   {
#     "operation": "Create ANT asset",
#     "programAddress": "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d",
#     "data": {
# ... long data structure ...
#   {
#     "operation": "Initialize ANT and root record",
#     "programAddress": "2MWexMHfMhGJwMHv9Qm9YAVCqjUFUJwDJAysW4oCUGk5",
#     "data": {
# ... long data structure ...
#   {
#     "operation": "Buy name from liquid ARIO",
#     "programAddress": "2yCUx5edFvUrkibYaUa2ZXWyx9kuJkS8CwyzsgHPWdZZ",
#     "data": {
jq '.value | {err, unitsConsumed, logs}' \
  "$native_arns_state_dir/registration.simulation.json"

# {
#   "err": null,
#   "unitsConsumed": "105869",
#   "logs": [
#     "Program ComputeBudget111111111111111111111111111111 invoke [1]",
#     "Program ComputeBudget111111111111111111111111111111 success",
#     "Program ComputeBudget111111111111111111111111111111 invoke [1]",
#     "Program ComputeBudget111111111111111111111111111111 success",
#     "Program CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d invoke [1]",
#     "Program log: Instruction: Create",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program log: programs/mpl-core/src/state/asset.rs:155:Approve",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d consumed 15771 of 799700 compute units",
#     "Program CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d success",
#     "Program 2MWexMHfMhGJwMHv9Qm9YAVCqjUFUJwDJAysW4oCUGk5 invoke [1]",
#     "Program log: Instruction: Initialize",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program log: ANT initialized for asset HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#     "Program 2MWexMHfMhGJwMHv9Qm9YAVCqjUFUJwDJAysW4oCUGk5 consumed 40847 of 783929 compute units",
#     "Program 2MWexMHfMhGJwMHv9Qm9YAVCqjUFUJwDJAysW4oCUGk5 success",
#     "Program 2yCUx5edFvUrkibYaUa2ZXWyx9kuJkS8CwyzsgHPWdZZ invoke [1]",
#     "Program log: Instruction: BuyName",
#     "Program 11111111111111111111111111111111 invoke [2]",
#     "Program 11111111111111111111111111111111 success",
#     "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA invoke [2]",
#     "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA consumed 76 of 702848 compute units",
#     "Program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA success",
#     "Program data: wFAV/clk49WbRSj44tnGEoAh6+08y6e7z4BmvxMltaUKSs2bwsX01BQAAAB3ZWlzc2VyLXp3ZXJnLW5hdGl2ZQABILYDjwAAAADxHNwaDjYtkI4jg5pSjuRhheXrEf6FnNnRnqKzxtOsPwC+tPZqAAAAAA==",
#     "Program log: ArNS name 'weisser-zwerg-native' purchased for 2399385120 mARIO",
#     "Program 2yCUx5edFvUrkibYaUa2ZXWyx9kuJkS8CwyzsgHPWdZZ consumed 48951 of 743082 compute units",
#     "Program 2yCUx5edFvUrkibYaUa2ZXWyx9kuJkS8CwyzsgHPWdZZ success"
#   ]
# }
```

Check the following relationships in the decoded instructions:

* The **asset owner**, ANT initializer, registration buyer, and transaction fee payer are all `$arns_owner_address`.
* The **new ANT address** appears in both the asset-creation instruction and the registration's `params.ant` field. It is one of the two required signers; the existing owner is the other.
* The **root target** is `$manual_v2_manifest_id`, with `targetProtocol: 0` selecting Arweave. The `@` record represents the base name itself.
* The **ARIO mint** matches the official mint checked above. `buyerTokenAccount` is the owner's associated token account for ARIO; `treasury` is read from the on-chain ArNS configuration.
* The named accounts expose what will be created: the ANT asset, `antConfig`, `antControllers`, `rootRecord`, and `arnsRecord`. The protocol's configuration, demand-factor, and name-registry accounts already exist and are shared infrastructure.

The decoded `purchaseType` is `0` for a lease and `1` for permabuy in this version of the instruction format.
The asset's `uri` refers to its wallet metadata/logo; the website target is the separate `target` in the ANT initialization instruction.
Likewise, its program-derived `updateAuthority` allows the ANT program to maintain asset metadata; it is not the wallet that owns the ANT.

> **A quote is not a price cap in the signed instruction.**
> The purchase instruction contains the name, registration type, duration, and ANT address; the program calculates the ARIO charge from its pricing state when the transaction executes.
> The saved quote is a review aid, and the SDK's SOL estimate includes assumptions about the registration flow.
> Before signing, we will refresh the quote, inspect the transaction's fees, and simulate again.

> **The full SDK flow also performs follow-up bookkeeping.**
> After the atomic purchase, SDK 4.5.2 records the ANT in the owner's ownership/controller lookup lists and attempts to synchronise its registration attributes.
> Those are separate operations from purchasing the name, and they help applications discover and display it.
> Our plan here contains the main registration transaction; we will account for that follow-up work when completing and verifying the purchase.

The result is a local **instruction plan**.
It deliberately omits a lasting blockhash: Solana transactions have a short validity window, so the signing step will assemble a fresh transaction from these instructions.
The owner's private key remains in Phantom/MetaMask, and no purchase has been submitted.

#### Sign, Submit, and Verify the Purchase

We now have a registration plan, an unfunded creation key for the new ANT account, and an owner whose SOL and ARIO remain in the browser wallet.
Completing this walkthrough requires **three separate transactions and three owner approvals in Phantom**, in this order:

1. **`purchase`: create the ANT and register the name.** This establishes ownership, pays the registration price in ARIO, and sets the initial website target. SOL pays the network fee, the Metaplex asset-creation fee, and the required account deposits. Once this transaction finalises, the name belongs to the owner.
2. **`acl`: add the ownership and controller lookup entries.** The asset already records who owns it, but applications also need the reverse lookup: given a wallet address, which ANTs does it own or control? This transaction adds those entries so the Console can list the name normally. It uses SOL, with no additional ARIO registration charge.
3. **`attributes`: synchronise the asset's registration metadata.** The ArNS registry records the registration, while the ANT is also a Metaplex asset that wallets and other applications can inspect. This step keeps the registration attributes attached to that asset, such as its name and registration type, in sync. It also uses SOL, with no additional ARIO registration charge.

This follows the [SDK 4.5.2 flow for a newly created ANT](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/io-writeable.ts>).
The purchase establishes the name and its owner; the other two transactions complete discovery and metadata bookkeeping.
Keeping them separate also means that a failure in the attributes update cannot undo the purchase or the completed lookup entries.
The first transaction additionally receives the temporary ANT creation key's signature locally; the three browser approvals are all from the long-lived owner.

> **Read through the signing sequence before starting a round.**
> Unlike the native Arweave transaction above, a Solana transaction contains a recent blockhash that [typically remains valid for only about 60-90 seconds](<https://solana.com/developers/cookbook/transactions/confirmation>).
> The window is already running when `prepare-signing` fetches that blockhash; approving in Phantom or downloading the result does not restart it.
> The exact limit is the transaction's `lastValidBlockHeight`.
> Have Phantom unlocked and both browser code blocks below ready, then prepare, inspect, sign, and submit without an extended pause.
>
> I let two purchase attempts expire before submission. In one, downloading the signed file took about 37 seconds after preparation, and manually starting submission took another 25 seconds.
> The shell helpers below remove that last delay: once the matching signed file arrives, they validate and submit it automatically.

Each round follows the same sequence: **start its shell command → load and inspect the fresh packet in the browser (JavaScript in the Dev Console) → sign and download (JavaScript in the Dev Console) → let the waiting shell submit, wait for finalisation, and verify**.
We will set up the tools and browser connection first, then perform those three rounds one at a time in the same Bash shell.

##### Create the Transaction Helper

The following helper reuses SDK 4.5.2 and the dependencies installed in the preceding subsection.
Its four commands have separate purposes:

* `prepare-signing` refreshes the purchase quote, assembles and simulates a transaction, and signs only with the temporary ANT creation key when that signature is needed.
  * This helper and the earlier `prepare-registration.mjs` both contain code for quoting, transaction assembly, simulation, and JSON handling.
  A production implementation could share this code; keeping the helpers self-contained makes this walkthrough easier to follow.
* `submit` checks the downloaded signatures and transaction contents, saves its identifier before contacting the network, and submits the same bytes through Solana RPC.
* `status` waits for finalisation and retains the on-chain transaction details without submitting anything.
* `verify` independently reads the name registry, Metaplex asset ownership, ANT controllers, and initial target.

```bash
cat > "$native_arns_tools_dir/registration-flow.mjs" <<'EOF'
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  AccountRole, address, appendTransactionMessageInstructions, compileTransaction,
  createKeyPairSignerFromPrivateKeyBytes, createNoopSigner, createSolanaRpc,
  createTransactionMessage, fetchEncodedAccount, getBase64EncodedWireTransaction, getPublicKeyFromAddress,
  getSignatureFromTransaction, getTransactionDecoder, partiallySignTransaction,
  pipe, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash,
  verifySignature,
} from '@solana/kit';
import {
  ARIO_ANT_PROGRAM_ID, SolanaARIOReadable, SolanaANTReadable,
  SolanaANTRegistryReadable, SolanaANTRegistryWriteable,
  getAntAuthorityPDA, getArnsRecordPDA,
} from '@ar.io/sdk';
import { fetchAssetV1 } from '@ar.io/solana-contracts/mpl-core';
import { getSyncAttributesInstruction } from '@ar.io/solana-contracts/ant';
import {
  getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

const [action, stateDir, argument] = process.argv.slice(2);
assert(['prepare-signing', 'submit', 'status', 'verify'].includes(action) && stateDir,
  'Usage: registration-flow.mjs prepare-signing|submit|status|verify state-directory [phase|signed-file]');
const json = value => JSON.stringify(value,
  (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n';
const load = async file => JSON.parse(await readFile(file, 'utf8'));
const save = (file, value) => writeFile(file, json(value));
const plan = await load(join(stateDir, 'registration.plan.json'));
const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com');
const ario = new SolanaARIOReadable({ rpc, commitment: 'finalized' });
const owner = address(plan.owner);
const asset = address(plan.ant);
const placeholder = createNoopSigner(owner);
const decodeTransaction = base64 => getTransactionDecoder().decode(Buffer.from(base64, 'base64'));

async function inspectRegistration() {
  const record = await ario.getArNSRecord({ name: plan.name });
  const nft = await fetchAssetV1(rpc, asset, { commitment: 'finalized' });
  const ant = new SolanaANTReadable({ rpc, processId: asset, commitment: 'finalized' });
  const [antOwner, controllers, root] = await Promise.all([
    ant.getOwner(), ant.getControllers(), ant.getRecord({ undername: '@' }),
  ]);
  const state = { Owner: antOwner, Controllers: controllers, Records: { '@': root } };
  assert.equal(record.processId, asset, 'Registry points to a different ANT');
  assert.equal(record.type, plan.type, 'Unexpected registration type');
  assert.equal(nft.data.owner, owner, 'Metaplex asset has a different owner');
  assert.equal(state.Owner, owner, 'ANT owner cache differs from the asset owner');
  assert.deepEqual([...state.Controllers].sort(), [owner], 'Unexpected controllers');
  assert.equal(state.Records['@'].transactionId, plan.rootRecord.transactionId);
  assert.equal(state.Records['@'].targetProtocol, 0);
  const registry = new SolanaANTRegistryReadable({ rpc, commitment: 'finalized' });
  const lookup = await registry.accessControlList({ address: owner });
  return { record, assetOwner: nft.data.owner, ant: state, lookup };
}

if (action === 'verify') {
  const verification = await inspectRegistration();
  await save(join(stateDir, 'registration.verified.json'), verification);
  console.log(json(verification));
} else if (action === 'prepare-signing') {
  const phase = argument;
  assert(['purchase', 'acl', 'attributes'].includes(phase), 'Choose purchase, acl, or attributes');
  let instructions, quote = null, creationSigner;
  let priorityPrice = BigInt(plan.priorityFeeMicroLamports);
  if (phase === 'purchase') {
    const [recordAddress] = await getArnsRecordPDA(plan.name);
    assert.equal((await fetchEncodedAccount(rpc, recordAddress)).exists, false,
      'Name is already registered: inspect it instead of repeating the purchase');
    quote = await ario.getCostDetails({
      intent: 'Buy-Name', name: plan.name, type: plan.type, years: plan.years,
      fromAddress: owner, fundFrom: 'balance',
    });
    assert.equal(quote.fundingPlan.shortfall, 0, 'Insufficient ARIO');
    assert.equal(quote.tokenCost, plan.quote.tokenCost,
      'Price changed: rerun the preparation section and review the new plan');
    priorityPrice = BigInt(quote.gasEstimate.priorityFeeMicroLamports);
    instructions = plan.instructions.slice(2).map(ix => ({
      programAddress: address(ix.programAddress), data: Buffer.from(ix.dataBase64, 'base64'),
      accounts: ix.accounts.map(a => ({ address: address(a.address), role: AccountRole[a.role] })),
    }));
    creationSigner = await createKeyPairSignerFromPrivateKeyBytes(
      await readFile(join(stateDir, 'private', 'ant-creation.seed')));
    assert.equal(creationSigner.address, asset, 'Creation key does not match the planned ANT');
  } else {
    await inspectRegistration(); // Follow-up work only after the purchase is finalised.
    if (phase === 'acl') {
      const registry = new SolanaANTRegistryWriteable({ rpc, signer: placeholder });
      instructions = await registry.bootstrapOwnerOnSpawn({ owner, asset });
    } else {
      const [arnsRecord] = await getArnsRecordPDA(plan.name);
      const [antAuthority] = await getAntAuthorityPDA(asset);
      instructions = [getSyncAttributesInstruction({
        asset, payer: placeholder, antAuthority, arnsRecord, name: plan.name,
      }, { programAddress: ARIO_ANT_PROGRAM_ID })];
    }
  }
  if (!instructions.length) {
    console.log('No missing lookup entries; no transaction is needed.');
    process.exit(0);
  }
  instructions = [
    getSetComputeUnitLimitInstruction({ units: phase === 'purchase' ? 800_000 : 400_000 }),
    getSetComputeUnitPriceInstruction({ microLamports: priorityPrice }), ...instructions,
  ];
  const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
  const message = pipe(createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayer(owner, m),
    m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m),
    m => appendTransactionMessageInstructions(instructions, m));
  let transaction = compileTransaction(message);
  const wire = getBase64EncodedWireTransaction(transaction);
  assert(Buffer.from(wire, 'base64').length <= 1232, 'Transaction exceeds the size limit');
  const simulation = await rpc.simulateTransaction(wire, {
    encoding: 'base64', commitment: 'confirmed', sigVerify: false,
  }).send();
  assert.equal(simulation.value.err, null, json(simulation.value));
  const { value: fee } = await rpc.getFeeForMessage(
    Buffer.from(transaction.messageBytes).toString('base64'), { commitment: 'confirmed' }).send();
  assert(fee !== null, 'Blockhash expired; run prepare-signing again');
  // Sign only the new asset account here. The owner still signs in Phantom.
  if (creationSigner) transaction = await partiallySignTransaction([creationSigner.keyPair], transaction);
  const attemptId = `${phase}-${randomUUID()}`;
  const attemptDir = join(stateDir, 'attempts', attemptId);
  await mkdir(attemptDir, { recursive: true });
  const packet = {
    attemptId, phase, owner, ant: asset, name: plan.name, type: plan.type, years: plan.years,
    initialTarget: plan.rootRecord, quote, feeLamports: fee, lifetime,
    instructions: instructions.map(ix => ({
      programAddress: ix.programAddress,
      accounts: ix.accounts?.map(a => ({ address: a.address, role: AccountRole[a.role] })) ?? [],
      dataBase64: Buffer.from(ix.data).toString('base64'),
    })),
    transactionBase64: getBase64EncodedWireTransaction(transaction),
  };
  await save(join(attemptDir, 'prepared.json'), packet);
  await save(join(attemptDir, 'simulation.json'), simulation);
  const signingDir = join(stateDir, 'signing');
  await mkdir(signingDir, { recursive: true });
  await save(join(signingDir, 'active.json'), packet);
  console.log(json({ attemptId, phase, feeSOL: Number(fee) / 1e9,
    priceARIO: quote ? quote.tokenCost / 1e6 : 0, lastValidBlockHeight: lifetime.lastValidBlockHeight }));
} else {
  const signed = await load(argument);
  assert(/^(purchase|acl|attributes)-[0-9a-f-]{36}$/.test(signed.attemptId), 'Invalid attempt ID');
  const attemptDir = join(stateDir, 'attempts', signed.attemptId);
  const prepared = await load(join(attemptDir, 'prepared.json'));
  const transaction = decodeTransaction(signed.transactionBase64);
  const original = decodeTransaction(prepared.transactionBase64);
  assert.deepEqual(transaction.messageBytes, original.messageBytes,
    'Wallet changed the transaction: do not submit until the changes are reviewed');
  for (const [key, signature] of Object.entries(transaction.signatures)) {
    assert(signature && await verifySignature(await getPublicKeyFromAddress(address(key)),
      signature, transaction.messageBytes), `Missing or invalid signature for ${key}`);
  }
  const signature = getSignatureFromTransaction(transaction);
  // Persist both signed bytes and their identifier BEFORE any submission attempt.
  await save(join(attemptDir, 'signed.json'), { ...signed, signature });
  console.log(`Transaction: https://solscan.io/tx/${signature}`);
  const readStatus = async () => {
    const response = await rpc.getSignatureStatuses([signature], { searchTransactionHistory: true }).send();
    await save(join(attemptDir, 'status.json'), response);
    return response.value[0];
  };
  let status = await readStatus();
  if (action === 'submit' && status === null) {
    const height = await rpc.getBlockHeight({ commitment: 'confirmed' }).send();
    assert(height <= BigInt(prepared.lifetime.lastValidBlockHeight),
      'Blockhash expired. Check status and on-chain state before preparing a replacement.');
    const simulation = await rpc.simulateTransaction(signed.transactionBase64, {
      encoding: 'base64', commitment: 'confirmed', sigVerify: true,
    }).send();
    await save(join(attemptDir, 'signed-simulation.json'), simulation);
    assert.equal(simulation.value.err, null, json(simulation.value));
    const result = await rpc.sendTransaction(signed.transactionBase64, {
      encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 5n,
    }).send();
    assert.equal(result, signature);
    await save(join(attemptDir, 'submission.json'), { signature, submittedAt: new Date().toISOString() });
    console.log('RPC accepted the transaction. Now run the status command.');
  } else if (action === 'submit') {
    console.log(json(status));
  } else {
    for (let attempt = 0; attempt < 24; attempt++) {
      if (status?.confirmationStatus === 'finalized') break;
      console.log(status?.confirmationStatus ?? 'No status yet');
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await readStatus();
    }
    assert(status?.confirmationStatus === 'finalized',
      'Not finalised yet. Repeat status; do not infer failure from a missing response.');
    const details = await rpc.getTransaction(signature, {
      commitment: 'finalized', encoding: 'json', maxSupportedTransactionVersion: 0,
    }).send();
    await save(join(attemptDir, 'transaction.json'), details);
    assert(details !== null, 'Finalised, but transaction details are not available yet; repeat status.');
    assert.equal(status.err, null, 'Transaction finalised with an error; inspect the saved details');
    console.log(`Finalised successfully. Details: ${join(attemptDir, 'transaction.json')}`);
  }
}
EOF
```

Each attempt has its own directory under `$native_arns_state_dir/attempts/`.
It contains the prepared transaction, simulations, signed bytes, status responses, and eventual transaction details.
The helper checks the actual Metaplex asset owner as well as the ANT's cached owner field; a wallet's display alone is not our ownership check.

##### Prepare the Shell Helpers

The following Bash helpers run the existing `prepare-signing`, `submit`, `status`, and `verify` commands in sequence.
Starting a round deliberately arms automatic submission of that round's signed download; the browser still only signs and saves a file.
The owner reviews and approves each transaction in Phantom.

Configure the download directory now, before preparing any transaction.
Keep the generated filenames unchanged: each contains the unique attempt identifier, so an earlier download cannot be mistaken for the new one.

```bash
# XXX_TODO_XXX: Set this to the browser's actual download directory.
native_arns_download_dir="$HOME/Downloads"

cat > "$native_arns_tools_dir/sign-and-submit.bash" <<'EOF'
run_arns_registration_step() {
  local phase="${1:-}" previous_attempt="" download_deadline
  case "$phase" in
    purchase|acl|attributes) ;;
    *) printf 'Choose purchase, acl, or attributes.\n' >&2; return 2 ;;
  esac

  if [[ -f "$native_arns_signing_dir/active.json" ]]; then
    previous_attempt="$(jq -er '.attemptId' "$native_arns_signing_dir/active.json")" || return
  fi

  SOLANA_RPC_URL="$solana_rpc_url" \
    node "$native_arns_tools_dir/registration-flow.mjs" \
      prepare-signing "$native_arns_state_dir" "$phase" || return

  native_arns_attempt="$(jq -er '.attemptId' "$native_arns_signing_dir/active.json")" || return
  # An already-complete ACL needs no transaction and leaves active.json unchanged.
  if [[ "$native_arns_attempt" == "$previous_attempt" ]]; then
    printf 'No new signing attempt was created; nothing to submit.\n'
    return 0
  fi
  jq -e --arg phase "$phase" '.phase == $phase' \
    "$native_arns_signing_dir/active.json" >/dev/null || return

  native_arns_signed_file="$native_arns_download_dir/$native_arns_attempt.signed.json"
  printf 'Waiting for: %s\nLoad the fresh packet, check phase %s, and sign in the browser.\n' \
    "$native_arns_signed_file" "$phase"

  download_deadline=$((SECONDS + 90))
  until jq -e --arg attempt "$native_arns_attempt" \
    '.attemptId == $attempt and (.transactionBase64 | type == "string")' \
    "$native_arns_signed_file" >/dev/null 2>&1; do
    if (( SECONDS >= download_deadline )); then
      printf 'No complete matching download received; nothing submitted.\n' >&2
      return 1
    fi
    sleep 0.2
  done

  SOLANA_RPC_URL="$solana_rpc_url" \
    node "$native_arns_tools_dir/registration-flow.mjs" \
      submit "$native_arns_state_dir" "$native_arns_signed_file" || return
  SOLANA_RPC_URL="$solana_rpc_url" \
    node "$native_arns_tools_dir/registration-flow.mjs" \
      status "$native_arns_state_dir" "$native_arns_signed_file" || return
  SOLANA_RPC_URL="$solana_rpc_url" \
    node "$native_arns_tools_dir/registration-flow.mjs" \
      verify "$native_arns_state_dir" || return

  if [[ "$phase" == acl ]]; then
    jq -e --arg ant "$(jq -er '.ant' "$native_arns_plan_file")" \
      '(.lookup.Owned | index($ant) != null) and (.lookup.Controlled | index($ant) != null)' \
      "$native_arns_state_dir/registration.verified.json" || return
    printf 'ANT is present in both ownership and controller lookup lists.\n'
  fi
}

submit_next_arns_purchase() {
  run_arns_registration_step purchase
}

run_arns_followup() {
  case "${1:-}" in
    acl|attributes) run_arns_registration_step "$1" ;;
    *) printf 'Usage: run_arns_followup acl|attributes\n' >&2; return 2 ;;
  esac
}
EOF

source "$native_arns_tools_dir/sign-and-submit.bash"
```

Sourcing the file only defines the functions; it starts no transaction.
The helper waits up to 90 seconds for a complete JSON download with the matching attempt identifier.
That timeout limits the wait; it does not extend the blockhash's validity.
The underlying transaction helper still checks every signature, the exact transaction contents, and expiry before submission.

##### Connect the Browser Wallet First

As in the Wander experiment, use a small local page to reach the browser wallet.
Here the page uses [Wallet Standard](<https://github.com/wallet-standard/wallet-standard>) to discover Phantom and request a Solana signature.
The library is bundled locally; the page serves neither private keys nor the entire publication-state directory.

```bash
native_arns_signing_dir="$native_arns_state_dir/signing"
install -d -- "$native_arns_signing_dir"
jq -r '.owner' "$native_arns_plan_file" > "$native_arns_signing_dir/owner-address.txt"

(
  set -e
  cd -- "$native_arns_tools_dir"
  npm install --save-exact --ignore-scripts @wallet-standard/app@1.1.0 esbuild@0.27.1
)

cat > "$native_arns_tools_dir/wallet-entry.mjs" <<'EOF'
import { getWallets } from '@wallet-standard/app';
window.arnsWallets = getWallets();
EOF

"$native_arns_tools_dir/node_modules/.bin/esbuild" \
  "$native_arns_tools_dir/wallet-entry.mjs" \
  --bundle --platform=browser --format=iife \
  --outfile="$native_arns_signing_dir/wallet-standard.js"

cat > "$native_arns_signing_dir/index.html" <<'EOF'
<!doctype html>
<meta charset="utf-8">
<title>Sign an ArNS transaction</title>
<h1>Sign an ArNS transaction</h1>
<p>Follow the walkthrough in the browser's developer console. This page signs but does not submit transactions.</p>
<script src="./wallet-standard.js"></script>
EOF

python3 -m http.server 8768 \
  --bind 127.0.0.1 \
  --directory "$native_arns_signing_dir" \
  > "$native_arns_state_dir/http-server.log" 2>&1 &
native_arns_http_pid=$!
```

The final `&` runs the server in the background, leaving the same Bash shell available for the remaining commands with all walkthrough variables intact.
`$!` gives us the server's process ID so we can stop it later.
Server output goes to `$native_arns_state_dir/http-server.log`; check that file if the local page does not load.
Keep this shell open throughout the signing steps.

Open [http://127.0.0.1:8768/](<http://127.0.0.1:8768/>) in the browser where Phantom holds the intended Solana account.
Open **Developer Tools > Console** and run the following **browser JavaScript**:

```javascript
var expectedOwner = (await (await fetch('./owner-address.txt', { cache: 'no-store' })).text()).trim();
var arnsWallet = arnsWallets.get().find(wallet =>
  wallet.name === 'Phantom' && wallet.features['solana:signTransaction']);
if (!arnsWallet) throw new Error('Phantom with Solana transaction signing was not found.');
var connected = await arnsWallet.features['standard:connect'].connect();
var arnsAccount = connected.accounts.find(account => account.address === expectedOwner);
if (!arnsAccount) throw new Error('Select the intended Solana account in Phantom and reconnect.');
console.log('Connected owner:', arnsAccount.address);

// Connected owner: BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ
```

Connecting only establishes which public account will sign.
If both Phantom and MetaMask are installed, this code deliberately selects Phantom.

##### The Two Browser Blocks Used in Every Round

Read these two blocks now and keep them ready in the browser's developer console.
Run them only after starting one of the shell commands in the rounds below and seeing **`Waiting for:`** in the terminal.
Repeat both blocks for each round: the previous `arnsPacket` remains in browser memory until we replace it with the new one.

**1. Load and inspect the fresh packet.**

```javascript
var arnsPacket = await (await fetch('./active.json', { cache: 'no-store' })).json();
if (arnsPacket.owner !== arnsAccount.address) throw new Error('Owner mismatch');
console.log({
  attempt: arnsPacket.attemptId, phase: arnsPacket.phase, owner: arnsPacket.owner,
  name: arnsPacket.name, type: arnsPacket.type, years: arnsPacket.years,
  ant: arnsPacket.ant, initialTarget: arnsPacket.initialTarget,
  priceARIO: arnsPacket.quote ? arnsPacket.quote.tokenCost / 1e6 : 0,
  networkFeeSOL: Number(arnsPacket.feeLamports) / 1e9,
  lastValidBlockHeight: arnsPacket.lifetime.lastValidBlockHeight,
});

// {attempt: 'purchase-114fcbd5-109a-4e58-a831-1c17409690e6', phase: 'purchase', owner: 'BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ', name: 'weisser-zwerg-native', type: 'lease', …}
// ant:  "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg" ...
// priceARIO: 2399.38512
```

Check that the attempt identifier matches the terminal and that the phase is the one just started: `purchase`, `acl`, or `attributes`.
Confirm the owner, name, lease duration, ANT, version 2 manifest, and costs against the plan.
The initial target remains in all three packets as context; the follow-ups do not change it.
`priceARIO` should be zero for `acl` and `attributes`.
`networkFeeSOL` includes the transaction's priority fee; any SOL account deposits are separate.

**2. Request the owner's signature and download the result.**

```javascript
var transactionBytes = Uint8Array.from(atob(arnsPacket.transactionBase64), c => c.charCodeAt(0));
var [signedOutput] = await arnsWallet.features['solana:signTransaction'].signTransaction({
  account: arnsAccount, chain: 'solana:mainnet', transaction: transactionBytes,
});
var signedFile = {
  attemptId: arnsPacket.attemptId,
  transactionBase64: btoa(String.fromCharCode(...signedOutput.signedTransaction)),
};
var download = document.createElement('a');
download.href = URL.createObjectURL(new Blob([JSON.stringify(signedFile, null, 2) + '\n'],
  { type: 'application/json' }));
download.download = `${arnsPacket.attemptId}.signed.json`;
download.click();
console.log('Saved signed transaction:', download.download);

// ~/Downloads/purchase-114fcbd5-109a-4e58-a831-1c17409690e6.signed.json
```

Review the prompt and approve in Phantom, then let the browser save the file under its generated name in the configured download directory.
This calls `solana:signTransaction`: the browser produces the signed file, while the waiting shell performs submission.

The shell validates the signed transaction, saves its bytes and identifier before contacting the network, runs a signed simulation, and submits with preflight checks enabled.
The printed Solscan URL is derived from the local signature; printing it alone does not establish submission.
Likewise, `RPC accepted the transaction` [does not yet mean the transaction is confirmed](<https://solana.com/docs/rpc/http/sendtransaction>).
The helper continues into `status`, waits for finalisation, and then runs `verify`.
Wait for that round to finish successfully before starting the next one.

##### Round 1: Purchase the Name

With Phantom connected and the two browser blocks ready, start in the same Bash shell:

```bash
submit_next_arns_purchase
```

The command checks that the name remains unregistered and that the current ARIO price matches the reviewed plan.
If the price has changed, refresh the plan and review the new quote before starting another attempt.
The temporary creation key signs first, following the [SDK's browser-wallet signing order](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/spawn-ant.ts>).
The owner's signature is still missing at this point.

When the terminal prints **`Waiting for:`**, run **both browser blocks** above: (load and inspect) + (request the owner's signature and download).
The waiting shell submits that download and checks finalisation and ownership.

For the USD equivalents in these three rounds we use: **$0.00123291 per ARIO** and **$79.76 per SOL**.
USD values are approximate conversions at that snapshot; the token amounts below are the actual transaction debits.

My successful purchase spent **2,399.38512 ARIO ($2.96)** and deducted **0.012021414 SOL ($0.9588)** from my wallet.
The SOL comprised **0.000290294 SOL ($0.0232)** in network fees, **0.0015 SOL ($0.1196)** for creating the Metaplex asset, and **0.010231120 SOL ($0.8160)** in account deposits.
The [purchase transaction](<https://solscan.io/tx/TsLNjdppyzMLJcT7vcFTHLh8cbsRJUfVMcAPdJb3nfZSTsKvN2DEXrJqX4tvQGKRa5eXriBaFGZosjgJV78nsFN>) finalised successfully.
Independent reads confirmed that the name points to the planned ANT, that the Metaplex asset and ANT both identify my Solana account as owner, and that the root `@` record points to the manual version 2 manifest.

> **What to expect in the AR.IO Console after the purchase.**
> In [Manage Domains](<https://console.ar.io/domains>), the name may still be missing from the normal list because its ownership lookup entry has not yet been added.
> I saw a banner saying **"1 name you own isn't showing here yet"**, naming `weisser-zwerg-native.ar.io` and offering **Sync ownership**.
> Its accompanying text said the name had been transferred to my wallet outside the app. That is generic wording: in this experiment I had just created and registered it directly.
> The Console had detected that I owned the asset, while its ordinary list still lacked the lookup entry.
> The [Sync ownership action](<https://github.com/ar-io/ar-io-console/blob/b230e681a20d8db08ffac227a20a0df7b8cca9cf/src/features/arns/hooks/useSyncOwnership.ts>) offers reconciliation through the browser; for this walkthrough we will complete both lookup entries with the `acl` round below.
>
> This means: **Don't use this Sync ownership action**!

##### Round 2: Add the Ownership and Controller Lookup Entries

After the purchase has finalised and its verification has passed, start the next round:

```bash
run_arns_followup acl
```

At **`Waiting for:`**, repeat **both browser blocks**: (load and inspect) + (request the owner's signature and download).
This transaction records the ANT in the existing owner's `Owned` and `Controlled` lookup lists.
It makes the existing ownership and controller permissions discoverable by wallet address.
SOL pays the transaction fee and, if needed, deposits for new lookup accounts or pages.

My [ACL transaction](<https://solscan.io/tx/53NSknYXuAhXgioofboVNXJoyEvxeXSQDoUS2gTSF2uWTrd21EAA8tvq5wiQUQhbiYkxQALuDZpAnHMavHZDJWTh>) deducted **0.000479269 SOL ($0.0382)** in total: **0.000143989 SOL ($0.0115)** for the network fee and **0.000335280 SOL ($0.0267)** to increase the lookup account's rent-exempt balance as its stored data grew.
The ARIO charge was **0 ARIO**.

If the entries already exist, the preparation command reports that no transaction is needed and the waiting helper skips signing and submission for this round.

> **What to expect in the Console after the ACL update.**
> Refresh Manage Domains. In my experiment the banner disappeared and `weisser-zwerg-native.ar.io` appeared as **ACTIVE**, with its one-year lease.
> This happened before the attributes update: adding the lookup entries was what made the name appear in the normal list.

##### Round 3: Synchronise the Registration Attributes

Once the ACL round has completed, start the final round:

```bash
run_arns_followup attributes
```

At **`Waiting for:`**, repeat **both browser blocks** once more: (load and inspect) + (request the owner's signature and download).
The transaction synchronises the registration metadata attached to the ANT asset.
The name, its owner, and its website target remain the ones already established by the purchase.

My [attributes transaction](<https://solscan.io/tx/2ydenQcqeNswwUPhnJSnay7vL496orBnHBZ9F12nQVvKbos1Uf1QZjJ1LzHuWPCLrwve5wygYvfA7apZz1FgQUNw>) deducted **0.000545309 SOL ($0.0435)** in total: **0.000143989 SOL ($0.0115)** for the network fee and **0.000401320 SOL ($0.0320)** to increase the asset account's rent-exempt balance for the added metadata.
The ARIO charge was again **0 ARIO**.
Its retained transaction log reported that four attributes had been synchronised for `weisser-zwerg-native`.
The helper's subsequent verification confirmed that the owner, controllers, lookup entries, and version 2 target remained correct.

> **What to expect in the Console after the attributes update.**
> The name is already listed as active after round 2, so this third transaction need not produce another visible change in Manage Domains.
> It completes the metadata synchronisation. Its finalised transaction and program log provide the evidence that the operation succeeded.

##### What the Three Rounds Cost

The finalised transactions record both the owner's SOL balance changes and the ARIO token balance change.
Using those actual debits, the three rounds cost the following at the USD rates quoted above:

<table class="article-table">
  <thead>
    <tr><th>Round</th><th>ARIO paid</th><th>Total SOL deducted</th><th>Combined USD value</th></tr>
  </thead>
  <tbody>
    <tr><td>1. Purchase</td><td>2,399.38512 ARIO ($2.96)</td><td>0.012021414 SOL ($0.9588)</td><td>$3.92</td></tr>
    <tr><td>2. ACL lookup entries</td><td>0 ARIO ($0.00)</td><td>0.000479269 SOL ($0.0382)</td><td>$0.04</td></tr>
    <tr><td>3. Registration attributes</td><td>0 ARIO ($0.00)</td><td>0.000545309 SOL ($0.0435)</td><td>$0.04</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>2,399.38512 ARIO ($2.96)</strong></td><td><strong>0.013045992 SOL ($1.0405)</strong></td><td><strong>$4.00</strong></td></tr>
  </tbody>
</table>

Of the total SOL debit, **0.000578272 SOL ($0.0461)** paid Solana network fees, **0.0015 SOL ($0.1196)** paid the Metaplex creation fee, and **0.010967720 SOL ($0.8748)** funded account deposits.
The deposits remain attached to the created or enlarged accounts, as explained in the earlier discussion of rent; recovering them requires a supported account-closing operation.

> **The network fee does not include every charge.**
> The transaction's `meta.fee` field contains its Solana network fee.
> The separate [Metaplex Core creation fee](<https://www.metaplex.com/docs/protocol-fees>) is initially placed in the asset account above its rent-exempt minimum and collected later by the protocol.
> It is therefore included in the wallet's SOL debit even though it is absent from `meta.fee`; that part of the asset balance is a fee, not a rent deposit.

The total covers the three successful transactions, including their account deposits, but excludes the earlier costs of acquiring and transferring the tokens.

> **The two attempts that expired before submission incurred no on-chain fee.**

USD totals are calculated before rounding.

##### Inspect the Results and Handle Interrupted Attempts

Each round retains its prepared and signed transaction, simulations, and finalised `transaction.json` under `$native_arns_state_dir/attempts/`.
The latest independent ownership and record check is available here:

```bash
jq '{record, assetOwner, ant, lookup}' "$native_arns_state_dir/registration.verified.json"

# {
#   "record": {
#     "processId": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#     "startTimestamp": 1794556296000,
#     "undernameLimit": 10,
#     "purchasePrice": 2399385120,
#     "type": "lease",
#     "endTimestamp": 1826092296000
#   },
#   "assetOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "ant": {
#     "Owner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#     "Controllers": [
#       "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
#     ],
#     "Records": {
#       "@": {
#         "transactionId": "nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ",
#         "targetProtocol": 0,
#         "ttlSeconds": 900,
#         "priority": 0
#       }
#     }
#   },
#   "lookup": {
#     "Owned": [
#       "Fs99yQbhTpQAtntmfrVrGc2LafQ6ykbD6kbcvhGZ3uqm",
#       "GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ",
#       "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg"
#     ],
#     "Controlled": [
#       "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg"
#     ]
#   }
# }
```

The verification checks that the registry's `processId` is the planned ANT, the registration type matches, and the Metaplex asset is owned by `$arns_owner_address`.
It also checks that the ANT's owner agrees, its controller list contains only that same owner, and its root `@` record points to `$manual_v2_manifest_id` with Arweave as the target protocol.
The registry response exposes the lease's start and expiry timestamps as well.

If a round stops after downloading but submission or finalisation is uncertain, inspect that same signed transaction before starting another attempt:

```bash
SOLANA_RPC_URL="$solana_rpc_url" \
  node "$native_arns_tools_dir/registration-flow.mjs" \
    status "$native_arns_state_dir" "$native_arns_signed_file"

# Transaction: https://solscan.io/tx/2ydenQcqeNswwUPhnJSnay7vL496orBnHBZ9F12nQVvKbos1Uf1QZjJ1LzHuWPCLrwve5wygYvfA7apZz1FgQUNw
# Finalised successfully. Details: .../publishing-arweave-ario-basics-site-publication-state/native-arns/attempts/attributes-8a7ecf02-7442-4b61-a443-1ec626c159f9/transaction.json
```

`status` submits nothing. It polls for up to approximately two minutes and saves the transaction details once finalisation is established.
Success requires both `confirmationStatus: "finalized"` and `err: null`.

> **An expired attempt needs a fresh transaction and fresh signatures.**
> If the helper stops at its local `Blockhash expired` check, that invocation has not submitted the transaction.
> Inspect any earlier submission's status and the on-chain state before replacing an uncertain attempt; a missing RPC response is not evidence of failure.
> Once an attempt is confirmed expired without landing, rerun the command for that same round, then reload `active.json` and sign the new packet.
> For a purchase retry, keep the same ANT creation key and retain the earlier attempt's files.
> Repeating `submit` with the same signed file reuses its signature and bytes, but cannot extend its validity.

If Phantom changes the transaction and the helper rejects it, inspect the difference before proceeding; retain the exact-message check.
If either follow-up fails, investigate and retry that operation rather than purchasing the name again.

After all three rounds have completed, stop the local server from the same shell:

```bash
kill "$native_arns_http_pid"
```

The existing Solana wallet now owns the registered name, its lookup entries are present, and its registration attributes have been synchronised.
The registration was paid in ARIO, while SOL paid the network fees, the Metaplex creation fee, and the account deposits.
The name still points to version 2; updating it to version 3 and checking website retrieval are the next parts of the experiment.

#### Update the Target to Version 3

The new name now points to the manual path's version 2 manifest.
We will change only its root `@` record to the native-upload version 3 manifest, [`k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k`](<https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/>).
Use the **manifest data-item ID**, not the ID of its enclosing Arweave bundle transaction: the manifest supplies the website's paths.

This requires **one Solana transaction and one owner approval**.
The name, lease, ANT, owner, and controllers remain the same.
The ownership lookup entries and registration attributes established above do not need to be created again for a target change.
The old manifest and its files also remain available under their immutable IDs.

The SDK's [`setBaseNameRecord` method](<https://github.com/ar-io/ar-io-sdk/blob/v4.5.2/src/solana/ant-writeable.ts>) uses the underlying `set_record` instruction.
We will construct that instruction with `getSetRecordInstructionAsync` from the already installed `@ar.io/solana-contracts@1.4.0`, retaining the previous separation between preparation, browser signing, submission, and verification.

> **What does this update cost?**
> My unsigned simulation quoted **0.000143989 SOL** in network fees, including the chosen priority fee (approximately **$0.0115**).
> It required **0 ARIO** and **no additional record deposit**: an existing record replaces one 43-character Arweave identifier with another, without growing its account.
> The helper checks that the simulated record size and lamport balance are unchanged and obtains the transaction fee from the RPC.
> This was a preparation check, not a submitted update; the finalised transaction will record the actual charge.

##### Prepare the Record-Update Helper

Keep the original `registration.plan.json` and `registration.verified.json` as records of the purchase and its initial target.
The following helper saves each update attempt separately and writes its independent result to `record-update.verified.json`.
It deliberately expects the version 2 target from the purchase plan, so it stops if the record has already changed.

Restore the version 3 ID from the saved data-item receipt if necessary:

```bash
native_v3_manifest_id="$(jq -er '.id' "$publication_state_dir/native-v3/manifest.ans104.json")"
printf 'New manifest target: %s\n' "$native_v3_manifest_id"
# k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k
```

The helper has the same four stages as before.
`prepare-signing` reads the current owner and root record, constructs and simulates the update, and saves an unsigned packet.
`submit` validates the owner's signature and unchanged transaction bytes before broadcasting; `status` checks finalisation; `verify` reads the resulting on-chain state.
No private key is read by this helper.

```bash
cat > "$native_arns_tools_dir/record-update.mjs" <<'EOF'
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import {
  AccountRole, address, appendTransactionMessageInstructions, compileTransaction,
  createNoopSigner, createSolanaRpc, createTransactionMessage,
  getBase64EncodedWireTransaction, getPublicKeyFromAddress,
  getSignatureFromTransaction, getTransactionDecoder, pipe,
  setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash,
  verifySignature,
} from '@solana/kit';
import {
  ARIO_ANT_PROGRAM_ID, SolanaARIOReadable, SolanaANTReadable, getAntRecordPDA,
} from '@ar.io/sdk';
import { fetchAssetV1 } from '@ar.io/solana-contracts/mpl-core';
import { getSetRecordInstructionAsync, parseSetRecordInstruction } from '@ar.io/solana-contracts/ant';
import {
  getSetComputeUnitLimitInstruction, getSetComputeUnitPriceInstruction,
} from '@solana-program/compute-budget';

const [action, stateDir, argument] = process.argv.slice(2);
assert(['prepare-signing', 'submit', 'status', 'verify'].includes(action) && stateDir && argument,
  'Usage: record-update.mjs prepare-signing|submit|status|verify state-directory target-id|signed-file');
const json = value => JSON.stringify(value,
  (_key, value) => typeof value === 'bigint' ? value.toString() : value, 2) + '\n';
const load = async file => JSON.parse(await readFile(file, 'utf8'));
const save = (file, value) => writeFile(file, json(value));
const plan = await load(join(stateDir, 'registration.plan.json'));
const rpc = createSolanaRpc(process.env.SOLANA_RPC_URL ?? 'https://api.mainnet-beta.solana.com');
const owner = address(plan.owner), asset = address(plan.ant);
const ario = new SolanaARIOReadable({ rpc, commitment: 'finalized' });
const ant = new SolanaANTReadable({ rpc, processId: asset, commitment: 'finalized' });
const decode = base64 => getTransactionDecoder().decode(Buffer.from(base64, 'base64'));

async function inspectState() {
  const [registration, nft, antOwner, controllers, root] = await Promise.all([
    ario.getArNSRecord({ name: plan.name }), fetchAssetV1(rpc, asset, { commitment: 'finalized' }),
    ant.getOwner(), ant.getControllers(), ant.getRecord({ undername: '@' }),
  ]);
  assert.equal(registration.processId, asset, 'Name points to a different ANT');
  assert.equal(registration.type, plan.type);
  assert.equal(nft.data.owner, owner, 'Asset owner changed');
  assert.equal(antOwner, owner, 'ANT owner differs');
  assert.deepEqual([...controllers].sort(), [owner], 'Controller permissions changed');
  assert(root, 'The root record is missing');
  return JSON.parse(json({ registration, assetOwner: nft.data.owner, antOwner, controllers, root }));
}

if (action === 'prepare-signing') {
  assert(/^[A-Za-z0-9_-]{43}$/.test(argument), 'Expected an Arweave manifest item ID');
  const before = await inspectState();
  assert.equal(before.root.transactionId, plan.rootRecord.transactionId,
    'Root no longer points to version 2; inspect the previous attempt before preparing another');
  assert.notEqual(argument, before.root.transactionId, 'The target has not changed');
  assert.equal(before.root.targetProtocol, 0);
  const after = { ...before.root, transactionId: argument };
  const [recordAddress] = await getAntRecordPDA(asset, '@');
  const { value: accountBefore } = await rpc.getAccountInfo(recordAddress, {
    encoding: 'base64', commitment: 'confirmed',
  }).send();
  assert(accountBefore, 'Root account is missing');
  const update = await getSetRecordInstructionAsync({
    asset, record: recordAddress, caller: createNoopSigner(owner),
    undername: '@', target: after.transactionId, targetProtocol: 0,
    ttlSeconds: after.ttlSeconds, priority: null, recordOwner: null,
  }, { programAddress: ARIO_ANT_PROGRAM_ID });
  const instructions = [
    getSetComputeUnitLimitInstruction({ units: 400_000 }),
    getSetComputeUnitPriceInstruction({ microLamports: BigInt(plan.priorityFeeMicroLamports) }),
    update,
  ];
  const { value: lifetime } = await rpc.getLatestBlockhash({ commitment: 'confirmed' }).send();
  const transaction = compileTransaction(pipe(createTransactionMessage({ version: 0 }),
    m => setTransactionMessageFeePayer(owner, m),
    m => setTransactionMessageLifetimeUsingBlockhash(lifetime, m),
    m => appendTransactionMessageInstructions(instructions, m)));
  const wire = getBase64EncodedWireTransaction(transaction);
  assert(Buffer.from(wire, 'base64').length <= 1232);
  const simulation = await rpc.simulateTransaction(wire, {
    encoding: 'base64', commitment: 'confirmed', sigVerify: false,
    accounts: { addresses: [recordAddress], encoding: 'base64' },
  }).send();
  assert.equal(simulation.value.err, null, json(simulation.value));
  const accountAfter = simulation.value.accounts?.[0];
  assert(accountAfter, 'Simulation did not return the root account');
  assert.equal(accountAfter.lamports, accountBefore.lamports, 'Unexpected record deposit change');
  assert.equal(Buffer.from(accountAfter.data[0], 'base64').length,
    Buffer.from(accountBefore.data[0], 'base64').length, 'Unexpected record size change');
  const { value: fee } = await rpc.getFeeForMessage(
    Buffer.from(transaction.messageBytes).toString('base64'), { commitment: 'confirmed' }).send();
  assert(fee !== null, 'Blockhash expired; prepare again');
  const attemptId = `record-${randomUUID()}`;
  const attemptDir = join(stateDir, 'attempts', attemptId);
  await mkdir(attemptDir, { recursive: true });
  const packet = {
    attemptId, phase: 'record', owner, ant: asset, name: plan.name,
    undername: '@', before, after, feeLamports: fee, recordDepositLamports: '0', lifetime,
    decodedInstruction: parseSetRecordInstruction(update),
    instructions: instructions.map(ix => ({
      programAddress: ix.programAddress,
      accounts: ix.accounts?.map(a => ({ address: a.address, role: AccountRole[a.role] })) ?? [],
      dataBase64: Buffer.from(ix.data).toString('base64'),
    })),
    transactionBase64: wire,
  };
  await save(join(attemptDir, 'prepared.json'), packet);
  await save(join(attemptDir, 'simulation.json'), simulation);
  await save(join(stateDir, 'signing', 'active.json'), packet);
  console.log(json({ attemptId, phase: packet.phase, name: plan.name, undername: '@',
    previousTarget: before.root.transactionId, target: after.transactionId,
    ttlSeconds: after.ttlSeconds, feeSOL: Number(fee) / 1e9,
    recordDepositSOL: 0, priceARIO: 0, lastValidBlockHeight: lifetime.lastValidBlockHeight }));
} else {
  const signed = await load(argument);
  assert(/^record-[0-9a-f-]{36}$/.test(signed.attemptId), 'Invalid record-update attempt ID');
  const attemptDir = join(stateDir, 'attempts', signed.attemptId);
  const prepared = await load(join(attemptDir, 'prepared.json'));
  assert.equal(prepared.owner, owner);
  assert.equal(prepared.ant, asset);
  const transaction = decode(signed.transactionBase64);
  assert.deepEqual(transaction.messageBytes, decode(prepared.transactionBase64).messageBytes,
    'Wallet changed the transaction; inspect it before submitting');
  assert.deepEqual(Object.keys(transaction.signatures), [owner], 'Expected only the owner signer');
  assert(transaction.signatures[owner] && await verifySignature(await getPublicKeyFromAddress(owner),
    transaction.signatures[owner], transaction.messageBytes), 'Invalid owner signature');
  const signature = getSignatureFromTransaction(transaction);
  await save(join(attemptDir, 'signed.json'), { ...signed, signature });
  console.log(`Transaction: https://solscan.io/tx/${signature}`);
  if (action === 'verify') {
    const current = await inspectState();
    assert.deepEqual(current.root, prepared.after, 'Root record does not match the intended update');
    const verification = { signature, name: plan.name, ant: asset, ...current };
    await save(join(attemptDir, 'verified.json'), verification);
    await save(join(stateDir, 'record-update.verified.json'), verification);
    console.log(json(verification));
    process.exit(0);
  }
  const readStatus = async () => {
    const response = await rpc.getSignatureStatuses([signature], { searchTransactionHistory: true }).send();
    await save(join(attemptDir, 'status.json'), response);
    return response.value[0];
  };
  let status = await readStatus();
  if (action === 'submit' && status === null) {
    const current = await inspectState();
    assert.deepEqual(current.root, prepared.before.root, 'Record changed since preparation');
    assert(await rpc.getBlockHeight({ commitment: 'confirmed' }).send()
      <= BigInt(prepared.lifetime.lastValidBlockHeight),
    'Blockhash expired. Check status and on-chain state before replacing the attempt.');
    const simulation = await rpc.simulateTransaction(signed.transactionBase64, {
      encoding: 'base64', commitment: 'confirmed', sigVerify: true,
    }).send();
    await save(join(attemptDir, 'signed-simulation.json'), simulation);
    assert.equal(simulation.value.err, null, json(simulation.value));
    const result = await rpc.sendTransaction(signed.transactionBase64, {
      encoding: 'base64', skipPreflight: false, preflightCommitment: 'confirmed', maxRetries: 5n,
    }).send();
    assert.equal(result, signature);
    await save(join(attemptDir, 'submission.json'), { signature, submittedAt: new Date().toISOString() });
    console.log('RPC accepted the update. Run status, then verify.');
  } else if (action === 'submit') {
    console.log(json(status));
  } else {
    for (let attempt = 0; attempt < 24; attempt++) {
      if (status?.confirmationStatus === 'finalized') break;
      console.log(status?.confirmationStatus ?? 'No status yet');
      await new Promise(resolve => setTimeout(resolve, 5000));
      status = await readStatus();
    }
    assert(status?.confirmationStatus === 'finalized', 'Not finalised yet; repeat status');
    const details = await rpc.getTransaction(signature, {
      commitment: 'finalized', encoding: 'json', maxSupportedTransactionVersion: 0,
    }).send();
    await save(join(attemptDir, 'transaction.json'), details);
    assert(details?.meta, 'Transaction details unavailable; repeat status');
    assert.equal(status.err, null, 'Transaction failed; inspect transaction.json');
    assert.equal(details.meta.err, null);
    console.log(json({ status: 'finalized', networkFeeSOL: Number(details.meta.fee) / 1e9,
      ownerDebitSOL: Number(details.meta.preBalances[0] - details.meta.postBalances[0]) / 1e9 }));
  }
}
EOF
```

The instruction uses `undername: '@'` for the base name and `targetProtocol: 0` for Arweave.
It preserves the existing TTL, priority, and any record owner; the `null` values for the latter two instruction arguments mean that those optional updates are not requested.

##### Sign and Submit One Update

If the local signing server was stopped at the end of the previous subsection, restart it in the background from the same Bash shell:

```bash
python3 -m http.server 8768 \
  --bind 127.0.0.1 \
  --directory "$native_arns_signing_dir" \
  > "$native_arns_state_dir/http-server.log" 2>&1 &
native_arns_http_pid=$!
```

If it is still running, keep using it instead of starting another copy.
Open [the local signing page](<http://127.0.0.1:8768/>), unlock Phantom, and run the earlier [wallet-connection block](#connect-the-browser-wallet-first) if the page has been reloaded.
Keep the signing block from [The Two Browser Blocks Used in Every Round](#the-two-browser-blocks-used-in-every-round) ready as well.
We will use a different inspection block below because this packet describes a record change rather than a purchase.

Define the shell function first.
As before, **calling this function arms automatic submission of the matching signed download**; defining it does not start an attempt.
It reuses `$native_arns_download_dir` if configured, otherwise defaults to `$HOME/Downloads`.
If the browser saves elsewhere, set `native_arns_download_dir` to that directory before calling the function.
The helper checks the directory before preparing the transaction and prints the exact file it will watch.

```bash
submit_arns_v3_update() {
  local download_deadline stage
  native_arns_download_dir="${native_arns_download_dir:-$HOME/Downloads}"
  if [[ ! -d "$native_arns_download_dir" ]]; then
    printf 'Download directory does not exist: %s\n' "$native_arns_download_dir" >&2
    return 1
  fi
  printf 'Using download directory: %s\n' "$native_arns_download_dir"

  SOLANA_RPC_URL="$solana_rpc_url" \
    node "$native_arns_tools_dir/record-update.mjs" \
      prepare-signing "$native_arns_state_dir" "$native_v3_manifest_id" || return

  jq -e '.phase == "record"' "$native_arns_signing_dir/active.json" >/dev/null || return
  native_arns_update_attempt="$(jq -er '.attemptId' "$native_arns_signing_dir/active.json")" || return
  native_arns_update_signed_file="$native_arns_download_dir/$native_arns_update_attempt.signed.json"
  printf 'Waiting for: %s\nLoad the fresh record packet, inspect it, and sign in the browser.\n' \
    "$native_arns_update_signed_file"

  download_deadline=$((SECONDS + 90))
  until jq -e --arg attempt "$native_arns_update_attempt" \
    '.attemptId == $attempt and (.transactionBase64 | type == "string")' \
    "$native_arns_update_signed_file" >/dev/null 2>&1; do
    if (( SECONDS >= download_deadline )); then
      printf 'No complete matching download received; nothing submitted.\n' >&2
      return 1
    fi
    sleep 0.2
  done

  for stage in submit status verify; do
    SOLANA_RPC_URL="$solana_rpc_url" \
      node "$native_arns_tools_dir/record-update.mjs" \
        "$stage" "$native_arns_state_dir" "$native_arns_update_signed_file" || return
  done
}
```

Read the browser steps below before starting, then run:

```bash
submit_arns_v3_update
```

Once the shell prints `Waiting for:`, load and inspect the new packet in the **browser's developer console**:

```javascript
var arnsPacket = await (await fetch('./active.json', { cache: 'no-store' })).json();
if (arnsPacket.owner !== arnsAccount.address) throw new Error('Owner mismatch');
if (arnsPacket.phase !== 'record') throw new Error('Expected a record-update packet');
console.log({
  attempt: arnsPacket.attemptId, phase: arnsPacket.phase,
  owner: arnsPacket.owner, name: arnsPacket.name, ant: arnsPacket.ant,
  undername: arnsPacket.undername,
  previousTarget: arnsPacket.before.root.transactionId,
  newTarget: arnsPacket.after.transactionId,
  targetProtocol: arnsPacket.after.targetProtocol,
  ttlSeconds: arnsPacket.after.ttlSeconds,
  networkFeeSOL: Number(arnsPacket.feeLamports) / 1e9,
  recordDepositSOL: Number(arnsPacket.recordDepositLamports) / 1e9,
  lastValidBlockHeight: arnsPacket.lifetime.lastValidBlockHeight,
});
```

Confirm the attempt identifier against the terminal, the name `weisser-zwerg-native`, its ANT `HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg`, and the change from the version 2 manifest to the version 3 manifest.
The undername must be `@`, the target protocol `0`, and the retained TTL `900` seconds in this experiment.
Then run the earlier **Request the owner's signature and download the result** block, approve in Phantom, and retain the generated `record-….signed.json` filename.
That signing block uses the freshly loaded `arnsPacket` without modification.

The shell picks up the download, submits it, waits for finalisation, and verifies the changed record.
The same short blockhash lifetime applies: downloading the signature does not restart the clock.
There are no `acl` or `attributes` rounds this time.

##### Verify the Changed Record

On success, inspect the independently retrieved result:

```bash
jq '{signature, name, ant, assetOwner, controllers, root}' "$native_arns_state_dir/record-update.verified.json"

# {
#   "signature": "4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF",
#   "name": "weisser-zwerg-native",
#   "ant": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "assetOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "controllers": [
#     "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
#   ],
#   "root": {
#     "transactionId": "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k",
#     "targetProtocol": 0,
#     "ttlSeconds": 900,
#     "priority": 0
#   }
# }
```

The `root.transactionId` should now be `$native_v3_manifest_id`, with the original TTL and other record settings preserved.
The helper also checks the name's ANT association, registration type, actual Metaplex owner, ANT owner, and controller list.
Its `status` output reports both the actual network fee and the owner's total SOL debit from the finalised transaction; for this update they should match.
The complete transaction is retained under `attempts/$native_arns_update_attempt/transaction.json`.
Refresh [the name's Console page](<https://console.ar.io/domains/weisser-zwerg-native>) to see the new target in its root record.

In my run, transaction [`4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF`](<https://solscan.io/tx/4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF>) finalised successfully.
Both the actual network fee and the owner's total debit were **0.000143989 SOL** (approximately **$0.0115** at the earlier snapshot of $79.76 per SOL), matching the quote.
No ARIO or additional account deposit was required.
The independent check confirmed the version 3 manifest as the root target, with the **900-second TTL**, ANT ownership, and controller list unchanged.

If submission or finalisation is uncertain, inspect the **same signed attempt** before preparing a replacement:

```bash
SOLANA_RPC_URL="$solana_rpc_url" \
  node "$native_arns_tools_dir/record-update.mjs" \
    status "$native_arns_state_dir" "$native_arns_update_signed_file"

# Transaction: https://solscan.io/tx/4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF
# {
#   "status": "finalized",
#   "networkFeeSOL": 0.000143989,
#   "ownerDebitSOL": 0.000143989
# }

# After successful finalisation, independently check the target again:
SOLANA_RPC_URL="$solana_rpc_url" \
  node "$native_arns_tools_dir/record-update.mjs" \
    verify "$native_arns_state_dir" "$native_arns_update_signed_file"

# Transaction: https://solscan.io/tx/4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF
# {
#   "signature": "4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF",
#   "name": "weisser-zwerg-native",
#   "ant": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "registration": {
#     "processId": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#     "startTimestamp": 1794556296000,
#     "undernameLimit": 10,
#     "purchasePrice": 2399385120,
#     "type": "lease",
#     "endTimestamp": 1826092296000
#   },
#   "assetOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "antOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "controllers": [
#     "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
#   ],
#   "root": {
#     "transactionId": "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k",
#     "targetProtocol": 0,
#     "ttlSeconds": 900,
#     "priority": 0
#   }
# }
```

These two commands submit nothing.
If the attempt expired without landing and the record still points to version 2, call `submit_arns_v3_update` again and sign its new packet.
After a successful update, a new preparation stops because the old-target check no longer matches; use `status` and `verify` to inspect the completed attempt.
The earlier `registration-flow.mjs verify` still checks the original version 2 target by design, so use the new helper for this step.

Stop the local signing server when finished:

```bash
kill "$native_arns_http_pid"
```

> **The same instruction can update an undername.**
> For `test_weisser-zwerg.ar.io`, use the ANT belonging to **`weisser-zwerg`**, [`GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ`](<https://solscan.io/account/GGT57TEiPiYkdzL3eN3zNSthTE2x5kvsqAuYEN2p2MfJ>), and `undername: 'test'` instead of `'@'`.
> Derive its record PDA from that ANT and `test`, then set the target with the same instruction, signed by an authorised owner or controller.
> Using `test` with the new ANT would instead address `test_weisser-zwerg-native.ar.io`.
> Updating an existing undername's same-sized target needs no new registration or ARIO payment; creating a missing record may require a SOL account deposit and must respect the name's undername allowance.
> The helper above is intentionally limited to the new name's existing root record. Adapting it to an undername also requires changing its state checks and record lookup, not merely its displayed URL.
> This walkthrough leaves `test_weisser-zwerg` pointing to version 2.

At this point, successful finalisation and verification establish that the on-chain name points to version 3.
Gateway caches and discovery of the manifest inside its native bundle are separate concerns: a correct name update does not itself make a gateway index that bundle.
The next subsection will check name resolution and website retrieval.

#### Verify Name Resolution and Website Retrieval

The transaction is finalised, but that alone does not establish that a reader can open the website.
We need to check three things separately: the on-chain record, a gateway's resolution of that name, and retrieval of the HTML and CSS through the resulting manifest.
This returns to the distinction discussed in [Gateway Discovery and the Limits of Automatic Routing](#gateway-discovery-and-the-limits-of-automatic-routing).

##### Check the On-Chain Target and the Gateway's Answer

First, repeat the preceding helper's read-only verification using the successful update's signed file:

```bash
SOLANA_RPC_URL="$solana_rpc_url" \
  node "$native_arns_tools_dir/record-update.mjs" \
    verify "$native_arns_state_dir" "$native_arns_update_signed_file"

# Transaction: https://solscan.io/tx/4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF
# {
#   "signature": "4megKn4rStBUQ7yzujokQwaPsd3mmvb6femkiTXys4nuMvRD8rE9oWRNtad2wnUpd2HRYUakqqLbfMdV7JZmngaF",
#   "name": "weisser-zwerg-native",
#   "ant": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "registration": {
#     "processId": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#     "startTimestamp": 1794556296000,
#     "undernameLimit": 10,
#     "purchasePrice": 2399385120,
#     "type": "lease",
#     "endTimestamp": 1826092296000
#   },
#   "assetOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "antOwner": "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ",
#   "controllers": [
#     "BT7MoVsngJrJGKe9LztNk2y5rmJqx176DDhoztfVuBoZ"
#   ],
#   "root": {
#     "transactionId": "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k",
#     "targetProtocol": 0,
#     "ttlSeconds": 900,
#     "priority": 0
#   }
# }

native_arns_name="$(jq -er '.name' "$native_arns_state_dir/registration.plan.json")"
native_arns_ant_id="$(jq -er '.ant' "$native_arns_state_dir/registration.plan.json")"
native_v3_manifest_id="$(jq -er '.id' "$publication_state_dir/native-v3/manifest.ans104.json")"
native_arns_retrieval_dir="$native_arns_state_dir/retrieval-v3"
install -d -- "$native_arns_retrieval_dir"

jq -e --arg target "$native_v3_manifest_id" \
  '.root.transactionId == $target and .root.targetProtocol == 0 and .root.ttlSeconds == 900' \
  "$native_arns_state_dir/record-update.verified.json"
# true
```

In my run, the record belonged to the expected ANT and owner, and its root pointed to `k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k` with a TTL of 900 seconds.
Now ask Turbo's gateway what it thinks the name means:

```bash
curl --fail --silent --show-error --max-time 30 --output "$native_arns_retrieval_dir/turbo-resolution.json" "https://turbo-gateway.com/ar-io/resolver/$native_arns_name"

jq '{txId, antId, ttlSeconds}' "$native_arns_retrieval_dir/turbo-resolution.json"
# {
#   "txId": "k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k",
#   "antId": "HECnBBiMkbqbKkUh9DixxyBkNLSKfTBF7DT81N3CbUXg",
#   "ttlSeconds": 900
# }

jq -e --arg target "$native_v3_manifest_id" --arg ant "$native_arns_ant_id" '.txId == $target and .antId == $ant' "$native_arns_retrieval_dir/turbo-resolution.json"
# true
```

The [resolver response](<https://turbo-gateway.com/ar-io/resolver/weisser-zwerg-native>) was correct.
Nevertheless, opening [the name through Turbo](<https://weisser-zwerg-native.turbo-gateway.com/>) returned `404`.
The gateway knew which manifest it needed but could not retrieve it.
Changing the name's target again would not address that failure.

##### Compare the Gateway Results

I tested both access paths: the immutable manifest ID and the ArNS name.
Where the website loaded, I also downloaded its stylesheet and compared both files with the local originals.
These were the results today:

<table class="article-table">
  <thead>
    <tr><th>Gateway domain</th><th>Version 3 by immutable ID</th><th>Version 3 through the ArNS name</th></tr>
  </thead>
  <tbody>
    <tr><td><code>ar.io</code></td><td>Not tested through the apex website</td><td><a href="https://weisser-zwerg-native.ar.io/">Name URL</a>: an unstyled version 2 page or <code>404</code>; later requests returned <code>404</code> with the correct version 3 target in the headers</td></tr>
    <tr><td><code>turbo-gateway.com</code></td><td><a href="https://turbo-gateway.com/raw/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k">Manifest item</a>: <code>404</code></td><td><a href="https://weisser-zwerg-native.turbo-gateway.com/">Name URL</a>: HTML and stylesheet requests returned <code>404</code>, despite correct name resolution</td></tr>
    <tr><td><code>arweave.net</code></td><td><a href="https://arweave.net/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Manifest website</a>: HTML and CSS returned <code>200</code> and matched the local files</td><td><a href="https://weisser-zwerg-native.arweave.net/">Name URL</a>: <code>404</code></td></tr>
    <tr><td><code>perma.online</code></td><td><a href="https://perma.online/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Manifest website</a>: HTML and CSS returned <code>200</code> and matched</td><td><a href="https://weisser-zwerg-native.perma.online/">Name URL</a>: HTML and CSS returned <code>200</code> and matched</td></tr>
    <tr><td><code>frostor.xyz</code></td><td><a href="https://frostor.xyz/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Manifest website</a>: HTML and CSS returned <code>200</code> and matched</td><td><a href="https://weisser-zwerg-native.frostor.xyz/">Name URL</a>: HTML and CSS returned <code>200</code> and matched</td></tr>
    <tr><td><code>aoweave.tech</code></td><td><a href="https://aoweave.tech/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Manifest URL</a>: <code>200</code>, but a JSON response containing the manifest instead of the website</td><td><a href="https://weisser-zwerg-native.aoweave.tech/">Name URL</a>: the same JSON response, despite resolving to the correct manifest</td></tr>
  </tbody>
</table>

The [corresponding resolver endpoint at `arweave.net`](<https://arweave.net/ar-io/resolver/weisser-zwerg-native>) also returned `404`.
That establishes that this name-access path failed during my tests; it does not establish why, or that the gateway cannot serve ArNS names in general.
Its successful manifest URL independently demonstrated that it could retrieve this publication's files.

Turbo could still retrieve [the original CSS object directly](<https://turbo-gateway.com/raw/AXKDPYfrfbDIZCWHsThDWiQ45yykp9Kr4U7XAG-cU4Q>), returning `200`.
The CSS had not disappeared.
Retrieving `/style.css` through the name first requires the manifest's path mapping, so a missing manifest can prevent access even to a stylesheet that the gateway already has.

A further test through `aoweave.tech` showed another distinct behaviour: both URLs returned **HTTP 200** with `Content-Type: application/json`, displaying JSON instead of the page.
More precisely, the response was an object containing the manifest as a JSON string in its `body` field, alongside metadata such as `raw-id` and `commitments`.
That nested manifest matched my original **362 bytes** exactly, and the named response's `x-arns-resolved-id` identified the correct version 3 manifest.
Here the name resolved and the manifest data was available, but the gateway did not use the manifest's `index.path` to serve `index.html` at the tested URLs.
The cause of that behaviour remains unestablished; it is a different failure from being unable to retrieve the manifest at all.
It also illustrates why **HTTP 200 alone is insufficient** for this check: the returned representation must be the expected HTML or CSS, which the byte comparisons below verify.

##### Caches, Shared Infrastructure, and Wayfinder

When I first opened [weisser-zwerg-native.ar.io](<https://weisser-zwerg-native.ar.io/>), I alternated between an unstyled page and `Not found`.
The unstyled page actually said **version 2**.
The subsequent HTTP checks exposed mixed cached state:

```text
Root page: HTTP 404
x-arns-resolved-id: k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k

Stylesheet, first check: HTTP 200
x-arns-resolved-id: nieQ6Foe7yWBqtRJKmf0b_vEOYD8k4FWQOohfmrzzNQ
x-cache-status: STALE

Stylesheet, later check: HTTP 404
x-arns-resolved-id: k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k
```

To inspect the current responses yourself, retain both the headers and bodies.
This diagnostic deliberately omits `curl --fail` so a `404` response can be examined; it is not a successful website check merely because `curl` completes:

```bash
for resource in index style; do
  case "$resource" in
    index) path="" ;;
    style) path="style.css" ;;
  esac
  curl --silent --show-error --location --max-time 30 \
    --dump-header "$native_arns_retrieval_dir/ario-$resource.headers" \
    --output "$native_arns_retrieval_dir/ario-$resource.body" \
    --write-out "$resource: HTTP %{http_code}\n" \
    "https://$native_arns_name.ar.io/$path"
  rg -i '^HTTP/|^content-type:|^x-arns-resolved-id:|^x-arns-ttl-seconds:|^cache-control:|^x-cache' \
    "$native_arns_retrieval_dir/ario-$resource.headers"
done
```

The HTML and stylesheet are separate requests, and browser, proxy, and gateway caches can retain different responses.

The 900-second TTL permits caching of the name's resolution; it is not a promise that all delivery layers switch versions simultaneously after exactly 15 minutes.
Inspect the returned target and cache headers instead of assuming that a reload necessarily reaches current on-chain state.
The [gateway troubleshooting documentation](<https://docs.ar.io/build/run-a-gateway/manage/troubleshooting>) also distinguishes stale cached data from the expected current result.
Once a response identifies the correct version 3 manifest but returns `404`, however, waiting for the name cache alone does not solve the manifest-retrieval problem.

> **I expected `.ar.io` to select a working gateway automatically.**
> I initially imagined it as a load balancer in front of the gateway network, selecting a gateway able to serve the requested publication.
> The observations did not support that expectation.
> Both `weisser-zwerg-native.ar.io` and `weisser-zwerg-native.turbo-gateway.com` resolved to the same two IP addresses, `162.55.156.39` and `49.13.45.141`, and both exhibited the retrieval failure.
> For these tested hostnames, `.ar.io` looked like an alternative address-an "alias" in the practical sense-for Turbo's gateway infrastructure.

The DNS comparison can be repeated with:

```bash
dig +short "$native_arns_name.ar.io" A | sort
dig +short "$native_arns_name.turbo-gateway.com" A | sort
# Both returned the same set:
# 162.55.156.39
# 49.13.45.141
```

The Wayfinder browser extension did not resolve the problem either.
Entering `ar://weisser-zwerg-native` redirected me to [weisser-zwerg-native.turbo-gateway.com](<https://weisser-zwerg-native.turbo-gateway.com/>), which failed to display the publication.
As explained in the [earlier routing analysis](#gateway-discovery-and-the-limits-of-automatic-routing), the tested extension chose a gateway and redirected there, but did not recover from that content `404` by trying another one.
A responsive gateway is not necessarily a gateway that can serve the particular manifest and all its files.

##### Retrieve the Complete Website Through Working Gateways

I therefore opened the [gateway directory](<https://gateways.ar.io/#/gateways>) and tried another gateway manually.
Both the manifest URL and the name URL worked through `perma.online`; I then repeated the experiment successfully through `frostor.xyz`.
The first request through `perma.online` took noticeably longer, while later requests were fast and reported `x-cache: HIT`.

To repeat the byte comparisons, keep the local `index.html` at version 3 and use the saved version 2 stylesheet as the unchanged reference.
The following block retrieves both files through both URL forms on each working gateway, retaining the response headers as well:

```bash
(
  set -e
  rg -q -F 'This is version 3 ' "$site_dir/index.html"
  cmp -- "$v2_source_dir/style.css" "$site_dir/style.css"

  for gateway in perma.online frostor.xyz; do
    for route in manifest name; do
      case "$route" in
        manifest) base="https://$gateway/$native_v3_manifest_id/" ;;
        name) base="https://$native_arns_name.$gateway/" ;;
      esac
      output_dir="$native_arns_retrieval_dir/$gateway/$route"
      install -d -- "$output_dir"

      curl --fail --silent --show-error --location --max-time 60 \
        --dump-header "$output_dir/index.headers" \
        --output "$output_dir/index.html" "$base"
      cmp -- "$site_dir/index.html" "$output_dir/index.html"

      curl --fail --silent --show-error --location --max-time 60 \
        --dump-header "$output_dir/style.headers" \
        --output "$output_dir/style.css" "${base}style.css"
      cmp -- "$v2_source_dir/style.css" "$output_dir/style.css"

      if [[ "$route" == name ]]; then
        for headers in "$output_dir/index.headers" "$output_dir/style.headers"; do
          tr -d '\r' < "$headers" | \
            rg -q -i "^x-arns-resolved-id: $native_v3_manifest_id$"
        done
      fi
      printf '%s via %s: HTML and CSS match version 3\n' "$gateway" "$route"
    done
  done
)
# perma.online via manifest: HTML and CSS match version 3
# perma.online via name: HTML and CSS match version 3
# frostor.xyz via manifest: HTML and CSS match version 3
# frostor.xyz via name: HTML and CSS match version 3
```

All eight file requests returned `200`: the HTML contained **464 bytes** and the CSS **422 bytes**, with every download matching its local reference byte-for-byte.
The named responses also identified the intended version 3 manifest.
These comparisons establish agreement with the local files; they do not replace cryptographic verification of Arweave storage proofs.
In these checks, the gateways reported `x-ar-io-verified: false`, despite delivering the correct bytes.

Open the [named website through `perma.online`](<https://weisser-zwerg-native.perma.online/>) and [through `frostor.xyz`](<https://weisser-zwerg-native.frostor.xyz/>) in a browser as well.
Both should show the styled **version 3** page.

This completed the direct-payment experiment: native AR paid for the bundled publication, ARIO paid for the name, and SOL paid for its registration transactions and later target update.
The name and publication worked together through two gateway domains, without uploading another copy or changing the target again.

What remained unresolved in these tests was reliable access through the default `.ar.io` address and automatic Wayfinder selection: working alternatives existed, but I had to find them manually.

##### Gateway Behaviour Overview

I extended the test to all **25 distinct gateway domains** shown in [gateway directory](<https://gateways.ar.io/#/gateways>).
I requested the version 3 website's root and `style.css` through both its manifest ID and its ArNS name on every gateway.

**Website** means that both requests returned HTTP 200 with the expected content types and exactly the original HTML and CSS bytes.
**JSON wrapper** means HTTP 200 containing the manifest inside a `body` field, as described above: even requesting `style.css` returned that manifest wrapper instead of the stylesheet.
The links in the table open each gateway's root URL for the corresponding access path.

<table class="article-table">
  <thead>
    <tr><th>Gateway domain</th><th>By manifest ID</th><th>Through the ArNS name</th></tr>
  </thead>
  <tbody>
    <tr><td><code>turbo-gateway.com</code></td><td><a href="https://turbo-gateway.com/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">404</a></td><td><a href="https://weisser-zwerg-native.turbo-gateway.com/">404</a></td></tr>
    <tr><td><code>perma.online</code></td><td><a href="https://perma.online/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.perma.online/">Website</a></td></tr>
    <tr><td><code>vilenarios.com</code></td><td><a href="https://vilenarios.com/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.vilenarios.com/">Website</a></td></tr>
    <tr><td><code>vevivo.art</code></td><td><a href="https://vevivo.art/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.vevivo.art/">JSON wrapper</a></td></tr>
    <tr><td><code>ar.mrx.im</code></td><td><a href="https://ar.mrx.im/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.ar.mrx.im/">Website</a></td></tr>
    <tr><td><code>ariospeedwagon.com</code></td><td><a href="https://ariospeedwagon.com/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">530 (1033)</a></td><td><a href="https://weisser-zwerg-native.ariospeedwagon.com/">530 (1033)</a></td></tr>
    <tr><td><code>ario.ionode.top</code></td><td><a href="https://ario.ionode.top/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.ario.ionode.top/">404 → JSON wrapper</a></td></tr>
    <tr><td><code>gatewaypie.com</code></td><td><a href="https://gatewaypie.com/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.gatewaypie.com/">Website</a></td></tr>
    <tr><td><code>gt1.exnihilio.eu</code></td><td><a href="https://gt1.exnihilio.eu/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.gt1.exnihilio.eu/">JSON wrapper</a></td></tr>
    <tr><td><code>frostor.xyz</code></td><td><a href="https://frostor.xyz/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.frostor.xyz/">Website</a></td></tr>
    <tr><td><code>arweave.fllstck.dev</code></td><td><a href="https://arweave.fllstck.dev/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.arweave.fllstck.dev/">404 → 502</a></td></tr>
    <tr><td><code>arweave.tokyo</code></td><td><a href="https://arweave.tokyo/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.arweave.tokyo/">Website</a></td></tr>
    <tr><td><code>gt5.exnihilio.eu</code></td><td><a href="https://gt5.exnihilio.eu/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.gt5.exnihilio.eu/">JSON wrapper</a></td></tr>
    <tr><td><code>ario.dogar.dev</code></td><td><a href="https://ario.dogar.dev/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Connection failed</a></td><td><a href="https://weisser-zwerg-native.ario.dogar.dev/">Connection failed</a></td></tr>
    <tr><td><code>dirtydeedsdonedirtcheap.site</code></td><td><a href="https://dirtydeedsdonedirtcheap.site/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.dirtydeedsdonedirtcheap.site/">JSON wrapper</a></td></tr>
    <tr><td><code>ar.tinnguyen.xyz</code></td><td><a href="https://ar.tinnguyen.xyz/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Timed out</a></td><td><a href="https://weisser-zwerg-native.ar.tinnguyen.xyz/">Timed out</a></td></tr>
    <tr><td><code>ar.anyone.tech</code></td><td><a href="https://ar.anyone.tech/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.ar.anyone.tech/">404</a></td></tr>
    <tr><td><code>oshvank.site</code></td><td><a href="https://oshvank.site/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.oshvank.site/">JSON wrapper</a></td></tr>
    <tr><td><code>ark.innostack.xyz</code></td><td><a href="https://ark.innostack.xyz/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.ark.innostack.xyz/">JSON wrapper</a></td></tr>
    <tr><td><code>ario.zigza.xyz</code></td><td><a href="https://ario.zigza.xyz/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.ario.zigza.xyz/">JSON wrapper</a></td></tr>
    <tr><td><code>tekin86.site</code></td><td><a href="https://tekin86.site/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.tekin86.site/">JSON wrapper</a></td></tr>
    <tr><td><code>arh.oohgroup.vn</code></td><td><a href="https://arh.oohgroup.vn/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">Website</a></td><td><a href="https://weisser-zwerg-native.arh.oohgroup.vn/">Website</a></td></tr>
    <tr><td><code>aoweave.tech</code></td><td><a href="https://aoweave.tech/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.aoweave.tech/">JSON wrapper</a></td></tr>
    <tr><td><code>umutdogan.me</code></td><td><a href="https://umutdogan.me/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.umutdogan.me/">404</a></td></tr>
    <tr><td><code>derad.network</code></td><td><a href="https://derad.network/k-MpMTWVE-3OlzQxdUWIPj1Aoj4pSMcks61n2Kv469k/">JSON wrapper</a></td><td><a href="https://weisser-zwerg-native.derad.network/">JSON wrapper</a></td></tr>
  </tbody>
</table>

I followed HTTPS redirects with certificate validation enabled and allowed up to 45 seconds per request.
Failed requests were repeated once; an arrow records a changed result on that repeat.
The `530` responses contained Cloudflare's error code `1033`; `ario.dogar.dev` could not be reached on HTTPS, while `ar.tinnguyen.xyz` did not complete retrieval within the timeout.

**Seven of the 25 gateways delivered the complete website through both access paths.**
`ar.anyone.tech` additionally served it by manifest ID, but returned `404` through the name.
The remaining results show why reaching a gateway, resolving a name, and serving a manifest as a website must be checked separately.
This is a snapshot for this particular publication from my connection, not a general uptime ranking or a guarantee of future behaviour.
