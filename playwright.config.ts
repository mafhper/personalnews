import { defineConfig } from '@playwright/test';
import { DEV_PORT } from './ports.mjs';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: `http://localhost:${DEV_PORT}`,
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },
  webServer: {
    // SEM `--port` na linha de comando de proposito: ele PREVALECE sobre o
    // `vite.config.ts`, e enquanto ele estivesse aqui a sonda do config nunca
    // rodava. O numero vem do config, que le `ports.mjs`.
    command: 'bun vite',
    port: DEV_PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
