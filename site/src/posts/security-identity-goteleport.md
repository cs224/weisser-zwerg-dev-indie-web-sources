---
layout: "layouts/post-with-toc.njk"
title: "Teleport Identity Proxy in a Pure Intranet Set-Up behind a Router using the Traefik Reverse Proxy"
description: "How to use teleport with a valid TLS/SSL certificate and automatic SSL certificate renewal in a pure intranet set-up behind a router."
creationdate: 2023-08-24T13:44:00+02:00
date: 2023-08-24T13:44:00+02:00
keywords: security, identity, identity proxy, infrastructure access platform, goteleport, teleport, ssh, tls, ssl, traefik, wireguard, tailscale, headscale, zerotier, duckdns, letsencrypt, ACME, HTTP-01 challenge, DNS-01 challenge
tags: ['post']
draft: false
---

## Rational

In my post [Step Up Your SSH Game: A Deep Dive into FIDO2 Hardware Keys and ProxyJump Configuration](../openssh-fido2-hardwarekey) I showed how to
improve your SSH set-up with FIDO2 hardware keys to avoid having private keys lying around on your local machine that an attacker could steal. The
goal was to have an SSH set-up without private keys accessible on developer workstations.

In this post I'll improve on that by introducing [Teleport](https://goteleport.com) as an "identity proxy" or "infrastructure access platform" that
not only avoids the need to have private keys on developer workstations, but also introduces an identity and access management layer with which you
can easily and quickly add or remove people with certain access rights to your infrastructure.

