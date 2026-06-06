# OpenPalette Architecture

## Stack

- Next.js App Router
- React 19
- TypeScript
- Tailwind CSS v4
- ESLint
- localStorage persistence

## File Map

| Path | Purpose |
|---|---|
| `src/app/layout.tsx` | Root metadata, font loading, and app shell |
| `src/app/page.tsx` | Server component route entry |
| `src/components/openpalette-app.tsx` | Client-side palette UI and browser state |
| `src/lib/palette.ts` | Palette types, generation, HEX normalization, export snippets, and contrast helpers |
| `src/app/globals.css` | Tailwind import, theme tokens, and shared button styles |

## Client Boundary

`src/app/page.tsx` remains a small server component. Browser APIs such as `localStorage`, `navigator.clipboard`, `crypto.randomUUID`, keyboard listeners, and theme mutation live inside `OpenPaletteApp`.

## State Model

```text
PaletteColor
  id: string
  hex: string
  locked: boolean

SavedPalette
  id: string
  name: string
  colors: string[]
  createdAt: string
```

## Persistence

All persistence is local to the browser:

- active palette: `openpalette.current`
- saved palettes: `openpalette.saved`
- theme: `openpalette.theme`

## v0.2 Feature Ownership

| Feature | Owner |
|---|---|
| Export snippet generation | `src/lib/palette.ts` |
| Contrast math and labels | `src/lib/palette.ts` |
| Saved palette rename/delete confirmation | `src/components/openpalette-app.tsx` |
| Undo stack | `src/components/openpalette-app.tsx` |
| Keyboard shortcuts panel | `src/components/openpalette-app.tsx` |

## Build and Release Checks

```bash
npm run lint
npm run typecheck
npm run build
```

CI runs the same checks on pushes and pull requests to `main`.
