#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const repoRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(repoRoot, '_dev', 'img');
const dashboardSrc = path.join(srcRoot, 'logo-dashboard');
const personalSrc = path.join(srcRoot, 'logo-personal-news');

const dashboardDest = path.join(repoRoot, 'quality-core', 'dashboard', 'public');
const personalDest = path.join(repoRoot, 'public');

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function copyWithBackup(src, dest) {
  try {
    await ensureDir(path.dirname(dest));
    // backup if exists
    try {
      await fs.access(dest);
      const bak = dest + '.bak';
      await fs.copyFile(dest, bak);
      console.log(`Backup criado: ${bak}`);
    } catch (e) {
      // dest does not exist
    }
    await fs.copyFile(src, dest);
    console.log(`Copiado: ${src} → ${dest}`);
  } catch (err) {
    console.error(`Erro copiando ${src} → ${dest}:`, err.message);
  }
}

async function copyAllFromFolder(srcFolder, targetRoot, options = {}) {
  try {
    const entries = await fs.readdir(srcFolder, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(srcFolder, entry.name);
      if (entry.isDirectory()) {
        // recursive: preserve relative path under targetRoot
        await copyAllFromFolder(srcPath, path.join(targetRoot, entry.name), options);
      } else if (entry.isFile()) {
        const name = entry.name;
        const lower = name.toLowerCase();
        const ext = path.extname(name);

        // Rules for naming
        if (lower.includes('logo')) {
          // dashboard vs personal handled by caller's targetRoot
          let destName = 'logo' + ext;
          if (lower.includes('dark')) destName = 'logo-dark' + ext;

          const destPath = path.join(targetRoot, destName);
          await copyWithBackup(srcPath, destPath);

          // For personal app also ensure `assets/logo.svg` exists to match imports
          if (options.alsoAssets && ext === '.svg') {
            const assetsDir = path.join(personalDest, 'assets');
            await ensureDir(assetsDir);
            const assetsDest = path.join(assetsDir, destName);
            await copyWithBackup(srcPath, assetsDest);
          }

          // If requested, also copy personal project logos into dashboard/public/projects/<slug>/
          if (options.copyToDashboardProjects) {
            const projectSlug = String(options.projectSlug || 'personal-news');
            const dashboardProjectDir = path.join(dashboardDest, 'projects', projectSlug);
            await ensureDir(dashboardProjectDir);
            const projDest = path.join(dashboardProjectDir, destName);
            await copyWithBackup(srcPath, projDest);
          }
        } else if (lower.includes('favicon') || lower.startsWith('apple') || lower.startsWith('mstile') || lower.includes('pwa') || lower.includes('og-image')) {
          const destPath = path.join(targetRoot, entry.name);
          await copyWithBackup(srcPath, destPath);
        } else if (lower.includes('icon') || lower.includes('icons') || lower.match(/\b16x16\b|\b32x32\b|\b48x48\b|\b512x512\b/)) {
          // place into icons/ if targetRoot has icons/
          const iconsDir = path.join(targetRoot, 'icons');
          await ensureDir(iconsDir);
          const destPath = path.join(iconsDir, entry.name);
          await copyWithBackup(srcPath, destPath);
        } else {
          // fallback: copy into target root preserving name
          const destPath = path.join(targetRoot, entry.name);
          await copyWithBackup(srcPath, destPath);
        }
      }
    }
  } catch (err) {
    console.error(`Erro lendo pasta ${srcFolder}:`, err.message);
  }
}

async function run() {
  console.log('Importador de ícones iniciado...');

  // Dashboard
  try {
    await fs.access(dashboardSrc);
    console.log('Processando logo-dashboard...');
    await copyAllFromFolder(dashboardSrc, dashboardDest, { alsoAssets: false });
  } catch (e) {
    console.log('Pasta logo-dashboard não encontrada, pulando.');
  }

  // Personal News
  try {
    await fs.access(personalSrc);
    console.log('Processando logo-personal-news...');
    await copyAllFromFolder(personalSrc, personalDest, { alsoAssets: true, copyToDashboardProjects: true, projectSlug: 'personal-news' });
  } catch (e) {
    console.log('Pasta logo-personal-news não encontrada, pulando.');
  }

  console.log('Importador finalizado. Verifique os backups (.bak) se desejar restaurar arquivos anteriores.');
}

run().catch(err => {
  console.error('Erro no importador:', err);
  process.exit(1);
});
