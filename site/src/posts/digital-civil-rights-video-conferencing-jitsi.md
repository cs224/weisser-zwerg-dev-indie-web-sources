---
layout: "layouts/post-with-toc.njk"
title: "Private Video Conferencing with Jitsi Meet behind Traefik as a Reverse Proxy"
description: "Reclaiming your privacy by using your private Jitsi Meet video conferencing instance."
creationdate: 2025-01-10
keywords: Jitsi Meet, private video conferencing, self-hosted video calls, Traefik reverse proxy
date: 2025-01-10
tags: ['post']
---

## Rationale

This post is part of the Digital Civil Rights and Privacy series.
In this guide, you'll learn how to set up your own Jitsi Meet video conferencing server, paired with Traefik as a reverse proxy.
By hosting your own instance, you can ensure your video calls remain private and secure, giving you full control over your data.

Prefer visual guidance? Check out the YouTube video [Replace Zoom & Teams with Jitsi Meet. It's Free, Self-Hosted, and Private!](https://www.youtube.com/watch?v=q_vFOIHwXh0) by [Jim's Garage](https://www.youtube.com/@Jims-Garage) for a step-by-step walkthrough.

Here are some helpful additional resources:
* [meet.jit.si](https://meet.jit.si/): A free, public Jitsi Meet instance for  state-of-the-art video conferencing if you’d rather not host your own.
* Jitsi Meet on [GitHub](https://github.com/jitsi/jitsi-meet): A secure, simple, and scalable video conferencing solution you can use as a standalone app or embed in your web application.
* Jitsi Meet [Handbook](https://jitsi.github.io/handbook/docs/devops-guide/): A detailed resource to deepen your understanding and maximize your setup.

## Prerequisites

We will use [Traefik as a Reverse Proxy](../traefik-reverse-proxy-ansible) on our netcup Virtual Private Server ([VPS](https://www.netcup.de/vserver/vps.php)), which we set up [earlier](../fuel-save-alerter-germany/#deployment-environment(s)) and made accessible over the internet.

> In the Traefik [docker-compose.yml](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/docker-compose.yml) from my previous post, I still use `traefik:v2.8.0`.
> If you want to utilize a more recent version, check out [Christian Lempa](https://www.youtube.com/@christianlempa)'s [boilerplates](https://github.com/ChristianLempa/boilerplates) and specifically his [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik) file.
> Currently, this uses `traefik:v3.3.1`.

For this guide, I’ll assume you’re working with a VPS, have Traefik set up as a reverse proxy on this VPS, and that the VPS is accessible via the internet at `your-domain.tld`.

## Set-Up

The process for setting up a `docker compose` instance is well-documented in the [Self-Hosting Guide - Docker](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker).
For convenience, I’ll outline the steps here with a few additional comments to help you along the way.

First, create the file system structure needed to run Jitsi Meet on your VPS. This step should be performed as the `root` user on your VPS:


```bash
mkdir -p /opt/jitsi/jitsi-meet-cfg/{web,transcripts,prosody/config,prosody/prosody-plugins-custom,jicofo,jvb,jigasi,jibri}
```

Download and extract the [latest release](https://github.com/jitsi/docker-jitsi-meet/releases/latest). **DO NOT** clone the git repository.

```bash
cd /opt/jitsi/
wget $(curl -s https://api.github.com/repos/jitsi/docker-jitsi-meet/releases/latest | grep 'zip' | cut -d\" -f4)
```

When I set this up, the file I downloaded was `stable-9457-2`. At the time of writing, the latest available release is `stable-9909`.

Unzip the package:
```bash
unzip stable-9457-2
```

If you’re working with the `stable-9909` release, unzipping it will create a directory named `jitsi-docker-jitsi-meet-4787ac5`.
For other versions, like the one I used (`stable-9457-2`), the directory created might look like `jitsi-docker-jitsi-meet-2423033`.

From the extracted files, you’ll only need `docker-compose.yml` and the file `env.example`. For now, let’s follow the steps outlined in the documented installation procedure.

```bash
cd jitsi-docker-jitsi-meet-2423033
cp env.example .env
bash ./gen-passwords.sh
```

The `bash ./gen-passwords.sh` step is essential for automatically filling in the `XXX_AUTH_PASSWORD=...` settings in the `.env` file.

Here’s a breakdown of the additional changes you should make to the .env file (below is a `diff` for additional clarity):

* `CONFIG=`: Specify the directory where all configuration files will be stored.
* `PUBLIC_URL=`: Enter the `https://jitsi.your-domain.tld` URL where your instance will be accessible online. Replace `your-domain.tld` with the domain name of your VPS.
* `ENABLE_AUTH=1`: Enabling authentication is crucial to prevent your Jitsi instance from being publicly accessible without restrictions.
* `ENABLE_GUESTS=1`: With authentication enabled, this setting allows guests to wait in a lobby until a registered user lets them in.

```diff
*** jitsi-docker-jitsi-meet-2423033/env.example	2024-04-29 18:43:49.000000000 +0200
--- .env	2025-01-10 15:09:00.035967433 +0100
***************
*** 16,22 ****
  #
  
  # Directory where all configuration will be stored
! CONFIG=~/.jitsi-meet-cfg
  
  # Exposed HTTP port
  HTTP_PORT=8000
--- 16,22 ----
  #
  
  # Directory where all configuration will be stored
! CONFIG=/opt/jitsi/jitsi-meet-cfg
  
  # Exposed HTTP port
  HTTP_PORT=8000
***************
*** 28,34 ****
  TZ=UTC
  
  # Public URL for the web service (required)
! #PUBLIC_URL=https://meet.example.com
  
  # Media IP addresses to advertise by the JVB
  # This setting deprecates DOCKER_HOST_ADDRESS, and supports a comma separated list of IPs
--- 28,34 ----
  TZ=UTC
  
  # Public URL for the web service (required)
! PUBLIC_URL=https://jitsi.your-domain.tld
  
  # Media IP addresses to advertise by the JVB
  # This setting deprecates DOCKER_HOST_ADDRESS, and supports a comma separated list of IPs
***************
*** 117,126 ****
  #
  
  # Enable authentication
! #ENABLE_AUTH=1
  
  # Enable guest access
! #ENABLE_GUESTS=1
  
  # Select authentication type: internal, jwt, ldap or matrix
  #AUTH_TYPE=internal
--- 117,126 ----
  #
  
  # Enable authentication
! ENABLE_AUTH=1
  
  # Enable guest access
! ENABLE_GUESTS=1
  
  # Select authentication type: internal, jwt, ldap or matrix
  #AUTH_TYPE=internal
```

Below are the changes you need to make to the `docker-compose.yml` file:

* **Configure the external Traefik network**: At the very bottom of the file, specify `traefik_net` as the external network used by `traefik`. To find the name of this network, run the command `docker network ls`.
* **Update the `networks:` section**: In both the `web:` and `jvb:` services, add `traefik_net:` to their respective `networks:` sections.
* **Set Traefik labels**: In the `web:` and `jvb:` services, configure the `labels:` required for `traefik` to handle reverse proxying.
* **Expose ports for the `jvb:` service**: Make the necessary `ports:` available to the VPS machine. In my setup, I had to map port `8080` to `8088` due to a local port conflict on my VPS. This step may not be needed for your configuration.

```diff
*** jitsi-docker-jitsi-meet-2423033/docker-compose.yml	2024-04-29 18:43:49.000000000 +0200
--- docker-compose.yml	2025-01-10 15:08:59.138958134 +0100
***************
*** 175,182 ****
--- 173,190 ----
              - WHITEBOARD_COLLAB_SERVER_PUBLIC_URL
          networks:
              meet.jitsi:
+             traefik_net:
          depends_on:
              - jvb
+         labels:
+           - "traefik.enable=true"
+           - "traefik.http.routers.jitsi-secure.entrypoints=web-secure"
+           - "traefik.http.routers.jitsi-secure.rule=Host(`jitsi.your-domain.tld`)"
+           - "traefik.http.routers.jitsi-secure.tls=true"
+           - "traefik.http.routers.jitsi-secure.service=jitsi"
+           - "traefik.http.services.jitsi.loadbalancer.server.port=80"
+           - "traefik.docker.network=traefik_default"
+ 
  
      # XMPP server
      prosody:
***************
*** 398,406 ****
      jvb:
          image: jitsi/jvb:${JITSI_IMAGE_VERSION:-stable-9457-2}
          restart: ${RESTART_POLICY:-unless-stopped}
!         ports:
!             - '${JVB_PORT:-10000}:${JVB_PORT:-10000}/udp'
!             - '127.0.0.1:${JVB_COLIBRI_PORT:-8080}:8080'
          volumes:
              - ${CONFIG}/jvb:/config:Z
          environment:
--- 406,413 ----
      jvb:
          image: jitsi/jvb:${JITSI_IMAGE_VERSION:-stable-9457-2}
          restart: ${RESTART_POLICY:-unless-stopped}
!         ports: # - '${JVB_PORT:-10000}:${JVB_PORT:-10000}/udp'
!             - '127.0.0.1:${JVB_COLIBRI_PORT:-8088}:8080'
          volumes:
              - ${CONFIG}/jvb:/config:Z
          environment:
***************
*** 454,460 ****
              - prosody
          networks:
              meet.jitsi:
  
  # Custom network so all services can communicate using a FQDN
  networks:
!     meet.jitsi:
--- 461,477 ----
              - prosody
          networks:
              meet.jitsi:
+             traefik_net:
+         labels:
+           - "traefik.enable=true"
+           - "traefik.udp.routers.jvb-rtr.entrypoints=video"
+           - "traefik.udp.routers.jvb-rtr.service=jvb-svc"
+           - "traefik.udp.services.jvb-svc.loadbalancer.server.port=10000"
+           - "traefik.docker.network=traefik_default"
  
  # Custom network so all services can communicate using a FQDN
  networks:
!   meet.jitsi:
!   traefik_net:
!     external:
!       name: traefik_default
```

After that you should be able to start your Jitsi instance on your VPS server:

```bash
docker compose up -d
```

## Creating Users

Authentication with `ENABLE_AUTH` and set AUTH_TYPE to internal, then configure the settings you can see below.

The default authentication mode (`internal`) uses XMPP credentials to authenticate users.
To enable it you have to enable authentication with `ENABLE_AUTH` and set `AUTH_TYPE` to internal.

Internal users must be created with the prosodyctl utility in the prosody container.
In order to do that, first, execute a shell in the corresponding container:

```bash
docker compose exec prosody /bin/bash
```

Once in the container, run the following command to create a user:

```bash
prosodyctl --config /config/prosody.cfg.lua register TheDesiredUsername meet.jitsi TheDesiredPassword
```

Note that the command produces no output.

## Jitsi Meet configuration

Jitsi-Meet uses [two configuration files](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker#jitsi-meet-configuration) for changing default settings within the web interface: `config.js` and `interface_config.js`.
The files are located within the `/opt/jitsi/jitsi-meet-cfg/web/` directory configured within your environment file.

These files are re-created on every container restart.
To retain your custom settings, create your own configuration files named `custom-config.js` and `custom-interface_config.js`.

Refer to the Jitsi Meet [user guide](https://jitsi.github.io/handbook/docs/user-guide/user-guide-advanced/) for a detailed explanation of configurable parameters.
For example, you might want to update `/opt/jitsi/jitsi-meet-cfg/web/custom-config.js` to:

* Generate avatars locally.
* Disable Callstats integration to avoid potential data privacy issues from third-party services.

Here's how you need to adapt `/opt/jitsi/jitsi-meet-cfg/web/custom-config.js` to disable third-party requests in your configuration:
```JavaScript
config.disableThirdPartyRequests = true;
```

## Conclusions

In this guide, you’ve learned how to set up your own Jitsi Meet video conferencing server behind `traefik` as a reverse proxy.
By hosting your own instance, you can ensure that your video calls stay private and secure, giving you complete control over your data.
