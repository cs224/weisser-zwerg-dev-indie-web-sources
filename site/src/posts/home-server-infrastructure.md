---
layout: "layouts/post-with-toc.njk"
title: "Home Server Blueprint: Rock-Solid Home Server with Unattended Reboots, Secure Disk Encryption, and Cost-Effective Offsite Backups"
description: "Safeguard Your Data by Combining Encrypted Storage, Btrfs Snapshots, and Kopia/Rclone Offsite Backup - All Guided by a Simple Makefile for Ultimate Peace of Mind"
creationdate: 2025-03-06
keywords: home server, linux, debian, ubuntu, disk encryption, luks, btrfs snapshots, unattended reboot, backup and restore, rclone, kopia, onedrive, sharepoint, offsite backups, Makefile, docker
date: 2025-03-06
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

<small>

> If you haven't used them before, GitHub Gists are mini Git repositories.
> This means you can clone them just like any other Git repository. Here's how:
> ```bash
> git clone https://gist.github.com/cs224/34eebc2f9389404d7c0192d45cae7259.git .
> ```
> When you add a trailing dot ( `.` ) to the `git clone` command, Git places the cloned files directly into your current directory instead of creating a new folder.
> In most cases, you can work with Gists just as you would with any normal Git repo - branching, committing, and pushing changes back to the Gist are all supported.

</small>

