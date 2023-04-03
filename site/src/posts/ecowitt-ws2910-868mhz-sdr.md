---
layout: "layouts/post-with-toc.njk"
title: "Ecowitt WS2910 868MHz weather station and Software Defined Radio (SDR)"
description: "How to receive and decode the data transmitted by weather stations and other radio frequency home devices base on my experience with a Ecowitt WS2910 868MHz (Frequency Shift Keying (FSK)) weather station and rtl_433 via OpenMQTTGateway (TTGO LoRa32 V2.1 _ 1,6)."
creationdate: 2023-03-15
keywords: ecowitt,ws2910,868mhz,frequency-shift-keying,fsk,openmqttgateway,rtl_433,sdr,software-defined-radio,esp32
date: 2023-03-15
tags: ['post']
draft: false
---

## Rational

For a long time, I was interested in understanding how data is transmitted "over-the-air" via radio frequency transmissions. Recently, I bought a
868MHz weather station from Ecowitt, which presented the chance to dig deeper.<br>
**A little caveat upfront**: I was not completely successful and this is a sort of intermediate report.

### Before we start ...

I'd like to point out that while this blog post is written in English, some of the referenced material will be in German. You may be able to work
around this issue if you don't speak German via Google translate or similar services.

### The Ecowitt WS2910 868MHz weather station

