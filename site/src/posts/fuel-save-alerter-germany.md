---
layout: "layouts/post-with-toc.njk"
title: "Fuel Save Alerter: a TypeScript version of the heise+ article : 'Günstiger tanken: So lesen Sie Spritpreise automatisch aus'"
description: "TypeScript, TypeORM, docker-compose, vagrant, ansible, netcup VPS"
creationdate: 2022-06-19
keywords: vagrant, ansible, docker-compose, netcup-vps, TypeScript, TypeORM
date: 2022-06-19
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

Just as a side remark, I also integrated the [Vercel](https://vercel.com) open-source [pkg](https://github.com/vercel/ncc) tool to generate a single
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

        // alle Tankstellen nacheinander auswerten
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

### Raspi

### Vagrant

### Netcup VPS



