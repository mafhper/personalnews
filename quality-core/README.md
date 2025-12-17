# Quality Core

**Quality Core** is a modular, extensible quality auditing system designed for web projects. It provides automated checks for performance, accessibility, UX, SEO, and build health, generating actionable reports.

## Features

- **Pluggable Audits** - Easy to add, remove, or customize individual audits
- **Preset Configurations** - Pre-configured settings for common deployment targets (e.g., GitHub Pages)
- **Multiple Reporters** - Generate reports in JSON or Markdown formats
- **Dashboard Integration** - Visual dashboard for monitoring quality metrics
- **CLI Interface** - Simple command-line interface for CI/CD integration

---

## Directory Structure

```
quality-core/
├── cli/
│   └── quality.cjs           # CLI entry point
├── dashboard/                 # Integrated dashboard (self-contained)
│   ├── public/
│   │   └── index.html        # Dashboard UI
│   ├── server.cjs            # Express-compatible HTTP server
│   └── template.html         # HTML template
├── packages/
│   ├── core/
│   │   ├── result.contract.json  # JSON Schema for audit results
│   │   ├── runner.cjs            # Audit orchestrator
│   │   └── thresholds.cjs        # Default threshold values
│   ├── audits/
│   │   ├── build.cjs         # Bundle size & asset checks
│   │   ├── render.cjs        # First Paint, CLS, TBT metrics
│   │   ├── ux.cjs            # Tap target size checks
│   │   ├── a11y.cjs          # Accessibility (buttons, labels, alt text)
│   │   └── seo.cjs           # Meta tags, headings, canonical
│   ├── adapters/
│   │   ├── playwright.cjs    # Browser automation adapter
│   │   └── utils.cjs         # Shared utilities
│   └── reporters/
│       ├── json.cjs          # JSON reporter
│       └── markdown.cjs      # Markdown reporter
└── presets/
    └── github-pages.json     # GitHub Pages deployment preset
```

---

## Technologies & Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js (CommonJS) | Cross-platform execution |
| Browser Automation | Playwright | Rendering audits (FP, CLS, TBT) |
| CLI | Native `process.argv` | Zero-dependency CLI parsing |
| Reporters | Native `fs` | JSON and Markdown output |
| Dashboard | Vanilla HTML/JS | No build step required |

### Architecture Overview

```
┌──────────────┐     ┌───────────────┐     ┌──────────────┐
│   CLI        │────▶│    Runner     │────▶│   Audits     │
│ quality.cjs  │     │  runner.cjs   │     │ build/render │
└──────────────┘     └───────────────┘     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Reporters   │
                     │ json/markdown│
                     └──────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Dashboard   │
                     │ server.cjs   │
                     └──────────────┘
```

---

## Usage

### Running Quality Audits

```bash
# Run all audits against a local preview server
npm run quality -- --url=http://localhost:4173/

# Run specific audits
npm run quality -- --url=http://localhost:4173/ --audits=build,seo

# Use a preset
npm run quality -- --url=http://localhost:4173/ --preset=github-pages
```

### Starting the Dashboard

```bash
npm run dashboard
# Opens at http://localhost:3333
```

---

## Adapting Quality Core for Another Project

### Step 1: Copy the `quality-core` folder

Copy the entire `quality-core/` directory to your new project:

```bash
cp -r quality-core/ /path/to/new-project/quality-core/
```

### Step 2: Install Dependencies

Quality Core requires Playwright for browser-based audits:

```bash
npm install -D playwright
```

### Step 3: Add npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "quality": "node quality-core/cli/quality.cjs",
    "quality:quick": "node quality-core/cli/quality.cjs --audits=build,seo",
    "dashboard": "node quality-core/dashboard/server.cjs"
  }
}
```

### Step 4: Configure Paths (Optional)

Edit `quality-core/dashboard/server.cjs` to update report directories:

```javascript
const CONFIG = {
  reportsDir: path.join(process.cwd(), 'performance-reports'),
  qualityDir: path.join(process.cwd(), 'performance-reports', 'quality'),
  // ... other paths
};
```

### Step 5: Create Custom Presets (Optional)

Create a new preset in `quality-core/presets/`:

```json
{
  "name": "my-project",
  "target": "production",
  "baseUrl": "https://example.com"
}
```

### Step 6: Customize Thresholds

Edit `quality-core/packages/core/thresholds.cjs`:

```javascript
const DEFAULT_THRESHOLDS = {
  build: {
    bundle_total_kb: 500,  // Adjust for your project
    largest_chunk_kb: 200,
    // ...
  },
  // ...
};
```

---

## Extending with Custom Audits

Create a new audit in `quality-core/packages/audits/`:

```javascript
// my-audit.cjs
module.exports = {
  name: 'my-audit',
  async run(context) {
    const violations = [];
    
    // Your audit logic here
    
    return {
      name: 'my-audit',
      status: violations.length === 0 ? 'passed' : 'failed',
      score: 100 - (violations.length * 10),
      violations,
    };
  }
};
```

Register in `quality-core/cli/quality.cjs`:

```javascript
const audits = {
  build: require('../packages/audits/build.cjs'),
  render: require('../packages/audits/render.cjs'),
  // Add your audit:
  'my-audit': require('../packages/audits/my-audit.cjs'),
};
```

---

## Report Formats

### JSON Report

```json
{
  "meta": {
    "timestamp": "2024-12-17T18:00:00Z",
    "preset": "github-pages",
    "url": "http://localhost:4173/"
  },
  "status": "failed",
  "audits": [
    {
      "name": "build",
      "status": "failed",
      "score": 70,
      "violations": [...]
    }
  ]
}
```

### Markdown Report

Generated in `performance-reports/quality/quality-{timestamp}.md` with human-readable summaries.

---

## License

MIT - Part of the Personal News project.
