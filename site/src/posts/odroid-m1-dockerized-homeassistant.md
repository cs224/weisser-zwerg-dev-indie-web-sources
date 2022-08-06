---
layout: "layouts/post-with-toc.njk"
title: "ODROID-M1: Dockerized Home Assistant"
description: "Dockerized home automation via Home Assistant, MQTT and remote access via WireGuard VPN and ProxyJump SSH all deployed via Ansible."
creationdate: 2022-08-06
keywords: hardkernel,odroid,ubuntu-ports,arm64,homeassistant,docker,mqtt,shelly,vpn,wireguard,ssh,proxyjump
date: 2022-08-06
tags: ['post']
---

You can find the code on [GitHub](https://github.com/cs224/odroid-m1-dockerized-homeassistant).

## Rational

As mentioned in my article [Fuel Save Alerter](../fuel-save-alerter-germany), I was originally thinking about deploying the application locally to a
[Raspberry Pi](https://en.wikipedia.org/wiki/Raspberry_Pi), but due to the delivery problems I decided to go with an [ODROID-M1 with 8GByte
RAM](https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram) instead. Then I reconsidered this decision and ended up deploying the
[fuel-save-alerter-germany](https://github.com/cs224/fuel-save-alerter-germany) application on a [netcup](https://www.netcup.de/vserver/vps.php)
VPS. In my article [ODROID-M1: an Experience Report](../odroid-m1) I described the characteristics of the `ODROID-M1` and as I had the device already
I was thinking about how to make the best use of it.

I finally ended up with the idea to deploy a [dockerized](https://en.wikipedia.org/wiki/Docker_(software)) version of [Home
Assistant](https://www.home-assistant.io) on the ODROID-M1, mostly following the excellent guidance given by [Docker And Home
Automation](https://www.youtube.com/playlist?list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy) by [Home Automation
Guy](https://www.homeautomationguy.io/home-assistant-tips/installing-docker-home-assistant-and-portainer-on-ubuntu-linux). The main addition from my
side is to deploy everything via [Ansible](https://www.ansible.com). In addition, I created a sample automation in pure
[Python](https://www.python.org) external to `Home Assistant` that communicates via [MQTT](https://mqtt.org) with `Home Assistant`. Furthermore, I
create a [WireGuard](https://www.wireguard.com) [VPN](https://en.wikipedia.org/wiki/Virtual_private_network) to connect the `ODROID-M1` in my home to
the [netcup](https://www.netcup.de/vserver/vps.php) VPS, so that I can use the `netcup` VPS as a ssh
[ProxyJump](https://goteleport.com/blog/ssh-proxyjump-ssh-proxycommand/) jump host to connect to the `Home Assistant` instance from anywhere I want.

As always, you can find the code on [GitHub](https://github.com/cs224/odroid-m1-dockerized-homeassistant).

## Home Assistant

Initially, I had trouble to understand what [Home Assistant](https://www.home-assistant.io) really is. On their web-site they recommend to install it
as a complete image of their [Home Assistant Operating System](https://www.home-assistant.io/installation/). In that configuration it includes a
supervisor and a [Home Assistant Add-ons](https://www.home-assistant.io/addons) store. Initially, I was uncertain what function each aspect of the
overall system fulfils.

In the end I would say now that [Home Assistant](https://www.home-assistant.io) is a web application that connects to all relevant functionality via
network protocols. You don't need the `Add-ons` store, because you can spin up all of these `Add-ons` via another docker container yourself. Like that
you have even access to many more external services and you have much more control over what is going on! I would even go as far as to recommend to go
with [Home Assistant Core](https://www.home-assistant.io/installation/).

The services I chose to add in addition to the core `Home Assistant` web application are:
* [portainer](https://www.portainer.io): a web interface to manage docker containers on the `ODROID-M1`.
* [PostgreSQL](https://www.postgresql.org): I simply always use PostgreSQL rather than any other DBMS.
    * Actually, I use a version of [Timescale](https://www.timescale.com/) to be prepared for further add-ons like [Long time state storage (LTSS)](https://github.com/freol35241/ltss) custom component for Home Assistant.
* [Mosquitto](https://mosquitto.org/) MQTT server: the interface to the outside world for `Home Assistant`.
* [Duplicati](https://www.duplicati.com): a backup software.

Have a look at the
[docker-compose.yml](https://github.com/cs224/odroid-m1-dockerized-homeassistant/blob/main/roles/homeassistant/templates/docker-compose.yml) file for
more details. Most of the components I simply set-up according to the description given by [Docker And Home
Automation](https://www.youtube.com/playlist?list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy) by `Home Automation Guy`.

The system set-up consists of the following stages:

1. `Home Assistant` and services via Ansible, systemd service and docker-compose.
1. `Home Assistant` core configuration via rsync copy.
1. Overall state of all services via Duplicati backup



In stage 1) you install the core services via Ansible, which in turn will set-up a systemd service which will start a docker-compose stack. At this
stage all services are running, but they are not connected or configured.

In stage 2) you create a base configuration of `Home Assistant` via its configuration files. On the ODROID-M1 they will be located at
`/opt/homeassistant/data/homeassistant/config`. In the GitHub repository the relevant files are located at
[homeassistant-backup](https://github.com/cs224/odroid-m1-dockerized-homeassistant/tree/main/homeassistant-backup).

For a fresh install stages 1) and 2) plus some manual actions to set-up the `MQTT` server are needed. Just follow the instructions from [MQTT and Home
Assistant](https://www.youtube.com/watch?v=cZV2OOXLtEI&list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy&index=7).

For a crash recovery or similar also step 3) is needed. There, you restore all other system state of the overall system via the `Duplicati` backup
system. See [Backing Up Home Assistant Container to Google Drive with
Duplicati](https://www.youtube.com/watch?v=pJqPhYXeulk&list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy&index=5) for details.

### ODROID-M1 basic set-up

The basic set-up of the ODROID-M1 is described in [ODROID-M1: an Experience Report](../odroid-m1). After that you'll have to set-up ssh so that
`Ansible` can connect to the device. Ideally you configure `sshd` in a way that it [only allows public key
authentication](https://www.nixcraft.com/t/how-to-only-allow-ssh-key-login-and-disable-passwords/3722) and does not allow root logins. You will want
to be able to edit `Home Assistant` configuration files via [Visual Studio Code](https://code.visualstudio.com) and its [Remote
Development](https://code.visualstudio.com/docs/remote/remote-overview) extension. You can follow the description at
[vscode-remote-ssh-as-root](https://ponteshare.ch/2022/01/vscode-remote-ssh-as-root) to achieve that. Basically you have to add the following at the bottom of your `sshd_config` on your ODROID-M1:

```
Match Address 127.0.0.1
        PermitRootLogin yes
```

And put something like that in your `~/.ssh/config` on your workstation:

```
Host odroid-root
  HostName 127.0.0.1
  ProxyJump odroid@odroid
  User root
```

And if you then add in addition your `~/.ssh/id_rsa.pub` to the `authorized_keys` on the `ODROID-M1` then you can connect directly via `ssh` and via the
`VS Code Remote Development` extension to the root account of your `ODROID-M1`:

    > ssh odroid-root


Once that is done you have to adapt the code in the [odroid-m1-dockerized-homeassistant](https://github.com/cs224/odroid-m1-dockerized-homeassistant)
GitHub repository to your situation. I use the user name `odroid` and the device is accessible via the DNS name `odroid` in my local network. If your
situation is different then just adapt the settings in [ansible.cfg](https://github.com/cs224/odroid-m1-dockerized-homeassistant/blob/main/ansible.cfg) and
[hosts](https://github.com/cs224/odroid-m1-dockerized-homeassistant/blob/main/hosts) to your situation.

Check that everything works as expected:

    > ansible all -m ping

Or

    > make ansible_ping

### Stage 1: ODROID-M1 Home Assistant set-up

The stage 1) base set-up is done via:

    > make deploy

This is equivalent to:

    > ansible-playbook setup.yml --ask-become-pass

You will have to provide the password for the `odroid` user on the `ODROID-M1`. In addition, the `odroid` user has to be able to execute `sudo`
commands, which should be the default behaviour.

### Stage 2: ODROID-M1 Home Assistant base configuration

I have provided a set of base configuration files in the
[homeassistant-backup](https://github.com/cs224/odroid-m1-dockerized-homeassistant/tree/main/homeassistant-backup) directory that you can use. Either
completely or partially.

The location on the `ODROID-M1` where to put these configuration files is at `/opt/homeassistant/data/homeassistant/config`. You can either copy all
the files there via `rsync`[^rsync-files-in-folder]:

    > rsync -av --progress --stats  ./homeassistant-backup/ odroid-root:/opt/homeassistant/data/homeassistant/config

Or manually edit what you need via for example the `VS Code Remote Development` extension.

### MQTT set-up and restart

For the final touches for the `MQTT` set-up, please follow the instructions from [MQTT and Home
Assistant](https://www.youtube.com/watch?v=cZV2OOXLtEI&list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy&index=7). After that you'll have to check the
configuration and restart `Home Assistant` via its web-interface. Go to the `Developer Tools` and execute the `CHECK CONFIGURATION` in the
"Configuration validation" section. There you can also restart `Home Assistant` once the validation gives you green light to do so.

* http://odroid:8123

### Stage 3: Duplicati Backup

To set-up a complete backup of all state of all components just follow the instructions at [Backing Up Home Assistant Container to Google Drive with
Duplicati](https://www.youtube.com/watch?v=pJqPhYXeulk&list=PL4ed4sZb-R_8dJmakzfBywx1zL9HrFEOy&index=5). As a slight deviation from the set-up of
[Home Automation Guy](https://www.homeautomationguy.io), I put the configuration at `/opt/homeassistant/data` rather than at `/opt`. That way the
`ODROID-M1` can be used for other purposes besides `Home Assistant` and you can deploy those other services besides the `Home Assistant` service in
the `/opt` directory.

## External Python Automation

I don't know how that happens, but my first ideas for how to use any new technology I investigate always exceed the capabilities that are provided
easily out of the box. This was also the case for `Home Assistant`.

I have some [FRITZ!DECT 200](https://avm.de/produkte/fritzdect/fritzdect-200) power plugs that I used so far solely to measure power consumption. I
noticed that even when I switch off all devices in the evening like my computer(s) and monitor there remains some power consumption of round about
$5.5W$. Now, my idea was to write an automation that looks at the current power consumption and if the power consumption for the last 12 minutes was
below $10W$ then my devices are switched off and it is save to just switch off the power plug itself. This way I avoid wasting $5.5W$ when nothing is
running.

This use-case is more difficult than it looks like. You have to look into the past and see if the maximum power consumption for the past 12 minutes
was below $10W$. In addition, if you manually decide to turn the power plug on again, it will still fulfil the condition that for the past 12 minutes
the power consumption was below $10W$ and this would trigger a turn off command for the power plug immediately again, e.g. you could not turn on the
plug even if you wanted to. So you have to add a condition that the power plug was not triggered on in the past 12 minutes in addition to the being
below $10W$ in that time period.

The code is in [odroid-m1-dockerized-homeassistant/python](https://github.com/cs224/odroid-m1-dockerized-homeassistant/tree/main/python). I connect
directly to the `PostgreSQL` database with [pandas.read_sql_query](https://pandas.pydata.org/docs/reference/api/pandas.read_sql_query.html)() to read
the relevant past states from there. Then I trigger a `MQTT` message on the `automation/{device_name}_trigger_off` topic that is picked up by a `Home
Assistant` automation. Look at
[automations.yaml](https://github.com/cs224/odroid-m1-dockerized-homeassistant/blob/main/homeassistant-backup/config/automations.yaml) at `alias:
'Ladestation: trigger power off for standby power consumption'`. So what happens is

1. Read past states from `PostgreSQL`
1. Check switch off condition
1. If switch off condition is given publish on the MQTT topic
1. The `Home Assistant` automation listens on that topic and does that actual switching off

You can deploy the script as follows:

    > ansible-playbook setup-python.yml --ask-become-pass

This will:

1. Set-up [Miniconda](https://docs.conda.io/en/latest/miniconda.html).
1. Install [mamba](https://github.com/mamba-org/mamba) instead of the standard `conda`.
1. Set-up a `py38od` (Python 3.8 OdroidD) conda base environment including [numpy](https://numpy.org) and [pandas](https://pandas.pydata.org).
1. Install additional python packages via `requirements.txt` and install the actual python scripts at `/home/odroid/opt/homeassistant-automations`.
1. Install a [systemd-service](https://www.freedesktop.org/wiki/Software/systemd/) and a
   [systemd-timer](https://opensource.com/article/20/7/systemd-timers) that runs the script every 10 minutes.

You can also do partial deploys via any of the following commands:

```
> ansible-playbook setup-python.yml --tags install-requirements-and-python-scripts
> ansible-playbook setup-python.yml --tags install-systemd-services --ask-become-pass
> ansible-playbook setup-python.yml --tags install-requirements-and-python-scripts --tags install-systemd-services --ask-become-pass
```

The first command does not require the `sudo` password and can be used to update the current script plus its dependencies defined in the
`requirements.txt` file.

### Local development

If you execute

    > make ssh

in another terminal it will in fact execute

    > ssh -L 9000:localhost:9000 -L 5432:localhost:5432 -L 8123:localhost:8123 -L 8200:localhost:8200 -L 1883:localhost:1883 odroid@odroid

This will make available:
* [portainer](https://www.portainer.io) on `localhost` port 9000
* [PostgreSQL](https://www.postgresql.org) on `localhost` port 5432
* [Home Assistant](https://www.home-assistant.io) on `localhost` port 8123
* [Duplicati](https://www.duplicati.com): on `localhost` port 8200
* [Mosquitto](https://mosquitto.org/) MQTT server on `localhost` port 1883

That way you can develop your python scripts in a local [Jupyter Notebook](https://jupyter.org) and once you're happy with it deploy the script to the
`ODROID-M1`. An example for such a local notebook is at
[2022-08-02-trigger-power-off-for-standby.ipynb](https://github.com/cs224/odroid-m1-dockerized-homeassistant/blob/main/python/2022-08-02-trigger-power-off-for-standby.ipynb).

## Footnotes

[^rsync-files-in-folder]: See [Rsync copy directory contents but not directory itself](https://stackoverflow.com/questions/20300971/rsync-copy-directory-contents-but-not-directory-itself).
