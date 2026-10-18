import { BACKEND_AUTH_TOKEN_HEADER } from "../../../shared/contracts/backend";
import {
  BACKEND_ORIGINS,
  BACKEND_PORT,
  DEV_ORIGINS,
  DEV_PORT,
  PREVIEW_ORIGINS,
  PREVIEW_PORT,
  TAURI_ORIGINS,
} from "../../../ports.mjs";

// Conjunto EXPLICITO, e nao faixa.
//
// Antes era `5173-5190` e `4175-4190`, para tolerar o incremento do Vite — mas
// este projeto roda `strictPort: true`, entao a porta NUNCA incrementa. A faixa
// defendia um cenario inexistente e cobrava por isso: a porta nomeada (5290)
// ficava fora dela e o proprio app era rejeitado pelo backend.
//
// A lista abaixo vem de `ports.mjs`, que e a fonte unica — este arquivo nao
// repete os numeros. O teste `__tests__/httpSecurity.ports.core.test.ts` cobre
// o allowlist (porta nomeada aceita, 5173 recusado, env como acrescimo).
const DEFAULT_ALLOWED_ORIGINS = new Set<string>([
  ...DEV_ORIGINS,
  ...PREVIEW_ORIGINS,
  ...BACKEND_ORIGINS,
  ...TAURI_ORIGINS,
]);

const CORS_METHODS = "GET,POST,PUT,OPTIONS";
const CORS_HEADERS = `content-type,accept,${BACKEND_AUTH_TOKEN_HEADER}`;

function configuredAllowedOrigins(): Set<string> {
  const configured = process.env.BACKEND_ALLOWED_ORIGINS;
  if (!configured) return DEFAULT_ALLOWED_ORIGINS;

  return new Set(
    configured
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
}

export function isAllowedBackendOrigin(origin: string | null): boolean {
  if (!origin) return true;
  if (configuredAllowedOrigins().has(origin)) return true;

  // `run-local-stack.mjs` SOBE a porta quando a preferida esta ocupada
  // (5290 → 5291, 4290 → 4291). Por isso a faixa curta em torno de cada porta
  // nomeada continua aceita — o `npm run dev:local` depende disso, e o teste
  // `backendSecurity.core.test.ts > allows loopback dev origins on fallback
  // local stack ports` cobre exatamente esse caso.
  //
  // A faixa e CURTA e ANCORADA na porta nomeada (nao 5173-5190 inteiro), entao
  // continua recusando origem de outra porta. E a porta do Vite, 5173, nao esta
  // mais em nenhuma faixa daqui.
  try {
    const parsed = new URL(origin);
    const port = Number.parseInt(parsed.port, 10);
    const isLoopback =
      parsed.protocol === "http:" &&
      (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1");
    const isNearNamedPort = (nomeada: number) =>
      port >= nomeada && port <= nomeada + 10;

    return (
      isLoopback &&
      (isNearNamedPort(DEV_PORT) ||
        isNearNamedPort(PREVIEW_PORT) ||
        isNearNamedPort(BACKEND_PORT))
    );
  } catch {
    return false;
  }
}

export function getRequiredBackendToken(): string | null {
  const token = process.env.BACKEND_AUTH_TOKEN?.trim();
  return token && token.length >= 16 ? token : null;
}

export function buildJsonHeaders(req?: Request): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  };

  const origin = req?.headers.get("origin") || null;
  if (origin && isAllowedBackendOrigin(origin)) {
    headers["access-control-allow-origin"] = origin;
    headers.vary = "Origin";
    headers["access-control-allow-methods"] = CORS_METHODS;
    headers["access-control-allow-headers"] = CORS_HEADERS;
  }

  return headers;
}

export function preflightResponse(req: Request): Response {
  const origin = req.headers.get("origin");
  if (!isAllowedBackendOrigin(origin)) {
    return new Response(null, { status: 403 });
  }

  return new Response(null, {
    status: 204,
    headers: buildJsonHeaders(req),
  });
}

export function validateBackendRequest(req: Request): Response | null {
  const origin = req.headers.get("origin");
  if (!isAllowedBackendOrigin(origin)) {
    return new Response(JSON.stringify({ error: "Origin not allowed" }), {
      status: 403,
      headers: buildJsonHeaders(),
    });
  }

  const requiredToken = getRequiredBackendToken();
  if (requiredToken && req.headers.get(BACKEND_AUTH_TOKEN_HEADER) !== requiredToken) {
    return new Response(JSON.stringify({ error: "Backend authentication required" }), {
      status: 401,
      headers: buildJsonHeaders(req),
    });
  }

  return null;
}
