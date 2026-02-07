import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

const PROXIES = [
  {
    name: 'CorsProxy',
    url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`
  },
  {
    name: 'CodeTabs',
    url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`
  }
];

const CACHE_PREFIX = 'article_cache_v2_';

const logger = console; // Fallback if getLogger not available, or import it

export async function fetchFullContent(url: string): Promise<string | null> {
    const cacheKey = CACHE_PREFIX + url;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return cached;
    }
    for (const proxy of PROXIES) {
        try {
            const res = await fetch(proxy.url(url));
            if (!res.ok) {
                logger.warn(`Proxy ${proxy.name} returned status ${res.status} for ${url}`);
                continue;
            }
            let html = await res.text();
            
            // 1. Pre-process to remove problematic tags BEFORE DOM parsing
            // This prevents the browser from trying to load external stylesheets/scripts that violate CSP
            html = html
                .replace(/<link[^>]+rel=["']stylesheet["'][^>]*>/gi, '')
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
                .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, '');

            // 2. Parse HTML
            const doc = new DOMParser().parseFromString(html, 'text/html');
            
            // 3. Fix relative URLs (images, links)
            // Readability needs absolute URLs to work best or we fix them manually
            const base = document.createElement('base');
            base.href = url;
            doc.head.appendChild(base);

            // 4. Use Readability
            const reader = new Readability(doc);
            const article = reader.parse();

            if (article && article.content) {
                // 5. Sanitize aggressively to prevent CSP issues and broken styles
                const sanitized = DOMPurify.sanitize(article.content, {
                    FORBID_TAGS: ['style', 'link', 'script', 'iframe', 'frame', 'object', 'embed', 'form', 'input', 'button'],
                    FORBID_ATTR: ['style', 'class', 'id', 'onmouseover', 'onclick'] // Strip inline styles/classes to force our reader theme
                });
                
                try {
                    localStorage.setItem(cacheKey, sanitized);
                } catch {
                    // Start cleaning up old cache if full? For now just ignore
                    console.warn('Cache full, could not save article');
                }
                return sanitized;
            }
        } catch (e) {
            console.warn(`Failed to fetch via ${proxy.name}`, e);
        }
    }
    return null;
}
