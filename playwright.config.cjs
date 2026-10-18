const path = require('path');
const fs = require('fs');
const { defineConfig } = require('@playwright/test');

const nodeRuntime = process.execPath;
const viteFromNodeModules = path.resolve(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const viteFromPackage = path.resolve(path.dirname(require.resolve('vite/package.json')), 'bin', 'vite.js');
const viteBin = fs.existsSync(viteFromNodeModules) ? viteFromNodeModules : viteFromPackage;
// Fonte unica — este arquivo e o que os e2e USAM (`test:e2e` passa `-c
// playwright.config.cjs`). O `playwright.config.ts` existe mas nao e invocado;
// ele foi atualizado na Onda 2 e este aqui nao, ate agora.
const { DEV_PORT } = require('./ports.mjs');
const webServerCommand = `"${nodeRuntime}" "${viteBin}" --port ${DEV_PORT} --strictPort --host 127.0.0.1`;

module.exports = defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://127.0.0.1:${DEV_PORT}`,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    command: webServerCommand,
    port: DEV_PORT,
    reuseExistingServer: true,
    timeout: 120_000,
    cwd: path.resolve(__dirname),
  },
});
