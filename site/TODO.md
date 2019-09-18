
* mastodon social icon with link sharing
    * sharing button
* fed.brid.gy
* Link at bottom to mastodon identity
* POSSE:
    * hackernews
    * hackernoon
* create content:
    * iOS app without access to apple mac
    * indieweb experiences
        * set-up: domain, indie-auth, static-site, firebase / netlify
        * microformats
        * data-processing pipeline: webmention, ...
        * comment-system
* data privacy page

## Publishing

* publish: https://meta.discourse.org/t/embedding-discourse-comments-via-javascript/31963/306


* npx webmention https://weisser-zwerg.dev/posts/local-discourse-on-vagrant/ --limit 0 --debug
    * https://telegraph.p3k.io/dashboard
* pingback: https://webdevstudios.com/2017/12/12/google-chrome-63/
* pingback: https://blog.simos.info/how-to-use-lxd-container-hostnames-on-the-host-in-ubuntu-18-04/
* pingback: https://dotfiles.tnetconsulting.net/articles/2015/0506/empowering-openssh.html


* curl https://push.superfeedr.com/ -X POST -u cs224:pwd -d'hub.mode=search' -d'query=link:weisser-zwerg.dev'
    * does not work


* Medium

## Done; need re-check 

* SEO : Google Console
* firebase analytics


## webmention <-> ActivityPub <-> Mastodon

* documentation: https://fed.brid.gy
* https://brid.gy/github/cs224#
* article that should trigger the activity: https://weisser-zwerg.dev/posts/activity-pub-integration-via-fed-brid-gy/
* verify set-up of fed.brid.gy links (including query parameters):
    * https://weisser-zwerg.dev/.well-known/host-meta
        * https://weisser-zwerg.dev/.well-known/host-meta?resource=https%3A%2F%2Fweisser-zwerg.dev%2F
    * https://weisser-zwerg.dev/.well-known/host-meta.xrd
    * https://weisser-zwerg.dev/.well-known/host-meta.jrd
    * https://weisser-zwerg.dev/.well-known/webfinger
        * https://weisser-zwerg.dev/.well-known/webfinger?resource=https%3A%2F%2Fweisser-zwerg.dev%2F
    * resulution:
        * [Redirects on firebase with “?” query parametres](https://stackoverflow.com/questions/34981581/redirects-on-firebase-with-query-parametres)
        * [Firebase Hosting with dynamic cloud functions rewrites](https://stackoverflow.com/questions/44959652/firebase-hosting-with-dynamic-cloud-functions-rewrites/45224176#45224176)
        * [Firebase to the Rescue: Dynamic Routing via Hosting + Functions Integration](https://hackernoon.com/firebase-to-the-rescue-dynamic-routing-via-hosting-functions-integration-aef888ddf311)
        * [Firebase, url with variables redirects to main page](https://stackoverflow.com/questions/52712881/firebase-url-with-variables-redirects-to-main-page)
        * [firebase : full-config#redirects](https://firebase.google.com/docs/hosting/full-config#redirects)
* Trigger superfeedr update:
    * `npm run superfeedr`
* Trigger webmention on fed.brid.gy:
    * https://telegraph.p3k.io/dashboard
* Verify that fed.brid.gy did send out the message:
    * https://fed.brid.gy/responses
* Check that message appears on mastodon:
    * [cs224](https://mastodon.social/@cs224/102805835248700188)

