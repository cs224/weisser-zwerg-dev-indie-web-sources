---
layout: "layouts/post-with-toc.njk"
title: "Thin Clients as Home Servers: Dell Wyse 5060 and Fujitsu Futro S920: an Experience Report"
description: "If you are looking for a cheap and power saving home server then a used thin client like a Dell Wyse or a Fujitsu Futro might fit your bill."
creationdate: 2022-10-15
keywords: thin-client,dell,wyse,fujitsu,futro,linux,ubuntu,home-server,low-power
date: 2022-10-15
tags: ['post']
---

## Rational

After my experiments with the [ODROID-M1](../odroid-m1) I was talking to some people in my network about the difficulty to get hands on a Raspberry Pi
at the moment and about my experience with the ODROID-M1. One of them mentioned the option to buy an old used thin client like a Dell Wyse or a
Fujitsu Futro and that this might even be cheaper than a new Raspberry Pi 4. I started to look around and watch some YouTube videos about it and
finally decided to give it a try. Below you will find my experience report.

### Picture

A Dell Wyse 5060 and Fujitsu Futro S920 side by side:

<img src="/img/dell-wyse-5060-fujitsu-futro-s920.jpg" alt="Dell Wyse 5060 and Fujitsu Futro S920 side by side" style="max-width: 100%">

### Disclaimer

I am really not a hardware person. Please keep that in mind when you read the below. I made several mistakes in buying things that I did not need and
will also talk about those mistakes. I hope that my story will help others in the future.

## Parts and Costs

Here is my part list:

