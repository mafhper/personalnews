/**
 * Playwright Adapter
 * Manages browser instances for rendering audits.
 */
const { chromium } = require('playwright');

async function withPage(context, fn) {
    // Use existing browser if passed in context, otherwise launch one
    // For simplicity in MVP, we launch per run or per suite. 
    // Let's launch per call for isolation unless performance is issue.

    const browser = await chromium.launch({
        headless: true, // context.headless !== false
        args: ['--no-sandbox']
    });

    try {
        const contextOptions = {
            viewport: context.device === 'mobile' ? { width: 375, height: 667 } : { width: 1280, height: 800 },
            userAgent: context.device === 'mobile'
                ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
                : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
        };

        const browserContext = await browser.newContext(contextOptions);

        // Route optimization: Block analytics/ads if needed, or allow all to simulate real user
        // await browserContext.route('**/*', route => route.continue());

        const page = await browserContext.newPage();
        await page.goto(context.url, { waitUntil: 'load' }); // or 'networkidle'

        const result = await fn(page);
        return result;

    } finally {
        await browser.close();
    }
}

module.exports = { withPage };
