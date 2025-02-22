---
layout: "layouts/post-with-toc.njk"
title: "Take Control of Your Code: Replace GitHub by Self-Hosting Gitea with Traefik as a Reverse Proxy"
description: "How to set up your own private Git repositories and reclaim your digital independence and privacy."
creationdate: 2025-02-22
keywords: Gitea, Git, self-hosted, Traefik, reverse proxy, private repositories, GitHub
date: 2025-02-22
tags: ['post']
---


## Rationale

This post is part of the Digital Civil Rights and Privacy series.
In a world where privacy and control over your data are increasingly important, this guide will show you how to set up your own private substitute for GitHub using Gitea, paired with Traefik as a reverse proxy.
By self-hosting your repositories, you ensure your code stays private, secure, and entirely under your control.

### Prerequisites: Networking and Network Topology Overview

In this guide, we'll use [Traefik as a Reverse Proxy](../traefik-reverse-proxy-ansible) on a netcup Virtual Private Server ([VPS](https://www.netcup.de/vserver/vps.php)) that we've already set up [earlier](../fuel-save-alerter-germany/#deployment-environment(s)) and made accessible over the internet.
To connect this VPS to your home server, where Gitea will be running, we'll use a WireGuard [Hub-and-Spoke](../security-identity-goteleport/#virtualized-mesh-networks) (Star) topology.
This setup allows us to securely access services like Gitea on your home server from anywhere via the public internet while keeping your data private and under your control.

Here's a simple visual overview of the setup:

<img src="https://www.procustodibus.com/images/blog/wireguard-topologies/hub-and-spoke-outline.svg" style="max-height: 100px; max-width: 100%">

At the top of this configuration at the top of this Ʌ (upside-down V) is your VPS server reachable via the internet, which acts as the "hub" ("star-center") and hosts the Traefik reverse proxy.
Connected to this hub is your home server, where Gitea and other services will run.
Both are linked securely using WireGuard in a [Virtualized Mesh Network](../security-identity-goteleport/#virtualized-mesh-networks), creating a private and encrypted connection between them.

For a step-by-step guide on setting up a WireGuard virtualized mesh network, check out the WireGuard section in the [ODROID-M1: Dockerized Home Assistant](../odroid-m1-dockerized-homeassistant) page.

[Getting my Hub and Spoke setup to work](../security-identity-goteleport/#virtualized-mesh-networks) took some time, mainly because I overlooked the following lines in the `wg0.conf` at my star center at my netcup VPS:

```ini
# Allow routing between clients
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT
```

As detailed in [Wireguard Netzwerk mit Routing einrichten](https://www.edvpfau.de/wireguard-netzwerk-mit-routing-einrichten).

> In the Traefik [docker-compose.yml](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/docker-compose.yml) from my previous post, I still use `traefik:v2.8.0`.
> If you want to utilize a more recent version, check out [Christian Lempa](https://www.youtube.com/@christianlempa)'s [boilerplates](https://github.com/ChristianLempa/boilerplates) and specifically his [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik) file.
> Currently, this uses `traefik:v3.3.3`.

For this guide, I'll assume you're working with a VPS, have Traefik set up as a reverse proxy on this VPS, and that the VPS is accessible via the internet at `your-domain.tld`.

## Getting Started

The process for setting up a `docker compose` instance is well-documented in the [Installation with Docker](https://docs.gitea.com/installation/install-with-docker) Gitea documentation page, which is an excellent resource to have handy.
A significant portion of the setup below is inspired by [Vladimir Mikhalev](https://www.heyvaldemar.com/)' [gitea-traefik-letsencrypt-docker-compose](https://github.com/heyvaldemar/gitea-traefik-letsencrypt-docker-compose) repository on GitHub.
I simplified it by removing the integrated backup mechanisms, as I prefer using tools like [Borg](https://www.borgbackup.org) or [Duplicati](https://duplicati.com/) for backups.
If you're curious about the full setup, Vladimir's complete guide is available on his [website](https://www.heyvaldemar.com/install-gitea-using-docker-compose/).

For your convenience, I'll walk you through the steps here, adding a few extra comments to guide you smoothly along the way.

### On your Home Server

Let's start by setting up the necessary file system structure on your home server to run Gitea.
Make sure to perform these steps as the `root` user for proper permissions.
```bash
mkdir -p /opt/gitea/config/{postgres/data,gitea/data} && chmod a+w /opt/gitea/config/gitea/data
```

Next, copy the `docker-compose.yaml` and `.env` files into the `/opt/gitea/` directory.
These files are essential for configuring your Gitea setup:
* The `docker-compose.yaml` file defines the services needed to run Gitea.
* The `.env` file stores environment variables for your configuration.

`docker-compose.yaml`
```yaml
########################### EXTENSION FIELDS
# Helps eliminate repetition of sections
# Keys common to some of the core services that we always to automatically restart on failure
x-common-keys-core: &common-keys-core
  restart: unless-stopped

# docker compose up -d
# docker compose config

name: gitea
services:
  postgres:
    image: ${GITEA_POSTGRES_IMAGE_TAG}
    <<: *common-keys-core
    volumes:
      - ./config/postgres/data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${GITEA_DB_NAME}
      POSTGRES_USER: ${GITEA_DB_USER}
      POSTGRES_PASSWORD: ${GITEA_DB_PASSWORD}
    healthcheck:
      test: [ "CMD", "pg_isready", "-q", "-d", "${GITEA_DB_NAME}", "-U", "${GITEA_DB_USER}" ]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 60s
    restart: unless-stopped
  gitea:
    image: ${GITEA_IMAGE_TAG}
    <<: *common-keys-core
    ports:
      - 3000:3000
      - 2222:22
    volumes:
      - ./config/gitea/data:/${DATA_PATH}
      - /etc/timezone:/etc/timezone:ro
      - /etc/localtime:/etc/localtime:ro
    environment:
      GITEA_DATABASE_HOST: postgres
      GITEA_DATABASE_NAME: ${GITEA_DB_NAME}
      GITEA_DATABASE_USERNAME: ${GITEA_DB_USER}
      GITEA_DATABASE_PASSWORD: ${GITEA_DB_PASSWORD}
      GITEA_ADMIN_USER: ${GITEA_ADMIN_USERNAME}
      GITEA_ADMIN_PASSWORD: ${GITEA_ADMIN_PASSWORD}
      GITEA_ADMIN_EMAIL: ${GITEA_ADMIN_EMAIL}
      GITEA_RUN_MODE: prod
      GITEA_DOMAIN: ${GITEA_HOSTNAME}
      GITEA_SSH_DOMAIN: ${GITEA_HOSTNAME}
      GITEA_ROOT_URL: ${GITEA_URL}
      GITEA_HTTP_PORT: 3000
      GITEA_SSH_PORT: ${GITEA_SHELL_SSH_PORT}
      GITEA_SSH_LISTEN_PORT: 22
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
      interval: 10s
      timeout: 5s
      retries: 3
      start_period: 90s
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
```

`.env`:
```bash
GITEA_POSTGRES_IMAGE_TAG=postgres:17
GITEA_IMAGE_TAG=bitnami/gitea:1.23.1
GITEA_DB_NAME=giteadb
GITEA_DB_USER=giteadbuser
GITEA_DB_PASSWORD=...somesecretpassword....           # `openssl rand -base64 15` or `pwgen -cnys 15 1` or use keepassx "Password Generator" functionality
GITEA_ADMIN_USERNAME=giteaadmin
GITEA_ADMIN_PASSWORD=...somesecretpassword....        # `openssl rand -base64 15` or `pwgen -cnys 15 1` or use keepassx "Password Generator" functionality
GITEA_ADMIN_EMAIL=giteaadmin@gitea.your-domain.tld
GITEA_URL=https://gitea.your-domain.tld
GITEA_HOSTNAME=gitea.your-domain.tld
GITEA_SHELL_SSH_PORT=2222
DATA_PATH=/bitnami/gitea
```

Now, verify that everything is set up correctly. Run:
```bash
docker compose config
```
The output should confirm that all variables have been successfully replaced with the values from your `.env` file.

Finally, you're ready to start your Docker stack. Run:
```bash
docker compose up -d
```

This command will start all the services in the background, and your Gitea instance will be up and running.

### On your Virtual Private Server (VPS)

Let's continue with extending our set-up of our VPS server.
You'll need to make a few adjustments to your Traefik Reverse Proxy configurations.

Start by updating the configuration in `/opt/traefik/docker-compose.yml`. Add or adapt the following settings as needed:
```yaml
    ports:
      - "2222:2222"
    volumes:
      - ./traefik-config/traefik.yml:/etc/traefik/traefik.yml
      - ./traefik-config/dynamic.yml:/etc/traefik/dynamic/dynamic.yml
      - ./traefik-config/dynamic-tcp.yml:/etc/traefik/dynamic/dynamic-tcp.yml
```

Next, modify the Traefik configuration file at `/opt/traefik/traefik-config/traefik.yml`. Make sure to include or update the following:
```yaml
entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: web-secure
          scheme: https
  web-secure:
    address: ":443"
    http2:
      maxConcurrentStreams: 250
    http3:
      advertisedPort: 443
  git-ssh:
    address: ":2222"

providers:
  file:
    directory: /etc/traefik/dynamic
    watch: true
```

Then, head over to `/opt/traefik/traefik-config/dynamic.yml` and add or adjust the following lines:
```yaml
http:
  middlewares:
    compresstraefik:
      compress: true
  routers:
    gitea-router:
      rule: "Host(`gitea.your-domain.tld`)"
      service: gitea-service
      middlewares:
        - compresstraefik
      tls:
        certResolver: default
  services:
    gitea-service:
      loadBalancer:
        passHostHeader: true
        servers:
          - url: "http://10.0.1.5:3000"
```

Finally, update the TCP configuration in `/opt/traefik/traefik-config/dynamic-tcp.yml`. Add or adapt the following:
```yaml
tcp:
  routers:
    gitea-ssh-router:
      rule: "HostSNI(`*`)"
      service: gitea-ssh-service
      entrypoints:
        - git-ssh
  services:
    gitea-ssh-service:
      loadBalancer:
        servers:
          - address: "10.0.1.5:2222"
```

## Gitea Configuration

The Gitea configuration file is located at `config/gitea/data/custom/conf/app.ini`.
Below are some key settings you may want to adjust to make your self-hosted repository more private and secure.
Here's a quick overview in `diff` format of the changes I'd suggest you might want to consider:
```diff
7a8,9
> DEFAULT_PRIVATE=private
> FORCE_PRIVATE=true
78c80
< DISABLE_REGISTRATION=false
---
> DISABLE_REGISTRATION=true
81,82c83,84
< REQUIRE_SIGNIN_VIEW=false
< DEFAULT_KEEP_EMAIL_PRIVATE=false
---
> REQUIRE_SIGNIN_VIEW=true
> DEFAULT_KEEP_EMAIL_PRIVATE=true
```

* `DEFAULT_PRIVATE=private` and `FORCE_PRIVATE=true`: These settings ensure that all new repositories are private by default and prevent users from creating public repositories, which is ideal for keeping your code secure and private.
* `DISABLE_REGISTRATION=true`: This disables user registration, meaning only you (or users you explicitly create) can access your Gitea instance. This is a good security measure if you're the only one who needs access.
* `REQUIRE_SIGNIN_VIEW=true` and `DEFAULT_KEEP_EMAIL_PRIVATE=true`: These settings require users to sign in before viewing repositories and keep their email addresses private by default, adding an extra layer of security and privacy for your users.

I'd also advise to turn on [Multi-factor Authentication (MFA)](https://docs.gitea.com/usage/multi-factor-authentication) for your user accounts on Gitea in the `> Settings > Security` section.

> Enabling MFA on a user does affect how the Git HTTP protocol can be used with the Git CLI.
> This interface does not support MFA, and trying to use a password normally will no longer be possible whilst MFA is enabled.

Your usual way of dealing with repositories where MFA is enabled is to use `SSH Keys` in the `> Settings > SSH / GPG Keys` section.

> If SSH is not an option for Git operations, an access token can be generated within the "Applications" tab of the user settings page.
> This access token can be used as if it were a password in order to allow the Git CLI to function over HTTP.

> **Warning**: By its very nature, an access token sidesteps the security benefits of MFA. It must be kept secure and should only be used as a last resort.

For a full list of configuration options, check out the Gitea [Configuration Cheat Sheet](https://docs.gitea.com/administration/config-cheat-sheet).

## Conclusions

That's it! You've successfully set up your own self-hosted Gitea server with Traefik as a reverse proxy.
By taking these steps, you've not only created a private and secure space for your code but also taken a significant step toward reclaiming control over your digital privacy and independence.

Now that you're up and running, think about all the possibilities - hosting your personal projects, collaborating with trusted contributors, or even creating a private repository for sensitive work.
You're in full control of your data, free from third-party dependencies.