| Component                        | Detail                                                                            | Price (inkl. Shipping) | Link                                                                                                                                     |
|----------------------------------|-----------------------------------------------------------------------------------|-----------------------:|------------------------------------------------------------------------------------------------------------------------------------------|
| Thin Client                      | Dell Wyse 5060 Thin Client AMD GX-424CC 2.4GHz CPU 4GB RAM USB 3.0 8GB SSD Flash  |                43.89 € | &nbsp;[piospartslap.de](https://www.piospartslap.de/Dell-Wyse-5060-Thin-Client-AMD-GX-424CC-24GHz-CPU-4GB-RAM-USB-30-8GB-SSD-Flash)      |
| Thin Client                      | Fujitsu Futro S920 ThinClient AMD 2.20GHz CPU 4GB RAM 8GB SSD                     |                37.89 € | &nbsp;[piospartslap.de](https://www.piospartslap.de/Fujitsu-Futro-S920-ThinClient-AMD-220GHz-CPU-4GB-RAM-8GB-SSD-mit-Netzteil-ohne-Fuss) |
| Ram (for Wyse)                   | Rasalas 8GB                                                                       |                26.89 € | &nbsp;[amazon](https://www.amazon.de/gp/product/B09TW2HKKG/)                                                                             |
| SSD Disk (for Wyse)&nbsp;&nbsp;  | WD Green SATA SSD interne SSD 1 TB                                                |                92.95 € | &nbsp;[amazon](https://www.amazon.de/gp/product/B09JQMGHDW)                                                                              |
| SSD Disk (for Futro)&nbsp;&nbsp; | YUCUN MSATA III Interne Solid State Drive 256GB SSD                               |                27.99 € | &nbsp;[amazon](https://www.amazon.de/gp/product/B078J25DF1)                                                                              |
| WLAN                             | TP-Link Archer T3U Plus AC1300 High Gain USB WLAN Stick Adapter                   |                17.90 € | &nbsp;[amazon](https://www.amazon.de/gp/product/B0859M539M)                                                                              |
| Min./Max. Total                  |                                                                                   |     65.88 € / 181.63 € |                                                                                                                                    |

&nbsp;<br>
I've first bought the Dell Wyse. For the different parts I found the following YouTube Videos useful:

* To get an idea on how to install the 8GB of Ram I found the YouTube Video [Upgrading the Wyse Thin
  Client](https://www.youtube.com/watch?v=kLeIazRxlcI) useful.<br>In that video you also see the internal part of the WD Green SSD plugged into the
  main board, but you don't see how to "extract" it from its case.
* To get an idea how to open the plastic case of the WD Green SSD and how to extract the internal piece that you then plug into the main board of the
  Dell Wyse I found the video [Dell Wyse Dx0D 5010 SATA SSD DOM Upgrade](https://www.youtube.com/watch?v=fcPy41ed3XE) very useful. When I extracted
  the part from the case I broke the plastic case. It is quite hard to open it.
* In the video [Was it wise to buy the Wyse? Dell Wyse review and upgrades!](https://www.youtube.com/watch?v=oy6g3zaD4Jc) you see a different Dell
  Wyse model, but the video was quite instructional, too.

After my successes with the Dell Wyse I got more adventurous and decided to buy a Fujitsu Futro, too. I simply used the 4 GB of Ram that were
originally in the Dell Wyse and added them to the Fujitsu Futro to have 8GB of Ram in it, too. For the hard disk you can use an mSATA SSD, which
comes already in the right format to plug into the main board out of the box, e.g. you don't have to destroy a plastic case or anything for that. I
picked a smaller SSD though, because I don't plan to use it for data intensive applications.

Above I summarized the min and max costs, where the minimum is the Futro plus the 256 GB SSD, because you can operate it very well with only 4 GB of
RAM and a cable network connection, too. The maximum is the Wyse with the 8 GB of memory, the 1 TB SSD disk and the WLAN adapter. Even the maximum
cost is less then what I paid for my [ODROID-M1](../odroid-m1) (209.44 €).

### Off-Road

In the video [Raspberry Alternative? Hier kommt ein Dell Wyse 5010 - Dx0d](https://www.youtube.com/watch?v=Kpv2UbQRJf8) the author talks about the
option to plug in a network card into the main board. That comment led me quite a bit off-road:

1. Initially I bought the wrong Pci Express Mini card for 14.49 € : [WiFi Atheros AR9462 AR5B22 Mini
   PCI-E](https://www.amazon.de/gp/product/B07NBMCJZV). After that failed attempt I knew that the slot on the main board is not a PCIe mini slot, but
   an M.2 slot.
1. Then I bought a M.2 network card for 19.85 € : [Intel AC 8265 WLAN, M.2](https://www.amazon.de/gp/product/B01MZA1AB2). I was already wondering how
   an internal WLAN card should communicate to the outside world through basically a [Faraday cage](https://en.wikipedia.org/wiki/Faraday_cage). But I
   somehow assumed that there would be a magic connection to some antenna in the device to enable that communication. In retrospect I know that this
   is not the case. While the Linux on the device will detect the network card out of the box you will get a very bad connection even when the device
   is sitting directly next to the WLAN router.

And even my final choice of the TP-Link Archer USB WLAN adapter is far from being ideal. In retrospect I found out that it is not automatically
detected by the Ubuntu LTS 22.04 kernel. You have to follow the instructions [Proper way of installing wifi drivers
(rtl8822bu)](https://askubuntu.com/questions/1178802/proper-way-of-installing-wifi-drivers-rtl8822bu), which means checking out code from
[github](https://github.com/cilynx/rtl88x2bu) and building the kernel module via [DKMS](https://linuxhint.com/dkms-linux/). This is quite straight
forward, but I was expecting a more "out-of-the-box" experience with a USB adapter. You might want to look for another USB adapter that is supported
by the Linux kernel out-of-the-box.


## Benchmark

Here are the results of the [byte-unixbench](https://code.google.com/archive/p/byte-unixbench) and the measures idle power consumption.

| **Metric**                       | **Wyse 5060**    |       **Futro S920**  |       **ODROID M1**   |       **netcup**      |
|----------------------------------|-----------------:|----------------------:|----------------------:|----------------------:|
| UnixBench 5.1.3 (SC)[^sc]         |           526.90 |                470.20 |                467.50 |                647.30 |
| UnixBench 5.1.3 (MC)[^mc]         | (4 CPUs) 1338.60 | &nbsp;(2 CPUs) 834.70 | &nbsp;(4 CPUs) ???.?? | &nbsp;(2 CPUs) 991.40 |
| Idle Power Consumption (Watt)[^p] |             7.80 |                  7.80 |                < 4.50 |                       |
| Cost (€)                         |            98.77 |                 92.77 |                200.59 |                180.00 |
| TCO (€)                          | 98.77 + 102.49 = 201.26 | &nbsp;92.77 + 102.49 = 195.26 | &nbsp;200.59 + 32,85 = 233.44 |     180.00 |

&nbsp;<br> The Dell Wyse 5060 CPU is a [AMD GX-424CC](https://www.cpu-world.com/CPUs/Puma/AMD-G-Series%20GX-424CC.html) with 4 CPU cores. It has a
higher single core and then of course also a higher multi core benchmark result than the Fujitsu Futro S920. Also subjectively, when I worked on the Dell
Wyse 5060 via mouse and keyboard and GUI it felt much more fluent than working on the Futro S920.

The Futro S920 CPU is a [AMD GX-222GC](https://www.cpu-world.com/CPUs/Puma/AMD-G-Series%20GX-222GC.html) with 2 CPU cores. Single core it seems to be
on-par with the ODROID M1. The ODROID M1 has 4 cores, though. Sadly the UnixBench 5.1.3 fails to deliver a result for the ODROID M1 in the multi core
scenario.

Both, the Dell Wyse 5060 and the Fujitsu Futro S920 have round about 7.8 Watt idle power consumption. I have seen values of 7.35 Watt, but also values
of 8.15 Watt. The most common value was around 7.8 Watt, though, for both systems.

As a comparison I added the ODROID M1 with a very low power consumption of 4.5 Watt with a very heavy computing load. I did not measure the idle power
consumption, but I assume 2.5 Watt.

As another comparison I added the netcup VPS, which is also a 2 CPU core system. It has the highest single core benchmark result, but in the multi
core scenario the Dell Wyse 5060 wins.

For the cost comparison I assumed 8 GB of Ram plus a 256 GB SSD disk. I did not include the WLAN adapter and also subtracted the cost of the WLAN
adapter for the ODROID M1. The netcup VPS has less disk space (40 GB), though. As the cost for the netcup I assumed 5 years of runtime.

Just as a reference, a Raspberry Pi 4 B (4 GB RAM) is 84.95 € (if you can buy one at all) without an SD Card (another 8.85 € for a 32 GB SD Card,
which is much smaller and slower than a 256 GB SSD). It has less compute power and is quite expensive compared with the thin clients.

For the total cost of ownership (TCO) calculation I added the power costs at 0.30 €/kWh for the idle power consumption for 5 years.

## Summary

All in all I would say that if you don't need a local system then the [netcup VPS](https://www.netcup.de/vserver/vps.php) at 2.99€/month might be the
best option with the least hassle.

If you need a local system to run [Home Assistant](https://www.home-assistant.io/) or something similar in your local environment then I'd say that
the Dell Wyse 5060 might be the best option. You get a quite powerful system with a low idle power consumption for a low price.

I would be interested in your experiences and opinions. Please leave a comment below.

### Docker Multi Arch Images

Just as a side remark, it might be another reason to prefer the x86 based thin client systems over the arm64 systems like the ODROID M1 or the
Raspberry Pi 4, because some docker images will only exist for the x86 based systems (e.g. the [timescale-ha
multiarch](https://github.com/timescale/timescaledb-docker-ha/issues/259) support is missing).

## Footnotes

[^sc]: Single Core
[^mc]: Multi Core
[^p]: There is an interesting YouTube video [Building a Power Efficient Home Server!](https://www.youtube.com/watch?v=MucGkPUMjNo) mentioning the
    [Die sparsamsten Systeme (<30W Idle)](https://www.hardwareluxx.de/community/threads/die-sparsamsten-systeme-30w-idle.1007101) thread on the
    [hardwareLUXX](https://www.hardwareluxx.de/community/) forum. And this in turn contains the following google docs table: [-Die sparsamsten Systeme (<30W Idle)-](https://docs.google.com/spreadsheets/d/1LHvT2fRp7I6Hf18LcSzsNnjp10VI-odvwZpQZKv_NCI/edit#gid=0).
