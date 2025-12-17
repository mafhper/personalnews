/**
 * UX Audit
 * Checks for user experience heuristics (tap targets, etc).
 */
const { withPage } = require('../adapters/playwright.cjs');

const UxAudit = {
    name: 'ux',

    async run(context) {
        return withPage(context, async page => {
            // Analyze interactive elements
            const elements = await page.evaluate(() => {
                const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
                const results = [];

                interactive.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    // check if visible
                    if (rect.width > 0 && rect.height > 0) {
                        results.push({
                            tag: el.tagName.toLowerCase(),
                            text: el.innerText.slice(0, 20),
                            width: rect.width,
                            height: rect.height
                        });
                    }
                });
                return results;
            });

            const violations = [];
            const t = context.thresholds.ux;
            const minSize = t.min_target_size || 44;

            let smallTargets = 0;

            for (const el of elements) {
                if (el.width < minSize || el.height < minSize) {
                    smallTargets++;
                    // Don't flood log, maybe push a summary or first few
                    if (violations.length < 5) {
                        violations.push({
                            area: 'ux', metric: 'small_tap_target',
                            value: `${Math.round(el.width)}x${Math.round(el.height)}px`,
                            threshold: `${minSize}x${minSize}px`,
                            severity: 'warn' // usually warn
                        });
                    }
                }
            }

            if (smallTargets > 0) {
                violations.push({
                    area: 'ux', metric: 'small_tap_targets_count',
                    value: smallTargets,
                    threshold: 0,
                    severity: 'warn'
                });
            }

            let score = 100;
            score -= smallTargets * 2; // Penalize each small target slightly
            if (score < 0) score = 0;

            return {
                score,
                violations,
                raw: { interactiveElements: elements.length, smallTargets }
            };
        });
    }
}

module.exports = UxAudit;
