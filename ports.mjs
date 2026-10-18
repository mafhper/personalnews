// As portas deste projeto, em um lugar so.
//
// A porta aparecia em QUATRO lugares que nao se liam: o `vite.config.ts`, o
// `playwright.config.ts` (que ainda passava `--port` na linha de comando, e isso
// PREVALECE sobre o config), o allowlist de CORS do backend e o
// `scripts/run-local-stack.mjs`. Um quarto lugar sempre e um quarto lugar que
// esquece.
//
// ## Por que o allowlist do backend parou de ser uma FAIXA
//
// `apps/backend/src/httpSecurity.ts` aceitava qualquer loopback entre 5173-5190
// e 4175-4190. A intencao era tolerar o incremento automatico do Vite. Mas este
// projeto roda com `strictPort: true` — a porta NUNCA incrementa. A faixa
// defendia um cenario que nao acontece, e pagava por isso: `5290` (a porta
// nomeada) ficava FORA dela, entao o proprio app era rejeitado pelo backend.
//
// Faixa e permissiva e_barulhenta; conjunto explicito e mais curto de auditar.
// Este e o conjunto explicito. `tauri://localhost` continua na lista porque e a
// origem real do app desktop e nao tem porta nenhuma.
//
// ## O numero
//
// 5290 = dev, 4290 = preview (a convencao do Vite: preview = dev - 1000, como
// `5173`/`4173`). Fora de 5173-5175 e 4173-4175 de proposito: essas sao as faixas
// onde o incremento cai, e uma porta nomeada la dentro seria indistinguivel de
// um incremento — que e o defeito que a nomeacao evita.

export const DEV_PORT = 5290;
export const PREVIEW_PORT = 4290;

/** O backend nao muda: 3001 e contrato de `apiClient`, do Tauri e da doc. */
export const BACKEND_PORT = 3001;

/**
 * Origens que o backend aceita em dev. `httpSecurity.ts` importa estas listas
 * direto daqui (o backend roda em Bun, que resolve `.mjs`); cobre o allowlist
 * o teste `__tests__/httpSecurity.ports.core.test.ts`.
 *
 * O backend NAO tem origem de pagina: ele so serve JSON/403 em 3001, entao
 * nao existe lista `BACKEND_ORIGINS` — aceitar 3001-3011 daria CORS a qualquer
 * app local que sirva pagina por perto (achado do review automatico da #312).
 */
export const DEV_ORIGINS = [
  `http://localhost:${DEV_PORT}`,
  `http://127.0.0.1:${DEV_PORT}`,
];
export const PREVIEW_ORIGINS = [
  `http://localhost:${PREVIEW_PORT}`,
  `http://127.0.0.1:${PREVIEW_PORT}`,
];
/** Tauri nao tem porta: a origem vem do esquema do webview. */
export const TAURI_ORIGINS = [
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
];