import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    // Whitelist semântica (Contrato Core)
    include: [
      '**/*.core.test.ts',
      '**/*.core.test.tsx'
    ],
    // Tudo que NÃO é core ou que não deve bloquear produção
    exclude: [
      'node_modules/**',
      'dist/**',
      '**/*integration*.test.ts',
      '**/*Integration*.test.tsx',
      '**/*performance*.test.ts',
      '**/*Performance*.test.ts',
      '**/*benchmark*.test.ts',
      '**/proxy*.test.ts',
      '**/debug-proxy*.test.ts',
      // Excluir testes que NÃO seguem explicitamente a nova convenção core
      '__tests__/**/!(*.core).test.ts',
      '__tests__/**/!(*.core).test.tsx'
    ]
  }
});