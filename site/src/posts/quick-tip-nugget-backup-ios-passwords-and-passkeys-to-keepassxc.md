---
layout: "layouts/post-with-toc.njk"
title: "Quick Tip: Export Passwords and Passkeys from iPhone (iOS 26, 2025) to KeePassXC (kdbx)"
description: "I love passkeys and I also want to own my data and credentials. With iOS 26 this is finally possible."
keywords: iOS 26, iCloud Keychain, passwords, passkeys, export, KeePassXC, kdbx, iPhone, password manager, bitwarden
creationdate: 2025-12-02
date: 2025-12-02
tags: ['post']
---

## Rationale

I am a big fan of passkeys and at the same time I want to own my own data and credentials.
With iOS 26 this is now finally possible.

> Passkeys are modern login credentials based on public key cryptography.
> They replace classic passwords with a key pair that is stored securely on your device and protected by biometrics such as Face ID or Touch ID.
> iCloud Keychain is Apple's built in password and credential storage that syncs across your Apple devices.

Until recently you could back up your passwords from iCloud Keychain, but not your passkeys.
This meant that part of your digital identity stayed locked inside the Apple ecosystem.
I love passkeys and use them a lot for day to day authentication of accounts that are important, but not *super* important.

> For *super* important accounts I use [Trezor and FIDO2](../digital-civil-rights-nextcloud-i/#password-manager-(2fa%2C-totp%2C-fido2%2C-passkeys%2C-webauthn)).


Since iOS 26, the iOS **Passwords** app supports **Export Data to Another App**.
This finally includes both passwords *and* passkeys, so you can move everything into tools like KeePassXC and keep full control in a standard `kdbx` database.

> KeePassXC is a local, open source password manager that stores all your secrets in a single `kdbx` file.
> This file can be backed up, synced with your own infrastructure, and inspected with different compatible tools.
> By exporting from iOS into a `kdbx` database, you keep the convenience of passkeys but also gain long term ownership of your credentials.

## Step 1: Export from iOS Passwords app to Bitwarden

Sadly we cannot export passkeys (and passwords together) directly from iCloud Keychain to KeePassXC.
Instead we use [Bitwarden](https://bitwarden.com/) as an intermediate step and from there go to KeePassXC and a standard `kdbx` database.
This sounds a bit indirect, but in practice it is only a few extra clicks.

> At the time of writing, iOS 26 can export passkeys only to other password managers and not to a file format that KeePassXC can import directly.
> Bitwarden can import from iOS and later export in a format that KeePassXC understands, so it fits nicely as a temporary bridge in the middle.

This means you first create a free Bitwarden account and install the Bitwarden app on your iPhone.

> **REMEMBER** your Bitwarden master password. You cannot recover it if you lose it.  
> The master password must have at least 12 characters.  
> Also remember that there is an [EU](https://vault.bitwarden.eu/#/login) and a [US](https://vault.bitwarden.com/#/login) Bitwarden server.  
> If you created your account on the EU server, you cannot log in on the US server and the other way round.

> Bitwarden stores your encrypted vault on its servers, but the encryption keys are derived from your master password and never leave your devices.
> The choice between the EU and US server is mostly about data location and legal jurisdiction.
> For this workflow it does not matter which one you choose, as long as you stay consistent and always log in to the same region.

On your iPhone, open the standard iOS **Passwords** app.
Tap the three dots in the top right corner of the screen and select "Export Data to Another App".
In the next steps select all credentials that you want to export (you can simply choose "Select All") and then choose Bitwarden as the target app.

> If you repeat this process in the future, you should delete all credentials in Bitwarden first, because otherwise you will end up with many duplicates.
> I suggest that you use the Bitwarden web vault for this, because it is more convenient for management tasks such as deleting entries in bulk or later exporting the whole vault.

When iOS exports to Bitwarden, the transfer goes through the Bitwarden app on your iPhone, which is already logged in to your account.
iOS will ask you to confirm the export and may require Face ID, Touch ID, or your device passcode.
After that, Bitwarden receives the items and syncs them into your online vault.

## Step 2: Export from Bitwarden as `.json (Encrypted)` with "Password protected"

In Bitwarden, open the web interface, go to "Tools" and then "Export vault".
Choose the `.json (Encrypted)` format and select the "Password protected" option.

You now need to enter a separate password for this export file.

> Bitwarden supports different export formats.
> The plain `.json` export is not encrypted, which means anyone who gets the file can read all your entries.
> The `.json (Encrypted)` option wraps the same data in an additional layer of encryption that is independent of your Bitwarden master password.
> This makes it much safer to store temporarily on disk while you move it over to KeePassXC.

## Step 3: Import into KeePassXC (2.7.7 or newer)

Finally, open [KeePassXC](https://keepassxc.org/) and choose "Database" and then "Import...".
In the import dialog select "Bitwarden (.json)" as the file format.
Then select the encrypted export file from Bitwarden and follow the steps of the import wizard.

KeePassXC will ask for the password you used to protect the Bitwarden export file.
After decryption and import, it will place all entries into your KeePassXC database.

In the end you will have a local `kdbx` database that contains your credentials and can be stored, backed up, and synced in any way you like.

> You can import into an existing KeePassXC database or create a new one just for this migration.
> After the import, you can reorganize groups, clean up old entries, and tune custom fields at your own speed.
> Once you are happy with the result, you no longer depend on Bitwarden for this data and can remove the Bitwarden export file and even the Bitwarden account if you only needed it as a temporary bridge.

## Conclusion

By following this guide you have exported your passwords and passkeys from the iOS Passwords app / iCloud Keychain into a local KeePassXC `kdbx` database, so you can keep full control over your credentials.

## Appendix

### Using your iPhone as your main passkey device

Passkeys do not have to live only on the device you are currently using.
A very practical pattern is to keep your passkeys on your iPhone, and then use them from any browser on a nearby computer.
This is based on the **FIDO cross device authentication** idea, where a QR code on the computer links to the passkey on your phone.

#### Registering a new passkey from a browser, onto your iPhone

Imagine you sit at a computer that is not yours, open a site in the browser, and want the passkey to end up on your iPhone instead of on that computer.

The flow is usually like this:

1. On the computer, visit the website and sign up or go to the security settings of your existing account.
2. When the site offers to create a passkey, do not accept the default option that stores it on the computer.
3. Instead, pick something like "Other options", "Use a different device", or "Save passkey on another device with a camera".
4. The browser then shows a QR code on the screen.
5. Take your iPhone, open the Camera app, and point it at the QR code.
6. Your iPhone shows a sheet asking if you want to create a passkey for this site and where to store it. Confirm, then unlock with Face ID, Touch ID, or your device code.
7. The passkey is now stored in your iPhone and synced into iCloud Keychain, not on the computer you used to register.

> Behind the scenes, the QR code contains a one time link that connects the browser session on the computer with the passkey creation flow on your iPhone.
> After you scan it, both devices talk over an encrypted channel and finish the WebAuthn ceremony.
> The server only ever sees the new public key and some metadata.
> The private key never leaves your iPhone.

#### Using an existing iPhone passkey to log in from another device

Later, when you want to log in from any computer, the pattern is very similar.

1. On the computer, open the website in your browser and go to the login page.
2. Enter your username or email if needed, then choose "Sign in with a passkey" or a similar button.
3. When the browser asks where the passkey lives, choose an option like "Use passkey from a phone", "Use another device", or "Use passkey from device with a camera".
4. A QR code appears on the computer screen.
5. Scan that QR code with your iPhone camera.
6. Your iPhone shows the passkey prompt, you confirm with Face ID, Touch ID, or your device code, and the login on the computer finishes automatically.

The nice thing is that the computer never gets a reusable secret.
It only gets a signed challenge that proves your iPhone holds the right private key.

#### Why Bluetooth is needed to prove proximity

When you use this QR code flow, the devices do not trust each other just because they saw the same QR code.
To prevent someone from taking a photo of the QR code from far away, there is usually a second check using local wireless communication.

In practice, the computer and your iPhone use Bluetooth Low Energy to prove that they are close to each other in the physical world.

Roughly, the flow is:

1. You scan the QR code to connect the two sessions.
2. The computer and your iPhone then exchange a few messages over Bluetooth.
3. If that Bluetooth handshake succeeds, the browser accepts the passkey signature as valid.

If Bluetooth is disabled, blocked by a VPN profile, or broken, the login can fail even if the QR code scan worked, because the proximity check cannot complete.

#### Centralizing passkeys on iPhone versus local passkeys on Windows

Some platforms, like recent versions of Windows, support local passkeys that are stored only on that specific device and protected with Windows Hello.
These passkeys usually do not sync to other devices.
They exist only on that one computer.

> This used to be broadly true, but it's no longer accurate in 2025: Microsoft's own docs describe synced passkeys that roam across devices via a Microsoft account, alongside device‑bound passkeys. 

Keeping all your passkeys on your iPhone works differently:

* The iPhone stores the passkeys inside iCloud Keychain and syncs them across your Apple devices that use the same Apple ID.
* When you sit at a Windows, Linux, or shared machine, you can still use those passkeys by scanning a QR code and confirming on the iPhone, as described above.

This has a few practical advantages:

* You have one place where all passkeys live, instead of a little island of credentials on every computer.
* You can manage, review, and now export them from the iOS Passwords app in a controlled way, for example into KeePassXC or another password manager.
* When you retire or sell a computer, you do not have to worry about passkeys staying behind on that machine, because they were never stored there in the first place.
* Your day to day login experience is still convenient: open the site on any computer, scan the QR code with your iPhone, confirm with Face ID, and you are in.

> This "phone as primary authenticator" approach matches how the FIDO Alliance describes [cross device authentication](https://www.corbado.com/glossary/cda).
> The phone is your strong authenticator with a secure element and biometrics, and all other devices simply act as terminals that ask the phone to sign in on their behalf.

You can then combine this model with your KeePassXC export.
Your iPhone becomes both the live passkey device and the central place where you periodically export and back up passwords and passkeys into a portable `kdbx` file that you fully control.

### Bitwarden passkeys on GrapheneOS

You can use [Passkeys on GrapheneOS](https://oranki.net/posts/2024-07-10-passkeys-on-grapheneos/) by using [Bitwarden](https://bitwarden.com/) as your passkey provider.

On recent GrapheneOS versions (Android 14 and newer) you can:

* Install **Bitwarden** (current Android app, preferably from the Play Store so you get the build with passkey support).
* Enable **Bitwarden as the passkey and password provider** in the system settings.
* Use **Vanadium** (the GrapheneOS browser) with the option to "use other providers", so that Vanadium talks to Bitwarden for passkeys.

With this setup, passkeys stored in Bitwarden can be used on supported sites such as GitHub, Proton or passkey.org from Vanadium, and also from apps that use the Android passkey and credential API.
Multiple users have reported that this configuration works reliably once it is set up correctly.

**Important limitation:**
According to Bitwarden's documentation, passkeys on Android require **Android 14 and Google Play Services**. That means:

> On GrapheneOS you need **sandboxed Google Play Services installed** for Bitwarden passkeys to work.

The good news is that on GrapheneOS, Play Services are **fully sandboxed**.
They do not need network access or a Google account for the passkey functionality to work, so you can keep them as minimal as possible while still using passkeys.

#### KeePassDX - offline, file based passkeys

[KeePassDX on Android now supports passkeys](https://discuss.privacyguides.net/t/keepassdx-on-android-now-supports-passkeys/32198).

* As of **KeePassDX 4.2.0 (Oct 2025)** it has passkey support via the Android credential provider API.
* The Android 15 credential manager integration in GrapheneOS and Vanadium is exactly what these providers plug into.
* There are bug reports and user reports from people **using KeePassDX passkeys on GrapheneOS (Android 16, Pixel 9 Pro)**, for example with Discord, which shows that it works on device even if cross platform support is still a bit rough.

So KeePassDX is now:

* **Offline and file based**, using a `kdbx` file that you can [sync however you like](../digital-civil-rights-nextcloud-i/#password-manager-keepassxc-sync), for example with Syncthing or USB.
* A **passkey provider** that can in principle be used by Vanadium and other apps via the Android credential manager, **without Google Play Services**, using the same mechanism that Bitwarden and Proton rely on.

### Export Google Authenticator 2FA codes

Google Authenticator has a "Transfer accounts" feature that generates one or more QR codes containing the accounts you select.
In current versions you can choose a single account or several accounts to export at once, and the app expects you to scan those codes on a second device running Google Authenticator.

For this guide, we use the same feature, but instead of scanning the QR code with another phone, we capture it and decode it on a Linux machine so that we can move the secrets into tools like KeePassXC.

If you take pictures of these transfer QR codes with a second camera (for example a GrapheneOS device) and send the images to your Linux box, you can work with the QR codes locally.
A convenient way to transfer the images is a tool such as [LocalSend](https://localsend.org/), but any secure offline or end to end encrypted channel is fine.

On Linux you can use a standard QR decoder such as `zbarimg` to extract the raw payload.
This payload is in a proprietary format used by Google, so you also need a small parser or script to turn it into real TOTP secrets that you can import elsewhere.

> The QR code does not directly contain one TOTP secret.
> Instead it encodes an `otpauth-migration://` link with a large `data=` parameter.
> That parameter is a Base64 encoded protocol buffer message which may hold several separate TOTP entries at once.
> The parser's job is to unpack this structure and convert each entry back into normal `otpauth://` URIs or plain TOTP parameters.

#### 1. Getting the raw QR code data

On Linux, you can use a command line tool like `zbarimg` (part of the [zbar](http://zbar.sourceforge.net/) suite):

```bash
sudo apt-get install zbar-tools
zbarimg path/to/google-authenticator-qr.png
```

This should print something similar to:
```text
QR-Code: otpauth-migration://offline?data=LONG_BASE64_STRING
```

If this works, you already have the important part. You can now copy the full `otpauth-migration://...` URL into a text file for later processing.

> If you see something like `QR-Code: XXXXX` but it does not start with `otpauth-migration://`, it might just be another way the tool prints the raw data.
> Copy whatever it prints so that you can feed it into your decoder script.

If you captured multiple QR codes because Google Authenticator split your export into several screens, run `zbarimg` on each image.
Each QR code will usually hold a subset of your accounts, so you will get one `otpauth-migration://...` line per image.

#### 2. Decoding the proprietary format

Google's "Transfer accounts" feature packs several TOTP secrets into a protocol buffer data structure and wraps it inside the `otpauth-migration://` URI.
Simply scanning the code with a normal QR app will not show you readable TOTP secrets.

To decode it you need two steps:

1. Save the `data` parameter. That means everything after `data=` in the printed URI. This value is a Base64 encoded protocol buffer blob.
2. Run a decoder that understands Google's "otpauth migration" format and turns that blob into standard TOTP entries.

People have published small scripts and tools that do this, for example:
[https://github.com/digitalduke/otpauth-migration-decoder](https://github.com/digitalduke/otpauth-migration-decoder)

I strongly suggest that you review the code of such tools before you trust them with your 2FA credentials.
For easier review I copied the essential code into a single file so that you can read through it and check that there is no malicious logic in it:
[otpauth migration decoder: Convert Google Authenticator data to plain otpauth links](https://gist.github.com/cs224/8082b7d0c854310c147d0f90d0d25001).

> These tools may or may not still work with future versions of Google Authenticator.
> Google can change the format at any time.
> If something breaks, check the README or issue tracker of the project for compatibility notes or updated forks.

Most decoders output one `otpauth://` link per account.
These links are compatible with many authenticator apps and password managers.
Even if your target application does not support direct import from `otpauth://` URLs, you can still manually copy the important fields (issuer, account name, secret, digits and period).

#### 3. After decoding

Once the migration data is decoded, you usually get for each account:

* Issuer or account name, for example `GitHub (myusername)`
* Secret, which is the Base32 encoded TOTP key
* Number of digits, normally 6 or sometimes 8
* Algorithm, almost always SHA1 in the case of Google Authenticator
* Type, time based TOTP or counter based HOTP, usually time based

With this information you can manually reimport the tokens into another TOTP capable application such as KeePassXC.

> In KeePassXC you typically create or edit an entry and then enable the TOTP field.
> You paste the Base32 secret and select the correct number of digits and period.
> After saving the entry you should see a moving TOTP code that matches the one in Google Authenticator.
> It is a good idea to verify at least once by logging into the corresponding service before you delete anything from the old device.

#### 4. Security considerations

* Treat the exported secrets as highly sensitive. Anyone who learns your TOTP secret keys can generate valid 2FA codes as if they were you.
* Prefer to do the capture and decoding on devices that are offline or at least not used for everyday browsing.
* Store any backups in encrypted form, for example inside an encrypted password manager database or on an encrypted drive.
* Clean up temporary files such as raw QR images, text files with `otpauth-migration://` links or script outputs once you have imported everything into your new authenticator or KeePassXC.

> A simple but effective pattern is to perform the whole extraction in a temporary virtual machine.
> After you have imported the secrets into KeePassXC and verified that everything works, you can securely wipe that environment.
> This reduces the risk that stray backup files remain on disk for years.
