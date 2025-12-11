/**
 * Merge Builds Script
 * 
 * Merges the promo site build (website/dist) with the app build (dist)
 * The app is already in dist/app/ due to its base path config
 * 
 * Usage: node scripts/merge-builds.cjs
 */

const fs = require('fs');
const path = require('path');

const WEBSITE_DIST = path.join(__dirname, '..', 'website', 'dist');
const APP_DIST = path.join(__dirname, '..', 'dist');

console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          Personal News - Merging Builds                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

function copyRecursive(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`  ⚠ Source not found: ${src}`);
        return;
    }

    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        fs.readdirSync(src).forEach(file => {
            copyRecursive(path.join(src, file), path.join(dest, file));
        });
    } else {
        // Skip if destination exists and is the app folder
        const relativePath = path.relative(APP_DIST, dest);
        if (relativePath.startsWith('app')) {
            return; // Don't overwrite app files
        }

        fs.copyFileSync(src, dest);
    }
}

try {
    if (!fs.existsSync(WEBSITE_DIST)) {
        console.log('  ⚠ Website dist not found. Run npm run build:site first.');
        process.exit(0);
    }

    if (!fs.existsSync(APP_DIST)) {
        console.log('  ⚠ App dist not found. Run npm run build first.');
        process.exit(0);
    }

    console.log(`  Source: ${WEBSITE_DIST}`);
    console.log(`  Dest:   ${APP_DIST}`);
    console.log('');

    // Copy website files to app dist (preserving app/ folder)
    copyRecursive(WEBSITE_DIST, APP_DIST);

    console.log('  ✅ Builds merged successfully!');
    console.log('');
    console.log('  Final structure:');
    console.log('    dist/');
    console.log('    ├── index.html      (promo site)');
    console.log('    ├── assets/         (promo site assets)');
    console.log('    └── app/            (main app)');
    console.log('');

} catch (error) {
    console.error('  ❌ Merge failed:', error.message);
    process.exit(1);
}
