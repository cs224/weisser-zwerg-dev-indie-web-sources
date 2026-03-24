---
layout: "layouts/post-with-toc.njk"
title: "Web Application Architecture Experiment: FastHTML-Plus"
description: 'A JAM-stack variation using HTML, HTMX, Python, FastHTML, Traefik, Authelia, and Docker Compose.'
# seodescription: ""
creationdate: 2026-03-24
keywords: HTML, HTMX, Python, FastHTML, Traefik, Authelia, Docker Compose, JAM stack, JavaScript
date: 2026-03-24
tags: ['post']
---

This blog post is part of the [Odysseys in Software Engineering](../series-odysseys-in-software-engineering) series.

## Rationale

I always say that the reason why there is such a proliferation of web application frameworks is that it is too simple of a problem.
If web app frameworks were hard, we would have fewer of them.
The web framework explosion is proof that it sits in the "flow zone": enough moving parts to be interesting, but simple enough that everyone can reassemble them differently and still feel confident about their choices.
That is the [law of triviality](https://en.wikipedia.org/wiki/Law_of_triviality): lots of surface area, lots of taste decisions, and no single "correct" answer.

I have been rolling my eyes at this for years, while also carrying my own "I would do it like this" idea for more than 20 years.
Now I am doing the thing I usually mock: presenting yet another architecture experiment.
FastHTML-Plus is my bikeshed: It is a [JAM](https://en.wikipedia.org/wiki/JAMstack) style approach that keeps "Markup" literal, keeps JavaScript small, and pushes dynamic behavior into HTML fragments and explicit APIs.
It also combines two goals that often fight each other: it gets out of your way while developing, and still is up to the task to run as a serious production deployment.
FastHTML-Plus achieves this feat with a multi layer "onion" layout.

> Many teams interpret [JAM](https://en.wikipedia.org/wiki/JAMstack) as "a large client side application plus APIs".
> This experiment tests a different interpretation: markup stays the main integration format, and server rendered HTML fragments are a first class response type.

You will see a multi layer setup where web development with plain HTML plus JavaScript can run from the `file://` protocol, without even starting a web server.
[HTMX](https://htmx.org/) then upgrades that same HTML with dynamic server driven fragment swaps.
A Python [FastHTML](https://fastht.ml/) backend handles server side behavior when you need it.
Authentication sits outside the app behind [Traefik](https://traefik.io/) and [Authelia](https://www.authelia.com/).

The twist is that these layers are not just "conceptually separated" in a diagram.
They are meant to be independently useful on day one, and still remain useful later when the project gets bigger.
The same pages you open directly from disk are the pages the backend serves.
When you add HTMX, the backend returns HTML fragments for HTMX interactions, instead of returning only JSON and then requiring a frontend framework to render everything.
At the same time, the backend also exposes canonical JSON endpoints under `/api/*`, so you can keep API style development for cases where it makes sense.

If this sounds abstract, here are some concrete things you can expect as you read on.

* You will run the frontend as literal files, click around, and refine UI layout and small behaviors, without a server and without a build pipeline that forces you into a framework early.
* You will then start a small Python backend and watch HTMX swap HTML fragments into the page, so you get dynamic behavior while still thinking in HTML.
* You will then put Traefik and Authelia in front, log in through a real authentication flow, and see how the backend receives identity, decides authorization, and rejects spoofed headers.

### Layer 1: Frontend only, `file://` first

In the innermost frontend layer, pure HTML, CSS, and JavaScript or TypeScript development can happen, and you can verify UI structure and basic interactions like in a click through mockup.
HTMX uses extra HTML attributes that act as glue between frontend and backend, but they do not block you while you are doing pure web work.
When you open the page via `file://`, those attributes are simply inert metadata in the HTML.
That means you can work on layout, styling, and local interactions without needing a running backend process.

This layer:
- should be independently productive with static HTML + TypeScript.
- should run directly via `file://` without requiring a backend process.
- stays [HTMX](https://htmx.org/)-compatible so backend integration works when available.

> HTMX uses custom attributes such as `hx-get`, `hx-post`, `hx-target`, and `hx-swap`.
> These are not part of the HTML standard vocabulary, but browsers accept unknown attributes and keep them in the DOM,
> so the [HTMX](https://htmx.org/) JavaScript library can attach behavior without requiring custom elements or a build step.
> The result is "HTML driven" interactivity: the HTML describes what to fetch and where to place it.


### Layer 2: Backend, two modes for two different tasks

The next layer is the backend layer, and it comes in two flavors: **functional backend mode** and **access/authz backend mode**.

#### Functional Backend Mode

In functional backend mode, you start the backend as a plain Python process that serves the app on port `5001` on `localhost`.
Authentication and authorization are intentionally disabled (private routes are allowed with local development identity), so you can focus on building features and user flows without auth logic interrupting every request.
This mode is meant for fast iteration while you are still shaping behavior and UI and where you want the shortest feedback loop: change code, refresh, repeat.

This layer has two main properties:

* It uses FastHTML to serve the static files from `../010-web/`, and HTMX driven interactions return HTML fragments.
* It offers hot reload, and it keeps server side sessions persistent across process restart and reload (unless the session data shape changes).
* It offers JSON APIs under `/api/public/*` and `/api/private/*`.

#### Access/Authz backend mode

FastHTML-Plus is also an experiment in reducing the amount of security code you write in the app itself by moving login and session handling outward.
Traefik and Authelia sit in front of the app in the outer layers, so the backend can focus on authorization decisions and on what it should trust from the proxy, instead of re implementing sign in flows, cookie policies, and redirect edge cases.

In access/authz backend mode, you still run the backend as a plain Python process, but you bind it on `<docker-host-gateway-ip>:5001` so a small Docker Compose stack can reach it.
That stack runs [Traefik](https://traefik.io/) and [Authelia](https://www.authelia.com/), performs authentication, and forwards requests to the backend.
You start this mode with `make run-systems`, which auto detects the Docker host gateway IP and binds the backend so Traefik can route to it.

In this mode you get a realistic request path while still keeping debugging simple.
You can set breakpoints in your IDE, follow requests end to end, and verify what happens for `/public` versus `/private`.
The app entrypoint is `https://app.localhost:8080` with a valid local SSL certificate.
The Authelia portal is exposed at `https://auth.app.localhost:8080`.

This layer is designed for verifying the "real" runtime behavior while still keeping debugging simple:

* It uses FastHTML to serve the static files from `../010-web/`, and HTMX driven interactions return HTML fragments.
* It offers hot reload, and it keeps server side sessions persistent across process restart and reload (unless the session data shape changes).
* It offers JSON APIs under `/api/public/*` and `/api/private/*`.
* It aims to keep access and authorization checks declarative in backend code.
* It aims to keep IDE debugging practical, including breakpoints in PyCharm or similar tools.
* It uses an app entrypoint `https://app.localhost:8080` with a valid local SSL certificate, where:
  * `/public` is unprotected
  * `/private` requires login, via Traefik ForwardAuth to Authelia
* It exposes the Authelia portal through Traefik at `https://auth.app.localhost:8080`

> "ForwardAuth" means the reverse proxy asks an external service, here Authelia, whether a request is authenticated.
> If the user is not authenticated, Authelia triggers a login flow.
> If the user is authenticated, Authelia returns headers that carry identity information to the backend.
> This keeps the app free of login pages and cookie handling, but it requires a clear trust model for forwarded identity.

### Layer 3: Integration tests in a production like container

The next layer is the integration test layer.
It uses an Incus container to deploy the complete, production like Docker Compose stack and exposes it on your host as `https://fasthtml-plus-integration-test.incus` with a valid SSL certificate.
This is where you verify that the whole system behaves like a real deployment and it allows you to run integration tests against this environment.

This layer makes three main changes compared to the development layers:

* It builds a Docker image for the frontend and backend.
* It switches to Redis as the session store.
* It runs the whole app as a Docker Compose stack that supports scaling via [Uvicorn](https://uvicorn.dev/) [workers](https://fastapi.tiangolo.com/deployment/server-workers/) and container [replicas](https://docs.docker.com/reference/cli/docker/compose/scale/)[^replicas].

### Layer 4: Production deployment on the public internet

The final layer is the production layer that you deploy on the public internet.
The main difference from the integration test layer is SSL certificate handling: production uses [Let's Encrypt](https://letsencrypt.org/) certificates for your real domain.

### Security and configuration are part of the experiment

This stack also pays attention to security and operational concerns that usually appear later, when an experiment becomes an actual project.
For example, if identity arrives via forwarded headers from Authelia, how do you prevent header spoofing by a direct client request?
How do you keep the trust rules explicit, instead of letting them spread across many files and many conditions?
And how do you keep the configuration surface small enough that you can still understand it after a few months?

### Why this is worth reading

The whole stack keeps an eye on issues that tend to get ignored in architecture sketches, but show up fast in real projects.
If you read on, expect a guided tour of the FastHTML-Plus architecture and its "onion" layout, using a minimal end to end request flow to show the moving parts in action:

> public page → authentication → an HTMX fragment swap or an API call → the FastHTML backend response.

The intent of this approach is productivity through fast iterations: you should only carry the complexity that is relevant for the task at hand,
while still providing a clear path for the higher complexity stages like authentication, authorization, and scaling.

> Reaching simplicity[^simplemadeeasy] by ignoring essential complexity[^incidentalcomplexity] is self delusion.

The goal is not to claim a universal solution.
The goal is to put one set of taste decisions into code, so we can talk about tradeoffs with evidence instead of opinions.

## FastHTML-Plus on GitHub

The prototype described in this post lives as its own public repository at:
[cs224/fasthtml-plus](https://github.com/cs224/fasthtml-plus).

You can also try the project as a live demo at <http://fasthtml-plus.weisser-zwerg.dev/index.html>.
For authentication, use the username `dev` and the password `dev`.
If you want to open the authentication portal directly, or log out, you can visit the [Authelia](https://www.authelia.com/) page at <https://auth.fasthtml-plus.weisser-zwerg.dev/>.
This is useful because it lets you see the separation between the application itself and the external authentication layer.
That separation is one of the main ideas behind the experiment.

The repository README is intentionally shorter than this article.
It gives you the shape of the project, the main commands, and the quick path through the layers.
This post is where I explain the rationale in more detail and where I try to make the tradeoffs explicit.

What matters is that the GitHub repository is a runnable reference implementation of the architecture experiment.
You can clone it, start from the innermost layer, and then move outward one shell at a time until you reach a production-like deployment path.

### What you actually get in the repository

The repository is organized around the onion layout itself:

```text
.
├── 010-dev/
│   ├── 0010-systems/
│   └── 0100-app/
│       ├── 010-web/
│       └── 020-fasthtml/
├── 020-ops/
├── 050-integration-tests/
└── AUTHENTICATION-AND-AUTHORIZATION.md
```

Each directory corresponds to a layer with its own job and its own workflow.

* `010-dev/0100-app/010-web/` is the frontend-only layer.
  It contains static HTML, CSS, and TypeScript.
  The browser can open these pages directly from `file://`, which means you can work on markup, styling, and small client-side behavior before a backend exists.

* `010-dev/0100-app/020-fasthtml/` is the [FastHTML](https://www.fastht.ml/) backend layer.
  It serves the same frontend files, returns HTML fragments for [HTMX](https://htmx.org/) interactions, and exposes JSON APIs under `/api/public/*` and `/api/private/*`.

* `010-dev/0010-systems/` is the local auth and reverse proxy layer.
  It runs Traefik and Authelia in Docker Compose and lets you test a realistic authentication flow at `https://app.localhost:8080` with a valid local SSL certificate.

* `020-ops/` is where rendering and deployment logic lives.
  This is the source of truth for generated Traefik and Authelia configuration and for the deployment scripts used in integration and production profiles.  
  `020-ops/` is render/deploy tooling only. There is no standalone local runtime workflow in `020-ops`.

* `050-integration-tests/` is the outer verification layer.
  It deploys the complete stack into an Incus container and runs HTTPS integration tests against the result.

If you are reading this as an architecture document, the important point is that the repository shape mirrors the mental model: frontend, backend, auth, and deployment concerns.

### Prerequisites

Before you clone the repository and start running the layers, you need a few tools.
The requirements follow the onion layout.

For the innermost frontend and backend work, the two main tools are:

* [nvm](https://github.com/nvm-sh/nvm), so the frontend can use the pinned Node.js version expected by the repository.
  The frontend layer is intentionally small, but it still has a real build step and a real dependency tree.
* [uv](https://docs.astral.sh/uv/), which manages the Python environments for the FastHTML backend, the ops tooling, and the integration tests.
  I use `uv` here because I want the Python workflow to stay fast and explicit without falling back to a global interpreter setup.

Once you move outward to the local auth and reverse-proxy layer, you also need:

* [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/), because Traefik and Authelia run as containers in the local systems setup.
* [mkcert](https://mkcert.dev/), plus `libnss3-tools` on Debian or Ubuntu style systems, if you want trusted local TLS for `app.localhost` and `auth.app.localhost`.

The repository also includes an optional tmux-based workflow for the local systems shell.
So if you want that convenience, you should also have [tmux](https://github.com/tmux/tmux/wiki) installed.

Finally, if you want to run the outer integration-test layer exactly as the repository defines it, you also need [Incus](https://linuxcontainers.org/incus/).
That layer deploys the stack into a fresh container, gives it real HTTPS entrypoints on `*.incus` domains, and then runs integration tests against that deployed result.

So the dependency story is deliberately incremental:

* frontend only: `nvm`
* backend development: `nvm` + `uv`
* local auth and proxy flow: `nvm` + `uv` + Docker + Docker Compose + `mkcert`
* full integration path: all of the above, plus Incus

### The shortest path through the onion

The repository README gives a very direct path through the layers.
That path is also the path I recommend for understanding the architecture.

#### Step 1: Start with literal files

In the frontend directory you run:

```bash
cd 010-dev/0100-app/010-web
nvm install
nvm use
npm ci
npm run build
```

After that you can open:

* `file://.../index.html`
* `file://.../public.html`
* `file://.../private.html`

> On the Linux command line, you can use `browse index.html`, or a similar command, to open the page in your default browser.

This is the most opinionated part of the whole experiment.
I want the innermost layer to be useful even when there is no server.
That forces the frontend to remain simple enough that it can still function as actual files, instead of assuming an application server and a large client-side framework from the first minute.

> I have long held the view that you should be able to work on the visual design of an application without starting development tooling or extra infrastructure.
> Just HTML, CSS, and a small amount of JavaScript.
> That also means this layer can serve as a click through mockup from day one.

If you prefer to view the same frontend through a local development server at this stage, run:

> `npm run dev`

Then open [http://localhost:5173/](http://localhost:5173/) in your browser to load the application through the [Vite](https://vite.dev/) development server.
This is useful when you want fast [TypeScript](https://www.typescriptlang.org/) rebuilds during frontend work, or when your browser applies stricter rules to local files than you want to deal with during a given session.

You can work on this innermost onion layer in [WebStorm](https://www.jetbrains.com/webstorm/) by opening the project like this:

> `webstorm 010-web/`

That editor choice fits this layer well because the work here is still mostly about HTML, CSS, JavaScript or TypeScript, and page structure.
At this point, you do not yet need the Python backend, reverse proxy, or authentication stack to make progress.

The build emits two JavaScript bundles:

* `dist/main.js` for the normal module path
* `dist/main.file.js` for browsers that are hostile to module loading from `file://`

HTMX is also copied into `dist/vendor/htmx.min.js`, so even the "frontend only" layer can be opened offline without relying on a CDN.

#### Step 2: Add a backend without changing the pages

Next, move into the FastHTML backend:

```bash
cd 010-dev/0100-app/020-fasthtml
uv sync
uv run pytest
# Functional mode (RUN_LOCAL=1) on 127.0.0.1:5001
make run-local
```

Then open [http://127.0.0.1:5001/](http://127.0.0.1:5001/) in your browser.
At this point, the same application is now served through the Python backend, using the [Uvicorn](https://uvicorn.dev/) web server that [FastHTML](https://fastht.ml/) builds on.
You are now taking the same pages that you created in step 1 and place them behind a server that can return HTMX fragments, handle sessions, and expose APIs.

> You can read more about [FastHTML's tech stack](https://fastht.ml/about/tech) if you want more background.

At this stage, the pages are no longer just files opened from disk.
The backend serves them, and the application starts to behave dynamically.
HTMX requests can now fetch server rendered HTML fragments, and the backend can also respond to API calls.

> [HTMX](https://htmx.org/) uses custom attributes such as `hx-get`, `hx-post`, `hx-target`, and `hx-swap`.
> These are not part of the HTML standard vocabulary, but browsers accept unknown attributes and keep them in the DOM,
> so the HTMX JavaScript library can attach behavior without requiring custom elements or a build step.
> The result is "HTML driven" interactivity: the HTML describes what to fetch and where to place it.

The frontend is still the same.
That is one of the central design choices in FastHTML-Plus.
The backend adds behavior, but it does not force a change in how the pages are authored.
The HTML remains the primary integration surface, first as static files, and then as server served pages with incremental dynamic behavior.

The backend has three responsibilities in this mode:

* it serves the static files from the frontend directory
* it returns HTML fragments for HTMX endpoints
* it exposes JSON APIs where API style interaction is the better fit

This is where the experiment moves away from the common "JSON everywhere" reflex.
For HTMX interactions, the backend returns literal HTML fragments.

> FastHTML supports a domain specific language, or DSL ([FastTags](https://www.fastht.ml/docs/explains/explaining_xt_components.html)), for constructing HTML output, but in this project I prefer to work with raw HTML as Python strings.

That choice keeps the response format close to the thing the browser will actually render.
For many user interface updates, the response is still markup, not a JSON payload that some client side state layer must interpret and turn into DOM changes.
This does not remove JavaScript from the project.
It changes where complexity lives.
Small client side behaviors can still exist, but the server can directly return the next piece of interface when that is the simpler option.

At the same time, this is not an anti API position.
The repository also defines canonical JSON routes under `/api/public/*` and `/api/private/*`.
The point is not to ban JSON.
The point is to avoid pretending that every interaction is best modeled as a client side state transition.
Some interactions are better expressed as "give me the next HTML fragment," while others are better expressed as "give me structured data."
This experiment makes room for both.

You can work on this Python onion layer in [PyCharm](https://www.jetbrains.com/pycharm/) by first generating the shared IDE run configurations:

> `make ide-configs` (or `make ide-configs-vscode` if you prefer)

Then open the project like this:

> `pycharm 020-fasthtml/`

I call this onion layer the *functional development mode* because it lets you work on application behavior without dealing with authentication or authorization yet.
The focus here is on useful functionality, request flows, and page behavior.
In this mode, authentication and authorization are disabled on purpose (private routes are allowed with local development identity).

> The application detects this mode through the `RUN_LOCAL=1` environment variable.  
> The safe default is the opposite: if this variable is not set, or if it is set to `RUN_LOCAL=0`, authentication and authorization stay enabled.

There is also a `make run-local-reload` mode that starts `uvicorn` with `--reload`.
This is not magic, though.
It simply detects file changes and restarts the application.

Normally, a restart would also reset in memory application state.
That is why FastHTML-Plus includes a `SqliteSessionStore`, which keeps session data persistent across application restarts.
This makes reload based development more practical, because you can change backend code, let the server restart, and still continue testing flows that depend on session state.

This works only as long as the shapes of the stored data structures remain compatible.
After larger changes to those structures, you may need to start with a clean session.
In that case, run:

> `make clear-sessions`

#### Step 3: Turn auth on without turning the app into an auth framework

Next, we enter the systems layer.
Here, I use the word "system" to mean an off the shelf stateful service such as a database management system (DBMS), a message queue (MQ), or, in this case, an authentication system like [Authelia](https://www.authelia.com/).

Ideally, such systems run as Docker containers and can be started together with Docker Compose.
In this architecture experiment, the systems layer is still small.
For now, it consists only of [Traefik](https://traefik.io/) as the reverse proxy and [Authelia](https://www.authelia.com/) for identity management and authentication.
In a real application, you would usually add more services at this point, especially a database.
Later, starting with the Incus integration-test profile and continuing into production, the project switches to [Redis](https://redis.io/) backed sessions (see `RedisSessionStore`) for the scaled deployment path, where the application runs in multiple containers behind load balancing.

> That is the reason Redis does not appear in the earlier stages.
> A single local backend process can keep its session story much simpler as we do with the `SqliteSessionStore`.
> As soon as you scale horizontally, session state must move out of the individual application process and into shared storage.

At this stage, we also switch to real HTTPS connections.
To make that work locally, the project uses [mkcert](https://github.com/FiloSottile/mkcert), a small tool for creating locally trusted development certificates for custom hostnames.

> This matters because the setup now uses domain names such as `app.localhost` and `auth.app.localhost`, and authentication flows are much easier to test when the browser sees a certificate it actually trusts.

As a first step, install the required tools on Ubuntu or Debian:

> `sudo apt update && sudo apt install -y mkcert libnss3-tools`

Then run the following command once as your normal user:

> `mkcert -install`

This installs a root certificate authority for your local machine into the relevant trust stores, so your browser will accept the local TLS certificates generated by `mkcert`.

Once that is done, continue with the following commands. In one shell, start the systems layer:

```bash
cd 010-dev/0010-systems
make certs
make render-config
make check-sync
make up
```

> One repository detail to note: `010-dev/0010-systems/` contains rendered Traefik and Authelia files, while the source of truth lives in `020-ops/templates/` plus the environment profiles.

In another shell, start the FastHTML backend in systems mode:

```bash
cd 010-dev/0100-app/020-fasthtml
make run-systems
```

> `make run-systems` binds the backend on the [Docker host-gateway IP](https://docs.docker.com/reference/cli/dockerd/#configure-host-gateway-ip) so Traefik can reach it via `host.docker.internal:5001`, and it provides the proxy secret (see [`X-Proxy-Secret`](#the-auth-trust-model)) that the backend expects before it will trust forwarded identity.

Now you can visit these URLs:

* [https://app.localhost:8080/public](https://app.localhost:8080/public)
* [https://app.localhost:8080/private](https://app.localhost:8080/private)
* [https://auth.app.localhost:8080](https://auth.app.localhost:8080)

This is the point where the trust model becomes concrete.
Traefik and Authelia handle the authentication flow.
The backend no longer needs to own login forms, redirect logic, or the cookie handling performed by the identity layer.
Instead, the backend has a narrower responsibility, which I think is easier to reason about and easier to maintain over time.
The application can focus on authorization decisions inside business logic, while the proxy and authentication service handle the mechanics of proving who the user is.

In this setup, the backend is responsible for the following things:

* deciding which routes are public
* deciding which routes require an authenticated identity
* deciding which forwarded identity headers are trustworthy
* deciding on authorization based on the forwarded identity headers

Deciding which forwarded identity headers are trustworthy matters.
If you move authentication outward, you must be very clear about how the application decides whether a `Remote-User` style header came from a trusted proxy or from a client trying to spoof it.
FastHTML-Plus makes that explicit with header sanitization at the proxy and a proxy-secret proof between Traefik and the backend (see [The auth trust model](#the-auth-trust-model) for details).

> Moving auth out of the app does not remove security work.
> It changes the shape of the security work.
> The challenge becomes trust boundaries and configuration discipline, not building another login system by hand.

I call this onion layer the *access/authz mode* because you still work with the backend as a normal [Python](https://www.python.org/) process, and you can still run it under debugger control if you want.
Authentication is handled by [Authelia](https://www.authelia.com/), while authorization remains explicit in backend code through `@public` or `@authenticated(...)` decorators.
The `@authenticated(authorize=...)` form accepts an authorization function, a small function that receives the identity of the authenticated user and returns yes or no to decide whether access should be allowed.
This keeps authorization rules close to the route or feature they protect, instead of hiding them deep inside middleware chains or scattered configuration files.

#### Step 4: Same request model, different packaging

After the local systems layer, the next change is a new packaging and verification model.
The important path stays the same: Traefik sits at the edge, Authelia handles authentication where needed, and the FastHTML backend still serves pages, fragments, and APIs behind that boundary.
What changes now is that the whole setup is assembled and exercised as one deployed docker-compose system instead of as a collection of local development shells.

In the integration-test layer, the stack runs inside an Incus container named `fasthtml-plus-integration-test`, based on `images:debian/trixie/cloud`.
The profile provisions Docker, `uv`, and Node tooling via cloud-init, mounts the repository read-only at `/workspace/fasthtml-plus-original`, and then works from a fresh clone at `/workspace/fasthtml-plus-clone`.
That detail matters because this layer is a reproducible environment that starts from a clean deployment snapshot.

At this stage, the project also moves to real HTTPS entrypoints on `.incus` domains.
The integration runbook wires local DNS so `fasthtml-plus-integration-test.incus` resolves from the Incus instance name, and `auth.fasthtml-plus-integration-test.incus` resolves as an alias for the auth host.
TLS for this layer is handled with `mkcert`, not with Let's Encrypt, because this is still a local integration environment rather than a public deployment.

This layer is also where the scaling story starts to become real.
The integration deployment switches to Redis-backed sessions, supports multiple application replicas, and includes automated checks for both the basic HTTPS flow and the scaled path.
In concrete terms, `make test` checks the deployed HTTPS endpoints and auth redirects, while `make test-scale` verifies that requests are served by multiple app instances and that one session still behaves consistently across those instances.

The detailed runbook for the integration-test setup lives in [`050-integration-tests/`](https://github.com/cs224/fasthtml-plus/tree/main/050-integration-tests).

#### Step 5: Production deployment to a VPS

Production keeps the same architecture shape, but changes the certificate and domain story.
The integration layer uses locally trusted certificates for `.incus` domains.
Production uses public hostnames and [Let's Encrypt](https://letsencrypt.org/).
I like this because the jump from integration to production stays small.

The runtime stack is deployed under `/opt/fasthtml-plus` on the VPS and does not run directly from the development tree (see below).
The generated runtime files live there, including the `docker-compose.yml`, the rendered Traefik and Authelia configuration, the runtime `.env`, and the bind-mounted data directories.

One detail I find elegant here is the transport step from local machine to VPS.
The deployment flow does not depend on the VPS having direct access to some central Git hosting service.
Instead, you can seed a bare Git repository on the VPS, push your local repository into it, and then create a fresh clone on the server from that pushed state.
That means the VPS builds from the exact Git snapshot you chose to send, instead of from a hand copied directory or from an environment that may differ from your local working tree.

From that clone, the deployment tooling builds the Docker image of the actual FastHTML-Plus application on the VPS itself.
That image is then referenced by the production Docker Compose stack that runs under `/opt/fasthtml-plus`.
I like this because it keeps a clear separation between source checkout, image build, and runtime stack.
The VPS does not run "from the repo".
It runs from a built image plus rendered runtime configuration.

At this stage, the stack also uses the scaled session story, not the local one.
That means Redis backed sessions instead of the local SQLite session store, together with multiple FastHTML-Plus replicas and multiple Uvicorn workers.
This is where the project becomes a real production deployment: TLS, reverse proxying, authentication, shared session state, and replication all interact at the same time.

This setup is also well prepared for incremental updates.
When you want to deploy a new version, you can push the repository to the VPS again, update the clone, and run the deployment flow again from that new Git state.
If a production stack already exists, the tooling does not just overwrite it and hope for the best.
Instead, it renders the new runtime state, compares it to what is already deployed, and produces a patch style diff for review first.
That gives you a controlled "inspect, then apply" workflow instead of a blind replacement workflow.

One detail I like here is that updates are treated conservatively.
The deployment tooling is designed to render and compare the runtime state, and if a stack already exists, the flow becomes review first rather than "blindly replace everything".
That fits the general tone of the project.
The goal is to keep the moving parts visible so that you can reason about them.

So production is the outermost onion layer and it is the point where the earlier layers have to prove that they are up to the task of real production workloads.

The detailed production deployment runbook lives in [`020-ops/DEPLOY.md`](https://github.com/cs224/fasthtml-plus/blob/main/020-ops/DEPLOY.md).
That document covers VPS bootstrap, seeding the clone, running the deploy script, verifying routes and certificates, and running a full clean redeploy plus validation cycle.

## What is unusual here, on purpose

There are several decisions in this repository that are deliberate deviations from current default fashion.

### The same HTML files survive across layers

The pages opened from `file://` are also the pages served by the backend.
That sounds small, but it has strong consequences.
It means the innermost layer cannot quietly become throwaway mockup code.
It has to stay real so that the backend can reuse it.

### HTML fragments are a first-class backend output

HTMX handlers return HTML fragments, not frontend framework state descriptions.
That keeps the integration format close to what the browser actually renders.
For many interactions, that is simpler than a JSON payload plus a JavaScript rendering layer.

### Authentication is an outer concern, authorization stays in the app

This repository is not trying to eliminate authorization logic from the backend.
It is trying to eliminate the need for the backend to own every aspect of sign-in and identity plumbing.
The backend still makes the final decision about protected behavior.
It just does so with a cleaner separation of concerns.

### Generated systems config is still tracked

`010-dev/0010-systems/` contains generated Traefik and Authelia config, but the source of truth lives in `020-ops/templates/` and `020-ops/profiles/`.
That means the repository shows you both the generated outputs used for local development and the canonical rendering logic that produced them.

I like this because after checkout you can immediately start hacking without the need to first render configuration files.
At the same time this approach is still allowing a production-oriented configuration source of truth.
You can inspect the rendered files directly, but you do not have to hand-maintain them.

## How the outer layers change the problem

The local development layers focus on developer convenience, but that only matters if the same architecture can also handle real production workloads.
The outer layers take that local setup and turn it into a deployment that is secure, repeatable, and up to the task for real operating conditions.

In the inner layers, the main question is, "Can I build and debug this quickly?"
In the outer layers, the question changes to, "Can I run the same app reliably when real users and real workloads are involved?"
That change is important, because many architectures look simple during development and then become hard to reason about as soon as TLS, authentication, reverse proxies, container networking, and scaling enter the picture.
The goal is continuity: the app should not feel like one system in local development and a completely different one in production.

### Integration tests: production-like enough to be interesting

The Incus-based integration layer deploys the full stack into a fresh environment, including HTTPS and the auth proxy layer, and then runs tests against the deployed result.

Compared to the development setup, this layer introduces the following changes:

* frontend and backend are built into a Docker image
* Redis becomes the session store
* the app can be scaled across workers and replicas

This is the point where claims such as "the architecture scales" or "the auth flow really works end to end" have to live up to their promise.

### Production: same shape, different certificate story

The production layer is intentionally very close to the integration-test layer.
The major difference is certificate handling.
Local and Incus integration use `mkcert`.
Production uses Let's Encrypt and real domains.

The closer your integration environment is to production, the fewer issues will only be detectable in production.

## What I think this repository is good for

I see FastHTML-Plus as a useful counterexample to a default stack that many teams accept without much scrutiny.

You can clone this repository and use it as a starting point for your own applications, with a full end to end story in mind, from HTML click-through mockups to scalable and secure production deployments.
You do not need to carry all of that complexity from day one.
You can begin with the simplest layer that solves the problem in front of you, and only add the next layer when it becomes necessary.

In other words, the repository is not only a template for code.
It is also a template for sequencing decisions.
You can start with static HTML, then add HTMX fragment updates, then add backend behavior, then add authentication and deployment concerns, without throwing away the earlier work.

And that, in a sentence, is the real point of FastHTML-Plus:
the architecture should let you carry just enough complexity for the task in front of you, while still leaving a credible path to the outer layers when you need them.

### What I would suggest if you clone it

If you clone the repository, I would start by walking the same path the architecture wants you to walk:

1. Build the frontend and open the pages from disk.
2. Start the backend in functional mode and click the HTMX flows.
3. Add the local systems layer and watch the `/public` versus `/private` split through Traefik and Authelia.
4. Only then look at `020-ops/` and `050-integration-tests/`.

That order keeps the complexity proportional to the question you are trying to answer.
It lets you understand the experiment from the inside out, rather than treating deployment and auth scaffolding as the starting point.

## Conclusion

FastHTML-Plus is an attempt to make one set of tradeoffs concrete and testable.
The main idea is to keep HTML as the primary integration format for as long as possible, keep JavaScript focused and small, and only add more infrastructure when the problem actually requires it.
What I find interesting about this approach is the way the layers relate to each other.
Each layer should already be useful on its own, and each outer layer should extend the system without invalidating the earlier one.
In practice, that means you can begin with a very small development loop and still keep a credible path toward a production deployment.

So the point of FastHTML-Plus is to put a coherent set of architectural preferences into code, then see how far they go under realistic conditions.
If that helps you build directly on this repository, good.
If it helps you challenge your own default assumptions about frontend frameworks, backend responsibilities, authentication boundaries, or deployment shape, that is just as useful.

## Appendix

### Repository layout and source of truth

The repository mirrors the onion layout itself.
That is intentional.
The tree is not only a storage layout.
It is also part of the explanation.
`010-dev/0100-app/010-web/` is the frontend-only shell.
`010-dev/0100-app/020-fasthtml/` is the backend shell.
`010-dev/0010-systems/` is the local Traefik plus Authelia layer.
`020-ops/` is render and deploy tooling.
`050-integration-tests/` is the outer verification layer.

One repository detail is easy to miss the first time you look at it.
The Traefik and Authelia files in `010-dev/0010-systems/` are not the canonical source.
They are rendered outputs for the local systems layer.
The source of truth lives in `020-ops/templates/` together with the environment profiles.
I like this split because it keeps local development concrete while still keeping the real configuration logic in one place.

That also explains why `020-ops/` exists even though you already have a local systems folder.
`020-ops/` is not another local runtime shell.
It is the place where profiles are expanded, templates are rendered, and deployment artifacts are prepared for integration and production.

### Toolchain and prerequisites

The dependency story follows the onion layout.
For the innermost frontend work, the main requirement is `nvm` with the pinned Node.js version expected by the repository.
For the Python side, the main requirement is `uv`, because the backend, the ops tooling, and the integration tooling all use it for environment management.

Once you move outward to the local auth and reverse-proxy layer, you also need Docker, Docker Compose, and `mkcert`.
Docker and Compose run Traefik and Authelia.
`mkcert` gives you locally trusted certificates for `app.localhost` and `auth.app.localhost`, which makes the browser side of the auth flow much less distracting during development.
`tmux` is optional and only matters if you want the repo's convenience workflow for the systems shell.

If you want to run the full outer verification path exactly as the repository defines it, you also need Incus.
The integration layer uses an Incus container, `.incus` hostnames, mkcert-based TLS for those domains, and automated HTTPS checks via `make test` and `make test-scale`.

### The auth trust model

FastHTML-Plus deliberately separates authentication from authorization.
Authentication answers "Who is this user?" Authorization answers "What is this user allowed to do here?"
In systems and ops mode, Traefik and Authelia handle the authentication flow.
The backend still makes the final authorization decision through `@public` and `@authenticated(...)` decorators.

In functional mode, activated through `RUN_LOCAL=1`, private routes are allowed with a local development identity.
That keeps the public versus private split visible while removing most of the auth friction during feature work.
In access/authz mode, which is the default, the backend requires authenticated identity from trusted forwarded headers, and that trust is guarded by the proxy secret proof.

The important part is that forwarded identity is not trusted just because headers exist.
Traefik first sanitizes inbound `Remote-*` headers, then asks Authelia through ForwardAuth, then forwards trusted identity headers, and then injects `X-Proxy-Secret`.
The backend accepts that identity only when `X-Proxy-Secret` matches `FASHTML_PROXY_SECRET`.
That is what prevents a direct client from spoofing identity by sending `Remote-User` style headers on its own.

This also explains one behavior that is easy to misunderstand at first.
A direct backend request to a private route in access/authz mode does not redirect you to a login page.
It returns `403`.
Redirect-to-login belongs to the proxy layer, not to the backend handlers.
I think this is one of the cleaner aspects of the design, because it makes the trust boundary visible instead of hiding it in framework glue.

### Three local failure modes that are worth knowing early

The first common failure is `502 Bad Gateway` from Traefik in systems mode.
In this repository, that usually means the backend is listening only on `127.0.0.1` while Traefik is trying to reach `host.docker.internal:5001` through the Docker host-gateway path.
That is exactly why `make run-systems` exists.
It binds the backend correctly for this stack.

The second common failure is a browser TLS warning or a local HTTPS setup that feels half-broken.
For the local systems layer, the intended path is `mkcert -install` once as your normal user, then `make certs` in `010-dev/0010-systems/`.
Without that, the local auth flow still exists, but you lose the "trusted browser" behavior that makes debugging much calmer.

The third common surprise is a `403` on a direct backend call to `/private`.
In this project, that is expected behavior in access/authz mode.
It does not mean the auth system is broken.
It means you are bypassing the proxy layer that owns the login redirect and the identity proof path.
Once you read the architecture through that lens, the behavior becomes much easier to reason about.

## Footnotes

[^replicas]: [Scaling in Docker Compose with hands-on Examples](https://docker77.hashnode.dev/scaling-in-docker-compose-with-hands-on-examples)
[^simplemadeeasy]: Rich Hickey: "Simple Made Easy" from Strange Loop 2011 [video](https://news.ycombinator.com/item?id=3135185).
[^incidentalcomplexity]: [The Two Root Causes of Software Complexity](https://pressupinc.com/blog/2014/05/root-causes-software-complexity/)
