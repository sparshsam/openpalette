<div align="center">
  <br />

  <h1>OpenPalette</h1>
  <p>
    <em>A local-first, open-source design color platform.</em>
  </p>

  <p>
    Generate palettes, edit color channels, extract image colors, preview design surfaces, validate accessibility, and export tokens directly in your browser.
  </p>

  <p>
    <strong>Maturity:</strong> Stable. Core features are shipped and production-ready.
  </p>

  <p>
    <a href="https://github.com/sparshsam/openpalette/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/sparshsam/openpalette?sort=semver"></a>
    <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue"></a>
    <a href="https://github.com/sparshsam/openpalette/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/sparshsam/openpalette/ci.yml?label=ci"></a>
    <img alt="Next.js" src="https://img.shields.io/badge/Next.js_16-black?logo=next.js">
    <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white">
    <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS_v4-38BDF8?logo=tailwindcss&logoColor=white">
    <img alt="PRs welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen">
  </p>

  <p>
    <a href="#quick-links"><strong>Quick Links</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#features"><strong>Features</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#screenshots"><strong>Screenshots</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#quick-start"><strong>Quick Start</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#architecture"><strong>Architecture</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#tech-stack"><strong>Tech Stack</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#roadmap"><strong>Roadmap</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#license"><strong>License</strong></a>
  </p>

  <br />
</div>

---

## Quick Links

- [Live demo](https://openpalette.vercel.app) (if deployed)
- [Architecture](docs/architecture.md)
- [Design System](docs/design-system.md)
- [Product Spec](docs/product-spec.md)
- [Roadmap](ROADMAP.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)

## Overview

OpenPalette is a practical color platform for designers, developers, and builders who want fast palette exploration without accounts, tracking, or cloud dependency.

The app is intentionally local-first. Palettes, collections, history, imports, exports, gradients, and image extraction run in the browser and persist with `localStorage`.

It is also intentionally original. OpenPalette does not copy Coolors branding, assets, product language, or visual identity.

## Features

| Feature | Status |
|---|---|
| 2-10 color palette generator | Shipped |
| Harmony modes: analogous, monochromatic, complementary, triadic, split complementary, tetradic, random | Shipped |
| Spacebar generation | Shipped |
| Lock and unlock individual colors | Shipped |
| HEX, RGB, HSL, alpha, and visual color editing | Shipped |
| Copy HEX, RGB, HSL, and Tailwind-ready variables | Shipped |
| Copy full palette | Shipped |
| Gradient generator with linear, radial, angle, CSS, SVG, and PNG | Shipped |
| Import HEX lists, JSON, Tailwind snippets, CSS variables, and URL state | Shipped |
| Download JSON, SVG, CSS, SCSS, Tailwind config, PNG, PDF sheet, and design token JSON | Shipped |
| Shareable URL state without a backend | Shipped |
| Website, mobile, dashboard, poster, social, typography, and brand previews | Shipped |
| WCAG AA/AAA contrast validation and accessibility score | Shipped |
| Protanopia, deuteranopia, and tritanopia simulation | Shipped |
| Suggested accessible replacement colors | Shipped |
| Collections-ready local library with tags, search, favorites, history, duplicate detection, and sorting | Shipped |
| Client-side image color extraction with vibrant/muted modes | Shipped |
| Command palette and keyboard-first workflow | Shipped |
| CSS variables export | Shipped |
| Tailwind config export | Shipped |
| JSON export | Shipped |
| SVG swatches export | Shipped |
| Copy export snippets | Shipped |
| Contrast hints | Shipped |
| Undo generated palettes | Shipped |
| Keyboard shortcuts panel | Shipped |
| Light and dark mode | Shipped |
| Saved palettes in localStorage | Shipped |
| Responsive layout | Shipped |
| PWA metadata | Shipped |
| GitHub Actions CI | Shipped |

## Screenshots

Real screenshots are committed in `assets/screenshots/` for the platform studio.

```
assets/screenshots/
├── studio.png       # Main palette studio
├── visualizer.png   # Visualizer and accessibility panels
└── mobile.png       # Responsive mobile layout
```

## Feature Comparison

| Capability | OpenPalette | Cloud-first palette tools |
|---|---:|---:|
| Works without an account | Yes | Sometimes |
| Local palette persistence | Yes | Rarely |
| No telemetry by design | Yes | Varies |
| Shareable URLs without a backend | Yes | Usually backend-backed |
| Design-token exports | Yes | Often paid or limited |
| Image extraction in-browser | Yes | Varies |
| Open-source architecture | Yes | Usually no |

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict mode) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| State | React client-state + localStorage |
| Deployment | [Vercel](https://vercel.com) (automatic from `main`) |
| Runtime | Node.js >= 22 |

## Getting Started

```bash
# Navigate to the repo
cd ~/repos/sparshsam/openpalette

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Validation
npm run lint
npm run typecheck
```

## Repository Structure

```
openpalette/
├── .github/workflows/
│   └── ci.yml              # Lint, typecheck, build
├── assets/
│   ├── screenshots/         # Product screenshots (TBD)
│   └── diagrams/            # Architecture diagrams (TBD)
├── docs/
│   ├── architecture.md      # Application architecture
│   ├── design-system.md     # Design tokens and UI patterns
│   ├── product-spec.md      # Product requirements
│   └── README.md            # Documentation index
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   └── lib/                 # Utilities and color math
├── public/                  # Static assets
├── AGENTS.md                # AI agent instructions
├── CHANGELOG.md             # Keep a Changelog format
├── CLAUDE.md                # Claude Code instructions
├── CODE_OF_CONDUCT.md       # Professional conduct standards
├── CONTRIBUTING.md          # Contributor guide
├── LICENSE                  # MIT
├── README.md                # This file
├── ROADMAP.md               # Product roadmap
├── SECURITY.md              # Security policy
└── SUPPORT.md               # Support channels
```

## Architecture

OpenPalette is a single-page application with client-side state management:

- **Generation:** Color harmonies are computed in-browser using HSL color math and lock-aware replacement.
- **Locking:** Individual colors can be locked to preserve them during regeneration.
- **Persistence:** Current palette, library, tags, favorites, and history are stored in localStorage — no backend.
- **Exports:** CSS, SCSS, Tailwind, JSON, SVG, PNG, PDF, and design-token formats are generated client-side.
- **Extraction:** Image colors are sampled with browser canvas APIs and never leave the device.

See [docs/architecture.md](docs/architecture.md) for the full architecture document.

## Limitations

- **Local-first.** Palettes are stored in browser localStorage. Clearing browser data will lose unsaved palettes.
- **No accounts.** No cloud sync, no sharing, no collaborative features.
- **localStorage limit.** Large libraries may eventually need the planned IndexedDB migration layer.
- **ASE binary import.** Text exports containing HEX values import today; native binary ASE parsing remains a future parser.
- **PDF export.** The current palette sheet is intentionally lightweight and dependency-free.

## Workflow

1. Branch from `main`: `feat/description`, `fix/description`, `docs/description`
2. Run validation before every PR: `npm run lint && npm run typecheck && npm run build`
3. Open a pull request for every merge into `main`
4. No direct pushes to `main`

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full product roadmap.

## License

MIT — see [LICENSE](LICENSE).

---

*Last updated: June 2026*
