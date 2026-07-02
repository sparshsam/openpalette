<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Operating Notes

`AGENTS.md` is the canonical instruction file for OpenPalette. All coding agents should follow this file before any secondary tool-specific notes.

## Product Identity

- **Visible name:** OpenPalette
- **Repository slug:** `openpalette`
- **Product type:** local-first color studio / palette machine
- **Live URL:** https://palette.kovina.org
- **Brand accent:** `#ff66c4` (light), `#ff85d0` (dark)
- **Light mode:** `#f9f9f9` bg, `#111111` text
- **Dark mode:** `#0f0f0f` bg, `#f5f5f5` text
- **License:** MIT
- **Current release:** `v0.9.9`
- **Dev server port:** `1997`

## Architecture (IMPORTANT — Changed in v0.9.0)

All sections share a **single global palette** via `WorkspaceProvider` + `useWorkspace()` from `@/components/workspace-context`.
Do NOT use `usePalette()` from `@/components/use-palette` — it is legacy. The workspace provides: colors, mode, undoStack, redoStack, generate, undo, redo, setPalette, loadPalette, copyPalette, savePalette, shareUrl, snapshots, recentlyGenerated, recentlyCopied, recentlyOpened.

## Tabs (10 active)

Scrollable pill nav with ◀▶ arrows. URL hash routing preserves tab on refresh. Settings tab was added in v0.9.3.

| Tab | Route | Description |
|-----|-------|-------------|
| Studio | `/` | Palette editor — drag-to-reorder swatches, hover action rail, quick-tune, harmonies |
| Explore | `#explore` | 320 curated palettes, search/filters, detail modal |
| Extract | `#extract` | Image extraction — upload, 6 modes |
| Contrast | `#/contrast/hex-hex` | WCAG checker — ratio, AA/AAA, live preview |
| Visualizer | `#visualizer` | 7 template gallery, category filters |
| Colors | `#colors` | 150-color library, categories, detail page (new tab) |
| Tokens | `#/tokens/hex` | Token scale generator, UI previews, 6 exports |
| Gradient | `#gradient` | Gradient studio, 14 presets, stop editor |
| Accessibility | `#accessibility` | Scores, theme tester, blind sim, typography, audit |
| Settings | `#settings` | Theme, defaults, import/export, reset, About |

Themes and Library tabs were archived in v0.8.10 (preserved in git history).

## Shared Features

- **Workspace Toolbar** (`WorkspaceToolbar`): Edge-to-edge bottom bar with palette strip, Generate, Copy, Save, Share, Export, Undo/Redo, Inspector, History, Snapshots
- **Palette Inspector** (`PaletteInspector`): 6 tabs — Info (naming + tags + summary), Scores (health + recommendations), Analytics (visual), Quality (8 dimensions), Compare, Variations
- **Command Palette** (`CommandPalette`): Opens with `/` key — search pages, palettes, colors, quick actions
- **Keyboard Shortcuts** (`KeyboardShortcuts`): Opens with `?` key
- **Export Modal** (`ExportModal`): 11 export formats, 7 naming presets, token groups, import, design system preview
- **Global shortcuts**: Space=generate, Ctrl+Z=undo, Ctrl+Shift+Z=redo, C=copy, /=command, ?=shortcuts

## Key Architecture

- All sections wrapped in `WorkspaceProvider` via root layout
- Each section uses `useWorkspace()` to read/write shared palette
- Global toast: `showToast("msg")` from `@/components/toast`
- Error boundaries wrap every section
- Hash routing preserved on refresh
- Color detail, contrast, and token routes use extended hash patterns (preserved by hash effect)

## Semantic CSS (globals.css)

- `text-page`, `text-secondary`, `text-muted` — theme-aware text
- `surface`, `surface-muted`, `border-default` — theme-aware surfaces
- `hover-accent:hover` — pink accent hover (color + 10% bg)
- `bounce-press:active` — scale(0.96) press animation
- `skeleton` — shimmer loading animation
- `:focus-visible` — accent-colored focus ring on all interactive elements

## Commands

```bash
npm run dev          # Port 1997
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run build        # Next.js production build
npm run test         # Vitest (13 tests)
npm run test:e2e     # Playwright E2E (43 tests)
```

## Intelligence Engine

- `src/lib/palette/palette-intelligence.ts` — Auto-naming, classification tags, design summary, quality report, palette variations
- `src/lib/palette/health-score.ts` — 8-dimension health engine, visual analytics
- All computations memoized via `useMemo` in the inspector

## Mile Marker — v0.9.9

| Field | Value |
|-------|-------|
| Version | `v0.9.9` — About Page Overhaul |
| Date | 2026-07-02 |
| Commit | `<current>` — clean on `main` |
| E2E tests | 43 (Playwright, 8 spec files) |
| Unit tests | 13/13 pass |
| Lint | 0 errors, 0 warnings |
| Known state | Landing page at `/`, workspace at `/studio`, editorial About page with Kovina mention |

## Do Not Add

Accounts, payments, ads, tracking, backend services, external APIs, Coolors branding/assets.

## Required Checks

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```
