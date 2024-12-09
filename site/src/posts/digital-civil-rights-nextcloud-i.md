---
layout: "layouts/post-with-toc.njk"
title: "Digital Civil Rights and Privacy: Browser, Passwords, Bookmarks, Notes, Nextcloud"
description: "Reclaiming your digital identity by building a personal privacy ecosystem via a private cloud (part I)"
creationdate: 2024-12-09
keywords: digital civil rights, digital privacy, online freedom, self-hosted cloud, secure browsing, password management, cross-device sync, bookmarks, passwords, notes, Nextcloud, LibreWolf, Brave, Mullvad, KeePassXC, Floccus, GrapheneOS
date: 2024-12-09
tags: ['post']
---

## Rationale

In an era of increasing digital surveillance and data monetization, taking control of your online presence is more crucial than ever.
This guide empowers you to build a personal privacy infrastructure that puts you back in charge of your digital life.
We'll walk through a step-by-step process to create a secure ecosystem across your devices using cutting-edge open-source tools.
Our journey will help you to:

1. Implement a privacy-first browsing experience across all your devices on as many desktop computers and [GrapheneOS](https://grapheneos.org) mobile devices you wish to operate.
    1. Setup privacy-respecting browsers.
    1. Establish a robust, centralized, encrypted password management system via a shared and synced password manager.
    1. Synchronize bookmarks and notes securely and privately.
1. Set up a personal cloud solution that respects your digital autonomy.

This is more than just a technical setup — it's about reclaiming your digital civil rights and laying the foundation for genuine online freedom.
By the end of this guide, you'll have a scalable, privacy-focused digital infrastructure based on [Nextcloud](https://github.com/nextcloud/server) that can grow with your needs.
It will serve us well for further steps on our journey towards digital sovereignty.

In future posts, we'll expand this setup to include -- among other things -- a private calendar and contact management across your devices.

## Browser Recommendations: Tor-Browser, Mullvad-Browser, LibreWolf, Brave

I recommend using two different browsers for your online activities:

1. [Tor-Browser](https://www.kuketz-blog.de/librewolf-und-tor-browser-sichere-und-datenschutzfreundliche-browser-teil-3) or [Mullvad-Browser](https://www.kuketz-blog.de/mullvad-browser-sichere-und-datenschutzfreundliche-browser-teil-4) - These are great options when you want to browse the web anonymously without logging in. They provide a secure and private browsing experience, perfect for general surfing.
1. [LibreWolf](https://www.kuketz-blog.de/librewolf-und-tor-browser-sichere-und-datenschutzfreundliche-browser-teil-3) or [Brave](https://www.kuketz-blog.de/brave-und-firefox-sichere-und-datenschutzfreundliche-browser-teil-2) - If you need to log in as a recognized user, these browsers offer a more personalized experience while still maintaining high security standards. 

For [GrapheneOS](https://grapheneos.org) mobile users, the built-in [Vanadium](https://www.kuketz-blog.de/vanadium-sichere-und-datenschutzfreundliche-android-browser-teil-6/) browser is your best bet for safe and secure browsing on the go.

> In case you have trouble with LibreWolf on KDE/Plasma KUbuntu 24.04 LTS (Noble Numbat) go to my [notes at the bottom of this page](#librewolf-on-kde%2Fplasma-kubuntu-24.04-lts-(noble-numbat)).

### Enhancing Your Browsing Experience with Custom Search Engines

I recommend configuring your browser's integrated search engine to either
* [Brave Search](https://search.brave.com) or
* [Presearch](https://presearch.com/)

If you are using a Firefox based browser and wish to add Brave Search (or any other non-default search engine), follow these simple steps:

1. Open the search site's home page
1. Right-click on the address bar at the top of your screen.
1. From the dropdown menu that appears, click Add "Brave Search" at the bottom[^opensearchxml]. 
1. Once you have added the search engine, navigate to `Settings > Search` and select your newly added "Brave".

## Password Manager (2FA, TOTP, FIDO2, passkeys, WebAuthn)

Once you have chosen your browser(s), the next step is to integrate a shared and synced password manager across all your devices.

Choosing the right password manager is crucial for a secure and seamless experience.
I recommend using [KeePassXC](https://github.com/keepassxreboot/keepassxc) on your workstation computer and [KeePassDX](https://github.com/Kunzisoft/KeePassDX) on your [GrapheneOS](https://grapheneos.org) mobile device.
These are both open-source options that interoperate, making it easy to manage your passwords across multiple platforms.

I've taken inspiration from the YouTube video [Complete Guide: KeePassXC | Free, Open-Source, Android Sync | Self-hosted password manager](https://www.youtube.com/watch?v=jL7gfM27EUA).
Watching this guide can be very helpful as it shows you a system in full operation.
The creator of that video uses [Syncthing](https://github.com/syncthing/syncthing) for file synchronization purposes.
I suggest using [Nextcloud](https://github.com/nextcloud/server).
Unlike Syncthing, Nextcloud offers additional features such as [Bookmarks](https://github.com/nextcloud/bookmarks), [Notes](https://github.com/nextcloud/notes), [Contacts](https://github.com/nextcloud/contacts), [Calendar](https://github.com/nextcloud/calendar/), [Photos](https://help.nextcloud.com/t/howto-replace-google-photos-on-android-with-nextcloud-memories-all-inkl-com/179077), and more - all of which can be beneficial in managing your digital life effectively.

If you encounter any issues, the [KeePassXC: Getting Started Guide](https://keepassxc.org/docs/KeePassXC_GettingStarted) and the [KeePassXC: User Guide](https://keepassxc.org/docs/KeePassXC_UserGuide) are here to help.
These resources provide comprehensive information on how to use KeePassXC effectively.

KeePassXC not only helps manage your passwords but also assists with two-factor authentication (2FA, [TOTP](https://keepassxc.org/docs/KeePassXC_GettingStarted#_adding_totp_to_an_entry) secrets) and [Passkeys](https://keepassxc.org/docs/KeePassXC_UserGuide#_passkeys) ([FIDO2](https://de.wikipedia.org/wiki/FIDO2), [WebAuthn](https://de.wikipedia.org/wiki/WebAuthn)). 

In the KeePassXC [FAQ](https://keepassxc.org/docs/#faq-security-totp), you'll find a question: "*KeePassXC allows me to store my TOTP secrets. Doesn't this undermine any advantage of two-factor authentication?*"

They answer with:

> Yes. But only if you store them in the same database as your password. We believe that storing both together can still be more secure than not using 2FA at all, but to maximize the security gain from using 2FA, you should always store TOTP secrets in a separate database, secured with a different password, possibly even on a different computer.

And in another place of their documentation they write:

> Storing TOTP codes in the same database as the password will eliminate the advantages of two-factor authentication. If you desire maximum security, we recommend keeping TOTP codes in a separate database that you only unlock when needed.

When it comes to managing passwords and authentication secrets, I've decided to take full ownership of my data. Here's how I approach it:

1. I want to **own** my secrets without relying on third-party services like iOS Keychain or similar. This ensures I retain full control over my sensitive information.
1. For highly critical accounts (like [Skeleton Keys](../digital-civil-rights-privacy-ii/#identity-and-credential-management)), I rely on a [hardware-based FIDO2](../openssh-fido2-hardwarekey/#additonal-remarks%3A) second factor. Devices like the [Trezor Model T](https://trezor.io/trezor-model-t) or its successor, the [Trezor Safe 5](https://trezor.io/trezor-safe-5), provide robust security.
1. Some accounts mandate 2FA even though I don't consider them vital. For these, I store the TOTP secrets alongside their passwords in the same database for convenience. This approach simplifies management and reduces complexity.
1. For all other accounts requiring 2FA or passkeys, I use a dedicated second database.
    1. On a computer KeePassXC's browser integration is capable of managing multiple open databases.
    1. On mobile devices, I use [KeePassDX](https://github.com/Kunzisoft/KeePassDX), though switching between databases is cumbersome compared to KeePassXC. While there's a request for better [multi-database support](https://github.com/Kunzisoft/KeePassDX/issues/209), this feature is yet to be implemented.
        1. **Magikeyboard for Ease of Use**: KeePassDX includes a [Magikeyboard](https://www.kuketz-blog.de/keepassdx-magikeyboard-und-autofill-im-android-alltag-nutzen-passwoerter-teil2), which simplifies entering passwords and 2FA codes into apps and browsers. If you're new to this, check out the guide [KeePassDX: Magikeyboard und AutoFill](https://www.kuketz-blog.de/keepassdx-magikeyboard-und-autofill-im-android-alltag-nutzen-passwoerter-teil2), or watch the YouTube video [Complete Guide: KeePassXC | Free, Open-Source, Android Sync | Self-hosted password manager](https://www.youtube.com/watch?v=jL7gfM27EUA) for a walkthrough towards the end of the video.
        1. **Convenience Post First Login**: After the initial login to an account, your browser or app will remember the password. From then on, you'll primarily use the second database for TOTP codes. Additionally, KeePassDX can unlock databases using biometrics, such as your fingerprint, eliminating the need to enter the master password each time.
        1. **Read-Only Mode for Sync Safety**: To avoid sync conflicts, I use KeePassDX in read-only mode on mobile devices. All password management — creation, updates, and deletions — is done on my workstation. The updated database files are then synced to other devices.

You can simplify things by using a single KeePassXC password database and storing your 2FA secrets elsewhere, e.g. [Aegis](https://github.com/beemdevelopment/Aegis).

### Browser Integration

One thing you will definitely want to have is the KeePassXC [Browser Integration](https://keepassxc.org/docs/KeePassXC_GettingStarted#_setup_browser_integration).
By default, the [KeePassXC Browser Extension](https://github.com/keepassxreboot/keepassxc-browser) may not support LibreWolf, Mullvad or the Tor-Browser.
However, there's a workaround for this limitation.
You can install the browser integration for Firefox as documented.
This will create the folder and file '`~/.mozilla/native-messaging-hosts/org.keepassxc.keepassxc_browser.json`'.
Then you need to create a symbolic link in LibreWolf, Mullvad or the Tor-Browser with these steps:

For LibreWolf:

```bash
> cd ~/.librewolf
> ln -s ~/.mozilla/native-messaging-hosts
```

For Mullvad or Tor-Browser:

```bash
> cd INSTALL_LOCATION_FOR_MULLVAD_OR_TOR_BROWSER
> mkdir -p ./Data/.mozilla
> cd ./Data/.mozilla
> ln -s ~/.mozilla/native-messaging-hosts
```

After installing the browser integration as per the instructions in the [documentation](https://keepassxc.org/docs/KeePassXC_GettingStarted#_setup_browser_integration), you need to ensure that all your databases are connected.
If you're using two databases (for example, one for passwords and another for 2FA secrets), open only one at a time and follow the "Connect" process separately for each database.
Remember to use distinct 'connection names' for each of them.

In KeePassXC, navigate to `Application Settings > Browser Integration`. Ensure you check the box labeled `Search in all open databases for matching credentials`.
For more details and a screenshot, refer to [Configure KeePassXC-Browser](https://keepassxc.org/docs/KeePassXC_GettingStarted#_configure_keepassxc_browser).

> If you find that the `Application Settings > Browser Integration` is not visible on your installation of KeePassXC, try deinstalling `keepassxc` and then reinstalling it as `keepassxc-full` from the Ubuntu package archive. This should make the option appear.

Lastly, to utilize `passkeys` support, you'll need to [enable](https://keepassxc.org/docs/KeePassXC_UserGuide#_enabling_passkey_support) this feature in your browser integration extension settings.


Managing multiple databases in KeePassXC for two-factor authentication (2FA) can sometimes be tricky. Here's the approach I use to ensure everything works as expected:

1. Storing Credentials:
    1. Start by opening only your primary database. Use the browser integration's `new`  method to store the credentials for the new account.
    1. Then, repeat the process for the secondary database, e.g. open only the second database and use the browser integration's `new`  method to store the credentials for the new account once more -- now in the second database. Then clear (set to empty / blank) the password field in this database. This ensures the browser integration will prioritize the entry from the primary database while still autofilling the generated one-time TOTP codes from the second database.
1. Setting Up 2FA: With both databases open, proceed to set up the second factor.
    1. Locate the seed secret for the 2FA setup. If only a QR code is visible and not the text version of the seed, take a [screenshot](https://apps.kde.org/spectacle/) of the QR code. Use a tool like [zbar-tools](https://github.com/mchehab/zbar) and its `zbarimg` program to decode the QR code and extract the seed secret.
    1. In KeePassXC, navigate to the relevant account entry in your secondary database. Right-click, select `TOTP > Set up TOTP...`, and paste the extracted seed secret.

Navigating through this process might seem a bit complicated, but once you reach the stage where your password and second factor are kept separate, things start to get easier.
At this point, the browser integration becomes smart enough to "combine" these two when both databases are open while signing into your account. 

> If you encounter any issues, refer to the KeepassXC-Browser [Troubleshooting guide](https://github.com/keepassxreboot/keepassxc-browser/wiki/Troubleshooting-guide).

## Bookmarks

[Floccus](https://github.com/floccusaddon/floccus) allows you to sync your bookmarks privately across browsers and devices.
The synchronization can be done through Nextcloud, Linkwarden, Git or WebDAV server or just via Google Drive.
Below, I'll guide you through setting up a private [Nextcloud](https://github.com/nextcloud/server) instance and using its [Bookmarks](https://github.com/nextcloud/bookmarks) app as the backend for Floccus.

Just follow the [Get Started Guides](https://floccus.org/guides) to install the extension in your web browsers.
Note that the [Vanadium](https://www.kuketz-blog.de/vanadium-sichere-und-datenschutzfreundliche-android-browser-teil-6/) browser of your [GrapheneOS](https://grapheneos.org) mobile device is not compatible with the browser extension, but you can still access your bookmark collection on your mobile using the standalone [Floccus for Android](https://f-droid.org/en/packages/org.handmadeideas.floccus/) app.

## Notes

Finally, we will also want to make use of the Nextcloud [Notes](https://f-droid.org/en/packages/it.niedermann.owncloud.notes/) mobile app to be able to share personal notes.
On your workstation computer, you can access the notes via the standard Nextcloud web interface.

## Nextcloud all-in-one (AIO)

Nextcloud all-in-one (AIO) is the official Nextcloud installation method. It provides easy deployment and maintenance with most features included in this one Nextcloud instance via a [docker](https://www.docker.com/blog/containerd-vs-docker/) stack.

### Networking and Network Topology Overview

We will use [Traefik as a Reverse Proxy](../traefik-reverse-proxy-ansible) on our netcup Virtual Private Server ([VPS](https://www.netcup.de/vserver/vps.php)), which we set up [earlier](../fuel-save-alerter-germany/#deployment-environment(s)) and made accessible over the internet.
Alongside this, we'll employ a WireGuard [Hub-and-Spoke topology](../security-identity-goteleport/#virtualized-mesh-networks) (also known as Star topology) to connect the Traefik reverse proxy on the VPS to our [ODROID-M1](../odroid-m1-dockerized-homeassistant) home server,
located inside our home network behind a router. This configuration allows us to access our Nextcloud instance from anywhere via the public internet.

Here's a visual overview of the setup:

<img src="https://www.procustodibus.com/images/blog/wireguard-topologies/hub-and-spoke-outline.svg" style="max-height: 100px; max-width: 100%">

At the top of the Ʌ (upside-down V) is the "star-center," which in this case is the netcup VPS server.
This server, reachable via the internet, hosts the Traefik reverse proxy.
At the bottom left of the Ʌ is the ODROID-M1 home server, where the actual Nextcloud instance is running.
The netcup VPS server and the ODROID-M1 home server are connected using WireGuard in a [Virtualized Mesh Network](../security-identity-goteleport/#virtualized-mesh-networks).
For a step-by-step guide on setting up a WireGuard virtualized mesh network, check out the WireGuard section in the [ODROID-M1: Dockerized Home Assistant](../odroid-m1-dockerized-homeassistant) page.

[Getting my Hub and Spoke setup to work](../security-identity-goteleport/#virtualized-mesh-networks) took some time, mainly because I overlooked the following lines in the `wg0.conf` at my star center at my netcup VPS:

```ini
# Allow routing between clients
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT
```

As detailed in [Wireguard Netzwerk mit Routing einrichten](https://www.edvpfau.de/wireguard-netzwerk-mit-routing-einrichten).

> In the Traefik [docker-compose.yml](https://github.com/cs224/traefik-reverse-proxy-ansible-showcase/blob/main/roles/traefik/templates/docker-compose.yml) from my previous post, I still use `traefik:v2.8.0`.
> If you want to utilize a more recent version, check out [Christian Lempa](https://www.youtube.com/@christianlempa)'s [boilerplates](https://github.com/ChristianLempa/boilerplates) and specifically his [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik) file.
> Currently, this uses `traefik:v3.2.1`.

> If you prefer using an alternative reverse proxy apart from Traefik, refer to the [Reverse Proxy](https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md) documentation within the Nextcloud All-in-One (AIO) documentation.

**Nextcloud All-in-One: Secure Access Tips**: Making your Nextcloud All-in-One (AIO) instance accessible via a reverse proxy allows you to share content with anyone, not just registered users. However, this convenience comes with a trade-off: an increased attack surface. Let’s explore a few ways to mitigate this while still maintaining usability.

Option 1: Keep It on Your Home Network:

>  One approach is to restrict access to your Nextcloud AIO instance to your home network, behind your router. For remote access, you can use a WireGuard VPN connected to your FRITZ!Box. This way, even when traveling, you can securely access your Nextcloud instance.

> To set this up, refer to the guide [Setting up a WireGuard VPN to the FRITZ!Box on the computer](https://en.avm.de/service/knowledge-base/dok/FRITZ-Box-7590/3685_Setting-up-a-WireGuard-VPN-to-the-FRITZ-Box-on-the-computer).
> Once configured, you can use WireGuard not only on your computer but also on a GrapheneOS mobile device through its [Android client](https://download.wireguard.com/android-client).
> For those curious about why the WireGuard mobile app isn't on the F-Droid store, check out the discussion in [WireGuard is pulled off F-Droid. What's going on?](https://www.reddit.com/r/WireGuard/comments/17gsm3r/wireguard_is_pulled_off_fdroid_whats_going_on/)

Option 2: Add Basic Authentication with Traefik:

> Another way to enhance security is to enable [basic authentication](https://doc.traefik.io/traefik/middlewares/http/basicauth/) (`basic-auth`) in the `dynamic.yml` file of your Traefik configuration. This adds an extra layer of access control for your Nextcloud instance.
> * While this works well in web browsers, it might cause compatibility issues with some apps trying to connect to your instance.
> * Sharing links with third parties becomes less straightforward, as you'd need to share the `basic-auth` password along with the link.

### General Context for Nextcloud All-in-One (AIO)

Initially, the Nextcloud all-in-one (AIO) setup was confusing to me.
I thought it would be a `docker-compose.yaml` file that orchestrates many different services like the nextcloud web front end, a database backend and other services.
But the Nextcloud AIO [compose.yaml](https://github.com/nextcloud/all-in-one/blob/main/compose.yaml) only defines one service based on the `nextcloud/all-in-one:latest` image.
So what is going on here?
As far as I understand, Nextcloud AIO works similarly to [Portainer](https://www.portainer.io) in that both, Portainer and Nextcloud AIO are management containers whose main purpose is to communicate with the `/var/run/docker.sock` socket to ultimately instruct Docker on what to do.
Nextcloud AIO comes with its own web UI to guide you through the setup and future upgrade processes.

This approach has its pros and cons.
Personally, I would have preferred a `docker-compose.yaml` file that I could commit to a Git repository[^nextcloud-docker-compose-stack].
Once satisfied with it, this file can be taken and installed on any other machine to replicate my defined setup without manual steps.
However, the Nextcloud AIO approach requires me to go through these manual steps every time I set up Nextcloud on a new server.
That said, the AIO approach has its strengths, especially when it comes to its [Maintenance and Release Schedule](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule).
Since Nextcloud doesn't provide Long-Term Support (LTS) versions, staying updated with its latest releases is crucial.
AIO simplifies this process, making it easier to keep up with Nextcloud’s regular updates.

The naming schemes in Nextcloud can be quite confusing.
On one hand, there's talk of `Nextcloud Hub` with version numbers like 7, 8, 9, and so on.
On the other hand, there are Nextcloud versions numbered 28, 29, 30, etc.
From what I understand, there's [no functional difference](https://help.nextcloud.com/t/nextcloud-unterschied-zu-nextcloud-hub/119072) between Nextcloud Hub and Nextcloud without the "Hub" label — the term Hub is simply a marketing term.
To make sense of these naming conventions, the [Maintenance and Release Schedule](https://github.com/nextcloud/server/wiki/Maintenance-and-Release-Schedule) page provides a helpful mapping between the two versioning systems.

For a deeper dive, check out the [Nextcloud release channels and how to track them](https://nextcloud.com/blog/nextcloud-release-channels-and-how-to-track-them/) documentation.
It's a great resource for understanding how the various release channels operate and how to track them effectively.

### Installation

The [How to Install the Nextcloud All-in-One on Linux](https://nextcloud.com/de/blog/how-to-install-the-nextcloud-all-in-one-on-linux/) guide explains the installation process in detail.
However, instead of using `docker run` to start the AIO container, I prefer using a [compose.yaml](https://github.com/nextcloud/all-in-one/blob/main/compose.yaml) file.
This approach allows you to configure multiple environment variables and other options more flexibly. You can then start the container with `docker compose`.

**Step 1: Set Up Directory Structure**: Begin by creating the necessary directory structure on your ODROID-M1 home server:

```bash
> mkdir -p /opt/nextcloud/data/{nextcloud,backup}
> tree /opt/nextcloud
.
├── data
│   ├── backup
│   │   └── borg
│   └── nextcloud
└── docker-compose.yaml
```

> Note, that the `docker-compose.yaml` file that you see in the `tree` output will be only created in the next step.
> In addition, the `borg` sub-folder will only be generated after running Nextcloud AIO for the first time.
> [Borg](https://www.borgbackup.org) is a deduplicating archiver with compression and encryption, similar to tools like [Duplicati](https://duplicati.com), which we've used in our [Home Assistant setup](../odroid-m1-dockerized-homeassistant/#stage-3%3A-duplicati-backup).


**Step 2: Download and Customize compose.yaml**: Download the [compose.yaml](https://github.com/nextcloud/all-in-one/blob/main/compose.yaml) file from the Nextcloud all-in-one (AIO) GitHub [repository](https://github.com/nextcloud/all-in-one/blob/main/compose.yaml) and place it at `/opt/nextcloud/docker-compose.yaml`.
Modify the file as needed; below is a summary of changes in `diff` format:

```diff
*** Downloads/compose.yaml      2024-11-29 15:05:57.465399928 +0100
--- docker-compose.yaml 2024-11-29 15:05:40.541220505 +0100
***************
*** 9,26 ****
      ports:
!       - 80:80 # Can be removed when running behind a web server or reverse proxy (like Apache, Nginx, Caddy, Cloudflare Tunnel and else). See https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md
!       - 8080:8080
!     # environment: # Is needed when using any of the options below
!       # APACHE_PORT: 11000 # Is needed when running behind a web server or reverse proxy (like Apache, Nginx, Caddy, Cloudflare Tunnel and else). See https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md
!       # NEXTCLOUD_DATADIR: /mnt/ncdata # Allows to set the host directory for Nextcloud's datadir. ⚠️⚠️⚠️ Warning: do not set or adjust this value after the initial Nextcloud installation is done! See https://github.com/nextcloud/all-in-one#how-to-change-the-default-location-of-nextclouds-datadir
--- 9,27 ----
      ports:
!       # - 80:80 # Can be removed when running behind a web server or reverse proxy (like Apache, Nginx, Caddy, Cloudflare Tunnel and else). See https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md
!       - 8088:8080
!     environment: # Is needed when using any of the options below
!       APACHE_PORT: 11000 # Is needed when running behind a web server or reverse proxy (like Apache, Nginx, Caddy, Cloudflare Tunnel and else). See https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md
!       NEXTCLOUD_DATADIR: /opt/nextcloud/data/nextcloud # Allows to set the host directory for Nextcloud's datadir. ⚠️⚠️⚠️ Warning: do not set or adjust this value after the initial Nextcloud installation is done! See https://github.com/nextcloud/all-in-one#how-to-change-the-default-location-of-nextclouds-datadir
```

**Adjust Port Mapping**: As my [ODROID-M1](../odroid-m1) is already using port 80 for my [Dockerized Home Assistant](../odroid-m1-dockerized-homeassistant) service I comment out the `80:80` mapping as it creates a port mapping conflict.
Note that we don't need this `80:80` port mapping when we operate Nextcloud all-in-one (AIO) behind a [Reverse Proxy](https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md).
I replace the default `8080` port with `8088` as there's another conflict in my case. This change may not be necessary for your setup.

**Set Environment Variables**: Uncomment the top-level `environment:` section in the file and set `APACHE_PORT: 11000` for use with a reverse proxy or web server, as suggested in the comment line.
Update `NEXTCLOUD_DATADIR` to point to `/opt/nextcloud/data/nextcloud`, the directory we created earlier. This is where Nextcloud will store its data.

Once the file is configured, start the container with:

```bash
> docker compose up -d
```

**Step 3: Access Nextcloud AIO Interface**: Navigate to `https://192.168.0.5:8088` in your browser (replace this with your server's IP and port). Follow the instructions in the [AIO installation guide](https://nextcloud.com/de/blog/how-to-install-the-nextcloud-all-in-one-on-linux), starting from Step 4: "Next, you can open the AIO interface ..."

> **Tip**: Your URL might differ based on your server's IP and port configuration. For example, my ODROID-M1 uses IP `192.168.0.5` and I replaced the default `8080` port with `8088` due to a port conflict.

**Step 4: Configure Backups**: The [AIO installation guide](https://nextcloud.com/de/blog/how-to-install-the-nextcloud-all-in-one-on-linux) concludes after all containers are up and running. On the final [screenshot](https://nextcloud.com/de/blog/how-to-install-the-nextcloud-all-in-one-on-linux), you'll find a section labeled "Backup and restore". It will ask you to specify a directory for backups. Enter: `/opt/nextcloud/data/backup`. Set a time for daily backups to run. Note that you may need to stop the Nextcloud AIO stack to adjust these settings. After configuring, restart the stack to apply changes.

### Traefik Reverse Proxy

Refer to the [Traefik 2](https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md#traefik-2) section in the Nextcloud All-in-One (AIO) [Reverse Proxy](https://github.com/nextcloud/all-in-one/blob/main/reverse-proxy.md) documentation.
Despite the name, this setup works seamlessly with my Traefik 3 configuration as well.
If you need additional guidance on setting up Traefik, check out [Christian Lempa](https://www.youtube.com/@christianlempa)'s [boilerplates](https://github.com/ChristianLempa/boilerplates), particularly the [docker-compose/traefik](https://github.com/ChristianLempa/boilerplates/tree/main/docker-compose/traefik) folder.
This resource also explains how to configure your `CertificateResolver` for tools like [Let's Encrypt](https://letsencrypt.org/).

Below is an excerpt from my `/opt/traefik/traefik-config/dynamic.yml` file used in my [Traefik Reverse Proxy](../traefik-reverse-proxy-ansible) setup:

```yaml
http:
  middlewares:
    nextcloud-secure-headers:
      headers:
        hostsProxyHeaders:
          - "X-Forwarded-Host"
        referrerPolicy: "same-origin"
    https-redirect:
      redirectscheme:
        scheme: https 
    nextcloud-chain:
      chain:
        middlewares:
          # - ... (e.g. rate limiting middleware)
          - https-redirect
          - nextcloud-secure-headers
  routers:
    odroid-nextcloud-router:
      rule: "Host(`nextcloud.domain.tld`)"
      service: odroid-nextcloud-service
      middlewares:
        - nextcloud-chain
      tls:
        certResolver: default
  services:
    odroid-nextcloud-service:
      loadBalancer:
        servers:
          - url: "http://10.0.1.3:11000"
```

In my configuration, the IP `10.0.1.3` represents the connection between my netcup Virtual Private Server ([VPS](https://www.netcup.de/vserver/vps.php)) and my [ODROID-M1](../odroid-m1-dockerized-homeassistant) home server, established via WireGuard as described at [Hub and Spoke topology](../security-identity-goteleport/#virtualized-mesh-networks). Replace `domain.tld` with the DNS name of your internet-accessible machine. You can freely choose the prefix (e.g., `nextcloud`) to define how you want to access your Nextcloud instance over the internet.

### Configuring Nextcloud

I strongly recommend enabling [two-factor authentication](https://docs.nextcloud.com/server/latest/user_manual/en/user_2fa.html) (2FA) for improved security.
While Nextcloud also supports `passkeys`, the current implementation is inconvenient and "non-sensical" — it requires both 2FA and a passkey simultaneously.
For more details, see the open GitHub ticket: [Disable 2FA when Webauthn is being used](https://github.com/nextcloud/server/issues/21215).
For now, I would advise sticking with traditional 2FA methods.

Additionally, consider creating a secondary account named something like `me` for everyday use.
This keeps your `admin` account reserved strictly for administrative tasks.
I recommend using a simple name like `me`, and avoid configuring any identifying data such as an email address in the `me` account to minimize the risk of leaking personal information.

In subsequent steps, Nextcloud apps will need to be installed using the admin account, but file and other data syncing tasks (like bookmarks or notes) should be handled via your regular `me` account.

### Apps

To get the most out of Nextcloud, start by installing essential apps like [Bookmarks](https://apps.nextcloud.com/apps/bookmarks) and any others you plan to use. Use the `admin` account for installing apps.

### Bookmarks App

To sync bookmarks privately across browsers and devices, install the [Floccus](https://github.com/floccusaddon/floccus) extension in your browser.
Then follow the "Sync with Nextcloud Bookmarks" guide in the Floccus [Get Started Guides](https://floccus.org/guides) for detailed instructions on how to connect the browser extension to your Nextcloud instance.

Note that the [Vanadium](https://www.kuketz-blog.de/vanadium-sichere-und-datenschutzfreundliche-android-browser-teil-6/) browser of your [GrapheneOS](https://grapheneos.org) mobile device is not compatible with the browser extension, but you can still access your bookmark collection on your mobile using the standalone [Floccus for Android](https://f-droid.org/en/packages/org.handmadeideas.floccus/) app.
This allows you to keep your bookmarks collection synced and accessible on the go.

### Notes App

On a computer, you can access the Nextcloud [Notes](https://apps.nextcloud.com/apps/notes) directly through your browser.
For [GrapheneOS](https://grapheneos.org) mobile devices, install the Nextcloud [Notes](https://f-droid.org/en/packages/it.niedermann.owncloud.notes/) mobile app to easily share and manage your personal notes.

### Password Manager KeePassXC Sync

To sync KeePassXC with Nextcloud, follow these steps for both your desktop and mobile devices.

**Desktop Setup**: On your computer, refer to the [Download for desktop](https://nextcloud.com/install) instructions to sync files from your Nextcloud instance to your desktop. This will allow you to access your password database seamlessly across desktop computers.

**Mobile Setup**: For your [GrapheneOS](https://grapheneos.org) mobile device, download the Nextcloud mobile client from the [F-Droid](https://f-droid.org/packages/com.nextcloud.client) store. This ensures that your password databases remain synced with your mobile device.


**Setting Up Password Databases**

Create Folders and Databases: On your workstation, create a folder named `keepassxc` in your Nextcloud directory. Inside this folder use the [KeePassXC](https://github.com/keepassxreboot/keepassxc) password manager to set up two password databases:
* `me.kdbx`: Store your regular passwords here.
* `me2fa.kdbx`: Store 2FA codes and passkeys here.

Refer to the [KeePassXC: User Guide](https://keepassxc.org/docs/KeePassXC_UserGuide) for [detailed instructions](https://keepassxc.org/docs/KeePassXC_UserGuide#_creating_your_first_database) on creating and managing databases.

Configure Mobile Access: On your [GrapheneOS](https://grapheneos.org) device, set [KeePassDX](https://github.com/Kunzisoft/KeePassDX) to open these databases in read-only mode.
This avoids potential merge conflicts.
Perform account creation and password management tasks on your desktop; the Nextcloud sync will automatically update your mobile device, where you can use the KeePassDX app to access the data.

#### Adding passwords and 2FA or keypass

I said it already above, but I just want to repeat it here: Managing multiple databases in KeePassXC for two-factor authentication (2FA) can sometimes be tricky. Here's the approach I use to ensure everything works as expected:

1. Storing Credentials:
    1. Start by opening only your primary database. Use the browser integration's `new`  method to store the credentials for the new account.
    1. Then, repeat the process for the secondary database, e.g. open only the second database and use the browser integration's `new`  method to store the credentials for the new account once more -- now in the second database. Then clear (set to empty / blank) the password field in this database. This ensures the browser integration will prioritize the entry from the primary database while still autofilling the generated one-time TOTP codes from the second database.
1. Setting Up 2FA: With both databases open, proceed to set up the second factor.
    1. Locate the seed secret for the 2FA setup. If only a QR code is visible and not the text version of the seed, take a [screenshot](https://apps.kde.org/spectacle/) of the QR code. Use a tool like [zbar-tools](https://github.com/mchehab/zbar) and its `zbarimg` program to decode the QR code and extract the seed secret.
    1. In KeePassXC, navigate to the relevant account entry in your secondary database. Right-click, select `TOTP > Set up TOTP...`, and paste the extracted seed secret.

Navigating through this process might seem a bit complicated, but once you reach the stage where your password and second factor are kept separate, things start to get easier.
At this point, the browser integration becomes smart enough to "combine" these two when both databases are open while signing into your account. 

## Conclusions and Outlook

In this blog post, we've explored a step-by-step process to build a secure ecosystem across our devices using cutting-edge open-source tools. The result is a personal cloud solution that prioritizes digital autonomy and privacy:

* A privacy-first browsing experience on all our devices, including desktop computers and GrapheneOS mobile devices.
* A centralized, encrypted password management system that is shared and synced across your setup.
* Bookmarks and notes synced securely, ensuring your data remains private and accessible.

We've built a scalable, privacy-focused digital infrastructure that can grow alongside our needs. This setup lays the foundation for achieving greater digital sovereignty.

In future posts, we'll expand this system to include additional tools, such as a private calendar and contact management, all seamlessly integrated across your devices.

Please feel free to share your thoughts on this topic by leaving comments at the bottom of this page.

## Appendix

### Upgrade Nextcloud to Beta Releases

If you want to upgrade to the latest beta version of Nextcloud without waiting for the next major release through the All-in-One (AIO) user interface, refer to the guide: [How to update to Nextcloud 30 now?](https://github.com/nextcloud/all-in-one/discussions/5133).
It provides clear steps for performing the upgrade manually.

To see the process in action, check out this helpful YouTube video that walks you through the [upgrade process](https://youtu.be/vFCm8Bx1bkg?t=107).

```bash
# Switch to the beta channel
php occ config:system:set updater.release.channel --value=beta

# Run the update
php updater/updater.phar --no-interaction --no-backup && php occ app:enable nextcloud-aio --force

# Switch back to the stable channel
php occ config:system:set updater.release.channel --value=stable

# Exit the container
exit
```

You can repeat these steps as needed until you reach the desired Nextcloud version.

### LibreWolf on KDE/Plasma KUbuntu 24.04 LTS (Noble Numbat)

Initially, I followed the installation instructions provided [for Debian-based systems](https://librewolf.net/installation/debian/), but I encountered some difficulties in getting LibreWolf to run smoothly on KDE/Plasma KUbuntu 24.04 LTS (Noble Numbat).
I faced the same issues as mentioned in [Space between words too large (on some websites) in LibreWolf](https://www.reddit.com/r/LibreWolf/comments/1fcnem6/space_between_words_too_large_on_some_websites_in).



I then attempted to navigate through the [Flatpak](https://librewolf.net/installation/linux/) install instructions. However, I advise against this setup due to its complications with KeePassXC browser integration, which we will discuss later on. If you still wish to try it out, refer to:
* [KeePassXC browser integration -> Librewolf?](https://forums.linuxmint.com/viewtopic.php?t=429437)
    * [Librewolf - Firefox - KeePassXC - Flatpak](https://gitlab.com/TomaszDrozdz/librewolf-firefox-keepassxc-flatpak)
* [[HOW TO] Run Firefox *and* KeePassXC in a flatpak and get the KeePassXC-Browser add-on to work](https://discourse.flathub.org/t/how-to-run-firefox-and-keepassxc-in-a-flatpak-and-get-the-keepassxc-browser-add-on-to-work/437)

Please note that the [Troubleshooting Guide](https://github.com/keepassxreboot/keepassxc-browser/wiki/Troubleshooting-guide) for the KeePassXC-Browser integration explicitly states:

> Please note that in general Flatpak and Snap based browsers are not supported, Ubuntu's Firefox Snap being an exception.

One more thing to be aware of is that LibreWolf's configuration files in the Flatpak version are installed at a different location: `~/.var/app/io.gitlab.librewolf-community/.librewolf`, instead of the usual `~/.librewolf`.

After several attempts to get LibreWolf running with the Flatpak version and eventually giving up, I uninstalled and reinstalled LibreWolf [for Debian-based systems](https://librewolf.net/installation/debian/). To my surprise, the issue was resolved.


## Footnotes

[^opensearchxml]: This option will only be visible if the searchengine website includes a header in the page pointing to its [OpenSearch XML](https://developer.mozilla.org/en-US/docs/Web/OpenSearch) file with the necessary URLs.
[^nextcloud-docker-compose-stack]: Have a look at [Nextcloud Server – mit Docker Compose und Traefik installieren](https://goneuland.de/nextcloud-server-mit-docker-compose-und-traefik-installieren) to see a "standard" docker-compose stack set-up.
