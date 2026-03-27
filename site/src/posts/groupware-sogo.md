---
layout: "layouts/post-with-toc.njk"
title: "Groupware: Implementing SOGo beside Mailu behind Traefik"
description: "How to add SOGo beside an existing Mailu installation, keep Mailu as the lead mail system, and publish SOGo through a Traefik reverse proxy on a VPS."
seodescription: "Production setup guide for SOGo beside Mailu with Traefik, generated config, explicit IMAP and SMTP wiring, and Outlook, KDE Kontact, and Evolution client setups."
creationdate: 2026-03-27
keywords: groupware, PIM, self-hosting, Traefik, Mailu, SOGo, CalDAV, CardDAV, Outlook, Outlook CalDav Synchronizer, Kontact, Evolution
date: 2026-03-27
tags: ['post']
---

## Rationale

This post is the first follow-up to [Groupware: replacing Microsoft Exchange at home (on-prem)](../groupware/).
In that earlier post, I promised a practical guide showing how to add [SOGo](https://www.sogo.nu) to an existing [Mailu](../digital-civil-rights-mailu/) installation and use client-driven meeting-request processing.

If you want background on the terms and the overall design, read [Groupware: replacing Microsoft Exchange at home (on-prem)](../groupware/) first.
That post explains how the different parts fit together and describes a self-hosted, on-prem, standards-based alternative to Microsoft Exchange for a small group such as a family.
The goal is to provide mail, calendars, contacts, and meeting invites without depending on Exchange-specific protocols.

In the [Groupware](../groupware/) post, I argued that a small self-hosted setup does not need to jump straight from "plain mail server" to "full Exchange replacement".
A more pragmatic first step is to keep the mail system stable and add groupware beside it.
That makes the migration smaller, easier to test, and easier to roll back.
That is what this post does.

The target here is:

- keep Mailu as the public MX, SMTP policy layer, IMAP service, and routing authority
- add SOGo beside Mailu for `user@mail.example.com`
- publish SOGo on its own hostname through the existing Traefik instance on the VPS
- generate the [`sonroyaalmerol/docker-sogo`](https://github.com/sonroyaalmerol/docker-sogo) config files with `generate_sogo_setup.py` and an env file such as `sogo-via-vps.env`

This is the "client-driven groupware" step from the concepts post:

- Mail stays in Mailu
- SOGo adds webmail, calendar, contacts, CalDAV, and CardDAV
- desktop and mobile clients can talk open protocols instead of Exchange-only APIs

I deliberately keep this separate from the later grommunio and split-delivery topic. This post is only about SOGo beside Mailu in production.

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Target Architecture

In [Private Email with Mailu Behind Traefik Reverse Proxy](../digital-civil-rights-mailu/), I described how to set up a Mailu mail system on a home server while using Traefik on a separate virtual private server, or VPS, as the reverse proxy at the edge as the gateway to the public internet.
This design keeps all data at home under your physical control; the VPS only forwards traffic and stores nothing. 
In that earlier article, Mailu was deployed as a Docker Compose stack at `/opt/mailu`.
In this post, we add SOGo as a second and independent Docker Compose stack at `/opt/sogo`.

This separation is useful for day to day operations. Mailu remains responsible for mail delivery and mailbox access, while SOGo adds the groupware features on top.
By keeping both applications in separate stacks, it becomes much easier to understand which service owns which files, which data, and which settings.

The practical benefits are operational clarity:

* Mailu and SOGo can be upgraded independently
* persistent data stays clearly separated
* SOGo gets its own database and cache
* backups are easier to plan and verify
* there is no ambiguity about which service owns which config or data directory

Mailu remains the lead system. SOGo is an add on stack, not a Mailu replacement.

The production layout looks like this:

* Mailu serves webmail and mail protocols on `mail.example.com`
* SOGo is published on `sogo.example.com`
* Traefik runs on the VPS and forwards requests for the SOGo hostname to the home server
* SOGo runs on the home server as its own Docker Compose stack
* SOGo joins Mailu's Docker network `mailu_default`
* SOGo connects to Mailu through explicit IMAP and SMTP URLs

SOGo acts as an IMAP and SMTP client of the existing Mailu installation.
The mailbox stays where it already is, and SOGo adds a web interface plus calendar and contacts services beside it.

At a high level, the request path looks like this:

```text
  browser /  KDE Kontact
          |
          v
  sogo.example.com
          |
          v
      VPS Traefik
          |
          v
  http://10.0.1.2:8888
          |
          v
     SOGo container
          |
          +--> MariaDB
          +--> memcached
          +--> Mailu via IMAP / SMTP
```

This keeps responsibilities clear.

* Mailu owns the mailbox
* SOGo owns the groupware UI and DAV layer
* Traefik owns public web exposure

The `mailu_default` network link is also part of this clean split.
It allows the SOGo stack to reach Mailu services directly over Docker networking without merging both applications into one larger Compose project.
That keeps the setup easier to inspect, test, and troubleshoot when something fails.

## Important Considerations Before You Start

Before running any commands, it helps to make a few design decisions clear.
They affect routing, certificates, and the way SOGo connects to Mailu.
If you decide these points early, the rest of the setup becomes much easier to understand and troubleshoot.

### Give SOGo Its Own Hostname

Use a dedicated hostname for SOGo, for example:

```text
sogo.example.com
```

Do not place SOGo under the Mailu web hostname with a path prefix when Mailu web is still published through Traefik TCP TLS passthrough.
In that setup, Traefik does not terminate HTTPS for the Mailu hostname in the normal HTTP routing layer, so it cannot reliably make path based routing decisions for `/SOGo` or similar paths on the same host.
A separate hostname keeps the routing model clear.
It also reduces the risk that requests end up on the wrong backend.

> This is mainly a boundary problem between TCP level routing and HTTP level routing.
> With TLS passthrough, Traefik only sees the encrypted connection and forwards it based on the hostname seen during the TLS handshake.
> It does not inspect the later HTTP request path in the usual way.
> That is why `mail.example.org/sogo` is a poor fit in this design, while `sogo.example.org` is straightforward.

Depending on how your DNS is set up, you may need to add A and AAAA records so that `sogo.example.com` points to the same public IP address as `mail.example.com`.

### Keep Mailu and SOGo Certificate Scope Separate

If Mailu web stays on TCP passthrough on external `443`, while SOGo is published by a normal HTTPS router on the same public IP address and port, keep the certificate name sets separate.

In practice, that means:

* the Mailu certificate should not include `sogo.example.com`
* the SOGo certificate should not include `mail.example.com`

This separation avoids a class of routing problems where a browser may reuse an existing TLS connection for a different origin when the certificate and connection rules allow it.
If both services share overlapping certificate names while using different Traefik routing modes, requests may reach the wrong backend even though DNS looks correct.

> The browser behavior behind this is sometimes called connection reuse or origin coalescing.
> You do not need to understand every detail to operate the setup safely.
> The practical rule is simple: when one service is behind TCP TLS passthrough and the other is behind a normal HTTPS router on the same entrypoint, keep the hostnames and certificate SANs (Subject Alternative Name) clearly separated.

### Make IMAP and SMTP Explicit

Do not let SOGo guess how to reach Mailu. Define the mail endpoints explicitly.

Set these variables in the env file:

* `SOGO_IMAP_URL`
* `SOGO_SMTP_URL`

This makes the setup more readable and more predictable.
Anyone looking at the configuration can immediately see which Mailu services SOGo is expected to use.
It also avoids subtle errors where automatic defaults point to the wrong hostname, the wrong port, or the wrong encryption mode.

### Keep the Mailbox Password Out of Generated Files

`generate_sogo_setup.py` intentionally does not write the mailbox password into the generated configuration tree.
Instead, it prints an interactive SQL command for the SOGo authentication row.
For a small production setup, that is a sensible default.

It keeps the generated files easier to share, back up, and inspect without exposing a live mailbox password by accident.
It also makes it less likely that credentials are copied into version control, shell history, or temporary working files.

> For a home or family setup, this is often the right tradeoff.
> You keep the automation for the structure of the deployment, but you still enter the most sensitive secret in a more controlled way.
> Later, if you want a more automated secret handling model, you can move that part to a password manager, a secret file with restricted permissions, or a dedicated secret backend.

## Prerequisites

This guide assumes:

1. Mailu is already working.
2. The mailbox `user@mail.example.com` already exists in Mailu.
3. Docker and Docker Compose are available on the host where SOGo will run.
4. Mailu uses `COMPOSE_PROJECT_NAME=mailu`, so the external Docker network name is `mailu_default`.
5. The VPS already runs Traefik and already forwards other services to the home server.
6. DNS for `sogo.example.com` points at the VPS.

## The Generator Based Workflow

The setup in this post follows a generator based workflow built around one `.env` file.
The idea is simple.
You describe the target system once in that env file, then let `generate_sogo_setup.py` create the SOGo specific host files from it.
After that, you start the generated stack, insert the mailbox credentials, and finally add the VPS side Traefik route.

In practice, the sequence looks like this:

1. Prepare an env file.
2. Run `generate_sogo_setup.py`.
   * The configuration is parameterized through the env file.
   * Only the SOGo host files are generated.
3. Start the generated stack.
4. Insert the SOGo user credentials.
   * The mailbox password is not written into the generated files automatically.
5. Add the VPS side Traefik route.
   * The VPS Traefik configuration stays separate, where it belongs.

This workflow works well because it keeps the host specific deployment files reproducible, while leaving the most sensitive secret under manual control.

This also makes later maintenance easier.
When you come back to the setup after a few months, the `.env` file still shows the intended deployment shape in one place, while the generated files show the concrete result on disk.
For a home lab or family mail setup, that separation reduces guesswork.

> **How the Container Builds `sogo.conf`**
>
> The image used in this repo, [`sonroyaalmerol/docker-sogo`](https://github.com/sonroyaalmerol/docker-sogo), adds one practical feature on top of the normal SOGo configuration model. It can read YAML configuration fragments from:
>
> ```text
> /etc/sogo/sogo.conf.d/
> ```
>
> and then generate the final SOGo config file, [`/etc/sogo/sogo.conf`](https://www.sogo.nu/files/docs/SOGoInstallationGuide.html#_sogo_configuration_summary).
>
> That is why the generator in this repo writes:
>
> * `config/00-database.yaml`
> * `config/10-mail.yaml`
> * `config/20-auth.yaml`
>
> and mounts that directory into the container instead of generating one large OpenStep style plist file directly.
>
> This is only a container convenience feature.
> It is not an upstream SOGo format change.
> The image merges the YAML fragments at container startup and converts them into the OpenStep style `sogo.conf` file that SOGo itself expects.
>
> If you prefer, the image still supports the traditional path:
>
> * provide your own `/etc/sogo/sogo.conf`
> * leave `/etc/sogo/sogo.conf.d/` empty
>
> So the repo's YAML split is a maintainability choice, not a hard requirement of SOGo itself.

The production oriented example used in this post looks like this:

```dotenv
SOGO_TARGET_DIR=/opt/sogo
SOGO_MAILU_NETWORK=mailu_default

SOGO_HTTP_BIND=10.0.1.2:8888:80

SOGO_TZ=Europe/Berlin
SOGO_MAIL_DOMAIN=mail.example.com
SOGO_LOGIN_EMAIL=user@mail.example.com
SOGO_LOGIN_CN=user

SOGO_IMAP_URL=imap://mail.example.com:143/?tls=YES
SOGO_SMTP_URL=smtp://mail.example.com:587/?tls=YES
SOGO_TRUSTED_CA_FILE=

SOGO_DB_IMAGE=mariadb:11.4
SOGO_MEMCACHED_IMAGE=memcached:1.6-alpine
SOGO_IMAGE=sonroyaalmerol/docker-sogo:5.12.6-1

SOGO_DB_NAME=sogo
SOGO_DB_USER=sogo
SOGO_DB_PASSWORD=CHANGE_ME_SOGO_DB_PASSWORD
SOGO_DB_ROOT_PASSWORD=CHANGE_ME_SOGO_DB_ROOT_PASSWORD
```

Save this file as `/opt/sogo/sogo-via-vps.env`.

> This example is intentionally narrow in scope.
> It does not try to model every possible SOGo option.
> It only covers the values needed to generate a working [sidecar](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers) SOGo deployment beside an existing Mailu installation.
> That makes the file easier to read, easier to review later, and easier to adapt when you move from testing to production.

### What Each Variable Group Means

`SOGO_TARGET_DIR` defines where the generated stack will live on the SOGo host. In this guide, that is `/opt/sogo`.

`SOGO_MAILU_NETWORK` names the external Docker network that allows the SOGo stack to reach the Mailu services. This is the bridge between the two otherwise separate Compose stacks.

`SOGO_HTTP_BIND` defines the private bind address on the SOGo host. This is the local HTTP endpoint that the VPS Traefik instance will forward to.

`SOGO_TZ`, `SOGO_MAIL_DOMAIN`, `SOGO_LOGIN_EMAIL`, and `SOGO_LOGIN_CN` define the local timezone, the mail domain, and the first mailbox identity that will be enabled for SOGo.

`SOGO_IMAP_URL` and `SOGO_SMTP_URL` define the exact Mailu endpoints that SOGo should use for mail access and mail submission.

`SOGO_TRUSTED_CA_FILE` can stay empty in a normal production setup unless Mailu, or an internal proxy in front of it, presents a certificate from a private CA that the container does not already trust.

The `SOGO_DB_*` variables define the MariaDB image and the credentials used for the SOGo database.

### A Note on IMAP and SMTP Port Choices and `PORTS` in `mailu.env`

The key point for IMAP and SMTP port choices (`993`/`465` vs. `143`/`587`) is that the URLs are explicit and that they match the way the Mailu front service is actually reachable from the SOGo sidecar via the `SOGO_MAILU_NETWORK` external Docker network that allows the SOGo stack to reach the Mailu services.

In this production setup, the route that proved reliable was:

```text
imap://mail.example.com:143/?tls=YES
smtp://mail.example.com:587/?tls=YES
```

This means SOGo connects to Mailu through explicit STARTTLS on the standard submission and IMAP ports, instead of relying on the implicit TLS path on `465` and `993`.

### The One Required Mailu Change

This is the only step in this guide that modifies the existing Mailu setup.

Before configuring SOGo, edit `/opt/mailu/mailu.env` and ensure it contains:

```text
PORTS=25,80,443,465,993,995,4190,143,587
```

Then recreate the Mailu stack so the additional listeners are actually published:

```bash
cd /opt/mailu
docker compose down
docker compose up -d
```

This matters because SOGo can only use the STARTTLS path on `143` and `587` if Mailu actually exposes those listeners on `front`.

The reasoning is as follows:

* In this setup, `465` and `993` sit on the Mailu `PROXY_PROTOCOL` edge.
* Those ports are shaped for the reverse proxy path, not as the default hop for a sidecar such as SOGo.
* The production path that proved reliable was the explicit STARTTLS route on `143` and `587`.
* SOGo can only use that route if Mailu is publishing those listeners.

So the production rule is not only "set `SOGO_IMAP_URL` and `SOGO_SMTP_URL` explicitly". It is also this:

* Expose the Mailu listener pair that those URLs point to.
* Keep `PROXY_PROTOCOL=25,443,465,993,995,4190`.
* Add `143` and `587` to `PORTS` so the STARTTLS path exists at all.

> From an operational point of view, this is a useful split.
> The public reverse proxy path can keep using the listeners that are already designed for that edge role, while the local SOGo sidecar uses a direct and explicit mail path that is easier to reason about.
> When you debug authentication or connectivity problems later, this separation will also make it much easier to see whether the problem is in Traefik, in Mailu front, or in the SOGo configuration.

## Generate the SOGo Tree

Next, run the generator inside `/opt/sogo`:

```bash
SOGO_ENV_FILE=./sogo-via-vps.env python3 generate_sogo_setup.py
```

> You can find the complete [`generate_sogo_setup.py`](#generate_sogo_setup.py) in the appendix.

This command generates the SOGo host files under `SOGO_TARGET_DIR`. In this example, that is usually:

```text
/opt/sogo
  docker-compose.yml
  config/
    00-database.yaml
    10-mail.yaml
    20-auth.yaml
  database/init/
    01-sogo.sql
  README.txt
```

The generator creates the local SOGo stack structure, but leaves the VPS side reverse proxy configuration separate.

More specifically, it does the following:

* creates a MariaDB service
* creates a memcached service
* creates the SOGo service
* connects SOGo to `SOGO_MAILU_NETWORK` (e.g. `mailu_default`)
* writes the SQL definition for the authentication table
* writes the SOGo database, mail, and authentication config files
* prints the command for inserting or updating the SOGo login row

What it intentionally does not do:

* it does not generate the VPS side Traefik file
* it does not store the mailbox password in a generated file

### Start the Stack

Once the files exist, start the stack:

```bash
cd /opt/sogo
docker compose up -d
docker compose logs -f
```

You should see three services come up:

* `db`
* `memcached`
* `sogo`

At this stage, MariaDB can initialize the SOGo database and create the `sogo_users` table from `database/init/01-sogo.sql`.

> The initialization scripts in `database/init/` usually run only when the MariaDB data directory is still empty.
> That means they are part of first start behavior.
> If you later delete and recreate only the container, but keep the existing database volume, those init scripts will not run again.

### Insert the First SOGo Login Row

The generator prints an interactive SQL command for creating or updating the first SOGo login row. A typical example looks like this:

```bash
cd /opt/sogo
read -rsp "Mailu mailbox password for user@mail.example.com: " MAILPW; echo
MAILPW_SQL=${MAILPW//\'/\'\'}
docker compose exec -T db mariadb -usogo -p... sogo <<SQL
INSERT INTO sogo_users (c_uid, c_name, c_password, c_cn, mail)
VALUES ('user@mail.example.com', 'user@mail.example.com', '$MAILPW_SQL', 'user', 'user@mail.example.com')
ON DUPLICATE KEY UPDATE
  c_name = VALUES(c_name),
  c_password = VALUES(c_password),
  c_cn = VALUES(c_cn),
  mail = VALUES(mail);
SQL
```

The mailbox password is entered interactively and sent directly into the SQL update.
It is not stored in the generated env file or in the generated config tree.

> The `ON DUPLICATE KEY UPDATE` part is useful because it makes the command repeatable.
> You can run it again later if you need to correct the display name, update the mail address, or change the password after a reset.

## Authentication Model: What SOGo Validates and What Mailu Validates

This is the part that often causes confusion the first time you set it up.

In this design, SOGo has its own SQL based authentication store, while the actual mailbox stays in Mailu.
That means there are two separate authentication steps during one user session.

First, SOGo checks whether the user is allowed to log in to SOGo itself.
Second, after that login succeeds, SOGo connects to Mailu IMAP and SMTP on behalf of that user for the live session.
These two steps are related, but they are not identical, and it helps to keep them separate in your head.

In short:

1. SOGo validates the user at SOGo login time.
2. SOGo then uses that user's mailbox credentials to talk to Mailu over IMAP and SMTP.

### The Current Generator Design

At the moment, the generator emits:

```yaml id="jpkelc"
userPasswordAlgorithm: plain
```

and stores the SOGo side password in the `c_password` column in plaintext.

> **This is worth repeating**: in the current generator design, the SOGo authentication password is stored in plaintext.

That choice keeps the initial setup easy to understand, but it is also the weakest part of the current authentication model.
For a small home setup, some people may accept that tradeoff for the first implementation.
Still, it should be treated as a conscious compromise, not as an ideal end state.

> Plaintext here means exactly what it sounds like.
> If someone gains database access and can read the `sogo_users` table, they can read the SOGo side password directly.
> That is very different from a one way password hash, where the original password is not stored in readable form.

### Is Plaintext Strictly Required?

No, plaintext is not strictly required.

SOGo can also validate against a one way hash stored in `c_password`.
The important point is not that SOGo must recover the password from the database.
The important point is that after login, SOGo can use the password the user just typed to open the IMAP and SMTP session against Mailu.

So the real rule is not "SOGo must be able to recover the password". The real rule is this:

* the password that SOGo accepts at login time must also be the password that Mailu accepts for the mailbox

For a small family setup, the simplest policy is usually:

* keep the same password in Mailu and in SOGo
* start with the simple model if you want the easiest path
* move SOGo authentication storage from `plain` to a supported hash later if you want a stronger design

> SOGo does not need to extract the password from the database after login if it can simply use the password that the user entered in that session.
> That is why hashed validation can still work, as long as SOGo and Mailu agree on the same mailbox password at login time.
>
> If later desired, the SOGo SQL auth store can be moved from `plain` to a hash such as `sha512-crypt` or `argon2id`.
> That changes how SOGo validates the password, but it does not change the basic Mailu integration model.
>
> Note: `argon2id` support depends on the SOGo build; upstream documents it as available when SOGo is compiled with libsodium.


### What `SOGO_DB_PASSWORD` and `SOGO_DB_ROOT_PASSWORD` Are For

These values are only MariaDB credentials. They are not user login passwords for the SOGo web interface.

`SOGO_DB_PASSWORD` is the normal runtime database password that SOGo uses for its MariaDB access, including:

* database connection URLs such as `SOGoProfileURL`
* the SQL authentication source
* database health checks

`SOGO_DB_ROOT_PASSWORD` is only the MariaDB root password inside the database container.

Neither value is a SOGo web admin password, and neither value is the Mailu mailbox password.

> That distinction matters because these secrets belong to different layers of the system.
> One secret is for the SOGo application talking to its database.
> The other secret is for a user mailbox login that SOGo later passes through to Mailu services.

### Does SOGo Have a Mailu Style Admin UI?

Not in the same sense as Mailu.
SOGo does have administrative and configuration features, but it does not act as a Mailu style central administration console.

In practice, administration happens through a few explicit places:

* generated config files
* the `sogo_users` SQL authentication table
* Docker Compose YAML file

That is one reason why the generator driven approach works well here.
The operational surface is visible and concrete.
You can see where configuration lives, where authentication data lives, and which part belongs to Mailu versus SOGo.

> Mailu remains the lead mail system. SOGo is added beside it as the groupware layer. SOGo focuses on webmail, calendars, contacts, and DAV access.

## Add the VPS Traefik Route

The generator does not create the VPS-side Traefik file, because that belongs to the reverse-proxy host, not the SOGo host.

In this setup, the VPS Traefik instance terminates HTTPS for `sogo.example.com` and then forwards the request to the private HTTP bind on the home server:

```text
https://sogo.example.com
        |
        v
    VPS Traefik
        |
        v
http://10.0.1.2:8888
```

This gives SOGo its own public hostname without exposing the SOGo container directly on the internet.
From the outside, the VPS is the only public web endpoint.
Inside your setup, Traefik forwards the request to the private address that you defined earlier with `SOGO_HTTP_BIND`.

> This only works if the VPS can actually reach `10.0.1.2:8888`.
> In practice, that usually means you already have a [site to site VPN](../digital-civil-rights-mailu/#private-link%3A-wireguard-(networking-and-network-topology-overview)), a routed private subnet, or another secure path from the VPS to your home network.
> If that path does not exist, every request will fail at the network level.


On the VPS, add a file provider dynamic configuration such as `dynamic-sogo.yml`:

```yaml
http:
  routers:
    sogo-websecure:
      entryPoints: [web-secure]
      rule: "Host(`sogo.example.com`)"
      service: sogo-web
      tls:
        certResolver: default

  services:
    sogo-web:
      loadBalancer:
        servers:
          - url: "http://10.0.1.2:8888"
```

What each part does:

- `sogo-websecure` is the HTTPS router for the SOGo hostname
- `entryPoints: [web-secure]` attaches it to the TLS web entrypoint on the VPS
- Host(`sogo.example.com`) ensures only the SOGo hostname matches this route
- `tls.certResolver: default` tells Traefik to obtain or use the certificate for that hostname through the configured resolver
- `sogo-web` is a simple HTTP load balancer with one backend server: `http://10.0.1.2:8888`

After creating the file, reload or restart Traefik on the VPS so the new dynamic configuration is picked up.
You also need a DNS record for `sogo.example.com` that points to the VPS, unless you already use a wildcard DNS rule such as `*.example.com`.

At that point, the request path is complete.
DNS sends the browser to the VPS.
Traefik handles HTTPS for the SOGo hostname.
Traefik then forwards the request to the SOGo HTTP bind on the home server.

## First Login And Functional Checks

Now open:

```text
https://sogo.example.com/SOGo/
```

and log in as:

```text
user@mail.example.com
```

Use the normal mailbox password.

For the first production validation pass, check:

1. Mail view loads and shows the mailbox.
2. Calendar view loads.
3. Contacts view loads.
4. Sending one mail from the SOGo web UI works.
5. Creating one calendar event works.
6. Creating one contact works.

At that point you have proven the main value of this first step:

- Mailu mailbox
- SOGo web UI
- CalDAV
- CardDAV
- one shared user identity across the whole flow

## Start with the SOGo Web UI

I suggest that you begin with the SOGo Web UI and use it as your main interface for the first phase.
This gives you a clean baseline.
You can first confirm that mail, calendars, contacts, and meeting handling work correctly in SOGo itself before you add more clients on top.

Only after that would I move on to other clients such as:

* Outlook with [Outlook CalDav Synchronizer](https://www.sogo.nu/files/docs/SOGoOutlookConnectorConfigurationGuide.html)
* [KDE Kontact](https://kontact.kde.org/)
* [GNOME Evolution](https://gitlab.gnome.org/GNOME/evolution/-/wikis/home)
* Mozilla [Thunderbird](https://www.thunderbird.net/en-US/) or [SeaMonkey](https://www.seamonkey-project.org/)

The SOGo Web UI feels close to the way many people already use web based mail and calendar tools such as Gmail and Google Calendar in a browser.
You get one place for mail, calendars, contacts, and the basic daily workflow.
For a first rollout, that usually makes testing easier.

This approach also reduces complexity at the start.
Desktop clients often have their own sync settings, folder mappings, identity rules, and calendar quirks.
If you begin with the Web UI, it is much easier to see whether a problem comes from the server side or from a specific client configuration.

This is especially useful for calendar and contact testing.
If an event, contact, or meeting response behaves correctly in the SOGo Web UI first, the server side is usually in good shape.
After that, if the same item fails in Outlook, Kontact, Evolution, Thunderbird, or SeaMonkey, you can focus on the client side instead of debugging the whole stack at once.

> Thunderbird is presented by its official site as a combined email, calendar, and contacts application, and current SeaMonkey release notes still list [Lightning](https://wiki.mozilla.org/Calendar%3ALightning) among the included extensions.

Look in the appendix for short notes about some of these client options and how to connect them to your SOGo setup.

## Conclusion

This is the first practical step that follows from the Groupware concepts post:
keep the mail system stable, keep the integration boundaries explicit, and add groupware beside the existing server instead of trying to replace everything at once.

With Mailu staying authoritative and SOGo layered beside it, you get a very useful result quickly:

- browser access
- calendar
- contacts
- DAV sync
- desktop client support

That is already enough to move from "mail server" to "groupware" for a selected user, while keeping the later grommunio split-delivery step cleanly separate.

## Appendix

### `generate_sogo_setup.py`

```py
#!/usr/bin/env python3
# SOGO_ENV_FILE=/opt/sogo/sogo-via-vps.env python3 ./generate_sogo_setup.py
"""
Generate a minimal SOGo-on-Docker-Compose setup beside Mailu.

Features:
- Reads configuration from environment variables and optionally a .env file.
- Generates random DB passwords if not provided.
- Does NOT store the mailbox login password in any generated file.
- Creates only the files needed on the SOGo host.
- Prints the exact commands to start the stack and to create/update the SOGo test user.

Usage:
  python3 generate_sogo_setup.py
  SOGO_TARGET_DIR=/opt/sogo python3 generate_sogo_setup.py
  SOGO_ENV_FILE=/root/sogo-generator.env python3 generate_sogo_setup.py

Environment variables (or .env entries):
  SOGO_TARGET_DIR=/opt/sogo
  SOGO_MAILU_NETWORK=mailu_default
  SOGO_HTTP_BIND=10.0.1.2:8888:80
  SOGO_BIND_IP=10.0.1.2
  SOGO_BIND_PORT=8888
  SOGO_EDGE_NETWORK=edge
  SOGO_EDGE_ALIAS=sogo-web
  SOGO_TZ=Europe/Zurich
  SOGO_MAIL_DOMAIN=mail.example.com
  SOGO_LOGIN_EMAIL=user@mail.example.com
  SOGO_LOGIN_CN=user
  SOGO_IMAP_URL=imap://mail.example.com:143/?tls=YES
  SOGO_IMAP_HOST=front
  SOGO_IMAP_PORT=143
  SOGO_IMAP_TLS=YES
  SOGO_SMTP_URL=smtp://mail.example.com:587/?tls=YES
  SOGO_SMTP_HOST=front
  SOGO_SMTP_PORT=587
  SOGO_SMTP_TLS=YES
  SOGO_TRUSTED_CA_FILE=./certs/internal-root-ca.crt
  SOGO_DB_IMAGE=mariadb:11.4
  SOGO_MEMCACHED_IMAGE=memcached:1.6-alpine
  SOGO_IMAGE=sonroyaalmerol/docker-sogo:5.12.6-1
  SOGO_DB_NAME=sogo
  SOGO_DB_USER=sogo
  SOGO_DB_PASSWORD=...
  SOGO_DB_ROOT_PASSWORD=...

The generated layout intentionally mirrors the reference tree in `sogo-setup/`
for the files that belong on the SOGo host:

- docker-compose.yml
- config/00-database.yaml
- config/10-mail.yaml
- config/20-auth.yaml
- database/init/01-sogo.sql
- README.txt

The Traefik dynamic config is intentionally not generated because it belongs on
the reverse-proxy/VPS host, not on the SOGo host.
"""

from __future__ import annotations

import os
import secrets
import shlex
import textwrap
from pathlib import Path


def parse_dotenv(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values

    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        values[key] = value

    return values


def getenv(name: str, default: str, file_values: dict[str, str]) -> str:
    return os.environ.get(name, file_values.get(name, default))


def random_password(length_bytes: int = 24) -> str:
    return secrets.token_urlsafe(length_bytes)


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def write_file(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def sql_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def dedent(text: str) -> str:
    return textwrap.dedent(text).lstrip()


def main() -> int:
    env_file = Path(os.environ.get("SOGO_ENV_FILE", ".env"))
    file_values = parse_dotenv(env_file)

    target_dir = Path(getenv("SOGO_TARGET_DIR", "/opt/sogo", file_values)).expanduser()
    mailu_network = getenv("SOGO_MAILU_NETWORK", "mailu_default", file_values)
    http_bind = getenv("SOGO_HTTP_BIND", "", file_values)
    bind_ip = getenv("SOGO_BIND_IP", "", file_values)
    bind_port = getenv("SOGO_BIND_PORT", "", file_values)
    edge_network = getenv("SOGO_EDGE_NETWORK", "", file_values)
    edge_alias = getenv("SOGO_EDGE_ALIAS", "", file_values)
    tz = getenv("SOGO_TZ", "Europe/Zurich", file_values)
    mail_domain = getenv("SOGO_MAIL_DOMAIN", "mail.example.com", file_values)
    login_email = getenv("SOGO_LOGIN_EMAIL", "user@mail.example.com", file_values)
    login_cn = getenv("SOGO_LOGIN_CN", "user", file_values)

    imap_url = getenv("SOGO_IMAP_URL", "", file_values)
    imap_host = getenv("SOGO_IMAP_HOST", "front", file_values)
    imap_port = getenv("SOGO_IMAP_PORT", "143", file_values)
    imap_tls = getenv("SOGO_IMAP_TLS", "YES", file_values)

    smtp_url = getenv("SOGO_SMTP_URL", "", file_values)
    smtp_host = getenv("SOGO_SMTP_HOST", "front", file_values)
    smtp_port = getenv("SOGO_SMTP_PORT", "587", file_values)
    smtp_tls = getenv("SOGO_SMTP_TLS", "YES", file_values)
    trusted_ca_file = getenv("SOGO_TRUSTED_CA_FILE", "", file_values)

    db_image = getenv("SOGO_DB_IMAGE", "mariadb:11.4", file_values)
    memcached_image = getenv("SOGO_MEMCACHED_IMAGE", "memcached:1.6-alpine", file_values)
    sogo_image = getenv("SOGO_IMAGE", "sonroyaalmerol/docker-sogo:5.12.6-1", file_values)

    db_name = getenv("SOGO_DB_NAME", "sogo", file_values)
    db_user = getenv("SOGO_DB_USER", "sogo", file_values)
    db_password = getenv("SOGO_DB_PASSWORD", "", file_values) or random_password()
    db_root_password = getenv("SOGO_DB_ROOT_PASSWORD", "", file_values) or random_password()

    if not http_bind and bind_port:
        if bind_ip:
            http_bind = f"{bind_ip}:{bind_port}:80"
        else:
            http_bind = f"{bind_port}:80"

    if edge_alias and not edge_network:
        raise SystemExit("SOGO_EDGE_ALIAS requires SOGO_EDGE_NETWORK to be set")

    if edge_network and edge_network == mailu_network:
        raise SystemExit("SOGO_EDGE_NETWORK must differ from SOGO_MAILU_NETWORK")

    if not imap_url:
        imap_url = f"imap://{imap_host}:{imap_port}/?tls={imap_tls}"

    if not smtp_url:
        smtp_url = f"smtp://{smtp_host}:{smtp_port}/?tls={smtp_tls}"

    config_dir = target_dir / "config"
    db_init_dir = target_dir / "database" / "init"
    bootstrap_dir = target_dir / "bootstrap"
    sogo_data_dir = target_dir / "data" / "sogo"
    db_data_dir = sogo_data_dir / "db"
    state_dir = sogo_data_dir / "state"
    spool_dir = sogo_data_dir / "spool"

    for path in [config_dir, db_init_dir, db_data_dir, state_dir, spool_dir]:
        ensure_dir(path)
    if trusted_ca_file:
        ensure_dir(bootstrap_dir)

    sogo_networks = [
        "      default:",
        f"      {mailu_network}:",
    ]
    network_defs = [
        "  default:",
        "    driver: bridge",
        f"  {mailu_network}:",
        "    external: true",
    ]

    if edge_network:
        if edge_alias:
            sogo_networks.extend(
                [
                    f"      {edge_network}:",
                    "        aliases:",
                    f"          - {edge_alias}",
                ]
            )
        else:
            sogo_networks.append(f"      {edge_network}:")
        network_defs.extend(
            [
                f"  {edge_network}:",
                "    external: true",
            ]
        )

    compose_lines = [
        "services:",
        "  db:",
        f"    image: {db_image}",
        "    container_name: sogo-db",
        "    restart: unless-stopped",
        "    environment:",
        f"      MARIADB_DATABASE: {db_name}",
        f"      MARIADB_USER: {db_user}",
        f"      MARIADB_PASSWORD: {db_password}",
        f"      MARIADB_ROOT_PASSWORD: {db_root_password}",
        f"      TZ: {tz}",
        "    command:",
        "      - --character-set-server=utf8mb4",
        "      - --collation-server=utf8mb4_unicode_ci",
        "    volumes:",
        "      - ./data/sogo/db:/var/lib/mysql",
        "      - ./database/init:/docker-entrypoint-initdb.d:ro",
        "    healthcheck:",
        f'      test: ["CMD-SHELL", "mariadb-admin ping -h 127.0.0.1 -u{db_user} -p$$MARIADB_PASSWORD --silent"]',
        "      interval: 10s",
        "      timeout: 5s",
        "      retries: 20",
        "",
        "  memcached:",
        f"    image: {memcached_image}",
        "    container_name: sogo-memcached",
        "    restart: unless-stopped",
        "    command: memcached -m 128",
        "",
        "  sogo:",
        f"    image: {sogo_image}",
        "    container_name: sogo",
        "    restart: unless-stopped",
        "    depends_on:",
        "      db:",
        "        condition: service_healthy",
        "      memcached:",
        "        condition: service_started",
        "    environment:",
        f"      TZ: {tz}",
        "    volumes:",
        "      - ./config:/etc/sogo/sogo.conf.d:ro",
        "      - ./data/sogo/state:/var/lib/sogo",
        "      - ./data/sogo/spool:/var/spool/sogo",
    ]

    if trusted_ca_file:
        compose_lines.extend(
            [
                f"      - {trusted_ca_file}:/usr/local/share/ca-certificates/sogo-custom-ca.crt:ro",
                "      - ./bootstrap/sogo-entrypoint-wrapper.sh:/usr/local/bin/sogo-entrypoint-wrapper.sh:ro",
            ]
        )

    if http_bind:
        compose_lines.extend(
            [
                "    ports:",
                f'      - "{http_bind}"',
            ]
        )

    if trusted_ca_file:
        compose_lines.extend(
            [
                "    entrypoint:",
                "      - /bin/bash",
                "      - /usr/local/bin/sogo-entrypoint-wrapper.sh",
            ]
        )

    compose_lines.append("    networks:")
    compose_lines.extend(sogo_networks)
    compose_lines.append("")
    compose_lines.append("networks:")
    compose_lines.extend(network_defs)
    compose_lines.append("")

    docker_compose = "\n".join(compose_lines)

    cfg_db = dedent(
        f"""
        SOGoProfileURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_user_profile"
        OCSFolderInfoURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_folder_info"
        OCSSessionsFolderURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_sessions_folder"
        OCSStoreURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_store"
        OCSAclURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_acl"
        OCSCacheFolderURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_cache_folder"
        OCSEMailAlarmsFolderURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_alarms_folder"

        MySQL4Encoding: "utf8mb4"
        SOGoMemcachedHost: "memcached"
        """
    )

    cfg_mail = dedent(
        f"""
        SOGoPageTitle: "SOGo"
        SOGoLanguage: "German"
        SOGoTimeZone: "{tz}"

        SOGoMailDomain: "{mail_domain}"
        SOGoMailingMechanism: "smtp"
        SOGoSMTPServer: "{smtp_url}"
        SOGoSMTPAuthenticationType: "PLAIN"
        SOGoAppointmentSendEMailNotifications: true

        SOGoIMAPServer: "{imap_url}"

        SOGoDraftsFolderName: "Drafts"
        SOGoSentFolderName: "Sent"
        SOGoTrashFolderName: "Trash"
        SOGoJunkFolderName: "Junk"

        NGImap4AuthMechanism: "plain"
        NGImap4ConnectionStringSeparator: "/"

        SOGoForceExternalLoginWithEmail: true

        SOGoPasswordChangeEnabled: false
        SOGoVacationEnabled: false
        SOGoForwardEnabled: false
        SOGoSieveScriptsEnabled: false

        SOGoMailAuxiliaryUserAccountsEnabled: false
        SOGoEnablePublicAccess: false
        SOGoEnableEMailAlarms: false
        """
    )

    cfg_auth = dedent(
        f"""
        SOGoUserSources:
          - type: sql
            id: directory
            viewURL: "mysql://{db_user}:{db_password}@db:3306/{db_name}/sogo_users"
            canAuthenticate: true
            isAddressBook: true
            displayName: "SOGo Directory"
            userPasswordAlgorithm: plain
        """
    )

    db_sql = dedent(
        f"""
        CREATE DATABASE IF NOT EXISTS {db_name} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        USE {db_name};

        CREATE TABLE IF NOT EXISTS sogo_users (
          c_uid VARCHAR(255) NOT NULL,
          c_name VARCHAR(255) NOT NULL,
          c_password VARCHAR(255) NOT NULL,
          c_cn VARCHAR(255) NOT NULL,
          mail VARCHAR(255) NOT NULL,
          PRIMARY KEY (c_uid),
          UNIQUE KEY uq_mail (mail)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    )

    readme = dedent(
        f"""
        This bundle contains a minimal SOGo-on-Docker-Compose setup intended to sit beside Mailu.

        Files:
        - docker-compose.yml
        - config/00-database.yaml
        - config/10-mail.yaml
        - config/20-auth.yaml
        - database/init/01-sogo.sql
        {"- bootstrap/sogo-entrypoint-wrapper.sh" if trusted_ca_file else ""}

        Before first start:
        1. Ensure Mailu network name is actually {mailu_network!r}.
        2. If you set `SOGO_EDGE_NETWORK`, ensure that external Docker network exists before starting the stack.
        3. If you set `SOGO_HTTP_BIND` or `SOGO_BIND_IP` plus `SOGO_BIND_PORT`, ensure that bind is correct for the SOGo host.
        4. If you set `SOGO_TRUSTED_CA_FILE`, ensure that file exists relative to this directory before starting the stack.
        5. Start the stack with `docker compose up -d`.
        6. Insert the SOGo login row manually with the command printed by this generator.

        This setup intentionally does NOT enable Sieve in SOGo initially.
        The reverse-proxy / Traefik config is not generated here because it belongs on the VPS host.
        """
    )

    files = {
        target_dir / "docker-compose.yml": docker_compose,
        config_dir / "00-database.yaml": cfg_db,
        config_dir / "10-mail.yaml": cfg_mail,
        config_dir / "20-auth.yaml": cfg_auth,
        db_init_dir / "01-sogo.sql": db_sql,
        target_dir / "README.txt": readme,
    }

    if trusted_ca_file:
        files[bootstrap_dir / "sogo-entrypoint-wrapper.sh"] = dedent(
            """
            #!/bin/bash
            set -euo pipefail

            update-ca-certificates >/dev/null
            exec /opt/entrypoint.sh
            """
        )

    for path, content in files.items():
        write_file(path, content)
    if trusted_ca_file:
        (bootstrap_dir / "sogo-entrypoint-wrapper.sh").chmod(0o755)

    shell_target_dir = shlex.quote(str(target_dir))
    login_email_q = sql_quote(login_email)
    login_cn_q = sql_quote(login_cn)

    print(f"Created {target_dir}")
    for path in files:
        print(f"Created {path}")

    print()
    print("Generated values:")
    print(f"  DB image:          {db_image}")
    print(f"  Memcached image:   {memcached_image}")
    print(f"  SOGo image:        {sogo_image}")
    print(f"  Mailu network:     {mailu_network}")
    print(f"  HTTP bind:         {http_bind or '(not published)'}")
    print(f"  Edge network:      {edge_network or '(not attached)'}")
    print(f"  Edge alias:        {edge_alias or '(none)'}")
    print(f"  Time zone:         {tz}")
    print(f"  Mail domain:       {mail_domain}")
    print(f"  Login email:       {login_email}")
    print(f"  Login CN:          {login_cn}")
    print(f"  IMAP URL:          {imap_url}")
    print(f"  SMTP URL:          {smtp_url}")
    print(f"  Trusted CA file:   {trusted_ca_file or '(system trust only)'}")
    print(f"  DB name:           {db_name}")
    print(f"  DB user:           {db_user}")
    print(f"  DB password:       {db_password}")
    print(f"  DB root password:  {db_root_password}")
    print()
    print("Start the stack:")
    print(f"  cd {shell_target_dir}")
    print("  docker compose up -d")
    print()
    print("Create or update the SOGo login row without storing the mailbox password in a file:")
    print(f"  cd {shell_target_dir}")
    print(f"  read -rsp \"Mailu mailbox password for {login_email}: \" MAILPW; echo")
    print("  MAILPW_SQL=${MAILPW//\\'/\\'\\'}")
    print(f"  docker compose exec -T db mariadb -u{db_user} -p{db_password} {db_name} <<SQL")
    print("  INSERT INTO sogo_users (c_uid, c_name, c_password, c_cn, mail)")
    print(f"  VALUES ({login_email_q}, {login_email_q}, '$MAILPW_SQL', {login_cn_q}, {login_email_q})")
    print("  ON DUPLICATE KEY UPDATE")
    print("    c_name = VALUES(c_name),")
    print("    c_password = VALUES(c_password),")
    print("    c_cn = VALUES(c_cn),")
    print("    mail = VALUES(mail);")
    print("  SQL")
    print()
    print("Update only the password later:")
    print(f"  cd {shell_target_dir}")
    print(f"  read -rsp \"New Mailu mailbox password for {login_email}: \" MAILPW; echo")
    print("  MAILPW_SQL=${MAILPW//\\'/\\'\\'}")
    print(f"  docker compose exec -T db mariadb -u{db_user} -p{db_password} {db_name} <<SQL")
    print("  UPDATE sogo_users")
    print("  SET c_password = '$MAILPW_SQL'")
    print(f"  WHERE c_uid = {login_email_q};")
    print("  SQL")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### Outlook With Outlook CalDav Synchronizer

If you want to keep using Microsoft Outlook for calendars and contacts, [Outlook CalDav Synchronizer](https://github.com/aluxnimm/outlookcaldavsynchronizer) is usually the most practical way to connect Outlook to SOGo.
SOGo documents this setup directly and provides an official guide with screenshots.

The official guide for this setup is:

* [Microsoft Outlook CalDAVSynchronizer Configuration Guide](https://www.sogo.nu/files/docs/SOGoOutlookConnectorConfigurationGuide.html)

It is worth reading even if you already understand the general idea.
The guide shows the profile screens step by step, and that matters because Outlook, DAV collections, and sync profiles all have to line up correctly on the first pass.
A small mistake in direction or folder mapping can create duplicates or overwrite the wrong data.

#### Why Use a Separate Outlook Profile

If you already have a working Outlook setup for another backend, create a separate Outlook profile for SOGo first.
Do not try to retrofit the SOGo setup into your existing Outlook profile on day one.

A separate profile gives you a clear safety boundary.
Your current Outlook setup stays untouched, your SOGo test setup can be adjusted on its own, and rollback is simple because you can close Outlook and go back to the previous profile.

One detail that is easy to miss is how to switch profiles reliably.
Current Microsoft support pages document in [Turn Outlook profile prompt on or off](https://support.microsoft.com/en-us/office/turn-outlook-profile-prompt-on-or-off-b6f08321-51ec-4c1d-8c25-3e26ea475d25) two practical options: you can hold `Shift` while starting Outlook to open the profile picker, or you can enable "Prompt for a profile to be used" so Outlook asks every time it starts.

At the same time, keep the classic Outlook limitation in mind:

* one running Outlook session uses one profile
* you cannot run two independent Outlook sessions at the same time with two different profiles
* if you want to switch profiles, shut down Outlook fully and then start it again with the other profile

That sounds slightly inconvenient, but for migration work it is actually a good thing: it reduces the risk of accidentally "fixing" the wrong profile and damaging an existing Outlook setup while you are still testing SOGo.

#### Basic SOGo Profile Layout

The usual layout is to connect mail in Outlook to the Mailu backend you already use for mail, and use Outlook CalDav Synchronizer for the SOGo calendar and CardDAV address books.

For SOGo, the DAV URLs are typically:

* Calendar:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Calendar/personal/`
* Contacts:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Contacts/personal/`

I will not try to reproduce every configuration screen here.
The SOGo guide already does that well.
In this post, it is more useful to explain the migration choices that can save you from avoidable mistakes.

#### Migrating Calendar And Contacts From an Existing Outlook Backend

If you want a migration that really includes **all contacts** and **all calendar data**, do not treat the first synchronization like a normal day to day sync.
Treat it like a controlled import.
The default SOGo profile in Outlook CalDav Synchronizer is meant for regular use, not for a full historical migration.
In the official guide, the default calendar profile syncs events from **60 days in the past to 365 days in the future**.
That is fine for everyday operation, but it is too narrow for a one time move from another system.

For the initial migration, disable the calendar *time range filter*.
Otherwise, old appointments, far future appointments, and long running recurring series can be left behind without being obvious at first glance.
The guide also warns that time range filtering can cause doubled or deleted events when recurring events are involved, unless the selected time range is larger than the longest recurrence interval.
That matters for birthdays, anniversaries, and other yearly series.

For the transfer itself, [use a local `.pst` file as the bridge](https://support.microsoft.com/en-us/office/export-emails-contacts-and-calendar-items-to-outlook-using-a-pst-file-14252b52-3075-4e9b-be4e-ff9ef1068f91).
Do *not* use Outlook's `Save Calendar` export as the main migration path.
Microsoft documents that `Save Calendar` works with a chosen date range or a manually specified date range, which makes it too easy to export only part of the calendar by accident.
A `.pst` export is the safer path when the goal is complete coverage.

When you create the `.pst` export, make sure "Include subfolders" is selected.
Microsoft states that this is what ensures that everything in the account is exported, including Calendar, Contacts, and Tasks.
Also check whether the old Outlook profile uses *Cached Exchange Mode*.
Microsoft notes that in Cached Exchange Mode, Outlook exports only the items that are present in the current local cache, and that the default cache may contain only the last 12 months.
If the source system is Exchange or Microsoft 365, change the cache scope first or turn Cached Exchange Mode off before exporting, otherwise older data may never reach the `.pst` file.

A safe migration sequence looks like this:

1. Create the separate Outlook profile for SOGo and connect it to the correct SOGo calendar and contact resources.
2. For the *calendar* sync profile, disable the *time range filter* for the first upload.
3. Export the old Outlook data to a `.pst` file with *Include subfolders* enabled.
4. Import that `.pst` file into the new Outlook profile.
5. Copy the imported calendar items and contacts into the Outlook folders that are linked to the SOGo sync profiles.
6. Run the first synchronization in a controlled way, then verify the result in the SOGo web interface before you switch to normal two way use.

For the first upload, it is safer not to begin with normal two way synchronization immediately.
Outlook CalDav Synchronizer supports one way and two way modes, including `Outlook -> Server (Replicate)` and `Outlook <-> Server (Two-Way)`.
If the SOGo target calendar or address book is still empty, I would use a controlled one way upload first, verify the result in SOGo, and only then switch the profile to normal two way synchronization.
That makes the first import easier to reason about and reduces conflict handling during the data seeding step.

Recurring events need extra care.
Outlook CalDav Synchronizer does support recurring events, including exceptions, but the initial migration is safest when you keep the normal timezone handling in place.
The SOGo guide explicitly says that creating events on the server in *UTC* is *not recommended for general use*, because recurrence exceptions across DST changes cannot be mapped correctly in that mode, and appointments with different start and end timezones cannot be represented properly.
If your existing Outlook data includes edited recurring series, moved single occurrences, or events that cross DST boundaries, this setting matters.

For contacts, a plain contact migration is usually straightforward, but there is one extra point if the old Outlook setup uses *distribution lists* or contact groups and you want to keep them.
Outlook CalDav Synchronizer can map Outlook distribution lists to server side contact groups, and for SOGo that means the *VLIST* format.
If you do not enable that mapping, you may successfully migrate the individual contacts while losing part of the group structure.
The [documentation](https://caldavsynchronizer.org/help/documentation/) also notes one SOGo specific limitation: members that are not present as regular address book entries are stored in custom attributes so they are not lost on the way back to Outlook, but they are not displayed directly in SOGo.

The real migration checkpoint is not the Outlook import wizard and not the fact that a sync run finished without an error.
The real checkpoint is the SOGo web interface.
Before you enable normal two way synchronization, verify the imported data there and not only in Outlook.
At minimum, check one event far in the past, one event far in the future, one yearly recurring event such as a birthday, one recurring series with an exception, one all day event, one meeting with attendees, the expected contacts in the `Personal Address Book`, and contact groups if you use them.
This is the simplest way to confirm that the migration really included full history, future appointments, and recurring data instead of only a recent working subset.

Only after those checks look correct would I switch the calendar and contact profiles to `Outlook <-> Server (Two-Way)`.
That final step turns the setup from a controlled import into normal daily synchronization.
The goal is to make sure that SOGo really contains the same usable calendar and contact data as the old system, including old appointments, far future appointments, and recurring series with their exceptions.

#### Pay Close Attention To Synchronization Direction

This is one of the easiest places to damage data if you move too quickly.

SOGo usually exposes at least two contact related sources:

* `Personal Address Book`
* `SOGo Directory`

Treat them as different targets with different purposes.
Do not assume that every contact source should be synchronized in the same mode.

In my test setup, the risky initial state was this:

* `SOGo Directory` configured as `Outlook <- Server (Replicate)`
* `Personal Address Book` configured as `Outlook <-> Server (Two Way)`

That combination led to an unwanted overwrite of the `Personal Address Book`.

The setup that behaved correctly for me was this:

* `SOGo Directory` as `Outlook <- Server (Merge)`
* `Personal Address Book` as `Outlook <-> Server (Two Way)`

Before the first real sync, inspect every profile carefully and confirm three things:

* which Outlook folder the profile writes to
* which SOGo DAV collection it talks to
* whether the sync mode is merge, replicate, one way, or two way

That check is worth doing slowly.
Outlook can overwrite or duplicate data very quickly once the first sync starts.
This is another reason to use a separate profile for SOGo until you trust the setup.

#### Practical Outlook Notes

The SOGo guide and the CalDav Synchronizer documentation are most useful when you move beyond the initial connection and start checking actual day to day behavior.
In particular, I would use them when you need to look into meeting and invite handling, duplicate event cleanup, category mapping, free busy lookups, reminders, local Outlook storage behavior, and SSL or TLS related logging.

Invitation handling deserves special attention.
In mixed environments, duplicate meeting traffic can appear when Outlook and the server both try to process the same meeting state.
The SOGo guide discusses this area directly, which is another reason to keep it as the main reference for Outlook specific setup.

#### Where To Read More

The official SOGo guide above should be your first stop.
For edge cases, the most useful follow up sources I found were:

* the [Outlook CalDav Synchronizer project site](https://caldavsynchronizer.org/)
* the [CalDav Synchronizer GitHub project](https://github.com/aluxnimm/outlookcaldavsynchronizer)
* the [SOGo Community Support](https://www.sogo.nu/support.html)

I would use those mainly for problem specific follow up searches such as duplicate appointments, reminder behavior, contact group mapping, sync direction mistakes, or certificate issues.

For the first setup, though, the official SOGo Outlook guide remains the best entry point because it is SOGo specific, ordered from start to finish, and full of screenshots.

### KDE Kontact Setup

In KDE terms, a KDE desktop groupware client usually means four pieces working together:

* [Kontact](https://kontact.kde.org/) as the shell
* [KMail](https://kontact.kde.org/components/kmail/) for mail
* [KOrganizer](https://kontact.kde.org/components/korganizer/) for calendar
* [KAddressBook](https://kontact.kde.org/components/kaddressbook/) for contacts

That split is worth stating clearly, because the experience is not completely "one integrated application" in the way some Outlook users might expect.
Kontact brings the pieces together in one window, but KMail, KOrganizer, and KAddressBook still feel like separate tools that share a common frame.
That is not a problem in itself, but it helps to set expectations early.
If you come from Outlook or from a pure web interface, Kontact can feel more modular and more explicit about which part handles which task.

#### Install Kontact From Ubuntu's `.deb` Packages

On Ubuntu, install it like this:

```bash
sudo apt update
sudo apt install kontact kdepim-addons kdepim-runtime
```

#### The Practical Layout In Kontact

The cleanest mental model is still the same as in the Outlook section:

* KMail talks to Mailu over IMAP and SMTP
* KOrganizer talks to SOGo over CalDAV
* KAddressBook talks to SOGo over CardDAV

So do not think of this as "one magical groupware account". It is one mailbox identity used across three protocol paths:

* IMAP
* SMTP
* CalDAV and CardDAV

That is also why I would configure the pieces one at a time and verify each one before trusting the whole desktop setup.

> In current KDE PIM, the entry point for calendars and contacts is often a single `DAV groupware resource`.
> In practice, one DAV account can discover both CalDAV and CardDAV collections, and you then choose which calendars and address books you want to use.

#### KMail Mail Setup

I've described the KMail mail setup in my earlier posts [here](../digital-civil-rights-mailu/#configure-mail-client-kmail) and [here](../digital-civil-rights-mailu/#tooling%3A-gnupg%2C-kleopatra-certificate-manager%2C-and-kmail).
Refer to those sections for the mail specific details.

#### KOrganizer CalDAV Setup

For calendar, the usual starting point in KOrganizer is `Add Calendar`, then `DAV groupware resource`.
From there, KDE can often discover the remote collections for you after you enter the server details and credentials.
In simple cases that is the easiest path.
If discovery does not behave the way you want, you can also work with the explicit personal SOGo calendar URL below.

For the personal calendar, the CalDAV URL is typically:

* protocol: `CalDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Calendar/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

Treat the first connection as a migration checkpoint, not as a routine account add.
First let KOrganizer load the server side calendar and verify that you are really looking at the expected SOGo calendar.
Open the SOGo web interface and confirm that both sides show the same remote data.
Only after that would I copy or move existing local KDE calendar items into the SOGo backed calendar.

#### KAddressBook CardDAV Setup

For contacts, the practical logic is the same.
Use the DAV groupware resource, let KDE discover the available address books if possible, and then make sure you are looking at the SOGo address book you actually want to use.

For the SOGo personal address book, the CardDAV URL is typically:

* protocol: `CardDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Contacts/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

Here too, the safe path is staged.
Connect the resource first.
Verify that the expected remote address book is visible.
Only then migrate or copy local contacts into that remote resource if needed.
After the first sync, verify the result again in the SOGo web interface and not only inside KAddressBook.

If your SOGo account exposes more than one address book or more than one calendar, give the resources explicit names inside KDE.
Names such as `"SOGo Personal Calendar"` and `"SOGo Personal Contacts"` make later troubleshooting much easier.

#### KDE Client Verification

Once mail, calendar, and contacts are configured, do three basic checks first:

1. send one mail to yourself from KMail
2. create one calendar event in KOrganizer and confirm that it appears in the SOGo web interface
3. create one contact in KAddressBook and confirm that it appears in the SOGo web interface

If you are migrating existing data, extend that check a little further. I would also verify:

* one recurring event
* one all day event
* one event far in the past
* one event far in the future
* one contact that you edited from the KDE side

That final verification is the real handover point.
Until those checks succeed, I would treat the KDE client as "connected, but not yet proven".
Once they do succeed, you can trust that KMail is using Mailu for mail transport and storage, while KOrganizer and KAddressBook are actually talking to SOGo over open DAV protocols instead of only looking correct inside the local desktop view.

The KDE PIM DAV workflow also supports a [manual refresh interval](https://docs.nextcloud.com/server/19/user_manual/pim/sync_kde.html), and the commonly documented default is five minutes. For migration and testing, I prefer to refresh manually after each important step so that cause and effect stay easy to see.

### GNOME Evolution Setup

[GNOME Evolution](https://help.gnome.org/evolution/) feels more integrated than KDE Kontact.
Mail, calendar, tasks, and contacts live inside one application, and the interface usually feels more consistent from one part to the next.

> Current Evolution documentation describes a [`Collection account`](https://help.gnome.org/evolution/intro-account-types.html) that can bind several data sources together for one username, including email, contacts, calendars, task lists, and memo lists.
> It can also discover CalDAV and CardDAV sources from the server.
> In this specific Mailu plus SOGo setup, however, I would still configure mail separately from the DAV resources, because mail lives on `mail.example.com` while calendars and contacts live on `sogo.example.com`.
> That keeps the client layout aligned with the server layout of this article.

That is not a bad thing.
It makes the wiring visible, which helps when you debug a problem.
If mail works but contacts do not, you can usually narrow the issue down to one specific layer such as IMAP, SMTP, CalDAV, CardDAV, credentials, or TLS, instead of treating the whole client as one black box.

#### The Practical Evolution Layout

For this setup, the clearest mental model is still to think in three parts:

* mail goes to Mailu over IMAP and SMTP
* calendar goes to SOGo over CalDAV
* contacts go to SOGo over CardDAV

That mirrors the server side design of this article. Mailu stays the system of record for mail, while SOGo provides the web interface and the DAV endpoints for calendars and contacts.

> Evolution's own documentation for account types helps explain why this model works well.
> Evolution can manage email, contacts, calendars, tasks, and collection accounts, but those are still distinct data sources under the hood.
> Even when the interface looks unified, the transport paths remain separate.

#### Install Evolution From Ubuntu's `universe` Packages

Use the native Ubuntu `.deb` packages from `universe`.
For a normal Ubuntu 24.04 install, the predictable command set is:

```bash
sudo apt update
sudo apt install evolution evolution-plugins
```

`evolution` is the actual desktop client.
Packages like `evolution-common`, `evolution-data-server`, `evolution-data-server-common`, and `libevolution` are support packages in the dependency chain, not normally the packages you choose by hand.

The `evolution` package also marks `evolution-plugins`, `evolution-plugin-pstimport`, and one spam plugin as recommendations, while `evolution-ews` is only a suggestion.
Because `apt-get` can be configured to skip recommended packages, installing `evolution-plugins` explicitly avoids ambiguity.

Recommended add-ons depend on how you use the client:

* `evolution-plugins`: yes. This is the standard plugin bundle and the one extra package I would install on almost every system.
* `evolution-ews`: yes, but only if you use Microsoft Exchange or Microsoft 365 via EWS.
* `evolution-plugin-pstimport`: yes, but only if you need to import Outlook `.pst` files.
* `evolution-plugin-spamassassin` or `evolution-plugin-bogofilter`: install one of them only if you already use that spam engine.
* `libreoffice-evolution`: optional. It adds LibreOffice address-book support; it is not needed for mail, calendar, contacts, or tasks inside Evolution itself.

I would not install `evolution-plugins-experimental` on a daily-use mail client, because the package is explicitly labeled experimental.

A practical setup for most users is:

```bash
sudo apt install evolution evolution-plugins
```

#### Mail Setup In Evolution

Start with the mail account first, because it is the simplest part and gives you an immediate correctness check.

In Evolution, add a mail account for `user@mail.example.com` and use the Mailu endpoints from earlier in this article:

* incoming mail: IMAP
* IMAP server: `mail.example.com`
* IMAP port: `993`
* transport security: TLS on a dedicated port
* username: `user@mail.example.com`
* password: normal mailbox password
* outgoing mail: SMTP
* SMTP server: `mail.example.com`
* SMTP port: `465`
* transport security: TLS on a dedicated port
* authentication: normal password
* username: `user@mail.example.com`

Evolution is just acting as a normal mail client against the Mailu mailbox.
The Evolution manual describes the normal IMAP account flow through the first run assistant and the mail account editor, including secure connections and authentication settings.

#### Calendar Setup In Evolution

After mail works, add the calendar as a separate remote calendar and point it at the personal SOGo calendar.

For the SOGo personal calendar, the CalDAV URL is typically:

* protocol: `CalDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Calendar/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

Add the SOGo calendar first, let Evolution load the remote data, and then verify in the SOGo web interface that you are looking at the same calendar.
Only after that would I import or copy older local calendar data if a migration is needed.

#### Contacts Setup In Evolution

Contacts should be added as a separate CardDAV address book and pointed at the personal SOGo address book.

For the SOGo personal address book, the CardDAV URL is typically:

* protocol: `CardDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Contacts/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

Here too, I would use the same staged approach. First add the CardDAV source. Then let Evolution load the remote contacts. Verify in the SOGo web interface that you are really looking at the address book you expect.
Only then import or copy existing local contacts if migration is needed. After the import, verify the result again in both places.

#### Evolution Client Verification

Once all three parts are configured, I would test at least these three things first:

1. send one mail to yourself from Evolution
2. create one calendar event in Evolution and confirm that it appears in the SOGo web interface
3. create one contact in Evolution and confirm that it appears in the SOGo web interface

If you are migrating older data, extend that check a bit further. I would also verify:

* one recurring event
* one all day event
* one event far in the past
* one event far in the future
* one edited contact

That gives you a practical end to end check that the integrated Evolution interface is really operating on the same server side objects that SOGo shows in the browser.

#### Reading Notes

The two most useful official references behind this section are still the Evolution manual and the Evolution project wiki:

* the Evolution manual:
  [help.gnome.org/evolution/](https://help.gnome.org/evolution/)
* the Evolution project wiki:
  [gitlab.gnome.org/GNOME/evolution/-/wikis/home](https://gitlab.gnome.org/GNOME/evolution/-/wikis/home)

The manual is the better starting point for actual setup and migration work.
Its index explicitly covers first run setup, account management, calendar management, contacts management, import, export, backup, and restore.

### Thunderbird Setup

[Thunderbird](https://www.thunderbird.net/en-US/) sits in an interesting middle ground.
It feels more integrated than a setup built from several separate desktop tools, but it still keeps the underlying protocols visible.
Mail, calendars, and address books live inside one application, yet the configuration model still follows distinct layers such as IMAP, SMTP, CalDAV, and CardDAV.

> Thunderbird does have automatic account configuration for many mail providers, and its calendar documentation also says that remote calendars and address books can be detected during account setup for supported providers.
> In this Mailu plus SOGo design, however, I would still configure mail first and then add calendar and contacts explicitly, because Mailu and SOGo live on different hostnames and serve different roles.
> That keeps the client setup aligned with the server design of this article.

#### The Practical Thunderbird Layout

For this setup, the clearest mental model is to think of Thunderbird as three linked but separately wired parts:

* mail goes to Mailu over IMAP and SMTP
* calendar goes to SOGo over CalDAV
* contacts go to SOGo over CardDAV

Mailu remains the mailbox backend, while SOGo provides the web interface and the DAV endpoints for calendars and contacts.

#### Mail Setup In Thunderbird

Start with mail first.
Thunderbird will often try to discover the mail settings automatically from the domain part of the email address.
If that does not work, or if you want to keep full control over the settings, the manual configuration dialog lets you edit the server names, ports, protocol, and security settings directly.

For `user@mail.example.com`, configure the mailbox against the Mailu endpoints like this:

* incoming mail: IMAP
* IMAP server: `mail.example.com`
* IMAP port: `993`
* connection security: `SSL/TLS`
* authentication method: `Normal password`
* username: `user@mail.example.com`
* outgoing mail: SMTP
* SMTP server: `mail.example.com`
* SMTP port: `465`
* connection security: `SSL/TLS`
* authentication method: `Normal password`
* username: `user@mail.example.com`

#### Calendar Setup In Thunderbird

After mail works, add the personal SOGo calendar as a network calendar.
In Thunderbird, the current documented path is `≡ > New > Calendar`, then `On the Network`.
The calendar setup dialog asks for a username and a location, and Thunderbird can then discover available calendars from that information.

For this SOGo setup, I would use the explicit personal calendar URL:

* protocol: `CalDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Calendar/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

#### Contacts Setup In Thunderbird

Contacts should be added separately against the personal SOGo CardDAV address book.

Current Thunderbird versions include built in CardDAV support.
In the Address Book window, create a new `CardDAV Address Book`, then enter the username and the CardDAV URL.

For the personal SOGo address book, use:

* protocol: `CardDAV`
* URL:
  `https://sogo.example.com/SOGo/dav/user@mail.example.com/Contacts/personal/`
* username: `user@mail.example.com`
* password: normal mailbox password

#### Thunderbird Client Verification

Once everything is configured, test at least these three things first:

1. send one mail to yourself from Thunderbird
2. create one calendar event in Thunderbird and confirm that it appears in the SOGo web interface
3. create one contact in Thunderbird and confirm that it appears in the SOGo web interface

If you are migrating older data, extend that check slightly. I would also verify:

* one recurring event
* one all day event
* one event far in the past
* one event far in the future
* one edited contact

That gives you a practical end to end confirmation that Thunderbird and the SOGo web interface are operating on the same server side data.
