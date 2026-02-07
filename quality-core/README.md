# Quality Core

**Quality Core** is the quality and observability suite used by this project. It runs build audits, lighthouse performance checks, coverage collection, and produces a dashboard that summarizes results over time.

## Highlights

- **Modular audits** with presets and thresholds
- **CLI with TUI** (quick, silent, quiet modes)
- **Lighthouse automation** (mobile + desktop)
- **Coverage runner** with summary output
- **Dashboard** for historical trends and snapshots
- **Cross-platform** (Windows PowerShell 7 and WSL)

---

## Directory Structure

```
quality-core/
├── cli/
│   ├── run.cjs               # Quality gate orchestrator
│   ├── quality.cjs           # Core audit runner
│   ├── run-lighthouse.cjs    # Lighthouse automation
│   ├── run-analysis.cjs      # Bundle + dependency analysis
│   ├── run-coverage.cjs      # Coverage runner (quick/silent/quiet)
│   ├── ui-helpers.cjs        # Shared TUI components
│   └── history.cjs           # Execution time history/ETA
├── config/
│   ├── vitest.config.core.ts     # Core test configuration
│   └── vitest.config.minimal.ts  # Minimal smoke test config
├── scripts/
│   ├── build-dashboard.cjs   # Dashboard build helper (bun/npm)
│   ├── generate-changelog.cjs
│   ├── i18n-audit.cjs
│   ├── security-scan.cjs
│   ├── sync-config.ts
│   └── performance-gate/
│       ├── run-lighthouse.cjs
│       └── analyze.cjs
├── dashboard/
│   ├── src/                  # Dashboard React app
│   ├── public/
│   ├── vite.config.ts
│   └── package.json
├── dashboard-server.ts       # Dashboard HTTP server
├── generate-snapshot.ts
├── capture-audit.ts
├── vitest.collector.ts
├── snapshots.store.ts
├── quality-schema.ts
├── tests/                    # Quality-core unit tests
├── packages/
│   ├── core/
│   ├── audits/
│   ├── adapters/
│   └── reporters/
└── presets/
    └── github-pages.json
```

---

## Reports & Outputs

All reports are written to the root `performance-reports/` directory:

- `performance-reports/quality` for core quality JSON/MD
- `performance-reports/lighthouse` for Lighthouse JSON/HTML
- `performance-reports/analysis` for bundle/deps analysis
- `performance-reports/coverage` for `coverage-summary.json`
- `performance-reports/quality-snapshots` for dashboard snapshots
- `performance-reports/logs` for process logs

---

## Testing Layout

- `quality-core/tests` contains the Quality Core unit tests.
- Application tests remain in `__tests__/` (project-specific).
- Vitest configs live in `quality-core/config`.

---

## Main Commands (Project Root)

Core audits:

```bash
bun run quality:core
bun run quality:core:quick
bun run quality:core:silent
```

Quality gate (orchestrator):

```bash
bun run quality:gate
bun run quality:gate:quick-silent
```

Lighthouse:

```bash
bun run quality:lighthouse
bun run quality:lighthouse:silent
```

Analysis:

```bash
bun run analysis
bun run analysis:silent
```

Coverage (TUI + summary):

```bash
bun run test:coverage
bun run test:coverage:quick
bun run test:coverage:quiet
bun run test:coverage:quick-quiet
bun run test:coverage:silent
```

Dashboard:

```bash
bun run build:dashboard
bun run dashboard
```

---

## Modes (TUI)

- `--quick` runs a smaller/safer subset (faster)
- `--quiet` reduces output but keeps a summary
- `--silent` prints only the final summary

---

## Lighthouse Environment Variables

- `CHROME_PATH` to force the Chrome/Chromium binary
- `LH_HOST` to force server host (default `127.0.0.1`)
- `LH_HEADLESS` to override headless mode (`new` | `legacy`)
- `LH_CHROME_FLAGS` for extra chrome flags
- `LH_MOBILE_THROTTLING` and `LH_DESKTOP_THROTTLING`
- `LH_SERVER_WAIT_MS` to extend server readiness time
- `LH_MAX_WAIT_MS` for audit timeout

---

## Dashboard Notes

The dashboard is a Vite app and needs a build step.

```bash
bun run build:dashboard
bun run dashboard
```

If the dashboard shows “Carregando interface...”, rebuild using:

```bash
bun --cwd quality-core/dashboard run build
```

---

## Adapting Quality Core to Another Project

1. Copy the `quality-core/` folder into the target repo.
2. Install dependencies:

```bash
npm install -D lighthouse playwright vitest
```

3. Add scripts to `package.json`:

```json
{
  "scripts": {
    "quality:core": "node quality-core/cli/quality.cjs",
    "quality:lighthouse": "node quality-core/cli/run-lighthouse.cjs",
    "analysis": "node quality-core/cli/run-analysis.cjs",
    "coverage": "node quality-core/cli/run-coverage.cjs",
    "build:dashboard": "node quality-core/scripts/build-dashboard.cjs",
    "dashboard": "bun run quality-core/dashboard-server.ts"
  }
}
```

4. Customize thresholds in `quality-core/packages/core/thresholds.cjs`.

---

## Extending Audits

Create a new audit in `quality-core/packages/audits/` and register it in `quality-core/cli/quality.cjs`.

---

## License

MIT - Part of the Personal News project.
