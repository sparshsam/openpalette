# OpenPalette Design System

## Design Principles

- Original, calm, practical interface.
- The palette is the product; chrome stays restrained.
- Avoid copied Coolors branding, UI, assets, text, and layout details.
- Keep controls readable on mobile and desktop.
- Favor native web controls and accessible labels over decorative UI.

## Tokens

| Token | Light | Dark |
|---|---|---|
| Background | `#F6F4EF` | `#11110F` |
| Foreground | `#161412` | `#F5F1E8` |
| Surface | `#FFFDFA` | `#1A1916` |
| Subtle | `#EEEAE1` | `#24221E` |
| Muted | `#6F685F` | `#B5AB9E` |
| Border | `#DED7CA` | `#343027` |

## Typography

- Interface font: Geist Sans
- Code and HEX font: Geist Mono
- Headings use compact tracking and medium-to-semibold weights.
- Utility labels use uppercase text with wide tracking.

## Components

### Header

Compact brand block, direct action buttons, and theme toggle.

### Palette Panels

Responsive 2-10 color panels. Each panel owns:

- position marker;
- lock control;
- visual color picker;
- HEX input;
- RGB, HSL, and alpha controls;
- copy actions.

### Local Library Rail

Right-side rail on desktop, stacked below the generator on smaller screens. Library records show compact swatch previews, editable names, tags, favorites, and delete controls.

### Export Panel

Export tools sit below the primary palette workflow. Format choices use a compact vertical tab list on desktop and stack naturally on mobile. Snippets use Geist Mono and the subtle surface token.

### Contrast Hints

Contrast hints are plain utility text, not decorative scores. Each color reports the better readable text color (`black` or `white`) and the contrast ratio for that pairing.

### Platform Panels

- Gradient panel: canvas preview, angle slider, CSS/SVG/PNG actions.
- Import panel: textarea import, image upload, drag/drop, extraction controls.
- Visualizer panel: tabbed realistic previews for website, mobile, dashboard, poster, social, typography, and brand contexts.
- Accessibility panel: score badge, color-vision simulation, readability previews, and replacement suggestions.

### Design-System Preview

The design-system preview maps active palette colors into semantic roles and shows spacing, typography, and radius scales. This keeps OpenPalette oriented around reusable product tokens instead of isolated swatches.

Semantic roles:

- `semantic.ink`
- `semantic.muted`
- `semantic.accent`
- `semantic.surface`
- `semantic.palette-*`

Exported token sets include color, spacing, radii, shadow, and motion scales, including a Style Dictionary compatible JSON output.

## Interaction Notes

- Spacebar generates a palette only when focus is not inside an input.
- Locked colors persist across generation.
- HEX inputs normalize on blur.
- Copy actions announce short status messages in the header area.
- `U` restores the previous generated or loaded palette.
- `S` saves the active palette.
- `Ctrl/Command K` opens the command palette.
- Shortcut help documents the keyboard-first path.
