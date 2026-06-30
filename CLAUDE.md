# OpenPalette — Claude Code Instructions

## Project Overview

A local-first, open-source color studio — a palette machine for designers and developers. Built with Next.js 16 + TypeScript + Tailwind CSS v4. No backend, no accounts, no tracking. Deployed at https://palette.kovina.org.

## Brand Identity

- **Brand accent:** `#ff66c4` (light mode), `#ff85d0` (dark mode)
- **Light mode:** `#f9f9f9` bg, `#111111` text, `#555555` secondary, `#888888` muted
- **Dark mode:** `#0f0f0f` bg, `#f5f5f5` text, `#aaaaaa` secondary, `#777777` muted
- **Header/tab bg:** `var(--bg-surface)` / `var(--bg-base)` — uses CSS vars
- **Hover effect:** `— (accent)` (pink) on all interactive elements
- **Buttons:** Rounded-full pills, hover turns pink accent
- **Editorial design:** No card panels, no dashboard widgets. Spacing > borders.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** React client-side state + localStorage
- **Deployment:** Vercel + Cloudflare (palette.kovina.org)
- **Runtime:** Node.js >= 22
- **Dev server port:** `1997`

## App Structure

Single-page app with 11 independent tabbed sections, each with its own palette state (via `usePalette()` hook):

- **11 tabs:** Studio, Explore, Extract, Contrast, Visualizer, Colors, Tokens, Gradient, Accessibility, Themes, Library
- **Nav:** Floating pill group at top with scroll arrows (5 visible at a time)
- **Each tab** has its own `usePalette()` hook with independent colors, undo stack, generate, and keyboard shortcuts

## Commands

```bash
npm run dev          # Dev server on port 1997
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type checking (no emit)
npm run test         # Vitest run
npm run test:coverage # Vitest with coverage
```

## Architecture Constraints

1. **Local-first.** All data in browser (localStorage). No backend, no database.
2. **No accounts.** No authentication, no user profiles, no cloud sync.
3. **No tracking.** No analytics, no telemetry, no third-party scripts.
4. **Client-side only.** Palette generation, color math, exports all in-browser.
5. **Original design.** No Coolors branding, assets, or visual identity.
6. **Dark mode designed intentionally** — not auto-inverted from light mode.
7. **All buttons are pills** (`rounded-full`). Hover uses `— (accent)`.
8. **Global button cursor:** `button { cursor: pointer; }` in globals.css.

## Component Architecture

```
OpenPaletteApp (shell)
  ├── Tab nav (scrollable pill group, 5 visible at a time, ◀▶ arrows)
  ├── StudioSection — main palette editor
  │     ├── StudioToolbar (generate, import, +/−, modes, eye, view, undo, export)
  │     └── StudioSwatches (vertical columns, drag-to-reorder, hover rail)
  ├── ExploreSection — palette discovery (75 curated palettes, search, filters)
  ├── ImagePickerSection — image color extraction
  ├── ContrastSection — WCAG contrast checker
  ├── VisualizerSection — template gallery (7 mockups)
  ├── ColorsSection — 150 color library + ColorDetailPage
  ├── TokensSection — design token scale generator
  ├── GradientSection — gradient studio (linear/radial/conic, presets, stops)
  ├── AccessibilitySection — accessibility studio (scores, matrix, blind sim)
  ├── ThemesSection — 9 curated theme sets
  └── LibrarySection — saved palettes, exports, history, collections
```

## Key Files

| Path | Purpose |
|------|---------|
| `src/components/openpalette-app.tsx` | Shell — tab nav, routing, section switching |
| `src/app/layout.tsx` | Root layout, ThemeProvider, Toast, StripFdid |
| `src/app/globals.css` | Design tokens, semantic classes (.text-page, .surface, .hover-accent, .bounce-press), animations |
| `src/components/header.tsx` | Sticky header with logo, About link, fixed SVG theme toggle |
| `src/components/theme-provider.tsx` | Light/dark toggle, localStorage(openpalette-theme) |
| `src/components/toast.tsx` | Global toast system (showToast + Toast component) |
| `src/components/error-boundary.tsx` | Error boundary wrapping each section |
| `src/components/use-palette.ts` | Central palette state hook |
| `src/components/use-auto-save.ts` | Per-tab auto-save/restore to localStorage |
| `src/lib/palette/` | Color engine (generation, math, contrast, export, import, extraction) |
| `src/lib/palette/color-conversions.ts` | HSV, CMYK, CIE Lab conversions |
| `src/lib/palette/color-info.ts` | Named color DB with psychology/meaning/applications |
| `src/lib/palette/explore-data.ts` | 75 curated explore palettes |

