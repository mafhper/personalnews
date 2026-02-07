/**
 * Quality Core Runner
 * Orchestrates the execution of audits and aggregates results.
 */
const UI = require('../../cli/ui-helpers.cjs');

async function runAudits({ audits, context }) {
    const startedAt = Date.now();
    const result = {
        meta: {
            timestamp: Date.now(),
            preset: context.preset,
            project: 'personalnews',
            commit: process.env.GITHUB_SHA || 'local',
            totalDurationMs: 0,
            auditTimings: [],
        },
        status: 'pass',
        scores: {},
        violations: [],
        raw: {}
    }

    let failed = false

    console.log(`\n${UI.hierarchy(`🚀 Starting Quality Core Audit (${context.preset})`, { level: 0, color: 'cyan', bold: true })}`);

    let warningCount = 0;
    let errorCount = 0;

    for (const audit of audits) {
        const auditStartedAt = Date.now();
        console.log(UI.hierarchy(`▶ Running audit: ${audit.name}`, { level: 1, color: 'cyan', bold: true }));
        try {
            const out = await audit.run(context);
            const auditDurationMs = Date.now() - auditStartedAt;

            // Normalize score
            result.scores[audit.name] = out.score;
            result.raw[audit.name] = out.raw || {};

            if (out.violations && out.violations.length > 0) {
                console.log(UI.hierarchy(`⚠️ ${out.violations.length} violations found`, { level: 2, color: 'yellow' }));
                for (const v of out.violations) {
                    result.violations.push(v);
                    if (v.severity === 'error') {
                        failed = true;
                        errorCount += 1;
                        console.log(UI.hierarchy(`🔴 [${v.metric}] ${v.value} (Threshold: ${v.threshold})`, { level: 3, color: 'red' }));
                    } else {
                        warningCount += 1;
                        console.log(UI.hierarchy(`🟡 [${v.metric}] ${v.value} (Threshold: ${v.threshold})`, { level: 3, color: 'yellow' }));
                    }
                }
            } else {
                console.log(UI.hierarchy('✅ passed', { level: 2, color: 'green' }));
            }

            result.meta.auditTimings.push({
                name: audit.name,
                status: out.violations && out.violations.some(v => v.severity === 'error')
                    ? 'fail'
                    : out.violations && out.violations.length > 0
                        ? 'warn'
                        : 'pass',
                durationMs: auditDurationMs,
            });
            console.log(UI.hierarchy(`⏱️ ${auditDurationMs}ms`, { level: 2, color: 'dim' }));
        } catch (err) {
            const auditDurationMs = Date.now() - auditStartedAt;
            console.error(UI.hierarchy(`❌ Failed to run audit ${audit.name}: ${err?.message || String(err)}`, { level: 2, color: 'red' }));
            result.violations.push({
                area: audit.name,
                metric: 'execution_error',
                value: err.message,
                threshold: null,
                severity: 'error'
            });
            result.meta.auditTimings.push({
                name: audit.name,
                status: 'fail',
                durationMs: auditDurationMs,
            });
            errorCount += 1;
            failed = true;
        }
    }

    result.meta.totalDurationMs = Date.now() - startedAt;
    result.status = failed ? 'fail' : 'pass';

    console.log(`\n${UI.hierarchy('📋 Audit timings', { level: 0, color: 'white', bold: true })}`);
    for (const timing of result.meta.auditTimings) {
        const icon = timing.status === 'pass' ? '✅' : timing.status === 'warn' ? '⚠️ ' : '❌';
        console.log(UI.hierarchy(`${icon} ${timing.name}: ${timing.durationMs}ms`, { level: 1, color: 'dim' }));
    }
    console.log(UI.hierarchy(`Totals: warnings=${warningCount} | errors=${errorCount} | duration=${result.meta.totalDurationMs}ms`, { level: 1, color: 'dim' }));

    if (failed) {
        console.log(`\n${UI.hierarchy('❌ Quality Check Failed', { level: 0, color: 'red', bold: true })}`);
    } else {
        console.log(`\n${UI.hierarchy('✅ Quality Check Passed', { level: 0, color: 'green', bold: true })}`);
    }

    return result;
}

module.exports = { runAudits };
