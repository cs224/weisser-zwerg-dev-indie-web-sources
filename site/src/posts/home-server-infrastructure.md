---
layout: "layouts/post-with-toc.njk"
title: "Home Server Blueprint: Rock-Solid Home Server with Unattended Reboots, Secure Disk Encryption, and Cost-Effective Offsite Backups"
description: "Safeguard Your Data by Combining Encrypted Storage, Btrfs Snapshots, and Kopia/Rclone Offsite Backup - All Guided by a Simple Makefile for Ultimate Peace of Mind"
creationdate: 2025-02-28
keywords: home server, linux, debian, ubuntu, disk encryption, luks, btrfs snapshots, unattended reboot, backup and restore, rclone, kopia, onedrive, sharepoint, offsite backups, Makefile, docker
date: 2025-02-28
tags: ['post']
---


## Rationale

In this blog post, I will guide you through a Debian-based home server setup that runs 24/7 without human interaction.
We'll tackle the challenge of achieving disk encryption at rest while allowing for unattended reboots.
The approach uses a separate sparse file as an encrypted volume, combined with Systemd and Docker to ensure services only start after the encrypted drive is ready.
With an organized folder structure under `/opt/docker_services/{service}/config`, all valuable data stays safe.
Finally, using Btrfs snapshots helps streamline backup and restore, making maintenance easier for hobbyists and enthusiasts alike.

If you're unsure which hardware to choose for your home server, check out my earlier blog post: [Thin Clients as Home Servers: Dell Wyse 5060 and Fujitsu Futro S920: an Experience Report](../dell-wyse-fujitsu-futro).

### Motivation

In previous blog posts, I showed you how to set up local services like [Nextcloud](../digital-civil-rights-nextcloud-i) or [Gitea](../digital-civil-rights-gitea) to reclaim your digital independence and privacy.
However, I realized that I wasn't using these self-hosted services as much as I had originally expected. This led me to ask: why is that?

My conclusion was that I didn't have local disk encryption at rest, because unattended reboots are crucial for headless servers (with no keyboard or monitor) and disk encryption runs against unattended reboots.
Secondly, while backups might seem less critical for services like Nextcloud or Gitea - because data is synchronized across multiple clients - the lack of reliable off-site backups still felt risky.

That is why the primary purpose of this blog post is to support those earlier guides and help you gain confidence in running your own local services, ensuring you can truly reclaim your digital independence and privacy.


## Unattended Reboot and Disk Encryption at Rest

Most of the time, a home server runs around the clock and is tucked away in a cupboard or on a shelf.
It's usually just connected to power and, if you're not using Wi-Fi, a single network cable.
Because there's no keyboard or monitor, you typically interact with the server via SSH or a similar remote tool.

This also means you likely want your home server to reboot without needing human input:
You plug it into power and the network, press the power button, and after a short wait, it's ready for an SSH connection.

However, you can't simply rely on standard disk encryption that asks for a password at boot.
You still want to protect your data with encryption at rest, so how do you proceed?

I recommend creating a separate sparse file as an encrypted volume, which you then mount manually.
A "sparse file" is a file that initially takes up minimal space on your storage device and only grows as data is written to it. This is useful if you want an encrypted container on a disk partition without allocating the entire space upfront.

There's a catch, though: the services running on your home server must write to this encrypted volume.
That means these services should start only after the file system is mounted.

To achieve this, I suggest running all your services via Docker and using a Systemd-managed mount with `RequiresMountsFor` in the `docker.service`.
This way, Docker won't start until the encrypted volume is mounted.
`RequiresMountsFor` in Systemd is a directive that ensures a particular mount is available before starting the specified service.
When used in the override file for `docker.service`, it tells Systemd to hold off on starting Docker until the listed mount points are ready.


One of the best parts about Docker is that you can keep all service files organized in one place.
A typical folder structure might look like this:
```txt
/opt/docker_services
└── service
    ├── config
    │   ├── container-service-one
    │   └── container-service-two
    ├── .env
    └── docker-compose.yaml
```
<p></p>

If you ensure that all your `/opt/docker_services/{service}/config` folders reside on your encrypted volume, you'll have peace of mind knowing your valuable data is protected at rest.

A logical next step is to handle backup and restore from this central data volume.
Formatting it with Btrfs can be especially beneficial because it lets you create consistent snapshots, which you can then use for backups and for local restores.
Btrfs snapshots are point-in-time images of a file system subvolume. They are very fast to create and can be used to quickly roll back or restore data without duplicating every file.


## Quickstart

Building a home server that's both encrypted and unattended - including offsite backups - can be somewhat tricky.
Full-disk encryption requires manual passphrase entry at boot, which defeats automated restarts on a headless box (no keyboard or monitor attached).
I've decided to create a GNU Makefile to help you set up the overall structure.
This Makefile will be used in the quickstart steps so you can get started right away.
If you'd like a deeper understanding of every moving part, refer to the [Detailed Walkthrough](#detailed-walkthrough) further down.


