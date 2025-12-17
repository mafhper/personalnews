/**
 * Render Audit
 * Measures rendering metrics using Playwright.
 */
const { withPage } = require('../adapters/playwright.cjs');

const RenderAudit = {
    name: 'render',

    async run(context) {
        return withPage(context, async page => {
            // Setup listeners for metrics
            // We evaluate inside the page context
            const metrics = await page.evaluate(async () => {
                return new Promise(resolve => {
                    let cls = 0;
                    let longTasks = [];
                    let fp = 0;

                    // Observer for CLS
                    try {
                        new PerformanceObserver(list => {
                            for (const e of list.getEntries()) {
                                if (!e.hadRecentInput) {
                                    cls += e.value;
                                }
                            }
                        }).observe({ type: 'layout-shift', buffered: true });
                    } catch (e) { }

                    // Observer for Long Tasks
                    try {
                        new PerformanceObserver(list => {
                            for (const e of list.getEntries()) {
                                longTasks.push(e.duration);
                            }
                        }).observe({ type: 'longtask', buffered: true });
                    } catch (e) { }

                    // Observer for Paint
                    try {
                        new PerformanceObserver(list => {
                            const entries = list.getEntries();
                            const entry = entries.find(e => e.name === 'first-paint');
                            if (entry) fp = entry.startTime;
                        }).observe({ type: 'paint', buffered: true });
                    } catch (e) { }

                    // Wait a bit to capture load metrics
                    setTimeout(() => {
                        // Fallback for Paint if observer didn't catch (it happens)
                        if (fp === 0) {
                            const pEntries = performance.getEntriesByName('first-paint');
                            if (pEntries.length > 0) fp = pEntries[0].startTime;
                        }

                        resolve({ fp, cls, longTasks });
                    }, 3000);
                });
            });

            const violations = [];
            const t = context.thresholds.render;

            // First Paint
            if (metrics.fp > t.fp_ms) {
                violations.push({
                    area: 'render', metric: 'first_paint',
                    value: Math.round(metrics.fp), threshold: t.fp_ms, severity: 'warn'
                });
            }

            // CLS
            if (metrics.cls > t.cls) {
                violations.push({
                    area: 'render', metric: 'cls',
                    value: metrics.cls.toFixed(3), threshold: t.cls, severity: 'error'
                });
            }

            // Long Tasks
            const totalBlocking = metrics.longTasks.reduce((a, b) => a + b, 0);
            if (totalBlocking > t.long_tasks_total_ms) {
                violations.push({
                    area: 'render', metric: 'total_blocking_time', // approx
                    value: Math.round(totalBlocking), threshold: t.long_tasks_total_ms, severity: 'warn'
                });
            }

            // Score
            let score = 100;
            if (metrics.fp > t.fp_ms) score -= 10;
            if (metrics.cls > t.cls) score -= 20;
            if (totalBlocking > t.long_tasks_total_ms) score -= 10;
            if (score < 0) score = 0;

            return {
                score,
                violations,
                raw: metrics
            };
        });
    }
}

module.exports = RenderAudit;
