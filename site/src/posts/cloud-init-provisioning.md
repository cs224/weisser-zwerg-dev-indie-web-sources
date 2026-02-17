---
layout: "layouts/post-with-toc.njk"
title: "Cloud-Init Provisioning: A Practical Guide"
description: "Provision new Linux systems with cloud-init - and understand the knobs that matter."
seodescription: "Practical cloud-init guide: datasources, boot stages, instance-id, and networking. NoCloud on Incus and VPS, with checklists, pitfalls, and safety tips."
creationdate: 2026-02-17
keywords: cloud-init, provisioning, Linux automation, user-data, datasource, first boot, infrastructure, VPS, Incus, LXD
date: 2026-02-17
tags: ['post']
---

## Rationale

When I started writing my [Nym Mixnet & dVPN: A Node Operator's Guide (2026)](../digital-civil-rights-networking-nym-node-operator-guide-2026/), I first planned to use *cloud-init* as a small ("thin") provisioning tool to automate the setup steps.

Later, I discovered the main helper for Nym node setups: the *Nym Node CLI*.
It drives most installation and configuration steps for you, so cloud-init became unnecessary for that guide.
I finished the operator's guide without mentioning cloud-init.

But I still wanted to document what I learned while researching cloud-init.

I started to really like cloud-init when I began working with [Incus](../home-server-infrastructure/#incus%2Flxd-as-an-alternative-to-vagrant-for-devops-testing) (formerly LXD).
There, cloud-init is simple ("thin"), and self-contained in one `profile.yml`. For straightforward setups, it does the job in a straightforward way.

My main takeaway after looking into cloud-init in more detail is that it is simple and nice, but it is easy to misunderstand the mental model at first, especially around *what runs when*, *where data comes from*, and *what changes are one-time vs repeatable*.
Those misunderstandings can lead to confusing results and unnecessary troubleshooting.

This blog post is my attempt to capture that learning journey and turn it into a usable guide to highlight the main knobs you can turn to make good use of cloud-init across common environments (local virtualization and VPS providers).
The goal is not a deep technical manual, but a practical guide to using cloud-init with confidence.

> For anything more involved than basic provisioning, it's often better to use a dedicated configuration-management or infrastructure tool, such as:
> - [Ansible](https://github.com/ansible/ansible)
> - [Chef](https://www.chef.io)
> - [Puppet](https://www.puppet.com)
> - [Saltstack](https://saltproject.io/)
> - [Terraform](https://developer.hashicorp.com/terraform)

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Recap - Using cloud-init in Incus (minimal)

Before we go deeper into cloud-init concepts, here is a short recap of how cloud-init is commonly used with *Incus system containers*.

In Incus, cloud-init is usually driven through an *Incus profile*.
Incus passes the cloud-init configuration to the container via the *NoCloud* datasource, and cloud-init applies it during first boot.

> The following is mainly taken from the [Incus Workload System Container with a Public IPv6 Address](../home-server-incus-route64-ipv6/#incus-workload-system-container-with-a-public-ipv6-address) subsection of the [Public IPv6 for Incus Instances on Your Home Server with the ROUTE64 Tunnel Broker](../home-server-incus-route64-ipv6/) post; specificllay the [route64-public-test-profile.yml](../home-server-incus-route64-ipv6/#route64-public-test-profile.yml).

The profile below is intentionally small and focuses on a few basics:

* predictable output logging (`/var/log/cloud-init-output.log`)
* a non-root admin user
* SSH key login only (no passwords, no root login)
* a small set of packages that are useful on almost any server

`incus-minimal-profile.yml`:
```yaml
name: incus-minimal-profile
description: "Minimal cloud-init baseline for Incus system containers (SSH + admin user)"
config:
  boot.autostart: "true"
  boot.autostart.priority: "20"
  security.nesting: "false"
  limits.cpu: "1"
  limits.memory: 1GiB
  limits.memory.enforce: "hard"

  cloud-init.user-data: |
    #cloud-config

    # Log cloud-init output to a file you can tail during provisioning
    output:
      all: "| tee -a /var/log/cloud-init-output.log"

    # A default hostname (you can override per instance)
    hostname: ct-minimal
    preserve_hostname: false

    # Keep updates simple: refresh package lists, but do not force upgrades by default
    package_update: true
    package_upgrade: false

    apt:
      conf: |
        APT::Install-Recommends "0";
        APT::Install-Suggests "0";

    # Keep the package list small and broadly useful
    # Note: 'sudo' is not guaranteed to be present on every minimal image.
    packages:
      - openssh-server
      - sudo
      - ca-certificates
      - curl
      - iproute2
      - systemd-resolved
      - telnet
      - netcat-openbsd
      - nano
      - emacs-nox
      - less
      - wajig

    # SSH hardening basics
    ssh_pwauth: false
    disable_root: true

    # Create an admin user with SSH key auth
    users:
      - name: admin
        groups: [sudo]
        shell: /bin/bash

        # Convenience default: passwordless sudo (adjust if you prefer stricter)
        sudo: "ALL=(ALL) NOPASSWD:ALL"

        # No local password; key-based login only
        lock_passwd: true
        ssh_authorized_keys:
          - ssh-ed25519 AAAA... your-key-comment

    # Ensure drop-in dir exists (some images differ)
    bootcmd:
      - mkdir -p /etc/ssh/sshd_config.d

    # Put policy in a drop-in file (low-risk, easy to override later)
    write_files:
      - path: /etc/ssh/sshd_config.d/00-cloud-init-hardening.conf
        owner: root:root
        permissions: "0644"
        content: |
          PermitRootLogin no
          PubkeyAuthentication yes
          PasswordAuthentication no
          KbdInteractiveAuthentication no
          UsePAM yes

    # Apply SSH config after first boot provisioning
    runcmd:
      - [ usermod, -p, '*', admin ] # Lock password login but keep key-based SSH (set password hash to '*')
      - [ sh, -c, "systemctl reload ssh || systemctl restart ssh || service ssh restart || true" ]

  # Keep networking "boring": DHCP on the default interface.
  # Note: Many Incus images already bring up networking without needing this.
  cloud-init.network-config: |
    version: 2
    ethernets:
      eth0:
        dhcp4: true
        dhcp6: true
        accept-ra: true

# Note: no devices section here.
# Apply this profile together with 'default' so you inherit your host's normal NIC and storage settings.
```

> Replace the SSH key with your real public key.

And here is how you use the profile plus sanity checks:
```bash
# Create and load the profile
incus profile create incus-minimal-profile
incus profile edit incus-minimal-profile < incus-minimal-profile.yml

# Launch a system container (use both default + minimal profile)
incus launch images:debian/trixie/cloud ct-minimal --profile default --profile incus-minimal-profile

# Watch provisioning output
incus exec ct-minimal -- tail -f /var/log/cloud-init-output.log

# Enter the container
incus exec ct-minimal -- bash

# Quick sanity checks
cloud-init status --long
cloud-init query --list-keys
cloud-init query userdata
ls -l /var/lib/cloud/instance/
ls -l /run/cloud-init/
sshd -T | egrep -i 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|usepam'
```

## Cloud-init on an Existing Debian System (NoCloud "provision now")

> **ATTENTION**: The steps below are based on documentation, but I have not tested them end to end on a real system. If you try this, do it first on a disposable VM or make a snapshot, because cloud-init can change users, SSH access, and networking.

Cloud-init is often introduced as "a cloud image thing". But you can also use it on a Debian system that was installed normally (no cloud image, no provider metadata service).
This is how you do it:

1. install cloud-init
2. provide it with **NoCloud** seed files (`user-data`, `meta-data`, optionally `network-config`)
3. run cloud-init (either on next boot, or manually "provision now")

NoCloud is [explicitly designed for this](https://cloudinit.readthedocs.io/en/latest/reference/datasources/nocloud.html): it lets you provide cloud-init data without any cloud provider integration.

You can find further info here:
* <https://docs.cloud-init.io/en/latest/>
* <https://cloudinit.readthedocs.io/en/latest>
* <https://linuxcontainers.org/incus/docs/main/cloud-init/>
* <https://docs.openstack.org/diskimage-builder/latest/elements/cloud-init/README.html>

### Step 1 - Install the packages (Debian 13)

```bash
sudo apt update
sudo apt install -y cloud-init cloud-utils
```

For [future boots](https://cloudinit.readthedocs.io/en/latest/howto/debugging.html), make sure the cloud-init services are enabled:

```bash
sudo systemctl enable cloud-init-local.service cloud-init.service cloud-config.service cloud-final.service
```

### Step 2 - Tell cloud-init to use NoCloud (avoid datasource guessing)

On a non-cloud system, cloud-init may waste time probing cloud datasources that will never answer.
A clean approach is to restrict it to NoCloud only.

Create `/etc/cloud/cloud.cfg.d/90_datasource_nocloud.cfg`:

```bash
sudo tee /etc/cloud/cloud.cfg.d/90_datasource_nocloud.cfg >/dev/null <<'EOF'
datasource_list: [ NoCloud ]
EOF
```

If you want to be extra explicit, you can also point NoCloud at a specific seed directory.
This removes another source of ambiguity during debugging:

```bash
sudo tee /etc/cloud/cloud.cfg.d/91_nocloud_seedfrom.cfg >/dev/null <<'EOF'
datasource:
  NoCloud:
    seedfrom: file:///var/lib/cloud/seed/nocloud-net/
EOF
```

### Step 3 - "Position" the seed files (this is the non-Incus equivalent of the profile YAML)

In Incus, you embedded cloud-init config inside the profile under:

* `cloud-init.user-data: |`
* `cloud-init.network-config: |`

On a regular Debian system using NoCloud, those become files on disk:

* `user-data` (your cloud-config)
* `meta-data` (instance identity plus hostname)
* `network-config` (optional, and risky on remote systems)

Create the seed directory:

```bash
sudo mkdir -p /var/lib/cloud/seed/nocloud-net
```

This directory name is [common](https://linuxcontainers.org/incus/docs/main/cloud-init) in Incus and LXD setups.
On some systems and in some guides you will also see `/var/lib/cloud/seed/nocloud/`.
For this post I stick to `nocloud-net` because it matches what Incus commonly uses and because it is a natural place to put `network-config` when you need it.

#### 3.1 Create `meta-data`

Pick an instance-id (any stable string is fine for local tests), and a hostname:

```bash
sudo tee /var/lib/cloud/seed/nocloud-net/meta-data >/dev/null <<'EOF'
instance-id: iid-local-debian13-001
local-hostname: deb13-ci
EOF
```

#### 3.2 Create `user-data` (based on your minimal profile)

This is your "minimal baseline" config, copied into a standalone cloud-config file:

```bash
sudo tee /var/lib/cloud/seed/nocloud-net/user-data >/dev/null <<'EOF'
#cloud-config

output:
  all: "| tee -a /var/log/cloud-init-output.log"

hostname: deb13-ci
preserve_hostname: false

package_update: true
package_upgrade: false

apt:
  conf: |
    APT::Install-Recommends "0";
    APT::Install-Suggests "0";

packages:
  - openssh-server
  - sudo
  - ca-certificates
  - curl
  - iproute2
  - systemd-resolved
  - telnet
  - nano
  - emacs-nox
  - less
  - wajig


ssh_pwauth: false
disable_root: true

users:
  - name: admin
    groups: [sudo]
    shell: /bin/bash
    sudo: "ALL=(ALL) NOPASSWD:ALL"
    lock_passwd: true
    ssh_authorized_keys:
      - ssh-ed25519 AAAA... your-key-comment

bootcmd:
  - mkdir -p /etc/ssh/sshd_config.d

write_files:
  - path: /etc/ssh/sshd_config.d/00-cloud-init-hardening.conf
    owner: root:root
    permissions: "0644"
    content: |
      PermitRootLogin no
      PubkeyAuthentication yes
      PasswordAuthentication no
      KbdInteractiveAuthentication no
      UsePAM yes

runcmd:
  - [ sh, -c, "systemctl reload ssh || systemctl restart ssh || service ssh restart || true" ]
EOF
```

> Replace the SSH key with your real public key.

#### 3.3 Create `network-config` (optional, but shown once)

This is the most risky part on a remote system, because applying network config incorrectly can disconnect you.

First, identify your real interface name:

```bash
ip link
```

Then create a conservative DHCP network-config.
Replace `eth0` with your interface name (for example `ens3`):

```bash
sudo tee /var/lib/cloud/seed/nocloud-net/network-config >/dev/null <<'EOF'
version: 2
ethernets:
  eth0:
    dhcp4: true
    dhcp6: true
    accept-ra: true
EOF
```

### Step 4 - Run a "provision now" (manual run) or reboot (more realistic)

Cloud-init is designed to run during boot.
For a realistic flow, reboot after seeding.
But for learning and debugging, you can run the stages manually.

#### Option A (recommended for realism): clean plus reboot

```bash
sudo cloud-init clean --logs --reboot
```

`cloud-init clean` removes cloud-init artifacts under `/var/lib/cloud` so it behaves like a fresh instance again.

#### Option B ("provision now", no reboot): run stages manually

```bash
sudo cloud-init clean --logs
sudo cloud-init init --local
sudo cloud-init init
sudo cloud-init modules --mode=config
sudo cloud-init modules --mode=final
```

This is the documented [manual run shape](https://cloudinit.readthedocs.io/en/latest/howto/rerun_cloud_init.html).

### Step 5 - Observe what happened (logs plus sanity checks)

Watch your own cloud-init output file:

```bash
sudo tail -f /var/log/cloud-init-output.log
```

Check overall status:

```bash
cloud-init status --long
```

Confirm cloud-init saw your config:

```bash
cloud-init query --list-keys
cloud-init query userdata
```

Confirm the user exists and has sudo:

```bash
id admin
sudo -l -U admin
```

Confirm SSH policy (expect: no root login, no password auth):

```bash
sshd -T | egrep -i 'permitrootlogin|passwordauthentication|kbdinteractiveauthentication|pubkeyauthentication|usepam'
```

And if you enabled the systemd services, you can also inspect the stage units:

```bash
systemctl status cloud-init-local.service cloud-init.service cloud-config.service cloud-final.service
```

### What you should take away

* Installing cloud-init is the easy part.
* The key mental shift is: cloud-init needs a datasource.
* For "no cloud provider" systems, *NoCloud plus seed files* is the simplest way to make cloud-init useful.

## Cloud-init on a VPS

Many VPS providers provision new instances using cloud-init.
As a customer, you usually only see the result, such as users, SSH keys, hostname, and networking.
The actual inputs that cloud-init consumed can be harder to find, especially when the provider uses a local 'config drive' instead of a metadata service.

To make this easier to inspect, I created the gist [Analysing Cloud-Init on a VPS with `cloud-init-ctx.sh`](https://gist.github.com/cs224/feaa4c2b1b28a0004f1f873d84bfc454).
It includes a small helper script called `cloud-init-ctx.sh` plus documentation.
The script connects to the target machine over SSH and collects cloud-init status information and logs into a single text file.

Run it from your workstation:
```bash
./cloud-init-ctx.sh <ssh-target>
# example:
./cloud-init-ctx.sh root@94.143.231.195
```

The SSH target should log in as `root`.
The script reads privileged cloud-init state and log files, so it needs administrative access.

The output file is written next to the script, named like this:
```text
< target >.cloud-init-ctx.txt
```

From that output, I could infer that this particular VPS instance uses `/dev/sr0` as its seed source.
In other words, the provider attached an ISO image that contains the NoCloud style seed files.
The contents were not mounted automatically on the running system, but I could mount the device read only and inspect the data:
```bash
root@v1768142702:~# mkdir /mnt/cidata
root@v1768142702:~# mount -t iso9660 -o ro /dev/sr0 /mnt/cidata && ls -la /mnt/cidata
total 8
drwxr-xr-x 2 root root 2048 Feb 16 09:08 .
drwxr-xr-x 3 root root 4096 Feb 17 08:08 ..
-rw-r--r-- 1 root root   54 Feb 16 09:08 meta-data
-rw-r--r-- 1 root root  463 Feb 16 09:08 network-config
-rw-r--r-- 1 root root  992 Feb 16 09:08 user-data
-rw-r--r-- 1 root root    0 Feb 16 09:08 vendor-data
```

On many KVM based VPS platforms, `/dev/sr0` is a virtual CD ROM device.
Providers often attach a small ISO image as a 'config drive' that contains provisioning data.
This is a close cousin of the NoCloud datasource approach, because it delivers the same kinds of files: `user-data`, `meta-data`, and sometimes `network-config` and `vendor-data`.

> If you want to verify that this is really a config drive style setup, a simple extra check is to look at the filesystem label:
> ```bash
> blkid /dev/sr0
> ```
> Often you will see a label like `cidata` or something provider specific.

Another interesting detail was the presence of a file named `/etc/cloud/cloud.cfg.d/99_pve.cfg`. Here, `pve` is a common abbreviation for [Proxmox VE](https://en.wikipedia.org/wiki/Proxmox_Virtual_Environment).

This does not prove that the underlying VPS host is definitely running Proxmox.
What it proves is that the guest image I received contains a Proxmox targeted cloud-init override.

> Cloud-init reads configuration from multiple files.
> The directory `/etc/cloud/cloud.cfg.d/` is specifically meant for drop in overrides.
> Providers and image builders often add a late numbered file such as `99_*.cfg` to change defaults without modifying the main upstream config file.
>
> Typical changes in these overrides include:
>
> * datasource ordering or datasource specific settings
> * network renderer selection and related network defaults
> * default user and SSH behavior
> * module enablement and ordering

## First Boot Initialization

Cloud-init is mainly a tool for "first boot initialization", but it is still *invoked on every boot*.
The important detail is that most of the actual work is designed to run only once per instance, based on the instance identity and cached state.
Only a small subset of modules is expected to run on every boot.

Cloud-init is structured as a set of [boot stages](https://cloudinit.readthedocs.io/en/latest/explanation/boot.html) (Detect, Local, Network, Config, Final).
On a system where cloud-init is enabled, the system triggers these stages each time the machine boots.

The framework starts on each boot, but modules usually decide to do nothing.

### Modules run based on frequency and state

Cloud-init is modular. Each module has an execution **frequency**, for example "once per instance", "once", or "always per boot".
This frequency, together with cached state, decides whether the module actually runs.

So the usual pattern looks like this:

* cloud-init (the framework and its stages) starts on every boot
* each module then decides whether to run, based on:
  * the current `instance-id` and the cached state for that instance
  * the module's frequency (for example "once per instance" versus "always per boot")
  * the boot event type (for example a new instance boot versus a regular reboot)

As long as the `instance-id` is stable, cloud-init treats the VM as the same instance.
In that case it will usually **not** re run modules that are meant to run "once per instance".

> Cloud-init distinguishes between a first boot of an instance and a normal reboot.
> Many modules only do real work on the "new instance" path.

A practical rule of thumb for scripts is:

* `bootcmd` runs on every boot (module frequency is "always")
* `runcmd` runs once per instance (it is executed by the `scripts-user` module, which is "once-per-instance")
* `scripts-per-boot` runs on every boot
* `scripts-per-once` runs exactly once unless you clean state

For details, the module reference is the source of truth: <https://cloudinit.readthedocs.io/en/latest/reference/modules.html>

If you want to enforce your own "once" or "always" behavior inside a command, the `cloud-init-per` helper is useful:

```bash
cloud-init-per once my-marker some-command arg1 arg2
cloud-init-per instance my-marker some-command arg1 arg2
cloud-init-per always my-marker some-command arg1 arg2
```

### Semaphores

Cloud-init enforces "run once" behavior using marker files, often called semaphores. You can inspect them here:
```text
/var/lib/cloud/instances/<instance-id>/sem/
```

Those `config_*` marker files are simple receipts. Their presence is cloud-init's way of saying: "I already ran this module for this instance, so I will skip it next time."

### Per instance versus per once semaphores

There are two useful places to know about:

* `/var/lib/cloud/instances/<instance-id>/sem/` stores semaphores that are scoped to a specific instance identity
* `/var/lib/cloud/sem/` is commonly used for semaphores that are not tied to a single instance directory

If you are testing and you want to "start over", you will often look at these locations (and at `cloud-init clean`, which removes state and semaphores).

### What can still change on a normal reboot

Even when the `instance-id` stays the same, some things can still happen on every boot, because certain modules are expected to refresh state.
These are the modules with an "always" or "per boot" behavior, and they often do small checks or maintenance tasks.

On my VPS boot record I saw examples of work that can occur on every boot:

* `scripts-per-boot` runs on each boot (by definition).
* `final-message` ran and updated the "boot finished" marker file.

> Above I used the `bootcmd:` directive in `cloud-init.user-data`.
> This is the one directive in my baseline cloud-init configurations that I *expect* to run on every boot, because `bootcmd` is documented with [module frequency "always"](https://cloudinit.readthedocs.io/en/latest/reference/modules.html#bootcmd).

## Networking (`cloud-init.network-config`)

Cloud-init supports [network config Version 2](https://cloudinit.readthedocs.io/en/latest/reference/network-config-format-v2.html), which is closely aligned with the YAML format used by Netplan.
In practice, you can think of it like this: if Netplan is installed, cloud-init can hand the configuration to Netplan, and Netplan then applies it using the selected backend.
If Netplan is not installed, cloud-init can still apply network settings, but the supported feature set is narrower because cloud-init has to render to other formats directly.

> In [Netplan](https://netplan.readthedocs.io/en/stable/netplan-yaml/), `renderer` selects which backend actually applies networking.
>
> * `networkd`: backend is `systemd-networkd`, common on server and VPS images.
> * `NetworkManager`: backend is NetworkManager, common on desktop and laptop images.

### Where cloud-init gets network configuration from

Cloud-init does not treat networking like normal `user-data`.
Network configuration is discovered from a small set of dedicated sources, with a defined precedence order (later entries override earlier ones):

1. datasource (for example a provider metadata service, or a local config drive)
2. system config (a `network:` entry in `/etc/cloud/cloud.cfg.d/*`)
3. kernel command line (`ip=` or `network-config=<Base64...>`)

> User-data cannot change an instance's network configuration.
> This is an intentional design choice: network config comes from the datasource, system config, or kernel command line, not from `user-data`.
> The cloud-init docs call this out explicitly: <https://cloudinit.readthedocs.io/en/latest/reference/network-config.html>

If no network configuration is found from those sources, cloud-init generates a fallback that typically means DHCP on the first suitable interface.

So in my environments:

* **Incus**: the network config is passed as a separate `network-config` input. LXD and Incus documentation shows that it ends up in `/var/lib/cloud/seed/nocloud-net/network-config`.
* **VPS**: the provider placed `network-config` on the CIDATA ISO, so it is datasource provided network config.

> It helps to keep two channels separate in your head:
> * `user-data` is for system customizations such as users, packages, files, and scripts.
> * `network-config` is for the initial network wiring that cloud-init needs early, so that the rest of provisioning can safely assume networking exists.

### `dsmode=net`

On my VPS the `cloud-init query ds` command returns:

```bash
root@v1768142702:~# cloud-init query ds
{
 "_doc": "EXPERIMENTAL: The structure and format of content scoped under the 'ds' key may change in subsequent releases of cloud-init.",
 "meta_data": {
  "dsmode": "net",
  "instance-id": "8b87ce077beba9c5bfa03ffe8b8725e1d91db09b"
 }
}
```

This `dsmode` parameter is a *datasource mode*.
A good way to understand it is: it tells cloud-init in which stage the datasource should be processed.
Cloud-init documents `dsmode` as:

* `local`: process the datasource in the local (pre networking) stage
* `net`: process the datasource in the network (post networking) stage
* `disabled`: do not use the datasource

A concise statement of this behavior exists in the cloud-init datasource documentation (for example in the OpenNebula datasource docs): <https://docs.cloud-init.io/en/latest/reference/datasources/opennebula.html>

`dsmode` has nothing to do with the *contents* of your `network-config`.
Even with `dsmode=net`, a local datasource like NoCloud can still read the seed from local media (directory or ISO) and can still provide `network-config` without needing the network.
The main difference is about sequencing and assumptions: in net mode, cloud-init may delay datasource dependent decisions until after basic networking is considered available.

### First boot: where networking comes from in practice

For my VPS case, the first boot sequence looks like this:

1. The NoCloud seed is discovered (CIDATA on `/dev/sr0`).
2. Cloud-init reads `network-config` from the datasource (this is local media, so no network is required for the read step).
3. Cloud-init renders the network configuration into the format expected by the guest OS networking stack (in my Debian image this was the classic ENI style used by ifupdown).
4. The OS networking service brings the interface up using that rendered configuration.

> If you want cloud-init to not touch networking:
>
> Cloud-init supports disabling its network configuration handling via system config.
> If you see cloud-init rewriting your network files and you do not want that, the documented knob is `network: {config: disabled}` in a file under `/etc/cloud/cloud.cfg.d/`.

## Conclusion

This concludes this guide to cloud-init and the main knobs you can turn to make good use of it across common environments.

If there is one mental model to keep, it is this: cloud-init is a boot-time framework that *consumes input from a datasource* and then runs *modules with defined frequencies*.
It starts on every boot, but most modules are designed to apply configuration only once per instance.

## FAQ

This section collects the questions that caused the most confusion during my own research.

### Does my VPS provider support cloud-init user-data, and where is it documented?

Many providers use cloud-init internally, but not all providers expose a supported customer interface for supplying `user-data`.
When providers do expose it, it is typically available through one of these surfaces:

* the provider web UI (a text field called something like "cloud-init", "user-data", or "startup script")
* the provider API (often the same field, just set via API)

### How can I verify cloud-init is really provisioning this machine?

"Cloud-init is installed" is not the same as "cloud-init is wired into a datasource and actually ran".
A quick checklist that works on most Linux images is:

* `cloud-init status --long` (look for `status: done` and the active datasource)
* `cloud-init query ds` (look for datasource hints such as seed device, instance-id, and dsmode)
* `grep -i datasource /var/log/cloud-init.log | head -n 20` (early boot logs often show datasource discovery)
* `ls -la /var/lib/cloud/instance/` (a populated directory usually means cloud-init has created instance state)
* `ls -la /run/cloud-init/` (look for `instance-data.json`, `instance-data-sensitive.json`, and `ds-identify.log`)
* `test -f /run/cloud-init/instance-data.json && echo instance-data-present` (presence is a strong signal that cloud-init ran)
* `cloud-init analyze show` (if available, it summarizes which stages ran and how long they took)

If you have a config drive, mounting it and inspecting its contents is strong evidence because it shows the raw inputs cloud-init likely consumed.

### Why does `cloud-init query` sometimes not show keys I expect?

`cloud-init query` reads instance data that cloud-init collected.
Whether a specific key exists depends on the datasource, the cloud-init version, and which stages completed.

When you debug, it often helps to use `cloud-init status --long` together with `/var/log/cloud-init.log` so you can see which stages ran and what cloud-init believed its datasource was.

A small habit that helps is to ask cloud-init what it can actually answer before you query a specific key:

* `cloud-init query --list-keys` (shows the stable top level aliases available on this system)
* `cloud-init query --all` (dumps everything, but treat it as sensitive until you have reviewed it)

### What do NoCloud, ConfigDrive, CIDATA, `nocloud`, and `nocloud-net` mean?

These names are easy to mix up because they are related, but not identical.

* **NoCloud** is a cloud-init datasource that can read seed data from local media or from a URL.
* **NoCloudNet** is a historical name you may still see in logs or code references. In practice, for most users it is easiest to treat it as 'NoCloud with network-config support' and focus on what seed source is actually used.
* **ConfigDrive** is a common provider pattern where the seed is delivered via an attached ISO image.
* **CIDATA** is a conventional ISO filesystem label often used for NoCloud style seed ISOs.
* `nocloud` and `nocloud-net` are commonly used seed directory names under `/var/lib/cloud/seed/`.
  You often see `nocloud-net` in Incus and LXD contexts.

If you want deterministic behavior, you can reduce surprises by pinning the datasource order in `/etc/cloud/cloud.cfg.d/` using `datasource_list`.

### What exactly triggers cloud-init to treat a machine as a new instance?

The `instance-id` is the main gate.
Cloud-init uses it to decide whether the machine is "the same instance as last time".

Typical triggers that make cloud-init see a "new instance" are:

* the datasource reports a different `instance-id`
* the config drive content changes and includes a new `instance-id`
* you clean cloud-init state (`cloud-init clean`) and reboot

Changing only the hostname usually does not trigger a full re run because hostname is just one piece of configuration, not an identity signal.

### ENI vs `systemd-networkd` vs Netplan: what am I looking at?

The networking backend depends on the distribution defaults and the image builder's choices.
A practical way to see what is in charge is:

* ENI and ifupdown: look for `/etc/network/interfaces` and files under `/etc/network/interfaces.d/`
* `systemd-networkd`: look for `.network` and `.netdev` files under `/etc/systemd/network/`
* Netplan: look for YAML under `/etc/netplan/` and check which renderer it targets

Cloud-init can render network configuration to different backends.
That is why the same `network-config` structure can lead to different concrete files on disk.

### Can I run a hybrid: keep provider ENI baseline, but add `systemd-networkd` for extra components?

You usually can, but the key safety rule is: do not let two systems manage the same interface.

A safe pattern is:

* keep the primary interface managed by the provider's existing stack (often ENI and ifupdown)
* use `systemd-networkd` only for additional virtual devices, tunnels, or extra interfaces that are not touched by ENI

In practice, this often means you add only `.netdev` and `.network` files for new devices, and you do not create `systemd-networkd` configs that match the main interface name.

### How can I inject my own provisioning on a VPS that already uses cloud-init?

If your provider already uses cloud-init, a common mistake is to run `cloud-init clean` and reboot.
That can cause cloud-init to re apply the provider's provisioning again, which is not always what you want.

Safer layering approaches are:

* add your own drop in config under `/etc/cloud/cloud.cfg.d/` that is independent of the provider seed
* use `write_files` to install your own scripts and a systemd unit, and let systemd manage your second stage provisioning
* use the built in script hooks under `/var/lib/cloud/scripts/` for per boot or per instance work
* use `cloud-init-per instance ...` to make your own commands idempotent without fighting cloud-init state

If you want a clean "second phase" provisioning run, it is often simpler to use Ansible from your workstation once the machine is reachable, and leave the provider cloud-init flow alone.

### What should I collect for debugging, and what should I not publish?

Cloud-init debugging output can contain secrets.
Before you share logs publicly, assume that these can be sensitive:

* raw `user-data` and `vendor-data` (they may contain tokens, SSH keys, passwords, or internal URLs)
* instance data files under `/var/lib/cloud/instances/` (some are explicitly "sensitive")
* `/var/log/cloud-init.log` and `/var/log/cloud-init-output.log` (they may echo credentials or rendered config)

A safe workflow is:

* collect your evidence first
* then redact before sharing
* treat `cloud-init query --all` as sensitive unless you have inspected it carefully

Concrete redaction tips that worked well for me:

* Replace public SSH keys if you do not want them tied to a specific host identity.
* Remove any lines containing `password`, `token`, `secret`, `key`, `Authorization`, or `Bearer`.
* If you share `cloud-init.log`, scan for rendered config content, not only for obvious credentials.
