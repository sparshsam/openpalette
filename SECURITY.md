# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 0.1.x | Active |

## Reporting a Vulnerability

If you discover a security issue, please report it responsibly.

- Email: [sparsh.sam@icloud.com](mailto:sparsh.sam@icloud.com)
- Do not open public GitHub issues for security vulnerabilities.
- Include reproduction steps, impact, and any suggested fix.

## Security and Privacy Notes

OpenPalette is local-first. It does not require accounts, backend services, analytics, or external palette APIs.

Current browser storage:

- active palette in `localStorage`;
- saved palettes in `localStorage`;
- theme preference in `localStorage`.

No secrets should be added to the client bundle. If future features require external services, they need a design and security review before implementation.
