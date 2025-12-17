/**
 * Build Audit
 * Analyzes the dist/ folder for bundle size and structure.
 */
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Recursive walk
async function getFiles(dir) {
    const subdirs = await readdir(dir);
    const files = await Promise.all(subdirs.map(async (subdir) => {
        const res = path.resolve(dir, subdir);
        return (await stat(res)).isDirectory() ? getFiles(res) : res;
    }));
    return files.reduce((a, f) => a.concat(f), []);
}

const BuildAudit = {
  name: 'build',

  async run(context) {
    const distDir = context.distDir;
    const violations = [];
    const t = context.thresholds.build;

    // Check if dist exists
    if (!fs.existsSync(distDir)) {
        throw new Error(`Dist directory not found at ${distDir}. Run 'npm run build' first.`);
    }

    const files = await getFiles(distDir);
    
    // 1. Bundle Total Size (JS/CSS)
    let jsTotal = 0;
    let cssTotal = 0;
    let largestChunk = 0;
    let assetsCount = 0;

    for (const file of files) {
        const stats = await stat(file);
        const sizeKb = stats.size / 1024;
        const ext = path.extname(file).toLowerCase();

        if (ext === '.js') {
            jsTotal += sizeKb;
            if (sizeKb > largestChunk) largestChunk = sizeKb;
        } else if (ext === '.css') {
            cssTotal += sizeKb;
        }
        
        // Count assets (images, fonts, media)
        if (['.png', '.jpg', '.jpeg', '.svg', '.webp', '.woff', '.woff2'].includes(ext)) {
            assetsCount++;
        }
    }

    const bundleTotal = jsTotal + cssTotal;

    // Evaluate
    if (bundleTotal > t.bundle_total_kb) {
        violations.push({
            area: 'build', metric: 'bundle_total_kb', 
            value: bundleTotal.toFixed(1), threshold: t.bundle_total_kb, severity: 'warn'
        });
    }

    if (largestChunk > t.largest_chunk_kb) {
        violations.push({
            area: 'build', metric: 'largest_chunk_kb', 
            value: largestChunk.toFixed(1), threshold: t.largest_chunk_kb, severity: 'warn'
        });
    }

    if (cssTotal > t.css_total_kb) {
        violations.push({
            area: 'build', metric: 'css_total_kb', 
            value: cssTotal.toFixed(1), threshold: t.css_total_kb, severity: 'warn'
        });
    }
    
    if (assetsCount > t.assets_count) {
        violations.push({
            area: 'build', metric: 'assets_count', 
            value: assetsCount, threshold: t.assets_count, severity: 'warn'
        });
    }

    // Check for 404.html (Crucial for generic SPA hosting on GitHub Pages)
    // Actually Vite implies index.html is entry, but 404 is good practice.
    // If not present, warn.
    if (!files.some(f => path.basename(f) === '404.html')) {
         violations.push({
            area: 'build', metric: 'missing_404', 
            value: 'false', threshold: 'true', severity: 'warn'
        });
    }

    // Score calculation (Simplified)
    // Start at 100, deduct for violations
    let score = 100;
    score -= violations.length * 10;
    if (score < 0) score = 0;

    return {
        score,
        violations,
        raw: {
            jsTotal: jsTotal.toFixed(1),
            cssTotal: cssTotal.toFixed(1),
            largestChunk: largestChunk.toFixed(1),
            assetsCount,
            fileCount: files.length
        }
    };
  }
}

module.exports = BuildAudit;
