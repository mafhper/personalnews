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

export async function fetchFullContent(url: string): Promise<string | null> {
    // 1. Try fetching via proxies
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
                return DOMPurify.sanitize(article.content);
            }
        } catch (e) {
            console.warn(`Failed to fetch via ${proxy.name}`, e);
        }
    }
    return null;
}
