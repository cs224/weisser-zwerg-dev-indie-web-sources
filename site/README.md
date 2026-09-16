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
npm run ncua
npm run ncu-u
npm install
```

Use:

- `npm run ncu` to inspect minor upgrades
- `npm run ncua` to inspect all available upgrades, including major versions
- `npm run ncu-u` to rewrite `package.json` with newer allowed versions
- `npm install` afterwards to regenerate the lockfile

Do not treat major upgrades or `npm audit fix --force` as routine maintenance. Those can change runtime behavior and should be reviewed as intentional dependency changes.

### Dependabot policy

Dependabot alerts and automated updates are intentionally disabled for this repository. The project currently has no CI pipeline that could validate automatically generated dependency pull requests, so dependency and security maintenance remains a manual process.

Use `npm run ncu` and `npm run ncua` to review available updates, `npm audit` to identify known vulnerabilities in the resolved dependency tree, and the clean-install and build checks below before accepting dependency changes. Reconsider enabling Dependabot if CI coverage is added in the future.

## What to watch out for

- Commit `package.json` and `package-lock.json` together.
- `npm update` does not cross the version ranges declared in `package.json`.
- `npm audit fix --force` may introduce breaking changes.
- Transitive dependency changes can still affect runtime behavior.
- Eleventy 3.x requires Node.js 18 or newer.
- `npm test` is currently a placeholder and does not validate the site.
- Markdown math is rendered by `@vscode/markdown-it-katex`; malformed formulas fail the production build.
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
npm run check-links
npm run check-links:external
```

Both link checks use Linkinator and report only errors. Run the production build first. `check-links` is the fast, deterministic check for generated pages, URL fragments, and CSS resources; it skips external HTTP(S) URLs. `check-links:external` performs the slower network-dependent scan and excludes protocol endpoints that do not accept an unauthenticated `GET` request. External results can still depend on network availability and remote-site bot protection.

## Current LiquidJS security status

Security advisories have reported path traversal, arbitrary file-read, remote-code-execution, and resource-exhaustion vulnerabilities in older `liquidjs` releases.

Repo-specific status:

- Eleventy depends on `liquidjs` transitively.
- The lockfile previously resolved vulnerable `liquidjs` releases through Eleventy.
- Eleventy 3.1.6 declares `liquidjs` `^10.27.0`, which allows npm to resolve patched 10.x releases without a repository override.
- Verification on 2026-09-16: the lockfile resolves `liquidjs` to `10.29.0`, and `npm audit` no longer reports a `liquidjs` advisory.
- The dependency tree is not otherwise clean yet; `npm audit` still reports separate issues in the `@remy/webmention` dependency chain.

To verify this status after dependency updates:

```bash
npm install
npm ci
npm run build
```

After that, confirm the lockfile resolves `liquidjs` to `10.29.0` or newer.
