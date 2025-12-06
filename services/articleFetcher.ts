import { Readability } from '@mozilla/readability';
import DOMPurify from 'dompurify';

const PROXIES = [
  {
    name: 'AllOrigins',
    url: (target: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`
  },
  {
    name: 'CorsProxy',
    url: (target: string) => `https://corsproxy.io/?${encodeURIComponent(target)}`
  },
   {
    name: 'CodeTabs',
    url: (target: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(target)}`
  }
];

const CACHE_PREFIX = 'article_cache_';

export async function fetchFullContent(url: string): Promise<string | null> {
    const cacheKey = CACHE_PREFIX + url;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
        return cached;
    }
    for (const proxy of PROXIES) {
        try {
            const res = await fetch(proxy.url(url));
            if (!res.ok) continue;
            const html = await res.text();
            
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
                // 5. Sanitize
                const sanitized = DOMPurify.sanitize(article.content);
                try {
                    localStorage.setItem(cacheKey, sanitized);
                } catch (e) {
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
