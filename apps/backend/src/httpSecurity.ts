import { BACKEND_AUTH_TOKEN_HEADER } from "../../../shared/contracts/backend";

const DEFAULT_ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://tauri.localhost",
  "https://tauri.localhost",
  "tauri://localhost",
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
  return configuredAllowedOrigins().has(origin);
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
