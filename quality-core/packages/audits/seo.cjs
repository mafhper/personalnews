/**
 * SEO Audit
 * checks for meta tags and structural SEO basics.
 */
const { withPage } = require('../adapters/playwright.cjs');

const SeoAudit = {
    name: 'seo',

    async run(context) {
        return withPage(context, async page => {
            const data = await page.evaluate(() => {
                return {
                    title: document.title,
                    description: document.querySelector('meta[name="description"]')?.content,
                    canonical: document.querySelector('link[rel="canonical"]')?.href,
                    h1Count: document.querySelectorAll('h1').length,
                    viewport: document.querySelector('meta[name="viewport"]')?.content,
                    robots: document.querySelector('meta[name="robots"]')?.content
                };
            });

            const violations = [];

            if (!data.title) {
                violations.push({ area: 'seo', metric: 'document-title', value: 'missing', threshold: 'present', severity: 'error' });
            }

            if (!data.description) {
                violations.push({ area: 'seo', metric: 'meta-description', value: 'missing', threshold: 'present', severity: 'error' });
            }

            if (!data.viewport) {
                violations.push({ area: 'seo', metric: 'meta-viewport', value: 'missing', threshold: 'present', severity: 'error' });
            }

            if (data.h1Count === 0) {
                violations.push({ area: 'seo', metric: 'heading-h1', value: 0, threshold: 1, severity: 'warn' });
            } else if (data.h1Count > 1) {
                violations.push({ area: 'seo', metric: 'heading-h1', value: data.h1Count, threshold: 1, severity: 'warn' });
            }

            let score = 100;
            score -= violations.length * 15;
            if (score < 0) score = 0;

            return {
                score,
                violations,
                raw: data
            };
        });
    }
}

module.exports = SeoAudit;
