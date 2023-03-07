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

### The Ecowitt WS2910 868MHz weather station

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