## Tab Details

| Tab | Route | Description |
|-----|-------|-------------|
| Studio | `/` | Full palette editor with vertical column swatches, drag-to-reorder, hover action rail, quick-tune sliders, harmony modes, auto-save |
| Explore | `#explore` | Palette discovery hub — 75 curated palettes, keyword/prompt search, color/style/topic filters, Load More, detail modal |
| Extract | `#extract` | Image palette extraction — drag/drop upload, 6 extraction modes (balanced/vibrant/muted/pastel/dark/high-contrast), Open in Studio |
| Contrast | `#/contrast/hex-hex` | WCAG contrast checker — dual color pickers, ratio, 3-star rating, AA/AAA badges, live preview, how-it-works section |
| Visualizer | `#visualizer` | Template gallery — 7 mockups (Website/Mobile/Dashboard/Brand/Typography/Poster/Social), category filters, sticky toolbar |
| Colors | `#colors` | 150-color library — 12 category chips, search, color detail page with 9 sections (Overview through Palettes), opens in new tab |
| Tokens | `#/tokens/hex` | Design token generator — 11-step scale (50-950), 12 UI previews, 6 developer exports, Light/Dark preview toggle |
| Gradient | `#gradient` | Gradient studio — linear/radial/conic, 14 presets, color stop editor, angle control, live canvas, 4 preview templates, exports |
| Accessibility | `#accessibility` | Accessibility studio — score overview, live previews, theme pair tester, contrast matrix, 5-mode color blindness sim, typography, audit |
| Themes | `#themes` | 9 curated light/dark palette sets, click to load and edit |
| Library | `#library` | Saved palette browser, 7 export formats, search/tags/sort, favorites, history, collections |

## Semantic CSS Classes

- `text-page`, `text-secondary`, `text-muted` — text colors
- `surface`, `surface-muted`, `border-default` — backgrounds/borders
- `hover-accent` — pink accent hover effect (color + 10% bg tint)
- `bounce-press:active` — subtle press animation
- `btn-primary`, `btn-secondary`, `btn-ghost`, `input-surface` — semantic buttons/inputs

## Global Toast System

```tsx
import { showToast } from "@/components/toast";
showToast("Copied #FF66C4");  // Shows bottom-center toast, auto-dismisses 1.8s
```

## Required Checks

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

## Release Hygiene

- Update `CHANGELOG.md`, `AGENTS.md` version, `package.json` version
- Bump semver appropriately (current: v0.9.4)
- No direct pushes to `main` (branch protection via GitHub)

## Milestone — v0.8.10 Complete

All 11 tabs fully implemented with editorial design, semantic CSS, and Coolors-parity features:

- **Studio** — drag-to-reorder swatches, hover action rail, auto-save
- **Explore** — 75 curated palettes, search/filters, detail modal
- **Extract** — 6 extraction modes, improved algorithm
- **Contrast** — WCAG checker, 3-star rating, AA/AAA badges
- **Visualizer** — 7 template gallery, category filters
- **Colors** — 150-color library, 9-section detail page, opens in new tab
- **Tokens** — 11-step scale generator, 6 exports, UI previews
- **Gradient** — linear/radial/conic, 14 presets, stop editor, exports
- **Accessibility** — scores, theme pair tester, contrast matrix, 5-mode blind sim, typography audit
- **Themes** — 9 curated sets
- **Library** — saved palettes, 7 exports, collections, history

### Infrastructure
- URL hash routing for all tabs (persists on refresh)
- Global toast system (`showToast`)
- bounce-press animation + hover-accent pink hover effect
- Semantic CSS system (text-page, surface, border-default)
- Light/dark mode with SVG sun/moon toggle
- SSR hydration fixes (mounted guard)
- Hosted at palette.kovina.org via Vercel + Cloudflare
