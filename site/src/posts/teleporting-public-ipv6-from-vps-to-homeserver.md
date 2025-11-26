---
layout: "layouts/post-with-toc.njk"
title: "Teleporting a Public IPv6 Address from Your VPS to Your Home Server"
description: "Running a Delta Chat Chatmail Relay in an Incus Instance with a Routed IPv6 /128 over WireGuard."
keywords: ipv6, wireguard, vps, home server, incus, lxd, delta chat, chatmail, chatmail relay, self-hosting, self-hosted email, email privacy, site-to-site vpn, linux, debian, ubuntu, netcup, ipv6 routing, ndp proxy, ndppd, containers, system containers, homelab
creationdate: 2025-11-25
date: 2025-11-25
tags: ['post']
---

## Rationale

[Delta Chat](https://delta.chat/en) is a decentralized and secure messenger that uses normal email mailboxes as its transport.
You can use a normal email address with Delta Chat, but for the best experience that address should only ever be used by Delta Chat clients.

There is a special minimal mail server for this use case called a [chatmail relay](https://chatmail.at/relays).
It implements exactly the subset of mail features that Delta Chat needs, and nothing more.
If you are new to Delta Chat, I recommend the talk [Usable end-to-end security with Delta Chat and Chatmail](https://passthesalt.ubicast.tv/videos/usable-end-to-end-security-with-delta-chat-and-chatmail/) first, because it gives a good overview of the system and its threat model.

In my [Private Email with Mailu Behind Traefik Reverse Proxy](../digital-civil-rights-mailu) blog post I already built a Mailu-based mail system on a home server behind a VPS.
My initial idea was to simply create a new mailbox on that system and use it with Delta Chat.
After thinking it through I decided to use a separate chatmail relay instead.
The chatmail relay itself does not store any unencrypted content, so I could just rent another VPS and install chatmail there, but I wanted to reuse the infrastructure I already have at home.

The problem appears when you look at ports.
The Mailu stack already uses all the classic mail ports.
The chatmail relay wants to listen on the same ports as any normal mail server, for example port `25` for SMTP.
Only one process on a given IP address can listen on `IP:25` at a time.
You cannot simply say "Mailu handles `example.com` and chatmail handles `chat.example.com`" on the same address.
SMTP has no Server Name Indication at connect time.

[Server Name Indication](https://en.wikipedia.org/wiki/Server_Name_Indication) (SNI) is a TLS extension where a client tells the server which hostname it wants before the certificate is chosen.
This can be used for "multiplexing" a single port to different backend services, like we usually do with the Traefik reverse proxy for HTTPS services.
HTTPS can use this, SMTP on port `25` cannot, and [my HAProxy on the VPS](../digital-civil-rights-mailu/#traefik-reverse-proxy) is only doing plain TCP forwarding.

In theory I could put a full Postfix on the VPS, let it listen on port `25`, and forward some domains to Mailu and some domains to chatmail on different internal addresses.
In that setup the VPS Postfix would be the only public facing MTA and Mailu plus chatmail would be internal hops.
That would mean hand-editing Postfix configurations, deviating from the assumptions of the chatmail deployment tool [cmdeploy](https://chatmail.at/doc/relay/overview.html#cmdeploy), and making upgrades more fragile.
On top of that, unencrypted mails for the Mailu system would be visible on the VPS itself, which I want to avoid for privacy reasons.

So I picked a different route.
My VPS provider ([netcup](https://www.netcup.de)) gives me a full IPv6 `/64` prefix.
I keep Mailu on the existing IPv4 plus IPv6 address, and I "**teleport**" one additional IPv6 from that `/64` down to my home server over a WireGuard tunnel.
On the home server that address is then assigned to an [Incus](https://linuxcontainers.org/incus) instance which runs chatmail.
From the perspective of the instance it looks like a normal VPS with its own public IPv6.
The rest of this blog post explains how I put this together.

> So in more formal terms, what you are doing is something like:  
> Routing a public IPv6 `/128` from a VPS over a WireGuard site-to-site tunnel and assigning it to an Incus instance at home, with NDP proxy on the VPS.  
> "Teleporting" is a much nicer word for a blog post though, so I kept it in the title and intro.

I assume you already have the [VPS](https://www.netcup.de/vserver/vps.php) from [previous articles](../fuel-save-alerter-germany/#deployment-environment(s)), plus a home server [where you run Incus](../home-server-infrastructure/#incus%2Flxd-as-an-alternative-to-vagrant-for-devops-testing).
Everything else is built step by step.

> Once this recipe is working you can reuse it for becoming your own VPS hoster: a `/64` net of public IPv6 addresses is basically limitless, and your existing cheap VPS has unlimited traffic but only limited resources.
> You can use the much more plentiful resources of your home server for Incus instance, with a public IPv6 address each. **Nice!!**

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Step 1: Check if Your Home Network Has IPv6

Before touching any servers, it is worth checking whether your home network and desktop can reach the IPv6 Internet at all.  
Some Internet providers still do not offer IPv6, or only offer it in very limited ways.

Open a browser on your desktop and visit: <https://test-ipv6.com/>.

The page will run some checks and tell you if your connection has working IPv6.  
> This site tests things like: whether your browser can reach IPv6-only sites, whether DNS prefers IPv6 or IPv4, and how your setup behaves in mixed networks.

If the score is low or the site says that IPv6 is not available, you can still follow the ideas in this post, but you will need a more advanced setup such as an external tunnel broker.
I will mention that briefly [at the end](#hurricane-electric-and-the-classic-ipv6-tunnel-broker).  
> A tunnel broker gives you an IPv6 connection over your existing IPv4 Internet link, usually by setting up a tunnel from your router or a small Linux box at home to their infrastructure.

If the tests are green, you can also verify things from the command line.  
On a Linux or macOS desktop, try:
```bash
curl -6 https://ifconfig.co
```

If you get back an IPv6 address, then your desktop can reach an IPv6-only site.
Short `ping` tests are also useful:
```bash
ping -6 -c3 google.com
```

If all of this works, your home side is basically ready.
In the next step we look at the VPS.

## Background: ifupdown, Netplan, NetworkManager, systemd-networkd

My VPS is running Ubuntu 24.04.3 LTS and my home server is running Debian 13.2 Trixie.  
The Incus instance we'll later create will also be running Debian 13.2 Trixie.

On Linux there are several ways to configure networking.  
In this setup we will mainly see **Netplan**, **NetworkManager**, **ifupdown**, and **systemd-networkd**.  

> All of them end up doing the same basic thing: they bring up network interfaces and configure addresses, routes, and DNS.  
> The main differences are the configuration format (YAML, INI-style, etc.) and who they were designed for (desktop vs. server, static vs. dynamic).

### Netplan on Ubuntu

Ubuntu 24.04.3 LTS is using Netplan. Netplan was introduced around Ubuntu 17.10 as a *unified YAML frontend* for network configuration.  
The goal is to have one consistent way to describe networking, regardless of whether the backend is NetworkManager or systemd-networkd.

The main config files are `/etc/netplan/*.yaml`.  
The workflow is:

1. Edit the YAML file(s).
2. Run `sudo netplan apply`.
3. Netplan then generates configuration for NetworkManager or systemd-networkd and applies it.

So Netplan is a *configuration translator*.

### NetworkManager

Networking on Ubuntu desktops is typically fully managed by NetworkManager. In those cases the Netplan file is basically empty and only points at NetworkManager for the real configuration.

NetworkManager was originally created for desktops to handle *dynamic* networking like Wi-Fi, roaming, 4G, VPNs, captive portals, and GUI-based configuration.  
It is configured mostly via GUIs, but you can also use `nmcli` on the command line. The files live in `/etc/NetworkManager/system-connections/`.

> On servers you sometimes still see NetworkManager when people want easy VPN handling or use the same distribution image for both desktop and server.

### systemd-networkd on the VPS

My Ubuntu server VPS is using systemd-networkd. In that case the configuration in `/etc/netplan/50-cloud-init.yaml` is actually the *master* configuration, which is then translated into systemd-networkd config.
So on my VPS I should make changes to the network setup in that Netplan file, not directly in `/etc/systemd/network/`.

### ifupdown + NetworkManager on Debian

I installed my home server with a minimal Debian 13.2 Trixie server install. Debian still prefers the *old school* `/etc/network/interfaces` (ifupdown) method.  
The config file is `/etc/network/interfaces` (and sometimes `/etc/network/interfaces.d/*`).

But my home server mixes the ifupdown method with NetworkManager. If I do an `nmcli device status` I see several devices as `unmanaged`, especially the ones that were configured via `/etc/network/interfaces`.
So the two systems coexist on my minimal Debian 13.2 Trixie server install on my home server.

### systemd-networkd in the Incus instance

In the Incus Debian 13.2 Trixie [cloud-init](https://cloud-init.io/) images there is a raw systemd-networkd configuration by default.

systemd-networkd is part of *systemd*, designed for headless, server-style networking. It reads configs from `/etc/systemd/network/*.network`, `*.netdev`, and `*.link`.
It is very good at static configurations, DHCP, VLANs, bridges, bonds, IPv6, routing, and similar tasks.
There is no GUI; it is managed via simple text files and `networkctl` commands.
This makes systemd-networkd a good fit for Incus instances and other "cattle, not pets" style infrastructure where you want predictable, declarative networking.

## Step 2: Add an extra IPv6 address and test IPv6 on your VPS

I am using a netcup VPS. Their IPv6 setup has a particular twist.  
Every VPS receives a full `/64` prefix, but this subnet is **not routed** to the machine in the traditional way.  
Instead, it is placed on a large switched layer two segment (aka `L2`; ethernet or virtual ethernet such as `vxlan`) inside the data center.

The default router has a link local IPv6 address like `fe80::3`.  
That router uses Neighbor Discovery (NDP) to learn which MAC address currently "owns" which IPv6 address on that layer two segment.

> Neighbor Discovery Protocol in IPv6 is the replacement for Address Resolution Protocol (ARP) in IPv4.  
> It is how a machine finds the link layer address of a neighbor, discovers routers on the link, and confirms that a neighbor is still reachable.  
> See [IPv6 Router Advertisements (RA), DHCPv6, and (Proxy) Neighbor Discovery](#detour%3A-ipv6-router-advertisements-(ra)%2C-dhcpv6%2C-and-(proxy)-neighbor-discovery) below for more details.

The important consequence of this netcup design is the following.  
The preconfigured IPv6 address that netcup provides on the VPS, created by [SLAAC + EUI-64](#slaac-%2B-eui-64), works out of the box.  
You can see this configuration with a command such as `networkctl status`.

The rest of the `/64` technically belongs to you. However, **nothing in the data center will answer NDP queries for those other addresses**.  
They will **never be reachable from outside until you add some form of NDP proxy**.

> In this setup netcup hands you a whole `/64`, but it behaves as if all those addresses are directly on the same ethernet segment as many other customers.
> The data center router will only send traffic to MAC addresses that it has learned via NDP, so it needs to see NDP replies for every address that should be reachable.  
> This is what we will use an NDP proxy for.

Other providers might simply route the `/64` to your VPS and not require an NDP proxy as an extra step.

On my VPS I already had one IPv6 address that netcup assigned by default:  
`2001:db8:dead:beef:e48d:bcff:fe8b:5a3b/64` (see [SLAAC + EUI-64](#slaac-%2B-eui-64) below).  
In order to test IPv6 on the VPS I then added one more address from the same `/64`: `2001:db8:dead:beef::1/128`.  
The full netplan file `/etc/netplan/50-cloud-init.yaml` on the VPS looks like this:

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    eth0:
      match:
        macaddress: e6:8d:bc:8b:5a:3b
      addresses:
        - 198.51.100.42/24
        - 2001:db8:dead:beef:e48d:bcff:fe8b:5a3b/64
        - 2001:db8:dead:beef::1/128
      routes:
        - to: default           # IPv4 default route
          via: 198.51.100.1
        - to: default           # IPv6 default route
          via: fe80::3
          on-link: true         # needed for link-local gateways
      # optional:
      # nameservers:
      #   addresses:
      #     - 2001:4860:4860::8888
      accept-ra: no             # since you now have static routes
```

The parameter `accept-ra` controls whether this interface listens to IPv6 Router Advertisements.
Because I set static routes with the `routes` section above, I disable router advertisements here.

> On Linux, turning on `net.ipv6.conf.all.forwarding=1` also disables IPv6 Router Advertisements by default, which can cause the VPS to lose its default route after the RA lifetime expires.
> Many netcup users have run into IPv6 weirdness related to this exact forwarding and Router Advertisement interaction.
> To avoid mystery "IPv6 died after a while" issues on the VPS, we add a static default route via the link local gateway and leave `accept_ra=0`.

Explicitly setting `accept-ra: no` in netplan makes the intended behavior clear and avoids surprising route changes later when we turn forwarding on for the WireGuard tunnel.

After changing the file, I applied the configuration:

```bash
netplan apply
```

Netplan warned me that the configuration files were too open. The fix is to restrict permissions:

```bash
chmod 600 /etc/netplan/*.yaml
chown root:root /etc/netplan/*.yaml
netplan apply
```

On VPSes from other providers that simply route the `/64`, you may already have a working extra IPv6 address at this stage.
You can check connectivity from your desktop to the new IPv6:

```bash
ping -6 -c3 2001:db8:dead:beef::1
```

If that works, the VPS can be reached on both its original IPv6 and the new one.

### Make the whole `/64` reachable with an NDP proxy

As explained above, the IPv6 setup on my netcup VPS has a special twist.
Netcup provides my VPS with a `/64` IPv6 subnet that technically belongs to the VPS.
However, **nothing in the data center will answer NDP queries for those addresses**.
They will **never be reachable from outside until you add some form of NDP proxy**.

In addition, later we want to use more IPv6 addresses from that subnet.
In order to use the full IPv6 `/64` at netcup, you must answer NDP requests for all addresses that you plan to use.
One option is to let the Linux kernel itself act as an NDP proxy.
Another option is to run a small daemon called `ndppd` which listens for NDP Neighbor Solicitations and replies on behalf of your addresses.

> The kernel based NDP proxy works with `proxy_ndp` sysctls and `ip -6 neigh` configuration.
> It is very low level and powerful, but it becomes a bit tedious when you want to handle many addresses or even whole prefixes.
> `ndppd` moves this logic into a small daemon: instead of adding entries one by one, you can declare in a configuration file which prefixes you want to answer for.
> For a homelab setup with a whole `/64`, `ndppd` is usually more convenient and easier to maintain.

On the VPS I installed `ndppd`:
```bash
apt install ndppd
```

The configuration file `/etc/ndppd.conf` is very short in my case:
```text
proxy eth0 {
    rule 2001:db8:dead:beef::/64 {
        static
    }
}
```

This tells `ndppd` to answer NDP queries that arrive on `eth0` for any address in `2001:db8:dead:beef::/64`.
It does not care whether the address is assigned directly on the VPS itself or is routed somewhere else behind the VPS.
From the perspective of the upstream router, all of those addresses now belong to the MAC address of the VPS network interface.

After editing the configuration I enabled and started the service:
```bash
systemctl enable ndppd
systemctl restart ndppd
systemctl status ndppd
```

You should now check connectivity from your desktop to the new IPv6:
```bash
ping -6 -c3 2001:db8:dead:beef::1
```

This concludes our test of IPv6 on the VPS.

At this point I can add more IPv6 addresses from the `/64` either on the VPS itself or behind it.
As long as the VPS has a route for those addresses, the outside world will be able to reach them.

The address that I want to "teleport" to my home server for use as the public IPv6 address of the chatmail relay is `2001:db8:dead:beef::1234/128`.

On the VPS I do not assign this address directly.
I only tell the kernel that packets for this address should be forwarded into the WireGuard tunnel.
The next section sets up that tunnel.

### Detour: IPv6 Router Advertisements (RA), DHCPv6, and (Proxy) Neighbor Discovery

I have only provided this section to give you a bit more background about IPv6 and to highlight some of the differences to IPv4.  
**You can safely skip this section if you are only interested in making the set‑up work**.

With IPv4 you are probably used to a single DHCP server that hands out everything: IP address, netmask, default gateway, and DNS servers.
The router is mostly just the gateway; it does not announce itself on the LAN in a separate protocol.

With IPv6 the roles are split. **Router Advertisements** (RA) are messages that essentially say: "I am your router, here is the prefix you should use."
RAs are ICMPv6 messages (type 134) defined in the **Neighbor Discovery** specification (RFC 4861).
They are sent by routers to the "all nodes" multicast address, either periodically or in response to a host sending a Router Solicitation.

Each RA can contain one or more prefixes, for example `2a04:ee41:1:f34b::/64`.
It also contains the default gateway, which is the router's link local address together with a lifetime.
In addition, the RA can carry flags that tell the host whether DHCPv6 should be used.
The M (Managed) flag means "get addresses from DHCPv6". The O (OtherConfig) flag means "use DHCPv6, but only for other configuration such as DNS or NTP".
Some routers even include DNS information directly in the RA using the RDNSS option.

An important consequence is that the IPv6 default gateway is never learned via DHCPv6, only via RA.
If there are no RAs on a link, hosts do not know any router and you will not have IPv6 connectivity beyond the local link.

Once a host receives an RA, it can operate in a few different modes.

In the **SLAAC only mode (Stateless Address Autoconfiguration)**, the RA says for example "the prefix is `2a04:…/64`, flags M=0, O=0".  
The host then builds its own address in that prefix (using [EUI‑64](#slaac-%2B-eui-64) or a random interface identifier).
The default gateway still comes from the RA. No DHCPv6 is used at all.

In **SLAAC plus stateless DHCPv6 mode**, the RA has M=0 and O=1.  
The host still creates its IPv6 address via SLAAC, but it also contacts a DHCPv6 server for extra information such as DNS servers or NTP servers.
The default gateway again comes from the RA.

In **stateful DHCPv6 mode**, the RA sets M=1 (and O can be either 0 or 1).  
The host asks a DHCPv6 server for an IPv6 address, similar to how IPv4 DHCP works.
The RA is still required for the default gateway and often to announce additional prefixes.

So in IPv6 there is always some form of RA, and DHCPv6 is optional.
They are separate components.
RA tells hosts about prefixes and default gateways; DHCPv6 can provide addresses and "other configuration".
You can think of it like this:

> RA and SLAAC only tell your VPS what to do on its own interfaces.  
> Neighbor Discovery (NDP) tells the router where to send packets on the local link.

It is also useful to compare ARP and NDP once, side by side.

ARP, the **Address Resolution Protocol**, is used in IPv4 networks.
It maps IPv4 addresses to MAC addresses on a local Ethernet segment.
ARP is its own layer two protocol with Ethernet type `0x0806`; it is not carried inside IP.
"Proxy ARP" means that a router or host answers ARP requests for some other IP address, pretending "this IP is reachable via my MAC".

NDP, the **Neighbor Discovery Protocol**, is used in IPv6 networks.
It does the same jobs ARP did, and a bit more: address resolution, reachability detection, router discovery, and so on.
It is implemented as ICMPv6 messages inside IPv6 packets (types 135 and 136 for Neighbor Solicitation and Neighbor Advertisement).

Conceptually, both ARP and NDP live "between" the IP and Ethernet layers, doing IP to link layer resolution.
ARP is a pure layer two protocol; NDP is transported inside IPv6 at layer three using ICMPv6.
People often call both of them "**layer 2.5**" protocols for that reason.

In the protocol stack you can picture it like this: **Ethernet at layer two** with frames and MAC addresses.  
**IPv6 at layer three** with packets that have source and destination IPv6 addresses.  
**ICMPv6 and NDP** use **special IPv6 packets** on the local link only to manage neighbors.

NDP uses **Neighbor Solicitation** messages which say "who has IPv6 address X?" and **Neighbor Advertisement** messages which say "X is at MAC Y".
These messages are link‑local only and are not routed.
They are used to fill the neighbor cache, which is the IPv6 equivalent of an ARP cache.

"**Proxy NDP**" means that a router or host answers a Neighbor Solicitation for an address that is not actually assigned on that link.
It sends a Neighbor Advertisement that says "that IPv6 address is reachable via my MAC".
Other nodes on the link will then send packets for that address to this router, which can forward them somewhere else, for example over a WireGuard tunnel to your home server.

In other words, proxy NDP is to IPv6 what proxy ARP is to IPv4.
ARP works directly at the Ethernet level, while proxy NDP uses ICMPv6 inside IPv6 to get the same "this IP is reachable via me" behavior on an IPv6 link.

#### Cleanly Routed vs. Large Switched Layer Two Segment

It is also helpful to contrast a cleanly routed `/64` with the kind of large shared IPv6 LAN that netcup uses.

In a **routed** design the provider router has a normal route for your prefix, for example `2001:db8:dead:beef::/64` via your VPS.
The important detail is that in such a routed design the provider router only resolves the **next hop**, never the final destination address in your `/64`.
It treats your VPS exactly like any other router: "I know that this prefix lives behind that neighbor, I only need that neighbor's MAC."
The router does NDP once to learn the MAC of your VPS as the next hop, and then sends all packets for any address in that `/64` to that single MAC address.
Your VPS is then responsible for routing and NDP on its own internal links.

On a **pure "RFC textbook" IPv6 LAN at layer two**, where the `/64` really is on‑link, the extra `::1` that we configured earlier would also normally be reachable as soon as the host has it configured.
SLAAC address and extra static `::1`, both on `eth0`, are just two IPv6 addresses on the same interface.
The Linux kernel knows about both, runs **Duplicate Address Detection (DAD)** for both, and will answer NDP for both.
When Linux assigns an address to `eth0` it first sends a Neighbor Solicitation for its own new address to check that nobody else is using it.
Routers and switches on the segment can already see that "this MAC is using this IPv6", but the really important step is **what happens when incoming traffic appears**:
the upstream router sends a Neighbor Solicitation for `::1`, the kernel replies with a Neighbor Advertisement, and the router learns "send packets for `::1` to this MAC".
No NDP proxy should be needed here.

**On a netcup VPS, the switched IPv6 LAN behaves differently from this textbook picture**.
For the single primary IPv6 address, netcup's infrastructure already knows that it belongs to the VPS, so the router can deliver packets to it out of the box.
For additional addresses in the same `/64`, such as `2001:db8:dead:beef::1`, the usual NDP dance that should work for any address assigned to the local interface does not seem to complete.
From the outside they simply look unreachable, even though they are configured on `eth0`.
The exact internal reason inside the netcup data center is not visible from the VPS, but several netcup forum entries describe the same behaviour and one of the recommended solutions is to run an NDP proxy such as `ndppd`.

With `ndppd` the VPS explicitly "speaks NDP" for every address that you plan to use.
It listens for Neighbor Solicitations for any address in your `/64` and always replies "this IPv6 is reachable via my MAC".
From the perspective of the netcup router, your VPS now clearly owns the entire `/64`, and incoming traffic for both the original SLAAC address and any extra addresses like `::1` finally arrives at the VPS.  

#### SLAAC + EUI-64

A given IPv6 address like `2001:db8:dead:beef:e48d:bcff:fe8b:5a3b/64` really encodes two things at once:

* One specific IPv6 address: `2001:db8:dead:beef:e48d:bcff:fe8b:5a3b`
* A prefix length of `/64`, which means it lives in the subnet `2001:db8:dead:beef::/64`

So conceptually it is "this concrete address, which is in the network `2001:db8:dead:beef::/64`".  
This is the same idea as IPv4 `198.51.100.42/24`: one address plus the netmask that says which network it belongs to.

An IPv6 address is 128 bits long. The notation `…/64` means that:
* The first 64 bits are the network prefix, your subnet:
  `2001:db8:dead:beef::/64`
* The last 64 bits are the interface identifier, the host part:
  `e48d:bcff:fe8b:5a3b`

So the operating system stores something like:

* My full address is `2001:db8:dead:beef:e48d:bcff:fe8b:5a3b`.
* Anything with the same first 64 bits (`2001:db8:dead:beef::/64`) is on link on this interface.

It is just tagging that address with the knowledge of which subnet it belongs to and which range of addresses is considered directly reachable on that link.

You may ask where the host part `e48d:bcff:fe8b:5a3b` of that address is coming from.

It is derived from the network card MAC address via a method called **SLAAC with EUI-64**, and it is a very common way to create global unicast IPv6 addresses.

In short, SLAAC with EUI-64 works like this:

1. The router sends a prefix, for example `2001:db8:dead:beef::/64`, in a Router Advertisement.
2. The host generates a 64 bit interface identifier from its MAC address using the EUI-64 rules.
3. The host combines the prefix and the interface identifier to form the full IPv6 address.

The EUI-64 conversion from a 48 bit MAC address looks roughly like this.

Given a MAC: `XX:XX:XX:YY:YY:YY`:

1. Split it into two halves: `XX:XX:XX` and `YY:YY:YY`.
2. Insert `ff:fe` in the middle, which gives
   `XX:XX:XX:ff:fe:YY:YY:YY`.
3. Flip the universal or local bit in the first byte (a single bit in `XX`).
   That is why the first hex pair in the IPv6 interface identifier may differ slightly from what you expect from the MAC.
4. Group the bytes into IPv6 16 bit chunks, for example: `XXXX:XXff:feYY:YYYY`.

So in our case:

* The tail `…8b:5a:3b` corresponds to the last three bytes of the MAC address.
* The `ff:fe` in the middle is the standard insertion for EUI-64.
* The leading part `e48d:bc…` is mostly the first three bytes of the MAC, with that one bit flipped.

> Many systems today no longer use raw EUI-64 addresses for privacy reasons.
> They often generate a stable but random interface identifier instead of exposing the MAC address pattern.
> The overall idea is the same though: the router announces "here is the `/64`", and the host is responsible for creating a 64 bit interface identifier and combining the two parts into a full 128 bit address.

Many VPS providers actually give you such an address explicitly in their control panel or in cloud init.
Even if they configure it statically for you, it still follows the same pattern that you would get automatically from SLAAC with an EUI-64 based interface identifier.

Putting it together:

* `2001:db8:dead:beef::/64`
  is the IPv6 subnet you receive from the provider.
* `2001:db8:dead:beef:e48d:bcff:fe8b:5a3b/64`
  is one single address in that subnet, with `/64` telling the operating system what the network prefix is.
* The long host part `e48d:bcff:fe8b:5a3b`
  is derived from the network card MAC address using the EUI-64 rules: MAC bits plus `ff:fe` in the middle and one flipped bit.

And `2001:db8:dead:beef::1/128` is simply another address in the same `/64` where I have chosen a very simple interface identifier `::1`.
The `/128` prefix indicates "this exact address only" and is a common way to express a single host address inside a larger subnet.

> The important detail is that both addresses live in the same `/64` from the provider.
> From the point of view of the IPv6 routing world they are just two different host addresses in the same prefix, no matter whether the host part has been generated from the MAC by EUI-64 or chosen manually as `::1`.

#### Shortened IPv6 Address Notation

You may also have noticed that IPv6 addresses are often written in a shortened form.  
Inside each 16 bit block you can drop leading zeros, so `2001:0db8:0000:0000:0000:0000:0000:0001` becomes `2001:db8:0:0:0:0:0:1`.  
In addition, one single run of consecutive `:0:` blocks can be collapsed to `::`, which gives the final `2001:db8::1`.  
The same rules apply to prefixes such as `2001:db8:dead:beef::/64`.  
If you want to see these addresses fully written out or experiment with different notations, an online helper like [IPv6 Subnet Calculator](https://www.vultr.com/resources/subnet-calculator-ipv6/) can show you the expanded form.

## Step 3: WireGuard tunnel between VPS and home

The basic idea is simple.
There is a WireGuard interface `wg0` on the VPS and a matching `wg0` on the home server.
They talk to each other over UDP. Inside this tunnel I use a small IPv4 subnet for management, and optionally a small IPv6 ULA subnet for tests.

A Unique Local Address (ULA) is an IPv6 address that is valid only inside private networks.
It always starts with `fd` and is not routed on the public Internet.
That makes ULAs convenient to address internal links like a WireGuard tunnel.

> You can think of ULAs for IPv6 as similar to the well known private IPv4 networks `10.0.0.0/8`, `192.168.0.0/16` and `172.16.0.0/12`.
> They are meant for internal use, and if they accidentally leak to the Internet, proper routers will drop them.
> This is why they are a good choice for tunnel endpoints or lab-only addressing.

### On the VPS

On the VPS my `/etc/wireguard/wg0.conf` looks like this:

```ini
[Interface]
Address = 10.10.1.1/32, fd00:1::1/64
PrivateKey = <VPS_PRIVATE_KEY>
ListenPort = 51820


# Enable forwarding
PreUp   = sysctl -w net.ipv4.ip_forward=1
PostUp  = sysctl -w net.ipv6.conf.all.forwarding=1

# Allow routing between clients
PostUp  = iptables -C FORWARD -i %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -i %i -j ACCEPT
PostUp  = iptables -C FORWARD -o %i -j ACCEPT 2>/dev/null || iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT 2>/dev/null || true
PostDown = iptables -D FORWARD -o %i -j ACCEPT 2>/dev/null || true

# Route teleported /128 to home
PostUp   = ip -6 route add 2001:db8:dead:beef::1234/128 dev %i 2>/dev/null || true
PostDown = ip -6 route del 2001:db8:dead:beef::1234/128 dev %i 2>/dev/null || true

# IPv6 FORWARD rules between wg0 and eth0
PostUp   = ip6tables -C FORWARD -i %i  -o eth0 -j ACCEPT 2>/dev/null || ip6tables -A FORWARD -i %i  -o eth0 -j ACCEPT
PostUp   = ip6tables -C FORWARD -i eth0 -o %i  -j ACCEPT 2>/dev/null || ip6tables -A FORWARD -i eth0 -o %i  -j ACCEPT
PostDown = ip6tables -D FORWARD -i %i  -o eth0 -j ACCEPT 2>/dev/null || true
PostDown = ip6tables -D FORWARD -i eth0 -o %i  -j ACCEPT 2>/dev/null || true

[Peer]
PublicKey = <HOME_PUBLIC_KEY>
# 192.168.203.0/24 is from our earlier Mailu setup
AllowedIPs = 10.10.1.7/32, 192.168.203.0/24, fd00:1::2/128, 2001:db8:dead:beef::1234/128
```

There are three important parts in this configuration.

First, forwarding is enabled for both IPv4 and IPv6 so that the VPS can route between the WireGuard interface and the physical `eth0` interface.

> I also have a separate `sysctl` file to make IPv6 forwarding persistent, but leaving the `PostUp` here does not hurt.
> The `sysctl` file should not change anything, but only make sure that these are the values:
>
> ```bash
> tee /etc/sysctl.d/90-ipv6-forward.conf >/dev/null <<'EOF'
> net.ipv6.conf.all.forwarding = 1
> # Optional: be explicit that we do not want RA on eth0
> net.ipv6.conf.eth0.accept_ra = 0
> EOF
>
> sudo sysctl --system
> ```
>
> On many VPS images, IPv4 forwarding is already enabled, but IPv6 forwarding is often disabled by default.
> Without `net.ipv6.conf.all.forwarding = 1`, Linux will happily accept packets destined to local addresses, but it will not forward packets between interfaces, even if the routing table looks correct.

Second, the IPv6 route for `2001:db8:dead:beef::1234/128` points to `wg0`.
That is the "teleportation" route.
As soon as that route is installed, any traffic from the Internet for that address will go from the upstream router to the VPS `eth0`, then into `wg0`, and then down the WireGuard tunnel to your home server.

Third, the firewall rules make sure that packets are allowed to cross from `wg0` to `eth0` and back.
Without these rules, the kernel might know how to route packets, but `iptables` or `ip6tables` would still drop them in the `FORWARD` chain.

### On the Home Server

On the home server, the WireGuard configuration is the mirror image of the VPS config.
Before we configure WireGuard, we prepare a dedicated routing table for the teleported IPv6 traffic:

```bash
# Check what is already there
cat /usr/share/iproute2/rt_tables

# If you want a nice name:
mkdir -p /etc/iproute2
cp /usr/share/iproute2/rt_tables /etc/iproute2/rt_tables
echo "100 netcupvps6" | tee -a /etc/iproute2/rt_tables
```

Here is `/etc/wireguard/wg0.conf` on the home server:

```ini
[Interface]
Address = 10.10.1.7/32, fd00:1::2/64
PrivateKey = <HOME_PRIVATE_KEY>

# !IMPORTANT!: otherwise the default behaviour would cause routes for AllowedIPs = 0.0.0.0/0, ::/0 to be installed
#              capturing ALL your traffic on your home server
Table = off
# Keep overlay reachability to the 10.10.1.0/24 WG network (hub on VPS).
PostUp   = ip route add 10.10.1.0/24 dev wg0 || true
PostDown = ip route del 10.10.1.0/24 dev wg0 || true
# Optional but recommended (avoid drops with policy-routing asymmetry):
PreUp    = sysctl -w net.ipv4.conf.all.rp_filter=2
PostDown = sysctl -w net.ipv4.conf.all.rp_filter=0
# Enable IPv6 forwarding on the home host
PostUp   = sysctl -w net.ipv6.conf.all.forwarding=1

# Tell the home host that the chatmail address lives behind incusbr0 and send chatmail /64 via VPS
# Route /64 over wg0 in custom table and set default
PostUp   = ip -6 route add 2001:db8:dead:beef::/64 dev %i table netcupvps6 2>/dev/null || true
PostUp   = ip -6 route add default via fd00:1::1 dev %i table netcupvps6 2>/dev/null || true
PostUp   = ip -6 rule add from 2001:db8:dead:beef::/64 lookup netcupvps6 2>/dev/null || true

PostDown = ip -6 rule del from 2001:db8:dead:beef::/64 lookup netcupvps6 2>/dev/null || true
PostDown = ip -6 route del default via fd00:1::1 dev %i table netcupvps6 2>/dev/null || true
PostDown = ip -6 route del 2001:db8:dead:beef::/64 dev %i table netcupvps6 2>/dev/null || true

# Route the single teleported address to the Incus bridge in the main table
PostUp   = ip -6 route add 2001:db8:dead:beef::1234/128 dev incusbr0 2>/dev/null || true
PostDown = ip -6 route del 2001:db8:dead:beef::1234/128 dev incusbr0 2>/dev/null || true

# IPv6 FORWARD rules between wg0 and incusbr0
PostUp   = ip6tables -C FORWARD -i %i       -o incusbr0 -j ACCEPT 2>/dev/null || ip6tables -A FORWARD -i %i       -o incusbr0 -j ACCEPT
PostUp   = ip6tables -C FORWARD -i incusbr0 -o %i       -j ACCEPT 2>/dev/null || ip6tables -A FORWARD -i incusbr0 -o %i       -j ACCEPT
PostDown = ip6tables -D FORWARD -i %i       -o incusbr0 -j ACCEPT 2>/dev/null || true
PostDown = ip6tables -D FORWARD -i incusbr0 -o %i       -j ACCEPT 2>/dev/null || true

[Peer]
PublicKey = <VPS_PUBLIC_KEY>
Endpoint = vps.example.com:51820
# IPv4: you already had 0.0.0.0/0 from the Mailu setup
# IPv6: allow everything from/to the VPS over wg0
AllowedIPs = 0.0.0.0/0, 10.10.1.0/24, ::/0
PersistentKeepalive = 25
```

There are two important points on the home side.

First, `Table = off` tells WireGuard not to install any routes automatically.
I want to manage all routing explicitly, so no automatic default routes should appear when I use `AllowedIPs = 0.0.0.0/0, ::/0`.

> This is a common trap when people move from a "road warrior" VPN setup to a site to site setup.
> In a laptop style configuration, it is convenient when WireGuard installs routes for `AllowedIPs` automatically, because you usually want "send everything into the tunnel".
> In a home server with many services, this would suddenly send all traffic through the VPS, including unrelated things like backups, package updates or media streaming.
> By disabling the automatic routing and using explicit `ip route` and `ip rule` commands, you stay in full control.

Second, I use a separate routing table with ID `100` (`netcupvps6`) which I use only for traffic with a source inside `2001:db8:dead:beef::/64`.
The `ip -6 rule` line sends such packets to that table.
In table `100` the default route points to the VPS inside the WireGuard tunnel.

The effect is that any packet sent from the home server or from containers behind it with source address `2001:db8:dead:beef::1234` will always leave via the VPS over the tunnel, never via the normal home Internet connection.
This is essential to make the traffic from the Incus instance consistently appear as coming from an IPv6 address that is part of the VPS prefix.

> If we were not doing that, then outgoing IPv6 traffic from the Incus instance going to any address outside of `2001:db8:dead:beef::/64` would use the route through your home ISP and cause source address validation problems,
> where your home ISP drops packets whose source address belongs to the netcup prefix.

The additional route `ip -6 route add 2001:db8:dead:beef::1234/128 dev incusbr0` in the main table tells the home server that packets for that specific address should go to the Incus bridge.
Incoming packets from the VPS whose inner destination is `2001:db8:dead:beef::1234` will therefore be delivered to the container.

> To make table `100` visible by name we created `/etc/iproute2/rt_tables`, but this is not strictly required.
> The `ip` command happily accepts numeric table IDs.

### Smoke Tests

At this point you should already have basic connectivity.
From the home server you should be able to ping both the VPS and the teleported address, and the VPS should be able to ping the home end of the tunnel.

On the home server:

```bash
ping -c 1 10.10.1.1
ping -6 -c 1 fd00:1::1
```

On the VPS:

```bash
ping -c 1 10.10.1.7
ping -6 -c 1 fd00:1::2
```

From the outside world, once an Incus system container with that IPv6 address configured is running, this should also work:

```bash
ping -6 -c 1 2001:db8:dead:beef::1234
```

If all of these pings succeed, your teleported IPv6 address is now effectively "living" in your Incus container at home, even though it belongs to the prefix of your VPS.

## Step 4: The Incus bridge and the test container

On the home server I already use Incus with a bridge named `incusbr0`.
It has a Unique Local Address (ULA) prefix `fd42:3b7c:14bf:c2f2::/64` that you can see with `ip -6 addr show incusbr0` or `ip -6 route list match fd42:3b7c:14bf:c2f2::1/64`.
The home host itself uses `fd42:3b7c:14bf:c2f2::1` on that bridge, and the test container gets `fd42:3b7c:14bf:c2f2::10`.

Here is the Incus profile I use as a test container, named `test-profile`:
```yaml
config:
  boot.autostart: "true"
  security.nesting: "false"
  limits.cpu: "2"
  limits.memory: 4GiB
  limits.memory.enforce: "hard"

  cloud-init.user-data: |
    #cloud-config
    output:
      all: '| tee -a /var/log/cloud-init-output.log'

    hostname: chat.example.com

    ssh_pwauth: false
    disable_root: true

    package_update: true
    package_upgrade: true

    packages:
      - openssh-server
      - ca-certificates
      - curl
      - git
      - python3
      - python3-venv
      - python3-pip
      - sudo
      - iputils-ping
      - nano

    users:
      - name: chatmail
        # we will handle unlocking below via runcmd: # Make the account "no password, but not locked": usermod -p '*' chatmail
        # lock_passwd: false
        # passwd: "abc" # put output of "mkpasswd -m sha-512"        
        groups: [sudo]
        shell: /bin/bash
        sudo: "ALL=(ALL) NOPASSWD:ALL"
        ssh_authorized_keys:
          - ssh-ed25519 AAAA...OUfp you@desktop

    # keepalive script + units
    write_files:
      - path: /usr/local/sbin/ipv6-keepalive.sh
        owner: root:root
        permissions: '0755'
        content: |
          #!/bin/sh
          # Simple IPv6 keepalive ping from teleported address
          /usr/bin/ping -6 -q -c15 -W1 -I 2001:db8:dead:beef::1234 2001:4860:4860::8888

      - path: /etc/systemd/system/ipv6-keepalive.service
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=IPv6 keepalive ping for teleported address

          [Service]
          Type=oneshot
          ExecStart=/usr/local/sbin/ipv6-keepalive.sh
          # journalctl -u ipv6-keepalive.service
          StandardOutput=journal
          StandardError=journal

      - path: /etc/systemd/system/ipv6-keepalive.timer
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=Run IPv6 keepalive ping every 3 minutes

          [Timer]
          OnBootSec=30
          OnUnitActiveSec=180
          AccuracySec=30
          Persistent=true

          [Install]
          WantedBy=timers.target
      - path: /etc/ssh/sshd_config # /etc/ssh/sshd_config.d/99-cloud-init-hardening.conf
        owner: root:root
        permissions: '0644'
        content: |
          # Enforce key-only SSH and disable root logins
          PasswordAuthentication no
          ChallengeResponseAuthentication no
          KbdInteractiveAuthentication no
          PubkeyAuthentication yes
          PermitRootLogin no          

    runcmd:
      - [ usermod, -p, '*', chatmail ] # Lock password login but keep key-based SSH (set password hash to '*')
      - [ systemctl, daemon-reload ]
      - [ systemctl, enable, '--now', 'ipv6-keepalive.timer' ]
      - [ systemctl, restart, ssh ]
      # Optional: extra hardening/logging you might want later
    # - [ sh, -c, 'echo "cloud-init finished" > /var/tmp/cloud-init-done' ]

  cloud-init.network-config: |
    version: 2
    ethernets:
      eth0:
        dhcp4: true        # keep IPv4 via Incus bridge if you like (or set to false)
        dhcp6: false
        accept-ra: no
        addresses:
          - 2001:db8:dead:beef::1234/128
          # ULA on-link with the host bridge
          - fd42:3b7c:14bf:c2f2::10/64
        gateway6: fd42:3b7c:14bf:c2f2::1
        nameservers:
          addresses:
            - 2001:4860:4860::8888
            - 2001:4860:4860::8844
description: "Profile for test container (auto IPv6 + packages)"
devices:
  eth0:
    name: eth0
    network: incusbr0
    type: nic
  root:
    path: /
    pool: default         # or your storage pool name
    type: disk
    size: 40GiB
name: test-profile
```

The important bit is the `cloud-init.network-config` which tells cloud init to configure the Incus `eth0` with two IPv6 addresses and a IPv4 address via DHCP.
The container uses `fd42:3b7c:14bf:c2f2::1` on the home host as its default gateway.
From inside the container, that gateway then forwards everything out, and policy routing on the home host sends all packets with source `2001:db8:dead:beef::1234` to the VPS over WireGuard.

I start the container like this:
```bash
# Create the profile
incus profile create test-profile
incus profile edit test-profile < test-profile.yaml

# Launch a Debian 13 container with that profile
incus launch images:debian/trixie/cloud chatmail --profile default --profile test-profile

# Watch the logs:
incus exec chatmail -- tail -f /var/log/cloud-init-output.log
# Login as root
incus exec chatmail -- bash
# Login as user chatmail
incus exec chatmail -- su --login chatmail
# SSH from another machine:
ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no chatmail@2001:db8:dead:beef::1234
```

The Debian cloud image uses cloud init and `systemd-networkd` inside the container.
Cloud init translates the `cloud-init.network-config` from the profile into a `systemd-networkd` configuration file `/etc/systemd/network/10-cloud-init-eth0.network`.

If you started with DHCPv4 enabled inside the container, this is exactly the file where you can later turn IPv4 off in a controlled way.
Change `DHCP=ipv4` to `DHCP=no` and add `LinkLocalAddressing=ipv6`.
After your edits, the file looks like this:
```ini
[Address]
Address=2001:db8:dead:beef::1234/128

[Address]
Address=fd42:3b7c:14bf:c2f2::10/64

[Match]
Name=eth0

[Network]
DHCP=no
DNS=2001:4860:4860::8888 2001:4860:4860::8844
IPv6AcceptRA=False
# Only IPv6 link-local, no IPv4 link-local
LinkLocalAddressing=ipv6 

[Route]
Gateway=fd42:3b7c:14bf:c2f2::1
GatewayOnLink=yes
```

A restart of `systemd-networkd` inside the container is required to make the changes take effect:
```bash
systemctl restart systemd-networkd
```

After that, `ip -4 addr` inside the container should show no IPv4 at all, and `ip -6 addr` should show the two IPv6 addresses and one link local address.

## Step 5: Smoke Tests

Here are some tests that you can run from inside the container:

```bash
root@chatmail:~# ip -6 addr show eth0
root@chatmail:~# ip -6 route
# Self test
root@chatmail:~# ping6 -c 1 2001:db8:dead:beef::1234
# Outbound from the container
root@chatmail:~# ping6 -c 1 fd42:3b7c:14bf:c2f2::1
root@chatmail:~# ping6 -c 1 fd00:1::1
root@chatmail:~# ping6 -c 1 2001:db8:dead:beef::1
root@chatmail:~# ping6 -c 1 2001:4860:4860::8888
root@chatmail:~# curl -6 --max-time 5 https://ifconfig.co
```

The idea of these tests is:

* `ip -6 addr` and `ip -6 route` confirm that both IPv6 addresses are present and that the default route points to the ULA gateway.
* The ping to `2001:db8:dead:beef::1234` checks that the container can reach its own teleported address.
* The ping to `fd42:3b7c:14bf:c2f2::1` checks reachability of the home host over the Incus bridge.
* The ping to `2001:4860:4860::8888` and the `curl` to `ifconfig.co` test general internet connectivity and confirm that the correct public IPv6 address is used as source.


On the VPS you can check the VPS ↔ container connectivity over IPv6:
```bash
ping6 -c 1 2001:db8:dead:beef::1234
ip -6 route show 2001:db8:dead:beef::1234/128
ip -6 neigh show dev eth0
```

From the outside world, for example from your desktop PC, you can also test:
```bash
ping6 -c 1 2001:db8:dead:beef::1234
ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no chatmail@2001:db8:dead:beef::1234
```

If these commands work, then your chatmail container at home behaves exactly like a small VPS with its own public IPv6 address, even though the address is actually routed through your existing VPS over WireGuard.

You can remove the test container via the `incus` command line:
```bash
incus delete -f chatmail
```

## Step 6: Troubleshooting

It is very easy to make a typo in an address or a route and then stare at a "no route to host" for hours.
Here are a few tools that helped me debug problems along the way.

The `ip` family of commands is always the first stop.

```bash
ip -6 addr
ip -6 route
ip -6 rule
ip -6 neigh
```

Use those both on the VPS, on the home host and inside the container. You can trace where the teleported address is configured and which routes lead to it.

`nft monitor trace` is very helpful to see which rule matches or drops packets. Here is an example to trace pings on the VPS (eth0 → wg0):
```bash
# This assumes iptables is using the nftables backend (the default on recent Debian/Ubuntu).
# Start trace for inbound ICMPv6 destined to the container’s address
ip6tables -t raw -I PREROUTING 1 -i eth0 -p ipv6-icmp -d 2001:db8:dead:beef::1234 -j TRACE
ip6tables -t raw -I PREROUTING 1 -i wg0  -p ipv6-icmp -s 2001:db8:dead:beef::1234 -j TRACE

# In another terminal:
nft monitor trace

# When done:
ip6tables -t raw -D PREROUTING -i eth0 -p ipv6-icmp -d 2001:db8:dead:beef::1234 -j TRACE
ip6tables -t raw -D PREROUTING -i wg0  -p ipv6-icmp -s 2001:db8:dead:beef::1234 -j TRACE
```

Then try your `ping` or `curl` again and watch how the packet moves through the rules.

`tcpdump` is good for seeing whether packets actually leave and arrive on a given interface. For example, on the VPS you can watch NDP neighbor packets on `eth0`:
```bash
tcpdump -i eth0 -n -vv icmp6 and 'ip6[40] == 135 or ip6[40] == 136'
```

Type 135 is Neighbor Solicitation, type 136 is Neighbor Advertisement.
If `ndppd` is working, you should see the VPS answering NDP queries for your `/64` there.

To watch generic ICMPv6, including ping, use `tcpdump -ni eth0 icmp6` or on the WireGuard interface `tcpdump -ni wg0 icmp6`.

You can run similar commands on the home host to trace whether packets move from `wg0` to `incusbr0` and into the container.

On the routing side, you can also ask the kernel how it would route a specific packet:

```bash
ip -6 route get 2001:db8:dead:beef::1234
ip -6 route get 2001:4860:4860::8888 from 2001:db8:dead:beef::1234
```

The output shows which table and which interface the kernel picks. This is a good way to verify that your `ip -6 rule` for table `100` actually takes effect.

## Step 7: Setting Up a Chatmail Relay

You can find the chatmail relay repository on [GitHub](https://github.com/chatmail/relay), and in this section we mostly follow the official documentation for [setting up a chatmail relay](https://chatmail.at/doc/relay/getting_started.html).

Originally I planned to use the container profile `test-profile.yaml` that we created earlier.
However, I quickly ran into several practical issues and had to modify this configuration quite a lot.
The final result is the `chatmail-profile.yaml` that you will see further down.

Before we look at that profile, it helps to understand the issues that appeared along the way, because they explain why the profile looks more complex than you might expect at first.

1. `cmdeploy` insists on using the [unbound](https://nlnetlabs.nl/projects/unbound/about/) DNS service, and `systemd-resolved` has to be disabled.

1. `cmdeploy` insists on using the `root` account via SSH. It is not enough to just have a `chatmail` user with passwordless `sudo`. You really have to unlock `root` and allow direct SSH logins for it.

1. `cmdeploy` only runs cleanly on Debian 12 not on the Debian Trixie 13.2 we used earlier.

1. `cmdeploy` also expects `sftp` to be available during installation, but the minimal `test-profile.yaml` does not install or configure it. As a result, the deployment fails.

1. At first I wanted to run the whole setup inside the Incus container with IPv6 only and explicitly disable IPv4.
   This makes debugging easier because you immediately notice any hidden IPv4 dependency.
   Unfortunately I had to learn that `github.com` is still [IPv4 only](https://news.ycombinator.com/item?id=39236652), so a purely IPv6 only container cannot talk to GitHub and the installation breaks.

1. When I tried to use Incus system containers, `cmdeploy` installations failed in a late stage with an error similar to `sysctl: permission denied on key "fs.inotify.max_user_instances"`.
   I did not want to give extra privileges to the system container just to tweak kernel parameters.
   Because of this I switched from an Incus system container to `incus --vm`, so the guest runs as a full virtual machine instead of a system container.

1. `cmdeploy run` is built on `pyinfra`, which is designed to be idempotent.
   In theory this means you can run it multiple times, and it will converge to the desired configuration instead of breaking things again and again.
   In practice `cmdeploy` itself is not fully idempotent. Each time it starts it checks whether certain ports are already in use.
   If a previous run failed halfway, some services will still be running and occupying these ports.
   There is no `cmdeploy clean` or similar reset command, so you often need to start from a fresh instance when something goes wrong.
   > Because of this behavior it is very helpful to use Incus snapshots as a safety net. You can create a snapshot before running `cmdeploy` and roll back to that clean state whenever an installation attempt fails.

All these points together meant that my minimal `test-profile.yaml` grew into a much more massive `chatmail-profile.yaml`.

Since cmdeploy is also the tool you will use later for upgrades, it does not make much sense to tighten all the relaxed settings again after the initial installation.
Otherwise you would have to fight exactly the same problems at upgrade time.
It is better to understand these requirements once, accept them as part of the chatmail relay environment, and then keep the profile consistent for both installation and maintenance.

**Step 1**: Setup the initial DNS records. The following is an example in the familiar BIND zone file format with a TTL of 1 hour (3600 seconds). Please substitute your domain and IP addresses.

```txt
chat.example.com. 3600 IN AAAA 2001:db8:dead:beef::1234
www.chat.example.com. 3600 IN CNAME chat.example.com.
mta-sts.chat.example.com. 3600 IN CNAME chat.example.com.
```

> In case that you do not have a domain yourself I suggest you get a free subdomain from [FreeDNS](https://freedns.afraid.org/).

**Step 2**: Setup the new Incus virtual machine

Here is the new `chatmail-profile.yaml` that we will use:
```yml
config:
  boot.autostart: "true"
  limits.cpu: "1"
  limits.memory: 1GiB

  cloud-init.user-data: |
    #cloud-config
    output:
      all: '| tee -a /var/log/cloud-init-output.log'

    hostname: chat.example.com

    ssh_pwauth: false
    disable_root: false

    package_update: true
    package_upgrade: true

    packages:
      - openssh-server
      - openssh-sftp-server
      - ca-certificates
      - curl
      - git
      - python3
      - python3-venv
      - python3-pip
      - sudo
      - iputils-ping
      - nano

    users:
      - name: chatmail
        # we will handle unlocking below via runcmd: # Make the account "no password, but not locked": usermod -p '*' chatmail
        # lock_passwd: false
        # passwd: "abc" # put output of "mkpasswd -m sha-512"        
        groups: [sudo]
        shell: /bin/bash
        sudo: "ALL=(ALL) NOPASSWD:ALL"
        ssh_authorized_keys:
          - ssh-ed25519 AAAA...Ufp you@home.net
      - name: root
        ssh_authorized_keys:
          - ssh-ed25519 AAAA...Ufp you@home.net


    # keepalive script + units
    write_files:
      - path: /usr/local/sbin/ipv6-keepalive.sh
        owner: root:root
        permissions: '0755'
        content: |
          #!/bin/sh
          # Simple IPv6 keepalive ping from teleported address
          /usr/bin/ping -6 -q -c15 -W1 -I 2001:db8:dead:beef::1234 2001:4860:4860::8888

      - path: /etc/systemd/system/ipv6-keepalive.service
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=IPv6 keepalive ping for teleported address

          [Service]
          Type=oneshot
          ExecStart=/usr/local/sbin/ipv6-keepalive.sh
          # journalctl -u ipv6-keepalive.service
          StandardOutput=journal
          StandardError=journal

      - path: /etc/systemd/system/ipv6-keepalive.timer
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=Run IPv6 keepalive ping every 4 minutes

          [Timer]
          OnBootSec=30
          OnUnitActiveSec=240
          AccuracySec=30
          Persistent=true

          [Install]
          WantedBy=timers.target
      - path: /etc/ssh/sshd_config # /etc/ssh/sshd_config.d/99-cloud-init-hardening.conf
        owner: root:root
        permissions: '0644'
        content: |
          # override default of no subsystems
          Subsystem sftp /usr/lib/openssh/sftp-server

          # Enforce key-only SSH and disable root logins
          PasswordAuthentication no
          ChallengeResponseAuthentication no
          KbdInteractiveAuthentication no
          PubkeyAuthentication yes
          PermitRootLogin yes

      # static resolv.conf content
      - path: /etc/resolv.conf.cloud
        owner: root:root
        permissions: '0644'
        content: |
          nameserver 2001:4860:4860::8888
          nameserver 2001:4860:4860::8844

    runcmd:
      - [ usermod, -p, '*', chatmail ] # Lock password login but keep key-based SSH (set password hash to '*')
      - [ usermod, -p, '*', root ]     # Lock password login but keep key-based SSH (set password hash to '*')

      # disable systemd-resolved (ignore error if not present)
      - [ sh, -c, 'systemctl disable --now systemd-resolved || true' ]
      # backup current resolv.conf if it exists and no backup yet
      - [ sh, -c, 'if [ -e /etc/resolv.conf ] && [ ! -e /etc/resolv.conf.backup ]; then mv /etc/resolv.conf /etc/resolv.conf.backup; fi' ]
      # replace it with our static one
      - [ mv, /etc/resolv.conf.cloud, /etc/resolv.conf ]

      - [ systemctl, daemon-reload ]
      - [ systemctl, enable, '--now', 'ipv6-keepalive.timer' ]
      - [ systemctl, restart, ssh ]
      # Optional: extra hardening/logging you might want later
    # - [ sh, -c, 'echo "cloud-init finished" > /var/tmp/cloud-init-done' ]

  agent.nic_config: "true"
  cloud-init.network-config: |
    version: 2
    ethernets:
      eth0:
        dhcp4: true        # keep IPv4 via Incus bridge if you like (or set to false)
        dhcp6: false
        accept-ra: no
        addresses:
          - 2001:db8:dead:beef::1234/128
          # ULA on-link with the host bridge
          - fd42:3b7c:14bf:c2f2::10/64
        gateway6: fd42:3b7c:14bf:c2f2::1
        nameservers:
          addresses:
            - 2001:4860:4860::8888
            - 2001:4860:4860::8844
description: "Profile for chatmail relay vm (auto IPv6 + packages)"
devices:
  eth0:
    name: eth0
    network: incusbr0
    type: nic
  root:
    path: /
    pool: default         # or your storage pool name
    type: disk
    size: 10GiB
name: chatmail-profile
```

Now start the instance as follows:
```bash
# Delete previous instance if it exists
incus delete -f chatmail
# Create the profile
incus profile create chatmail-profile
incus profile edit chatmail-profile < chatmail-profile.yaml

# Launch a Debian 12 VM with that profile
incus launch images:debian/12/cloud chatmail --profile default --profile chatmail-profile --vm

# Watch the logs: they will only appear after some time. !!BE PATIENT!!
incus exec chatmail -- tail -f /var/log/cloud-init-output.log
# Login as root
incus exec chatmail -- bash
# Login as user chatmail
incus exec chatmail -- su --login chatmail
# SSH from another machine:
ssh root@chat.example.com
# Verify SFTP from another machine:
sftp -v root@chat.example.com
```

**Step 3**: Create a snapshot

Before you start modifying the `chatmail` instance, it is a good idea to take a snapshot. If something breaks, you can roll back to this point in time within a few seconds.

> An Incus snapshot stores the state of the instance filesystem and metadata at a specific moment.
> It does not copy all data again each time.
> Internally, Incus uses copy-on-write, so snapshots are usually very cheap in terms of disk space.
> This makes them a perfect safety net before larger changes.

You create the snapshot with `incus snapshot chatmail pre-chatmail`:
```bash
# Stop the instance for a very clean snapshot (optional but safest)
incus stop chatmail

# Create a snapshot named "pre-chatmail"
incus snapshot chatmail pre-chatmail

# Start the instance again
incus start chatmail
```

Later, if you want to undo your changes, you can restore the snapshot with `incus restore chatmail pre-chatmail`:
```bash
# Stop the instance before restoring the snapshot
incus stop chatmail

# Restore the snapshot
incus restore chatmail pre-chatmail

# Start the instance again
incus start chatmail
```

When you restore a snapshot, Incus rolls the instance filesystem back to exactly how it looked at the time of the snapshot.
All changes you made afterwards are discarded.
Because of this, it is safer to stop the instance before restoring, so that no services are writing data while the rollback happens.

If you run into problems later, you can often save yourself the work of a full redeploy by simply restoring this snapshot.

**Step 4**: On your local PC, clone the repository and bootstrap the Python virtualenv.

```bash
git clone https://github.com/chatmail/relay
cd relay
scripts/initenv.sh
```

**Step 5**: On your local PC, create the `chatmail.ini` configuration file

On your local machine, let `cmdeploy` create the initial configuration file for your chatmail relay.

```bash
scripts/cmdeploy init chat.example.com  # <-- use your own domain here
cat ./chatmail.ini
```

**Step 6**: Verify that SSH root login to your remote server works

To use `cmdeploy` as designed, you need working SSH access as `root` on the remote system. This is how `cmdeploy` can install and update all required components without you running manual commands on the server.

```bash
ssh root@chat.example.com
```

If this works and you get a shell, you are ready for the next step.

If you get a `Permission denied` error, look in the SSH logs on the Incus instance:

```bash
journalctl -u ssh -n 50
```

Check that the `sftp` subsystem of `OpenSSH` is working correctly, because `cmdeploy` uses it to copy files to the server:

```bash
sftp -v root@chat.example.com
```

If this command fails, the debug output usually contains a clear hint about the problem, for example a missing key, wrong permissions on `~/.ssh` or a disabled SFTP subsystem.

**Step 7**: From your local PC, deploy the remote chatmail relay server

Once SSH as `root` works and `chatmail.ini` looks good, you can trigger the actual deployment from your local machine.

Now run `scripts/cmdeploy run`:

```bash
scripts/cmdeploy run
```

This step connects to your Incus instance through SSH, installs and configures all required components and finally starts the chatmail services.

> As part of the deployment process, at the very end you should see a message similar to:  
> `You can try out the relay by talking to this echo bot: ...`  
> Write that URL down somewhere, you will need it later when you test the relay from a Delta Chat client.

> If `cmdeploy run` fails in the middle, do not panic.
> In many cases you can simply fix the underlying issue, for example a missing package or a permission problem, and then run `scripts/cmdeploy run` again.
> If things look really broken, you still have your Incus snapshot from the previous step and can roll back.

**Step 8**: Test the deployment and configure DNS records

To check the status of your remotely running chatmail service, use:
```bash
scripts/cmdeploy status
```

This shows you which services are running and whether the deployment looks healthy.

To display all recommended DNS records for your domain, run:
```bash
scripts/cmdeploy dns
```

This prints the records that you should create at your DNS provider, for example `MX`, `AAAA`, `TXT` and possibly `SRV` records.
At this point, configure all the mentioned DNS records exactly as shown on the screen.

> DNS changes may take some time to propagate on the internet.
> If your first tests fail with DNS related errors, wait a bit and try again, or use tools like `dig` or `nslookup` to verify that the new records are visible from outside your network.
> Once DNS is correct and the `status` command looks good, your teleported IPv6 chatmail relay is ready for real world use.

> `scripts/cmdeploy dns` does not currently check whether reverse DNS (rDNS) entries are configured, but this is still very important for reliable mail delivery, as discussed in [Reverse DNS for the VPS Public IP](../digital-civil-rights-mailu/#reverse-dns-for-the-vps-public-ip).
>
> Reverse DNS means that there is a PTR record that maps your server IP address back to a hostname.
> Many mail servers and spam filters compare this hostname with the name your server presents in the SMTP banner and with the forward DNS records.
> If these values look inconsistent or completely missing, your messages are more likely to be flagged as spam or rejected.
>
> I recommend that you log in to your VPS provider control panel and set up a reverse DNS entry for the public IPv6 address `2001:db8:dead:beef::1234` that our chatmail relay uses.

## Step 8: Setting up a Delta Chat client

Go to the [Delta Chat download](https://delta.chat/en/download) page. I recommend that you first configure Delta Chat on your desktop or laptop computer, and only then on your mobile devices. A simple order that works well is:

1. Install and set up Delta Chat on your desktop PC or laptop.
2. Configure Delta Chat on your mobile devices by scanning the QR code that the desktop client can show for adding another device.

This sequence is convenient because many desktop PCs do not have a camera, so they cannot easily scan a QR code from a phone screen, while your phone can scan the QR code that is shown on the desktop display.

On Linux, I installed Delta Chat using the Flatpak method described on the download page, but you can use any installation method that is supported for your distribution.

Delta Chat behaves a bit differently from classic mail clients when you set up a new account on your own chatmail relay.
You do not enter IMAP and SMTP parameters manually in the Delta Chat app during account creation.

Instead, you start the registration on the website of your chatmail relay, for example by visiting `https://chat.example.com`.
On that page you click the invite link for your relay. This works on a device where Delta Chat is installed and registered for its URL scheme.
Your browser then hands the request over to the installed Delta Chat app, and the app completes the setup using the correct server settings from the invite.

> The invite link usually contains a token with all required information, such as the server address, port numbers and some security related parameters.
> This avoids the typical copy and paste mistakes that can happen when you type everything in by hand, and makes the onboarding experience much simpler for non technical users.

Chatmail relays are operated by different groups and individuals.
Depending on how serious you are about running your own infrastructure, you can either create the account on your own relay instance or use one of the public relays listed at [https://chatmail.at/relays](https://chatmail.at/relays).
For experimentation your own relay is ideal, because you keep full control and can break and fix things without affecting other users.

Once you have set up your Delta Chat client on the desktop, open your profile settings and use the `Add Second Device` function.
This shows a QR code. If you scan this QR code with the Delta Chat app on your mobile device, the app will copy your account, encryption keys and chat history, so you can use the same identity on multiple devices in parallel.

> Behind the scenes, Delta Chat does not simply log in again with the same password.
> It actually transfers your end to end encryption keys to the second device.
> This means both devices can read existing encrypted messages and send new ones without reestablishing trust with all your contacts.

When you are done with your main setup, you can test the echo bot of your own chatmail relay by visiting the link you noted earlier from the deployment step.
On that page you will usually see something like:
* `Tap if you have Delta Chat on another device` and
* `Scan to open the chat on the other device`

If you scan that QR code or follow the link with Delta Chat, you will enter a conversation with the echo bot of your own chatmail relay instance.
Send a few messages and you should see them come back to you immediately.
This is a simple but very useful way to confirm that your relay, the teleported IPv6 address and your DNS configuration all work together as intended.

## Conclusions

In this blog post you have walked through quite a journey.
You have "teleported" a public IPv6 address from a VPS to your home server behind your home router, and you have made an Incus instance (system container or VM) reachable from the internet over that address.
As a proof of concept, you installed a chatmail relay inside this Incus instance using the `cmdeploy` tool and then connected to it with a fresh Delta Chat client installation.

If you look at it from a networking point of view, you have implemented a small but powerful pattern:

* a routed IPv6 `/128` from your VPS into a WireGuard tunnel
* NDP proxying on the VPS so that the outside world can find that address
* an Incus instance at home that "owns" this public IPv6 as if it were a tiny VPS

Once this is in place, the actual application inside the Incus instance does not care that it runs in your living room.
For the internet it simply looks like another host in your provider IPv6 range.

The techniques you have seen in this blog post are useful far beyond chatmail and Delta Chat.
You can reuse the same pattern to host other services on Incus instances at home, each with its own public IPv6 address routed through your existing VPS.

I am looking forward to using these techniques myself in future blog posts and to exploring what other services can be "teleported" from a small VPS to a more capable home server.

## Appendix

### Alternatives

The architecture in this post uses a single WireGuard tunnel between the VPS and the home server.
One IPv6 address from the VPS `/64` is routed through that tunnel into an Incus bridge on the home side.
The container itself does not know that there is a tunnel.
From its perspective it simply has a public IPv6 address and a local ULA gateway.

There are several alternative approaches that might fit different preferences, constraints, or levels of complexity.

One option is to attach the container directly to the WireGuard interface on the home host by using what Incus calls a routed NIC.
In that model you configure an Incus device with something like `nictype: routed` and `parent: wg0`, and you assign `2001:db8:dead:beef::1234` directly in the container profile.
Incus then takes care of adding host routes and proxy NDP on the home host.
The network path becomes shorter because the packet does not pass through a separate bridge on the home server, but you still need the same policy routing on the home host and the same NDP proxy configuration on the VPS.

> With a routed NIC the container does not participate in the layer 2 network of the host.
> Instead, the host acts as a router and forwards traffic for the container IPs.
> The host replies to Neighbor Discovery requests on behalf of the container, so that upstream routers believe the container address is directly reachable on that link.

Another option is to give each container its own WireGuard tunnel to the VPS.
Each container becomes its own WireGuard peer, with its own key pair and its own `/128` taken from the VPS `/64`.
On the VPS side you then have one WireGuard peer per container, plus separate `ip -6 route add` entries for each of those `/128` addresses.
This gives very clear separation between containers, because each one has its own tunnel and its own cryptographic identity, at the cost of more configuration and more keys to manage.

> This model can be attractive if you already treat each container as a separate tenant or project.
> For example, you might want to be able to disable a single container by bringing down its WireGuard peer, without touching any other part of the system.
> The price is that you need to automate peer creation, key distribution, and route management if the number of containers grows.

A more radical alternative is to use a BGP capable tunnel broker and get your own IPv6 prefix delivered directly to your home.
Services like Route48 used to offer such tunnels, and there are now successors like BGPTunnel.
In that world you run a BGP daemon such as BIRD or FRR either on your home router or on a VPS, and the tunnel broker announces your prefix to the global Internet.
Your home border router then becomes a real Internet router that can route your own IPv6 space to any internal machine, including Incus containers.
This approach gives you a lot of flexibility and makes you independent from a specific VPS provider, but it also requires more networking knowledge and the operational overhead of running a BGP stack.

> BGP, the Border Gateway Protocol, is the routing protocol that glues together the global Internet.
> When you run BGP with a tunnel broker, you effectively tell their routers "this IPv6 prefix lives behind my tunnel".
> They then propagate that information to their peers.
> Compared to static routing over a VPS, this allows you to move your prefix between locations or providers more easily, but you also take on responsibilities such as keeping your BGP session stable and secure.

There are also classic IPv6 tunnel brokers such as Hurricane Electric.
They provide you with a `/64` or `/48` via an IP tunnel without requiring BGP.
You can terminate such a tunnel on your home router or on a VPS and then combine it with Incus and WireGuard in many different ways.
For my chatmail relay use case, however, the simpler "teleport one address from the VPS `/64`" solution described in this post was completely sufficient.

> Classic tunnel brokers are often the easiest way to get global IPv6 connectivity if your ISP does not offer native IPv6.
> The trade off is that all traffic passes through the broker infrastructure.
> When you already have a VPS with a native `/64`, it can be simpler and more efficient to reuse that allocation instead of introducing a separate tunnel broker.

#### From Route48 to BGPTunnel

Route48 started around 2022 as a free IPv6 tunnel broker with BGP support.
It targeted exactly the audience that likes to experiment with its own ASN at home or in a homelab.
The service let you create WireGuard, GRE ([Generic Routing Encapsulation](https://en.wikipedia.org/wiki/Generic_routing_encapsulation)) or [SIT](https://en.wikipedia.org/wiki/6in4)[^sit] tunnels, handed out routed `/48` IPv6 prefixes, and even offered BGP sessions so that you could announce that space yourself.
The whole project was positioned very clearly as "free, instant and automated" and was run as a joint effort between Cloudie Networks and Zappie Host, sponsored by various hosting providers.

> [Route48.org :: Free IPv6 BGP Enabled Tunnelbroker Service](https://lowendtalk.com/discussion/178727/route48-org-free-ipv6-bgp-enabled-tunnelbroker-service)

In early 2023 the team announced that Route48 would be retired.
In their shutdown notice they described a mix of reasons: continuing attacks against their and their upstreams' infrastructure, abuse of the platform, and the growing operational workload to keep abuse under control.
They explicitly thanked the community and sponsors, and encouraged users to look for alternative services, especially if they had built learning or homelab setups on top of Route48.

> [Route48.org Service Closure Notice](https://news.ycombinator.com/item?id=35271243)

If you visit `route48.org` today you no longer see the old portal.
Instead, the page simply says that the Route48 project is closed and then redirects you to [BGPTunnel.com](https://bgptunnel.com/), which is presented as an iFog GmbH project and lists a familiar set of network names from the broader Route48 ecosystem.
BGPTunnel itself is a free BGP tunnel service aimed at non-commercial networks with their own ASN and IPv6 prefix.
It offers IPv4 and IPv6 transit via GRE tunnels from AS209533, and is explicitly run by iFog GmbH, a Swiss network operator.

So the situation today looks like this: Route48 as a platform is gone, but many of the networks and people who used or sponsored it now show up around BGPTunnel, either as upstreams, peers or community members.
There is no official statement that BGPTunnel is a one-to-one continuation of Route48, and the operators are different on paper, but for a homelab person it fills a very similar niche: a friendly way to get real BGP and real transit for your own IPv6 space without paying datacenter prices.

If you want to explore services in the same category as BGPTunnel, here are three good starting points:

* **BGPTunnel** - free IPv4 and IPv6 transit over GRE tunnels for non-commercial ASNs, run by iFog GmbH: [https://bgptunnel.com](https://bgptunnel.com).
* **Tunnelbroker\.ch (Securebit)** - long-running tunnel broker service that can provide IPv6 tunnels and optional BGP sessions for your own space: [https://tunnelbroker.ch/](https://tunnelbroker.ch/).
* **NetAssist IPv6 Tunnel Broker** - classic IPv6 tunnel broker that also offers BGP-enabled tunnels on request if you bring your own ASN and IPv6 addresses: [https://tb.netassist.ua/](https://tb.netassist.ua/).

#### Hurricane Electric and the classic IPv6 tunnel broker

[Hurricane Electric](https://en.wikipedia.org/wiki/Hurricane_Electric) is a US based Internet backbone operator that has been around since the mid 1990s.
It was an early adopter of IPv6 and deployed IPv6 on its global backbone in the early 2000s.
Over time it grew into one of the largest IPv6 networks worldwide, both in terms of prefixes announced and number of BGP peers.

To help people experiment with IPv6 before their ISPs were ready, Hurricane Electric launched the IPv6 Tunnel Broker service.
By 2002 they were already announcing upgrades to this fully automated service, which lets you reach the IPv6 Internet by tunneling IPv6 over an existing IPv4 connection.
From the start, the idea was simple: free tunnels for developers, hobbyists and anyone who wanted to learn IPv6.
That model is still in place today, and the service is advertised and documented as a free IPv6 tunnel broker.

> [Hurricane Electric Upgrades IPv6 Tunnel Broker](https://he.net/releases/release6.html)

For more advanced users, Hurricane Electric also experimented with BGP over tunnels.
Initially, some users could establish full BGP sessions over their tunnels at no extra cost.
In 2011 the company formalised this into a separate "premium IPv6 tunnel broker" product, aimed at business and enterprise use, with higher throughput and BGP as a requirement.
This commercial service launched in 2011 at 500 USD per month.

> [Hurricane Electric Launches Premium IPv6 Tunnel Broker Service](https://newswire.telecomramblings.com/2011/06/hurricane-electric-launches-premium-ipv6-tunnel/)

Around 2020 Hurricane Electric stopped offering new free BGP tunnels on <tunnelbroker.net>.
Users trying to enable BGP now see a message that BGP over tunnels is no longer free and that the commercial option costs about 500 USD per month.
At the same time, the regular non-BGP tunnels remain free, and the public documentation continues to describe the tunnel broker itself as a free service.

> [Hurricane Electric no longer offers free BGP tunnels](https://www.reddit.com/r/ipv6/comments/g6v7b2/hurricane_electric_no_longer_offers_free_bgp/)

If you are looking for services in the same general category as Hurricane Electric's tunnel broker, these three are good reference points:

* **Hurricane Electric IPv6 Tunnel Broker** - classic free 6in4 tunnels with a routed `/64` and optional `/48` for homelabs and experiments: [https://tunnelbroker.net](https://tunnelbroker.net).
* **Tunnelbroker\.ch (Securebit)** - an IPv6 tunnel broker with multiple European and US locations, 6in4/GRE tunnels, and options for larger prefixes and BGP for advanced users: [https://www.tunnelbroker.ch](https://www.tunnelbroker.ch).
* **NetAssist IPv6 Tunnel Broker** - a long running 6in4 tunnel service; basic tunnels are free, and you can request a BGP enabled tunnel by contacting the operator: [https://tb.netassist.ua](https://tb.netassist.ua).
* **Route64\.org** - non‑profit, free IPv6 tunnelbroker and transit, /56 per tunnel: [route64.org](https://www.route64.org/en).

Here are some tunnel brokers that also offer IPv4 addresses:

* novacloud-hosting\.com: [IPs routed through GRETAP, GRE, VXLAN and Wireguard](https://novacloud-hosting.com/ip-transit.html): Starting at 0.75 € per IP Monthly
* noez\.de: [Gre tunnel ipv4](https://noez.de/en/gre): starting at 0.50 € per IP Monthly
* coretransit\.net: [L2TP Tunnel, GRE Tunnel, Wireguard Tunnel](https://client.coretransit.net/store/standard-static-ip-anywhere): Starting from $32.00 USD Monthly

#### PPTP style tunnels and "getting an IP from the provider"

If you were online in the 1990s or early 2000s, you might remember getting your public IP address from the ISP through PPTP, the "[Point to Point Tunneling Protocol](https://en.wikipedia.org/wiki/Point-to-Point_Tunneling_Protocol)".
From the user's machine it looked like this: you clicked "connect", the PPTP tunnel came up, PPP ran inside it, and you got a public IPv4 address and a default gateway from the provider.
Your computer behaved as if it was directly on the Internet.

Conceptually this is very close to what I am doing in this post with IPv6 and WireGuard.
You create some kind of point to point tunnel, you treat the other end as your upstream, and you receive a routed address or prefix over that tunnel.

So could you recreate that 90s style setup today and use it for "teleporting" an IPv6 address into an Incus container?

In principle yes.
You could run a PPTP or other PPP based tunnel between the VPS and your home network.
The PPP daemon on the VPS side would hand out a public IPv6 address (or a small prefix) over the tunnel.
The PPP daemon at the home server would bring up a `ppp0` interface, configure that address, and use the VPS as the next hop.
Inside Incus you could either put the PPP interface directly into the container or you could route the PPP network into a bridge and attach containers there.
From the container perspective it would look very similar to your old dial up VPN: you get a single public IP and a default route through a virtual point to point link.

> PPP itself is not limited to IPv4. There is an IPv6 control protocol (IPv6CP) that can negotiate IPv6 addresses over PPP links.
> In practice, however, many older ISP deployments only used PPP for IPv4, so people sometimes associate PPP and PPTP with IPv4 only.
> On modern Linux you can use PPP for IPv6 just fine, as long as both ends are configured correctly.

However, there are several reasons why I did not use this model in my setup.

First, PPTP is considered obsolete and insecure. Its usual authentication method, MS CHAP v2, has been broken for a long time, and many operating systems have removed PPTP server side support or strongly discourage its use.
If you only want a logical point to point link and you do not care about encryption, you could in theory use PPTP without the crypto part, but then you are just reinventing a generic IP tunnel with extra steps.
If you still want encryption on top, you would end up with something like "PPTP inside WireGuard", which adds complexity without giving you any real benefit.

> Modern replacements for this style of access are usually built on L2TP, IPsec, or SSL based VPNs such as OpenVPN.
> They can still run PPP internally if they want to reuse the "dial in and get an address" model, but in a homelab you usually do not need dynamic address assignment.
> You already know exactly which IPv6 you want to route where, so static configuration is simpler and more reliable.

Second, even with a PPP or PPTP tunnel you do not escape the routing and NDP work on the VPS.
You still need to make sure that the VPS routes your `/128` or `/64` towards the tunnel interface, and you still need some form of NDP proxy so that the upstream router believes that the address lives on the VPS.
That part of the problem does not change just because you switch the tunnel technology from WireGuard to PPTP or L2TP.

Third, a PPP based design introduces more moving parts.
You need PPP daemons on both ends, authentication configuration, address pools, perhaps RADIUS integration if you want to get fancy, and you have to debug at least two protocol layers when something goes wrong.
With WireGuard you configure a static key pair, a couple of `AllowedIPs` entries and a static route for the `/128`, and you are done.

So yes, a PPTP style setup would work in theory.
You could terminate it in the container or on the home server and then attach the "forwarded" IP to the container.
For a modern IPv6 homelab, though, I would see it more as a nostalgic thought experiment than a practical solution.
WireGuard already gives you a simple, fast and secure point to point tunnel, and it works very well with static routes and Incus.
Adding a 1990s style VPN protocol on top would only make the system harder to understand and maintain, without making the "teleportation" of the IPv6 address any easier.

### Further reading

The idea of using a VPS with proper IPv6 to "fix" the IPv6 situation at home is not new.
There are several good articles which helped me refine my own setup.

Riyad Bilak describes how he used WireGuard and a VPS to connect an IPv4 only home network to the IPv6 Internet in his article [Using WireGuard to Connect my IPv4 Network to the IPv6 Internet](https://blog.bilak.info/2021/05/30/using-wireguard-to-connect-my-ipv4-network-to-the-ipv6-internet/).

* [Routing My Way Out With IPv6: IPv6-PD](https://blog.bilak.info/2022/02/28/routing-my-way-out-with-ipv6-ipv6-pd/)
* [Routing My Way Out With IPv6: NAT6](https://blog.bilak.info/2022/03/01/routing-my-way-out-with-ipv6-nat6/)
* [Routing My Way Out With IPv6: NPT6](https://blog.bilak.info/2022/04/03/routing-my-way-out-with-ipv6-npt6/)

Martin Seiferth has a detailed write up on [IPv6 Prefix Delegation via Wireguard](https://seiferma.github.io/2021/04/09/ipv6-prefix-delegation-via-wireguard) where he also routes a prefix from a VPS through a VPN into a home network and then distributes it further.

Tony Finch has a nice post titled [My wireguard IPv6 tunnel](https://dotat.at/%40/2024-04-30-wireguard.html) where he explains how he solved similar problems on a Mythic Beasts VPS and also runs into the forwarding and router advertisement interaction that I also hit.

Those posts use slightly different details and providers, but the basic goal is the same in all of them: a machine behind a tunnel should *see the world* as if it had a normal public IPv6 directly on the Internet.

If you use netcup, it is worth reading about their IPv6 design.
There are community posts and forum threads that explain that the IPv6 `/64` is switched rather than routed and that Neighbor Discovery proxying or similar tricks are needed to use more than one address reliably.

* [IPv6-Segment nutzen via Wireguard VPN](https://forum.netcup.de/administration-eines-server-vserver/vserver-server-kvm-server/15789-ipv6-segment-nutzen-via-wireguard-vpn/)
* [IPv6 Traffic forwarding geht nicht](https://forum.netcup.de/administration-eines-server-vserver/vserver-server-kvm-server/18971-ipv6-traffic-forwarding-geht-nicht/)
* [Internes IPv6 Routing per Wireguard](https://forum.netcup.de/administration-eines-server-vserver/server-konfiguration/19447-internes-ipv6-routing-per-wireguard/)

## Footnotes

[^sit]: SIT stands for Simple Internet Transition and is an earlier name for [6in4](https://en.wikipedia.org/wiki/6in4)