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
    <a href="#screenshots"><strong>Screenshots</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#quick-start"><strong>Quick Start</strong></a>
    &nbsp;&nbsp;·&nbsp;&nbsp;
    <a href="#deployment"><strong>Deploy</strong></a>
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

It is also intentionally original. OpenPalette does not copy Coolors branding, assets, product language, or visual identity.

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
| PWA metadata | Shipped |
| GitHub Actions CI | Shipped |

## Screenshots

Screenshots will be added after the first hosted release is published.

Recommended assets:

| Asset | Path | Purpose |
|---|---|---|
| Desktop app screenshot | `assets/screenshots/openpalette-desktop.png` | README hero and release notes |
| Mobile app screenshot | `assets/screenshots/openpalette-mobile.png` | Responsive proof |
| Saved palettes screenshot | `assets/screenshots/openpalette-saved.png` | Feature documentation |

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

## Local Development

Requirements:

| Tool | Version |
|---|---|
| Node.js | `>=22.0.0 <25.0.0` |
| npm | `>=10.0.0` |

Recommended development loop:

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript checks |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm audit --audit-level=moderate` | Check dependency advisories |

## Deployment

OpenPalette is ready for Vercel.

### Deploy with Vercel Dashboard

1. Create a GitHub repository named `openpalette`.
2. Push this repository to GitHub.
3. Import the project in Vercel.
4. Use the default Next.js framework settings.
5. Deploy.

No environment variables are required for v0.1.1.

### Deploy with Vercel CLI

```bash
npm install -g vercel
vercel
vercel --prod
```

Production build command:

```bash
npm run build
```

## Release Checks

Run these before tagging or publishing a release:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run build
```

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

## GitHub Repository Setup

Recommended GitHub About description:

```text
Local-first, open-source five-color palette generator built with Next.js, TypeScript, and Tailwind CSS.
```

Recommended topics:

```text
color-palette, palette-generator, nextjs, typescript, tailwindcss, local-first, design-tools, open-source, frontend, accessibility
```

Recommended About links:

| Link | Value |
|---|---|
| Website | Vercel production URL after deployment |
| Releases | `https://github.com/sparshsam/openpalette/releases` |
| Issues | `https://github.com/sparshsam/openpalette/issues` |
| Security | `SECURITY.md` |

## Roadmap

Near-term v0.2 work is focused on practical exports and smoother editing:

- Rename saved palettes.
- Export CSS variables, Tailwind tokens, JSON, and SVG swatches.
- Add undo.
- Add contrast hints.
- Improve keyboard shortcut help.

See [ROADMAP.md](ROADMAP.md).

## Release Notes

The current release preparation target is `v0.1.1`.

Suggested first GitHub release title:

```text
OpenPalette v0.1.1
```

Suggested first release summary:

```text
Initial polished public release of OpenPalette: a local-first five-color palette generator with locking, HEX editing, copy actions, dark mode, saved palettes, PWA metadata, CI, Dependabot, and open-source documentation.
```

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) and [AGENTS.md](AGENTS.md) before making changes.

## Security

Please report vulnerabilities privately. See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
