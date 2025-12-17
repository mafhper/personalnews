#!/usr/bin/env node
/**
 * Quality Core CLI
 */
const fs = require('fs');
const path = require('path');
const { runAudits } = require('../packages/core/runner.cjs');
const DEFAULT_THRESHOLDS = require('../packages/core/thresholds.cjs');

// Import Presets
const GITHUB_PAGES_PRESET = require('../presets/github-pages.json');

// Import Audits
// We will dynamically load these or map them
/* 
    Ideally these would be loaded from packages/audits/* but for MVP explicit import is fine OR dynamic.
    Let's use explicit mapping for safety.
*/
const AVAILABLE_AUDITS = {
    'build': require('../packages/audits/build.cjs'),
    'render': require('../packages/audits/render.cjs'),
    'ux': require('../packages/audits/ux.cjs'),
    'a11y': require('../packages/audits/a11y.cjs'),
    'seo': require('../packages/audits/seo.cjs')
};

async function main() {
    const args = process.argv.slice(2);
    const presetName = args.find(a => a.startsWith('--preset='))?.split('=')[1] || 'github-pages';
    const isQuick = args.includes('--quick');
    const isFailOnError = args.includes('--fail-on-error');

    console.log(`Quality Core CLI v1.0.0`);
    console.log(`Preset: ${presetName}`);

    // Context Setup
    // Ensure we have a URL to test. For static build checks, we might verify dist/ existence.
    // For render checks, we ideally serve dist/ locally.

    // START STATIC SERVER for testing
    // We need a simple static server adapter or use an existing tool.
    // Creating a simple serve utility in adapters/static-server.cjs would be good.
    // For now, let's assume 'http://localhost:4173' (Vite Preview default) or allow passing --url.

    let url = args.find(a => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:4173';

    // Check if server is running? Or spawn it? 
    // For MVP, we'll try to spawn vite preview if not running, or expect user to run it?
    // User suggestion implies automation.
    // Let's implement a "preview" spawner in runner or CLI.

    // Preset Config
    const preset = presetName === 'github-pages' ? GITHUB_PAGES_PRESET : GITHUB_PAGES_PRESET;

    const context = {
        url: url,
        preset: presetName,
        device: preset.device || 'mobile',
        thresholds: DEFAULT_THRESHOLDS, // Can override from preset
        projectRoot: process.cwd(),
        distDir: path.join(process.cwd(), 'dist')
    };

    // Select Audits
    // Basic selection logic
    const auditsToRun = [];
    if (isQuick) {
        auditsToRun.push(AVAILABLE_AUDITS.build);
    } else {
        auditsToRun.push(AVAILABLE_AUDITS.build);
        auditsToRun.push(AVAILABLE_AUDITS.render); // Requires Playwright
        auditsToRun.push(AVAILABLE_AUDITS.ux);
        auditsToRun.push(AVAILABLE_AUDITS.a11y);
        auditsToRun.push(AVAILABLE_AUDITS.seo);
    }

    // Filter out undefined if any audit implementation is missing
    const validAudits = auditsToRun.filter(Boolean);

    if (validAudits.length === 0) {
        console.error("No valid audits found to run. Check your configuration or implementation.");
        process.exit(1);
    }

    // Run Audio
    const result = await runAudits({ audits: validAudits, context });

    // Save Reports
    const reportDir = path.join(process.cwd(), 'performance-reports', 'quality');
    const filename = `quality-${Date.now()}`; // base name

    // JSON
    const JsonReporter = require('../packages/reporters/json.cjs');
    const jsonPath = JsonReporter.save(result, reportDir, `${filename}.json`);
    console.log(`\n📄 JSON Report: ${jsonPath}`);

    // Latest JSON for Dashboard
    JsonReporter.save(result, reportDir, 'quality-latest.json');

    // Markdown
    const MarkdownReporter = require('../packages/reporters/markdown.cjs');
    const mdContent = MarkdownReporter.generate(result);
    // Be careful with simple save: we can use fs directly or enhance json reporter to be generic file saver
    // Let's just use fs here or add saveText to json reporter? Just fs is fine.
    const mdPath = path.join(reportDir, `${filename}.md`);
    fs.writeFileSync(mdPath, mdContent);
    console.log(`📄 Markdown Report: ${mdPath}`);

    // If failed
    if (result.status === 'fail') {
        process.exit(isFailOnError ? 1 : 0);
    }
}

main().catch(err => {
    console.error("Fatal Error:", err);
    process.exit(1);
});
