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

## Rationale

In one of my last blog posts, [Fuel Save Alerter](../fuel-save-alerter-germany), I described how to create the set-up on a `netcup` virtual private
server (VPS). I was thinking about putting a web-application front-end on top of it, but then I was thinking, what will happen if this will not be the
only web-application I will want to deploy on this VPS? In the end, only one web-application can listen on port 80.

After looking into the topic a bit longer I decided for a set-up with [traefik](https://traefik.io/) as reverse proxy that handles the incoming
requests, the SSL certificate procurement, the SSL termination and the [basic access
authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). In addition, the set-up is modular and extensible in the sense that a new web-app can
be deployed via docker or docker-compose plus some attached labels and `traefik` will pick-up the configuration automatically.

In principle all of this is rather straight forward and the documentation of `traefik` is really good, but the configuration and configuration syntax
need some getting used to it. An example will definitely help! Therefore, I'll show you the details below in the blog post body.

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

You should notice that while you requested a `http` URL you'll be automatically redirected to `https`. In addition, you should notice that without any
additional ado you'll have a valid SSL certificate and the browser does not complain. When you access the second `web2` link it should be protected
via [basic access authentication](https://en.wikipedia.org/wiki/Basic_access_authentication). You can access this page with the user name `test` and
password `test`.

The relevant configuration files are in
[./roles/traefik/templates](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/tree/main/roles/traefik/templates).

To show what I mean with modular and extensible I've added two examples in the associated [Makefile](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/Makefile).

    > make run_web3

and

    > make run_web4

In both cases a new nginx process will start-up and serve the path `web3` and `web4`:

* http://v2202206177879193164.goodsrv.de/web3
* http://v2202206177879193164.goodsrv.de/web4

The `web3` example is raw docker and shows what setting to provide for the `--network` options and the different labels.

The `web4` example uses another separate docker compose file
[docker-compose-web4.yml](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/docker-compose-web4.yml)
to show how to deal with the labels and network settings. I wanted to point out that this docker file uses another network name, rather than
`default`. It uses `main` and references `traefik_default` as external docker network. When I tried to use `default`, it was working the first time I
started that docker compose file, but when I stopped and restarted it did not come up again. Not quite sure why, though.

### Benefits

So the above should give you a flavour of what you'll get from this set-up: a *modular* and *extensible* reverse proxy that'll handle the *SSL
certificate procurement* and *basic access authentication* if wanted. So, **for any future project you might have, you simply focus on the raw web
application, and when finished you deploy it via a docker container with the right labels to make it available via a URL path on your VPS server**.

## Details

Let's look a bit more into the details of `traefik`. While the project is well documented it took me some getting used to its configuration format and how it all plays together.

`traefik` listens to incoming traffic via `entryPoints`. In our case for `http` on port $80$ and `https` on port $443$. The configuration may look like this:

```yml
entryPoints:
  web:
    address: ":80"
```

On the other side there are the real services, like the web applications you write. `traefik` calls them `services`. The configuration may look like this:

```yml
http:
  services:
    web1-service:
      loadBalancer:
        servers:
          - url: "http://web1_nginx:80"
```

In between happens routing via `routers` and "cross cutting concerns" via `middlewares`. So the whole processing chain looks like:

    entryPoint -> router -> [middleware ->]* service-> real service

The above notation means that there are 0 or several middlewares involved.

There are so called [`providers`](https://doc.traefik.io/traefik/providers/overview/#supported-providers) that are responsible for providing the
required configuration. While you're getting started with `traefik` I recommend you stick to the `file` `provider`, because it makes things most clear
and transparent. To achieve modularity and extensibility you'll have to use the `docker` `provider`, which listens on the docker socket for
container events and will process the attached labels to gather the required configuration.

In order to see how `traefik` sees the world the `traefik` dashboard is really useful. You can access it by port forwarding port $8081$ from your VPS to your
localhost:

    > ssh -L8081:localhost:8081 vagrant@v2202206177879193164.goodsrv.de

and accessing it via the URL:

* http://localhost:8081/dashboard/

<object data="/img/traefik-dashboard.jpeg" type="image/jpg" style="max-width: 100%"><img src="/img/traefik-dashboard.jpeg" alt="view from top"></object>

The dashboard is automatically enabled if you add `api.insecure`:

```yml
api:
  insecure: true
```

It will listen on an `entryPoint` called `traefik`, which will be auto-created if it is not present in your config file. If you want to change its
default port of $8080$ you'll have to add it to your configuration explicitly.

```yml
entryPoints:
  traefik:
    address: ":8081"
```


### Naming

One thing that puzzled me at the beginning was how the "things" are named. They are named automatically by the position in the configuration
hierarchy, e.g. a name of a service is the thing behind `http.services.XXX` (the `XXX`) part. Similar for `http.middlewares.XXX` and
`http.routers.XXX`. If you want to reference a named "thing" from the configuration of a different `provider` you have to add as a postfix the name
of the provider, e.g. `@docker` or `@file`. Here is for example how the `web2` router and the `web2strip` middleware are defined via docker labels:

```yml
  web2_nginx:
    image: nginx:1.23.0
    labels:
      - traefik.enable=true
      - traefik.http.routers.web2.rule=( Host(`{{ ansible_host }}`) && PathPrefix(`/web2`) )
      - traefik.http.middlewares.web2strip.stripprefix.prefixes=/web2
      - traefik.http.routers.web2.middlewares=web2strip,basic-auth@file
      - traefik.http.routers.web2.tls=true
```

Pay attention to the `traefik.http.routers.web2.middlewares` router configuration, where two middlewares are referenced. The first one was defined in
the same provider and therefore does not carry y postfix. It is just called `web2strip`. The second one was defined via the `file` `provider` and
therefore required the postfix. It is called `basic-auth@file`.

### TLS (SSL) termination

Most of the time you want the `traefik` reverse proxy to terminate the TLS connection. You must configure at least one (sub-)property of the `.tls`
configuration to achieve this. See the [routers/#tls](https://doc.traefik.io/traefik/routing/routers/#tls) documentation for details.

### Docker network

When you configure `services` you may have to name the "hosts" where they run on, e.g.:

```yml
http:
  services:
    web1-service:
      loadBalancer:
        servers:
          - url: "http://web1_nginx:80"
```

Here the service URL contains a host name `web1_nginx`. This is coming from the docker file, because you're inside the docker compose
network. Sometimes it is confusing to think about what a host name refers to. I strongly advise against using `localhost` as this is most
confusing. It means something different inside a container and on the VPS outside the container.

### http2 / http3

`traefik` is supposed to support `http2` and `http3`. `http2` was straight forward to configure and it worked on first attempt. I do not know what I
did wrong with `http3`. In my opinion, the current configuration should work, but it doesn't.

### basic access authentication

If you want to add user names and passwords to the `basic access authentication` use the `htpasswd` tool:

    > htpasswd -n cs224

### Uninstall

In case you ever wanted to get rid-off the complete installation follow the below:

    vagrant> sudo su
    root> systemctl stop traefik
    root> systemctl disalbe traefik
    root> systemctl daemon-reload
    root> systemctl list-units --all | grep traefik # -> should be empty
    root> rm /etc/systemd/system/traefik.service
    root> cd /opt/traefik
    root> docker compose down -v --remove-orphans # --rmi all
    root> cd ..
    root> rm -rf /opt/traefik
