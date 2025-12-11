/**
 * Icon Distribution Script - Personal News
 * 
 * Distributes icon assets from source folder to all required locations.
 * Adapted from AuraWall's distribute-icons.cjs
 * 
 * Usage: node scripts/distribute-icons.cjs
 * 
 * Source: _desenvolvimento/img/icon-forge-assets/
 * Destinations: public/, website/public/
 */

const fs = require('fs');
const path = require('path');

// Configuration
const PROJECT_ROOT = path.join(__dirname, '..');
const SOURCE_DIR = path.join(PROJECT_ROOT, '_desenvolvimento', 'img', 'icon-forge-assets');

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Destination mappings
// Format: 'sourceFile': ['dest1', 'dest2', ...]
const FILE_MAPPINGS = {
    // Favicons
    'favicon.ico': ['public/favicon.ico', 'website/public/favicon.ico'],
    'favicon.svg': ['public/favicon.svg', 'website/public/favicon.svg'],

    // Apple Touch Icons
    'apple-touch-icon.png': ['public/apple-touch-icon.png', 'website/public/apple-touch-icon.png'],

    // PWA Icons
    'pwa-192x192.png': ['public/pwa-192x192.png'],
    'pwa-512x512.png': ['public/pwa-512x512.png'],
    'pwa-maskable-192x192.png': ['public/pwa-maskable-192x192.png'],
    'pwa-maskable-512x512.png': ['public/pwa-maskable-512x512.png'],

    // Open Graph (JPG, não PNG)
    'og-image.jpg': ['public/og-image.jpg', 'website/public/og-image.jpg'],

    // Logo (usuário fornecerá logo.svg na pasta de assets)
    'logo.svg': ['public/logo.svg', 'website/public/logo.svg'],

    // Microsoft Tile
    'mstile-150x150.png': ['public/mstile-150x150.png'],
};

// Statistics
const stats = {
    success: 0,
    failed: 0,
    notFound: 0,
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function copyFile(sourcePath, destPath) {
    try {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(sourcePath, destPath);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function main() {
    console.log('');
    log('╔════════════════════════════════════════════════════════════════╗', colors.cyan);
    log('║          Personal News - Icon Distribution Script              ║', colors.cyan);
    log('╚════════════════════════════════════════════════════════════════╝', colors.cyan);
    console.log('');

    // Check if source directory exists
    if (!fs.existsSync(SOURCE_DIR)) {
        log(`Note: Source directory not found: ${SOURCE_DIR}`, colors.yellow);
        log('Skipping icon distribution.', colors.dim);
        console.log('');
        return;
    }

    // Check if source directory is empty
    if (fs.readdirSync(SOURCE_DIR).length === 0) {
        log(`Note: Source directory is empty: ${SOURCE_DIR}`, colors.yellow);
        log('Skipping icon distribution.', colors.dim);
        console.log('');
        return;
    }

    log(`Source: ${SOURCE_DIR}`, colors.dim);
    console.log('');

    // Process mappings
    for (const [sourceFile, destinations] of Object.entries(FILE_MAPPINGS)) {
        const sourcePath = path.join(SOURCE_DIR, sourceFile);

        if (!fs.existsSync(sourcePath)) {
            stats.notFound++;
            log(`  ? ${sourceFile} - not found`, colors.magenta);
            continue;
        }

        const fileSize = fs.statSync(sourcePath).size;

        for (const dest of destinations) {
            const destPath = path.join(PROJECT_ROOT, dest);
            const result = copyFile(sourcePath, destPath);

            if (result.success) {
                stats.success++;
                log(`  ✓ ${sourceFile} → ${dest} (${formatBytes(fileSize)})`, colors.green);
            } else {
                stats.failed++;
                log(`  ✗ ${sourceFile} → ${dest}: ${result.error}`, colors.red);
            }
        }
    }

    console.log('');
    log('Summary:', colors.bright);
    log(`  ${colors.green}✓ Success:${colors.reset}    ${stats.success} file(s)`);
    log(`  ${colors.red}✗ Failed:${colors.reset}     ${stats.failed} file(s)`);
    log(`  ${colors.magenta}? Not Found:${colors.reset}  ${stats.notFound} source file(s)`);
    console.log('');

    if (stats.failed > 0) {
        process.exit(1);
    }
}

main();
