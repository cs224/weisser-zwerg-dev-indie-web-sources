---
layout: "layouts/post-with-toc.njk"
title: "Home Server Infrastructure: Secure, Unattended, and Easy to Manage"
description: "The Practical Basics for Hobbyists."
creationdate: 2025-02-28
keywords: linux, debian, ubuntu, encryption at rest, unattended reboot, backup, restore
date: 2025-02-28
tags: ['post']
---

## Rationale

In this blog post, I will guide you through a Debian-based home server setup that runs 24/7 without human interaction.
We'll tackle the challenge of achieving disk encryption at rest while allowing for unattended reboots.
The approach uses a separate sparse file as an encrypted volume, combined with Systemd and Docker to ensure services only start after the encrypted drive is ready.
With an organized folder structure under `/opt/{service}/config`, all valuable data stays safe.
Finally, using Btrfs snapshots helps streamline backup and restore, making maintenance easier for hobbyists and enthusiasts alike.

If you're unsure which hardware to choose for your home server, check out my earlier blog post: [Thin Clients as Home Servers: Dell Wyse 5060 and Fujitsu Futro S920: an Experience Report](../dell-wyse-fujitsu-futro).


## Unattended Reboot and Disk Encryption at Rest

Most of the time, a home server runs around the clock and is tucked away in a cupboard or on a shelf.
It's usually just connected to power and, if you're not using Wi-Fi, a single network cable.
Because there's no keyboard or monitor, you typically interact with the server via SSH or a similar remote tool.

This also means you likely want your home server to reboot without needing human input.
You plug it into power and the network, press the power button, and after a short wait, it's ready for an SSH connection.

However, you can't simply use typical disk encryption that requires typing a password during boot.
You still want to protect your data with encryption at rest, so how do you proceed?

I recommend creating a separate sparse file as an encrypted volume, which you then mount manually.

There's a catch, though. The services running on your home server will need to write to this volume.
That means you have to ensure these services only start once the file system is mounted.

To achieve this, I suggest running all your services via Docker and using a Systemd-managed mount with `RequiresMountsFor` in the `docker.service`.
This way, Docker won't start until the encrypted volume is mounted.

One of the best parts about Docker is that you can organize all service files in one place.
A common folder structure might look like this:
```txt
/opt/docker-services
└── service
    ├── config
    │   ├── container-service-one
    │   └── container-service-two
    ├── .env
    └── docker-compose.yaml
```
<p></p>

If you ensure that all your `/opt/{service}/config` folders reside on your encrypted volume, you'll have peace of mind knowing your valuable data is protected at rest.

A logical next step is to handle backup and restore from this central data volume.
Formatting it with Btrfs can be especially helpful because it allows you to create consistent snapshots, which you can then use for backups.

### LUKS Encrypted `btrfs` File Volume

Let's begin by creating a LUKS-encrypted `btrfs` file volume using the commands below.
We'll start by making a sparse file, which appears to have a large size but won't actually consume that space until data is written:

```bash
truncate -s 100G /opt/luks-btrfs-volume.img
du -h luks-btrfs-volume.img
# 0       luks-btrfs-volume.img
ll -h luks-btrfs-volume.img
# 100G    luks-btrfs-volume.img
cryptsetup --type luks2 -y -v luksFormat /opt/luks-btrfs-volume.img
du -h luks-btrfs-volume.img 
# 16M     luks-btrfs-volume.img
cryptsetup -v open /opt/luks-btrfs-volume.img luks_btrfs_volume
ll /dev/mapper/luks_btrfs_volume
# /dev/mapper/luks_btrfs_volume -> ../dm-2
mkfs.btrfs /dev/mapper/luks_btrfs_volume
du -h luks-btrfs-volume.img 
# 21M     luks-btrfs-volume.img
mkdir -p /mnt/luks_btrfs_volume
mount -t btrfs -o noatime,compress=zstd /dev/mapper/luks_btrfs_volume /mnt/luks_btrfs_volume
df -h
# Filesystem                     Size  Used Avail Use% Mounted on
# /dev/mapper/luks_btrfs_volume  100G  5,8M   98G   1% /mnt/luks-btrfs-volume
findmnt --noheadings --raw --evaluate --target /mnt/luks_btrfs_volume --output SOURCE,TARGET,FSTYPE,OPTIONS | awk '{print $1 "\t" $2 "\t" $3 "\t" $4 "\t0 0"}'
# /dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume       btrfs   rw,noatime,compress=zstd:3,ssd,space_cache=v2,subvolid=5,subvol=/       0 0
# /dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume       btrfs   rw,relatime,               ssd,space_cache=v2,subvolid=5,subvol=/       0 0
# findmnt --mountpoint /mnt/luks_btrfs_volume --verbose --fstab             # this would only print the line that is already present in /etc/fstab
umount /mnt/luks_btrfs_volume
cryptsetup close luks_btrfs_volume
```
<p></p>

