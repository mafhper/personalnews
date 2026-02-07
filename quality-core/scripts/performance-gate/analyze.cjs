/**
 * Performance Gate - Analisador de Reports em Lote
 * 
 * Analisa multiplos reports Lighthouse e gera estatisticas
 * 
 * Uso:
 *   node quality-core/scripts/performance-gate/analyze.cjs
 *   node quality-core/scripts/performance-gate/analyze.cjs performance-reports/lighthouse
 */

const fs = require('fs');
const path = require('path');
const { loadReport, getFormFactor, extractMetrics, formatMs } = require('./loadReport.cjs');
const UI = require('../../cli/ui-helpers.cjs');
const History = require('../../cli/history.cjs');
const args = process.argv.slice(2);
const isSilent = args.includes('--silent') || args.includes('-s');
const isQuiet = args.includes('--quiet') || args.includes('-q');
const log = UI.createLogger({ tag: 'PERF', silent: isSilent, quiet: isQuiet });

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
    const startTime = Date.now();
    let stopTimer = null;
    const defaultDir = path.resolve(__dirname, '../../../performance-reports/lighthouse');
    const inputDir = process.argv[2] ? path.resolve(process.argv[2]) : defaultDir;
    const modeLabel = [
        isSilent ? 'silent' : isQuiet ? 'quiet' : 'default',
    ].join('-');

    if (!isSilent) {
        UI.printHeader({
            title: 'QUALITY CORE - PERFORMANCE ANALYZE',
            modes: ['--silent', '--quiet'],
            active: [
                isSilent ? 'silent' : null,
                isQuiet ? 'quiet' : null,
            ].filter(Boolean),
        });
        const avgHeader = History.getAverageDuration('performance-analyze', modeLabel);
        stopTimer = UI.printTimingHeader({
            avgLabel: avgHeader,
            modeLabel,
            live: UI.shouldLiveTimer() && !isQuiet,
        });
    }
    if (!isSilent && !isQuiet) {
        UI.printPlan([
            { name: 'Load reports' },
            { name: 'Compute stats' },
            { name: 'Write report' },
        ]);
    }
    if (!isSilent && !isQuiet) {
        UI.printScriptStart('performance analyze', 1, 1);
    } else if (isQuiet) {
        UI.printQuietStepStart('performance analyze', 1, 1);
    }

    if (!fs.existsSync(inputDir)) {
        log.warn(`Diretorio nao existe: ${inputDir}`);
        log.info('Criando diretorio...');
        fs.mkdirSync(inputDir, { recursive: true });
        log.success('Diretorio criado. Adicione reports Lighthouse (.json) aqui.');
        const duration = Date.now() - startTime;
        History.saveExecutionTime('performance-analyze', duration, modeLabel);
        const avg = History.getAverageDuration('performance-analyze', modeLabel);
        if (!isSilent && !isQuiet) {
            UI.printScriptEnd('performance analyze', duration, avg, true);
        } else if (isQuiet) {
            UI.printQuietStepEnd('performance analyze', 1, 1, duration, avg, true);
        }
        if (stopTimer) stopTimer();
        if (isSilent || isQuiet) {
            UI.printSummary({
                title: 'PERFORMANCE ANALYZE',
                status: 'pass',
                metrics: ['Nenhum report encontrado'],
                duration: (duration / 1000).toFixed(2),
                reportDir: path.resolve(__dirname, '../../../performance-reports/analysis'),
            });
        }
        return;
    }

    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json')).sort();

    if (files.length === 0) {
        log.warn(`Nenhum report JSON encontrado em: ${inputDir}`);
        log.info('Para gerar reports, use:');
        log.info('  lighthouse URL --output=json --output-path=performance-reports/lighthouse/report.json');
        const duration = Date.now() - startTime;
        History.saveExecutionTime('performance-analyze', duration, modeLabel);
        const avg = History.getAverageDuration('performance-analyze', modeLabel);
        if (!isSilent && !isQuiet) {
            UI.printScriptEnd('performance analyze', duration, avg, true);
        } else if (isQuiet) {
            UI.printQuietStepEnd('performance analyze', 1, 1, duration, avg, true);
        }
        if (stopTimer) stopTimer();
        if (isSilent || isQuiet) {
            UI.printSummary({
                title: 'PERFORMANCE ANALYZE',
                status: 'pass',
                metrics: ['Nenhum report encontrado'],
                duration: (duration / 1000).toFixed(2),
                reportDir: path.resolve(__dirname, '../../../performance-reports/analysis'),
            });
        }
        return;
    }

    log.info(`Diretorio: ${inputDir}`);
    log.info(`Reports: ${files.length}`);

    // Separar por form factor
    const byFormFactor = { mobile: [], desktop: [] };

    for (const file of files) {
        try {
            const report = loadReport(path.join(inputDir, file));
            const formFactor = getFormFactor(report);
            const metrics = extractMetrics(report);

            byFormFactor[formFactor]?.push({ file, metrics, timestamp: report.fetchTime || file });
        } catch (err) {
            log.warn(`Erro em ${file}: ${err.message}`);
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

        log.info(`${formFactor.toUpperCase()} (${reports.length} reports)`);

        const metricsToAnalyze = ['fcp', 'lcp', 'tbt', 'cls', 'si'];

        for (const metric of metricsToAnalyze) {
            const values = reports.map(r => r.metrics[metric]);
            const stats = calcStats(values);
            analysis[formFactor].stats[metric] = stats;

            const isCLS = metric === 'cls';
            const formatFn = isCLS ? v => v?.toFixed(3) || 'N/A' : formatMs;
            const lastVal = reports[reports.length - 1]?.metrics[metric];
            const status = getStatus(lastVal, metric, formFactor);

            log.info(`  ${status} ${metric.toUpperCase()}: ${formatFn(stats.mean)} (ultimo: ${formatFn(lastVal)})`);
        }
        log.raw('');
    }

    // Salvar relatorio
    const outputDir = path.resolve(__dirname, '../../../performance-reports/analysis');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().slice(0, 10);
    const reportPath = path.join(outputDir, `analise_${timestamp}.md`);
    fs.writeFileSync(reportPath, generateReport(analysis), 'utf8');

    log.success(`Relatorio salvo: ${reportPath}`);

    const duration = Date.now() - startTime;
    History.saveExecutionTime('performance-analyze', duration, modeLabel);
    const avg = History.getAverageDuration('performance-analyze', modeLabel);
    if (!isSilent && !isQuiet) {
        UI.printScriptEnd('performance analyze', duration, avg, true);
    } else if (isQuiet) {
        UI.printQuietStepEnd('performance analyze', 1, 1, duration, avg, true);
    }
    if (stopTimer) stopTimer();
    if (isSilent || isQuiet) {
        UI.printSummary({
            title: 'PERFORMANCE ANALYZE',
            status: 'pass',
            metrics: [`Reports: ${files.length}`],
            duration: (duration / 1000).toFixed(2),
            reportDir: outputDir,
        });
    }
}

main();
