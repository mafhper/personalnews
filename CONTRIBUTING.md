# Contributing to Personal News

Thanks for your interest in contributing. This document focuses on the current workflow of the project and the minimum checks expected before opening a pull request.

## Before you start

- Search existing issues and pull requests before opening a new proposal.
- Prefer small, focused changes instead of broad refactors mixed with product work.
- Keep documentation aligned with visible behavior whenever you change the user experience.

## Local setup

### Requirements

- Bun 1.2+
- Node.js 20+
- Git

### Install and run

```bash
git clone https://github.com/mafhper/personalnews.git
cd personalnews
bun install
bun run dev
```

If you need the local helper stack as well:

```bash
bun run dev:local
```

## Where to work

- `components/`: feed UI, layouts, article cards, reader surfaces.
- `hooks/`: state orchestration and progressive loading flows.
- `services/`: parsing, caching, sanitization, import/export, and feed processing.
- `constants/`: curated starter feeds and categories.
- `apps/desktop/`: desktop packaging and Tauri integration.
- `docs/`: public technical documentation.

## Recommended workflow

1. Create a branch for the change.
2. Implement the smallest viable update.
3. Add or update tests when behavior changes.
4. Update user-facing documentation when the product surface changes.
5. Run the relevant validation commands.
6. Open a pull request with a clear summary and testing notes.

## Validation commands

### Minimum checks

```bash
bun run lint
bun run type-check
bun run test
```

### Useful targeted checks

```bash
bun run lint:components
bun run lint:services
bun run test:e2e
bun run test:feeds
```

### Full local quality pass

```bash
bun run quality:gate:local-silent
```

Use the full gate when a change touches multiple layers or when you want a release-grade local check.

## Release workflow

If your change includes a version bump:

1. update the root package version and the desktop version metadata
2. run the release-grade validation commands
3. push the commit to `main`
4. push the matching version tag, using the `vX.Y.Z` format

The repository publishes GitHub Pages from `main`, but GitHub Releases and desktop installers are generated only from `v*` tags.

## Coding guidelines

- Keep TypeScript strict and prefer explicit, readable types.
- Preserve category-specific UI behavior instead of forcing one layout model across the app.
- Avoid blank states during feed transitions unless the target view truly has no content.
- Treat third-party feed content as untrusted input and keep sanitization intact.
- Follow the existing component and service boundaries instead of adding new global state casually.

## Tests and documentation

- Add or update tests when fixing regressions in feed loading, parsing, layout behavior, or navigation.
- Update `README` and `docs/` when the product behavior or setup steps change.
- Prefer concise user-facing explanations over internal process notes in public docs.

## Pull requests

Each pull request should include:

- what changed
- why the change was needed
- how it was tested
- any follow-up risks or known limitations

Screenshots or short recordings are useful when the change affects layout, navigation, or the article-reading experience.

## Reporting issues

When opening an issue, include:

- steps to reproduce
- expected behavior
- actual behavior
- browser or OS details
- screenshots when the bug is visual or layout-related

## License

By contributing, you agree that your contributions will be distributed under the [MIT License](LICENSE).