> If you only need a simpler setup, e.g., without disk encryption or without Btrfs, then just pick and choose aspects of the overall setup.
> The [Detailed Walkthrough](#detailed-walkthrough) will provide the necessary details to understand and trim features you don't need.
> For a simpler setup, you might prefer to skip the Makefile approach and just copy the relevant parts as described in the [Detailed Walkthrough](#detailed-walkthrough).

With the Makefile approach, we will be:
* Placing encrypted data in a separate sparse file on an existing partition.
* Letting the system reboot as normal (the unencrypted root partition can boot on its own).
* Delaying the start of crucial services (like Docker) until the encrypted volume is manually unlocked.
* Automating the creation of Btrfs subvolumes, directories, systemd overrides, and a backup timer, ensuring your server is organized and consistent.

In essence, the Makefile ensures that each step - from installing required packages to configuring `systemd` units - is handled repeatably and (as much as possible) idempotently.
If something breaks mid-install, you can fix the error and run `make all` again, continuing from where you left off.


### Prepare Your System

Choose which system to use and download the files from the following [Gist](https://gist.github.com/cs224/34eebc2f9389404d7c0192d45cae7259).

### Review the `.env` File

The `.env` file holds configuration variables like disk volume size, passphrases, and backup schedules.
Adjust these settings according to your preferences (e.g., a 100 GB encrypted volume, daily backups at 4 AM, etc.).
Feel free to add or remove comment lines (#) to clarify your setup for future reference.

The Makefile allows many of its settings to be overridden.
Check the `CONFIGURABLE VARIABLES (can be overridden in .env or via environment)` section in the Makefile to see everything you can adapt.
If you prefer not to edit `.env`, you can instead pass variables through the environment:

```bash
IMG_SIZE="1G" make all
```

### Run `make all`

After editing `.env`, simply type:
```bash
make all
# or, for example:
IMG_SIZE="1G" make all
```
The Makefile will:
* Update your package lists (`apt-get update`).
* Install `cryptsetup`, `rclone`, and `kopia`.
* Create and format the LUKS-encrypted Btrfs volume.
* Set up subvolumes, directories, and `systemd` overrides so Docker only runs once the encrypted volume is unlocked.
* Install a timer (`btrfs-kopia-backup.timer`) that takes Btrfs snapshots and backs them up with Kopia.

### Create or Connect Kopia Repository

I use `rclone` as the [storage engine](https://kopia.io/docs/reference/command-line/common/repository-connect-rclone/) for Kopia.
`rclone` supports a wide variety of cloud storage providers, including OneDrive, Google Drive, SharePoint, S3, and many more.
In the appendix, I'll explain how to use a dedicated `Document Library` inside a `SharePoint Communication Site` as offsite backup storage.
For other offsite locations, consult the [Rclone](https://rclone.org/) documentation.

Set it up locally on your workstation machine first.


The resulting `rclone.conf` file will be located at `~/.config/rclone/rclone.conf`.
The only thing that is important for our purposes here is that your configuration starts with `[rclone-backup-sharepoint-site]`:
```bash
cat ~/.config/rclone/rclone.conf
# [rclone-backup-sharepoint-site]
# ...
rclone about rclone-backup-sharepoint-site:
```
If that works, you're good to go.

Next, copy this configuration to your remote machine and put it in the right location followed by a test:
```bash
scp -r ~/.config/rclone user@remote.tld:~/
ssh user@remote.tld
sudo su
mkdir -p /root/.config && cp -r ./rclone /root/.config
rclone about rclone-backup-sharepoint-site:
```
Once that works, create or connect to an existing Kopia repository:
```bash
make kopia-repository-create
# or
make kopia-repository-connect
```
Finally, apply some global Kopia policies:
```bash
make kopia-global-policy
```

### Verify

The Makefile uses "stamp" files to track progress. If a step fails, fix the issue and re-run make all. Once the install completes successfully, you'll have:
* A sparse file for your encrypted volume (`/opt/luks-btrfs-volume.img`).
* Systemd entries that require a manual passphrase input only when you want to start Docker (ensuring encryption at rest).
* A scheduled backup process for your data via Btrfs snapshots.

### The Outcome

After installation, your home server can:
* Reboot freely without human interaction (the root filesystem remains unencrypted, so it boots automatically).
* Keep crucial data offline (in the encrypted file) until you manually unlock it. This ensures your Docker services (and their data) remain protected when the server is off.
* Automate backups to an offsite location (via Kopia and Rclone) while efficiently managing snapshots (thanks to Btrfs).
* Provide a clean folder structure under `/opt/docker_services` and `/opt/offsite_backup_storage` for easy backup organization.

### After a Reboot

When the system is back up, running `systemctl start docker.service` should trigger a chain of Systemd dependencies to ensure that:


- The encrypted volume `/mnt/luks_btrfs_volume` is decrypted and mounted.
- The subdirectories under `/mnt/luks_btrfs_volume` are mounted at `/opt/offsite_backup_storage` and `/opt/docker_services`.
- Docker finally starts once its filesystem dependencies are satisfied.

### What's Next?

* **Application Setup**: Deploy Docker containers - such as [Gitea](../digital-civil-rights-gitea) - into `/opt/docker_services`. They'll remain protected inside the encrypted volume and benefit from automated daily off-site backups.
* **Backup and Recovery**: Practice restoring a Btrfs snapshot. Familiarize yourself with Kopia's restore commands.
* **Uninstall**: If you ever want to remove or deactivate this setup, run `make deinstall`. This will stop the `btrfs-kopia-backup.timer` and remove the `/etc/systemd/system/docker.service.d/override.conf`.

By following the quickstart steps above, you have laid the groundwork for a secure, unattended home server with offsite backups.
From here, you can confidently host the self-managed applications you need, knowing your data remains safe.

## How to Use Your LUKS-Encrypted Btrfs Volume

There are several ways to take advantage of your LUKS-encrypted Btrfs volume.
Below are three popular approaches you can mix and match depending on your needs.

### Store Your Dockerized Services Under `/opt/docker_services`

One straightforward idea is to install your Docker services inside `/opt/docker_services`.
Here's a possible directory structure:
```txt
/opt/docker_services
└── service
    ├── config
    │   ├── container-service-one
    │   └── container-service-two
    ├── .env
    └── docker-compose.yaml
```

This directory is bind-mounted to `/mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services`, which resides on your LUKS-encrypted Btrfs volume.

By doing it this way, your entire Docker service - including all configurations, `.env` files, and `docker-compose.yaml` - is:
* Encrypted at rest: Protected by LUKS encryption.
* Backed up daily: Benefiting from the offsite backup strategy.

### Use `rsync` to Replicate Valuable Data

Another method is to copy an existing directory with important data onto your Btrfs volume.
You can use rsync (or a similar tool) to handle this:
```bash
rsync -av --links --progress --stats --exclude "*~" \
  /some/source/directory/to/backup \
  /mnt/luks_btrfs_volume/@offsite_backup_storage/storage/
```
Even if the source directory itself isn't encrypted, the copied data will be:
* Encrypted on the Btrfs volume: Secured by LUKS.
* Included in the daily backup: Ensuring offsite protection.

Using `rsync` with `--links` preserves any symbolic links, and `--exclude "*~"` ignores temporary files, which can help keep your backup clean.

### Partial Encryption Through Symlinks

You may prefer to **keep most of your Docker setup outside** `/opt/docker_services`, but selectively encrypt only certain containers or data.
In that case, you can place important data on the encrypted volume and create a symlink to it. For example:
```txt
/opt
└── service
    ├── config
    │   ├── container-service-one
    │   ├── container-service-two
    │   └── container-service-three -> ../../offsite_backup_storage/service-config-container-service-three
    ├── .env
    └── docker-compose.yaml
```
In this example, only the data for container-service-three is stored on the LUKS-encrypted volume (`/opt/offsite_backup_storage` or `/mnt/luks_btrfs_volume/@offsite_backup_storage/storage`) - and is thus included in the daily backup.
Other containers remain outside of the encrypted mount, which may be sufficient if only specific components hold sensitive or valuable data.

Why back up data that doesn't need that level of protection?
This approach lets you save on offsite storage while still safeguarding your most critical information.

### Final Thoughts

These are just a few ways you can leverage your LUKS-encrypted Btrfs volume.
You might come up with additional use cases - if you do, I'd love to hear about them.
Feel free to share your ideas in the comment section at the end of this blog post!


## Detailed Walkthrough

### LUKS-Encrypted `btrfs` File Volume

Let's begin by creating a LUKS-encrypted `btrfs` file volume.
We'll start with a **sparse file**, which appears to have a large size but only consumes disk space as data is written.
With `truncate -s 100G /opt/luks-btrfs-volume.img`, your file is set to a nominal size of 100GB, but it doesn't immediately occupy that much space on your physical disk.  



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

# The following command will generate lines that you can one-to-one copy into /etc/fstab:
findmnt --noheadings --raw --evaluate --target /mnt/luks_btrfs_volume --output SOURCE,TARGET,FSTYPE,OPTIONS | awk '{print $1 "\t" $2 "\t" $3 "\t" $4 "\t0 0"}'
# /dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume       btrfs   rw,noatime,compress=zstd:3,ssd,space_cache=v2,subvolid=5,subvol=/       0 0
# /dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume       btrfs   rw,relatime,               ssd,space_cache=v2,subvolid=5,subvol=/       0 0
# The following command would only print the line that is already present in /etc/fstab
# findmnt --mountpoint /mnt/luks_btrfs_volume --verbose --fstab

umount /mnt/luks_btrfs_volume
cryptsetup close luks_btrfs_volume
```
<p></p>

> **Note**:
> * If you're running `cryptsetup` version ≥ 2.0, it defaults to LUKS2. Older systems might fall back to LUKS1 unless you specify `--type luks2`.
> * Use `cryptsetup luksDump /opt/luks-btrfs-volume.img` to verify your container uses `Version: 2`.
> * The `-y` and `-v` flags prompt you to confirm your passphrase and display progress messages.
> * You might see `luksOpen` instead of open, for example:
>   ```bash
>   cryptsetup -v luksOpen /opt/luks-btrfs-volume.img luks_btrfs_volume
>   ```
>   Both subcommands generally work the same on modern systems.

> Using `-o noatime,compress=zstd` when mounting does the following:
> * `noatime`:  Disables file access-time updates, reducing unnecessary writes.
> * `compress=zstd`:  Enables transparent compression with Zstandard. Files are automatically decompressed on read and recompressed on write. Over time, this can save space and potentially improve performance.
>    Existing files won't be automatically recompressed; compression applies to new or rewritten data. You can force a recompression using Btrfs defragmentation or by copying files off and back onto the volume.
>    For more details, check out [Working with Btrfs - Compression](https://fedoramagazine.org/working-with-btrfs-compression).

> The comment lines after the `findmnt` command show how the options compare if you didn't use `-o noatime,compress=zstd`. Specifically:
> * `noatime` vs. `relatime`: `noatime` never updates `atime`, while `relatime` updates it in a more conservative way once a day or if it's older than `mtime` or `ctime`.
> * `ssd`: Tells Btrfs to optimize certain behavior for SSDs.
> * `space_cache=v2`: A newer, more efficient method for Btrfs to track free space.

Once you confirm everything looks correct, your LUKS-encrypted Btrfs file volume is ready for the next step.

#### Resize the Sparse File and Grow the `btrfs` Filesystem

If you ever need to increase the size of your sparse file and its filesystem, follow these steps:

```bash
truncate -s +50G /opt/luks-btrfs-volume.img
```

This command enlarges the file size by 50 GB without immediately consuming additional disk space.
Real disk usage will only grow as data is added.


After enlarging the raw file, you need to resize the LUKS container. If it isn't already open, do so with:
```bash
cryptsetup open /opt/luks-btrfs-volume.img luks_btrfs_volume
```

Let LUKS recognize the newly available space:
```bash
cryptsetup resize luks_btrfs_volume
```

If the filesystem is mounted at `/mnt/luks_btrfs_volume`, extend it to use all available space:
```bash
btrfs filesystem resize max /mnt/luks_btrfs_volume
```

Check that the filesystem size has updated:
```bash
btrfs filesystem df /mnt/luks_btrfs_volume
df -h /mnt/luks_btrfs_volume
```

> If you're dealing with partitions on a physical disk instead of a sparse file, you may need to adjust the partition size first using tools like parted before resizing the LUKS container and btrfs filesystem.


For more in-depth information, see [Resize a Btrfs Filesystem](https://linuxhint.com/resize_a_btrfs_filesystem/).

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
> As an example `systemd-escape -p 'my-volume-name'` would show the result `my\x2dvolume\x2dname`.<br>
> The reason for that behaviour is that `systemd` replaces slashes (`/`) with minus (`-`) when it auto generates `.mount` unit files.


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
systemctl show -p FragmentPath mnt-luks_btrfs_volume.automount
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

## Btrfs File Structure

As a next step, we'll set up the Btrfs file structure.  
Btrfs is a modern Linux filesystem known for its advanced features such as subvolumes, snapshots, compression, and copy-on-write.
These features make it well-suited for home server setups where you want easy backups and efficient storage management.

First, let's run a few commands to analyze our currently mounted Btrfs volume:

```bash
findmnt -no FSTYPE /mnt/luks_btrfs_volume 
# btrfs
cd /mnt/luks_btrfs_volume/
btrfs subvolume list -t -o .
findmnt -vno SOURCE /mnt/luks_btrfs_volume
# /dev/mapper/luks_btrfs_volume
```

Here are some useful options for the `btrfs subvolume list` command:
* `-o`: print only subvolumes below specified path
* `-t`: print the result as a table
* `-s`: list only snapshots
* `-r`: list readonly subvolumes (including snapshots)

Since we have not created any subvolumes yet, the `btrfs subvolume list` above will return an empty list.

In Btrfs, every snapshot is a subvolume, but not every subvolume is a snapshot.
Essentially, snapshots and subvolumes both appear as subdirectories in a Btrfs filesystem, but they differ in how they come into existence and how they reference data:

* A regular subvolume is created explicitly (e.g., with btrfs subvolume create) and is initially empty.
  You can copy or move files into it. It acts independently from other subvolumes (though it still shares the underlying storage pool with them).
* A snapshot subvolume is created as a point-in-time copy of another subvolume (e.g., with btrfs subvolume snapshot).
  It references the same data blocks as its source, so at the moment of creation, a snapshot is "instant" and doesn't initially consume additional space (beyond some metadata).
  Because of Btrfs's copy-on-write (COW) behavior, changes to either the source or the snapshot afterward will gradually consume additional space.

If you see subvolumes named with a leading `@`, it's just a user- or distro-chosen method to keep things neat.
Under the hood, Btrfs doesn't care about the name.
Several Linux distributions adopted this pattern so that it's easy to distinguish actual subvolumes from ordinary directories.


```bash
cd /mnt/luks_btrfs_volume/
btrfs subvolume create /mnt/luks_btrfs_volume/@offsite_backup_storage
btrfs subvolume list -t -o .
mkdir /mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services
mkdir /mnt/luks_btrfs_volume/@offsite_backup_storage/storage
tree @offsite_backup_storage
# /mnt/luks_btrfs_volume/@offsite_backup_storage
# ├── docker_services
# └── storage
mkdir /opt/docker_services
mkdir /opt/offsite_backup_storage
```

We will later use Btrfs snapshots to generate consistent snapshots of the data to be backed up. Just so you've seen it once, it looks like this:
```bash
btrfs subvolume snapshot -r /mnt/luks_btrfs_volume/@offsite_backup_storage /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
```
This command creates a read-only snapshot of the `@offsite_backup_storage` subvolume.
The backup tool can then work on the snapshot without worrying about files changing during backup.

Once the backup is finished, we rename the snapshot to include a timestamp so we can easily revert to previous data versions if needed:
```bash
mv /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap /mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-2025-03-01-0400
```

Btrfs subvolumes and snapshots have many useful features. I encourage you to read more about them, for example:
* [Working with Btrfs - Subvolumes](https://fedoramagazine.org/working-with-btrfs-subvolumes/)
* [Working with Btrfs - Snapshots](https://fedoramagazine.org/working-with-btrfs-snapshots/)

## Systemd Setup: Coordinating Docker with Your File System Dependencies

**To recap our goal**: after a reboot, we want to pull the file system mounts before docker starts.
We want that after a reboot the encrypted volume at `/opt/luks-btrfs-volume.img` remains locked until we enter the password.
Once the system is up, running `systemctl start docker.service` should trigger a chain of systemd dependencies to ensure that:
- The encrypted volume `/mnt/luks_btrfs_volume` is decrypted and mounted.
- The subdirectories under `/mnt/luks_btrfs_volume` are mounted at `/opt/offsite_backup_storage` and `/opt/docker_services`.
- Finally, Docker itself starts once its file system dependencies are satisfied.


When we do a `systemctl start docker.service`, it will pull in these file system dependencies in the following order:
- `/mnt/luks_btrfs_volume`
- `/opt/offsite_backup_storage`
- `/opt/docker_services`

To achieve this, we add the following lines to `/etc/fstab`:
```txt
/dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume  btrfs   noauto,x-systemd.automount,relatime,compress=zstd:3,defaults    0       0
/mnt/luks_btrfs_volume/@offsite_backup_storage/storage           /opt/offsite_backup_storage none  bind,noauto,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume            0  0
/mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services   /opt/docker_services        none  bind,noauto,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage  0  0
```

After editing `/etc/fstab`, run:
```bash
systemctl daemon-reload
```

You can now see the auto-generated `.mount` and `.automount` unit files:
```bash
systemctl show -p FragmentPath systemd-cryptsetup@luks_btrfs_volume.service
# FragmentPath=/run/systemd/generator/systemd-cryptsetup@luks_btrfs_volume.service
systemctl show -p FragmentPath mnt-luks_btrfs_volume.automount
# FragmentPath=/run/systemd/generator/mnt-luks_btrfs_volume.automount
systemctl show -p FragmentPath mnt-luks_btrfs_volume.mount
# FragmentPath=/run/systemd/generator/mnt-luks_btrfs_volume.mount
show -p FragmentPath opt-offsite_backup_storage.mount
# FragmentPath=/run/systemd/generator/opt-offsite_backup_storage.mount
systemctl status opt-offsite_backup_storage.mount
systemctl show -p FragmentPath opt-docker_services.mount
# FragmentPath=/run/systemd/generator/opt-docker_services.mount
systemctl status opt-docker_services.mount
```
<p></p>

It's important to note that the normal `mount` command does not respect this `systemd` dependency structure. For example:
```bash
mount /opt/docker_services
mount | grep '/opt/'
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
```
There is no line referencing `/opt/offsite_backup_storage` here, because mount only mounted `/opt/docker_services`.

If you want the dependency structure to be honored, you must use `systemd` mechanisms like `systemctl start opt-docker_services.mount`.
```bash
systemctl start opt-docker_services.mount
mount | grep '/opt/'
# /dev/mapper/luks_btrfs_volume on /opt/offsite_backup_storage type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume)
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
```
Now both mount points are active.

> As a side remark, I initially thought `systemd-mount` might wrap the mount command to enable such behavior, but that's not actually its purpose.
> Calling `systemd-mount /opt/docker_services` triggers an error; it's used differently from the standard mount command.


Finally, we need to adapt the `docker.service` file.
The original unit file is at `/usr/lib/systemd/system/docker.service`, but we don't want to modify it directly because it's owned by the apt package manager.
Instead, we use a drop-in override. Feel free to set the `EDITOR` variable to whichever editor you prefer.
```bash
export EDITOR='emacs -nw'
systemctl edit docker
```

When the editor opens, you'll see:
```bash
### Editing /etc/systemd/system/docker.service.d/override.conf
### Anything between here and the comment below will become the contents of the drop-in file
```

Add the following:
```txt
[Unit]
RequiresMountsFor=/opt/docker_services
After=opt-docker_services.mount
```

Save and exit. You should see:
```bash
# Successfully installed edited file '/etc/systemd/system/docker.service.d/override.conf'.
```

Now let's test.
If we stop `opt-offsite_backup_storage.mount`, it should also stop `opt-docker_services.mount`, and that in turn should stop the `docker.service` unit:
```bash
systemctl stop opt-offsite_backup_storage.mount
systemctl status docker
# Active: inactive (dead) since ...; 5s ago
mount | grep '/opt/'
# empty / no output
pgrep -lf docker
# empty / no output
systemctl start docker
systemctl status docker
# Active: active (running) since Mon 2025-03-03 10:11:51 CET; 15s ago
mount | grep '/opt/'
# /dev/mapper/luks_btrfs_volume on /opt/offsite_backup_storage type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume)
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
pgrep -lf docker
# 2666282 dockerd
# ...
# 2668757 runc
# ...
```

It works as expected. Now it is time for a reboot :)
```bash
shutdown -r now
# ... wait for the reboot and reconnect via ssh ...
pgrep -lf docker
# empty / no output
mount | grep '/opt/'
# systemd-1 on /opt/docker_services type autofs (rw,relatime,fd=63,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4573)
# systemd-1 on /opt/offsite_backup_storage type autofs (rw,relatime,fd=70,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4587)
systemctl start docker
# 🔐 Please enter passphrase for disk luks_btrfs_volume on /mnt/luks_btrfs_volume: ••••
pgrep -lf docker
# 1748 dockerd
# 2301 docker-init
# ...
# 3912 runc
# ...
mount | grep '/opt/'
# systemd-1 on /opt/docker_services type autofs (rw,relatime,fd=63,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4573)
# systemd-1 on /opt/offsite_backup_storage type autofs (rw,relatime,fd=70,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4587)
# /dev/mapper/luks_btrfs_volume on /opt/offsite_backup_storage type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume)
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
findmnt -T /opt/docker_services 
# TARGET               SOURCE                                                                  FSTYPE OPTIONS
# /opt/docker_services systemd-1                                                               autofs rw,relatime,fd=63,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4573
# /opt/docker_services /dev/mapper/luks_btrfs_volume[/@offsite_backup_storage/docker_services] btrfs  rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage
findmnt -T /opt/offsite_backup_storage 
# TARGET                      SOURCE                                                          FSTYPE OPTIONS
# /opt/offsite_backup_storage systemd-1                                                       autofs rw,relatime,fd=70,pgrp=1,timeout=0,minproto=5,maxproto=5,direct,pipe_ino=4587
# /opt/offsite_backup_storage /dev/mapper/luks_btrfs_volume[/@offsite_backup_storage/storage] btrfs  rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage
df -h | grep '/opt/'
# /dev/mapper/luks_btrfs_volume  100G  5,9M   98G   1% /opt/offsite_backup_storage
```

Everything looks good. Note that the only surprise here is that `df -h` shows only `/opt/offsite_backup_storage`, but not `/opt/docker_services`.
However, any files created under `/mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services` or `/mnt/luks_btrfs_volume/@offsite_backup_storage/storage`
will appear under `/opt/docker_services` and `/opt/offsite_backup_storage` respectively, as expected.

### Pull vs. Push

Initially, I considered a "half pull, half push" approach, where mounting `/mnt/luks_btrfs_volume` would automatically trigger the unlocking of the encrypted volume (pull) and then push-mount `/opt/offsite_backup_storage`, `/opt/docker_services`, and finally start `docker.service`.
I wanted `/mnt/luks_btrfs_volume` to be the pivotal point and not `docker.service`.
But in systemd, a "push" approach doesn't really exist. Instead, systemd builds a dependency graph where units declare "I need something else" (`Requires=`), and that is only acted upon if the unit itself is requested.

Hence, if you want automatic chaining, you must express it from the parent's side (either a `[Unit] Wants=` in the parent or a `[Install] WantedBy=` in the child that symlinks into the parent).
That is the short of it: in systemd-land, "when A is up, also start B" is always done by having A say "Wants= B."
The child unit's "Requires= A" is just to ensure the correct ordering if somebody starts the child first, but does not cause child to start once the parent has come up.

## Kopia Backup

### Install

Follow the [Linux installation using APT (Debian, Ubuntu)](https://kopia.io/docs/installation/#linux-installation-using-apt-debian-ubuntu) installation guide:
```bash
curl -s https://kopia.io/signing-key | gpg --dearmor -o /etc/apt/keyrings/kopia-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kopia-keyring.gpg] http://packages.kopia.io/apt/ stable main" | tee /etc/apt/sources.list.d/kopia.list
apt update && apt install kopia
```

I will use [Rclone](https://rclone.org/) for the handling of my offsite remote backup location and I set it up with the identifier `rclone-backup-sharepoint-site:`.
I will talk more about how to set-up a rclone target via Office365 Sharepoint.
```bash
curl https://rclone.org/install.sh | sudo bash
rclone ls rclone-backup-sharepoint-site:
```

Next we will create the repository (or connect to it if you have already a remote repository set-up):
```bash
HOSTNAME="$(hostname -s)"
kopia repository create rclone --password <mysecret> --remote-path=rclone-backup-sharepoint-site:"${HOSTNAME}" --description="My Offsite BTRFS Snapshots for ${HOSTNAME}" --content-cache-size-mb=512 --metadata-cache-size-mb=512
# Or, if you already have a repository in that subfolder:
kopia repository connect rclone --remote-path=rclone-backup-sharepoint-site:"${HOSTNAME}"
# check
rclone ls rclone-backup-sharepoint-site:${HOSTNAME}
```

> Just for your reference, here is the complete output of the `kopia repository create` command:
>
> ```txt
> Initializing repository with:
>   block hash:          BLAKE2B-256-128
>   encryption:          AES256-GCM-HMAC-SHA256
>   key derivation:      scrypt-65536-8-1
>   splitter:            DYNAMIC-4M-BUZHASH
> Connected to repository.
>
> NOTICE: Kopia will check for updates on GitHub every 7 days, starting 24 hours after first use.
> To disable this behavior, set environment variable KOPIA_CHECK_FOR_UPDATES=false
> Alternatively you can remove the file "/root/.config/kopia/repository.config.update-info.json".
>
> Retention:
>   Annual snapshots:                 3   (defined for this target)
>   Monthly snapshots:               24   (defined for this target)
>   Weekly snapshots:                 4   (defined for this target)
>   Daily snapshots:                  7   (defined for this target)
>   Hourly snapshots:                48   (defined for this target)
>   Latest snapshots:                10   (defined for this target)
>   Ignore identical snapshots:   false   (defined for this target)
> Compression disabled.
>
> To find more information about default policy run 'kopia policy get'.
> To change the policy use 'kopia policy set' command.
>
> NOTE: Kopia will perform quick maintenance of the repository automatically every 1h0m0s
> and full maintenance every 24h0m0s when running as root@xxx.
>
> See https://kopia.io/docs/advanced/maintenance/ for more information.
>
> NOTE: To validate that your provider is compatible with Kopia, please run:
>
> $ kopia repository validate-provider
> ```

Next we try the suggested validate that our provider (SharePoint via rclone in my case) is compatible with Kopia:
> ```txt
> kopia repository validate-provider
> Opening 4 equivalent storage connections...
> Validating storage capacity and usage
> Validating blob list responses
> Validating non-existent blob responses
> Writing blob (5000000 bytes)
> Validating conditional creates...
> Validating list responses...
> Validating partial reads...
> Validating full reads...
> Validating metadata...
> Running concurrency test for 30s...
> Cleaning up temporary data...
> ERROR provider validation error: error validating concurrency: encountered errors: unexpected error when reading z0d359ad7-7bc8-4bb7-9dd8-8369ba975ac6bbca0f780bdf096cdec74554d8e4b05a2: error getting metadata: BLOB not found
> ```

As you can see we run into a problem similar to: [Read error when validating concurrency in new Google Drive repo](https://github.com/kopia/kopia/issues/4272).

I guess the issue is with the fact the some backends simply do not support the level of concurrency that kopia expects.
When I reduce the concurrency I don't get errors:
> ```txt
> kopia repository validate-provider --num-storage-connections=1 --put-blob-workers=1 --get-blob-workers=1 --get-metadata-workers=1
> Opening 0 equivalent storage connections...
> Validating storage capacity and usage
> Validating blob list responses
> Validating non-existent blob responses
> Writing blob (5000000 bytes)
> Validating conditional creates...
> Validating list responses...
> Validating partial reads...
> Validating full reads...
> Validating metadata...
> Running concurrency test for 30s...
> All good.
> Cleaning up temporary data...
> ```

Next we take care of backup policies:
```bash
kopia policy set --global --max-parallel-snapshots=1 --max-parallel-file-reads=1
kopia policy set --global --keep-latest=7 --keep-hourly=0 --keep-daily=14 --keep-weekly=4 --keep-monthly=12 --keep-annual=3
kopia policy set --global --compression=pgzip
# reduce parallelism:
# check that everything is as expected
kopia policy get --global # kopia policy show --global
kopia repository status
# do a connect: this will ask you for your password and make sure you remember your password:
kopia repository connect rclone --remote-path=rclone-backup-sharepoint-site:"${HOSTNAME}"
```

The reduction of parallelism should also lead to [Decrease Kopia's CPU Usage](https://kopia.io/docs/faqs/#how-do-i-decrease-kopias-cpu-usage) and [Decrease Kopia's Memory (RAM) Usage](https://kopia.io/docs/faqs/#how-do-i-decrease-kopias-memory-ram-usage).

We want to do the following each day at 4:00 AM:

1. Create a read-only btrfs snapshot of `/mnt/luks_btrfs_volume/@offsite_backup_storage` at `/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap`.
1. Run Kopia on that snapshot: `kopia snapshot create --parallel=1 /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap`.
    1. You could check via `rclone ls rclone-backup-sharepoint-site:`.
1. Rename that snapshot to `/mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-YYYY-MM-DD-HHMM`.

And we want to do all of that via inline scripting to keep everything in one place.
We therefore embed a shell snippet directly in the systemd service.

Create a file named `/usr/local/bin/btrfs-kopia-backup.sh`:
```bash
#!/usr/bin/env bash

# ---------------------------------------------------------
# btrfs-kopia-backup.sh
#
# 1) Create a read-only BTRFS snapshot
# 2) Run a Kopia snapshot
# 3) Rename the snapshot with a date/time suffix
# 4) (Optional) Send a Pushover alert if something fails
# ---------------------------------------------------------

set -e

###############################################################################
# CONFIG SECTION
#
# Toggle this to "true" to enable Pushover alerts on error, or to "false" (or
# comment out) if you do not want alerts.
###############################################################################
ALERT_ENABLED=true

# Pushover credentials (DO NOT store secrets in version control!)
PUSHOVER_TOKEN="PUT_YOUR_TOKEN_HERE"
PUSHOVER_USER="PUT_YOUR_USERKEY_HERE"


###############################################################################
# Pushover function
# You can comment out the entire function if you never want to use it,
# or just set ALERT_ENABLED=false above.
###############################################################################
function pushover_alert() {
  local message="$1"
  local title="$2"

  # If your Pushover config includes more data (HTML, link, etc.), adapt as needed
  curl -s --fail \
    -F "token=${PUSHOVER_TOKEN}" \
    -F "user=${PUSHOVER_USER}" \
    -F "sound=none" \
    -F "title=${title}" \
    -F "message=${message}" \
    -F "html=1" \
    https://api.pushover.net/1/messages.json \
  || echo "Warning: Failed to send Pushover alert (curl error)."
}

###############################################################################
# Error Handler
# This function is called automatically on any command error
# (because of 'set -e' plus the 'trap' directive).
###############################################################################
function error_handler() {
  local exit_code=$?
  local line_no=$1

  echo "ERROR: Backup script failed at line ${line_no}. Exit code: ${exit_code}"
  if [ "$ALERT_ENABLED" = "true" ]; then
    # Build an alert message. Adjust to taste:
    pushover_alert \
      "Backup on host $(hostname) failed at line ${line_no} (exit code ${exit_code})" \
      "BTRFS-Kopia Backup Failed"
  fi

  # Exit with the same code to signal failure
  exit "$exit_code"
}

# If alerts are enabled, set a trap to catch errors and call 'error_handler'
if [ "$ALERT_ENABLED" = "true" ]; then
  trap 'error_handler $LINENO' ERR
fi


###############################################################################
# Main Backup Logic
###############################################################################

TIMESTAMP="$(date +%Y-%m-%d-%H%M)"
SNAP_NAME="@offsite_backup_storage_backup-snap"
SRC_SUBVOL="/mnt/luks_btrfs_volume/@offsite_backup_storage"
SNAP_DEST="/mnt/luks_btrfs_volume/${SNAP_NAME}"

echo "Creating read-only BTRFS snapshot...: btrfs subvolume snapshot -r ${SRC_SUBVOL} ${SNAP_DEST}"
btrfs subvolume snapshot -r "$SRC_SUBVOL" "$SNAP_DEST"

echo "Running Kopia snapshot...: /usr/bin/kopia snapshot create --parallel=1 ${SNAP_DEST}"
/usr/bin/kopia snapshot create --parallel=1 "$SNAP_DEST"

NEW_NAME="/mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-${TIMESTAMP}"
echo "Renaming snapshot to $NEW_NAME"
mv "$SNAP_DEST" "$NEW_NAME"

echo "Backup completed successfully!"
```

Don't forget to make the script executable:
```bash
chmod +x /usr/local/bin/btrfs-kopia-backup.sh
```
<p></p>

And either set `ALERT_ENABLED=false` or provide the [Pushover](https://pushover.net/) credentials in `PUSHOVER_TOKEN="PUT_YOUR_TOKEN_HERE"` and `PUSHOVER_USER="PUT_YOUR_USERKEY_HERE"`.

Create a file named `/etc/systemd/system/btrfs-kopia-backup.service`:
```ini
[Unit]
Description=BTRFS to Kopia Backup (Offsite)
Requires=network-online.target
After=network-online.target

[Service]
Type=oneshot
Environment=HOME="/root"
ExecStart=/usr/local/bin/btrfs-kopia-backup.sh
```

Notes:
* We set `Type=oneshot` so it runs the script once and exits.
* Inline Bash script is placed in `ExecStart=/usr/bin/bash -c '...'`.
* `set -e` ensures that if any command fails, the script exits with an error.

Create a file named `/etc/systemd/system/btrfs-kopia-backup.timer`:
```ini
[Unit]
Description=Daily BTRFS to Kopia Backup at 4:00 AM

[Timer]
OnCalendar=*-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

* `OnCalendar=*-*-* 04:00:00` means daily at 4:00 AM.
* `Persistent=true` ensures that if the machine was off at 4:00 AM, the job will run at the next opportunity upon boot.

Enable and Start the Timer
```bash
systemctl daemon-reload
systemctl enable btrfs-kopia-backup.timer
systemctl start btrfs-kopia-backup.timer
# check its status with:
systemctl status btrfs-kopia-backup.timer
systemctl status btrfs-kopia-backup.service
ll /mnt/luks_btrfs_volume/
# in case that due to your tests the directory @offsite_backup_storage_backup-snap would still be present: 
# btrfs subvolume delete /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
/usr/local/bin/btrfs-kopia-backup.sh
ll /mnt/luks_btrfs_volume/
# in case that due to your tests the directory @offsite_backup_storage_backup-snap would still be present: 
# btrfs subvolume delete /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
systemctl start btrfs-kopia-backup.service
systemctl status btrfs-kopia-backup.service
journalctl -u btrfs-kopia-backup.service
# list subvolumes
btrfs subvolume list -t -o /mnt/luks_btrfs_volume/
# list snapshots
btrfs subvolume list -t -o -s /mnt/luks_btrfs_volume/
kopia snapshot list
```

**Maintenance scheduling in Kopia**: Maintenance tasks in Kopia typically include garbage collection of unreferenced data, compaction of indexes, and other tasks needed to keep the repository efficient and healthy. When you see a note like:
```txt
NOTE: Kopia will perform quick maintenance of the repository automatically every 1h0m0s
and full maintenance every 24h0m0s when running as root@xxx.
```
it means Kopia will try to trigger these maintenance operations on a certain schedule.
However, this is an internal scheduling mechanism - it does not rely on cron, systemd timers, or other OS-level schedulers.
Instead, Kopia tracks the last time it performed maintenance and will run the next one when it deems it's due, under one of these conditions:

1. If Kopia is running as a persistent server (e.g., `kopia server start`), it will have its own internal timer that kicks off maintenance in the background.
1. If you run Kopia CLI commands regularly (e.g., `kopia snapshot` or `kopia policy set`) and enough time has passed since the last maintenance, Kopia may trigger the maintenance at the start or end of those operations.

In other words, Kopia does not install any cron jobs or systemd timer units.
The note merely tells you that if this process (or user) keeps Kopia running or triggers Kopia commands regularly, Kopia will attempt to maintain the repository in those intervals (hourly for quick tasks, daily for full tasks).
You can verify:
```bash
kopia repository status
```

If you prefer to explicitly schedule or force maintenance:
```bash
# Quick maintenance (compact small indexes, etc.)
kopia maintenance run

# Pruning/Retention: Kopia also has internal "maintenance" or "prune" commands for removing old data from the repository:
kopia snapshot prune --delete

# Full maintenance (rebuild indexes, more thorough compaction, etc.): It's a good idea to schedule a periodic run of:
kopia maintenance run --full
```

**BTRFS Snapshot Rotation**: We might want a similar daily/weekly/monthly/annual scheme for BTRFS snapshots themselves.
That would be a separate rotation policy and process, because Kopia only manages its own snapshot retention in the repository, not the local BTRFS subvolumes.

Here is an example approach: After renaming the snapshot in the script, you could keep old ones only for 14 days. Something like:
```bash
# in the ExecStart inline script, after renaming:
find /mnt/luks_btrfs_volume/ -maxdepth 1 -name "@offsite_backup_storage_snapshot-*" -type d -mtime +14 -exec btrfs subvolume delete {} \;
```



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

