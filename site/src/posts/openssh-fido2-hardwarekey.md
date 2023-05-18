---
layout: "layouts/post-with-toc.njk"
title: "OpenSSH ProxyJump with FIDO2 hardware keys"
description: "How to configure OpenSSH to use a FIDO2 hardware key with ProxyJump."
creationdate: 2023-05-18
keywords: OpenSSH, FIDO2, ProxyJump
date: 2023-05-18
tags: ['post']
draft: false
---

## Rational

Recently, I discovered, that you can use any [FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) hardware key (e.g. a
[Yubikey](https://www.yubico.com/products/yubikey-5-overview/), a [Nitrokey](https://www.nitrokey.com/de), a [Solokey](https://solokeys.com/), a
[Trezor](https://trezor.io/learn/a/what-is-fido2), ...) as a hardware OpenSSH key. This set-up will avoid having private keys stored on your devices
and thus reducing the attack surface considerably. There are other ways on how to achieve that like [teleport](https://goteleport.com/) or similar,
but the FIDO2 set-up does not need any additional infrastructure and is a drop-in replacement for your current keys.

## Create the OpenSSH key on the FIDO2 hardware key

Below, I will show how to create the OpenSSH key on the FIDO2 hardware key using a nitrokey and the `nitropy` command line interface. I tested the
procedure also with a Yubikey and it worked exactly the same. The Yubico `ykman` CLI tool refused to work with other keys. The `nitropy` CLI tool is
not so picky and works also with the Yubikey.

To create the key execute the following:

```bash
export IDENTITY="$HOME/.ssh/fido2-nitrokey.ed25519-sk"
ssh-keygen -t ed25519-sk -f ${IDENTITY} -O resident -O verify-required -O application=ssh:nitrokey
pipx install --suffix=-git git+https://github.com/Nitrokey/pynitrokey.git
nitropy-git fido2 list-credentials
```

When the OpenSSH key is created it asks you for the PIN (it may say "password", but it means PIN). Then it asks you for a password to be used to
encrypt the private key on disk. I don't think this password is necessary, as the pin already protects the hardware key. I left it empty. The private
key is not really a key. It is only a "pointer" to the hardware key, e.g. it does not matter if you lose it and you can recreate the file from the
hardware key (see below).

The important options to  `ssh-keygen` are:
* `-t ed25519-sk` or `-t ecdsa-sk`: the `-sk` makes sure that the security key is used
* `-f ${IDENTITY}` is where the private and public keys are written to. The file name given is the name of the private key. The public key is the same
  path with a `.pub` appended. The private key is not really a key. It is only a "pointer" to the hardware key, e.g. it does not matter if you lose
  it.
* `-O resident`: the key is written into a discoverable slot of the hardware key. Have a look [here](https://www.ajfriesen.com/yubikey-ssh-key) for
  the difference between discoverable and non-discoverable credentials.
* `-O verify-required`: this requires that you unlock the key via a pin when you try to use it.
* `-O no-touch-required`: I read that you can pass the `-O no-touch-required` option to ssh-keygen to tell it that you don’t want it to require
  touching the device every time, but I was not able to make this work neither with the Nitrokey nor with the Yubikey.
* `-O application=ssh:YourTextHere`: this option is compeltely optional and may make it easier to identify the key, especially if you have several
  keys.

If you take the hardware key to another machine you can use
```bash
ssh-keygen -K
```
to create the private key file in the current directory. You would then
have to put it in your `~/.ssh/` directory.

Now you can copy the public key to your target machine where you want to `ssh` to. I use my [Odroid M1](../odroid-m1) for this test:

```bash
ssh-copy-id -i ${IDENTITY}.pub odroid@odroid
```

You should now be able to test that your key set-up works by:
```bash
ssh -v -o "IdentitiesOnly=yes" -i ${IDENTITY} odroid@odroid
```

If you created the key like I showed above you will first have to enter the PIN and then to touch the key to prove your presence.

## Configure ProxyJump

In order to make the below work you have to have 2 machines and make sure that the public key is also present on the second machine. I use my `x99`
machine for that:

```bash
ssh-copy-id -i ${IDENTITY}.pub cs@x99
```

Below you can see the configuration that I put into `~/.ssh/config`:

```
Host cttest1nitro
  # ForwardAgent true
  IdentitiesOnly       yes
  HostName             odroid
  User                 odroid
  IdentityFile         ~/.ssh/fido2-nitrokey.ed25519-sk
  Port                 22
  ControlMaster        auto
  ControlPath          ~/.ssh/odroid.nitro.sock
  ControlPersist       60s
  ServerAliveInterval  0

Host cttest2nitro
  HostName             x99
  User                 cs
  IdentityFile         ~/.ssh/fido2-nitrokey.ed25519-sk
  Port                 22
  ControlMaster        auto
  ControlPath          ~/.ssh/x99.nitro.sock
  ControlPersist       60s
  ServerAliveInterval  0

  ## sample for ProxyJump
  ProxyJump cttest1nitro
```

The `cttest1nitro` entry sets up the connection to the first hop. The `cttest2nitro` then uses this first hop to make the second hop. The part

```
  ControlMaster        auto
  ControlPath          ~/.ssh/odroid.nitro.sock
  ControlPersist       60s
  ServerAliveInterval  0
```

is not strictly necessary, but without it you will have to type the pin and touch the hardware key for every SSH command you issue. With these
additional configurations you turn on ssh connection multiplexing and the connection stays alive for at least 60 seconds. This may be especially
useful when you run a script that issues several ssh commands in sequence.

## Configure sshd on the Target Machine

To make your target machine more secure you should turn off password authentication and require the entry of the pin of keys. To do that you would add the following to your `/etc/ssh/sshd_conf` on the target machine:
```
PasswordAuthentication no
ChallengeResponseAuthentication no

PubkeyAuthOptions verify-required
```

Finally you would issue a restart of the sshd daemon: 
```bash
systemctl restart ssh
```

## References

* [FIDO2, WebAuthn, Passkeys in 2022 und 2023](https://www.nitrokey.com/de/blog/2022/fido2-webauthn-passkeys-2022-und-2023)
* [Heise: Tipps zur Optimierung Ihres SSH Workflows](https://www.heise.de/ratgeber/Tipps-zur-Optimierung-Ihres-SSH-Workflows-7272695.html?seite=all)
* [OpenSSH/Cookbook/Public Key Authentication](https://en.wikibooks.org/wiki/OpenSSH/Cookbook/Public_Key_Authentication)
* [How to use FIDO2 USB authenticators with SSH](https://www.stavros.io/posts/u2f-fido2-with-ssh)
* [SSH Tips and Tricks](https://carlosbecker.com/posts/ssh-tips-and-tricks/)
* [Trezor](https://trezor.io/learn/a/what-is-fido2) : `trezorctl fido credentials list`
    * [SSH with Trezor](https://trezor.io/learn/a/ssh-with-trezor)
* [YubiKey Manager (ykman)](https://docs.yubico.com/software/yubikey/tools/ykman/FIDO_Commands.html) : `ykman fido credentials list`
    * [Securing SSH with FIDO2](https://developers.yubico.com/SSH/Securing_SSH_with_FIDO2.html)
    * [asswordless SSH login with YubiKey and FIDO2](https://www.ajfriesen.com/yubikey-ssh-key)
* [NK3, nitropy, FIDO2, SSH resident keys?](https://support.nitrokey.com/t/fixed-nk3-nitropy-fido2-ssh-resident-keys/5061) : `nitropy-git fido2 list-credentials`

