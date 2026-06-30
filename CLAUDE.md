# OpenPalette — Claude Code Instructions

## Project Overview

A local-first, open-source color studio — a palette machine for designers and developers. Built with Next.js 16 + TypeScript + Tailwind CSS v4. No backend, no accounts, no tracking. Deployed at https://palette.kovina.org.

**Current version:** v0.9.7 — Testing & Reliability

## Brand Identity

- **Brand accent:** `#ff66c4` (light mode), `#ff85d0` (dark mode)
- **Light mode:** `#f9f9f9` bg, `#111111` text, `#555555` secondary, `#888888` muted
- **Dark mode:** `#0f0f0f` bg, `#f5f5f5` text, `#aaaaaa` secondary, `#777777` muted
- **Hover effect:** accent pink on all interactive elements
- **Buttons:** Rounded-full pills, hover turns pink accent
- **Editorial design:** No card panels, spacing > borders

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** `WorkspaceProvider` context + localStorage
- **Deployment:** Vercel → palette.kovina.org
- **Runtime:** Node.js >= 22
- **Dev server port:** `1997`

## Commands

```bash
npm run dev          # Dev server on port 1997
npm run build        # Production build
npm run lint         # ESLint check
npm run typecheck    # TypeScript type checking (no emit)
npm run test         # Vitest run
npm run test:e2e     # Playwright E2E (43 tests)
```

## Architecture Constraints

1. **Local-first.** All data in browser (localStorage). No backend, no database.
2. **No accounts.** No authentication, no user profiles, no cloud sync.
3. **No tracking.** No analytics, no telemetry, no third-party scripts.
4. **Client-side only.** Palette generation, color math, exports all in-browser.
5. **Original design.** No Coolors branding, assets, or visual identity.
6. **Dark mode designed intentionally** — not auto-inverted from light mode.
7. **All buttons are pills** (`rounded-full`). Hover accent.
8. **Global button cursor:** `button { cursor: pointer; }` in globals.css.

## Architecture

### Workspace Context (v0.9.0+)
All sections share a single palette via `WorkspaceProvider` + `useWorkspace()` hook.
Undo/redo stacks (50 deep). Persists to localStorage as `openpalette.workspace.v1`.
Changed from previous per-section `usePalette()` model.

### Component Tree
```
layout.tsx (ThemeProvider → WorkspaceProvider)
  Header (sticky, logo + About link + fixed theme toggle)
  OpenPaletteApp (shell)
    ├── Tab nav (scrollable pills, ◀▶ arrows, 10 tabs)
    ├── 10 section components (conditionally rendered)
    ├── WorkspaceToolbar (shared bottom toolbar)
    ├── CommandPalette (triggered by / key)
    └── KeyboardShortcuts (triggered by ? key)
  Toast (global)
  Footer (About, Terms, Terms of Service, Privacy)
```

### 10 Active Tabs
1. **Studio** — Full palette editor with swatches, harmony modes, drag-to-reorder
2. **Explore** — 75 curated palettes with search/filters
3. **Extract** — Image color extraction (6 modes)
4. **Contrast** — WCAG checker (AA/AAA)
5. **Visualizer** — 7 template mockups
6. **Colors** — 150-color library with detail pages
7. **Tokens** — 11-step token scale generator
8. **Gradient** — Linear/radial/conic gradient studio
9. **Accessibility** — Scores, blind sim, contrast matrix, typography audit
10. **Settings** — Theme, defaults, import/export, reset, About

Themes and Library tabs were archived in v0.8.10 (preserved in git history).

## Key Files

### Workspace & State
| Path | Purpose |
|------|---------|
| `src/components/workspace-context.tsx` | Global palette state provider + useWorkspace hook |
| `src/components/workspace-toolbar.tsx` | Shared bottom toolbar (generate, copy, save, share, undo/redo, inspector, history, snapshots, export) |
| `src/components/command-palette.tsx` | Search palette (/ key) — pages, palettes, colors, quick actions |
| `src/components/keyboard-shortcuts.tsx` | Shortcuts reference modal (? key) |
| `src/components/theme-provider.tsx` | Light/dark toggle |

