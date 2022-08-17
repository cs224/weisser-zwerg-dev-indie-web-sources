---
layout: "layouts/post-with-toc.njk"
title: "Home Automation: Abstract / Conceptual View"
description: "What is Home Automation about?"
creationdate: 2022-08-17T14:15:00+01:00
date: 2022-08-17T14:15:00+01:00
keywords: home-automation, IoT, smart-devices
tags: ['post']
# eleventyExcludeFromCollections: true
---

## Rational

When I started my first home automation experiments in 2019 I was not sure what it is all about, whether I need or want it, and what kinds of problems
it solves. At that time I simply started to buy things that said "Home Automation" or "Smart". Now, three years later, I have a better conceptual
understanding what home automation is all about and I want to present a conceptual framework on how to think about home automation.

Such conceptual frameworks can either be used by individuals to think about which gaps they still have in their automation space and may want to close
or by product managers thinking about how to design smart devices, which features are a minimum must and what you could do to stand out.

## Areas of use

The areas of use will not be exclusive, e.g. certain use cases fall into several areas of use.

### Convenience

I start with convenience, because this was the thought that first came into my mind in 2019 when I was thinking about home automation or smart
devices. Examples would be a robot lawn mower or a robot vacuum cleaner. These devices take over work that otherwise you would have to do yourself.

* Situation dependent configurations
  * On-off
  * Intensity
  * Percentage
  * Colors / warmth
* Home help
  * Lawn mower
  * Vacuum cleaner
  * Laundry
  * Cooking
  * Dish washing
  * Coffee machine
* Functional Updates
  * Firmware upgrade

The situation dependent configurations come into play whenever it would take time and effort to do it yourself, e.g. switching a set of lights on or
off and giving them a certain intensity, color or warmth. Another example is to shut the roller shutters on the south side of the building to prevent
the summer heat from coming in. If you have a leisure residence where normally the heating is set to a low temperature during winter you might want to
turn it up remotely so that when you arrive there the rooms are warm.

Devices fitting the home help topic are robots like the ones mentioned above for mowing the lawn or vaccum cleaning. A washing machine may trigger
itself at a certain time, so that the laundry is finished exactly when you come home. Or the washing machine might trigger when your photo voltaic
system produces the most power. Your smart fridge might notice when certain ingredients are out and may re-order the next batch from an online super
market with a delivery service.

At a minimum every smart device should be capable of updating itself with a new firmware, either because of security vulnerabilities or because of
functionality upgrades and improvements.

All in all, after 3 years, this category is the one that I am least interested in. I have for example a smart oven, but never felt the need to use its
"smart" functionality. Many smart devices are only artifically smart so that the manufacturer can print a "smart" label on them.

### Supply / disposal / storage / optimization / accounting of vital resources

A lot of different vital resources need to be regularly transported into your home, sometimes stored and later disposed. The usage of those resources
might be quite costly, e.g. you might want to optimize or at least keep an overview of the used quantities.

Resources are:

* Energy
  * Electricity
  * Warmth
    * Gas
    * Oil
    * ...
* Water: inside and outdoors
* Provisions
  * Medicine
* Data (as in telecommunication)
* Light
* Air
* Timing of
  * storage
  * usage

Smart devices may track their energy usage. I would say that for most devices that should be a must. At a minimum the devices should tell you how
much energy they consume and for battery backed devices they should tell you how much battery is still left.

Your photo voltaic system might be coupled with an house entry energy meter and a battery storage system to constantly decide the best way from where
to obtain the electric power in your house (grid, battery, roof).

Your oil tank might measure the vessel level to know when to order the next batch of fuel. In addition, this will tell you your rate of consumption.

Watering systems for your garden might be triggered by a ground humidity sensor to only wanter when it is necessary. In addition this is also
convenient, because you do not have to take care of it yourself any longer.

Your refrigerater might know when to order the next batch of provisions. For older persons medicine supply will become more and more important. This
may be as simple as ordering pills or as complex as automatically injecting insulin when the blood sugar level says so.

Most people would not think about their home entertainment system as a supply/storage system, but in principle it is a supply and storage system for
entertainment. You might want to pre-load the newest episodes of your favorite series onto your phone while you're at home, so that you have it
available when you go traveling or similar.

Light has to be controlled in two ways. First, in the evenings when it gets dark outside you want electric lights in your home. Second, during the
day, when sun is too bright or when the sun warms up your home too much you want to shut it out with your roller shutters.

Most modern homes are so well insulated that they need a separate air ventilation system that takes care of fresh air supply while not losing warmth
by using a heat exchanger.

In order to optimize your consumption costs you might want to time storage and/or usage, e.g. typically it is cheaper to buy oil for your oil heating
in summer than in winter. It might be cheaper to turn on your washing machine automatically at lunch time when your photo voltaic system is producing
the electrcity rather than in the evenings when you're at home.

### Doing remotely what otherwise can only be done locally

There are some things that did not fit very well into other categories, but have one commonality, e.g. you don't have to physically go to a remote
location to do some things there.

Examples would be a door bell system that rings you on your phone when you're not in your house so that you can give the postman instructions where to
put the parcle.

Or if you have a leisure residence and when you're not there you want to turn off the water at the main faucet. If you forgot to do so it is great to
be able to do it remotely.

The above example where you had a leisure residence where normally the heating is set to a low temperature during winter and you might want to turn it
up remotely so that when you arrive there the rooms are warm.

Watering plants in case it did not rain for quite some time.

### Safety / security

The last category is about protecting you from loss of (serious) money, health or life. These devices are typically monitoring the environment,
alerting the inhabitants and taking protective actions where applicable to contain the damage.

* Protection against over or under supply that will cause (sometimes severe) monetary damage
  * Water: leak
  * Water: open window
  * Drought: garden
  * Humid cellar: mold
  * Overvoltage: lightning
  * Heat/fire: forgotten turned on cooktop
* Hazard
  * Fire / smoke detector
* Burglary
  * Physical access control
  * Motion sensors
  * Video surveillance
  * Deterrence by simulating a human behaviour in the house while you're away

Many of these devices do not need to be very smart, but it might be an advantage if they are smarter than the average alerting device, e.g. if you're
not at home it would be good to know that you are about to face some water damage, because you left your window open and it is going to rain. That
will only work if the devices communicate via some network protocol with your smart phone.

## Summary

I hope this conceptual overview helps you to review your own need for home automation and smart devices and see what might add value to your own life.

The devices are not enough, though. Most manufacturers would love to lock you in into their own eco-system by nudging you to use their cloud based
control system. I've described a good alternative[^it-caveat] in my [ODROID-M1: Dockerized Home Assistant](../odroid-m1-dockerized-homeassistant)
article.

## Footnotes

[^it-caveat]: that requires some IT knowledge, though
