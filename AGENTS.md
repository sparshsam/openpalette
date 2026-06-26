<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Operating Notes

`AGENTS.md` is the canonical instruction file for OpenPalette. Claude, Codex, Hermes, OpenClaw, and other coding agents should follow this file before any secondary tool-specific notes.

## Product Identity

- Visible name: **OpenPalette**
- Repository slug: `openpalette`
- Current release: `v0.6.0`
- Product type: local-first color studio / palette machine
- Brand accent: `#ff66c4` (page background in light mode)
- Light mode bg: `#ff66c4` (bright pink)
- Dark mode bg: `#1a0012` (deep maroon)
- Nav/header bg: `#fff5fc` (light mode), `#2d001e` (dark mode)
- License: MIT
- Dev server port: `1997`

## Design Standard

OpenPalette follows the **OpenProof Design Playbook** (`DESIGN_PLAYBOOK.md` on Sparsh's desktop) as its craft standard:

- **Color studio, not a dashboard.** Every screen serves the palette machine.
- **Editorial layout.** Spacing replaces borders. Typography weight replaces containers.
- **All buttons are pills** (`rounded-full`).
- **Buttons use #ff66c4 as their foundation:** primary = white bg + dark text, secondary = semi-transparent white, active chips = solid white + dark text.
- **Dark mode is designed intentionally** (not auto-inverted) with its own surface/border/text values.
- **Borders are barely visible** (low opacity). Data strips replace bordered boxes.
- **Swatches are full-screen** — each color fills the dynamic viewport height (`h-dvh`) in a vertical stack, edge-to-edge width.

## Current Architecture

### Tabbed layout (6 independent sections)

Navigation is a floating pill group at the top of the page with `#fff5fc` / `#2d001e` background. Each tab is a **fully independent section**:

| Tab | What it does |
|-----|-------------|
| **Studio** | Full palette editor (modes, size, channels, lock, copy) + import/image extraction |
| **Gradient** | Linear/radial gradient builder with angle control, canvas preview, copy/download |
| **Visualizer** | Palette preview as Website/Mobile/Dashboard/Poster/etc. + text color picker + background mode |
| **Accessibility** | WCAG contrast scores, color-vision simulation, pair contrast matrix |
| **Themes** | 10 curated light/dark palette sets — click to load, then edit |
| **Library** | Saved palette browser + export tokens + history |

### Shared Palette Editor (`CompletePaletteEditor`)

Each tab includes its own complete palette state (via `usePalette()` hook): independent colors, mode, undo stack, generate/undo buttons, and keyboard shortcuts (Space=generate, U=undo, S=save in Library). The Studio tab uses `FullSwatches` (full-screen, edge-to-edge). Other tabs use a compact color strip with inline click-to-edit color pickers.

### Color strip (non-Studio tabs)

A horizontal bar of colors (`flex-1 h-14`) with each swatch clickable to open a native color picker and update that color. Hover reveals hex label.

### Current Styles

- Page bg: `#ff66c4` (light) / `#1a0012` (dark)
- Nav + mode strip bg: `#fff5fc` (light) / `#2d001e` (dark)
- Text: `#1a001a` (light) / `#ffe0f5` (dark)
- Buttons: white bg + dark text (primary), semi-transparent white (secondary)
- Fields: semi-transparent white bg + white text
- Chips: white border + white text, active = solid white + dark text
- Selection: white bg + dark text

## Current Scope

The v0.6.x app supports:

- 14 harmony palette generation modes (Analogous, Complementary, Triadic, etc.);
- Full-screen color swatches (one color per viewport, vertical stack);
- Per-color lock, unlock, remove, HEX display, inline color picker;
- HSL and RGB channel editing (togglable);
- Alpha slider per color;
- Palette size control (2–10 colors) with +/- buttons;
- Gradient generator (linear/radial, infinite angle, live canvas);
- Image extraction of dominant colors (drag or browse, in-browser);
- Import from HEX lists, JSON, Tailwind config, CSS variables;
- Visualizer previews with 7 modes (Website, Mobile, Dashboard, Poster, Social, Typography, Brand) + custom text color + background mode;
- WCAG accessibility scores, contrast hints, color-vision simulation (protanopia, deuteranopia, tritanopia);
- Pair contrast matrix;
- Export tokens in CSS, Tailwind, SCSS, Less, JSON, SVG, PNG, PDF;
- Local library with search, tags, sort (5 modes), favorites, and delete;
- Generation history (last 40, click to restore);
- Undo stack (20 deep);
- Keyboard shortcuts (Space=generate, U=undo, S=save);
- Independent state per tab (each tab has its own palette + undo);
- Curated themes browser (10 light/dark palette sets);
- Light and dark modes (intentionally designed);
- All localStorage persistence;
- Static pages: About, Terms, Privacy (editorial playbook style);
- PWA with updated icons, manifest, metadata;
- Fully responsive.

## Do Not Add Without a Decision

- User accounts or authentication.
- Backend services or databases.
- Telemetry, analytics, or tracking.
- Paid features, subscriptions, or ads.
- External palette APIs.
- Coolors branding, UI, assets, text, or product language.
- Social sharing flows that send user data to third-party services.

## Architecture Preferences

- Keep the App Router entrypoint small. Put browser state in client components under `src/components`.
- Keep reusable color logic in `src/lib`.
- Keep persistence local-first and explicit.
- Prefer semantic HTML and accessible labels for controls.
- Keep UI calm, original, fast, and legible.
- Avoid broad rewrites unless there is a clear maintenance reason.
- Dark mode must be designed intentionally (not auto-inverted).
- Tab styles must match nav styling (consistent background and colors).

## Key Files

| Path | Purpose |
|------|---------|
| `src/app/page.tsx` | Single-page app entry |
| `src/app/layout.tsx` | Root layout, fonts, metadata, ThemeProvider |
| `src/app/globals.css` | Design tokens, pill/chip/field/action classes |
| `src/app/manifest.ts` | PWA manifest |
| `src/app/about/page.tsx` | About page |
| `src/app/terms/page.tsx` | Terms of use |
| `src/app/privacy/page.tsx` | Privacy policy |
| `src/components/openpalette-app.tsx` | Main app — all 6 tabs + usePalette hook |
| `src/components/header.tsx` | Sticky header (logo, About link, theme toggle) |
| `src/components/footer.tsx` | Footer (About, Terms, Privacy) |
| `src/components/theme-provider.tsx` | Light/dark toggle with localStorage |
| `src/components/studio/visualizers.tsx` | 7 visualizer previews + fillColors |
| `src/lib/palette/` | Color engine (generation, math, contrast, export, import) |
| `public/icons/` | PWA icon sources (SVG + PNG) |

## Required Checks

Before finishing a code change, run:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run test:coverage
npm run build
```

Documentation-only changes may skip runtime checks if no code, package, config, or test files are touched.

## Release Hygiene

- Update `CHANGELOG.md` for user-facing changes.
- Keep `README.md`, `ROADMAP.md`, and docs aligned with shipped behavior.
- Preserve semver-style release notes.
- Do not mark future work as shipped.
- Dev server uses port `1997` (`npm run dev`).

## Branch Naming

Use conventional prefix branches off `main`:
- `feat/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code restructuring
- `chore/*` — Maintenance tasks

## Workflow

1. Always branch from `main`.
2. Run validation before every PR: `npm run lint && npm run typecheck && npm run build`
3. Open a pull request for every merge into `main`.
4. No direct pushes to `main` (branch protection).