Normally, teleport is set-up in a way that makes the web user interface accessible in the internet[^setupteleport]. I don't like set-ups where web
user interfaces need to be exposed on the internet, **because it considerably increases your attack surface**! I prefer to have the web user
interfaces only accessible behind a firewall/router in the intranet, but not the internet. But, by default, teleport wants to be accessible publicly
on the internet, because it needs to get a valid TLS/SSL certificate from [Let's Encrypt](https://letsencrypt.org) or similar. For further details,
see [Step 2/4. Set up Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host) and the "Public internet
deployment with Let's Encrypt" section.

My first attempt was to use https://nginxproxymanager.com to generate the certificate via the
[DNS-01](https://letsencrypt.org/de/docs/challenge-types) [ACME](https://github.com/acmesh-official/acme.sh) protocol and [Duck
DNS](https://www.duckdns.org/) as described in: [Quick and Easy SSL Certificates for Your Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E) (by
Wolfgang's Channel). In this approach, I generate the valid TLS/SSL certificate first and manually put it in the right location for teleport to pick it
up. Obviously, this is sub-optimal, as it requires manual intervention every time the Let's Encrypt certificate expires.

In this post I'll first explain my initial manual approach and then show how to improve on that by putting
[traefik](../traefik-reverse-proxy-ansible/) as reverse proxy in front of teleport and let traefik take care of the [Let's
Encrypt](https://letsencrypt.org) certificate renewal via the [ACME](https://github.com/acmesh-official/acme.sh)
[DNS-01](https://letsencrypt.org/de/docs/challenge-types) protocol.

### Virtualized Mesh Networks

A remark about virtualized mesh networks: in the most simple case you will have all of your machines that you need to access in a single connected
intranet (e.g. behind a single router). Then your teleport instance, that is also in the same intranet, has immediate access to all of these
machines. If you would need remote access to this single intranet you could use something like a [WireGuard VPN on a
FRITZ!Box](https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590/3685_Setting-up-a-WireGuard-VPN-to-the-FRITZ-Box-on-the-computer/) or similar
to allow remote VPN connections to this single intranet.

But if you have several machines at different sites then the next best way is to set-up a virtualized mesh network, either between the sites in total
or only between the machines that you need to access via teleport. After having tried [ZeroTier](https://www.zerotier.com) and
[Tailscale](https://tailscale.com) I am back to [WireGuard](https://www.wireguard.com) in a Hub and Spoke topology (also known as the Star
topology):<br> <img src="https://www.procustodibus.com/images/blog/wireguard-topologies/hub-and-spoke-outline.svg" style="max-height: 100px;
max-width: 100%"><br> As the star center I use my [netcup Virtual Private Server (VPS)](../fuel-save-alerter-germany/#deployment-environment(s))[^vpsstarcenter].

The main problem with Tailscale and ZeroTier is that you first of all need to trust a 3rd party. In addition these 3rd parties operate a web user
interface open to the public internet increasing the attack surface. You could avoid the 3rd party issue by going with
[Headscale](https://github.com/juanfont/headscale), an open source, self-hosted implementation of the Tailscale control server, but the problem with
the web user interface accessible to the public internet remains.

The set-up of the [Hub and Spoke topology](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config) with
[WireGuard](https://www.wireguard.com) is more manual and labour intensive, but it does not require any other ui/serivce/port exposed to the public
internet except the WireGuard [UDP](https://en.wikipedia.org/wiki/WireGuard#Networking) port.

You can find more information following the below links:
- [WireGuard](https://www.wireguard.com)
  - [WireGuard Topologies](https://www.procustodibus.com/blog/2020/10/wireguard-topologies)
  - [Hub and Spoke topology](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config) and [Configure Firewall on Bounce Server](https://www.procustodibus.com/blog/2020/11/wireguard-hub-and-spoke-config/#extra-configure-firewall-on-host-c)
    - [A Wireguard Bounce Server](https://gitlab.com/ncmncm/wireguard-bounce-server/-/blob/master/README.md)
- [ZeroTier](https://www.zerotier.com)
  - [The definitive Guide to Zerotier VPN and why it is "better" than Wireguard (Tutorial)](https://www.youtube.com/watch?v=sA55fcuJSQQ) by Andreas Spiess
    - [UDP Hole Punching](https://www.zerotier.com/blog/the-state-of-nat-traversal)
- [Tailscale](https://tailscale.com)
  - [Headscale](https://github.com/juanfont/headscale): An open source, self-hosted implementation of the Tailscale control server

It took me quite some time to get my Hub and Spoke set-up working, though, because I was missing the following lines in the `wg0.conf` at my star
center at my netcup VPS:
```ini
# Allow routing between clients
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT
```
As describe in [Wireguard Netzwerk mit Routing einrichten](https://www.edvpfau.de/wireguard-netzwerk-mit-routing-einrichten).

## Manual DNS-01 Set-Up via Nginx Proxy Manager and Duck DNS

If you prefer a video over written text then you can follow along by watching [Quick and Easy SSL Certificates for Your
Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E) by Wolfgang's Channel.

### Domain Name via Duck DNS

For the following steps we need a domain name pointing to one of our intranet IP addresses. A free option supporting DNS-01 is [Duck
DNS](https://www.duckdns.org). After I use "Sign in with Google" I have access to the configuration web UI. There I pick a sub domain name like
"teleport-host-behind-my-router" or whatever name you like and is still available and assign the intranet IP address on which teleport will run,
e.g. 192.168.0.5. After that you can check that everything is working as expected by executing:

    > nslookup teleport-host-behind-my-router.duckdns.org

And it should respond with:

    Name:    teleport-host-behind-my-router.duckdns.org
    Address: 192.168.0.5

As a last step copy the "token" displayed at the top of the page as we will need it later further down below.

#### Potential Issue: DNS Rebind Protection

In my case, this did not work out of the box, because my Fritz!Box has a security feature called
[DNS-Rebind-Protection](https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590-AX/3565_FRITZ-Box-reports-Your-FRITZ-Box-s-DNS-rebind-protection-rejected-your-query-for-reasons-of-security/)
and you need to configure hostname exceptions. If you have a Fritz!Box go to "Home Network > Network >[TAB] Network Settings >[SECTION] DNS Rebind
Protection" and add there in the text entry field "Host name exceptions" the two entries:

    teleport-host-behind-my-router.duckdns.org
    teleport-host-behind-my-router

After that it should work.

### Let's Encrypt TLS Certificates via Nginx Proxy Manager

#### Start the Docker Instance

Start-up Nginx Proxy Manager via docker[^nginxproxymanagersetupinstructions]. A minimal `docker-compose.yml` file will look like this:

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

Create the two folder `./data` and `./letsencrypt` and execute:

    > docker compose up

And open http://localhost:81 in your browser. The default username is "admin@example.com" and the password is "changeme". On first login you will need
to change these user name and credentials. **You should configure a real e-mail address, because Let's Enrypt will contact you on that e-mail
address**.

#### Configure SSL Certificate and DuckDNS as DNS-01 Provider

Next click on "SSL Certificates" at the top. Then click on "Add SSL Certificate" at the right top. In the field "Domain Names" enter:
- `teleport-host-behind-my-router.duckdns.org`
- `*.teleport-host-behind-my-router.duckdns.org`

Enter both of them individually and press return/enter after each[^otherdnsprovidercnamerecord].

Enable the "Use a DNS Challenge" and select as the DNS provider in the drop down list "DuckDNS" and put in the "Credentials File Content":

    dns_duckdns_token=...

Replacing `...` with the token you copied above.

Put in the "Propagation Seconds" something like "120" or higher to make sure that the DNS changes have enough time to propagate.

Confirm the "I Agree to the Let's Enrypt Terms of Service" check box and press the Save button. You may need to wait for up to the 120 seconds that
you configured until you get your certificate.

Finally download the generated certificate by going to the &#8942; (three vertical dots) to the right of your SSL certificate entry and select
"Download". This will download `certificate.zip` with the following content:

     Length      Date    Time    Name
    ---------  ---------- -----   ----
         1598  2023-08-24 07:55   certX.pem
         3424  2023-08-24 07:55   fullchainX.pem
         1826  2023-08-24 07:55   chainX.pem
          306  2023-08-24 07:55   privkeyX.pem

Where the `X` might be a number. For the next steps below you will need the fullchainX.pem and the privkeyX.pem.

#### Optional: Configure Proxy Host

Just in case if you would like to use Nginx Proxy Manager for what it is intended to, as a reverse proxy, you could click on "Hosts" at the top and
select "Proxy Hosts". Then "Add Proxy Host". As an example I configure the admin panel of the Nginx Proxy Manager itself:

    Domain Name          : teleport-host-behind-my-router.duckdns.org
    Scheme               : http
    Forward Hostname / IP: localhost
    Forward Port         : 81

Most of the time, the other options can stay "off". Otherwise, configure them as needed.

#### Troubleshooting

In case you ran into any trouble with the above description I suggest you watch the video [Quick and Easy SSL Certificates for Your
Homelab!](https://www.youtube.com/watch?v=qlcVx-k-02E) by Wolfgang's Channel. Sometimes seeing is easier than following a written text.

### Teleport Private Network Deployment

Follow the steps from [Get Started with Teleport](https://goteleport.com/docs/) starting with [Step 2/4. Set up Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host)

On your Teleport host, place a valid private key and a certificate chain in `/var/lib/teleport/privkeyX.pem` and `/var/lib/teleport/fullchainX.pem`
respectively.

On your main Teleport host run the following teleport configure command:

    > sudo teleport configure -o file --cluster-name=teleport-host-behind-my-router.duckdns.org --public-addr=teleport-host-behind-my-router.duckdns.org:443 --cert-file=/var/lib/teleport/fullchainX.pem --key-file=/var/lib/teleport/privkeyX.pem

This will result in the generation of a `/etc/teleport.yaml` file. Below you will see some of the more important content items of that file:

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

From here on you can just follow along with the [Get Started with Teleport](https://goteleport.com/docs/) guide or the [Set Up Teleport Open Source in
5 Minutes | Step-by-Step](https://www.youtube.com/watch?v=BJWbSqiDLeU) video.

## Automatic DNS-01 Set-Up via Traefik

I have already written about [Traefik](https://traefik.io/) before in my blog post [Traefik as Reverse Proxy](../traefik-reverse-proxy-ansible/). I
prefer Traefik over Nginx Proxy Manager, because it is more dev-ops automatable and integrates very nicely into a docker eco-system via its labels
approach. I learned about the fact that you can use Teleport behind a Traefik reverse proxy via the [Installing Teleport + Traefik (Letsencrypt TLS
certs)](https://www.youtube.com/watch?v=NzSdNoR-JPo) by Christian Lempa YouTube video. This video describes a set-up in which you run Traefik and
Teleport via docker. Normally I prefer pure docker set-ups, but in this instance I like an approach in which Teleport is managed viy the APT package
manager better. That way, Teleport updates will get automatically applied with all other OS updates. 

As a side note: Christian Lempa's [boilerplates](https://github.com/ChristianLempa/boilerplates) repository on GitHub comes in handy to get started
with different kinds of infrastructure components. In our context, especially have a look at:

- [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik)
- [docker-compose/teleport](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/teleport)

### Adapt teleport.yaml

We only need to adapt the `web_listen_addr` as going forward traefik will be responsible to listen at the HTTPS port 443. But you need to keep the
`public_addr` field as it was configured already above in our manual approach, so that any redirects or similar that Teleport issues will be handled
via the Traefik entry point:

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

Before you restart check that on the new port there is not already another service running:

    > telnet localhost 3080

The output should look something like this:

    Trying ::1...
    Trying 127.0.0.1...
    telnet: Unable to connect to remote host: Connection refused

If that looks ok you should restart the teleport systemd service:

    > systemctl restart teleport.service
    > systemctl status teleport.service


And now check again that the old port is free and the new port is available for connections:

    > telnet localhost 443
    > telnet localhost 3080

### Configure Traefik

**As a pre-caution**: during my set-up process I ran into some issues with Traefik not being able to generate the TLS certificates. I am not 100% sure
if this was the root cause, but everything started working after I deleted the certificate in Nginx Proxy Manager. You do this in the same menue from
where you downloaded the `certificate.zip` file.

As a first step create a place where we can store the Traefik configuration files:

    > mkdir -p /opt/traefik/config/certs

In addition, during the set-up process treafik complained about UDP buffer sizes and referred me to: [UDP Buffer
Sizes](https://github.com/quic-go/quic-go/wiki/UDP-Buffer-Sizes). This is why I executed:

    > sysctl -w net.core.rmem_max=2500000
    > sysctl -w net.core.wmem_max=2500000

Put the following content at `/opt/traefik/docker-compose.yaml`:

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

Rememberr to put the correct token in the `DUCKDNS_TOKEN=` part of the above file. If you would like to use another DNS provider have a look at:
[Traefik ACME](https://doc.traefik.io/traefik/https/acme/). You will have to change the environment variable name and the `dnsChallenge>provider`
below in the static traefik configuration file.

Next you should put the below content `/opt/traefik/config/traefik.yaml`. This will set-up the treafik static configuration. I suggest that you start
with leaving the log level set to `DEBUG` initially and later, once everything is running as you want to have it, just comment that section out.

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

Finally we put the traefik dynamic configuration in the file `/opt/traefik/config/dynamic.yaml`:

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

Now you can start the Traefik instance via docker compose. Change into the foler `/opt/traefik` and execute:

    > docker compose up

This will start Traefik in the foreground, so that you can see its log messages.

As a first test execute

    > curl http://teleport-host-behind-my-router.duckdns.org

You should receive a `Moved Permanently` as we have configured Traefik to redirect all HTTP traffic to HTTPS.

Next try the HTTPS protocol:

    > curl https://teleport-host-behind-my-router.duckdns.org

If you receive something like:

    curl: (60) SSL certificate problem: unable to get local issuer certificate
    More details here: https://curl.haxx.se/docs/sslcerts.html

    curl failed to verify the legitimacy of the server and therefore could not
    establish a secure connection to it. To learn more about this situation and
    how to fix it, please visit the web page mentioned above.

Your set-up is not working yet. If you receive:

    <a href="/web">Found</a>.

You're fine. If you run into trouble, have a close look at the debug output on your console.

Finally open [https://teleport-host-behind-my-router.duckdns.org](https://teleport-host-behind-my-router.duckdns.org) in your browser and you should
see a working instance of Teleport. From here on you can follow the [standard Teleport documentation](https://goteleport.com/docs/).

If might want to have a look at the Traefik [Dashboard](http://192.168.0.5:8080) at `http://192.168.0.5:8080`.

Once you're happy with what you have you could comment out the `log-level: DEBUG` and start Traefik in the background as a
[daemon](https://en.wikipedia.org/wiki/Daemon_(computing)):

    > docker compose up -d

#### Traefik and HTTP Strict Transport Security (HSTS)

It seems that Treafik is setting by default [HSTS](https://en.wikipedia.org/wiki/HTTP_Strict_Transport_Security) headers. This means that you have to
use the IP address to access the Traefik dashboard at `http://192.168.0.5:8080`.

The Traefik documentation talks about HSTS headers in [only one
place](https://doc.traefik.io/traefik/middlewares/http/headers/#using-security-headers) and it doesn't even provide an example for it. Here you can
find further details that might help you in case you want to turn off HSTS for your domain:

- [HSTS with Traefik](https://calvin.me/hsts-with-traefik/) ; [available-options](https://github.com/unrolled/secure#available-options)
- [Traefik v2 enable HSTS, Docker ...](http://day-to-day-stuff.blogspot.com/2020/04/traefik-v2-enable-hsts-docker-and.html)

## Conclusion

I am still undecided if having a component like Teleport is beneficial to my home set-up. In the end, I am using the infrastructure alone and have
very little need to add or remove other persons. For my home set-up I am quite happy with the [FIDO2 Hardware Keys](../openssh-fido2-hardwarekey) and
it avoids the need to run another piece of infrastructure.

For a professional environment this might look completely different. There, you will have the need for an identity and access management platform with
fine grained access control and auditing capabilities. Most likely you would set-up the same non-human account, e.g. `ubuntu` on all your machines,
e.g. `ubuntu@my-machine.my-org.com` and then have Teleport be the piece of infrastructure that knows who connected to the machine as the non-numan
user `ubuntu` at a given point in time for monitoring and auditing purposes. But this would render your local logs on your machines rather useless. If
an attacker ever finds a way to access this account circumventing the Teleport infrastructure you will not even know via which user they managed to
break into the account. But these are thoughts that lead to far for this blog post.

Please leave comments below and let me know what you think.

## Footnotes

[^setupteleport]: [Set Up Teleport Open Source in 5 Minutes | Step-by-Step](https://www.youtube.com/watch?v=BJWbSqiDLeU); in principle it could work
    out of the box if teleport would support the [DNS-01](https://letsencrypt.org/de/docs/challenge-types)
    [ACME](https://github.com/acmesh-official/acme.sh) protocol. But as far as I am aware this is not supported (yet). At least the issue in the github
    issue tracker is still open: [Support ACME with DNS providers](https://github.com/gravitational/teleport/issues/23996). Also under [Step 2/4. Set
    up Teleport on your Linux host](https://goteleport.com/docs/#step-24-set-up-teleport-on-your-linux-host) it has "Public internet deployment with
    Let's Encrypt" and "Private network deployment" where the fact that "Let's Enrypt" is mentioned only in the context of "public internet" indicates
    that DNS-01 is not supported. And in [TLS credential
    provisioning](https://goteleport.com/docs/deploy-a-cluster/high-availability/#tls-credential-provisioning) in the teleport documentation it
    indicates that only the [TLS-ALPN-01](https://letsencrypt.org/docs/challenge-types/#tls-alpn-01) ACME challenge type is supported by teleport.
[^vpsstarcenter]: You need a machine accessible to all other machines as the star center, which basically means that the star center needs to be
    accessible to the public internet. But you don't need to expose any ui/service/port except the WireGuard
    [UDP](https://en.wikipedia.org/wiki/WireGuard#Networking) port.
[^nginxproxymanagersetupinstructions]: [Nginx Proxy Manager: Full Setup Instructions](https://nginxproxymanager.com/setup/#running-the-app)
[^otherdnsprovidercnamerecord]: If you use another DNS provider than DuckDNS you may need to add an [additional CNAME
    record](https://youtu.be/qlcVx-k-02E?t=447) for all of the sub domains.
