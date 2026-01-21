---
layout: "layouts/post-with-toc.njk"
title: "sigrok: UNI-T UT61E Multimiter on Linux"
description: "Capture data from a UNI-T UT61E Multimiter on Linux via the sigrok signal analysis software suite."
seodescription: "Connect a UNI-T UT61E multimeter to Linux with sigrok: identify UT-D02/UT-D09 cables, find the right conn= string, and capture readings via sigrok-cli."
creationdate: 2023-12-11
keywords: linux,multimeter,uni-trend,uni-t,ut61e,datalogging,usb/hid,usb/rs232,cp2110-hid-uart-bridge
date: 2023-12-11
tags: ['post']
draft: false
---
## Rationale

I was in search of a multimeter equipped with a USB interface for seamless programmable access from my Linux system. Scouring through Amazon, I
stumbled upon the [UNI-T UT61E](https://www.amazon.de/UNI-T-Multitester-Gleichstrom-Wechselstrom-Auto-Multimeter/dp/B01M0J5DP7) digital multimeter,
and without prior verification of its Linux compatibility, I made the purchase. My assumption was that surely, someone out there had successfully
integrated it with Linux. To my satisfaction, that assumption proved true, albeit with a bit more effort than I initially anticipated.

In this blog post, I will guide you through the process of harnessing the capabilities of the [UNI-T
UT61E](https://meters.uni-trend.com/download/ut61a-b-c-d-e-user-manual) multimeter with its USB interface, using the versatile sigrok signal analysis
software suite. Get ready to unlock the full potential of your multimeter in your Linux-based projects.


## Sigrok

[sigrok](https://sigrok.org) seems to stand as the de facto standard for signal analysis software on Linux, boasting an extensive list of supported
hardware that you can explore on their official website: [Supported hardware](https://sigrok.org/wiki/Supported_hardware).

To ensure I had the most up-to-date version, I decided to take matters into my own hands and build it from source. The process is well-documented and
can be found here: [Build/install the sigrok subprojects on Linux](https://sigrok.org/wiki/Linux).


My purchase included a handy RS232 serial cable, but I also invested in an [RS232-to-USB-adapter](https://www.amazon.de/gp/product/B07TXJXWJ3) for a
seamless connection to my computer.

Additionally, I opted for the [UNI-T UT-D04](https://de.aliexpress.com/item/4001251602939.html) cable, just to ensure smooth communication with the device, should the need arise.


In the `libsigrok/README.devices` file, under `UNI-T DMM (and rebranded models) cables`, they mention the following cables:

```
 - UT-D02 (RS232 cable)
 - UT-D04 (USB/HID cable with Hoitek HE2325U chip, USB VID/PID 04fa:2490)
 - UT-D04 (USB/HID cable with WCH CH9325 chip, USB VID/PID 1a86:e008)
 - UT-D07 (Bluetooth adapter, ISSC BL79 BLETR chip)
 - UT-D09 (USB/HID cable with SiL CP2110 chip, USB VID/PID 10c4:ea80)
```

After connecting my `UNI-T UT-D04` cable to my computer, I discovered that it was, in fact, a `UT-D09`, as indicated by lsusb:

```
Bus 004 Device 006: ID 10c4:ea80 Silicon Labs CP2110 HID UART Bridge
```

### `--driver` and the `conn=` String

The challenges began when I attempted to connect to the device using `sigrok-cli`. I initially tried the `UT-D09` cable with the following command:

```
sigrok-cli --driver uni-t-ut61e-ser:conn=hid/cp2110 -O analog --samples 5 -l 5
```

The straightforward solution is to consult the manual (RTF), and in this case, it's as simple as running: `sigrok-cli --list-serial`.

For the `UT-D09` cable, the output will resemble this:

```
Available serial/HID/BT/BLE ports:
  /dev/ttyS4    ttyS4
  hid/cp2110/raw=/dev/hidraw0   HID Silicon Laboratories CP2110 HID USB-to-UART Bridge 0070E314 [10c4.ea80]
```

This information guides us to use the following command:

```
sigrok-cli --driver uni-t-ut61e-ser:conn=hid/cp2110/raw=/dev/hidraw0 -O analog --samples 5 -l 5
```

Now, if you're using the `UT-D02` cable in conjunction with the RS232-to-USB adapter, the output will look something like this:

```
Available serial/HID/BT/BLE ports:
  /dev/ttyS4    ttyS4
  /dev/ttyUSB0  USB2.0-Ser!
```

This indicates that you should employ the following command:

```
sigrok-cli --driver uni-t-ut61e-ser:conn=/dev/ttyUSB0 -O analog --samples 5 -l 5
```

With these insights, you'll have no trouble setting up your UNI-T UT61E multimeter for seamless integration with your Linux system.

### Using `sigrok` from Python

The recommended approach appears to be utilizing `sigrok-cli` via IPC (Inter-Process Communication), as detailed in [Managing sigrok-cli data with
Python](https://sigrok.org/wiki/Managing_sigrok-cli_data_with_Python).

Additionally, you can find Python bindings in the `libsigrok/bindings/python` folder, which are generated via
[SWIG](https://www.swig.org). Personally, I manage my Python environments using [miniconda](https://docs.conda.io/projects/miniconda/en/latest) or
[micromamba](https://mamba.readthedocs.io/en/latest/user_guide/micromamba.html) on my systems. However, getting the Python bindings to cooperate with
this environment proved to be **a lot of hassle**.

The crux of the issue lies in `libsigrok`'s reliance on the [GNU
Autotools](https://www.gnu.org/software/autoconf/manual/autoconf-2.63/html_node/index.html), which in turn depend on
[pkg-config](https://www.freedesktop.org/wiki/Software/pkg-config) data. In my `conda` environment, the `pkg-config` data resides at
`{MINICONDAHOME}/envs/{ENVNAME}/lib/pkgconfig/`, while the system `pkg-config` data on my Ubuntu system is located at
`/usr/lib/x86_64-linux-gnu/pkgconfig`. To determine the location of your `pkg-config` files, you can use the following command:

```
pkg-config --debug --print-variables python3
```

When following the `libsigrok` [build](https://sigrok.org/wiki/Linux#libsigrok) instructions, the `./configure` step fails to find the correct Python `pkg-config` data.

To bridge the gap between these two sets of pkg-config data, I attempted to "merge" the two data-sets and tried the following:

```
export PKG_CONFIG_PATH=$CONDA_PREFIX/lib/pkgconfig:/usr/lib//x86_64-linux-gnu/pkgconfig
```

With this adjustment, the `./configure` step recognized the correct Python installation, but the build still encountered several issues. I ultimately
resolved these problems by adding `-I/usr/include` and/or `-L/usr/lib/x86_64-linux-gnu` in various places in the `Makefile` by hand. During this trial-and-error
process, the `make V=1` switch proved invaluable, as it provided verbose output and aided in identifying the root of the issues.

However, the entire problem vanishes if you opt for using the system Python environment. Simply deactivate conda with `conda deactivate` until you've
exited all conda environments. Then, the standard build process will seamlessly pick up the correct libraries and construct the Python bindings as
expected for your system Python installation.

For further guidance on utilizing these Python bindings, you can refer to the somewhat dated but still informative repository, [sigrok-cli-python](https://github.com/martinling/sigrok-cli-python).

### Analysing your USB connections

Before I stumbled upon the solution in the form of `sigrok-cli --list-serial`, I initially relied on the [HIDAPI
library](https://github.com/libusb/hidapi), along with its `testgui` and the separate [hidapitester](https://github.com/todbot/hidapitester). To
ensure a smooth experience, it's advisable to run these tools as `root` initially, safeguarding against any potential access rights issues if things
don't go as planned. You can always fine-tune the access rights later as needed.

Upon executing: `./hidapitester --list --list-usages --list-detail` you'll receive information resembling this:
```
10C4/EA80: Silicon Laboratories - CP2110 HID USB-to-UART Bridge
  vendorId:      0x10C4
  productId:     0xEA80
  usagePage:     0xFF00
  usage:         0x0001
  serial_number: 0070E314
  interface:     0
  path: /dev/hidraw0
```

This is how I initially determined that my connection string had to incorporate `/dev/hidraw0` to connect.

Occasionally, it's equally valuable to work in reverse, to establish a clear connection between a line in `lsusb` and its corresponding `/dev` device:

```
udevadm info -a -p $(udevadm info -q path -n /dev/hidraw0) | less
```

Simply search for `devnum` and/or `busnum` in the output of this command to gain clarity.

## Sigrok Frontends: PulseView and SmuView

There are also graphical front-ends available for `libsigrok`:

* [PulseView](https://sigrok.org/wiki/PulseView)
* [SmuView](https://sigrok.org/wiki/SmuView)

Within the [build/install](https://sigrok.org/wiki/Linux) section for the `sigrok` subprojects on Linux, you'll discover the building and installation
guidelines for both of these front-ends. Personally, I opted for `SmuView`, finding it to be the more intuitive choice for my needs.
