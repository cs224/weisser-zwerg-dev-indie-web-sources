---
layout: "layouts/post-with-toc.njk"
title: "Implementing Teleport Identity Proxy behind a Router using the Traefik Reverse Proxy in an Intranet Environment: A Comprehensive Guide"
description: "How to use Teleport with a valid TLS/SSL certificate and automatic SSL certificate renewal in a pure intranet set-up behind a router."
creationdate: 2023-08-24T15:32:00+02:00
date: 2023-08-24T15:32:00+02:00
keywords: cybersecurity, digital identity, security, identity, identity proxy, infrastructure access platform, goteleport, teleport, ssh, tls, ssl, traefik reverse proxy, wireguard networking, tailscale, headscale, zerotier, duckdns domain management, letsencrypt, ACME protocol, HTTP-01 challenge, DNS-01 challenge
tags: ['post']
draft: false
---

## Rationale

In my previous post, [Step Up Your SSH Game: A Deep Dive into FIDO2 Hardware Keys and ProxyJump Configuration,](../openssh-fido2-hardwarekey) I
demonstrated how to enhance your SSH setup using FIDO2 hardware keys. This method eliminates the risk of having private keys on your local machine
that could potentially be stolen by attackers. The ultimate aim was to create an SSH setup that doesn't leave private keys vulnerable on developer
workstations.

In this article, I'll take it a step further by introducing [Teleport](https://goteleport.com), an "identity proxy" or "infrastructure access
platform." This not only eliminates the need for private keys on developer workstations but also adds an identity and access management layer. This
layer allows you to easily and quickly add or remove individuals with specific access rights to your infrastructure.

Typically, Teleport is configured in a way that makes the web user interface accessible to the public internet[^setupteleport].

> <span style="font-size:smaller">
> In principle, Teleport is already acting as a reverse proxy and could do the same thing as Nginx Proxy Manager or Traefik are doing and implement the <a
> href="https://letsencrypt.org/de/docs/challenge-types">DNS-01</a> protocol. But as far as I am aware this is not supported (yet). At least the issue
> in the github issue tracker is still open: <a href="https://github.com/gravitational/teleport/issues/23996">Support ACME with DNS providers</a>.
>
> It seems that Teleport is only supporting the <a href="https://letsencrypt.org/docs/challenge-types/#tls-alpn-01">TLS-ALPN-01</a> ACME challenge
> type, which is only working with a direct internet connection. This is at least what is indicated in <a
> href="https://goteleport.com/docs/deploy-a-cluster/high-availability/#tls-credential-provisioning">TLS credential provisioning</a> in the teleport
> documentation. And this seems to be the root cause, why Teleport insists on running with its web user interface accessible to the public internet.
> </span>

However, I'm not a fan
of setups where web user interfaces are exposed on the internet as it **significantly increases your attack surface**!  I advocate for web user
interfaces to be accessible only behind a firewall/router within the intranet, not the internet.  However, by default, Teleport wants to be accessible
publicly on the internet because it needs to obtain a valid TLS/SSL certificate from Let's Encrypt or similar.  For more information, refer to [Step
2/4. Set up Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host) and the "Public internet deployment
with Let's Encrypt" section.

