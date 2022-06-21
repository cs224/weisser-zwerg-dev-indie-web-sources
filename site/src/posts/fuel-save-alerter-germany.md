---
layout: "layouts/post-with-toc.njk"
title: "Fuel Save Alerter: a TypeScript version of the heise+ article : 'Günstiger tanken: So lesen Sie Spritpreise automatisch aus'"
description: "TypeScript, TypeORM, docker-compose, vagrant, ansible, netcup VPS"
creationdate: 2022-06-21
keywords: vagrant, ansible, docker-compose, netcup-vps, TypeScript, TypeORM
date: 2022-06-21
tags: ['post']
---

You can find the code on [GitHub](https://github.com/cs224/fuel-save-alerter-germany).

## Rational

From time to time I like to look into low-code and no-code environments to see if there are any new ideas out there that make the approach more viable
for me. Since the time of IBM [VisualAge](https://en.wikipedia.org/wiki/VisualAge) for C++ in the mid 90s I am hoping for a way to develop
applications with less hassle and more "intent". But up to now I was consistently disappointed by any of the implementations I looked at. Recently
these were:

* Microsoft [PowerAutomate](https://powerautomate.microsoft.com/)
* [Retool](https://retool.com)

The ones I still want to give a try are:

* [Enso](https://enso.org)
* [Budibase](https://budibase.com)

And in that spirit I was also looking at the [heise+](https://www.heise.de/plus) article [Günstiger tanken: So lesen Sie Spritpreise automatisch aus mit
Node-Red](https://www.heise.de/ratgeber/Guenstiger-tanken-So-lesen-Sie-Spritpreise-automatisch-aus-mit-Node-Red-6549915.html?seite=all), which walks
you through an application developed in [Node-RED](https://nodered.org). Node-RED advertises itself as *"Low-code programming for event-driven
applications"*. The application is meant to download fuel price data from the [Tankerkönig](https://creativecommons.tankerkoenig.de/) API, store it in
a [PostgreSQL](https://www.postgresql.org) database and visualize it via [Grafana](https://grafana.com). After following the instructions I had
successfully built the application, but was thinking it would have been so much simpler and nicer to build this application in a real programming
language.

Normally I would use Java or Kotlin for this type of application, but I was curious to see how far the [TypeScript](https://www.typescriptlang.org)
eco-system has come along and how well you could build this type of application in [TypeScript](https://www.typescriptlang.org). So I did and this
blog post is here to tell the story about my experiences along the way.

## Development Infrastructure in Docker Compose

In order to be able to store the gathered data in a [Timescale](https://www.timescale.com) database and visualize it via
[Grafana](https://grafana.com) we need both components running. In the original [heise+](https://www.heise.de/plus) article the author proposes to
install those components on your development computer. I dislike this approach, because over time you will clutter your environment and potentially
even run into version conflicts of infrastructure components between different projects you'll work on over time. For that reason I prefer to use a
containerized approach via docker compose.

If you change into the dev directory:

    > cd fuel-save-alerter-germany/010-dev

You can start the development infrastructure via:

    > make run_compose_up

You can stop the development infrastructure via `Ctrl-C`
([SIGINT](https://unix.stackexchange.com/questions/362559/list-of-terminal-generated-signals-eg-ctrl-c-sigint)). This will stop the containers. You
can restart the development infrastructure again via `make run_compose_up`. If you want to start from scratch do a

    > make run_compose_down
    > make run_compose_up

The `make run_compose_down` will stop and **delete** all containers, volumes and networks so that the `make run_compose_up` will recreate all infrastructure
from scratch. See [docker-compose up, down, stop start
difference](https://stackoverflow.com/questions/46428420/docker-compose-up-down-stop-start-difference) for details.

### Development Infrastructure for the original Node-RED heise+ set-up

As a plus I've also added the docker compose infrastructure for following along the original [heise+](https://www.heise.de/plus) article [Günstiger
tanken: So lesen Sie Spritpreise automatisch aus mit
Node-Red](https://www.heise.de/ratgeber/Guenstiger-tanken-So-lesen-Sie-Spritpreise-automatisch-aus-mit-Node-Red-6549915.html?seite=all). Just execute:

    > make run_nodered_compose_up


## API Key for Tankerkönig

Go to https://creativecommons.tankerkoenig.de/ and click on the API-KEY menu item on the right top of the page. Follow the instructions.

Then create a local `.env` file by copying the template and **editing the APIKEY**:

    > cp env.template .env

You can change other parameters in the `.env` file as you please.

## The TypeScript Application

Make sure your development infrastructure is running: `make run_compose_up`.

After installing all the dependencies:

    > npm install

You can now start the TypeScript application:

    > npm start

This command will start the application in dev mode and will use `synchronize: true` in the data-source declaration of
[TypeORM](https://typeorm.io/data-source-options) to automatically issue the [DDL](https://en.wikipedia.org/wiki/Data_definition_language)
instructions to the database as needed.

If you want to create the production build you can run:

    > npm run build
    > npm run package

This will create a single binary executable `fsag-gather` of the application via the [Vercel](https://vercel.com) open-source
[pkg](https://github.com/vercel/pkg) tool. Before you can run the binary executable `fsag-gather` you have to run the migrations on the "production
database". To simulate that re-create the development infrastructure:

    > make run_compose_down
    > make run_compose_up

Then run the migrations:

    > npm run migration_run

And finally you can execute the `fsag-gather` binary:

    > ./fsag-gather

The migrations were generated from a clean development infrastructure by running:

    > npm run migration_generate

In case you would continue to develop the application further you would run that command again after changing your data-model to create the next
migration.

A roll-back would be triggered by:

    > npm run migration_revert

This will undo the migrations one-by-one.

On a clean development infrastructure you can also look at the DDL that the `synchronize: true` would execute:

    > npm run ddl

And you could trigger the synchronization via the cli via:

    > npm run ddlsync

But be aware that this will not create the meta data for the migrations to work. In production you should stick to the migrations approach. In
development you can rely on the auto synchronization provided by [TypeORM](https://typeorm.io).

### Vercel ncc tool

Just as a side remark, I also integrated the [Vercel](https://vercel.com) open-source [ncc](https://github.com/vercel/ncc) tool to generate a single
[JavaScript](https://www.ecma-international.org/publications-and-standards/standards/ecma-262/) file.

    > npm run ncc

This will generate the single self-contained `./dist/index.js` file. This might be useful if you ever wanted to put this code on a
[serverless](https://acloudguru.com/blog/engineering/serverless-showdown-aws-lambda-vs-azure-functions-vs-google-cloud-functions) infrastructure.

### Application Code

Below you can find the code for this little application. At least for my taste this looks much more manageable than the different bits and pieces I
had to get aligned in the original `Node-RED` version. In addition you get standard version control system behaviour and a straight forward way to run
the code in different environments like development, staging and production (more on that further below). Furthermore you can debug the application in
the "normal" way in your IDE via your IDE's debugger.

If you compare the code below with the JavaScript code you had to provide in the Node-RED version anyway for converting the data-structures from what
you get from the API to what you need for the database (below the `station_from_request` and `price_from_request` functions) you will notice that
besides that main mapping code there is not much more code in addition. So what exactly is then `low-code` supposed to mean here anyway?

```typescript

import "reflect-metadata"
import 'dotenv/config'

import axios from 'axios';

import {Price, Station} from "./model/model";

import {dataSource} from "./datasource";
import {is_production} from "./isproduction";

const latitude = process.env.LATITUDE;
const longitude = process.env.LONGITUDE;
const radius = process.env.RADIUS;
const apiKey : string = process.env.APIKEY || '';

const URL = 'https://creativecommons.tankerkoenig.de/json/list.php';
const params = new URLSearchParams([['lat', `${latitude}`], ['lng', `${longitude}`], ['rad', `${radius}`], ['sort', 'dist'], ['type', 'all'], ['apikey', `${apiKey}`]]);

const createdat = new Date();

function station_from_request(req_station : any) : Station {
    const postCodeNum = req_station.postCode as number;
    const postCode = String(postCodeNum).padStart(5, '0');
    const id = req_station.id as string;
    const name = req_station.name as string;
    const brand = req_station.brand as string;
    const street = req_station.street as string;
    const houseNumber = req_station.houseNumber as string;
    const city = req_station.place as string;
    const distance = req_station.dist as number;

    return new Station(id, createdat, name, brand, street, houseNumber, postCode, city, distance);
}

function price_from_request(req_station : any) : Price {
    const id = req_station.id as string;
    const isOpen = req_station.isOpen as boolean;
    const diesel = req_station.diesel || null as number | null;
    const e5 = req_station.e5 || null  as number | null;
    const e10 = req_station.e10 || null  as number | null;

    return new Price(id, createdat, isOpen, diesel, e5, e10);
}

const start = async () : Promise<void> => {
    try {
        await dataSource.initialize();
        const headers = {
            'Content-Type': 'application/json'
        }
        const res = await axios.get(URL, { params, headers });

        const stations = res.data.stations;

        for(const station of stations) {
            const s = station_from_request(station);
            if(!is_production)
                console.log('Going to insert or update Station: ' + JSON.stringify(s));
            await dataSource.manager.save(s);
        }

        for(const station of stations) {
            const p = price_from_request(station);
            if(!is_production)
                console.log('Going to insert Price: ' + JSON.stringify(p));
            await dataSource.manager.save(p);
        }
    } catch(error) {
        console.log(error);
    }
}

start();
```

## Deployment Environment(s)

Originally I was thinking about deploying the application to a local [Raspberry Pi](https://en.wikipedia.org/wiki/Raspberry_Pi)[^rpi02w], but then I
noticed how difficult it currently is to get one. The article [Raspi-Alternativen im Jahr der
Chipknappheit](https://www.heise.de/select/make/2022/3/2208808255068404680) is looking into that. I finally decided to buy an [ODROID-M1 with 8GByte
RAM](https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram) instead. I was positively surprised to see that even when ordering the device from
South Korea the delivery time is only 1 week. That's nice. The whole package will cost something like 140 USD, e.g. a lot more than my original
Raspberry Pi[^rpilocator] idea.

Then I slept over the whole story one night and I was thinking if there wasn't a cheap [Virtual Private
Server](https://en.wikipedia.org/wiki/Virtual_private_server) (VPS) option available instead. After a bit of googling I found the following
[netcup](https://www.netcup.de/vserver/vps.php) offering for 2.99 € per month for a minimum duration of 6 months. For that cost per month I can run
the VPS for close to 4 years until I reach the price my ODROID-M1 device costs me. In addition I'll get an internet reachable IP address with the
VPS set-up. So that will be my production environment.

### Staging

As a staging environment I'll use a local `vagrant up` [vagrant](https://www.vagrantup.com/) environment either based on
[VirtualBox](https://www.virtualbox.org) or [KVM](https://www.linux-kvm.org)[^vagrantlibvirtkvm]. As OS I'll use a Ubuntu 22.04 LTS Jammy.

    > cd fuel-save-alerter-germany/900-ops
    > vagrant up
    > vagrant ssh
    vagrant> ping 192.168.56.101

The last line is necessary, because otherwise the interface is sometimes not accessible from the host outside the virtual machine. Exit the virtual
machine `Ctrl-D` (EOF) and check that the ansible configuration is working:

    > ansible all -m ping

You should get a green response from your vagrant environment. Next set-up and configure the base system like `docker` and other packages:

    > ansible-playbook 00-basebox/setup.yml

And finally install the systemd versions of the docker-compose infrastructure plus a systemd timer[^systemdtimers] to regularly run the `fsag-gather`
executable every 20 minutes and store the data in our postgres database.

    > ansible-playbook 10-systemd-service/setup.yml

As we don't want to use the `synchronize: true` mode of [TypeORM](https://typeorm.io/data-source-options) in production we also need to run the
migrations. We only need to do this the first time we call the `10-systemd-service/setup.yml` playbook. In the future we only need to run the
migrations in cases where the schema changes.  Therefore, go ahead and execute in one terminal the following ssh command:

    > vagrant ssh -- -L 5432:localhost:5432

This ssh command will "teleport" the PostgreSQL port 5432 from the staging environment to your local host via ssh port forwarding so that you can run
the migrations from your local working machine.  From a second terminal on your local machine, run the migrations:

    > pushd ../010-dev && npm run migration_run && popd

Now go back to your first terminal and execute the following on the vagrant guest staging environment to test the set-up:

    vagrant> sudo systemctl start fsag-gather.service
    vagrant> sudo cat /tmp/fsag-gather-out.txt
    vagrant> sudo journalctl -S today -u fsag-gather.service
    vagrant> sudo systemctl status fsag-gather.timer

If all goes well you should see the success message from gathering data in the `fsag-gather-out.txt` file and you should see the details about the
timer.

#### Remove the Vagrant Environment

Once you're done with your staging environment simply remove it:

    > vagrant destroy

#### A remark about Network Security

We were careful to confine the [PostgreSQL](https://www.postgresql.org)/[Timescale](https://www.timescale.com) and the [Grafana](https://grafana.com)
ports to localhost on the staging environment via our docker-compose file and the `ports` directive:

```yaml
version: "3.8"
networks:
  main:

services:
  postgres:
    container_name: fsag_postgresql
    image: 'timescale/timescaledb:latest-pg14'
    volumes:
      - data-volume:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - main
  grafana-oss:
    container_name: fsag_grafana
    image: 'grafana/grafana-oss:8.5.5'
    volumes:
      - grafana-storage:/var/lib/grafana
    ports:
      - '127.0.0.1:3000:3000'
    networks:
      - main
volumes:
  data-volume:
  grafana-storage:
```

These ports should not be accessible other than from localhost on the staging or production environment. If you want to access them from your local
working machine you use the `ssh` port forwarding capability via the `-L` switch:

    > vagrant ssh -- -L 5432:localhost:5432 -L 3000:localhost:3000

But I've read descriptions of cases where users reported that the restriction to localhost did not work because of whatever internal magic of
container set-ups. It is worthwhile to check that the ports are really not accessible from the outside of your staging and production environments!!
Execute both the following commands:

    > telnet 192.168.56.101 5432
    > telnet 192.168.56.101 3000

In both cases you should receive something like:

    > telnet: Unable to connect to remote host: Connection refused

### Production

Now that our tests on our staging environment work fine we can go to production. In principle, you simply have to repeat what you already did on the
staging environment.

Once you have a VPS set-up like in my case the [netcup](https://www.netcup.de/vserver/vps.php) offering for 2.99 € per month you have to perform a
base set-up via the web console of the VPS provider. You will have to install `Ubuntu 22.04 LTS Jammy`. After that you should be able to ssh to that
environment via the user root and a password. With that access you then should set-up a `vagrant` user, give the vagrant user a password, create an
admin group, add the vagrant user to the admin group (to enable the vagrant user for sudo access), set-up the
[authorized_keys](https://help.ubuntu.com/community/SSH/OpenSSH/Keys#Transfer_Client_Key_to_Host) for the vagrant user and ideally [disable password
authentication in sshd](https://askubuntu.com/questions/435615/disable-password-authentication-in-ssh). After that you should be able to ssh to your
VPS via the vagrant user without the need to enter a password:

    > ssh vagrant@v2202206177879193164.goodsrv.de

With the password you did set for the vagrant user you should be able to `sudo su` to `root`:

    vagrant> sudo su
    root>

Adapt the `ansible_host` value in `900-ops/environments/prod/hosts.yml` to your VPS instance.

Once that is done just follow the same/similar procedure as for the staging area:

    > ANSIBLE_CONFIG=environments/prod/ansible.cfg ansible -i environments/prod all -m ping
    > ANSIBLE_CONFIG=environments/prod/ansible.cfg ansible-playbook -i environments/prod 00-basebox/setup.yml --ask-become-pass
    > ANSIBLE_CONFIG=environments/prod/ansible.cfg ansible-playbook -i environments/prod 10-systemd-service/setup.yml --ask-become-pass
    > ssh -L 5432:localhost:5432 vagrant@v2202206177879193164.goodsrv.de

In the above, when ansible asks you for a password then type the password you did set-up for the vagrant user on your VPS. Like that you need 2 access
credentials to perform changes on your production environment:

* the SSH key that you authorized via the `authorized_keys` file[^yubissh]
* the vagrant user password

From a second terminal on your local machine, run the migrations:

    > pushd ../010-dev && npm run migration_run && popd

Now go back to your first terminal and execute the following on the vagrant guest production environment to test the set-up:

    vagrant> sudo systemctl start fsag-gather.service
    vagrant> sudo cat /tmp/fsag-gather-out.txt
    vagrant> sudo journalctl -S today -u fsag-gather.service
    vagrant> sudo systemctl status fsag-gather.timer


If you want to access the postgres database on your VPS via the SSH tunnel execute the following from a second terminal:

    > psql postgres://postgres:postgres@localhost:5432/postgres

#### Network Security Check

    > telnet v2202206177879193164.goodsrv.de 5432
    > telnet v2202206177879193164.goodsrv.de 3000

### Uninstall

In case you ever wanted to get rid-off the complete installation follow the below:

    vagrant> sudo su
    root> systemctl stop fsag-gather.timer
    root> systemctl disable fsag-gather.timer
    root> systemctl stop fsag-infrastructure
    root> systemctl disalbe fsag-infrastructure
    root> systemctl daemon-reload
    root> systemctl list-units --all | grep fsag # -> should be empty
    root> systemctl list-timers --all | grep fsag # -> should be empty
    root> rm /etc/systemd/system/fsag-infrastructure.service /etc/systemd/system/fsag-gather.service fsag-gather.timer
    root> cd /opt/fsag-gather
    root> docker compose down -v --remove-orphans # --rmi all
    root> cd ..
    root> rm -rf /opt/fsag-gather

## Grafana

The Grafana set-up procedure is the same as in the original [heise+](https://www.heise.de/plus) article. Please refer there for details.

## Next Steps

There is a second part of the [heise+](https://www.heise.de/plus) article called [Push-Benachrichtigung bei günstigen Spritpreisen: Alarm mit Node-Red
einrichten](https://www.heise.de/ratgeber/Push-Benachrichtigungen-mit-Node-Red-Alarm-fuer-guenstige-Spritpreise-einrichten-7121238.html?seite=all),
which extends the data collection functionality to provide push notifications via the [Pushover](https://pushover.net/) app. In a future blog post I
might extend the current solution accordingly.

## Footnotes

[^rpilocator]: You might be lucky to get a Raspi via the [RPiLocator](https://rpilocator.com).
[^rpi02w]: I would have liked a [Raspberry Pi Zero 2 W](https://en.wikipedia.org/wiki/Raspberry_Pi#Raspberry_Pi_Zero) for something like 15 USD.
[^vagrantlibvirtkvm]: Have a look at [How To Use Vagrant With Libvirt KVM Provider](https://ostechnix.com/how-to-use-vagrant-with-libvirt-kvm-provider) for details.
[^systemdtimers]: [Use systemd timers instead of cronjobs](https://opensource.com/article/20/7/systemd-timers)
[^yubissh]: In order to improve your security even further you could use a [YubiKey](https://www.yubico.com/) for [logging in to remote SSH servers](https://developers.yubico.com/PGP/SSH_authentication/)
