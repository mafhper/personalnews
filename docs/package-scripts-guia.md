# Guide to `package.json` Scripts

This document summarizes the scripts that matter most when developing and validating Personal News. The repository contains a larger automation surface, but most contributors only need a focused subset.

`package.json` is the source of truth for the command list. This guide documents the stable, commonly used entry points and should avoid one-off workflow status or exact tool versions that can drift quickly.

## Daily development

| Script | What it does | When to use it |
| --- | --- | --- |
| `bun run dev` | Starts the Vite development server. | Standard frontend development. |
| `bun run dev:local` | Starts the app with the local helper stack. | When you need the full local environment. |
| `bun run backend:start` | Starts the backend helper service directly. | Backend-only debugging or local feed support. |
| `bun run preview` | Serves the production build locally. | Quick verification of the built app. |

## Core validation

| Script | What it does | When to use it |
| --- | --- | --- |
| `bun run lint` | Runs the repo-wide ESLint pass. | Broad validation before a PR or release. |
| `bun run type-check` | Runs TypeScript without emitting files. | Minimum check before a PR. |
| `bun run test` | Runs the official core Vitest gate. | Minimum behavior validation before a PR. |
| `bun run test:fast` | Runs the smoke Vitest subset. | Quick local feedback before the broader suites. |
| `bun run test:all` | Runs the broad discovered Vitest suite. | Release validation and wider regression checks. |
| `bun run test:core` | Alias for `bun run test`. | Compatibility with older local habits and docs. |
| `bun run test:core:serial` | Runs the core suite serially. | Debugging flaky or timing-sensitive tests. |
| `bun run lint:components` | Lints the component tree. | UI work, layout changes, article rendering changes. |
| `bun run lint:services` | Lints services, hooks, utilities, and config. | Parser, cache, import/export, or logic changes. |
| `bun run test:feeds` | Validates feed availability and parsing. | Changes to curated feeds, feed parsing, or proxy behavior. |

## Build and packaging

| Script | What it does | When to use it |
| --- | --- | --- |
| `bun run build:app` | Builds the main web application. | Before broader validation or deploy checks. |
| `bun run build` | Builds the app and the quality dashboard assets. | Full repository build check. |
| `bun run desktop:build` | Builds the desktop package through Tauri. | Desktop packaging validation. |
| `bun run build:app:desktop` | Runs the desktop app build helper. | Desktop packaging workflow support. |

## Release note

`bun run build` and `bun run desktop:build` do not create a GitHub Release by themselves. The repository creates desktop release artifacts on GitHub only when a version tag such as `vX.Y.Z` is pushed.

Before pushing a release tag, keep the root package version and desktop metadata in sync so the generated installers and release assets use the intended version.

## End-to-end and broader validation

| Script | What it does | When to use it |
| --- | --- | --- |
| `bun run test:e2e` | Runs Playwright end-to-end tests. | UI flow verification after major changes. |
| `bun run quality:gate:local-silent` | Runs the main local quality gate with low log noise. | Broad validation across multiple layers. |
| `bun run quality:reports:all` | Generates the heavier reporting pipeline. | Quality review and regression analysis. |
| `bun run quality:ci` | Simulates the fuller CI-style validation flow. | Final local verification when you want maximum confidence. |

## Performance and analysis

| Script | What it does | When to use it |
| --- | --- | --- |
| `bun run perf:lighthouse:home` | Audits the landing page with Lighthouse. | Landing page performance work. |
| `bun run perf:lighthouse:feed` | Audits the feed route with Lighthouse. | Feed rendering and interaction optimization. |
| `bun run analysis` | Runs bundle and dependency analysis. | Weight reduction and deeper technical review. |

## Quality Core namespace

The repo includes a larger `quality:*` namespace used for reporting, snapshots, coverage, Lighthouse orchestration, and dashboard generation. If you are changing visible product behavior but do not need the full matrix, start with:

```bash
bun run type-check
bun run test:core
bun run quality:gate:local-silent
```

## Recommended combinations

### Small product change

```bash
bun run lint
bun run type-check
bun run test
```

### UI or layout change

```bash
bun run lint:components
bun run type-check
bun run test
```

### Feed pipeline or caching change

```bash
bun run lint:services
bun run type-check
bun run test
bun run test:feeds
```

### Broader validation

```bash
bun run test:all
bun run build
bun run quality:gate:local-silent
bun run test:e2e
```

## Related docs

- [Technical overview](technical-overview.md)
- [Contributing](../CONTRIBUTING.md)
