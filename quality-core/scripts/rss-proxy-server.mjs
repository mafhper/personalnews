/**
 * Local RSS Proxy middleware for development-only use.
 * Attaches to dev server at /local-proxy/<encoded-url>
 */
import { Buffer } from 'buffer';

export async function rssProxyMiddleware(req, res, next) {
    try {
        if (!req.url.startsWith('/local-proxy/')) return next();

        const encoded = req.url.replace('/local-proxy/', '');
        const decoded = decodeURIComponent(encoded);

        if (!decoded.startsWith('http://') && !decoded.startsWith('https://')) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid URL' }));
            return;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const upstream = await fetch(decoded, {
            method: 'GET',
            signal: controller.signal,
            headers: {
                'User-Agent': 'Personal News Dashboard/1.0',
                Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
            },
        });

        clearTimeout(timeoutId);

        if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end(JSON.stringify({ error: `Upstream returned ${upstream.status}` }));
            return;
        }

        const buf = Buffer.from(await upstream.arrayBuffer());

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
        res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        res.end(buf);
    } catch (err) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Proxy error', message: err?.message || String(err) }));
    }
}

export default rssProxyMiddleware;
