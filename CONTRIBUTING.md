# Contributing to OpenPalette

Thanks for your interest in improving OpenPalette. This is a small open-source project, and thoughtful issues, fixes, accessibility improvements, and design polish are welcome.

## Code of Conduct

Be respectful, constructive, and kind. Keep feedback specific and useful.

## Local Setup

```bash
git clone https://github.com/sparshsam/openpalette.git
cd openpalette
npm install
npm run dev
```

## Pull Requests

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Keep the change focused.
4. Update documentation when behavior changes.
5. Run the required checks before opening a PR.

```bash
npm run lint
npm run typecheck
npm run build
```

## Code Style

- Use TypeScript strict mode.
- Keep browser-only APIs inside client components.
- Prefer small, readable components over large rewrites.
- Preserve local-first behavior.
- Keep UI original; do not copy Coolors branding, layout, assets, or copy.

## Good First Contributions

- Keyboard and screen-reader improvements.
- Additional palette export formats.
- Better saved palette naming.
- Documentation improvements.
- Focus and mobile interaction polish.
