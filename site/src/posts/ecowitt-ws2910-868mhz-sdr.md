---
layout: "layouts/post-with-toc.njk"
title: "Ecowitt WS2910 868MHz weather station and Software Defined Radio (SDR)"
description: "How to receive and decode the data transmitted by weather stations and other radio frequency home devices base on my experience with a Ecowitt WS2910 868MHz (Frequency Shift Keying (FSK)) weather station and rtl_433 via OpenMQTTGateway (TTGO LoRa32 V2.1 _ 1,6)."
creationdate: 2023-03-07
keywords: ecowitt,we2910,868mhz,frequency-shift-keying,fsk,openmqttgateway,rtl_433,sdr,software-defined-radio,esp32
date: 2023-03-07
tags: ['post']
draft: true
---

## Rational

For a long time I was interested in understanding how data is transmitted "over-the-air" via radio frequency transmissions. Recently, I bought a
868MHz weather station from Ecowitt, which presented the chance to dig deeper.<br>
**A little caveat upfront**: I was not completely successful and this is a sort of intermediate report.

### Before we start ...

I'd like to point out that while this blog post is written in English, some of the referenced material will be in German. You may be able to work around this issue if you don't speak German 
via Google translate or similar services.

### The Ecowitt WS2910 868MHz weather station

The whole journey started with the following video on YouTube: [WLAN Wetterstation von ecowitt](https://www.youtube.com/watch?v=jgyqSV-op9M). I always wanted to have a wether station to track long term
characteristics like yearly rainfall or the number of warm summer days per year. After watching the video I bought[^ecowittamazon] and installed it. It came along with a receiver-display that also acted
as WLAN bridge.

In case that you are also thinking about buying such a weather station I'd recommend that you first have a look at the very good overview of Ecowitt weather stations at [Ecowitt Wetterstationen](https://www.wetterstationsforum.info/wiki/doku.php?id=wiki:wetterstationen:ecowitt-stationen).

I learned how to integrate my weather station from the YouTube video [Ecowitt Wetterstation Wittboy GW2001 in Home Assistant nutzen](https://www.youtube.com/watch?v=IFuv-qcYegU). While the video talks about
the Wittboy wether station the steps for my weather station were basically the same.

### Software Defined Radio (SDR)

Once I had the weather station another long standing question popped into my head. How do these radio frequency devices actually communicate with their receivers. At that point I really did not know anything
about how data trnasfer via radio frequencies works and had a difficult time finding my way into the topic. While there are many resources out there, many of them are old and very few provide a "linear" access
to the topic. Most of them are written from a point of view that you know already a lot and they only focus on certain aspects that they tried to solve.

One piece of information in advance: the weather station communicates unidirectional and unencrypted like a radio station. This means that if you live in a neighbourhood where someone else already has a weather
station you potentially do not need to buy one for yourself and can just participate by consuming the radio data packets. How to do that will be explained below in the rest of the blog post.

Initially I tried to do without a deeper understanding and tried by just "hacking" my way forward, but in retrospect I have to say that it would have been a much better approach to start with tackling 
the complexities upfront head on rather than trying to avoid them and then stumble along with only half knowlege. Therefore, I'd **strongly** recommend that you start by reading **all** of [PySDR](https://pysdr.org/) 
from start to finish! The author, [Dr. Marc Lichtman](https://pysdr.org/content/about_author.html), did a really great job explaining the details in an understandable way with Python code.

> <span style="font-size: smaller;"> Just as a side remark: I was always wondering how you can sample a radio signal at (for example) 1MHz while it is transmitting at for example 868MHz. The 
> [Nyquist–Shannon sampling theorem](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem) says that you have to sample at double the frequency of the signal that interests you 
> (e.g. you should need to sample at 2 x 868MHz). Dr. Marc Lichtman answered my question in the [Receiver Architectures](https://pysdr.org/content/sampling.html#receiver-architectures) section and 
> the "baseband" transformation.

## Further References

* [WLAN Wetterstation von ecowitt](https://www.youtube.com/watch?v=jgyqSV-op9M)
  * [Ecowitt Wetterstation mit WLAN, professionelle digitale Wettervorhersagestation mit großem Farbdisplay, 7-in-1-Sensor, solarbetrieben, für den Innenbereich, 3-in-1, integrierter Sensor, WS2910](https://www.amazon.de/dp/B0991GVBYK)
  * [Ecowitt Wetterstationen](https://www.wetterstationsforum.info/wiki/doku.php?id=wiki:wetterstationen:ecowitt-stationen)
  * [weewx](https://www.weewx.com/)
  * [Ecowitt Wetterstation Wittboy GW2001 in Home Assistant nutzen](https://www.youtube.com/watch?v=IFuv-qcYegU)
  * [ecowitt.net](https://www.ecowitt.net/)
* [Funkwetterstationen abhören und decodieren RTL 433](https://www.youtube.com/watch?v=ACYcoJXlvmQ)

* [OpenMQTTGateway Connects Many Things to Your Home Automation](https://www.youtube.com/watch?v=_gdXR1uklaY)
* [rtl_433](https://github.com/merbanan/rtl_433)
* [rtl_433_ESP](https://github.com/NorthernMan54/rtl_433_ESP)
* [OpenMQTTGateway](https://github.com/1technophile/OpenMQTTGateway)
* [TTGO LoRa32 V2.1 _ 1,6 Version 433/868/915 Mhz ESP32 LoRa](https://de.aliexpress.com/item/32872078587.html)

* [How to Hack your 433 MHz Devices with a Raspberry and a RTL-SDR Dongle (Weather Station)](https://www.youtube.com/watch?v=L0fSEbGEY-Q)
  * [Universal Radio Hacker (URH)](https://github.com/jopohl/urh)
* [Convert Radio Waves to Bits (RF Demodulation)](https://www.youtube.com/watch?v=DvLgnV9X94k)
  * [inspectrum](https://github.com/miek/inspectrum)
* [Reverse Engineering a 433MHz RF Protocol - Home Assistant Conference 2020](https://www.youtube.com/watch?v=thBN3yP6kbw)
* [PySDR](https://pysdr.org/)

* [BitBastelei #310 - VSCode und PlatformIO statt Arduino IDE](https://www.youtube.com/watch?v=Yb-HOBynJdc)
  * [platformio](https://platformio.org/)
* [wokwi](https://wokwi.com/)
  * [Wokwi/featured](https://www.youtube.com/c/Wokwi/featured)


* [Nooelec RTL-SDR v5 SDR - NESDR](https://www.amazon.de/dp/B01HA642SW)
* https://www.nooelec.com/store/qs
* http://start.nesdr.com
* [Nooelec RaTLSnake M6 v2 - Premium 3-Antennen-Bundle für NESDR](https://www.amazon.de/dp/B073JWDXMG)
* [USB 2,0 Digital DVB-T SDR + DAB + FM TV Tuner Receiver Stick RTL2832U + FC0012](https://de.aliexpress.com/item/1005002181497577.html)
* [Eigene Wetterstation per SDR auslesen](https://workpress.plattform32.de/2021/08/eigene-wetterstation-per-sdr-auslesen/)
* https://www.instructables.com/Remote-Control-of-a-Raspberry-Pi-SDR-Over-a-Networ/
* https://github.com/AlexandreRouma/SDRPlusPlus
* [Wetterdaten via SDR auslesen](https://www.linux-magazin.de/ausgaben/2014/01/software-defined-radio/)
* [Lauschposten: Raspi als Funkempfänger-Server, SDR, Software Defined Radio](https://www.heise.de/select/ct/2019/23/1573229198652108)

## Footnotes

[^ecowittamazon]: [Ecowitt Wetterstation mit WLAN, professionelle digitale Wettervorhersagestation mit großem Farbdisplay, 7-in-1-Sensor, solarbetrieben, für den Innenbereich, 3-in-1, integrierter Sensor, WS2910](https://www.amazon.de/dp/B0991GVBYK)
