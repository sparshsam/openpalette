<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from older training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing code and heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Agent Operating Notes

`AGENTS.md` is the canonical instruction file for OpenPalette. Claude, Codex, Hermes, OpenClaw, and other coding agents should follow this file before any secondary tool-specific notes.

## Product Identity

- Visible name: **OpenPalette**
- Repository slug: `openpalette`
- Current release: `v0.2.0`
- Product type: local-first color palette generator
- License: MIT

Use **OpenPalette** in visible product copy. Use `openpalette` only for package names, repository URLs, internal storage keys, and CLI references.

## Current Scope

The v0.2.x app supports:

- five-color palette generation;
- Spacebar generation when focus is not inside an editable control;
- per-color lock and unlock;
- editable HEX values with normalization;
- copy-to-clipboard for individual colors and full palettes;
- export snippets for CSS variables, Tailwind config, JSON, and SVG swatches;
- best black/white text-color hints with contrast ratios;
- undo for generated and loaded palettes;
- saved palette rename and confirmed delete;
- keyboard shortcuts and an in-app help panel;
- light and dark modes;
- localStorage persistence for the active palette, theme, and saved palettes;
- responsive layouts for mobile and desktop.

## Do Not Add Without a Decision

- User accounts or authentication.
- Backend services or databases.
- Telemetry, analytics, or tracking.
- Paid features, subscriptions, or ads.
- External palette APIs.
- Coolors branding, UI, assets, text, or product language.
- Social sharing flows that send user data to third-party services.

## Architecture Preferences

- Keep the App Router entrypoint small. Put browser state in client components under `src/components`.
- Keep reusable color logic in `src/lib`.
- Keep persistence local-first and explicit.
- Prefer semantic HTML and accessible labels for controls.
- Keep UI calm, original, fast, and legible.
- Avoid broad rewrites unless there is a clear maintenance reason.

## Required Checks

Before finishing a code change, run:

```bash
npm audit --audit-level=moderate
npm run lint
npm run typecheck
npm run build
```

Documentation-only changes may skip runtime checks if no code, package, config, or test files are touched.

## Release Hygiene

- Update `CHANGELOG.md` for user-facing changes.
- Keep `README.md`, `ROADMAP.md`, and docs aligned with shipped behavior.
- Preserve semver-style release notes.
- Do not mark future work as shipped.

## Branch Naming

Use conventional prefix branches off `main`:
- `feat/*` — New features
- `fix/*` — Bug fixes
- `docs/*` — Documentation changes
- `refactor/*` — Code restructuring
- `chore/*` — Maintenance tasks

## Workflow

1. Always branch from `main`.
2. Run validation before every PR: `npm run lint && npm run typecheck && npm run build`
3. Open a pull request for every merge into `main`.
4. No direct pushes to `main`.