### Intelligence & Analytics
| Path | Purpose |
|------|---------|
| `src/components/palette-inspector.tsx` | Full diagnostics: health score, analytics, quality, compare, variations, naming |
| `src/lib/palette/health-score.ts` | 8-dimension health engine + visual analytics |
| `src/lib/palette/palette-intelligence.ts` | Naming, tags, summary, quality report, variations generation |

### Export & Tokens
| Path | Purpose |
|------|---------|
| `src/components/export-modal.tsx` | Export preview: 11 formats, naming presets, token groups, import |
| `src/lib/palette/token-engine.ts` | Semantic token generation + naming presets |
| `src/lib/palette/advanced-export.ts` | 11 export formatters + import parser |
| `src/components/design-system-preview.tsx` | Visual component gallery using tokens |

### Sections
| Path | Purpose |
|------|---------|
| `src/components/openpalette-app.tsx` | Shell — tab nav, routing, global keyboard shortcuts |
| `src/components/studio/studio-section.tsx` | Palette editor |
| `src/components/explore/explore-section.tsx` | Palette discovery |
| `src/components/image-picker/image-picker-section.tsx` | Image extraction |
| `src/components/contrast/contrast-section.tsx` | WCAG contrast |
| `src/components/visualizer/visualizer-section.tsx` | Template gallery |
| `src/components/colors/colors-section.tsx` | Color library |
| `src/components/tokens/tokens-section.tsx` | Token generator |
| `src/components/gradient/gradient-section.tsx` | Gradient studio |
| `src/components/a11y/a11y-section.tsx` | Accessibility studio |
| `src/components/settings-section.tsx` | Settings page |

### Infrastructure
| Path | Purpose |
|------|---------|
| `src/app/layout.tsx` | Root layout, providers, metadata |
| `src/app/globals.css` | Design tokens, semantic classes, animations, focus rings |
| `src/components/header.tsx` | Sticky header with logo + theme toggle |
| `src/components/footer.tsx` | Footer with legal links |
| `src/components/toast.tsx` | Global toast system |
| `src/components/error-boundary.tsx` | Error boundary with recovery |
| `src/lib/palette/color.ts` | Color math (HEX, HSL, RGB, contrast) |
| `src/lib/palette/color-info.ts` | Named color DB (57 entries with psychology) |
| `src/lib/palette/palette-engine.ts` | Palette generation, harmony, resize |
| `src/lib/palette/accessibility-engine.ts` | WCAG contrast, accessibility score, vision simulation |

## Global Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Space | Generate palette |
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| C | Copy palette |
| / | Open command palette |
| ? | Open keyboard shortcuts |

Shortcuts only fire when no input/textarea is focused.

## Semantic CSS Classes

- `text-page`, `text-secondary`, `text-muted` — text colors
- `surface`, `surface-muted`, `border-default` — backgrounds/borders
- `hover-accent` — pink accent hover effect
- `bounce-press:active` — subtle press animation
- `skeleton` — shimmer loading animation

## Release History

- v0.9.7 — Testing & Reliability (Playwright E2E tests, keyboard bugfix, responsive testing)
- v0.9.6 — Palette Intelligence (naming, tags, summary, quality, variations)
- v0.9.5 — Legal Pages + Tokens Polish (terms-of-service, author fixes, dashboard polish)
- v0.9.4 — Release Candidate Hardening (focus rings, error boundary, SEO, docs)
- v0.9.3 — Production Polish (Settings page, keyboard shortcuts modal)
- v0.9.2 — Design System & Export Intelligence (tokens, 11 exports, design preview)
- v0.9.1 — Workspace Intelligence (health score, recommendations, snapshots, compare)
- v0.9.0 — Workspace Foundation (shared state, unified toolbar, global shortcuts)

## Required Checks

```bash
npm run lint && npm run typecheck && npm run build && npm run test
```

## Release Hygiene

- Update `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`, `package.json` version
- Bump semver appropriately (current: v0.9.7)
- Run full check suite before commit
- No direct pushes to `main` (branch protection via GitHub)
