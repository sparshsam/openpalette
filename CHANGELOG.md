# Changelog

All notable changes to OpenPalette will be documented in this file.

## v0.5.0 - 2026-06-25

### design: overhaul OpenPalette identity

- **Design system overhaul** — Applied the OpenProof Design Playbook as the craft standard.
- **Brand accent** — `#ff66c4` as the primary brand color (light + dark mode).
- **Dark mode** — Intentionally designed with dedicated surface values, not auto-inverted.
- **Theme toggle** — Light/dark switch at the far right of the sticky header.
- **Color studio layout** — Redesigned as a palette machine, not a dashboard. No card grids, no bordered panels. Editorial sections with generous spacing, typography hierarchy, and on-canvas layout.
- **Swatches** — Full-width hero section with inline HEX/RGB/HSL editing, alpha slider, lock control, channel toggles, and contrast hints.
- **Footer** — Added About, Terms, and Privacy links.
- **Static pages** — `/about`, `/terms`, `/privacy` pages with matching editorial design.
- **App icon** — Updated PWA icons, favicon, apple-touch-icon, and manifest from the new SVG source.
- **All functionality preserved** — Harmony modes, gradient generator, image extraction, visualizer, design tokens, accessibility toolkit, exports, library, history, undo/command palette.

## v0.4.0 - 2026-06-08

- Refined the platform expansion into a calmer production-grade design tool.
- Split palette, accessibility, gradient, import, export, library, and image extraction logic into focused engines.
- Added Vitest unit tests and V8 coverage for core platform engines.
- Added Style Dictionary compatible token export.
- Added design-system previews for semantic color roles, spacing, typography, and radii.
- Collapsed advanced RGB/HSL editing by default to reduce interface density.
- Deferred local library filtering to keep search typing responsive.
- Added performance and testing documentation.
- Added an animated product demo GIF.
- Updated CI to run coverage before build.

## v0.3.0 - 2026-06-08

- Expanded OpenPalette into a local-first design color platform.
- Added harmony modes, dynamic 2-10 color palettes, and lock-aware generation.
- Added HEX, RGB, HSL, alpha, visual color editing, and per-format copying.
- Added gradient generation with CSS, SVG, and PNG export.
- Added imports for HEX lists, JSON, Tailwind snippets, CSS variables, and shareable URL state.
- Added downloadable CSS, SCSS, Tailwind, JSON, SVG, PNG, PDF, and design token exports.
- Added website, mobile, dashboard, poster, social, typography, and brand visualizers.
- Added WCAG AA/AAA scoring, accessibility warnings, readable previews, suggested replacements, and color-vision simulation.
- Added local library collections architecture with tags, search, favorites, history, duplicate detection, and sorting.
- Added client-side image color extraction with vibrant, muted, and balanced modes.
- Added command palette, smoother responsive behavior, richer empty states, and repository templates.

## v0.2.0 - 2026-06-06

- Added saved palette renaming.
- Added confirmed saved palette deletion.
- Added export tools for CSS variables, Tailwind config snippets, JSON, and SVG swatches.
- Added copy-to-clipboard actions for each export format.
- Added contrast hints with best readable black/white text color, contrast ratio, and strength label.
- Added undo for generated palettes and loaded saved palettes.
- Added keyboard shortcuts and an in-app shortcut help panel.
- Updated README, ROADMAP, AGENTS, package metadata, and release documentation for v0.2.0.
- Prepared repository maintenance standards for protected `main` branch workflows.

## v0.1.1 - 2026-06-06

- Polished README structure for GitHub publishing readiness.
- Documented Vercel deployment, screenshots, repository topics, and GitHub About recommendations.
- Added PWA manifest and app metadata.
- Improved accessibility for status announcements, theme toggle state, copy controls, swatches, and HEX inputs.
- Hardened localStorage hydration so stored palettes are not overwritten by the initial default palette.
- Confirmed CI, Dependabot, agent instruction files, package metadata, and release checks.

## v0.1.0 - 2026-06-06

- Initial open-source release.
- Built a five-color palette generator with Spacebar generation.
- Added per-color lock and unlock controls.
- Added editable HEX inputs with normalization.
- Added copy-to-clipboard for individual colors and full palettes.
- Added light and dark mode.
- Added localStorage persistence for current palette, saved palettes, and theme.
- Added responsive UI for desktop and mobile.
- Added repository documentation, MIT license, GitHub Actions CI, Dependabot, and agent guidance files.
