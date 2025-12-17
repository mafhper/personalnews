/**
 * Accessibility Audit (Lite)
 * Performs basic DOM checks without full engine initially.
 * Ideally should integrate axe-core.
 */
const { withPage } = require('../adapters/playwright.cjs');

const A11yAudit = {
    name: 'a11y',

    async run(context) {
        return withPage(context, async page => {
            const issues = await page.evaluate(() => {
                const found = [];

                // 1. Buttons without accessible name
                document.querySelectorAll('button').forEach(btn => {
                    if (!btn.innerText.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('aria-labelledby')) {
                        found.push({
                            rule: 'button-name',
                            element: btn.outerHTML.slice(0, 50) + '...'
                        });
                    }
                });

                // 2. Images without alt
                document.querySelectorAll('img').forEach(img => {
                    if (!img.hasAttribute('alt')) {
                        found.push({
                            rule: 'image-alt',
                            element: img.outerHTML.slice(0, 50) + '...'
                        });
                    }
                });

                // 3. Form fields without label (basic check)
                document.querySelectorAll('input, select, textarea').forEach(input => {
                    if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') return;

                    const hasId = input.id;
                    const hasLabel = hasId && document.querySelector(`label[for="${hasId}"]`);
                    const hasAriaLabel = input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');

                    if (!hasLabel && !hasAriaLabel) {
                        found.push({
                            rule: 'label',
                            element: input.outerHTML.slice(0, 50) + '...'
                        });
                    }
                });

                // 4. Html lang attribute
                if (!document.documentElement.lang) {
                    found.push({ rule: 'html-has-lang', element: '<html>' });
                }

                return found;
            });

            const violations = [];
            const t = context.thresholds.a11y;

            for (const issue of issues) {
                violations.push({
                    area: 'a11y',
                    metric: issue.rule,
                    value: 'fail',
                    threshold: 'pass',
                    severity: 'error' // A11y usually error
                });
            }

            let score = 100;
            score -= issues.length * 10;
            if (score < 0) score = 0;

            return {
                score,
                violations,
                raw: { issuesCount: issues.length }
            };
        });
    }
}

module.exports = A11yAudit;
