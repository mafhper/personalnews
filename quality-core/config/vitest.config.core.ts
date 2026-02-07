import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const maxThreads = Number(process.env.VITEST_MAX_THREADS || 2);
const testTimeout = Number(process.env.VITEST_TEST_TIMEOUT || 15000);

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
    maxConcurrency: 4,
    reporters: [process.env.VITEST_REPORTER || 'dot'],
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads
      }
    },
    // Whitelist semântica (Contrato Core)
    include: [
      '**/*.core.test.ts',
      '**/*.core.test.tsx'
    ],
    // Tudo que NÃO é core ou que não deve bloquear produção
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
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
      '**/*integration*.test.ts',
      '**/*Integration*.test.tsx',
      '**/*performance*.test.ts',
      '**/*Performance*.test.ts',
      '**/*benchmark*.test.ts',
      '**/proxy*.test.ts',
      '**/debug-proxy*.test.ts',
      // Excluir testes que NÃO seguem explicitamente a nova convenção core
      '__tests__/**/!(*.core).test.ts',
      '__tests__/**/!(*.core).test.tsx',
      '__tests_unused/**'
    ],
    coverage: {
      reportsDirectory: 'performance-reports/coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
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
        '__tests_unused/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/test-setup.ts',
        '**/coverage/**'
      ]
    }
  }
});