My initial attempt involved using [Nginx Proxy Manager](https://nginxproxymanager.com) to generate the certificate via the
[DNS-01](https://letsencrypt.org/de/docs/challenge-types) [ACME](https://github.com/acmesh-official/acme.sh) protocol and [Duck
DNS](https://www.duckdns.org/), as outlined in: [Quick and Easy SSL Certificates for Your Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E) (by
Wolfgang's Channel). In this initial/preliminary method, I first generate the valid TLS/SSL certificate and then manually place it in the correct
location for Teleport to use. Obviously, this method is not ideal as it requires manual intervention every time the Let's Encrypt certificate expires.

In this article, I'll first walk you through my initial manual approach and then demonstrate how to enhance this by using
[Traefik](../traefik-reverse-proxy-ansible/) as a reverse proxy in front of Teleport.  This setup allows Traefik to handle the [Let's
Encrypt](https://letsencrypt.org) certificate renewal via the [ACME](https://github.com/acmesh-official/acme.sh)
[DNS-01](https://letsencrypt.org/de/docs/challenge-types) protocol.

### Virtualized Mesh Networks

Let's talk about virtualized mesh networks.  In the most basic scenario, you'll have all your machines that you need to access within a single
connected intranet, say, behind a single router. Your Teleport instance, also within the same intranet, can access all these machines directly.  If
you need remote access to this single intranet, you could employ something like a [WireGuard VPN on a
FRITZ!Box](https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590/3685_Setting-up-a-WireGuard-VPN-to-the-FRITZ-Box-on-the-computer/) or similar
to facilitate remote VPN connections.

However, if you're dealing with multiple machines at different locations, the optimal solution is to establish a virtualized mesh network.  This could
be either between the sites as a whole or only between the machines that you need to access via Teleport.  After experimenting with
[ZeroTier](https://www.zerotier.com) and [Tailscale](https://tailscale.com), I've returned to using [WireGuard](https://www.wireguard.com) in a Hub
and Spoke topology (also known as the Star topology):<br>
<img src="https://www.procustodibus.com/images/blog/wireguard-topologies/hub-and-spoke-outline.svg" style="max-height: 100px;max-width: 100%"><br>
I use my [netcup Virtual Private Server (VPS)](../fuel-save-alerter-germany/#deployment-environment(s))[^vpsstarcenter] as the central hub.


The main issue with Tailscale and ZeroTier is that they require you to trust a third party.  Moreover, these third parties operate a web user
interface that's open to the public internet, which increases the potential attack surface.  You could sidestep the third-party issue by opting for
[Headscale](https://github.com/juanfont/headscale), an open-source, self-hosted version of the Tailscale control server. However, the problem of a web
user interface accessible to the public internet still remains.

Setting up the [Hub and Spoke topology](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config) with
[WireGuard](https://www.wireguard.com) is a bit more manual and time-consuming, but it doesn't necessitate any other UI/service/port being exposed to
the public internet, except for the WireGuard [UDP](https://en.wikipedia.org/wiki/WireGuard#Networking) port.

For more information, check out the following links:

- [WireGuard](https://www.wireguard.com)
  - [WireGuard Topologies](https://www.procustodibus.com/blog/2020/10/wireguard-topologies)
  - [Hub and Spoke topology](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config) and [Configure Firewall on Bounce Server](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config/#extra-configure-firewall-on-host-c)
    - [A Wireguard Bounce Server](https://gitlab.com/ncmncm/wireguard-bounce-server/-/blob/master/README.md)
- [ZeroTier](https://www.zerotier.com)
  - [The definitive Guide to Zerotier VPN and why it is "better" than Wireguard (Tutorial)](https://www.youtube.com/watch?v=sA55fcuJSQQ) by Andreas Spiess
    - [UDP Hole Punching](https://www.zerotier.com/blog/the-state-of-nat-traversal)
- [Tailscale](https://tailscale.com)
  - [Headscale](https://github.com/juanfont/headscale): An open source, self-hosted implementation of the Tailscale control server

Getting my Hub and Spoke setup to work took some time, mainly because I overlooked the following lines in the `wg0.conf` at my star center at my
netcup VPS:

```ini
# Allow routing between clients
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT
```

As detailed in [Wireguard Netzwerk mit Routing einrichten](https://www.edvpfau.de/wireguard-netzwerk-mit-routing-einrichten).

## Manual DNS-01 Set-Up via Nginx Proxy Manager and Duck DNS

For those who enjoy a more visual guide, feel free to follow along with Wolfgang's Channel's engaging video tutorial, [Quick and Easy SSL Certificates
for Your Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E)

### Domain Name via Duck DNS

In the upcoming steps, we'll require a domain name that points to one of our internal network IP addresses.  A free option that supports DNS-01 is
[Duck DNS](https://www.duckdns.org). Once I've logged in using the "Sign in with Google" option, I gain access to the configuration interface. Here, I
select a subdomain name such as "teleport-host-behind-my-router" or any other name of your choice that's still available, and assign the internal
network IP address where teleport will operate, for instance, 192.168.0.5. To ensure everything is set up correctly, you can run a quick check by
executing:

    > nslookup teleport-host-behind-my-router.duckdns.org

The response should be:

    Name:    teleport-host-behind-my-router.duckdns.org
    Address: 192.168.0.5

Lastly, make sure to copy the "token" displayed at the top of the page. We'll need this piece of information in the subsequent steps.

#### Potential Issue: DNS Rebind Protection

In my case, the setup didn't work seamlessly due to a security feature in my Fritz!Box known as
[DNS-Rebind-Protection](https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590-AX/3565_FRITZ-Box-reports-Your-FRITZ-Box-s-DNS-rebind-protection-rejected-your-query-for-reasons-of-security/).
This feature requires you to configure hostname exceptions. If you're also using a Fritz!Box, navigate to "Home Network > Network >[TAB] Network
Settings >[SECTION] DNS Rebind Protection" and input the necessary entries in the text field labeled "Host name exceptions."

    teleport-host-behind-my-router.duckdns.org
    teleport-host-behind-my-router

Once you've done this, everything should be up and running smoothly.

### Let's Encrypt TLS Certificates via Nginx Proxy Manager

#### Start the Docker Instance

Get the Nginx Proxy Manager up and running through Docker[^nginxproxymanagersetupinstructions]. Here's what a basic `docker-compose.yml` file would look like:

```yml
services:
  app:
    image: 'jc21/nginx-proxy-manager:latest'
    restart: unless-stopped
    ports:
      - '80:80'
      - '81:81'
      - '443:443'
    volumes:
      - ./data:/data
      - ./letsencrypt:/etc/letsencrypt
```

Next, create two directories, namely `./data` and `./letsencrypt`. Once done, execute the following command:

    > docker compose up


Now, navigate to http://localhost:81 on your web browser. The default login credentials are "`admin@example.com`" for the username and "`changeme`" for
the password.  On first login you'll be prompted to update these details.  **It's advisable to set a valid email address, as Let's Encrypt will use
this to get in touch with you**.

#### Configure SSL Certificate and DuckDNS as DNS-01 Provider

Firstly, navigate to "SSL Certificates" located at the top of the page. Once there, click on "Add SSL Certificate" positioned at the top right corner. In the "Domain Names" field, input the following:

- `teleport-host-behind-my-router.duckdns.org`
- `*.teleport-host-behind-my-router.duckdns.org`

Remember to enter each of them separately, hitting return/enter after each entry[^otherdnsprovidercnamerecord].


Next, activate the "Use a DNS Challenge" option and choose "DuckDNS" as your DNS provider from the available options in the drop-down list. 
In the "Credentials File Content" field, substitute ... with the token you copied earlier:

    dns_duckdns_token=...

In the "Propagation Seconds" field, input a value such as "120" or higher. This ensures that the DNS changes have ample time to propagate.

Ensure to check the "I Agree to the Let's Encrypt Terms of Service" box and hit the Save button. Be patient, as you may need to wait for up to the 120 seconds that you configured until your certificate is ready.

Lastly, download the generated certificate by clicking on the &#8942; (three vertical dots) located to the right of your SSL certificate entry and selecting "Download". This action will download a `certificate.zip` file with the following content:

     Length      Date    Time    Name
    ---------  ---------- -----   ----
         1598  2023-08-24 07:55   certX.pem
         3424  2023-08-24 07:55   fullchainX.pem
         1826  2023-08-24 07:55   chainX.pem
          306  2023-08-24 07:55   privkeyX.pem

Where X might be a number. For the subsequent steps, you will require the fullchainX.pem and the privkeyX.pem.

#### Optional: Configure Proxy Host

Should you wish to utilize the Nginx Proxy Manager for its primary purpose, that is, as a reverse proxy, you can easily do so.  Simply click on
"Hosts" located at the top of the interface and select "Proxy Hosts".  Next, choose "Add Proxy Host". To illustrate, I'll configure the admin panel of
the Nginx Proxy Manager itself:

    Domain Name          : teleport-host-behind-my-router.duckdns.org
    Scheme               : http
    Forward Hostname / IP: localhost
    Forward Port         : 81

Generally, you can leave the other options "off". However, feel free to adjust them as per your requirements.

#### Troubleshooting

Should you stumble upon any hiccups while following the above guide, I'd recommend you check out the video tutorial, [Quick and Easy SSL Certificates
for Your Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E) courtesy of Wolfgang's Channel. Often, visual learning can be more intuitive than
navigating through written instructions.

### Teleport Private Network Deployment

Start the procedure by following the steps outlined in [Get Started with Teleport,](https://goteleport.com/docs) commencing from Step [Step 2/4. Set
up Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host). This will guide you through setting up
Teleport on your Linux host.

On your Teleport host, place a valid private key and a certificate chain in `/var/lib/teleport/privkeyX.pem` and `/var/lib/teleport/fullchainX.pem`
respectively.

Next, on your main Teleport host, execute the following Teleport configure command:

    > sudo teleport configure -o file --cluster-name=teleport-host-behind-my-router.duckdns.org --public-addr=teleport-host-behind-my-router.duckdns.org:443 --cert-file=/var/lib/teleport/fullchainX.pem --key-file=/var/lib/teleport/privkeyX.pem

This will result in the generation of a `/etc/teleport.yaml` file. Let's take a closer look at some of the key content items in this file:

```yml
teleport:
  ...
auth_service:
  cluster_name: teleport-host-behind-my-router.duckdns.org
  ...
proxy_service:
  public_addr: teleport-host-behind-my-router.duckdns.org:443
  https_keypairs:
  - key_file: /var/lib/teleport/privkeyX.pem
    cert_file: /var/lib/teleport/fullchainX.pem
  https_keypairs_reload_interval: 0s
  acme: {}
  ...
...
```

From this point forward, you can just follow along with the [Get Started with Teleport](https://goteleport.com/docs/) guide or switch to the [Set Up
Teleport Open Source in 5 Minutes | Step-by-Step](https://www.youtube.com/watch?v=BJWbSqiDLeU) video. Both resources are designed to provide you with
a comprehensive understanding of the process.

## Automatic DNS-01 Set-Up via Traefik

In a previous blog post about [Traefik](https://traefik.io/), I've discussed the merits of [Traefik as Reverse
Proxy](../traefik-reverse-proxy-ansible/).  My preference leans towards Traefik over Nginx Proxy Manager due to its superior dev-ops automation
capabilities and seamless integration with Docker ecosystems through its label-centric approach.  I discovered the possibility of using Teleport
behind a Traefik reverse proxy from Christian Lempa's YouTube video, [Installing Teleport + Traefik (Letsencrypt TLS
certs)](https://www.youtube.com/watch?v=NzSdNoR-JPo). This informative video outlines a setup where Traefik and Teleport operate via Docker.

While I typically favor pure Docker setups, in this case, I find managing Teleport through the APT package manager more appealing. This method ensures
that Teleport updates are automatically applied alongside all other OS updates, streamlining the process.

On a related note, Christian Lempa's [boilerplates](https://github.com/ChristianLempa/boilerplates) repository on GitHub is a valuable resource for
getting started with various infrastructure components. In the context of our discussion, I recommend checking out:

- [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik)
- [docker-compose/teleport](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/teleport)

### Adapt teleport.yaml

The only modification required is to the `web_listen_addr`, as from this point onwards, Traefik will take over the responsibility of listening at the
HTTPS port 443.  However, it's crucial to retain the `public_addr` field as it was set up in our previous manual configuration. This ensures that any
redirects or similar actions initiated by Teleport will be managed via the Traefik entry point.

Before:

```yml
proxy_service:
  enabled: "yes"
  web_listen_addr: 0.0.0.0:443
  public_addr: teleport-host-behind-my-router.duckdns.org:443
```

After:

```yml
proxy_service:
  enabled: "yes"
  web_listen_addr: 0.0.0.0:3080
  public_addr: teleport-host-behind-my-router.duckdns.org:443

```

Before you initiate a restart, ensure that there isn't another service already operating on the new port:

    > telnet localhost 3080

The output should resemble something like this:

    Trying ::1...
    Trying 127.0.0.1...
    telnet: Unable to connect to remote host: Connection refused

If everything appears in order, proceed to restart the Teleport systemd service:

    > systemctl restart teleport.service
    > systemctl status teleport.service

After the restart, double-check to confirm that the old port is vacant and the new port is ready to accept connections:

    > telnet localhost 443
    > telnet localhost 3080

### Configure Traefik

**As a pre-caution**: During my setup process, I encountered a few hiccups with Traefik, particularly with generating the TLS certificates. While I
can't say for certain this was the root cause, I found that deleting the certificate in Nginx Proxy Manager resolved the issue. You can do this from
the same menu where you downloaded the `certificate.zip` file.


As a first step create a place where we can store the Traefik configuration files:

    > mkdir -p /opt/traefik/config/certs

During the setup, Traefik flagged an issue with UDP buffer sizes and directed me to: [UDP Buffer
Sizes](https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes). Consequently, I executed:

    > sysctl -w net.core.rmem_max=2500000
    > sysctl -w net.core.wmem_max=2500000

Next, input the following content at `/opt/traefik/docker-compose.yaml`:

```yml
services:
  traefik:
    image: traefik:v2.10.4
    container_name: traefik
    ports:
      - 80:80
      - 443:443
      # -- (Optional) Enable Dashboard, don't do in production
      - 8080:8080
    volumes:
      - ./config:/etc/traefik
      - /var/run/docker.sock:/var/run/docker.sock:ro
    # -- (Optional) When using Cloudflare as Cert Resolver
    environment:
      - DUCKDNS_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    restart: unless-stopped
```

Don't forget to insert the correct token in the `DUCKDNS_TOKEN=` part of the file above. If you're using a different DNS provider, check out: [Traefik ACME](https://doc.traefik.io/traefik/https/acme/).
You'll need to modify the environment variable name and the `dnsChallenge>provider` in the static Traefik configuration file.

Now, insert the following content `/opt/traefik/config/traefik.yaml`. This sets up the Traefik static configuration. I recommend keeping the log level
set to `DEBUG` initially. Once everything is running smoothly, you can comment out that section.

```yml
global:
  checkNewVersion: false
  sendAnonymousUsage: false

log:
  level: DEBUG

experimental:
  http3: true

api:
  dashboard: true
  insecure: true

entryPoints:
  web:
    address: :80
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: :443
    http2:
      maxConcurrentStreams: 250
    http3:
      advertisedPort: 443

certificatesResolvers:
  default:
    acme:
      email: "your.name@gmail.com"
      storage: "/etc/traefik/certs/acme.json"
      # caServer: "https://acme-staging-v02.api.letsencrypt.org/directory"
      caServer: "https://acme-v02.api.letsencrypt.org/directory"
      dnsChallenge:
        provider: duckdns
        delayBeforeCheck: 120
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"

serversTransport:
  insecureSkipVerify: true

providers:
  docker:
    exposedByDefault: false
  file:
    directory: /etc/traefik
    watch: true
```

Next, we'll place the Traefik dynamic configuration in the file `/opt/traefik/config/dynamic.yaml`:

```yml
http:
  routers:
    teleport-https:
      rule: "HostRegexp(`teleport-host-behind-my-router.duckdns.org`, `{subhost:[a-z]+}.teleport-host-behind-my-router.duckdns.org`)"
      service: teleport
      tls:
        certResolver: default
        domains:
          - main: "teleport-host-behind-my-router.duckdns.org"
            sans:
              - "*.teleport-host-behind-my-router.duckdns.org"
    teleport-http:
      rule: "HostRegexp(`teleport-host-behind-my-router.duckdns.org`, `{subhost:[a-z]+}.teleport-host-behind-my-router.duckdns.org`)"
      service: teleport
  services:
    teleport:
      loadBalancer:
        servers:
          - url: "https://teleport-host-behind-my-router.duckdns.org:3080"
```

You're now ready to launch the Traefik instance via Docker compose. Navigate to the folder `/opt/traefik` and execute:

    > docker compose up

This will initiate Traefik in the foreground, allowing you to view its log messages.

For an initial test, execute:

    > curl http://teleport-host-behind-my-router.duckdns.org

You should receive a `Moved Permanently` message as we've configured Traefik to redirect all HTTP traffic to HTTPS.

Now, test the HTTPS protocol:

    > curl https://teleport-host-behind-my-router.duckdns.org

If you receive something like:

    curl: (60) SSL certificate problem: unable to get local issuer certificate
    More details here: https://curl.haxx.se/docs/sslcerts.html

    curl failed to verify the legitimacy of the server and therefore could not
    establish a secure connection to it. To learn more about this situation and
    how to fix it, please visit the web page mentioned above.

Your setup isn't quite right yet. If you receive:

    <a href="/web">Found</a>.

You're good to go! If you encounter any issues, scrutinize the debug output on your console.

Finally, open https://teleport-host-behind-my-router.duckdns.org in your browser. You should now see a working instance of Teleport. From here on you can follow the [standard Teleport documentation](https://goteleport.com/docs/).

You might also want to check out the Traefik [Dashboard](http://192.168.0.5:8080) at `http://192.168.0.5:8080`.

Once you're satisfied with your setup, you can comment out the `log-level: DEBUG` and start Traefik in the background as a [daemon](https://en.wikipedia.org/wiki/Daemon_(computing)):

    > docker compose up -d

#### Traefik and HTTP Strict Transport Security (HSTS)

It appears that Traefik is configured to set [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) headers by default. This implies that to access the Traefik dashboard, you'll need to use the IP address, like so: `http://192.168.0.5:8080`.

The Traefik documentation talks about HSTS headers in [only one
place](https://doc.traefik.io/traefik/middlewares/http/headers/#using-security-headers), and unfortunately, it doesn't provide a practical example.
However, here are some additional resources that could assist you if you're considering disabling HSTS for your domain:

- [HSTS with Traefik](https://calvin.me/hsts-with-traefik/) ; [available-options](https://github.com/unrolled/secure#available-options)
- [Traefik v2 enable HSTS, Docker ...](http://day-to-day-stuff.blogspot.com/2020/04/traefik-v2-enable-hsts-docker-and.html)

## Conclusion

I'm still on the fence about incorporating a component like Teleport into my home setup. Given that I'm the sole user of my infrastructure, the need
to add or remove others is practically non-existent.  As it stands, I'm quite content with the [FIDO2 Hardware Keys](../openssh-fido2-hardwarekey) for
my home setup, as it eliminates the need to manage an additional piece of infrastructure.

However, the scenario changes dramatically in a professional setting. Here, the requirement for an identity and access management platform with
detailed access control and auditing capabilities becomes paramount.  You'd likely establish the same non-human account, for instance, `ubuntu` on all
your machines, such as `ubuntu@my-machine.my-org.com`.  Teleport would then serve as the infrastructure component that tracks who connected to the
machine as the non-human user `ubuntu` at any given moment, for monitoring and auditing purposes.  This, however, could render your local logs on your
machines somewhat useless. If an attacker ever bypasses the Teleport infrastructure to access this account, you might be left in the dark about the
user they exploited to gain access. But let's not get too carried away with these thoughts for this blog post.

I'd love to hear your thoughts on this. Please drop your comments below and let's get the conversation started.

## Further Resources

**Update 2023-08-25**:

* Passwordless and Passkeys support ([WebAuthn](https://webauthn.io/)): the free community edition of Teleport supports passwordless with hardware keys like a YubiKey (on the web UI and on the terminal) and passkeys (only in the web UI).
  * [Don't use passwords anymore! Teleport with YubiKey passwordless login](https://www.youtube.com/watch?v=I10mtZfVZ1Q&t=791s)
  * [Passkeys for Infrastructure](https://goteleport.com/blog/passkeys): the one limit is that passkeys aren't supported within the terminal for tsh.
    * Once you have activated passwordless in Teleport and you want to make `tsh` use the OTP token fallback login method you have to add
      `--auth=local` to `tsh` like so: `tsh login --proxy=teleport-host-behind-my-router.duckdns.org:443 --auth=local`. Otherwise `tsh` will insist
      that you have to `Tap your security key`, which works with a real security key, but not with a passkey.
* [Teleport Assist](https://www.youtube.com/watch?v=hSLeVeEx9VE&t=437s): describes how to setup the ChatGPT API Key in Teleport to enable [Teleport Assist](https://goteleport.com/docs/ai-assist/).

## Footnotes

[^setupteleport]: [Set Up Teleport Open Source in 5 Minutes | Step-by-Step](https://www.youtube.com/watch?v=BJWbSqiDLeU); also under [Step 2/4. Set up
    Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host) it uses the distinction between "Public
    internet deployment with Let's Encrypt" and "Private network deployment" where the fact that "Let's Enrypt" is mentioned only in the context of
    "public internet" indicates that DNS-01 is not supported.
[^vpsstarcenter]: You need a machine accessible to all other machines as the star center, which basically means that the star center needs to be
    accessible to the public internet. But you don't need to expose any ui/service/port except the WireGuard
    [UDP](https://en.wikipedia.org/wiki/WireGuard#Networking) port.
[^nginxproxymanagersetupinstructions]: [Nginx Proxy Manager: Full Setup Instructions](https://nginxproxymanager.com/setup/#running-the-app)
[^otherdnsprovidercnamerecord]: If you use another DNS provider than DuckDNS you may need to add an [additional CNAME
    record](https://youtu.be/qlcVx-k-02E?t=447) for all of the sub domains.
