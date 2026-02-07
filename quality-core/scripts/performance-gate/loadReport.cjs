/**
 * Performance Gate - Leitor de Reports Lighthouse
 * 
 * Carrega e normaliza reports JSON/HTML do Lighthouse CLI e DevTools
 */

const fs = require('fs');

/**
 * Carrega report Lighthouse (JSON)
 */
function loadReport(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    if (filePath.endsWith('.json')) {
        return JSON.parse(content);
    }

    // Para HTML, extrair JSON embutido
    if (filePath.endsWith('.html')) {
        const match = content.match(/window\.__LIGHTHOUSE_JSON__ = (.+?);<\/script>/s);
        if (match) {
            return JSON.parse(match[1]);
        }
        throw new Error('JSON nao encontrado no HTML');
    }

    throw new Error('Formato nao suportado');
}

/**
 * Detecta form factor do report
 */
function getFormFactor(report) {
    const config = report.configSettings || {};

    if (config.formFactor) {
        return config.formFactor;
    }

    // Inferir de emulatedFormFactor ou screenEmulation
    if (config.emulatedFormFactor) {
        return config.emulatedFormFactor;
    }

    const screen = config.screenEmulation || {};
    if (screen.mobile) return 'mobile';

    return 'desktop';
}

/**
 * Extrai metricas de navegacao do report
 */
function extractMetrics(report) {
    const audits = report.audits || {};

    return {
        // Core Web Vitals
        fcp: audits['first-contentful-paint']?.numericValue || null,
        lcp: audits['largest-contentful-paint']?.numericValue || null,
        tbt: audits['total-blocking-time']?.numericValue || null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,

        // Outros
        si: audits['speed-index']?.numericValue || null,
        tti: audits['interactive']?.numericValue || null,
        fid: audits['max-potential-fid']?.numericValue || null,

        // Scores
        performanceScore: report.categories?.performance?.score || null,
        accessibilityScore: report.categories?.accessibility?.score || null,
        bestPracticesScore: report.categories?.['best-practices']?.score || null,
        seoScore: report.categories?.seo?.score || null,
    };
}

/**
 * Formata valor em ms para exibicao
 */
function formatMs(value) {
    if (value == null || isNaN(value)) return 'N/A';
    if (value < 1000) return `${Math.round(value)}ms`;
    return `${(value / 1000).toFixed(2)}s`;
}

/**
 * Avalia metrica contra thresholds
 */
function evaluateMetric(value, thresholds) {
    if (value == null) return 'unknown';
    if (value <= thresholds.ok) return 'ok';
    if (value <= thresholds.warn) return 'warn';
    return 'fail';
}

module.exports = {
    loadReport,
    getFormFactor,
    extractMetrics,
    formatMs,
    evaluateMetric,
};