The whole journey started with the following video on YouTube: [WLAN Wetterstation von ecowitt](https://www.youtube.com/watch?v=jgyqSV-op9M). I always
wanted to have a weather station to track long term characteristics like yearly rainfall or the number of warm summer days per year. After watching the
video, I bought[^ecowittamazon] and installed it. It came along with a receiver-display that also acted as WLAN bridge.

In case that you are also thinking about buying such a weather station I'd recommend that you first have a look at the very good overview of Ecowitt
weather stations at [Ecowitt Wetterstationen](https://www.wetterstationsforum.info/wiki/doku.php?id=wiki:wetterstationen:ecowitt-stationen).

I learned how to integrate my weather station into [Home Assistant](https://www.home-assistant.io/) from the YouTube video [Ecowitt Wetterstation
Wittboy GW2001 in Home Assistant nutzen](https://www.youtube.com/watch?v=IFuv-qcYegU). While the video talks about the Wittboy weather station the
steps for my weather station were basically the same.

In the video [WLAN Wetterstation von ecowitt](https://www.youtube.com/watch?v=jgyqSV-op9M) the software [weewx](https://www.weewx.com/) was mentioned:
"Open source software for your weather station". I put it on my TODO list to try it out one day ...

### Software Defined Radio (SDR)

Once I had the weather station, I remembered another long standing question: How do these radio frequency devices actually communicate over the air
with their receivers. At that point I really did not know anything about how data transfer via radio frequencies works and had a difficult time
finding my way into the topic. While there are many resources out there, many of them are old and very few provide a "linear" access to the
topic. Most of them are written from a point of view where you already know a lot and they only focus on certain aspects that they try to solve.

One piece of information in advance: the weather station communicates unidirectional and unencrypted like a radio station. This means that if you live
in a neighbourhood where someone else already has a weather station you probably do not need to buy one for yourself and can just participate by
consuming the radio data packets. How to do that will be explained below in the rest of the blog post.

Initially I tried to do without a deeper understanding and tried by just "hacking" my way forward. But in retrospect it would have been a much better
approach to start with tackling the complexities upfront, "head on", rather than trying to avoid them and then stumble along with only half
knowledge. Therefore, I'd **strongly** recommend that you start by reading **all** of [PySDR](https://pysdr.org/) from start to finish! The author,
[Dr. Marc Lichtman](https://pysdr.org/content/about_author.html), did a really great job explaining the details in an understandable way with Python
code.

> <span style="font-size: smaller;"> Just as a side remark: I was always wondering how you can sample a radio signal at (for example) 1MHz while it is transmitting at for example 868MHz. The
> [Nyquist–Shannon sampling theorem](https://en.wikipedia.org/wiki/Nyquist%E2%80%93Shannon_sampling_theorem) says that you have to sample at double the frequency of the signal that interests you
> (e.g. you should need to sample at 2 x 868MHz). Dr. Marc Lichtman answered my question in the [Receiver Architectures](https://pysdr.org/content/sampling.html#receiver-architectures) section and
> the "baseband" transformation.
> </span>

### SDR Equipment

In order to work with radio frequencies on a computer you will need hardware that is able to receive and digitize those signals.

I bought:
* [Nooelec RTL-SDR v5 SDR - NESDR](https://www.amazon.de/dp/B01HA642SW)
* [Nooelec RaTLSnake M6 v2 - Premium 3-Antennen-Bundle für NESDR](https://www.amazon.de/dp/B073JWDXMG)

You can read about how to install the driver for your operating system at http://start.nesdr.com

I also bought:
* [USB 2,0 Digital DVB-T SDR + DAB + FM TV Tuner Receiver Stick RTL2832U + FC0012](https://de.aliexpress.com/item/1005002181497577.html)

This is much cheaper, but wait before you go ahead and buy it and first read below.

Once you have the hardware you will also need software. I am an absolute beginner in this, but for me
[SDR++](https://github.com/AlexandreRouma/SDRPlusPlus) worked well on Linux and on Windows. It helps to watch a few videos, which show how experts work
with SDR++. I watched a couple videos from the channel of [Manuel Lausmann](https://www.youtube.com/@ManuelLausmann-Funktechnik). Just search for
`SDR++`.

The first step for you should be to try to listen to radio stations and see if you can get your hardware and SDR++ to work together correctly.

### Digital Signals via SDR and rtl_433

The final goal will be to receive data via radio frequency signals. The following video from the above mentioned Manuel Lausmann shows how digital signals
will look like in SDR++: [Funkwetterstationen abhören und decodieren RTL 433](https://www.youtube.com/watch?v=ACYcoJXlvmQ). It also talks about the
tool `rtl_433` that I have found to work best for receiving digital signals via Software Defined Radio:
[rtl_433](https://github.com/merbanan/rtl_433).

But before we go there, I suggest you watch the following videos to understand better what `rtl_433` does internally:
* [How to Hack your 433 MHz Devices with a Raspberry and a RTL-SDR Dongle (Weather Station)](https://www.youtube.com/watch?v=L0fSEbGEY-Q)
  * [Universal Radio Hacker (URH)](https://github.com/jopohl/urh)
* [Convert Radio Waves to Bits (RF Demodulation)](https://www.youtube.com/watch?v=DvLgnV9X94k)
  * [inspectrum](https://github.com/miek/inspectrum)
* [Reverse Engineering a 433MHz RF Protocol - Home Assistant Conference 2020](https://www.youtube.com/watch?v=thBN3yP6kbw)

Once you've watched those videos and ideally have read [PySDR](https://pysdr.org/) you should have a good idea of what `rtl_433` does and how it
works. I run it as:

    > rtl_433 -f 868M -s 1024k # Listen at 868 MHz and 1024k sample rate.

`rtl_433` worked out of the box with the Nooelec receiver and my weather station. I could not make it work with the cheap RTL2832U device from
Aliexpress, though. I still do not know why. The signal strength and antenna should not be the issue, because I was both times close to the weather
station. If anyone has an idea on how to resolve this problem or at least debug it to get closer to the root cause then please let me know (use the
comments section below).

### OpenMQTTGateway on an ESP32 / TTGO LoRa32

The hardware required to read digital signals transmitted via radio frequency is quite expensive. You have to have an SDR dongle, an antenna and a
compute device like a Raspberry Pi. Then, by accident, I saw the video [OpenMQTTGateway Connects Many Things to Your Home
Automation](https://www.youtube.com/watch?v=_gdXR1uklaY) from Andreas Spiess. It looked so nice and so simple that I immediately ordered such a [TTGO
LoRa32 V2.1 _ 1,6 Version 433/868/915 Mhz ESP32 LoRa](https://de.aliexpress.com/item/32872078587.html) device for 868 MHz.

The software that enables the processing of radio frequency digital signals is [rtl_433_ESP](https://github.com/NorthernMan54/rtl_433_ESP), a port of
the `rtl_433` for the ESP32. The code of `rtl_433_ESP` is referenced in [OpenMQTTGateway](https://github.com/1technophile/OpenMQTTGateway) as a
library.

The first question I had was how to adapt the radio frequency from 433 MHz as used in the video from Andreas Spiess to 868 MHz as needed by my weather
station. I did not find any documentation about that and had to start working with the code directly.

#### PlatformIO

`OpenMQTTGateway` is a [PlatformIO](https://platformio.org/) project. `PlatformIO` is a development environment for MCU (Micro Controller Unit) boards
like the ESP8266 and the ESP32. I learned the first steps how to use it via the video [BitBastelei #310 - VSCode und PlatformIO statt Arduino
IDE](https://www.youtube.com/watch?v=Yb-HOBynJdc). Even if you do not have an ESP8266 or an ESP32 device you can start playing around via the
[wokwi](https://wokwi.com/) simulator. Also have a look at [Wokwi/featured](https://www.youtube.com/c/Wokwi/featured) to get an idea on what it can do
for you. I will not go into further details about `PlatformIO`, but in order to be able to use it you should spend more time with it. At its core it
is a build system like [CMake](https://en.wikipedia.org/wiki/CMake) or the [GNU Autotools](https://en.wikipedia.org/wiki/GNU_Autotools) and in order
to get proficient you will need to spend more time learning its intricacies.

The main configuration file for `PlatformIO` is `platformio.ini`. You can either start working in this file directly, but the authors of
`OpenMQTTGateway` recommend that you create a separate file `XXX_env.ini` and put all your specific configuration options there. Then `PlatformIO`
picks up the configuration from there. I am not sure if this is standard behaviour of `PlatformIO`, but I guess not, because in the `platformio.ini`
you find the following configuration:

```ini
[platformio]
...
extra_configs =
  environments.ini
  tests/*_env.ini
  *_env.ini
```

Which to me indicates that the `*_env.ini` part is responsible for this behaviour. Anyhow, I created a `868mhz_env.ini` file with the following
content:

```ini
[platformio]
default_envs = lilygo-rtl_433-868mhz

[env:lilygo-rtl_433-868mhz]
extends = env:lilygo-rtl_433
build_flags =
  ${com-esp.build_flags}
; *** OpenMQTTGateway Config ***
  ;'-UZmqttDiscovery'          ; disables MQTT Discovery
  '-DvalueAsATopic=true'       ; MQTT topic includes model and device
  '-DGateway_Name="OpenMQTTGateway_lilygo_rtl_433_ESP"'
; *** OpenMQTTGateway Modules ***
  '-DZgatewayRTL_433="rtl_433"'
  '-DZradioSX127x="SX127x"'
; *** ssd1306 Display Options ***
  '-DZdisplaySSD1306="LilyGo_SSD1306"'
;  '-DLOG_TO_LCD=true'         ; Enable log to LCD
;  '-DJSON_TO_LCD=true'
;  '-DLOG_LEVEL_LCD=LOG_LEVEL_NOTICE'
;  '-DDISPLAY_IDLE_LOGO=false'
;  '-DDISPLAY_METRIC=false'
  '-DCC1101_FREQUENCY=868.00'
  '-DESPWifiManualSetup=true'
  '-Dwifi_ssid="mywifissid"'
  '-Dwifi_password="mypasswd"'
  '-DMQTT_SERVER="192.168.0.5"'
  '-DMQTT_USER="mymqttuser"'
  '-DMQTT_PASS="mymqttpasswd"'
  '-DMQTT_PORT="1883"'
  '-DBase_Topic="rtl433esp/"'
  '-DOMG_VERSION="v1.4.0-20230302"'
  '-DLOG_LEVEL=LOG_LEVEL_TRACE'
  '-DMEMORY_DEBUG=true'
  '-DDEMOD_DEBUG=true'
  '-DRTL_DEBUG=4'              ; rtl_433 verbose mode
```

The one important part is `DCC1101_FREQUENCY=868.00` to set the frequency to 868 MHz rather than the standard 433 MHz. It turns out that you can
adapt this frequency at runtime by writing to the mqtt topic `rtl433esp/OpenMQTTGateway_lilygo_rtl_433_ESP/commands/MQTTtoRTL_433` a json value like
`{"mhz":868}`. Be aware that the mqtt topic is specific to my setup as I have also set `DBase_Topic="rtl433esp/"` and
`DGateway_Name="OpenMQTTGateway_lilygo_rtl_433_ESP"`.

The other part that helped tremendously during adapting the code was the bottom of the configuration
```ini
  '-DLOG_LEVEL=LOG_LEVEL_TRACE'
  '-DMEMORY_DEBUG=true'
  '-DDEMOD_DEBUG=true'
  '-DRTL_DEBUG=4'           ; rtl_433 verbose mode
```
Which increases the debug output you can get on the `PlatformIO` console when the MCU is connected to your computer.

#### OpenMQTTGateway / rtl_433_ESP and Frequency Shift Keying (FSK)

It turns out that [OpenMQTTGateway](https://github.com/1technophile/OpenMQTTGateway) or rather [rtl_433_ESP](https://github.com/NorthernMan54/rtl_433_ESP) does only support
 * `PPM`: Pulse Position Modulation
 * `OOK_PWM`: Pulse Width Modulation
 * `OOK_PULSE_MANCHESTER_ZEROBIT`: Pulse Manchester Zero Bit

But it does not support [Frequency Shift Keying (FSK)](https://pysdr.org/content/digital_modulation.html#frequency-shift-keying-fsk), which my device
is using. You can find out the details of your device by using [rtl_433](https://github.com/merbanan/rtl_433) on your PC. Its output tells you quite a
lot about your device. I was trying to make my device work with `rtl_433_ESP` but failed, because I know too little about how this `SX127x` chip on
the `TTGO LoRa32` is working and how to deal with `PlatformIO` and ESP32 development. But recently, there has been a
[message](https://github.com/NorthernMan54/rtl_433_ESP/issues/5#issuecomment-1461958430) on the `rtl_433_ESP` issue tracker from
[cartwrightian](https://github.com/cartwrightian) that he managed to get `FSK` working for one of his devices.

> <span style="font-size: smaller;">
> I have FSK working with a current cost energy monitoring device at 433 with FSK pulse PCM using a lilygo TTGO LORA32 V2.0. As noted elsewhere seems the sx1278 can either be in OOK or FSK mode, as I just needed to get things working with this one device this was not a problem for me.
>
> The fork is here in case it's useful for anyone else looking at FSK reception https://github.com/cartwrightian/rtl_433_ESP_ic
> </span>

I will stop this blog post here but later perhaps pick up this story again to see if I can make my weather station work together with
`OpenMQTTGateway`. I know this is a bit unsatisfactory, but I have spent quite a lot of time already to get to this point and need to take care of
other things in my life right now.

## Further References

* [Lauschposten: Raspi als Funkempfänger-Server, SDR, Software Defined Radio](https://www.heise.de/select/ct/2019/23/1573229198652108)
* [Eigene Wetterstation per SDR auslesen](https://workpress.plattform32.de/2021/08/eigene-wetterstation-per-sdr-auslesen/)
* [Remote Control of a Raspberry Pi SDR Over a Network](https://www.instructables.com/Remote-Control-of-a-Raspberry-Pi-SDR-Over-a-Networ/)
* [Wetterdaten via SDR auslesen](https://www.linux-magazin.de/ausgaben/2014/01/software-defined-radio/)

## Footnotes

[^ecowittamazon]: [Ecowitt Wetterstation mit WLAN, professionelle digitale Wettervorhersagestation mit großem Farbdisplay, 7-in-1-Sensor, solarbetrieben, für den Innenbereich, 3-in-1, integrierter Sensor, WS2910](https://www.amazon.de/dp/B0991GVBYK)
