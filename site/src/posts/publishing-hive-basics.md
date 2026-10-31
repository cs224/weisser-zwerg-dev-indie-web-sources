---
layout: "layouts/post-with-toc.njk"
title: "Hive from First Principles: Blockchain, Accounts, and Social Economics"
description: "Understanding Hive as a publishing and social ecosystem"
seodescription: "A practical introduction to Hive: its blockchain, accounts, keys, resource credits, communities, front ends, and role in independent web publishing."
creationdate: 2026-10-31
keywords: Hive, independent publishing, blockchain publishing, decentralized social media, Hive accounts, Hive keys, Resource Credits, Hive communities, content syndication
date: 2026-10-31
tags: ['post']
---

## Rationale

In [Nostr from First Principles](../publishing-nostr-basics/), I described the publishing approach behind my blog, rooted in the [IndieWeb](https://indieweb.org/) movement
and the [POSSE](https://indieweb.org/POSSE) acronym: **Publish on your Own Site, Syndicate Elsewhere**. This remains the underlying theme of this blog post about [Hive](https://hive.io/), too.

Nostr approaches publishing-related tasks through cryptographic identities, signed events, independently operated relays, and clients that turn the shared protocol into very different applications.
With Nostr, much of my initial confusion came from the space between these building blocks.
Relays can contain different sets of events, clients can use different relays and understand different event kinds, and applications built on the protocol can feel radically different from each other.
The difficult question was how a coherent community and user experience could emerge from that decentralized collection of identities, events, relays, and clients.

Hive produced almost the opposite confusion.
Its publishing applications generally expose the same accounts, posts, comments, votes, and balances because they read from **one canonical [blockchain](https://hivehub.dev/)** and a **largely shared data model**.
An article published once can therefore appear through [Hive.blog](https://new.hive.blog/), [PeakD](https://peakd.com/), and [Ecency](https://ecency.com/) without having been copied independently into three unrelated publishing platforms.
These applications differ in presentation and additional features, but the resulting experience feels much more coherent than the different application galaxies around Nostr.

> **Blockchain explorers** expose accounts, blocks, transactions, and their underlying operations independently of the social front ends:
>
> * **HiveHub:** <https://hivehub.dev/>. Direct transaction lookup: `https://hivehub.dev/tx/TRANSACTION_ID`
> * **HiveScan:** <https://hivescan.info/>. Direct transaction lookup: `https://hivescan.info/transaction/TRANSACTION_ID`
> * **OpenHive explorer:** <https://explore.openhive.network/>. Its HAF Block Explorer API is documented at <https://tools.openhive.network/hafbe/>.
> * **HiveBlocks:** <https://hiveblocks.com/>. Direct transaction lookup: `https://hiveblocks.com/tx/TRANSACTION_ID`
>
> Replace `TRANSACTION_ID` with the identifier returned after broadcasting a transaction.

The difficult part was understanding the machinery underneath that coherent experience.

On Hive, I cannot create a complete identity locally, as I can with Nostr. Instead, an existing account must create it on-chain. Why?
Why does one account have four different kinds of keys: the owner, active, posting, and memo keys; with different permissions?
Why are five different quantities that initially look like "Hive currencies" connected to an account: HIVE, Hive Backed Dollars, Hive Power, Resource Credits, and voting mana?
How do rewards and witness governance fit into that picture?
And if Hive already has a common publishing model, why do short-form messages appear as PeakD Snaps, InLeo Threads, Ecency Waves, or other application-specific conventions rather than one universal equivalent of a tweet?

These questions lead below the visible blogging applications into Hive's account system, role-based authority, resource allocation, token economics, stake-weighted social judgment, and Delegated Proof of Stake consensus.

Like the Nostr article, this one approaches Hive by foot.
It begins with the history and context of the ecosystem.
It then follows the concrete path from an account and its keys to a signed publication, its appearance through several front ends, and the interactions recorded around it.
The purpose of this blog post is to help you understand how Hive can act as a public publishing, syndication, discovery, and conversation layer whose records are not owned by any one of its user-facing applications.

## From Steem to Hive

Hive began in 2020, but its history did not start from scratch.
Its origins lie in [Steem](https://steem.com/about), whose first block was produced on March 24, 2016.
Hive can therefore be described as both a blockchain launched in 2020 and the continuation of a social blockchain design operating since 2016.

Steem already combined accounts, posts, comments, votes, token rewards, and Delegated Proof of Stake, while Steemit was its first user-facing application.
Much of the model that initially makes Hive unusual therefore predates Hive itself.

The split followed a conflict over control of Steem.
When Justin Sun of TRON acquired Steemit Inc. in early 2020, he also gained access to a very large block of STEEM that had long been controversial within the community.
Because stake determines witness elections, control of that stake, including the temporary use of stake held by exchanges during the dispute, raised the practical risk that one party could replace the elected witness accounts and dominate the network's governance.

> **What is a Hive witness?** Hive stakeholders elect witness accounts.
> A person, team, or organization operates each account and runs Hive node software that signs blocks when the witness is scheduled to produce one.
> A *witness* therefore refers primarily to the elected account and operator role; a *witness node* is a machine performing that role.
> For more detail, see the Hive developer [glossary](<https://developers.hive.io/glossary/>) and the [Hive FAQ](<https://new.hive.blog/faq.html>).

Part of the Steem community responded by creating Hive through a hard fork on [March 20, 2020](https://hivedocs.info/news/2020/03/17/announcing-the-launch-of-hive-blockchain.html).
The fork copied Steem's history and most of its state, including accounts, content, and corresponding balances, while excluding the Steemit Inc. stake and some accounts associated with the attempted centralization from the initial HIVE distribution.
From that point onward, Steem and Hive were independent networks: publishing or transferring something on one chain no longer affected the other.

This history also explains why witness elections, stake distribution, and community control are not secondary details in Hive, but central parts of how the ecosystem understands itself.

## HIVE, HBD, Hive Power, and Rechargeable Capacity

At first, Hive appears to have several different currencies.
In fact, only **HIVE** and **Hive Backed Dollars (HBD)** are transferable assets.
Hive Power, Resource Credits, and voting mana are different parts of the system built around them.

**HIVE** is the liquid base token.
It can be transferred, traded, or *powered up* into **Hive Power (HP)**.

In more familiar terminology, the Hive community's phrase *powering up* means "staking".
Powering up (staking) is immediate; converting HP back into liquid HIVE, called *powering down* (un-staking), releases it in 13 weekly portions.
HP is therefore not another coin, but the staked form of HIVE.

The more Hive Power (HP) your account has, the more Resource Credit (RC) capacity it holds.
Resource Credits are what the account consumes when you post.
They are an account's rechargeable allowance for writing to the blockchain.
Publishing a post, commenting, voting, transferring tokens, or changing account data consumes RC; merely reading the chain does not.
No matter how large the account's RC capacity is, the recharge period remains five days: if the account makes no further transactions, its RC returns from empty to full during that time.
Hive Power also gives the account greater influence over content rewards and more voting weight in governance.

**HBD**, or Hive Backed Dollars, is a second, chain-native asset intended to remain close to one US dollar through conversions backed by HIVE.
You can think of HBD as a kind of "stablecoin".
It can be used for payments and savings, and content rewards may include it.
It is not required for publishing, however, and its dollar relationship is a protocol objective with safeguards and limits, and not a bank guarantee.

As described above, an account's maximum RC is tied primarily to its staked HIVE.
If an account cannot afford a transaction because it has insufficient RC, nodes reject it until enough RC has regenerated.
This makes RC a kind of rate limiter.
A spammer eventually exhausts the ability to publish, but the protocol does not decide whether the content itself is spam.

**Voting mana** is another rechargeable allowance, separate from RC.
A vote consumes RC because it is a blockchain transaction, while voting mana limits how often an account can exercise the reward influence attached to its HP.
Since Hardfork 28, a full-strength vote retains its full weight rather than becoming progressively weaker as mana falls, but repeated voting can exhaust the available mana.

This matters because Hive's content votes are not merely likes.
Part of the newly issued supply enters a reward pool, and stake-weighted upvotes and downvotes help determine how that pool is divided among eligible posts.
**Authors** can receive rewards for producing content, while **curators** can receive rewards for identifying it.

> **Authors and curators are complementary roles in Hive's content economy.**  
> Authors create the work; curators spend attention and stake-weighted voting capacity to discover, evaluate, and surface it.
> The reward system can compensate both activities because producing useful material and finding useful material for others are both valuable.
> One person can act in both roles, and a *curator* here is not necessarily a moderator: it is a voter whose selection helps direct the reward pool.

The voters are not transferring HIVE from their own balances; they are directing the allocation of protocol-created rewards.

The publishing path can therefore be summarized as:

> power up HIVE into HP → receive renewable RC → publish without spending HIVE → let stake-weighted votes influence rewards

This also exposes the central economic trade-off.
Hive is based on acquiring and locking the token for capacity and influence, not repeatedly spending it for service.
Once a person or application has enough HP for its activity, it may never need to buy more merely to keep publishing.
Additional use creates new demand for HIVE only when users or applications need more capacity, reward influence, or governance weight.
At the same time, newly issued rewards pay authors, curators, witnesses, and ecosystem development, and some recipients may sell them.
The model therefore depends on continued demand to own and power up HIVE being strong enough to absorb newly liquid supply; ordinary posting activity does not guarantee that equilibrium between supply and demand by itself.

> Further reading:
>
> * [Hive whitepaper](<https://hive.io/whitepaper.pdf>)
> * [Resource Credit system](<https://developers.hive.io/tutorials-recipes/rc-bandwidth-system.html>)
> * [HBD design and safeguards](<https://hive.io/hbd/>)
> * [Hardfork 28 and the current voting model](<https://new.hive.blog/hive/@hiveio/nine-awesome-updates-you-re-already-using-meet-hive-1-28-release-roundup>)

## Communities, Categories, and Tags

Hive uses **categories**, **communities**, and **tags** to structure content and make it discoverable to human readers.

Categories and communities can be thought of as "places", while tags primarily describe what a post is about.

Categories are the older construct. They are freely chosen labels and, by convention, represented by the first tag.
Communities are registered spaces with owners and special category identifiers. They support community building and moderation.
You can browse them in community catalogues.

For an ordinary post outside a community, the author selects a **category** such as `publishing`, `photography`, or `test`.
Existing category lists merely report labels that people have already used.
They are useful for discovery, but they do not define which categories are allowed.

The category also has a technical role.
Hive stores both root posts and replies through the same comment operation.
A reply identifies its parent author and parent permlink, while a root post leaves the parent author empty and uses a non-empty parent permlink as its primary category or destination.
Front ends commonly treat the category as the first and most important tag.

**Tags** are additional topic labels stored in the post's JSON metadata.
They help front ends and indexers build feeds, search results, and trending views.
They are free-form in the sense that no central registry decides which subjects exist, but applications still impose formatting rules such as lowercase spelling, restricted characters, and length or count limits.
A phrase such as `independent publishing` may therefore need to become `independent-publishing`.

A visible `#hashtag` inside the article body is related, but it is not necessarily the same thing as a metadata tag.
Some applications recognize hashtags and copy or interpret them for discovery, especially in short-form interfaces.
For a regular article, the metadata tag list is the more dependable way to describe its subjects across Hive front ends.

A **community** is different.
It is a registered, organized space with an identifier such as `hive-139531`, a display name, a description, rules, subscribers, and roles for owners, administrators, moderators, members, and guests.
When publishing into a community, its identifier takes the place of the ordinary category as the post's primary destination.
The article can still carry topic tags describing its content.

Communities add social organization.
The post, votes, and moderation actions remain records on the Hive blockchain, while Hivemind and user-facing applications interpret those records as community membership, feeds, roles, pinned posts, or muted posts.
A moderator can remove an article from the normal community view, but that action does not erase the original publication from the blockchain.
Another indexer or application can still choose to expose it.

> **What is Hivemind?** Hivemind is open-source indexing and API software for Hive's social features.
> It reads the canonical blockchain and builds convenient, queryable views of posts, feeds, follows, communities, moderation actions, and reputation.
> Applications can ask a Hivemind service for a community feed instead of replaying and interpreting the complete blockchain themselves.
> Hivemind does not create blockchain consensus or delete the underlying records.
> It is an interpretation layer that an operator can run independently, so another indexer or application can present the same blockchain data differently.
> The project and its architecture are documented at <https://github.com/openhive-network/hivemind>.

> **What does "topic" mean?** The word is overloaded.
> People often use *topic* informally for the subject represented by a tag.
> The Hive community specification also calls the common `hive-1...` community type a *Topic*.
> It is therefore better to ask whether someone means a subject tag, a post inside a community, or the formal community type rather than assuming that *topic* names another universal field.

The resulting model is:

> ordinary post: category for placement, tags for subjects
>
> community post: community for placement, tags for subjects

You do not need to join or select a community merely to publish.
An ordinary category is sufficient.
Choosing a community is useful when you deliberately want to participate in its audience, rules, moderation, and shared feed.

> Further reading:
>
> * [Hive posts and the comment operation](<https://developers.hive.io/apidefinitions/broadcast-ops.html>)
> * [Hivemind community specification](<https://github.com/openhive-network/hivemind/blob/master/docs/communities.md>)
> * [Ecency's guide to communities and audience building](<https://docs.ecency.com/guides/grow-your-audience/>)

## Accounts, Keys, and "Tweets"

The remaining unusual parts of Hive follow from its account-centered design.
An account is a globally registered name, a set of authorities, a wallet, a publishing identity, and a record of social and governance activity.
It is more than a locally generated key pair.

> **What is an authority?** An authority is an on-chain rule describing which signatures are sufficient to approve a particular class of actions for an account.
> It contains a required threshold and a weighted list of public keys or other Hive accounts.
> A simple authority may say that one particular key has weight 1 and that weight 1 is sufficient.
> A more elaborate authority can require several keys or allow another account to participate.
> When a transaction is submitted, Hive checks whether its signatures satisfy the required owner, active, or posting authority.
> The private keys remain with their holders; the blockchain stores only the public permission rules.

### An Account Must Be Created by Another Account

With Nostr, generating a key pair immediately creates a usable identity.
With Hive, you can generate keys locally, but an existing account must still register the new account name on the blockchain.
That account submits the creation operation, supplies either a fee or a previously claimed account-creation ticket, and assigns the new account's initial public authorities.

Account names and their state permanently consume shared blockchain resources, so creation itself must be scarce enough to discourage unlimited automated registrations.
This is why a first-time user normally needs a sponsor, an application that subsidizes onboarding, or a paid registration provider.
Email or identity verification may be required by a particular registration provider, but it is not required by the Hive protocol itself.

There is therefore a public "who created whom" lineage, but not a parent-child ownership hierarchy.
If the new account's authorities contain only public keys controlled by the new user, the creator cannot publish or transfer funds through the new account.
The creator is normally assigned as the initial recovery account, but this is a special recovery role rather than an administrator account.
Recovery requires cooperation with the recovery account and proof based on a recent owner authority.

> **How does account recovery work?** The mechanism is primarily designed to recover an account whose owner authority was replaced after a compromise.
> First, the designated recovery account submits a recovery request naming a new owner authority.
> The account holder then completes the recovery by proving control of both that new authority and an owner authority that was valid during the previous 30 days.
> Neither side can complete the process alone: the recovery account cannot simply seize the account, and the account holder cannot use this procedure without the recovery account's cooperation.
> It is also not a general replacement for backing up the owner key.
> If all recent owner credentials are lost, there may be nothing with which to prove the recovery claim.
> The designated recovery account can be changed separately.
> The detailed procedure and its operations are documented at <https://developers.hive.io/tutorials-python/account_recovery.html>.

This explains why creating my first Hive account initially felt strangely disconnected from publishing.
The registration service was acting as a registrar for Hive's global account namespace, not as the platform on which I would necessarily publish later.

### Several Authorities Instead of One All-Powerful Key

Hive separates common activities by risk:

* The **posting authority** signs posts, comments, votes, and other social operations.
* The **active authority** controls transfers and many financial or administrative operations.
* The **owner authority** can replace the other authorities and participates in account recovery. It should normally remain offline.
* The **memo key** encrypts and decrypts transfer memos. It is not a general transaction authority.

Wallets often present these as four private keys derived from one master password.
The master password is a wallet convention, however, and is not stored or checked by the blockchain.
More precisely, owner, active, and posting are authority definitions.
Each can contain several keys or authorized accounts, weights, and a threshold, which also permits multisignature arrangements.

This separation follows the principle of least privilege.
A publishing tool normally needs only the posting authority.
If that key is compromised, an attacker may vandalize posts or votes, but should not be able to transfer funds or replace the owner authority.
A wallet or signer such as [Hive Keychain](https://hive-keychain.com/) or [Beekeeper](https://github.com/openhive-network/beekeeper) can keep the private key isolated while an application requests the required signature.

### "Tweets" Without a Universal Tweet Operation

Hive's shared protocol defines posts and comments, but no universal short-message type.
Applications therefore created their own conventions for presenting short content:

* [PeakD](https://peakd.com/) calls them **Snaps**.
* [INLEO](https://inleo.io/) calls them **Threads**.
* [Ecency](https://ecency.com/) calls them **Waves**.
* [Liketu](https://liketu.com/) calls them **Moments**.
* [D.Buzz](https://github.com/d-buzz/d.buzz-client) called them **Buzzes**. Its dedicated front end no longer appears to be [operational](https://hiveprojects.io/projects/p/dbuzz/).

These short-message conventions commonly use comments beneath container posts created by their respective applications.
The application presents those comments as a microblogging feed and hides the container structure from ordinary users.
D.Buzz instead used root posts for its short messages.

The blockchain still contains normal Hive posts, comments, authors, signatures, and votes.
The special meaning comes from the parent post, metadata, and the convention understood by a particular front end.
Publishing a Wave therefore does not automatically create a Thread or a Snap.
Another application can choose to recognize and aggregate several conventions, as Ecency does, but that interoperability is an application feature rather than a requirement of the Hive protocol.

This is the small but important limit to Hive's otherwise coherent user experience.
All applications see the same underlying chain, but they do not have to interpret every record in the same way.

> Further reading:
>
> * [Hive account creation](<https://developers.hive.io/tutorials-recipes/account-creation-process.html>)
> * [Account, comment, and authority operations](<https://developers.hive.io/apidefinitions/broadcast-ops.html>)
> * [Hive authentication and external signers](<https://developers.hive.io/quickstart/authentication.html>)
> * [Ecency Waves and its aggregation of short-content conventions](<https://docs.ecency.com/ecency/waves/about/>)

## Learning It by Foot

The preceding sections explained enough of the Hive ecosystem for the following walkthrough to be less confusing.
We can now follow the process from account creation to publication in detail, "by foot", using command-line tools.

I created my first Hive account, [`cs224`](https://hive.ausbit.dev/@cs224), through <https://hivedex.io/signup>.
I paid roughly USD 0.50 in USDC on Polygon via my [MetaMask](https://metamask.com/) wallet and received the account name, a master password, and the derived owner, active, posting, and memo keys.
That was a practical way to enter the ecosystem, but it hid the Hive account creation details.

For this walkthrough, we will make that step visible.
We will use `cs224`, its available resources, and [Clive](https://gitlab.syncad.com/hive/clive) to create a separate account for the experiment.
The new account's keys will be generated locally, while `cs224` will authorize and pay for the account-creation operation.
The resulting public record will show which account created the new one and which authorities were assigned, without giving the creator ownership of the new account's private keys.

The complete experiment will proceed as follows:

1. Install Clive and start its Beekeeper signing service.
2. Inspect `cs224` without using private keys, including its authorities, balances, Hive Power, Resource Credits, and voting mana.
3. Generate the new account's credentials locally and distinguish the owner, active, posting, and memo roles.
4. Construct, review, sign, and broadcast an account-creation operation through `cs224`.
5. Retrieve the new account through a public API and inspect its creator, recovery account, and authorities in a blockchain explorer.
6. Create a local Clive profile for the new account and import only the posting key needed for publishing.
7. Construct an unsigned `comment_operation` for a small article and review its category, permlink, title, body, tags, and metadata.
8. Sign the transaction with the posting authority and broadcast it through one Hive API node.
9. Retrieve the transaction and post through the public API, inspect the underlying operation in a blockchain explorer, and open the same publication through [Hive.blog](https://new.hive.blog/), [PeakD](https://peakd.com/), and [Ecency](https://ecency.com/).
10. Publish a short PeakD Snap and compare its underlying comment operation with the root article.

The network model differs from the earlier Nostr experiment.
With Nostr, we sent the same signed event to several independent relays and then checked which relays retained it.
With Hive, we submit one signed transaction to a Hive node.
Consensus incorporates it into the shared blockchain, after which other nodes, explorers, indexers, and social front ends can expose the same record.
[Hive.blog](https://new.hive.blog/), [PeakD](https://peakd.com/), and [Ecency](https://ecency.com/) are therefore alternative views of the publication, not separate publication destinations.

### Install Clive and Start Beekeeper

[Clive](https://github.com/openhive-network/clive) is a command-line and terminal user-interface application for interacting with Hive.

> The name **Clive** combines **CLI** and **Hive**: it is a CLI for Hive.
> Clive also provides two ways to use the same underlying functionality.
> Its **command-line interface (CLI)** accepts explicit commands that can be inspected, repeated, and automated.
> Its **terminal user interface (TUI)** provides an interactive application inside the terminal.
> This walkthrough uses the CLI because it makes each operation visible.

It can inspect public blockchain data, construct operations and transactions, and submit them to a Hive API node.
For operations that require a signature, Clive works with [Beekeeper](https://github.com/openhive-network/beekeeper), a separate local wallet and signing service.

The walkthrough assumes Bash, `curl`, and `jq`, with all commands run in the same shell so that their variables remain available; `tree` is optional and only displays the generated files.

The installation below uses [uv](https://docs.astral.sh/uv/getting-started/installation/) and pins the exact Clive version used for this walkthrough:

```bash
(
  cd "$HOME"

  env \
    -u UV_CACHE_DIR \
    -u UV_TOOL_DIR \
    -u UV_TOOL_BIN_DIR \
    -u UV_OFFLINE \
    uv tool install --no-config --python 3.12 --index https://gitlab.syncad.com/api/v4/groups/136/-/packages/pypi/simple --prerelease allow "hiveio-clive==1.28.8.1.post20261012134504"
)
```

> The command is deliberately explicit so that the installation location does not depend on the current project.  
> The subshell changes to the home directory only temporarily.  
> The `env -u` options remove project-specific `uv` overrides, while `--no-config` prevents an unrelated `pyproject.toml` or `uv.toml` from affecting the installation.  
> When the command finishes, the subshell exits and leaves the original working directory unchanged.
>
> With the default Linux locations, `uv` normally stores:
>
> * the isolated Clive environment below `~/.local/share/uv/tools/`;
> * the `clive` executable in `~/.local/bin/`;
> * downloaded packages below `~/.cache/uv/`;
> * a managed Python installation, if needed, below the directory reported by `uv python dir`.

> `uv tool update-shell` adds the tool-executable directory to the appropriate shell startup file, such as `~/.bashrc`.  
> For Bash, the manual alternative is to add `export PATH="$HOME/.local/bin:$PATH"` to `~/.bashrc`.  
> To change `PATH` only in the current shell, run `export PATH="$(uv tool dir --bin):$PATH"` instead.

Check which executable the shell finds and which version it reports:

```bash
command -v clive  # ~/.local/bin/clive
clive --version   # Clive version: 1.28.8.1.post20261012134504
                  # Storage model revision: e7977c85
                  # Storage model version: 3
```

If `command -v clive` finds nothing, the directory used by `uv` for tool executables is not yet on the shell's `PATH`.
You can add it to the current shell with:

```bash
export PATH="$(uv tool dir --bin):$PATH"
```

The installed `clive` command is the user-facing client.
Beekeeper plays the role of the [trusted signer](../publishing-nostr-basics/#the-trusted-signer-pattern) introduced in the Nostr article: it holds encrypted wallet data, unlocks it after you enter the wallet password, and creates signatures without exposing the private key to every command that needs one.
Start a dedicated Beekeeper process for this walkthrough:

```bash
clive beekeeper spawn
```

Clive prints output resembling the following, with a dynamically selected port and a newly created session token:

```text
Launching beekeeper...
Beekeeper started on http://127.0.0.1:PORT with pid PROCESS_ID.
If you want to use that beekeeper in Clive CLI env, please set:
export CLIVE_BEEKEEPER__REMOTE_ADDRESS=http://127.0.0.1:PORT
export CLIVE_BEEKEEPER__SESSION_TOKEN=SESSION_TOKEN
```

Copy the two `export` commands printed by your invocation into the same shell in which you will run the remaining commands.
Do not copy the literal placeholders above.
The address tells Clive where the local Beekeeper process is listening, while the session token authorizes access to that Beekeeper session.
The token is not a Hive private key, but it should still not be published or shared.

Verify that Clive can reach the process:

```bash
clive beekeeper info
```

At this point Beekeeper is running, but we have not yet created a Clive profile, imported a private key, signed anything, or submitted anything to Hive.
After completing the experiment, we can close the process with `clive beekeeper close` and remove the two environment variables from the shell.

### Inspect the Existing Account Without Private Keys

Hive account data is public.
Reading it requires neither a private key nor an unlocked wallet, and it does not consume Resource Credits.
Clive's `call` command can query a public Hive API node directly when given `--node-address`, without using the Beekeeper session or a Clive profile.

Set the account and API node once, and create a directory for the public responses used below:

```bash
hive_node="https://api.hive.blog"
hive_account="cs224"
hive_inspection_dir="${XDG_STATE_HOME:-$HOME/.local/state}/hive-by-foot"
install -d -m 700 "$hive_inspection_dir"
```

Retrieve the account object, the current global vesting totals, and the account's Resource Credit state:

```bash
clive call --node-address "$hive_node" database_api find_accounts "{\"accounts\":[\"$hive_account\"]}" > "$hive_inspection_dir/account.json"
clive call --node-address "$hive_node" database_api get_dynamic_global_properties > "$hive_inspection_dir/globals.json"
clive call --node-address "$hive_node" rc_api find_rc_accounts "{\"accounts\":[\"$hive_account\"]}" > "$hive_inspection_dir/resource-credits.json"

cat $hive_inspection_dir/account.json | jq .
# {
#   "accounts": [
#     {
#       "id": 2621184,
#       "name": "cs224",
#     ...
#     }
#     "posting_json_metadata": "{\"profile\":{\"website\":\"https://weisser-zwerg.dev/\",\"version\":2,\"profile_image\":\"https://weisser-zwerg.dev/android-chrome-256x256.png\"}}",
#     "created": "2026-10-14T14:42:30",
#     ...
cat $hive_inspection_dir/resource-credits.json | jq .
# {
#   "rc_accounts": [
#     {
#       "account": "cs224",
#       "rc_manabar": {
#         "current_mana": 326073295462,
#         "last_update_time": 1793417571
#       },
#       "max_rc": 326168266657,
#       "max_rc_creation_adjustment": {
#         "amount": "4820447408",
#         "nai": "@@000000037",
#         "precision": 6
#       },
#       "delegated_rc": 0,
#       "received_delegated_rc": 0
#     }
#   ]
# }
```

These commands only perform read-only API calls.
The saved responses also make the following calculations reproducible without querying the node again.

The account response contains its public authority rules, memo public key, liquid and savings balances, vesting shares, and voting manabar.
The following [`jq`](https://jqlang.org/) command selects those fields from the larger object:

```bash
jq '.accounts[0] | {name, recovery_account, owner, active, posting, memo_key, balance, hbd_balance, savings_balance, savings_hbd_balance, vesting_shares, delegated_vesting_shares, received_vesting_shares, voting_manabar}' "$hive_inspection_dir/account.json"
```

The `owner`, `active`, and `posting` objects contain thresholds and weighted public keys or account references.
These rules must be public so that every node can verify signatures.
They do not reveal the corresponding private keys.
Similarly, `memo_key` is the public memo key, not the secret needed to decrypt a memo.

Hive's API represents assets with an integer `amount`, a decimal `precision`, and a numerical asset identifier called an NAI.
For example, an amount of `203001` with precision `3` represents `203.001` units.
Hive Power is not stored directly in the account object: Hive records **VESTS**, whose current HIVE value depends on the global ratio between `total_vesting_fund_hive` and `total_vesting_shares`.
We can calculate both owned and effective Hive Power from the two saved responses:

```bash
jq -n --slurpfile account "$hive_inspection_dir/account.json" --slurpfile globals "$hive_inspection_dir/globals.json" '
  ($account[0].accounts[0]) as $a |
  ($globals[0]) as $g |
  ($a.vesting_shares.amount | tonumber) as $owned_vests |
  ($a.delegated_vesting_shares.amount | tonumber) as $delegated_vests |
  ($a.received_vesting_shares.amount | tonumber) as $received_vests |
  ($g.total_vesting_fund_hive.amount | tonumber) as $fund_milli_hive |
  ($g.total_vesting_shares.amount | tonumber) as $total_vests |
  {
    owned_hive_power: (((($owned_vests * $fund_milli_hive / $total_vests / 1000) * 1000) | round) / 1000),
    effective_hive_power: (((((($owned_vests - $delegated_vests + $received_vests) * $fund_milli_hive / $total_vests / 1000)) * 1000) | round) / 1000)
  }
'
# {
#   "owned_hive_power": 200.25,
#   "effective_hive_power": 200.25
# }
```

Owned Hive Power comes from the account's own vesting shares.
Effective Hive Power subtracts outgoing delegations and adds incoming delegations, giving the stake currently available to the account for voting influence and stake-derived capacity.
Hive can also delegate Resource Credits directly without transferring Hive Power; those delegations are included separately in the `rc_api.find_rc_accounts` response.

Resource Credits use a five-day manabar.
The API stores the value at its last update time rather than rewriting it continuously, so the current percentage is calculated by adding the regeneration since that timestamp and capping the result at `max_rc`:

```bash
jq '
  .rc_accounts[0] as $r |
  ($r.max_rc | tonumber) as $max |
  ($r.rc_manabar.current_mana | tonumber) as $stored |
  ([0, (now - $r.rc_manabar.last_update_time)] | max) as $elapsed |
  ([$max, ($stored + ($elapsed * $max / 432000))] | min) as $regenerated |
  ([0, $regenerated] | max) as $current |
  {
    account: $r.account,
    max_rc: $r.max_rc,
    last_update_utc: ($r.rc_manabar.last_update_time | todate),
    estimated_current_rc: ($current | floor),
    estimated_rc_percent: ((((100 * $current / $max) * 100) | round) / 100)
  }
' "$hive_inspection_dir/resource-credits.json"
# {
#   "account": "cs224",
#   "max_rc": 326168266657,
#   "last_update_utc": "2026-10-31T03:32:51Z",
#   "estimated_current_rc": 326168266657,
#   "estimated_rc_percent": 100
# }
```

Voting mana follows the same general manabar idea and also regenerates over five days.
Its maximum is based on the effective vesting shares calculated from owned, delegated, and received VESTS:

```bash
jq '
  .accounts[0] as $a |
  (($a.vesting_shares.amount | tonumber) - ($a.delegated_vesting_shares.amount | tonumber) + ($a.received_vesting_shares.amount | tonumber)) as $max |
  ($a.voting_manabar.current_mana | tonumber) as $stored |
  ([0, (now - $a.voting_manabar.last_update_time)] | max) as $elapsed |
  ([$max, ($stored + ($elapsed * $max / 432000))] | min) as $regenerated |
  ([0, $regenerated] | max) as $current |
  {
    last_update_utc: ($a.voting_manabar.last_update_time | todate),
    estimated_voting_mana_percent: ((((100 * $current / $max) * 100) | round) / 100)
  }
' "$hive_inspection_dir/account.json"
# {
#   "last_update_utc": "2026-10-15T08:39:33Z",
#   "estimated_voting_mana_percent": 100
# }
```

The percentages are estimates at the time `jq` runs because the saved manabars continue to regenerate with time.
The underlying account, authority, balance, and vesting records came directly from the selected Hive API node.
The API methods and returned structures are documented at <https://developers.hive.io/apidefinitions/>.

#### Inspect the Existing Account via `hive.ausbit.dev`

The same public account can also be inspected through the ausbit Hive explorer:

<https://hive.ausbit.dev/@cs224>

No login or private key is needed to read the account page.
The explorer provides a human-readable view of public account metadata, balances, Hive Power, Resource Credits, posts, and operation history.
It is therefore a convenient way to check much of what we retrieved through the API and to explore the account without first learning the JSON field names.

### Generate the New Account's Credentials Locally

Before creating the account on-chain, we need to choose its permanent account name and generate the credentials that will control it.
For this walkthrough, I will use `cs224-by-foot`.
Choose a different name if you are repeating the experiment yourself, because every Hive account name is globally unique.

Clive derives each private key from the combination of the account name, its role, and one secret phrase.
Changing the account name therefore produces a completely different set of keys, even when the secret phrase remains the same.

Set the intended name and verify that no account currently uses it:

```bash
hive_new_account="cs224-by-foot"

clive call --node-address "$hive_node" database_api find_accounts "{\"accounts\":[\"$hive_new_account\"]}" > "$hive_inspection_dir/new-account-name.json"

if jq -e '.accounts | length == 0' "$hive_inspection_dir/new-account-name.json" >/dev/null; then
  printf 'The account name %s is currently available.\n' "$hive_new_account"
else
  printf 'The account name %s is already in use. Choose another name before generating keys.\n' "$hive_new_account" >&2
  exit 1
fi
```

This read-only check does not reserve the name.
Another account could still create it before our account-creation transaction is accepted.
Clive will also validate the name's syntax when deriving the keys.

Clive can generate a random 16-word secret phrase and derive the four role-specific key pairs from it.
The following block stores the phrase and keys outside any current Git repository, restricts access to the current user, and refuses to overwrite any existing file:

```bash
hive_key_dir="${XDG_CONFIG_HOME:-$HOME/.config}/hive-by-foot/$hive_new_account"
install -d -m 700 "$hive_key_dir"
chmod 700 "$hive_key_dir"

(
  set -eu
  set -o noclobber
  umask 077

  clive generate secret-phrase > "$hive_key_dir/master-secret.txt"

  for hive_role in owner active posting memo; do
    clive generate key-from-seed "$hive_new_account" "$hive_role" --only-private-key < "$hive_key_dir/master-secret.txt" > "$hive_key_dir/$hive_role.private"
    clive generate key-from-seed "$hive_new_account" "$hive_role" --only-public-key < "$hive_key_dir/master-secret.txt" > "$hive_key_dir/$hive_role.public"
  done
)

tree $hive_key_dir
# ~/.config/hive-by-foot/cs224-by-foot
# ├── active.private
# ├── active.public
# ├── master-secret.txt
# ├── memo.private
# ├── memo.public
# ├── owner.private
# ├── owner.public
# ├── posting.private
# └── posting.public

cat $hive_key_dir/master-secret.txt 
# DUVETYN ... ALIUNDE # 16-word secret phrase
```

The secret phrase and the four private keys are credentials.
Do not commit them, paste them into a website, or include them in command arguments.
Back up the secret phrase securely before the account is created: the account name plus that phrase can reproduce all four private keys.
This convenience also makes the phrase the most powerful secret in the set.

We can safely display the corresponding public keys:

```bash
for hive_role in owner active posting memo; do
  printf '%-7s %s\n' "$hive_role" "$(< "$hive_key_dir/$hive_role.public")"
done
# owner   STM7VVuqisf9fTBLLWq6LRAvhuJbkUaCnSnkAhQ3A7CLTMk5fhxYf
# active  STM5Ave3XgNt6qcqAZt4JsTQNNQ5qRiHCYLyAu8Yg7vzHvgbM34zd
# posting STM81i5h4fzjS9wpabjHJ8b3peH3xVjE4gqQsTwtkYw64SkrvgLye
# memo    STM77ssNqjQxjbTup4fb6zXxcVyHGh9XEHSWh5YyeaJLDyYD1x1u1
```

The output contains four `STM...` public keys.
These are the values that the account-creation operation will publish on the blockchain in the next step.
The private keys remain local.

The four roles deliberately have different powers:

* **Owner** controls the highest-level authority. It can replace the account's other authorities and participates in account recovery. Its private key should be kept offline and used only when necessary.
* **Active** authorizes financial and administrative operations, including transfers and many changes to the account. It should not be used by an everyday publishing application.
* **Posting** authorizes social operations such as posts, comments, and votes. This is the only private key we will later import into the publishing profile.
* **Memo** is used for encrypted transfer memos. It is a key pair, but unlike owner, active, and posting, the public account record stores it as `memo_key` rather than as a weighted authority.

Owner, active, and posting are more precisely **authorities**, not merely keys.
An authority can contain several weighted public keys or even references to other accounts, together with a threshold that signatures must reach.
For this simple account, Clive's account-creation command will assign one public key with weight 1 to each authority whose threshold is also 1.

Nothing in this step used Beekeeper, signed a transaction, reserved the name, or changed the Hive blockchain.
We only queried public data and generated local credentials.

### Create the Account Through `cs224`

The new account's public keys are ready, but the account does not yet exist on Hive.
An existing account must now authorize an account-creation operation.
In this walkthrough, `cs224` is the creator.

> If you do not already control a funded Hive account that can act as the creator, Hive provides directories where you can choose among other registration options with different costs, payment methods, privacy properties, and verification requirements:
> * <https://signup.hive.io/>
> * <https://hive.io/join/>
>
> I originally created `cs224` through <https://hivedex.io/signup>.
> I paid USD 0.49 in USDC over the Polygon network from my MetaMask wallet, <https://metamask.io/>.
> That gave me the existing account needed to perform the account-creation process directly in this walkthrough.

> If you already have a Hive account but want to buy liquid HIVE to fund it, CoinGecko's HIVE page includes a current overview of exchanges, spot-market pairs, prices, spreads, and trading volume:
> * <https://www.coingecko.com/en/coins/hive>

#### Check How the Creation Will Be Paid

Hive supports two account-creation paths in Clive:

* `--fee` pays the current account-creation fee in liquid HIVE;
* `--no-fee` consumes one account-creation token that the creator claimed earlier.

Refresh the public account data and the witness schedule immediately before constructing the operation:

```bash
clive call --node-address "$hive_node" database_api find_accounts "{\"accounts\":[\"$hive_account\"]}" > "$hive_inspection_dir/creator-before-account-creation.json"
clive call --node-address "$hive_node" database_api find_accounts "{\"accounts\":[\"$hive_new_account\"]}" > "$hive_inspection_dir/new-account-name-before-creation.json"
clive call --node-address "$hive_node" database_api get_witness_schedule '{}' > "$hive_inspection_dir/witness-schedule.json"

jq '.accounts[0] | {name, balance, pending_claimed_accounts}' "$hive_inspection_dir/creator-before-account-creation.json"
jq '{account_creation_fee: .median_props.account_creation_fee}' "$hive_inspection_dir/witness-schedule.json"

if ! jq -e '.accounts | length == 0' "$hive_inspection_dir/new-account-name-before-creation.json" >/dev/null; then
  printf 'The account name %s is no longer available. Do not continue.\n' "$hive_new_account" >&2
  exit 1
fi
```

At the time of this walkthrough, the median fee is `3.000 HIVE` and the `cs224` account has enough liquid HIVE to pay it.
We will therefore use `--fee`.
The values are dynamic, so rely on your own current output rather than the numbers printed here.

#### Give Clive the Creator's Active Key

Creating another account is an administrative and financial operation.
It requires `cs224`'s active authority, not its posting authority and not the new account's keys.

Create a dedicated Clive profile for this operation:

```bash
hive_creator_profile="hive-by-foot-creator"
hive_creator_active_alias="cs224-active"

clive configure profile create "$hive_creator_profile" --working-account-name "$hive_account"
```

Clive asks for a new profile password twice.
That password encrypts the profile's Beekeeper wallet; it is not a Hive private key.
The newly created profile remains unlocked so that we can import the active key next.

The following Bash block reads the active private key without showing it, places it briefly in a mode-600 temporary file because Clive accepts a key file, imports it under a readable alias, and then removes the temporary file:

```bash
(
  set -eu
  umask 077
  hive_creator_active_key_file="$(mktemp)"
  trap 'rm -f "$hive_creator_active_key_file"' EXIT

  read -rsp "Active private key for @$hive_account: " hive_creator_active_key
  printf '\n'
  printf '%s\n' "$hive_creator_active_key" > "$hive_creator_active_key_file"
  unset hive_creator_active_key

  clive configure key add "$hive_creator_active_key_file" --alias "$hive_creator_active_alias"
)
```

The key is now encrypted inside Beekeeper's profile storage.
It did not appear in the command line or shell history.
Confirm that Clive associated the expected public key with the alias, and compare it with the active authority retrieved earlier:

```bash
clive show keys
jq -r '.accounts[0].active.key_auths[][0]' "$hive_inspection_dir/creator-before-account-creation.json"
# [PublicKeyAliased(value='STM8EBz4EuPCQ83cCUNt8PZrXTbJXY7q7bKc4mMdU9soo49ubhq73', alias='cs224-active')]
# STM8EBz4EuPCQ83cCUNt8PZrXTbJXY7q7bKc4mMdU9soo49ubhq73
```

For the simple `cs224` authority, the public key shown for `cs224-active` must match the single `STM...` key printed by `jq`.

#### Construct and Review the Unsigned Operation

Load the four new public keys from the files created in the preceding section:

```bash
hive_owner_public="$(< "$hive_key_dir/owner.public")"
hive_active_public="$(< "$hive_key_dir/active.public")"
hive_posting_public="$(< "$hive_key_dir/posting.public")"
hive_memo_public="$(< "$hive_key_dir/memo.public")"

hive_transaction_dir="$hive_inspection_dir/transactions"
hive_account_creation_unsigned="$hive_transaction_dir/$hive_new_account.account-create.unsigned.json"
hive_account_creation_signed="$hive_transaction_dir/$hive_new_account.account-create.signed.json"
hive_account_creation_log="$hive_transaction_dir/$hive_new_account.account-create.broadcast.log"

install -d -m 700 "$hive_transaction_dir"
```

Now ask Clive to construct the `account_create_operation`, save it, and explicitly neither sign nor broadcast it:

```bash
test ! -e "$hive_account_creation_unsigned" || { printf 'Refusing to overwrite %s\n' "$hive_account_creation_unsigned" >&2; exit 1; }

clive process account-creation --creator "$hive_account" --fee --new-account-name "$hive_new_account" --owner "$hive_owner_public" --active "$hive_active_public" --posting "$hive_posting_public" --memo "$hive_memo_public" --no-autosign --no-broadcast --save-file "$hive_account_creation_unsigned"


# Account creation fee: `3.000 HIVE` will be paid.
# Created transaction:
# {
#   "expiration": "2026-10-31T11:16:21",
#   "operations": [
#     {
#       "type": "account_create_operation",
#       "value": {
#         "active": {
#           "account_auths": [],
#           "key_auths": [
#             [
#               "STM5Ave3XgNt6qcqAZt4JsTQNNQ5qRiHCYLyAu8Yg7vzHvgbM34zd",
#               1
#             ]
#           ],
#           "weight_threshold": 1
#         },
#         "creator": "cs224",
#         "fee": {
#           "amount": "3000",
#           "nai": "@@000000021",
#           "precision": 3
#         },
#         "json_metadata": "",
#         "memo_key": "STM77ssNqjQxjbTup4fb6zXxcVyHGh9XEHSWh5YyeaJLDyYD1x1u1",
#         "new_account_name": "cs224-by-foot",
#         "owner": {
#           "account_auths": [],
#           "key_auths": [
#             [
#               "STM7VVuqisf9fTBLLWq6LRAvhuJbkUaCnSnkAhQ3A7CLTMk5fhxYf",
#               1
#             ]
#           ],
#           "weight_threshold": 1
#         },
#         "posting": {
#           "account_auths": [],
#           "key_auths": [
#             [
#               "STM81i5h4fzjS9wpabjHJ8b3peH3xVjE4gqQsTwtkYw64SkrvgLye",
#               1
#             ]
#           ],
#           "weight_threshold": 1
#         }
#       }
#     }
#   ],
#   "ref_block_num": 37202,
#   "ref_block_prefix": 1716595595,
#   "transaction_id": "2d8f4801f2caa23d08ca14028ce1fd24c6601a28"
# }
# Transaction was successfully created.
# Transaction was saved to /home/cs/.local/state/hive-by-foot/transactions/cs224-by-foot.account-create.unsigned.json
# Adding account `cs224-by-foot` to known accounts.
```

This is the important review point.
Inspect the complete transaction:

```bash
jq . "$hive_account_creation_unsigned"
# Prints the data structure shown above.
```

Check at least the following fields before continuing:

* `creator` is `cs224`;
* `new_account_name` is the exact name used when deriving the keys;
* `fee` matches the current account-creation fee;
* the owner, active, posting, and memo public keys match the four local `.public` files;
* each authority has threshold 1 and assigns weight 1 to its intended public key;
* the transaction has not yet been signed or broadcast.

The `account_create` operation and its fields are documented here:

<https://developers.hive.io/apidefinitions/broadcast-ops.html#account_create>

#### Sign Without Broadcasting

The profile created above is still unlocked, and Clive created that unlocked session without a timeout.
You can leave it unlocked and continue directly with the signing command below, but it will remain unlocked until you explicitly run `clive lock` or close Beekeeper.

If you prefer a bounded signing window, first lock the current session and then unlock the profile for 15 minutes:

```bash
clive lock
clive unlock "$hive_creator_profile" --unlock-time 15
```

The initial `clive lock` is necessary because Clive cannot apply a new timeout to a wallet that is already unlocked.
Enter the profile password when `clive unlock` prompts for it.
This lock-and-unlock sequence is optional; its purpose is only to replace the unlimited session with one that automatically expires.

With the profile still unlocked by either route, load the reviewed operation, refresh its block reference and expiration, sign it with the creator's active key, and save the result without broadcasting:

```bash
test ! -e "$hive_account_creation_signed" || { printf 'Refusing to overwrite %s\n' "$hive_account_creation_signed" >&2; exit 1; }

clive process transaction --from-file "$hive_account_creation_unsigned" --update-metadata --sign-with "$hive_creator_active_alias" --no-broadcast --save-file "$hive_account_creation_signed"
# Loaded transaction:
# {
#   "expiration": "2026-10-31T11:18:00",
#   "operations": [
#      ... same as above ...
#   ],
#   "ref_block_num": 37235,
#   "ref_block_prefix": 2054458474,
#   "signatures": [
#     "1ff064109c89d826332785a0c4efc951122196a659005f8cd44bbac266c2b055e964af862af654d1a7af6c4952fdc645c0c24bf0a9031dd63eb08c8e33febb3bf5"
#   ],
#   "transaction_id": "dcaf8f1dd71fd53ed35a64d6c9282a2650466943"
# }
# Transaction was successfully loaded.
# Transaction was saved to /home/cs/.local/state/hive-by-foot/transactions/cs224-by-foot.account-create.signed.json
```

Verify that signing did not alter the operation itself and that the saved transaction now contains a signature:

```bash
hive_reviewed_operations="$(jq -cS -e '.operations' "$hive_account_creation_unsigned")" &&
  hive_signed_operations="$(jq -cS -e '.operations' "$hive_account_creation_signed")" &&
  test "$hive_reviewed_operations" = "$hive_signed_operations" ||
  { printf 'Operation verification failed; do not broadcast.\n' >&2; exit 1; }
jq '{expiration, ref_block_num, ref_block_prefix, signatures}' "$hive_account_creation_signed"
# {
#   "expiration": "2026-10-31T11:18:00",
#   "ref_block_num": 37235,
#   "ref_block_prefix": 2054458474,
#   "signatures": [
#     "1ff064109c89d826332785a0c4efc951122196a659005f8cd44bbac266c2b055e964af862af654d1a7af6c4952fdc645c0c24bf0a9031dd63eb08c8e33febb3bf5"
#   ]
# }
```

The signed transaction is time-sensitive because its expiration time is 30 minutes after it was prepared.
If it expires before broadcast, construct and sign a fresh transaction rather than editing the signed JSON.

#### Broadcast the Reviewed Transaction

The next command is the first command in this experiment that changes the Hive blockchain and spends funds.
It submits the already signed transaction exactly once:

```bash
set -o pipefail
clive process transaction --from-file "$hive_account_creation_signed" --no-autosign --broadcast 2>&1 | tee "$hive_account_creation_log"
clive lock
# Loaded transaction:
# {
#   "expiration": "2026-10-31T11:18:00",
#   "operations": [
#     ... reviewed account_create_operation omitted here for brevity ...
#   ],
#   "ref_block_num": 37235,
#   "ref_block_prefix": 2054458474,
#   "signatures": [
#     "1ff064109c89d826332785a0c4efc951122196a659005f8cd44bbac266c2b055e964af862af654d1a7af6c4952fdc645c0c24bf0a9031dd63eb08c8e33febb3bf5"
#   ],
#   "transaction_id": "dcaf8f1dd71fd53ed35a64d6c9282a2650466943"
# }
# Transaction was successfully broadcasted.
# Using beekeeper at http://127.0.0.1:35559
# All wallets have been locked.
```

Clive should report that the transaction was broadcast and print its transaction ID.
You can inspect the transaction created in this walkthrough through a blockchain explorer:

* <https://hivehub.dev/tx/dcaf8f1dd71fd53ed35a64d6c9282a2650466943>

Keep the transaction ID and broadcast log for the next step, where we will retrieve the account and independently inspect the recorded operation.

If the command ends with an ambiguous network error, do not immediately construct and submit another account-creation transaction.
First perform the read-only checks in the next section: the transaction may already have reached the blockchain even though its acknowledgement did not reach the client.

As an initial confirmation, you can already inspect the newly created public account through `hive.ausbit.dev`:
* <https://hive.ausbit.dev/@cs224-by-foot>

### Retrieve and Inspect the New Account

Neither retrieval requires Beekeeper, an unlocked profile, or any private key.
Set the transaction ID reported by Clive and retrieve both the current account object and the transaction that created it:

```bash
hive_account_creation_transaction_id="dcaf8f1dd71fd53ed35a64d6c9282a2650466943"

clive call --node-address "$hive_node" database_api find_accounts "{\"accounts\":[\"$hive_new_account\"]}" > "$hive_inspection_dir/new-account.json"
clive call --node-address "$hive_node" account_history_api get_transaction "{\"id\":\"$hive_account_creation_transaction_id\",\"include_reversible\":true}" > "$hive_inspection_dir/account-creation-transaction.json"
```

Inspect the new account's recovery account and public authorities:

```bash
jq '.accounts[0] | {name, created, recovery_account, owner, active, posting, memo_key}' "$hive_inspection_dir/new-account.json"
```

Then inspect the recorded creation operation and its containing block:

```bash
jq '{transaction_id, block_num, operation: .operations[0]}' "$hive_inspection_dir/account-creation-transaction.json"
```

The account object shows `cs224` as the initial recovery account and contains the four public keys generated locally.
The transaction independently records `cs224` as the creator, `cs224-by-foot` as the new account name, and the same owner, active, posting, and memo public keys.

The same public records can be inspected graphically through the transaction and account explorers:

* <https://hivehub.dev/tx/dcaf8f1dd71fd53ed35a64d6c9282a2650466943>
* <https://hive.ausbit.dev/@cs224-by-foot>

### Create the New Account's Publishing Profile

Create a separate Clive profile whose working account is the new account:

```bash
hive_publisher_profile="hive-by-foot-publisher"
hive_posting_alias="$hive_new_account-posting"

clive configure profile create "$hive_publisher_profile" --working-account-name "$hive_new_account"
```

Clive asks for a new profile password twice and leaves the profile unlocked.
List the profiles currently stored by Clive to confirm that the new one exists:

```bash
clive show profiles
```

Import only the posting private key generated earlier, referring to its protected file rather than placing the key itself on the command line:

```bash
clive configure key add "$hive_key_dir/posting.private" --alias "$hive_posting_alias"
```

Confirm that the imported key's public half matches the posting authority retrieved from Hive:

```bash
clive show keys
jq -r '.accounts[0].posting.key_auths[][0]' "$hive_inspection_dir/new-account.json"
```

The two `STM...` values must match.
The profile now has enough authority to publish, comment, and vote, but it cannot transfer funds or replace the account's authorities.
The owner, active, and memo private keys remain outside this everyday publishing profile.

Lock the profile until it is needed again:

```bash
clive lock
```

### Construct and Review a Small Article

Hive stores both root posts and replies as `comment_operation` objects.
A root post has an empty `parent_author`; its `parent_permlink` contains the category.
The pair of `author` and `permlink` identifies the post permanently.

> Hive also uses this same `comment_operation` for long-form articles.
> There is no separate long-form operation comparable to Nostr's `kind-30023`.
> A client interprets the publication from its title, Markdown body, parent fields, and `json_metadata` conventions.
> Short root posts, long articles, replies, and later edits therefore share the same underlying operation: replies set `parent_author` and `parent_permlink` to the content being answered, while an edit reuses the original author and permlink.
>
> The protocol fields are documented at <https://developers.hive.io/apidefinitions/broadcast-ops.html#comment>.

Create a short Markdown body and choose the remaining publication fields:

```bash
hive_post_category="test"
hive_post_permlink="hello-hive-publishing-by-foot"
hive_post_title="Hello, Hive! Publishing by Foot"
hive_post_body_file="$hive_transaction_dir/$hive_post_permlink.md"
hive_post_draft="$hive_transaction_dir/$hive_post_permlink.draft.json"
hive_post_signed="$hive_transaction_dir/$hive_post_permlink.signed.json"
hive_post_log="$hive_transaction_dir/$hive_post_permlink.broadcast.log"

test ! -e "$hive_post_body_file" || { printf 'Refusing to overwrite %s\n' "$hive_post_body_file" >&2; exit 1; }

cat > "$hive_post_body_file" <<'EOF'
# Hello, Hive!

This is a small publishing experiment.

I created this Hive account and published this Markdown post from the command line with Clive. The purpose is to make the account, authority, transaction, and publication steps visible.
EOF
```

Use `jq` to construct an unsigned transaction containing one `comment_operation`:

```bash
test ! -e "$hive_post_draft" || { printf 'Refusing to overwrite %s\n' "$hive_post_draft" >&2; exit 1; }

jq -n --arg category "$hive_post_category" --arg author "$hive_new_account" --arg permlink "$hive_post_permlink" --arg title "$hive_post_title" --rawfile body "$hive_post_body_file" '{operations: [{type: "comment_operation", value: {parent_author: "", parent_permlink: $category, author: $author, permlink: $permlink, title: $title, body: $body, json_metadata: ({tags: [$category, "publishing", "hive"], format: "markdown", description: "A small command-line Hive publishing experiment."} | tojson)}}], extensions: [], signatures: []}' > "$hive_post_draft"
cat $hive_post_draft | jq .
# {
#   "operations": [
#     {
#       "type": "comment_operation",
#       "value": {
#         "parent_author": "",
#         "parent_permlink": "test",
#         "author": "cs224-by-foot",
#         "permlink": "hello-hive-publishing-by-foot",
#         "title": "Hello, Hive! Publishing by Foot",
#         "body": "# Hello, Hive!\n\nThis is a small publishing experiment.\n\nI created this Hive account and published this Markdown post from the command line with Clive. The purpose is to make the account, authority, transaction, and publication steps visible.\n",
#         "json_metadata": "{\"tags\":[\"test\",\"publishing\",\"hive\"],\"format\":\"markdown\",\"description\":\"A small command-line Hive publishing experiment.\"}"
#       }
#     }
#   ],
#   "extensions": [],
#   "signatures": []
# }

```

Review the operation, decoding the nested `json_metadata` string for readability:

```bash
jq '.operations[0].value | .json_metadata |= fromjson' "$hive_post_draft"
```

The result should show:

* an empty `parent_author`, making this a root post;
* `test` as both `parent_permlink` and the first tag;
* `cs224-by-foot` as the author;
* `hello-hive-publishing-by-foot` as the permlink;
* the title and complete Markdown body;
* `publishing` and `hive` as additional tags;
* `markdown` as the declared format and the short description as additional metadata.

This file has no block reference, expiration, or signature yet, and nothing has been submitted to Hive.
Publishing another root post with the same author and permlink would update this post rather than create a second one.

### Sign and Broadcast the Article

Unlock the publishing profile for 15 minutes, select the API node explicitly, and inspect the new account's available Resource Credits:

```bash
clive unlock "$hive_publisher_profile" --unlock-time 15
clive configure node set "$hive_node"
clive show node
clive show resource-credits "$hive_new_account"
# 
#                    Resource Credits of `cs224-by-foot` account                    
#       Resource Credits balance                         RC Manabar                 
# ┏━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓
# ┃ RC Source    ┃           Amount ┃┃ Property               ┃          Value ┃
# ┡━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━┩ ┡━━━━━━━━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━┩
# │ From stake    │          3.000 HP │ │ Current RC           │          3.000 HP │
# │               │ 4814.199630 VESTS │ │                      │ 4814.199630 VESTS │
# │ Delegated out │          0.000 HP │ │ RC Percentage        │          100.00 % │
# │               │    0.000000 VESTS │ │ Full regeneration in │         0 seconds │
# │ Received      │          0.000 HP │ └──────────────────────┴───────────────────┘
# │               │    0.000000 VESTS │                                             
# │ Max RC        │          3.000 HP │                                             
# │               │ 4814.199630 VESTS │                                             
# └───────────────┴───────────────────┘                                             
```

Enter the publishing profile's password when prompted.
Now let Clive add a fresh block reference and expiration, sign with the posting key, and save the transaction without broadcasting it:

```bash
test ! -e "$hive_post_signed" || { printf 'Refusing to overwrite %s\n' "$hive_post_signed" >&2; exit 1; }

clive process transaction --from-file "$hive_post_draft" --update-metadata --sign-with "$hive_posting_alias" --no-broadcast --save-file "$hive_post_signed"
```

Confirm that signing preserved the reviewed operation and added a signature:

```bash
hive_reviewed_operations="$(jq -cS -e '.operations' "$hive_post_draft")" &&
  hive_signed_operations="$(jq -cS -e '.operations' "$hive_post_signed")" &&
  test "$hive_reviewed_operations" = "$hive_signed_operations" ||
  { printf 'Operation verification failed; do not broadcast.\n' >&2; exit 1; }
jq '{expiration, operations, signatures, transaction_id}' "$hive_post_signed"
```

The following command submits that already signed transaction through the one configured API node, `https://api.hive.blog`, and then locks Beekeeper:

```bash
set -o pipefail
clive process transaction --from-file "$hive_post_signed" --no-autosign --broadcast 2>&1 | tee "$hive_post_log"
clive lock
# Loaded transaction:
# {
#   "expiration": "2026-10-31T12:17:36",
#   "operations": [
#     {
#       "type": "comment_operation",
#       "value": {
#         "author": "cs224-by-foot",
#         "body": "# Hello, Hive!\n\nThis is a small publishing experiment.\n\nI created this Hive account and published this Markdown post from the command line with Clive. The purpose is to make the account, authority, transaction, and publication steps visible.\n",
#         "json_metadata": "{\"tags\":[\"test\",\"publishing\",\"hive\"],\"format\":\"markdown\",\"description\":\"A small command-line Hive publishing experiment.\"}",
#         "parent_author": "",
#         "parent_permlink": "test",
#         "permlink": "hello-hive-publishing-by-foot",
#         "title": "Hello, Hive! Publishing by Foot"
#       }
#     }
#   ],
#   "ref_block_num": 38423,
#   "ref_block_prefix": 1152482066,
#   "signatures": [
#     "20e7a1507f9a3ba49e00ea77cbccb90f0cec8b3d08e64b5024b959367532f3292756997001a54d99f853dab0f9b2475fd4aa965484f16dd5bf640529a52e550d55"
#   ],
#   "transaction_id": "dc7700f1a39ec34f77c30f8fe504bd7c55827454"
# }
# Transaction was successfully broadcasted.
```

Do not construct and sign a second transaction merely because the acknowledgement is unclear.
First retrieve the transaction or post through the public API, as we will do in the next step.

Sending the exact same signed transaction again keeps the same transaction ID and cannot create a second post; a node will normally reject it as a duplicate if it was already accepted.

Constructing and signing a fresh transaction with the same `author` and `permlink` is different: Hive interprets those coordinates as the existing post and treats the new `comment_operation` as an update rather than creating a duplicate.
That normally protects against producing two separate articles, but a redundant update still consumes Resource Credits and changes the post's update history, so checking the public state first remains preferable.

Once the transaction has reached Hive, the same post can be opened through several front ends:

* <https://new.hive.blog/test/@cs224-by-foot/hello-hive-publishing-by-foot>
* <https://peakd.com/test/@cs224-by-foot/hello-hive-publishing-by-foot>
* <https://ecency.com/@cs224-by-foot/hello-hive-publishing-by-foot>

These are different views of one on-chain `comment_operation`, not three separate publications.

#### Inspect the Remaining Resource Credits

Publishing the article did not deduct liquid HIVE from the new account.
Instead, the operation consumed part of its Resource Credit manabar.
We can inspect the remaining capacity after publication:

```bash
clive show resource-credits "$hive_new_account"
# Using beekeeper at http://127.0.0.1:35559
#                            Resource Credits of `cs224-by-foot` account                           
#       Resource Credits balance                                RC Manabar                         
# ┏━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━┓ ┏━━━━━━━━━━━━━━━━┓
# ┃ RC Source     ┃          Amount ┃┃ Propert  y             ┃                         Value ┃
# ┡━━━━━━━━━━━━━━━╇━━━━━━━━━━━━━━━━━━━┩ ┡━━━━━━━━━━━━━━━━┩
# │ From stake    │          3.000 HP │ │ Current RC           │                         2.395 HP │
# │               │ 4814.199630 VESTS │ │                      │                3843.669096 VESTS │
# │ Delegated out │          0.000 HP │ │ RC Percentage        │                          79.84 % │
# │               │    0.000000 VESTS │ │ Full regeneration in │ 1 day, 11 minutes and 30 seconds │
# │ Received      │          0.000 HP │ └──────────────────────┴──────────────────────────────────┘
# │               │    0.000000 VESTS │                                                            
# │ Max RC        │          3.000 HP │                                                            
# │               │ 4814.199630 VESTS │                                                            
# └───────────────┴───────────────────┘                                                            
```

Clive expresses the account's maximum capacity as the equivalent of `3.000 HP`.
For this newly created account, that initial capacity comes from Hive's account-creation RC adjustment; it does not mean that the account received 3 liquid HIVE or that this amount was spent on the post.

The publication reduced the manabar to `79.84%`, leaving enough capacity for further operations.
Resource Credits regenerate continuously and take five days to refill from completely empty to full.
Because this account is missing only about `20.16%`, Clive estimates that it will return to full capacity in roughly one day, not five full days.
If an account exhausts its Resource Credits, it can wait for regeneration, increase its capacity by powering up HIVE, or receive a Resource Credit delegation from another account.

### Retrieve and Compare the Published Article

The transaction and rendered post can now be retrieved without Beekeeper or private keys:

```bash
hive_post_transaction_id="dc7700f1a39ec34f77c30f8fe504bd7c55827454"
hive_post_transaction_json="$hive_inspection_dir/$hive_post_permlink.transaction.json"
hive_post_record_json="$hive_inspection_dir/$hive_post_permlink.post.json"

clive call --node-address "$hive_node" account_history_api get_transaction "{\"id\":\"$hive_post_transaction_id\",\"include_reversible\":true}" > "$hive_post_transaction_json"
curl -fsSL -H 'Content-Type: application/json' --data "{\"jsonrpc\":\"2.0\",\"method\":\"bridge.get_post\",\"params\":{\"author\":\"$hive_new_account\",\"permlink\":\"$hive_post_permlink\"},\"id\":1}" "$hive_node" | jq -e '.result' > "$hive_post_record_json"
```

Compare the raw on-chain operation with the post record interpreted by Hivemind's Bridge API:

```bash
jq '{transaction_id, block_num, operation: .operations[0]}' "$hive_post_transaction_json"
jq '{author, permlink, category, title, body, json_metadata, created, updated, url}' "$hive_post_record_json"
```

The underlying transaction can also be inspected through a blockchain explorer:

* <https://hivehub.dev/tx/dc7700f1a39ec34f77c30f8fe504bd7c55827454>

### Publish and Compare a PeakD Snap

A PeakD Snap is another `comment_operation`, but it is a reply to a current container post maintained by `@peak.snaps`.
Discover and validate that container immediately before preparing the Snap:

```bash
hive_snap_containers_json="$hive_inspection_dir/snap-containers.json"
hive_snap_parent_json="$hive_inspection_dir/snap-parent.json"

curl -fsSL -H 'Content-Type: application/json' --data '{"jsonrpc":"2.0","method":"condenser_api.get_blog_entries","params":["peak.snaps",0,20],"id":1}' "$hive_node" > "$hive_snap_containers_json"
hive_snap_parent="$(jq -er '[.result[] | select(.author == "peak.snaps" and (.permlink | test("^snap-container-[0-9]+$")))][0].permlink' "$hive_snap_containers_json")"

curl -fsSL -H 'Content-Type: application/json' --data "{\"jsonrpc\":\"2.0\",\"method\":\"bridge.get_post\",\"params\":{\"author\":\"peak.snaps\",\"permlink\":\"$hive_snap_parent\"},\"id\":1}" "$hive_node" | jq -e '.result' > "$hive_snap_parent_json"
jq -e --arg parent "$hive_snap_parent" '.author == "peak.snaps" and .permlink == $parent and .parent_author == "" and .category == "hive-124838"' "$hive_snap_parent_json" >/dev/null
```

Construct a short reply to that container:

```bash
hive_snap_permlink="snap-hive-publishing-by-foot"
hive_snap_draft="$hive_transaction_dir/$hive_snap_permlink.draft.json"
hive_snap_signed="$hive_transaction_dir/$hive_snap_permlink.signed.json"
hive_snap_log="$hive_transaction_dir/$hive_snap_permlink.broadcast.log"

test ! -e "$hive_snap_draft" || { printf 'Refusing to overwrite %s\n' "$hive_snap_draft" >&2; exit 1; }

jq -n --arg parent "$hive_snap_parent" --arg author "$hive_new_account" --arg permlink "$hive_snap_permlink" '{operations: [{type: "comment_operation", value: {parent_author: "peak.snaps", parent_permlink: $parent, author: $author, permlink: $permlink, title: "", body: "This short PeakD Snap was published from the command line.\n\n[Read the full publishing experiment](https://peakd.com/test/@cs224-by-foot/hello-hive-publishing-by-foot)\n", json_metadata: ({tags: ["snaps", "publishing"], format: "markdown"} | tojson)}}], extensions: [], signatures: []}' > "$hive_snap_draft"
```

Compare its coordinates with those of the root article:

```bash
jq '.operations[0] | {type, parent_author: .value.parent_author, parent_permlink: .value.parent_permlink, author: .value.author, permlink: .value.permlink, title: .value.title}' "$hive_post_draft" "$hive_snap_draft"
```

Both objects use `comment_operation`.
The article has no parent author and uses a category as its parent permlink; the Snap has an empty title and points to the current `@peak.snaps` container.

Sign and broadcast it with the same posting profile:

```bash
clive unlock "$hive_publisher_profile" --unlock-time 15
test ! -e "$hive_snap_signed" || { printf 'Refusing to overwrite %s\n' "$hive_snap_signed" >&2; exit 1; }
clive process transaction --from-file "$hive_snap_draft" --update-metadata --sign-with "$hive_posting_alias" --no-broadcast --save-file "$hive_snap_signed"
hive_reviewed_operations="$(jq -cS -e '.operations' "$hive_snap_draft")" &&
  hive_signed_operations="$(jq -cS -e '.operations' "$hive_snap_signed")" &&
  test "$hive_reviewed_operations" = "$hive_signed_operations" ||
  { printf 'Operation verification failed; do not broadcast.\n' >&2; exit 1; }

set -o pipefail
clive process transaction --from-file "$hive_snap_signed" --no-autosign --broadcast 2>&1 | tee "$hive_snap_log"
clive lock

# Loaded transaction:
# {
#   "expiration": "2026-10-31T12:32:24",
#   "operations": [
#     {
#       "type": "comment_operation",
#       "value": {
#         "author": "cs224-by-foot",
#         "body": "This short PeakD Snap was published from the command line.\n\n[Read the full publishing experiment](https://peakd.com/test/@cs224-by-foot/hello-hive-publishing-by-foot)\n",
#         "json_metadata": "{\"tags\":[\"snaps\",\"publishing\"],\"format\":\"markdown\"}",
#         "parent_author": "peak.snaps",
#         "parent_permlink": "snap-container-1793445840",
#         "permlink": "snap-hive-publishing-by-foot",
#         "title": ""
#       }
#     }
#   ],
#   "ref_block_num": 38718,
#   "ref_block_prefix": 887179709,
#   "signatures": [
#     "2054ccfafd72bdf363fe487f3a6d876dc37b234f3af480545538710bac820e455c01d035051e6d7e8925cf0079240be7f80924b0626b335f23f2efe20063b1c740"
#   ],
#   "transaction_id": "61ff5e8865817f987f4aa62fddc4d58d8aae373a"
# }
# Transaction was successfully broadcasted.
```

The published Snap can then be opened through PeakD:

* <https://peakd.com/@cs224-by-foot/snap-hive-publishing-by-foot>

Snaps are therefore a PeakD convention layered on Hive's ordinary reply structure, not a separate blockchain operation.

## Continue Through the Browser with Hive Keychain

The command-line experiment made the underlying operations visible, but you do not have to construct every transaction by hand in everyday use.
[Hive Keychain](https://hive-keychain.com/) provides a signer inside the browser:
* <https://hive-keychain.com/>

After installing the extension from its official website, you can add a Hive account and the keys that you want the browser to use.
Hive applications that support Keychain can then request an operation, such as publishing a post or casting a vote.
Keychain shows the request so that you can approve or reject it, signs approved operations with the appropriate locally stored key, and submits them without requiring you to paste the private key into each website.

For ordinary publishing and social activity, import only the posting key.
Add the active key only if you deliberately want to perform financial or account-management operations through the browser, and add the memo key only when you need encrypted memos.
Keep the owner key outside the everyday browser profile.
Keychain encrypts its local key store with its own password, so use a strong password and retain the original account keys in a separate backup.

This makes applications such as [Hive.blog](https://new.hive.blog/), [PeakD](https://peakd.com/), and [Ecency](https://ecency.com/) more convenient while preserving the authority separation explored above.
Beekeeper served as the signer for Clive on the command line; Keychain serves a comparable role for compatible browser applications.

## Conclusion

I think this is enough to see the larger idea:
Hive provides one shared blockchain, one account system, and a common set of operations;
authorities separate publishing from financial and recovery powers;
Resource Credits turn account capacity into a renewable allowance for using the network;
front ends decide how the same on-chain records are presented.

For independent publishing, Hive therefore combines publication, syndication, discovery, discussion, and social incentives on one shared foundation.
[Hive.blog](https://new.hive.blog/), [PeakD](https://peakd.com/), and [Ecency](https://ecency.com/) provide different views and conventions, but the account, article, Snap, signatures, and transaction history remain portable public records on the same chain.

This walkthrough covered only a small part of the Hive ecosystem.
The official ecosystem overview and the broader project directory provide useful starting points for discovering other publishing interfaces, wallets, explorers, games, development tools, and specialized applications:

* <https://hive.io/eco/>
* <https://hiveprojects.io/>

Explore the applications that match your own interests and compare how they present the same underlying accounts and on-chain operations.

