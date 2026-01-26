import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/personalnews/' : '/',
  plugins: [
    react(),
    tailwindcss()
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
        manualChunks: {
          // Separate vendor chunks for better caching
          'react-vendor': ['react', 'react-dom'],
          'core-services': [
            './services/logger.ts',
            './services/errorHandler.ts',
            './services/environmentDetector.ts'
          ],
          'performance': [
            './services/performanceUtils.ts',
            './services/performanceMonitor.ts',
            './hooks/usePerformance.ts',
            './components/PerformanceDebugger.tsx'
          ],
          'services': [
            './services/rssParser.ts',
            './services/weatherService.ts',
            './services/articleCache.ts',
            './services/themeUtils.ts',
            './services/searchUtils.ts',
            './services/smartCache.ts'
          ]
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
    hmr: {
      overlay: false
    }
  }
});
