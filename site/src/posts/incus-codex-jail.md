---
layout: "layouts/post-with-toc.njk"
title: "Incus System-Container Jail for the Codex Coding Agent"
description: "Reducing 'Supply Chain Attack' Risk from AI Coding Agents (and Shadow AI)."
seodescription: "Run OpenAI Codex or Claude Code inside an Incus system container jail. Learn step by step setup with network ACLs and bind mounts to limit secrets and reduce supply chain attacks."
creationdate: 2026-02-18
keywords: codex, claude code, ai agents, supply chain attacks, shadow ai, incus, system containers, sandboxing
date: 2026-02-18
tags: ['post']
---

## Rationale

On February 11, 2026, *heise online* reported that [Microsoft is warning about dangerous "shadow AI"](https://www.heise.de/news/80-Prozent-der-Firmen-nutzen-KI-Microsoft-warnt-vor-gefaehrlicher-Schatten-KI-11172238.html),
when people use AI tools without clear approval, visibility, or security controls.
AI coding agents like [OpenAI Codex](https://openai.com/codex/) and [Anthropic Claude Code](https://claude.com/product/claude-code) can read files, change code, and run commands.
If they get access to secrets, package managers, internal repos, or deployment credentials, the security risk can look a lot like a *supply chain attack*:
your system gets compromised through a third party in the toolchain (in this case, the agent and its dependencies), rather than through a direct attack on you.

One practical mitigation is to run coding agents inside an *Incus system-container "jail"*, so you can tightly control what they can access (files, network, tokens, SSH keys, build tools).
This post outlines a concrete setup idea for hobbyists: how to isolate an agent while still keeping it useful for real coding work.

### Incus (formerly LXD)

If Incus is new to you, it helps to take a quick step back before we build anything.
Incus is a system for running system containers, which feel closer to a lightweight virtual machine than a typical application container.
That makes it a good match for this post, because we want a small 'jail' that can run tools, manage packages, and execute commands, while still being easier to control than letting an AI agent run directly on your host.

> If you have used Docker before, think of Incus system containers as running a full Linux user space with an init system and normal OS tooling.
> You can create users, install packages, and run services, but you can also set hard limits on what the container can access.
> This is useful when you want an environment that behaves like a real workstation or build machine, but with clear boundaries around files, devices, and networking.

I have written a few earlier posts that introduce Incus and show practical setups. If you want a deeper background, you can start with these.
They are not required, but they provide helpful context and examples you can reuse later.

* [Incus/LXD as an Alternative to Vagrant for DevOps Testing](../home-server-infrastructure/#incus%2Flxd-as-an-alternative-to-vagrant-for-devops-testing)
* [Incus Workload System Container with a Public IPv6 Address](../home-server-incus-route64-ipv6/#incus-workload-system-container-with-a-public-ipv6-address)
* [Cloud-Init Provisioning: A Practical Guide](../cloud-init-provisioning)

### Different Readers and Different Levels of Prior Knowledge

Different readers have different levels of prior knowledge, so it is hard to write one guide that fits everyone.
If the explanations below feel too short or too advanced for you, just copy the URL of this post into an AI assistant like ChatGPT and ask it to walk you through the sections you are not yet comfortable with.
For example, you can ask it to explain unfamiliar concepts or show the same steps for a different Linux distribution.

## Outline: Controlling Access Without Ruining the Workflow

The core idea is simple. You want to control which local compute resources and which parts of your environment a coding agent is allowed to use.
In practice, this means you decide what the agent can read and write, what it can execute, and what it can reach over the network.

The first part is about limiting access to your code and your file system. You typically want to expose only the project you are working on, not your entire home directory.
The second part is network control. You want to restrict which external services the agent can talk to, so it cannot easily exfiltrate secrets or move laterally to other systems.
The third part is resource control, so the agent cannot accidentally or intentionally cause trouble, for example by filling up your disk, consuming all CPU cores, or using too much memory.

For many hobbyist setups, the most important controls will be a read only view of sensitive paths, a clean environment without personal SSH keys, and a default deny policy for outbound network access.
Even if the agent is not malicious, these guardrails reduce damage from mistakes.
They also reduce the blast radius if a dependency or tool in the agent's workflow turns out to be compromised, which is the typical pattern behind supply chain incidents.

At the same time, the workflow should still feel natural. You still want to work in your preferred IDE, run tests, and review changes without fighting file permissions or constantly copying files back and forth.
A good setup makes the boundary clear for the agent, but keeps the human experience smooth.

### Incus Network ACL

The first step is to give our agent containers their own Incus network, and then attach a network ACL (Access Control List) to it.
The main idea is simple: the agent should be able to reach the public Internet (so it can fetch packages and documentation), but it should not be able to directly reach your local network ranges (where routers, NAS boxes, printers, internal services, and other "interesting" targets usually live).

To do that, we create an ACL called `agent-block-lan` and add a few "deny list" egress rules. In this example we block:

* RFC 1918 private IPv4 ranges (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
* IPv4 link local (`169.254.0.0/16`)

Create a file called `agent-block-lan.yaml` with the ACL definition:

```yaml
name: agent-block-lan
description: "Deny egress from agent jails to local/LAN ranges while allowing Internet."
egress:
  - action: reject
    state: enabled
    description: "Block RFC1918 private LAN ranges"
    destination: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16

  - action: reject
    state: enabled
    description: "Block IPv4 link-local"
    destination: 169.254.0.0/16

  # Optional (generic hardening): block CGNAT space
  # Only matters if you consider it 'local-ish' and don't need access to services there.
  # - action: reject
  #   state: enabled
  #   description: "Block CGNAT (optional)"
  #   destination: 100.64.0.0/10

ingress: []
config: {}
```

> The action `reject` is a good default, because the blocked connection fails immediately and you can see the effect.

Now create the ACL and load the YAML into it:

```bash
incus network acl create agent-block-lan
incus network acl edit agent-block-lan < agent-block-lan.yaml
```

Next, create a dedicated bridge network for the agent containers. This example keeps it intentionally simple: IPv4 only, with NAT enabled.
The bridge is placed on `198.18.0.0/15` to avoid colliding with the typical `192.168.x.x` home networks.

> The IPv4 block `198.18.0.0/15` is a special purpose range reserved for benchmarking and lab style network tests (often referenced via RFC 2544 and listed by IANA as "Benchmarking").
> Unlike RFC 1918 space, it is not intended for normal production networking, and many networks treat it as "bogon like" and may filter it if it ever leaks outside your lab.
> For this Incus jail use case, it is still be a good choice because it is unlikely to collide with typical home and office LANs (`192.168.x.x`, `10.x.x.x`), and we keep it behind NAT with no expectation of global reachability.

```bash
incus network create agentbr0 --type=bridge ipv4.address=198.18.0.1/15 ipv4.nat=true ipv6.address=none ipv6.nat=false

# Apply the ACL to the bridge network
incus network set agentbr0 security.acls="agent-block-lan"

# Default actions: allow egress (deny list rules still apply), drop ingress
incus network set agentbr0 security.acls.default.egress.action=allow
incus network set agentbr0 security.acls.default.ingress.action=drop
```

> When you apply an ACL to a NIC or to a network, Incus adds a default rule for unmatched traffic.
> You can change that behavior using `security.acls.default.ingress.action` and `security.acls.default.egress.action` at the network level (or override it per instance NIC).

> Also note a practical limitation: on a bridge network, ACLs primarily control traffic at the boundary between the Incus host and the outside world.
> They are a strong fit for "agents should not reach my LAN" type rules, but they are not meant to be a full micro segmentation firewall between multiple instances on the same bridge in every configuration.

Finally, verify that Incus installed the expected firewall rules on the host.
On systems using `nftables`, you can inspect the ruleset like this:

```bash
incus network acl show agent-block-lan
incus network show agentbr0

sudo nft -a list ruleset | less
```

### Incus Profile

Next we create an Incus profile that we can reuse for multiple agent instances.
A profile is basically a named bundle of settings: devices (like bind mounts), resource limits, and optional provisioning via [cloud init](../cloud-init-provisioning).

I put the full content of [`agent-jail-profile.yaml`](#agent-jail-profile.yaml) into the appendix below, so you can keep reading here without losing the flow.

Even if the profile file looks long, it mostly does two things: it bootstraps the developer tooling you want inside the jail, and it wires up a workspace directory so you can edit code on the host while the agent works inside the container.

The tooling part installs a small set of language runtimes and package managers that cover many hobby projects:

* The [uv](https://docs.astral.sh/uv/) Python package manager and Python 3.12.
  * [Quarto](https://quarto.org/), which is needed for [nbdev2](https://nbdev.fast.ai/) workflows.
* The [nvm](https://www.nvmnode.com/) Node version manager and the current LTS Node.js version.
  * The [Codex](https://openai.com/codex/) coding agent.
* The [sdkman](https://sdkman.io/) Java version manager and Java 25 (LTS).
* The [Rust](https://rust-lang.org/) toolchain, including `rustup`, `rustc`, and `cargo`.
* The [Go toolchain](https://go.dev/).

> In practice, you will not need all of these for every project. If you want a smaller attack surface, remove what you do not need.

The workspace part bind mounts a host directory into the container.
In this example, we mount `/srv/agent-jails/default-workspace` on the host to `/workspace` inside the container.
The mount uses `shift=true`, which enables id mapping for the mount so that file ownership lines up between host and container.

> This only works if your kernel and the underlying file system support id mapped mounts. `ext4` is a common choice and works well, but support depends on your exact system.

> Incus uses id mapped mounts so the same files can appear with different user and group IDs inside the container than on the host.
> This is useful for "unprivileged" containers, where container user IDs live in a mapped range on the host.
> The important detail is that this is not a magical conversion of "UID 1234 in the container becomes UID 1001 on the host".
> Instead, it is a mapping mechanism, and you still want your main user inside the container to match your host UID and GID for smooth read and write access to your project tree.

At the top of `agent-jail-profile.yaml` you will also see resource limitation settings.

The profile expects a few directories to exist on the host, so we create them first:
```bash
sudo mkdir -p /srv/agent-jails/default-workspace
sudo chown -R $USER:$USER /srv/agent-jails/default-workspace
sudo mkdir -p /srv/agent-jails/agent1-workspace
sudo chown -R $USER:$USER /srv/agent-jails/agent1-workspace
```

Now create the profile and load the YAML file into it:
```bash
incus profile create agent-jail
incus profile edit agent-jail < agent-jail-profile.yaml
```

Then launch a new instance using that profile:
```bash
# Use a cloud image so cloud-init actually runs.
incus launch images:debian/trixie/cloud agent1 --profile default --profile agent-jail
```

> The `/cloud` image variant is useful here because the profile relies on cloud init for first boot provisioning.
> If you pick a non cloud image, cloud init may not run, and your tooling install steps might never execute.

Provisioning usually takes a short moment. You can watch it live and confirm that it finished cleanly:
```bash
# Watch provisioning
incus exec agent1 -- tail -f /var/log/cloud-init-output.log
incus exec agent1 -- cloud-init status --long
```

In the profile we used the host directory `/srv/agent-jails/default-workspace`, but we can override that per instance at runtime.
This is useful when you want to use the same jail for a different host directory.
The following command assumes the workspace device in your profile is named `workspace`:

```bash
# Reconfigure working directory
incus config device override agent1 workspace source=/srv/agent-jails/agent1-workspace
```

You do not need to restart the instance for this change to take effect.

If you work on a Linux workstation where your main user has UID 1000 and GID 1000, you can usually skip the next step, because the profile creates a container user `agent` with the same in container UID and GID.
If your host UID and GID are not 1000, adjust the `agent` user inside the container to match your host IDs.
This avoids permission problems when you edit files in the shared workspace:

```bash
# Reconfigure user and group IDs (if necessary)
HOST_UID="$(id -u)"
HOST_GID="$(id -g)"

incus exec agent1 -- bash -lc "
  set -e
  getent group agent >/dev/null && groupmod -g $HOST_GID agent || true
  usermod  -u $HOST_UID -g $HOST_GID agent
  chown -R $HOST_UID:$HOST_GID /home/agent
"
```

Again, no instance restart is required.

Finally, we map the host directories `$HOME/.codex` and `$HOME/.agents` into the container.
This allows `codex` to reuse authentication and configuration that already exist on the host:

```bash
incus config device add agent1 codex  disk source="$HOME/.codex"  path=/home/agent/.codex  readonly=false shift=true
incus config device add agent1 agents disk source="$HOME/.agents" path=/home/agent/.agents readonly=true  shift=true
```

You can now enter the container either as user `agent` for normal work, or as `root` for administration:

```bash
# Enter the container as user agent:
incus exec -t agent1 -- su -l agent

# Enter the container as user root:
incus exec -t agent1 -- bash
```

#### Tests

Before you start using the jail for real work, it is worth doing a quick sanity check.
The goal is to confirm that the toolchains were installed correctly and that your wrapper script (`agent-env`) really sets up the expected environment for the `agent` user.

Run the following commands and confirm that each tool prints a version number:

```bash
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env uv --version'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env python --version'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env quarto --version'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env node --version'
incus exec agent1 -- su -l agent -c '"$HOME/.sdkman/candidates/java/current/bin/java" -version'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env go version'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env rustc -V'
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env cargo -V'
```

Next, verify that the network ACL behaves as intended.
The first test should succeed, because Internet egress is allowed.
The second test should fail, because RFC 1918 destinations (like `192.168.x.x`) are blocked by your ACL.

```bash
# Should succeed (Internet allowed)
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env nc -vz -w 2 1.1.1.1 443'

# Should fail (RFC1918 blocked by your ACL)
incus exec agent1 -- su -l agent -c '/usr/local/bin/agent-env nc -vz -w 2 192.168.1.123 22'
```

#### Deleting Everything

If you want to remove everything we created so far, you can clean it up in the reverse order: delete the instance first, then the profile, then the network and its ACL.

Run the following commands:

```bash
# Delete the instance
incus delete --force agent1

# Delete the profile
incus profile delete agent-jail

# Delete the bridge network
incus network delete agentbr0

# Delete the network ACL
incus network acl delete agent-block-lan
```

After that, you can verify that the objects are gone. These commands should now fail with "not found" (which is what you want):

```bash
# Verify (these should report "not found")
incus network acl show agent-block-lan
incus network show agentbr0
```

If you also want to confirm that Incus removed the firewall rules from the host, inspect the `nftables` ruleset again:

```bash
sudo nft -a list ruleset | less
```

## Testrun

Now we can take our new Incus system container jail for the Codex coding agent for a real test run.
The goal is to confirm that the jail setup supports a normal developer workflow: create a project, install dependencies, run the agent, and execute the result, all without giving the agent direct access to your host system.

For this quick demo I use my [nbdev2 CLI Copier Template](https://github.com/cs224/nbdev2-cli-template).
It creates a small Python project with a command line entry point, which is perfect for a simple end to end check.

First, enter the container as the `agent` user, then switch into the shared `/workspace` directory:

```bash
# Enter the Incus container as user "agent"
incus exec -t agent1 -- su -l agent

# Go into the shared workspace directory
cd /workspace
```

Next, use the template to generate a dummy project.
The template will ask a few questions.
For this test you can accept all defaults by pressing Enter at each prompt:

```bash
# Create a new project from the nbdev2 CLI Copier Template
uvx copier copy "gh:cs224/nbdev2-cli-template" codex-cli-test
```

Now change into the newly created project directory and start Codex there:

```bash
cd codex-cli-test
codex
```

Inside Codex, run the following.
The first line is a small helper prompt ([skill](https://developers.openai.com/codex/skills/)) I call `project-orientation`, which gives the agent a quick overview of the repository and sets expectations.

> I publish the `project-orientation` skill below in the [appendix](#project-orientation-skill).

After that, ask it to improve the "Hello World" output, then exit:

```text
$project-orientation
Replace the print(f"Hello {name}!") with something more fancy.
/exit
```

Finally, back in the container shell, run the CLI once to confirm that the change works:

```bash
# Verify the modified Hello World message
uv run hello-cli
```

When you run `codex` inside `/workspace`, all file edits happen in the bind mounted directory.
This is exactly what we want.
The agent can modify project files, but it only sees what you intentionally shared into the jail.
If you keep secrets, SSH keys, and other sensitive material out of `/workspace`, you reduce the risk that the agent can accidentally read or leak them.

## Workflow Shortcuts

To make the Incus system container jail pleasant to use in daily work, you can add a few small Bash helper functions to your `~/.bashrc`.
They handle the repetitive parts for you, like pointing the container workspace to your current host directory, and starting Codex inside the container as an unprivileged user.

After adding them, either open a new shell or run `source ~/.bashrc`.

> These helpers assume your Incus instance has a disk device called `workspace` that mounts a host directory into the container, typically at `/workspace`.
> In Incus terms, the device has a `source` (host path) and a `path` (mount point inside the container).
> Your earlier setup steps created this device via a profile.

```bash
# Defaults (override per-shell or per-command):
# export AGENTJAIL_INSTANCE=agent2
# export AGENTJAIL_WORKDIR=/workspace
# export AGENTJAIL_CODEX_CMD=codex   # can be an absolute path if you want

agentjail-ws-here() {
  local inst="${AGENTJAIL_INSTANCE:-agent1}"
  if [[ $# -ge 1 ]] && incus info "$1" >/dev/null 2>&1; then
    inst="$1"; shift
  fi

  local src
  src="$(pwd -P)"

  # Idempotent: works whether workspace is profile-inherited or already local
  incus config device set "$inst" workspace source="$src" 2>/dev/null \
    || incus config device override "$inst" workspace source="$src"
}

agentjail-ws() {
  local inst="${AGENTJAIL_INSTANCE:-agent1}"
  if [[ $# -ge 1 ]] && incus info "$1" >/dev/null 2>&1; then
    inst="$1"; shift
  fi

  # Direct getter (works when device exists on the instance)
  incus config device get "$inst" workspace source 2>/dev/null && return 0

  # Fallback: parse expanded config (shows profile-inherited devices)
  incus config show "$inst" --expanded 2>/dev/null | awk '
    /^devices:$/ {in_devices=1; next}
    in_devices && /^[^ ]/ {in_devices=0}
    in_devices && /^  workspace:$/ {in_ws=1; next}
    in_devices && in_ws && /^  [^ ]/ && $0 !~ /^  workspace:$/ {in_ws=0}
    in_devices && in_ws && /^    source: / {
      sub(/^    source: /,""); gsub(/^"|"$/,""); print; exit
    }
  '
}

agentjail-codex() {
  local inst="${AGENTJAIL_INSTANCE:-agent1}"
  if [[ $# -ge 1 ]] && incus info "$1" >/dev/null 2>&1; then
    inst="$1"; shift
  fi

  local workdir="${AGENTJAIL_WORKDIR:-/workspace}"
  local codex_cmd="${AGENTJAIL_CODEX_CMD:-codex}"

  # Ensure instance exists
  if ! incus info "$inst" >/dev/null 2>&1; then
    echo "agentjail-codex: instance '$inst' not found" >&2
    return 1
  fi

  # If host cwd != configured workspace source, repoint workspace to "here"
  local here ws
  here="$(pwd -P)"
  ws="$(agentjail-ws "$inst")"
  if [[ -n "$ws" && "$ws" != "$here" ]]; then
    agentjail-ws-here "$inst" || return 1
  fi

  # Ensure instance is running
  local status
  status="$(incus list "$inst" -f csv -c s 2>/dev/null | head -n1 | tr -d '\r')"
  case "$status" in
    RUNNING) ;;
    FROZEN)  incus unfreeze "$inst" || return 1 ;;
    *)       incus start "$inst" || return 1 ;;
  esac

  # Run codex as user "agent" in /workspace, with bash so PATH from ~/.bashrc is available.
  # Build a safely-quoted codex command line for PROMPT_COMMAND
  local pc
  # pc="unset PROMPT_COMMAND; cd $(printf %q "$workdir") && exec $(printf %q "$codex_cmd")"
  pc="unset PROMPT_COMMAND; cd $(printf %q "$workdir"); $(printf %q "$codex_cmd")"
  for a in "$@"; do
    pc+=" $(printf %q "$a")"
  done

  # Start an interactive login shell (like the manual workflow) and auto-exec codex.
  incus exec -t "$inst" --env "PROMPT_COMMAND=$pc" -- su -l -w PROMPT_COMMAND agent
}
```

The command `agentjail-ws-here` updates the `workspace` disk device so that the container sees your *current host directory* mounted at the container work directory (by default `/workspace`).
This is the key trick that lets you "bring the project you are standing in" into the jail without copying files.

The command `agentjail-ws` prints the currently configured `workspace` source path, meaning the host directory that is mounted into the container as the workspace.

> You can query this manually as well: `incus config device get agent1 workspace source`.

> Sometimes the `workspace` device is inherited from a profile. In that case, `incus config device get` might not show what you expect, because it only reads instance local configuration.
> The command below shows the fully expanded, merged configuration, including profile inherited devices:
> ```bash
> incus config show <instance> --expanded
> ```
>
> If you install Mike Farah's [yq](https://github.com/mikefarah/yq), you can extract just the relevant section more comfortably.
> ```bash
> # Install
> wget https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O "$HOME/.local/bin/yq" && chmod +x "$HOME/.local/bin/yq"
> # Extract
> incus config show agent1 --expanded | yq '.devices.workspace'
> ```

The command `agentjail-codex` is meant as a drop in replacement for `codex`. You run it the same way you used `codex` before. It does the following steps:

1. It checks that the instance exists, and starts it if needed.
2. It ensures the `workspace` mount points to your current host directory (like `agentjail-ws-here`).
3. It enters the jail, changes into the workspace directory inside the container, and starts Codex there.

All three functions support simple configuration:

* `AGENTJAIL_INSTANCE` sets the default instance name (the default is `agent1`).
* `AGENTJAIL_WORKDIR` sets the container path where the workspace is mounted (the default is `/workspace`).
* `AGENTJAIL_CODEX_CMD` sets the command that starts Codex inside the container (the default is `codex`, and it may also be an absolute path).

You can also pass the instance name as the first argument, as long as it matches an existing Incus instance. For example:

```bash
agentjail-codex agent2
```

This makes it easy to keep multiple jails around.

## Conclusion

This concludes the tutorial.
We built a practical risk mitigation setup for AI coding agents by running them inside an Incus system container jail.
The core idea is to keep the agent useful for real development work, while still controlling the most security relevant surfaces:
which files it can read and write, where it can connect on the network, and which credentials or tokens ever enter the container.

If you take only one lesson from this post, make it this: treat a coding agent like an external tool in your build chain: it should not automatically inherit trust or access to everything on your workstation.
With a small amount of isolation work, you can reduce the "supply chain style" risk significantly.

If you want to harden the jail further, here are a few concrete next steps:

* Keep the shared `/workspace` minimal. Only mount the project you are working on, not your whole home directory.
* Prefer read only mounts for configuration folders whenever possible, and only grant write access when you understand why it is needed.
* Consider limiting outbound network access even more. For example, allow only `https` and block all other egress.
* Add resource limits (CPU, memory, disk) so a runaway build or a bad prompt cannot overload your host.
* Rotate and scope tokens. Use short lived tokens, and avoid long lived credentials inside the jail.

None of these steps makes the setup "perfect", but each one reduces the blast radius if something goes wrong.

## Appendix

### `agent-jail-profile.yaml`

```yaml
name: agent-jail
description: "Incus system-container jail for coding agents (workspace mount + toolchains + resource limits + non-root)"

config:
  boot.autostart: "false"

  security.privileged: "false"
  security.nesting: "false"

  # Strongly recommended when you run multiple agent containers:
  security.idmap.isolated: "true"

  # Tune to taste
  limits.cpu: "2"
  limits.memory: 4GiB
  limits.memory.enforce: "hard"
  limits.processes: "2048"

  cloud-init.user-data: |
    #cloud-config
    output:
      all: "| tee -a /var/log/cloud-init-output.log"

    package_update: true
    package_upgrade: false

    apt:
      conf: |
        APT::Install-Recommends "0";
        APT::Install-Suggests "0";

    # IMPORTANT: set uid/gid to your host user's UID/GID if you want "host IDE continues smoothly".
    # If your host user is not 1000, change this.
    users:
      - name: agent
        gecos: "Coding Agent"
        shell: /bin/bash
        lock_passwd: true
        uid: 1000
        groups: [users]

    ssh_pwauth: false
    disable_root: true

    packages:
      - ca-certificates
      - curl
      - git
      - jq
      - unzip
      - zip
      - build-essential
      - pkg-config
      - libssl-dev
      - python3
      - python3-venv
      - iproute2
      - systemd-resolved
      - telnet
      - netcat-openbsd
      - nano
      - emacs-nox
      - less
      - wajig
      - tree
      - bash-completion
      - iputils-ping
      - libcap2-bin      

    write_files:
      # Environment wrapper (so automation can reliably load nvm/sdkman functions)
      - path: /usr/local/bin/agent-env
        owner: root:root
        permissions: "0755"
        content: |
          #!/usr/bin/env bash
          set -euo pipefail

          export HOME=/home/agent
          export USER=agent
          export LOGNAME=agent
          export PATH="$HOME/.local/bin:$PATH"

          export NVM_DIR="$HOME/.nvm"
          [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

          export SDKMAN_DIR="$HOME/.sdkman"
          if [ -s "$SDKMAN_DIR/bin/sdkman-init.sh" ]; then
            # sdkman-init.sh may reference unset vars; relax nounset while sourcing
            set +u
            . "$SDKMAN_DIR/bin/sdkman-init.sh"
            set -u
          fi

          cd /workspace 2>/dev/null || cd "$HOME"
          exec "$@"

      # Patch agent's bash init files without overwriting them wholesale.
      - path: /usr/local/sbin/agent-bashrc-patch
        owner: root:root
        permissions: "0755"
        content: |
          #!/usr/bin/env bash
          set -euo pipefail

          AGENT_HOME=/home/agent
          BRC="$AGENT_HOME/.bashrc"
          BPR="$AGENT_HOME/.bash_profile"
          PROF="$AGENT_HOME/.profile"

          # 1) Ensure baseline dotfiles exist (copy from /etc/skel only if missing)
          if [[ ! -f "$BRC" && -f /etc/skel/.bashrc ]]; then
            cp /etc/skel/.bashrc "$BRC"
            chown agent:agent "$BRC"
            chmod 0644 "$BRC"
          fi
          if [[ ! -f "$PROF" && -f /etc/skel/.profile ]]; then
            cp /etc/skel/.profile "$PROF"
            chown agent:agent "$PROF"
            chmod 0644 "$PROF"
          fi

          # If we still don't have a bashrc, create a minimal one.
          if [[ ! -f "$BRC" ]]; then
            cat >"$BRC" <<'EOF'
          # ~/.bashrc (minimal fallback)
          export EDITOR=emacs
          export PAGER=less
          alias ll='ls -alF'
          alias la='ls -A'
          alias l='ls -CF'
          alias gs='git status'
          alias ls='ls --color=auto'
          EOF
            chown agent:agent "$BRC"
            chmod 0644 "$BRC"
          fi

          # 2) Sed-based patching: enable common Debian goodies if present
          # Enable force_color_prompt=yes if present as commented line
          sed -i -E "s/^[[:space:]]*#[[:space:]]*(force_color_prompt=yes)/\1/" "$BRC"

          # Uncomment common alias lines if present (Debian ships them commented)
          sed -i -E "s/^[[:space:]]*#[[:space:]]*(alias (ll|la|l)=)/\1/" "$BRC"

          # Uncomment the dircolors block if it exists (range from 'if [ -x /usr/bin/dircolors ]' to 'fi')
          sed -i -E \
            "/^[[:space:]]*#?[[:space:]]*if[[:space:]]+\\[[[:space:]]+-x[[:space:]]+\\/usr\\/bin\\/dircolors[[:space:]]+\\];[[:space:]]*then/,/^[[:space:]]*#?[[:space:]]*fi[[:space:]]*$/{
              s/^[[:space:]]*#[[:space:]]?//
            }" "$BRC"

          # 3) Ensure a few practical defaults exist (append only if missing)
          grep -qE "^[[:space:]]*export[[:space:]]+EDITOR=" "$BRC" || echo "export EDITOR=emacs" >>"$BRC"
          grep -qE "^[[:space:]]*export[[:space:]]+PAGER="  "$BRC" || echo "export PAGER=less"  >>"$BRC"
          grep -qE "^[[:space:]]*alias[[:space:]]+gs="       "$BRC" || echo "alias gs='git status'" >>"$BRC"
          grep -qE "^[[:space:]]*alias[[:space:]]+ls=.*--color=auto" "$BRC" || echo "alias ls='ls --color=auto'" >>"$BRC"

          # Enable bash-completion (append only if missing and file exists)
          if [[ -f /usr/share/bash-completion/bash_completion ]]; then
            if ! grep -q "/usr/share/bash-completion/bash_completion" "$BRC"; then
              cat >>"$BRC" <<'EOF'

          if [ -f /usr/share/bash-completion/bash_completion ]; then
            . /usr/share/bash-completion/bash_completion
          fi
          EOF
            fi
          fi

          chown agent:agent "$BRC"

          # 4) Make sure login shells source ~/.bashrc
          if [[ ! -f "$BPR" ]]; then
            cat >"$BPR" <<'EOF'
          if [ -f "$HOME/.bashrc" ]; then
            . "$HOME/.bashrc"
          fi
          EOF
            chown agent:agent "$BPR"
            chmod 0644 "$BPR"
          else
            if ! grep -q "\.bashrc" "$BPR"; then
              cat >>"$BPR" <<'EOF'

          if [ -f "$HOME/.bashrc" ]; then
            . "$HOME/.bashrc"
          fi
          EOF
              chown agent:agent "$BPR"
            fi
          fi

          # 5) Ensure agent owns its home (cheap safety net)
          chown -R agent:agent "$AGENT_HOME"

      - path: /usr/local/sbin/install-quarto-rootless
        owner: root:root
        permissions: "0755"
        content: |
          #!/usr/bin/env bash
          set -euo pipefail

          QUARTO_VERSION=1.6.0
          INSTALL_BASE="/home/agent/.local/opt"
          mkdir -p "$INSTALL_BASE" "/home/agent/.local/bin"

          qarch="$(dpkg --print-architecture)"
          case "$qarch" in
            amd64|arm64) ;;
            *) echo "Unsupported Debian arch: $qarch" >&2; exit 1 ;;
          esac

          work="$INSTALL_BASE/quarto-$QUARTO_VERSION"
          rm -rf "$work"
          mkdir -p "$work"
          cd "$work"

          deb="quarto-${QUARTO_VERSION}-linux-${qarch}.deb"
          curl -fsSLo "$deb" "https://github.com/quarto-dev/quarto-cli/releases/download/v${QUARTO_VERSION}/${deb}"

          dpkg -x "$deb" .
          mv opt/quarto ./quarto
          rm -rf opt "$deb"

          ln -sf "$work/quarto/bin/quarto" "/home/agent/.local/bin/quarto"
          "/home/agent/.local/bin/quarto" --version

    runcmd:
      # Lock password login but keep key-based SSH (set password hash to '*')
      - [ usermod, -p, '*', agent ]

      # Patch bash init files (idempotent)
      - [ bash, -lc, "/usr/local/sbin/agent-bashrc-patch" ]

      # uv: disable PATH/profile modifications by installer.
      - [ su, -l, agent, -c, "env UV_NO_MODIFY_PATH=1 curl -LsSf https://astral.sh/uv/install.sh | sh" ]
      # Install a managed Python and also provide `python` + `python3` shims (experimental).
      - [ su, -l, agent, -c, "/usr/local/bin/agent-env uv python install 3.12 --default" ]
      # Optional: make uv prefer that version globally for uv commands (writes a global .python-version)
      - [ su, -l, agent, -c, "/usr/local/bin/agent-env uv python pin --global 3.12" ]

      # nvm (per-user install).
      - [ su, -l, agent, -c, "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash" ]
      - [ su, -l, agent, -c, "bash -lc 'source \"$HOME/.nvm/nvm.sh\" && nvm install --lts && nvm alias default \"lts/*\"'" ]
      # Install Codex CLI globally using that nvm node
      - [ su, -l, agent, -c, "bash -lc 'source \"$HOME/.nvm/nvm.sh\" && npm install -g @openai/codex@latest'" ]
      # Optional: sanity check (should not require auth)
      - [ su, -l, agent, -c, "bash -lc 'source \"$HOME/.nvm/nvm.sh\" && codex --version'" ]

      # sdkman install.
      - [ su, -l, agent, -c, "curl -s https://get.sdkman.io | bash" ]
      # install + set default JDK (Temurin 25 LTS) via SDKMAN
      - [ su, -l, agent, -c, "bash -lc 'source \"$HOME/.sdkman/bin/sdkman-init.sh\" && yes | sdk install java 25-tem && sdk default java 25-tem'" ]

      # Rust toolchain via rustup (no dotfile edits; minimal profile; stable default)
      - [ su, -l, agent, -c, "bash -lc 'set -e;
          curl -fsSL https://sh.rustup.rs | sh -s -- -y --no-modify-path --profile minimal --default-toolchain stable;
          mkdir -p \"$HOME/.local/bin\";
          ln -sf \"$HOME/.cargo/bin/rustup\" \"$HOME/.local/bin/rustup\";
          ln -sf \"$HOME/.cargo/bin/rustc\"  \"$HOME/.local/bin/rustc\";
          ln -sf \"$HOME/.cargo/bin/cargo\"  \"$HOME/.local/bin/cargo\";
          rustc -V; cargo -V
        '" ]
      - [ su, -l, agent, -c, "bash -lc 'set -e;
          \"$HOME/.cargo/bin/rustup\" component add rustfmt clippy
        '" ]

      # Go toolchain from go.dev/dl (user-local install; symlink into ~/.local/bin)
      - [ su, -l, agent, -c, "bash -lc 'set -e;
          GO_VERSION=1.26.0;
          ARCH=\"$(uname -m)\";
          case \"$ARCH\" in
            x86_64) GOARCH=amd64 ;;
            aarch64|arm64) GOARCH=arm64 ;;
            *) echo \"Unsupported arch: $ARCH\" >&2; exit 1 ;;
          esac;
          URL=\"https://go.dev/dl/go${GO_VERSION}.linux-${GOARCH}.tar.gz\";

          rm -rf \"$HOME/.local/go\";
          mkdir -p \"$HOME/.local\" \"$HOME/.local/bin\";
          curl -fsSL \"$URL\" -o /tmp/go.tgz;
          tar -C \"$HOME/.local\" -xzf /tmp/go.tgz;

          ln -sf \"$HOME/.local/go/bin/go\"    \"$HOME/.local/bin/go\";
          ln -sf \"$HOME/.local/go/bin/gofmt\" \"$HOME/.local/bin/gofmt\";
          go version
        '" ]

      # Rootless Quarto install (pinned version): download .deb, extract with dpkg -x, symlink into ~/.local/bin
      # https://nbdev.fast.ai/getting_started.html#q-why-is-nbdev-asking-for-root-access-how-do-i-install-quarto-without-root-access
      - [ su, -l, agent, -c, "/usr/local/sbin/install-quarto-rootless" ]

devices:
  # Attach to a dedicated jail bridge network (you create agentbr0 separately).
  eth0:
    type: nic
    name: eth0
    network: agentbr0

  # Workspace mount (override 'source' per container so one jail can't see another jail's work).
  workspace:
    type: disk
    source: /srv/agent-jails/default-workspace
    path: /workspace
    shift: "true"
```

### `project-orientation` Skill

In order to make the `project-orientation` skill work you have to put it in the following directory structure in your $HOME directory
```txt
.agents/
└── skills
    └── project-orientation
        └── SKILL.md
```

`SKILL.md`
```md
---
name: project-orientation
description: >
  Orient to an unfamiliar software repo (any language). Read AGENTS.md/README and build/config
  files (e.g., pyproject.toml, pom.xml, build.gradle, package.json, go.mod, Cargo.toml, *.ini/*.cfg),
  identify workflows, policies, commands, and risks. Output a concise "project brief" and
  "how to work here" checklist before making changes.
---

# Project orientation skill (cross-language)

## Intent
When invoked, perform a repo reconnaissance pass to understand:
- project purpose and architecture
- repo policies and constraints (especially AGENTS.md)
- build/test/lint/release workflows
- language/toolchain choices
- where to make changes safely

This skill is for *orientation*, not implementation. Do not start coding until you have produced the deliverables in **Step 8**.

## Safety / constraints
- Do not run destructive commands. Do not modify files during orientation.
- Prefer reading small, authoritative files over scanning the entire repo.
- Avoid reading large generated files (node_modules, dist, build, target, .venv, vendor, _proc, _site, coverage, .tox, .pytest_cache).
- If a file is huge, read only the header, TOC, or the most relevant sections.
- If policies conflict, treat the most specific repo policy (often AGENTS.md) as authoritative.

## Step 0 - Find repo root and ignore junk
1) Determine the repo root (prefer git root if available).
2) Identify and ignore common heavy dirs:
   - `.git/`, `node_modules/`, `dist/`, `build/`, `target/`, `.venv/`, `vendor/`, `_site/`, `_proc/`, `coverage/`, `.tox/`, `.pytest_cache/`

## Step 1 - Read top-level "authority" docs (in order)
Read if present, prioritizing in this order:
1) `AGENTS.md` (repo policy for assistants)
2) `README.md` / `README.rst`
3) `CONTRIBUTING.md`
4) `DEVELOPMENT.md`, `HACKING.md`, `docs/DEVELOPMENT.md`
5) `SECURITY.md`
6) `LICENSE` / `LICENSE.md`
7) `CODE_OF_CONDUCT.md`

Extract:
- explicit workflow commands (build/test/lint/docs)
- environment rules (package manager, toolchain, pinned versions)
- constraints (no README rewrite, no network, formatting rules, etc.)
- "definition of done" / review expectations

## Step 2 - Detect primary language(s) and toolchains
Scan for the presence of these "anchor files" and infer the dominant ecosystem(s).

### Python
- `pyproject.toml`, `requirements*.txt`, `setup.cfg`, `setup.py`, `tox.ini`, `uv.lock`, `poetry.lock`, `Pipfile`, `environment.yml`

### Java / Kotlin / JVM
- `pom.xml`, `build.gradle`, `build.gradle.kts`, `settings.gradle`, `gradle.properties`, `mvnw`, `gradlew`

### JavaScript / TypeScript
- `package.json`, `pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `turbo.json`, `nx.json`, `tsconfig.json`

### Go
- `go.mod`, `go.sum`, `Makefile`

### Rust
- `Cargo.toml`, `Cargo.lock`

### .NET
- `*.sln`, `*.csproj`, `*.fsproj`, `global.json`, `Directory.Build.props`

### Ruby
- `Gemfile`, `Gemfile.lock`, `Rakefile`

### PHP
- `composer.json`, `composer.lock`

### Elixir
- `mix.exs`, `mix.lock`

### C/C++
- `CMakeLists.txt`, `meson.build`, `Makefile`, `configure.ac`

If multiple ecosystems exist, classify:
- primary (core build)
- secondary (tooling/docs)
- examples/samples

## Step 3 - Read build files and extract runnable workflows
Read the relevant build/config files identified above (only what exists), focusing on:
- targets/scripts/commands
- test commands
- lint/format commands
- docs/build commands
- version constraints and toolchain pinning

What to extract per ecosystem:

### Python (`pyproject.toml` focus)
- build backend, project name, packages
- dependency groups (dev/test/docs)
- tool configs (ruff/black/isort/mypy/pytest)
- task runners (nox/tox/hatch/pdm/poetry)
- if `uv` is used: locate hints (`uv.lock`, docs, Makefile calling uv)

### Maven (`pom.xml`)
- modules, plugins (surefire/failsafe), profiles
- common commands: `mvn test`, `mvn -P... verify`

### Gradle (`build.gradle*`)
- tasks, test tasks, plugins
- common commands: `./gradlew test`, `./gradlew check`

### Node (`package.json`)
- scripts: `test`, `lint`, `build`, `typecheck`, `format`
- package manager: npm/yarn/pnpm (infer from lockfile)
- monorepo tools: pnpm workspaces, nx, turbo, lerna

### Go (`go.mod`)
- module name, go version
- common commands: `go test ./...`, `go vet`, `golangci-lint` (if present)

### Rust (`Cargo.toml`)
- workspace members, features
- common commands: `cargo test`, `cargo clippy`, `cargo fmt`

### .NET (`*.sln`, `*.csproj`, `global.json`)
- sdk version, test projects
- common commands: `dotnet test`, `dotnet build`

## Step 4 - Read "build glue" and automation configs
Read if present (prioritize top-level first):
- `Makefile`
- `Taskfile.yml`
- `justfile`
- `scripts/` (only list + read the most relevant entrypoints, not everything)
- `Dockerfile`, `docker-compose.yml`
- `.env.example`, `.envrc`, `direnv` config
- `pre-commit` config: `.pre-commit-config.yaml`

Extract:
- canonical developer workflows
- environment setup
- special flags (network, IPC, secrets)

## Step 5 - Read CI configs to confirm the truth
CI is often the most reliable "what actually runs".

Read if present:
- `.github/workflows/*.yml`
- `.gitlab-ci.yml`
- `azure-pipelines.yml`
- `.circleci/config.yml`
- `Jenkinsfile`

Extract:
- exact build/test/lint steps
- OS/runtime versions
- caching hints
- required services (DBs, containers)

If CI contradicts README: note the discrepancy.

## Step 6 - Identify repo structure and key entrypoints
Based on files found, identify:
- source roots (e.g., `src/`, `lib/`, `app/`, `cmd/`, `packages/`, `crates/`)
- tests location
- docs location
- configuration directories
- "public API" modules / packages

Also identify "hot" files likely to contain policies or constraints:
- `.editorconfig`
- formatting configs (`.ruff.toml`, `ruff.toml`, `pyproject` tool sections, `.eslintrc*`, `prettier*`)
- security or data handling policies

## Step 7 - Determine the safe default command set (do not run yet)
Propose a minimal set of commands to validate changes *later*, based on the repo's tooling:
- install/sync
- format/lint
- unit tests
- type checks
- build
- docs (only if part of standard pipeline)

Do not invent commands. Only propose commands discovered in:
- AGENTS.md/README/CONTRIBUTING
- Makefile/Taskfile/justfile
- package.json scripts
- CI configs

## Step 8 - Deliverables (must output before making changes)
Produce the following in the chat (structured, concise):

1) **Project brief**
   - what it is, who it's for, core functionality
2) **Tech stack**
   - languages, frameworks, build systems, package managers
3) **Repo map**
   - key directories + what lives there
4) **Policies / constraints**
   - anything in AGENTS.md, CONTRIBUTING, SECURITY
5) **Canonical workflows**
   - exact commands for: setup, build, test, lint/format, docs
6) **Risks / footguns**
   - e.g., README overwrite, generated files, vendored deps, lockfile rules, required env vars
7) **Open questions**
   - only if truly blocking; otherwise proceed with best-effort assumptions grounded in files read

## Step 9 - Permissions policy detection and interpretation

Purpose:
Identify whether the project explicitly authorizes network, IPC, filesystem, or other
privileged operations for standard workflows, and understand how those permissions
should be exercised.

### What to look for
When reading `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, or other policy documents,
actively search for:
- Sections titled or implying:
  - "Permissions policy"
  - "Authorization"
  - "Sandbox"
  - "Escalated permissions"
  - "Network / IPC access"
- Explicit allowlists of commands (e.g. `make`, `uv`, `nbdev`, `mvn`, `npm`, `cargo`)
- Notes about when escalated permissions are required vs optional
- Statements clarifying that authorization is *standing* and does not require re-confirmation

### How to interpret such policies
If a permissions policy is present:
- Treat it as **authoritative project policy**, not a suggestion.
- Distinguish between:
  - **Approval** (the project allows the action), and
  - **Mechanism** (the sandbox/tooling requires an "escalated" flag to execute it).
- Do **not** repeatedly ask the user for permission when the policy explicitly states
  that authorization is pre-approved or standing.
- Use escalated permissions **only** for the commands and contexts explicitly covered.
- Prefer normal permissions when the policy says they are sufficient.

### Reporting in the orientation output
Summarize the permissions policy explicitly in the orientation deliverables:
- What is pre-authorized (network, IPC, filesystem, caches, etc.)
- Which commands are covered by standing authorization
- When escalated permissions are required vs optional
- Any cache or environment constraints (e.g. mandated local caches, forbidden overrides)

Use clear language such as:
- "This project has a standing authorization for network + IPC during standard workflows."
- "Escalated permissions are a technical requirement, not a request for new approval."

### If no explicit permissions policy is found
- Assume **least privilege by default**.
- Avoid network/IPC unless required by the task.
- Ask the user before performing privileged operations.

Do not invent or assume authorization that is not documented.

## Finish

After delivering these, ask for the next task or proceed with the user's requested task using the discovered workflows.
```