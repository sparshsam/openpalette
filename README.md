<div align="center">
  <br />

  <h1>OpenPalette</h1>
  <p>
    <em>A local-first, open-source five-color palette generator.</em>
  </p>

  <p>
    Generate, lock, edit, copy, and save color palettes directly in your browser.
  </p>

  <p>
    <a href="https://github.com/sparshsam/openpalette/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/sparshsam/openpalette?sort=semver"></a>
    <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue"></a>
    <a href="https://github.com/sparshsam/openpalette/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/sparshsam/openpalette/ci.yml?label=ci"></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-black?logo=next.js">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?logo=tailwindcss&logoColor=white">
    <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen">
  </p>

  <p>
    <a href="#features"><strong>Features</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#quick-start"><strong>Quick Start</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#architecture"><strong>Architecture</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#roadmap"><strong>Roadmap</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#license"><strong>License</strong></a>
  </p>

  <br />
</div>

---

## Overview

OpenPalette is a practical color palette tool for designers, developers, and builders who want quick palette exploration without accounts, tracking, or cloud dependency.

The app is intentionally local-first. Palettes are generated in the browser, copied through the Clipboard API, and saved in `localStorage`.

## Features

| Feature | Status |
|---|---|
| Five-color palette generator | Shipped |
| Spacebar generation | Shipped |
| Lock and unlock individual colors | Shipped |
| HEX editing and normalization | Shipped |
| Copy individual colors | Shipped |
| Copy full palette | Shipped |
| Light and dark mode | Shipped |
| Saved palettes in localStorage | Shipped |
| Responsive layout | Shipped |
| GitHub Actions CI | Shipped |

## What OpenPalette Is

- A small, fast palette generator.
- A local-first browser app.
- A clean open-source Next.js project.
- A practical starting point for palette exports, accessibility scoring, and design-token workflows.

## What OpenPalette Is Not

- Not a Coolors clone.
- Not an account-based design platform.
- Not a cloud sync service.
- Not a telemetry or analytics product.
- Not a paid palette marketplace.

## Tech Stack

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript
- **UI:** React 19 + Tailwind CSS v4
- **Persistence:** localStorage
- **Quality:** ESLint, TypeScript, production build checks
- **CI:** GitHub Actions

## Quick Start

```bash
git clone https://github.com/sparshsam/openpalette.git
cd openpalette
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |

## Architecture

OpenPalette keeps browser-only state inside a client component and shared color logic in `src/lib`.

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   └── openpalette-app.tsx
└── lib/
    └── palette.ts
```

See [docs/architecture.md](docs/architecture.md), [docs/product-spec.md](docs/product-spec.md), and [docs/design-system.md](docs/design-system.md).

## Privacy

OpenPalette does not require login, analytics, backend APIs, or external palette services. Saved palettes live in your browser's localStorage.

## Roadmap

Near-term v0.2 work is focused on practical exports and smoother editing:

- Rename saved palettes.
- Export CSS variables, Tailwind tokens, JSON, and SVG swatches.
- Add undo.
- Add contrast hints.
- Improve keyboard shortcut help.

See [ROADMAP.md](ROADMAP.md).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before making changes.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
