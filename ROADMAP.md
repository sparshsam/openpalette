# OpenPalette Roadmap

OpenPalette starts as a local-first color palette generator and should stay focused: fast palette creation, clean editing, and practical exports without accounts or tracking.

## Completed Foundation

### v0.5.0 — Design Identity

- [x] OpenProof Design Playbook applied
- [x] #ff66c4 brand accent
- [x] Intentionally designed dark mode
- [x] Light/dark toggle in header
- [x] Editorial, on-canvas layout (no cards)
- [x] Footer with About, Terms, Privacy
- [x] /about, /terms, /privacy pages
- [x] Updated PWA icons, favicon, manifest

### v0.1.0

- [x] Next.js App Router setup
- [x] TypeScript strict mode
- [x] Tailwind CSS
- [x] ESLint and typecheck scripts
- [x] Five-color palette generator
- [x] Spacebar generation
- [x] Lock and unlock colors
- [x] HEX editing
- [x] Copy individual colors
- [x] Copy full palette
- [x] Light and dark mode
- [x] localStorage saved palettes
- [x] GitHub Actions CI
- [x] Open-source documentation and MIT license

### v0.1.1

- [x] README publishing polish
- [x] Screenshots placeholder section
- [x] Vercel deployment instructions
- [x] GitHub About description and topics documented
- [x] PWA manifest metadata
- [x] Accessibility polish for status, swatches, controls, and HEX inputs
- [x] localStorage hydration hardening

## Near-Term

### v0.4.0

- [x] Split core platform engines into focused modules.
- [x] Add Vitest coverage for palette, accessibility, import/export, gradient, and image extraction behavior.
- [x] Collapse advanced controls by default.
- [x] Add semantic token and scale previews.
- [x] Add Style Dictionary compatible export.
- [x] Add performance and testing docs.
- [x] Add animated demo GIF.
- [ ] Add browser interaction tests for the full palette workflow.
- [ ] Add trustworthy Lighthouse CI on a hosted preview URL.

### v0.3.0

- [x] Palette harmony modes.
- [x] Dynamic 2-10 color palettes.
- [x] HSL, RGB, alpha, and visual color editing.
- [x] Gradient system with linear/radial CSS, SVG, and PNG exports.
- [x] Import HEX lists, JSON, Tailwind snippets, CSS variables, and URL palette state.
- [x] Download CSS, SCSS, Tailwind, JSON, SVG, PNG, PDF, and design token exports.
- [x] Shareable URL state without a backend.
- [x] Visualizer previews for website, mobile, dashboard, poster, social, typography, and brand surfaces.
- [x] WCAG AA/AAA accessibility toolkit and color-vision simulation.
- [x] Local library with tags, search, favorites, history, duplicate detection, and sorting.
- [x] Client-side image color extraction.
- [x] Command palette and keyboard-first workflow.

### v0.2.0

- [x] Rename saved palettes.
- [x] Export palettes as CSS variables, Tailwind config snippets, JSON, and SVG swatches.
- [x] Copy each export format to clipboard.
- [x] Add undo for generated palettes and loaded saved palettes.
- [x] Add contrast hints with best black/white text color and ratio.
- [x] Improve keyboard shortcuts and visible shortcut help.
- [x] Confirm delete flow for saved palettes.

## Mid-Term

### v0.5.0

- [ ] Add native Adobe ASE binary parser.
- [ ] Add IndexedDB migration layer for large libraries.
- [ ] Add visual regression checks for the core interface.
- [ ] Add richer PDF sheet layouts.
- [ ] Add installable offline PWA service worker.

## Long-Term

- [ ] Optional self-hosted sync adapter.
- [ ] Figma/design-tool handoff formats.
- [ ] Semantic palette suggestion engine.

## Non-Goals

- No user accounts by default.
- No telemetry or analytics.
- No paid tiers.
- No external palette generation APIs.
- No copied Coolors branding, UI, assets, or copy.