> **Note**:
> * If you're running a `cryptsetup` version ≥ 2.0, it will default to creating a LUKS2 container. On older systems, it might default to LUKS1. By adding `--type luks2`, you ensure no fallback to LUKS1.
> * Use `cryptsetup luksDump /opt/luks-btrfs-volume.img` to verify you have `Version: 2`.
> * The `-y` and `-v` flags make `cryptsetup` prompt you to confirm the passphrase and give progress updates.

> You may see `luksOpen` instead of `open` with `cryptsetup`, like so:
> ```bash
> cryptsetup -v luksOpen /opt/luks-btrfs-volume.img luks_btrfs_volume
> ```
> `luksOpen` is an older subcommand specifically for LUKS devices, while `open` is more generic and can handle multiple formats. On modern systems, both commands typically work the same way for LUKS containers.

> Using `-o noatime,compress=zstd` when mounting does the following:
> * `noatime`: Prevents file access time from being updated (improves performance and reduces unnecessary writes).
> * `compress=zstd`: Enables transparent compression with Zstandard, often saving space and sometimes improving performance.
>
> Transparent compression happens at the filesystem level, so files appear uncompressed to the user.
> Btrfs automatically decompresses only the file parts you access, then recompresses them when writing back to disk.
> This provides storage efficiency without hardware upgrades or cloud storage.
>
> In practice, many users keep compression enabled in Btrfs because Zstd is relatively fast and provides good compression ratios.<br>
> One thing to note is that existing files won't be automatically recompressed; compression applies to new writes. You can:
> * Wait and do nothing: Over time, as files get rewritten, they'll be stored compressed.
> * Copy or move files to a different filesystem and back: More tedious but forces recompression.
> * Use Btrfs defragmentation to initiate recompression.
>
> For more details, check out [Working with Btrfs - Compression](https://fedoramagazine.org/working-with-btrfs-compression).

> The comment lines after the `findmnt` command show how the options compare if you didn't use `-o noatime,compress=zstd`. Specifically:
> * `noatime` vs. `relatime`: `noatime` never updates `atime`, while `relatime` updates it in a more conservative way once a day or if it's older than `mtime` or `ctime`.
> * `ssd`: Tells Btrfs to optimize certain behavior for SSDs.
> * `space_cache=v2`: A newer, more efficient method for Btrfs to track free space.

Now your LUKS-encrypted `btrfs` file volume is ready for the next step.

#### Resize the Sparse File and Grow the `btrfs` Filesystem

If you ever need to increase the size of your sparse file and its filesystem, follow these steps:

```bash
truncate -s +50G /opt/luks-btrfs-volume.img
```

This command increases the file size by 50 GB without occupying that space on disk immediately.
Actual disk usage only grows as data is written.

After enlarging the raw file, you need to resize the LUKS container. If it isn't already open, do so with:
```bash
cryptsetup open /opt/luks-btrfs-volume.img luks_btrfs_volume
```

Then run the following command to let LUKS recognize the extra space:
```bash
cryptsetup resize luks_btrfs_volume
```

Next, grow the `btrfs` filesystem to fill all available space. If it's mounted at `/mnt/luks_btrfs_volume`, run:
```bash
btrfs filesystem resize max /mnt/luks_btrfs_volume
```

To confirm the resize, use:
```bash
btrfs filesystem df /mnt/luks_btrfs_volume
df -h /mnt/luks_btrfs_volume
```

If you need more information have a look at: [Resize a Btrfs Filesystem](https://linuxhint.com/resize_a_btrfs_filesystem/).

### Configure `/etc/crypttab` and `/etc/fstab` for Manual Mounting

If `cryptsetup` is not installed on your system, you can install it with:
```bash
apt install cryptsetup
```
We need to coordinate two `systemd` "generator" mechanisms so your LUKS-backed `btrfs` filesystem can be mounted on demand, using `mount /mnt/luks_btrfs_volume`:
* crypttab generator: creates a `systemd-cryptsetup@luks_btrfs_volume.service` unit to open your LUKS device.
* fstab generator: creates `mnt-luks_btrfs_volume.mount` and `mnt-luks_btrfs_volume.automount` units for your mount point.

In both crypttab and fstab, be sure to specify `noauto`; otherwise, after a reboot, your system will hang waiting for a passphrase, which defeats our goal of unattended operation.

> You may notice that we used hyphens for the image file name (`luks-btrfs-volume.img`) but underscores for the device mapper file and mount point (`luks_btrfs_volume`).
> We do this because `systemd` automatically escapes minus (`-`) characters, which makes things look more complicated.<br>
> As an example `systemd-escape -p 'my-volume-name'` would show the result `my\x2dvolume\x2dname`.


Let's start with `/etc/crypttab`.
Systemd reads `/etc/crypttab` at boot (and at daemon-reload) to decide how to open encrypted devices.
We'll configure it so it does not open automatically at boot - only when we explicitly request it.

Add a line to `/etc/crypttab` such as (or create the file if it does not exist):
```txt
# <mapped_name>     <source>                                     <keyfile> <options>
luks_btrfs_volume   /opt/luks-btrfs-volume.img                   none      luks,noauto,loop,timeout=120
```
* `luks` tells systemd-cryptsetup it's a LUKS device.
* `noauto` keeps it from automatically opening at boot.
* `loop` if `/opt/luks-btrfs-volume.img` is a regular file, systemd-cryptsetup needs to create a loop device automatically. The loop option in crypttab is what instructs systemd to do so.
* `timeout=120` means "prompt for 120 seconds" if passphrase is needed. That's a safety measure in case you ever remove `noauto` and reboot, so that the system will wait a maximum of 2 minutes until it actually continues to boot.

The following commands verify that the crypttab generator works correctly.
```bash
systemctl daemon-reload
systemctl show -p FragmentPath systemd-cryptsetup@luks_btrfs_volume.service
# FragmentPath=/run/systemd/generator/systemd-cryptsetup@luks_btrfs_volume.service
systemctl list-unit-files | grep cryptsetup
# systemd-cryptsetup@luks_btrfs_volume.service                                  generated       -
ll /run/systemd/generator/systemd-cryptsetup@luks_btrfs_volume.service 
# '/run/systemd/generator/systemd-cryptsetup@luks_btrfs_volume.service'
systemctl list-units --type=service --all | grep crypt
# systemd-cryptsetup@luks_btrfs_volume.service          loaded    active   exited  Cryptography Setup for luks_btrfs_volume
systemctl start systemd-cryptsetup@luks_btrfs_volume
# type your password
ll /dev/mapper/luks_btrfs_volume 
# /dev/mapper/luks_btrfs_volume -> ../dm-2
systemctl status systemd-cryptsetup@luks_btrfs_volume
# ● systemd-cryptsetup@luks_btrfs_volume.service - Cryptography Setup for luks_btrfs_volume
#      Loaded: loaded (/etc/crypttab; generated)
#      Active: active (exited) since ...; 1min 22s ago
systemctl stop systemd-cryptsetup@luks_btrfs_volume
# or cryptsetup close luks_btrfs_volume
```

Starting the service will map the encrypted volume to `/dev/mapper/luks_btrfs_volume`.

Next, add a line to `/etc/fstab` to reference the mapped device. LUKS devices appear under `/dev/mapper/<name>`, so you can use: 
```txt
/dev/mapper/luks_btrfs_volume   /mnt/luks-btrfs-volume  btrfs   noauto,x-systemd.automount,relatime,compress=zstd:3,defaults     0       0
```

* `noauto` = do not mount automatically at boot.
* `x-systemd.automount` = triggers `systemd` to open the LUKS device (via `/etc/crypttab`) and then mount it when you run `mount /mnt/luks_btrfs_volume`.

The following commands verify that the fstab generator works correctly.
```bash
systemctl daemon-reload
show -p FragmentPath mnt-luks_btrfs_volume.automount
# FragmentPath=/run/systemd/generator/mnt-luks_btrfs_volume.automount
systemctl list-unit-files --type=automount
# UNIT FILE                         STATE     PRESET
# mnt-luks_btrfs_volume.automount   generated -     
ll /run/systemd/generator/mnt-luks_btrfs_volume.automount
ll /run/systemd/generator/mnt-luks_btrfs_volume.mount

systemctl start mnt-luks_btrfs_volume.automount

systemctl list-units --type=automount --all
#   UNIT                              LOAD   ACTIVE SUB     DESCRIPTION                                                  
#   mnt-luks_btrfs_volume.automount   loaded active running mnt-luks_btrfs_volume.automount
#
# Legend: LOAD   → Reflects whether the unit definition was properly loaded.
#         ACTIVE → The high-level unit activation state, i.e. generalization of SUB.
#         SUB    → The low-level unit activation state, values depend on unit type.

mount /mnt/luks_btrfs_volume
# Broadcast message from root@xxx (...):
#
# Password entry required for 'Please enter passphrase for disk luks_btrfs_volume on /mnt/luks_btrfs_volume:' (PID 834116).
# Please enter password with the systemd-tty-ask-password-agent tool.

# -> XXX -> The process will block here. Do a Ctrl-C here to exit this and then use systemd-tty-ask-password-agent as instructed:
systemd-tty-ask-password-agent
# Now type your password.
df -h
# Filesystem                     Size  Used Avail Use% Mounted on
# /dev/mapper/luks_btrfs_volume  100G  5,8M   98G   1% /mnt/luks-btrfs-volume
```

If everything looks good, you can reverse it by unmounting and stopping the service:
```bash
umount /mnt/luks_btrfs_volume
systemctl stop systemd-cryptsetup@luks_btrfs_volume
# or cryptsetup close luks_btrfs_volume
ll /dev/mapper/luks_btrfs_volume
# ls: cannot access '/dev/mapper/luks_btrfs_volume': No such file or directory
```

Now try a reboot. Once your system is up again, test the all-in-one approach:
```bash
mount /mnt/luks-btrfs-volume
# Broadcast message from root@xxx (...):
#
# Password entry required for 'Please enter passphrase for disk luks_btrfs_volume on /mnt/luks_btrfs_volume:' (PID 834116).
# Please enter password with the systemd-tty-ask-password-agent tool.

# -> XXX -> The process will block here. Do a Ctrl-C here to exit this and then use systemd-tty-ask-password-agent as instructed:
systemd-tty-ask-password-agent
# Now type your password.
```

At this point, your sparse file-based encrypted volume and the `btrfs` filesystem on it should be functioning properly.
We can now move on to the next step.

### Btrfs File Structure

```bash
findmnt -no FSTYPE /mnt/luks_btrfs_volume 
# btrfs
cd /mnt/luks_btrfs_volume/
btrfs subvolume list -t -s -o .
findmnt -vno SOURCE /mnt/luks_btrfs_volume
# /dev/mapper/luks_btrfs_volume
```

With Btrfs, only subvolumes (not arbitrary directories) can be mounted as if they were separate filesystems using the -o subvol= option.
If you want to “mount” a normal directory somewhere else, you would use a bind mount (a generic Linux feature), not the Btrfs subvolume mechanism.


## Additonal Resources


* [Welcome to BTRFS documentation!](https://btrfs.readthedocs.io/en/latest/index.html)
* Andreas Hartmann in fedora Magazine
    * [Working with Btrfs - General Concepts](https://fedoramagazine.org/working-with-btrfs-general-concepts/)
    * [Working with Btrfs - Subvolumes](https://fedoramagazine.org/working-with-btrfs-subvolumes/)
    * [Working with Btrfs - Snapshots](https://fedoramagazine.org/working-with-btrfs-snapshots/)
    * [Working with Btrfs - Compression](https://fedoramagazine.org/working-with-btrfs-compression/)
* [funtoo.org/BTRFS_Fun](https://www.funtoo.org/BTRFS_Fun)
* [Get Started With the Btrfs File System on Oracle Linux](https://docs.oracle.com/en/learn/ol-btrfs/index.html)
* Sweet Tea Dorminy on [Encrypted Btrfs Subvolumes: Keeping Container Storage Safe](https://www.youtube.com/watch?v=6YIc2fVLVPU)
* [How do I work with /dev/mapper devices](https://www.linuxquestions.org/questions/linux-server-73/dev-mapper-devices-and-how-to-use-4175582538/): `lvdisplay`, `vgdisplay`, `pvdisplay`
* [btrbk](https://github.com/digint/btrbk): Tool for creating snapshots and remote backups of btrfs subvolumes
* [rclone serve restic](https://rclone.org/commands/rclone_serve_restic/)
    * [REST Server](https://restic.readthedocs.io/en/latest/030_preparing_a_new_repo.html#rest-server)
    * [Other Services via rclone](https://restic.readthedocs.io/en/latest/030_preparing_a_new_repo.html#other-services-via-rclone)
* [repository connect rclone](https://kopia.io/docs/reference/command-line/common/repository-connect-rclone/)
