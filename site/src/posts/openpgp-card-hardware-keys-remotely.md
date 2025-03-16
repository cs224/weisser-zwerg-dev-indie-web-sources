---
layout: "layouts/post-with-toc.njk"
title: "GPG Agent Forwarding with Hardware Tokens: YubiKey, Nitrokey, or Trezor on Remote Servers"
description: "Sign and Decrypt on Remote Servers Through GPG Agent Forwarding"
creationdate: 2025-03-12
keywords: gpg, pgp, hardware keys, ssh tunnel, ssh agent forwarding, gpg agent, linux security, remote signing, cryptography, openpgp card, hardware token, smartcard
date: 2025-03-13
tags: ['post']
---

## Rationale

As cyber threats grow more advanced, hardware-based cryptography is becoming essential for protecting sensitive data.
GPG/PGP hardware keys, leveraging the OpenPGP card standard on devices like [YubiKey](https://www.yubico.com/products/yubikey-5-overview/), [Nitrokey](https://www.nitrokey.com/products/nitrokeys) or [Trezor](https://trezor.io/trezor-model-t),
keep private keys locked away in a secure environment.
But what if you need to decrypt or sign files on a remote server without direct access to your hardware key?
In this article, we'll show you how to set up GPG agent forwarding over SSH so that your private keys stay safely on your device, even when you work on remote machines.
Along the way, we'll address real-world needs - like decrypting backups offsite - and explore why hardware tokens remain one of the best options for strong, reliable security.

### Motivation

In [Home Server Blueprint: Rock-Solid Home Server with Unattended Reboots, Secure Disk Encryption, and Cost-Effective Offsite Backups](../home-server-infrastructure),
I outline a detailed way to create offsite backups.
One of the simplest ways to protect your data during offsite transfers is to encrypt the backup archive with a public-private key pair before sending it to a remote storage location.

Conceptually, the process might look like this:
```bash
# Set up the public key on the remote server:

# On your local server, export your public key and copy it to the remote server
gpg --armor --export "username" > public_key.asc
scp ./public_key.asc remote-host:~/public_key.asc
ssh remote-host:

# On the remote server, import the key and set the trust level
gpg --import ./public_key.asc
gpg --list-keys
gpg --export-ownertrust > ownertrust.txt
# Adapt ownertrust.txt for your key (level 6 is ultimate)
gpg --import-ownertrust ownertrust.txt

# Use the public key on the remote server to encrypt the backup
gpg --encrypt -r "username" ./YYYY-MM-DD-backup-archive.tar.gz
# ... then transfer ./YYYY-MM-DD-backup-archive.tar.gz.gpg to an offsite backup storage
```

If you also use a hardware key that follows the OpenPGP card standard, you can ensure that your private key remains secure on the device at all times.
Hardware tokens, like those from YubiKey or Trezor, store private keys in a tamper-resistant module.
This means the key never leaves the device, reducing exposure to malware or other threats.

The challenge, however, is how to decrypt an archive on the remote server if your private key is physically connected to a different machine.
In this blog post, I'll show you how to overcome this obstacle by using GPG agent forwarding over SSH.

### The PGP Problem

I agree with critics of PGP and with security experts who say that PGP can be "bad engineering".
For more background, take a look at [What To Use Instead of PGP](https://soatok.blog/2024/11/15/what-to-use-instead-of-pgp/):
> It's been more than five years since [The PGP Problem](https://www.latacora.com/blog/2019/07/16/the-pgp-problem/) was published,
> and I still hear from people who believe that using PGP (whether GnuPG or another OpenPGP implementation) is a thing they should be doing.
>
> It isn't.

One main criticism is that PGP can be overly complex and prone to user errors, especially when it comes to key management.
This complexity sometimes leads to weakened security in real-world practice.  


Despite these critiques, I still find one big advantage in PGP/GPG: it is a widely adopted standard with plenty of hardware keys available to support it.
In my opinion, hardware keys are the gold standard for protecting private keys in public/private encryption - there just isn't a great alternative at the moment.

In this blog post, I’ll show you how to make use of the [YubiKey 5](https://www.yubico.com/products/yubikey-5-overview/) (either USB-A or USB-C), a [Nitrokey 3](https://www.nitrokey.com/products/nitrokeys) and the [Trezor Model T](https://trezor.io/trezor-model-t).

The YubiKey 5 family and the Nitrokey 3 comes in both USB-A and USB-C versions, making it compatible with most modern systems, while the Trezor Model T also supports PGP functionality.

### General Information about PGP/GPG

I won't go in-depth about the general usage of PGP/GPG. If you need more background, here are a few helpful references:

* [GPG Cheat Sheet](https://gock.net/blog/2020/gpg-cheat-sheet)
* [OpenPGP Best Practices](https://riseup.net/en/security/message-security/openpgp/best-practices)
* [PGP FAN](https://articles.59.ca/doku.php?id=pgpfan:index)
* [WKD](https://wiki.gnupg.org/WKD)
    * [GnuPG: Set up Web Key Directory (WKD).](https://www.kuketz-blog.de/gnupg-web-key-directory-wkd-einrichten)
    * Use WKD to download key and verify software packages like tor-browser:
    ```bash
    gpg --no-default-keyring --keyring ./tor-signing-ring.gpg --auto-key-locate nodefault,wkd --locate-keys torbrowser@torproject.org
    gpg --no-default-keyring --keyring tor-signing-ring.gpg --homedir ./ --list-keys
    gpg -v --no-default-keyring --keyring tor-signing-ring.gpg --homedir ./ --trust-model always --verify tor-browser-linux-x86_64-13.0.12.tar.xz.asc
    ```
    * Or for [weisser-zwerg.dev](/.well-known/openpgpkey/hu/jsij89suen4p9cb3n3j97i5migbdxfn1)
    ```bash
    curl -s https://weisser-zwerg.dev/.well-known/openpgpkey/hu/jsij89suen4p9cb3n3j97i5migbdxfn1 | gpg --show-keys
    gpg  --no-default-keyring --keyring ./weisser-zwerg-keyring.gpg --auto-key-locate nodefault,wkd --locate-keys cs224@weisser-zwerg.dev
    gpg  --no-default-keyring --keyring ./weisser-zwerg-keyring.gpg --homedir ./ --list-keys
    # --- or via the github api ---
    curl -s https://api.github.com/users/cs224/gpg_keys | jq -r '.[0].raw_key' | gpg --show-keys
    ```

I also won't demonstrate how to set up a hardware key like the [YubiKey 5](https://www.yubico.com/products/yubikey-5-overview/) for OpenPGP usage.
For a detailed walkthrough, check out Charles Hoskinson's video: [Security Foundations: How to Secure Your Wallet Recovery Phrase for Cryptocurrency Wallets](https://youtu.be/fqrAzBAi64c?t=3438).

The process I follow to create a new PGP key is to boot a laptop with a live Linux distribution so it's guaranteed to be a fresh environment.
Then I create the PGP key, protect it with a strong password, and back it up onto a USB stick or a more advanced solution like an [Apricorn](https://www.amazon.com/Apricorn-256-bit-Encrypted-Validated-ASK3-NX-4GB/dp/B07GKZWB6N) Encrypted Secure Drive. After that, I move the private key onto the hardware key. When I reboot the laptop, all data is securely erased because live Linux distributions run in RAM, and a restart clears everything.

The big advantage of this approach is that you have a backup of your key. If you ever lose or damage your hardware key, you can still recover your keys from that backup.

Some popular live Linux distributions include [Tails](https://tails.net/) or [Ubuntu Live](https://ubuntu.com/tutorials/try-ubuntu-before-you-install#1-getting-started).
They load into RAM without writing to disk, making them ideal for creating sensitive keys safely and leaving no trace after a reboot.  

## Conceptual Overview

On a conceptual level, the setup is quite straightforward.
Through SSH forwarding, you route the local GPG agent socket - running on the workstation right in front of you - to the remote server where you need to decrypt or sign files.
This allows you to interact with your hardware key just as you would locally, while still making it available to the remote system.

In practical terms, the remote server uses the forwarded GPG agent socket instead of requiring direct access to your hardware key.

Along the way, there are some pitfalls to watch out for, but in this blog post I'll show you how to overcome these challenges.

### Preparation of the Remote Server

In order to make our hardware key's functionality available on the remote server, we'll use `RemoteForward` to connect our local `gpg-agent` socket to the remote machine.
This ensures that signing and decryption operations will still be handled by our hardware token, even though we're working remotely:
```bash
ssh -o StreamLocalBindUnlink=yes -R /run/user/0/gnupg/S.gpg-agent:/run/user/1000/gnupg/S.gpg-agent.extra root@host.example.com
```

> Later you will have to make sure you adjust the socket paths and user IDs to match your environment. In this example:
> * `/run/user/0/gnupg/S.gpg-agent` is the remote path for the root user (UID 0).
> * `/run/user/1000/gnupg/S.gpg-agent.extra` is the local path for the user with UID 1000.

We need to ensure that no other processes on the remote system interferes with this socket.
One common culprit is `systemd`, which can automatically manage (and sometimes re-spawn) `gpg-agent` sockets.
This helpful discussion provides the key ingredients:
* [How can I use GPG agent forwarding over ssh when systemd owns the remote sockets?](https://unix.stackexchange.com/questions/638767/how-can-i-use-gpg-agent-forwarding-over-ssh-when-systemd-owns-the-remote-sockets)
<p></p>

> The easiest way to get gpg forwarding functional is to first tell systemd to stop messing with those sockets.<br>
> ...<br>
> Even with systemd evicted, there's another uninvited guest who tends to show up to these parties. Namely an ssh-agent on the remote system.

To keep the remote system "clean" of components or activities that might interfere with these sockets, disable and mask the `gpg-agent` systemd sockets:
```bash
systemctl --user disable gpg-agent.socket
systemctl --user disable gpg-agent-extra.socket
systemctl --user mask gpg-agent.socket
systemctl --user mask gpg-agent-extra.socket
systemctl --user stop gpg-agent.socket
systemctl --user stop gpg-agent-extra.socket
systemctl --user daemon-reload
systemctl --user status gpg-agent.socket
systemctl --user status gpg-agent-extra.socket
```

Next, tell `gpg-agent` not to start automatically when a `gpg` command is issued:
```bash
echo 'no-autostart' >> ~/.gnupg/gpg.conf
```

Then confirm that no `gpg-agent` processes are running:
```bash
pkill gpg-agent
pgrep -lf gpg-agent
```

Finally, move any existing Unix socket files out of the way so they won't conflict:
```bash
# Identify the socket:
gpgconf --list-dirs | sed -n 's/agent-socket://p'
# For me on this remote server this is: /run/user/0/gnupg/S.gpg-agent

# Move the old directory out of the way ...
mv /run/user/0/gnupg /run/user/0/gnupg.orig

# ... and create a new one
mkdir /run/user/0/gnupg
chmod og-rwx /run/user/0/gnupg
```

If you see errors related to permissions or missing directories, double-check that you're applying these steps as the correct user and that your system has the right ownership set for `/run/user/<UID>/gnupg`.

### Preparation of the Local Workstation

On the local workstation, you'll need to install some software components so that `gpg` can communicate with your OpenPGP card:
```bash
apt update && apt install scdaemon pcscd kleopatra
```

* The `scdaemon` is a daemon to manage smartcards. It is usually invoked by `gpg-agent` and in general not used directly. 
* The PC/SC Smart Card Daemon (`pcscd`) is the daemon program for [pcsc-lite](https://pcsclite.apdu.fr/) and the MuscleCard framework.
* Optional: [Kleopatra](https://apps.kde.org/de/kleopatra/) is a certificate manager and GUI for GnuPG.

Ubuntu 24.04 ships with a newer version of GnuPG (2.4.4), which replaces the older 2.2.27 found in Ubuntu 22.04.
This updated version changes how it accesses smartcard readers, so you may run into conflicts.
You can read more about these changes here:
* [GnuPG and PC/SC conflicts, episode 2](https://blog.apdu.fr/posts/2024/04/gnupg-and-pcsc-conflicts-episode-2): Ubuntu 24.04 provides a new version of GnuPG (GNU Privacy Guard): 2.4.4, instead of version 2.2.27 in Ubuntu 22.04. This new version changed its way to access smart card readers.
* [SmartCard stopped working in 2.4](https://dev.gnupg.org/T6871): In 2.4, a user need to specify `disable-ccid` in `scdaemon.conf` when `scdaemon` is built with integrated CCID driver (using libusb) but the user wants to use PC/SC driver instead.

> "CCID" stands for Chip Card Interface Device. GnuPG's scdaemon can support direct communication with the smartcard via its integrated CCID driver.
> However, if you prefer to let the `pcscd` daemon handle the card, you need to disable GnuPG's CCID driver to avoid conflicts.

In short, if you face this issue, add the following line to your `~/.gnupg/scdaemon.conf` file:
```bash
echo 'disable-ccid' >> ~/.gnupg/scdaemon.conf
```

That's all you need to do for the local workstation setup before moving on to agent forwarding.

### Working with OpenPGP Card Devices (like a YubiKey or Nitrokey)

In [GNU Privacy Guard (GPG)](https://gnupg.org), you can refer to a key in your keyring in several ways, making it easy to identify and use the correct key for encryption, signing, or other operations.
First, there's the short key ID, which typically includes the last 8 (or sometimes 16) hexadecimal characters of the key's fingerprint.
You can also use the long key ID, which offers more unique characters, making it more secure and less ambiguous.
Finally, you can identify a key by a case-insensitive substring of its associated user name or email (for example, `gpg --list-keys bob` to locate any key containing "Bob" in its user ID).
These flexible methods let you quickly find and work with the exact key you need.

#### Public Key Export and Import

As a first step, export the public key on your local machine:
```bash
# List the available keys:
gpg --list-keys

# Export the key (replace 'username' with the relevant user ID or key reference):
gpg --armor --export username > public_key.asc
```

Then transfer the `public_key.asc` file to your remote server:
```bash
# Use 'scp' (or another secure file transfer method)
scp public_key.asc remote-host:~/
```

Next, import the key on the remote server:
```bash
gpg --import ./public_key.asc
gpg --list-keys
```

Now, adjust the owner trust level to "ultimate" (level 6), so that GPG stops prompting you to confirm trust each time.
Create an `ownertrust.txt` file that looks like this:
```txt
1234567890ABCDEF1234567890ABCDEF12345678:6:
```

Then import this owner trust file and update the GPG trust database:
```bash

gpg --import-ownertrust ownertrust.txt
gpg --update-trustdb
gpg --list-keys
```

Finally, verify you can encrypt without being asked for confirmation:
```bash
echo "test secret" > test-secret.txt
gpg --recipient 1234567890ABCDEF1234567890ABCDEF12345678 --encrypt test-secret.txt
```
<p></p>

> GPG's trust model requires you to explicitly assign trust levels to keys.
> Setting a key to "ultimate" trust tells GPG that you fully trust the key's owner (usually yourself), so it won't repeatedly prompt you to confirm operations.

#### OpenPG Card Private Key on Remote Server

Now comes the interesting part: we'll use our local hardware key to decrypt on the remote server through GPG agent forwarding.
Make sure your hardware key is connected to your local workstation:
```bash
gpg --card-status
```

This command verifies that your OpenPGP card (YubiKey, Nitrokey, etc.) is recognized locally.

Next, we use SSH -R (`RemoteForward`) to bind our local `gpg-agent` socket to the remote machine, allowing cryptographic operations to be handled by the hardware key:
```bash
local_sock=$( gpgconf --list-dirs | sed -n 's/agent-extra-socket://p' )
echo $local_sock
# Example output: /run/user/1000/gnupg/S.gpg-agent.extra

remote=root@host.example.com
remote_sock=$( ssh "$remote" "gpgconf --list-dirs" | sed -n 's/agent-socket://p' )
echo $remote_sock 
# Example output: /run/user/0/gnupg/S.gpg-agent

ssh -o StreamLocalBindUnlink=yes -R $remote_sock:$local_sock $remote
```

If you encounter a warning like:
```txt
Warning: remote port forwarding failed for listen path /run/user/0/gnupg/S.gpg-agent
```
You may need to remove the existing socket on the remote server so SSH can create it:
```bash
rm -rf /run/user/0/gnupg/S.gpg-agent
```

Finally, let's decrypt our file using the hardware key on the remote server.
Once you're logged in remotely (with GPG agent forwarding set up), run:
```bash
# Decrypt the file on the remote server
gpg --decrypt test-secret.txt.gpg > test-secret.1.txt

# Verify the decrypted result
cat test-secret.1.txt
```
If your OpenPGP card requires a PIN, you'll be prompted on your local workstation to enter it.
Once you do so, the decryption will proceed normally.

> Because your private key remains locked on the hardware token, you'll see the PIN prompt locally even though the actual decryption command is run on the remote server.
> This security design ensures that your private key is never exposed outside the hardware device. 

You're now ready to use your hardware-based OpenPGP card on the remote server, ensuring your private key stays safely on your local device!

### PGP via Roman Zayde's Trezor-agent


I was already parising the [Trezor Model T](https://trezor.io/trezor-model-t) in my former blog post [Step Up Your SSH Game: A Deep Dive into FIDO2 Hardware Keys and ProxyJump Configuration](../openssh-fido2-hardwarekey).
The Trezor Model T is my favority hardware security device[^trezor-safe-5].

The Trezor Model T does not follow the OpenPGP standard and comes with its own [trezor-agent](https://github.com/romanz/trezor-agent).  

> Unlike other hardware tokens that implement the OpenPGP card standard directly (e.g., YubiKey or Nitrokey), Trezor uses a custom approach for GPG.
> This means you install the `trezor-agent` software to generate and manage GPG keys on the device, rather than using GPG's native OpenPGP card interface.

The process to set this up is as follows:
```bash
# Install the UV python package manager:
curl -LsSf https://astral.sh/uv/install.sh | sh
uv venv trezor-venv --python 3.12 --seed
source trezor-venv/bin/activate
python --version

# Install the trezor-agent directly from its GitHub repository
git clone https://github.com/romanz/trezor-agent
uv pip install -e trezor-agent
uv pip install -e trezor-agent/agents/trezor

export GNUPGHOME=~/.gnupg/trezor
```

You can, in principle, create an arbitrary number of hardware-backed PGP keys.
The following example is from the [official Trezor GPG documentation](https://trezor.io/learn/a/what-is-gpg):
```bash
trezor-gpg init "Trevor Wikey" -v --time=0
```

From that moment on, if you set `GNUPGHOME` correctly:
```bash
export GNUPGHOME=~/.gnupg/trezor
```
You can use the `gpg` command as you normally would, but it's backed by the Trezor keyring:
```bash
date | gpg --encrypt -r "trevor" | gpg --decrypt 2>/dev/null
echo 123 | gpg --sign | gpg --verify
```
<p></p>

> It can be inconvenient that you lose access to your usual GPG keyring once you set `GNUPGHOME=~/.gnupg/trezor`. At this point, your `gpg` command only accesses the Trezor-backed keyring.

If you remember the `seed` of your Trezor device (e.g., its BIP 39 Mnemonic word list) - a set of 12 or 24 unique words that acts as your account identifier - and use the same user identifier (the string in quotes, like "Trevor Wikey") plus the same `--time=` value (default 0), then you will deterministically regenerate the same PGP hardware key. This implies:
1. To back up your hardware PGP key, you need the BIP 39 Mnemonic `seed`, the user identifier, and the `--time=` value. (Leaving `--time=` empty defaults it to 0, which is acceptable.)
1. You can generate "infinitely" many hardware-backed PGP keys - one for each user identifier.


> BIP 39 is a standard that defines how to generate a mnemonic phrase from a random seed.
> It's widely used by cryptocurrency hardware wallets to ensure the wallet can be fully recovered using just the 12 or 24 words.
> In Trezor's GPG usage, this same phrase determines your PGP key material.

> During the `trezor-gpg init` process, you're asked on the Trezor's display to type a word.
> You can leave it empty if you wish, but if you do set a word, you'll need to remember it every time you use your key.
> Otherwise, the resulting key will differ, even with the same BIP 39 Mnemonic seed, user identifier, and `--time=` value.

I say "in principle" because the `trezor-agent` is not written to easily support multiple identities simultaneously.
Trezor's GPG support is currently geared toward creating one set of GPG keys (a master key plus subkeys) tied to your seed.

If you really want multiple independent GPG identities stored on the same Trezor device, you must run separate setups in different GPG home directories.
That usually means removing or renaming the `~/.gnupg/trezor` directory (or pointing `trezor-gpg` to a different directory via `GNUPGHOME`) each time you initialize another identity.

In the standard setup described above, you can forward the `trezor-agent` socket to the remote host in a similar way as with the OpenPGP card scenario.
The difference is that you'll forward the local socket at `~/.gnupg/trezor/S.gpg-agent`.

#### Dockerized Set-Up

I still wanted the flexibility to use this single Trezor for many PGP identities.
That's why I created a Dockerized setup (see this [Gist](https://gist.github.com/cs224/21f3c2d4768a2de7066a308a2ebf82ca)) that allows multiple Trezor PGP identities in parallel.
Because the "problem" lies in the single `~/.gnupg/trezor` directory, these Docker containers let you remap that directory to other locations.

Once you build the image:
```bash
make trezor-agent-image
```

You can use it as follows:
```bash
mkdir -p ./data && \
mkdir -p ./trezor_identity_a && \
docker run -it --rm --user $(id -u):$(id -g) --privileged -v /dev/bus/usb:/dev/bus/usb -v ./data:/app/data -v ./trezor_identity_a:/app/.gnupg -e INIT_USER="Trevor Wikey" trezor-agent-image
```

This command creates the Trezor PGP user identity for "Trevor Wikey" in the `./trezor_identity_a` directory.
You can run the same command for another identity, for example:
```bash
mkdir -p ./data && \
mkdir -p ./trezor_identity_a && \
docker run -it --rm --user $(id -u):$(id -g) --privileged -v /dev/bus/usb:/dev/bus/usb -v ./data:/app/data -v ./trezor_identity_b:/app/.gnupg -e INIT_USER="Alice Bob" trezor-agent-image
```
Now you have two independent identities.

To reuse one of these identities later:
```bash
docker run -it --rm --user $(id -u):$(id -g) --privileged -v /dev/bus/usb:/dev/bus/usb -v ./data:/app/data  -v ./trezor_identity_a:/app/.gnupg trezor-agent-image bash
```
This runs a container that uses the "Trevor Wikey" identity stored in the `./trezor_identity_a` directory.

Some basic usage examples (run inside the Docker container):
```bash
date | gpg --encrypt -r "trevor" | gpg --decrypt 2>/dev/null
echo 123 | gpg --sign | gpg --verify
echo "test secret" > ./data/test-secret.txt

gpg --encrypt -r "trevor" ./data/test-secret.txt
gpg --decrypt ./data/test-secret.txt.gpg

gpg --armor --sign ./data/test-secret.txt
gpg --verify ./data/test-secret.txt.asc
gpg --decrypt ./data/test-secret.txt.asc

gpg --detach-sign ./data/test-secret.txt
gpg --verify ./data/test-secret.txt.sig

gpg --clearsign ./data/test-secret.txt
gpg --verify ./data/test-secret.txt.asc
```

If you want to use any of these identities on a remote system, proceed as we did above by exporting the key:
```bash
gpg --armor --export "trevor" > ./data/public_key.asc
```
Then move `public_key.asc` to your remote system, import it, and set owner trust appropriately - just like in the OpenPGP card scenario.

Inside the Docker container, ensure the agent is running:
```bash
bash .gnupg/trezor/run-agent.sh
```
This command ensures the agent listens on the Unix socket at `./trezor_identity_a/trezor/S.gpg-agent`.

Next, in a second shell:
```bash
remote=root@host.example.com && \
remote_sock=$$( ssh "$$remote" "gpgconf --list-dirs" | sed -n 's/agent-socket://p' ) && \
echo $$remote_sock && \
ssh -o StreamLocalBindUnlink=yes -R $$remote_sock:./trezor_identity_a/trezor/S.gpg-agent $$remote
```

On the remote server, you can now use your Trezor-backed PGP key:
```bash
gpg --decrypt test-secret.txt.gpg > test-secret.1.txt
```

#### VENV Set-Up

If you prefer working with Python virtual environments instead of Docker containers, you can still use one Trezor device for multiple PGP identities.
I use the [UV](https://github.com/astral-sh/uv) Python package manager here, but feel free to use [conda](https://www.anaconda.com/docs/getting-started/miniconda/main), the built-in [venv](https://docs.python.org/3/library/venv.html), or any other tool for managing Python environments.  

First install the `uv` package manager
```bash
# Install the UV python package manager:
curl -LsSf https://astral.sh/uv/install.sh | sh
```
Then choose a location for your virtual environment.
Choose a convenient directory where you'd like to create the environment.
For example, `~/.local/venv` might be a possible choice.

Then create and activate the virtual environment.
```bash
cd ~/.local/venv
uv venv trezor-venv --python 3.12 --seed
source trezor-venv/bin/activate
python --version
```

Next, clone the trezor-agent repository from GitHub. You can do this in `~/.local/venv` or another directory of your choice. Then install the Python components:
```bash
# Install the trezor-agent directly from its GitHub repository
git clone https://github.com/romanz/trezor-agent
uv pip install -e trezor-agent
uv pip install -e trezor-agent/agents/trezor
```

I suggest that you add an alias to your `~/.bashrc` (or equivalent shell configuration file):
```bash
alias trezor-venv="source ~/.local/venv/trezor-venv/bin/activate && export GNUPGHOME=~/.gnupg/trezor_identity_a"
```

This alias both activates your new Python environment and sets the `GNUPGHOME` environment variable.
Using a separate `GNUPGHOME` ensures you keep Trezor-related GPG files isolated from your default GnuPG setup.

Then, whenever you need to work with your Trezor-based PGP identity, simply run:
```bash
trezor-venv
```

Once the environment is active, you can create a new Trezor-based GPG identity:
```bash
trezor-gpg init "Trevor Wikey" -v --time=0

gpg --list-keys
gpg --export-ownertrust > ownertrust.txt
# Adapt ownertrust.txt for your key (level 6 is ultimate)
gpg --import-ownertrust ownertrust.txt
```

Try out encryption, decryption, signing, and verification with your Trezor-based key:
```bash
date | gpg --encrypt -r "trevor" | gpg --decrypt 2>/dev/null
echo 123 | gpg --sign | gpg --verify
```

Everything else works the same way as with Docker containers. Your Unix socket that you will need to forward via SSH is located at `$GNUPGHOME/S.gpg-agent`.

You're now ready to use your Trezor-backed PGP key(s) on the remote server, ensuring your private key stays safely on your local device!

## Appendix

### PGP Key Expiry

Many people - including me - find PGP key expiration confusing. That’s why I've included this appendix:

In [OpenPGP Best Practices](https://riseup.net/en/security/message-security/openpgp/best-practices), we read:

> Use an expiration date less than two years:  
> People think that they don't want their keys to expire, but you actually do. Why?  
> Because you can always extend your expiration date, even after it has expired!  
> This "expiration" is actually more of a safety valve or "dead-man switch" that will automatically trigger at some point.  
> If you have access to the secret key material, you can untrigger it.  
> The point is to set up something to disable your key in case you lose access to it (and have no revocation certificate).  
> Setting an expiration date means that you will need to extend that expiration date sometime in the future.  
> That is a small task that you will need to remember to do (see next item about setting a reminder).

A useful way to think about key expiration is as an automatic safeguard.
Even if your key expires, you can still restore it by updating its validity period, provided you retain your private key.
For example, you can run:

```bash
gpg --edit-key <KEY_ID>
```
Then use the `expire` command to set a new expiration date, and finally `save` to confirm.

You can find more information in these references:
* [Extend GPG Key Expiration](https://tech.michaelaltfield.net/2010/09/25/extend-gpg-key-expiration/)
* [PGP Key Expiry is a Usability Nightmare](https://articles.59.ca/doku.php?id=pgpfan:expire)
* [A Demonstration of Message Burning Through Encryption using GnuPG](https://articles.59.ca/doku.php?id=pgpfan:gpgburn);

### Git as a Cryptographically Tamperproof File Archive Using Chained RFC3161 Timestamps

I've also covered this topic in my blog post, [RFC3161 Trusted Timestamping via OpenSSL by foot: a guided tour](../trusted_timestamping/#further-and-advanced-use-cases).
This appendix is here merely as a reminder.

Imagine you'd like to use a Git repository as a tamperproof file archive for business accounting.
You can leverage RFC3161 timestamps alongside Git's native functionality to strengthen trust in your commit history:

* [Git as Cryptographically Tamperproof File Archive using Chained RFC3161 Timestamps](https://www.linkedin.com/pulse/git-cryptographically-tamperproof-file-archive-using-chained/) ([github](https://github.com/MrMabulous/GitTrustedTimestamps))

RFC3161 timestamps act like a "proof-of-time" for your commits, making it evident if someone tries to rewrite history by altering timestamps.
This approach complements Git's built-in mechanisms for integrity checks.

In such a scenario, you may also want your Git repository encrypted on the remote host - even if you use a private repo. One way to achieve this is:

* [PGP-encrypted git remotes](https://github.com/spwhitton/git-remote-gcrypt)

## Footnotes

[^trezor-safe-5]: I haven't personally tested the [Trezor Safe 5](https://trezor.io/trezor-safe-5) yet, so I can't share first-hand insights on its performance or user experience.
