import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
const isWindows = process.platform === 'win32';
const minifyMode =
  process.env.DASHBOARD_MINIFY ||
  (isWindows ? 'esbuild' : 'terser');
const simpleBundle =
  process.env.DASHBOARD_SIMPLE_BUNDLE === 'true' || isWindows;

export default defineConfig(({ mode }) => ({
  root: __dirname,
  base: '/',
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: minifyMode as 'esbuild' | 'terser',
    ...(minifyMode === 'terser'
      ? {
          terserOptions: {
            compress: {
              drop_console: false, // Keep console.logs for debugging
              drop_debugger: true,
            },
          },
        }
      : {}),
    rollupOptions: {
      output: {
        ...(simpleBundle
          ? {}
          : {
              manualChunks: (id) => {
          // Chunk React and related core libraries
          if (id.includes('node_modules/react') ||
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-router-dom')) {
            return 'vendor-react';
          }
          // Chunk Radix UI components
          if (id.includes('@radix-ui/react-dialog')) return 'vendor-ui-dialog';
          if (id.includes('@radix-ui/react-popover')) return 'vendor-ui-popover';
          if (id.includes('@radix-ui/react-scroll-area')) return 'vendor-ui-scroll';
          if (id.includes('@radix-ui/react-select')) return 'vendor-ui-select';
          if (id.includes('@radix-ui/react-tabs')) return 'vendor-ui-tabs';
          if (id.includes('@radix-ui/react-tooltip')) return 'vendor-ui-tooltip';
          if (id.includes('@radix-ui/react-dropdown-menu')) return 'vendor-ui-dropdown';
          if (id.includes('@radix-ui')) return 'vendor-ui-core';
          // Chunk icons separately - tree shake better
          if (id.includes('lucide-react')) {
            return 'vendor-icons';
          }
          // Chunk charts
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('d3')) return 'vendor-d3';
          // Chunk markdown processing
          if (id.includes('react-markdown') ||
              id.includes('remark-') ||
              id.includes('rehype-') ||
              id.includes('mdast-') ||
              id.includes('micromark')) {
            return 'vendor-markdown';
          }
          // Chunk date utilities
          if (id.includes('date-fns')) return 'vendor-date';
          // Chunk animation libraries
          if (id.includes('framer-motion')) return 'vendor-animations';
          // Chunk utility libraries
          if (id.includes('lodash') || id.includes('ramda')) return 'vendor-utils';
          // Chunk Sonner toast notifications
          if (id.includes('sonner')) return 'vendor-sonner';
        },
            }),
        // Ensure a stable entry chunk is always generated
        entryFileNames: 'assets/index-[hash].js',
        // Optimize chunk size
        ...(simpleBundle ? {} : { compact: true }),
        generatedCode: {
          preset: 'es2015',
          arrowFunctions: true,
          constBindings: true,
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
    // Optimize CSS
    cssMinify: true,
    // Avoid over-aggressive tree-shaking that can blank the app on Windows builds
    modulePreload: {
      polyfill: true,
    },
  }
}));
