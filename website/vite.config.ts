import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    root: path.resolve(__dirname),
    // Cache separado para evitar conflito com app principal
    cacheDir: path.resolve(__dirname, '../node_modules/.vite-website'),
    base: process.env.NODE_ENV === 'production' ? '/personalnews/' : '/',
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            },
            output: {
                manualChunks: {
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-framer': ['framer-motion'],
                    'vendor-ui': ['lucide-react', 'i18next', 'react-i18next']
                }
            }
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src')
        }
    },
    server: {
        port: 5174,
        proxy: {
            // Proxy /app para a aplicação principal rodando na 5173
            '/app': {
                target: 'http://localhost:5173',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/app/, '')
            }
        }
    }
});
