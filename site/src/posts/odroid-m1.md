---
layout: "layouts/post-with-toc.njk"
title: "ODROID-M1: an Experience Report"
description: "ODROID-M1, Ubuntu, ARM64"
creationdate: 2022-06-25
keywords: hardkernel,odroid,ubuntu-ports,arm64
date: 2022-06-25
tags: ['post']
---

## Rational

As mentioned in my article [Fuel Save Alerter](../fuel-save-alerter-germany), I was originally thinking about deploying the application locally to a
[Raspberry Pi](https://en.wikipedia.org/wiki/Raspberry_Pi), but due to the delivery problems I decided to go with an [ODROID-M1 with 8GByte
RAM](https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram) instead. This is my experience report.

## Parts and Costs

Here is my part list:

| Vendor                 | Part                                     | Price | Currency | EUR      | Link                                                        |
|------------------------|------------------------------------------|------:|----------|---------:|-------------------------------------------------------------|
| Hardkernel&nbsp;&nbsp; | ODROID-M1 with 8GByte RAM                | 90.00 | USD      |  89.52 € | https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram   |
| Hardkernel             | M1 Metal case Kit                        |  9.00 | USD      |   9.95 € | https://www.hardkernel.com/shop/m1-metal-case-kit           |
| Hardkernel             | WiFi Module 5BK                          |  8.90 | USD      |   8.85 € | https://www.hardkernel.com/shop/wifi-module-5bk             |
| Hardkernel             | 12V/2A power supply EU plug              |  5.50 | USD      |   5.47 € | https://www.hardkernel.com/shop/12v-2a-power-supply-eu-plug |
| Hardkernel             | Shipping                                 | 26.63 | USD      |   6.49 € |                                                             |
| DHL                    | EU Tax                                   | 24.29 | EUR      |  24.29 € |                                                             |
| DHL                    | Duty Tax Receiver Service                | 14.88 | EUR      |  14.88 € |                                                             |
| Amazon                 | Crucial P2 CT250P2SSD8 SSD Intern 250 GB | 30.99 | EUR      |  30.99 € | https://www.amazon.de/gp/product/B086BKGSC1                 |
|                        |                                          |       |          | 209.44 € |                                                             |

So in total the device cost me something like 210€. Quite a bit more than I anticipated for my original Raspberry Pi idea.

The device looks like this:

|  |  |  |
|--|--|--|
| <div style="max-width: 100%"><object data="/img/2022-06-25-odroid-m1-1.jpeg" type="image/jpg" style="max-width: 100%"><img src="/img/2022-06-25-odroid-m1-1.jpeg" alt="view from top"></object> | <object data="/img/2022-06-25-odroid-m1-2.jpeg" type="image/jpg" style="max-width: 100%"><img src="/img/2022-06-25-odroid-m1-2.jpeg" alt="view from rear"></object> | <object data="/img/2022-06-25-odroid-m1-3.jpeg" type="image/jpg" style="max-width: 100%"><img src="/img/2022-06-25-odroid-m1-3.jpeg" alt="view from front"></object></div> |

In the middle picture you can also see the WiFi Module 5BK. I find it sad that WiFi is not directly on-board.

Originally, I bought a different NVMe M.2 module [Transcend 240GB SATA III TS240GMTS820S](https://www.amazon.de/gp/product/B0778Q7X9B) for 31.79€, but
this NVMe module was not recognized by the ODROID-M1 at all. I started to read a bit about NVMe and M.2 and learned a bit about [M.2
Keys](https://www.delock.de/infothek/M.2/M.2.html). The Transcend device has a B+M key (SATA + PCIe) and the Crucial device has a M key (PCIe). I
guess this has something to do with why the Transcend device was not recognized. I tried to sign-up to the ODROID [forums](https://forum.odroid.com),
but the sign-up procedure does not work. I never was sent a sign-up e-mail and without that I could not log-in to the forum. I tried with two
different e-mail accounts. Then I tried to find out how to contact someone at the forum via e-mail, but nothing is documented, so I simply sent an
e-mail to admin@forum.odroid.com, admin@odroid.com, webmaster@forum.odroid.com, webmaster@odroid.com. None of the e-mails bounced, but I also did not
get an answer up until now. So I am not sure if my mail reached the eyes of a human at all.

In the ODROID Forum I found [M1 NVMe compatibility reports](https://forum.odroid.com/viewtopic.php?t=44265) and via this thread I was pointed to
[Tested/verified compatible M.2 NVMe](https://wiki.odroid.com/odroid-m1/hardware/nvme) for the ODROID M1. Like that I selected the Crucial device.

The installation of Ubuntu on the ODROID-M1 was quite straight forward. Especially this [Petitboot](https://github.com/open-power/petitboot)
boot-loader was a quite pleasant surprise.

1. You download an [OS image](https://wiki.odroid.com/odroid-m1/os_images/os_images),
1. put it onto a USB stick (don't create a bootable USB[^usb],
1. boot into the ODROID-M1, where a [Petitboot](https://github.com/open-power/petitboot) boot-loader awaits you,
1. go to the shell (bottom most option)
1. and follow the instructions from [SSD only usage](https://forum.odroid.com/viewtopic.php?f=211&t=44287), which basically equates to<br>`dd if=/usr/var/petitboot/mnt/dev/sda1/ubuntu-20.04-gnome-desktop-odroidm1-20220531.img of=/dev/nvme0n1 bs=4M`.

After that you can remove the USB stick and reboot. Now you should be able to boot into the arm64 Ubuntu.

## Benchmark

I like to do a [byte-unixbench](https://code.google.com/archive/p/byte-unixbench) on the environments I use. Just download the
[UnixBench5.1.3.tgz](https://code.google.com/archive/p/byte-unixbench/downloads) and copy it onto the ODROID-M1. You will need to install a couple of
packages like a build environment including a C++ compiler. But once done you can untar the package and just execute the `Run` command inside the
package.

The `running 1 parallel copy of tests` version resulated in a `System Benchmarks Index Score` of `467.5`. Just as a comparison, on the
[netcup](https://www.netcup.de/vserver/vps.php) VPS for 2.99 € per month I get a value of `647.3`, so a factor of 1.38 better.

## Summary

All in all I have mixed feelings about the device. It looks nice, consumes little power[^power] and has a nice boot process with the `Petitboot`
boot-loader. On the other hand the deivce was quite expensive, does not include WiFi on-board out-of-the-box and in my opinion has a low computing
power as shown by the `byte-unixbench` for that price. The experience with the forums was also not ideal. I still don't have access to the forums. I
was not expecting that a NVMe M.2 would not simply work out of the box. I've never experienced that. This is a standard storage interface. Why do you
need a [Tested/verified compatible M.2 NVMe](https://wiki.odroid.com/odroid-m1/hardware/nvme) page at all? At least a warning on the main [ODROID-M1
with 8GByte RAM](https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram) page about this issue might have been nice.


## Footnotes

[^usb]: **important**: just put it as the `ubuntu-20.04-gnome-desktop-odroidm1-20220531.img` on the USB stick and don't create a bootable USB stick; actually booting from USB works, too, but I guess you would wanted to have the installation on the M.2 NVMe and not on a USB stick.
[^power]: According to the `Power consumption and heat characteristics` section on the [ODROID-M1 with 8GByte RAM](https://www.hardkernel.com/shop/odroid-m1-with-8gbyte-ram): Without any external peripherals connected, the M1 power consumption is about 4.5Watt with a very heavy computing load. It could be as low as 1.3Watt in the idle state.
