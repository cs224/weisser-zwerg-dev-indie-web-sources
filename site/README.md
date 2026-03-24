# weisser-zwerg.dev site

This repository contains the Eleventy-based source for `weisser-zwerg.dev`.

## Stack

- Node.js with npm
- Eleventy (`@11ty/eleventy`)
- Nunjucks, Markdown, HTML
- Sass and Bootstrap
- Firebase Hosting

## Local workflow

Install dependencies:

```bash
npm install
```

Start local development:

```bash
npm run serve
```

Build the production site:

```bash
npm run build
```

Serve the built output:

```bash
npm run serveht
```

## Dependency and security updates

This project is npm-managed. The update workflow should distinguish between:

1. routine updates within the semver ranges already declared in `package.json`
2. security remediations
3. deliberate major-version upgrades

### Inspect what is outdated

```bash
npm outdated
npm audit
```

Use:

- `npm outdated` to compare installed, wanted, and latest versions
- `npm audit` to inspect known vulnerabilities

### Apply safe updates first

```bash
npm update
npm audit fix
npm install
```

Use:

- `npm update` to move dependencies to the highest version allowed by the existing ranges
- `npm audit fix` to apply semver-compatible security remediations
- `npm install` to refresh `node_modules` and `package-lock.json`

### Review broader upgrades

This repository already includes `npm-check-updates` helper scripts:

```bash
npm run ncu
npm run ncu-u
npm install
```

Use:

- `npm run ncu` to inspect minor upgrades
- `npm run ncu-u` to rewrite `package.json` with newer allowed versions
- `npm install` afterwards to regenerate the lockfile

Do not treat major upgrades or `npm audit fix --force` as routine maintenance. Those can change runtime behavior and should be reviewed as intentional dependency changes.

## What to watch out for

- Commit `package.json` and `package-lock.json` together.
- `npm update` does not cross the version ranges declared in `package.json`.
- `npm audit fix --force` may introduce breaking changes.
- Transitive dependency changes can still affect runtime behavior.
- Eleventy 3.x requires Node.js 18 or newer.
- `npm test` is currently a placeholder and does not validate the site.
- `npm run build` sets `NODE_ENV=production`, which can trigger webmention fetch logic if `WEBMENTION_IO_TOKEN` is configured.
- Firebase deploy commands require the Firebase CLI and project access.

## What to verify after updates

Run a clean install and rebuild:

```bash
npm ci
npm run build
```

Then verify:

- Eleventy still builds without template or plugin errors
- Sass still compiles
- pages render correctly in `dist/`
- feed generation still works
- syntax highlighting still works
- TOC generation still works
- custom filters and shortcodes still behave correctly

Optional local verification:

```bash
npm run serveht
npm run check-links
```

## Current security remediation

An advisory reported that `liquidjs` is affected by path traversal fallback vulnerability `CVE-2026-30952`.

Repo-specific status:

- Eleventy depends on `liquidjs` transitively.
- The lockfile previously resolved `liquidjs` to `10.24.0`.
- This repo now uses npm `overrides` to force `liquidjs` `10.25.0` until the upstream Eleventy dependency chain guarantees a fixed version by default.
- Verification on 2026-03-11: `npm audit` no longer reports a `liquidjs` advisory in this repository after the override and lockfile refresh.
- The dependency tree is not otherwise clean yet; `npm audit` still reports separate issues in packages such as `@remy/webmention`, `broken-link-checker`, and `markdown-it-katex`.

To apply and verify this remediation:

```bash
npm install
npm ci
npm run build
```

After that, confirm the lockfile resolves `liquidjs` to `10.25.0` or newer.
