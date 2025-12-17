/**
 * Performance Gate - Analisador de Reports em Lote
 * 
 * Analisa multiplos reports Lighthouse e gera estatisticas
 * 
 * Uso:
 *   node scripts/performance-gate/analyze.cjs
 *   node scripts/performance-gate/analyze.cjs performance-reports/lighthouse
 */

const fs = require('fs');
const path = require('path');
const { loadReport, getFormFactor, extractMetrics, formatMs } = require('./loadReport.cjs');

// ANSI colors
const c = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
};

// Thresholds
const THRESHOLDS = {
    mobile: {
        fcp: { ok: 1000, warn: 1800 },
        lcp: { ok: 1800, warn: 2500 },
        tbt: { ok: 200, warn: 300 },
        cls: { ok: 0.05, warn: 0.1 },
        si: { ok: 2000, warn: 3000 },
    },
    desktop: {
        fcp: { ok: 800, warn: 1200 },
        lcp: { ok: 1200, warn: 2000 },
        tbt: { ok: 100, warn: 200 },
        cls: { ok: 0.05, warn: 0.1 },
        si: { ok: 1500, warn: 2000 },
    },
};

function calcStats(values) {
    const valid = values.filter(v => v != null && !isNaN(v));
    if (valid.length === 0) return { mean: null, min: null, max: null, count: 0 };

    const mean = valid.reduce((a, b) => a + b, 0) / valid.length;
    return {
        mean,
        min: Math.min(...valid),
        max: Math.max(...valid),
        count: valid.length,
    };
}

function getStatus(value, metric, formFactor) {
    const t = THRESHOLDS[formFactor]?.[metric];
    if (!t || value == null) return '❓';
    if (value > t.warn) return '❌';
    if (value > t.ok) return '⚠️';
    return '✅';
}

function generateReport(analysis) {
    const now = new Date();

    let md = `# Analise de Performance - Lighthouse\n\n`;
    md += `**Data:** ${now.toLocaleString('pt-BR')}\n`;
    md += `**Diretorio:** ${analysis.directory}\n`;
    md += `**Total de Reports:** ${analysis.totalReports}\n\n`;

    for (const formFactor of ['desktop', 'mobile']) {
        const data = analysis[formFactor];
        if (!data || data.reports.length === 0) continue;

        md += `## ${formFactor === 'desktop' ? '🖥️ Desktop' : '📱 Mobile'} (${data.reports.length} reports)\n\n`;
        md += `| Metrica | Media | Min | Max | Ultimo |\n`;
        md += `|---------|-------|-----|-----|--------|\n`;

        for (const [metric, stats] of Object.entries(data.stats)) {
            const isCLS = metric === 'cls';
            const formatFn = isCLS ? v => v?.toFixed(3) || 'N/A' : formatMs;
            const lastVal = data.reports[data.reports.length - 1]?.metrics[metric];
            const status = getStatus(lastVal, metric, formFactor);

            md += `| ${metric.toUpperCase()} | ${formatFn(stats.mean)} | ${formatFn(stats.min)} | ${formatFn(stats.max)} | ${status} ${formatFn(lastVal)} |\n`;
        }
        md += `\n`;
    }

    md += `---\n*Gerado pelo Performance Gate*\n`;
    return md;
}

function main() {
    const defaultDir = path.resolve(__dirname, '../../performance-reports/lighthouse');
    const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultDir;

    console.log(`\n${c.cyan}${c.bold}Performance Gate - Batch Analyzer${c.reset}\n`);

    if (!fs.existsSync(inputDir)) {
        console.log(`${c.yellow}Diretorio nao existe: ${inputDir}${c.reset}`);
        console.log(`Criando diretorio...`);
        fs.mkdirSync(inputDir, { recursive: true });
        console.log(`${c.green}✓ Diretorio criado. Adicione reports Lighthouse (.json) aqui.${c.reset}\n`);
        return;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json')).sort();

    if (files.length === 0) {
        console.log(`${c.yellow}Nenhum report JSON encontrado em: ${inputDir}${c.reset}`);
        console.log(`\nPara gerar reports, use:`);
        console.log(`  lighthouse URL --output=json --output-path=performance-reports/lighthouse/report.json\n`);
        return;
    }

    console.log(`${c.dim}Diretorio: ${inputDir}${c.reset}`);
    console.log(`${c.dim}Reports: ${files.length}${c.reset}\n`);

    // Separar por form factor
    const byFormFactor = { mobile: [], desktop: [] };

    for (const file of files) {
        try {
            const report = loadReport(path.join(inputDir, file));
            const formFactor = getFormFactor(report);
            const metrics = extractMetrics(report);

            byFormFactor[formFactor]?.push({ file, metrics, timestamp: report.fetchTime || file });
        } catch (err) {
            console.log(`${c.yellow}⚠ Erro em ${file}: ${err.message}${c.reset}`);
        }
    }

    // Construir analise
    const analysis = {
        directory: inputDir,
        totalReports: files.length,
        desktop: { reports: byFormFactor.desktop, stats: {} },
        mobile: { reports: byFormFactor.mobile, stats: {} },
    };

    // Calcular stats
    for (const [formFactor, reports] of Object.entries(byFormFactor)) {
        if (reports.length === 0) continue;

        console.log(`${c.bold}${formFactor.toUpperCase()} (${reports.length} reports)${c.reset}`);

        const metricsToAnalyze = ['fcp', 'lcp', 'tbt', 'cls', 'si'];

        for (const metric of metricsToAnalyze) {
            const values = reports.map(r => r.metrics[metric]);
            const stats = calcStats(values);
            analysis[formFactor].stats[metric] = stats;

            const isCLS = metric === 'cls';
            const formatFn = isCLS ? v => v?.toFixed(3) || 'N/A' : formatMs;
            const lastVal = reports[reports.length - 1]?.metrics[metric];
            const status = getStatus(lastVal, metric, formFactor);

            console.log(`  ${status} ${metric.toUpperCase()}: ${formatFn(stats.mean)} (ultimo: ${formatFn(lastVal)})`);
        }
        console.log();
    }

    // Salvar relatorio
    const outputDir = path.resolve(__dirname, '../../performance-reports/analysis');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const reportPath = path.join(outputDir, `analise_${timestamp}.md`);
    fs.writeFileSync(reportPath, generateReport(analysis), 'utf8');

    console.log(`${c.green}✓ Relatorio salvo: ${reportPath}${c.reset}\n`);
}

main();
