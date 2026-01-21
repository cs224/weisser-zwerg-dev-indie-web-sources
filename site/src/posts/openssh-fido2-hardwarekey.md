---
layout: "layouts/post-with-toc.njk"
title: "Step Up Your SSH Game: A Deep Dive into FIDO2 Hardware Keys and ProxyJump Configuration"
description: "How to configure OpenSSH to use a FIDO2 hardware key with ProxyJump."
seodescription: "Use FIDO2 security keys for OpenSSH: create resident ed25519-sk keys with YubiKey/Nitrokey/Trezor, configure ProxyJump with multiplexing, harden sshd, and run ssh-agent."
creationdate: 2023-05-18
keywords: OpenSSH, FIDO2, ProxyJump
date: 2023-05-18
tags: ['post']
draft: false
---



## Rationale

Recently, I stumbled upon an exciting discovery that I'm eager to share with you. Did you know that you can use any
[FIDO2](https://en.wikipedia.org/wiki/FIDO_Alliance#FIDO2) hardware key, like a [Yubikey](https://www.yubico.com/products/yubikey-5-overview/),
[Nitrokey](https://www.nitrokey.com/de), [Solokey](https://solokeys.com/), or [Trezor](https://trezor.io/learn/a/what-is-fido2), etc., as a hardware
OpenSSH key? This setup eliminates the need to store private keys on your devices, significantly reducing the attack surface. While there are other
ways to achieve this, such as [teleport](https://goteleport.com/) or similar, the FIDO2 setup is a drop-in replacement for your current keys and
requires no additional infrastructure.

## Create the OpenSSH key on the FIDO2 hardware key.

Creating an OpenSSH key on a FIDO2 hardware key is a straightforward process. In this post, I'll show you how to do it using a Nitrokey and the
`nitropy` command line interface.  I tested the procedure with a Yubikey, and it worked just as well. While the Yubico `ykman` CLI tool is picky and
only works with Yubikeys, the `nitropy` CLI tool is more flexible and works with other keys too.

To create the key, simply execute the following commands:

```bash
export IDENTITY="$HOME/.ssh/fido2-nitrokey.ed25519-sk"
ssh-keygen -t ed25519-sk -f ${IDENTITY} -O resident -O verify-required -O application=ssh:nitrokey
pipx install --suffix=-git git+https://github.com/Nitrokey/pynitrokey.git
nitropy-git fido2 list-credentials
```

When you create the OpenSSH key, it will ask you for a PIN (which may be referred to as a "password"). It will also ask you for a password to encrypt
the private key on disk.  However, I don't think this password is necessary since the PIN already protects the hardware key.  I therefore left it
empty. Note that the private key is not really a key, but rather a "pointer" to the hardware key. You can recreate the file from the hardware key if
you lose it (see below).

Here are the important options to keep in mind when using `ssh-keygen`:


* `-t ed25519-sk` or `-t ecdsa-sk`: the `-sk` makes sure that the security key is used
* `-f ${IDENTITY}`: this is where the private and public keys are written to. The file name given is the name of the private key. The public key is
  the same path with a `.pub` appended. As mentioned earlier, the private key is not really a key, but rather a "pointer" to the hardware key.
* `-O resident`: use this flag to write the key into a discoverable slot of the hardware key. Check out [this
  link](https://www.ajfriesen.com/yubikey-ssh-key) to learn more about the difference between discoverable and non-discoverable credentials.
* `-O verify-required`: this flag requires you to unlock the key via a PIN when you try to use it.
* `-O no-touch-required`: you can pass this flag to `ssh-keygen` to tell it not to require touching the device every time. However, I was not able to make this work with either the Nitrokey or the Yubikey.
* `-O application=ssh:YourTextHere`: this flag is optional, but it may make it easier to identify the hardware key, especially if you have several hardware keys.



If you take the hardware key to another machine, you can use the following command to create the private key file in the current directory:

```bash
ssh-keygen -K
```

You would then have to move it in your `~/.ssh/` directory.

Now that you have created the key, you can copy the public key to your target machine where you want to ssh to. For example, I used my [Odroid M1](../odroid-m1) for this test:

```bash
ssh-copy-id -i ${IDENTITY}.pub odroid@odroid
```

You should now be able to test that your key setup works by:
```bash
ssh -v -o "IdentitiesOnly=yes" -i ${IDENTITY} odroid@odroid
```

If you followed the steps outlined above, you will first have to enter the PIN and then touch the key to prove your presence.

## Configure ProxyJump

To make the following work, you need two machines and ensure that the public key is also present on the second machine. I use my `x99` machine for this purpose.

```bash
ssh-copy-id -i ${IDENTITY}.pub cs@x99
```

To set up the connection to the first hop, add the configuration below to `~/.ssh/config`:

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
```

Next, use the first hop to make the connection to the second hop by adding the following configuration:

```
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

You should now be able to `ProxyJump` directly to the second hop machine:
```bash
ssh cttest2nitro
```

This will require you to enter the pin followed by touching the key twice, because you effectivly SSH into two machines in sequence.

While the following part is not strictly necessary:

```
  ControlMaster        auto
  ControlPath          ~/.ssh/odroid.nitro.sock
  ControlPersist       60s
  ServerAliveInterval  0
```

it saves you from entering the pin and touching the hardware key for every SSH command you issue.  The above section, turns on SSH connection
multiplexing, and the connection stays alive for at least 60 seconds.  This feature is especially useful when you run a script that issues several SSH
commands in sequence.

If you do not want to wait for the timeout, then you can execute `ssh -O exit cttest1nitro` to close the multiplexed open SSH connection and its
associated socket.


## Configure sshd on the Target Machine

To make your target machine more secure, you should turn off password authentication and require the entry of the pin of keys. To do that, you would add the following to your `/etc/ssh/sshd_config` on the target machine:

```
PasswordAuthentication no
ChallengeResponseAuthentication no

PubkeyAuthOptions verify-required
```

Finally, you would issue a restart of the sshd daemon.

```bash
systemctl restart ssh
```

## SSH Agent


You do not need to use the ssh agent, but if you do want to use it, you can do that by:
```bash
killall ssh-agent
eval $(ssh-agent)
ssh-add -K
ssh-add -L
```

In principle, it should not be necessary to kill the agent first, but for whatever reason, without killing the agent first, I sometimes had trouble adding the key to the agent, and it exited with an error.

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

## Additonal Remarks:

In my experience, the [Trezor](https://trezor.io) stands out as the best FIDO2 device. It offers two key features that make it my preferred choice:

* Firstly, you can create a backup of your keys. This is a crucial advantage because it eliminates the need for a second hardware key to access your
  target machines in case you lose your main hardware key. With a backup stored in a secure location, you can rest assured that you will be able to
  restore the keys.
* Secondly, the Trezor has a touchscreen that allows you to enter your PIN directly on the device. This is a significant security advantage over other
  hardware keys that require you to type your PIN on the machine where you use the key. This could potentially compromise your security if someone
  installed a keylogger or similar software.

While some FIDO2 hardware key manufacturers tout the fact that their keys cannot be backed up (are not copyable) as an advantage, I personally find it
to be a disadvantage. The need for double key management is eliminated with the ability to create a backup.

In theory, mobile devices that support platform-created FIDO2 passkeys that are copyable could be another good option for SSH keys. However, without
additional hardware like the [IDmelon Reader](https://hmaslowski.com/ios-%26-ipados/f/use-your-mobile-phone-as-fido2-security-key-for-passwordless),
this is not currently possible out of the box. I've posed the question, [Can I use an iPhone connected via USB to a computer as a FIDO2 security key
(for example in OpenSSH)?](https://superuser.com/questions/1784703/can-i-use-an-iphone-connected-via-usb-to-a-computer-as-a-fido2-security-key-for) to
see if anyone has found a workaround.

## Conclusion

In conclusion, using FIDO2 hardware keys as OpenSSH keys is an excellent way to enhance your security. Additionally, it doesn't require any additional
infrastructure, making it an easy and cost-effective solution. So, if you're looking for a way to enhance your security, consider using FIDO2 hardware
keys as OpenSSH keys.

