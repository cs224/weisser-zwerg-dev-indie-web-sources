---
layout: "layouts/post-with-toc.njk"
title: "Groupware: Implementing grommunio behind Mailu via split delivery"
description: "How to add a docker-compose managed grommunio stack beside Mailu, keep Mailu as the public gateway and routing authority, and expose grommunio Web through Traefik."
seodescription: "Proven guide for grommunio beside Mailu with split delivery, dedicated hostname, generated Docker Compose files, pinned upstream build context, and web UI verification."
creationdate: 2026-04-16
keywords: groupware, PIM, self-hosting, Traefik, Mailu, grommunio, gromox, split delivery, webmail, Outlook, Docker Compose, reverse proxy, mail routing
date: 2026-04-16
tags: ['post']
---

## Rationale

This post is the second practical follow-up to [Groupware: replacing Microsoft Exchange at home (on-prem)](../groupware/).
In the earlier [SOGo article](../groupware-sogo/) in this series, I showed the smaller first step: keep Mailu as the mail system and add SOGo beside it as a web, calendar, and contacts layer.

This post covers the next step: adding [grommunio](https://grommunio.com/) behind Mailu for selected mailboxes only.
That is a different migration shape from SOGo.
SOGo talks to the existing Mailu mailbox over IMAP and SMTP.
grommunio, by contrast, becomes the mailbox owner for the selected recipient while Mailu stays in front as the public MX, SMTP policy layer, and routing authority.

The target here is:

- keep Mailu as the public-facing mail gateway
- keep Traefik as the web reverse proxy
- add grommunio as its own Docker Compose stack
- expose grommunio Web through Traefik on its own hostname
- route only selected mailboxes into grommunio through Mailu split delivery

For consistency with the earlier SOGo article, the Mailu and SOGo side uses the mailbox:

```text
user@mail.example.com
```

with the SOGo web UI published on:

```text
https://sogo.example.com/SOGo/
```

In this post, we deal with one selected grommunio mailbox:

```text
grommunio-user@mail.example.com
```

and the web UI is published on:

```text
https://grommunio.example.com/web/
```

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If parts of this post feel too compressed, copy the URL into an AI assistant and ask it to walk you through the sections that are still unfamiliar.
That is especially useful for Docker networking, split-delivery routing, reverse proxy concepts, and certificate scoping.

## Important Considerations Before You Start

My goal is to leave the existing Mailu and SOGo stacks as unchanged as possible.
I also want to avoid any extra infrastructure cost beyond the VPS that is already in use.
In practice, that means I do not add another public IPv4 address, and I do not move the standard public mail ports away from Mailu.

Mailu therefore continues to own the usual client ports `465` for SMTPS and `993` for IMAPS.
grommunio gets its own additional public ports instead: `2465` for SMTPS and `2993` for IMAPS.
Traefik listens on these extra ports and forwards them directly to grommunio.

> The selection is effectively done by the entrypoint and port, not by hostname based virtual hosting.
> Traefik still expects a TCP routing rule, and `HostSNI('*')` expresses exactly that: accept all matching TLS connections on this entrypoint and pass them through to the configured backend.
> With `tls.passthrough: true`, Traefik does not terminate TLS itself. It only uses the TCP/TLS router to decide where the encrypted connection should go, and then forwards the TLS stream unchanged to grommunio.

This setup keeps the public mail design easy to understand.
Existing Mailu users can continue to use the standard ports without any client changes, while grommunio can be used in parallel on separate ports.

## Traefik Configuration Additions

These requirements lead to a few targeted additions in Traefik.
The configuration examples below are not complete Traefik files.
They only show the parts that matter for this setup.

First, we add the extra TCP entrypoints on public ports `2465` and `2993` so Traefik can accept SMTPS and IMAPS connections for grommunio.
Next, we publish the grommunio web UI on `https://grommunio.example.com/web/`.
Finally, we forward `https://autodiscover.mail.example.com` to the native grommunio HTTPS listener, so Outlook and other Exchange-compatible clients can discover the correct settings automatically.

`docker-compose.yml`:
```yml
services:
  traefik:
    image: traefik:v3.5.3
    ports:
      - "2465:2465"
      - "2993:2993"
    volumes:
      - ./traefik-config/dynamic-grommunio.yml:/etc/traefik/dynamic/dynamic-grommunio.yml
```

`traefik.yml`:
```yml
entryPoints:
  web:
    address: ":80"
    allowACMEByPass: true
    http:
      redirections:
        entryPoint:
          to: web-secure
          scheme: https
          # Make the redirect router *less* dominant than your ACME router:
          priority: 1
  web-secure:
    address: ":443"
    http2:
      maxConcurrentStreams: 250
    http3: false
  grommunio-submissions:
    address: :2465
  grommunio-imaps:
    address: :2993
```

`dynamic-grommunio.yml`:
```yml
http:
  routers:
    grommunio-web:
      entryPoints: [web]
      rule: "Host(`grommunio.example.com`)"
      middlewares: [redirect-to-https]
      service: noop@internal

    grommunio-web-root:
      entryPoints: [web-secure]
      rule: "Host(`grommunio.example.com`) && Path(`/`)"
      middlewares: [grommunio-root-redirect]
      priority: 100
      service: noop@internal
      tls:
        certResolver: cf-dns

    grommunio-websecure:
      entryPoints: [web-secure]
      rule: "Host(`grommunio.example.com`)"
      priority: 10
      service: grommunio-web
      tls:
        certResolver: cf-dns

    grommunio-autodiscover:
      entryPoints: [web]
      rule: "Host(`autodiscover.mail.example.com`)"
      middlewares: [redirect-to-https]
      service: noop@internal

    grommunio-autodiscover-secure:
      entryPoints: [web-secure]
      rule: "Host(`autodiscover.mail.example.com`)"
      service: grommunio-web
      tls:
        certResolver: cf-dns

  middlewares:
    redirect-to-https:
      redirectScheme:
        scheme: https
        permanent: true

    grommunio-root-redirect:
      redirectRegex:
        regex: "^https://grommunio\\.example\\.com/$"
        replacement: "https://grommunio.example.com/web/"
        permanent: true

  services:
    grommunio-web:
      loadBalancer:
        serversTransport: grommunio-web-backend
        servers:
          - url: "https://10.0.1.2:8443"

  serversTransports:
    # Allow for a self-signed certificate
    grommunio-web-backend:
      insecureSkipVerify: true

tcp:
  routers:
    grommunio-submissions:
      entryPoints: [grommunio-submissions]
      rule: "HostSNI(`*`)"
      tls:
        passthrough: true
      service: grommunio-submissions

    grommunio-imaps:
      entryPoints: [grommunio-imaps]
      rule: "HostSNI(`*`)"
      tls:
        passthrough: true
      service: grommunio-imaps

  services:
    grommunio-submissions:
      loadBalancer:
        servers:
          - address: "10.0.1.2:2465"

    grommunio-imaps:
      loadBalancer:
        servers:
          - address: "10.0.1.2:2993"
```

## Mailu Configuration Additions

Mailu stays the public mail gateway even for the mailboxes that are actually hosted on grommunio.
That means Mailu must still accept the incoming mail first, then decide whether a message belongs to a normal Mailu mailbox or whether it has to be forwarded to grommunio.
This is the split delivery part of the setup.

> If you need a refresher on the Mailu configuration, have a look at the related post [Private Email with Mailu Behind Traefik Reverse Proxy](../digital-civil-rights-mailu).

The first step is to connect the Mailu and grommunio Docker Compose stacks at the Docker network level.

> This only works if both Docker Compose stacks run on the same host.

To do that, we add one more Docker network to the Mailu `docker-compose.yml`.
Before the change, the network section looks like this:
```yml
networks:
  default:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 192.168.203.0/24
  webmail:
    driver: bridge
```

After the change, it looks like this:
```yml
networks:
  default:
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 192.168.203.0/24
  webmail:
    driver: bridge
  mailhub:
    name: mailhub
    driver: bridge
    ipam:
      driver: default
      config:
        - subnet: 192.168.204.0/24
```

We add a new bridge network called `mailhub` and assign it the fixed subnet `192.168.204.0/24`.

> The fixed subnet makes the later trust settings predictable, because Postfix and `rspamd` can rely on a stable internal address range.

Next, we adapt the network configuration of the `front` and `smtp` services in Mailu's `docker-compose.yml`.
Adding the alias `mail.example.com` on `front` is optional, but it can be useful if an internal sidecar needs to resolve the public Mailu hostname locally.
The important split-delivery change is on the `smtp` service: we attach it to the new `mailhub` network and publish it there under the internal name `mailu-smtp`.

```yml
services:
  front:
    networks:
      default:
        aliases:
          - mail.example.com
        gw_priority: 100
      webmail: {}  

  smtp:
    volumes:
      - "./data/mailu/mailqueue:/queue"
      - "./data-mailu-overrides-postfix:/overrides:ro"  
    networks:
      default:
        gw_priority: 100
      mailhub:
        aliases:
          - mailu-smtp  

  antispam:
    volumes:
      - "./data/mailu/filter:/var/lib/rspamd"
      - "./data-mailu-overrides-rspamd:/overrides:ro"
      - "./data-mailu-overrides-rspamd/local_subnet.map:/conf/local_subnet.map:ro"
```

The internal alias `mailu-smtp` gives the grommunio side a stable hostname for SMTP relay traffic inside Docker.
That is better than depending on dynamic container names or container IP addresses.
The `mail.example.com` alias on `front` is optional and only useful when another internal service needs to resolve the public mail hostname locally.

In `mailu.env`, we then extend the relay permissions so that the grommunio services on the new `mailhub` network are allowed to hand outgoing mail to Mailu.
```txt
# Networks granted relay permissions
# Use this with care, all hosts in this networks will be able to send mail without authentication!
RELAYNETS=192.168.204.0/24
```

> This setting must be used carefully. Any container on that network can submit mail to Mailu without SMTP authentication.

After that, we add a few Mailu-side override files:

1. `./data-mailu-overrides-postfix/postfix.cf`
2. `./data-mailu-overrides-postfix/split-valid.map`
3. `./data-mailu-overrides-postfix/transport.map`
4. `./data-mailu-overrides-rspamd/local_subnet.map`
5. `./data-mailu-overrides-rspamd/options.inc`

The additions in `postfix.cf`, `local_subnet.map`, and `options.inc` are static in this setup.
On the Mailu `antispam` service, `local_subnet.map` should be bind-mounted into `/conf/local_subnet.map` in addition to the usual `./data-mailu-overrides-rspamd:/overrides:ro` mount.
Keeping the file only under `/overrides` is not sufficient in the current Mailu image.

`postfix.cf`:
```txt
virtual_mailbox_maps = lmdb:/etc/postfix/split-valid.map, \${podop}mailbox
```

The backslash before `${podop}` is intentional in this override file.
Mailu applies these override lines during container startup; escaping the dollar sign prevents the startup shell from expanding `${podop}` too early.
The effective Postfix configuration should still end up with `${podop}mailbox` after the override has been applied.

`local_subnet.map`:
```txt
192.168.203.0/24
192.168.204.0/24
```

`options.inc`:
```txt
local_networks = [192.168.203.0/24, 192.168.204.0/24];
```

The files `split-valid.map` and `transport.map` are different. They depend on the list of mailboxes that should live on grommunio instead of Mailu.

> Later, we will introduce the `generate_split_delivery_maps.py` script to generate synchronized configuration files for Mailu and grommunio for exactly those mailboxes.

`split-valid.map`:

```txt
grommunio-user@mail.example.com 1
```

`transport.map`:

```txt
grommunio-user@mail.example.com smtp:[grommunio-internal]:24
```

The override files serve two separate purposes.

First, `local_subnet.map` and `options.inc` tell Mailu's `antispam` container which internal subnets should be treated as local and trusted.
This matters not only for local-domain anti-spoofing checks, but also for `rspamd`'s `local_networks`.
Without both files, mail handed back from grommunio can still be scored as if it were external mail and may be greylisted even though the Postfix relay path itself is already correct.

Second, `split-valid.map` and `transport.map` tell Mailu which recipient addresses are valid even though the mailbox itself does not exist inside Mailu.
That is the key point for split delivery.
Mailu remains the public SMTP entrypoint, but for selected recipients it acts only as the routing authority and hands the mail off to grommunio.

> Without `split-valid.map`, Mailu would reject mail for those recipients because it would not find them in its own mailbox database.
> Without `transport.map`, Mailu would know that the address is valid, but it would still not know where to deliver the message.
> You need both pieces: one to declare that the mailbox exists, and one to define the next hop.

This point is worth repeating: you do **not** need to create, and should **not** create, the mailboxes that belong to grommunio inside Mailu.
Mailu learns about those recipients through the split delivery maps.
The mailbox itself is owned by grommunio, while Mailu stays in front as the public mail gateway and routing layer.

## grommunio Configuration

You can find all files used in this setup in the GitHub repository [mailu-sogo-grommunio](https://github.com/cs224/mailu-sogo-grommunio).

This setup is based on the following upstream source:

* upstream repository: `https://github.com/grommunio/gromox-container`
* pinned commit: `96c26e02bb645450f1ee2f3b35e8b843fbe1120b`

I will first walk through the installation steps on the target machine.
After that, I will explain what the generated setup actually does and how the pieces fit together.

The starting point is an already working Mailu Docker Compose stack at `/opt/mailu`, created as described in the earlier post [Private Email with Mailu Behind Traefik Reverse Proxy](../digital-civil-rights-mailu), together with the Mailu adjustments from the previous section.

To begin, enter the grommunio subdirectory of the companion repository and copy the required files to the target machine:

```bash
cd mailu-sogo-grommunio/grommunio
scp -r ./grommunio-via-vps.env ./generate_grommunio_setup.py ./generate_split_delivery_maps.py ./gromox-container.lock.json ./patches ./templates ./split-delivery homeserver:/opt/grommunio/
```

Here, `homeserver` is the target machine for which passwordless SSH access has already been configured.

The copied files include both templates and helper scripts.
The templates define the generated grommunio configuration, while the Python scripts prepare the final files for this specific deployment.
The lock file `gromox-container.lock.json` ensures that the setup is created from a known upstream state instead of an uncontrolled moving target.
The companion repository also contains the Mailu-side override snippets shown earlier in this post; those belong in the Mailu stack, not in `/opt/grommunio`.

After the transfer, you should be able to inspect the directory on the target machine and see the following structure:

```bash
root@homeserver:/opt/grommunio# tree .
# .
# ├── generate_grommunio_setup.py
# ├── generate_split_delivery_maps.py
# ├── grommunio-via-vps.env
# ├── gromox-container.lock.json
# ├── patches
# │   └── gromox-core.patch
# ├── split-delivery
# │   └── grommunio-mailboxes.txt
# └── templates
#     ├── README.txt.j2
#     └── grommunio
#         ├── docker-compose.yml.j2
#         ├── provision-grommunio.sh.j2
#         ├── var.env.j2
#         └── verify-grommunio.sh.j2

# 4 directories, 11 files
```

This directory layout already shows the basic idea of the installation.
The `templates` directory contains the configuration skeleton that will later be rendered into real deployment files.
The `patches` directory contains local changes applied on top of the pinned upstream version.
The `split-delivery` directory holds mailbox-related input data, which is then used to generate synchronized configuration for both Mailu and grommunio.

The file `grommunio-mailboxes.txt` is especially important later on.
It is the mailbox list that defines which recipients should move from Mailu local delivery to grommunio delivery.

Once the required files are in place on the `homeserver`, you can start the actual installation.

```bash
cd /opt/grommunio
install -d -m 0755 /opt/grommunio/postfix
python3 generate_split_delivery_maps.py --inventory split-delivery/grommunio-mailboxes.txt --mailu-transport-out /tmp/mailu-transport.map --mailu-valid-out /tmp/mailu-split-valid.map --grommunio-transport-out /opt/grommunio/postfix/transport.seed
GROMMUNIO_TARGET_DIR=/opt/grommunio GROMMUNIO_ENV_FILE=./grommunio-via-vps.env python3 generate_grommunio_setup.py
docker compose build
# [+] Building 429.7s (25/25) FINISHED
docker compose up -d
GROMMUNIO_MAILBOX_PASSWORD="CHANGE_ME_GROMMUNIO_USER_PASSWORD" ./provision-grommunio.sh
GROMMUNIO_MAILBOX_PASSWORD="CHANGE_ME_GROMMUNIO_USER_PASSWORD" ./verify-grommunio.sh
```

After these commands finish successfully, you should be able to open [https://grommunio.example.com/web/](https://grommunio.example.com/web/) and sign in with the user `grommunio-user@mail.example.com` and the password that you passed in `GROMMUNIO_MAILBOX_PASSWORD`.

If `docker compose up -d` fails because another container already uses a port that the grommunio stack wants to bind, the following command is useful for finding the conflict:

{% raw %}
```bash
docker ps --format 'table {{.ID}}\t{{.Names}}\t{{.Ports}}' | grep '8443->'
```
{% endraw %}

This will show which container currently binds port `8443`, for example.

The `python3 generate_split_delivery_maps.py ...` line is worth a closer look.
It does not only generate `grommunio/postfix/transport.seed`.
It also writes the Mailu files `transport.map` and `split-valid.map` that we created manually in the earlier section.
That becomes useful as soon as you manage more than one mailbox through grommunio, because it gives you one small inventory file as the single source of truth.

The `./provision-grommunio.sh` script may look a bit opaque at first, so it helps to know what it does in practical terms.
Internally, it performs the same kind of administrative steps that you could also run manually.
That is useful to understand if you later want to add more mailboxes, troubleshoot a failed setup, or inspect the state of the grommunio directory more closely.

The manual path for the first mailbox looks like this:

```bash
# Manual provisioning path for the first mailbox:
docker compose exec -T gromox-core grommunio-admin server create -H gromox-int -e grommunio.example.com
# gromox-int (1)
#   ID: 1
#   hostname: gromox-int
#   extname: grommunio.example.com
#   domains: 0
#   users: 0
docker compose exec -T gromox-core grommunio-admin server list
# 1: gromox-int (grommunio.example.com)

docker compose exec -T gromox-core grommunio-admin domain create --homeserver 1 -u 25 --title "mail.example.com" mail.example.com
# mail.example.com (1):
#   ID: 1
#   orgID: 0
#   domainname: mail.example.com
#   domainStatus: 0 (active)
#   activeUsers: 0
#   inactiveUsers: 0
#   virtualUsers: 0
#   maxUser: 25
#   homeserver: 1 (gromox-int)
#   homedir: /var/lib/gromox/domain/mail.example.com
#   chatID: (none)
#   endDay: 3333-03-03
#   title: mail.example.com
#   address: 
#   adminName: 
#   tel: 
docker compose exec -T gromox-core grommunio-admin domain list
# 1: mail.example.com (active)

docker compose exec -T gromox-core grommunio-admin user create --domain mail.example.com --homeserver 1 --status normal --pop3-imap true --smtp true --privWeb true --privDav true --privEas true grommunio-user@mail.example.com
# [WARNING] (license) Could not load license: No such file or directory
# ID: 1
# username: grommunio-user@mail.example.com
# domainID: 1
# homeserver: 1 (gromox-int)
# lang: (not set)
# maildir: /var/lib/gromox/user/mail.example.com/grommunio-user
# privilegeBits: 3843 (pop_imap,smtp,web,dav,eas)
# addressStatus: 0 (active|active)
# ldapID: (none)
# chat: (none)
# aliases: (none)
# altnames: (none)
# roles: (none)
# fetchmail: (none)
# properties:
#   displaytypeex: 0
#   internetarticlenumber: 29
#   outofofficestate: 0
#   messagesizeextended: 0
#   normalmessagesizeextended: 0
#   assocmessagesizeextended: 0
#   creationtime: 2026-04-11 08:44:42

docker compose exec -T gromox-core grommunio-admin user modify --property "SMTPADDRESS=grommunio-user@mail.example.com" --property "EMAILADDRESS=grommunio-user@mail.example.com" grommunio-user@mail.example.com

docker compose exec -T gromox-core grommunio-admin passwd --password "CHANGE_ME_GROMMUNIO_USER_PASSWORD" grommunio-user@mail.example.com
# docker compose exec -T gromox-core grommunio-admin passwd --password "..." grommunio-user@mail.example.com
# Setting password for user 'grommunio-user@mail.example.com'
# Password updated

docker compose exec -T gromox-core grommunio-admin user query --format pretty
# ID  username          status
#  0  admin             0/active
#  1  grommunio-user@mail.example.com  0/active
```


In practical terms, this does the following.
First, grommunio creates the internal home server object.
Then it creates the mail domain `mail.example.com` on that home server.
After that, it creates the mailbox user itself, assigns the relevant service permissions, stores the primary mail address properties, and finally sets the mailbox password.

The `user modify` step is easy to overlook, but it is important.
It makes sure that the mailbox has the expected mail-related properties inside grommunio, not only a login name.

### grommunio as Exchange Mailbox in Outlook

The next step is to add the mailbox to classic Outlook for Windows as an Exchange-style mailbox.
grommunio supports Autodiscover for this, so Outlook can find the correct Exchange compatible service endpoints automatically and connect to the mailbox without falling back to a plain IMAP/SMTP setup.
For current Outlook versions, MAPI/HTTP is the important mailbox protocol.
grommunio's Exchange-compatible HTTP surface also includes RPC/HTTP and EWS, but Autodiscover plus MAPI/HTTP is the path that matters most here.

> EWS (Exchange Web Services) is part of the Exchange compatible HTTP surface as well, but it is not the main protocol Outlook uses for the mailbox connection.

Autodiscover tells Outlook how to reach the mailbox and which Exchange compatible services to use.

grommunio provides the `gromox-dscli` tool to test and diagnose the Autodiscover setup.
You run it inside one of the grommunio containers on the `homeserver` like this:

```bash
docker compose exec -T gromox-core sh -lc '
PASS="YOUR_REAL_GROMMUNIO_USER_PASSWORD" \
gromox-dscli \
  -H https://autodiscover.mail.example.com/Autodiscover/Autodiscover.xml \
  -e grommunio-user@mail.example.com \
  -u grommunio-user@mail.example.com \
  -v
'
# * Response body:
#   ....
# * Response has validated
```

If everything is configured correctly, the last line should say `Response has validated`.
If it does not, inspect the output carefully.
It usually gives enough detail to tell you whether the problem is in DNS, TLS, the published autodiscover URL, or the mailbox credentials.

> If `gromox-dscli` already fails, there is no point in trying the Outlook wizard yet.
> First fix the autodiscover path until the response validates.

Once Autodiscover works, I recommend creating a separate Outlook profile for the new grommunio mailbox.
That keeps the test setup isolated from any existing Outlook configuration and makes it easier to switch back if needed.

Microsoft [documents](https://support.microsoft.com/en-us/office/turn-outlook-profile-prompt-on-or-off-b6f08321-51ec-4c1d-8c25-3e26ea475d25) two practical ways to select profiles in Outlook.
You can hold `Shift` while starting Outlook to open the profile chooser, or you can enable the option `"Prompt for a profile to be used"` so Outlook asks each time it starts.

Inside that new profile, you can add the mailbox in the normal way.
If Outlook asks for the account type, choose Exchange rather than IMAP or POP.
Outlook will ask for the email address, where you enter `grommunio-user@mail.example.com`.
It will then ask for the password.
If Autodiscover is working, classic Outlook should complete the rest of the setup on its own and connect the mailbox, calendar, and address book as an Exchange-style account.

> That is one of the main differences compared with the earlier SOGo setup.
> There, Outlook needed an extra synchronization layer for calendar and contacts.
> Here, the goal is that Outlook can use the mailbox through the Exchange compatible integration path exposed by grommunio, so no separate CalDAV synchronizer is required.
> There is therefore no need for the [Outlook CalDav Synchronizer](https://github.com/aluxnimm/outlookcaldavsynchronizer) that we had to use in the [SOGo setup](../groupware-sogo/#outlook-with-outlook-caldav-synchronizer).

### GNOME Evolution Setup

I use GNOME Evolution here as an example of a standards-based client that can talk to grommunio without any Exchange-specific integration.

> This section is intentionally brief.
> For a more detailed discussion of GNOME Evolution and other standards-based groupware clients, see the appendix sections of the earlier [SOGo setup](../groupware-sogo/) post.

Start with the mail account first.
It is the simplest part of the setup, and it gives you a quick first check that the mailbox, login, and network path all work as expected.

In Evolution, add a mail account for `grommunio-user@mail.example.com` and use the dedicated grommunio mail endpoints:

* incoming mail: `IMAP`
* IMAP server: `grommunio.example.com`
* IMAP port: `2993`
* transport security: `TLS on a dedicated port`
* username: `grommunio-user@mail.example.com`
* password: your normal mailbox password
* outgoing mail: `SMTP`
* SMTP server: `grommunio.example.com`
* SMTP port: `2465`
* transport security: `TLS on a dedicated port`
* authentication: normal password
* username: `grommunio-user@mail.example.com`

> Note that this setup uses a self-signed certificate for the IMAPS and SMTPS connections, so Evolution will warn you about it.
> Verify that the certificate really belongs to your deployment, then accept or import it on the client.

Once mail works, add the **calendar** as a remote CalDAV calendar.

In my current live setup, the discovery-first path in Evolution did not give me a stable working result. The reliable method was to enter the full calendar collection URL directly:

* type: `CalDAV`
* URL: `https://grommunio.example.com/dav/calendars/grommunio-user@mail.example.com/Calendar`
* username: `grommunio-user@mail.example.com`
* email: `grommunio-user@mail.example.com`
* password: your normal mailbox password

The CalDAV URL pattern used by grommunio looks like this:

* `https://<Server URL>/dav/calendars/<Username>/<Calendar Name>`

The `<Calendar Name>` part must match the real remote calendar name exactly.

> If Evolution reports a DAV `REPORT` error with HTTP `404 Not Found`, first re-check that the URL points to the real collection, for example `/dav/calendars/grommunio-user@mail.example.com/Calendar`.
> In my test, that error was caused by the Evolution-side discovery or URL choice, not by the grommunio mailbox or login itself.

> One Evolution specific detail is worth setting explicitly: set the `Email` field to `grommunio-user@mail.example.com`.
> Evolution uses that address as the organizer address when it creates meetings from that calendar.

Next, add **Contacts** as a CardDAV address book. Here again, I recommend using the full collection URL directly instead of relying on discovery.

* type: `CardDAV`
* URL: `https://grommunio.example.com/dav/addressbooks/grommunio-user@mail.example.com/Contacts`
* username: `grommunio-user@mail.example.com`
* password: your normal mailbox password

For this DAV setup, the CardDAV collection URL pattern is:

* `https://<Server URL>/dav/addressbooks/<Username>/<Address Book Name>`

The `<Address Book Name>` part must match the real remote address book name exactly.

> Mail, calendar, and contacts are configured as three separate client-side pieces.
> Even though they belong to the same mailbox, Evolution still treats them as separate resources.
> That is normal for IMAP, CalDAV, and CardDAV based setups.

Once all three parts are configured, I would test at least these three things first:

1. Send one email to yourself from Evolution.
2. Create one calendar event in Evolution and confirm that it appears in the grommunio Web UI.
3. Create one contact in Evolution and confirm that it appears in the grommunio Web UI.

### Known Problems

One known limitation in this setup comes from the upstream [`gromox-container`](https://github.com/grommunio/gromox-container) repository.

At the moment, search in the grommunio Web UI does not work in this container-based setup.
The reason is that `grommunio-web` expects a separate search indexer to create per user SQLite databases under `/var/lib/grommunio-web/sqlite-index/<user>/index.sqlite3`.
In the upstream `gromox-container` project, that indexer is still not provisioned automatically.
The missing component is [grommunio-index](https://github.com/grommunio/grommunio-index).

> This means the problem is not mail delivery itself.
> Sending, receiving, mailbox access, calendar access, and contact access all work.
> The missing piece affects the search layer used by the web UI.

As a result, search in the grommunio Web UI is currently not available in my setup.
The upstream maintainers do not appear to treat this as a core deployment bug.
Their comment in the [related discussion](https://community.grommunio.com/d/1379-add-grommunio-index-to-the-manual-install-instructions) was:

> "g-index is not mandatory for mail operations, hence it is not part of manual_core.rst. If you get 'unexpected error' instead of simply a slower search, that's a separate bug."

In my case, I do get an actual error instead of degraded behaviour.
For example, when I search in the contacts section of the grommunio Web UI, I see the following message:

> "Unable to perform search query, store might not support searching. (The operation succeeded)."

I looked into adding `grommunio-index` to this setup.
My first idea was to install the package `grommunio-index-1.5.0.gb0a01b9-lp156.2.1.x86_64.rpm` through the normal repository path.
At the time of testing, that turned out to be unreliable because the repository metadata and the RPM file being served did not match.

On April 14, 2026, I observed the following:

1. The repository metadata said that the RPM should have the SHA256 hash
   `633787338810b566f183bd8310acfc4d02679a6b8cc5681acdfb0cab7dda3035`

2. The file actually served at that URL had the SHA256 hash
   `4fb4b63c0f456a7f02e5f27377fe71d4397c5af746f827ccb61a457ed4ea3f92`

That is exactly the kind of mismatch that a package manager is supposed to reject.

> A repository based install depends on two things matching each other: the metadata that describes the package, and the package file that is later downloaded.
> If those two no longer match, a careful package manager should stop the install, because it cannot prove that it received the file it was promised.

I then downloaded the RPM file directly and checked its signature with `rpm --checksig`.
That signature check passed with `digests signatures OK`.

So both of the following statements can be true at the same time:

1. The RPM file itself is signed and may well be legitimate.
2. The repository metadata currently does not match the RPM file being served.

There are several possible explanations for that situation.
For example, the RPM on the server may have been replaced without regenerating the repository metadata.
Another possibility is that the metadata and the package payload are temporarily out of sync on a mirror or CDN.
A partial upstream publish or sync problem is also possible.

> None of these explanations automatically means that the RPM is malicious.
> But from an operational point of view, that distinction does not help much.
> A reproducible setup should use a package source that is internally consistent, especially for an article that other people may want to follow step by step.

For that reason, I decided not to include `grommunio-index` in this guide in its current state.
Until the repository side is consistent again, I prefer to leave web search unsupported rather than document an installation path that depends on bypassing normal package integrity checks.

## Status of Server Side Meeting Request Processing

At this point, it is worth looking at one more functional gap in the current setup: unattended server-side processing of meeting requests.

The current grommunio `exmdb_local` [documentation](https://docs.grommunio.com/man/exmdb_local.4gx.html) mentions two configuration knobs that matter here:

* `lda_mrautoproc`, which enables automatic processing of meeting requests
* `lda_twostep_ruleproc`, which provides the alternate rule processing path that `lda_mrautoproc` depends on

According to the same documentation, `lda_mrautoproc` is still marked as experimental.
It also does not work on its own.
It requires `lda_twostep_ruleproc` to be enabled as well.
By default, `lda_mrautoproc` is set to `no`, and `lda_twostep_ruleproc` is set to `0`.

The documentation also adds an important limitation for `lda_twostep_ruleproc`. It supports cross-store moves and out-of-office conditions, but it currently does not support delegation or autoreply.

On the running container, the file `/etc/gromox/exmdb_local.cfg` does exist, but in my live setup it currently contains only the generated `x500_org_name` line:

```ini
x500_org_name=example-org-id
```

So in the current runtime, the following settings are **not** enabled explicitly:

```ini
lda_twostep_ruleproc=1
lda_mrautoproc=yes
```

That matters mainly in situations where users expect the server to react to meeting traffic on its own during mail delivery.
In other words, this is about server-side iMIP ingestion, not about basic calendar support.
Typical examples are:

* a meeting invitation arrives and the calendar updates automatically
* a meeting update or cancellation is applied even when no client is open
* a shared or resource style mailbox processes invitations without human interaction

For a personal mailbox, this may not be immediately visible in daily use, because Outlook, grommunio Web, or another capable client can still process part of the scheduling workflow when the user opens or acts on the meeting request.
That is still client-side or interactive processing.
The more important gap appears in unattended scenarios, where the mailbox itself is expected to behave like a small scheduling service.

So for this setup unattended mailbox behaviour is limited.
Shared mailboxes, room style mailboxes, or other mailboxes that are supposed to handle meeting requests automatically should therefore be treated with caution.

I decided not to enable these two knobs, because there is a real trade-off involved.

`lda_mrautoproc` is not an isolated switch. Enabling it also means enabling `lda_twostep_ruleproc`, and that changes the delivery time rule processing path more broadly than only for meeting requests.

The documentation is quite clear that this alternate `TWOSTEP` path currently has its own feature profile:

* it supports cross-store moves
* it supports out-of-office conditions
* it currently does not support delegation
* it currently does not support autoreply

In other words, enabling automatic meeting request processing is also an explicit decision to switch to a different delivery time rule processor, and that processor currently does not support delegation or autoreply that other installations may depend on.

> Automatic meeting handling sounds attractive, but if the price is a rule processing path with known functional gaps, it may be better to leave the default unchanged.

For that reason, I currently treat unattended server-side meeting request processing as a known limitation of this installation.
For actively used personal mailboxes, that is often acceptable.
For mailboxes that are meant to behave unattended, it is an important caveat.

## `mailu-sogo-grommunio` Explained

As mentioned earlier, all files used in this setup are available in the GitHub repository [mailu-sogo-grommunio](https://github.com/cs224/mailu-sogo-grommunio).

This setup is based on the following upstream source:

* upstream repository: `https://github.com/grommunio/gromox-container`
* pinned commit: `96c26e02bb645450f1ee2f3b35e8b843fbe1120b`

In the previous sections, we walked through the full installation process on the target machine.
There, I said that I would later explain what the generated setup actually does and how its parts fit together.
This section is where that explanation begins.

### Create a Reproducible Diff Workspace

If you want to understand exactly what this setup changes compared with upstream, it helps to create a small local diff workspace.
The idea is this: check out the same pinned upstream revision twice, keep one copy untouched, and let the generator replace the `gromox-core` tree in the second copy.
You can then compare both trees directly.

That gives you a reproducible way to answer the question: *What did this setup actually change inside `gromox-core`, beyond the generated files around it?*

From the repository checkout, the following commands create that workspace:

```bash id="bhmfl9"
cd /path/to/mailu-sogo-grommunio/grommunio

WORKDIR="$(mktemp -d /tmp/grommunio-diff.XXXXXX)"
REPO_URL="$(python3 -c 'import json; print("https://github.com/" + json.load(open("gromox-container.lock.json"))["repo"] + ".git")')"
PINNED_COMMIT="$(python3 -c 'import json; print(json.load(open("gromox-container.lock.json"))["commit"])')"
TARBALL_URL="$(python3 -c 'import json; print(json.load(open("gromox-container.lock.json"))["archive_url"])')"

git clone "$REPO_URL" "$WORKDIR/upstream-original"
git clone "$REPO_URL" "$WORKDIR/upstream-working"
git -C "$WORKDIR/upstream-original" checkout "$PINNED_COMMIT"
git -C "$WORKDIR/upstream-working" checkout "$PINNED_COMMIT"

# If you prefer to work from the tarball instead:
#
# curl -L "$TARBALL_URL" -o "$WORKDIR/gromox-container.tar.gz"
# tar -xzf "$WORKDIR/gromox-container.tar.gz" -C "$WORKDIR"
# cp -a "$WORKDIR/gromox-container-${PINNED_COMMIT}" "$WORKDIR/upstream-original"
# cp -a "$WORKDIR/gromox-container-${PINNED_COMMIT}" "$WORKDIR/upstream-working"

GROMMUNIO_TARGET_DIR="$WORKDIR/generated" GROMMUNIO_ENV_FILE=./grommunio-via-vps.env python3 generate_grommunio_setup.py

rm -rf "$WORKDIR/upstream-working/gromox-core"
cp -a "$WORKDIR/generated/gromox-core" "$WORKDIR/upstream-working/gromox-core"
```

At that point, you have two comparable trees: one pristine upstream copy and one generated working copy. You can now open both in a visual diff tool:

```bash id="rw9wgo"
meld "$WORKDIR/upstream-original/gromox-core" "$WORKDIR/upstream-working/gromox-core"
# or:
kdiff3 "$WORKDIR/upstream-original/gromox-core" "$WORKDIR/upstream-working/gromox-core"
```

> Of course, these changes are also available as `/path/to/mailu-sogo-grommunio/grommunio/patches/gromox-core.patch`.
> The workflow above is still useful because it lets you verify for yourself that there is no additional hidden logic beyond the generated output and the applied patch.

> This is useful for two reasons.
> First, it gives you a reviewable change set against a known upstream revision.
> Second, it makes later updates easier, because you can repeat the same comparison against a new pinned commit.

When you inspect the diff, most of the changes are small and focused.

* In `entrypoint.sh`, I make the `chat` component optional. The generated environment sets `GROMMUNIO_ENABLE_CHAT=false`, so this deployment installs only the core components.
* In `supervisor.d/saslauthd.conf`, I add the `-r` option to `saslauthd`, because authentication in this setup should use the full mailbox identity, such as `grommunio-user@mail.example.com`, not only the local part `grommunio-user`.
  * This detail becomes more important in split delivery or multi domain environments.
* In `common/ssl_setup`, I extend the existing logic so that the environment variable `GROMMUNIO_SSL_DAYS` can control the lifetime of the self-signed certificate used for SMTPS and IMAPS. In the generated setup, I use that to increase the validity period to ten years.
  * The goal is to avoid routine maintenance for the internal mail protocol certificate, because these dedicated SMTPS and IMAPS ports are used only for direct client access to grommunio.
  * A self-signed certificate is acceptable here. Users need to trust that certificate on clients that connect directly to `2465` and `2993`.
  * I did consider other options, especially `certbot` with `DNS01`, but I decided against adding that complexity here. That approach only works when the DNS provider supports the required automation flow. For this article, that would add a provider-specific dependency to a part of the setup that is otherwise quite self-contained.
  * This limitation does not affect the Outlook web service path discussed earlier. Outlook reaches grommunio through HTTPS endpoints published via Traefik, and there the certificate is managed separately through Let's Encrypt.

The largest changes are in `docker-entrypoint.sh`, because that is where the setup has to bridge the gap between the upstream container defaults and the requirements of this split delivery deployment.
This is also where most of the values we defined in `grommunio-via-vps.env` come into use. For reference, here is the file again from the GitHub repository:
```txt
# Copy this file to a real env file, adjust the values, then run:
#   GROMMUNIO_ENV_FILE=/path/to/your.env python3 generate_grommunio_setup.py

GROMMUNIO_TARGET_DIR=/opt/grommunio
GROMMUNIO_MAILHUB_NETWORK=mailhub
GROMMUNIO_MAILHUB_ALIAS=grommunio-internal
GROMMUNIO_INTERNAL_HOSTNAME=gromox-int

# Option 1: publish the grommunio listeners directly on the private home-side IP
# that the VPS can reach over WireGuard or another private link.
GROMMUNIO_WEB_BIND=10.0.1.2:8443:8443
GROMMUNIO_SMTPS_BIND=10.0.1.2:2465:2465
GROMMUNIO_IMAPS_BIND=10.0.1.2:2993:2993

# Option 2: if Traefik and grommunio share the same Docker host instead, leave
# the binds empty and attach both services to the same external edge network.
GROMMUNIO_EDGE_NETWORK=
GROMMUNIO_EDGE_ALIAS=

GROMMUNIO_TZ=Europe/Zurich
GROMMUNIO_FQDN=grommunio.example.com
GROMMUNIO_DOMAIN=mail.example.com
GROMMUNIO_DOMAIN_MAX_USERS=25
GROMMUNIO_ORGANIZATION=mail.example.com
GROMMUNIO_ADMIN_PASS=CHANGE_ME_GROMMUNIO_ADMIN_PASSWORD
GROMMUNIO_MAILBOX_EMAIL=grommunio-user@mail.example.com
GROMMUNIO_MAILBOX_CN=grommunio-user
GROMMUNIO_RELAYHOST=[mailu-smtp]:25
GROMMUNIO_ENABLE_CHAT=false
# Route autodiscover.mail.example.com on the VPS Traefik layer to the same
# native grommunio HTTPS listener published by GROMMUNIO_WEB_BIND.

GROMMUNIO_DB_IMAGE=mariadb:10
GROMMUNIO_DB_NAME=grommunio
GROMMUNIO_DB_USER=grommunio
GROMMUNIO_DB_PASSWORD=CHANGE_ME_GROMMUNIO_DB_PASSWORD
GROMMUNIO_DB_ROOT_PASSWORD=CHANGE_ME_GROMMUNIO_DB_ROOT_PASSWORD

GROMMUNIO_SSL_INSTALL_TYPE=0
GROMMUNIO_SSL_DAYS=3650
GROMMUNIO_SSL_EMAIL=admin@mail.example.com
```

#### `docker-entrypoint.sh` Entrypoint Changes

The entrypoint changes are easier to understand if you split them into four groups:

1. preparing persistent directories
2. deciding what should run once and what should run on every fresh container filesystem
3. applying the gromox and Postfix settings that are specific to this deployment
4. moving the public-facing mail protocol listeners away from the standard Mailu ports

The first part is about preparing persistent directories, which you can recognize from the `install -d ...` calls.
This ensures that the paths exist with the right ownership and permissions.
Without this step, services can end up with missing paths or incorrect permissions.

The next change is the marker logic, which decides what should run once and what should run on every fresh container restart.
We distinguish between the database marker and the entrypoint marker.
The database initialization should only run once and not run again every time the container is recreated.
The entrypoint marker ensures that when the container is recreated, the generated configuration (e.g. `/etc/postfix/main.cf`, `/etc/postfix/master.cf`, `/etc/gromox/timer_agent.cfg`, and `/etc/gromox/event_proxy.cfg`) is applied again.

The local adjustment block is about applying the gromox and Postfix settings that are specific to this deployment.
This is the block in which the `setconf` helper function, loaded from upstream `/home/common/helpers`, is applied.

One aspect is enforcing the identity of the running container to `GROMMUNIO_INTERNAL_HOSTNAME=gromox-int`.
The reason is consistency.
Several gromox components need to agree on the identity of the local single-node server.
Using one generated internal hostname avoids a situation where one component uses the Docker container hostname, another uses the public hostname, and another uses a default from the upstream image.

The Compose file reinforces that same identity with:

```yml
extra_hosts:
  - "gromox-int=[::1]"
```

So `gromox-int` resolves locally inside the container.
That keeps local gromox-to-gromox communication on the loopback path while still giving the services a stable name.


There is also some zcore-specific configuration work.
`zcore` is part of the gromox service layer used for MAPI-style mailbox access.

The next Postfix setting is one of the more important ones in this setup:

```bash
setconf /etc/postfix/main.cf virtual_transport "smtp:[127.0.0.1]:24"
```

This controls how Postfix delivers mail for local grommunio-owned recipients.
The message should not leave the container again.
It should go from Postfix into the local gromox delivery queue.
In this image, that queue is reachable on port `24`.

So the local path for a grommunio mailbox is:

```text
Postfix inside gromox-core -> smtp:[127.0.0.1]:24 -> gromox delivery
```

This is separate from the Mailu-to-grommunio split delivery hop.
Mailu reaches the grommunio stack through:

```text
smtp:[grommunio-internal]:24
```

Both paths end at the same gromox delivery listener on port `24`, but they start in different places.
Mailu uses the shared Docker `mailhub` network.
Postfix inside the grommunio container uses loopback.


Then the script installs the generated transport seed coming from `generate_split_delivery_maps.py`.
It says, in effect:

```txt
grommunio-user@mail.example.com smtp:[127.0.0.1]:24
mail.example.com smtp:[mailu-smtp]:25
```

The first line keeps mail for the grommunio-owned mailbox local.
The second line sends other same-domain recipients back to Mailu.
That second line is what makes mixed ownership in one domain work.
If a grommunio user sends mail to a Mailu-owned address in `mail.example.com`, grommunio's Postfix hands it back to Mailu instead of trying to deliver it locally.

`timer_agent.cfg` tells gromox clients where to find the timer service.
`event_proxy.cfg` tells clients that use the event proxy where to find the event service.

Finally, the entrypoint changes the public mail protocol listeners.
The upstream container has standard Postfix service names such as `smtp`, `submission`, and `smtps`.
This setup moves them to non-standard container ports:

```bash
sed -i 's/^smtp\(\s\+\)inet/2525\1inet/' /etc/postfix/master.cf
sed -i 's/^submission\(\s\+\)inet/2587\1inet/' /etc/postfix/master.cf
sed -i 's/^smtps\(\s\+\)inet/2465\1inet/' /etc/postfix/master.cf
```

It also appends explicit `2587` and `2465` listener definitions if they are not already present.

> You might ask why this is done inside `docker-entrypoint.sh` at all.
> Could we instead leave Postfix listening on its normal internal ports and remap only in `docker-compose.yml`, for example `10.0.1.2:2465:465`?
>
> The answer is yes, that would be technically possible.
> But this setup makes the Docker networking simpler, because a reverse proxy attached to the same Docker network can route to the same container port that the public documentation mentions.

Here is the grommunio stack's own complete internal listener map:

```text
24    local gromox delivery queue
8443  HTTPS web
9443  admin/API HTTPS (not published)
2525  SMTP service moved away from port 25
2587  submission with STARTTLS (not published)
2465  SMTPS with implicit TLS
2143  IMAP (not published)
2993  IMAPS
2110  POP3 (not published)
2995  POP3S (not published)
```

For the production setup in this post, only a subset of that map is meant to be public:

```text
443   grommunio Web through Traefik
2465  grommunio SMTPS
2993  grommunio IMAPS
```

Everything else is either internal plumbing or a possible future client endpoint.

### `data/grommunio/variables/var.env`

Most directories below `data/grommunio` start out empty and become persistent runtime storage.
One generated file is different:

```text
data/grommunio/variables/var.env
```

This file is the bridge between the generator and the upstream grommunio setup scripts.
`var.env` is the rendered runtime input for the container setup.

The most important values fall into a few groups:
- database connection details
- identity of this grommunio instance (FQDN, DOMAIN, INTERNAL_HOSTNAME, ORGANIZATION, TIMEZONE)
  - `FQDN` is the public grommunio hostname.
  - `DOMAIN` is the mailbox domain hosted by this stack.
  - `INTERNAL_HOSTNAME` is the local gromox node identity used inside the container, as discussed above.
- mail hand-back target: `RELAYHOST=[mailu-smtp]:25`
- feature and certificate settings (ENABLE_CHAT, ENABLE_ARCHIVE, ENABLE_OFFICE, ENABLE_FILES, SSL_*)
  - For this small setup, only the core groupware pieces are enabled.
  - `SSL_INSTALL_TYPE=0` tells the upstream setup to create a self-signed certificate for the in-container mail protocol services.
  - `SSL_DAYS=3650` makes that generated certificate long-lived enough for manual client trust onboarding.

**Remember**: Changing `grommunio-via-vps.env` later does not magically change an already generated and initialized container.
The normal workflow is to rerun `generate_grommunio_setup.py`, review the generated changes, and then rebuild or recreate the stack deliberately.

### `docker-compose.yml`

The generated `docker-compose.yml` is small.

The `gromox-core` container is the important one.
It is built locally from the pinned upstream `gromox-core` tree after `patches/gromox-core.patch` has been applied.
That is how the changes explained in the previous section enter the running stack.

Most of the Compose file is persistence wiring.
The pattern is straightforward:

* `/home/vars` receives the generated setup variables.
* `/etc/gromox` persists the generated gromox configuration.
* `/var/lib/gromox` persists the mailbox store data.
* `/var/lib/grommunio-web` and `/var/lib/grommunio-dav` persist web and DAV state.
* `/home/postfix-transport.seed` injects the generated grommunio-side transport map.
* `/data` stores setup markers that should survive normal container restarts.

The network section is the other important part.
The default network belongs to the grommunio stack itself:

```yml
networks:
  default:
    driver: bridge
    enable_ipv6: true
```

The `enable_ipv6: true` line is important and keeping it enabled avoids subtle local-service failures inside the stack.

The second important network is `mailhub`:

```yml
networks:
  mailhub:
    external: true
```

This network is created by the Mailu stack, because Mailu remains the routing authority and grommunio only joins it.
On that network, the grommunio container gets the alias:

```yml
aliases:
  - grommunio-internal
```

That is why Mailu can route selected recipients to:

```text
smtp:[grommunio-internal]:24
```

The same network also contains Mailu's `smtp` service under the alias `mailu-smtp`.
That is why grommunio can hand mail back to:

```text
[mailu-smtp]:25
```

One last detail worth mentioning is:

```yml
extra_hosts:
  - "gromox-int=[::1]"
```

This connects the internal gromox host identity from `var.env` to loopback inside the container.
It is part of keeping the single-node gromox services consistent: the services use the stable internal name `gromox-int`, but that name still resolves locally.

## Conclusion

This setup shows that you can add grommunio beside Mailu.
Mailu stays the public gateway, SMTP policy layer, and routing authority, while grommunio becomes the mailbox owner only for the recipients you explicitly move behind split delivery.

The result is a practical migration shape for selected mailboxes:
Outlook can use Autodiscover and the Exchange-compatible path, standards-based clients can use IMAP, CalDAV, and CardDAV, and the surrounding setup stays reviewable because the moving parts are generated from a small inventory plus a pinned upstream base.
The main limitations at the moment are the missing web search indexer and the cautious stance on unattended server-side meeting processing, but for a small self-hosted deployment this can still be a useful and workable compromise.

## Appendix

### Migrating Calendar and Contacts from an Existing Outlook Backend

There is already a section on [Migrating Calendar and Contacts from an Existing Outlook Backend](../groupware-sogo/#migrating-calendar-and-contacts-from-an-existing-outlook-backend) in the earlier SOGo post.
I want to cover it again here because this step is central to a successful move from an existing Exchange or Office 365 setup to a self hosted grommunio mailbox.

Before going into the steps, one point deserves emphasis:
the success of the migration depends less on grommunio itself than on the quality of the export from the old system.
In my case, the migration into grommunio was very smooth and did not produce unexpected import problems.
The difficult part was making sure that the export from the old Outlook backed mailbox was really complete.

For this work, use classic Outlook.
New Outlook can browse email stored in a `.pst`, but calendar and contact items from `.pst` files are not available there, and `.pst` import is not available in new Outlook at this time.

The real goal is not just to export *some* data.
The goal is to export **all contacts** and **all calendar data**.
That is where Exchange caching becomes important.
Outlook only exports what is actually present in the local cache of an Exchange mailbox, unless you either set synchronization to `All` or temporarily disable Cached Exchange Mode.

In my case, the safer choice was to disable Cached Exchange Mode completely.
I did that because I was not confident that setting synchronization to `All` would give me an easy way to verify that the local cache was truly complete.

To do that in Outlook, open `File` -> `Account Settings` -> `Account Settings`.
Select the old Exchange account and open its settings dialog.
Then go to `Extended Settings` -> `Extended`, clear the option `Use Cached Exchange Mode`, and restart Outlook.

> Disabling Cached Exchange Mode forces Outlook to work directly against the server side mailbox data instead of relying on a local offline subset.
> For an export, that is useful because it reduces the risk that older calendar entries, older contacts, or less frequently used folders are missing from the resulting `.pst`.

> Once the export is complete, you can enable Cached Exchange Mode again.

This is one of the steps where it is worth being cautious and a little slow.
A mailbox migration is much easier when the first export is complete than when you later discover that an old contact folder or part of the calendar history was missing and needs a second cleanup import.

#### Export the Old Calendar

Before you start the export, a few limits are worth stating clearly.

- This procedure migrates calendar items only from calendar folders that you explicitly export.
- Shared calendars, subscribed calendars, and Internet calendars are not the same as your own mailbox calendar folders.
  Those should usually be re-added manually instead of treated as mailbox data to migrate.
- Meeting organizer ownership does not transfer.

The final result depends mostly on two things:

1. You export every calendar folder that you personally own and want to keep.
2. The old Exchange mailbox is fully available at export time, either because it has completely synchronized or because Cached Exchange Mode was disabled first.

> That second point matters more than it may seem at first.
> A calendar export can look successful even when older items are missing locally.
> If Outlook does not currently have the full mailbox data available, the exported `.pst` may still be incomplete without making that obvious during the export wizard.

I recommend creating one dedicated export file for each source calendar that you own.
Start with the default calendar, then repeat the same process for every additional calendar folder in the old mailbox that belongs to you.

The export flow in Outlook is as follows:

1. Open `File` -> `Open & Export` -> `Import/Export`.
2. Choose `Export to a file`, then select `Next`.
3. Choose `Outlook Data File (.pst)`, then select `Next`.
4. Select the main `Calendar` folder of the old account.
5. Enable `Include subfolders`.
6. Save the export to a clearly named file, for example `old-calendar-main.pst`.
7. Finish the export.

If you have more than one calendar folder that you own and want to migrate, repeat the same process for each one and give every `.pst` file a distinct name.

> It is better to think in terms of "owned calendar folders" than simply "all visible calendars".
> In Outlook, visibility does not necessarily mean ownership, and ownership is what matters for a clean migration.

Examples:

* `old-calendar-main.pst`
* `old-calendar-family.pst`
* `old-calendar-projects.pst`

Using separate export files makes the later import step easier to control.
If one calendar needs to be checked again, re imported, or cleaned up, you can do that without touching the others.

#### Export the Old Contacts

Next, create a dedicated export for your contacts.

1. Go to `File` -> `Open & Export` -> `Import/Export`.
2. Choose `Export to a file` -> `Next`.
3. Choose `Outlook Data File (.pst)` -> `Next`.
4. Select the old account's `Contacts` folder.
5. Check `Include subfolders`.
6. Save the file as something like:
   - `old-contacts.pst`
7. Finish the export.


A few limits are worth keeping in mind.

- This migrates your mailbox contacts.
- It does not migrate a Global Address List from the old Exchange organization.
- If you use shared contacts or public folders, handle those separately.

> That distinction is important because Outlook often shows several address sources in one place.
> For a migration, however, you usually only want the contacts that are actually stored in your own mailbox.
> Organization wide directories such as the Global Address List are part of the old server environment, not part of your personal mailbox data export.

As with calendar export, it is better to export only the contact folders you actually own, instead of assuming that every address source visible in Outlook is mailbox data that should be migrated.

#### Verify the Export Files

Before importing anything into the new system, I strongly recommend verifying the exported `.pst` files first.
This gives you one more chance to confirm that the export really contains the calendar and contact data you expect, before you start the import on the grommunio side.

On Linux, the packages `pff-tools` and `pst-utils` are useful for that kind of inspection.
On Ubuntu or Debian, you can install them with:

```bash
apt install pff-tools pst-utils
```

My practical recommendation is to use `pffexport -d` when you want to inspect the internal structure and contents of a `.pst` file in a more direct way and to use `readpst -e` when you want to extract the data into normal `.ics` and `.vcf` files
so that you can open them in other tools and review the actual calendar events and contacts more comfortably.

Once the tools are installed, you can run the following commands:

```bash
mkdir -p out-cal out-contacts
readpst -e -t a -o out-cal old-calendar-main.pst
readpst -e -cv -t c -o out-contacts old-contacts.pst
```

This extracts the calendar export into `.ics` files and the contacts export into `.vcf` files for review.

> That review step is worth the extra few minutes.
> A `.pst` export can exist and still be incomplete in practice.
> The goal here is only to inspect the data and confirm that the `.pst` files are usable and complete before you import them elsewhere.
> By extracting the data into normal interchange files, you can quickly check whether older calendar entries are present, whether recurring events look correct, and whether your contacts really contain the expected names, email addresses, and phone numbers.

#### Conclusion

Once you are confident that the export is complete, the import itself is usually straightforward.
At that point, you can use the normal classic Outlook import flow for `.pst` files and import the calendar and contact data into the new grommunio backed mailbox.

After the import starts, Outlook will usually continue working in the background for a while.
The local import may finish first, but that does not yet mean that all data has already been uploaded and synchronized to the grommunio server.
Outlook will show progress information in its status bar while this background synchronization is still running.

> Right after the import, the data may already be visible in Outlook because it exists in the local profile, while the server side upload is still in progress.
> For larger calendars or contact sets, expect some waiting time until Outlook becomes quiet and before treating the migration as finished.

Once the status bar messages related to synchronization disappear, the imported data has usually finished syncing to the grommunio backend.

I recommend that you do one final check in the grommunio Web interface after that.
Open the calendar and contacts there and confirm that the expected folders and entries are present.
That gives you a direct server side confirmation instead of relying only on what Outlook shows locally.
