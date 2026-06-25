# OpenPalette — Claude Code Instructions

## Project Overview

OpenPalette is a local-first, open-source color studio — a palette machine for designers and developers. Built with Next.js 16 + TypeScript + Tailwind CSS v4. Brand accent: #ff66c4. No backend, no accounts, no tracking.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4
- **State:** React client-side state + localStorage
- **Deployment:** Vercel (automatic from `main`)
- **Runtime:** Node.js >= 22

## Commands

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint check
npm run typecheck # TypeScript type checking (no emit)
```

## Architecture Constraints

1. **Local-first.** All data lives in the browser (localStorage). No backend, no database.
2. **No accounts.** No authentication, no user profiles, no cloud sync.
3. **No tracking.** No analytics, no telemetry, no third-party scripts.
4. **Client-side only.** Palette generation, color math, and exports all happen in the browser.
5. **Original design.** OpenPalette does not copy Coolors branding, assets, or visual identity.

## Branch Naming

- `feat/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code restructuring
- `chore/*` — Maintenance tasks

## Workflow

1. Always branch from `main`.
2. Run `npm run lint && npm run typecheck && npm run build` before every PR.
3. Open a pull request for every merge into `main`.
4. No direct pushes to `main`.
