/**
 * Build Site Script
 * 
 * Builds the promo website using Vite and outputs to dist/
 * The app will be built separately to dist/app/
 * 
 * Usage: node scripts/build-site.cjs
 */

const { execSync } = require('child_process');
const path = require('path');

const websiteDir = path.join(__dirname, '..', 'website');

console.log('');
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║          Personal News - Building Promo Site                   ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');

try {
    // Install website dependencies if needed
    console.log('📦 Checking website dependencies...');
    execSync('npm install', { cwd: websiteDir, stdio: 'inherit' });

    // Build the website
    console.log('');
    console.log('🔨 Building promo site...');
    execSync('npm run build', { cwd: websiteDir, stdio: 'inherit' });

    console.log('');
    console.log('✅ Promo site built successfully!');
    console.log('   Output: website/dist/');
    console.log('');
} catch (error) {
    console.error('');
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}
