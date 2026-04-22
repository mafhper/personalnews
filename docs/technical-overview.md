# Technical Overview

Personal News is a feed aggregation application built for two delivery targets:

- a web app deployed from `main`
- a desktop app packaged and released through Tauri

The project is intentionally centered on reading performance, resilient feed handling, and flexible presentation modes for different content categories.

## Product model

At runtime, the application behaves as a personal news dashboard with curated defaults and user-configurable sources. The shipped catalog includes categories for Design, Games, Technology, Politics, and Videos, each with its own visual treatment.

Notable examples:

- `All` uses the general homepage-style reading surface.
- text-heavy categories can use list or immersive layouts.
- the video category uses a dedicated brutalist treatment.

## Main architecture layers

### UI layer

The frontend is built with React and TypeScript on top of Vite. The component tree is organized around reusable feed surfaces, category-aware layout components, and article cards that adapt to different display modes.

Key areas:

- `components/`: cards, feed surfaces, layouts, image handling, reader UI
- `hooks/`: loading, appearance, navigation, and interaction state

### Feed processing layer

External sources are normalized before they reach the interface. The app supports common syndication formats and YouTube feed ingestion, then maps them into a consistent internal article shape.

Key areas:

- `services/rssParser.ts`
- related services for feed discovery, import/export, content extraction, and sanitization

### Caching and progressive loading

The feed experience is built around a stale-while-revalidate approach:

1. Resolve the current scope, such as `All` or a specific category.
2. Render cached content for that scope immediately when available.
3. Revalidate feeds in the background using network fetches.
4. Replace visible content only when fresher data is ready.

This model is what allows category changes to feel responsive without blanking the screen between transitions.

## Content pipeline

The article pipeline is designed to be resilient to real-world feed quality:

1. fetch source data, often through fallback or proxy-aware strategies when needed
2. parse RSS, Atom, RDF, or YouTube feed payloads
3. normalize metadata such as title, date, author, source, and media
4. sanitize third-party content before rendering
5. cache normalized results for fast reuse

The application also supports full-article extraction flows so a cleaner reader view can be built on top of publisher pages.

When full extraction fails because of publisher-side blocking, proxy failure, or CORS limits, the reader falls back to the content already present in the feed instead of breaking the reading flow.

## Layout system

Layout is not treated as a purely cosmetic toggle. Categories may carry their own preferred presentation mode, which is why the app preserves category-specific layout identity during navigation.

The layout vocabulary includes:

- `bento`
- `list`
- `immersive`
- `brutalist`

This is especially important for the `Videos` category, which should not leak its layout back into `All` or other sections after navigation.

Video posts also follow a separate interaction contract:

- the primary click opens the in-app reader or player
- `Watch` stays inside the app for supported video sources
- `Visit` is the explicit action that opens the original publisher page

## Media handling

Article images are optimized for imperfect feed data. When a real image is unavailable, the app can render a generated gradient-based placeholder instead of an empty box or broken image icon. Once the actual image becomes available, it replaces the placeholder.

## Security posture

The app consumes third-party content, so the defensive surface matters:

- feed markup is parsed defensively
- rendered content is sanitized before entering the UI
- external HTML is not trusted as-is
- proxy and fallback logic exists to improve availability without weakening the rendering boundary

## Quality and validation

The repository ships with a dedicated quality layer that goes beyond unit tests. Depending on the change, contributors can validate:

- strict TypeScript checks
- focused, smoke, or broad Vitest suites
- Playwright end-to-end coverage
- feed health checks
- Lighthouse-based performance audits
- bundle and analysis reports

See [package-scripts-guia.md](package-scripts-guia.md) for the practical command map.
