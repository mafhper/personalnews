import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Local dev-only RSS proxy middleware (attached below in plugins)
import rssProxyMiddleware from './quality-core/scripts/rss-proxy-server.mjs';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/personalnews/' : '/',
  plugins: [
    react(),
    tailwindcss(),
    // Attach local proxy middleware only in dev
    {
      name: 'local-rss-proxy',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            return rssProxyMiddleware(req, res, next);
          } catch (e) {
            return next();
          }
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
  // Performance optimizations
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: false
    }
  },

  preview: {
    port: 4173,
    strictPort: false
  }
});
