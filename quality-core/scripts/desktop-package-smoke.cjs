#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

  const required = [
    'apps/desktop/package.json',
    'apps/desktop/src-tauri/Cargo.toml',
    'apps/desktop/src-tauri/tauri.conf.json',
    'apps/desktop/src-tauri/icons/icon.png',
    'apps/desktop/src-tauri/icons/icon.ico',
    'apps/desktop/src-tauri/windows/hooks.nsh',
    '.github/workflows/release-desktop.yml',
  ];

try {
  const missing = required.filter(file => !fs.existsSync(path.join(process.cwd(), file)));
  if (missing.length > 0) {
    throw new Error(`Missing desktop artifacts: ${missing.join(', ')}`);
  }

  const tauriConf = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'apps/desktop/src-tauri/tauri.conf.json'), 'utf8')
  );

  if (!tauriConf?.bundle || !tauriConf?.app) {
    throw new Error('Invalid tauri.conf.json structure');
  }

  const appPkg = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'apps/desktop/package.json'), 'utf8')
  );

  if (!appPkg.scripts || !appPkg.scripts['tauri:build']) {
    throw new Error('Desktop package missing tauri:build script');
  }

  if (!appPkg.scripts['prepare:backend']) {
    throw new Error('Desktop package missing prepare:backend sidecar script');
  }

  const externalBin = tauriConf?.bundle?.externalBin;
  if (!Array.isArray(externalBin) || !externalBin.includes('binaries/personalnews-backend')) {
    throw new Error('Desktop bundle missing backend sidecar externalBin');
  }

  const nsis = tauriConf?.bundle?.windows?.nsis;
  if (!nsis || nsis.startMenuFolder !== 'PersonalNews') {
    throw new Error('Desktop NSIS config missing startMenuFolder=PersonalNews');
  }

  if (nsis.installerHooks !== 'windows/hooks.nsh') {
    throw new Error('Desktop NSIS config missing installerHooks=windows/hooks.nsh');
  }

  console.log('[quality:desktop] PASS');
} catch (error) {
  console.error('[quality:desktop] FAIL:', error.message || String(error));
  process.exit(1);
}
