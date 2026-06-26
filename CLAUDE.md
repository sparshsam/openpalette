# OpenPalette — Claude Code Instructions

## Project Overview

A local-first, open-source color studio — a palette machine for designers and developers. Built with Next.js 16 + TypeScript + Tailwind CSS v4. No backend, no accounts, no tracking.

## Brand Identity

- **Brand accent / page bg:** `#ff66c4` (light mode), `#1a0012` (dark mode)
- **Nav/header bg:** `#fff5fc` (light), `#2d001e` (dark)
- **Text color:** `#1a001a` (light), `#ffe0f5` (dark)
- **Buttons:** White bg + dark text for primary, semi-transparent white for secondary
- **Editorial design:** No card panels, no dashboard widgets. Spacing > borders.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** React client-side state + localStorage
- **Deployment:** Vercel (automatic from `main`, 100 deploys/day free limit)
- **Runtime:** Node.js >= 22
- **Dev server port:** `1997`

## App Structure

Single-page app with 6 independent tabbed sections, each with its own palette state:

- **6 tabs:** Studio, Gradient, Visualizer, Accessibility, Themes, Library
- **Nav:** Floating pill group at top (`#fff5fc` / `#2d001e` bg)
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
7. **All buttons are pills** (`rounded-full`). Containers are the exception, not the rule.

## Key CSS Custom Properties

```css
:root {
  --bg-base: #ff66c4;        /* page bg — light mode */
  --text-primary: #1a001a;   /* main text */
  --text-secondary: #3d003d; /* secondary text */
  --text-muted: #6b3362;     /* muted text */
}

[data-theme="dark"] {
  --bg-base: #1a0012;
  --text-primary: #ffe0f5;
  --text-secondary: #d4a0c0;
  --text-muted: #996b8a;
}
```

## Tab State Model

Each tab uses the `usePalette()` hook for fully independent state:
- `colors: PaletteColor[]` — array of color objects with id, hex, alpha, locked
- `mode: PaletteMode` — harmony mode (Analogous, Complementary, etc.)
- `paletteHex: string[]` — computed hex values
- `undoStack` — 20-deep undo per tab
- Functions: generate, undo, setPalette, updateHex, updateHsl, updateRgb, updateAlpha, toggleLock, setSize, switchMode

The Library tab manages its own `library` and `history` states (persisted to localStorage).

## Component Architecture

```
OpenPaletteApp (shell)
  ├── Tab nav (pill group, top)
  ├── StudioSection
  │     ├── Controls (generate/undo, mode strip)
  │     ├── FullSwatches (h-dvh per color, vertical stack, edge-to-edge)
  │     └── Import (textarea, image drop)
  ├── GradientSection
  │     ├── Controls + compact color strip
  │     ├── Gradient kind/angle controls
  │     └── Canvas + copy/download buttons
  ├── VisualizerSection
  │     ├── Compact color strip + visualizer type selector
  │     ├── Text color picker + background mode
  │     └── VisualizerPreview (7 modes)
  ├── AccessibilitySection
  │     ├── Compact color strip + simulation selector
  │     ├── Readable text previews (3 colors)
  │     └── Pair contrast matrix
  ├── ThemesSection
  │     ├── Theme browser grid (10 curated sets)
  │     ├── Editable color strip
  │     └── Quick mode buttons
  └── LibrarySection
        ├── Compact color strip + export format selector
        ├── Token preview + copy/download/png/pdf buttons
        ├── Saved palette browser (search, tags, sort)
        └── Generation history
```

## Sharing State Between Tabs

Tabs do NOT share palette state. Each tab manages its own colors independently via `usePalette()`. This means changing a color in Studio does not affect Visualizer's palette. The Library tab stores global saved/archived palettes.

## Branch Naming

- `feat/*`, `fix/*`, `docs/*`, `refactor/*`, `chore/*`

## Workflow

1. Branch from `main`.
2. Run `npm run lint && npm run typecheck && npm run build` before every PR.
3. Open a pull request for every merge into `main`.
4. No direct pushes to `main`.
