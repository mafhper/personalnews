import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { assertPortFree } from "./scripts/sonda-porta";

// https://vitejs.dev/config/
const isWindows = process.platform === "win32";
const minifyMode =
  process.env.DASHBOARD_MINIFY || (isWindows ? "esbuild" : "terser");
const simpleBundle =
  process.env.DASHBOARD_SIMPLE_BUNDLE === "true" || isWindows;

// 5282 — o app principal usa 5290 e o backend 3001. Este painel e uma terceira
// superficie, entao tem numero proprio. Antes era 8080, que nao disputava com a
// frota, mas tambem nao era nomeado e colidia com `mark-lee/apps/site`.
const DEV_PORT = 5282;
// Convencao da frota: preview = dev - 1000 (5290/4290, 5173/4173). A 4282 e a
// superficie de preview deste painel; sem ela o preview herdava a 5282 por
// omissao e o probe abortava por conflito no proprio dev (achado do review
// automatico da #312).
const PREVIEW_PORT = 4282;

export default defineConfig(async ({ mode, command, isPreview }) => {
  // `host: '::'` e IPv6-only no Windows: `127.0.0.1:8080` da ECONNRESET e
  // `[::1]:8080` responde 200 (medido em 2026-10-01,
  // `.dev/scripts/medir-host-alcance.mjs`). Como `::` aceita o bind mesmo com
  // `127.0.0.1:8080` ocupado, `strictPort` sozinho nunca dispara — e `push_`,
  // `mark-lee/apps/site` e este painel disputam a MESMA 8080.
  //
  // Este painel nao tem `devUrl` fixo, entao realocar seria possivel, mas o
  // dashboard e aberto por script em varios lugares. Verificar e abortar deixa
  // o conflito visivel em vez de servir o painel errado em 8081.
  //
  // O Vite resolve o `preview` com `command === "serve"` e `isPreview === true`
  // (conferido no vite instalado), entao o probe rodava no preview tambem —
  // bloqueava `bun run preview` por conflito na 5282 e nao media a porta real
  // do preview. Agora `isPreview` escolhe a porta a sondar (achado do review
  // automatico da #312).
  if (command === "serve") {
    await assertPortFree(isPreview ? PREVIEW_PORT : DEV_PORT);
  }

  return {
  root: __dirname,
  base: "/",
  server: {
    host: "::",
    port: DEV_PORT,
    strictPort: true,
    hmr: {
      overlay: false,
    },
  },
  preview: {
    port: PREVIEW_PORT,
    strictPort: true,
  },
  plugins: [react()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    minify: minifyMode as "esbuild" | "terser",
    ...(minifyMode === "terser"
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
      checks: {
        pluginTimings: false,
      },
      output: {
        ...(simpleBundle
          ? {}
          : {
              manualChunks: (id) => {
                // Chunk React and related core libraries
                if (
                  id.includes("node_modules/react") ||
                  id.includes("node_modules/react-dom") ||
                  id.includes("node_modules/react-router")
                ) {
                  return "vendor-react";
                }
                // Chunk Radix UI components
                if (id.includes("@radix-ui/react-dialog"))
                  return "vendor-ui-dialog";
                if (id.includes("@radix-ui/react-popover"))
                  return "vendor-ui-popover";
                if (id.includes("@radix-ui/react-scroll-area"))
                  return "vendor-ui-scroll";
                if (id.includes("@radix-ui/react-select"))
                  return "vendor-ui-select";
                if (id.includes("@radix-ui/react-tabs"))
                  return "vendor-ui-tabs";
                if (id.includes("@radix-ui/react-tooltip"))
                  return "vendor-ui-tooltip";
                if (id.includes("@radix-ui/react-dropdown-menu"))
                  return "vendor-ui-dropdown";
                if (id.includes("@radix-ui")) return "vendor-ui-core";
                // Chunk icons separately - tree shake better
                if (id.includes("lucide-react")) {
                  return "vendor-icons";
                }
                // Chunk charts
                if (id.includes("recharts")) return "vendor-charts";
                if (id.includes("d3")) return "vendor-d3";
                // Chunk markdown processing
                if (
                  id.includes("react-markdown") ||
                  id.includes("remark-") ||
                  id.includes("rehype-") ||
                  id.includes("mdast-") ||
                  id.includes("micromark")
                ) {
                  return "vendor-markdown";
                }
                // Chunk date utilities
                if (id.includes("date-fns")) return "vendor-date";
                // Chunk animation libraries
                if (id.includes("framer-motion")) return "vendor-animations";
                // Chunk utility libraries
                if (id.includes("lodash") || id.includes("ramda"))
                  return "vendor-utils";
                // Chunk Sonner toast notifications
                if (id.includes("sonner")) return "vendor-sonner";
              },
            }),
        // Ensure a stable entry chunk is always generated
        entryFileNames: "assets/index-[hash].js",
        // Optimize chunk size
        ...(simpleBundle ? {} : { compact: true }),
        generatedCode: {
          preset: "es2015",
        },
      },
    },
    // Enable source maps for debugging
    sourcemap: false,
    // Keep the warning threshold above the current largest dashboard chunk.
    chunkSizeWarningLimit: 700,
    // Optimize CSS
    cssMinify: true,
    // Avoid over-aggressive tree-shaking that can blank the app on Windows builds
    modulePreload: {
      polyfill: true,
    },
  },
};
});
