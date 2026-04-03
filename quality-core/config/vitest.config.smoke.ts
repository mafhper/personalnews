import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const maxThreads = Number(process.env.VITEST_MAX_THREADS || 2);
const testTimeout = Number(process.env.VITEST_TEST_TIMEOUT || 10000);

export default defineConfig({
  root: process.cwd(),
  cacheDir: 'performance-reports/vitest-cache',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout,
    hookTimeout: testTimeout,
    teardownTimeout: testTimeout,
    maxConcurrency: 2,
    reporters: [process.env.VITEST_REPORTER || 'dot'],
    pool: 'threads',
    maxWorkers: maxThreads,
    include: ['**/*.smoke.test.ts', '**/*.smoke.test.tsx'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.dev/**',
      '_dev/**',
      'quality-core/dashboard/**',
      'performance-reports/**',
      'coverage/**',
      'logs/**',
      'docs/**',
      'tmp/**',
      'temp/**',
      '.bun/**',
      '.gemini/**',
      '.gemini-clipboard/**',
      '.cache/**',
      '.parcel-cache/**',
      '.vscode/**',
      '.idea/**',
      '.pnp',
      '.pnp.js',
      '.env',
      '.env.*',
      '*.log',
      'e2e/**',
      '__tests_unused/**',
    ],
  },
});
