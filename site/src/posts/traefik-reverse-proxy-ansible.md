---
layout: "layouts/post-with-toc.njk"
title: "Traefik as Reverse Proxy"
description: "An extensible set-up of traefik as reverse proxy via ansible, systemd and docker compose with automatic Let's Encrypt SSL certificates."
creationdate: 2022-07-12
keywords: traefik,ansible,systemd,docker,docker-compose,let's encrypt,acme
date: 2022-07-12
tags: ['post']
---

You can find the code on [GitHub](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase).

## Rational

In one of my last blog posts, [Fuel Save Alerter](../fuel-save-alerter-germany), I described how to create the set-up on a `netcup` virtual private
server (VPS). I was thinking about putting a web-application front-end on top of it, but then I was thinking, what will happen if this will not be the
only web-application I will want to deploy on this VPS? In the end, only one web-application can listen on port 80.

After looking into the topic a bit longer I decided for a set-up with [traefik](https://traefik.io/) as reverse proxy that handles the incoming
requests, the SSL certificate procurement, the SSL termination and the [basic access
authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). In addition the set-up is extensible in the sense that a new web-app can
be deployed via docker or docker-compose plus some attached lables and `traefik` will pick-up the configuration automatically.

In principle all of this is rather straight forward and the documentation of `traefik` is really good, but the configuration and configuration syntax
needs some getting used to it. An example will definitely help! Therefore, I'll show you the details below in the blog post body.

## Ingredients

The solution will consist of the following ingredients:

* [traefik](https://traefik.io/)
* [ansible](https://www.ansible.com/)
* [systemd](https://www.freedesktop.org/wiki/Software/systemd/)
* [Let's encrypt](https://letsencrypt.org)
* [docker](https://www.docker.com/)
* [docker compose](https://docs.docker.com/compose/)

You can find more details about how to set-up the VPS and its docker base environment in the [Fuel Save Alerter](../fuel-save-alerter-germany) post
plus its associated [repository](https://github.com/cs224/fuel-save-alerter-germany). The key part there is:


    > ANSIBLE_CONFIG=environments/prod/ansible.cfg ansible-playbook -i environments/prod 00-basebox/setup.yml --ask-become-pass


This post assumes that this basic set-up is present.

## Install

You will have to adapt the `ansible_host` in `environments/prod/hosts.yml` to your situation. After that you should be able to install this showcase set-up:

    > ansible all -m ping
    > ansible-playbook setup.yml --ask-become-pass


After that you should be able to access the following links (adapted to your case):
* http://v2202206177879193164.goodsrv.de/web1
* http://v2202206177879193164.goodsrv.de/web2

You should notice that while you requested a `http` URL you'll be automatically redirected to `https`. In addition you should notice that without any
additional ado you'll have a valid SSL certificate and the browser does not complain. When you access the second `web2` link it should be protected
via [basic access authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). You can access this page with the user name `test` and
password `test`.

The relevant configuration files are in
[./roles/traefik/templates](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/tree/main/roles/traefik/templates). Let's start with the
static configuration [traefik.yml](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/traefik.yml).



