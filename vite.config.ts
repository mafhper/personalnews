import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Local dev-only RSS proxy middleware (attached below in plugins)
import rssProxyMiddleware from './quality-core/scripts/rss-proxy-server.mjs';

const productionCsp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src * data: blob:",
  "connect-src 'self' http://localhost:* https://api.github.com https://api.rss2json.com https://api.allorigins.win https://corsproxy.io https://api.codetabs.com https://api.open-meteo.com https://nominatim.openstreetmap.org https://esm.sh https://fonts.googleapis.com https://fonts.gstatic.com https://whatever-origin.herokuapp.com https://textproxy.io https://cors-anywhere.herokuapp.com"
].join('; ');

const resolvePort = (value: string | undefined, fallback: number) => {
  const port = Number.parseInt(value ?? '', 10);
  return Number.isFinite(port) && port > 0 ? port : fallback;
};

export default defineConfig(({ command, mode }) => {
  const devPort = resolvePort(process.env.DEV_PORT ?? process.env.PORT, 5173);
  const previewPort = resolvePort(process.env.PREVIEW_PORT ?? process.env.PORT, 4175);
  const usePublishedBase = command === 'build' || mode === 'production';

  return {
  base: usePublishedBase ? '/personalnews/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'inject-production-csp',
      transformIndexHtml(html) {
        if (command !== 'build') return html;

        const cspMeta = `  <meta http-equiv="Content-Security-Policy" content="${productionCsp}" />`;
        return html.replace('<meta name="viewport" content="width=device-width, initial-scale=1.0" />', `${cspMeta}\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />`);
      }
    },
    // Attach local proxy middleware only in dev
    {
      name: 'local-rss-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (!req.url?.startsWith('/local-proxy/')) {
            return next();
          }

          void rssProxyMiddleware(req, res, next).catch(() => {
            if (!res.headersSent) {
              next();
            }
          });
        });
      }
    }
  ],
  resolve: {
    alias: {
      '@': './',
    }
  },
  build: {
    // Output directory for GitHub Pages
    outDir: 'dist',
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Keep third-party modules in a single vendor chunk to avoid
            // cross-chunk circular init ordering issues in preview/prod.
            return 'vendor';
          }

          if (id.includes('/components/landing/')) return 'landing';
          if (id.includes('/components/layouts/')) return 'feed-layouts';
          if (id.includes('/components/FeedManager') || id.includes('/components/FeedAnalytics') || id.includes('/components/Proxy')) {
            return 'feed-tools';
          }

          if (id.includes('/services/rssParser') || id.includes('/services/unifiedRssParser') || id.includes('/services/feedDiscoveryService') || id.includes('/services/feedValidator')) {
            return 'feed-network';
          }
          if (id.includes('/services/proxyManager')) return 'proxy-core';
          if (id.includes('/services/articleCache') || id.includes('/services/smartCache') || id.includes('/services/smartValidationCache')) {
            return 'feed-cache';
          }
          if (id.includes('/services/performance') || id.includes('/components/PerformanceDebugger') || id.includes('/hooks/usePerformance')) {
            return 'performance';
          }
          if (id.includes('/services/logger') || id.includes('/services/errorHandler') || id.includes('/services/environmentDetector')) {
            return 'core-services';
          }
          return undefined;
        }
      }
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable source maps for development only
    sourcemap: false,
    // Minify for production
    minify: 'esbuild',
    // Target modern browsers for better optimization
    target: 'es2020'
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: []
  },
  server: {
    port: devPort,
    strictPort: true,
    hmr: {
      overlay: false
    }
  },
  preview: {
    port: previewPort,
    strictPort: true
  }
  };
});
