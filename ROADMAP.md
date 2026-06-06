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

## Near-Term

### v0.2.0

- [ ] Rename saved palettes.
- [ ] Export palettes as CSS variables, Tailwind tokens, JSON, and SVG swatches.
- [ ] Add undo for generated palettes.
- [ ] Add contrast hints for adjacent colors.
- [ ] Improve keyboard shortcuts and visible shortcut help.
- [ ] Add browser-level installability with PWA metadata.
- [ ] Add screenshot assets for README.

## Mid-Term

- [ ] Palette harmony modes.
- [ ] Accessible contrast scoring.
- [ ] Import palettes from pasted HEX lists.
- [ ] Shareable URL state without a backend.
- [ ] Collection-level saved palette management.

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
