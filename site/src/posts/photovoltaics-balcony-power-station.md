---
layout: "layouts/post.njk"
title: "Photovoltaics: Balcony Power Station (Balkonkraftwerk)"
description: "My experiences along the way of building and operating a balcony power station."
creationdate: 2023-08-08T12:48:00+02:00
date: 2023-08-08T12:48:00+02:00
keywords: photovoltaics, balkonkraftwerk, balcony-power-station
tags: ['post']
---

## Rational

- solartisch
- lack of standards: thickness
- bulkyness
- panel types: glass-foil, glass-glass, half-cell, bifacial, flexible light, ...
- power inverter: hoymiles, opendtu, hm and hms series, betteri bc01 bc05 ...
- effect of shadow
- shadow simulations

I like to grow into topics from small to large, from simple to complex and step by step. My journey into the world of photovoltaics started last year
in 2022, when I learned that you are allowed to do everything yourself (without the need to hire a professional electrician or similar) around a small
photovoltaics system as long as you do not exceed 600 W power production on the AC side. In Germany these small power stations have different names,
but most often they are called Balkonkraftwerk (balcony power station) even if they are not operated on a balcony at all. From that moment on I
started to read, watch YouTube videos, visit local hobbyist groups and anything else that helped me to understand the topic of photovoltaics.

The below blog post summarizes my journey so far.

## Solar Table (Solartisch)

I live in an appartment that I own in the first floor with a balcony direction south-west. One of the first things I learned around a balcony power
station was that if you want to mount the solar panels/modules to the outside of the balcony you have to ask the community of owners
(Eigentümergemeinschaft) for permission. And for that you have basically only one chance per year in the community of owners assembly
(Eigentümerversammlung). End of last year, when I started to take this project more serious, my one chance for 2022 had already passed. In general, a
good help, was the document [Balkonkraftwerke in der Eigentumswohnung](https://machdeinenstrom.de/balkonkraftwerke-in-der-eigentumswohnung). It also
inspired me to circumvent the whole topic of asking for permission by building a solar table (Solartisch) as every owner of an appartment is free in
the layout and design of their balcony and what they put on it.

At that time I came across the [Heise](https://www.heise.de) article [Strom selbst erzeugen: Wie Sie einen Solartisch
bauen](https://www.heise.de/ratgeber/Strom-selbst-erzeugen-Wie-Sie-einen-Solartisch-bauen-7188750.html?seite=all)[^solartablevideo], which explained how to build a
solar table yourself. For someone like me, who is not a skilled wood worker, the topic sounded too complex and I decided to go with two [STIER Falt
Arbeitsbock](https://www.amazon.de/gp/product/B07WLC47S9) for 36,81€ each, together with a simpler wood construction on top of it:

<a href="/img/stier-panel-under-construction-01.png" target="about:blank"><img src="/img/stier-panel-under-construction-01.png" alt="Stier Panel Under Construction" style="max-height: 100px"></a><a href="/img/stier-panel-under-construction-02.png" target="about:blank"><img src="/img/stier-panel-under-construction-02.png" alt="Stier Panel Under Construction With Panel" style="max-height: 100px"></a>

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

## Footnotes

[^solartablevideo]: [Der Solartisch und die grüne Steckdose](https://www.youtube.com/watch?v=appyI36bbSs)

