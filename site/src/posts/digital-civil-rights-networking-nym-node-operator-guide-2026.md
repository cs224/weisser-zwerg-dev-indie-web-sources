---
layout: "layouts/post-with-toc.njk"
title: "Nym Mixnet & dVPN: A Node Operator's Guide (2026)"
description: "Support reclaiming our digital civil rights and privacy by running your own Nym node as a node operator."
seodescription: "Run a Nym mixnet/dVPN node in 2026: pick a VPS, install with Nym Node CLI, bond NYM, configure firewall/NGINX, back up, upgrade and track rewards & earnings."
creationdate: 2026-01-11
keywords: vpn, dvpn, 2-hop, Nym, NymVPN, mixnet, operator, WireGuard, Amnezia, Censorship Resistance
date: 2026-01-11
tags: ['post']
---

## Rationale

This post is a complete rework and 2026 update of my earlier guide: [Nym Mixnet & dVPN: A Node Operator's Guide](../digital-civil-rights-networking-nym-node-operator-guide).

This time, the setup is much smoother because Nym now provides dedicated operator tooling.
The main helper is the [Nym Node CLI](https://nym.com/docs/operators/tools#nym-node-cli), which drives most of the installation and configuration steps for you.
If you want to inspect the code behind it, the tooling lives in the Nym repository as [`nym-node-cli.py`](https://github.com/nymtech/nym/tree/develop/scripts/nym-node-setup).

The [Nym](https://nym.com/about) mixnet and its distributed VPN (dVPN) depend on people like you to run nodes, which keep the network robust.

Nym's blockchain-based incentives reward node operators with cryptocurrency, creating a potential small business opportunity.

If you want to learn about using the NymVPN as a user, please refer to my earlier blog post: [Nym Mixnet: NymVPN](../digital-civil-rights-networking-i/#nym-mixnet%3A-nymvpn).

If you're eager to dive deeper, I recommend checking out the [Nym Docs](https://nym.com/docs) for more detailed information.
In addition, you can find helpful resources and support at the following platforms:

* [Nym Forum](https://forum.nym.com): A community-driven space to discuss Nym's technology and get answers to your questions.
* [Nym on Discord](https://discord.com/invite/nym): Join the conversation and connect with other users and developers in real time.
* [operators:nymtech.chat](https://matrix.to/#/#operators:nymtech.chat)
* Nym on [GitHub](https://github.com/nymtech/): Explore the code, report issues, and contribute to the project.
* [Governator](https://governator.nym.com/proposal/prop-007db012-bafe-485d-9e20-e4511b98c8e8)
* [Spectre Explorer](https://explorer.nym.spectredao.net/dashboard)
* [Nym Harbour Master](https://harbourmaster.nymtech.net/)
* [Nymesis](https://nymesis.vercel.app/)
* [Nym Explorer V2](https://nym.com/explorer/)
* [Nym Node Status UI](https://node-status.nym.com/)

### The Result

Below you can see the outcome of this guide: the Nym node I set up for this 2026 post, and the node I set up in my earlier guide.
The table links to several public dashboards so you can verify that both nodes are visible on the network.

> These explorers and dashboards do not all show exactly the same information at the same time.
> Some focus on operator status and routing details, while others focus on explorer style listings and node metadata.

<style>
  table {
    border-collapse: collapse;
    margin: 1em 0;
    max-width: 100%;
    font-family: Arial, sans-serif;
  }
  th, td {
    border: 1px solid #ccc;
    padding: 0.6em;
    text-align: left;
  }
  th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
</style>

<table>
  <thead><tr><th></th><th>weisser-zwerg.dev (wznymnode2.root.sx)</th><th>weisser-zwerg.dev (wznymnode.root.sx)</th></tr></thead>
  <tbody>
    <tr>
      <td><b>Spectre Explorer</b></td> <!-- <a href="https://explorer.nym.spectredao.net/dashboard" target="_blank"> -->
      <td><a href="https://explorer.nym.spectredao.net/nodes/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo" target="_blank">DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo</a></td>
      <td><a href="https://explorer.nym.spectredao.net/nodes/E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ" target="_blank">E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ</a></td>
    </tr>
    <tr>
      <td><b>Nym Harbour Master</b></td> <!-- <a href="https://harbourmaster.nymtech.net" target="_blank"> -->
      <td><a href="https://harbourmaster.nymtech.net/gateway/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo" target="_blank">DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo</a></td>
      <td><a href="https://harbourmaster.nymtech.net/gateway/E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ" target="_blank">E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ</a></td>
    </tr>
    <tr>
      <td><b><a href="https://forum.nym.com/t/nym-grant-proposal-nymesis/1010" target="_blank">Nymesis</a></b></td> <!-- <a href="https://nymesis.vercel.app" target="_blank"> -->
      <td><a href="https://nymesis.vercel.app/?q=DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo" target="_blank">DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo</a></td>
      <td><a href="https://nymesis.vercel.app/?q=E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ" target="_blank">E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ</a></td>
    </tr>
    <tr>
      <td><b><a href="https://github.com/nymtech/nym/pull/5548" target="_blank">Nym Explorer V2</a></b></td> 
      <td><a href="https://nym.com/explorer/nym-node/2933" target="_blank">DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo</a></td>
      <td><a href="https://nym.com/explorer/nym-node/2196" target="_blank">E67dRcrMNsEpNvRAxvFTkvMyqigTYpRWUYYPm25rDuGQ</a></td>
    </tr>
  </tbody>
</table>

In the appendix, I will publish additional information about the newly created node.
You can reproduce these details yourself via API calls as shown here: [Investigating the Node via API](#investigating-the-node-via-api).

### Delegating

If you prefer not to run your own `nym-node`, you can still support the network by delegating your `NYM` tokens to an existing node, for example to [my node](https://nym.com/explorer/nym-node/2933).

But before you can delegate, you'll need to acquire some `NYM` tokens.
Download the Nym Wallet: Visit the [Nym Wallet website](https://nym.com/wallet) and download the wallet application for your operating system.
Then you can use the wallet to buy Nym tokens or you use one of the listed exchanges on CoinGecko markets: <https://www.coingecko.com/en/coins/nym#markets>.

> While I haven't personally used these services, you can buy `NYM` tokens on centralized exchanges ([CEX](https://iq.wiki/wiki/cex-centralized-exchange)) like [Kraken](https://www.kraken.com/) (on the native NYX network) or 
> on decentralized exchanges ([DEX](https://en.wikipedia.org/wiki/Decentralized_finance#Decentralized_exchanges)) and CEX platforms like [KuCoin](https://www.kucoin.com/) or [ByBit](https://www.bybit.com/en/) (on the ERC20 Ethereum network).
> However, if you purchase tokens on the ERC20 network, you'll need to transfer them to the native NYX network via [GravityBridge](https://bridge.blockscape.network/).

The guide [How to get and stake NYM tokens](https://nym.com/blog/stake-Nym-tokens) guides you through the whole process.

Part of the process is to install the [Keplr](https://www.keplr.app/get) browser extension wallet for the [Inter Blockchain Ecosystem](https://cosmos.network/ibc/).

Browse Nym nodes in the [explorer](https://nym.com/explorer) and look for:
* Nodes with high routing scores (close to 100%)
* Check for lower operating costs/margins for better rewards
* Ensure the node isn't over-saturated (below 100%)

Once you have chosen a node, open its page in the explorer. If you are connected with Keplr, you should see a `Delegate` button. You can use it to delegate to your selected node, including mine: [DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo](https://nym.com/explorer/nym-node/2933).

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Proof of Stake (PoS) and Proof of Work (PoW)

The Nym mixnet combines [Proof of Stake](https://en.wikipedia.org/wiki/Proof_of_stake) (PoS) and [Proof of Work](https://en.wikipedia.org/wiki/Proof_of_work) (PoW) mechanisms:

* Proof of Stake: You'll need to hold Nym tokens and bond them to your node. To maximize your node's financial performance, you'll also want to encourage others in the community to delegate some of their Nym tokens to your node. 
  This delegation acts as a sign of trust and helps the network prioritize your node.
  However, the system is designed with balance in mind - nodes that hold too many delegated funds may see reduced rewards.
  This encourages a healthy, decentralized network. (For more details, check out the Nym [Tokenomics](https://nym.com/docs/operators/tokenomics) documentation page.)
* Proof of Work: Your node must perform useful tasks, like participating in the Nym mixnet to ensure secure and private communication.

Steps to Set Up a Nym-Node:
1. Get Nym Tokens: Acquire some Nym tokens to begin.
1. Choose a VPS Provider: Research and pick a Virtual Private Server (VPS) provider that fits your needs.
1. Install the Node: Set up your `nym-node` on your VPS.
1. Bond Tokens: Bond 100 Nym tokens to your node (currently worth around $3.48 or €2.99).
1. Build Trust: Convince others in the community to delegate their tokens to your node.

If running your own Nym node feels like too much of a commitment, you can still contribute to the network by [delegating](#delegating) your Nym tokens to an existing node (for example, mine!).
Detailed instructions for this will follow below.

## Acquire Nym Tokens

To begin, you'll need to get some Nym tokens. For detailed instructions, check out the [Nym Wallet Preparation](https://nym.com/docs/operators/nodes/preliminary-steps/wallet-preparation) page.

Step 1: Set Up Your Nym Wallet:
* Download the Nym Wallet: Visit the [Nym Wallet website](https://nym.com/wallet) and download the wallet application for your operating system.
* Create Your Wallet Account:
  * If you don't have an account, the wallet will guide you through creating one.
  * You'll receive a [BIP 39 Mnemonic](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) Word List - a unique set of 24 words that acts as your account identifier.
  * **Important**: Store these 24 words securely, such as in a [password manager](../digital-civil-rights-nextcloud-i/#password-manager-(2fa%2C-totp%2C-fido2%2C-passkeys%2C-webauthn)). You'll need them to log in and access your wallet in the future.

Step 2: Fund Your Wallet with `NYM` Tokens:
* To bond a node, you'll need at least 100 `NYM` tokens. However, to cover gas fees, it's recommended to have some more. I'd suggest a minimum of 200 `NYM` tokens.
* The [Nym Wallet Preparation](https://nym.com/docs/operators/nodes/preliminary-steps/wallet-preparation) page links to a list of exchanges via CoinGecko markets, which is a good starting point: <https://www.coingecko.com/en/coins/nym#markets>

> When you pick an exchange, confirm two practical points before you deposit money:
> 1. You can withdraw `NYM` to a wallet address you control.
> 2. The withdrawal is supported on the correct network (Nyx, the Cosmos SDK based Nym chain), not only as a wrapped token on another chain.
>
> A good habit is to do one small test withdrawal first, then proceed with the full amount once you see it arrive in your Nym Wallet.

> The Nym documentation suggests using the [Bity](https://www.bity.com) broker, but I noticed that the CHF → NYM trading pair has been discontinued on Bity. A support request to the Bity support team confirmed that:
> > The CHF → NYM trading pair has been discontinued some time ago, which is why you now receive the message indicating that this pair is no longer supported. This explains the discrepancy between the current error and your previous purchase history, as NYM was available on Bity in the past.
> > Unfortunately, it is no longer possible to place new orders for this pair via our platform.

Additional Note: 
`NYM` is the native token of Nym's own chain called `Nyx`, which is built with the [Cosmos SDK](https://fr.wikipedia.org/wiki/Cosmos_(blockchain)).
The Nym project uses this blockchain for payment-related aspects of the mixnet rather than operating a separate blockchain.

## Research and Select a Virtual Private Server (VPS) Provider

Choosing the right VPS provider is crucial for running a Nym node effectively.
To help you make an informed decision, the Tor Project's [Good Bad ISPs](https://community.torproject.org/relay/community-resources/good-bad-isps/) page offers valuable advice that also applies to Nym nodes.

The Nym community also maintains an ISP table called [Where to host your nym node?](https://nym.com/docs/operators/community-counsel/isp-list).
It is community driven, so it gets better when operators share real experiences.
If you discover a provider that works well for Nym nodes, consider adding your findings.

The Amnezia guide [How to run your VPN](https://amnezia.org/en/starter-guide) also lists VPS providers.

If you want additional background reading, these two posts give a practical feel for how providers react to privacy infrastructure:

> * [Running a Tor Exit node/Mysterium Node in Linode. (24629) | Linode Questions](https://www.linode.com/community/questions/24629/running-a-tor-exit-nodemysterium-node-in-linode), and
> * Lars-Sören Steck: Euer Lars vom netcup-Team: [Betreiben eines (Non-exit) Tor-Nodes](https://forum.netcup.de/administration-of-a-server-vserver/vserver-server-kvm-server/15701-betreiben-eines-non-exit-tor-nodes/).

The [Delegations Program](https://nym.com/network/DP) is run by the Nym team. Its goal is to help nodes get established in underserved parts of the world and to give new operators a stronger start.
In practice, the program delegates stake to selected nodes. This can improve their chance of entering the network's active set, so they can route traffic and earn rewards.

If you plan to apply, review the operational requirements.
Two important references are the [Minimum Requirements](https://nym.com/docs/operators/nodes#minimum-requirements) for VPS hardware and the expectation to support [Network Decentralization](https://explorer.nym.spectredao.net/decentralization#provider).

According to the Nym blog post [Nym node Delegation Programme is now open](https://nym.com/blog/nym-node-delegation-programme-is-now-open), preference is given to nodes that avoid heavily used providers such as AWS, Hetzner, Contabo, or Google Cloud.
The goal is to avoid concentration, since concentration makes the network easier to disrupt and easier to observe.

There was also a post in the [Nym Node Ops announcements](https://matrix.to/#/#node-ops-announcements:nymtech.chat) channel about [ISP MIGRATION](https://matrix.to/#/!BfLJbTuoxUuqtgrUYB:nymtech.chat/$LHArSdbguSvS_R_k10lEK0HXQloXU293ZSuAsh8c3tA?via=nymtech.chat&via=matrix.org&via=monero.social). I only quote part of it here:

> There has been continuous problems with Stark industries and its subsidiaries like PQ.hosting and TheHosting.
>  
> **Nym Network has been, is and will be permissionless and the operators can run services of their choice**. However, as a team we support operators via Delegation Program (DP) and Service Grant Program (SGP) and we would like to see operators looking for an alternative solution and moving away from the services provided by Stark Industries.

For better anonymity and network resilience, avoid VPS providers and countries that already host a large number of nodes.
As of now, it's recommended to steer clear of the following providers:

* Stark industries, PQ.hosting, and TheHosting.
* Frantech / Ponynet / BuyVM (AS53667)
* OVH SAS / OVHcloud (AS16276)
* Online S.A.S. / Scaleway (AS12876)
* Hetzner Online GmbH (AS24940)
* IONOS SE (AS8560)
* netcup GmbH (AS197540)
* Psychz Networks (AS40676)
* 1337 Services GmbH / RDP.sh (AS210558)

You can use the [Nym Explorer V2](https://nym.com/explorer/) to identify areas with high node concentration. This helps you choose a location that contributes to a more diverse and balanced network.

One reason for dense node concentration in a few countries is simple economics: some regions have many VPS providers offering excellent value for money.
As an operator, you can help the network by choosing a less common provider or a less common region.

In addition, if you plan to operate a Nym exit gateway, you should think carefully about the legal [jurisdictions](https://nym.com/docs/operators/community-counsel/jurisdictions) of your hosting provider and the country where your server is located.
Exit gateways can attract more attention than other node types because they connect the Nym network to the public Internet.
That makes provider policy, local law, and abuse handling procedures much more important.

> Side note: If you receive an "Exit Gateways Abuse Report" from your ISP, the Nym project recommends starting from the Tor Project's ["Response template for Tor relay operator to ISP"](https://community.torproject.org/relay/community-resources/eff-tor-legal-faq/tor-dmca-response/).
>
> When you receive an abuse report, use the Tor template for a quick response, but replace all occurrences of "tor" with "proxy server" before you send it.
> Nym is not Tor, and mentioning Tor can raise unnecessary suspicion with some providers.
> The Nym team has also mentioned they are working with lawyers on a Nym specific template.
>
> Second, join this Matrix channel `!YfoUFsJjsXbWmijbPG:nymtech.chat` and share as much as you can, for example screenshots, provider name, server location, and what kind of complaint it is.
>
> Last, use the community legal counsel as a shared knowledge base. Read <https://nym.com/docs/operators/community-counsel> and add your findings by opening a PR: <https://nym.com/docs/operators/add-content>.
>
> There was also a relevant comment from the [Node Operators Legal Forum](https://matrix.to/#/!YfoUFsJjsXbWmijbPG:nymtech.chat?via=nymtech.chat&via=matrix.org&via=matrix.su4ka.icu):  
> It might be time to revive the [Universal Privacy Alliance](https://privacyalliance.com/), which was originally intended to support privacy providers with legal issues.

After some research, I chose the [VPS S](https://avoro.eu/de/vps) plan from [Avoro](https://avoro.eu/en), which is part of [dataforest GmbH](https://dataforest.net) in Germany.
The plan costs EUR 5.50 per month and includes 4 vCPU, 8 GB RAM, and IPv4 plus IPv6 support.
These specifications match the [recommendations](https://nym.com/docs/operators/nodes/preliminary-steps/vps-setup) in the Nym operator guide and provide a comfortable baseline for a reliable node.

There are a few details worth knowing about Avoro's current setup.
At the moment you may need to contact Avoro support to enable an IPv6 address, because the web interface does not always provide a self service option for this feature.
Also, the web interface may show a DNS name such as `v0000000000.v-server.me`, but that name can resolve to a different IP than the one displayed in the panel.
Avoro support clarified that this hostname is symbolic and not intended to be used as a working DNS record.

To handle this, I created my own DNS name and pointed it to the correct server IP.
For that, I used [FreeDNS](https://freedns.afraid.org/)[^duckdns], which is a simple service for hosting DNS records.

> FreeDNS started in 2001 as a hobby project by Joshua Anderson and grew into a widely used service that offers both free and optional paid features.
>
> In practical terms, FreeDNS can be used in two different ways:
>
> * You can use FreeDNS as the authoritative DNS provider for a domain you own, by pointing your domain's nameservers to FreeDNS and then managing your zone there.
> * You can create a hostname under a shared domain from their public registry, meaning you pick an existing domain and create a subdomain under it.
>
> The registry is a large list of shared domains contributed by FreeDNS members. When you open the "Registry" page, you will see many domains and an "owner" column.
>
> Here is what the ownership model means in FreeDNS:
>
> * The "owner" is the FreeDNS member who added that domain to the platform and controls its configuration inside FreeDNS.
> * Some domains are "shared public", meaning any FreeDNS user can create hostnames under that domain without prior approval from the owner.
> * Some domains are "shared private", meaning the owner can review and potentially reject hostnames.
> * Some domains are "stealth", meaning they are not shared publicly. Stealth is described as a premium option.
>
> The main risk is this: if you create a hostname under a shared domain that you do not own, you depend on the domain owner and on FreeDNS keeping that domain active.
> If the owner removes the domain, changes sharing settings, or if the domain is disabled due to policy or abuse handling, your hostname may stop working.
> If you use a shared domain: treat it as "best effort".

For the operating system, I selected `Debian 13.3 (trixie)`. It is stable, widely supported, and commonly used in Nym operator guides.
Once your VPS is provisioned and you can log in via SSH, you are ready to proceed with installing the Nym node.

## VPS Setup & Configuration

The Nym docs section on [VPS Setup & Configuration](https://nym.com/docs/operators/nodes/preliminary-steps/vps-setup) is a good baseline for preparing your server.
In the following snippet, I install the core tooling I rely on, confirm that time synchronization is working, and set the server locale.

```bash
apt update -y
apt --fix-broken install -y

# Install common admin tools and dependencies used throughout this guide
apt install -y --no-install-recommends \
  ca-certificates curl wget jq tmux git rsync sqlite3 coreutils \
  ufw netcat-openbsd ipset tcpdump net-tools \
  pkg-config build-essential libssl-dev \
  nginx certbot python3-certbot-nginx python-is-python3 \
  tree emacs-nox \
  librespeed-cli btop glances ncdu

# Verify NTP via systemd-timesyncd
timedatectl show -p NTP -p NTPSynchronized -p NTPService
# Output should show:
#  NTP=yes
#  NTPSynchronized=yes

# If needed, enable time sync:
#  systemctl enable --now systemd-timesyncd
#  timedatectl set-ntp true
#  timedatectl status
#  timedatectl timesync-status

# Set your timezone (example)
#  timedatectl list-timezones | grep -i zurich
#  timedatectl set-timezone Europe/Zurich
#  timedatectl show -p Timezone --value

# Confirm ufw is installed and available
ufw version

# Enable the locales you want and generate them
sed -i -e 's/^\s*#\s*\(en_US.UTF-8 UTF-8\)/\1/' -e 's/^\s*#\s*\(de_DE.UTF-8 UTF-8\)/\1/' /etc/locale.gen
locale-gen
```

> I ran these steps twice by rebuilding the VPS from scratch.
> Because of that, I also restored the node identity from backups (see the backup section later in this post).
>
> If you ever want to reinstall your node, or move it to another VPS, this is the point where you should restore the node identity, before you continue with node setup.
>
> ```bash
> # After copying backup-restore-bundle.sh and a backup bundle (for example dotnym.2026-01-14-054215.bundle) to the new VPS, run:
> bash backup-restore-bundle.sh dotnym.2026-01-14-054215.bundle
> ```
>
> After a migration, remember to update your bonded node settings if anything that is publicly advertised has changed.
> The official docs explain this under [Change Settings via Desktop Wallet](https://nym.com/docs/operators/nodes/nym-node/bonding#change-settings-via-desktop-wallet).
> This is especially important if you move your node to a different IP address, change the DNS name, or change the HTTP port.

From here onwards there are two clean paths. Pick one and stick to it, so you do not mix assumptions from different installation styles.

* Path A: Use the new operator tooling end to end (`nym-node-cli.py`)
* Path B: Follow the manual docs and scripts (more control, more responsibility)

I will describe Path A, which uses the new [operator tooling](https://github.com/nymtech/nym/tree/develop/scripts/nym-node-setup) end to end via `nym-node-cli.py`.
This is the most consistent with the current direction of the operator docs
(one [network-tunnel-manager.sh (NTM)](https://nym.com/docs/operators/nodes/nym-node/configuration#routing-configuration) + separate [QUIC tool](https://nym.com/docs/operators/nodes/nym-node/configuration#quic-transport-bridge-deployment), orchestrated by [CLI](https://nym.com/docs/operators/tools#nym-node-cli))
and the tooling update work referenced in the [operator tooling revamp](https://github.com/nymtech/nym/pull/6186/).

Here is what the rough outline

1. **Fresh VPS baseline**
   * Confirm IPv4 + IPv6 exist and route correctly (Nym expects both).
2. **Run `nym-node-cli.py` as root**
   * The CLI fetches and runs:
     * `nym-node-prereqs-install.sh` (deps + [UFW](https://help.ubuntu.com/community/UFW) rules)
     * `nym-node-install.sh` (node install/init)
     * systemd setup scripts
     * and for exit-gateway, it also pulls NTM + QUIC script.
3. **Let the prereqs script do the firewall**
    * It installs `ufw`, enables it, and adds allow rules for:
      * `22/tcp`, `80/tcp`, `443/tcp`
      * `1789/tcp`, `1790/tcp`, `8080/tcp`, `9000/tcp`, `9001/tcp`
      * `51822/udp` (WireGuard)
      * plus an allow rule on `nymwg` for `51830/tcp` ("bandwidth queries/topup - inside the tunnel")
      * then `ufw reload` and shows status.
    * **Action for you:** review/tighten these rules based on your actual mode and ports. The script is convenient but somewhat "broad."
4. **Start `nym-node`, then bond**
   * Nym's routing config doc explicitly says: have the latest `nym-node` installed, finish VPS setup, ensure the service is running, and bond the node before running NTM.
5. **Run NTM routing configuration**
   * WireGuard enabled: `complete_networking_configuration`
   * WireGuard disabled: `nym_tunnel_setup`
6. **If WireGuard enabled: deploy QUIC bridge**
   * The changelog states QUIC bridge is required for nodes enabling WireGuard and provides the `quic_bridge_deployment.sh full_bridge_setup` flow.
7. **Validate**
   * Check firewall, NTM tests, and node logs.


### Confirm IPv4 and IPv6 exist and route correctly

In the appendix section [Troubleshoot IPv4 + IPv6](#troubleshoot-ipv4-%2B-ipv6) you will find deeper diagnostics.
In most cases, however, a quick check like the following is enough to confirm that your VPS has working outbound connectivity on both IPv4 and IPv6.

```bash
# Show your public IPv4 and IPv6 addresses
curl -4 https://ifconfig.me
curl -6 https://ifconfig.me

# Confirm basic DNS resolution plus routing works over both families
ping -4 -c 3 www.google.com
ping -6 -c 3 www.google.com
```

### Nym CLI Script Audit

The Nym Node CLI (`nym-node-cli.py`) orchestrates installation and configuration by calling several helper scripts.
If you prefer to review what will run on your server, you can download these scripts first and inspect them locally on the VPS.

```bash
# Choose which branch you want to audit
branch="develop"
base="https://raw.githubusercontent.com/nymtech/nym/${branch}/scripts/nym-node-setup"

# Create a folder dedicated to the audit copy of the scripts
mkdir -p /root/nym-node-cli-scripts-for-audit
cd /root/nym-node-cli-scripts-for-audit

# Download the helper scripts used by the CLI
for f in \
  nym-node-prereqs-install.sh \
  nym-node-install.sh \
  setup-systemd-service-file.sh \
  start-node-systemd-service.sh \
  network-tunnel-manager.sh \
  quic_bridge_deployment.sh \
  setup-nginx-proxy-wss.sh \
  landing-page.html
do
  wget -qO "$f" "$base/$f"
done

# Quick overview of what you downloaded
ls -la
```

Example: quickly search for network and service related actions:
```bash
grep -RIn --color=auto -e 'apt ' -e 'curl ' -e 'wget ' -e 'systemctl' -e 'ufw' -e 'iptables' -e 'sysctl' .
```

### Run `nym-node-cli.py` as root

At this stage, we run the Nym Node CLI script directly.
I run it as `root` because it needs to install packages, write system configuration, and create systemd services.

```bash
# Pick the branch you want to use for installation
branch="develop"
base="https://raw.githubusercontent.com/nymtech/nym/${branch}/scripts/nym-node-setup"

# Create a dedicated directory for the CLI
mkdir -p /root/nym-node-cli
cd /root/nym-node-cli

# Download the CLI script
wget -qO nym-node-cli.py "${base}/nym-node-cli.py"
chmod +x ./nym-node-cli.py

# Create an environment file consumed by the CLI
cat > env.sh <<'EOF'
export MODE="exit-gateway"
export HOSTNAME="wznymnode2.root.sx"
export LOCATION="DE"
export EMAIL="operator@weisser-zwerg.dev"
export MONIKER="weisser-zwerg.dev (wznymnode2.root.sx)"
export DESCRIPTION="weisser-zwerg.dev operated nym-node"
export WIREGUARD="true"
EOF
```

Now run the installer.

If you want a full transcript that captures both command output and your interactive input, you can use `script`:

```bash
# Install the 'script' utility (part of util-linux) if it is not present
apt-get update
apt-get install -y util-linux

# Record a complete installation transcript
LOG="/root/nym-install.$(date -u +%Y-%m-%d-%H%M%S).log"
script -q -f -a "$LOG" -c "python3 ./nym-node-cli.py install"
```

Or, if you prefer a normal interactive run without logging:

```bash
python3 ./nym-node-cli.py install
```

A few practical notes about the variables in `env.sh`:

* `MODE` selects what you are operating.
  **I recommend** using `--mode exit-gateway` initially, because this mode offers the full range of functionality, making it the best starting point.
  Once you confirm everything is running smoothly, you can switch to a more restricted mode if needed.
* `HOSTNAME` should match the DNS name you control and point to your VPS. This matters for TLS certificates and for the landing page setup.
* `LOCATION` is usually a two letter country code. It is used for metadata and discovery in tooling.
* `EMAIL` is used for certificate related automation and can also be used as an operator contact.
* `MONIKER` and `DESCRIPTION` are human readable labels that appear in explorers.
* `WIREGUARD="true"` enables WireGuard related setup steps, which is relevant if you are preparing the node for dVPN connectivity.

#### NGINX

On my first run, the CLI failed to set up Nginx, and the failure was easy to miss because the rest of the process continued. The key hint was in the log output:

```txt
* * * Starting nginx configuration for landing page, reverse proxy and WSS * * *
Landing page at /var/www/wznymnode2.root.sx/index.html
Cleaning existing nginx configuration
Failed to restart nginx.service: Unit nginx.service not found.

Failed to start nginx.service: Unit nginx.service not found.
```


This error means the Nginx package was not installed at the time the script attempted to configure and restart it.
Installing `nginx` and the certificate tooling upfront fixed the issue on the second run.

#### Bonding (One Account per Node)

During installation, the CLI prints a lot of output.
The important part is the bonding flow, where you connect your node identity to a wallet account (address) and submit an on chain bonding transaction.

Here are some relevant excerpts from my run:

```txt
Error: Package 'ntp' has no installation candidate
Error: Package 'ntpdate' has no installation candidate
...
2026-01-13T07:24:59.736762Z  WARN nym-node/src/cli/commands/run/mod.rs:53: you don't seem to have accepted the terms and conditions of a Nym node operator
2026-01-13T07:24:59.736804Z  WARN nym-node/src/cli/commands/run/mod.rs:54: please familiarise yourself with <https://nymtech.net/terms-and-conditions/operators/v1.0.0> and run the binary with '--accept-operator-terms-and-conditions' flag if you agree with them
...
Identity Key: DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo
Host: wznymnode2.root.sx
...
Running: curl -4 https://ifconfig.me
45.157.233.31
...
========================================================
* * *  FOLLOW  THESE  STEPS  TO  BOND  YOUR  NODE  * * *
If you already bonded your node before, just press enter
========================================================
1. Open your wallet and go to Bonding menu
2. Paste Identity key and your IP address (printed above)
3. Setup your operators cost and profit margin
4. Copy the long contract message from your wallet
5. Paste the contract message from clipboard here and press enter:
...
```

The warnings about `ntp` and `ntpdate` can be ignored if your server already uses `systemd-timesyncd` and time synchronization is working.
On newer Debian and Ubuntu systems, `ntp` and `ntpdate` are often not available as installable packages, because time sync is typically handled by systemd tooling instead.

The warning about accepting the operator terms and conditions is expected during the initial run.
It will disappear once the node is started with the `--accept-operator-terms-and-conditions` flag.
In my case, the tooling later added this flag to the systemd unit at `/etc/systemd/system/nym-node.service`.

Because I already operated a first Nym node from my initial [guide](../digital-civil-rights-networking-nym-node-operator-guide/), I ran into an important bonding constraint.

I initially assumed I could bond a second node with the same wallet account (address).
That is not possible.
I got confirmation in the [Node Operators](https://matrix.to/#/#operators:nymtech.chat) channel that a single account/address can only be used to bond one node (a single wallet can contain multiple accounts).

So, I created another account (new address / 24 word mnemonic), funded it from my first account, and then continued with bonding:

* New account address: [n1myvxdm68x35eqswl042me9gsenq0pn39kltfx0](https://explorer.nym.spectredao.net/account/n1myvxdm68x35eqswl042me9gsenq0pn39kltfx0)
* Funding transaction: [7755A3ACF61BA2935766DF2D851ACE2BE8D2D1CD0ADC5F10FC8ED15861EF3B1F](https://ping.pub/nyx/tx/7755A3ACF61BA2935766DF2D851ACE2BE8D2D1CD0ADC5F10FC8ED15861EF3B1F)
* Bonding transaction: [96AB17E0E6763A28775073D07698723BEB13572EC839D1D695566AB65D4D562F](https://ping.pub/nyx/tx/96AB17E0E6763A28775073D07698723BEB13572EC839D1D695566AB65D4D562F)

The bonding process itself is well documented in the official docs under [Bond via the Desktop wallet (recommended)](https://nym.com/docs/operators/nodes/nym-node/bonding#bond-via-the-desktop-wallet-recommended).
It includes detailed instructions and screenshots for the core steps:

* Enter your Identity Key
* Configure your host address
* Finalize and broadcast the bonding transaction

I explained the meaning of "Amount", "Operating Cost", and "Profit Margin" in my previous guide, and those explanations are still valid: [Amount, Operating Cost, and Profit Margin](../digital-civil-rights-networking-nym-node-operator-guide/#amount%2C-operating-cost%2C-and-profit-margin).

If you plan to join the [Nym Delegation Program](https://delegations.explorenym.net/) or a Service Grants program, double check that your operating cost and profit margin follow the published program rules: [Nym delegations program update](https://forum.nym.com/t/nym-delegations-program-update/466).

After the bonding transaction is complete, the CLI continues with many additional steps.
During this phase it may pause and ask you for confirmation by pressing enter.

#### QUIC Bridge

The next time you need to actively pay attention is when the installer reaches the QUIC bridge step and prints something like the following:

```txt
================================================================
SUCCESS: Bridge configuration created
================================================================

SECURITY NOTICE:
Config file created at: /etc/nym/bridges.toml
Permissions set to 640 (owner: nym)
Keys directory created at: /etc/nym/keys with mode 700

To further restrict access, consider:
  chmod 600 /etc/nym/bridges.toml

To start the bridge:
  systemctl enable nym-bridge
  systemctl start nym-bridge
================================================================
Detected nftables - please manually configure port 4443/udp
  Example: nft add rule inet filter input udp dport 4443 accept
Created symlink '/etc/systemd/system/multi-user.target.wants/nym-bridge.service' → '/usr/lib/systemd/system/nym-bridge.service'.
Processing triggers for man-db (2.13.1-1) ...
nym-bridge installed via .deb.
Detected nym-bridge binary in /usr/bin
Press Enter to continue...
```

The critical part is easy to overlook:

```txt
Detected nftables - please manually configure port 4443/udp
  Example: nft add rule inet filter input udp dport 4443 accept
```

This means the bridge service is installed, but the UDP port it needs is not yet allowed through your firewall.
If you miss this, the bridge may appear "running", but it will not be reachable from the Internet.

> What the QUIC bridge does in simple terms: it provides a UDP based transport endpoint (QUIC) that other components can reach.
> Because it listens on UDP/4443, you must ensure the VPS firewall allows inbound UDP traffic on that port, for both IPv4 and IPv6 if you use both.

At this point, open a second `ssh` session to your server.
In that second session, confirm that no rule exists yet for UDP port 4443:

```bash
nft list ruleset | grep 4443 || true
```

If your `INPUT` policy is `DROP`, then inbound UDP/4443 will be blocked until you add an explicit allow rule.
In your setup, you used UFW, which typically programs nftables through the `iptables-nft` compatibility layer.
A safe approach is to add the rule to the UFW chains and then persist it.

```bash
# Identify your uplink interface (do not assume eth0)
UPLINK_DEV="$(ip -o route show default | awk '{print $5}' | head -n1)"
echo "$UPLINK_DEV"

# Allow inbound QUIC bridge traffic on UDP/4443
iptables  -I ufw-user-input  1 -i "$UPLINK_DEV" -p udp --dport 4443 -j ACCEPT
ip6tables -I ufw6-user-input 1 -i "$UPLINK_DEV" -p udp --dport 4443 -j ACCEPT

# Persist across reboot if you use netfilter-persistent
netfilter-persistent save
```

Now verify the rules.
You can check via nftables and via the iptables compatible view:

```bash
nft list ruleset | grep 4443 || true

iptables  -S ufw-user-input  | grep 4443 || true
ip6tables -S ufw6-user-input | grep 4443 || true
```

Once UDP/4443 is allowed, return to your first `ssh` session and continue the installer by pressing enter when prompted.
The remaining steps are typically safe to acknowledge, but still read each prompt carefully.

After the installation finishes, verify that the QUIC bridge service is installed, enabled, and running:

```bash
systemctl is-enabled nym-bridge
systemctl status nym-bridge --no-pager
```

#### Netfilter persistence

After the full installation script finishes, it is a good moment to save firewall rules one more time, especially if you made manual changes during the install:

```bash
netfilter-persistent save
```

It is also a reasonable point to restart your Nym node service and confirm it starts cleanly:

```bash
systemctl restart nym-bridge
systemctl restart nym-node
journalctl -u nym-node | grep "starting Nym Node" || true
```

#### Verify Open Ports

As a final sanity check, it is worth looking at which ports are currently open on your VPS, and which processes are listening on them.
This helps you confirm that the Nym services started correctly and that you did not accidentally expose something you did not intend.

A simple command that shows both TCP and UDP listeners is:

```bash
ss -lntup
```

Here is an example from my node after the installer finished:

```bash
ss -lntup

root@v1768142702:~# ss -lntup
Netid      State       Recv-Q       Send-Q             Local Address:Port              Peer Address:Port      Process                                                                                                                                    
udp        UNCONN      0            0                        0.0.0.0:51822                  0.0.0.0:*                                                                                                                                                    
udp        UNCONN      0            0                              *:4443                         *:*          users:(("nym-bridge",pid=12304,fd=9))                                                                                                     
udp        UNCONN      0            0                           [::]:51822                     [::]:*                                                                                                                                                    
tcp        LISTEN      0            1024                    10.1.0.1:51830                  0.0.0.0:*          users:(("nym-node",pid=4453,fd=96))                                                                                                       
tcp        LISTEN      0            511                      0.0.0.0:9001                   0.0.0.0:*          users:(("nginx",pid=4412,fd=5),("nginx",pid=4411,fd=5),("nginx",pid=4410,fd=5),("nginx",pid=4409,fd=5),("nginx",pid=4408,fd=5))           
tcp        LISTEN      0            511                      0.0.0.0:443                    0.0.0.0:*          users:(("nginx",pid=4412,fd=7),("nginx",pid=4411,fd=7),("nginx",pid=4410,fd=7),("nginx",pid=4409,fd=7),("nginx",pid=4408,fd=7))           
tcp        LISTEN      0            511                      0.0.0.0:80                     0.0.0.0:*          users:(("nginx",pid=4412,fd=9),("nginx",pid=4411,fd=9),("nginx",pid=4410,fd=9),("nginx",pid=4409,fd=9),("nginx",pid=4408,fd=9))           
tcp        LISTEN      0            128                      0.0.0.0:22                     0.0.0.0:*          users:(("sshd",pid=812,fd=6))                                                                                                             
tcp        LISTEN      0            1024                           *:8080                         *:*          users:(("nym-node",pid=4453,fd=15))                                                                                                       
tcp        LISTEN      0            1024                           *:9000                         *:*          users:(("nym-node",pid=4453,fd=79))                                                                                                       
tcp        LISTEN      0            511                         [::]:9001                      [::]:*          users:(("nginx",pid=4412,fd=6),("nginx",pid=4411,fd=6),("nginx",pid=4410,fd=6),("nginx",pid=4409,fd=6),("nginx",pid=4408,fd=6))           
tcp        LISTEN      0            511                         [::]:443                       [::]:*          users:(("nginx",pid=4412,fd=8),("nginx",pid=4411,fd=8),("nginx",pid=4410,fd=8),("nginx",pid=4409,fd=8),("nginx",pid=4408,fd=8))           
tcp        LISTEN      0            511                         [::]:80                        [::]:*          users:(("nginx",pid=4412,fd=10),("nginx",pid=4411,fd=10),("nginx",pid=4410,fd=10),("nginx",pid=4409,fd=10),("nginx",pid=4408,fd=10))      
tcp        LISTEN      0            128                         [::]:22                        [::]:*          users:(("sshd",pid=812,fd=7))                                                                                                             
tcp        LISTEN      0            1024                           *:1790                         *:*          users:(("nym-node",pid=4453,fd=21))                                                                                                       
tcp        LISTEN      0            1024                           *:1789                         *:*          users:(("nym-node",pid=4453,fd=22))                                                        
```

How to read this output:

* `*:4443/udp` served by `nym-bridge` is the QUIC bridge. This is the port you manually opened earlier.
* `:80` and `:443` served by `nginx` are typically your landing page and TLS reverse proxy. Port `443` is also commonly used for WSS related components.
* `:22` served by `sshd` is your SSH access. This should be open only to the sources you trust.
* Ports served by `nym-node` are the node internal and external services. Some may be intended to be public, while others are intended to be reachable only locally or through a private tunnel.

In your example, one listener is bound to `10.1.0.1:51830`. That is a private address, which is bound to an internal interface, such as a WireGuard or routing interface.

If you want to focus only on sockets that are reachable from the public Internet, pay attention to listeners bound to `0.0.0.0:<port>` and `[::]:<port>` or `*:<port>`.
These bindings usually mean "all interfaces".
Listeners bound to a specific private address (for example `10.x.x.x`) are generally limited to that internal interface.

### UFW vs. `netfilter-persistent` package conflict

During installation I noticed an inconsistency in the helper scripts.
Early on, the scripts configure firewall rules using `ufw`.
Later, `network-tunnel-manager.sh` and `quic_bridge_deployment.sh` install `iptables-persistent`, which pulls in `netfilter-persistent`.
On Debian, these packages conflict with `ufw`, so you can end up with a partially removed `ufw` package and firewall persistence handled by `netfilter-persistent` instead.

This is not automatically "bad", but it is something you should be aware of.
The important operational point is that you should have exactly one clear source of truth for firewall configuration.

> If you think you are managing rules with `ufw`, but the system is actually loading rules from `/etc/iptables/rules.v4` and `/etc/iptables/rules.v6` at boot, troubleshooting becomes very confusing.

You can see the conflict directly in the package metadata on Debian:

```bash
apt-cache show ufw | grep -E '^(Package|Version|Depends|Breaks|Conflicts|Replaces):'
```

Example output:

```txt
Package: ufw
Version: 0.36.2-9
Depends: iptables, procps, ucf, python3:any, debconf (>= 0.5) | debconf-2.0
Breaks: iptables-persistent, netfilter-persistent
```

To understand why this happens, it helps to grep the scripts you audited earlier.
In my case, the prereqs script clearly installs and enables `ufw`, but later scripts install `iptables-persistent`:

```bash
grep -RInE 'apt(-get)? .*install .*iptables-persistent|apt(-get)? .*install .*netfilter-persistent|ufw' \
  /root/nym-node-cli-scripts-for-audit 2>/dev/null
```

Example hits (trimmed):
```txt
nym-node-prereqs-install.sh:... apt install ... ufw ...
nym-node-prereqs-install.sh:... ufw enable
nym-node-prereqs-install.sh:... ufw allow ...
network-tunnel-manager.sh:... apt-get install -y iptables-persistent
quic_bridge_deployment.sh:... apt-get install -y iptables-persistent
```

This is not necessarily a problem, but you should decide which system you want to keep.

#### If you are happy with the current firewall rules

If your node works and the current rules look correct, the simplest option is to accept the result and clean up any residual package state.
In my case, the system ended up using `netfilter-persistent`, and `ufw` was already removed except for leftover config files.

First, check the current state:

```bash
dpkg -l ufw || true
command -v ufw || echo "ufw binary not found"

systemctl is-enabled netfilter-persistent || true
systemctl status netfilter-persistent --no-pager || true

ls -l /etc/iptables/ || true
```

Example output showed:

* `ufw` in `rc` state and no `ufw` binary present
* `netfilter-persistent` enabled and active
* `/etc/iptables/rules.v4` and `/etc/iptables/rules.v6` present

If your system looks similar, you can fully remove `ufw` to avoid confusion later:

```bash
apt-get purge -y ufw
```

At this point, your firewalling is controlled by `netfilter-persistent`.
You can create a backup of the current configuration like this:

```bash
nft list ruleset  > "/root/nft.rules.backup.$(date +%F-%H%M%S)"
iptables-save     > "/root/iptables.rules.v4.backup.$(date +%F-%H%M%S)"
ip6tables-save    > "/root/iptables.rules.v6.backup.$(date +%F-%H%M%S)"
cp -a /etc/iptables "/root/etc-iptables.backup.$(date +%F-%H%M%S)" 2>/dev/null || true
```



## Backup

If you run a node for more than a few days, you will eventually need backups.
A backup is what lets you rebuild your VPS after an incident, migrate to a new host, or upgrade safely without losing your node identity.

The Nym docs page [Where can I find my private and public keys and config?](https://nym.com/docs/operators/troubleshooting/nodes#where-can-i-find-my-private-and-public-keys-and-config) explains where the node stores its identity keys and configuration.

To make this easy and repeatable, I prepared a small set of [scripts](https://gist.github.com/cs224/3af61447aa358fceb77985c01e87a4e9) that handle backup, restore, and binary upgrade. You can clone them like this:

```bash
cd /root
git clone https://gist.github.com/cs224/3af61447aa358fceb77985c01e87a4e9 nym-backup/
tree nym-backup/
cd /root/nym-backup/
rm -rf .git
chmod u+x *.sh
```

Example layout:

```txt
nym-backup/
├── backup-create-backup.sh
├── backup-create-bundle.sh
├── backup-init.sh
├── backup-restore-bundle.sh
├── bashrc
└── upgrade-swap-binary-symlink.sh
```

In `nym-backup/bashrc` you will find a few shell aliases that you can copy into your own `~/.bashrc`.

These are:

* `git-ls` shows the backups you have created (each backup is a git commit with metadata).
* `nym-ls` shows available `nym-node` binaries from GitHub releases.
* `nym-dl nym-binaries-v2025.21-mozzarella` downloads the specified release into `/root/nym-binaries` as `/root/nym-binaries/nym-node-v2025.21-mozzarella`.

### Initialize the backup repository

The backup structure is based on a local git repository.
The advantage is that you get a full history of changes, and you can quickly review what changed between snapshots.

Initialize it once:

```bash
bash backup-init.sh
```

Example output:

```txt
Initialized empty Git repository in /root/nym-backup/dotnym-repo/.git/
[main (root-commit) 238980a] Initialize backup repository
 2 files changed, 12 insertions(+)
 create mode 100644 .gitignore
 create mode 100644 meta/current_target.txt
Init complete:
  Repo:       /root/nym-backup/dotnym-repo
  Bundles:    /root/nym-backup/dotnym-bundles
```

### Create a backup snapshot

Whenever you feel it is a good moment, create a backup snapshot.
I recommend doing it after initial setup, before upgrades, and after any meaningful configuration change.

```bash
bash backup-create-backup.sh
```

Example output (trimmed):

```txt
[main 4c9090c] Snapshot 2026-01-14-152512
...
Committed snapshot 2026-01-14-152512
```

You can review the backup history and inspect changes:

```bash
# Review snapshots (convenience alias)
git-ls

# Show which files changed in the latest snapshot
git -C /root/nym-backup/dotnym-repo show --pretty="" --name-only HEAD~0

# Show the actual diff for the latest snapshot
git -C /root/nym-backup/dotnym-repo show HEAD~0
```

### Create a portable bundle

A snapshot is stored in the local git repo.
A bundle is the portable artifact you can move to another machine.
It is the unit you use for disaster recovery and migrations.

Create a bundle like this:

```bash
bash backup-create-bundle.sh
```

Example output (trimmed):

```txt
Created and verified bundle: /root/nym-backup/dotnym-bundles/dotnym.2026-01-14-162512.bundle
```

A bundle is a self contained git history export.
It is convenient because you can copy a single file to another VPS and restore everything needed for your node identity from it.

## Restore

A bundle is what you use to restore a node identity after you reinstall a VPS or move to a different VPS.
This is the same workflow I referenced earlier in [VPS Setup & Configuration](#vps-setup-%26-configuration).

> If you ever want to reinstall your node, or move it to another VPS, restore the node identity before you continue with node setup.
> If you install and start a fresh node first, you might generate a new identity and then have to undo it.

```bash
# After copying backup-restore-bundle.sh and a backup bundle
# (for example "dotnym.2026-01-14-054215.bundle") to the new VPS, run:
bash backup-restore-bundle.sh dotnym.2026-01-14-054215.bundle
```

### Restore on a different machine

If you change any bonded settings during a migration, you must also update them on chain. Typical examples are:

* You moved to a different public IP address
* You changed from using an IP to using a DNS name (or the other way around)
* You changed the HTTP port that should be advertised

The docs page [Change Settings via Desktop Wallet](https://nym.com/docs/operators/nodes/nym-node/bonding#change-settings-via-desktop-wallet) explains how to announce these changes via the desktop wallet.

> Why this matters: explorers and clients use the bonded metadata to find and reach your node.
> If the on chain host information is outdated, your node can be technically "up", but unreachable for routing and selection.

## Upgrade

Before you upgrade, I recommend that you read through the [changelog](https://nym.com/docs/operators/changelog).
It often includes important operator notes, such as configuration changes, new defaults, and networking updates that can affect your node after the restart.

The first step is to check which versions are available. You can use the [previously mentioned](#backup) bash alias `nym-ls` for that:

```bash
nym-ls
prerelease,draft,updated_at,url
false,false,"2025-11-25T14:28:12Z","https://github.com/nymtech/nym/releases/download/nym-binaries-v2025.21-mozzarella/nym-node"
false,false,"2025-11-12T08:21:17Z","https://github.com/nymtech/nym/releases/download/nym-binaries-v2025.20-leerdammer/nym-node"
...
```

Next, download the release you want to upgrade to.
In the list above, a stable and recent example is `nym-binaries-v2025.21-mozzarella`.
Use the [previously mentioned](#backup) bash alias `nym-dl` for that:

```bash
nym-dl nym-binaries-v2025.21-mozzarella
```

This command will place the downloaded binary at: `/root/nym-binaries/nym-node-v2025.21-mozzarella`.

After the download, the script `upgrade-swap-binary-symlink.sh` upgrades the node binary by swapping a symlink. In practical terms, it does the following:

1. Stops the `nym-node` systemd service
2. Points `/root/nym-binaries/nym-node` to the selected versioned binary
3. Starts the service again

Example run:

```bash
bash nym-backup/upgrade-swap-binary-symlink.sh v2025.21-mozzarella
```

Example output (trimmed):

```txt
Pre-flight:
  Input:        v2025.21-mozzarella
  Version:      v2025.21-mozzarella
  Release tag:  nym-binaries-v2025.21-mozzarella
  New binary:   /root/nym-binaries/nym-node-v2025.21-mozzarella
  Symlink:      /root/nym-binaries/nym-node
  Old target:   <none>

Checking new binary runs...
Stopping nym-node.service...
Swapping symlink atomically...
Starting nym-node.service...
Updated: /root/nym-backup/dotnym-repo/meta/current_upgrade.txt

Upgrade successful.
Symlink now points to:
/root/nym-binaries/nym-node-v2025.21-mozzarella
Running version:
nym-node
Binary Name:        nym-node
Build Timestamp:    2025-11-25T14:26:29.627763948Z
Build Version:      1.22.0
Commit SHA:         22793bc45ea21561671d6670497ff42bc36b9d76
Commit Date:        2025-11-25T15:16:42.000000000+01:00
Commit Branch:      HEAD
rustc Version:      1.88.0
rustc Channel:      stable
cargo Profile:      release
```

Next, watch the logs closely. If you do not see errors during startup and the node settles into normal operation, verify the node's build information endpoint.

```bash
# watch the logs:
journalctl -u nym-node -f -n 200

# verify the node's info endpoint (direct):
curl -sS -X 'GET' 'http://45.157.233.31:8080/api/v1/build-information' -H 'accept: application/json' | jq

# or via DNS name and through the nginx proxy:
curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/build-information' -H 'accept: application/json' | jq
```

Sometimes you will see in the [changelog](https://nym.com/docs/operators/changelog) that the Nym network has changed which ports are allowed for exit traffic (or which ports are expected to be reachable, depending on your node role and configuration).
These changes typically come from NIP proposals that node operators can vote on.
If approved, the updated port policy becomes part of the network's operating assumptions.

> Just as an example of that governance process, you can review: [NIP-4: Nym Exit Policy Update 'Opening Port 587'](https://governator.nym.com/proposal/prop-ca6726ea-38b1-4568-97fe-8bdc5fdc83a0).

If this happens, you will need to run the [Network Tunnel Manager (NTM)](https://nym.com/docs/operators/nodes/nym-node/configuration#routing-configuration) again so that your local routing and policy configuration matches the current network expectations.

> You can also make it a habit to rerun the Network Tunnel Manager reconfiguration after every upgrade.
> This is slightly redundant when nothing changed, but it reduces the chance that you forget it when the changelog does include a port or routing update.

Have a look at the appendix section [Network Tunnel Manager](#network-tunnel-manager) for step by step instructions.

### Backup after Upgrade

The upgrade script itself does not create a backup commit.
After a successful upgrade, it is a good habit to record the new state in your backup repository:

```bash
./backup-create-backup.sh
```

Example output:

```txt
[main 651bc56] Snapshot 2026-01-14-154213
 10 files changed, 10 insertions(+), 1 deletion(-)
 create mode 100644 meta/current_upgrade.txt
Committed snapshot 2026-01-14-154213
```

Suggested upgrade routine that works well in practice:

1. Create a backup snapshot and bundle.
2. Upgrade by swapping the binary symlink.
3. Confirm the node starts cleanly and stays stable for a few minutes.
4. Create a new backup snapshot so the repo records the upgrade metadata.

This routine is boring, but it is reliable.

## Conclusion

In this post, you have seen how to use the [Nym Node CLI](https://nym.com/docs/operators/tools#nym-node-cli) to set up a `nym-node` from scratch.
Compared to the approach I described in my earlier guide, [Nym Mixnet & dVPN: A Node Operator's Guide](../digital-civil-rights-networking-nym-node-operator-guide), the 2026 setup flow is much smoother and more consistent.

Running a node is a practical way to support privacy and censorship resistance.
The Nym mixnet becomes stronger when more independent operators contribute infrastructure, keep nodes online reliably, and increase geographic diversity.

If you have questions, corrections, or suggestions, feel free to use the comments section below.
I am also interested in hearing about your operator setup, what worked well for you, and what was unclear or difficult.

## Appendix

### Investigating the Node via API

```bash
curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/description' -H 'accept: application/json' | jq
{
  "moniker": "weisser-zwerg.dev (wznymnode2.root.sx)",
  "website": "https://weisser-zwerg.dev/posts/digital-civil-rights-networking-nym-node-operator-guide-2026/",
  "security_contact": "operator@weisser-zwerg.dev",
  "details": "weisser-zwerg.dev operated nym-node"
}

curl -sS -X 'GET' 'https://validator.nymtech.net/api/v1/nym-nodes/bonded' -H 'accept: application/json' | jq '.data[] | select(.bond_information.node.identity_key=="DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo") | .rewarding_details.cost_params'
{
  "profit_margin_percent": "0.2",
  "interval_operating_cost": {
    "denom": "unym",
    "amount": "250000000"
  }
}

curl -sS -X 'GET' 'https://validator.nymtech.net/api/v1/nym-nodes/described' -H 'accept: application/json' | jq | grep DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo

curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/roles' -H 'accept: application/json' | jq
{
  "mixnode_enabled": false,
  "gateway_enabled": true,
  "network_requester_enabled": true,
  "ip_packet_router_enabled": true
}

curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/build-information' -H 'accept: application/json' | jq
{
  "binary_name": "nym-node",
  "build_timestamp": "2025-11-25T14:26:29.627763948Z",
  "build_version": "1.22.0",
  "commit_sha": "22793bc45ea21561671d6670497ff42bc36b9d76",
  "commit_timestamp": "2025-11-25T15:16:42.000000000+01:00",
  "commit_branch": "HEAD",
  "rustc_version": "1.88.0",
  "rustc_channel": "stable",
  "cargo_profile": "release",
  "cargo_triple": "x86_64-unknown-linux-gnu"
}

curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/auxiliary-details' -H 'accept: application/json' | jq
{
  "location": "DE",
  "announce_ports": {
    "verloc_port": null,
    "mix_port": null
  },
  "accepted_operator_terms_and_conditions": true
}
{
  "location": "DE",
  "announce_ports": {
    "verloc_port": 1790,
    "mix_port": 1789
  },
  "accepted_operator_terms_and_conditions": true
}

curl -sS -X 'GET' 'https://wznymnode2.root.sx/api/v1/load' -H 'accept: application/json' | jq
{
  "total": "low",
  "machine": "negligible",
  "network": "negligible"
}

# The [Nym Node Troubleshooting](https://nym.com/docs/operators/troubleshooting/nodes) guide mentions to check the `blacklist`, which you can do as follows:
curl -sS -X 'GET' https://validator.nymtech.net/api/v1/gateways/blacklisted | jq | grep DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo
```

> Nym provides a public [Swagger UI](https://validator.nymtech.net/api/swagger/index.html) for the validator hosted API.
> In practice, you should treat the Swagger and OpenAPI definition published by that specific deployment as the source of truth for what the instance actually exposes.
>
> There is also a public  [Swagger UI](https://mainnet-node-status-api.nymtech.cc/swagger/#/Gateways) for the node status APIs.


### Troubleshoot IPv4 + IPv6

When node setup fails, networking is a common root cause.
Before changing anything, it helps to confirm four things in order: addresses, default routes, kernel routing decisions, and real outbound connectivity.

First, confirm that your VPS actually has public IPv4 and IPv6 addresses assigned:
```bash
ip -br -4 addr
ip -br -6 addr
```

Next, confirm that default routes exist for both IPv4 and IPv6:
```bash
ip -4 route show default
ip -6 route show default
```

Then, confirm that the kernel can select a valid egress path and source address. This is useful when you have multiple interfaces, multiple IPs, or policy routing:
```bash
ip -4 route get 1.1.1.1
ip -6 route get 2606:4700:4700::1111
```

Finally, confirm real outbound connectivity, not just correct looking routing tables:
```bash
curl -4 https://ifconfig.me
curl -6 https://ifconfig.me
ping -4 -c 3 1.1.1.1
ping -6 -c 3 2606:4700:4700::1111
```

### `uv` Python Environment

Normally I prefer to use [`uv`](https://docs.astral.sh/uv/) to manage Python versions and virtual environments.
It is fast, predictable, and keeps system packages separate from project tooling.
In this post, however, we already installed system Python packages, which is perfectly fine for a VPS where you want a straightforward baseline.

If you still prefer `uv`, you can install it and add it to your `PATH` like this:
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh

line='export PATH="/root/.local/bin:$PATH"'
file=/root/.bashrc

grep -qxF "$line" "$file" || printf '\n%s\n' "$line" >> "$file"
source /root/.bashrc
```

Then, you can [install Python executables](https://docs.astral.sh/uv/concepts/python-versions/#installing-python-executables) via `uv`.
For example, to install Python 3.12 and make it the default:
```bash
uv python install 3.12 --default
```

### Network Tunnel Manager

The Nym network has two separate datapaths: the dVPN datapath (2-hop, WireGuard based) and the mixnet datapath (5-hop).
Because these two parts work differently, their exit policies are handled differently as well.

#### dVPN Datapath (2-hop, WireGuard)

For the dVPN datapath (2-hop, WireGuard), the exit policy is enforced locally via firewall rules on your server.
To (re)apply the current WireGuard exit policy, use the `network-tunnel-manager.sh` helper script:

```bash
curl -L https://raw.githubusercontent.com/nymtech/nym/refs/heads/develop/scripts/nym-node-setup/network-tunnel-manager.sh \
  -o network-tunnel-manager.sh \
  && chmod +x network-tunnel-manager.sh \
  && ./network-tunnel-manager.sh --help

# Then run:
./network-tunnel-manager.sh complete_networking_configuration
```

> In practice, this script configures the networking pieces that make the 2 hop dVPN mode work safely on your host.
> Depending on your distribution and kernel firewall backend, it may apply rules via `iptables` or `nftables`.

If you do not want to run the single "all in one" command, you can also run the same steps piece by piece:

```bash
./network-tunnel-manager.sh exit_policy_clear
./network-tunnel-manager.sh exit_policy_install
./network-tunnel-manager.sh exit_policy_status
./network-tunnel-manager.sh exit_policy_tests
```

It is a good idea to run `exit_policy_status` and `exit_policy_tests` either way (whether you used `complete_networking_configuration` or the step by step approach).
This gives you a quick confirmation that the policy is installed and behaves as expected.

#### Mixnet Datapath (5-hop)

For the mixnet datapath, the exit policy is not maintained through your local firewall rules in the same way.
Instead, `nym-node` pulls the current exit policy on startup and applies it as part of its normal runtime configuration.
The policy file is published here: <https://nymtech.net/.wellknown/network-requester/exit-policy.txt>.

In most cases, you do not need to do anything special beyond restarting your node, which you likely already did during the upgrade:

```bash
systemctl restart nym-node
```


### Node Ping Tester

The [Node Ping Tester](https://nym.com/docs/operators/tools#node-ping-tester) helps you check how many Nym nodes will respond to an ICMP ping from your current machine and IP address.
This is a quick way to understand basic network reachability from where you are running the test.

Under the hood, it is a small shell script that fetches the list of nodes from Nym's `nym-nodes/described` API endpoint, extracts any IP addresses that nodes publish in their self description, and then tries to ping each of them.
The goal is not to prove that a node is healthy, but to see whether ping traffic is allowed through the node's firewall and hosting provider.

Run it like this:

```bash
wget https://raw.githubusercontent.com/nymtech/nym/refs/heads/develop/scripts/test-nodes-pings.sh \
  && chmod +x test-nodes-pings.sh \
  && ./test-nodes-pings.sh
```

### Nym Gateway Probe

Nym node operators are usually familiar with the [Harbourmaster](https://harbourmaster.nymtech.net/) monitoring interface.
Under the hood, Nym's monitoring stack runs periodic [gateway probes](https://nym.com/docs/operators/performance-and-testing/gateway-probe) and then displays the results in Harbourmaster.

The key point is that a probe is not just a passive "status ping".
It actively behaves like a real user would, and it exercises multiple parts of the gateway and the surrounding infrastructure:

* it checks the gateway's published capabilities and configuration
* it registers a mixnet client
* it registers a WireGuard peer
* it tops up bandwidth using a zk nym credential
* it sends ICMP pings
* it downloads test files

Because the probe tries to follow real user flows, it needs paid credential material to perform some of these steps.
In Nym's terminology, [zk nyms](https://support.nym.com/hc/en-us/articles/32814392735377-What-are-zk-nyms) are anonymous credentials that can be used to prove you have the right to access bandwidth, without revealing a long term identity.

Because the official probes run periodically, operators typically get fresh results in Harbourmaster without doing anything.
Still, there are many situations where you want to run a probe on demand.
With `nym-gateway-probe`, you can test a gateway from your own machine at any time, which is especially useful after configuration changes, firewall updates, routing changes, or when you are diagnosing reachability problems from a specific network.

In a single run, the probe may query directory and metadata sources such as:

* [nym api](https://validator.nymtech.net/api/v1/nym-nodes/described)
* [explorer and node status APIs](https://mainnet-node-status-api.nymtech.cc/swagger/#/Gateways)
* [Harbourmaster](https://harbourmaster.nymtech.net/)

> Also have a look at [Gateway Probe Details and Contradictions](https://nym.com/docs/operators/performance-and-testing/gateway-probe-details).
> Here is a key portion:
>
> > The cheaper the VPS, the more it is likely to be rate limited or have a leaky bucket quota that will appear to users as "unreliable".
> >
> > The best hosts will be ones with a fixed bandwidth that is capped by the hosting provider with network equipment, because:
> > * Users will scale with the available bandwidth
> > * No weird side effects of quotas
> > * Most predictable behaviour
> > * Will not be the cheapest, but will also not be the most expensive
> >
> > Bursting sounds attractive, but could be financially crippling for operators.


#### Build

Build the probe from the Nym monorepo (example for Debian/Ubuntu):

```bash
sudo apt update
sudo apt install -y pkg-config build-essential libssl-dev curl jq git

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup update

git clone https://github.com/nymtech/nym.git
cd nym

git reset --hard      # in case you made any changes on your branch
git pull              # in case you've checked it out before

git checkout develop   # or master
cargo build --release -p nym-gateway-probe # build your binaries with **mainnet** configuration
```

Verify the build:

```bash
./target/release/nym-gateway-probe --help
./target/release/nym-gateway-probe run-local --help
```

#### Wallet funding and "why ~30 NYM?"

A full probe run performs paid actions that intentionally "act like a user", such as registration and bandwidth top ups.
To do that, the probe acquires *ticketbooks*, and your logs will show messages like these:

* `we'll need to deposit 10000000unym to obtain the ticketbook` (10 NYM)
* `Succeeded adding a ticketbook of type 'v1-mixnet-entry'`
* `Succeeded adding a ticketbook of type 'v1-wireguard-entry'`
* `Succeeded adding a ticketbook of type 'v1-wireguard-exit'`

In mixnet mode, this commonly results in roughly 3 ticketbooks times 10 NYM, so around 30 NYM, plus transaction fees.

> What is a "ticketbook" in practice?
>
> A useful mental model is to treat a ticketbook like a prepaid bundle of anonymous access tickets.
> The probe deposits NYM on chain (that is the "10 NYM" you see in the logs) and receives cryptographic credential material in return.
> Later, when the probe needs to perform an action that consumes bandwidth or requires authorization, it spends tickets from that local credential material rather than paying each step on chain again.
>
> This also explains why the probe needs a funded wallet even if you only want to run a quick connectivity test.
> The probe is not only checking that an IP and port are reachable.
> It is trying to reproduce the same flows that a real user would trigger, and those flows are designed to be rate limited and paid for.

The ticketbooks are stored locally, inside the probe's state directory.
If you lose that local state directory, you also lose the locally stored ticketbooks.
This can make it look like tokens "disappeared".

Operationally, this has two consequences:

* Treat the probe state directory as valuable data.
* Run probes from a stable environment and keep the state directory persistent.

#### Persisting state (avoid using `/tmp`)

By default, the probe stores its local state under `/tmp/nym-gateway-probe/...` (including the persistent reply store database).
On many Linux systems, `/tmp` is backed by `tmpfs`, which means it is stored in memory and is cleared on reboot.
In that case, your probe state will silently disappear whenever the machine restarts.

To persist state on disk, use `--config-dir` with `run-local` and point it to a durable location, for example under your home directory:

```bash
./target/release/nym-gateway-probe run-local \
  --config-dir "$HOME/.local/share/nym-gateway-probe" \
  -g <GATEWAY_IDENTITY_KEY> \
  --mnemonic "<FUNDED_24_WORD_MNEMONIC>"
```

If the stored state becomes inconsistent, for example after an unclean shutdown, you can delete the directory and run the probe again.
Be aware that this also deletes any cached ticketbooks stored in that directory, so the probe may need to fund and obtain new ticketbooks on the next run.


#### `run-local` vs top-level invocation

The probe exposes two CLI entry points, and they are designed for different operational setups.

* `nym-gateway-probe run-local ...`  
  This mode is intended for running the probe from your own machine while keeping things simple.
  You provide a funded wallet mnemonic using `--mnemonic`, and the probe will acquire the required credential material for you.
  You can also set `--config-dir` to control where the probe stores its local state.

* `nym-gateway-probe ...` (without `run-local`)  
  This mode is intended for environments where you manage credential material outside of the probe itself, for example in monitoring automation or an operator controlled pipeline.
  In this case, you are expected to provide the ticket material explicitly.

If you run the probe without `run-local` and you do not provide the required `--ticket-materials`, the CLI will fail with an error like `ticket_materials is required`.

#### LP Mode (Lewes Protocol) - FYI

The repository includes LP documentation (`./docs/LP_README.md`) describing a "fast registration" protocol called the Lewes Protocol.
The idea is to register and set up WireGuard using a direct TCP control port (default `41264`), without going through mixnet based registration.

In the probe CLI, this is exposed via options such as:

* `--mode single-hop`
* `--mode two-hop`
* `--mode lp-only`
* and/or `--test-lp-wg`

> A simple way to think about LP is that it trades privacy properties for speed and simplicity.
> Mixnet based registration intentionally routes control traffic through the mixnet, which adds latency but aligns with Nym's privacy design.
> LP instead uses a direct network path to the gateway's control port, which can be faster and easier to debug, but it depends on the gateway exposing that port to the public internet.

Operationally, there are two important realities to keep in mind:

* Most gateways on mainnet will not have LP enabled or reachable.
  In that case, the probe will fail with timeouts when trying to connect to TCP port `41264`, even if the gateway is otherwise fully functional for mixnet and WireGuard.
* This is expected unless the gateway operator has explicitly enabled LP in the gateway configuration and opened the firewall for TCP port `41264`.

Therefore, treat LP as an optional capability check.
Do not interpret LP failures as "the gateway is unhealthy" unless your operational model explicitly depends on LP.

For most operators today, the primary value comes from mixnet mode (`--mode mixnet`).
It exercises the normal user path and does not require LP to be enabled.

#### CLI Guide: Key Parameters, Grouped by Intent

This section groups the most relevant `nym-gateway-probe` CLI parameters by what you are trying to achieve operationally.

##### Target Selection

You can tell the probe which gateway to test in a few main ways.

* **Directory based selection (by identity key)**  
  Use this when you want to test the gateway as it is seen by the network.
  * `-g, --entry-gateway <ENTRY_GATEWAY>`  
    Select a gateway by its identity key (an Ed25519 public key encoded in base58). This is the normal operational mode: the probe looks up the node in the directory and then runs the selected tests.
* **Direct targeting**  
  Use this if you know the `<GATEWAY_IP>`.
  * `--gateway-ip <GATEWAY_IP>`  
    Probe a gateway directly by connecting to its HTTP API (often on port `8080`) and reading its descriptor. It typically accepts `IP`, `IP:PORT`, or `HOST:PORT` such as `152.53.122.46:8080`.
* **Two hop and forwarding test target (LP focused)**  
  Use this only when you intentionally test LP forwarding behavior with a fixed entry and exit.
  * `--exit-gateway-ip <EXIT_GATEWAY_IP>`  
    Sets the explicit exit gateway for LP based forwarding tests.

##### Test Mode Selection

The probe supports multiple test modes. A mode determines which registration path is used and which subsystems are exercised.

* `--mode <MODE>`  
  Explicitly selects the test mode.

Common modes as shown by `--help` include:

* `mixnet`  
  Traditional mixnet testing. This is the most representative operational path: attach to an entry gateway, validate mixnet routing, and then run WireGuard through the normal authenticator path. No LP support is required.

* `single-hop`  
  LP registration plus WireGuard on a single gateway, without mixnet involvement. This requires the gateway to expose the LP control port, typically `41264`.

* `two-hop`  
  LP forwarding test across an entry gateway and an exit gateway, plus WireGuard. This also requires LP to be reachable.

* `lp-only`  
  LP registration checks only, without WireGuard.

As mentioned earlier, most mainnet gateways do not have LP enabled or reachable.
In practice, that means `--mode mixnet` is the mode that applies to most real world operator diagnostics.

##### Cost Control Knobs

The probe "acts like a user" and may acquire ticketbooks, each of which can require an on chain deposit.
Whether it needs to do that depends on what tests you run and whether your local credential store already contains the required ticketbooks.

The most useful cost and scope controls are:

* `--only-wireguard`  
  Runs only the WireGuard portion of the probe without executing the full set of other checks.
  This is helpful for quick checks and for aligning with the WireGuard focused view you often see in Harbourmaster.

* `--min-gateway-mixnet-performance <N>`  
  Influences filtering and eligibility when selecting nodes from the directory.
  Setting it to `0` can help when your gateway is reachable but is being excluded due to limited performance history or strict selection criteria.

**Important operational point**: if you persist the probe state using `--config-dir`, the probe can reuse cached ticketbooks.
This reduces repeated deposits and makes repeated runs cheaper.

##### Netstack Options

The "netstack" options tune the probe's internal network test behaviour, such as timeouts, DNS resolvers, ping targets, and download behaviour.
These options matter most when you diagnose flaky networks, IPv6 issues, captive portals, strict egress rules, or hosting providers that treat ICMP and large downloads differently.

Common knobs include:

* Timeouts
  * `--metadata-timeout-sec`
  * `--netstack-download-timeout-sec`
  * `--netstack-send-timeout-sec`
  * `--netstack-recv-timeout-sec`

* DNS configuration
  * `--netstack-v4-dns`
  * `--netstack-v6-dns`

* Ping behaviour
  * `--netstack-num-ping`
  * `--netstack-ping-hosts-v4`, `--netstack-ping-ips-v4`
  * `--netstack-ping-hosts-v6`, `--netstack-ping-ips-v6`

#### Practical Run Examples

Below are command lines that correspond to common operator questions. All examples assume you have already built the binary as shown earlier.

##### Verifying directory presence with `curl` and `jq`

Before you start deeper diagnostics, it is worth confirming whether the directory API currently exposes your node at all.
If the directory does not list your gateway, many directory based workflows will fail, even when the gateway is reachable by IP.

This example looks up a node by its identity key (Ed25519, base58 encoded):

```bash
ID="DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo"

curl -fsS 'https://validator.nymtech.net/api/v1/nym-nodes/described' | jq -r --arg id "$ID" '
  .data[]
  | select(.description.host_information.keys.ed25519 == $id)
  | {
      node_id,
      last_polled: .description.last_polled,
      ip: .description.host_information.ip_address,
      hostname: .description.host_information.hostname,
      declared_role: .description.declared_role,
      ws_port: .description.mixnet_websockets.ws_port,
      wss_port: .description.mixnet_websockets.wss_port,
      wg: .description.wireguard
    }'
```

How to interpret the output:

* If you get a JSON object back, the directory API currently includes your node.
* If you get no output, the node is not present in this particular directory view at that moment.

##### `--mnemonic` and `--min-gateway-mixnet-performance`

The two parameters `--mnemonic` and `--min-gateway-mixnet-performance` deserve special attention.

You typically only need to provide `--mnemonic "<FUNDED_24_WORD_MNEMONIC>"` the first time you run `nym-gateway-probe`, as long as you keep a persistent state directory (for example with `--config-dir "$HOME/.local/share/nym-gateway-probe"`).
After the first run, the probe can usually reuse the locally stored ticketbooks from that state directory.
You only need to pass the mnemonic again when the probe must acquire additional ticketbooks, or when you lost or deleted the local state directory.

The other flag matters mainly when you are testing a fresh Nym node.
New gateways often have little or no performance history yet.
If the probe selects targets via the directory, that low score can cause filtering and eligibility issues.
This is why `--min-gateway-mixnet-performance 0` is useful during early setup: it tells `nym-gateway-probe` to treat your node as eligible even if the current performance score is low.

> This flag is relevant when you select a gateway via `-g, --entry-gateway` or `--gateway-ip`. Either way, the probe consults directory data.

To investigate performance, it helps to first resolve your gateway's `node_id` from your identity key:

```bash
ID="DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo"

NODE_ID=$(
  curl -fsS 'https://validator.nymtech.net/api/v1/nym-nodes/described' | jq -r --arg id "$ID" '
    .data[]
    | select(.description.host_information.keys.ed25519 == $id)
    | .node_id
  '
)

echo "node_id=$NODE_ID"
```

Once you have a `node_id`, you can query performance and uptime related endpoints.
These are useful when you want to understand whether a failure is caused by your gateway being excluded by selection heuristics, rather than by a real connectivity issue:

```bash
curl -fsS "https://validator.nymtech.net/api/v1/nym-nodes/performance-history/$NODE_ID" | jq
curl -fsS "https://validator.nymtech.net/api/v1/nym-nodes/historical-performance/${NODE_ID}?date=2026-01-18" | jq
curl -fsS "https://validator.nymtech.net/api/v1/nym-nodes/performance/${NODE_ID}" | jq
curl -fsS "https://validator.nymtech.net/api/v1/nym-nodes/uptime-history/${NODE_ID}" | jq
curl -fsS "https://validator.nymtech.net/api/v1/status/gateways/unstable/${ID}/test-results" | jq | head -n 50
```

> Nym provides a public [Swagger UI](https://validator.nymtech.net/api/swagger/index.html) for the validator hosted API.
> In practice, treat the Swagger and OpenAPI definition published by that specific deployment as the source of truth for what the instance actually exposes.

##### Full operational probe (mixnet mode) using direct IP bootstrap

This is one of the most robust ways to validate "real user" behaviour end to end, including entry connectivity, mixnet routing, WireGuard registration, DNS resolution, ping checks, and test downloads.

```bash
./target/release/nym-gateway-probe run-local \
  --config-dir "$HOME/.local/share/nym-gateway-probe" \
  --mode mixnet \
  --min-gateway-mixnet-performance 0 \
  --gateway-ip "152.53.122.46:8080" \
  --mnemonic "<FUNDED_24_WORD_MNEMONIC>"
```

Why this is useful:

* `--min-gateway-mixnet-performance 0` reduces the chance that the gateway is excluded by selection filters when the probe builds its topology.
* `--config-dir` persists state, which helps the probe reuse cached ticketbooks across runs and keeps results more consistent.

##### Full operational probe (mixnet mode) by identity key

This is basically the same as above, but starting from the node's identity key.

```bash
./target/release/nym-gateway-probe run-local \
  --config-dir "$HOME/.local/share/nym-gateway-probe" \
  --mode mixnet \
  --min-gateway-mixnet-performance 0 \
  -g "DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo"
```

##### WireGuard only check (fast health check)

Use this when you primarily care about WireGuard registration and basic connectivity signals, and you want faster feedback than a full operational probe run.

```bash
./target/release/nym-gateway-probe run-local \
  --config-dir "$HOME/.local/share/nym-gateway-probe" \
  --mode mixnet \
  --only-wireguard \
  --min-gateway-mixnet-performance 0 \
  --gateway-ip "152.53.122.46:8080"
```

##### Troubleshooting

If you see errors like:

```txt
ERROR nym_client_core::client::base_client: Could not authenticate and start up the gateway connection - gateway returned an error response: the client is not registered
ERROR nym_gateway_probe: Failed to connect to mixnet: gateway client error (...): gateway returned an error response: the client is not registered
```

This typically means the probe has local state that no longer matches what the gateway expects.
The fastest recovery is to delete the local registration and reply store so the probe can re register cleanly.

```bash
cd "$HOME/.local/share/nym-gateway-probe"
rm -f persistent_reply_store.sqlite*
rm -f gateways_registrations.sqlite*
```

Then run your `nym-gateway-probe run-local` command again.

### Monitoring a Nym Node's Earnings with CMD Reward Tracker

The [Nym operators docs](https://nym.com/docs/operators/introduction) mention a [CMD Reward Tracker](https://nym.com/docs/operators/tools#cmd-reward-tracker).
It is a small Python tool inside the [main Nym Git repository](https://github.com/nymtech/nym), located at `nym/scripts/rewards-tracker`.

#### Add your Nyx accounts

Before you start, add the Nyx wallet addresses you used to bond your nodes to `nym/scripts/rewards-tracker/data/wallet-addresses.csv`.
The [official documentation](https://nym.com/docs/operators/tools#cmd-reward-tracker) explains this step clearly and is worth following closely.

> This file contains public wallet addresses, not private keys.

#### Install and run

The script has a few Python dependencies.
I suggest tracking them in `nym/scripts/rewards-tracker/requirements.in`:

```txt
PyYAML
requests
tabulate
colorama
```

> I use [`uv`](#uv-python-environment) to run the script.

Then install and run it like this:

```bash
cd nym/scripts/rewards-tracker

# start fresh if you want
rm -rf .venv

# create + activate venv
uv venv --python 3.12
source .venv/bin/activate

# install from requirements.in
uv pip install -r requirements.in

# sanity check
python -c "import yaml, requests, tabulate, colorama; print('deps ok')"

# run
python ./node_rewards_tracker.py
```

If you prefer a pinned, lockfile style workflow, you can compile and sync a fully resolved `requirements.txt`:

```bash
uv pip compile requirements.in -o requirements.txt
uv pip sync requirements.txt
```

> If you run the tracker from automation, use `uv run` or an activated venv consistently.

#### Why you are not seeing "reward transactions"

I expected the script to output a list of reward transactions with timestamps per epoch, but it works differently.

What the script does is not transaction tracking. It:

* maps your wallet addresses to nodes (via the SpectreDAO nodes API, plus validator "bonded" and "described" lists)
* reads a **current operator rewards balance** per node
* writes a point in time snapshot to `data/data.yaml`
* computes deltas such as "profit_difference", hourly rate, and 7 day or 30 day estimates **only by comparing snapshots across runs**

Its outputs are a terminal table, `data/node-balances.csv`, and the historical snapshot store `data/data.yaml`.

On the first run, `data.yaml` contains only one snapshot per node, so:

* "Difference of total balance from last time" is `0.00` because there is no earlier snapshot to compare
* 7 day and 30 day estimates need snapshots that are at least 7 or 30 days old, so you will see messages like "no data stored"

Once you run it again later, for example a couple of hours later, you should start seeing a non zero "Difference ... from last time" if the operator rewards balance increased between runs.
After enough history accumulates, the 7 day and 30 day columns will fill in.

To make the tracker useful, run it periodically. Hourly is a common choice.

> If you want hands off collection, run it from a scheduler such as cron or a systemd timer, and store the `data` directory on persistent disk.


### Nym Mixnet: NymVPN

This section updates the NymVPN portion in [Digital Civil Rights and Privacy: Networking, VPN, Tor, Onion over VPN, I2P (Invisible Internet Project), Nym Mixnet](../digital-civil-rights-networking-i/#nym-mixnet%3A-nymvpn).

Current NymVPN clients include a `socks5` command:

```txt
Usage: nym-vpnc socks5 [OPTIONS] <COMMAND>

Commands:
  enable   Enable SOCKS5 proxy
```

In NymVPN, the built in `socks5` feature is an application level proxy.
It exposes a local SOCKS endpoint on your machine, typically `127.0.0.1:<port>`.
Only applications you explicitly configure to use that proxy will have their traffic routed through Nym's mixnet.
Everything else continues to use your normal network path.

It is important to understand what this `socks5` feature is not.
It does **not** expose the Fast mode two hop WireGuard tunnel as a SOCKS5 proxy.
In other words, you cannot enable Fast mode and then "export" that VPN tunnel as a local SOCKS5 port using `nym-vpnc socks5`.

> NymVPN has two main paths:
>
> * Fast mode, which uses a WireGuard based two hop tunnel for low latency and general VPN usage.
> * Mixnet based routing, which prioritizes stronger metadata protection at the cost of more latency.
>
> The built in SOCKS5 proxy is meant to provide mixnet access to specific apps, not to convert the Fast mode tunnel into a SOCKS interface.

Conceptually, this is "per app routing", sometimes also described in Nym's docs as "App & wallet proxy" or "dApp mode".
The idea is that you keep your device on Fast mode for everyday activity, while routing specific apps through a SOCKS5 proxy when you want stronger metadata protection for that app's traffic.

Because the built in `socks5` command does not wrap the Fast mode two hop WireGuard path, I created a Docker Compose stack that *does*.
It runs NymVPN in Fast mode, and then exposes that VPN path via a local SOCKS5 proxy implemented with Shadowsocks.
The result is a SOCKS5 interface that is backed by NymVPN's Fast mode two hop path.

> Shadowsocks is often used as a lightweight proxy layer that can present a local SOCKS5 port to client applications.
> In this setup, the SOCKS5 port is the "adapter" that lets SOCKS capable apps reuse a VPN tunnel that would otherwise be available only at the network interface level.

You can find the source files in this GitHub Gist: [Docker Compose Shadowsocks SOCKS5 proxy with NymVPN](https://gist.github.com/cs224/738b1d2f59fba776c880888d21221dfa).

Edit `secrets.env` and replace the placeholder 24 word mnemonic with your own.

Build the image:

```bash
TAG_DATE=$(date +%Y%m%d) docker compose build
```

To force a clean rebuild:

```bash
TAG_DATE=$(date +%Y%m%d) docker compose build --no-cache
```

Run it:

```bash
docker compose up
```

Once the stack is running, you will have a Fast mode two hop WireGuard backed SOCKS5 proxy on port `1090`.
This is convenient for browsing, streaming, and downloads where you want the VPN path but also need a SOCKS interface for tooling or per app configuration.

I run this stack on my home server and expose it to local machines via SSH port forwarding.

I have the following in my `~/.ssh/config`:

```txt
Host homeserver-nym
  HostName 127.0.0.1
  ProxyJump me@homeserver
  User root
  StrictHostKeyChecking no
  UserKnownHostsFile /dev/null
  RemoteCommand bash -lc 'cd /opt/nymvpn && docker compose up; exec bash'
  RequestTTY yes
```

And in my `~/.bashrc`:

```bash
alias nymvpn="ssh -L 1090:localhost:1090 homeserver-nym"
```

A short explanation of what is happening here:

* `ssh -L 1090:localhost:1090 ...` forwards your local port `1090` to port `1090` on the remote server.
* With the forwarded port in place, you can configure a local app to use a SOCKS5 proxy at `127.0.0.1:1090`, while the actual proxy service runs on the server.
* The `HostName 127.0.0.1` plus `ProxyJump me@homeserver` pattern is a deliberate "jump to the server, then SSH to its localhost" setup. It is useful when the final SSH target (often `root`) is only reachable from the server itself.

### Avoro vs. netcup VPS: a debugging story

In my [post from last year](../digital-civil-rights-networking-nym-node-operator-guide), I already used a [VPS](https://avoro.eu/en/vps) from [Avoro](https://avoro.eu/en).
I was (and still am) quite happy with it.
For that reason, I also chose Avoro again for this updated guide.

After I installed the Nym node, the [harbourmaster](https://harbourmaster.nymtech.net/gateway/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo) status for my new node kept flipping between fully green, fully red, and everything in between.
What made this confusing was that the logs stayed clean the whole time.
By comparison, my node from last year never showed this behaviour, and it still does not show it today.

> You can see one run of [`nym-gateway-probe`](#nym-gateway-probe) for the Avoro instance (avoro2) in this gist: [avoro2](https://gist.github.com/cs224/5c80f995cc88b245ae89741a9ad9caa3). The relevant file is `nym-gateway-probe-45.157.233.31-avoro2-2.txt`.
>
> When you skim the output, focus on the fields `download_duration_sec`. In this run, it shows values in the multiple seconds range, for example 5 or 7 seconds.
>
> You will also notice several `fail` entries and at least one message like `"Failed to send ping: ping failed after 2 attempts"`.
> These errors look alarming at first sight, but the same messages also appeared in a probe run for the netcup2 instance, and that node showed up as green in harbourmaster (see below).
>
> You can ignore the message `LP handshake failed`.
> I did not set up the [Lewes Protocol](#lp-mode-(lewes-protocol)---fyi) handlers on my node, so any LP related handshake attempt is expected to fail in this configuration.

To isolate the problem, I ran initial speed tests from three machines:

* my old Avoro instance (avoro1: 94.143.231.195)
* my new Avoro instance (avoro2: 45.157.233.31)
* a [VPS 1000 G11](https://www.netcup.com/de/server/vps) from netcup (netcup2: 152.53.122.46) that I provisioned only to debug this issue

The results looked normal and did not reveal any obvious bottleneck:
```bash
# avoro1
~# librespeed-cli --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a0d:5940:81:11:: - Unknown ISP
Ping: 1.64 ms   Jitter: 0.84 ms
Download rate:  5658.62 Mbps
Upload rate:    223.16 Mbps

# avoro2
~# librespeed-cli --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a0d:5940:42:d7:: - Unknown ISP
Ping: 0.00 ms   Jitter: 0.18 ms
Download rate:  6196.34 Mbps
Upload rate:    123.68 Mbps

# netcup2
~# librespeed-cli --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a0a:4cc0:c0:42fb:6881:9fff:feae:2d6a - Unknown ISP
Ping: 3.00 ms   Jitter: 0.00 ms
Download rate:  2299.06 Mbps
Upload rate:    297.36 Mbps
```

As a next step, I migrated my Nym node from avoro2 to netcup2.
To avoid any accidental double running, I first stopped and disabled the systemd service `nym-node.service` on avoro2.
Only after that did I install and start the node on netcup2.

> You also need to update a few things:
>
> * the DNS entries for your `A` (IPv4) and `AAAA` (IPv6) records
> * the `"Host"` settings of your bonded node, so that the Nym meta-data services point to the new address
>
> The official documentation explains how to update the bonded node settings under [Change Settings via Desktop Wallet](https://nym.com/docs/operators/nodes/nym-node/bonding#change-settings-via-desktop-wallet).

To read the harbourmaster results correctly, you must give the network some time to catch up after a migration.
It can take a few hours and sometimes up to a day until the status stabilizes.

After that settling period, the node running on netcup2 stayed fully green.
For me, this was the confirmation I needed: the instability was specific to my avoro2 instance, not a general issue with my node configuration.

> You can see one run of [`nym-gateway-probe`](#nym-gateway-probe) for the netcup test machine (netcup2) in this gist: [netcup2](https://gist.github.com/cs224/553f83b277192eca7bd1ba11352e0cc4). The relevant file is `nym-gateway-probe-152.53.122.46-netcup2.txt`.
>
> Again, focus on `download_duration_sec`. In this run, it stays at 0 seconds.
>
> Interestingly, the logs still contain the same kind of `fail` messages and the `"Failed to send ping: ping failed after 2 attempts"` line that we saw for avoro2.
> This is why I treated those messages as a weak signal on their own.
>
> You can also ignore `LP handshake failed` in this run.
> As above, I did not set up the [Lewes Protocol](#lp-mode-(lewes-protocol)---fyi) handlers on my node, so LP handshake attempts are expected to fail.

> In the [avoro2](https://gist.github.com/cs224/5c80f995cc88b245ae89741a9ad9caa3) gist and the [netcup2](https://gist.github.com/cs224/553f83b277192eca7bd1ba11352e0cc4) gist,
> I also included a few screenshots from [Harbourmaster](https://harbourmaster.nymtech.net/gateway/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo) and from the [Spectre Explorer](https://explorer.nym.spectredao.net/nodes/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo).
> They show the same node from two different public dashboards while it was running on two different VPS instances.
> This makes it easier to compare what you may see during setup and operations.

#### `iperf3`

I did not want to just find a workaround.
I also wanted to understand what was causing the instability.
So I migrated the Nym node back from netcup2 to avoro2 and started debugging systematically.

A good first step for this kind of network investigation is to run [`iperf3`](https://github.com/esnet/iperf).
It does not tell you everything, but it is excellent for answering basic questions like: "Is TCP stable in both directions?" and "Is UDP being dropped, shaped, or rate limited?"

Because I already had two VPS instances, avoro2 and netcup2, I used those as my main test endpoints.
I also involved avoro1 as a reference system for A/B testing.

> For Nym nodes, UDP behaviour matters in practice even if you mostly think in terms of TCP, because its dVPN datapath (2-hop) is based on WireGuard, which is UDP based.

I set up the `iperf3` server on netcup2 first and ran the client on avoro2 and avoro1.
Later, I swapped roles as well, just to make sure the results were not tied to one specific direction.

Before running the tests, I temporarily disabled the firewall on the involved servers, to reduce the risk that local filtering would distort the results.
The `network-tunnel-manager.sh` (NTM) install process already pulls in the `netfilter-persistent` package, which makes it easy to flush and restore rules:

```bash
# sanity: confirm plugins exist (iptables-persistent plugin should be present)
ls -l /usr/share/netfilter-persistent/plugins.d

# Save the current state
netfilter-persistent save

# Clear the firewall rules
netfilter-persistent flush

# Check that the firewall is "empty"
iptables -S
ip6tables -S

# Perform tests
...

# Restore firewall state after your tests
netfilter-persistent start
```

On netcup2, start the server:
```bash
apt update && apt install -y iperf3
iperf3 -s
```

On avoro2, install the client:
```bash
apt update && apt install -y iperf3
```

Then run the following tests.

> By default, `iperf3` listens on TCP port 5201.
> For UDP tests, keep in mind that `iperf3` reports loss from the receiver's perspective, and that high send rates can trigger provider DDoS protection or traffic policers.

**Test 1: sustained TCP outbound (avoro2 to netcup2)**

```bash
# iperf3 -c <NETCUP_IP> -t 600 -i 1 | tee iperf3_tcp_out_10min.txt

iperf3 -c 152.53.122.46 -t 600 -i 1 | tee iperf3_tcp_out_10min.txt
```

**Test 2: sustained TCP inbound (netcup2 to avoro2)**  
This uses `-R`, so the test traffic flows in the reverse direction while the client command still runs on avoro2.

```bash
iperf3 -c 152.53.122.46 -R -t 600 -i 1 | tee iperf3_tcp_in_10min.txt
```

**Test 3: UDP throughput and loss (larger datagrams)**

```bash
iperf3 -c 152.53.122.46 -u -b 100M -l 1200 -t 120 -i 1 | tee iperf3_udp_100M_1200B.txt
# Reverse
iperf3 -c 152.53.122.46 -u -R -b 100M -l 1200 -t 120 -i 1 | tee iperf3_udp_R_100M_1200B.txt
# Lost/Total Datagrams: 1154859/1242442 (93%)  receiver
```

**Test 4: UDP packets per second stress (small datagrams)**

```bash
iperf3 -c 152.53.122.46 -u -b 100M -l 200 -t 60 -i 1 | tee iperf3_udp_100M_200B.txt
# Reverse
iperf3 -c 152.53.122.46 -u -R -b 100M -l 200  -t 120 -i 1 | tee iperf3_udp_R_100M_200B.txt
# Lost/Total Datagrams: 7372752/7458885 (99%)  receiver
```

**Test 5: burst or policer detection with a "step test"**  
Here I increase the UDP bitrate gradually to see at which point loss starts to explode.

```bash
for b in 10M 25M 50M 75M 100M 150M; do
  echo "=== $b ==="
  iperf3 -c 152.53.122.46 -u -b $b -l 200 -t 30 -i 1
done | tee iperf3_udp_step_200B.txt
```

These tests already hinted at the core problem: incoming UDP traffic (netcup2 to avoro2) suffered extreme packet loss.
TCP looked much less suspicious, but UDP in the reverse direction was clearly unhealthy, with losses in the 90% to 99% range in my runs.

> A result like "Lost/Total Datagrams: 99%" usually means you are not looking at random noise.
> Typical causes include provider level filtering, DDoS mitigation systems that treat high rate UDP as suspicious, bandwidth policing that drops bursts, or issues with the path MTU and fragmentation.
> That is why I focused my next debugging steps on "why UDP inbound to avoro2 is getting dropped".


#### `nping`, `mausezahn`, and `hping3`

For the next debugging steps, I tried three packet generation tools: `nping`, `mausezahn`, and `hping3`.

* `nping` is maintained as part of [Nmap](https://github.com/nmap/nmap).
* `mausezahn` development is now part of [netsniff-ng](https://github.com/netsniff-ng/netsniff-ng).
* The last upstream commit to [hping](https://github.com/antirez/hping) is from 2014, but distributions such as Debian maintain [their own packaging and patches](https://salsa.debian.org/debian/hping3).

> At a high level, all three tools can send UDP packets, but they are primarily designed for interactive diagnostics and packet crafting, not for precise high rate traffic generation.
> That difference became important for my use case, because I wanted to find the exact point where packet loss started, not just prove that packet loss exists.

While `nping` has a `--rate` parameter, it effectively only supports millisecond level timing granularity.
In practice, that means rate values above roughly 1000 packets per second become difficult: the tool tends to send packets in a short burst as fast as it can, rather than spreading them evenly across time.
These tests clearly showed packet drops, but they did not help me identify a stable "threshold rate" where loss started.

Next, I tried `mausezahn`. It does not have a `--rate` parameter, but it provides a delay option with `-d`. The man page describes it like this:

> ```txt
> -d <delay>
>        Apply delay between transmissions. The delay value can be
>        specified in usec (default, no additional unit needed), or in msec
>        (e.g. 100m or 100msec), or in seconds (e.g. 100s or 100sec). Note:
>        mops also supports nanosecond delay resolution if you need it (see
>        interactive mode).
> ```

In my runs, `mausezahn` still ended up sending packets in a burst and did not seem to honour the delay I configured.
So again, I could reproduce loss, but I could not perform a clean, repeatable "increase traffic slowly until it breaks" experiment.

Finally, I tested `hping3`.
Like `mausezahn`, it is based on timing rather than a direct rate setting.
It supports `--interval`, for example `--interval u250` for a 250 microsecond pause between packets.
In my environment, however, I could not push it beyond roughly 5 to 8 kpps (kilo packets per second).

> This is a common practical limitation with user space packet generators.
> Timing is affected by process scheduling, CPU load, and the precision of sleep or delay functions.
> Once you aim for high packet rates, the tooling overhead becomes part of the measurement, which makes it harder to tell whether "the network drops packets" or "the sender cannot generate packets steadily enough".

At this point, I needed something more deterministic for high rate testing.
That is why I switched to `pktgen`, which is a [Linux kernel feature](https://docs.kernel.org/networking/pktgen.html).
Because it runs inside the kernel, it can generate traffic at much higher and more stable packet rates, which made it a better tool for pinpointing when inbound UDP to avoro2 started to fail.

#### `pktgen`

First, you may need to enable `pktgen` on the sending machine:

```bash
sudo -i
modprobe pktgen
ls -1 /proc/net/pktgen
# You should see at least pgctrl and one or more kpktgend_*.
```

> If `modprobe pktgen` fails, your kernel might not include the module, or the module might not be installed.

For a remote IP, `pktgen` needs the MAC address of the *next hop* on your local network path.
In a typical VPS setup, that is the MAC address of your default gateway, not the MAC address of the remote host.

```bash
DST_IP="45.157.233.31"          # avoro2 public IPv4 
DEV="$(ip route get "$DST_IP" | awk '{for(i=1;i<=NF;i++) if($i=="dev"){print $(i+1); exit}}')"
GW="$(ip route get "$DST_IP" | awk '{for(i=1;i<=NF;i++) if($i=="via"){print $(i+1); exit}}')"

echo "DEV=$DEV GW=$GW"
DEV=eth0 GW=152.53.120.1

# Prime ARP/ND for the gateway, then read MAC
ping -c 1 -W 1 "$GW" >/dev/null
DST_MAC="$(ip neigh show "$GW" | awk '{print $5; exit}')"
echo "DST_MAC=$DST_MAC"
DST_MAC=00:00:5e:00:01:96
```

On netcup2, I used the following `pktgen_udp.sh` script to generate UDP packets at a defined packet rate for a defined duration:

```bash
cat >/root/pktgen_udp.sh <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

# Usage: pktgen_udp.sh <dst_ip> <dst_mac> <ratep_pps> <duration_s> [dst_port] [src_port] [dev] [thread]
DST_IP="${1:?dst_ip}"
DST_MAC="${2:?dst_mac}"
RATEP="${3:?ratep_pps}"          # packets per second (pps)
DUR="${4:?duration_seconds}"
DST_PORT="${5:-51822}"
SRC_PORT="${6:-40000}"
DEV="${7:-eth0}"
THREAD="${8:-0}"

# Packet sizing:
# Ethernet(14) + IPv4(20) + UDP(8) + payload(1200) = 1242 bytes
PKT_SIZE=1242

COUNT=$(( RATEP * DUR ))

modprobe pktgen >/dev/null 2>&1 || true

PGCTRL=/proc/net/pktgen/pgctrl
KTHREAD=/proc/net/pktgen/kpktgend_${THREAD}
PGDEV=/proc/net/pktgen/${DEV}@${THREAD}

# Reset all pktgen state
echo "reset" > "$PGCTRL"

# Attach device to thread with a unique name (device@something) 
echo "rem_device_all" > "$KTHREAD"
echo "add_device ${DEV}@${THREAD}" > "$KTHREAD"

# Configure device
{
  echo "count $COUNT"                    # number of packets to send 
  echo "clone_skb 0"                     # reuse skb (lower overhead) 
  echo "burst 1"                         # batch pushes to NIC (often improves rate) 
  echo "pkt_size $PKT_SIZE"              # total L2 frame size 
  echo "delay 0"                         # we’ll use ratep, not delay 
  echo "ratep $RATEP"                    # pps target 

  echo "dst_min $DST_IP"
  echo "dst_max $DST_IP"

  echo "dst_mac $DST_MAC"                # required in sample scripts 

  # UDP ports (min=max makes them effectively fixed) 
  echo "udp_dst_min $DST_PORT"
  echo "udp_dst_max $DST_PORT"
  echo "udp_src_min $SRC_PORT"
  echo "udp_src_max $SRC_PORT"

  # Flags: enable UDP port handling + compute UDP checksum
  echo "flag UDPSRC_RND"
  echo "flag UDPDST_RND"
  echo "flag UDPCSUM"
  echo "flag NO_TIMESTAMP"
} > "$PGDEV"

echo "Starting pktgen: dst=$DST_IP:$DST_PORT ratep=${RATEP}pps duration=${DUR}s count=$COUNT dev=${DEV}@${THREAD}"
echo "start" > "$PGCTRL"

# Print result
echo "----- pktgen device result -----"
cat "$PGDEV" | tail -n +1
EOF

chmod +x /root/pktgen_udp.sh
```

The test runs themselves worked like this.

**Step 1: start `tcpdump` on avoro2**: Use a dedicated UDP destination port for each run. That makes filtering and analysis easier.

```bash
UDPPORT=51822
RATE=4000

timeout 15 tcpdump -ni eth0 "udp and src host 152.53.122.46 and src port 40000 and dst port ${UDPPORT}" -tt > "/tmp/udp_${UDPPORT}_pktgen_${RATE}.tcpdump"
```

**Step 2: generate UDP packets from netcup2 with `pktgen_udp.sh`**: This example sends 4000 packets per second for 10 seconds.

```bash
/root/pktgen_udp.sh 45.157.233.31 "$DST_MAC" 4000 10 51822 40000 "$DEV" 0
```

**Step 3: analyse the `tcpdump` timestamps to compute delivered packets per second**

```bash
LC_ALL=C awk '/^[0-9]/ { if(!first) first=$1; last=$1; pkts++ } END { dur=last-first; printf("delivered_pkts=%d dur=%.6fs delivered_pps=%.1f\n", pkts, dur, pkts/dur) }' /tmp/udp_${UDPPORT}_pktgen_${RATE}.tcpdump
```

> Make sure the `pktgen` run in step 2, which lasts 10 seconds, happens inside the 15 second `tcpdump` window in step 1.

Before focusing on avoro2, I verified the setup with a test run from netcup2 to avoro1.
There, packet rates above 12 kpps worked as expected. After that, I ran the same tests from netcup2 to avoro2.

Results on avoro2 (`45.157.233.31`) looked like this:

* Offered 600 pps for about 10 seconds (count 6000)  
  Captured: **6000 packets**  
  Computed: `delivered_pps=600.2` (no loss)
* Offered 1000 pps for about 10 seconds (count 10000)  
  Captured: **7295 packets**  
  Computed: `delivered_pps=729.7` (loss starts somewhere between 600 and 1000 pps)
* Offered 4000 pps for about 10 seconds (count 40000)  
  Captured: **7820 packets**  
  Computed: `delivered_pps≈792.8`
* Offered 12000 pps for about 10 seconds (count 120000)  
  Captured: **7820 packets**  
  Computed: `delivered_pps≈812.7`
* Offered 4000 pps, but changed the destination port to 33434  
  Captured: **7820 packets**  
  Computed: `delivered_pps≈836.6`

**Key observation:** on avoro2, once the offered packet rate exceeded roughly 600 to 1000 pps, the delivered packet rate plateaued around **780 to 830 pps**.
This plateau was independent of the offered pps and independent of the destination UDP port.
At the same time, `tcpdump` reported **0 kernel drops**, which strongly suggests that packets were dropped *before* they reached the VM.

> The phrase "0 kernel drops" matters. If the receiving VM was overloaded, you would often see drops reported by the capture stack or by the NIC receive queue.
> Seeing no local drops while still observing a hard plateau in delivered pps is a classic hint for upstream policing: a rate limiter or DDoS mitigation system that caps inbound UDP packet rates for a specific IP.

#### Resolution

With the packet capture results in hand, I opened a support ticket and included the key evidence: the `pktgen` step tests, the `tcpdump` captures, and the clear plateau at roughly 780 to 830 delivered UDP packets per second on avoro2.

I received a near immediate reply:

> "I disabled the DDoS protection for 45.157.233.31. Can you check if it is better now?"

After that change, my retests looked completely different.
Packet rates above 12 kpps also worked on avoro2, just like they did on avoro1.
That was a strong confirmation that the earlier behaviour came from upstream filtering or rate limiting.
Based on these retests, I consider this issue resolved.

Since then, I have let the system run and given harbourmaster enough time to stabilize again.
At the time of writing, the node looks better in [Harbourmaster](https://harbourmaster.nymtech.net/gateway/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo) and in [Spectre Explorer](https://explorer.nym.spectredao.net/nodes/DBBCDYsgAAj7g4FLQkSxXZAcdG5m9Hx8vMreqRaX1Yqo),
but I would still describe the overall state as "**orange**".

I added the screenshots `after-ddos-protection-fix-nym-node-spectre-explorer-avoro2-orange.png` and `after-ddos-protection-fix-nym-node-harbourmaster-avoro2-orange.png` to the [avoro2](https://gist.github.com/cs224/5c80f995cc88b245ae89741a9ad9caa3) gist for reference.

<a href="https://gist.githubusercontent.com/cs224/5c80f995cc88b245ae89741a9ad9caa3/raw/f21b205742d0522d900784990fc9ea4b99441a73/after-ddos-protection-fix-nym-node-harbourmaster-avoro2-orange.png" target="_blank"><img src="https://gist.githubusercontent.com/cs224/5c80f995cc88b245ae89741a9ad9caa3/raw/f21b205742d0522d900784990fc9ea4b99441a73/after-ddos-protection-fix-nym-node-harbourmaster-avoro2-orange.png" alt="Nym Harbour Master for avoro2" style="max-height: 200px"></a>
<a href="https://gist.githubusercontent.com/cs224/5c80f995cc88b245ae89741a9ad9caa3/raw/f21b205742d0522d900784990fc9ea4b99441a73/after-ddos-protection-fix-nym-node-spectre-explorer-avoro2-orange.png" target="_blank"><img src="https://gist.githubusercontent.com/cs224/5c80f995cc88b245ae89741a9ad9caa3/raw/f21b205742d0522d900784990fc9ea4b99441a73/after-ddos-protection-fix-nym-node-spectre-explorer-avoro2-orange.png" alt="Nym Spectre Explorer for avoro2" style="max-height: 200px"></a>

## Footnotes

[^duckdns]: Originally, I used [Duck DNS](https://www.duckdns.org), but it encountered several downtimes and service degradations for my use case. DuckDNS is a free dynamic DNS service that maps a subdomain under `duckdns.org` to your public IP.Then I moved to [No IP](https://www.noip.com/), but I found the manual renewal process annoying for long term operations. No IP's free hostnames require confirmation roughly every 30 days to remain active. Finally, I ended up with [FreeDNS](https://freedns.afraid.org/), mainly because it gives me more flexibility around DNS management and does not require the same recurring confirmation workflow for the setup I wanted.