If you're unsure, you can begin with a local system container or a virtual machine managed by Incus.
For guidance on this, check the appendix: [Incus/LXD as an Alternative to Vagrant for DevOps Testing](#incus%2Flxd-as-an-alternative-to-vagrant-for-devops-testing).

Next install the following packages:

```bash
apt install -y ca-certificates make curl gnupg systemd-cryptsetup systemd-resolved
```

And docker:

```bash
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release && echo "$ID")/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/$(. /etc/os-release && echo "$ID") $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
systemctl status docker
docker run hello-world
# disable docker service as we will start it manually later:
# > systemctl start docker.service
systemctl disable docker.service
systemctl disable docker.socket
```

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
In the [appendix](#dedicated-sharepoint-team-site-as-offsite-backup-storage), I'll explain how to use a `Document Library` inside a dedicated `SharePoint Team Site` as offsite backup storage.
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
<p></p>

> If you're dealing with partitions on a physical disk instead of a sparse file, you may need to adjust the partition size first using tools like parted before resizing the LUKS container and btrfs filesystem.


For more in-depth information, see [Resize a Btrfs Filesystem](https://linuxhint.com/resize_a_btrfs_filesystem/).

### Configure `/etc/crypttab` and `/etc/fstab` for On-Demand Mounting

If `cryptsetup` isn't already installed, you can add it with:
```bash
apt install cryptsetup
```
We need to coordinate two `systemd` generator mechanisms so that your LUKS-backed `btrfs` filesystem can be mounted on demand by simply running `mount /mnt/luks_btrfs_volume`:


* **crypttab generator**: creates a `systemd-cryptsetup@luks_btrfs_volume.service` unit to open your LUKS device.
* **fstab generator**: creates `mnt-luks_btrfs_volume.mount` and `mnt-luks_btrfs_volume.automount` units for your mount point.

In both `/etc/crypttab` and `/etc/fstab`, make sure to specify `noauto`.
Otherwise, your system could hang at boot waiting for a passphrase, which undermines unattended operation.


> You might notice we use hyphens in the image file name (`luks-btrfs-volume.img`) but underscores in the device mapper file and mount point (`luks_btrfs_volume`).
> This is to avoid confusion with how `systemd` automatically escapes hyphens (`-`) in unit file names.<br>
> As an example `systemd-escape -p 'my-volume-name'` would show the result `my\x2dvolume\x2dname`.<br>
> The reason for that behaviour is that `systemd` replaces slashes (`/`) with minus (`-`) when it auto generates `.mount` unit files.


Let's start with adding an entry to `/etc/crypttab`.

Systemd reads `/etc/crypttab` during boot (and on daemon-reload) to decide how to open encrypted devices.
We'll configure it so the device doesn't open at boot - only when explicitly requested.

Create or edit `/etc/crypttab` and add a line like this:
```txt
# <mapped_name>     <source>                                     <keyfile> <options>
luks_btrfs_volume   /opt/luks-btrfs-volume.img                   none      luks,noauto,loop,timeout=120
```
* `luks`: tells `systemd-cryptsetup` it's a LUKS device.
* `noauto`: keeps it from automatically opening at boot.
* `loop`: if `/opt/luks-btrfs-volume.img` is a regular file, `systemd-cryptsetup` needs to create a loop device automatically. The loop option in `crypttab` is what instructs `systemd` to do so.
* `timeout=120`: means "prompt for 120 seconds" if passphrase is needed. That's a safety measure in case you ever remove `noauto` and reboot, so that the system will wait a maximum of 2 minutes until it actually continues to boot.


Verify the generator behavior:
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
# Enter your passphrase when prompted.

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

Next, add an entry to `/etc/fstab` to reference the mapped device. LUKS devices appear under `/dev/mapper/<name>`, so you can use: 
```txt
/dev/mapper/luks_btrfs_volume   /mnt/luks-btrfs-volume  btrfs   noauto,x-systemd.automount,relatime,compress=zstd:3,defaults     0       0
```

* `noauto` = do not mount automatically at boot.
* `x-systemd.automount` = triggers `systemd` to open the LUKS device (via `/etc/crypttab`) and then mount it when you run `mount /mnt/luks_btrfs_volume`.

Check the fstab generator:
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
```
Now, mount it:
```bash
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

Now try a reboot. After a reboot, confirm everything is set up correctly:
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

Once you successfully unlock and mount the volume, your file-backed, LUKS-encrypted `btrfs` filesystem should be fully operational.
We can now move on to the next step.

### Btrfs File Structure

As the next step, we'll set up the Btrfs file structure.  
Btrfs is a modern Linux filesystem known for features like **subvolumes**, **snapshots**, **compression**, and **copy-on-write (COW)**.
These capabilities make it an excellent choice for a home server where you want reliable backups and efficient storage management.


First, let's run a few commands to analyze our currently mounted Btrfs volume:

```bash
findmnt -no FSTYPE /mnt/luks_btrfs_volume 
# btrfs

cd /mnt/luks_btrfs_volume/
btrfs subvolume list -t -o .
findmnt -vno SOURCE /mnt/luks_btrfs_volume
# /dev/mapper/luks_btrfs_volume
```
`findmnt -no FSTYPE` checks the filesystem type without headers, confirming it's Btrfs.

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

We'll create one subvolume to hold our offsite backup data:
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

We will later use Btrfs snapshots to generate consistent snapshots of the data to be backed up.
Btrfs snapshots give you a quick and efficient way to capture a consistent backup.
For example:
```bash
btrfs subvolume snapshot -r /mnt/luks_btrfs_volume/@offsite_backup_storage /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
```
This creates a read-only snapshot of `@offsite_backup_storage`.
Your backup tool can safely use this snapshot without worrying about ongoing file changes.

Once the backup is finished, we rename the snapshot to include a timestamp so we can easily revert to previous data versions if needed:
```bash
mv /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap /mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-2025-03-01-0400
```

Btrfs subvolumes and snapshots offer powerful functionality for efficient backups. If you want to dive deeper, check out:
* [Working with Btrfs - Subvolumes](https://fedoramagazine.org/working-with-btrfs-subvolumes/)
* [Working with Btrfs - Snapshots](https://fedoramagazine.org/working-with-btrfs-snapshots/)

With this groundwork in place, we can now move on to the coordination of `docker.service` with our file system dependencies.

### Systemd Setup: Coordinating Docker with Your File System Dependencies

#### To Recap Our Goal 

After a reboot, we want the encrypted volume at `/opt/luks-btrfs-volume.img` to stay locked until we enter the decryption password.
Only then can Docker start and use the underlying file system.
Running `systemctl start docker.service` should trigger a chain of `systemd` dependencies ensuring:
- The volume `/mnt/luks_btrfs_volume` is decrypted and mounted.  
- The subdirectories under `/mnt/luks_btrfs_volume` are mounted at `/opt/offsite_backup_storage` and `/opt/docker_services`.  
- Docker starts last, once its file system dependencies are satisfied.

> `systemd` automatically generates individual `.mount` and `.automount` unit files from your `/etc/fstab` entries.
> This allows more granular control over the order in which volumes are mounted.
> For our encrypted volume, `systemd-cryptsetup@luks_btrfs_volume.service` handles unlocking the device before mounting.  

#### How Systemd Chains Our Mountpoints

When you run `systemctl start docker.service`, it will detect and fulfill the required file system dependencies in the following order:
- `/mnt/luks_btrfs_volume`
- `/opt/offsite_backup_storage`
- `/opt/docker_services`

To enable this behavior, we add these lines to `/etc/fstab`:
```txt
/dev/mapper/luks_btrfs_volume   /mnt/luks_btrfs_volume  btrfs   noauto,x-systemd.automount,relatime,compress=zstd:3,defaults    0       0
/mnt/luks_btrfs_volume/@offsite_backup_storage/storage           /opt/offsite_backup_storage none  bind,noauto,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume            0  0
/mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services   /opt/docker_services        none  bind,noauto,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage  0  0
```

After editing `/etc/fstab`, refresh `systemd`:
```bash
systemctl daemon-reload
```

You can then inspect the auto-generated `.mount` and `.automount` unit files:
```bash
systemctl show -p FragmentPath systemd-cryptsetup@luks_btrfs_volume.service
# FragmentPath=/run/systemd/generator/systemd-cryptsetup@luks_btrfs_volume.service

systemctl show -p FragmentPath mnt-luks_btrfs_volume.automount
# FragmentPath=/run/systemd/generator/mnt-luks_btrfs_volume.automount

systemctl show -p FragmentPath mnt-luks_btrfs_volume.mount
# FragmentPath=/run/systemd/generator/mnt-luks_btrfs_volume.mount

systemctl show -p FragmentPath opt-offsite_backup_storage.mount
# FragmentPath=/run/systemd/generator/opt-offsite_backup_storage.mount
systemctl status opt-offsite_backup_storage.mount

systemctl show -p FragmentPath opt-docker_services.mount
# FragmentPath=/run/systemd/generator/opt-docker_services.mount
systemctl status opt-docker_services.mount
```


#### Using Systemctl Instead of Mount Directly

A key point is that the regular `mount` command does not honor the `systemd` dependency structure. For example, if you run:
```bash
mount /opt/docker_services
mount | grep '/opt/'
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
```
You won't see any line for `/opt/offsite_backup_storage` here, because mount only attached `/opt/docker_services`.
If you want to respect the dependency chain, you must use `systemd` mechanisms, such as:
```bash
systemctl start opt-docker_services.mount
mount | grep '/opt/'
# /dev/mapper/luks_btrfs_volume on /opt/offsite_backup_storage type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/mnt/luks_btrfs_volume,x-systemd.after=/mnt/luks_btrfs_volume)
# /dev/mapper/luks_btrfs_volume on /opt/docker_services type btrfs (rw,relatime,compress=zstd:3,ssd,space_cache=v2,subvolid=257,subvol=/@offsite_backup_storage,x-systemd.automount,x-systemd.requires=/opt/offsite_backup_storage,x-systemd.after=/opt/offsite_backup_storage)
```
Now both mount points are active in the correct order.

`x-systemd.automount` instructs systemd to mount the file system only when something actually tries to access it.
This reduces boot time by deferring the mount operation until it's needed.

> As a side remark, I initially thought `systemd-mount` might wrap the mount command to enable such behavior, but that's not actually its purpose.
> Calling `systemd-mount /opt/docker_services` triggers an error; it's used differently from the standard mount command.

#### Override the Docker Service

Finally, we need to modify how Docker starts so that it depends on our mount points.
The default `docker.service` file is at `/usr/lib/systemd/system/docker.service`, and you should never edit that file directly because it's owned by the package manager.
Instead, create a drop-in override.
Feel free to set the `EDITOR` variable to whichever editor you prefer.

```bash
export EDITOR='emacs -nw' # Use your preferred text editor here
systemctl edit docker
```

When the editor opens, you'll see:
```bash
### Editing /etc/systemd/system/docker.service.d/override.conf
### Anything between here and the comment below will become the contents of the drop-in file
```

Add the following lines:
```txt
[Unit]
RequiresMountsFor=/opt/docker_services
After=opt-docker_services.mount
```

Save and exit. You should see a confirmation message like:
```bash
# Successfully installed edited file '/etc/systemd/system/docker.service.d/override.conf'.
```

#### Testing the Setup

If you stop the mount unit for `/opt/offsite_backup_storage`, it should also stop `/opt/docker_services.mount`, and that in turn will stop `docker.service`:
```bash
systemctl stop opt-offsite_backup_storage.mount
systemctl status docker
# Active: inactive (dead) since ...; 5s ago
mount | grep '/opt/'
# empty / no output
pgrep -lf docker
# empty / no output
```
When you start Docker again:
```bash
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

Everything works as intended. Dependencies are enforced strictly.

#### Performing a Reboot

After a reboot, the system initially does not unlock and mount the encrypted volume.
When you start Docker, you'll be prompted for the passphrase:
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

`df -h` may only display the first bind-mounted directory, but both `/opt/offsite_backup_storage` and `/opt/docker_services` are active.
You can always confirm with `mount | grep '/opt/'` or `findmnt -T ...`.
Any files created under `/mnt/luks_btrfs_volume/@offsite_backup_storage/docker_services` or `/mnt/luks_btrfs_volume/@offsite_backup_storage/storage`
will appear under `/opt/docker_services` and `/opt/offsite_backup_storage` respectively, as expected.

Everything is now in place for a reliable, encrypted environment where Docker starts only after your file systems are properly unlocked and mounted.

### Pull vs. Push

**First Thoughts**: Initially, I wanted a mixed "pull-push" approach: mounting `/mnt/luks_btrfs_volume` would automatically unlock the encrypted volume (pull), then immediately push-mount `/opt/offsite_backup_storage` and `/opt/docker_services`, and finally start `docker.service`. My idea was to make `/mnt/luks_btrfs_volume` the central trigger instead of placing all responsibility on `docker.service`.

**Where Systemd Comes In**: However, `systemd` doesn't really work in a "push" style. Instead, it creates a dependency graph where each unit can declare what it needs using directives like `Requires=` or `Wants=`. These dependencies take effect only when the unit itself is requested or started. In other words, systemd operates in a "pull" fashion.

- **Requires=**:
  Declares that if Unit A has `Requires=B`, then starting A also starts B. If B fails to start, A is considered failed too.  
- **Wants=**:
  A weaker version of `Requires=`. It still attempts to start B when A starts, but if B fails, it doesn't bring down A.  
- **WantedBy=**:
  Often used in the `[Install]` section to enable a unit at boot. It creates a symlink in the parent's `.wants/` directory.

**Configuring Automatic Chaining**: If you want an automated chain of events - like unlocking a volume, mounting directories, and then launching Docker - each step must be declared from the parent's perspective.
For instance, if you want "when A is up, also start B," you have A say `Wants=B` (or `Requires=B`).
The child unit's statement "`Requires=A`" just ensures correct ordering if you directly start the child.
It does **not** cause the child to start if A is running.


### Kopia Backup

#### Install

Follow the [Linux installation using APT (Debian, Ubuntu)](https://kopia.io/docs/installation/#linux-installation-using-apt-debian-ubuntu) steps:
```bash
curl -s https://kopia.io/signing-key | gpg --dearmor -o /etc/apt/keyrings/kopia-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kopia-keyring.gpg] http://packages.kopia.io/apt/ stable main" | tee /etc/apt/sources.list.d/kopia.list
apt update && apt install kopia
```

I'll use [Rclone](https://rclone.org/) to handle my offsite remote backup location, with the identifier `rclone-backup-sharepoint-site:`.
I will talk more about how to set-up a Rclone target via Office365 Sharepoint in the appendix.
Rclone can integrate with various cloud storage platforms, including Microsoft's SharePoint and OneDrive, Google Drive, and many others.
To install Rclone and test its connection, do:
```bash
curl https://rclone.org/install.sh | sudo bash
rclone ls rclone-backup-sharepoint-site:
```

#### Create or Connect Kopia Repository

Next, we create a new Kopia repository - or connect to an existing one - on our remote target:
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

#### Validate Kopia Provider Compatibility

Next, we validate our remote provider's compatibility (SharePoint via rclone in my case) with Kopia as suggested:
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

As you can see, we may encounter concurrency issues similar to what's described in this GitHub issue: : [Read error when validating concurrency in new Google Drive repo](https://github.com/kopia/kopia/issues/4272).

> Some backends (like certain SharePoint or Google Drive configurations) might not handle Kopia's high concurrency by default.
> Reducing concurrency can resolve these errors, but it also limits backup speed.

When we reduce concurrency, validation succeeds without errors:
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

#### Backup Policy and Parallelism

Next we take care of backup policies. We need to reduce Kopia's parallelism and adjust retention policies.
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

#### Automating Daily Backups with Btrfs Snapshots

We want Kopia to run each day at 4:00 AM, using a read-only Btrfs snapshot. Our plan:

1. Create a read-only btrfs snapshot of `/mnt/luks_btrfs_volume/@offsite_backup_storage` at `/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap`.
1. Run Kopia on that snapshot: `kopia snapshot create --parallel=1 /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap`.
    1. You could check via `rclone ls rclone-backup-sharepoint-site:`.
1. Rename that snapshot to `/mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-YYYY-MM-DD-HHMM`.

Create a file named `/usr/local/bin/btrfs-kopia-backup.sh`. You can see the full file in this [Gist](https://gist.github.com/cs224/34eebc2f9389404d7c0192d45cae7259).
Here I'll focus on the most relevant lines only:
```bash
# ...
###############################################################################
# CONFIG SECTION
#
# Toggle this to "true" to enable Pushover alerts on error, or to "false" (or
# comment out) if you do not want alerts.
###############################################################################
ALERT_ENABLED=true

# Pushover credentials (DO NOT store secrets in version control!)
PUSHOVER_TOKEN="...sometoken..."
PUSHOVER_USER="...someuser..."
# ...
echo "Creating read-only BTRFS snapshot...: btrfs subvolume snapshot -r ${SRC_SUBVOL} ${SNAP_DEST}"
btrfs subvolume snapshot -r "$SRC_SUBVOL" "$SNAP_DEST"

echo "Running Kopia snapshot...: /usr/bin/kopia snapshot create --parallel=1 ${SNAP_DEST}"
/usr/bin/kopia snapshot create --parallel=1 "$SNAP_DEST"
# ...
```

Make it executable:
```bash
chmod +x /usr/local/bin/btrfs-kopia-backup.sh
```
<p></p>

And either set `ALERT_ENABLED=false` or provide the [Pushover](https://pushover.net/) credentials in `PUSHOVER_TOKEN="PUT_YOUR_TOKEN_HERE"` and `PUSHOVER_USER="PUT_YOUR_USERKEY_HERE"`.

Create `/etc/systemd/system/btrfs-kopia-backup.service`:
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
* Using `Type=oneshot` ensures the service runs once and then exits, rather than staying active.

Create `/etc/systemd/system/btrfs-kopia-backup.timer`:
```ini
[Unit]
Description=Daily BTRFS to Kopia Backup at 4:00 AM

[Timer]
OnCalendar=*-*-* 04:00:00
Persistent=true

[Install]
WantedBy=timers.target
```

* `OnCalendar=*-*-* 04:00:00` triggers the job daily at 4:00 AM. 
* The `Persistent=true` option will run missed jobs on boot if the system was powered off at 4:00 AM.

#### Enable and Start the Timer

```bash
systemctl daemon-reload
systemctl enable btrfs-kopia-backup.timer
systemctl start btrfs-kopia-backup.timer

# Check timer status
systemctl status btrfs-kopia-backup.timer
systemctl status btrfs-kopia-backup.service

# Verify the backup via the btrfs-kopia-backup.sh script:
ll /mnt/luks_btrfs_volume/
# in case that due to your tests the directory @offsite_backup_storage_backup-snap would still be present: 
# btrfs subvolume delete /mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
/usr/local/bin/btrfs-kopia-backup.sh

# Verify the backup via the btrfs-kopia-backup.service:
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

You should now have automated, daily offsite backups using a Btrfs snapshot and Kopia.
This workflow allows you to maintain consistent, point-in-time snapshots of your data, all while retaining historical backups according to your Kopia retention policy.

#### Maintenance Scheduling in kopia

Maintenance tasks in Kopia typically include garbage collection of unreferenced data, compaction of indexes, and other operations that keep the repository efficient and healthy. When you see a note like:
```txt
NOTE: Kopia will perform quick maintenance of the repository automatically every 1h0m0s
and full maintenance every 24h0m0s when running as root@xxx.
```
it means Kopia internally schedules these tasks without relying on cron jobs, systemd timers, or other OS-level schedulers.
Kopia tracks the last time it performed maintenance and triggers the next one after a set interval, under one of the following conditions:
1. Persistent Server Mode: If Kopia is running as a persistent server (e.g., `kopia server start`), it will have its own internal timer that kicks off maintenance in the background.
1. Frequent CLI Commands: If you run Kopia CLI commands regularly (e.g., `kopia snapshot` or `kopia policy set`) and enough time has passed since the last maintenance, Kopia may trigger the maintenance at the start or end of those operations.

In other words, Kopia does not install any system-level scheduler components.
Instead, it waits until it's been running long enough or is invoked often enough before it decides to do cleanup.
You can check your repository status at any time:
```bash
kopia repository status
```

If you prefer to force or explicitly schedule maintenance, you have these options:
```bash
# Quick maintenance (compact small indexes, etc.)
kopia maintenance run

# Pruning/Retention: Kopia also has internal "maintenance" or "prune" commands for removing old data from the repository:
kopia snapshot prune --delete

# Full maintenance (rebuild indexes, more thorough compaction, etc.): It's a good idea to schedule a periodic run of:
kopia maintenance run --full
```

#### BTRFS Snapshot Rotation

Kopia's snapshot retention only applies to the repository itself, not to your local BTRFS snapshots.
If you want to manage a daily, weekly, or monthly rotation of BTRFS snapshots, that's a separate process.

For example, to keep only snapshots newer than 14 days, you could add a command like this to your backup script after you rename the snapshot:
```bash
# in the ExecStart inline script, after renaming:
find /mnt/luks_btrfs_volume/ -maxdepth 1 -name "@offsite_backup_storage_snapshot-*" -type d -mtime +14 -exec btrfs subvolume delete {} \;
```

This snippet will locate and delete any BTRFS snapshots older than 14 days. Adjust it to match your preferred rotation schedule.

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

## Appendix

### Incus/LXD as an Alternative to Vagrant for DevOps Testing

LXD/Incus is a manager for system containers, application containers, and virtual machines. This means you can create and operate all three using a single, consistent commandline (CLI) interface.

#### Introduction and History

Incus is a fork of the [LXD](https://canonical.com/lxd) project, which I briefly introduced in my 2019 blog post [Local discourse: vagrant, ansible, lxd, docker, discourse-embedding](../local-discourse-on-vagrant/#additional-requirement%3A-docker-in-lxd).

A major governance shift in mid-to-late 2023 led to [Canonical](https://canonical.com) taking direct control of the LXD project and [moving it out of the Linux Containers (LXC) umbrella](https://linuxcontainers.org/lxd/).
In response, the original maintainers from [LinuxContainers.org](https://linuxcontainers.org/)  created [Incus](https://linuxcontainers.org/incus/) - a community-driven fork designed to be a drop-in replacement for LXD.

Historically, LXD was hosted under the [LinuxContainers.org](https://linuxcontainers.org/) community at `github.com/lxc/lxd`.
However, after Canonical's takeover, the project was relocated to `github.com/canonical/lxd`.
Canonical has committed to continuing LXD's development, with a strong focus on its integration with [Ubuntu](https://ubuntu.com) and the [Snap](https://en.wikipedia.org/wiki/Snap_(software)) ecosystem.

With Incus, the original maintainers aim to preserve community governance while keeping compatibility with LXD's API (for now).
If you're trying to choose between LXD and Incus, both remain quite similar at this stage.
However, as development continues, their features and roadmaps may gradually diverge.

[Vagrant](https://www.vagrantup.com/) makes it easy to create and configure lightweight, reproducible, and portable development environments.
In late 2023, [HashiCorp](https://www.hashicorp.com/) announced it would move several of its open-source projects (including Vagrant) from the Mozilla Public License ([MPL 2.0](https://www.mozilla.org/en-US/MPL/2.0/)) to the Business Source License ([BSL](https://en.wikipedia.org/wiki/Business_Source_License)).
This license is sometimes referred to as "source-available" rather than fully open source.
While everyday usage - like local development or personal testing - remains mostly unaffected, there may be new restrictions on how you use and distribute Vagrant if you're operating in commercial or "competitive" contexts.

And the final term to introduce for this section is `cloud-init`. Cloud-init is an open-source tool that automatically configures and customizes cloud instances on their first boot ([provisioning](https://en.wikipedia.org/wiki/Provisioning_(technology)#Server_provisioning)).
It can handle tasks such as setting up SSH keys, creating user accounts, and installing packages - without requiring manual intervention.
Official documentation and resources for `cloud-init` are available at [cloud-init.io](https://cloud-init.io) and [cloudinit.readthedocs.io](https://cloudinit.readthedocs.io).
The source code and issue tracking primarily reside on [Launchpad](https://launchpad.net/cloud-init), with a [GitHub](https://github.com/canonical/cloud-init) mirror for convenience.

Incus and `cloud-init` form a powerful duo to replace Vagrant for creating and configuring lightweight, reproducible, and portable development environments.
Incus provides the container and VM management, while `cloud-init` automates initial setup and configuration.
This combination is an excellent alternative for DevOps testing and beyond.

#### Installation and Setup

The [How to install Incus](https://linuxcontainers.org/incus/docs/main/installing/#installing) documentation is straightforward.
On Ubuntu 24.04 LTS and later, you can install Incus directly via a native package.
On such systems, just running `apt install incus` will get Incus installed.
To run virtual machines, also run `apt install qemu-system`.
If migrating from LXD, also run `apt install incus-tools` to get the `lxd-to-incus` command.

After installing Incus, make sure you have an `incus-admin` group on your system.
Users in this group can interact with Incus. See [Manage access to Incus](https://linuxcontainers.org/incus/docs/main/installing/#installing-manage-access) for instructions.

Before you can create an Incus instance, you must configure and initialize Incus.
Please refer to [How to initialize Incus](https://linuxcontainers.org/incus/docs/main/howto/initialize) for a detailed description.
To create a minimal setup with default options, you can skip the configuration steps by adding the `--minimal` flag to the incus admin init command:
```bash
incus admin init --minimal
```

In short, you could install everything at once with:
```bash
apt update && apt install incus qemu-system incus-tools
sudo adduser YOUR-USERNAME incus-admin
# Because group membership is normally only applied at login, you might need to either re-open your user session or
# use the newgrp incus-admin command in the shell you're using to talk to Incus.
newgrp incus-admin

incus admin init --minimal 
```
<p></p>

> Because group membership is normally only applied at login, you might need to either re-open your user session or
> use the `newgrp incus-admin` command in the shell you're using to talk to Incus until your next system reboot.

**Optional but Recommended**:
If you want to refer to Incus instances by hostname instead of looking up IP addresses, you can integrate the Incus network with your system's DNS.
First, set `dns.mode` to `managed` and define a `dns.domain`. In this example, we'll use `incus` as `dns.domain`:
```bash
# Find the Incus network interface name (usually `incusbr0`)
incus network list

# Configure `dns.mode` and `dns.domain`
incus network get incusbr0 dns.mode
incus network set incusbr0 dns.mode managed

incus network get incusbr0 dns.domain
incus network set incusbr0 dns.domain incus
```

Next, configure DNS on the Incus bridge, so only `.incus` lookups use its DNS server.
The following commands apply to the current runtime.
For the explanation, and a small systemd unit that makes this persistent, see [Split DNS for Incus with systemd-resolved](#split-dns-for-incus-with-systemd-resolved).

```bash
# Check the Incus network IPv4 address (example: 10.111.4.1/24)
incus network get incusbr0 ipv4.address
# 10.111.4.1/24

# Use the bridge address without the subnet mask
sudo resolvectl dns incusbr0 10.111.4.1
sudo resolvectl domain incusbr0 '~incus'
sudo resolvectl default-route incusbr0 no

resolvectl status incusbr0
```
You can now use hostnames (e.g., `instance-name.incus`) to reach your Incus instances.

And that's it! You're ready to go.

#### Cloud-Init, Incus Profiles and Images

Incus profiles store sets of configuration options, including instance parameters, devices, and device settings.

You can apply multiple profiles to a single instance.
They're applied in the order you specify them, so if the same key appears in more than one profile, the last one takes precedence.
However, instance-specific configuration always overrides anything inherited from profiles.

> Profiles work for both containers and virtual machines. They may contain options or devices intended for one type or the other.
> If a profile includes something not relevant to the instance type, Incus simply ignores it without throwing an error.

If you don't specify any profiles when launching a new instance, Incus applies the `default` profile automatically.
This default defines a network interface and a root disk and cannot be renamed or removed.

For more details, check the [How to use profiles](https://linuxcontainers.org/incus/docs/main/profiles) section in the Incus documentation.

Profiles are also where `cloud-init` comes into play.
You set your provisioning details in the `config.user.user-data` section of a profile.

Below is a minimal example that I call `devops-profile`.
It's incomplete (notice the abbreviated `ssh_authorized_keys` section), so it's not directly usable, but it gives you an idea of how a basic profile looks.
```yaml 
config:
  boot.autostart: "false"
  # Enable nested containers (needed for Docker-in-LXD).
  security.nesting: "true"

  user.user-data: |
    #cloud-config
    output:
      all: '| tee -a /var/log/cloud-init-output.log'
    apt_update: true
    apt_upgrade: true
    packages:
      - openssh-server
      - ca-certificates
      - curl
      - ...

    users:
      - name: ubuntu
        groups: sudo
        shell: /bin/bash
        sudo: ALL=(ALL) NOPASSWD:ALL
        ssh_authorized_keys:
          - ssh-rsa ...

description: "Profile for devops container with cloud-init (script-generated)"
devices: {}
name: devops-profile
```
<p></p>

> For complete instructions on creating and using this profile,
> please see the section [Templating the `devops-profile` and the `recovery-test-profile`](#templating-the-devops-profile-and-the-recovery-test-profile) below.
> You can also consult the associated [Gist](https://gist.github.com/cs224/e120e094fc2114d84eb43618262c328c) for all the details.

By default, `cloud-init` sends its logs to a file rather than displaying them on your container's console.
In my example, the logs are being piped using `tee` into `/var/log/cloud-init-output.log`, which means they won't automatically appear on the container's display.

You can start a system container using the `ubuntu/24.04` image and review its provisioning logs with the following commands:
```bash 
incus launch images:ubuntu/24.04/cloud incus-devops-test -p default -p devops-profile
incus config show -e incus-devops-test
incus exec incus-devops-test -- tail -f /var/log/cloud-init-output.log
```

At the Incus [default image server](https://images.linuxcontainers.org/), you can browse the available base images.
These images are offered in both `cloud` and `default` variants.
You should always choose the `cloud` variant (note the `/cloud` at the end of `images:ubuntu/24.04/cloud`) because it includes the infrastructure needed to provision your instance using `cloud-init`.

To see a complete list of available images from the command line, use the command:
```bash
incus image list images:
```
Each image may have several aliases.
To view these aliases use the `-c L` (where the upper-case `L` is significant) column option:
```bash
incus image list -c Lfpdatsu images:ubuntu/noble/amd64
```

##### `--ephemeral` Throwaway Container Workflow

Just as a quick note, `incus` supports the `--ephemeral` option when launching containers, which behaves like Docker's `--rm` flag.
In other words, once you stop the container, it is automatically removed.
This feature can be helpful if you just need a temporary, "throwaway" system where you don't plan on keeping any data or doing lengthy setup steps.
However, for system containers that need provisioning, `--ephemeral` might be less practical because of the extra time it takes to fully configure everything. 

Ephemeral containers are typically used for tasks like quick testing or one-off commands.
Because they do not persist data after stopping, they are not ideal for most server workloads.
They are, however, extremely useful for scenarios where you want a clean environment every time you launch the container.  

When it comes to a more robust "throwaway" container workflow, I prefer the following command, which is admittedly quite elaborate.
It checks if a container named `incus-devops-test` exists, and if so, stops and deletes it.
It then creates a new container with that same name, applies the `devops-profile`, and uses a `while` loop to wait until `/var/log/cloud-init-output.log` appears.
As soon as it's available, it streams the log so you can watch the installation process in real time:
```bash
incus list --format csv -c n | grep -q '^incus-devops-test$' && { incus stop incus-devops-test --force || true; incus delete incus-devops-test --force; }; incus launch images:ubuntu/24.04/cloud incus-devops-test -p default -p devops-profile && incus exec incus-devops-test -- sh -c 'while [ ! -f /var/log/cloud-init-output.log ]; do sleep 1; done; tail -f /var/log/cloud-init-output.log'
```
If you find yourself using this pattern often, you might want to set it up as an `alias` in your `~/.bashrc` file for quick access:
```bash 
alias incus-fresh-devops-test-container='incus list --format csv -c n | grep -q "^incus-devops-test$" && { incus stop incus-devops-test --force || true; incus delete incus-devops-test --force; }; incus launch images:ubuntu/24.04/cloud incus-devops-test -p default -p devops-profile && incus exec incus-devops-test -- sh -c "while [ ! -f /var/log/cloud-init-output.log ]; do sleep 1; done; tail -f /var/log/cloud-init-output.log"'
```

#### Container vs. VM

It's as straightforward as adding the `--vm` flag to spin up a virtual machine instead of a lightweight container - nothing else changes:
```bash 
incus launch images:ubuntu/24.04/cloud incus-devops-test -p default -p devops-profile --vm
incus config show -e incus-devops-test
incus exec incus-devops-test -- tail -f /var/log/cloud-init-output.log
```

The main reason I sometimes prefer VMs in my DevOps testing is that they simplify privilege and access control.
Containers often require more intricate adjustments to AppArmor, cgroups, and device mappings to grant the necessary permissions.

For instance, when testing the [Makefile approach](#quickstart) described in this post, I attempted to configure a container for a complete Makefile install test.
After multiple attempts, I encountered too many privilege-related issues and decided to give up on container based testing.

To give you an idea, here is the "diff" I tried applying to the `devops-profile` - adding privileged mode, kernel modules, and raw.lxc options - before stopping:
```bash 
config:
  security.privileged: "true"
  linux.kernel_modules: ip_tables,overlay,dm_mod,loop
  raw.lxc: |-
    lxc.apparmor.profile = unconfined
    # This line allows *all* device types (a) for all major:minor (*:*) with rwm access:
    lxc.cgroup.devices.allow = a *:* rwm
    lxc.mount.auto=proc:rw sys:rw cgroup:rw
    lxc.cap.drop =
  
devices:
  dm-control:
    major: "10"
    minor: "236"
    path: /dev/mapper/control
    type: unix-char
  loop-control:
    major: "10"
    minor: "237"
    path: /dev/loop-control
    type: unix-char    
```
<p></p>

> Just as a side note: with [Mike Farah](https://github.com/mikefarah)'s [yq](https://github.com/mikefarah/yq), you can apply this sort of YAML diff to a base YAML file like so:
> ```bash
> yq eval-all 'select(fileIndex == 0) * select(fileIndex == 1)' incus-cloud-init.yaml incus-cloud-init.diff.yaml > incus-cloud-init_.yaml
> ```

Once I switched to the `--vm` option, the full end-to-end tests worked flawlessly.

You then copy your local `rclone` configuration - which you've already confirmed to be functional on your local workstation - over to the VM:
```bash
scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -r ~/.config/rclone ubuntu@incus-devops-test.incus:~/
```
<p></p>

<small>

> **Why use `-o UserKnownHostsFile=/dev/null` and `-o StrictHostKeyChecking=no`?**<br>
> These options tell SSH to skip storing and checking host keys.
> This is often convenient in automated or ephemeral test environments, where you do not require strict host verification.
> However, it's less secure if you're working on a production system or connecting to unfamiliar hosts.
>
> For quick access, you can also define two aliases in your shell's configuration (e.g., ~/.bashrc):
> ```bash
> alias sshincus='ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'
> alias scpincus='scp -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no'
> ```
> This way, you can simply type `sshincus <host>` or `scpincus <src> <dest>`.

</small>

After that, SSH into your `incus-devops-test` instance, clone the Gist, switch to `root`, move the `rclone` configuration into place, and run the `make all` process:
```bash
ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no ubuntu@incus-devops-test.incus
git clone https://gist.github.com/cs224/34eebc2f9389404d7c0192d45cae7259.git makefile-install-files
sudo su
mkdir -p /root/.config && cp -r /home/ubuntu/rclone /root/.config
# Test the rclone connection:
# rclone about rclone-backup-sharepoint-site:
cd makefile-install-files/
IMG_SIZE="1G" make all
```

At this point, you can also test the idempotency of the `make all` process by undoing some of the previous steps, then running `make all` again:
```bash
systemctl stop systemd-cryptsetup@luks_btrfs_volume
cryptsetup close /dev/mapper/luks_btrfs_volume
make clean
IMG_SIZE="1G" make all
```

#### Restore Tests

Any backup plan is only as good as its ability to be restored on a completely separate system.
Regularly testing your backups ensures you can recover from potential disasters with confidence.
I've created a second profile called `recovery-test-profile` that includes `kopia`, `rclone`, and `docker`.
You can use this profile to confirm that the backups your home server generates can indeed be restored on a different environment.

#### Templating the `devops-profile` and the `recovery-test-profile`

As there is one step that requires inserting your `~/.ssh/id_rsa.pub` public key into the `cloud-init` setup, I created two shell scripts and two templates to automate this:

- `incus-profile-install.sh` and `incus-cloud-init.yaml.in`  
- `incus-recovery-profile-install.sh` and `incus-recovery-cloud-init.yaml.in`

You can find these files in the following [Gist](https://gist.github.com/cs224/e120e094fc2114d84eb43618262c328c).

To create the Incus profiles, simply run the scripts in a directory where their input templates are available:
```bash
bash incus-profile-install.sh
bash incus-recovery-profile-install.sh
```

#### Conclusion

I hope this introduction to Incus and the provided base profiles gives you a head start in making your DevOps and backup/restore tests more effective.
Feel free to share your questions or feedback in the comments section below.


### Dedicated `SharePoint Team Site` as Offsite Backup Storage

I run a small business and already subscribe to Microsoft 365 Business (previously known as Office 365 for Business).
This plan includes OneDrive for Business with 1 TB of personal cloud storage per licensed user, along with a large SharePoint Online storage pool for the entire organization.
In total, that's more than enough space for my needs, and I'd like to leverage it as an offsite backup location for my home server(s).

However, I want to make sure that `rclone` - the tool handling file access to the remote cloud storage - has only the permissions it truly needs.
Specifically, I'd like to restrict `rclone` to a single dedicated place (such as a SharePoint site or folder).
If my home server were ever compromised, it would only be able to affect that small slice of data rather than the entire organization.

> **Microsoft 365 storage breakdown**  
> - Each licensed user typically gets 1 TB of OneDrive for Business storage.  
> - Your SharePoint Online tenant also comes with a shared storage allocation that starts at 1 TB, plus an extra 10 GB for each licensed user.  
>  
> Because I have multiple users, this easily adds up to several terabytes. I'm already paying for it, so why not use it for secure backups?

Why not just create a separate user account? One idea is to have a special "service account" user just for backups.
In many Microsoft 365 environments, though, you often need an extra license for each active user account that uses SharePoint or OneDrive storage.
Since I already have enough licensed users, I'd prefer to avoid paying for another license if possible.

> Another drawback: even if I had a single "service account", I'd still need to share it across all servers I want to back up, or pay for multiple service accounts.
> Neither option is ideal for security nor cost.


**App-Only or Azure AD App Registration**<br>
You can set up SharePoint access without adding a new user by registering your application in Azure Active Directory (Azure AD).
This "App-Only" approach grants SharePoint permissions to an application (in this case, `rclone`) without tying it to a specific user account.
The key advantage is it doesn't require buying another license for each server.  

I'd like to configure an **app registration per home server** with access to a dedicated sub-location for offsite backups. This ensures that `rclone` on each home server can only upload and list files in its own isolated area, and cannot view or modify any other data in the organization.

My plan is to create a SharePoint **Team Site** per home server, specifically for offsite backups of that home server.
I'll then adjust the permissions so that `rclone` on that home server can only reach the site's document library, providing a tightly controlled and simple offsite backup target.

By following these steps, each home server can have its own designated backup site or library within my existing Microsoft 365 subscription.
The best part? I'm not paying extra, because the standard Microsoft 365 licenses already include enough space.
This way, I get an offsite backup location that's both cost-effective and secure.

#### Personal Microsoft Account (OneDrive Personal)

If you use OneDrive Personal instead of OneDrive for Business, you can authorize `rclone` with a scope that only grants access to a special "App Folder".
This folder is private to the application and won't appear in the rest of your OneDrive.
Once authorized, `rclone` will see only that single folder and won't be able to view or change any other files.

**How it Works**: By setting the `Files.ReadWrite.AppFolder` permission in OneDrive Personal, you instruct `rclone` to operate strictly within an App Folder. This approach protects your other OneDrive data and offers a simple, self-contained backup target.

> **Note:** I don't currently use OneDrive Personal myself, so I haven't tested this setup.
> If you want to learn more, try searching for keywords like `rclone`, `app folder`, and `Files.ReadWrite.AppFolder`.
> You can also see the official [`rclone` documentation on OneDrive](https://rclone.org/onedrive/#getting-your-own-client-id-and-key) for step-by-step guidance on setting up your own Client ID and key.

#### Microsoft 365 Business and SharePoint Team Site

Below is a detailed walkthrough on creating and using a dedicated SharePoint Document Library with minimal permissions - configured via an Azure AD App Registration ("service principal") - so you can upload files through `rclone` on Linux without purchasing an additional Microsoft 365 license for a separate user.

> **Minimal Permissions**: Using `Sites.Selected` permissions means the application has access only to your dedicated backup site/library, preventing potential security risks if a server is compromised.

Our ultimate goal is a working `rclone` configuration. We want to end up with the following structure in our `~/.config/rclone/rclone.conf` file:
```ini
[rclone-backup-sharepoint-site]
type = onedrive
client_secret = ...client_secret...
tenant = ...tenant...
auth_type = client_credentials
drive_type = business
client_id = ...client_id...
client_credentials = true
drive_id = ...drive_id...
token = {}
```
When you first run an rclone command (e.g., `rclone about rclone-backup-sharepoint-site:`), rclone will automatically populate the token section because we're using `auth_type = client_credentials`.
* `client_id` = Application (client) ID
* `tenant_id` = Directory (tenant) ID
* `client_secret` = The secret value you generate later
* `drive_id` = Might not be strictly necessary (`rclone` should be able to auto-detect), but filling it in ensures consistency


**Set Up the SharePoint Site and Document Library**: You'll need a dedicated SharePoint site to store your backups.
This can be a new site or an existing site, but ideally you create a site specifically for backups.

1. Log in to the Microsoft 365 [admin center](https://admin.microsoft.com/) with an admin account.
1. Go to the SharePoint admin center (expand the "…" on the left pane and select SharePoint). This will typically be at `https://<tenant-name>-admin.sharepoint.com`.
1. Under Websites, select Active Websites, then click Create (the "+" icon) and choose Team site (or Communication site, if you prefer).
1. Provide a site name, e.g., "RCloneBackupSite<machinename>".
  1. You can specify a different owner if desired. I chose a different owner of the new Team site, not the admin account.
1. Note the site's URL, e.g.: `https://<tenant-name>.sharepoint.com/sites/RCloneBackupSite<machinename>`
1. Create a dedicated Document Library (optional if you don't want to use the default "Documents" library).
1. **In your new site** on the "Start" page, towards the left top on the menu bar, select New, and then choose Document library.
1. Give it a name, e.g. "RcloneBackups".

Your eventual backup destination might look like: `https://<tenant-name>.sharepoint.com/sites/RCloneBackupSite<machinename>/RcloneBackups`.

**Register an Azure AD Application (Service Principal)**:
Rather than creating a licensed Microsoft 365 user account, we'll use an Azure AD "App Registration" to enable app-only SharePoint access.

1. Go to the [Azure Portal](https://portal.azure.com/), and sign in with an Azure AD admin account.
1. In the left navigation, select Microsoft Entra ID (formerly Azure Active Directory).
1. On the "Start" page of Microsoft Entry ID, towards the left top on the menu bar, select New, and then choose App registration.
1. Give your app a Name (e.g. "rclone-backup-app-<machinename>").
1. Under Supported account types, choose Accounts in this organizational directory only (i.e. single-tenant) unless you need multi-tenant.
1. Redirect URI can be left empty since we'll be using client credentials.
1. Click Register.

**Configure Permissions for SharePoint**:
1. In your new app's Overview page, select API permissions from the left menu.
1. Click Add a permission → Microsoft Graph.
1. Choose Application permissions (not Delegated).
1. Select the permission level: `Sites.Selected`. This is the recommended approach when you want to specifically limit the app's ability to certain sites.
1. Click Add permissions.
1. Now, an admin must grant Admin consent. Above the table showing the permissions and to the right of "Add permissions" click "Grant admin consent for [tenant name]".
1. You should now see your permission with status Granted for [tenant].

Important: Using `Sites.Selected` means the app has no access to any SharePoint sites unless you explicitly grant it. This is exactly what we want for minimal access. We'll grant it access only to the one site.

**Generate a Client Secret and Note IDs**:
1. In the app's Certificates & secrets section, click New client secret.
1. Provide a description, select an expiration period, and click Add.
1. Copy the Value of the new secret (you'll only see it once). Store it securely - this is your `client_secret`.
1. Go back to Overview and note the: "Application (client) ID" and "Directory (tenant) ID". See above. We'll need these for rclone:<br>
`client_id` = Application (client) ID<br>
`tenant_id` = Directory (tenant) ID<br>
`client_secret` = the secret value you just copied<br>

**Grant Site-Specific Permissions to the Azure AD App**: This is the most tricky part.
Because we used `Sites.Selected`, the app currently has no access to any SharePoint site. We must explicitly grant it to our new site.
If you're on Windows, you could use the SharePoint Admin PowerShell module (might be simpler for many admins).
Here, we'll use Microsoft Graph calls so you can do it from any OS (including Linux).

The main challenge was that many access rights had to be approved by either the SharePoint site owner or the Admin user.
I opened two browser windows - one for the Admin and one for the SharePoint owner.
Most tasks were done by the SharePoint owner, but some actions required Admin confirmation.

Additionally, I needed to log out and log back in after certain changes so the Graph Explorer web UI would recognize the new access rights.
I don't recall every detail, so treat the steps below as a rough guideline rather than exact instructions.

If a `GET` request returns an error or empty response, it indicates an access rights issue that needs to be resolved first!

**Using Microsoft [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)**: 

1. Visit the [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer) and sign in with appropriate permissions.
   I used two browser windows, one for the Admin and one for the SharePoint Owner account.

1. Find the site ID: Make a `GET` request to: `https://graph.microsoft.com/v1.0/sites?search=RCloneBackupSite<machinename>`. Look for your site's `id` in the JSON response, something like:
`tenant.sharepoint.com,01234567-89ab-4def-0123-456789abcdef,01234567-89ab-4def-0123-456789abcdef`.
1. Check permissions endpoint: `GET` request: `https://graph.microsoft.com/v1.0/sites/<site-id>/permissions`. Make sure you get a response and no access error.

1. Grant permission: Change Graph Explorer to a `POST` request at the same `/permissions` endpoint. Use a JSON body like this:
   ```json
   {
    "roles": [ "write" ],
    "grantedToIdentities": [
      {
        "application": {
          "id": "<YOUR_APP_CLIENT_ID>",
          "displayName": "<YOUR_APP_DISPLAY_NAME>"
        }
      }
    ]
   }
   ```
   `id` is your App (client) ID from the Azure AD registration. `displayName` is informational and can be ignored.
   If successful, you'll get a `201 Created` response, along with a JSON body showing the new permission object.
1. You can verify by doing another `GET` request: `https://graph.microsoft.com/v1.0/sites/<site-id>/permissions`.

Your Azure AD app now has `Write` access only to that one site, fulfilling the `Sites.Selected` minimal-access design.
If you need the `drive_id` for `RcloneBackups`, run: `GET https://graph.microsoft.com/v1.0/sites/<site-id>/drives`.
Look for the `driveType: "documentLibrary"` object where the `name` matches `RcloneBackups`.

**Configure rclone on Linux**: `rclone` offers various methods to set up OneDrive/SharePoint.
I suggest that you avoid running `rclone config` as this does not seem to be made for the `client_credentials` flow. This caused a lot of trouble.
For this minimal-permission approach, manual configuration of `~/.config/rclone/rclone.conf` can be simpler:
```ini
[rclone-backup-sharepoint-site]
type = onedrive
client_secret = ...client_secret...
tenant = ...tenant...
auth_type = client_credentials
drive_type = business
client_id = ...client_id...
client_credentials = true
drive_id = ...drive_id...
token = {}
```
* `client_id` = Application (client) ID
* `tenant_id` = Directory (tenant) ID
* `client_secret` = the secret value you will generate (see below).
* `drive_id` may not strictly be necessary and may be filled automatically.

After saving the file, test with:
```bash
rclone about rclone-backup-sharepoint-site:
```

> The `token` can initially be left empty and will be filled automatically by `rclone` when you trigger your first `rclone` operation like `rclone about rclone-backup-sharepoint-site:` as we use `auth_type = client_credentials`.


#### Conclusion

Congratulations! You now have:

* A dedicated SharePoint site (with or without a dedicated Document Library).
* An Azure AD "App Registration" that has `Sites.Selected` with `Write` permission only on that single site.
* An rclone config on Linux that uses these client credentials in app-only mode.

You can run `rclone sync` or `rclone copy` in scripts or cron jobs to securely upload data without tying backups to a full Microsoft 365 user license.
This tightly scoped permission design ensures that even if your home server is compromised, the attacker can't access anything beyond the designated backup site.

### Second Kopia Backup on Local Disk of Other Server

My home server, elite, already backs up to SharePoint with Kopia.
I also want a backup on a disk I can access locally.
For that, I use x99, a separate machine on my home network with an encrypted volume.

I mount a directory from that volume over SSH so it appears as a local directory on elite.
When I want a fresh backup, I run Kopia manually on elite with a separate configuration that writes to the mounted directory.
The SharePoint backup has its own configuration and runs independently.

#### Mount the Backup Target over SSH

On x99, I unlock and mount a VeraCrypt volume at `/media/veracrypt2`.
The directory `/media/veracrypt2/rsync-target/kopia-backups/elite/` exists on that volume and is writable by the local account on x99 that runs the mount command.

Install `openssh-sftp-server` and `vdeplug` on x99 and [SSHFS](https://github.com/libfuse/sshfs/blob/sshfs-3.7.3/sshfs.rst) on elite. The `vdeplug` package provides `dpipe`, which connects the local SFTP server to SSHFS on elite through an SSH session initiated by x99.

In the first terminal on x99, run:

```bash
LOCAL_REPOSITORY=/media/veracrypt2/rsync-target/kopia-backups/elite
ssh elite-root 'install -d -m 0700 /mnt/kopia-secondary'

dpipe /usr/lib/openssh/sftp-server -d "$LOCAL_REPOSITORY" = \
  ssh -T -o BatchMode=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 elite-root '
    exec 9>/run/lock/reverse-sshfs-kopia-secondary.lock
    flock -n 9 || exit 1
    if mountpoint -q /mnt/kopia-secondary; then
      echo "Mountpoint already occupied" >&2
      exit 1
    fi
    exec sshfs :. /mnt/kopia-secondary -f -o passive,dir_cache=no
  '
```

Leave this terminal running. The SFTP server starts in the backup directory and can access other paths permitted to your local x99 account, so use this setup with an elite server you trust.

In a second terminal on x99, connect to elite and check that the mount is active:

```bash
ssh elite-root
findmnt --mountpoint /mnt/kopia-secondary -o TARGET,SOURCE,FSTYPE
```

Confirm that `findmnt` shows `/mnt/kopia-secondary` with filesystem type `fuse.sshfs` before running Kopia.
If the mount is missing, stop so the backup does not write to elite's local disk.

After the backup finishes, run `fusermount3 -u /mnt/kopia-secondary` on elite.
The mount command in the first terminal should then exit.

#### One-time Kopia setup on elite

With the mount open in the first terminal, run the Kopia commands as root on elite in the second terminal. Use a fresh Bash session for these examples. Start each session, including later backups, with the following:

```bash
set -euo pipefail
umask 077
unset KOPIA_CONFIG_PATH KOPIA_CACHE_DIRECTORY KOPIA_PASSWORD

SECONDARY_MOUNT=/mnt/kopia-secondary
SECONDARY_CONFIG="$HOME/.config/kopia/secondary.repository.config"
exec 8>/run/lock/kopia-secondary-operation.lock
flock -n 8
test "$(findmnt -rn -M "$SECONDARY_MOUNT" -o FSTYPE)" = fuse.sshfs

kopia_secondary() {
  kopia --config-file="$SECONDARY_CONFIG" --no-use-keyring "$@"
}
```

For a new, empty destination, create the repository once and choose a repository password. Save it somewhere you can access during recovery.

```bash
kopia_secondary repository create filesystem --path="$SECONDARY_MOUNT" --disable-repository-format-cache
# Enter password to create new repository: 
# Re-enter password for verification: 
# Initializing repository with:
#   block hash:          BLAKE2B-256-128
#   encryption:          AES256-GCM-HMAC-SHA256
#   key derivation:      scrypt-65536-8-1
#   splitter:            DYNAMIC-4M-BUZHASH
# Connected to repository.

# NOTICE: Kopia will check for updates on GitHub every 7 days, starting 24 hours after first use.
# To disable this behavior, set environment variable KOPIA_CHECK_FOR_UPDATES=false
# Alternatively you can remove the file "/root/.config/kopia/secondary.repository.config.update-info.json".

# Retention:
#   Annual snapshots:                 3   (defined for this target)
#   Monthly snapshots:               24   (defined for this target)
#   Weekly snapshots:                 4   (defined for this target)
#   Daily snapshots:                  7   (defined for this target)
#   Hourly snapshots:                48   (defined for this target)
#   Latest snapshots:                10   (defined for this target)
#   Ignore identical snapshots:   false   (defined for this target)
# Compression disabled.

# To find more information about default policy run 'kopia policy get'.
# To change the policy use 'kopia policy set' command.

# NOTE: Kopia will perform quick maintenance of the repository automatically every 1h0m0s
# and full maintenance every 24h0m0s when running as root@elite.

# See https://kopia.io/docs/advanced/maintenance/ for more information.

# NOTE: To validate that your provider is compatible with Kopia, please run:

# $ kopia repository validate-provider

root@elite:~# ll .config/kopia/secondary.repository.config*
# -rw------- 1 root root 532 Nov 18 15:21 .config/kopia/secondary.repository.config
# -rw------- 1 root root   8 Nov 18 15:21 .config/kopia/secondary.repository.config.kopia-password
# -rw------- 1 root root 143 Nov 18 15:21 .config/kopia/secondary.repository.config.update-info.json


kopia_secondary repository status
# Config file:         /root/.config/kopia/secondary.repository.config

# Description:         Repository in Filesystem: /mnt/kopia-secondary
# Hostname:            elite
# Username:            root
# Read-only:           false
# Format blob cache:   disabled

# Storage type:        filesystem
# Storage capacity:    421.6 GB
# Storage available:   165.3 GB
# Storage config:      {
#                        "path": "/mnt/kopia-secondary",
#                        "fileMode": 384,
#                        "dirMode": 448,
#                        "dirShards": null
#                      }

# Unique ID:           733881ab06901cfedf4a888fab4690f6d654c349326b2a4cef338f97c48de635
# Hash:                BLAKE2B-256-128
# Encryption:          AES256-GCM-HMAC-SHA256
# Splitter:            DYNAMIC-4M-BUZHASH
# Format version:      3
# Content compression: true
# Password changes:    true
# Max pack length:     21 MB
# Index Format:        v2

# Epoch Manager:       enabled
# Current Epoch: 0

# Epoch refresh frequency: 20m0s
# Epoch advance on:        20 blobs or 10.5 MB, minimum 24h0m0s
# Epoch cleanup margin:    4h0m0s
# Epoch checkpoint every:  7 epochs

kopia_secondary repository validate-provider
# Opening 4 equivalent storage connections...
# Validating storage capacity and usage
# Validating blob list responses
# Validating non-existent blob responses
# Writing blob (5000000 bytes)
# Validating conditional creates...
# Validating list responses...
# Validating partial reads...
# Validating full reads...
# Validating metadata...
# Running concurrency test for 30s...
# All good.
# Cleaning up temporary data...
```

Record the repository's unique ID from the status output.

> Elite uses the same mountpoint even if I mount a different backup disk there.
> After each reconnect, I compare the ID in `repository status` with my notes to make sure I'm about to write to the intended repository.

> Unique ID: `733881ab06901cfedf4a888fab4690f6d654c349326b2a4cef338f97c48de635`


The provider check writes temporary test data to exercise the mounted storage.

Kopia stores policies in each repository.
Before the first backup, compare the effective policies for the source.
Here, plain `kopia` uses root's existing SharePoint configuration.
Check the storage shown by `repository status` before using it as your reference.

```bash
LOGICAL_SOURCE="root@$(hostname):/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap"
kopia repository status
# Config file:         /root/.config/kopia/repository.config

# Description:         My Offsite BTRFS Snapshots for elite
# Hostname:            elite
# Username:            root
# Read-only:           false
# Format blob cache:   15m0s

# Storage type:        rclone
# Storage capacity:    unbounded
# Storage config:      {
#                        "remotePath": "rclone-backup-sharepoint-site:elite",
#                        "startupTimeout": "15s",
#                        "atomicWrites": true,
#                        "dirShards": null
#                      }

# Unique ID:           814d7cb7dbb5cc7e2e94158571218e65fdcee37cd4eebc54065cd52a33ca33a0
# Hash:                BLAKE2B-256-128
# Encryption:          AES256-GCM-HMAC-SHA256
# Splitter:            DYNAMIC-4M-BUZHASH
# Format version:      3
# Content compression: true
# Password changes:    true
# Max pack length:     21 MB
# Index Format:        v2

# Epoch Manager:       enabled
# Current Epoch: 39

# Epoch refresh frequency: 20m0s
# Epoch advance on:        20 blobs or 10.5 MB, minimum 24h0m0s
# Epoch cleanup margin:    4h0m0s
# Epoch checkpoint every:  7 epochs

kopia policy list
# 8ba48a8121e56465bd0b0f91c4481805 (global)

kopia policy show "$LOGICAL_SOURCE"
# Policy for root@elite:/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap:

# Retention:
#   Annual snapshots:                        3   inherited from (global)
#   Monthly snapshots:                      12   inherited from (global)
#   Weekly snapshots:                        4   inherited from (global)
#   Daily snapshots:                        14   inherited from (global)
#   Hourly snapshots:                        0   inherited from (global)
#   Latest snapshots:                        7   inherited from (global)
#   Ignore identical snapshots:          false   inherited from (global)

# Files policy:
#   Ignore cache directories:             true   inherited from (global)
#   No ignore rules:
#   Read ignore rules from files:                inherited from (global)
#     .kopiaignore
#   Scan one filesystem only:            false   inherited from (global)

# ...

# Uploads:
# ...
#   Max parallel file reads:                 1   inherited from (global)
# ...

# Compression:
#   Compressor:                          pgzip   inherited from (global)
#   Compress files regardless of extensions.
#   Compress files of all sizes.

# ...

kopia_secondary policy show "$LOGICAL_SOURCE"
# Policy for root@elite:/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap:

# Retention:
#   Annual snapshots:                        3   inherited from (global)
#   Monthly snapshots:                      24   inherited from (global)
#   Weekly snapshots:                        4   inherited from (global)
#   Daily snapshots:                         7   inherited from (global)
#   Hourly snapshots:                       48   inherited from (global)
#   Latest snapshots:                       10   inherited from (global)
#   Ignore identical snapshots:          false   inherited from (global)

# Files policy:
#   Ignore cache directories:             true   inherited from (global)
#   No ignore rules:
#   Read ignore rules from files:                inherited from (global)
#     .kopiaignore
#   Scan one filesystem only:            false   inherited from (global)

# ...

# Uploads:
# ...
#   Max parallel file reads:                 -   inherited from (global)
# ...

# Compression disabled.

# ...
```

Compare the **Files policy** and retention settings.
Use `policy list` to spot rules for subdirectories and inspect those targets with `policy show` as well.
Ignore files such as `.kopiaignore` already present in the Btrfs snapshot are read according to the secondary policy's ignore-file settings.

In my setup, the two **Files policy** sections match.
Both ignore cache directories and read `.kopiaignore`, and neither has repository-defined ignore patterns for this source.
The SharePoint repository lists only a global policy, so there are no per-directory policies to copy.

The differences are retention, file-read parallelism, and compression.
SharePoint keeps 7 latest, 0 hourly, 14 daily, and 12 monthly snapshots.
The secondary defaults are 10 latest, 48 hourly, 7 daily, and 24 monthly.
Both keep 4 weekly and 3 annual snapshots.
SharePoint limits parallel file reads to 1 and uses `pgzip`.
The secondary has no explicit file-read limit and compression is disabled.

To enable the same compression on the secondary repository, run:

```bash
kopia_secondary policy set --global --compression=pgzip
```

Kopia compresses data on elite before writing it through SSHFS.
This uses more CPU on elite but can reduce network traffic and disk usage on x99.
Logs and uncompressed dumps can benefit more than the Nextcloud Borg backup if Borg has already compressed its data.
The policy applies to new writes, and existing snapshots remain readable.

To copy a repository-defined exclusion, add its pattern at the matching scope in the secondary repository.
For example, the following excludes directories named `cache` for this source.
Use the actual pattern from your policy, and repeat `--add-ignore` for each rule you need.

```bash
kopia_secondary policy set --add-ignore 'cache/' "$LOGICAL_SOURCE"
```

For an occasional manual backup, you could keep the seven latest snapshots for this source and set the time-based retention counts to zero:

```bash
kopia_secondary policy set --keep-latest=7 --keep-hourly=0 --keep-daily=0 --keep-weekly=0 --keep-monthly=0 --keep-annual=0 "$LOGICAL_SOURCE"
# Setting policy for root@elite:/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
#  - setting "number of annual backups to keep" to 0.
#  - setting "number of monthly backups to keep" to 0.
#  - setting "number of weekly backups to keep" to 0.
#  - setting "number of daily backups to keep" to 0.
#  - setting "number of hourly backups to keep" to 0.
#  - setting "number of latest backups to keep" to 7.
# Running full maintenance...
# GC found 0 unused contents (0 B)
# GC found 0 unused contents that are too recent to delete (0 B)
# GC found 0 in-use contents (0 B)
# GC found 2 in-use system-contents (1.1 KB)
# GC undeleted 0 contents (0 B)
# Compacting an eligible uncompacted epoch...
# Advancing epoch markers...
# Attempting to compact a range of epoch indexes ...
# Cleaning up unneeded epoch markers...
# Cleaning up old index blobs which have already been compacted...
# Cleaned up 0 logs.
# Finished full maintenance.

kopia_secondary policy show "$LOGICAL_SOURCE"
```

Choose counts that fit how often you back up and how far back you want to recover.
With these settings, a snapshot becomes eligible for automatic removal once seven newer snapshots exist for the same source. Its age alone does not cause it to expire.

#### Run a manual backup on elite

Open the mount and start the second shell as above. Reconnect each time so Kopia reads the identity of the repository currently mounted at that path and selects its cache.

```bash
kopia_secondary repository connect filesystem --path="$SECONDARY_MOUNT" --disable-repository-format-cache
# Enter password to open repository: 
# Connected to repository.

kopia_secondary repository status
# Unique ID:           733881ab06901cfedf4a888fab4690f6d654c349326b2a4cef338f97c48de635
```

Check the repository ID against your notes before continuing.
List the Btrfs subvolumes and substitute the dated read-only snapshot you want to back up.
The stable source label groups successive backups even though the dated input path changes.

```bash
btrfs subvolume list /mnt/luks_btrfs_volume
# ...
# ID 874 gen 760010 top level 5 path @offsite_backup_storage_snapshot-2026-11-17-0401
# ID 875 gen 762236 top level 5 path @offsite_backup_storage_snapshot-2026-11-18-0406

SNAPSHOT_PATH=/mnt/luks_btrfs_volume/@offsite_backup_storage_snapshot-2026-11-18-0406
test "$(btrfs property get -ts "$SNAPSHOT_PATH" ro)" = ro=true
LOGICAL_SOURCE="root@$(hostname):/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap"
kopia_secondary policy show "$LOGICAL_SOURCE"

SNAPSHOT_RESULT=$(mktemp /tmp/kopia-secondary-result.XXXXXX)
kopia_secondary --progress snapshot create --fail-fast --override-source="$LOGICAL_SOURCE" --description="Secondary backup of $SNAPSHOT_PATH" --json "$SNAPSHOT_PATH" > "$SNAPSHOT_RESULT"
#  / 2 hashing, 55042 hashed (16.9 GB), 0 cached (0 B), uploaded 16.2 GB, estimated 36.7 GB (46.1%) 3m5s left
#  * 0 hashing, 55197 hashed (36.7 GB), 0 cached (0 B), uploaded 36 GB, estimated 36.7 GB (100.0%) 0s left  
jq -e '(.incomplete // "") == ""' "$SNAPSHOT_RESULT"
# true # true means the snapshot manifest reports no incomplete reason, and jq -e exited successfully.
SECONDARY_SNAPSHOT_ID=$(jq -er '.id' "$SNAPSHOT_RESULT")
echo $SECONDARY_SNAPSHOT_ID
# 28b47d2eeb0ff51bc8a9f442e1ca04d6

kopia_secondary cache clear
# Clearing cache directory: /root/.cache/kopia/a7216637a3325c93.
kopia_secondary --progress snapshot verify --verify-files-percent=100 "$SECONDARY_SNAPSHOT_ID"
# ...
# Processed 56644 objects (36.6 GB). Read 52401 files (36.6 GB).
# Processed 57009 objects (36.6 GB). Read 52766 files (36.6 GB).
# Finished processing 57090 objects (36.6 GB). Read 52847 files (36.6 GB).

kopia_secondary snapshot list --all --manifest-id
# root@elite:/mnt/luks_btrfs_volume/@offsite_backup_storage_backup-snap
#   2026-11-18 15:55:32 CET kcbc0b751a06e2ffb3673d56e52fac1ca 36.7 GB drwxr-xr-x manifest:28b47d2eeb0ff51bc8a9f442e1ca04d6 files:55189 dirs:4333 (latest-1)
```

> `snapshot list` counts file entries in the snapshot (55,189). Verification reads each distinct stored file object once (52,847), even when several paths share it. With `--verify-files-percent=100`, Kopia reads every distinct file object, so the lower count is expected.

On X99:

```bash
du -sh /media/veracrypt2/rsync-target/kopia-backups/elite/
# 34G     /media/veracrypt2/rsync-target/kopia-backups/elite/
```

This example uses `jq` to read the backup result.
Clearing this connection's cache before verification makes Kopia read the stored data through the mount.
When all Kopia commands finish, unmount as shown above

> `fusermount3 -u /mnt/kopia-secondary` on elite.

and exit the second shell on elite to release its lock.

### Split DNS for Incus with systemd-resolved

When you open `https://instance-name.incus` in a browser on your workstation, you want the host to ask the Incus DNS server for that name.
When you open an ordinary public website, you want it to use your normal DNS configuration instead.
This separation is called *split DNS*.
It is useful both for the ordinary Incus bridge introduced above and for the helper-side DNS in the [recursive Incus jail](../incus-agent-jail-recursive-ii-1-concepts/#host-facing-dns-integration).

#### Why a global resolver drop-in does not express that intent

Earlier versions of these instructions put the following settings in a file under `/etc/systemd/resolved.conf.d/`:

```ini
[Resolve]
DNS=10.111.4.1
Domains=~incus
```

The misleading part is `Domains=~incus`.
The tilde makes `incus` a *routing-only domain*: a name ending in `.incus` selects that DNS scope, but `incus` is not appended to a short name as a search suffix.

**It does not restrict a globally configured `DNS=` server to that domain.**

When a query matches no routing domain, `systemd-resolved` sends it to the DNS servers on its default-route links **and to its globally configured DNS servers**.
This behavior is documented in the [systemd 255 routing rules](https://github.com/systemd/systemd/blob/v255/man/systemd-resolved.service.xml).

This explained an unexpected observation during a DNS investigation on my workstation: public-domain queries reached the Incus helper, which returned `REFUSED`.
The intended configuration belongs to a *link*, such as `incusbr0`:

| Setting on `incusbr0` | Meaning |
| --- | --- |
| DNS server | The Incus bridge DNS address, or the helper DNS address for the recursive setup |
| Routing domain `~incus` | Select this link's DNS configuration for `.incus` names |
| DNS default route `no` | Do not use this link's DNS servers for unrelated names |

Here, *link* describes the DNS configuration selected by the host resolver.
It does not mean that the application's request must originate from that network interface.
Your browser, SSH client, and other applications on the host can all use it.
Likewise, the DNS default-route flag controls DNS server selection; it does not change your IP default route.

#### Choose the DNS server for your setup

For an ordinary Incus network, ask the bridge's DNS server.
Inspect the bridge address and domain with:

```bash
incus network get incusbr0 ipv4.address
incus network get incusbr0 dns.domain
```

If the address is `10.111.4.1/24`, the DNS server address is `10.111.4.1`, without `/24`.
The examples below assume the domain is `incus`.
If you configured another domain, substitute it in the routing domain too.

> The recursive jail has a different DNS view: its helper publishes the merged names of the hierarchy.
>
> For that setup, use the helper's host-visible address, for example `10.227.241.53`, as described in its [DNS integration instructions](../incus-agent-jail-recursive-ii-1-concepts/#dns-integration).
>
> **The bridge DNS and helper DNS are alternatives for these two setups, not interchangeable servers to list together.**

#### Make the per-link settings persistent

Commands such as `resolvectl dns`, `resolvectl domain`, and `resolvectl default-route` change runtime settings.
They need to be applied again after the bridge is recreated or `systemd-resolved` restarts.
A drop-in under `/etc/systemd/resolved.conf.d/` cannot provide this per-link configuration because that directory configures the resolver globally.

If NetworkManager or systemd-networkd already manages the interface, it can supply persistent per-link DNS settings.
For an Incus-managed bridge, a small systemd service applies the DNS settings without taking over bridge management.
Incus documents this approach in [How to integrate with systemd-resolved](https://linuxcontainers.org/incus/docs/main/howto/network_bridge_resolved/).

Open a static unit file:

```bash
sudoedit /etc/systemd/system/incus-dns-incusbr0.service
```

Use the following contents, replacing `10.111.4.1` with your chosen DNS server address.

> For the recursive jail, this is where you use the helper address instead.

If your bridge has another name, replace `incusbr0` throughout the file and in its filename.

> You can check the device unit used by the service directly:
>
> ```bash
> systemctl status sys-subsystem-net-devices-incusbr0.device
> ```
>
> You can also work the other way around. Start by finding the Incus bridge name:
>
> ```bash
> incus network list
> ```
>
> For a bridge named `incusbr0`, find the associated systemd device units:
>
> ```bash
> systemctl list-units --type=device --all '*incusbr0*'
> ```
>
> You may see two units for the same bridge:
>
> | Device unit | Origin |
> | --- | --- |
> | `sys-devices-virtual-net-incusbr0.device` | The bridge's actual sysfs location, `/sys/devices/virtual/net/incusbr0` |
> | `sys-subsystem-net-devices-incusbr0.device` | An additional identity that systemd's udev rules provide for the network interface named `incusbr0` |
>
> The second form identifies a network interface without depending on its location in the device tree.
> Systemd 255 explicitly creates it through the udev property `SYSTEMD_ALIAS=/sys/subsystem/net/devices/$name`, where `$name` is the interface name.
> The [rule and its explanation](https://github.com/systemd/systemd/blob/v255/rules.d/99-systemd.rules.in#L41-L47) also clarify that this is an identification string: `/sys/subsystem/net/devices/incusbr0` need not exist as an accessible filesystem path.
>
> Although udev calls this an alias, systemd creates a separate device-unit object associated with the same underlying device.
> Consequently, each unit's `Names=` property can contain only its own name; it need not list both identifiers.
> This behavior is visible in systemd's [device-unit implementation](https://github.com/systemd/systemd/blob/v255/src/core/device.c#L732-L782).
> Inspect the two units together with:
>
> ```bash
> systemctl show sys-devices-virtual-net-incusbr0.device sys-subsystem-net-devices-incusbr0.device -p Id -p Names -p SysFSPath
> ```
>
> Both should report `SysFSPath=/sys/devices/virtual/net/incusbr0`, while their `Id=` and `Names=` values remain separate.
> They track the same bridge appearing and disappearing, so either can identify this bridge in a dependency.
> The service below follows the official Incus recipe in using the subsystem form: it expresses a dependency on the network interface called `incusbr0` without assuming its `devices/virtual/net` location.
> All of these inspection commands are read-only.

```ini
[Unit]
Description=Host split DNS for .incus on incusbr0
BindsTo=sys-subsystem-net-devices-incusbr0.device
Wants=systemd-resolved.service
After=sys-subsystem-net-devices-incusbr0.device systemd-resolved.service
PartOf=systemd-resolved.service

[Service]
Type=oneshot
RemainAfterExit=yes
ExecStart=/usr/bin/resolvectl dns incusbr0 10.111.4.1
ExecStart=/usr/bin/resolvectl domain incusbr0 ~incus
ExecStart=/usr/bin/resolvectl default-route incusbr0 no
ExecStart=/usr/bin/resolvectl dnssec incusbr0 no
ExecStart=/usr/bin/resolvectl dnsovertls incusbr0 no
ExecStopPost=-/usr/bin/resolvectl revert incusbr0

[Install]
WantedBy=sys-subsystem-net-devices-incusbr0.device systemd-resolved.service
```

The unit runs the `resolvectl` commands once and remembers that it applied them; it is not another continuously running DNS server.
`BindsTo=` and `After=` tie its lifetime to the bridge device.
Enabling it under that device starts it when the bridge appears, including after bridge recreation.
`Wants=` and `After=` start the resolver first, while `PartOf=` propagates resolver stops and restarts to this unit.
The second `WantedBy=` entry also starts it when the resolver is started again after a separate stop.
These dependency relationships are described in [systemd.unit](https://github.com/systemd/systemd/blob/v255/man/systemd.unit.xml).

The DNSSEC and DNS-over-TLS settings follow the Incus example for its unsigned local zone and plain DNS service.
They apply only to this link.
`ExecStopPost=` clears the link's resolver settings when the unit stops.
Its leading `-` allows cleanup to finish if the bridge or resolver has already disappeared.
Use this service as the sole owner of the bridge's resolver settings, because `resolvectl revert` clears all settings for that link.

#### Enable the service

With the bridge available, reload the unit files, and activate the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now incus-dns-incusbr0.service
```

After activation, `systemctl status incus-dns-incusbr0.service` should show `active (exited)`, which is the expected state for this oneshot unit.

#### Verify local and public lookups

Inspect both the global and link-specific state:

```bash
systemctl status incus-dns-incusbr0.service
resolvectl status
# Link N (incusbr0)
#     Current Scopes: DNS
#          Protocols: -DefaultRoute -LLMNR -mDNS -DNSOverTLS DNSSEC=no/unsupported
# Current DNS Server: 10.111.4.1
#        DNS Servers: 10.111.4.1
#         DNS Domain: ~incus
```

The `incusbr0` section should show your chosen DNS server, `~incus`, and `-DefaultRoute`.
Your ordinary network connection should retain its existing DNS servers.

Use an actual running instance's name in place of `instance-name.incus` below.
For the recursive setup, you can use `forest-ca.incus` instead.

```bash
sudo resolvectl flush-caches
resolvectl query instance-name.incus
resolvectl query example.org
getent ahosts instance-name.incus
```

The local query should report `incusbr0`; the public query should follow your ordinary DNS configuration, such as `eno1` or your VPN, rather than `incusbr0`.
`getent` also checks name resolution through the host's normal application lookup path.
Applications must use that host resolver for this policy to apply; a browser configured to use its own DNS-over-HTTPS service can bypass it.
Check that `/etc/resolv.conf` uses the local resolver stub, normally through a symlink to `/run/systemd/resolve/stub-resolv.conf`, rather than exposing a flat list of upstream servers that loses the split-DNS policy.

To check resolver-restart persistence, run `sudo systemctl restart systemd-resolved` and repeat the status and query checks.
Repeat them after your next reboot too.
If you later change the bridge subnet or the helper's address, update the unit's DNS address and run:

```bash
sudo systemctl daemon-reload
sudo systemctl restart incus-dns-incusbr0.service
```

#### Stop the service

To remove this per-link configuration and prevent it from being reapplied:

```bash
sudo systemctl disable --now incus-dns-incusbr0.service
```
