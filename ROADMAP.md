# OpenPalette Roadmap

OpenPalette starts as a local-first color palette generator and should stay focused: fast palette creation, clean editing, and practical exports without accounts or tracking.

## Completed Foundation

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

### v0.2.0

- [x] Rename saved palettes.
- [x] Export palettes as CSS variables, Tailwind config snippets, JSON, and SVG swatches.
- [x] Copy each export format to clipboard.
- [x] Add undo for generated palettes and loaded saved palettes.
- [x] Add contrast hints with best black/white text color and ratio.
- [x] Improve keyboard shortcuts and visible shortcut help.
- [x] Confirm delete flow for saved palettes.

## Mid-Term

### v0.3.0

- [ ] Add screenshot assets for README.
- [ ] Export downloadable `.json` and `.svg` files.
- [ ] Add import from pasted HEX lists.
- [ ] Add shareable URL state without a backend.
- [ ] Add collection-level saved palette management.
- [ ] Add visual regression checks for the core interface.

- [ ] Palette harmony modes.
- [ ] Accessible contrast scoring.

## Long-Term

- [ ] Optional self-hosted sync adapter.
- [ ] Design-token package export.
- [ ] Figma/design-tool handoff formats.
- [ ] Visual regression tests for core UI.

## Non-Goals

- No user accounts by default.
- No telemetry or analytics.
- No paid tiers.
- No external palette generation APIs.
- No copied Coolors branding, UI, assets, or copy.
