---
layout: "layouts/post-with-toc.njk"
title: "Ethereum Swarm from First Principles: Immutable Data, Postage Stamps, and Mutable Feeds"
description: "Publishing a website on Swarm by foot, with postage funding, signed feeds, public gateways, and a comparison with Arweave"
seodescription: "A concise introduction to Ethereum Swarm: immutable content, postage stamps, mutable feeds, and how its storage lifetime differs from Arweave."
creationdate: 2026-11-28
keywords: Ethereum Swarm, Swarm, independent publishing, decentralized storage, content addressing, immutable data, postage stamps, storage retention, mutable feeds, Bee, Gnosis Chain, public gateways, censorship resistance, Arweave, AR.IO
date: 2026-11-28
tags: ['post']
---

## Rationale

In [Arweave and AR.IO from First Principles](../publishing-arweave-ario-basics/), we explored a system designed to fund indefinite data retention through a storage endowment.
[Ethereum Swarm](<https://www.ethswarm.org/>) offers another approach to decentralized file storage, with a different answer to how long uploaded content remains available.

The crucial distinction is between **immutable content and permanent availability**.
A content hash continues to identify the same bytes, but it does not ensure that anyone still stores them.
Swarm's [postage stamps](<https://docs.ethswarm.org/docs/concepts/incentives/postage-stamps/>) fund storage through a prepaid batch balance that decreases over time.
That balance can be topped up; when it is exhausted, nodes can remove the associated data.
Persistent identifiers therefore need continuing arrangements for retention.

Swarm also provides [feeds](<https://docs.ethswarm.org/docs/develop/tools-and-features/feeds/>): signed updates that let a stable reference point to successive versions of content.
This follows the [Clojure atom analogy in the Arweave article](../publishing-arweave-ario-basics/#what-a-publishing-tool-could-automate): a stable mutable reference identifies the current immutable revision.
Updating the feed changes which revision is current without modifying the earlier content.
Keeping those earlier revisions retrievable remains a separate concern that still requires storage funding.

Building on the Arweave article, we will explore Swarm by foot: how to upload and retrieve a file, fund its retention, and publish updates through a feed.

## Before we start ...

... we have to talk about some of the concepts. Swarm differs from Arweave in many ways.
In some ways, Arweave was simple: we dealt with files and paid according to the total uploaded file size, with the expectation that the files would remain available "forever".

I want to structure the differences and peculiarities of Swarm into a few sections:

* Payment aspects
* Storage aspects
* Blockchains and tokens involved
* Identities involved

### Payment in Batches

#### Stamp Batches

The first thing to notice in the Swarm world is that you pay in batches.
You can picture a batch as a booklet of vouchers.

> The vouchers in the Swarm world are called "stamps".

You sometimes find booklets of vouchers for restaurants in your area offering two-for-one meals: if you show the voucher, you pay for one meal and get the other one for free.
But you have to buy the whole booklet. You then choose which vouchers to use, and many will expire unused.

#### Batch Depth

This is also how Swarm batches work. You buy a batch with a so-called "depth", which is related to the number of vouchers as follows:

```text
D = 16 + d,  d >= 1

N = 2^D
  = 2^(16 + d)
  = 2^16 * 2^d
    |      |
    |      +-- stamps per bucket
    +--------- buckets
```

#### Stamp Assignment by Content Address Lottery

And here comes the next peculiarity: you cannot freely choose which vouchers to use, as you can in the restaurant example above, where you choose which restaurant to visit.
Instead, the vouchers are chosen by the data you store.

We will return to this in the next section, but Swarm stores data in chunks of 4 KB in a content-addressed way.
For example, if you store a 500-byte HTML file, it goes into a 4 KB chunk, even though most of it will be "wasted".
The address of that chunk will be its "content address", i.e. the hash of its content.

> If you have a file that is larger than 4 KB, it will be split into chunks.

You then use the first 16 bits of that content address to choose the voucher within the batch that pays for it.

#### Minimum Batch Size and Batch Buckets

And here comes the next peculiarity: you can imagine the vouchers arranged with 2^16 positions along the x-axis and 2^d positions along the y-axis.
In the smallest batch you can buy, the y-axis has two positions, because the minimum value of d is 1, giving 2^d = 2.
You can therefore picture the batch as 2^16 groups called buckets, each containing 2^d vouchers. In our minimum example, that is two vouchers per bucket.

> These batches come in two versions: immutable or mutable.
> We'll talk about that further below.

```txt
Minimum batch: D = 17, d = 1

Stamp slots per bucket (y)
  ^
  |        +--------+--------+--------+     +--------+
  | slot 1 |        |        |        | ... |        |
  |        +--------+--------+--------+     +--------+
  | slot 0 |        |        |        | ... |        |
  |        +--------+--------+--------+     +--------+
  +-----------------------------------------------------> Buckets (x)
              0000     0001     0002    ...    ffff
                  First 16 content-address bits (hex)

Each box is one stamp slot.

Columns: 2^16 = 65,536 buckets
Rows:    2^d  = 2 stamp slots per bucket
Total:   2^17 = 131,072 stamp slots
```

If you then have two chunks whose content addresses share the same first 16 bits, the bucket is full, and you have to decide whether to increase the depth (which costs money) or change the content address.

> Changing the content address of a text file, such as an HTML file, is quite easy. You simply add a comment somewhere, changing the content and therefore its address.
>
> We will return to this in the next section, but Swarm feels much more like a block device than a file system, as though the file system layer is missing.
> There are projects that address this, as you can read here: [Compact postage batch usage with chunks optimization](https://github.com/ethersphere/bee/issues/5009).
> This issue describes a "Swarm file system" called [swarm-sdk-dotnet](https://github.com/Etherna/swarm-sdk-dotnet) used to implement [etherna.io](<https://etherna.io>), which advertises itself as:<br>
> Etherna makes accessing decentralized data easy, from the very first video platform based on Swarm, to a decentralized S3 adapter and Swarm Gateway as a Service.

#### Content Address Lottery and Collision Probability

At first, I thought this would be a minor issue for a small static website. I checked my own [weisser-zwerg.dev](https://weisser-zwerg.dev) blog: after seven years, it comprises 274 files.
For 274 distinct chunks, the likelihood of more than two falling into the same bucket is only 0.079%; here is how the risk grows with the chunk count.
The actual chunk count can exceed the file count because of file sizes, manifests, and redundancy.

| Distinct chunks in one publication | Probability that some bucket needs more than two indices |
| ---: | ---: |
| 274 | 0.079% |
| 1,000 | 3.75% |
| 5,000 | 98.99% |

As the number of chunks you want to store grows, running out of payment vouchers due to this artificial bucketing arrangement becomes a near certainty, even before hitting the theoretical maximum of 2¹⁷ chunks (131,072 stamp slots).

#### What Buying a Batch Means

In principle, the smallest booklet of vouchers covers 2¹⁷ chunks of 4 KB each, i.e. 512 MB. But as in the restaurant example, many vouchers will usually go unused.
The booklet of vouchers is nevertheless the payment unit.

> Each bucket has its own vouchers.
> Spare vouchers in one bucket cannot pay for chunks assigned to another.
> In our minimum batch, only two chunks per bucket can remain funded by that batch at the same time, even if most vouchers elsewhere remain unused.
> Increasing the depth by one doubles the stamp slots in every bucket while keeping the same batch ID.
> This is called [dilution](<https://docs.ethswarm.org/docs/develop/tools-and-features/buy-a-stamp-batch/#dilute-your-batch>): the remaining credit is spread across twice as many slots, roughly halving the estimated remaining lifetime at unchanged storage rent.
> Keeping the previous estimated lifetime therefore requires a top-up.

> These booklets of vouchers cannot be "canceled", and their remaining value cannot be transferred.
> This fits the restaurant voucher example above, where the booklets are typically valid for one year.
> These booklets are valid for a period of time (we'll explain that below). Before that time runs out, you can "top up" your batch to extend it or let it expire.
> When it expires, storage providers are allowed to drop the data it covers.

#### Batch Payment per Duration

Now let's look at payment over time.
You may want to pay for the storage of your website for one year, but you pay according to a "usage rate".
Swarm charges per Gnosis block. Gnosis is the underlying Ethereum-compatible layer-1 blockchain (we'll explain that further below), with a block generated every five seconds.
You pay in the ERC-20 token xBZZ (also called BZZ) on Gnosis Chain.

> **A "funded" batch has prepaid storage credit in xBZZ.**
> Think of it as stored value: every Gnosis block, roughly every five seconds, consumes some credit at the [storage price](<https://docs.ethswarm.org/docs/concepts/incentives/postage-stamps/>) applicable to that block.
> The charge covers all stamp slots in the batch, including unused ones.
> The batch's estimated remaining lifetime is how long its credit would last at the current rate; a price change alters that estimate.
> A top-up adds credit. When the credit is exhausted, the batch expires and nodes may remove the associated data.

> **Credit consumption starts when the purchase transaction creates the batch on-chain.**
> It does not wait for the first stamp to be used or the first file to be uploaded.
> If you buy a batch long before you upload anything, its credit is already being consumed during that wait. An entirely unused batch can even expire.

We will look at this further below, but you will operate a local `bee` node as an API gateway into the Swarm world. You can ask it for the current price:

```bash
curl -fsS "$BEE_URL/chainstate" | jq '{currentPrice, block, chainTip}'
```

`currentPrice` is expressed in PLUR per chunk per Gnosis block. One xBZZ equals 10¹⁶ PLUR.

Historical rent is available directly from Swarmscan's index of accepted postage-contract price updates:

```bash
# https://api.swarmscan.io/v1/events/postage-stamp/price-update
rent_history_url='https://api.swarmscan.io/v1/events/postage-stamp/price-update'

curl -fsS "$rent_history_url" | jq '.events[:10][] | {time: .blockTime, block: .blockNumber, pricePLUR: .data.price}'
```

If you want to pay for one year, you can only estimate the cost based on the current price, perhaps also taking historical prices into account.
The actual lifetime of your batch depends on the rate set by Swarm's storage-price oracle, which adjusts storage charges in BZZ.

#### Immutable vs. Mutable Batches

As mentioned earlier, these batches come in mutable and immutable versions.

With an immutable batch at the minimum depth of 17, meaning two slots per bucket, Bee's [local allocator](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/stampissuer.go>) stops issuing new indices when a bucket is full.
With its bookkeeping intact, Bee therefore refuses a third distinct chunk whose content address shares that bucket's first 16 bits.
Your options are to change a chunk's content address, if possible (for example, by adding a comment to an HTML file), increase the depth and pay more for the batch, or use another batch.

With a mutable batch, Bee instead cycles through the bucket's indices and reuses a slot.
The old chunk loses that slot's backing and may disappear, while the new chunk is funded by it.
This distinction concerns the uploader's allocation policy; immutable mode does not protect against conflicting assignments produced after losing or rolling back those counters.

### Storage in Chunks

Now let's look at the storage side of things.
Swarm splits file data into chunks with payloads of up to **4 KiB (4,096 bytes)**.
The chunk is its basic storage unit, which is why the underlying layer feels more like a block device than a file system.

**Bee** is the node software used to join Swarm's [peer-to-peer storage network](<https://docs.ethswarm.org/docs/concepts/introduction/>).
Chunks are stored on the disks of participating storage nodes and exchanged between peers.
Our local Bee node provides the entry point for uploading and retrieving files.
File contents, manifests, and signed feed updates are stored and exchanged through this network; these objects are not stored in Ethereum or Gnosis blocks.

Ordinary data chunks are **content-addressed**: their addresses are derived from their content.
For our unencrypted uploads, splitting and encoding the same file in the same way produces the same chunk addresses again.
Uploading those bytes again is therefore a "no-op" for content addressing, e.g. does nothing on the storage level.
It may still have an effect at the payment level (see below).

This differs from [Arweave's transaction and data-item identifiers](../publishing-arweave-ario-basics/#why-identical-files-can-have-different-arweave-ids).
There, files are carried in signed transactions or bundled data items, whose identifiers belong to those signed objects.
Two separately signed uploads can therefore contain identical file bytes but have different IDs.
That was one of my surprises with Arweave: I had expected content hashes to identify files directly.

For an evolving website, Swarm makes reuse simpler.
If we change only `index.html` and upload the directory again with the same settings, the unchanged `style.css` retains its content reference.
Our Bee node builds a new immutable [manifest](<https://docs.ethswarm.org/docs/develop/tools-and-features/manifests/>) for the revised directory, referring to the changed HTML and the unchanged CSS.
We do not need to look up an earlier upload ID to recover the stylesheet's identity; its content determines that reference.

The [analogy with Clojure's persistent data structures from the Arweave article](../publishing-arweave-ario-basics/#what-a-publishing-tool-could-automate) still applies.
Successive immutable manifests share unchanged file data, while a **feed** holds the reference to the current revision.
Publishing an update moves that "head" reference forward without modifying the earlier revision.

> **Content reuse and storage funding remain separate.**
> Re-uploading a file can still resend its chunks and attach postage stamps, even though the data keeps the same addresses.
> This carries the risk of paying twice for the same data!

> A content address alone does not guarantee continued availability: the chunk also needs a valid postage stamp.
> Each chunk needs valid postage backing; otherwise, it may be discarded.
> In a mutable batch, recycling a stamp index can remove an older chunk's backing even if the current manifest still references it.

#### How Storage Nodes Enforce Stamp Usage

A signed stamp binds a chunk address to a batch, bucket/index, and timestamp.
The stamp travels with the chunk through Swarm; issuing it requires no blockchain transaction.
Receiving storage nodes maintain a [local index](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/storer/internal/stampindex/stampindex.go>) mapping **batch ID + stamp index → chunk address and timestamp**.

Suppose we stamp chunk A, then a different chunk B using the same batch/index.
The bucket restriction directs both chunks toward the same region of the network, where storage nodes can detect the conflict.
In Bee 2.8.3, the [receiving node's reserve](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/storer/internal/reserve/reserve.go>) replaces the older assignment when the incoming stamp has a newer timestamp; an older or equal conflicting assignment is rejected.
More signatures therefore do not give both chunks independent backing from that index.

> **This conflict handling applies regardless of the batch's immutable flag.**
> Immutable mode stops Bee's normal allocator from recycling a full bucket; it does not make a stale local allocation history safe.
> Reusing an index after restoring an old backup can displace an earlier chunk's backing even with an immutable batch.

#### Redundancy: MEDIUM, STRONG, and Beyond

Swarm distributes chunks across storage nodes. Bee can also add **recovery data** to help reconstruct a file when some chunks cannot be retrieved.
Its [erasure coding](<https://docs.ethswarm.org/docs/concepts/DISC/erasure-coding/>) derives additional chunks from the original data, providing protection beyond the network's ordinary distribution of copies.

| Setting | Effect |
| --- | --- |
| `NONE` | No additional recovery coding |
| `MEDIUM` | Default recovery protection, used in this walkthrough |
| `STRONG` | More recovery data and greater tolerance of missing chunks |
| `INSANE`, `PARANOID` | Progressively stronger protection with more overhead |

We explicitly use **`--redundancy MEDIUM`**, the [default in Bee 2.8.3](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/file/redundancy/level.go>).
Higher levels use more stamp slots, leaving less capacity for file content within the same batch.
For tiny files, the recovery overhead can exceed the size of the original data.
Redundancy helps recover missing chunks; it does not extend the batch's funded lifetime or encrypt the content.

#### Encryption and Public Readability

Encryption is a separate choice from redundancy.
Swarm can [encrypt files and directories](<https://docs.ethswarm.org/docs/develop/tools-and-features/store-with-encryption/>) during upload.
The returned reference contains both the encrypted data's address and its decryption key.
**Anyone holding the full reference can decrypt the content**; sharing it also shares the key.

Encryption changes the stored representation and its overhead.
Fresh encryption keys can give identical source files different chunk addresses, so the unencrypted reuse examples above do not carry over automatically.
We keep our public HTML and CSS **unencrypted**.

### Blockchains and Tokens Involved

Swarm grew out of the Ethereum ecosystem, but its storage and economic management run on different networks:

| Layer | Where it runs | What it handles |
| --- | --- | --- |
| Storage and publication | Bee peer-to-peer network | File chunks, manifests, and signed feed updates |
| Funding and incentives | Smart contracts on Gnosis Chain | Postage batches, storage pricing, node stakes and rewards, and bandwidth settlement |

<br>

The blockchain provides the **economic management layer** through Swarm's [incentive and payment contracts](<https://docs.ethswarm.org/docs/concepts/incentives/overview/>).
[Gnosis Chain](<https://docs.gnosischain.com/about/>) is an independent Ethereum-compatible layer-1 blockchain with its own validators, balances, and native gas currency.
It is a shared blockchain used by Swarm and other applications.

Postage information is distributed across three places:

| Location | Information kept there |
| --- | --- |
| Gnosis blockchain | Batch owner, capacity, funding, and other batch parameters |
| Stored chunk and its signed stamp | Which batch and index back that chunk, including a timestamp |
| Bee storage nodes | Local indexes recording which chunk currently occupies a given batch/index |

> **Buying or topping up a batch is an on-chain transaction; uploading chunks is a peer-to-peer operation.**
> Bee [creates and signs individual postage stamps locally](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/stamper.go>).
> Receiving peers check the batch state from Gnosis and [enforce index usage through their own local records](#how-storage-nodes-enforce-stamp-usage).
> There is no separate blockchain transaction for every chunk or feed update.

DAI and BZZ exist as ERC-20 tokens on Ethereum.
DAI is intended to be a dollar stablecoin, more akin to [HBD](../publishing-hive-basics/#hive,-hbd,-hive-power,-and-rechargeable-capacity) (HiveBackedDollar) than to USDT or USDC.
DAI is [backed by collateral](<https://makerdao.com/en/whitepaper/>), but its target value of US$1 is not an unconditional guarantee.

Bridging connects these Ethereum assets to their Gnosis representations, commonly called xDAI and xBZZ.
xDAI is the native gas token on Gnosis, and xBZZ is an ERC-20 token on Gnosis.

> I initially thought that the xYYY naming pattern was universal and expected to see xETH on Gnosis. Instead, it is called WETH, for wrapped Ether.

DAI originally came from [MakerDAO](https://makerdao.com/en/).
In 2024, Maker became [Sky](https://sky.money/blog), and USDS was introduced as the upgraded successor to DAI.
DAI and USDS are separate token contracts, though.
An existing DAI balance does not automatically become USDS.
The protocol provides an explicit converter in both directions: `1 DAI ↔ 1 USDS`.
The name USDS also sounds much closer to USDT or USDC.

The first path uses WETH to move between the two chains:

```txt
  Ethereum: ETH → WETH
                   │ bridge
  Gnosis:         WETH ↔ xDAI ↔ xBZZ
```

The second path uses DAI's successor, USDS, on Ethereum:

```txt
  Ethereum: ETH ↔ USDS
                    │ bridge
  Gnosis:          xDAI ↔ xBZZ
```

In the Arweave detour, [Converting Between Tokens, Chains, and Payment Systems](../publishing-arweave-ario-basics/#detour:-converting-between-tokens,-chains,-and-payment-systems), I discussed the differences between on-chain atomic swaps and swaps across different blockchains.
There are several ways to convert ETH to BZZ.
An on-chain atomic swap is typically fast and transactional, with "all or nothing" behavior.
Across chains, issues can arise that later require manual intervention to resolve.
Therefore it is useful to plan your conversion path.

Systems such as CoW and its swap interface, [swap.cow.fi](https://swap.cow.fi/), find conversion paths for you automatically.
For my first attempt, I selected ETH on Ethereum and DAI on Gnosis and tried the swap.
The system asked me to allow a certain percentage of "slippage", i.e. a price buffer around the current market price.
This is similar to a limit order and allows for price movements while the conversion is being processed.
Even with this allowance, I ran into a "rollback": the conversion took too long, and the system reported that the price had moved beyond my allowed slippage.

I therefore first swapped ETH for USDS and then USDS for xDAI to avoid that issue with price movements during the transfer between chains.

I used [MetaMask](https://metamask.com/) as my wallet and completed the whole process successfully.
However, Gnosis Chain is not one of MetaMask's so-called "default networks", so you may need to select Gnosis explicitly.
In my MetaMask interface, the Gnosis DAI token was labeled "Ethereum", with a different symbol, while BZZ was labeled "Swarm".

You can also use [Rabby Wallet](https://rabby.io/), which has better support for Gnosis Chain but lacks support for Bitcoin and Solana.
Choose whatever works best for you.

#### How Much xDAI and xBZZ Do We Need?

For the **minimum depth-17 batch** funded for an estimated **365 days**, the budget at the prices checked on **2026-11-28** is:

| Purpose | Amount | Account holding the funds |
| --- | --- | --- |
| Postage batch for an estimated year | About **17.26 xBZZ** (US$1.37) | Browser-wallet payer |
| Bee's initial bandwidth budget | **0.2 xBZZ** (about US$0.02) | Bee node's own Gnosis account |
| Bee's initial gas budget, including chequebook deployment | **0.01 native xDAI** (about US$0.01) | Bee node's own Gnosis account |

<br>

The snapshot uses a [storage rent](#batch-payment-per-duration) of **208,729 PLUR per chunk per block** and an [indicative xBZZ exchange rate](<https://api.cow.fi/xdai/api/v1/token/0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da/native_price>) of **0.0795 xDAI per xBZZ**; USD values assume 1 xDAI is approximately US$1.

A practical starting plan is **about 5 native xDAI arriving in the browser wallet on Gnosis**, with Ethereum gas and the initial swap/bridge fees budgeted separately.
Swap enough of that to obtain **about 25 xBZZ**, listed as **BZZ** on Gnosis: roughly **2 xDAI before swap costs** at that snapshot.
Keep the remaining native xDAI for the payer's Gnosis transaction fees and a reserve.

Keep the batch-purchase funds in the browser wallet; the walkthrough transfers only the small operational budget to Bee's own account, following the [Bee quickstart](<https://docs.ethswarm.org/docs/bee/installation/quick-start/>).
Feed updates use the existing postage batch and require no separate Gnosis transaction in our workflow.

These are dated estimates: storage rent, token prices, and transaction fees can change.
The commands below recalculate the postage payment before purchase; the batch's eventual lifetime still depends on the storage rates charged over time.


### Identities Involved

In the [Arweave example](../publishing-arweave-ario-basics/#why-we-separate-the-two-keys), we separated two publication identities:
the **Arweave upload signer**, recorded as the owner of the immutable transactions or data items, and the **ArNS owner**, controlling the name and its current target.
The first identified the originator of the signed upload; the second controlled the mutable "head" reference.


A Swarm publication involves several accounts and identifiers, each with a different role:

| Role | Account or identifier in our walkthrough |
| --- | --- |
| Pays for the batch | Browser-wallet account, `$PAYER` |
| Owns the batch and signs postage stamps | Bee node's Gnosis account, `$NODE_OWNER` |
| Controls the mutable "head" reference: the feed | Browser-wallet publishing account, `$FEED_OWNER` |

<br>

The separate **`$PAYER`** supplies the funds. Paying for a batch does not by itself make that account the batch owner or give it control of the feed.

The [postage signature](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/stamper.go>) identifies who authorized the use of a batch for a particular chunk.
We assign batch ownership to Bee's operational account (`$NODE_OWNER`) so the node can stamp chunks automatically.
This authorizes postage use; it does not provide the same uploader provenance as an Arweave transaction's owner field or establish who authored the HTML.
Running Bee therefore does not make its account the author identity of everything uploaded through it.

The [feed](<https://docs.ethswarm.org/docs/develop/tools-and-features/feeds/>) provides our persistent publishing identity, playing the role that the ArNS reference played in our Arweave example.
Its updates are signed by the publishing account in the browser wallet, independently of Bee's operational account.
That account controls which publication the stable feed references.

In Swarm,

* **`$FEED_OWNER` takes the role of the ArNS owner** by controlling the stable feed's target.
* **`$NODE_OWNER` owns the postage batch**.
* The files and manifests are identified by their content addresses.

Once an upload has synchronized with the network, other peers can continue serving it after our local Bee process stops, while its postage backing remains valid.

For future uploads using the same batch, we retain or migrate Bee's [node state](<https://docs.ethswarm.org/docs/bee/working-with-bee/backups/>), including its keys and stamp bookkeeping, and keep the password protecting those keys.
Restoring the keys recovers our authority over the batch, but does not by itself [rebuild its complete allocation history](#keep-the-state-for-future-publications).
Our browser-wallet publishing account can keep controlling the same feed when we move to another machine or replace the Bee node.

### Website over Time

In [What a Publishing Tool Could Automate](../publishing-arweave-ario-basics/#what-a-publishing-tool-could-automate), we outlined a tool that reuses unchanged files, publishes a new immutable manifest, and moves the ArNS reference forward.
A Swarm tool would follow the same model, using a feed for the "head" and managing postage continuously:

1. **Resume the publication.** Resolve the feed and read the current manifest. Load the publishing identity, chosen batch ID, and the Bee state needed to continue using that batch.
2. **Plan the next revision.** Derive file and chunk references using consistent upload settings. Reuse unchanged content and prepare the manifest for added, changed, or removed paths.
3. **Check the postage.** Inspect the batch's remaining lifetime, bucket capacity, and postage backing for every required chunk, including unchanged data, manifests, and feed entries. Show any required top-ups or capacity changes before requesting payment approval.
4. **Publish and advance the head.** Upload the required data and manifest, wait for network synchronization, and verify retrieval. Then request the publishing wallet's signature for the feed update and verify that the feed resolves to the new revision.
5. **Preserve continuity.** Save publication references and receipts, back up Bee's keys and stamp bookkeeping, and monitor the batch so it can be topped up before expiry. A fresh source checkout or recovered private key alone cannot reconstruct the complete allocation history.

> Content addressing supplies reuse, but the tool must also preserve the postage backing of every chunk needed by the current website and any revisions we choose to retain.
> Mutable-batch cycling, or conflicting assignments caused by stale bookkeeping even in an immutable batch, can remove that backing from unchanged files; uploading the whole directory again does not by itself resolve this.

#### A Payment Service for Rolling Top-Ups

Our walkthrough prepays roughly one year, but the [postage contract](<https://github.com/ethersphere/storage-incentives/blob/8ed9ca10238c487d0f92573417e66eb995653abb/src/PostageStamp.sol>) does not let the batch owner reclaim unused credit.
A payment service could limit that commitment by funding shorter periods:

1. Keep xBZZ in a separate reserve contract that allows the owner to withdraw unspent funds and set renewal spending limits.
2. Initially fund the chosen batch for roughly **90 days** at the current storage price.
3. Monitor its estimated remaining lifetime. Below a **30-day** threshold, top it up to roughly 90 days, within those spending limits.
4. Let the owner stop renewals and withdraw the unspent reserve. Credit already transferred into the postage contract remains committed.

A reserve contract would need an external bot to submit renewal transactions and pay their Gnosis gas fees; it cannot wake itself up.
Swarm permits third-party top-ups, so the service would not need the batch owner's private key.
Monitoring the actual remaining lifetime matters because storage prices can change.
Renewal must happen **before expiry**: an expired batch cannot be revived by topping it up.

The [Swarm Gateway already supports automatic batch management](<https://docs.ethswarm.org/docs/develop/tools-and-features/gateway-proxy/#stamp-management>).
The withdrawable reserve described here is a proposed additional service design.

### Other Tools and Naming

#### Graphical Interfaces

[Bee Dashboard](<https://github.com/ethersphere/bee-dashboard>) provides a browser interface for a running Bee node: inspect its status and balances, manage postage batches, and upload or download files.
It can connect to an existing node.
[Swarm Desktop](<https://www.ethswarm.org/build/desktop>) bundles Bee with its graphical interface, including website uploads and postage-batch management.
Compatibility with our exact Bee 2.8.3 setup and separate browser-wallet roles remains untested.

#### ENS Names and Browser Access

A human-readable **`.eth` name** can be registered and managed through the [ENS App](<https://app.ens.domains/>).
Its **content hash** record can point to `bzz://<feed-manifest-reference>`, so the name follows the feed's current website without changing the ENS record for every revision.
A gateway such as [eth.limo](<https://eth.limo/>) makes it accessible in an ordinary browser at `https://yourname.eth.limo/`.

ENS names are managed on Ethereum, with registration, renewal, and transaction fees separate from our Gnosis postage budget.
The [optional ENS walkthrough](#optional:-give-the-feed-an-ens-name) shows the manual steps.

## Choosing the Tools

In the Arweave article, we started with the Turbo CLI and later used [the native libraries directly](../publishing-arweave-ario-basics/#publish-directly-to-arweave-and-pay-in-ar).
Swarm offers a similar choice between convenient commands and lower-level interfaces.

Our main tool will be **[Swarm CLI](<https://docs.ethswarm.org/docs/bee/working-with-bee/swarm-cli/>)**, distributed as `@ethersphere/swarm-cli`.
It handles file and website uploads, downloads, postage batches and their remaining lifetime, and feed updates.
It talks to **Bee**, the Swarm node software.
A [Bee light node](<https://docs.ethswarm.org/docs/bee/installation/quick-start/>) is sufficient for uploading and retrieving our publications.

The versions selected for this walkthrough are:

| Tool | Version | Role |
| --- | --- | --- |
| [Bee](<https://github.com/ethersphere/bee/releases/tag/v2.8.3>) | 2.8.3 | Our connection to the Swarm network |
| [Swarm CLI](<https://github.com/ethersphere/swarm-cli/tree/v3.7.0>) | 3.7.0 | Routine operations from the terminal |
| [bee-js](<https://github.com/ethersphere/bee-js/tree/v13.2.0>) | 13.2.0 | JavaScript library for lower-level operations |
| [browser-web3-signer](<https://github.com/nikicat/browser-web3-signer/tree/v0.13.0>) | 0.13.0 | Requests to our existing browser wallet |

For inspecting the [Bee HTTP API](<https://docs.ethswarm.org/api/>), ordinary `curl` and `jq` are also useful.
We can use the CLI for the common operations and show the underlying requests where they help explain what happens.

### Which Key Signs What?

As discussed in [Signers and Remoting](../identity-signers-and-remoting/), I want to keep using my browser wallet without exporting its private keys into command-line tools.
Swarm has three distinct roles to consider:

* **The Bee node** has its own operational key and issues the postage stamps attached to uploaded chunks.
* **The payer** funds storage on **Gnosis Chain**, using **xBZZ** for postage and **xDAI** for transaction fees.
* **The feed publisher** signs updates with an Ethereum-compatible key. This can be a separate publishing account in the browser wallet; signing a feed update does not itself require an on-chain transaction.

The standard CLI workflow does not connect those roles to a browser wallet automatically.
Its postage commands ask Bee to spend from the node's account, and its [feed writer](<https://github.com/ethersphere/swarm-cli/blob/v3.7.0/src/command/feed/feed-command.ts>) loads a local private key.
The [standard `bee-js` 13.2.0 feed writer](<https://github.com/ethersphere/bee-js/blob/v13.2.0/src/modules/feed.ts>) also expects private-key material.

For our browser-wallet route, `browser-web3-signer` provides the missing transport: a terminal request opens a local approval page and returns the wallet's result.
Its `send-transaction` operation asks the wallet to sign **and submit** a contract transaction; its `sign-message --raw` operation returns a signature over supplied bytes using Ethereum's `personal_sign` convention.
That convention matches the [signatures underlying Swarm feed updates](<https://github.com/ethersphere/core-sdk/blob/599be256a6dfdd96418988f234bbe147146fe59b/src/chunk/soc.ts>).

The proposed workflow is therefore to pay for postage from the browser wallet while assigning the batch to the Bee node, and to prepare feed updates locally, request their signatures, verify them, and upload them through Bee.
The payer and node can be separate: Bee [recognizes batches owned by its address](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/batchservice/batchservice.go>) when it processes their on-chain creation events.
This needs small, explicit preparation and submission snippets around the existing tools; it is not a built-in browser-wallet mode of Swarm CLI.
The browser integration still needs to be verified in the practical walkthrough.

## Learning It by Foot

We will publish the same two-file website as in the Arweave example, change only its HTML, and move a feed to the second revision.
The commands use one Bash session, Node.js, Python 3, `curl`, and `jq`.
Run them in order and stop if a command fails.
Installation, local file checks, and the signature format can be verified without paying; the wallet approvals and public-network publication below still need live verification.

> If you already started this experiment, keep its existing `state/` and `records/` directories and use the original Bee password.
> Recover an existing batch ID with `STAMP=$(cat records/stamp-id.txt)`; signed feed updates also have their own saved records below.

### Prepare the Tools

Keep the experiment outside your Git checkouts, including Bee's encrypted node keys and local state:

```bash
swarm_demo_dir="$HOME/tmp/publishing-ethereum-swarm-basics"
umask 077
install -d -- "$swarm_demo_dir"/{site,tools/bin,records,state}
cd "$swarm_demo_dir"

npm install --prefix tools --save-exact @ethersphere/swarm-cli@3.7.0 @ethersphere/bee-js@13.2.0 @ethersphere/core-sdk@0.2.2 ethers@6.16.0

cat tools/package.json
# {
#   "dependencies": {
#     "@ethersphere/bee-js": "13.2.0",
#     "@ethersphere/core-sdk": "0.2.2",
#     "@ethersphere/swarm-cli": "3.7.0",
#     "ethers": "6.16.0"
#   }
# }
```

The following binaries are for **Linux x86-64**; use the corresponding release assets on other platforms:

```bash
curl -fL https://github.com/ethersphere/bee/releases/download/v2.8.3/bee-linux-amd64 -o tools/bin/bee
curl -fL https://github.com/nikicat/browser-web3-signer/releases/download/v0.13.0/browser-web3-signer-x86_64-unknown-linux-musl -o tools/bin/browser-web3-signer
chmod u+x tools/bin/bee tools/bin/browser-web3-signer
export PATH="$swarm_demo_dir/tools/bin:$swarm_demo_dir/tools/node_modules/.bin:$PATH"
export BEE_URL=http://127.0.0.1:1633
export GNOSIS_RPC=https://xdai.fairdatasociety.org

bee version
# 2.8.3-8e9bb914
swarm-cli --version
# 3.7.0
browser-web3-signer --version
# browser-web3-signer v0.13.0
```

### Create the Mini Website

Only the title and greeting differ from the Arweave example; the CSS is identical.

```bash
cat > site/index.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Publishing on Swarm by Foot</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main>
    <p class="kicker">Immutable publishing experiment</p>
    <h1>Hello from Swarm</h1>
    <p>This is version 1 of a tiny website whose HTML and CSS are stored as separate objects.</p>
  </main>
</body>
</html>
HTML

cat > site/style.css <<'CSS'
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
CSS

python3 -m http.server 8000 --bind 127.0.0.1 --directory site
```

Open [the local page](<http://127.0.0.1:8000/>), check the styling, then stop this preview server with <kbd>Ctrl</kbd>+<kbd>C</kbd>.

### Inspect the File Chunks Offline

Bee 2.8.3 includes an offline splitter: `bee split chunks`.
It needs neither a running node nor tokens, and `--r-level 1` selects the **MEDIUM** redundancy we will use for uploading.
The following splits each file into a temporary directory, records the chunk addresses from its filenames, and counts the distinct chunks sharing each 16-bit bucket prefix.
The temporary chunk files are removed after their addresses have been recorded.

> **`bee split chunks` versus `bee split refs`**
> Both use the same splitting pipeline and work offline, without uploading data or spending tokens.
> `split refs` saves the chunk addresses in one text file; `split chunks` saves the actual binary chunks in a directory, with each filename being its chunk's address.
> `split refs` also prints the root reference separately, so that address appears twice.
> In Bee 2.8.3, its [reference collector](<https://github.com/ethersphere/bee/blob/v2.8.3/cmd/bee/cmd/split.go>) also appears to lose entries during [concurrent replica writes](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/replicas/putter.go>); repeated runs produced different counts for identical inputs ([Bee issue #5726](<https://github.com/ethersphere/bee/issues/5726>)).
> We therefore count the output files from `split chunks` instead.

```bash
python3 - <<'PY'
from collections import Counter
from pathlib import Path
from tempfile import TemporaryDirectory
import subprocess

refs = set()
files = sorted(p for p in Path('site').rglob('*') if p.is_file())
for i, file in enumerate(files):
    with TemporaryDirectory(prefix='split-', dir='records') as directory:
        subprocess.run(['bee', 'split', 'chunks', '--input-file', str(file),
                        '--output-dir', directory, '--r-level', '1'], check=True)
        file_refs = sorted(p.name for p in Path(directory).iterdir() if p.is_file())
    output = Path(f'records/file-{i}-chunks.txt')
    output.write_text(''.join(r + '\n' for r in file_refs))
    refs.update(file_refs)

Path('records/distinct-file-chunks.txt').write_text(''.join(r + '\n' for r in sorted(refs)))
buckets = Counter(r[:4] for r in refs)
print(f'{len(files)} files, {len(refs)} distinct file chunks')
print(f'Largest bucket: {max(buckets.values(), default=0)} chunks')
print(f'Buckets needing more than two indices: {sum(n > 2 for n in buckets.values())}')
PY

# 2 files, 6 distinct file chunks
# Largest bucket: 1 chunks
# Buckets needing more than two indices: 0

cat records/file-0-chunks.txt
# 13a4f9c87c6432da89e4724220b92527c434a01f2e90ef784339efe66998c6bc
# 21fe637c652d2cd3dc3f54cee42e2ead9a572992d5eb9b30107032a148728c21
# a421c4867eb768d16881a1a0bcabc7daad2b22564a4dd2f947cd06b4dc528b5d

cat records/file-1-chunks.txt
# 5e42778d45666038b5832e5c0bd081cf033cf7fc542ff0d6abe4373b85a330dc
# 8f58e4cade3a00dbeabe32de4b13986ce30b6f180edfdc445df0d074864d81e6
# e4ce60ab6e525f4bc9cca3cede9ab3bd3cc31eb7219ee38194035221acf64abc
```

This is a **file-level preflight**, not a complete batch simulator.
It includes the files' chunk trees and recovery chunks, but not the directory manifest, feed objects, or existing stamp assignments.
With this method, the two-file sample produces **six distinct chunk addresses**, each in a different bucket.
The manifest maps paths to file references; it does **not** pack the HTML and CSS bytes into one chunk, even though their combined size is below 4 KiB.
For a fresh depth-17 batch, each bucket has two indices; a prefix shared by two chunks is therefore not yet a capacity problem.

### Acquire xDAI and xBZZ with CoW Swap

Although often called *Ethereum Swarm*, Swarm's postage contracts run on **Gnosis Chain**, a separate Ethereum-compatible network with chain ID **100**.
Its native gas currency is **xDAI**; **xBZZ** is the ERC-20 representation of BZZ on Gnosis used to pay for storage.
The [Swarm token documentation](<https://docs.ethswarm.org/docs/references/tokens/>) distinguishes it from the original BZZ token on Ethereum.

We will use **[CoW Swap](<https://swap.cow.fi/>)** as one interface for obtaining both assets.
We follow the [USDS route described earlier](#blockchains-and-tokens-involved), which worked for me after the direct ETH → xDAI attempt failed when prices moved beyond the allowed slippage.
Connect MetaMask with the account that will pay for this experiment and receive the funds there; we will transfer Bee's operational budget to the node later.

1. **ETH → USDS, both on Ethereum.** Select Ethereum for both networks, with ETH as the source and USDS as the destination.
   Approve the requests in MetaMask and wait until the USDS balance is available.

2. **USDS on Ethereum → native xDAI on Gnosis.** Select Ethereum and USDS as the source, then Gnosis and native xDAI as the destination.
   Check that CoW offers a current quote for this pair, including the minimum received amount, bridge provider, fees, and expected transfer time.
   Both tokens target US$1, so we expect **1 USDS ≈ 1 xDAI before costs**.
   For this experiment, we would look for a quote close to 1, for example **0.96 xDAI per USDS or higher** (about 4% or less below parity).

   > This is an illustrative target: the difference includes trading spreads and swap/bridge fees, and small transfers can cost proportionally more.

   Review and approve the requests in MetaMask, including USDS spending, then wait for the Gnosis balance to arrive before continuing.

   > The destination must be native **xDAI**, rather than wrapped **WXDAI**, so that it can pay gas.

3. **xDAI → xBZZ, both on Gnosis.** Set both networks to Gnosis and swap part of the received xDAI for BZZ, leaving some native xDAI for gas and the node funding below.
   The token may be labelled simply **BZZ**; verify its Gnosis contract address: `0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da`.
   If it is absent from the token list, paste that address into the token selector and review the custom-token import before trading.
   If no quote is available, stop rather than choosing a similarly named token.

Following the [token budget above](#how-much-xdai-and-xbzz-do-we-need?), aim for **about 5 native xDAI arriving in the browser wallet on Gnosis**.
Swap roughly **2 xDAI before swap costs** for **about 25 xBZZ**, keeping the remaining native xDAI for Gnosis transaction fees and a reserve.
Of these funds, we will transfer **0.01 xDAI and 0.2 xBZZ** to Bee's operational account and keep the estimated **17.26 xBZZ** postage payment in the browser wallet for the minimum **depth-17 batch**, funded for approximately **365 days**.

> These are my **2026-11-28 estimates**, with Ethereum gas and the initial swap/bridge fees budgeted separately.
> Check the current quotes and the actual postage price below before committing the storage payment.

These three operations have different guarantees, as discussed in the Arweave article's [conversion detour](../publishing-arweave-ario-basics/#detour:-converting-between-tokens,-chains,-and-payment-systems).
The **first and third** are same-chain trades, comparable to our **SOL → ARIO** trade: each executed swap settles **atomically** under its chain's rules.
CoW uses signed orders and competing solvers to arrange the trades.

The **middle step** combines conversion with a **bridge transfer between two blockchains**.
CoW can settle the source trade and initiate bridging in one source-chain transaction, but arrival on Gnosis is a later step with the bridge provider's completion and refund rules.
Its [cross-chain guide](<https://docs.cow.fi/cow-protocol/tutorials/cow-swap/swap-and-bridge>) explains that sequence.

> Using one interface does not make the entire journey one atomic transaction across both chains.

Using USDS for this step avoids carrying ETH's price movements into the cross-chain quote, but fees and slippage still need to be checked.

### Initialize and Fund the Bee Node

The sequence is **initialize → back up → fund → start**.
First use [`bee init`](<https://github.com/ethersphere/bee/blob/v2.8.3/cmd/bee/cmd/init.go>) to create or reopen the node's keys and initialize its local state **offline**.
**This command then exits**, returning control to the shell without leaving a Bee node running or starting its HTTP API.
We can therefore back up the state and fund the node's Gnosis account before using `bee start` later.

On its first startup with `bee start`, Bee needs xDAI in that account to deploy its bandwidth-payment chequebook.
Funding the account beforehand avoids the [roughly 200-second funding timeout](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/settlement/swap/chequebook/init.go>) we encountered when starting an unfunded node.
If Bee is still running from an earlier attempt, stop that process first; two processes must not use the same state directory.

With the same state directory and password, repeating `bee init` [reuses the existing keys](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/keystore/file/service.go>) and the same Gnosis account, then exits normally.
A wrong password causes an error when unlocking the existing key.
An empty data directory, or a missing or empty `swarm.key`, causes a new account to be generated.

```bash
read -r -s -p 'Password for the Bee node: ' BEE_PASSWORD
printf '\n'
BEE_PASSWORD="$BEE_PASSWORD" bee init --data-dir "$swarm_demo_dir/state" > records/bee-init.log 2>&1
unset BEE_PASSWORD

NODE_OWNER=$(python3 - <<'PY'
from pathlib import Path
import re
log = Path('records/bee-init.log').read_text()
match = re.search(r'"msg"="using ethereum address" "address"="(0x[0-9a-fA-F]{40})"', log)
if not match:
    raise SystemExit('No node account found; inspect records/bee-init.log')
print(match[1])
PY
)
printf '%s\n' "$NODE_OWNER" | tee records/node-owner.txt
# 0x79226C33814F6f334b7b27Ba9e1a2B739AA6984f

tree state
# state
# ├── keys
# │   ├── libp2p_v2.key
# │   ├── pss.key
# │   └── swarm.key
# ├── stamperstore
# │   ├── 000001.log
# │   ├── CURRENT
# │   ├── LOCK
# │   ├── LOG
# │   └── MANIFEST-000000
# └── statestore
#     ├── 000002.ldb
#     ├── 000003.log
#     ├── CURRENT
#     ├── CURRENT.bak
#     ├── LOCK
#     ├── LOG
#     └── MANIFEST-000004
```

`bee init` has now finished, so Bee is **stopped** and we can archive the initialized state:

```bash
STATE_BACKUP=$(mktemp "$swarm_demo_dir/records/bee-state.XXXXXXXX.tar.gz")
tar -czf "$STATE_BACKUP" -C "$swarm_demo_dir" state
tar -tzf "$STATE_BACKUP" > /dev/null
printf 'State backup: %s\n' "$STATE_BACKUP"
```

`mktemp` gives each archive a unique filename and owner-only permissions; the listing check verifies that `tar` can read it.

> This initial archive preserves the node's identity.
> After each publishing session, [make a fresh backup](#keep-the-state-for-future-publications) with Bee stopped, so it includes the stamp assignments created since this snapshot.

> **The password protects keys; it does not recreate them.**
> Bee keeps randomly generated, encrypted private keys under `state/keys/`; `swarm.key` controls its Gnosis account and postage signing.
> The same password with an empty state directory produces a different identity.
> `BEE_PASSWORD` unlocks those keys; it does not encrypt the whole state directory or our uploaded website.
> Retain the whole directory, including `statestore` and `stamperstore`, for [backups and migration](<https://docs.ethswarm.org/docs/bee/working-with-bee/backups/>), and keep the password separately.

Keep Bee stopped while funding its account.
Now connect the **paying account** in your browser wallet:

> **Several Wallet Extensions in One Browser**
>
> `browser-web3-signer` 0.13.0 [selects the first wallet that announces itself](<https://github.com/nikicat/browser-web3-signer/blob/v0.13.0/crates/browser-web3-signer-evm/web/evm.html#L313-L325>) and has no wallet selector.
> Before opening the approval page, temporarily disable all other wallet extensions in that browser profile, leaving only the wallet you want to use enabled, for example MetaMask.
> Keep the others disabled throughout this walkthrough, since each new approval page repeats wallet discovery.
> If the wrong wallet has already opened, cancel its prompt, stop the waiting CLI with <kbd>Ctrl</kbd>+<kbd>C</kbd>, close the approval tab, and rerun the command to obtain a new approval URL.

```bash
browser-web3-signer evm connect --chain 100 --rpc-url "$GNOSIS_RPC" --chain-name Gnosis --print --json > records/payer.json
PAYER=$(jq -er .address records/payer.json)
```

`--print` displays a local approval URL to open in the browser where your wallet is installed.
The payer needs xDAI and xBZZ on **Gnosis Chain, chain ID 100**.

We need a little ABI encoding and receipt checking around the wallet bridge.
This helper prepares call data or reads a receipt; it holds no signing key:

```bash
cat > tools/evm.mjs <<'JS'
import { Interface, JsonRpcProvider, formatUnits, id } from 'ethers';
const [task, ...args] = process.argv.slice(2);
if (task === 'wait') {
  const provider = new JsonRpcProvider(process.env.GNOSIS_RPC, 100);
  const receipt = await provider.waitForTransaction(args[0], 2, 180000);
  if (!receipt || receipt.status !== 1) throw Error('Transaction not confirmed successfully');
  console.log(JSON.stringify({ hash: receipt.hash, logs: receipt.logs.map(
    ({ address, topics, data }) => ({ address, topics, data })) }, null, 2));
  provider.destroy();
} else if (task === 'bzz') {
  console.log(formatUnits(args[0], 16));
} else if (task === 'event') {
  console.log(id(args[0]));
} else {
  const values = args.map(x => x === 'true' ? true : x === 'false' ? false : x);
  console.log(new Interface([`function ${task}`]).encodeFunctionData(task, values));
}
JS

export BZZ_TOKEN=0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da
export POSTAGE=0x45a1502382541Cd610CC9068e88727426b696293
```

As in the [Bee quickstart](<https://docs.ethswarm.org/docs/bee/installation/quick-start/>), give the node a small operational budget: here **0.01 xDAI** and **0.2 xBZZ**.
These transfers fund Bee's own gas and bandwidth operations; we will buy the postage separately from the payer's account.
The xBZZ initially sits in Bee's wallet; after startup, we will deposit it into the bandwidth-payment chequebook.
If you already confirmed these transfers for this node account, skip them.
Review each wallet request before approving it:

```bash
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" --to "$NODE_OWNER" --value 10000000000000000 --print --json > records/node-xdai.json
node tools/evm.mjs wait "$(jq -er .txHash records/node-xdai.json)" > records/node-xdai.receipt.json

NODE_FUNDING=$(node tools/evm.mjs 'transfer(address,uint256)' "$NODE_OWNER" 2000000000000000)
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" --to "$BZZ_TOKEN" --data "$NODE_FUNDING" --print --json > records/node-bzz.json
node tools/evm.mjs wait "$(jq -er .txHash records/node-bzz.json)" > records/node-bzz.receipt.json
```

If a receipt wait fails, inspect the saved transaction hash before submitting another payment; a timeout does not prove that a transfer failed.

### Start the Funded Bee Node

Once both funding transfers are confirmed, use **`bee start`** with the **same password and `state/` directory**.
The node connects to Gnosis and Swarm and **keeps running** until we stop it.
The trailing `&` runs it in the background, and `BEE_PID` records its process ID for the shutdown step later.

```bash
read -r -s -p 'Password for the Bee node: ' BEE_PASSWORD
printf '\n'
BEE_PASSWORD="$BEE_PASSWORD" bee start --data-dir "$swarm_demo_dir/state" --full-node=false --swap-enable --api-addr 127.0.0.1:1633 \
  --blockchain-rpc-endpoint "$GNOSIS_RPC" >> records/bee.log 2>&1 &
BEE_PID=$!
unset BEE_PASSWORD
# tail -f records/bee.log

# "time"="2026-11-28 11:25:01.661547" "level"="info" "logger"="node" "msg"="swarm public key" "public_key"="03c6d4caaa6a269db2e87381c2bdc1abe31d22ea4dc0d8bf9574f5e7b8d755f19e"
# "time"="2026-11-28 11:25:01.845998" "level"="info" "logger"="node" "msg"="pss public key" "public_key"="02a9abc83eb7642c86ca2c5fb774483c7800e8cae8ff84434c13f76dfe9addb4a6"
# "time"="2026-11-28 11:25:01.846032" "level"="info" "logger"="node" "msg"="using ethereum address" "address"="0x79226C33814F6f334b7b27Ba9e1a2B739AA6984f"
# "time"="2026-11-28 11:25:01.891947" "level"="info" "logger"="node" "msg"="using overlay address" "address"="d931952d903a11d20037ada1c999459f7fbd5893fc703766e303f7c4a1c56d15"
# "time"="2026-11-28 11:25:01.892008" "level"="info" "logger"="node" "msg"="chain backend enabled - blockchain functionality available" "full_node_mode"=false "blockchain-rpc-endpoint"="https://xdai.fairdatasociety.org"
# "time"="2026-11-28 11:25:01.958747" "level"="info" "logger"="node" "msg"="connected to blockchain backend" "version"="Nethermind/v2.0.0+bec830cd-f/linux-x64/dotnet10.0.11"
# "time"="2026-11-28 11:25:02.005904" "level"="info" "logger"="node" "msg"="using chain with network" "chain_id"=100 "network_id"=1
# "time"="2026-11-28 11:25:02.048527" "level"="info" "logger"="node" "msg"="starting debug & api server" "address"="127.0.0.1:1633"
# "time"="2026-11-28 11:25:02.086531" "level"="info" "logger"="node" "msg"="using bzz token address" "address"="0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da"
# "time"="2026-11-28 11:25:02.086570" "level"="info" "logger"="node" "msg"="using default factory address" "chain_id"=100 "factory_address"="0xC2d5A532cf69AA9A1378737D8ccDEF884B6E7420"
# "time"="2026-11-28 11:25:02.086600" "level"="info" "logger"="node/chequebook" "msg"="no chequebook found, deploying new one."
# "time"="2026-11-28 11:25:02.452367" "level"="info" "logger"="node/chequebook" "msg"="deploying new chequebook" "tx"="0xaea1c5c961d6bacf150858dcf03bb219086887df58cade838e937cf53a3b6530"
# "time"="2026-11-28 11:25:07.694406" "level"="info" "logger"="node/transaction" "msg"="pending transaction confirmed" "sender_address"="0x79226C33814F6f334b7b27Ba9e1a2B739AA6984f" "tx"="0xaea1c5c961d6bacf150858dcf03bb219086887df58cade838e937cf53a3b6530"
# "time"="2026-11-28 11:25:07.694438" "level"="info" "logger"="node/chequebook" "msg"="chequebook deployed" "chequebook_address"="0xAAad6e7e390682a894e2eE2C6ce4c3d4be5d6395"
# "time"="2026-11-28 11:25:07.783317" "level"="info" "logger"="node" "msg"="using datadir" "path"="/home/cs/tmp/publishing-ethereum-swarm-basics/state"
# "time"="2026-11-28 11:25:07.816176" "level"="info" "logger"="node" "msg"="loading batch snapshot"
# "time"="2026-11-28 11:25:09.392932" "level"="info" "logger"="node" "msg"="batch snapshot loaded successfully" "log_count"=195260 "max_block_height"=48754534
# "time"="2026-11-28 11:34:20.481881" "level"="info" "logger"="node" "msg"="waiting to sync postage contract data, this may take a while... more info available in Debug loglevel"
# "time"="2026-11-28 11:34:20.527180" "level"="info" "logger"="node" "msg"="started postage contract data sync in the background..."
# "time"="2026-11-28 11:34:20.527475" "level"="info" "logger"="node" "msg"="starting in light mode"
# "time"="2026-11-28 11:34:20.565437" "level"="info" "logger"="node/multiresolver" "msg"="name resolver: no name resolution service provided"
# "time"="2026-11-28 11:34:30.951350" "level"="info" "logger"="node" "msg"="node warmup check initiated. monitoring activity rate to determine readiness." "startTime"="2026-11-28 11:34:30.951349032 +0100 CET m=+569.404723701"
# "time"="2026-11-28 11:34:30.951566" "level"="info" "logger"="node" "msg"="node warmup complete. system is considered stable and ready." "stabilizationTime"="2026-11-28 11:34:30.951349032 +0100 CET m=+569.404723701" "totalMonitoredEvents"=1 "warmupDurationSeconds"=569.104351376
# "time"="2026-11-28 11:34:30.951602" "level"="info" "logger"="node" "msg"="node warmup stabilization complete, updating API status"
```

The timestamps show the startup phases in our first run:

| Time | What happened |
| --- | --- |
| **11:25:02** | The HTTP API starts responding while node initialization continues. |
| **11:25:07** | Chequebook deployment is confirmed. |
| **11:25:09** | The snapshot's **195,260 events** have been read; applying them to the local postage state still follows. |
| **11:34:20** | Snapshot processing finishes; live postage-contract synchronization starts in the background, and Bee enters light mode. |
| **11:34:30** | Warmup completes and Bee updates its API status. |

The quiet gap between **11:25:09 and 11:34:20** lasted about **9 minutes 11 seconds**.
`batch snapshot loaded successfully` therefore does not mean the node is ready.
The reported `warmupDurationSeconds` of about **569 seconds** matches the roughly **9½ minutes** of overall startup, rather than an additional wait after the final warmup message.
**Be prepared to wait up to 10 minutes on the first startup**, and use the checks below to follow progress.

Once the API responds, repeat these checks to follow progress:

```bash
curl -sS "$BEE_URL/health" | jq
curl -sS "$BEE_URL/readiness" | jq
curl -fsS "$BEE_URL/chainstate" | jq '{block, chainTip}'
```

> During startup, `/health` can report `ok` while [`/readiness` returns HTTP 400 with `"status":"notReady"`](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/api/readiness.go>).
> `block` is the latest block Bee has processed for postage; `chainTip` is Gnosis's current block.
> An increasing `block` shows that processing is advancing, even when the log remains quiet.

If you follow the log with `tail -f records/bee.log`, <kbd>Ctrl</kbd>+<kbd>C</kbd> stops the log viewer; Bee continues running in the background.
If the process exits or progress stalls, inspect `records/bee.log` before restarting it.

Continue once `/readiness` reports **`ready` with HTTP 200**.
Then inspect the chain synchronization and connected peers, and check that the API reports the account we funded.
An `/addresses` response alone does not mean that startup has completed:

```bash
swarm-cli status
curl -fsS "$BEE_URL/addresses" -o records/node-addresses.json
jq -e --arg owner "$NODE_OWNER" \
  '(.ethereum | ascii_downcase) == ($owner | ascii_downcase)' records/node-addresses.json
```

#### Fund the Bandwidth Chequebook

Transferring xBZZ to Bee's account does **not** automatically fund its chequebook.
Bee 2.8.3 defaults to [`--swap-initial-deposit 0`](<https://docs.ethswarm.org/docs/bee/working-with-bee/configuration/#configuring-swap-initial-deposit-optional>), so a newly deployed chequebook starts empty.
The tiny example may work within peers' free allowances, but Bee needs a funded chequebook to settle bandwidth debts beyond those allowances.

Once Bee is ready, inspect its [chequebook balance](<https://docs.ethswarm.org/docs/bee/working-with-bee/cashing-out/>):

```bash
curl -fsS "$BEE_URL/chequebook/balance" -o records/chequebook-balance.json
jq . records/chequebook-balance.json
# A newly deployed, unfunded chequebook:
# { "totalBalance": "0", "availableBalance": "0" }
```

The amounts are in **PLUR**.
`totalBalance` is the on-chain balance; `availableBalance` subtracts outstanding cheques that peers have not yet cashed.
If an existing chequebook already has sufficient available funds for the experiment, skip the deposit.
Otherwise, move the **0.2 xBZZ** we transferred to Bee into its chequebook:

```bash
CHEQUEBOOK_DEPOSIT=2000000000000000 # 0.2 xBZZ in PLUR
curl -fsS -X POST "$BEE_URL/chequebook/deposit?amount=$CHEQUEBOOK_DEPOSIT" \
  -o records/chequebook-deposit.json
node tools/evm.mjs wait "$(jq -er .transactionHash records/chequebook-deposit.json)" \
  > records/chequebook-deposit.receipt.json

curl -fsS "$BEE_URL/chequebook/balance" -o records/chequebook-balance.json
jq . records/chequebook-balance.json
jq -e '(.availableBalance | tonumber) > 0' records/chequebook-balance.json
```

**The POST makes Bee send a Gnosis transaction from its own account**, using its node key and xDAI for gas; it does not open another browser-wallet approval.
This funds bandwidth payments, separately from the postage batch we purchase next.
The available balance may already be below 0.2 xBZZ if Bee has issued cheques.
If the receipt wait fails, check the saved transaction hash before repeating the deposit; a timeout does not prove that no funds moved.

### Buy Postage Through the Browser Wallet

We will buy the minimum postage batch, **depth 17**, and fund an estimated **365 days** at the current storage price.
Depth 17 authorizes **2¹⁷ = 131,072 stamp indices**; at 4 KiB per chunk this is **512 MiB of nominal capacity** (about 537 MB).
The [usable file capacity](<https://docs.ethswarm.org/docs/concepts/incentives/postage-stamps/>) is lower because of bucket constraints and storage overhead, but our tiny experiment needs only a few chunks.
Even though the HTML and CSS together contain less than 4 KiB, the separate files, directory manifest, and feed objects occupy several chunks.
We accept the minimum purchase and use Bee's ordinary file handling.

Storage rent is charged against the whole batch from creation, including unused capacity.
`PRICE` below is the rent in PLUR per chunk per Gnosis block; at approximately five seconds per block, there are **17,280 blocks per day**.
Multiplying the per-block rent by **17,280 × DAYS** gives the initial funding per stamp index; multiplying again by **2^DEPTH** gives the total payment.
Rent can change, so 365 days is an estimate rather than a fixed expiry date.
The [contract addresses and call format](<https://github.com/ethersphere/swarm-cli/blob/v3.7.0/src/utils/contracts.ts>) match the pinned CLI.

```bash
DEPTH=17
DAYS=365
PRICE=$(curl -fsS "$BEE_URL/chainstate" | jq -er .currentPrice)
# 208980
AMOUNT=$(node -p '(BigInt(process.argv[1]) * 17280n * BigInt(process.argv[2])).toString()' "$PRICE" "$DAYS")
# 1318078656000
COST=$(node -p '(BigInt(process.argv[1]) * (2n ** BigInt(process.argv[2]))).toString()' "$AMOUNT" "$DEPTH")
# 172763205599232000
node tools/evm.mjs bzz "$COST"
# 17.2763205599232
```

The printed number is the storage cost in xBZZ, excluding gas.
`AMOUNT` is the prepaid value **per stamp index** in PLUR; `COST` is the total, with **10¹⁶ PLUR = 1 xBZZ**.

> **Working backward from a fixed budget: 16.8 xBZZ.**
> I had about 16.8 xBZZ available, below the calculated 17.2763 xBZZ.
> Lowering only `COST` reduced the spending allowance, but left `AMOUNT` requesting the more expensive batch.
> Instead, calculate `AMOUNT` from the budget, then recalculate the exact payment:
>
> ```bash
> COST=168000000000000000 # Budget: 16.8 xBZZ in PLUR
> AMOUNT=$(node -p '(BigInt(process.argv[1]) / (2n ** BigInt(process.argv[2]))).toString()' "$COST" "$DEPTH")
> # 1281738281250
> COST=$(node -p '(BigInt(process.argv[1]) * (2n ** BigInt(process.argv[2]))).toString()' "$AMOUNT" "$DEPTH")
> # 168000000000000000
> node tools/evm.mjs bzz "$COST"
> # 16.8
> ```
>
> Integer division rounds `AMOUNT` down, so the recalculated `COST` cannot exceed the budget.
> At the quoted rent, this funds approximately **355 days** instead of 365.
> Use these revised values in the transactions below; if you already prepared `records/batch-calldata.hex`, regenerate it with the new `AMOUNT` before submitting.

> **No extra approval margin is needed for a change in storage rent.**
> With fixed `AMOUNT` and `DEPTH`, the [postage contract](<https://github.com/ethersphere/storage-incentives/blob/8ed9ca10238c487d0f92573417e66eb995653abb/src/PostageStamp.sol>) charges exactly `AMOUNT × 2^DEPTH`; rent changes affect the estimated lifetime.
> To add a lifetime buffer, increase `AMOUNT` and recalculate `COST` before approval.
> For a fixed budget, the rounding above already keeps the payment within that budget; no extra percentage deduction is needed for rent changes.

Check that the payer has enough xBZZ before proceeding.
Approve exactly that spending allowance, then create an immutable batch owned by **the node's address**:

```bash
# Transaction 1: allow POSTAGE to spend up to COST PLUR from PAYER.
# This grants permission; no xBZZ moves. The transaction uses xDAI for gas.
APPROVE=$(node tools/evm.mjs 'approve(address,uint256)' "$POSTAGE" "$COST")
# Example for the forward 365-day calculation; the encoded value depends on COST:
# 0x095ea7b300000000000000000000000045a1502382541cd610cc9068e88727426b6962930000000000000000000000000000000000000000000000000265c7385c000000
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" --to "$BZZ_TOKEN" --data "$APPROVE" --print --json > records/approve.json
node tools/evm.mjs wait "$(jq -er .txHash records/approve.json)" > records/approve.receipt.json

# Transaction 2: purchase an immutable batch owned by NODE_OWNER.
# This transfers AMOUNT * 2^DEPTH PLUR from PAYER; gas is paid in xDAI.
NONCE=$(node -p '"0x" + require("node:crypto").randomBytes(32).toString("hex")')
node tools/evm.mjs 'createBatch(address,uint256,uint8,uint8,bytes32,bool)' "$NODE_OWNER" "$AMOUNT" "$DEPTH" 16 "$NONCE" true > records/batch-calldata.hex
# browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" --to "$POSTAGE" --data "$(cat records/batch-calldata.hex)" --print --json > records/batch.json
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" --to "$POSTAGE" --data "$(cat records/batch-calldata.hex)" --gas-limit 1000000 --print --json > records/batch.json
node tools/evm.mjs wait "$(jq -er .txHash records/batch.json)" > records/batch.receipt.json
```

> **Why we specify the gas limit.**
> My [attempt without an explicit limit](<https://gnosisscan.io/tx/0x6f2a6ecb7be4f6d9820afd8ab2cc30343dfc7c465393a9affbeaca8da1cc272b>) exhausted its **522,315 gas** and failed.
> For a similar failure, look up the transaction hash in a Gnosis block explorer: a failed status with gas used equal to the gas limit suggests an out-of-gas failure.
> A read-only `eth_call` with more gas confirmed this diagnosis; retrying the same calldata with `--gas-limit 1000000` succeeded.
> This raises the execution limit paid in xDAI, not the xBZZ postage payment; only gas actually used is charged.

These are paid transactions, so do not repeat the block after a timeout without checking the saved hashes and receipts.
In particular, generating another nonce and calling `createBatch` again purchases a separate batch.

Extract the ID from the contract's `BatchCreated` event:

```bash
BATCH_TOPIC=$(node tools/evm.mjs event 'BatchCreated(bytes32,uint256,uint256,address,uint8,uint8,bool)')
STAMP=$(jq -er --arg contract "$POSTAGE" --arg topic "$BATCH_TOPIC" \
  '.logs[] | select((.address | ascii_downcase) == ($contract | ascii_downcase)) | select(.topics[0] == $topic) | .topics[1] | ltrimstr("0x")' \
  records/batch.receipt.json)
printf '%s\n' "$STAMP" > records/stamp-id.txt

swarm-cli stamp show "$STAMP"
# Stamp ID: 92062e6d50c106c85597184386a212be5ad4aaef2b918bfb10d45d07cf7d672c
# Label: recovered
# Usage: 0%
# Capacity (immutable): 40.890 KB remaining out of 40.890 KB
# TTL: 50 weeks (2027-11-18 09:41:43 UTC)
curl -fsS "$BEE_URL/stamps/$STAMP" | jq '{usable, batchTTL, depth, immutableFlag}'
# {
#   "usable": true,
#   "batchTTL": 30666194,
#   "depth": 17,
#   "immutableFlag": true
# }
```

Allow a few minutes for the batch to become usable; repeat the status checks until `usable` is `true` before uploading.
Here, **immutable batch** means that Bee's normal allocator stops when a bucket is full instead of recycling earlier indices; its storage funding still expires.

We select this batch with `--stamp` below.
For each new chunk, its address prefix selects one of the batch's 65,536 buckets, and Bee assigns an index within that bucket and signs the stamp.

You can inspect Bee's allocation counters before and after uploading:

```bash
curl -fsS "$BEE_URL/stamps/$STAMP/buckets" \
  | jq '{depth, bucketDepth, bucketUpperBound, used: [.buckets[] | select(.collisions > 0)]}'
# {
#   "depth": 17,
#   "bucketDepth": 16,
#   "bucketUpperBound": 2,
#   "used": []
# }
```

In this API, `collisions` is Bee's local bucket allocation counter, not a hash collision, a file count, or a complete inventory obtained from storage peers.
For our immutable batch, `bucketUpperBound` is two, and Bee refuses new allocations into a full bucket while its bookkeeping is intact.
A mutable batch instead cycles through a bucket's indices automatically, without checking which old chunks the current website still references.
We choose immutable mode so Bee rejects an overfull bucket instead of recycling an earlier index; this relies on retaining its local state.
The [receiving peers' conflict checks](#how-storage-nodes-enforce-stamp-usage) do not replace that local history, so retain the state and [refresh its backup after publishing](#keep-the-state-for-future-publications).

### Upload and Retrieve Version 1

We leave the files unencrypted and explicitly select **MEDIUM**, the [default upload redundancy in Bee 2.8.3](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/file/redundancy/level.go>).
This adds recovery data; [STRONG, INSANE, and PARANOID](<https://docs.ethswarm.org/docs/concepts/DISC/erasure-coding/>) provide higher redundancy with more overhead.

```bash
swarm-cli upload site --stamp "$STAMP" --index-document index.html --redundancy MEDIUM --sync --quiet > records/version-1.ref
V1=$(cat records/version-1.ref)
cp site/index.html records/version-1.html

curl -fsS "$BEE_URL/bzz/$V1/" -o records/retrieved-1.html
# curl -fsS http://127.0.0.1:1633/bzz/7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04/ -o records/retrieved-1.html
curl -fsS "$BEE_URL/bzz/$V1/style.css" -o records/retrieved.css
# curl -fsS http://127.0.0.1:1633/bzz/7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04/style.css -o records/retrieved.css
cmp records/version-1.html records/retrieved-1.html
cmp site/style.css records/retrieved.css
curl -fsSI "$BEE_URL/bzz/$V1/style.css"
# HTTP/1.1 200 OK
# Accept-Ranges: bytes
# Access-Control-Expose-Headers: Content-Disposition
# Content-Disposition: inline; filename="style.css"
# Content-Length: 422
# Content-Type: text/css; charset=utf-8
# Etag: "8f58e4cade3a00dbeabe32de4b13986ce30b6f180edfdc445df0d074864d81e6"
# Last-Modified: Sat, 28 Nov 2026 11:25:39 GMT
# Date: Sat, 28 Nov 2026 11:25:39 GMT
```

Open `http://127.0.0.1:1633/bzz/REFERENCE/`, replacing `REFERENCE` with `V1`.
The CLI assembled a **manifest** connecting `index.html` and `style.css`; the trailing slash matters for the relative CSS link.
The last command shows the stylesheet's content reference in Bee's `ETag` header; we will compare it after changing the HTML.
`--sync` waits for the upload's network synchronization rather than treating a local copy as the completed publication.
If that wait fails, inspect the CLI's error before proceeding; an empty reference file does not prove that Bee received no chunks.

### Put a Stable Feed in Front

Our website reference `V1` identifies one immutable revision.
A **feed** lets us publish successive website references under one stable feed identity: the pair **publishing account + topic**.

#### Select the Publishing Account and Topic

Connect again with a **dedicated publishing account** selected in the browser wallet:

```bash
browser-web3-signer evm connect --chain 100 --print --json > records/publisher.json
FEED_OWNER=$(jq -er .address records/publisher.json)
```

This account needs no token balance for signing feed updates.

> **Feeds use our existing postage capacity.**
> Signing and publishing an entry require no separate Gnosis transaction in this workflow.
> Each new entry is one signed single-owner chunk and occupies a postage index; the feed manifest also occupies stamped chunks.
> Both use `$STAMP`, so there is no separate feed registration fee or xBZZ payment per update.

In `tools/feed.mjs`, the line `const topic = Topic.fromString('publishing-ethereum-swarm-basics');` hashes our chosen label into a **32-byte topic**.
Keep that label and `FEED_OWNER` unchanged across website revisions; changing either selects a different feed.
Another publisher can use the same label and still have a separate feed because the owner is part of its identity.

> Earlier, `BATCH_TOPIC` identified the **`BatchCreated` event type** in Gnosis logs.
> Here, `TOPIC` selects **our feed within the publishing account's namespace**.
> Both remain constant in their respective uses; the feed's entry number advances when we publish updates.

The next snippet prepares the timestamp-and-reference feed format supported by the pinned SDK and Bee.
It uses [Swarm's native chunk primitives](<https://github.com/ethersphere/core-sdk/blob/599be256a6dfdd96418988f234bbe147146fe59b/src/chunk/soc.ts>) to calculate the digest, then verifies the browser signature before producing the upload body:

```bash
cat > tools/feed.mjs <<'JS'
import assert from 'node:assert/strict';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { FeedIndex, Topic, Reference, makeContentAddressedChunk, keccak256 } from '@ethersphere/core-sdk';
import { getAddress, getBytes, hexlify, Signature, verifyMessage } from 'ethers';
const [mode, ...args] = process.argv.slice(2);
function prepare(reference, owner, index, timestamp) {
  const topic = Topic.fromString('publishing-ethereum-swarm-basics');
  const ref = new Reference(reference);
  assert.equal(ref.toUint8Array().length, 32, 'Use an unencrypted website reference');
  const identifier = keccak256(Buffer.concat([
    topic.toUint8Array(), FeedIndex.fromBigInt(BigInt(index)).toUint8Array()]));
  const time = Buffer.alloc(8);
  time.writeBigUInt64BE(BigInt(timestamp));
  const chunk = makeContentAddressedChunk(Buffer.concat([time, ref.toUint8Array()]));
  return { owner: getAddress(owner), topic: topic.toHex(), index: String(index),
    timestamp, reference: ref.toHex(), identifier: Buffer.from(identifier).toString('hex'),
    digest: hexlify(keccak256(Buffer.concat([identifier, chunk.address.toUint8Array()]))),
    chunk: Buffer.from(chunk.data).toString('hex') };
}
if (mode === 'prepare') {
  const [reference, owner, index, file] = args;
  if (!file?.endsWith('.json')) throw Error('Provide a PLAN.json path');
  let plan;
  if (existsSync(file)) {
    plan = JSON.parse(readFileSync(file));
    assert.deepEqual(plan, prepare(reference, owner, index, plan.timestamp));
  } else {
    plan = prepare(reference, owner, index, Math.floor(Date.now() / 1000));
    writeFileSync(file, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  }
  console.log(JSON.stringify(plan, null, 2));
} else if (mode === 'verify') {
  const plan = JSON.parse(readFileSync(args[0]));
  assert.deepEqual(plan, prepare(plan.reference, plan.owner, plan.index, plan.timestamp));
  const result = JSON.parse(readFileSync(args[1]));
  const signature = Signature.from(result.signature).serialized;
  assert.equal(verifyMessage(getBytes(plan.digest), signature), plan.owner);
  writeFileSync(args[0].replace(/\.json$/, '.bin'), Buffer.from(plan.chunk, 'hex'));
  console.log(signature.slice(2));
} else {
  throw Error('Use prepare REFERENCE OWNER INDEX PLAN.json or verify PLAN.json SIGNATURE.json');
}
JS
```

#### Sign and Upload the First Entry

Each entry contains a timestamp and a reference to the already uploaded website, rather than another copy of its HTML and CSS.
For a **new feed** under this publishing account and topic, start at index **0**.
For an existing feed, resume from its saved records; do not reset its sequence to zero.
`INDEX` counts feed entries; Bee assigns a separate postage index for storing each new entry.
Run this **prepare, sign, verify, upload** block for the first revision:

```bash
INDEX=0
TARGET="$V1"
node tools/feed.mjs prepare "$TARGET" "$FEED_OWNER" "$INDEX" "records/feed-$INDEX.json"

if [ ! -s "records/feed-$INDEX.signed.json" ]; then
  browser-web3-signer evm sign-message --chain 100 --address "$FEED_OWNER" --raw "$(jq -er .digest "records/feed-$INDEX.json")" --print --json> "records/feed-$INDEX.signed.json"
fi
node tools/feed.mjs verify "records/feed-$INDEX.json" "records/feed-$INDEX.signed.json" > "records/feed-$INDEX.signature"

IDENTIFIER=$(jq -er .identifier "records/feed-$INDEX.json")
SIGNATURE=$(cat "records/feed-$INDEX.signature")
curl -fsS -X POST "$BEE_URL/soc/${FEED_OWNER#0x}/$IDENTIFIER?sig=$SIGNATURE" \
  -H "swarm-postage-batch-id: $STAMP" -H 'swarm-deferred-upload: false' \
  -H 'Content-Type: application/octet-stream' --data-binary "@records/feed-$INDEX.bin" \
  > "records/feed-$INDEX.receipt.json"
```

`--raw` means that the supplied hexadecimal value represents **bytes**; `personal_sign` supplies the Ethereum message prefix.
This signs an off-chain update, while the postage batch pays for storing it.

> Keep the prepared and signed files: after an uncertain upload, retry that same signed update rather than preparing another one at the same index.

The helper preserves an existing plan's timestamp and rejects a different target or owner for that plan; the signing step reuses its saved result.

#### Create the Feed Manifest

A **website manifest** maps file paths such as `index.html` and `style.css` to their stored content.
A **feed manifest** is an immutable descriptor containing the publishing owner, topic, and feed type (`sequence`): it tells Bee **which feed to follow** through an ordinary `/bzz/` URL.
It contains neither the latest entry number nor the current website reference.

`TOPIC=$(jq -er .topic records/feed-0.json)` reads the topic already chosen by our helper.
The following POST stores the descriptor and returns its content reference as `FEED_REF`:

```bash
TOPIC=$(jq -er .topic records/feed-0.json)
curl -fsS -X POST "$BEE_URL/feeds/${FEED_OWNER#0x}/$TOPIC" -H "swarm-postage-batch-id: $STAMP" -H 'swarm-deferred-upload: false' > records/feed-manifest.json
FEED_REF=$(jq -er .reference records/feed-manifest.json)
curl -fsS "$BEE_URL/bzz/$FEED_REF/" -o records/feed-version-1.html
cmp records/version-1.html records/feed-version-1.html
```

The feed manifest is our stable entry point: `http://127.0.0.1:1633/bzz/FEED_REFERENCE/`.
Bee [resolves a request through these layers](<https://docs.ethswarm.org/docs/develop/dynamic-content/>):

```txt
/bzz/FEED_REF/
    -> feed manifest: owner + topic + sequence
    -> latest signed entry in that feed
    -> website manifest for V1, or later V2
    -> index.html / style.css
```

Publishing version 2 adds a feed entry pointing to its website manifest.
The feed manifest's bytes and `FEED_REF` stay unchanged.

> **Create the feed manifest once and keep its reference.**
> For this Bee 2.8.3 request, the same owner, topic, and settings produce the [same unencrypted manifest and reference](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/manifest/mantaray.go>), even after the feed advances.
> Repeating the POST recreates that descriptor; it does not publish another feed entry or advance its sequence.

### Access the Publication Through a Public Gateway

Swarm has **HTTP gateways**: a gateway retrieves data through its own Bee node and serves it to an ordinary browser.
Readers can use these URLs without running a Bee node themselves.
The same Swarm references work through another compatible gateway; the hostname identifies the access provider, while the reference identifies the publication.

Use the [public gateway listed in Swarm's documentation](<https://docs.ethswarm.org/docs/desktop/publish-a-website/>).
Keep a separate URL for public downloads, leaving `BEE_URL` for our local publishing commands:

```bash
PUBLIC_GATEWAY=https://api.gateway.ethswarm.org
printf 'Fixed version 1: %s/bzz/%s/\n' "$PUBLIC_GATEWAY" "$V1"
# Fixed version 1: https://api.gateway.ethswarm.org/bzz/7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04/

printf 'Current feed:    %s/bzz/%s/\n' "$PUBLIC_GATEWAY" "$FEED_REF"
# Current feed:    https://api.gateway.ethswarm.org/bzz/c2009933da9aba0445cdcd6b407826c5c5ff51e8254fb3fe60721fe0673db823/

curl -fsSL "$PUBLIC_GATEWAY/bzz/$V1/style.css" -o records/gateway-version-1.css
cmp site/style.css records/gateway-version-1.css
curl -fsSL "$PUBLIC_GATEWAY/bzz/$FEED_REF/style.css" -o records/gateway-feed.css
cmp site/style.css records/gateway-feed.css
```

The CSS checks succeeded through both references in our experiment.

> When browsing to:
>
> * https://api.gateway.ethswarm.org/bzz/7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04/
> * https://api.gateway.ethswarm.org/bzz/c2009933da9aba0445cdcd6b407826c5c5ff51e8254fb3fe60721fe0673db823/
> 
> I am redirected to:
>
> * https://bzz.link/forbidden?hash=7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04
> * https://bzz.link/forbidden?hash=c2009933da9aba0445cdcd6b407826c5c5ff51e8254fb3fe60721fe0673db823
>
> And see the following text:
>
> > **Request Approval for This Hash**  
> > This hash is not yet approved for retrieval.
> > Please complete the approval request form below, or run your own Bee node for unrestricted access.  
> > Hashes registered with ENS can always be accessed via bzz.link subdomains, for example: myensname.bzz.link.
>
> This means that the public gateway has its own [gateway moderation](<https://docs.ethswarm.org/docs/develop/tools-and-features/gateway-proxy/>) policy.
> This service redirected our HTML requests to a **Request Approval** form at `bzz.link`, but only the HTML file. The CSS is retrievable.
>
> If you see that page, 
> * submit the form for the reference you want to browse and wait for the operator's approval, or 
> * use another gateway or 
> * a remote Bee node you control.


In the above link example `V1` identifies the fixed revision, while `FEED_REF` follows the latest signed publication.
Keep the trailing slash so relative links such as `style.css` work.

Once the chosen gateway serves the HTML, compare both access paths with our saved version:

```bash
curl -fsSL "$PUBLIC_GATEWAY/bzz/$V1/" -o records/gateway-version-1.html
cmp records/version-1.html records/gateway-version-1.html
curl -fsSL "$PUBLIC_GATEWAY/bzz/$FEED_REF/" -o records/gateway-feed.html
cmp records/version-1.html records/gateway-feed.html
```

`curl -L` follows redirects, so it can successfully download an approval page.
After synchronization, other Swarm peers can serve the publication while our uploading node is offline, provided its postage backing remains valid.
We leave our local Bee running for the next upload.

#### Workaround: Switch the Gateway

[bzz.limo](<https://bzz.limo/>) served our HTML through both the fixed revision and the feed reference, without an approval request.
The downloaded HTML and CSS matched our originals.
Switch the gateway and repeat the HTML checks:

```bash
PUBLIC_GATEWAY=https://bzz.limo
printf 'Fixed version 1: %s/bzz/%s/\n' "$PUBLIC_GATEWAY" "$V1"
# Fixed version 1: https://bzz.limo/bzz/7079f3de0e4ebe466295c6f88a68ec2812159c202e5647f5f1162a8057b6bf04/

printf 'Current feed:    %s/bzz/%s/\n' "$PUBLIC_GATEWAY" "$FEED_REF"
# Current feed:    https://bzz.limo/bzz/c2009933da9aba0445cdcd6b407826c5c5ff51e8254fb3fe60721fe0673db823/

curl -fsSL "$PUBLIC_GATEWAY/bzz/$V1/" -o records/gateway-version-1.html
cmp records/version-1.html records/gateway-version-1.html
curl -fsSL "$PUBLIC_GATEWAY/bzz/$FEED_REF/" -o records/gateway-feed.html
cmp records/version-1.html records/gateway-feed.html
```

The same `/bzz/REFERENCE/` path at [download.gateway.ethswarm.org](<https://download.gateway.ethswarm.org/>) also returned our original HTML.
However, it sent the HTTP header **`Content-Disposition: attachment`**, which tells browsers to download the file instead of displaying the website.
It therefore provides another retrieval path, while `bzz.limo` works for browsing our example.

#### Gateway Discovery and Incentives

For censorship-resistant publishing, we need to distinguish storage availability from access through a particular HTTP gateway.
A gateway can refuse to serve content that remains retrievable through Swarm peers.
Readers therefore need a choice of gateways or their own Bee node.

In the [Arweave walkthrough](../publishing-arweave-ario-basics/#gateway-discovery-and-the-limits-of-automatic-routing), we could consult the [AR.IO gateway directory](<https://gateways.ar.io/#/gateways>).
AR.IO also provides a separate incentive layer: registered gateways and observers can earn **ARIO** through its [Observation and Incentive Protocol](<https://docs.ar.io/learn/oip>), independently of Arweave's storage payments.

For Swarm, I have not found a comparable live gateway directory; its [developer resources](<https://docs.ethswarm.org/docs/develop/resources/#gateways--deploy>) provide a curated selection of services.

Swarm does have [bandwidth incentives through SWAP](<https://docs.ethswarm.org/docs/concepts/incentives/bandwidth-incentives/>), using **xBZZ** to settle accounts between Bee peers.
However, serving ordinary browsers over HTTP does not automatically earn a gateway a separate AR.IO-style reward.
The gateway may incur retrieval costs, and its operator must arrange funding for the public service.
Our postage payment funds storage; it does not purchase unlimited free access through public gateways.

> **Can AR.IO gateways also serve Swarm?**
> The [ArNS resolver specification](<https://github.com/ar-io/specs/blob/main/arns/arns-resolver-1.md>) defines Arweave and optional IPFS retrieval; IPFS support depends on the gateway's configuration.
> It currently defines no Swarm/BZZ target, so we cannot point an ArNS record at our Swarm feed and expect standard AR.IO gateways to retrieve it.
> An operator could add Bee integration, but that would require additional implementation.

### Change Only the HTML

```bash
python3 - <<'PY'
from pathlib import Path
p = Path('site/index.html')
p.write_text(p.read_text().replace('version 1', 'version 2'))
PY

swarm-cli upload site --stamp "$STAMP" --index-document index.html --redundancy MEDIUM --sync --quiet > records/version-2.ref
V2=$(cat records/version-2.ref)
cmp site/style.css records/retrieved.css
curl -fsS "$BEE_URL/bzz/$V2/style.css" -o records/retrieved-2.css
cmp site/style.css records/retrieved-2.css
curl -fsSI "$BEE_URL/bzz/$V2/style.css"
# HTTP/1.1 200 OK
# Accept-Ranges: bytes
# Access-Control-Expose-Headers: Content-Disposition
# Content-Disposition: inline; filename="style.css"
# Content-Length: 422
# Content-Type: text/css; charset=utf-8
# Etag: "8f58e4cade3a00dbeabe32de4b13986ce30b6f180edfdc445df0d074864d81e6"
# Last-Modified: Sat, 28 Nov 2026 12:40:29 GMT
# Date: Sat, 28 Nov 2026 12:40:29 GMT

INDEX=1
TARGET="$V2"
```

Repeat the **prepare, sign, verify, upload** block above, starting at `node tools/feed.mjs prepare`, with these new values.
Keep the existing feed manifest.
We are the only writer in this example; later updates must use the next available feed index rather than overwrite these entries.

```bash
curl -fsS "$BEE_URL/bzz/$FEED_REF/" -o records/feed-version-2.html
cmp site/index.html records/feed-version-2.html
curl -fsS "$BEE_URL/bzz/$V1/" -o records/old-version.html
cmp records/version-1.html records/old-version.html
```

The stable feed now follows version 2, while the first content reference still identifies version 1.
The CSS bytes and its `ETag` content reference stayed unchanged.
With the **same valid immutable batch and retained Bee state**, Bee also [reuses an unchanged chunk's recorded stamp index](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/stamper.go>); sending the directory again does not automatically consume new indices for every file.
Changed HTML, new manifest chunks, and the new feed entry need their own allocations.
Re-uploading the whole directory does not reset the batch's allocation history.
Repeat the [public gateway checks](#access-the-publication-through-a-public-gateway) for version 2, using the same chosen gateway:

```bash
curl -fL "$PUBLIC_GATEWAY/bzz/$V2/" -o records/public-version-2.html
cmp site/index.html records/public-version-2.html
curl -fL "$PUBLIC_GATEWAY/bzz/$V2/style.css" -o records/public.css
cmp site/style.css records/public.css
```

The new revision may need separate gateway approval, and a feed lookup can be affected by gateway caching delays.

#### Inspect Bee's allocation counters after uploading

```bash
curl -fsS "$BEE_URL/stamps/$STAMP/buckets" | jq '{depth, bucketDepth, bucketUpperBound, used: [.buckets[] | select(.collisions > 0)]}'
# {
#   "depth": 17,
#   "bucketDepth": 16,
#   "bucketUpperBound": 2,
#   "used": [
#     {
#       "bucketID": 4603,
#       "collisions": 1
#     },
#     {
#       "bucketID": 5028,
#       "collisions": 1
#     },
#     ...
#     {
#       "bucketID": 62981,
#       "collisions": 1
#     }
#   ]
# }
```

### Optional: Give the Feed an ENS Name

An **ENS name** such as `yourname.eth` can provide a memorable address for our publication, much as ArNS did in the Arweave example.
We link the name to the [stable feed manifest](<https://docs.ethswarm.org/docs/develop/host-your-website/#optional-connect-site-to-ens-domain>), which resolves to the website revision currently selected by the feed.

1. **Register or choose a name.** Open the [ENS App](<https://app.ens.domains/>), connect the browser-wallet account that should own the name, and use an existing name or register an available one for a chosen period.
   Review the [registration fees](<https://support.ens.domains/en/articles/17133066-register-a-eth-name>) shown by the app. ENS registration, renewal, and Ethereum gas costs are separate from our Gnosis experiment budget.
   The name owner may be the same account as our feed publisher, but these remain separate permissions.

2. **Copy the feed's Swarm URI.** Use the existing `FEED_REF`, which identifies the feed manifest, rather than either website revision's reference:

   ```bash
   printf 'bzz://%s\n' "$FEED_REF"
   ```

3. **Set the ENS content hash.** In the ENS App, open the name and select **Edit Profile → Other records → Content hash**.
   Paste the printed `bzz://...` value, preview the change, and approve publication in the wallet.
   As described in the [ENS record guide](<https://support.ens.domains/en/articles/17452873-add-a-decentralised-website-to-your-name>), this editor currently applies to ENSv2 names; for older names, use [ENS Explorer](<https://explorer.ens.domains/>) under **Records → Edit records → Contenthash**.
   Record changes require ETH for Ethereum gas.

4. **Open the website.** Replace the example name and visit `https://yourname.eth.limo/` in an ordinary browser.
   The gateway resolves the ENS content hash and serves the website through our Swarm feed; visitors do not need a wallet.
   Check that version 2 and its stylesheet load, allowing for ENS and gateway caching.

Later publications advance the feed, so the ENS content hash can stay unchanged without an Ethereum record-update transaction for every revision.
Renew the ENS name before it expires and keep the Swarm batch funded for the website, feed entries, and feed manifest.

### Optional: Extend the Storage Funding

Inspect the remaining lifetime with `swarm-cli stamp show "$STAMP"`.
The initial purchase already funds approximately one year; run the following transactions only if you want to extend that funding.
Adding the original `AMOUNT` per chunk repeats the original xBZZ postage payment, with additional gas fees.
Switch back to the paying account, reuse the exact-cost approval and wait for its receipt, then call the postage contract's [`topUp`](<https://github.com/ethersphere/storage-incentives/blob/8ed9ca10238c487d0f92573417e66eb995653abb/src/PostageStamp.sol>) function:

```bash
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" \
  --to "$BZZ_TOKEN" --data "$APPROVE" --print --json > records/topup-approve.json
node tools/evm.mjs wait "$(jq -er .txHash records/topup-approve.json)" > records/topup-approve.receipt.json

TOPUP=$(node tools/evm.mjs 'topUp(bytes32,uint256)' "0x$STAMP" "$AMOUNT")
browser-web3-signer evm send-transaction --chain 100 --from "$PAYER" \
  --to "$POSTAGE" --data "$TOPUP" --print --json > records/topup.json
node tools/evm.mjs wait "$(jq -er .txHash records/topup.json)" > records/topup.receipt.json
swarm-cli stamp show "$STAMP"
```

Do this before the batch expires.
An expired batch cannot be revived with a top-up.
It adds funding to that batch, covering our website versions, feed updates, and feed manifest; it does not change their references.
The extra lifetime depends on the storage price at that time.

### Keep the State for Future Publications

When finished, stop the background node, wait for it to exit, and create a fresh archive of its current state:

```bash
kill "$BEE_PID"
wait "$BEE_PID"

STATE_BACKUP=$(mktemp "$swarm_demo_dir/records/bee-state.XXXXXXXX.tar.gz")
tar -czf "$STATE_BACKUP" -C "$swarm_demo_dir" state
tar -tzf "$STATE_BACKUP" > /dev/null
printf 'State backup: %s\n' "$STATE_BACKUP"
```

The archive includes the whole `state/` directory, including the keys, `statestore`, and `stamperstore`.
**A current, complete backup lets us restore the directory and continue using the same batch** if the working copy is lost.
Keep the archive and publication records, with the Bee password stored separately.

> **The initial backup is not enough after uploading.**
> The archive created after `bee init` preserves our identity, but predates the batch purchase and subsequent stamp assignments.
> Restoring that older snapshot recovers our authority over the batch, but not the later bookkeeping of which indices were assigned to which chunks.
> The blockchain records batch parameters; individual assignments travel with stamped chunks and are tracked by [receiving storage nodes](#how-storage-nodes-enforce-stamp-usage).
> Restoring stale bookkeeping can therefore cause conflicting index assignments even with an immutable batch.
> Refresh the backup after each publishing session, while Bee is stopped, to preserve safe continuation of uploads.

Existing stamped chunks could in principle help reconstruct assignments, but each storage node holds only part of the network's data.
Its indexes describe retained chunks, rather than a complete historical ledger of everything we stamped; our private key does not identify all those uploads.
Bee 2.8.3's [automatic bucket-counter recovery](<https://github.com/ethersphere/bee/blob/v2.8.3/pkg/postage/service.go>) reads its **local stamp records**.
It does not reconstruct the complete allocation history from remote peers merely by restoring our identity; a current backup preserves that bookkeeping directly.

The browser-wallet publishing account keeps control of the feed independently.
Stop the old node before restoring this state on another machine, and do not run two copies against the same batch bookkeeping.
Stopping our local Bee does not cancel the publication or pause its rent: synchronized chunks remain retrievable from other peers while they have valid postage backing.

## Conclusion

For this publishing experiment, **Swarm feels more like a block device than a file system**.
Its content addressing makes unchanged data easy to reuse, and feeds provide an elegant way to move the publication's "head" forward.
But the publisher also has to understand chunks, batches, buckets, stamp allocation, recurring funding, and local bookkeeping.
For a small website, that is considerable machinery to manage.

In the [Arweave example](../publishing-arweave-ario-basics/), paying for file uploads and relying on a storage endowment intended to fund indefinite retention was easier to reason about.
Swarm instead makes storage an ongoing commitment: keep the batch funded and preserve the state needed to continue using it safely.
Neither system's persistent identifier alone guarantees successful retrieval, as both walkthroughs demonstrated.

The gateway experience reinforces this impression: **public browser access feels like an afterthought in Swarm**.
We encountered a hash-approval form and had to discover a working alternative manually.
I found no equivalent of the [AR.IO gateway directory](<https://gateways.ar.io/#/gateways>) or its separate [ARIO rewards for gateway service](<https://docs.ar.io/learn/oip>).
Swarm incentivizes storage and peer-to-peer bandwidth, but a redundant public HTTP gateway layer is not an integral part of that arrangement.
Systems drive behaviour: leaving that layer to volunteers, sponsors, or separately financed services provides a weaker foundation for reliable public access.

A useful direction would be collaboration between Swarm and AR.IO: **add `bzz://` references as another storage backend for AR.IO gateways**.
An operator could add a local Bee node alongside its existing Arweave backend and reuse the gateway's HTTP serving, caching, naming, and operational infrastructure.
Extending reference routing and service checks would let readers discover suitable gateways through the same network.
ARIO would reward the gateway service, while publishers would continue paying their chosen storage network.
There is no fundamental reason that this delivery layer must be restricted to Arweave.

Storage payments do not make delivery cost-free, however.
Swarm postage pays for retention; the gateway's Bee can separately incur xBZZ charges through [SWAP bandwidth accounting](<https://docs.ethswarm.org/docs/concepts/incentives/bandwidth-incentives/>).
The gateway's funding, including ARIO rewards, would need to cover those costs alongside its servers and internet bandwidth.
That is an operating expense to account for, rather than a reason to build an entirely separate gateway ecosystem.

A broad population of incentivized, independently operated gateways would also strengthen censorship-resistant publishing.
Individual operators may still moderate content or face legal restrictions, but operators in different jurisdictions increase the chances of finding a gateway able and willing to serve a publication.
That would make Swarm's decentralized storage considerably more useful to readers in ordinary browsers.
