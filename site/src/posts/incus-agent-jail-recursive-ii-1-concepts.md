---
layout: "layouts/post-with-toc.njk"
title: "Incus Recursive Jail for Codex Coding Agent"
description: "A system for recursive Incus-based host-like environments, motivated by safer AI-agent jails, reducing 'Supply Chain Attack' risk, but also acting as a broader infrastructure pattern for isolated development and operations environments."
seodescription: "Use recursive Incus as an infrastructure pattern for safer AI-agent jails, lower supply chain attack risk, and reproducible isolated hosts."
creationdate: 2026-05-12
keywords: codex, claude code, ai agents, ai coding agents, supply chain attacks, shadow ai, incus, system containers, sandboxing, recursive containers, ipv6, ipv4, dns, mkcert
date: 2026-05-12
tags: ['post']
---

## Rationale

In the previous article, [Incus System Container Jail for the Codex Coding Agent](../incus-codex-jail), I created a [first](../incus-codex-jail/#agent-jail-profile.yaml) and a [second](../incus-codex-jail/#agent-jail-recursive-profile.yaml) version of an Incus agent jail.

These first attempts are promising, and they do work well in practice.
However, they are still too limited for some of the things I want to achieve next.

The first and second versions mainly focused on reducing security risk by running a coding agent inside a jail.
That is still one of the key goals of the version described here, but I now think this goal is too narrow.

If I can build a recursive Incus structure, the same idea becomes useful for many other scenarios.
For example, it could support blue-green deployments, backup and restore testing, and the segmentation of services on a [home server](../home-server-infrastructure/) into related groups.
Each group could then be managed almost like an independent machine.

By "recursive Incus structure", I mean a setup where one Incus container can run Incus again and can start its own child containers.
In other words, the outer host starts a container, and that container becomes a smaller host for more containers below it.

One concrete problem appeared when I used the improved second profile, `agent-jail-recursive-profile.yaml`, while developing [Web Application Architecture Experiment: FastHTML Plus](../software-engineering-fasthtml-plus).
I could do the development work inside the jail, but the setup broke when I used the Incus-based integration test environment.

That integration test environment starts an Incus child container inside the `agent-jail` container.
The child container is named `itest`.
Starting the container works.
The problem is what happens afterwards.
I cannot easily test the deployed application from the real host system, because the host has no direct network route to this child container.
DNS is also not integrated, so I cannot open the application by typing a normal URL into my browser.
In addition, the `mkcert` certificates generated inside the nested environment are not valid from the host.

The goal of this improved version is to make it possible to start an arbitrarily deep hierarchy of hierarchy-aware Incus containers.
From a developer perspective, each level should feel almost like working directly on the real host.
From the outer host, I should be able to reach any container in the hierarchy through normal IPv6 networking, DNS names, and valid `mkcert` certificates.

This is why running [fasthtml-plus](https://github.com/cs224/fasthtml-plus) at any level of the hierarchy is the main validation test.
It should work as if I were developing directly on the host.
The second validation test is SSH access.
I want to SSH into any container in the hierarchy by using its DNS name.
This makes sure that the integration works for general network protocols, not only for HTTP and HTTPS.

> SSH is a good test here because it checks routing, name resolution, port access, and identity handling in a way that is independent from the web application stack.

As mentioned above, this structure could also help when Codex manages a blue-green deployment.
In that scenario, the outer `agent-jail` container is the root of the hierarchy, and Codex runs inside it.
Below that root, there are two containers, `green` and `blue`.
One of them, for example `green`, runs the production environment.
The other one, `blue`, runs the test or next release environment.
At release time, the deployment switches traffic from one container to the other.
The outer Codex agent could help manage the operational steps around this process.

Next to `green` and `blue`, I might also run a `restore` container.
This container would be used to verify that a backup of the production environment can actually be restored into a working system.

The structure would look like this:

* `agent-jail` with Codex
  * `green`
  * `blue`
  * `restore`

The most ambitious use of the hierarchy that I can currently imagine is to use the hierarchy root as my own development environment.
In that case, I would install my IDE and other development tools into the root container.
Below that, I would run the `agent-jail`.
Below the `agent-jail`, I would run the rest of the environment, as described above.

The structure would then look like this:

* `workstation-container`
  * `agent-jail` with Codex
    * `green`
    * `blue`
    * `restore`

Inside the `workstation-container`, I would install a full desktop environment and connect to it from the real host through a remote desktop protocol.

The reason to think in this direction is the increasing number of severe supply chain attacks against development environments and package ecosystems.
One recent example is the incident affecting the [npm axios HTTP client](https://www.heise.de/news/Malware-auf-npm-HTTP-Client-axios-laedt-Backdoor-fuer-Windows-macOS-und-Linux-11242675.html).
If the actual workstation workloads run in separated containers, the blast radius of such incidents can at least be reduced.

> This does not make the system secure by itself.
> A container is not a perfect security boundary in the same way as a virtual machine.
> But containers can still be useful for limiting filesystem access, network access, available credentials, and the set of tools that a compromised process can reach.

This goes in the direction of [Qubes OS](https://www.qubes-os.org/), but Qubes OS uses heavier Xen based virtual machines as its main isolation mechanism.
My goal is different. I want to share the full machine resources, such as CPU, RAM, and disk space, freely across all separated environments.
These environments would be lightweight containers, not full virtual machines.

At the same time, I want to share selected parts of the host filesystem and selected parts of the secret infrastructure.
For example, I want to pass the SSH agent Unix socket into a restricted container, so passwordless SSH works inside the container without copying the actual SSH private keys into that environment.

> Forwarding the SSH agent socket is often safer than copying private keys into a container.
> The container can ask the agent to sign SSH authentication requests, but it does not need direct access to the private key files.
> This still requires care, because any process with access to the socket can try to use the identities that the agent offers.

The explanation above should give enough context for where this journey is going.
These goals are more ambitious than the earlier versions, and the resulting setup is also more complex than before.
Therefore, I will split the explanation into a series of blog posts:

* Concepts
* IPv6 hierarchical and recursive backbone
* DNS, certificates, and secrets infrastructure
* Helper infrastructure profiles
* Root container profile
* Hierarchy aware container profile

This first blog post in the series covers only the concepts and how the main parts fit together.

The next two posts will describe the key technical backbone.
The first one will focus on the IPv6 network layer.
The second one will focus on DNS, certificates, and secrets.
Together, these parts should make it possible to access any level of the hierarchy from the host by using DNS names and valid TLS certificates created through `mkcert`.

After that, I will describe the helper containers.
One helper container will provide DNS, certificate, and secret infrastructure for the hierarchy-aware containers.
Another helper container will act as a cache for APT packages and Incus images, which should make larger hierarchies faster to create and update.
Later, a Docker image caching proxy or a similar component might also be useful.

The root of the hierarchy is the interface to the outside world.
Because of that, it has additional responsibilities, such as NAT64 and DNS64.
I will describe those parts in more detail later.

The non-root hierarchy-aware containers then consume the infrastructure provided by the root and helper containers.
The goal is that each of them offers a development environment that feels close to working on a normal host, while still being part of a controlled and inspectable container hierarchy.

So as a summary:

> We are building a system for recursive Incus-based host-like environments, originally motivated by safer AI-agent jails, but intended as a broader infrastructure pattern for isolated yet practical development and operations environments.
> The success condition is that workloads deployed deep in the hierarchy still feel reachable and usable exactly like workloads on a normal host.
>
> It is meant to be an infrastructure model where each recursive node can:
>
>  - launch child containers
>  - provide host-like networking to them
>  - publish DNS names upward
>  - participate in a certificate/trust model
>  - be reachable from above by normal tools like ssh, curl, browsers, and deployment scripts

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If parts of this post feel too compressed, copy the URL into an AI assistant and ask it to walk you through the sections that are still unfamiliar.

## Conceptual Center

Before looking at networking, naming, certificates, or isolation details, it is useful to talk about the core idea explicitly.
This section contains the concepts that define what kind of system this is meant to be at the highest level.
They describe the intended shape of a recursive host-like hierarchy and the operational perspective from which it should still feel understandable and usable.

The main idea is not only to put an AI coding agent into one isolated container.
That is the starting point, but the broader goal is a **reusable infrastructure pattern**.
A container should be able to behave like a small host.

> The word **host-like** is key here.
> It means that the container should provide enough host behavior for practical development and operations work.
> This includes process isolation, local services, child containers, routing, DNS names, certificates, and access through normal tools such as `ssh`, `curl`, and a browser.

> For orientation, the recurring terms in this post are:
>
> * **Outer host**: the real machine above the recursive hierarchy
> * **Helper**: the supporting infrastructure surface that publishes forest DNS state and brokers certificate signing
> * **Root hierarchy-aware container**: the first recursive host below the outer host
> * **Non-root hierarchy-aware container**: a recursive host deeper in the hierarchy
> * **Plain workload**: an ordinary application or service container at the leaves
> * **Forest view**: the merged naming and node-identity view assembled upward across the hierarchy
> * **CLAT sidecar**: the local per-node translator that lets node-local IPv4-only workloads enter the recursive IPv6 transport
> * **Trust anchor**: the singular host `mkcert` root from which certificate trust ultimately flows

### Recursive Host Model

This system distinguishes between three container roles:

* **Root hierarchy-aware container**: the first recursive host below the outer host. It owns the boundary between the real host and the recursive hierarchy.
* **Non-root hierarchy-aware container**: a recursive host inside the hierarchy. It can run Incus itself, create child containers, and provide the next level down with a host-like environment.
* **Ordinary workload container**: a normal service or application container. It does not participate in the recursive host role itself.

Instead of treating every container as only an application sandbox, this system introduces **hierarchy-aware containers** that behave like small hosts.
A hierarchy-aware container can run Incus itself, create child containers, and provide the basic host-like environment that those children need.
This is what makes the structure recursive: the outer host starts the first level, that first level can start the next one, and so on.


Not every container has this role.
**Ordinary workload containers** should stay ordinary workloads.
They run applications, databases, test services, or other concrete workloads.
They should not become responsible for the infrastructure of the next level.
The recursive behavior belongs only to the hierarchy-aware nodes, because those nodes are the places where control, networking, naming, and trust are anchored for the next level down.

Within the group of hierarchy-aware containers, the **root hierarchy-aware container** is special.
It is the interface to the outside world and therefore has additional boundary responsibilities.
For example, it may need to connect the recursive hierarchy to the outer network, provide translation services such as NAT64 and DNS64, and publish selected names or routes upward.
The **non-root hierarchy-aware containers** reuse the same basic model, but they do not own the outer boundary of the whole hierarchy.

> A minimal concrete shape looks like this:
>
> ```text
> outer host
> ├─ helper infrastructure
> │  ├─ forest-dns.incus
> │  ├─ forest-ca.incus
> │  ├─ apt-cache.incus
> │  └─ images-cache.incus
> └─ c0                                        root hierarchy-aware container
>    └─ c0-2                                   non-root hierarchy-aware container
>       └─ c0-2-1                              non-root hierarchy-aware container
>          └─ fasthtml-plus-integration-test   plain workload
> ```

### Host-Like Reachability

The recursive hierarchy should create the practical illusion of ordinary remote hosts.
From the outside, a hierarchy-aware container should feel less like "a container inside another container" and more like "a machine I can reach and use in the normal way".

That means I should be able to do the same kinds of things I would do with a VPS or test server:
- SSH into it by name
- open an HTTPS service by name in a browser
- use normal client tools such as `curl`
- trust the presented certificate through the expected trust chain

The important point is that this should still work even when the target is not at the first level of the hierarchy.
A service or node several levels down should remain reachable through ordinary network-facing mechanisms, without forcing the user to think in terms of nested container internals.

This is why SSH and `fasthtml-plus` are such good validation tests.
They prove that the recursive structure still behaves like a set of normal hosts and that ordinary operational and development workflows continue to work.

### Local Ownership And Adjacent-Hop Recursion

A recursive system becomes too rigid if higher levels need a kind of "god-mode" view of the whole hierarchy.
If a parent must know the detailed topology, routes, backend addresses, and service placement of deeper levels, then the structure stops behaving like a chain of host-like units and starts behaving like one centrally precomputed lab setup.

The intended model here is different.
Each hierarchy-aware node should mainly have a **local view**:
* It should know itself, its local workloads, and its direct children.
* It should not need full knowledge of the whole tree below it.

Deeper structure should therefore be exposed upward only in summarized form, through registration and publication, while traffic and control move one hop at a time.
In that sense, recursion here is not "everything knows everything", but a chain of small host-like units with local ownership, adjacent-hop cooperation, and only limited upward visibility.

> This is similar to how many networked systems scale.
> A router does not need to know every process behind the next router.
> A DNS parent zone does not need to know every implementation detail of a delegated child zone.
> The same idea applies here.
> Each level should provide enough information to make the next hop work, while keeping its internal structure mostly local.

## Isolation And Controlled Sharing

The recursive structure is not only about convenience and reachability.
It is also meant to reduce the blast radius if something goes wrong.
This matters especially when an AI coding agent can read files, modify code, install packages, and run commands.

The goal is to find a practical middle path between two extremes:

* Complete isolation, where the environment becomes too limited for real development work.
* Unrestricted sharing, where the hierarchy becomes little more than a cosmetic wrapper around the host.

This section therefore describes how access should stay selective, explicit, and still usable enough for daily work.

> In this context, "blast radius" means the amount of damage a compromised process can cause.
> For example, if a malicious package script runs inside the agent jail, the question is not only "can it run?", but also "which files can it read?", "which network targets can it reach?", "which credentials can it use?", and "which other systems can it influence?".

### Selective Filesystem Sharing

A hierarchy-aware node should not automatically see the whole parent filesystem.
Only the paths that are actually needed for the intended workflow should be shared downward.
This keeps the recursive environment useful, while still limiting how much of the surrounding system a compromised process can inspect or modify.

For example, an agent may need access to one project directory, but it usually does not need access to the whole home directory.
It may need a build cache, but it should not automatically receive browser profiles, unrelated source repositories, shell history, private notes, or deployment files.

The important point is that filesystem sharing should be narrow and intentional.
The recursive hierarchy is meant to erect clear boundaries between levels, while still allowing carefully selected parts of the parent environment to remain available.

> On a normal workstation, many tools can accidentally see more than they need.
> Inside a jail, the default should be the opposite.
> The environment should start with little access, and each shared path should have a reason.

### Selective Secret And Capability Delegation

The same principle applies to secrets and host-side capabilities.
Hierarchy-aware nodes may need access to SSH authentication, signing services, package registries, deployment flows, or other secret-backed workflows.
But that does not mean raw secret material should be copied into every level.

The better model is delegation rather than duplication.
A recursive node should receive a controlled interface to a capability, not unrestricted ownership of everything behind it.
For example, forwarding an SSH agent socket can allow passwordless SSH from inside the container without copying the private SSH key files into the container.

This keeps one source of truth while exposing only a selected interface to that capability inside the hierarchy.
It also makes it easier to remove access again.
If a container should no longer be able to use a capability, the delegated interface can be removed without searching for copied secrets inside the container filesystem.

> Delegation is still not risk-free.
> A process that can access an SSH agent socket can ask the agent to sign authentication requests.
> That means the socket itself must be treated as sensitive.
> The benefit is that the private key material stays outside the container, and the exposed interface can be controlled more directly than copied key files.

### Compatibility With Normal Host Workflows

Isolation only helps if the resulting environment is still practical to use.
If the jail is too difficult to work with, the likely result is that people bypass it.
The recursive nodes should therefore remain compatible with ordinary development and operations workflows as much as possible.

Existing tools should continue to behave in familiar ways.
This also includes compatibility shims for key tools such as `mkcert` and `incus`.
The `mkcert` side is explained in more detail later in [Trust Anchor And Certificate Flow](#trust-anchor-and-certificate-flow).
The `incus` shim exists for a different reason: it preserves familiar child-container workflows while transparently injecting the small set of recursive-specific container parameters needed for nested host-like operation, such as the privilege and idmap settings that would otherwise make deeper containers inside the hierarchy break.

> In practice, the critical point is that ordinary upstream-style `incus launch`, `incus init`, and profile-edit flows inside a hierarchy-aware node would otherwise create children with the wrong nested-container contract.
>
> Originally, in the unchanged FastHTML acceptance test, the untouched itest child used the unprivileged/idmapped shape and then failed at launch with errors such as `Error: Failed instance creation: Failed to setup device mount "project-original": idmapping abilities are required but aren't supported on system`.  
> The same basic problem also showed up elsewhere as `newuidmap failed to write mapping ... write to uid_map failed: Operation not permitted`.
>
> That is why the recursive environment currently needs those nested children to come up with `security.privileged=true` and `security.idmap.isolated=false`: it removes the child's own extra inner user-namespace/idmap layer, which is the part that broke in these flows.
>
> This does not mean the real host suddenly sees a privileged recursive child directly.
> The main host-facing shield remains at the hierarchy root, which is still launched with `security.privileged=false`.
> A privileged child inside that unprivileged hierarchy-aware parent weakens the boundary inside the recursive layer, but it does not remove the outer host-to-root unprivileged boundary.
>
> The shim acts as a narrow compatibility layer: it rewrites the common child-creation and child-profile commands so normal shell-script workflows still work, while the recursive node quietly enforces the few Incus settings needed to keep deeper containers functional.

A developer should still be able to use `git`, `ssh`, `curl`, package managers, test runners, editors, deployment scripts, and browser-based testing workflows.
The difference should be the controlled environment around these tools, not a completely different way of working.

The intended result is a practical development and operations environment with explicit boundaries.
The user should still be able to do normal work, but the agent or workload should not automatically inherit every file, credential, network path, and host capability from the real machine.

## Recursive Infrastructure Backbone

The previous concepts describe what kind of system this is supposed to be.
This section describes the technical backbone that makes that behavior possible.
If the recursive hierarchy should behave like a chain of reachable small hosts, then it needs a transport model, an IPv4 compatibility model, and a naming and trust model that still work across multiple levels.

### Hierarchical IPv6 Backbone

The main transport model of the hierarchy is IPv6.
The outer host is currently assumed to provide ordinary IPv4 and IPv6 dual-stack connectivity to the public network, but the recursive transport fabric below it is intentionally IPv6-centric.

> The main reason for this choice is address space.
> With IPv4 and its 32-bit addresses, a recursive hierarchy would become constrained much sooner, because every additional level consumes scarce prefix space.
> IPv6 with its 128-bit addresses leaves enough room to assign a routed subtree to the root and then keep carving out further levels in a regular way without quickly exhausting the hierarchy.

Conceptually, the recursive tree starts with one ULA subtree for the **root hierarchy-aware container**, for example `fd00:1000::/20`.
Written in hexadecimal, a `/20` prefix covers `5` hex digits in total.
The leading `fd` already occupies the first `2` of those digits for the ULA prefix, so within that early visible prefix slice there are `3` hex digits, that is `12` bits, left for the recursive hierarchy to carve up in a regular way.

From there, each additional hierarchy-aware level consumes another `4` bits, that is, one hexadecimal nibble.
For example:

* root: `fd00:1000::/20`
* first child level: `fd00:1100::/24`
* second child level: `fd00:1110::/28`
* third child level: `fd00:1111::/32`
* and so on.

The lower `64` bits are then kept for the local interface address space, following normal IPv6 practice.

> This is partly convention rather than hard law, but it keeps the design compatible with ordinary IPv6 expectations while still allowing quite a deep hierarchy before the `/64` boundary is reached.

Each hierarchy-aware node therefore owns one delegated IPv6 subtree.
Within that subtree, the node reserves one deterministic local `/64` for its own local LAN surfaces.
That local `/64` includes managed bridges such as `incusbr0` for ordinary workloads, while recursive-support plumbing such as local recursive DNS, DHCPv6 support, and direct-child support stays in the hierarchy-aware node itself.
Only the remaining child slots are delegated downward.

A hierarchy-aware child receives both:

* a parent-facing IPv6 uplink of its own, typically a static `/128` on `eth0`; for example, if the parent's local uplink space is `fd00:1100::/64`, the child might receive `fd00:1100::100/128` on `eth0`
* a delegated child subtree such as `fd00:1110::/28`, for which the parent installs a route via that child's uplink address

Because the uplink is a `/128`, the child also needs explicit routing information rather than relying on ordinary on-link assumptions.
In practice that means an explicit route to the parent router and an explicit default route, where the parent router can be treated as a link-local next hop such as `fe80::1%eth0`.

An ordinary workload container does not receive a delegated subtree.
It is attached only to a managed local bridge such as `incusbr0`, which itself lives inside that node-owned local `/64`, rather than participating in the parent-facing recursive uplink contract.
From the workload's point of view, this should feel like a standard Incus local network with its usual behavior: a normal local address, local DNS, normal default routing, and no recursive-specific routing role inside the workload itself.
The recursive-support IPv6 plumbing remains in the hierarchy-aware node instead of being pushed down into the workload.
It stays a leaf.
That distinction is important because only hierarchy-aware nodes should become routers for deeper descendants.

This IPv6 backbone is what makes the recursive structure feel host-like from above.
If a node or service exists deeper in the tree, outer levels should still be able to reach it through ordinary routed networking rather than through ad-hoc tunnels or manual port-forward chains.
Keeping IPv4 out of the recursive transport itself is part of that decision.
IPv4 with its much smaller address space would force a far tighter hierarchy and much more brittle address planning, while IPv6 leaves enough room for delegation to remain simple and regular.

### IPv4 Compatibility Via 464XLAT, NAT64, And DNS64

Even if IPv6 is the backbone, IPv4 compatibility still matters.
Many tools, package sources, container images, and application stacks still expect IPv4 connectivity somewhere in the path.
For that reason, the recursive design must provide local IPv4 usability without turning IPv4 into the main recursive transport model.

The key idea is to keep IPv4 out of the recursive transport itself, but still make it available where ordinary software expects it.
Conceptually, the outer host remains dual-stack, the recursive hierarchy remains IPv6-first, and IPv4 is reintroduced only through compatibility layers at the places that actually need it.

At the architecture level, [464XLAT](https://www.rfc-editor.org/rfc/rfc6877) combines a typically **stateless** [CLAT](https://www.rfc-editor.org/rfc/rfc6877#section-2) near the client
with an upstream NAT64/[PLAT](https://www.rfc-editor.org/rfc/rfc6877#section-2) role that is usually the **stateful** half of the design.

[DNS64](https://www.rfc-editor.org/rfc/rfc6147) adds an important optimization:
when an application already performs AAAA lookups and can speak IPv6, the root can hand back a synthetic IPv6 destination (see below) so that the traffic may use only the root-edge NAT64 step instead of the full double-translation path.

#### On The Root Hierarchy-Aware Container

At the **root hierarchy-aware container**, the system provides the overall provider-side translation role of the design through DNS64, root-edge NAT64 translation, and stateful IPv4 egress.
This is what allows descendants to reach an IPv4-only destination while the recursive transport itself stays IPv6-only.

> That was one of the practical bootstrap motivations here: if a dependency endpoint such as [GitHub](https://github.com/orgs/community/discussions/10539) is only reachable through IPv4 from the recursive hierarchy's point of view, the root must still make it reachable without forcing every lower level to become dual-stack.

> The same logic then also applies to any other IPv4-only destination beyond the recursive IPv6 fabric.

The concrete root-edge roles are currently:

* [`dnsmasq`](https://dnsmasq.org/doc.html) as the lightweight node-local DNS/DHCP/RA layer on the root's local LAN surfaces and as the first DNS hop seen by local clients
* [`Unbound`](https://nlnetlabs.nl/projects/unbound/about/) as the DNS64-capable resolver that synthesizes AAAA records from A records when no usable AAAA exists
* [`TAYGA`](https://github.com/apalrd/tayga) as the root-edge translator component that takes traffic sent to those synthetic IPv6 destinations and translates it back toward IPv4 at the edge
* stateful IPv4 masquerading on the external egress path, so that translated traffic can actually leave the root toward the public IPv4 network
* root-owned forwarding and firewall policy around that translator so that internal recursive traffic and true external egress are kept distinct

Conceptually, the root-side path is:


* a descendant asks for a name such as `github.com`
* the root-side DNS64 resolver first receives an AAAA query
* if no usable AAAA exists, DNS64 makes a second lookup for an IPv4 A record
* if that A lookup returns, for example, 192.0.2.33, DNS64 synthesizes an IPv6 destination by embedding those IPv4 `32` bits under the NAT64 prefix;  
  with the well-known prefix `64:ff9b::/96`, that becomes `64:ff9b::192.0.2.33` or, in pure hexadecimal form, `64:ff9b::c000:221`
* the descendant then opens an IPv6 connection to that synthetic 128-bit destination
* at the edge, NAT64 translates that traffic back to the real IPv4 destination

So DNS64 rewrites the naming view so that an IPv6-side client can treat an IPv4-only destination as if it had an IPv6 address.
NAT64 is the piece that then makes that synthetic address actually usable.

> The `64:ff9b::/96` prefix here is just the standard well-known example.
> If NAT64 must also reach private IPv4 ranges in a lab or home-server setup, a network-specific NAT64 prefix should be used instead.
> TAYGA's own documentation calls out the same caveat in its discussion of RFC 6052 and the well-known prefix:
> [TAYGA README: Mapping IPv4 into IPv6](https://github.com/openthread/tayga#readme).

Which IPv4 destinations are allowed is then a firewall and policy question at the root edge, not a DNS64 question.

#### Why Root DNS64/NAT64 Is Not Enough

Root DNS64/NAT64 solves only part of the problem.
It is enough when the client already behaves like an IPv6 client that asks for AAAA records and is willing to open an IPv6 connection.
It is not enough for an IPv4-only application, an IPv4-only toolchain path, or a local workload that simply emits IPv4 packets and expects an IPv4 world around it.

That is why each **non-root hierarchy-aware container** also needs its own local CLAT side.

> Remember that the root hierarchy-aware container sits directly at the outer edge and currently assumes a working host-side dual-stack environment,
> so it can use ordinary host-provided IPv4 egress at that edge and does not need this additional local CLAT layer for itself.

The local CLAT gives those node-local clients a usable IPv4 view, translates that traffic into IPv6, and then hands it off to the recursive IPv6 backbone.
Only after that does the root-edge NAT64 step come into play when the final destination is still IPv4-only.

> **IPv4 Hop-On And Hop-Off**
>
> CLAT is the local IPv4 hop-on point into the recursive IPv6 hierarchy.  
> Root DNS64/NAT64 is the IPv4 hop-off point back out to an IPv4-only destination.
>
> ```txt
> IPv4-only app/workload   --4-->
> non-root CLAT sidecar    --6-->
> recursive IPv6 hierarchy --6-->
> root DNS64/NAT64 edge    --4-->
> IPv4-only service
> ```


#### On Other Hierarchy-Aware Containers

On every **non-root hierarchy-aware container**, the accepted design does not use same-namespace CLAT on the main recursive uplink path.
It is one dedicated CLAT sidecar per node in a separate routing namespace.
In other words, the node is split into its normal main namespace, which keeps the recursive IPv6 uplink and router path clean, and one separate CLAT sidecar namespace, which takes over the local IPv4 compatibility work.

> A sidecar in the broad systems sense is:
>
> - an auxiliary component
> - placed next to the main component
> - taking over one specialized function
> - so the main component stays simpler and cleaner
>
> In Docker/Kubernetes, that often literally means:
>
> - another container next to the app container
>
> Here, I mean the same architectural pattern, but at the network/routing level implemented as a network namespace.


The concrete roles are currently:

* [`dnsmasq`](https://dnsmasq.org/doc.html) on the managed local bridges such as `incusbr0`, where it remains the first workload-facing DNS hop and the ordinary bridge-local network service layer
* [`clatd`](https://github.com/toreanderson/clatd) as the CLAT control process implementing the customer-side translator role of 464XLAT
* [`TAYGA`](https://github.com/apalrd/tayga) as the underlying translator used by that CLAT sidecar
* source-policy routing and explicit return routes in both the main namespace and the separate CLAT sidecar namespace so that only the intended local IPv4 client realms are pushed into the sidecar and local replies still come back to the right bridge

The accepted sidecar shape is:

* one dedicated network namespace, typically `clatns`
* one sidecar-owned IPv6 uplink such as `up0`, created from the parent-facing `eth0`, moved into `clatns`, and given an explicit IPv6 address and default route there
  * this is not one end of the main-namespace interconnect veth pair, but a separate macvlan cloned from the parent-facing eth0 and moved into clatns, where
  * it gets its own explicit IPv6 uplink identity, for example `fd00:1100::101/128`,
  * plus a default route via a link-local next hop such as `fe80::1%up0`
* one explicit interconnect back to the main namespace, typically `clatlan-main <-> lan0`
  * this is the actual veth pair between the node's normal main namespace and `clatns`,
  * with `clatlan-main` staying in the main namespace and `lan0` moved into the sidecar namespace
* one small point-to-point IPv4 link across that interconnect, currently `169.254.203.2/30 <-> 169.254.203.1/30`
  * for example, `clatlan-main` can carry `169.254.203.2/30` in the main namespace,
  * while `lan0` carries `169.254.203.1/30` inside `clatns`,
  * giving the node a dedicated IPv4 handoff path into the CLAT sidecar
* one dedicated policy table, currently `203`, with policy rules starting at preference `1200`
  * the main namespace uses those rules to say that traffic sourced from selected local IPv4 client subnets should use table `203`,
  * and that table then sends default IPv4 egress toward `169.254.203.1` via `clatlan-main`,
  * instead of using the normal main-namespace path

The data path then looks like this:

* a local tool or ordinary workload emits ordinary IPv4 traffic
* the hierarchy-aware node policy-routes that traffic into the CLAT sidecar instead of letting the main bridge masquerade it directly
* the CLAT sidecar translates that IPv4 traffic into IPv6
* the traffic crosses the recursive IPv6 backbone
* if the final destination is IPv4-only, the root performs the DNS64/NAT64 step at the outer edge

This is also why the managed local bridge `incusbr0` changes role on non-root nodes.
It still provides the ordinary local client subnet, but it is no longer the IPv4 NAT boundary itself.
Instead, the bridge is configured as `bridge.mtu=1480` with `ipv4.nat=false`, and the CLAT sidecar becomes the single owned IPv4 translation boundary for that node.

> The reduced `1480` MTU on the IPv4 client side leaves room for the extra IPv6 overhead added during CLAT translation, so that those packets can still travel cleanly over the `1500`-byte IPv6 uplink without relying on ad-hoc MSS hacks.
>
> We explicitly avoid using MSS clamping as the normal fix, because that only helps TCP and does nothing for UDP or other non-TCP traffic.
>
> IPv6 also does not rely on router-side fragmentation in the old IPv4 sense;
> instead it depends on [Path MTU Discovery for IPv6](https://www.rfc-editor.org/rfc/rfc8201) and ICMPv6 Packet Too Big feedback, so if that feedback path is broken the result is often a silent PMTU blackhole rather than a cleanly fragmented packet.

That separation turned out to matter a great deal in practice.
The rejected same-namespace CLAT shape made the main recursive uplink path too fragile, especially for deeper descendants.
The accepted sidecar design keeps the recursive IPv6 router path clean in the main namespace and moves the messy IPv4 compatibility work into a separate, explicitly wired local translation domain.

### Hierarchical Naming, Certificates, And Trust

Reachability alone is not enough.
If the system should feel like a set of normal hosts, then names, certificates, and trust also need to compose across the hierarchy.
That means deeper nodes and services should not only have addresses, but also stable names and certificates that remain meaningful from above.

The naming model is hierarchical rather than flat.
Canonical names should reflect the position of a node or service in the recursive tree, while shorter aliases can exist where they remain unambiguous.
Certificates and trust should follow the same authority model, so that published names can also be used through normal HTTPS and SSH workflows instead of only through diagnostic shortcuts.

#### Host-Facing DNS Integration

The helper-side DNS does not become useful to the host automatically.
The host still needs to be taught that `.incus` belongs to that recursive DNS view.
In practice this means integrating the helper container's DNS service into the host resolver configuration, for example through `systemd-resolved`.

Conceptually, the goal is to steer `.incus` lookups toward the helper-side DNS without replacing the host's whole resolver path.

An example `systemd-resolved` configuration can look like this:

```txt
[Resolve]
DNS=10.227.241.53
Domains=~incus
```

In that example, `10.227.241.53` would be the helper container's address from the host's point of view.
The important idea is that the host resolver is explicitly told: "for `.incus`, ask the helper-side recursive DNS."
This is a simple global drop-in example, not the only possible `systemd-resolved` shape.
If stricter per-link scoping is required, the same intent can also be expressed through link-specific resolver configuration rather than through one global `DNS=` entry.

#### Naming Objects And Stable Identities

There are two main naming object types in this system:

* node records, such as the canonical names `c0.incus`, `c0-2.c0.incus`, or `c0-2-1.c0-2.c0.incus`, together with shorter aliases such as `c0-2.incus`, `c0-2-1.c0-2.incus`, or `c0-2-1.incus` when they remain globally unambiguous
* service records, such as the canonical names `fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus` or `auth.fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus`, together with shorter aliases such as `fasthtml-plus-integration-test.c0-2-1.incus`, `fasthtml-plus-integration-test.incus`, `auth.fasthtml-plus-integration-test.c0-2-1.incus`, or `auth.fasthtml-plus-integration-test.incus` when those remain unambiguous

The important rule is that every published object has one canonical hierarchical name.
Shorter aliases may also exist, but only when they remain unambiguous in the merged forest-wide view.
So the canonical name is the stable exported identity, while the shorter names are convenience views derived from that stable identity.

As a node or service name may bubble upward through several merge points before it becomes host-visible, a child cannot be entrusted to define the final global alias set by itself.
The deeper the name, the more important it is that the shorter aliases are recomputed from the larger merged view above it.

#### Upward Naming Publication

The upward direction is an actual recursive publication protocol.
Each hierarchy-aware node has a local authoritative view of itself, its local services, and the child registrations it has already merged.
That local view is then exported upward, merged by the parent, exported upward again, and eventually published in the helper-side forest view.

Conceptually, this is a parent/child registration-and-reconciliation process.
It could be implemented in different concrete ways, for example by a child pushing exports to a parent-side API, by a parent polling child state, or by a file-driven exchange consumed by a periodic merge loop.
The important point is not the exact transport, but the process shape:

* each node owns its local authoritative naming state
* each child exposes an exportable registration view upward
* each parent performs an idempotent merge of child state with its own local state
* the top-level helper-side publication layer turns that merged root-visible state into the host-facing DNS view

In the current implementation, the naming path uses the file-driven variant of that design.

> This design intentionally prefers a simple watch-plus-timer publication model over a more aggressive real-time control plane.
> In the expected use case, the recursive DNS view changes only occasionally: a hierarchy-aware node is launched, a child appears, or a service is added or removed.
> Once a hierarchy is up, its published names are usually fairly stable.
> That makes an eventually consistent design with event-triggered updates and periodic repair a good fit.
> It is simpler to reason about, avoids unnecessary event storms, and is entirely adequate for a naming layer that changes only from time to time.

> File-driven does not mean a shared filesystem between parent and child, though.
> Each hierarchy-aware node keeps its own local registration state inside its own filesystem.
> When the hierarchy-aware node then acts as a parent it actively syncs the state of the children into its own local naming state.
> That sync is driven both by direct-child lifecycle watching and by a periodic full-sync timer, so the current design uses a mix of event-style triggering and polling-style repair rather than only one or the other.
>
> Concretely, the watcher is the parent-side service that runs `incus monitor --type=lifecycle --format=json` against the parent node's local nested Incus daemon and reacts to relevant direct-child instance events, while the timer periodically triggers the same sync logic again as a repair path.
>
> The parent-side reconciliation process then actively runs a concrete export command inside the child, currently via `incus exec`, calling the child-side `recursive-forest-runtime client export-registration` entrypoint and receiving the agreed JSON payload back on standard output.
> The parent then writes that exported child view into its own local child-registry area before merging it with its own local naming state.
>
> In that sense, a child registration payload is simply the child's exported naming view in JSON form:
>
> * which node it came from
> * which canonical records that child currently exports upward
> * and, where relevant, the route metadata that belongs to that exported subtree

> A simple example could look like this:
> ```json
> {
>   "schema": 1,
>   "source_node": "c0-2-1",
>   "records": [
>     {
>       "name": "c0-2-1.c0-2.c0.incus",
>       "address": "fd00:1110::1"
>     },
>     {
>       "name": "fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus",
>       "address": "fd00:1110:0:3::25"
>     },
>     {
>       "name": "auth.fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus",
>       "address": "fd00:1110:0:3::25"
>     }
>   ],
>   "route": {
>     "subtree": "fd00:1110::/28",
>     "next_hop": "fd00:1100::100",
>     "ready": true,
>     "uplink_interface": "eth0"
>   }
> }
> ```
> In the simplest conceptual reading:
>
> - source_node says which hierarchy-aware node exported this view
> - records contains the canonical names that this node currently exports upward
> - route says which delegated subtree belongs to that exported node and how the parent should reach it
>
> The parent then merges those imported child payloads with its own local records to compute its current merged view.
>
> At the top of the hierarchy, the helper does not see files from inside hierarchy-aware nodes directly, and this step is not simply the same direct-child watcher relationship again.
> The helper is not the parent Incus host of the root, so it does not sit there listening to the root through the same local nested `incus monitor` path that a hierarchy-aware parent uses for its own children.
>
> In the current implementation, the top-level handoff is a separate upward network publication step.
> The root still computes the same merged root-visible naming view after incorporating its descendants, but instead of the helper pulling that view out of the root, the root now pushes it upward to a helper-side HTTP publication endpoint, currently `POST http://forest-ca.incus:9080/v1/publish-root-registration`.
>
> So the payload shape stays file-like and JSON-based, but the transport changes at the top:
>
> * inside the recursive hierarchy, parent nodes fetch child exports with `incus exec` and merge them locally
> * at the root-to-helper boundary, the root publishes its already-merged export upward through the helper-side network API, currently through the stable helper endpoint `forest-ca.incus:9080`
>
> That means the helper does not inspect the root's filesystem directly and does not need a host-mounted IPC path either.
> It just accepts the root's published JSON view, stores that in its own forest state, and regenerates the published DNS data from there.
>
> The consistency model stays intentionally simple at that top boundary as well.
> The root publishes upward from the same general watch-plus-timer reconciliation path that it already uses for child merge work, so helper publication is eventually consistent and repairable without turning the host into the steady-state control plane.

Conceptually, the path looks like this:

* a leaf node such as `c0-2-1` creates local records for itself and for locally hosted services
* `c0-2-1` exports those registrations upward to `c0-2`
* `c0-2` merges that child view with its own local view and republishes upward to `c0`
* `c0` merges again and republishes upward to the helper-side forest view
* the helper-side DNS then exposes the merged host-facing `.incus` namespace

That is why I think of the names as bubbling upward.
The protocol starts with local facts and only gradually becomes a forest-wide view.

In the FastHTML example, the leaf `fasthtml-plus-integration-test` names do not become host-visible just because the workload exists.
At first, those names exist only in the local view of the hierarchy-aware node that hosts that workload, for example `c0-2-1`.
The base workload identity such as the canonical `fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus` can be derived automatically there from the local Incus-known workload name and address, while extra service names such as `auth.fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus` still need an explicit local registration step.
Those records are then exported upward, merged by `c0-2`, merged again by `c0`, and finally published by the helper-side DNS layer.
Only after that publication path completes do the host-facing names become visible from above, including any shorter aliases that remain valid in the full merged view, such as `fasthtml-plus-integration-test.incus` or `auth.fasthtml-plus-integration-test.incus`.

> A plain workload container does not normally participate in that protocol by itself.
> It stays a plain workload and does not become a recursive naming client just because it serves an application.
>
> In the current model, the hosting hierarchy-aware node owns publication on behalf of the workload.
> That means someone or something on that host-like node must first decide that a given workload should become part of the exported recursive naming view and then register the desired service
> records into the node's local authoritative state.
>
> Concretely, that can be done with explicit local registration commands on the hierarchy-aware node, for example:
>
> ```bash
> recursive-forest-runtime client register-local-record \
>   --name auth.fasthtml-plus-integration-test.incus \
>   --target-name fasthtml-plus-integration-test.incus
> ```
>
> The subtle point is that `fasthtml-plus-integration-test.incus` may already be known automatically on the node's own local managed workload bridge because it is an Incus instance name there.
> In the current model, that base workload identity is also published upward automatically from the hosting hierarchy-aware node's watch-plus-timer reconciliation path.
> The explicit registration step is therefore only needed for extra semantic service names such as `auth...`, not for the basic workload instance name itself.
>
> Once those local records exist there, the normal upward export, merge, and helper publication path takes over.
>
> So the important boundary is:
>
> - the plain workload provides the service and its local address
> - the hosting hierarchy-aware node decides whether that service should be published upward at all
> - and only that hierarchy-aware node injects the corresponding records into the recursive naming protocol

#### Downward DNS Consumption

The downward direction for DNS is different.
Names do not trickle back down as copied record files.
Instead, each lower layer uses the recursive DNS plumbing above it as an ordinary resolver path.

On a hierarchy-aware node, the node-local recursive DNS surface knows the node's local records and merged child registrations.
On ordinary workload bridges such as `incusbr0`, the bridge-local `dnsmasq` remains the first DNS hop seen by plain workloads.
That bridge-local DNS then forwards `.incus` lookups into the node-local recursive DNS path rather than trying to become the full recursive authority by itself.

So the downward story for DNS is:

* the authoritative naming view bubbles upward through registration and merge
* the resulting naming view trickles back down through normal DNS resolution

That also explains why ordinary workloads can stay plain.
The workload does not need to know the recursive naming algorithm or the whole tree.
It just asks its normal bridge-local resolver for names such as `apt-cache.incus`, `images-cache.incus`, `forest-dns.incus`, `c0-2.incus`, or `fasthtml-plus-integration-test.incus`, and the recursive DNS plumbing around it returns the right answer.

On the outer host, the same pattern continues one level higher.
The resolver is taught that `~incus` belongs to the helper-side DNS surface (see [Host-Facing DNS Integration](#host-facing-dns-integration)), so host-facing lookups also consume the merged recursive view through ordinary DNS rather than through ad-hoc address files.

#### Trust Anchor And Certificate Flow

The certificate side deliberately does not mirror DNS exactly.
The trust anchor is singular: the host [`mkcert`](https://github.com/FiloSottile/mkcert) root remains the one authoritative root of trust.
The helper side may broker signing behavior, but it must not invent a second independent forest CA.
Instead, the helper-side signer consumes host-derived trust material staged into its state and exposes only a narrow signing and root-CA retrieval interface downward through the same stable helper API surface, currently `http://forest-ca.incus:9080`.

> That distinction matters operationally as well.
> The public `rootCA.pem` can be distributed downward so nodes can install trust, but the private `rootCA-key.pem` is the actual signing authority and should not be copied into ordinary workload containers.
> If the helper-side signer holds that private signing material, then helper compromise must be treated as compromise of the local `mkcert` CA itself.
> In this design that trade-off is accepted, because the helper stays outside the plain workload hierarchy and the whole stack is intended to run on one trusted host.

For the main materials in that flow, the rough boundary is:

| Material | Where it normally lives | What compromise means |
| --- | --- | --- |
| host `rootCA.pem` | helper API responses and node-local trust stores | trust can be extended downward, but this alone does not allow signing |
| host `rootCA-key.pem` or equivalent staged signing material | helper-side signer state only | compromise of the local `mkcert` CA itself |
| service private key | hierarchy-aware node, and plain workload only if that workload terminates TLS | impersonation of that service within the issued SAN family |
| CSR | hierarchy-aware node and helper signing request path | requested names and public key are exposed, but not the private key |
| issued certificate | hierarchy-aware node and plain workload deploy path | usable only together with the matching private key |
| published DNS names | helper-side publication state and resolvers | clients may be directed to the wrong target, but DNS alone does not grant the private key |

That creates a split between naming authority and signing authority:

* the naming view is assembled recursively through local registration and upward merge
* the trust anchor stays fixed at the host root
* the helper side bridges those two by exposing a narrow signer/broker interface

Conceptually, the downward certificate flow is:

* a hierarchy-aware node uses a host-like `mkcert` workflow and generates the private key locally
* the node submits a CSR upward together with enough information for the helper to identify the intended service, namely the caller uplink IPv6 and a local service label path
* the helper-side signer uses the merged forest naming view to map that uplink IPv6 to the caller node's canonical identity
* from that canonical node identity and the local service label path, the helper reconstructs the canonical service identity and computes the final SAN set
* DNS publication stays stricter than certificate overlap: short aliases must still be globally unambiguous to be published in DNS, but this implementation deliberately tolerates some SAN overlap, so the certificate SAN family may be broader than the currently published DNS alias set
* the helper-side signer returns a certificate chained to the same host trust root
* the node then deploys that certificate downward into the actual workload that needs it

> That means published DNS and certificate SANs do not carry the same exclusivity guarantee in this local lab model.
> Published DNS remains authoritative for which short names are currently live and globally unambiguous, while SANs are allowed to remain broader and may overlap across certificates.
> So a SAN entry by itself should not be read here as a strong multi-tenant ownership claim over a host-visible `.incus` name.

This is why certificate trickle-down is a real protocol rather than just ordinary resolver use.
The trust root and the signing decision actually move through a controlled interface.
The node fetches the root CA for `mkcert -install`, submits CSRs upward, and receives signed certs back down.

> In the current implementation, every hierarchy-aware container receives an installed `mkcert`-style shim rather than direct access to the host's real `mkcert` private root.
> That shim reads node-local configuration, currently from `/etc/recursive-mkcert.json`, and talks to a narrow helper-side HTTP API on the stable helper endpoint `http://forest-ca.incus:9080`, currently including one endpoint for root-CA retrieval and one for CSR signing.
>
> The key, CSR, and certificate play different roles here:
>
> * the private part is only the private key; it does not contain SANs or similar naming metadata
> * the CSR contains the public key, requested metadata such as subject and SANs, and a signature proving that the requester owns the matching private key
> * the certificate contains the public key, the final subject and SAN set, and the CA signature
>
> That distinction matters because the final SANs live in the issued certificate, not in the private key.
> They also do not have to be copied verbatim from the CSR.
> The helper-side signer can therefore issue a certificate for the same public key while choosing the SAN set from its own forest-level knowledge.
>
> The trust material trickles down first:
>
> * `mkcert -install` on the hierarchy-aware node fetches the root CA from the helper-side API, currently from `http://forest-ca.incus:9080/v1/root-ca`
> * the node installs that CA into its own local trust locations
> * host-like tooling on that node then trusts the same chain that ultimately comes from the host root
>
> Certificate issuance then bubbles upward in the opposite direction:
>
> * the hierarchy-aware node generates the private key locally and builds a CSR from the locally requested names
> * the `mkcert` shim submits that CSR upward to the helper-side signing endpoint, currently `POST http://forest-ca.incus:9080/v1/sign-csr`, together with the caller uplink IPv6 and one or more local service label paths such as `auth.fasthtml-plus-integration-test`
> * the helper-side signer uses the caller uplink IPv6 to find the caller node's canonical identity in the merged forest node-identity view
> * from that canonical node identity and the local service label path, the helper reconstructs the canonical service name, for example `auth.fasthtml-plus-integration-test.c0-2-1.c0-2.c0.incus`
> * the helper then computes the final SAN family from that canonical service identity by applying the forest alias-derivation rules at the top of the hierarchy
> * in other words, the helper-side signer owns canonical-name and SAN computation; the CSR's locally requested names are still checked for consistency, but they are not the final SAN authority
> * DNS publication stays stricter than certificate overlap: short aliases still need to be globally unambiguous before they are published in DNS, but the current implementation deliberately tolerates some SAN overlap, so the certificate SAN family may be broader than the names currently published in DNS
> * the signer then uses host-derived trust material already staged into helper state, signs the CSR, and returns the issued leaf certificate
>
> The final deployment step then trickles back down again:
>
> * the hierarchy-aware node receives the signed certificate
> * it keeps the host-like `mkcert` workflow for itself
> * and, if a plain workload actually terminates TLS, it deploys the resulting cert/key files downward into that workload
>
> So the recursive certificate flow is asymmetric by design:
>
> * trust roots and issued certs travel downward
> * CSRs and signing requests travel upward
> * the private key is generated on the hierarchy-aware node and is never sent to the helper-side signer, even if it is later deployed into a plain workload that terminates TLS

#### Host-Like Node Versus Plain Workload

The hierarchy-aware node and the plain workload do not play the same role in this trust model.
The hierarchy-aware node is the host-like participant:

* it installs the trust root
* it uses the `mkcert`-style interface
* it requests or prepares the certificates

The plain workload stays plain:

* it receives cert/key files
* it uses those files through its normal deploy path
* it does not become a recursive certificate manager itself

For the current FastHTML example, that means `c0-2-1` behaves like the host-like machine, while `fasthtml-plus-integration-test` remains only the workload target.
So the same principle as in networking applies here too: recursive adaptation belongs in the hierarchy-aware node, not inside the ordinary workload container.

## Human Inspectability And Reproducibility

The earlier concepts describe what the recursive system should do.
This final group describes how it should be built and operated so that a human can still understand it.

There was a first version of this infrastructure, and this rewrite intentionally moves away from its opaque, host-bound mutation model toward one that can be regenerated, inspected, diffed, and rebuilt in a more controlled way.

### Generator-First Infrastructure

The first implementation grew largely as a live recursive control plane.
This rewrite keeps the same recursive goal, but changes the development and operations model.
The primary interface is now a generator, not a pile of hand-mutated live state.

This means in practice that the intended workflow starts from commands such as `uv run recursive-incus-profile generate rip-slim --enable-cache`.
The generator then produces a self-contained materialization directory with staged outputs such as `templates/`, `rendered/`, `final/`, `scripts/`, and runtime `artifacts/`.

> A practical human inspection order is:
>
> - start with the generated `*.command`, `*.env`, and `*.json` metadata to see which inputs produced this materialization
> - then inspect `templates/` to see the generator-owned source templates copied into that materialization
> - then inspect `rendered/` to see those templates expanded into concrete cloud-init fragments, config files, and intermediate profile parts
> - then inspect runtime `artifacts/` to see the packaged runtime tarballs and hashes that will later be installed inside the helper and hierarchy-aware nodes
> - then inspect `scripts/` to see the host-side helper commands that launch, verify, and operate this materialization
> - and inspect `final/` last, because that directory contains the finished self-contained Incus profile YAML files that are actually deployed

Those final Incus profile YAML files are the deployment artifacts consumed by Incus, but they are treated as the last rendered result rather than as the main authoring surface.
They should be thought of more like the output of a build process or a binary blob than like files a human is expected to read and fully understand.
The goal was to produce a self-contained deployment artifact that can be handed to another machine and used there in the normal Incus style.

That changes how the system is meant to evolve.
If something should become part of the product, it should either live on the generator side as generator-owned rendering code and templates, or on the runtime side as an explicit code-only runtime package with a clear boundary.

> Live in-container edits may still be useful while debugging, but they are no longer supposed to be the source of truth.

### Separation Of Static Intent And Dynamic Runtime State: Code-Only Runtime Packages

Generator-first does not mean that everything is frozen into static YAML; the system also has dynamic runtime behavior.
Some parts of the system are inherently dynamic:
helper-side DNS and certificate handling, node-local child discovery and reconciliation, root-edge NAT64 and CLAT actions, and local child-profile materialization all need software that runs inside the live hierarchy.

The durable declared shape and the live evolving state are treated as different things.

* The static side contains the intended configuration: templates, metadata, rendered provisioning files, profile blobs, and versioned runtime artifacts with known hashes.
* The dynamic side consists of recursive naming merges, helper publication state, node-local child registries, local topology discovery, installed runtime release directories, and per-instance launch scratch.
  These are all live runtime products.
  > Concretely, these are things such as:
  >
  > - recursive naming merges: the currently merged naming view a node computes from its own local records and the exported views of its children
  > - helper publication state: the helper-side forest view from which published DNS data and certificate decisions are derived
  > - node-local child registries: the imported child data records and local bookkeeping a hierarchy-aware node keeps for its direct descendants
  > - local topology discovery: the live view of which children currently exist, which uplink or subtree they own, and which local addresses or services are actually present
  > - installed runtime release directories: the code-only runtime packages that have been unpacked and activated inside a running node or helper
  > - per-instance launch scratch: machine-local temporary data produced while launching, verifying, or reconciling a specific instance

In this rewrite, that dynamic behavior is factored into explicit code-only runtime packages such as `recursive_forest_runtime`, `recursive_host_runtime`, `recursive_edge_runtime`, and `recursive_child_profile_runtime`.
They should be thought of like ordinary software projects that are deployed onto the recursive infrastructure and then operate there, not like hidden template logic or ad-hoc in-container mutations.
The important boundary is that these runtime packages consume generated metadata, rendered configuration, and current local runtime state, but they do not own the generator's templating surface.
That separation keeps the system easier to reason about: static intent is regenerated, dynamic state is reconciled, and neither should quietly become the other.

> In the current design, runtime-derived launch state belongs in machine-local areas such as `/var/lib/recursive-incus-profile-runtime/...`, while steady-state software is installed under versioned runtime paths such as `/opt/recursive-forest-runtime/releases/...` and activated through stable `current` links.

Static intent stays generator-owned.
Dynamic behavior lives in explicit runtime software.
That split makes the system easier to inspect, update, and reason about.

### Deterministic Rendered Artifacts

This generator-first model only helps if the rendered result is predictable.
For the same inputs, the same materialization should be regenerated in the same shape.

That is why generation is intentionally destructive only inside the materialization's `content/` tree, while the outer wrapper directory such as `rip-slim/` stays stable.
That outer directory is the named materialization selected in `uv run recursive-incus-profile generate rip-slim ...`, and in the current development model it is mounted read-only into the generated Incus dev VM at `/workspace` for inspection and verification.

> The dev VM is meant to provide a reproducible reference environment, to show users how a real machine has to be prepared so the system works, and to make it easier to compare behavior across different Linux distributions and Incus versions without constantly changing the main host.

> This dev VM became practically necessary, because the Ubuntu 24.04 Noble Incus `6.0.0-1ubuntu0.3` line ran into repeated outer-daemon recreate failures in our tests, first surfacing as `websocket: close 1006 (abnormal closure): unexpected EOF` and then on restart as `incusd: src/vfs.c:802: vfsDatabaseRead: Assertion 'amount == (int)page_size' failed`.  
> That is why the current development path uses the [Zabbly Incus packages](https://github.com/zabbly/incus) instead of the Ubuntu-native Noble Incus `6.0` packages.
>
> > They are still a third-party package source, but not a random mirror.
> > The Incus installation documentation points to them as the Ubuntu path for up-to-date supported packages, the packaging repository is public, and the verified GitHub organization identifies Zabbly as the business of Incus maintainer Stéphane Graber.
> > So in practice they are much closer to maintainer-published Incus packages than to an anonymous external repo.
>
> - For Ubuntu, Zabbly is listed as one of the two available options, specifically for up to date and supported packages.
> - For Debian, Zabbly is also listed as an option, with support for trixie, bookworm, and bullseye.

The inner `content/` layer exists so the generated artifacts can be replaced completely during regeneration without invalidating that stable outer mount.

The purpose is to make the system inspectable by ordinary tools.
A human should be able to open the generated `*.command`, `*.env`, and `*.json` metadata, inspect the rendered cloud-init and profile fragments, and diff one materialization or one generation against another in normal version control.
The important modularity should therefore be visible in the generated artifact tree, not hidden inside one opaque final YAML blob or one long-lived mutable host installation.

The broader point is reproducibility.
If a generated incus profile (cache, helper, root, or recursive-child) behaves differently, the first question should be whether the generated artifacts differ.
That is a much clearer debugging model than having to guess which live mutation or implicit host state changed last time.

### Success Checklist

At a practical level, the concepts above are only successful if they produce outcomes like these:

* the host-equivalent environment can `ssh c0-2-1.incus`
* the host-equivalent environment can open `https://auth.fasthtml-plus-integration-test.incus`
* a deep plain workload can still reach IPv4-only package or service endpoints through the CLAT and root-edge translation path
* short DNS aliases become visible only after the local registration, upward merge, and helper publication path has completed
* generated artifacts can be inspected and diffed before deployment instead of being hidden inside long-lived host mutation

## Conclusion

The core idea of this series is to turn that first security-oriented idea from [Incus System Container Jail for the Codex Coding Agent](../incus-codex-jail) into a broader recursive infrastructure pattern:
a hierarchy of host-like Incus containers where each level can launch children, provide networking, publish names, participate in trust, and still remain reachable from above through normal tools.

That requires several things to work together at once.
The hierarchy must preserve meaningful isolation while still allowing selective filesystem sharing, delegated capabilities, and ordinary development workflows.
Part of the solution is to provide an IPv6-first recursive transport backbone, an IPv4 compatibility story for software that still depends on IPv4, and a naming and certificate model that lets deeper nodes feel like ordinary reachable hosts instead of hidden nested containers.

Just as importantly, the system should stay understandable to a human.
That is why this rewrite uses a generator-first model, explicit runtime packages, deterministic rendered artifacts, and a clear separation between static intent and dynamic runtime state.
The goal is not only to make the hierarchy work, but to make it inspectable, reproducible, and operable without turning it into an opaque pile of host-bound mutations.

The next posts will move from these concepts into the actual technical backbone.
