# Testing

OpenPalette uses Vitest for engine-level unit tests and V8 coverage.

## Commands

```bash
npm run test
npm run test:coverage
npm run lint
npm run typecheck
npm run build
```

## Coverage Gate

The initial coverage thresholds are intentionally realistic for the new engine split:

- Statements: 80%
- Lines: 80%
- Functions: 75%
- Branches: 65%

Current local run on June 8, 2026:

- 4 test files
- 13 tests
- 89.32% statements
- 89.65% lines
- 93.02% functions
- 66.22% branches

## Covered Areas

- Palette generation, harmony modes, dynamic sizing, and lock preservation.
- WCAG contrast scoring, accessible replacement suggestions, and color-vision simulation.
- Import parsing and share URL roundtrips.
- CSS, Tailwind, token, Style Dictionary, JSON, and SVG export generation.
- Gradient export generation and image pixel extraction.

## Reliability Roadmap

- Add browser interaction tests for critical workflows.
- Add visual regression baselines once the UI stabilizes after refinement.
- Add Lighthouse CI against a stable preview deployment.
