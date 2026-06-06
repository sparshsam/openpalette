# OpenPalette Product Spec

## Summary

OpenPalette is a local-first five-color palette generator for designers, developers, and builders who want quick color exploration without accounts, tracking, or cloud dependency.

## v0.1 Goals

- Generate a five-color palette quickly.
- Keep selected colors stable through lock controls.
- Allow direct HEX editing.
- Make copying colors frictionless.
- Save palettes locally in the browser.
- Provide light and dark app modes.
- Stay visually original and avoid Coolors branding, UI, assets, and text.

## v0.2 Goals

- Rename saved palettes.
- Delete saved palettes only after confirmation.
- Export the active palette as CSS variables, Tailwind config, JSON, and SVG swatches.
- Copy each export format to the clipboard.
- Show basic black/white text contrast hints for each color.
- Undo generated palettes.
- Provide a visible keyboard shortcut help panel.

## Primary Workflow

1. User opens the app.
2. User presses Space or clicks Generate.
3. Unlocked colors change; locked colors stay fixed.
4. User edits HEX values when needed.
5. User copies individual colors or the full palette.
6. User saves useful palettes locally.
7. User can reload a saved palette later in the same browser.
8. User can export the active palette into implementation-ready snippets.
9. User can inspect which black/white text color is more readable on each swatch.

## Current Persistence

OpenPalette stores data in `localStorage`:

- `openpalette.current`
- `openpalette.saved`
- `openpalette.theme`

No backend, account, telemetry, or network service is required.

## Accessibility Requirements

- Buttons must have clear accessible names.
- HEX inputs must have labels.
- Spacebar generation must not fire while editing text fields.
- Text on color panels should remain readable against the active color.
- Mobile tap targets should remain comfortable.

## Non-Goals for v0.1

- Accounts.
- Cloud sync.
- Collaborative palettes.
- Marketplace or monetization.
- External generation APIs.
