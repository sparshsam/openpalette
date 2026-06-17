# Versioning

OpenPalette follows [Semantic Versioning 2.0.0](https://semver.org/).

Given a version number `MAJOR.MINOR.PATCH`:

| Increment | When |
|-----------|------|
| MAJOR | Breaking changes to the public API, data model, or export formats |
| MINOR | New features that maintain backward compatibility |
| PATCH | Bug fixes, documentation, or internal refactoring |

## Pre-release Versions

Pre-release tags (e.g., `v0.2.0-alpha.1`) may be used during active development cycles.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for per-version release notes.

## Compatibility

OpenPalette is a client-side application with no backend API. The "public API" includes:

- Export formats (CSS, SCSS, Tailwind, JSON, SVG, PNG, PDF, design tokens)
- Import formats (HEX lists, JSON, Tailwind snippets, CSS variables, URL state)
- Shareable URL parameter schema
- localStorage data shape (active palette, saved palettes, preferences)

Changes to any of these that break backward compatibility require a MAJOR version bump.
