# Bootstrap 4.6.2 -> 5.3.x migration plan (repo-specific)

## Current state
- Dependency: `bootstrap@4.6.2` in `package.json`.
- Asset passthrough: `.eleventy.js` copies `./node_modules/bootstrap/dist/css/bootstrap.min.css` to `/css/bootstrap.min.css`.
- CSS inclusion: `src/includes/base.njk` loads `/css/bootstrap.min.css` before `/css/main.css` and `/css/prism-tomorrow.css`.
- JS inclusion: `src/includes/base.njk` conditionally (when `metadata.mastodonSharing`) loads:
  - jQuery 3.3.1 slim (CDN)
  - Popper.js 1.14.7 (CDN)
  - Bootstrap 4.3.1 JS (CDN)
- No local Bootstrap JS bundle is referenced; no explicit JS plugin initialization found in repo.

## Inventory of Bootstrap usage (by template/component)
**Templates/layouts that use Bootstrap classes**
- `src/includes/base.njk` (global layout)
  - Grid/structure: `container`, `row`, `col`
  - Flex utilities: `d-flex`, `flex-row`, `flex-column`, `justify-content-between`
  - Spacing/utilities: `mb-2`, `mb-0`, `w-100`
  - Text utilities: `text-center`, `text-right`
  - Misc: `bg-black`, `ml-auto`
- `src/includes/layouts/post.njk`
  - Layout/utilities: `container`, `d-flex`, `flex-column`, `justify-content-between`
- `src/index.html`
  - Grid/utilities: `row`, `mt-4`, `mb-0`
  - Forms/buttons: `form-group`, `form-control`, `btn`, `btn-primary`

**Components present**
- Grid and layout utilities (container/row/col, flex utilities, spacing)
- Basic form controls and a button (newsletter form)
- No navbars, dropdowns, modals, collapse, tooltips, popovers, cards, alerts, badges, or jumbotrons detected in templates.

## Breaking changes found in this repo (with file references)
**Data attributes / JS plugins**
- No `data-toggle`, `data-target`, or `data-dismiss` attributes found in templates.
- Bootstrap JS is only loaded in `src/includes/base.njk` and uses Bootstrap 4.3.1 + jQuery + Popper v1; Bootstrap 5 removes jQuery and requires Popper v2 for dropdowns/tooltips/popovers.

**Utility renames (left/right -> start/end)**
- `src/includes/base.njk`: `ml-auto` and `text-right` must become `ms-auto` and `text-end`.

**Forms / input groups / custom controls**
- `src/index.html`: `form-group` wrapper is Bootstrap 4-only; needs update to Bootstrap 5 layout (typically replace with spacing utilities like `mb-3`).
- No `form-row`, `form-inline`, `custom-*`, `input-group-append`, or `input-group-prepend` found.

**Removed/changed components**
- No `jumbotron`, `badge-pill`, or contextual `badge-*` classes found.

**Custom CSS targeting Bootstrap 4 classes**
- No custom CSS selectors in `src/assets/css/*.css` referencing Bootstrap classes were found.

## Migration checklist (ordered, actionable)
1) **Preparation (branch + dependency update plan)**
   - Create a migration branch.
   - Update Bootstrap dependency to `^5.3.x` and plan to switch JS includes to Bootstrap 5 (see step 2).

2) **JS/plugin migration (even if minimal)**
   - In `src/includes/base.njk`, remove jQuery and Popper v1 includes.
   - Replace Bootstrap 4.3.1 JS CDN with Bootstrap 5.3.x JS (prefer `bootstrap.bundle.min.js` so Popper v2 is included).
   - If you later add dropdowns/tooltips/popovers, verify they work without jQuery and use Bootstrap 5 data attributes.

3) **Mechanical utility renames**
   - Replace `ml-auto` -> `ms-auto` and `text-right` -> `text-end` in `src/includes/base.njk`.
   - Run a repo-wide check to ensure no other left/right utility classes exist.

4) **Forms cleanup**
   - In `src/index.html`, replace `form-group` with Bootstrap 5 spacing utilities (e.g., `mb-3`), and confirm the form layout looks correct.
   - Verify `form-control` and `btn` usage remains compatible (it does in BS5).

5) **Visual sweep for removed components**
   - Verify no hidden usage of removed components (jumbotron, badge-pill, etc.) appears in new or future templates.

6) **Custom CSS audit**
   - Re-scan `src/assets/css/*.css` for any selectors that rely on BS4-only classes (none found today, but re-check after edits).

**Suggested search/replace batches**
- `ml-auto` -> `ms-auto`
- `text-right` -> `text-end`
- (If found later) `data-toggle` -> `data-bs-toggle`, `data-target` -> `data-bs-target`, `data-dismiss` -> `data-bs-dismiss`
- (If found later) `float-left` -> `float-start`, `float-right` -> `float-end`, `text-left` -> `text-start`, `border-left` -> `border-start`, `border-right` -> `border-end`, `rounded-left` -> `rounded-start`, `rounded-right` -> `rounded-end`

## Risks and mitigations
- **Templates/markup (Low-Medium)**: Only a handful of BS4-only classes; mechanical edits in `src/includes/base.njk` and `src/index.html` should be safe.
- **JS/plugins (Low but easy to overlook)**: Even if you do not use plugins, the current JS includes are BS4-specific. Mitigate by switching to Bootstrap 5 bundle and removing jQuery/Popper v1.
- **Custom CSS (Low)**: No selectors target Bootstrap classes today. Re-scan after migration to confirm no accidental dependencies.
- **External content**: Posts are mostly markdown; if any raw HTML with Bootstrap classes is added later, it could introduce hidden breakage. Mitigate with a repo-wide class scan during migration.

## Verification plan
- **Build checks**: run `npm run build` to ensure Eleventy builds with the updated CSS/JS assets.
- **Manual visual review (representative pages)**:
  - Home page: `src/index.html` (newsletter form, buttons, spacing)
  - Post page: `src/includes/layouts/post.njk`
  - Post with TOC: `src/includes/layouts/post-with-toc.njk`
  - Global layout/header/footer: `src/includes/base.njk`
- **Functional checks**:
  - If Bootstrap JS is kept, verify dropdowns/tooltips/popovers on any page that adds them in the future.
  - Confirm layout spacing after utility class renames.

## Pitfalls to avoid
- **jQuery removal**: Bootstrap 5 does not use jQuery. Remove jQuery usage and avoid relying on jQuery-based Bootstrap APIs.
- **Data attribute renames**: BS4 `data-toggle`, `data-target`, `data-dismiss` must become `data-bs-*` equivalents if added later.
- **Utility renames**: left/right utilities become start/end (`ml-` -> `ms-`, `text-right` -> `text-end`, etc.).
- **Forms/input groups**: `form-group` and input-group append/prepend markup are gone; use spacing utilities and updated input-group markup in BS5.
- **Removed components**: jumbotron, badge-pill, and contextual badge classes are removed; recreate with utilities if introduced.
- **Custom CSS selectors**: watch for overrides that target BS4-specific class names or DOM structure; re-check after migration.
