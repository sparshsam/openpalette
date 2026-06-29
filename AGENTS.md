<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Operating Notes

`AGENTS.md` is the canonical instruction file for OpenPalette. All coding agents should follow this file before any secondary tool-specific notes.

## Product Identity

- **Visible name:** OpenPalette
- **Repository slug:** `openpalette`
- **Current release:** `v0.8.10`
- **Product type:** local-first color studio / palette machine
- **Live URL:** https://palette.kovina.org
- **Brand accent:** `#ff66c4` (light), `#ff85d0` (dark)
- **Light mode:** `#f9f9f9` bg, `#111111` text
- **Dark mode:** `#0f0f0f` bg, `#f5f5f5` text
- **License:** MIT
- **Dev server port:** `1997`

## Design Standard

Editorial layout: spacing > borders, typography weight > containers. All buttons are pills. Hover is always the accent pink (`var(--accent)`). Dark mode is designed intentionally (not auto-inverted).

## Tabs (11 total)

Scrollable pill nav with ◀▶ arrows (5 visible at a time). URL hash routing preserves tab on refresh.

| Tab | Route | Description |
|-----|-------|-------------|
| Studio | `/` | Palette editor — drag-to-reorder swatches, hover action rail, quick-tune, harmonies, auto-save |
| Explore | `#explore` | 75 curated palettes, search/filters, detail modal, open in Studio |
| Extract | `#extract` | Image extraction — upload, 6 modes, palette strip |
| Contrast | `#/contrast/hex-hex` | WCAG checker — ratio, stars, AA/AAA, live preview, shareable URL |
| Visualizer | `#visualizer` | 7 template gallery, category filters, sticky toolbar |
| Colors | `#colors` | 150-color library, categories, detail page (9 sections), opens in new tab |
| Tokens | `#/tokens/hex` | Token scale generator, 12 UI previews, 6 exports, shareable URL |
| Gradient | `#gradient` | Gradient studio, 14 presets, stop editor, exports |
| Accessibility | `#accessibility` | Scores, theme tester, contrast matrix, blind sim, typography, audit |
| Themes | `#themes` | 9 curated theme sets |
| Library | `#library` | Saved palettes, 7 export formats, collections, history |

## Key Architecture

- All tabs rendered conditionally after `mounted` flag to prevent SSR hydration errors
- Each section creates its own palette via `usePalette()` hook
- Global toast: `showToast("msg")` from `@/components/toast`
- Error boundaries wrap every section
- Hash routing: `tab` in URL hash determines active tab
- Color detail, contrast, and token routes use extended hash patterns

## Semantic CSS (globals.css)

`.text-page`, `.text-secondary`, `.text-muted` — theme-aware text
`.surface`, `.surface-muted`, `.border-default` — theme-aware surfaces
`.hover-accent:hover` — pink accent hover (color + 10% bg)
`.bounce-press:active` — scale(0.96) press animation

## Commands

```bash
npm run dev          # Port 1997
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # Next.js production build
npm run test         # Vitest (13 tests)
npm run test:coverage # With V8 coverage
```

## Do Not Add

Accounts, payments, ads, tracking, backend services, external APIs, Coolors branding/assets.

## Required Checks

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```
