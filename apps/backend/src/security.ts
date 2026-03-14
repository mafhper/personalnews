import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
]);

const DNS_LOOKUP_TIMEOUT_MS = 4_000;

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map((item) => Number.parseInt(item, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;

  if (parts[0] === 10) return true;
  if (parts[0] === 127) return true;
  if (parts[0] === 0) return true;
  if (parts[0] === 169 && parts[1] === 254) return true;
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}

function isPrivateIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === "::1") return true;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (normalized.startsWith("fe80")) return true;
  return false;
}

export class SecurityValidationError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "SecurityValidationError";
    this.status = status;
  }
}

async function lookupWithTimeout(
  hostname: string,
  timeoutMs: number
): Promise<Array<{ address: string; family: number }>> {
  return Promise.race([
    lookup(hostname, { all: true }),
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("dns-timeout")), timeoutMs);
    }),
  ]);
}

export async function validateTargetFeedUrl(targetUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
  } catch {
    throw new SecurityValidationError("Invalid URL", 400);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new SecurityValidationError("Only http/https URLs are allowed", 400);
  }

  const hostname = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTS.has(hostname) || hostname.endsWith(".local")) {
    throw new SecurityValidationError("Local/private hosts are blocked", 403);
  }

  const hostIpType = isIP(hostname);
  if (hostIpType === 4 && isPrivateIpv4(hostname)) {
    throw new SecurityValidationError("Private IPv4 ranges are blocked", 403);
  }
  if (hostIpType === 6 && isPrivateIpv6(hostname)) {
    throw new SecurityValidationError("Private IPv6 ranges are blocked", 403);
  }

  try {
    const resolved = await lookupWithTimeout(hostname, DNS_LOOKUP_TIMEOUT_MS);
    for (const addr of resolved) {
      if (addr.family === 4 && isPrivateIpv4(addr.address)) {
        throw new SecurityValidationError("DNS resolved to private IPv4 address", 403);
      }
      if (addr.family === 6 && isPrivateIpv6(addr.address)) {
        throw new SecurityValidationError("DNS resolved to private IPv6 address", 403);
      }
    }
  } catch (error) {
    if (error instanceof SecurityValidationError) {
      throw error;
    }

    throw new SecurityValidationError("DNS resolution failed for target host", 400);
  }

  return parsed;
}

type RateEntry = { count: number; resetAt: number };

const memoryLimiter = new Map<string, RateEntry>();

function readPositiveIntEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function rateWindowMs(): number {
  return readPositiveIntEnv("BACKEND_RATE_LIMIT_WINDOW_MS", 60_000);
}

function rateLimitPerWindow(): number {
  return readPositiveIntEnv("BACKEND_RATE_LIMIT_PER_WINDOW", 120);
}

function shouldBypassLoopbackRateLimit(): boolean {
  const raw = process.env.BACKEND_RATE_LIMIT_BYPASS_LOOPBACK;
  if (!raw) return true;
  return raw.toLowerCase() !== "false";
}

function isLoopbackClientId(clientId: string): boolean {
  const id = clientId.trim().toLowerCase();
  if (!id) return false;

  if (id === "local-client" || id === "localhost" || id === "127.0.0.1" || id === "::1") {
    return true;
  }

  if (id.startsWith("127.0.0.1:") || id.startsWith("[::1]:")) return true;
  if (id.startsWith("localhost:")) return true;
  return false;
}

export function checkRateLimit(clientId: string): { allowed: boolean; retryAfterMs: number } {
  if (shouldBypassLoopbackRateLimit() && isLoopbackClientId(clientId)) {
    return { allowed: true, retryAfterMs: 0 };
  }

  const currentRateWindowMs = rateWindowMs();
  const currentRateLimit = rateLimitPerWindow();
  const now = Date.now();
  const key = clientId || "unknown";
  const existing = memoryLimiter.get(key);

  if (!existing || existing.resetAt <= now) {
    memoryLimiter.set(key, { count: 1, resetAt: now + currentRateWindowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (existing.count >= currentRateLimit) {
    return { allowed: false, retryAfterMs: existing.resetAt - now };
  }

  existing.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

export function resetRateLimiterForTests(): void {
  memoryLimiter.clear();
}

export function resolveClientId(req: Request): string {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  const remoteAddr = (req as Request & { remoteAddr?: string }).remoteAddr;
  if (remoteAddr) return remoteAddr;

  return "local-client";
}
