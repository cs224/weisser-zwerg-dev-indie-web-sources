---
layout: "layouts/post-with-toc.njk"
title: "Public IPv6 for Incus Instances on Your Home Server with the ROUTE64 Tunnel Broker"
description: "Skip the VPS: use Incus instances at home and publish selected services directly on the IPv6 internet via ROUTE64."
keywords: ROUTE64, tunnel broker, IPv6, home server, Incus, WireGuard, Debian
creationdate: 2026-01-05
date: 2026-01-05
tags: ['post']
---

## Rationale

In my recent blog post [Using a MikroTik hAP ax³ (RouterOS) and the ROUTE64 Tunnel Broker for IPv6 at Home](../mikrotik-route64-ipv6-tunnelbroker/) I showed how to get working IPv6 at home even when your ISP makes it hard (especially if you are behind carrier-grade NAT (CGNAT)).
The key idea was to use the ROUTE64 Tunnel Broker together with a MikroTik router to build a WireGuard tunnel to a ROUTE64 PoP (Point of Presence).
That tunnel gives you a public IPv6 prefix that you can use in your home network.

Later, in the section [The Easier Route - NAT66 Instead of a Tunnel Broker](../mikrotik-route64-ipv6-tunnelbroker/#the-easier-route---nat66-instead-of-a-tunnel-broker), I described a simpler approach for "general home internet": NAT66.
This set-up made day-to-day connectivity much easier for me. With NAT66 in place, I no longer needed the ROUTE64-provided prefix for my normal home devices.

That left me with an interesting opportunity: I still had free, public IPv6 space available from ROUTE64.
Instead of letting it sit unused, I want to use it for hosting.
The goal is to run selected services on my home server and make them reachable on the public IPv6 internet, without renting a VPS (virtual private server).

### What this blog post is about

This post is a practical guide to "bringing public IPv6 into Incus instances" on your home server. Concretely, I will show how to:

1. **Terminate the ROUTE64 WireGuard tunnel inside a dedicated Incus system container** (a small "gateway" container).
2. **Hand out individual public IPv6 addresses from that gateway to other Incus instances (system containers or VMs)** that should be public.
3. **Keep everything else private by default**:
   * the home server host itself
   * non-selected Incus containers
   * Docker containers and internal networks

My home server runs Debian Trixie 13.2 and I use Incus to run Linux system containers and VMs for services like an email server.
The end result should be: some containers have real public IPv6 addresses and can be reached directly from the internet, while the rest of the system stays unexposed.

### How this relates to my earlier VPS-based approach

In [Teleporting a Public IPv6 Address from Your VPS to Your Home Server](../teleporting-public-ipv6-from-vps-to-homeserver/) I already used Incus for public hosting at home, but I used a rented VPS as the "source" of the public IPv6 address.
A single routed IPv6 /128 was sent from the VPS to my home server over WireGuard, and I used it for a [Delta Chat](https://delta.chat/en) chatmail relay.

In this post, I will build the same kind of setup (public IPv6 for a container at home), but I will remove the VPS completely.
ROUTE64 becomes the upstream instead: it provides the public IPv6 space and the tunnel endpoint, and everything runs on my own hardware at home.

### Important design goals (security and isolation)

**IMPORTANT: expose only what you intend to expose.** Only selected incus instances should be reachable from the public internet. The host system and all other workloads must remain private.

**IMPORTANT: no "internal shortcuts" between public containers.** If two public incus instances talk to each other, they should do so like normal internet clients.
There should be no privileged internal network path (no shared "private LAN" between public services).
This reduces the blast radius if one container is compromised.

### High-level architecture

To keep the host clean and to make the setup easy to switch on/off, I bundle all ROUTE64-specific networking into a single "gateway" Incus container:

> ROUTE64 PoP  --(WireGuard tunnel)-->  route64-gateway container (route64-gw)

From that gateway, I connect public IPv6 addresses to specific service containers. I will show two common ways to do that:

* **veth pairs** (a virtual ethernet cable between two network namespaces)
* **bridge devices** (a virtual switch on the host)

The key benefit of the gateway container design is operational and security simplicity: ROUTE64 configuration, tunnel management, and routing rules are isolated.
If I stop that one container, all public IPv6 connectivity for hosted services disappears immediately, without touching the rest of the server.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Quick Background Review

I suggest that you quickly review the sections below from my earlier posts, especially if these topics are new to you.
They cover the networking basics that this guide builds on, and they will make the later steps easier to follow.

### ifupdown (ENI), Netplan, NetworkManager, systemd-networkd

Linux networking can be configured in several different ways, and different distributions pick different defaults.
In the section [Background: ifupdown, Netplan, NetworkManager, systemd-networkd](../teleporting-public-ipv6-from-vps-to-homeserver/#background%3A-ifupdown%2C-netplan%2C-networkmanager%2C-systemd-networkd), I give a short overview of Netplan, NetworkManager, ifupdown (also known as ENI, for "`/etc/network/interfaces`"), and systemd-networkd.

Later in this post we will mostly work with Debian Trixie 13.2 Incus instances that are provisioned with cloud-init.
In those systems, networking is typically configured with systemd-networkd, so it helps to know what it is, and where to look when something does not work as expected.

> Cloud-init's [support for Version 2 network config](https://cloudinit.readthedocs.io/en/latest/reference/network-config-format-v2.html) is a subset of the Version 2 format defined for the Netplan tool.

### IPv6 Router Advertisements (RA), DHCPv6, and (Proxy) Neighbor Discovery

The section [Detour: IPv6 Router Advertisements (RA), DHCPv6, and (Proxy) Neighbor Discovery](../teleporting-public-ipv6-from-vps-to-homeserver/#detour%3A-ipv6-router-advertisements-(ra)%2C-dhcpv6%2C-and-(proxy)-neighbor-discovery) gives additional background on IPv6, and highlights a few important differences compared to IPv4.

## Implementation

### Home Server Host Configuration

To hand out public IPv6 addresses from the gateway Incus system container to other Incus instances, we first need a reliable Layer 2 or Layer 3 connection between those instances.
In practice, that means we need some form of virtual network link on the Debian host that can connect the gateway container with the specific workload instance we want to expose.

> In this post, the Debian host is only used as the place where we *create* virtual interfaces and attach them to Incus instances.
> The host should not participate in the public IPv6 network itself.
> That separation is one of the key safety properties of this design.

#### Naming

Linux network interface names have a hard limit of 15 characters (IFNAMSIZ is 16 including the terminating null byte).
So the practical maximum length you can use is 15 characters.

To stay within that limit and still keep names readable, I use the following prefix scheme for host side devices:
* `r64ta-*` for `tap` devices
* `r64ve-*` for `veth` devices
* `r64br-*` for `bridge` devices

Later we will set up a test instance called `pub-test`. For that instance, I use short suffixes like:
* `r64br-pt` for the dedicated bridge
* `r64ve-pt-gw` for the gateway side of a `veth` pair
* `r64ve-pt-ct` for the container side of that `veth` pair

Here, `pt` stands for `pub-test`. For an Incus VM I use a similar pattern, for example:
* `r64br-vm1`
* `r64ve-vm1-gw`
* `r64ta-vm1-ct`

In this naming scheme, `gw` always refers to the gateway side and `ct` to the workload instance side.

#### `veth` Pairs

I initially used `veth` pairs. You can think of a `veth` pair as a virtual Ethernet cable: whatever enters one end comes out of the other end.
Each end is a normal Linux interface, and each end can live in a different network namespace.
That makes `veth` pairs ideal for connecting two isolated networking stacks.

You create a `veth` pair on the home server host like this:

```bash
sudo ip link add r64ve-pt-gw type veth peer name r64ve-pt-ct
sudo ip link set r64ve-pt-gw mtu 1420 up
sudo ip link set r64ve-pt-ct mtu 1420 up
# Test
ip -d link show r64ve-pt-gw
ip -d link show r64ve-pt-ct
```

If you attach these `veth` ends to Incus system containers using `nictype: physical`, Incus will move the selected host interface into the target container.
From the host point of view, that interface effectively "vanishes" because it is no longer in the host network namespace.

This is conceptually very clean. In the running system, one end of the `veth` pair is inside the gateway container and the other end is inside the workload container.
On the host, nothing remains that could accidentally pick up traffic from that link.
This makes it very unlikely that a service on the Debian host could "catch" a connection by mistake.
It also helps keep the host isolated from any public IPv6 connectivity that exists only inside Incus containers.

> This is a strong security pattern: the host creates the plumbing, but once the interfaces are moved into containers, the host has no interface on that link and cannot send or receive packets there.
> It reduces the risk of exposing host services via an unexpected IPv6 route.

However, there is one practical limitation.
This approach does not work well for Incus VMs in the same way it works for system containers.
Incus VMs use `tap` devices on the host side. The VM connects to the host networking through a `tap` interface, and that `tap` interface stays in the host root network namespace.
There is no "VM network namespace" that can absorb one end of a `veth` pair in the same way a container can.

Because I want one unified approach that works for both system containers and VMs, I decided to use bridge devices instead.

#### `bridge` Devices

A `bridge` device is a virtual switch on the host. Multiple interfaces can attach to it, and the bridge will forward Ethernet frames between them.
This is very useful when you want to connect different endpoint types, for example a gateway container connected through a `veth` interface and a VM connected through a `tap` interface, while keeping the host itself out of that network.

My approach is to create one dedicated bridge per Incus instance that should get a public IPv6 address.
This keeps the exposure explicit and contained, and it supports an important design goal from earlier: there is no shared internal "public services LAN".
Instead, each public workload gets its own small Layer 2 segment with exactly two members: the gateway container and the one workload instance that should be reachable from the internet.

It is critical that the bridge is used only for that pair.
In particular, the host must never configure an IP address on that bridge.

> On Linux, a bridge interface can exist without IPv4 or IPv6 addresses.
> In that mode, it behaves like a pure Layer 2 switch: it forwards frames, but it is not an IP endpoint.
> That is exactly what we want here.
> The bridge is only "wiring", while all public IPv6 addresses live inside the gateway container and the selected workload instance.
>
> It is worth emphasizing that the bridge itself is still a host side interface.
> The safety property comes from not assigning IP addresses on it and not attaching host workloads to it.

If the host were to attach an address to that bridge, or if host services became reachable through it, you could accidentally expose host services on the public internet.
To reduce that risk, I will later add host firewall rules that block traffic to and from these ROUTE64 facing bridge segments.

The Debian Trixie 13.2 home server host in my setup mixes two network configuration methods: `ifupdown` and NetworkManager.
When I run `nmcli device status`, I see several interfaces as `unmanaged`, especially those configured via `/etc/network/interfaces`.
So in this minimal Debian 13.2 Trixie server installation, both systems coexist.

> This coexistence is common on Debian servers.
> NetworkManager will usually leave `ifupdown` managed interfaces alone, which is why they show up as `unmanaged`.
> That is helpful here, because we can let `ifupdown` handle the "real" uplink and LAN interfaces, while NetworkManager manages only the special-purpose bridge devices used for public IPv6 containers and VMs.

I decided to set up the `bridge` devices via NetworkManager on the home server host.
NetworkManager stores connection profiles as files in `/etc/NetworkManager/system-connections/`.
Below is an example profile for `/etc/NetworkManager/system-connections/r64-br-pub-test.nmconnection`.

> The filename and the connection `id` do not have to match, but keeping them consistent makes troubleshooting easier.

```txt
[connection]
id=r64-br-pub-test
uuid=2c4eabcd-abcd-abcd-a6c6-2e3422aabcd
type=bridge
interface-name=r64br-pt
autoconnect=true

[bridge]
stp=false

[ipv4]
method=disabled

[ipv6]
method=disabled

[ethernet]
mtu=1420
```

You should ensure that ownership and access rights are correct.
NetworkManager expects these files to be readable only by root:

```bash
sudo chown root:root /etc/NetworkManager/system-connections/r64-br-pub-test.nmconnection
sudo chmod 600 /etc/NetworkManager/system-connections/r64-br-pub-test.nmconnection
```

Then bring the connection up:

```bash
sudo nmcli connection reload
sudo nmcli connection up r64-br-pub-test
# Test
nmcli connection show
nmcli device status
nmcli connection show r64-br-pub-test
ip link show r64br-pt
ip -6 addr show dev r64br-pt
```

> A quick sanity check is that `ip -6 addr show dev r64br-pt` should show no globally routed IPv6 address, because we explicitly disabled IPv6 on the bridge with `method=disabled`.
> You may still see a link local address in some setups, depending on how the interface is created and how your kernel and NetworkManager interact.
> The important part is that you do not configure any global IPv6 address on the host side bridge.

#### Host Firewall

As mentioned earlier, we will set up a small host firewall.
The purpose is simple: reduce the risk that any service running on the Debian host becomes reachable on the public internet by accident through one of the ROUTE64 facing attachment segments.

The design idea is that the host acts only as a switching and wiring layer.
The host creates bridge devices and plugs VM and container interfaces into them, but the host itself must not be able to send or receive IP traffic on those segments.

> This is a defense in depth measure.
> Even if you believe your bridge setup is correct, it is easy to make a mistake later, for example by attaching a host side service, by adding an IP address during troubleshooting, or by accidentally connecting the wrong interface to the wrong bridge.
> A host guard rule set gives you an extra safety net.

**IMPORTANT:** As a first step, edit `/etc/nftables.conf` and comment out the line `flush ruleset`.

We will use nftables for this host firewall.
When you apply rules with the `nft` command, you are modifying the same kernel ruleset that is also managed through files.
On my Debian Trixie 13.2 home server host, `iptables` is in use with an nftables backend, and services like Incus and Docker install their own rules after boot.
If you leave `flush ruleset` enabled in `/etc/nftables.conf` and then reload nftables, you risk deleting those automatically managed rules. That is not what we want.

> If that happens, the cleanest recovery is often a reboot. Alternatively, you can restart the relevant services so they recreate their rules:
> ```bash
> systemctl restart docker
> systemctl restart incus
> ```

To keep our host guard rules persistent across reboots, I split the setup into two files:

* `/etc/nftables.d/incus-veth-guard.nft` contains the rules.
* `/etc/systemd/system/incus-veth-guard.service` ensures the rules are applied at boot, after nftables is ready.

Here is `/etc/nftables.d/incus-veth-guard.nft`:
{% raw %}
```txt
# Host guard for ROUTE64 "public attachment" interfaces.
#
# Goal:
# - Host must not accept or originate traffic on ROUTE64 public attachment segments.
# - L2 bridging must continue to work for VM/container connectivity through the host bridge.
#
# Implementation:
# - r64_l2_only_ifaces: drop in INPUT/OUTPUT only.
# - r64_kill_ifaces + r64_kill_fwd_vmap: optional fail-safe that can drop in FORWARD too.

table inet incus_veth_guard {

  # L2-only devices: bridges and their Incus-created ports.
  set r64_l2_only_ifaces {
    type ifname;
    elements = {
      # pub-test segment
      "r64br-pt",
      "r64ve-pt-gw",
      "r64ve-pt-ct",
      # vm1 segment
      "r64br-vm1",
      "r64ve-vm1-gw",
      "r64ta-vm1-ct"
    }
  }

  # Optional: “kill” interfaces that should never forward on the host (kept for extensibility).
  #set r64_kill_ifaces {
  #  type ifname;
  #  elements = {
  #    # (empty for your bridge-based design)
  #    # Add names here only if you have interfaces that must be dropped in FORWARD as well.
  #  }
  #}

  # Verdict map for FORWARD drops (more scalable than repeating rules).
  #map r64_kill_fwd_vmap {
  #  type ifname : verdict;
  #  elements = {
  #    # Example:
  #    # "some-transient-iface" : drop
  #  }
  #}

  chain input {
    type filter hook input priority -50; policy accept;

    iifname @r64_l2_only_ifaces drop
    # iifname @r64_kill_ifaces drop
  }

  chain output {
    type filter hook output priority -50; policy accept;

    oifname @r64_l2_only_ifaces drop
    # oifname @r64_kill_ifaces drop
  }

  chain forward {
    type filter hook forward priority -50; policy accept;

    # Only apply FORWARD drops for explicitly “kill” interfaces (if you use them).
    # iifname vmap @r64_kill_fwd_vmap
    # oifname vmap @r64_kill_fwd_vmap
  }
}
```
{% endraw %}

> Why only `INPUT` and `OUTPUT`? Because we want bridging to keep working.
>
> A Linux bridge forwards traffic in the `FORWARD` path.
> If we were to drop packets in the `forward` chain for these interfaces, we could break connectivity between the gateway container and the workload VM or container.
> The goal is not to block traffic passing *through* the host at Layer 2.
> The goal is to block traffic that is *to* or *from* the host itself on these segments.
>
> In other words:
> * `INPUT` controls traffic destined to the host.
> * `OUTPUT` controls traffic originating from the host.
> * `FORWARD` controls traffic transiting through the host, which we want to keep for the bridge.
>
> That is also why the `forward` chain is present but empty by default. It is there as an extension point for special cases.

Here is `/etc/systemd/system/incus-veth-guard.service`:
```txt
[Unit]
Description=Block traffic on Incus public attachment interfaces if they appear on the host
After=nftables.service
Wants=nftables.service

[Service]
Type=oneshot
RemainAfterExit=yes

# Idempotent start: delete only our table if it exists, then load it
ExecStart=/bin/sh -c '/usr/sbin/nft delete table inet incus_veth_guard 2>/dev/null || true; /usr/sbin/nft -f /etc/nftables.d/incus-veth-guard.nft'

# Stop: remove only our table; 
#  Why a stop is usually undesirable here: 
#  The purpose of the guard is “fail-safe”: 
#  if either end of a public attachment appears on the host (during container stop/start, misattachment, crashes), it should be blocked.
# ExecStop=/bin/sh -c '/usr/sbin/nft delete table inet incus_veth_guard 2>/dev/null || true'

[Install]
WantedBy=multi-user.target
```

Enable the service and apply the rules:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now incus-veth-guard.service
sudo systemctl restart incus-veth-guard.service
# Test
sudo nft list table inet incus_veth_guard
```

Two practical tips:

1. Treat the interface name set as part of your operational checklist. Whenever you add a new public workload instance, add its `r64br-*`, `r64ve-*`, and `r64ta-*` names here as well.
2. If you want to verify the guard quickly, run `ip -6 route get <some-public-ipv6> oif r64br-pt` or try to `ping6` from the host with `-I r64br-pt`. It should fail because `OUTPUT` is dropped for that interface.
  * `ip link show r64br-pt`
  * `ip -6 addr show dev r64br-pt`
  * `ip -6 route get 2001:4860:4860::8888 oif r64br-pt`
  * `ping6 -I r64br-pt 2001:4860:4860::8888`

This guard does not replace a proper container firewall.
It is only meant to ensure that the Debian host remains isolated from the public IPv6 segments.

### Incus ROUTE64 Gateway System Container

If you do not have a ROUTE64 tunnel set up yet, please follow the steps described in [MikroTik Tunnelbroker with Route64](../mikrotik-route64-ipv6-tunnelbroker/#mikrotik-tunnelbroker-with-route64).

For the rest of this section, I will use the following **example values**. Replace all of them with your real values from the ROUTE64 portal:

```txt
Tunnel address      : 2a11:6c7:abcd:1000::2/64
Routed prefix       : 2a11:6c7:abcd:2000::/56
Chosen LAN /64      : 2a11:6c7:abcd:2001::/64
ROUTE64 server IP   : 165.140.142.113
ROUTE64 server port : 58140
ROUTE64 public key  : FkVCzA3bhSrqOUhXNxVHDXSLDvWHUa7BGj75uuh85TE=
Your private key    : YOUR_WG_PRIVATE_KEY
```

Below you will find the `route64-gw-profile.yml` Incus profile that provisions the gateway container.
The idea is simple: we create a dedicated profile for the ROUTE64 gateway, then launch a Debian container with that profile, and finally watch `cloud-init` configure everything.

```bash
incus profile create route64-gw-profile
incus profile edit route64-gw-profile < route64-gw-profile.yml
incus launch images:debian/trixie/cloud route64-gw --profile route64-gw-profile

# Watch the provisioning
incus exec route64-gw -- tail -f /var/log/cloud-init-output.log

# Enter the container
incus exec route64-gw -- bash

# Quick sanity checks
cloud-init status --long
cloud-init query userdata
ls -l /var/lib/cloud/instance/
```

> If you are new to the Debian "cloud" images in Incus: these images are built to be configured by `cloud-init` on first boot.
> That is why the profile contains a large `cloud-init.user-data` section.
> It is convenient here because it lets you treat the gateway container as "infrastructure as code": destroy it, re launch it, and you reliably get the same WireGuard and firewall configuration again.

Once provisioning is finished, run a few basic connectivity tests **inside the `route64-gw` container**:

```bash
ping 8.8.8.8
ping 2001:4860:4860::8888

ip link show dev eth0
ip link show dev wg0

curl -6 -v --max-time 15 https://librespeed.org/backend-servers/servers.php/.well-known/librespeed
```

At this point you should have:

* IPv4 connectivity on `eth0` (usually via DHCP from your normal LAN or Incus bridge).
* A WireGuard interface `wg0` that is up and has the IPv6 tunnel address.
* Working IPv6 connectivity through the tunnel (the `ping` to an IPv6 address should succeed).
* Successful IPv6 HTTPS traffic (the `curl -6` test).

#### Throughput sanity check with `librespeed`

Before you expose any real services, I strongly recommend a quick performance check. We do this twice:
1. On the **home server host** (your normal connectivity baseline).
2. Inside the **`route64-gw` container** (the tunnel path).

On the host, pick a server from the list. You can see the available servers with `librespeed-cli --list`. In my case, I used server number 50:

```bash
root@homeserver:~# librespeed-cli --list
# 50: Frankfurt, Germany (Clouvider) (http://fra.speedtest.clouvider.net/backend)  [Sponsor: Clouvider @ https://www.clouvider.co.uk/]

root@homeserver:~# librespeed-cli -6 --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2001:db8:dead:beef:6f4:1cff:fe82:1284 - Unknown ISP
Ping: 9.00 ms   Jitter: 0.00 ms
Download rate:  906.66 Mbps
Upload rate:    770.15 Mbps
```

Now run the same test inside the `route64-gw` container:
```bash
root@route64-gw:~# librespeed-cli -6 --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a11:6c7:abcd:1000::2 - Unknown ISP
Ping: 19.09 ms  Jitter: 0.57 ms
Download rate:  68.25 Mbps
Upload rate:    63.26 Mbps
```

A lower throughput inside the tunnel can be normal, depending on your uplink, the selected PoP, CPU limits, and encryption overhead.
The key question is not "is it as fast as my LAN", but rather "is it stable, consistent, and good enough for the services I want to host".

If the tunnel speed is unexpectedly low, check the obvious bottlenecks first:
* CPU limits for the gateway container (`limits.cpu`), because WireGuard encryption is CPU bound.
* Whether your host has AES acceleration and whether it is available inside the container context.
* The selected ROUTE64 PoP region, because long RTT will reduce TCP throughput.
* Packet loss, because even small loss rates can severely reduce a single TCP flow throughput.

A quick way to get a "feeling" for loss is to run a longer ping and watch for drops:
`ping -6 -i 0.2 -c 200 2001:4860:4860::8888`.

#### PMTU, MTU, and fragmentation black holes

If you see strange connectivity failures (for example, DNS works and small pings work, but HTTPS pages hang or downloads stall), a common root cause is an MTU mismatch that triggers a PMTU "black hole".

WireGuard over IPv4 adds encapsulation overhead. Very roughly, the overhead is:
* IPv4 header: 20 bytes
* UDP header: 8 bytes
* WireGuard data header and authentication: about 32 bytes

So, around 60 bytes total.

That means an inner packet of 1420 bytes on `wg0` becomes an outer packet of about 1480 bytes on `eth0`.
With `eth0` at the normal MTU of 1500, those 1480 byte packets fit without fragmentation, which is exactly what we want.

If you instead force `eth0` down to 1420, then the outer 1480 byte packets no longer fit.
They either fragment or get dropped.
In many home setups, fragmented UDP is fragile and drops happen silently.
The typical failure pattern looks like this:
* TCP handshake works (SYN and SYN ACK are small).
* TLS negotiation stalls (certificate flight packets can be larger).
* Some websites appear to "hang", while others work.

To confirm that MTU or PMTU is your issue, you can test with "do not fragment" pings. On Linux you can do:
* IPv6: `ping -6 -M do -s 1372 2001:4860:4860::8888   # 1420 - 48`
  * On Linux `ping -s` is ICMP payload bytes. Total IPv6 packet size is roughly: IPv6 header: 40, ICMPv6 header: 8.
  * So total ≈ 48 + payload.
  * If your egress MTU is 1420, the max payload is 1420 - 48 = 1372.
* IPv4: `ping -4 -M do -s 1472 8.8.8.8`

Increase the size until it fails. If a size that should work on a clean path fails, you likely have a PMTU problem.
Another useful tool is `tracepath6`, which tries to infer the PMTU along the path:
`tracepath6 2001:4860:4860::8888`.

#### `route64-gw-profile.yml`

This is the Incus profile used for the gateway container. It does four main jobs:
1. Install the required packages (`wireguard-tools`, `nftables`, troubleshooting tools).
2. Configure `wg0` with your ROUTE64 endpoint and tunnel address.
3. Enable IPv6 forwarding, because the gateway is a router.
4. Apply a strict firewall policy that only forwards traffic when `wg0` is involved.

```yaml
name: route64-gw-profile
description: "ROUTE64 GW container: WireGuard termination + firewall + per-container routing"
config:
  boot.autostart: "true"
  boot.autostart.priority: "100"
  security.nesting: "false"
  limits.cpu: "2"
  limits.memory: 2GiB
  limits.memory.enforce: "hard"

  # Ensure WireGuard kernel module is available inside the container.
  linux.kernel_modules: "wireguard"

  cloud-init.user-data: |
    #cloud-config
    output:
      all: '| tee -a /var/log/cloud-init-output.log'

    hostname: route64-gw

    apt:
      conf: |
        APT::Install-Recommends "0";
        APT::Install-Suggests "0";

    package_update: true
    package_upgrade: true
    packages:
      - wireguard-tools
      - nftables
      - iproute2
      - systemd-resolved
      - librespeed-cli
      - telnet
      - ca-certificates
      - curl
      - nano
      - emacs-nox
      - less
      - wajig
      - tcpdump
      - netcat-openbsd


    write_files:
      # WireGuard tunnel
      - path: /etc/wireguard/wg0.conf
        owner: root:root
        permissions: '0600'
        content: |
          [Interface]
          PrivateKey = <redacted>
          Address = 2a11:6c7:abcd:1000::2/64
          MTU = 1420

          [Peer]
          PublicKey = <redacted>
          Endpoint = 165.140.142.113:58140
          AllowedIPs = ::/1, 8000::/1
          PersistentKeepalive = 15

      # Ensure forwarding is on (GW is a router) and do not accept RA anywhere.
      - path: /etc/sysctl.d/99-route64-gw.conf
        owner: root:root
        permissions: '0644'
        content: |
          net.ipv6.conf.all.forwarding=1
          net.ipv6.conf.default.forwarding=1
          net.ipv6.conf.all.accept_ra=0
          net.ipv6.conf.default.accept_ra=0

      # UPDATED: route is managed by networkd now (no per-container systemd unit needed).
      - path: /etc/systemd/network/60-pub-test0.network
        owner: root:root
        permissions: '0644'
        content: |
          [Match]
          Name=pub-test0

          [Link]
          MTUBytes=1420

          [Network]
          LinkLocalAddressing=ipv6
          IPv6AcceptRA=no
          Address=fe80::1/64

          [Route]
          Destination=2a11:6c7:abcd:2001::2/128

      - path: /etc/nftables.d/route64-gw.nft
        owner: root:root
        permissions: '0644'
        content: |
          # /etc/nftables.d/route64-gw.nft
          #
          # ROUTE64 gateway policy:
          # - default deny
          # - only forward traffic when wg0 is involved (no privileged east-west)
          # - allow outbound from selected public downstream ifaces to wg0
          # - allow inbound from wg0 to selected downstream ifaces only for selected /128s and ports
          # - anti-spoof: each downstream iface may only source its assigned /128

          table inet route64_gw {

            ############################
            # Public endpoints inventory
            ############################

            # Downstream interfaces inside the GW container that lead to “public instances”
            # (one per instance: pub-test0, pub-web0, ...)
            set pub_ifaces {
              type ifname;
              elements = { "pub-test0" }
            }

            # The set of public /128 addresses you route to those interfaces
            set pub_v6 {
              type ipv6_addr;
              elements = { 2a11:6c7:abcd:2001::2 }
            }

            # Per-interface anti-spoof inventory: downstream iface + its allowed source /128
            set pub_src_pairs {
              type ifname . ipv6_addr;
              elements = {
                "pub-test0" . 2a11:6c7:abcd:2001::2
              }
            }


            # Allowed inbound TCP ports from the Internet to public endpoints
            set pub_in_tcp_ports {
              type inet_service;
              elements = { 22 }   # extend: { 22, 80, 443 }
            }

            ############################
            # INPUT: protect the gateway
            ############################
            chain input {
              type filter hook input priority 0;
              policy drop;

              iifname "lo" accept

              ct state established,related accept
              ct state invalid drop

              # Essential ICMPv6 to the gateway itself (ND/PMTUD/errors/echo)
              ip6 nexthdr icmpv6 accept

              # Optional: allow SSH to the gateway from its mgmt side if needed
              # iifname "eth0" tcp dport 22 accept
            }

            ############################
            # FORWARD: routing policy
            ############################
            chain forward {
              type filter hook forward priority 0;
              policy drop;

              ct state established,related accept
              ct state invalid drop

              # Enforce "no privileged east-west": only forwarding involving wg0
              iifname != "wg0" oifname != "wg0" drop

              # ICMPv6 is required for PMTUD and error propagation; safe because of wg0 constraint above
              ip6 nexthdr icmpv6 accept

              # Outbound: public instance -> Internet.
              # Anti-spoofing: the tuple (incoming iface, source address) must be in pub_src_pairs.
              iifname @pub_ifaces oifname "wg0" iifname . ip6 saddr != @pub_src_pairs drop
              iifname @pub_ifaces oifname "wg0" accept

              # Inbound: Internet -> public instance:
              #  - must target one of our public /128s
              #  - must be destined to one of the downstream interfaces
              #  - must be an allowed TCP port (or allow all L4 if you prefer)
              # iifname "wg0" oifname @pub_ifaces ip6 daddr @pub_v6 tcp dport @pub_in_tcp_ports accept

              # If you want to allow all inbound traffic to those /128s (not recommended), use:
              iifname "wg0" oifname @pub_ifaces ip6 daddr @pub_v6 accept
            }
          }

      # Make wg-quick wait for network online (eth0 is not required for wg0, but this avoids races).
      - path: /etc/systemd/system/wg-quick@wg0.service.d/override.conf
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Wants=network-online.target
          After=network-online.target

      # Single unit: apply routes + unreachable + nft rules (idempotent) after wg0 is up.
      - path: /etc/systemd/system/route64-gw-init.service
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=ROUTE64 GW: routes + unreachable + firewall
          Wants=wg-quick@wg0.service
          After=wg-quick@wg0.service

          [Service]
          Type=oneshot
          ExecStart=/bin/sh -c '\
            /usr/sbin/nft -f /etc/nftables.d/route64-gw.nft && \
            /sbin/ip -6 route replace 2000::/3 dev wg0 metric 10 && \
            /sbin/ip -6 route replace unreachable 2a11:6c7:abcd:2000::/56 metric 500 \
          '
          RemainAfterExit=yes

          [Install]
          WantedBy=multi-user.target

    runcmd:
      # Ensure systemd-resolved is actually used
      - [ systemctl, enable, --now, systemd-resolved ]
      - [ ln, -sf, /run/systemd/resolve/stub-resolv.conf, /etc/resolv.conf ]

      # Ensure networkd is enabled (cloud image typically already does this, but keep explicit)
      - [ systemctl, enable, --now, systemd-networkd ]

      # Ensure correct configuration of pub-test0
      - [ networkctl, reload ]
      - [ networkctl, reconfigure, pub-test0 ]

      - [ sysctl, --system ]
      - [ systemctl, daemon-reload ]

      - [ systemctl, enable, --now, wg-quick@wg0.service ]
      - [ systemctl, enable, --now, route64-gw-init.service ]

  cloud-init.network-config: |
    version: 2
    ethernets:
      eth0:
        dhcp4: true
        dhcp6: false
        accept-ra: no
        # mtu: 1420 # remove the mtu: 1420 on eth0 entirely (or set it to 1500), and keep wg0 at 1420.

devices:
  root:
    type: disk
    pool: default
    path: /
    size: 8GiB

  # Management NIC on your Incus bridge (optional but recommended for manageability)
  eth0:
    type: nic
    network: incusbr0
    name: eth0

  # UPDATED: downstream NIC is now bridged onto NM-managed bridge r64br-pt
  pub-test0:
    type: nic
    nictype: bridged
    parent: r64br-pt
    host_name: r64ve-pt-gw
    name: pub-test0
    mtu: 1420
```

The `pub-test0` interface is a "downstream" interface inside the gateway container.
It is the attachment point where you later connect a public facing instance (a system container or VM).
In this example, it is bridged to a host side Linux bridge named `r64br-pt`.
That host bridge is not created by Incus automatically.
We created it earlier on the host with NetworkManager.
The important part is that `r64br-pt` exists on the host and provides a Layer 2 segment between the gateway and the public instance you want to attach.

#### `systemd-networkd` and `cloud-init.network-config`

You may notice that the network configuration is spread across three places:

1. The `devices` section in the Incus profile, which defines which interfaces exist in the container and how they connect to the host.
2. The `cloud-init.network-config` section, which tells `cloud-init` how to generate baseline network configuration for the container at first boot.
3. The explicit `systemd-networkd` files in `/etc/systemd/network/`, such as `/etc/systemd/network/60-pub-test0.network`.

This split is intentional. Each layer has a different job.

Debian Trixie cloud images typically use `systemd-networkd` as their network backend, and `cloud-init` generates `.network` units for it (for example `10-cloud-init-eth0.network`).
`systemd-networkd` is part of the standard `systemd` package, so you do not install it separately, but you may still want to explicitly enable it as done in `runcmd`.

I use the following convention in this setup:

* The gateway container's "management" interface (`eth0`) is configured via `cloud-init.network-config`. That keeps the basics (DHCPv4, no IPv6 RA) in one place and matches how cloud images expect to be configured.
* Any additional interfaces that exist to route public IPv6 to downstream instances (such as `pub-test0`, later maybe `pub-web0`) are configured with explicit files in `/etc/systemd/network/`. This gives you fine control over MTU, link local behavior, and static routes.

If you later add another public instance, you would typically:

1. Add another bridged device in the Incus profile, for example `pub-web0`.
2. Add another `systemd-networkd` unit file, for example `/etc/systemd/network/61-pub-web0.network`, matching that interface name.
3. Extend the firewall inventory in `/etc/nftables.d/route64-gw.nft` so the new interface and its public `/128` are allowed exactly as intended.

> This "inventory style" firewall configuration is deliberate.
> It is more verbose than a permissive ruleset, but it scales cleanly as you add more public instances.
> You are forced to explicitly list:
> * which downstream interfaces exist,
> * which public IPv6 addresses are routed to them, and
> * which inbound ports (if any) you accept.
>
> That is a good default posture for home hosting, because it makes accidental exposure less likely.

### Incus Workload System Container with a Public IPv6 Address

Now we provision a simple Incus system container that will be reachable from the public IPv6 internet.
We will use it as a "workload" test instance to confirm that routing, firewalling, and MTU settings are correct before you put real services on this setup.

Further down, you will find the full `route64-public-test-profile.yml` profile.
The profile approach keeps the container definition reproducible and makes it easy to spin up more public containers later.


```bash
incus profile create route64-public-test-profile
incus profile edit route64-public-test-profile < route64-public-test-profile.yml
incus launch images:debian/trixie/cloud pub-test --profile route64-public-test-profile

# Watch the provisioning
incus exec pub-test -- tail -f /var/log/cloud-init-output.log

# Enter the container
incus exec pub-test -- bash

# Quick sanity checks
cloud-init status --long
cloud-init query --list-keys 
cloud-init query userdata
ls -l /var/lib/cloud/instance/
ls -l /run/cloud-init/
sshd -T | egrep -i 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|usepam'
```

> If `tail -f /var/log/cloud-init-output.log` fails because the file does not exist yet, just retry after a few seconds.
> Cloud-init creates it only after it starts writing output.
> You can also run `cloud-init status --wait` to block until the initial run is done.

As a first test, verify that the container uses the public IPv6 address you assigned to it. The simplest check is to ask an external service what IPv6 address it sees:

```bash
curl -6 https://ifconfig.co
2a11:6c7:abcd:2001::2
```

This test confirms outbound connectivity and also confirms that your egress traffic leaves through the ROUTE64 path, not through your normal home NAT66 path.
If you get no output, check DNS and routing inside the container with `resolvectl status`, `ip -6 addr`, and `ip -6 route`.

#### Throughput Sanity Check with `librespeed`

Next, do a quick performance check from the workload container. This is a good way to spot MTU or packet loss problems early:

```bash
root@pub-test:~# librespeed-cli -6 --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a11:6c7:abcd:2001::2 - Unknown ISP
Ping: 19.27 ms  Jitter: 0.33 ms
Download rate:  72.55 Mbps
Upload rate:    62.30 Mbps
```

The numbers should be in the same "ballpark" as your earlier test from the gateway container. Small differences are normal.

#### Workload System Container Reachability Tests

Outbound connectivity is only half the story. Next, verify inbound reachability of the container's public IPv6 address.

Try to ping the container from another machine. This can be a host in your LAN, or a VPS you can access:

```bash
me@vps:~$ ping -i 0.2 -c 3 2a11:6c7:abcd:2001::2
PING 2a11:6c7:abcd:2001::2 (2a11:6c7:abcd:2001::2) 56 data bytes
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=1 ttl=54 time=33.7 ms
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=2 ttl=54 time=31.4 ms
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=3 ttl=54 time=33.4 ms

--- 2a11:6c7:abcd:2001::2 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 402ms
rtt min/avg/max/mdev = 31.426/32.841/33.667/1.005 ms
```

Now we simulate a simple TCP service on the workload container.
In the following tests, we use `nc` (netcat) in two different modes: first as a simple TCP server (listener), then as a TCP client to verify connectivity.

On `pub-test`, start a temporary listener on a port that you know is not blocked on the client side (for example `2222`):
```bash
nc -6 -lvn 2222
```

> This starts a TCP listener on an IPv6 socket.
> * `-6` forces IPv6.
> * `-l` means "listen", so `nc` waits for incoming connections instead of connecting out.
> * `-v` enables verbose output, which is useful to see connection details.
> * `-n` disables DNS lookups. This avoids delays and keeps the output consistent.

Then, from another machine (again, ideally a VPS for a true outside-in test), try to connect to that port:
```bash
nc -6 -vz -w3 2a11:6c7:abcd:2001::2 2222
```

This performs a client-side connectivity test against a remote IPv6 address and port.
* `-6` forces IPv6.
* `-v` enables verbose output, so you get a clear “succeeded” or error message.
* `-z` enables "zero I/O mode". Netcat connects and reports success or failure, but does not send data. This is ideal for port checks.
* `-w3` sets a 3 second timeout for the connection attempt. Without this, failures can take much longer to return.
* `2a11:6c7:abcd:2001::2` is the target IPv6 address.
* `2222` is the target TCP port.

> A successful `nc -vz` only proves that something accepted the TCP handshake on that port. It does not prove that an application protocol works correctly. For deeper testing, you can omit `-z` and actually exchange bytes, for example by typing into the client and watching the listener side.

If this connection works, you have proven that your public IPv6 address is routed correctly to the container and that your inbound rules allow the traffic you expect.

If ping works but TCP does not, the most likely cause is firewall policy, either in the gateway container, on your host, or inside the workload container (if you enabled a local firewall).
When debugging, it helps to capture packets on both ends:

* On the workload container: `tcpdump -n -i pub0 port 2222`
* On the gateway interface facing the bridge segment: `tcpdump -n -i <gw-iface> port 2222`

Seeing SYN packets arrive (or not arrive) will usually tell you where the drop happens.

#### `route64-public-test-profile.yml`

```yaml
name: route64-public-test-profile
description: "Public test container: single /128 on dedicated bridge segment to route64-gw"
config:
  boot.autostart: "true"
  boot.autostart.priority: "20"
  security.nesting: "false"
  limits.cpu: "1"
  limits.memory: 1GiB
  limits.memory.enforce: "hard"

  cloud-init.user-data: |
    #cloud-config
    output:
      all: '| tee -a /var/log/cloud-init-output.log'

    hostname: pub-test

    package_update: true
    package_upgrade: true

    apt:
      conf: |
        APT::Install-Recommends "0";
        APT::Install-Suggests "0";
    
    packages:
      - openssh-server
      - ca-certificates
      - curl
      - iproute2
      - systemd-resolved
      - nftables
      - librespeed-cli
      - telnet
      - nano
      - emacs-nox
      - less
      - wajig
      - tcpdump
      - netcat-openbsd

    ssh_pwauth: false
    disable_root: true

    users:
      - name: admin
        groups: [sudo]
        shell: /bin/bash
        sudo: "ALL=(ALL) NOPASSWD:ALL"
        lock_passwd: true
        ssh_authorized_keys:
          - ssh-ed25519 AAAA...fp me@home

    # bootcmd runs every boot (module frequency always): https://cloudinit.readthedocs.io/en/latest/reference/modules.html
    bootcmd:
      - mkdir -p /etc/ssh/sshd_config.d

    write_files:
      # Restore a Debian-like include-based layout (your image currently lacks this)
      - path: /etc/ssh/sshd_config
        owner: root:root
        permissions: '0644'
        content: |
          # Managed by cloud-init
          Include /etc/ssh/sshd_config.d/*.conf

      # Enforce your actual policy (name it early so it wins)
      # Also note: OpenSSH uses the first value it sees for most keywords. 
      #  So if you need to override something cloud-init might write in 50-cloud-init.conf, name yours earlier (e.g., 01-hardening.conf).
      - path: /etc/ssh/sshd_config.d/00-hardening.conf
        owner: root:root
        permissions: '0644'
        content: |
          PermitRootLogin no
          PubkeyAuthentication yes
          PasswordAuthentication no
          KbdInteractiveAuthentication no
          UsePAM yes

      # Persistent local overrides for cloud-init generated networkd unit
      # Alternative: full replacement via earlier .network file: 
      #  If you prefer a full replacement rather than overrides, systemd-networkd applies the first matching .network file in alphanumeric order, and ignores later matches.
      #  That means you can create something like /etc/systemd/network/05-pub0.network and systemd-networkd will ignore 10-cloud-init-pub0.network.
      - path: /etc/systemd/network/10-cloud-init-pub0.network.d/99-local.conf
        owner: root:root
        permissions: '0644'
        content: |
          # Local overrides for pub0 (not managed by cloud-init).
          # Put manual changes here instead of editing 10-cloud-init-pub0.network.
          [Network]
          #DNS=2606:4700:4700::1111
          #DNS=2001:4860:4860::8888

      # Optional: a minimal local firewall for defense-in-depth (recommended).
      # Keep it empty for now if you want; the GW already enforces inbound policy.
      - path: /etc/nftables.d/local.nft
        owner: root:root
        permissions: '0644'
        content: |
          # nft delete table inet local
          # nft -f /etc/nftables.d/local.nft
          # nft list table inet local
          table inet local {
            chain input {
              type filter hook input priority 0;
              policy drop;

              iifname "lo" accept

              ct state established,related accept
              ct state invalid drop

              # Essential ICMPv6 (ND/PMTUD/errors/echo)
              ip6 nexthdr icmpv6 accept

              # SSH
              tcp dport { 22, 80, 443, 1000-3000 } accept
            }
          }

      - path: /etc/systemd/system/local-firewall.service
        owner: root:root
        permissions: '0644'
        content: |
          [Unit]
          Description=Local nftables firewall (defense-in-depth)
          After=network-online.target
          Wants=network-online.target

          [Service]
          Type=oneshot
          ExecStart=/usr/sbin/nft -f /etc/nftables.d/local.nft
          RemainAfterExit=yes

          [Install]
          WantedBy=multi-user.target

    # runcmd is first boot only (once-per-instance): https://cloudinit.readthedocs.io/en/latest/reference/modules.html
    runcmd:
      - [ usermod, -p, '*', admin ] # Lock password login but keep key-based SSH (set password hash to '*')    
      - [ systemctl, enable, --now, systemd-resolved ]
      - [ ln, -sf, /run/systemd/resolve/stub-resolv.conf, /etc/resolv.conf ]
      - [ systemctl, enable, --now, systemd-networkd ]
      - [ systemctl, daemon-reload ]
      - [ systemctl, enable, --now, local-firewall.service ]
      - [ sh, -c, 'systemctl reload ssh || systemctl restart ssh' ]
      - [ sh, -c, 'printf "%s\n" "network: {config: disabled}" > /etc/cloud/cloud.cfg.d/99-disable-cloud-init-network.cfg' ]


  cloud-init.network-config: |
    version: 2
    ethernets:
      pub0:
        dhcp4: false
        dhcp6: false
        accept-ra: no
        mtu: 1420
        addresses:
          - 2a11:6c7:abcd:2001::2/128
        routes:
          - to: "::/0"
            via: "fe80::1"
            # on-link: true # unsupported by the cloud-init subset of netplan
        nameservers:
          addresses:
            - 2606:4700:4700::1111
            - 2001:4860:4860::8888

devices:
  root:
    type: disk
    pool: default
    path: /
    size: 8GiB

  # UPDATED: bridged NIC onto the NM-managed bridge segment r64br-pt
  # Host-side port name kept <= 15 chars.
  pub0:
    type: nic
    nictype: bridged
    parent: r64br-pt
    host_name: r64ve-pt-ct
    name: pub0
    mtu: 1420
```

Two details in this profile are worth calling out:

First, the container gets a single `/128` address. This is intentional.
It keeps the routing model simple: one public address is "owned" by one container, and nothing else shares that L2 segment unless you explicitly add it.

Second, the default route uses a link local next hop (`fe80::1`).
This only works if your gateway side is configured to have that link local address on the same bridge segment.

## Conclusion

This concludes our practical guide to bringing public IPv6 into Incus instances on a home server.
You now have a clean setup where a dedicated gateway container terminates the ROUTE64 WireGuard tunnel, and only the instances you explicitly choose receive public IPv6 addresses.

With this design, you can host selected services at home and make them reachable on the public IPv6 internet, without renting a VPS (a virtual private server).
Just as importantly, the default remains private: the host system stays unexposed, and non selected containers, VMs, and internal Docker networks do not become reachable by accident.

The same idea can also work for public IPv4 if you use a tunnel broker that routes IPv4 space to you.
For example, [novacloud-hosting.com](https://novacloud-hosting.com) offers IPv4 transit where IPs are routed through GRETAP, GRE, VXLAN, and WireGuard, starting at 0.75 € per IPv4 address per month (as of beginning 2026).
See their offer here: [https://novacloud-hosting.com/ip-transit.html](https://novacloud-hosting.com/ip-transit.html).

## Appendix

### No SSH Connectivity

At this point I still have one problem, and it looks like it might be upstream at ROUTE64.
I cannot connect to SSH on port 22 on the `pub-test` container, even though other TCP ports work.

To debug this cleanly, I first remove all firewall rules on every hop that could possibly drop the traffic.
The goal is to get to a state where the only remaining variables are routing and upstream filtering.

> Disabling firewalls for a short test like this is useful because it separates two kinds of problems:
>
> * Local problems, for example nftables rules that accidentally block inbound traffic.
> * Upstream problems, for example filtering before packets even reach your tunnel endpoint.
>
> Once you have proof that packets do or do not arrive at the tunnel interface, you can re enable the firewalls with much more confidence.


#### Step 1: Temporarily disable firewalling everywhere

1. On the home server host, remove the Incus veth guard table:
   ```bash
   root@homeserver:~# nft delete table inet incus_veth_guard
   root@homeserver:~# nft list table inet incus_veth_guard
   root@homeserver:~# nft list ruleset | grep inet
   # Turn on again:
   root@homeserver:~# systemctl restart incus-veth-guard.service
   ```
2. On the `route64-gw` instance, stop its init service and remove the gateway nftables table:

   ```bash
   root@homeserver:~# incus exec route64-gw -- bash
   root@route64-gw:~# systemctl stop route64-gw-init.service
   root@route64-gw:~# nft delete table inet route64_gw
   root@route64-gw:~# nft list table inet route64_gw
   # Turn on again:
   root@route64-gw:~# systemctl start route64-gw-init.service
   ```
3. On the `pub-test` instance, stop the local firewall service and remove its nftables table:
   ```bash
   root@homeserver:~# incus exec pub-test -- bash
   root@pub-test:~# systemctl stop local-firewall.service
   root@pub-test:~# nft delete table inet local
   root@pub-test:~# nft list table inet local
   # Turn on again:
   root@pub-test:~# systemctl start local-firewall.service
   ```

#### Step 2: Replace SSH with a minimal TCP listener

Next, I stop the SSH daemon on `pub-test` and replace it with a netcat listener.
This removes SSH configuration as a factor and leaves only plain TCP reachability:

```bash
root@pub-test:~# systemctl stop ssh
root@pub-test:~# nc -6 -lvn 22
```

> Using netcat here is a simple but powerful trick. If a TCP SYN reaches the container, netcat will accept it.
> If nothing reaches the container at all, you will not see any connection, which strongly points to filtering or routing earlier in the path.

#### Step 3: Test from outside

From another machine, ideally a VPS for a true outside in test, I try to connect to the container's public IPv6 address on port 22:

```bash
me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 22
nc: connect to 2a11:6c7:abcd:2001::2 port 22 (tcp) timed out: Operation now in progress
```

#### Step 4: Capture traffic on the gateway

Now open two terminals on the route64 gateway container and run two `tcpdump` captures.

The first capture monitors the outer tunnel transport on `eth0`.
On this interface you should at least see periodic WireGuard keepalives (typically every 15 seconds), and you should also see encapsulated tunnel packets when there is real traffic:

```bash
root@route64-gw:~# tcpdump -ni eth0 "udp and port 58140"
```

The second capture monitors the decrypted traffic on the tunnel interface `wg0`.
I filter for TCP port 22 and TCP port 2222 so that I can compare a failing connection attempt (22) with a working one (2222):

```bash
root@route64-gw:~# tcpdump -ni wg0 'tcp port 22 or tcp port 2222'
```

> These two captures answer two different questions:
> * `eth0` (outer UDP) tells you whether any tunnel traffic is happening at all for a given test.
> * `wg0` (inner IPv6) tells you whether the specific TCP SYN packets actually arrive through the tunnel.
>
> If you see traffic on `eth0` but nothing on `wg0`, the tunnel might be up but routing might be wrong.
> If you see nothing on both for a specific destination port, that often means the packets never reached your tunnel endpoint in the first place.

#### What I observe

##### Outer tunnel traffic on `eth0`

Here is what I see on the outer tunnel:

```bash
root@route64-gw:~# tcpdump -ni eth0 "udp and port 52929"
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on eth0, link-type EN10MB (Ethernet), snapshot length 262144 bytes
14:37:27.561665 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 32
14:37:42.669481 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 32
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 22
14:37:57.769600 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 32
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 22
14:38:12.873632 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 32
14:38:12.873787 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 148
14:38:12.889092 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 92
14:38:12.889335 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 32
14:38:27.924819 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 32
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 2222
14:38:29.838319 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 112
14:38:29.838640 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 112
14:38:29.868946 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 112
14:38:29.869011 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 112
14:38:29.870146 IP 10.248.99.209.35377 > 165.140.142.113.58140: UDP, length 112
14:38:29.903499 IP 165.140.142.113.58140 > 10.248.99.209.35377: UDP, length 112
```

The key detail for me is the contrast: when I test port 22, I do not see any burst of tunnel traffic that would match a TCP SYN reaching the gateway.
When I test port 2222, I immediately see additional UDP packets on the outer tunnel.

##### Inner tunnel traffic on `wg0`

Here is what I see on the decrypted TCP traffic:

```bash
root@route64-gw:~# tcpdump -ni wg0 'tcp port 22 or tcp port 2222'
tcpdump: verbose output suppressed, use -v[v]... for full protocol decode
listening on wg0, link-type RAW (Raw IP), snapshot length 262144 bytes
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 22
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 22
# me@vps:~$ nc -6 -vz -w3 2a11:6c7:abcd:2001::2 2222
14:38:29.838457 IP6 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340 > 2a11:6c7:abcd:2001::2.2222: Flags [S], seq 2262543438, win 65280, options [mss 1360,sackOK,TS val 1053821553 ecr 0,nop,wscale 7], length 0
14:38:29.838543 IP6 2a11:6c7:abcd:2001::2.2222 > 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340: Flags [S.], seq 4224223900, ack 2262543439, win 64704, options [mss 1360,sackOK,TS val 2787236864 ecr 1053821553,nop,wscale 7], length 0
14:38:29.869112 IP6 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340 > 2a11:6c7:abcd:2001::2.2222: Flags [.], ack 1, win 510, options [nop,nop,TS val 1053821586 ecr 2787236864], length 0
14:38:29.869112 IP6 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340 > 2a11:6c7:abcd:2001::2.2222: Flags [F.], seq 1, ack 1, win 510, options [nop,nop,TS val 1053821586 ecr 2787236864], length 0
14:38:29.869385 IP6 2a11:6c7:abcd:2001::2.2222 > 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340: Flags [F.], seq 1, ack 2, win 506, options [nop,nop,TS val 2787236894 ecr 1053821586], length 0
14:38:29.903630 IP6 2001:db8:dead:beef:6f4:1cff:fe82:1284.33340 > 2a11:6c7:abcd:2001::2.2222: Flags [.], ack 2, win 510, options [nop,nop,TS val 1053821619 ecr 2787236894], length 0
```

For port 22 there is simply nothing. No SYN packets appear on `wg0`.
For port 2222, I can see a normal TCP handshake.

##### What the container itself sees

On the `pub-test` instance, netcat confirms the same story. Port 22 never receives a connection, but port 2222 does:

```bash
root@pub-test:~# nc -6 -lvn 22
Listening on :: 22
^C
root@pub-test:~# nc -6 -lvn 2222
Listening on :: 2222
Connection received on 2001:db8:dead:beef:6f4:1cff:fe82:1284 33340
```

#### Interpretation

Putting these observations together:

* When I try to connect to port 22, no corresponding TCP traffic appears on the inner `wg0` interface.
* Even on the outer `eth0` interface, I do not see a tunnel traffic burst that would match a forwarded TCP SYN for port 22.
* When I connect to port 2222, I immediately see both outer UDP tunnel activity and inner TCP packets on `wg0`, and the container accepts the connection.

So the problem is not that `pub-test` refuses SSH.
The traffic does not even reach the tunnel, at least not in a way that reaches my gateway.

> This kind of behavior is consistent with upstream filtering on specific destination ports.
> Port 22 is heavily scanned on the internet, so some providers apply additional filtering or abuse mitigation policies.
> That said, I do not know whether ROUTE64 does this, whether it is specific to a particular hub, or whether something else along the path triggers it.

#### Asking the ROUTE64 community

Based on the evidence above, I reported the issue in the ROUTE64 Discord community:

> Hi all, I am new to Route64 and I spent quite some time debugging why I cannot connect to port 22 on a Route64 IPv6 address, while I can connect to other ports, for example 80, 443, and 2222.
> I can work around it by running SSH on a different port, but I was wondering whether this is documented somewhere.
>
> More context: I set up the Route64 WireGuard tunnel on one machine.
> The tunnel provides a public /56 IPv6 network, and I route a single /128 from that /56 to another virtual machine.
> On that VM I run services like SSH (22) and web (80, 443).
> As a test I also listened on port 2222 via netcat.
> I can connect to the /128 on ports 80, 443, and 2222, but not 22.
> If I capture at the WireGuard level (outer UDP and inner wg0), I see that connection attempts to port 22 do not even create tunnel traffic.
> That suggests upstream filtering before packets reach my tunnel endpoint.

One helpful person replied that SSH on port 22 works for them on the `fra2.de` hub, which is the same hub I am using.
From that perspective, it does not look like a global ROUTE64 limitation, but rather something specific to my setup or my account, or possibly a subtle routing or policy detail at the upstream side.

If you have ideas on what else to test, or if you have seen similar port specific filtering with ROUTE64 or other tunnel brokers, please leave a comment below.

### Resolving the SSH Connectivity Issue

I recreated the ROUTE64 tunnel setup by deleting my existing tunnel on the `fra2.de` hub and then creating a new one on the `fra3.de` hub, following the steps from [MikroTik Tunnelbroker with Route64](../mikrotik-route64-ipv6-tunnelbroker/#mikrotik-tunnelbroker-with-route64).

After deleting and recreating the tunnel, the only thing that changed was the WireGuard configuration.
The allocated IPv6 space stayed the same.
In practice, this meant I only had to do a small update in `route64-gw-profile.yml` so that the generated `/etc/wireguard/wg0.conf` inside the gateway container matched the new tunnel settings.

> It seems that ROUTE64 typically assigns you an IPv6 prefix that is independent from a specific PoP.
> When you move from one hub to another, you usually keep the same routed prefix, but your WireGuard peer information changes.

Once I recreated both the gateway container and the test workload container, I could reach port 22 on the workload container from the outside.
I verified this by connecting over SSH from an external VPS to the public IPv6 address of the Incus instance.

This strongly suggests the issue was upstream, related to the `fra2.de` tunnel path, because I did not change anything else besides switching to the new tunnel configuration.

The `librespeed-cli` test also improved considerably:
```bash
root@pub-test:~# librespeed-cli -6 --server 50
Retrieving server list from https://librespeed.org/backend-servers/servers.php
Selected server: Frankfurt, Germany (Clouvider) [fra.speedtest.clouvider.net]
Sponsored by: Clouvider @ https://www.clouvider.co.uk/
You're testing from: 2a11:6c7:abcd:2001::2 - Unknown ISP
Ping: 19.91 ms  Jitter: 0.18 ms
Download rate:  373.37 Mbps
Upload rate:    477.80 Mbps
```

To further confirm stability, I repeated the external ping test. This time, it looked very consistent:
```bash
me@vps:~$ ping -i 0.2 -c 100 2a11:6c7:abcd:2001::2
PING 2a11:6c7:abcd:2001::2 (2a11:6c7:abcd:2001::2) 56 data bytes
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=1 ttl=50 time=22.6 ms
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=2 ttl=50 time=22.6 ms
...
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=99 ttl=50 time=22.5 ms
64 bytes from 2a11:6c7:abcd:2001::2: icmp_seq=100 ttl=50 time=23.6 ms

--- 2a11:6c7:abcd:2001::2 ping statistics ---
100 packets transmitted, 100 received, 0% packet loss, time 19889ms
rtt min/avg/max/mdev = 22.380/23.149/25.835/0.564 ms
```

Overall, moving the tunnel from `fra2.de` to `fra3.de` seems to have improved the setup across the board.
