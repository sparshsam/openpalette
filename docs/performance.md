# Performance Notes

OpenPalette is designed to stay fast without analytics, accounts, or a required backend.

## Current Optimizations

- Static Next.js App Router route.
- No new runtime dependencies in the product bundle.
- Palette, accessibility, gradient, import, export, library, and image extraction logic split into focused modules.
- Library search uses deferred query state to avoid urgent re-renders while typing.
- Advanced RGB/HSL controls are collapsed by default to reduce initial visual and interaction density.
- Image extraction downsizes uploads before pixel sampling.
- Export paths use native Blob, SVG, and Canvas APIs.

## Production Build Snapshot

Measured on June 8, 2026 with `npm run build`:

- Production compile: 2.2s
- TypeScript during build: 1.7s
- Static generation: 5 static pages in 251ms
- Route mode: `/` prerendered as static content

## Lighthouse

Attempted against `next start` on `http://127.0.0.1:3008` and `http://localhost:3008`.

The local Chrome/Lighthouse environment produced `CHROME_INTERSTITIAL_ERROR` and did not generate a trustworthy score. The saved local artifacts were ignored from git because they represent failed audit runs, not product metrics.

Recommended repeat command on a clean Chrome environment:

```bash
npm run build
npm run start -- --hostname 127.0.0.1 --port 3008
npx lighthouse http://127.0.0.1:3008 \
  --output=json \
  --output=html \
  --output-path=reports/lighthouse \
  --chrome-flags="--headless --no-sandbox"
```

## Next Performance Targets

- Add automated Lighthouse CI once the deployment URL is stable.
- Split heavyweight panels with dynamic imports if bundle analysis shows a meaningful win.
- Move large local libraries from localStorage to IndexedDB.
- Add browser interaction tests for import/export and image extraction flows.
