---
layout: "layouts/post-with-toc.njk"
title: "Digital Civil Rights and Privacy: Networking, VPN, Tor, Onion over VPN, I2P (Invisible Internet Project), Nym Mixnet"
description: "Reclaiming your digital identity by disguising your networking activity (part I)"
creationdate: 2024-12-17
keywords: digital civil rights, digital privacy, online freedom, secure browsing, GrapheneOS, shadowsocks, VPN, Tor, Onion-over-VPN, I2P, Invisible Internet Project, Nym, mixnet
date: 2024-12-17
tags: ['post']
---

## Rationale

In my previous blog post, [Digital Civil Rights and Privacy: A Practical Guide (Part II)](../digital-civil-rights-privacy-ii/), I highlighted the importance of securing the [network layer](../digital-civil-rights-privacy-ii/#networking) to protect your online privacy.

> Just as crucial as trust in your device is ensuring that you can access the internet anonymously.
> In the [first part](../digital-civil-rights-privacy) of this blog post series, I explained why anonymity is crucial in preventing fingerprinting and tracking.
>
> The Tor network has been the most popular method for anonymous network access.
> However, [recent reports](https://www.bleepingcomputer.com/news/security/tor-says-its-still-safe-amid-reports-of-police-deanonymizing-users) suggest that law enforcement agencies have managed to deanonymize users on the Tor network.
> For more information about the (alleged) technicalities involved in this issue, you can read [Darknet: Investigators used timing analysis to deanonymize Tor users](https://www.heise.de/news/Boystown-Ermittlungen-Mit-der-Stoppuhr-auf-Taeterfang-im-Darknet-9885038.html).
> While Tor claims it's ["still safe"](https://blog.torproject.org/tor-is-still-safe), some degree of skepticism is well placed.
>
> For a comparative look at different network anonymity solutions, you might find [VPNs, Tor, I2P — how does Nym compare?](https://blog.nymtech.net/vpns-tor-i2p-how-does-nym-compare-8576824617b8) helpful.
> This 2020 article highlights several options for protecting your online identity, including VPNs, Tor, I2P, and Nym.
>
> In terms of requirements, you should prioritize open-source [mixnets](https://nymtech.net/about/mixnet) that are free or offer an anonymous payment option.
> Moreover, there should be an incentive system in place to encourage many participants to contribute to the mixnet.
> A robust mixnet with numerous nodes makes it significantly harder for even the most sophisticated adversaries to monitor a significant fraction of all nodes.
> This will increase your chances of staying anonymous substantially.

In this post, we will dive deeper into practical solutions that protect your anonymity at the network layer, helping you to maintain privacy while navigating the digital world.

## Tor Browser: Simplified Privacy and Censorship Resistance

The simplest way to access the Tor network is by downloading and using the [Tor Browser](https://www.torproject.org/download).
This browser is preconfigured to route your internet traffic through the Tor network.
If you're reading this page via the Tor Browser, you can click [here](https://check.torproject.org/) to verify your connection.
A unique feature of the Tor Browser is its ability to access [.onion](https://en.wikipedia.org/wiki/.onion) top-level domains, like the [BBC's .onion site](https://www.bbcweb3hytmzhn5d532owbu6oqadra5z3ar726vq5kgwwn6aucdccrad.onion/), for a more private browsing experience.


**Potential Challenges with Tor Browser**: While Tor Browser is an excellent tool, you may encounter some challenges.
Certain websites, such as the popular economics blog [Marginal Revolution](https://marginalrevolution.com) by [Tyler Cowen](https://en.wikipedia.org/wiki/Tyler_Cowen) and [Alexander Tabarrok](https://en.wikipedia.org/wiki/Alex_Tabarrok), block traffic from the Tor network.
This is possible because websites can detect Tor traffic and choose to restrict it.
Sites often do this to deter malicious actors who may use Tor to hide their tracks.

The Tor network is primarily designed to bypass censorship and ensure free internet access in restrictive environments.
The Tor network's infrastructure is transparent about its relay system.
The IP addresses of Tor relays (guard, middle, and exit nodes) are publicly known.
To enhance anonymity at the network's entry point, Tor offers [bridges](https://bridges.torproject.org/) that help users mask their activities when entering the network.
However, these bridges can only be used as entry points and [cannot function as exit nodes](https://www.reddit.com/r/TOR/comments/tnkowl/can_i_use_a_tor_bridge_as_an_exit_node_with_obfs4/):

> Tor bridges are used as entry points into the Tor network. You can't use them as exits.

This means it is still possible for websites to identify that you are accessing them [via the Tor network](https://community.torproject.org/relay/types-of-relays/):

> The design of the Tor network means that the IP addresses of Tor relays (guard, middle, and exit) are public.


**Security Levels and Their Impact**: Certain websites may present compatibility issues with Tor Browser's higher security levels.
For instance, [Brave Search](https://search.brave.com/) becomes inaccessible when using stricter security settings that disable WebAssembly. The Brave team acknowledges this limitation and is working to improve the Tor user experience.

> If you are using the Tor Browser with its safer or safest security level, WebAssembly support is disabled and you will unfortunately not be able to access Brave Search after your request has been flagged as suspicious. We are actively working on ways to improve the experience of Tor users on Brave Search.

Some `.onion` sites, like the [SecureDrop](https://securedrop.org) instance on `heise.de` for [whistle-blowers](https://www.heise.de/investigativ/briefkasten/) available via the [tor network](http://ayznmonmewb2tjvgf7ym4t2726muprjvwckzx2vhf2hbarbbzydm7oad.onion), require higher [security settings](https://tb-manual.torproject.org/security-settings/) for such sensitive activities like whistleblowing.
Their system warns users if the browser's security level is too low, emphasizing the importance of using the "Safest" setting for critical privacy needs:

> Your Tor Browser's Security Level is too low. Use the "Security Level" button in your browser's toolbar to change it.

For activities where privacy is absolutely critical, it is strongly recommended to use the Tor Browser in its highest security setting.

**Performance Considerations**: Browsing with Tor can be slower than conventional browsing.
Since your connection is routed through three relays — guard, middle, and exit nodes — it adds latency.
This is the trade-off for improved privacy and anonymity.

**Additional Resources**: 
For a deeper dive into Tor's structure, refer to resources like the [Tor Overview](https://www.privacyguides.org/en/advanced/tor-overview/) on [Privacy Guides](https://www.privacyguides.org/en/).
If you're eager to explore `.onion sites`, check out guides like [Dark Web Links: The best .onion and Tor sites in 2024](https://www.expressvpn.com/blog/best-onion-sites-on-dark-web).
For German-speaking readers, there are in-depth articles available behind a paywall:

* [Anonym surfen und Zensur umgehen: Nutzen und Grenzen von Tor](https://www.heise.de/hintergrund/Anonym-surfen-und-Zensur-umgehen-Nutzen-und-Grenzen-des-Tor-Browsers-7141666.html)
* [Das .onion-Darknet jenseits der Illegalität: Legal, illegal ...](https://www.heise.de/select/ix/2016/11/1478169222167661)

And here are some practical tips to enhance your Tor browsing experience:

* Keep Tor Browser Updated: Regular updates ensure you have the latest security patches.
* Consider Additional Privacy Measures: Using a VPN alongside Tor can provide an extra layer of security (covered in a later section of this blog post).
* Be Careful with Downloads: Downloaded files may contain malware and compromise your security.
* Manage Your Expectations: Absolute anonymity is difficult to achieve, so use Tor as part of a broader privacy strategy.

## Shadowsocks, VPN, Tor SOCKS5 Proxy, Onion-over-VPN

When explaining setups like this, I often struggle with the question whether to start with the big picture top-down or build up from the basics bottom-up.
This time, I'll give you a glimpse of the final setup and its core functionality, and then, in later sections, break it down step by step.

Below is a `docker-compose.yaml` file that sets up multiple `SOCKS5` proxy configurations in one go. Each configuration provides a unique way to route your traffic:
* Port `1080`: `any-browser → SOCKS5 → VPN` (VPN-over-SOCKS5)
* Port `1081`: `any-browser → SOCKS5 → VPN → Tor` (Onion-over-VPN-over-SOCKS5)
* Port `1080` (with Tor Browser): `tor-browser → SOCKS5 → VPN` (Onion-over-VPN-over-SOCKS5)
* Optional setup with a slight modification: `any-browser → SOCKS5 (sslocal) → sserver → VPN → Tor` (Onion-over-VPN-over-Shadowsocks-SOCKS5)

To try this setup, simply run the Docker Compose stack:

```bash
/usr/bin/docker compose -f ./docker-compose.yaml pull --quiet --parallel && /usr/bin/docker compose -f ./docker-compose.yaml --profile all up -d
```

> To try this setup, you'll need a [NordVPN](https://nordvpn.com/) subscription.
> If you're using a different VPN provider, check out the [Gluetun Docker Guide](https://www.smarthomebeginner.com/gluetun-docker-guide/).
> [gluetun](https://github.com/qdm12/gluetun) is a lightweight VPN client container written in [Go](https://go.dev/) that supports multiple VPN providers.
> The guide shows how to adapt the setup to work with providers other than `NordVPN` by replacing the `vpn` service with a corresponding `gluetun` section.

> For added security, I built the `tor-socks-proxy-debian:latest` Docker image myself.
> The build instructions are provided further below.
> However, if you want to quickly verify the setup, you can replace this image with the stock `peterdavehello/tor-socks-proxy:latest` image.

> > **A Note on Security for Docker Images**: When working with security-sensitive setups like this, it's essential to take precautions:
> > 1. Check out the Source Code: Check out the source code from their source code repository.
> > 1. Review Source Code: Always inspect the source code and the `Dockerfile` for any container you plan to use.
> > 1. Build Your Own Images: Even if you don't spot issues in the `Dockerfile`, it's safer to build the image yourself from the version you checked out in step 1. Images on `Docker Hub` may not always correspond to their published source code.
> >
> > **Why I Built My Own tor-socks-proxy Image**:
> > For the `tor-socks-proxy` container, I created a custom `Dockerfile` using the [official Tor installation instructions](https://support.torproject.org/apt/tor-deb-repo/) for `Debian`. This decision stemmed from a few concerns:
> > * The stock `peterdavehello/tor-socks-proxy` image is based on [Alpine Linux](https://alpinelinux.org/) and uses `community` and `testing` repositories, which aren't mentioned in the Tor project's [official documentation](https://community.torproject.org/onion-services/setup/install/) as supported platforms.
> > * Tor serves as the innermost security layer for critical traffic, so ensuring the integrity of this container is paramount.
> >
> > **Why Use Stock Images for Other Services?**:
> > For less critical services, I rely on stock images from `Docker Hub`.
> > While rebuilding all images from source is ideal, it's not always practical.
> > Focusing on the `tor-socks-proxy` container ensures robust security where it matters most, balancing security and practicality.

> Initial Setup Instructions: For the first run, follow these steps:
>
> 1. **Uncomment the First VPN Service**: Open the `docker-compose.yaml` file, uncomment the first `vpn` service, comment the second `vpn` service, and replace `TOKEN=` with a [token](https://support.nordvpn.com/hc/en-us/articles/20286980309265-How-to-use-a-token-with-NordVPN-on-Linux) obtained from the `NordVPN` web GUI.
> 1. **Run the Stack Without Daemon Mode**: Start the stack without the `-d` option so you can see the logs:
> ```bash
> /usr/bin/docker compose -f ./docker-compose.yaml --profile all up
> ```
> 3. **Get the `PRIVATE_KEY`**: Watch the logs for the `PRIVATE_KEY`. Once it's printed, stop the stack by pressing `Ctrl-C`.
> 1. **Switch to the Second VPN Service**: Comment out the first `vpn` service again. Uncomment the second `vpn` service in the docker-compose.yaml file. Paste the `PRIVATE_KEY` from the first run into the `PRIVATE_KEY=` field.
> 1. **Starting the Stack**: From now on, you can start the container using the following command:
> ```bash
>  /usr/bin/docker compose -f ./docker-compose.yaml --profile all up -d
> ```


And here is the `docker-compose.yaml` file:

```yaml
########################### EXTENSION FIELDS
# Helps eliminate repetition of sections
# Keys common to some of the core services that we always to automatically restart on failure
x-common-keys-core: &common-keys-core
  restart: always

services:
  # vpn:
  #   <<: *common-keys-apps
  #   image: ghcr.io/bubuntux/nordvpn
  #   ports:
  #     - "127.0.0.1:8853:53/udp"
  #     - "127.0.0.1:1081:9150/tcp"
  #     - "127.0.0.1:1080:1080"
  #   environment: # Review https://github.com/bubuntux/nordvpn#environment-variables
  #     - TOKEN=_xXx_access_token_xXx_ # https://support.nordvpn.com/hc/en-us/articles/20286980309265-How-to-use-a-token-with-NordVPN-on-Linux
  #     - CONNECT=Germany
  #     - TECHNOLOGY=NordLynx
  #     - DNS=9.9.9.9,149.112.112.112
  #   sysctls:
  #     - net.ipv6.conf.all.disable_ipv6=1  # Recomended if using ipv4 only
  #   cap_add:
  #     - NET_ADMIN
  #     - NET_RAW

  vpn:
    <<: *common-keys-core
    image: ghcr.io/bubuntux/nordlynx
    ports:
      - "127.0.0.1:8853:53/udp"
      - "127.0.0.1:1081:9150/tcp"
      - "127.0.0.1:1080:1080"
    cap_add:
      - NET_ADMIN
    environment:
      - PRIVATE_KEY=_xXx_private_key_xXx_ # get after first start above from running ghcr.io/bubuntux/nordvpn
      - COUNTRY_CODE=DE # https://api.nordvpn.com/v1/servers/countries

  tor-socks-proxy:
    <<: *common-keys-core
    # image: peterdavehello/tor-socks-proxy:latest
    image: tor-socks-proxy-debian:latest
    profiles: ["all"]
    network_mode: service:vpn
    depends_on:
      - vpn

  ssserver:
    <<: *common-keys-core
    image: ghcr.io/shadowsocks/ssserver-rust:latest
    command: ssserver -v -s 127.0.0.1:8388 -k hello-kitty -m none
    network_mode: service:vpn
    depends_on:
      - vpn

  sslocal:
    <<: *common-keys-core
    image: ghcr.io/shadowsocks/sslocal-rust:latest
    command: sslocal -b 0.0.0.0:1080 -s 127.0.0.1:8388 -k hello-kitty -m none
    network_mode: service:vpn
    depends_on:
      - ssserver
```

Once your setup is running, you can verify that everything works as expected using the following commands:

```bash
# VPN Check:
curl --proxy socks5h://localhost:1080 -s https://ifconfig.me/  # Compare the output to the IP shown on NordVPN's "What is my IP" tool: https://nordvpn.com/de/what-is-my-ip/
# Onion-over-VPN Check:
curl --proxy socks5h://localhost:1081 -s https://check.torproject.org
curl --proxy socks5h://localhost:1081 -w "\n" -s https://check.torproject.org/api/ip
```

**Additional Resources**: For more tips on verifying your VPN setup, check out [How to check if your VPN is working](https://nordvpn.com/de/blog/check-vpn-working/). You can also use tools like [IPLeak](https://ipleak.net/) to perform leak tests and ensure your privacy is intact.

### General

All networking anonymity relies on using someone else's TCP/IP connection.
Ultimately, someone must connect to the network.
If it's not your connection, then it's borrowed from someone else.

> Side Note: The more users who share the same network host as an entry point to the internet, the harder it becomes to distinguish individual connections.
> You essentially "blend into the crowd," making it more difficult to trace any single user's activity.

### SOCKS5 and Your Web Browser

Before diving deeper, let's take a moment to understand `SOCKS5`.

A `SOCKS` server acts as a proxy for TCP connections to any IP address and can also forward UDP packets.
It listens for client connections on TCP port `1080`.
Many applications — such as web browsers, FTP clients, and other network-enabled software — allow you to configure proxy settings, enabling traffic to be routed through the `SOCKS` server instead of directly through your device's network stack.

**Configuring SOCKS5 in Web Browsers**: Here's documentation on how to set up a `SOCKS5` proxy for popular browsers:

* [Chrome (and its derivatives)](https://oxylabs.io/resources/integrations/chrome)
    * Command-line setup: [Configuring a SOCKS proxy server in Chrome](https://www.chromium.org/developers/design-documents/network-stack/socks-proxy/).
* [Mozilla Firefox (and its derivatives)](https://iproyal.com/blog/how-to-configure-a-proxy-server-in-your-firefox-browser/)
    * Command-line setup: [ssh socks5 proxy setup with firefox](https://gist.github.com/tumregels/a04a62ce717e4a4902176113375087d8).
* Tor Browser: Proxy setup instructions are available under [Other Options](https://tb-manual.torproject.org/running-tor-browser/) in the [Running Tor Browser for the First Time](https://tb-manual.torproject.org/running-tor-browser/)  guide.

For other networked software, refer to [integrations with the most popular third-party software](https://oxylabs.io/resources/integrations).

**Using FoxyProxy Browser Extension**: [FoxyProxy](https://github.com/foxyproxy/browser-extension) is an open-source browser extension for Firefox, Chrome, and other Chromium-based browsers. It offers several advantages:

* **Multi-Proxy Configuration**: Set up multiple proxies and define rules as to when to apply which one.
* **Visual Proxy Indicators**: Easily see which proxy is active for each tab.
* **Detailed Logs**: Monitor proxy usage and debug configurations with ease.

You can find out about it's configuration syntax in its [Help](https://foxyproxy.github.io/browser-extension/src/content/help.html) page.

For example, in [LibreWolf](https://librewolf.net/), you can configure `FoxyProxy` to:

* Use `Onion-over-VPN` as the default proxy (port `1081`).
* Switch to your raw VPN (port `1080`) for websites like [Marginal Revolution](https://marginalrevolution.com) that block Tor traffic.
* Use your local network for home devices by leveraging `FoxyProxy`'s [Global Exclude](https://foxyproxy.github.io/browser-extension/src/content/help.html#global-exclude) feature.

**Proxy Auto-Configuration (PAC) Files**: Another option is the [Proxy Auto-Configuration (PAC) file](https://developer.mozilla.org/en-US/docs/Web/HTTP/Proxy_servers_and_tunneling/Proxy_Auto-Configuration_PAC_file) method, which uses `JavaScript` to determine the appropriate proxy for specific sites. PAC files offer great flexibility but come with trade-offs:
* **Pros**: Dynamic and adaptable to various scenarios.
* **Cons**: Debugging PAC files can be challenging, and browsers won't visually indicate which proxy is active during use.

You can find examples of PAC file usage on the [Proxy auto-config](https://en.wikipedia.org/wiki/Proxy_auto-config) Wikipedia page.

#### ProxyChains

If you encounter a networked program that doesn't support `SOCKS` proxies natively (like telnet), you can use `ProxyChains` to route its connections through a proxy. `ProxyChains` forces all outgoing connections to pass through one or more proxies, ensuring proper routing through `SOCKS`.

You can find more details about ProxyChains on its GitHub page: [proxychains-ng](https://github.com/rofl0r/proxychains-ng).

Key Features of `ProxyChains`:

* ProxyChains-ng (New Generation) is a modern version of the original [ProxyChains](https://proxychains.sourceforge.net/). It is a preloader which hooks `libc` calls to sockets in dynamically linked programs and redirects it through one or more socks/http proxies. It builds on the unmaintained [ProxyChains](https://proxychains.sourceforge.net/) project with improved features and updates.
* ProxyChains is a UNIX program, that hooks network-related `libc` functions in DYNAMICALLY LINKED programs via a preloaded DLL (dlsym(), LD_PRELOAD) and redirects the connections through SOCKS4a/5 or HTTP proxies.
* It only handles TCP connections (no support for UDP, ICMP, etc.).

### SOCKS5 Proxy Encryption and Data Protection

Let me provide some details about [SOCKS5](https://en.wikipedia.org/wiki/SOCKS#SOCKS5) proxy encryption and data protection.

By default, a standard `SOCKS5` proxy does not automatically encrypt the connection between your local machine and the proxy server.
`SOCKS5` is a protocol that routes network packets between a client and server, but it does not inherently provide encryption.
To ensure data protection, you'll want to use additional encryption methods:


* `SOCKS5` with SSL/TLS: Some proxy providers offer SSL/TLS encryption over the `SOCKS5` connection, which provides security for the data in transit.
* VPN over `SOCKS5`: Using a VPN in conjunction with a `SOCKS5` proxy can add an encryption layer.
* HTTPS/SSL Proxying: If you're accessing HTTPS websites, the underlying SSL/TLS encryption will protect your data end-to-end.

These options ensure your traffic remains private and secure while using SOCKS5.

### VPN via SOCKS5 Proxy

Certain VPN providers, like NordVPN, allow [connections via SOCKS5](https://support.nordvpn.com/hc/en-us/articles/20195967385745-NordVPN-proxy-setup-for-qBittorrent). However, keep this in mind: standard `SOCKS5` lacks encryption. While browsing `HTTPS` websites encrypts your payload data, metadata such as `IP` addresses may still be exposed. This means sensitive information about your connection might leak. Carefully evaluate whether this setup meets your privacy and security needs.

### SSH SOCKS Proxy Setup

By using the `-D` option of the standard OpenSSH `ssh` client, you can securely route your traffic through a remote server. Here's a quick example:

```bash
ssh -D 1080 user@remote.tld
```
This command creates a `SOCKS5` proxy, making your network traffic that is routed via the proxy appear as if it originated from the `remote.tld` server.

The `-D` option specifies a local “dynamic” application-level port forwarding.
This works by allocating a socket to listen to port on the local side, optionally bound to the specified `bind_address`.
Whenever a connection is made to this port, the connection is forwarded over the secure channel, and the application protocol is then used to determine where to connect to from the remote machine.
Currently the `SOCKS4` and `SOCKS5` protocols are supported, and `ssh` will act as a `SOCKS` server.

For a more detailed walkthrough, check out the [Ultimate Guide to SSH SOCKS Proxy Setup](https://swissmade.host/en/blog/ultimate-guide-to-ssh-socks-proxy-setup-secure-browsing-on-windows-macos-and-linux).

### Shadowsocks: A Secure Alternative

Unlike standard `SOCKS5`, [Shadowsocks](https://shadowsocks.org/) adds a robust encryption layer by default, securing the connection between the client and server.
This makes it more privacy-focused and resistant to network monitoring compared to traditional `SOCKS5` proxies.

At its core, `shadowsocks` operates as a "split" network connection, somewhat similar to SSH tunneling. It consists of two key components:

* `sslocal`: Runs on your local machine and provides a standard [SOCKS5](https://en.wikipedia.org/wiki/SOCKS#SOCKS5) proxy interface.
* `ssserver`: Operates on a remote machine, serving as the entry point to the open internet.

The communication between `sslocal` and `ssserver` is not only encrypted but can also be obfuscated (using [plugins](https://shadowsocks.org/doc/sip003.html)) to disguise the type of traffic being transmitted. Observers monitoring the connection won't be able to tell what's happening, adding an extra layer of privacy. You can learn more about `shadowsocks` in the article: [Installing Shadowsocks-rust: a Secure, Open-source Proxy Server, Better Than VPN](https://hackernoon.com/installing-shadowsocks-rust-a-secure-open-source-proxy-server-better-than-vpn).


Unlike using `ssh` with the `-D` option, `shadowsocks` allows obfuscation and can run as an independent service.
Since `ssserver` is a standalone process, it can remain active on the remote machine even if your local machine disconnects.

> **Shadowsocks for `Censorship Evasion`**:<br>I first learned about `shadowsocks` on the [Unredacted](https://unredacted.org) subpage of [FreeSocks](https://unredacted.org/services/ce/freesocks/). This service helps users worldwide bypass internet censorship.
>
> [Unredacted](https://unredacted.org) offers access to a fleet of anonymous `ssserver` hosts. For more details, check their website at [freesocks.org](https://freesocks.org/docs/). However, note this important restriction:
> > New access keys can only be retrieved from countries with heavy Internet censorship. If you try to get an access key from a country where your government doesn't heavily censor the Internet, you will be restricted from doing so.

To use `shadowsocks`, you would typically rent a cloud server and run the `ssserver` program on it.
On your local machine, you'd set up `sslocal` to route your traffic through this ssserver instance.

This setup can be effective for `Censorship Evasion`, but it has limitations when it comes to anonymity. Why?
Because renting a cloud server usually requires identifiable payment methods.
Unless you can pay anonymously or use someone else's cloud server without revealing your identity, this setup won't provide network anonymity.

If you refer to the `ssserver` and `sslocal` services in the provided `docker-compose.yaml` file, you'll notice that I've "repurposed" these two components as a standard `SOCKS` proxy.

This approach serves two purposes:

1. It demonstrates how the two services function together in a practical setup.
1. With minor adjustments, you could deploy this `docker-compose` stack on any remote machine, make its services accessible via the `shadowsocks` `ssserver` instance, and connect to it using a local `sslocal` component.

**Note**: If you choose to use this setup remotely, make sure to enable encryption. In my use case, I disabled it using the `-m none` option for simplicity, but encryption is essential for secure communication in real-world scenarios.


### Tor as a SOCKS Proxy

Tor can be run as an independent process that provides access to the Tor network through a `SOCKS5` proxy interface.
This allows any program that supports the `SOCKS` protocol to route its traffic through the Tor network for enhanced privacy.

If you refer to the `tor-socks-proxy` service in the provided `docker-compose.yaml` file, you'll see that this setup demonstrates exactly how to achieve this.

### VPNs

Unlike a `SOCKS5` proxy, which requires compatible programs that understand the `SOCKS` protocol, a VPN reroutes all network traffic from your device through a remote server.
This remote server acts as an exit node, making all your internet activity appear as if it originates from there.

While VPNs can be effective for `Censorship Evasion`, they don't offer true anonymity. Why?
The reason is the same as the one already mentioned above in the [Shadowsocks](#shadowsocks%3A-a-secure-alternative) section:
Because you typically need to pay for the service, which can link your identity to your usage.
Even if a VPN provider claims to keep no logs or guarantees your privacy, using their service ultimately requires placing your trust in them.

As I've emphasized in earlier parts of this blog series, it's better to safeguard your digital rights through technical measures rather than relying solely on legal promises from service providers.
For this reason, a VPN isn't a solution to preserving your online anonymity.

There is one exception: if your VPN provider supports anonymous payment methods, such as cash or anonymity preserving cryptocurrencies.
For instance, [Mullvad VPN](https://mullvad.net/en/pricing) is an example of a service that allows cash payments, helping to preserve your anonymity.

In the provided `docker-compose.yaml` file, the `vpn` service demonstrates a VPN setup in action.
By specifying `network_mode: service:vpn` (or alternatively, `network_mode: container:vpn` if you assign a `container_name: vpn` to the VPN container), all other containers are effectively placed in the same network environment as the VPN container.
This configuration ensures that the containers that specified `network_mode: service:vpn` are shielded by the VPN.

**A critical detail to note**: with this setup, any published ports must be defined under the `vpn` service's `ports:` section in the `docker-compose.yaml` file, not under the services that provide those ports.

### Onion-over-VPN: 

`Onion-over-VPN` combines a VPN with the Tor network, creating a multi-layered privacy solution.
Your traffic first passes through the VPN, and then through the Tor network's relays (guard, middle, and exit nodes), resulting in a **four-hop network indirection**.

This setup enhances security by shielding your Tor usage from your internet service provider (ISP).
Your ISP will only see the VPN connection, while the VPN provider may detect Tor traffic.
However, Tor bridges can help obscure this, ensuring that neither your ISP nor your VPN provider knows you're using the Tor network.


How to Set Up Onion-over-VPN: There are two ways to achieve this setup:

1. **Using the Tor Browser**: Configure the Tor Browser to route traffic through the VPN's `SOCKS` proxy interface (e.g., port `1080` in our `docker-compose` stack).
1. **Configuring Tor Inside the VPN Environment**: Use the `network_mode: service:vpn` configuration (as explained earlier) to place the Tor component inside the VPN environment. In this case, the Tor process provides a `SOCKS` proxy interface directly. You can then configure any browser to route traffic through this interface. The VPN layer serves as the outermost layer, followed by the Tor layers.

#### Pre-Packaged Onion-over-VPN

Some VPN providers, like NordVPN, offer pre-packaged [Onion Over VPN](https://nordvpn.com/features/onion-over-vpn/) solutions.
However, I prefer keeping my local Tor components under my own control for added peace of mind and trustworthiness.

#### Criticism about Onion-over-VPN

There is some debate about whether combining VPN and Tor provides meaningful benefits.
For more information, check out the article: [VPN + Tor: Not Necessarily a Net Gain](https://web.archive.org/web/20220228213639/https://matt.traudt.xyz/posts/2016-11-12-vpn-tor-not-net-gain/).
If you prefer video content, consider watching: [Stop Using Tor With VPNs](https://www.youtube.com/watch?v=y8bIt4K_Kfo).

Personally, I see VPN + Tor as a net gain. Tor alone offers anonymity, but combining it with a VPN hides your Tor usage from your ISP.
Additionally, with Tor bridges, you can obscure this usage from your VPN provider too.
> My argument here would be: if you can't trust bridges used with a VPN provider, why trust them with plain Tor at all?
>
> Furthermore, a VPN provider's business hinges on trust.
> If it ever came to light that a provider shared logs they claim not to keep, their credibility — and their entire business — would collapse.
> This strong incentive should discourage any (open) betrayal of trust.

By combining a VPN and Tor, you can achieve anonymity while masking the fact that you're using anonymity tools at all.

## Technical Details and Source Code

You can find all the source files in this GitHub Gist: [Digital Civil Rights and Privacy: Networking, VPN, Tor, Onion over VPN](https://gist.github.com/cs224/f55f8fa69e936a705833d2011878cf94).

### Building the `tor-socks-proxy-debian:latest` Docker Image

To get started, download and review the following two files:
* `tor-socks-proxy-debian.dockerfile`
* `tor-socks-proxy-debian.makefile`

Next, build the Docker image locally using the following command:
```bash
make -f tor-socks-proxy-debian.makefile tor-socks-proxy-debian-image
```

### Installing the Files

Now, download the additional required files:
* `docker-compose-socks5-shadowsocks-nordvpn-tor-install.sh`
* `docker-compose-socks5-shadowsocks-nordvpn-tor.yaml`
* `docker-compose-socks5-shadowsocks-nordvpn-tor.service`
* `docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service`
* `docker-compose-socks5-shadowsocks-nordvpn-tor-restart.timer`

The `install.sh` script will guide you through the installation process step by step.
Follow its instructions as you see fit in your personal circumstances:
```bash
mkdir -p /opt/docker-services/socks5-vpn-tor
cp ./docker-compose-socks5-shadowsocks-nordvpn-tor.yaml /opt/docker-services/socks5-vpn-tor/docker-compose.yaml

cp ./docker-compose-socks5-shadowsocks-nordvpn-tor.service /etc/systemd/system/
cp ./docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service /etc/systemd/system/
cp ./docker-compose-socks5-shadowsocks-nordvpn-tor-restart.timer /etc/systemd/system/

systemctl daemon-reload
# systemctl enable --now docker-compose-socks5-shadowsocks-nordvpn-tor.service
# systemctl enable --now docker-compose-socks5-shadowsocks-nordvpn-tor-restart.timer

# systemctl status docker-compose-socks5-shadowsocks-nordvpn-tor.service
# systemctl status docker-compose-socks5-shadowsocks-nordvpn-tor-restart.timer
# systemctl list-timers
# journalctl -u docker-compose-socks5-shadowsocks-nordvpn-tor.service

# systemctl start docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service
# systemctl status docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service
# journalctl -u docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service
```

### Initial Setup Instructions

As already mentioned earlier in this blog post, to try this setup verbatim, you'll need a [NordVPN](https://nordvpn.com/) subscription.
If you're using a different VPN provider, check out the [Gluetun Docker Guide](https://www.smarthomebeginner.com/gluetun-docker-guide/).
[gluetun](https://github.com/qdm12/gluetun) is a lightweight VPN client container written in [Go](https://go.dev/) that supports multiple VPN providers.
The guide shows how to adapt the setup to work with providers other than `NordVPN` by replacing the `vpn` service with a corresponding `gluetun` section.

For added security, we built the `tor-socks-proxy-debian:latest` Docker image ourselves.

> **A Note on Security for Docker Images**: When working with security-sensitive setups like this, it's essential to take precautions:
> 1. Check out the Source Code: Check out the source code from their source code repository.
> 1. Review Source Code: Always inspect the source code and the `Dockerfile` for any container you plan to use.
> 1. Build Your Own Images: Even if you don't spot issues in the `Dockerfile`, it's safer to build the image yourself from the version you checked out in step 1. Images on `Docker Hub` may not always correspond to their published source code.
>
> **Why I Built My Own tor-socks-proxy Image**:
> For the `tor-socks-proxy` container, I created a custom `Dockerfile` using the [official Tor installation instructions](https://support.torproject.org/apt/tor-deb-repo/) for `Debian`. This decision stemmed from a few concerns:
> * The stock `peterdavehello/tor-socks-proxy` image is based on [Alpine Linux](https://alpinelinux.org/) and uses `community` and `testing` repositories, which aren't mentioned in the Tor project's [official documentation](https://community.torproject.org/onion-services/setup/install/) as supported platforms.
> * Tor serves as the innermost security layer for critical traffic, so ensuring the integrity of this container is paramount.
>
> **Why Use Stock Images for Other Services?**:
> For less critical services, I rely on stock images from `Docker Hub`.
> While rebuilding all images from source is ideal, it's not always practical.
> Focusing on the `tor-socks-proxy` container ensures robust security where it matters most, balancing security and practicality.

Initial Setup Instructions: For the first run, follow these steps:

1. **Uncomment the First VPN Service**: Open the `docker-compose.yaml` file, uncomment the first `vpn` service, comment the second `vpn` service, and replace `TOKEN=` with a [token](https://support.nordvpn.com/hc/en-us/articles/20286980309265-How-to-use-a-token-with-NordVPN-on-Linux) obtained from the `NordVPN` web GUI.
1. **Run the Stack Without Daemon Mode**: Start the stack without the `-d` option so you can see the logs:
```bash
/usr/bin/docker compose -f ./docker-compose.yaml --profile all up
```
3. **Get the `PRIVATE_KEY`**: Watch the logs for the `PRIVATE_KEY`. Once it's printed, stop the stack by pressing `Ctrl-C`.
1. **Switch to the Second VPN Service**: Comment out the first `vpn` service again. Uncomment the second `vpn` service in the docker-compose.yaml file. Paste the `PRIVATE_KEY` from the first run into the `PRIVATE_KEY=` field.
1. **Starting the Stack**: From now on, you can start the container using the following command:
```bash
 /usr/bin/docker compose -f ./docker-compose.yaml --profile all up -d
```

### Understanding the `--profile all` Setting

You might wonder why the `--profile all` switch is used. The reason is that without it, the `docker compose pull` commands would fail because the self-built `tor-socks-proxy-debian:latest` Docker image is not available in any online repository.

To resolve this, I introduced the `profiles: ["all"]` setting in the `docker-compose.yaml` file for the VPN service.
This way I can decide via this switch, when to include this service in a `docker compose` command.
* When `running` the stack include the service.
* During updates with `docker compose pull` exclude the service.

In short, this setup ensures a smooth experience when managing your Docker stack.

### Optional: Using the Systemd Service

Once the initial setup is complete, you can optionally use the `docker-compose-socks5-shadowsocks-nordvpn-tor.service`.
While this isn't strictly necessary — since the `restart: always` setting in the compose file ensures containers restart automatically — it adds an extra layer of control.

To enable the systemd service, run:
```bash
systemctl enable --now docker-compose-socks5-shadowsocks-nordvpn-tor.service
```

### Optional: Using the Timed Systemd Restart Service

If you prefer, you can set up a daily restart of the Docker stack using the `docker-compose-socks5-shadowsocks-nordvpn-tor-restart.timer` and `docker-compose-socks5-shadowsocks-nordvpn-tor-restart.service`.

Run the following command to enable the timed service:
```bash
systemctl enable --now docker-compose-socks5-shadowsocks-nordvpn-tor.service
```

This will stop and start the Docker Compose stack daily at 3:00 AM, ensuring the stack stays up-to-date.

## Conclusions and Outlook

In this blog post, I demonstrated how to use a `docker compose` stack to set up multiple `SOCKS5` proxy configurations at once.
Each configuration offers a unique way to route your traffic, depending on your privacy and routing needs:
* Port `1080`: `any-browser → SOCKS5 → VPN` (VPN-over-SOCKS5)
* Port `1081`: `any-browser → SOCKS5 → VPN → Tor` (Onion-over-VPN-over-SOCKS5)
* Port `1080` (with Tor Browser): `tor-browser → SOCKS5 → VPN` (Onion-over-VPN-over-SOCKS5)
* Optional setup with a slight modification: `any-browser → SOCKS5 (sslocal) → sserver → VPN → Tor` (Onion-over-VPN-over-Shadowsocks-SOCKS5)

Each configuration provides a different level of anonymity, allowing you to choose the best option for your use case.

To manage these proxy options efficiently, you can use the [FoxyProxy](https://github.com/foxyproxy/browser-extension) Browser Extension.
It is available for Firefox, Chrome, and other Chromium-based browsers and gives you a flexible way to control how your traffic is routed.

For example, in [LibreWolf](https://librewolf.net/), you can configure `FoxyProxy` to:

* Use `Onion-over-VPN` as the default proxy (port `1081`).
* Switch to your raw VPN (port `1080`) for websites like [Marginal Revolution](https://marginalrevolution.com) that block Tor traffic.
* Use your local network for home devices by leveraging `FoxyProxy`'s [Global Exclude](https://foxyproxy.github.io/browser-extension/src/content/help.html#global-exclude) feature.

### A Word of Caution

In this blog post, I've shown you how to create a technical setup that provides different network routing options with varying levels of anonymity.
However, much like any powerful tool — such as a chainsaw — it can cause more harm than good in the hands of someone unfamiliar with its risks and pitfalls.

In a future blog post, I'll discuss strategies for using these options effectively.
For now, I'll give you a simplified overview: think of your digital privacy as different personas — public and private.

**Your Public Persona**: Your public persona doesn't require full anonymity. It uses a privacy-focused browser like [Brave](https://www.kuketz-blog.de/brave-und-firefox-sichere-und-datenschutzfreundliche-browser-teil-2/) combined with your standard ISP network. This avoids unnecessary anonymity that could trigger security checks. For example, services like your bank's online portal may block you for fraud prevention if you access them with too much anonymity enabled.

**Your Private Persona**: Your private persona requires more care and uses two browsers:
1. [Tor-Browser](https://www.kuketz-blog.de/librewolf-und-tor-browser-sichere-und-datenschutzfreundliche-browser-teil-3) or [Mullvad-Browser](https://www.kuketz-blog.de/mullvad-browser-sichere-und-datenschutzfreundliche-browser-teil-4): For browsing anonymously without logging in.
1. [LibreWolf](https://www.kuketz-blog.de/librewolf-und-tor-browser-sichere-und-datenschutzfreundliche-browser-teil-3): For activities where you need to log in as a recognized user.

For your private persona, network anonymity should be as fine-grained as possible to limit the chances of backward cross-correlation of your identity.

**What is Backward Cross-Correlation?** Here's a simplified example:

* When using the Tor network, exit nodes (IP addresses) change periodically.
* If, during the same exit node session, you log into a website (where your identity is known) and simultaneously visit another service, that second service (or a [Global Passive Adversary](https://news.ycombinator.com/item?id=9977465)) might identify you.

How? Through [fingerprinting](../digital-civil-rights-privacy-ii/#web-browser) techniques and timestamps. The second service could correlate your activity to the known IP and ask the first service (where you logged in) for details about who was active at that time. Even though you're using a Tor exit node, this cross-correlation could reveal your identity.

To minimize this risk I recommend as a best practice to use separate browsers for separate purposes. By separating your activities this way, you reduce the risk of cross-correlation.

* Use a fingerprint-resistant browser like the Tor Browser or Mullvad Browser with a network anonymization layer (like VPN or Tor) for all activities where you don't log in.
* Use a second fingerprint-resistant browser (such as LibreWolf) for services where you must log in. Here, your network anonymity should be as fine-grained as possible, e.g. down to the browser tab.

As you can see, digital privacy is more complex than it appears at first glance.
There's much more to explore, and I'll dive deeper into this topic in a dedicated blog post in the future.

### Outlook

In an upcoming blog post, we'll explore additional network anonymization technologies in more detail.
If you're eager to learn more now, you can check out a comparative overview of VPNs, Tor, I2P, and Nym in the article: [VPNs, Tor, I2P — how does Nym compare?](https://blog.nymtech.net/vpns-tor-i2p-how-does-nym-compare-8576824617b8).

I'd love to hear your thoughts on this topic. Feel free to share your ideas or questions in the comments section below!

## Appendix

In a future blog post, I'll dive deeper into various network anonymization technologies. In the meantime, I'll gradually expand this appendix by adding individual sections.

### Invisible Internet Project: I2P

Unlike Tor, which anonymizes your activity on the standard global internet, the Invisible Internet Project (I2P) creates an anonymous "parallel internet."
Similar to Tor's `.onion` domains, which require you to be connected to Tor, I2P has `.i2p` domains that you can only access through the I2P network.

I2P is a peer-to-peer network where every user acts as a node.
Unlike BitTorrent, I2P nodes don't store data from other users locally.
Since it's a peer-to-peer network, there's a bootstrapping process when you first connect.
This means you might need to wait a while before the network is fully functional for you.

For the best experience, it's recommended to install I2P on a virtual private server (VPS) as a long-running, permanent process.
This eliminates the need to repeat the bootstrapping process every time you connect.
You can then use SSH port forwarding to securely connect your workstation to your VPS, which will act as your entry point to the I2P network.

Currently, there are three main clients available for connecting to the I2P network that I know of:
* [I2P](https://github.com/i2p/i2p.i2p): The original Java-based I2P client.
* [I2P+](https://gitlab.com/i2pplus/I2P.Plus/): A soft fork of the Java I2P client with additional features.
* [I2P Daemon (i2pd)](https://github.com/PurpleI2P/i2pd): A full-featured I2P client written in C++.

If you're not ready to try I2P yourself, you can check out the video [Introduction To I2P](https://www.youtube.com/watch?v=KhG29riqVUE) for a quick overview.

For those eager to dive in, here's a `docker-compose.yaml` file, adapted from the original [Docker.md](https://github.com/i2p/i2p.i2p/blob/master/Docker.md), to help you get started:
```yaml
services:
  i2p:
    image: geti2p/i2p:latest
    ports:
      - 4444:4444
      # - 6668:6668
      - 7657:7657
      - 12345:12345
      - 12345:12345/udp      
    environment:
      - JVM_XMX=256m
      - EXT_PORT=12345
    volumes:
      - ./data/i2phome:/i2p/.i2p
      - ./data/i2ptorrents:/i2psnark
```

Save the file as `./docker-compose-i2p.yaml` and follow this simple installation process:
```bash
mkdir -p /opt/docker-services/i2p/data/{i2phome,i2ptorrents}
cp ./docker-compose-i2p.yaml /opt/docker-services/i2p/docker-compose.yaml
cd /opt/docker-services/i2p/
docker compose up
```

Once installed, you can connect to the I2P console by opening your browser and navigating to `http://localhost:7657`.
Then, follow the setup instructions, which include configuring an **`HTTP`** proxy (**not** SOCKS) in your browser to point to `localhost:4444`.
In the final setup step you reach the I2P console. There, you'll find links to resources within the I2P network, such as the I2P Wiki: <http://wiki.i2p-projekt.i2p/>.

I2P is designed for anonymity and secure communication, so there's no need for HTTPS. You should use the HTTP protocol instead (`http://` in your browser).

Since the I2P network doesn't have a DNS (Domain Name System) or similar tools for translating human-readable names into network addresses, accessing some links (e.g., <http://bible4u.i2p/>) can be a bit tricky.
Watching the [Introduction To I2P](https://www.youtube.com/watch?v=KhG29riqVUE) video is a great way to learn this process step-by-step.

For a deeper understanding of how I2P works, check out the video [I2P - Protocol of Invisible Internet: How the best anonymity network works](https://www.youtube.com/watch?v=95hSAMEwrlM) or explore the [i2pd documentation](https://i2pd.readthedocs.io/en/latest/), which offers insights into the I2P eco-system.

Here are a few additional resources, also mentioned in the [Introduction To I2P](https://www.youtube.com/watch?v=KhG29riqVUE) video:
* Link list: <http://identiguy.i2p/>.
* Search engine: <http://legwork.i2p/>.
* RSS-feed like page: <http://planet.i2p/>.

### Nym Mixnet

[Nym](https://nym.com/about) is constructing a fully decentralized network without relying on any trusted parties, central components, or single points of failure.
All Nym features operate in a decentralized and distributed manner, similar to a decentralized Virtual Private Network (dVPN), ensuring no centralized registration option is available.

For more details on Nym, explore their [Papers and Research](https://nym.com/trust-center/papers-and-research) section or visit their [@Nymtech](https://www.youtube.com/@Nymtech) YouTube Channel.

As of now (current date: 2025-01-14), [NymVPN](https://nymvpn.com/en) remains free to use, offering all its features.
However, in the upcoming weeks, NymVPN will transition to a paid service.
Take advantage of the current free access and get ready for the world's most anonymous VPN.

#### NymVPN

TechRadar has highlighted mixnet technology as one of the [top three VPN innovations of 2024](https://www.techradar.com/vpn/vpn-privacy-security/the-3-biggest-vpn-innovations-of-2024-what-does-the-future-hold), stating:

> While this concept has been around for a while, Nym Technologies is leading the charge in making mixnets a practical solution for everyday users.
> Their NymVPN is currently in beta and available for free, leveraging this technology to provide a much more secure and anonymous browsing experience.

Right now, you can still claim your free [Access Code](https://nym.com/account/create) to try NymVPN.
This code is a [BIP 39 Mnemonic](https://github.com/bitcoin/bips/blob/master/bip-0039/english.txt) Word List — a set of 24 unique words that acts as your account identifier.
Once you've [downloaded](https://nym.com/download/linux) the app for your platform (Android, iOS, Linux, macOS, or Windows), use these 24 words to log in and access the VPN.

Similar to the setup for NordVPN, I've created a Docker Compose stack that integrates a Shadowsocks SOCKS5 proxy with NymVPN.
This setup allows you to access NymVPN through a SOCKS5 interface, combining privacy and flexibility.

You can find all the source files in this GitHub Gist: [Digital Civil Rights and Privacy: Networking, VPN, Tor, Onion over VPN - Dockerized NymVPN](https://gist.github.com/cs224/1d01536c89f2fb0419674fc9152a977c).

Copy the `secrets.env.example` file to `secrets.env` and replace the placeholder 24-word mnemonic list with your own word list.
Then, follow the `install.sh` script.
Once the Docker Compose stack is up and running, you’ll have two SOCKS5 proxies available:

* **Port 1090: Fast Mode**: A decentralized 2-hop mode for faster connections and less latency thanks to WireGuard. Ideal for protections in everyday browsing, streaming, and downloading.
* **Port 1091: Anonymous Mode**: Maximal anonymity thanks to Nym's Noise Generating Mixnet. A 5-hop decentralized network with added noise to protect users against even AI surveillance. Ideal for messaging, email, and crypto transactions.

Currently, the anonymous mode is quite slow — slower than Tor and close to unusable for some activities. Hopefully, this performance will improve with future updates.


Even without considering other features, the fast mode stands out as *superior* to any other VPN service I've encountered. Here's why:
* **[Zero-Knowledge Proofs (ZKPs)](https://livebook.manning.com/book/real-world-cryptography/chapter-15/90)**: NymVPN uses ZKPs to enable secure payments without linking your identity to your VPN usage. This means even if you pay with a traditional method like a bank account, your payment cannot be tied to your online activity.
* **Blockchain and Cryptocurrency Incentives**: Unlike Tor, which relies on volunteers, Nym's mixnet is powered by a blockchain-based incentive system. Node operators are rewarded with cryptocurrency, making it sustainable for individuals to run Nym nodes as a business.
* **Enhanced Anonymity, Even in Fast Mode**: The fast mode uses a 2-hop setup, significantly increasing the difficulty even for a [Global Passive Adversary](https://news.ycombinator.com/item?id=9977465) to deanonymize your activity compared to single-hop VPNs.

**Caveats**: There are a few important caveats to keep in mind. Until these are resolved, I recommend exercising caution when using NymVPN for activities that demand high levels of anonymity:

* **Still in Beta**: NymVPN is currently in its beta stage, meaning it may not yet be fully stable or optimized for all use cases.
* **No Kill Switch**: The lack of a kill switch means your connection could be exposed if the VPN unexpectedly disconnects. Their [web-site](https://nym.com/features) says: Killswitch and autoconnect: COMING SOON! Prevent all leaks with features that automatically connects the VPN and immediately suspends internet connection if the VPN connection temporarily goes down.

Currently, the amount of information and documentation available for the Nym mixnet and its technology is somewhat limited.
However, you can find helpful resources and support at the following platforms:

* [Nym Forum](https://forum.nym.com): A community-driven space to discuss Nym’s technology and get answers to your questions.
* [Nym on Discord](https://discord.com/invite/nym): Join the conversation and connect with other users and developers in real time.
* [dev:nymtech.chat](https://matrix.to/#/%23dev:nymtech.chat) on Matrix: A Matrix chatroom for technical discussions and support.
* Nym on [GitHub](https://github.com/nymtech/): Explore the code, report issues, and contribute to the project.
