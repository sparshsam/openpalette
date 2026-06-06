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

Five responsive color panels. Each panel owns:

- position marker;
- lock control;
- HEX input;
- copy action.

### Saved Palette Rail

Right-side rail on desktop, stacked below the generator on smaller screens. Saved palettes show compact five-swatch previews.

### Export Panel

Export tools sit below the primary palette workflow. Format choices use a compact vertical tab list on desktop and stack naturally on mobile. Snippets use Geist Mono and the subtle surface token.

### Contrast Hints

Contrast hints are plain utility text, not decorative scores. Each color reports the better readable text color (`black` or `white`) and the contrast ratio for that pairing.

## Interaction Notes

- Spacebar generates a palette only when focus is not inside an input.
- Locked colors persist across generation.
- HEX inputs normalize on blur.
- Copy actions announce short status messages in the header area.
- `U` restores the previous generated or loaded palette.
- `S` saves the active palette.
- `?` toggles keyboard help.
