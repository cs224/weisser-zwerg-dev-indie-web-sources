---
layout: "layouts/post.njk"
title: "Local discourse: vagrant, ansible, lxd, docker, discourse-embedding"
description: "Local discourse instance on vagrant for your local tests to embed discourse in your front-end development project."
creationdate: 2019-09-11
keywords: vagrant, ansible, lxc, lxd, discourse, discourse-embedding
date: 2019-09-11
tags: ['post']
---

## Why

I am working on a project where we consider to integratie [discourse](https://www.discourse.org/) for handling embedded discussions.
Just as an example, have a look at the [home-assistant blog](https://www.home-assistant.io/blog/2019/08/28/release-98/) and scroll to the very bottom. 
They use embedded discourse for that purpose.

For my local tests I wanted to set-up a local discourse instance. 
In principle, this is not too difficult if you use the [developing-with-vagrant](https://github.com/discourse/discourse_docker#developing-with-vagrant) vagrant image
together with the [discourse_dev](https://github.com/discourse/discourse_docker/tree/master/image/discourse_dev) docker image. But first of all, this set-up does
not fulfill all the requirements for testing the embedding of discourse (DNS names, ...) and second I wanted to get a feeling of what it means to set-up a production 
instance of discourse. The discourse_dev image pre-populates the database so that you can focus on hacking discourse, e.g. it will not offer you this set-up experience.

## More problems than you think should be necessary ...

So I decided to follow the [INSTALL-cloud](https://github.com/discourse/discourse/blob/master/docs/INSTALL-cloud.md) instructions. If you do that on a
real host in the real world the instructions will work nicely. But in a local set-up I ran into more problems than I think should be necessary. These
problems are all a consequence of discourse's insistence on using real host-names. It will simply not work if you use raw IP addresses. The second
somehow related problem is that discourse embedding will only work if discourse runs as a sub-domain of your primary domain. The next problem that
follows along with this is that you have to ensure correct name resolution into the vagrant image and into the inner-most docker images, because
discourse will run in a docker image.

Initially I thought I'd use a simple `/etc/hosts` based set-up and use "mydomain.dev" or "mydomain.local", but [I found out](https://webdevstudios
.com/2017/12/12/google-chrome-63/) that chrome simply does not work with these top-level domains (Firefox was ok with them). After some digging I
arrived at the conclusion that the only top-level domain (TLD) that worked for chrome is the `.test` TLD.

My projects code-name is `joto`. I therefore set-up my outer-most `/etc/hosts` file as follows:

    192.168.1.194    joto.test www.joto.test
    192.168.56.100   discourse.joto.test

I therefore can develop my front-end app on my outer-most computer and test the discourse integration. I will have to refer to this web-site as `joto.test`.
The vagrant image gets the IP address 192.168.56.100 and I can refer to it as `discourse.joto.test`.

## Additonal requirement: docker in LXD

If we were to decide to go live with discourse as our commenting system we'd get a server from one of the cloud providers and use
[LXD](https://linuxcontainers.org/lxd/introduction/) (Linux Containers: an operating-system-level virtualization) within that server to encapsulate the
different aspects of our application, like discourse. Then within that LXD container we will run the discourse docker image.

Since I looked last time into the docker in LXC/LXD[^lxd] container topic a lot has happened and I was pleasantly surprised about the progress
they've made. You can run docker inside an unpriviliged LXC/LXD container by now.

The final set-up will look as follows:
![final set-up](/img/local-discourse-on-vagrant-setup.svg)


[^lxd]: LXC and LXD are two different command line interfaces to the same kernel functionalities: [linux
namespaces](https://en.wikipedia.org/wiki/Linux_namespaces) and [cgroups](https://en.wikipedia.org/wiki/Cgroups); I like LXD better, because of its
excellent [cloud-init](https://cloud-init.io/) support

