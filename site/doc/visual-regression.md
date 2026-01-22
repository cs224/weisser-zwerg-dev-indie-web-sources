# Optional lightweight visual regression workflow

This workflow is intentionally light and manual-first, with an optional automated path if you want screenshots you can diff.

## Representative pages to verify
- Home page: `/` (newsletter form, buttons, spacing)
- Post page: any post that uses `src/includes/layouts/post.njk`
- Post with TOC: any post that uses `src/includes/layouts/post-with-toc.njk`
- Global layout: header/footer in `src/includes/base.njk`

## Manual baseline/compare (no new dependencies)
1) Build and serve the site:
   - `npm run build`
   - `npm run serveht` (serves `dist/`)
2) Open the representative pages in a browser.
3) Capture screenshots manually and store them in a local folder (e.g., `doc/visual-baselines/`).
4) After migration, repeat the same screenshots and visually compare.

## Optional automated screenshots (Playwright, on-demand)
If you want quick, repeatable screenshots without committing new deps:
1) Build and serve the site as above.
2) Install Playwright when needed:
   - `npm i -D playwright`
   - `npx playwright install --with-deps`
3) Use this ad-hoc script from the repo root:

```bash
node - <<'NODE'
const { chromium } = require('playwright');

const pages = [
  { name: 'home', url: 'http://localhost:8080/' },
  { name: 'post', url: 'http://localhost:8080/posts/' },
  { name: 'post-with-toc', url: 'http://localhost:8080/posts/?toc=1' }
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const p of pages) {
    await page.goto(p.url, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `doc/visual-baselines/${p.name}.png`, fullPage: true });
  }
  await browser.close();
})();
NODE
```

Notes:
- Update the URLs to actual representative pages (pick real posts). If your post URLs are known, replace the placeholders above.
- Keep baseline screenshots in a local folder and compare after migration (git diff, image diff tools, or manual review).
