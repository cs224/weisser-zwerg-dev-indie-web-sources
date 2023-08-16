---
layout: "layouts/post-with-toc.njk"
title: "Photovoltaics: Balcony Power Station (Balkonkraftwerk)"
description: "My experiences along the way of building and operating a balcony power station."
creationdate: 2023-08-08T12:48:00+02:00
date: 2023-08-08T12:48:00+02:00
keywords: photovoltaics, balkonkraftwerk, balcony-power-station
tags: ['post']
---

## Rational

- shadow simulations

I like to grow into topics from small to large, from simple to complex and step by step. My journey into the world of photovoltaics started last year
in 2022, when I learned that you are allowed to do everything yourself (without the need to hire a professional electrician or similar) around a small
photovoltaics system as long as you do not exceed 600 W power production on the AC side. In Germany these small power stations have different names,
but most often they are called Balkonkraftwerk (balcony power station) even if they are not operated on a balcony at all. From that moment on I
started to read, watch YouTube videos, visit local hobbyist groups and anything else that helped me to understand the topic of photovoltaics.

The below blog post summarizes my journey so far.

## Click on Images

Whenever you see images below click on them to see the large version.

## Solar Table (Solartisch)

I live in an appartment that I own in the first floor with a balcony direction south-west. One of the first things I learned around a balcony power
station was that if you want to mount the solar panels/modules[^solarmodulepanel] to the outside of the balcony you have to ask the community of owners
(Eigentümergemeinschaft) for permission. And for that you have basically only one chance per year in the community of owners assembly
(Eigentümerversammlung). End of last year, when I started to take this project more serious, my one chance for 2022 had already passed. In general, a
good help, was the document [Balkonkraftwerke in der Eigentumswohnung](https://machdeinenstrom.de/balkonkraftwerke-in-der-eigentumswohnung). It also
inspired me to circumvent the whole topic of asking for permission by building a solar table (Solartisch) as every owner of an appartment is free in
the layout and design of their balcony and what they put on it.

At that time I came across the [Heise](https://www.heise.de) article [Strom selbst erzeugen: Wie Sie einen Solartisch
bauen](https://www.heise.de/ratgeber/Strom-selbst-erzeugen-Wie-Sie-einen-Solartisch-bauen-7188750.html?seite=all)[^solartablevideo], which explained how to build a
solar table yourself. For someone like me, who is not a skilled wood worker, the topic sounded too complex and I decided to go with two [STIER Falt
Arbeitsbock](https://www.amazon.de/gp/product/B07WLC47S9) for 36,81€ each, together with a simpler wood construction on top of it:

<a href="/img/photovoltaics-bps-stier-panel-under-construction-01.png" target="about:blank"><img src="/img/photovoltaics-bps-stier-panel-under-construction-01.png" alt="Stier Panel Under Construction" style="max-height: 100px"></a><a href="/img/photovoltaics-bps-stier-panel-under-construction-02.png" target="about:blank"><img src="/img/photovoltaics-bps-stier-panel-under-construction-02.png" alt="Stier Panel Under Construction With Panel" style="max-height: 100px"></a>

This was also the first time that I ran into a surprise issue around the lack of standardization in the photovoltaic industry. I was expecting that
after more than 20 years of its existence the solar industry would have come up with several accepted standards, especially around "non-issues" like
"sizing" and the like. But this lack of standards is all around in the solar industry, **therefore take nothing for granted**.

The concrete issue was that I bought the same mounting rails from [eet.energy](https://www.eet.energy/produkt/schienen-fuer-wandmontage) that they
used in the Heise article. But I did not use the same panel. I used a Jinko Solar
[JKM375N-6TL3-B](https://www.jinkosolar.com/uploads/JKM355-375N-6TL3-(V)-F1-EN%20(IEC%202016).pdf) with size (H x B x T) in mm: 1692 x 1029 x 30. This
panel is only 30mm in depth, but the mounting rails are for modules with 35-40mm in depth. Long story short: the mounting rails did not fit to my
panel. In the end I bought the [K2 2004211 MiniRail 2.0
Set](https://www.elektroland24.de/neue-energien/photovoltaik/unterkonstruktion/k2-2004211-minirail-2.0-set.html) plus [K2 2002559 Clamp EC
30-50mm](https://www.elektroland24.de/neue-energien/photovoltaik/unterkonstruktion/k2-2002559-domeclamp-ec-set-30-50.html) clamps that worked with my panel.

You may ask, why I decided to use clamps at all and not simply went with mounting with bolts? That is one of my remaining open questions. I heard in
several YouTube videos, that the frame of a solar module is only meant as a frame and not as a "holding structure". I did not find anything explicit
in writing, but for example in the video [Darum nicht anwinkeln am Balkon: Windlast-Gefahr / Achtung:
Modulrahmen](https://www.youtube.com/watch?v=KP_NO0jcmGQ&t=209s), [Holger
Laudeley](https://www.laudeley.de/index.php/unternehmen/dipl-ing-holger-laudeley/), warns explicitely against mounting with bolts. On the other hand
the [Jinko Solar Installation Manuals](https://jinkosolar.eu/wp-content/uploads/Installation-Manual-Jinko-IEC-updated-version-2023.07.20.pdf)
explicitly mention "2.3.1 Mounting with Bolts". So: I don't know, but I wanted to be on the safe side.

Another question was, which torque to apply when mounting the clamps. Here, the Jinko Solar Installation Manuals, for example, say: "The reference
value of tightening torque for M8 bolt is 16-20 Nm, and for M6 bolt is 9-12 Nm".

### Bulkiness (Handhabbarkeit)

The solar panel has a size of 1692 x 1029 x 30mm and weighs 19kg. Originally, I decided for this module, because we have a station wagon, and I
thought that only the length might be an issue. I can fit objects into the trunk of our car close to 1.8m in length and with this module I had 10cm of
wiggle room. But it turned out that the breadth is even more an issue than the length. At the narrowest point our trunk has only 0.95m. So, in the
end, I could have taken any panel, because it anyway does not fit into our trunk. At first, you might think, that this is not an issue, but if you
ever have to move or want to sell the panels then this becomes an issue.

The other area where this bulkiness is in your way when installing a balcony power station is when you want to mount the modules to the outside of
your balcony and safety becomes a concern, especially the wind load (Windlast). The above mentioned video from [Holger
Laudeley](https://www.laudeley.de/index.php/unternehmen/dipl-ing-holger-laudeley/) is talking very much about these safety concerns and how they solve
it with a sepcial mounting kit: [Darum nicht anwinkeln am Balkon: Windlast-Gefahr](https://www.youtube.com/watch?v=KP_NO0jcmGQ).

The main reason for going with a standard panel is cost. It is simply the most cost effective solution. On the other hand you have to consider that
the panel alone is not enough and you need a mounting kit in addition to the panel. No matter how you do it, if you buy a mounting kit, it will always
be around 100€ for one panel. The cost for my solar table above is roughly 100€. Another solution I looked at was the Profiness mounting kit for the
balcony railing [PV-Montagesystem >>> Aufständerung >>> Geländer/Zaun/Wand-Sets](http://www.profiness-shop.de/solarshop1/index2.htm) (you have to
manually click through the bullet point menu on the left, because direct linking was not possible) that is also around 100€.

In contrast to the standard panels the specialized panels for balcony mounting are smaller, lighter and much easier to handle and to manage. The two I looked at are:
* [PiE AIR superLIGHT 390+](https://pluginenergy.de/products/pie-air-solarmodul-400-watt-full-black)
* [ledscom.de 4 x 105W Solar Panele, klein (101x55x2cm), leicht (2,1kg)](https://www.leds-com.de/set-7111-ledscom-de-4-x-105w-solar-panele-klein-101x55x2cm-leicht-2-1kg.html)

Also from a safety perspective I would have a much better feeling with mounting a 3kg panel with velcro to the balcony railing than mounting a 20kg
panel with a mounting kit. But that is, of course, only my personal opinion.

The biggest downside of these specialized panels is cost. They are round about 1€/Wp in contrast to 0.25€/Wp (or even below) for a standard panel. But
hopefully, with increasing demand, these systems become cheaper over time.

## Power Inverter with MPPT Tracker

The solar modules are producing DC electricity but your home is driven by AC electricity. Therefore, you need a device that converts from DC to
AC. This device is called power inverter. These power inverters exist in different "sizes", e.g. for a big solar power plant you need different
devices than for a balcony power station. The power inverters for balcony power stations are typically called "micro inverters" and typically come
along with connectors for one or two solar panels. At least here it seems that vendors have standardized on [MC4
connectors](https://en.wikipedia.org/wiki/MC4_connector). Typically, you also have one so called MPPT tracker ([Maximum Power Point
Tracking](https://en.wikipedia.org/wiki/Maximum_power_point_tracking)) per connector. The job of the MPPT tracker is to optimize the power extraction
from the panel.

> <span style="font-size:smaller">
> As a side remark: once you look at bigger solar power generators where you connect several panels in series and/or parallel to a single inverter you
> may run into issues if they do not all receive more or less the same homogeneous sunlight, either because of different orientation or because of
> differences in shadow. You also should not connect different panels from different manufacturers. Even panels from the same manufacturer and type
> may be problematic if they are not well standardized or if they have been produced in different batches. If you are interested in more details then
> I recommend <a href="https://www.amazon.de/Photovoltaics-Fundamentals-Technology-Konrad-Mertens/dp/1119401046">Photovoltaics: Fundamentals, Technology, and
> Practice</a> by Konrad Mertens.
>
> You won't have this problem with micro inverters where there is a single panel per connection to the inverter.
> </span>

In addition you can connect (micro-)inverters on the AC side. In principle you can do that with a simple multi-outlet power strip, but the inverters
are prepared to be connected on the AC side, too.

Actually, that's it, that is all you need. You connect the panels to the inverter and the inverter into the power plug and off you go.

When I selected the [Hoymiles HM-600](https://www.hoymiles.com/de/products/microinverter/single-phase) micro inverter I did not put too much thought into it:<br>
<img src="https://www.hoymiles.com/wp-content/uploads/2022/04/10003-7.png" alt="Hoymiles HM-600" style="max-height: 100px"><br>
In retrospect I have to say that this was a good choice because of several reasons:
- You can integrate it into [Home Assistant](https://www.home-assistant.io) via [OpenDTU](https://github.com/tbnobody/OpenDTU) or
  [AhoyDTU](https://github.com/lumapu/ahoy) out of the box. DTU stands for Data Transfer Unit and it is a "proxy" between the wireless protocol that
  the Hoymiles HM-600 inverters speak natively and WLAN/MQTT. Hoymiles sells [DTU](https://www.hoymiles.com/de/products/microinverter/dtu) units
  themselves but they are quite expensive:
  - For HMS, HMT: DTU-Pro-S or DTU-Lite-S
  - For MI, HM: DTU-WLite, DTU-Pro or DTU-W100/G100
- It was not affected by [RelaisGate](https://www.heise.de/news/Balkonkraftwerke-Fehlendes-Relais-bei-Deye-hat-weitere-Folgen-9218441.html), where
  some brand of micro inverters were missing a required relais.

I said above that I use the HM-600. In the meanwhile I have seen that there are also newer HMS-600 inverters available. While Hoymiles improved
several electrical characteristics of those inverters like the voltage range and the current limit they also changed other (non-obvious) factors like:
- The wireless protocol and frequency: before, with the HM-series it was the 2.4 GHz spectrum and now, with the HMS and HMT series it is sub 1-GHz
  spectrum.
  - There is an updated version of OpenDTU for the HMS and HMT series, but it needs a different RF module that is more difficult to connect to a ESP32.
- The AC connectivity: before, with the HM-series it was a [Betteri BC01](http://www.betteri.cn/English/Product/9401672326.html), with the HMS series
  it is a [Betteri BC05](https://www.ebay.de/itm/334654750946) and with the HMT series it is a [Betteri BC06](https://www.ebay.de/itm/275732275382).

## Shadow

Originally, I put two solar tables on our balcony. The balcony is roughly 3.5 meters by 2.0 meters and it is roughly oriented southwards. In the below
picture the balcony area is gray, the first panel is yellow and the second panel is green:<br>
<a href="/img/photovoltaics-bps-original-panel-orientation.png" target="about:blank"><img src="/img/photovoltaics-bps-original-panel-orientation.png" alt="Original Panel Orientation" style="max-height: 200px"></a>

In retrospect it sounds stupid, but at the time I did not consider the shadow that the balcony from our neighbours above us would cast onto our
balcony. In addition, I did not have an intuition about the very non-linear effect size that shadow would have on my solar power production. I have to
say, how happy I am that I started small scale on our balcony, where I can observe in detail and develop that intuition. Imagine, you would have your
solar power generator on your roof and have long strings of solar panels. If you then have partial shadow, like from a chimney, I am certain that you
would not be able to easily develop that intuition and account your drop in power production to that "little bit of shadow".

In the meanwhile I have re-arringed things and put one panel vertically to the outside of our balcony[^eigentuemerversammlung] but left one panel as a
solar table with different orientation:<br>
<a href="/img/photovoltaics-bps-new-panel-orientation.png" target="about:blank"><img src="/img/photovoltaics-bps-new-panel-orientation.png" alt="Original Panel Orientation" style="max-height: 200px"></a>

Below, you can see the solar power production of this solar table on a very sunny day:<br>
<a href="/img/photovoltaics-bps-shadow-power-effect.png" target="about:blank"><img src="/img/photovoltaics-bps-shadow-power-effect.png" alt="Shadow Power Effect" style="max-height: 100px"></a>

As a comparison I calculated the [pvlib clear sky](https://pvlib-python.readthedocs.io/en/stable/reference/clearsky.html) simulation[^pvlib]:<br>
<a href="/img/photovoltaics-bps-clearsky.png" target="about:blank"><img src="/img/photovoltaics-bps-clearsky.png" alt="PVLib Clear Sky" style="max-height: 100px"></a>

And here you can see from left to right in brown the shadow at 12:50, 13:00, 13:45, 14:20 and 15:40:<br>
<a href="/img/photovoltaics-bps-shadow-sequence.png" target="about:blank"><img src="/img/photovoltaics-bps-shadow-sequence.png" alt="Shadow Sequence" style="max-height: 200px"></a>

You should notice that at 12:50 the shadow just does not touch the panel yet and the panel produces its "full sun" power level at a bit more than 250
watt. At 13:00 the shadow starts to touch the panel and you immediately see the power going down due to this tiny bit of shadow. This continues until
13:45 where the shadow effect is most severe. From the 250 W that are possible only 20 W are produced, e.g. less than 10%! Then suddenly at around
14:15/14:20 the shadow effect is alleviated to a large degree, once the shadow moves across the middle line of the module. Finally at around 15:40 the shadow
leaves the panel and the panel is back to its "full sun" power level[^othershadow].

The real DC power production from this panel that day as measured by the inverter was 1566 Wh. The clear sky model would have predicted 2223
Wh. Without the shadow from the balkony above we could have increased our yield by 42%. That is **A LOT**!

### Bypass Diodes

The typical picture for bypass diodes looks as follows:<br>
<a href="https://www.mdpi.com/1996-1073/13/10/2472" target="about:blank"><img src="https://www.mdpi.com/energies/energies-13-02472/article_deploy/html/images/energies-13-02472-g003-550.jpg" alt="Bypass Diodes" style="max-height: 200px"></a>

They are supposed to run across the short side of the panel, so that if there is a shadow at one side of the long side then you should only lose 33%
of the performance. Obviously, for my panel, this is not the case, as the tiniest shadow on the long side has severe effects on the performance and it
even drops to below 10% performance. Therefore, I guess, the bypass diodes in my panel are located differently. I tried to find information in the
data-sheet, but without luck.

**Towel** to the rescue: the easiest way to check what your solar panel is doing under the influence of shadow is to just put a towel across certain
sections of your panel on a sunny day and see what it does. A towel is ideal, because it is large enough to cover the panel completely and by folding
it you can easily reduce the size to simulate smaller shadows.

If you want to learn more about bypass diodes then have a look at: [Bypass-Diode in a Solar Panel explained.](https://www.youtube.com/watch?v=ZAZSkZgVROI)

### Half Cell Panel Design

In retrospect, I understand that a solar panel in half-cell design might have helped. The typical picture for bypass diodes in half-cell panels looks as follows:<br>
<a href="https://ornatesolar.com/blog/why-should-you-choose-half-cut-cell-modules-for-your-solar-projects" target="about:blank"><img src="https://ornatesolar.com/wp-content/uploads/2022/03/2-1.jpg" alt="Bypass Diodes in Half-Cell Modules" style="max-height: 200px"></a>

And here is a YouTube video explaining the [Half Cell VS. Full Cell Solar Panel Design](https://www.youtube.com/watch?v=JziP-RKDm4Y).


> <span style="font-size:smaller">
> And an additonal note: a glass-glass <a href="https://en.wikipedia.org/wiki/Bifacial_solar_cells">bifacial</a> panel might have been best to also gather light from the back of the panel. As the panel is above the
> balcony floor and the balcony floor has a light color there will be diffuse light shining at the panel from its backside and helping generate solar
> power.
> </span>

## Jupyter Notebook Simulations

If you'd like to perform similar situations then you can find the python code and jupyter notebook here:

* [nbviewer](https://nbviewer.org/gist/cs224/fd467ca51dba98d3c25636bc312017f9/pv-modules-on-balkony.ipynb) / [gist](https://gist.github.com/cs224/fd467ca51dba98d3c25636bc312017f9#file-pv-modules-on-balkony-ipynb)

## Conclusion

I hope that I was able to help you develop some intuition about the magnitude of the shadow effect on solar power generators in general, but on
balcony power stations in particular. In short you could summarize the learnings from this blog post as "Schatten ist Scheiße" (shadow is crap)!

## Footnotes

[^solarmodulepanel]: Solar panel and/or solar module seem to be used interchangeably.
[^solartablevideo]: [Der Solartisch und die grüne Steckdose](https://www.youtube.com/watch?v=appyI36bbSs)
[^eigentuemerversammlung]: I successfully used my chance in our 2023 community of owners assembly (Eigentümerversammlung) to ask for permission to
    mount the solar panels to the outside of our balcony.
[^pvlib]: To learn pvlib I suggest the video series [pvlib python](https://www.youtube.com/playlist?list=PLK7k_QaEmaHsPk_mwzneTE2VTNCpYBiky) by Sascha Birk.
[^othershadow]: If you look carefully you will notice that we are not back at the "full sun" level as predicted by the clearsky model. There is
    another shadow that I do not discuss here.
