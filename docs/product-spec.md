# OpenPalette Product Spec

## Summary

OpenPalette is a local-first design color platform for designers, developers, and builders who want quick color exploration without accounts, tracking, or cloud dependency.

## Product Principles

- Local-first by default.
- No telemetry.
- No forced accounts.
- No cloud dependency for core workflows.
- Developer-friendly exports.
- Design-tool focused previews.
- Original identity, visuals, and UX language.

## Platform v1 Goals

- Generate palettes with Analogous, Monochromatic, Complementary, Triadic, Split Complementary, Tetradic, and Random modes.
- Support 2-10 colors with lock preservation.
- Edit HEX, RGB, HSL, alpha, and browser-native color picker values.
- Build linear and radial gradients from palette stops.
- Import HEX lists, JSON, Tailwind snippets, CSS variable snippets, and share URL state.
- Export CSS, SCSS, Tailwind config, JSON, SVG, PNG, PDF sheet, and design-token JSON.
- Preview palettes in website, mobile, dashboard, poster, social card, typography, and brand identity contexts.
- Validate WCAG AA/AAA contrast, simulate color-vision deficiencies, and suggest accessible replacements.
- Save local palettes with tags, favorites, history, duplicate detection, and sorting.
- Extract dominant colors from uploaded images client-side.
- Keep keyboard-first workflows fast through Space, shortcut help, and a command palette.

## Primary Workflow

1. User opens the app.
2. User chooses a harmony mode and palette size.
3. User presses Space or clicks Generate.
4. Unlocked colors change; locked colors stay fixed.
5. User edits color channels or imports from text, URL state, or image.
6. User previews the palette across realistic design surfaces.
7. User checks WCAG contrast and color-vision simulations.
8. User saves useful palettes locally with tags or favorites.
9. User exports implementation-ready files or copies a share URL.

## Current Persistence

OpenPalette stores data in `localStorage`:

- `openpalette.current.v1`
- `openpalette.library.v1`
- `openpalette.history.v1`
- `openpalette.theme`

No backend, account, telemetry, or network service is required.

## Accessibility Requirements

- Buttons must have clear accessible names.
- Color inputs must have labels.
- Spacebar generation must not fire while editing text fields.
- Text on color panels should remain readable against the active color.
- Mobile tap targets should remain comfortable.
- Reduced-motion preferences should be respected.
- WCAG AA/AAA results should be visible and understandable.

## Known Limitations

- Native binary Adobe ASE parsing is not implemented yet; snippets containing HEX values import today.
- PDF export is intentionally lightweight and dependency-free.
- Large long-term libraries should move to the planned IndexedDB adapter.
