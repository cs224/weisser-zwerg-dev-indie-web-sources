---
layout: "layouts/post.njk"
title: "Local discourse: vagrant, ansible, lxd, docker, discourse-embedding"
description: "Local discourse instance on vagrant for your local tests to embed discourse in your front-end development project."
creationdate: 2019-09-17
keywords: vagrant, ansible, lxc, lxd, discourse, discourse-embedding
date: 2019-09-17
tags: ['post']
---

[Code on GitHub](https://github.com/cs224/local-discourse-on-vagrant)

## Why

I am working on a project where we consider to integrate [discourse](https://www.discourse.org/) for handling embedded discussions.
Just as an example, have a look at the [home-assistant blog](https://www.home-assistant.io/blog/2019/08/28/release-98/) and scroll to the very bottom.
They are using embedded discourse for that purpose.

For my local tests I wanted to set-up a local discourse instance.
In principle, this is not too difficult if you use the [developing-with-vagrant](https://github.com/discourse/discourse_docker#developing-with-vagrant) vagrant image
together with the [discourse_dev](https://github.com/discourse/discourse_docker/tree/master/image/discourse_dev) docker image. But first of all, this set-up does
not fulfill all the requirements for testing the embedding of discourse (DNS names, ...) and second I wanted to get a feeling of what it means to set-up a production 
instance of discourse. The discourse_dev image pre-populates the database so that you can focus on hacking discourse, e.g. it will not offer you this set-up experience.

## More problems than you think should be necessary ...

So I decided to follow the [INSTALL-cloud](https://github.com/discourse/discourse/blob/master/docs/INSTALL-cloud.md) instructions. If you do that on a
real host in the real world the instructions will work nicely. But in a local set-up I ran into more problems than I think should be necessary. These
problems are all a consequence of discourse's insistence on using real host-names. It will simply not work if you use raw IP addresses. The second
somehow related problem is that discourse embedding will only work if discourse runs as a sub-domain of your primary domain. The next problem that
follows along with this is that you have to ensure correct name resolution into the vagrant image and into the inner-most docker images, because
discourse will run in a docker image.

Initially I thought I'd use a simple `/etc/hosts` based set-up and use "mydomain.dev" or "mydomain.local", but [I found
out](https://webdevstudios.com/2017/12/12/google-chrome-63/) that chrome simply does not work with these top-level domains (Firefox was ok with
them). After some digging, I arrived at the conclusion that the only top-level domain (TLD) that worked for chrome is the `.test` TLD.

My projects code-name is `joto`. I therefore set-up my outer-most `/etc/hosts` file as follows:

    192.168.1.194    joto.test www.joto.test
    192.168.56.100   discourse.joto.test

I therefore can develop my front-end app on my outer-most computer and test the discourse integration. I will have to refer to my development web-site
as `joto.test`. The vagrant image gets the IP address 192.168.56.100 and I can refer to it as `discourse.joto.test`.

## Additional requirement: docker in LXD

If we were to decide to go live with discourse as our commenting system we'd get a server from one of the cloud providers and use LXD[^lxd] within
that server to encapsulate the different aspects of our application, like discourse. Then within that LXD container we would run the discourse docker
image.

Since I looked last time into the docker in LXC/LXD[^lxc-lxd] container topic a lot has happened and I was pleasantly surprised about the progress
they've made. You can run docker inside an unprivileged LXC/LXD container by now. Good (recent) articles about docker-in-lxd are the following two:

* [Docker in LXD Guest](https://www.devendortech.com/articles/Docker_in_LXD_Guest.html)
* [How can I run docker inside a LXD container?](https://lxd.readthedocs.io/en/latest/#how-can-i-run-docker-inside-a-lxd-container)

The final set-up[^code-on-github] will look as follows:

<object data="/img/local-discourse-on-vagrant-setup.svg" type="image/svg+xml" style="max-width: 100%">
<img src="/img/local-discourse-on-vagrant-setup.svg" alt="final set-up">
</object>

And all you have to do for that is:

    > git clone https://github.com/cs224/local-discourse-on-vagrant.git
    > cd local-discourse-on-vagrant
    > source env.sh
    > pushd 00-basebox             && vagrant up                 && popd
    > pushd 00-basebox             && ansible-playbook setup.yml && popd
    > pushd 10-community-discourse && ansible-playbook setup.yml && popd

And you're ready to go.

## tl;dr some details

### Pre-requisites

Before you can start you will need to install:

* [Virtualbox](https://www.virtualbox.org/wiki/Downloads)
* [vagrant](https://www.vagrantup.com/docs/installation/)
* [ansible](https://docs.ansible.com/ansible/latest/installation_guide/intro_installation.html)

You also need to set-up entries in your `/etc/hosts` file as already mentioned above:

    192.168.1.194    joto.test www.joto.test
    192.168.56.100   discourse.joto.test

I could have made a variable out of the `joto` part of the domain name, but as this is anyway only a local install it does not matter and I left it as
it is.

### Vagrant plugins

While this is not absolutely required the following two vagrant plugins help to ensure a smooth vagrant workflow:

    > vagrant plugin install vagrant-reload
    > vagrant plugin install vagrant-vbguest

### Vagrant Up

The first step is to get the vagrant box going. You do this via:

    > git clone https://github.com/cs224/local-discourse-on-vagrant.git
    > cd local-discourse-on-vagrant
    > source env.sh
    > cd 00-basebox
    > vagrant up

At that point you should be able to login to the base box via:

    > vagrant ssh

You should also be able to login directly via ssh (necessary for ansible to work properly). To verify that standard ssh login works please logout from
the vagrant box and try the following:

    > ssh-add ~/.vagrant.d/insecure_private_key
    > ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no vagrant@192.168.56.100
    > ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no -p 2222 vagrant@localhost

I don't know why the network interface `192.168.56.100` is not functional within vagrant from the start. I usually get the following error:

    ssh: connect to host 192.168.56.100 port 22: Protocol not available

To fix that I log-in into the vagrant box via `vagrant ssh` and ping the default route `192.168.56.1`:

    > vagrant ssh
    > ping 192.168.56.1

After that the login via raw ssh works for me reliably. I tried to find a solution via Google, but could not find one. If you happen to know how to fix this issue, please let me know.

Another issue, where I currently can't tell where it is coming from is the fact that I first have to perform a manual `apt-get update` before running
the ansible playbooks.  The ansible playbook is doing the exact same thing at its very start, but somehow it does not work. The issue is either in
connection with the vagrant boxes' network or with the ansible script. Again: if you happen to know how to fix this issue, please let me know.


    > vagrant ssh
    > sudo apt-get update

Without that I would get the following error message when I'd run ansible as shown further below:

    > TASK [00-base : install snapd] ********************************************************************
    > fatal: [master]: FAILED! => {"changed": false, "msg": "No package matching 'aptitude' is available"}


### Ansible playbook

#### Set-up the LXD environment and an LXC container

Before we can run the ansible playbook we'll have to install some ansible pre-requisites:

    > ansible-galaxy install -r requirements.yml

After that you should be able to execute the ansible playbook for the base install:

    > ansible-playbook setup.yml

This should run smoothly to the end where you should get an info message like:

    You can recreate the discourse-host via the following command: lxc launch -p ssh-vagrant-profile -p discourse-host-profile ubuntu:18.04 discourse-host

At this point you have a running lxd/lxc container inside your vagrant host and you can log-in:

    > vagrant ssh
    > lxc exec discourse-host -- sudo --login --user vagrant

You should see that you're inside the lxc container now because your prompt has changed from `vagrant@master` to `vagrant@discourse-host`:

    vagrant@master:~$ lxc exec discourse-host -- sudo --login --user vagrant
    To run a command as administrator (user "root"), use "sudo <command>".
    See "man sudo_root" for details.

    vagrant@discourse-host:~$

Via `ip a s` you should be able to verify that inside the lxc container you have now the IP address `10.100.1.40`:

    > ip a s

You should also be able to login from the vagrant box (`vagrant@master`) to the lxc container via ssh:

    > ssh -o UserKnownHostsFile=/dev/null -o StrictHostKeyChecking=no vagrant@discourse.joto.test

From the vagrant box you can issue a few lxc commands to look at some of the inner workings:

    > lxc list
    > lxc profile list
    > lxc profile show ssh-vagrant-profile
    > lxc profile show discourse-host-profile
    > lxc config show discourse-host
    > lxc config show --expanded discourse-host

The profiles contain all the information needed to (re-)create the container. In case that you're unhappy with the container you can easily and
quickly set-up another one via:

    > lxc delete --force discourse-host
    > lxc launch -p ssh-vagrant-profile -p discourse-host-profile ubuntu:18.04 discourse-host

When you execute the above commands then a pristine discourse-host is re-created within less than 20 seconds. This is possible, because the
ubuntu:18.04 image was already fetched earlier and it is cached now.

You can look at the disk image of the container via:

    > sudo su
    > cd /var/lib/lxd/storage-pools/default/containers/discourse-host/
    > du -sh .

The size of the image is something like `700M`.

#### Provisioning discourse within the LXC container

As next step we're ready to provision discourse within the LXC container. For that we have to change into the `10-community-discourse` directory:

    > cd 10-community-discourse

and we have to install some ansible pre-requisites:

    > ansible-galaxy install -r requirements.yml

After that you should be able to execute the ansible playbook for provisioning discourse inside the LXC container. Notice, that this works by proxying
the ssh commands that ansible issues towards the LXC container through the ssh connection established between your workstation (outermost host) and
the vagrant box. From your workstation (outermost host) the LXC container is not visible, e.g. you cannot do a `ping 10.100.1.40`. In a real-world
scenario, if you were to use a similar set-up in production, you would do it the same way. You would only make some ports of the LXC container
accessible to the outside world, but not route its IP address into the internet. A good article describing the details is [Running Ansible Through an
SSH Bastion Host](https://blog.scottlowe.org/2015/12/24/running-ansible-through-ssh-bastion-host/).

Here is how you execute the playbook.

    > ansible-playbook setup.yml

This will take some time (~ 10 minutes), because the set-up and configuration of discourse is not fast.

As discourse requires a working SMTP mail infrastructure the ansible playbook will also install [MailHog](https://github.com/mailhog/MailHog). This
will first of all prevent that any real e-mails get sent out and it will make all e-mails sent by discourse visible via a web UI.

After the playbook finishes you should be able to browse to http://discourse.joto.test/ and see the "register a new account to get started" screen. In
order to complete the registration workflow you need to get access to the [MailHog](https://github.com/mailhog/MailHog) instance running inside the
LXC container. I did not forward that port to the outside world and so you have to use the `local-discourse-on-vagrant/ssh-cmdline.sh` script. This
will use ssh port forwarding to make port 8025 available on your `localhost`: http://localhost:8025.

You could use the [LXD Proxy Device capability](https://www.linode.com/docs/applications/containers/beginners-guide-to-lxd/) to make `MailHog`
available on the discourse.joto.test address. I used the proxy device functionality to forwarded port 80 from the LXC container to the outside world.

Now you have everything to go through the "register a new account to get started" process. If you would go through that process for a real production
instance, you'd need to configure quite a lot of settings in discourse, but as you're only using it to get a feel for the discourse set-up you can go
quickly through the setting screens.

Once you're done I'll show you how to set-up the [embedding
functionality](https://meta.discourse.org/t/embedding-discourse-comments-via-javascript/31963) of discourse. There are again some pitfalls you have to
navigate around.

### Configure Admin > Customize > Embedding

In order to enable discourse for embedding you have to go to the admin console. This is the icon at the right top and if you click on it you see a
wrench symbol and the "Admin" entry. Once you click on it you see a head-line with the following entries: Dashboard, Settings, Users, Badges, Emails,
Logs, Customize, API, Backups, Plugins. You have to go to the "Customize" tab. When you do that a sub-headline opens with the following entries:
Themes, Colors, Text, Email, Email Style, User Fields, Emoji, Permalinks, Embedding. You will have guessed it: you have to pick "Embedding".

You have to use the `"+ Add Host"` button to add a config line. The entries to use are:

    Allowed Hosts    : joto.test
    Class Name       :
    Path Whitelist   : /.*
    Post to Category :

Our front-end app in which we want to embed discourse is a react.js application created with [`create-react-app`](https://create-react-app.dev/)
(CRA). Normally, under development mode, the local web-server of a CRA project serves the site on port 3000. With our current configuration you should
be able to access this local development server via http://joto.test:3000. I tried quite a bit around to see if I can include the port either into the
`Allowed Hosts` part of the embedding configuration or into the `Path Whitelist` part, but I was not able to get either working. Therefore, to enable
testing of the embedding, you have to serve your app on port 80. I do that via [`socat`](https://medium.com/@copyconstruct/socat-29453e9fc8a6) on the
outermost machine. You have to have sudo rights in order to do that:

    sudo socat tcp-listen:80,reuseaddr,fork tcp:localhost:3000

Next you have to continue to configure the embedding in discourse on the same page as where we configured the `"+ Add Host"` settings. You have to
configure the `Username for topic creation` setting to one of the users on the discourse instance who is allowed to create topics. For me this is:

    Username for topic creation : cs224

And **don't forget** to click the `"Save Embedding Settings"` button on the very bottom.

Finally you have to add the embedding block to your front-end web-app like so:

```html
<footer>
    <div id='discourse-comments'></div>

    <script type="text/javascript">
        window.DiscourseEmbed = { discourseUrl: 'http://discourse.joto.test/', discourseEmbedUrl: 'http://joto.test/page.name.html'};

        (function() {
            var d = document.createElement('script'); d.type = 'text/javascript'; d.async = true;
            d.src = window.DiscourseEmbed.discourseUrl + 'javascripts/embed.js';
            (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(d);
        })();
    </script>
</footer>
```

You have to adapt the `page.name.html` to your situation and templating mechanism. After that the embedding should work.

## Detours that did not workout

I tried to set-up functionality to enable container hostname resolution on the vagrant box as described in [How to use LXD container hostnames on the
host in Ubuntu 18.04](https://blog.simos.info/how-to-use-lxd-container-hostnames-on-the-host-in-ubuntu-18-04), but this caused a lot of headaches.  It
caused DNS loops that were correctly cut, but prevented the name resolution of configurations in outer `/etc/hosts` files[^dnsmasq] in the inner hosts. In the
end I stopped that attempt and simply configured the LXC container host names in the vagrant boxes `/etc/hosts` file. This functionality would only be
useful if you were to use dynamic IP addresses in LXC containers via DHCP or similar. As I am configuring the IP addresses statically that is not a
concern.

Another issue that the current set-up still seems to have is that [ansible
pipelining](https://docs.ansible.com/ansible/2.4/intro_configuration.html#pipelining)[^ansible-speed] does not seem to work, at least not according to
the results of following the [Check if Ansible pipelining is enabled /
working](https://stackoverflow.com/questions/43438519/check-if-ansible-pipelining-is-enabled-working) instructions. Perhaps this is related to using
the ssh [ProxyCommand](https://dotfiles.tnetconsulting.net/articles/2015/0506/empowering-openssh.html)? If you happen to know how to fix this issue,
please let me know.

## Footnotes

[^code-on-github]: [Code on GitHub](https://github.com/cs224/local-discourse-on-vagrant)

[^lxd]: [Linux Containers](https://linuxcontainers.org/lxd/introduction/): an operating-system-level virtualization

[^lxc-lxd]: LXC and LXD are two different command line interfaces to the same kernel functionalities: [linux
namespaces](https://en.wikipedia.org/wiki/Linux_namespaces) and [cgroups](https://en.wikipedia.org/wiki/Cgroups); I like LXD better, because of its
excellent [cloud-init](https://cloud-init.io/) support

[^dnsmasq]: LXD uses [dnsmasq](https://en.wikipedia.org/wiki/Dnsmasq) to serve entries in the outer `/etc/hosts` to the inner LXC containers.

[^ansible-speed]: A nice article in the context of pipelining is [How to Speed Up Your Ansible Playbooks Over
600%](https://www.toptechskills.com/ansible-tutorials-courses/speed-up-ansible-playbooks-pipelining-mitogen/). It compares the raw ansible vs. ansible
pipelining vs. [mitogen](https://networkgenomics.com/ansible/). I did not try to set-up mitogen, though.
