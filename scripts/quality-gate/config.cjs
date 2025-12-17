/**
 * Quality Gate - Configuracoes
 * Define thresholds, caminhos e opcoes do sistema
 */

const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../../');

module.exports = {
    // Diretorios
    paths: {
        root: PROJECT_ROOT,
        performanceReports: path.join(PROJECT_ROOT, 'performance-reports'),
        lighthouse: path.join(PROJECT_ROOT, 'performance-reports', 'lighthouse'),
        analysis: path.join(PROJECT_ROOT, 'performance-reports', 'analysis'),
        logs: path.join(PROJECT_ROOT, 'docs', 'logs'),
    },

    // Thresholds de Performance (em ms exceto CLS)
    thresholds: {
        mobile: {
            fcp: { ok: 1000, warn: 1800, fail: 2500 },
            lcp: { ok: 1800, warn: 2500, fail: 4000 },
            tbt: { ok: 200, warn: 300, fail: 500 },
            cls: { ok: 0.05, warn: 0.1, fail: 0.25 },
            si: { ok: 2000, warn: 3000, fail: 4500 },
        },
        desktop: {
            fcp: { ok: 800, warn: 1200, fail: 1800 },
            lcp: { ok: 1200, warn: 2000, fail: 2500 },
            tbt: { ok: 100, warn: 200, fail: 300 },
            cls: { ok: 0.05, warn: 0.1, fail: 0.25 },
            si: { ok: 1500, warn: 2000, fail: 3000 },
        },
    },

    // Estrutura de pastas obrigatorias
    requiredDirs: [
        'components',
        'contexts',
        'hooks',
        'services',
        'types',
        'config',
        'public',
        'docs',
    ],

    // Arquivos obrigatorios
    requiredFiles: [
        'package.json',
        'vite.config.ts',
        'tsconfig.json',
        'index.html',
    ],

    // Opcoes de verificacao
    checks: {
        integrity: true,
        i18n: true,
        security: true,
        lint: true,
        build: true,
        performance: true,
    },

    // Quick mode - pula checks demorados
    quickMode: {
        skipBuild: true,
        skipSecurity: false,
        skipPerformance: false,
    },
};
