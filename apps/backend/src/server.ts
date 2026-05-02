import {
  BackendHealthSchema,
  CacheClearResponseSchema,
  CacheEntriesResponseSchema,
  CacheStatsSchema,
  FeedCategoriesPutRequestSchema,
  FeedCollectionImportRequestSchema,
  FeedCollectionImportResponseSchema,
  FeedCollectionPutRequestSchema,
  FeedCollectionResponseSchema,
  FeedHealthResponseSchema,
  FeedValidateRequestSchema,
  FeedValidateResponseSchema,
  FeedBatchRequestSchema,
  FeedBatchResponseSchema,
  FeedFetchQuerySchema,
  FeedFetchResponseSchema,
  LocalStorageMigrationResponseSchema,
  LocalStorageMigrationSchema,
  ProxyStatsResponseSchema,
  SettingsGetResponseSchema,
  SettingsPutSchema,
  type FeedValidationStatus,
  type FeedHealthItem,
  type FeedHealthSeverity,
  type FeedHealthStatus,
  type FeedFetchResponse,
} from "../../../shared/contracts/backend";
import { BackendDatabase } from "./db";
import { fetchAndParseFeed } from "./feedParser";
import {
  SecurityValidationError,
  checkRateLimit,
  resolveClientId,
  validateTargetFeedUrl,
} from "./security";
import { mapUnhandledErrorStatus } from "./errors";
import { classifyValidationStatus } from "./validationStatus";
import {
  buildJsonHeaders,
  preflightResponse,
  validateBackendRequest,
} from "./httpSecurity";

const BACKEND_VERSION = "0.1.0";
const PORT = Number.parseInt(process.env.BACKEND_PORT || "3001", 10);
const HOST = process.env.BACKEND_HOST || "127.0.0.1";

const db = new BackendDatabase(process.env.BACKEND_DB_PATH);
const startedAt = Date.now();
const STALE_CACHE_GRACE_MS = 24 * 60 * 60 * 1000;
const FEED_BATCH_CONCURRENCY = 6;

function json(data: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: buildJsonHeaders(req),
  });
}

function errorResponse(status: number, message: string, req?: Request): Response {
  return json({ error: message }, status, req);
}

function parseForceRefresh(value: string | null): "0" | "1" {
  return value === "1" ? "1" : "0";
}

async function getFeed(
  url: string,
  forceRefresh: boolean,
  options: { allowStaleCacheOnError?: boolean } = {},
): Promise<FeedFetchResponse> {
  const validatedUrl = await validateTargetFeedUrl(url);
  const targetHost = validatedUrl.hostname || "unknown";
  const cacheRecord = db.getCache(validatedUrl.toString());
  const settings = db.getSettings();
  const nowIso = new Date().toISOString();

  if (!forceRefresh && cacheRecord && cacheRecord.expiresAt > nowIso) {
    db.touchCacheHit(validatedUrl.toString());

    const parsed = JSON.parse(cacheRecord.payloadJson);
    const payload: FeedFetchResponse = {
      ...parsed,
      meta: {
        source: "backend",
        cached: true,
        fetchedAt: cacheRecord.fetchedAt,
        latencyMs: 0,
      },
    };

    return FeedFetchResponseSchema.parse(payload);
  }

  const started = Date.now();
  try {
    const parsedFeed = await fetchAndParseFeed(validatedUrl.toString(), {
      validateUrl: validateTargetFeedUrl,
    });
    const elapsedMs = Date.now() - started;
    db.recordProxyTelemetry("LocalProxy", targetHost, true, elapsedMs);

    const response: FeedFetchResponse = {
      title: parsedFeed.title,
      articles: parsedFeed.articles,
      meta: {
        source: "backend",
        cached: false,
        fetchedAt: new Date().toISOString(),
        latencyMs: elapsedMs,
      },
    };

    FeedFetchResponseSchema.parse(response);
    db.setCache(
      validatedUrl.toString(),
      parsedFeed.title,
      JSON.stringify(response),
      settings.cacheTtlMinutes
    );

    return response;
  } catch (error) {
    db.recordProxyTelemetry("LocalProxy", targetHost, false, Date.now() - started);
    if (options.allowStaleCacheOnError !== false && cacheRecord && isTransientFeedError(error)) {
      db.touchCacheHit(validatedUrl.toString());
      const parsed = JSON.parse(cacheRecord.payloadJson);
      return FeedFetchResponseSchema.parse({
        ...parsed,
        meta: {
          source: "backend",
          cached: true,
          fetchedAt: cacheRecord.fetchedAt,
          latencyMs: Date.now() - started,
        },
      });
    }
    throw error;
  }
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : undefined;
}

function isTransientFeedError(error: unknown): boolean {
  const status = getErrorStatus(error);
  if (status === 404 || status === 403 || status === 422) return false;
  if (status && status >= 500) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return (
    message.includes("timeout") ||
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("rate limit") ||
    message.includes("429")
  );
}

function mapHealthStatus(
  validationStatus: FeedValidationStatus,
  usedCache: boolean,
): FeedHealthStatus {
  if (usedCache && validationStatus !== "valid") return "degraded_stale";
  if (validationStatus === "valid") return "valid";
  if (validationStatus === "invalid" || validationStatus === "forbidden") return "unknown";
  return validationStatus;
}

function severityForStatus(status: FeedHealthStatus): FeedHealthSeverity {
  if (status === "valid") return "ok";
  if (status === "degraded_stale" || status === "timeout" || status === "rate_limited" || status === "server_error") {
    return "warning";
  }
  return "error";
}

function latestCacheSuccess(url: string): string | null {
  const cache = db.getCache(url);
  if (!cache) return null;
  const fetchedAt = Date.parse(cache.fetchedAt);
  if (Number.isNaN(fetchedAt)) return cache.fetchedAt;
  return Date.now() - fetchedAt <= STALE_CACHE_GRACE_MS ? cache.fetchedAt : null;
}

function logFeedValidation(item: FeedHealthItem) {
  console.log(
    `PERSONALNEWS_FEED_VALIDATION ${JSON.stringify({
      url: item.url,
      status: item.status,
      severity: item.severity,
      usedCache: item.usedCache,
      route: item.route,
      responseTimeMs: item.responseTimeMs,
    })}`,
  );
}

async function validateFeedHealth(feedUrl: string, forceRefresh: boolean): Promise<FeedHealthItem> {
  const startedAt = Date.now();
  const checkedAt = new Date().toISOString();
  const normalizedUrl = (await validateTargetFeedUrl(feedUrl)).toString();

  try {
    const feed = await getFeed(normalizedUrl, forceRefresh, {
      allowStaleCacheOnError: false,
    });
    const item: FeedHealthItem = {
      url: normalizedUrl,
      isValid: true,
      status: "valid",
      severity: "ok",
      title: feed.title,
      responseTimeMs: Date.now() - startedAt,
      checkedAt,
      route: feed.meta.cached ? "LocalBackend cache" : "LocalBackend",
      lastSuccessfulFetchAt: feed.meta.fetchedAt,
      usedCache: feed.meta.cached,
      diagnostic: feed.meta.cached ? "Servido pelo cache local." : "Feed validado pelo backend local.",
    };
    db.setFeedHealth(item);
    logFeedValidation(item);
    return item;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown validation error";
    const status = classifyValidationStatus(message);
    const cacheSuccess = latestCacheSuccess(normalizedUrl);
    const useStale = Boolean(cacheSuccess && isTransientFeedError(error));
    const healthStatus = mapHealthStatus(status, useStale);
    const item: FeedHealthItem = {
      url: normalizedUrl,
      isValid: useStale,
      status: healthStatus,
      severity: severityForStatus(healthStatus),
      error: message,
      diagnostic: useStale
        ? "Falha transitória; cache recente mantido como fonte temporária."
        : message,
      responseTimeMs: Date.now() - startedAt,
      checkedAt,
      route: "LocalBackend",
      lastSuccessfulFetchAt: cacheSuccess,
      usedCache: useStale,
    };
    db.setFeedHealth(item);
    logFeedValidation(item);
    return item;
  }
}

async function handleFeedRequest(req: Request, reqUrl: URL): Promise<Response> {
  const parsedQuery = FeedFetchQuerySchema.safeParse({
    url: reqUrl.searchParams.get("url"),
    forceRefresh: parseForceRefresh(reqUrl.searchParams.get("forceRefresh")),
  });

  if (!parsedQuery.success) {
    return errorResponse(400, "Invalid query parameters", req);
  }

  const forceRefresh = parsedQuery.data.forceRefresh === "1";
  const result = await getFeed(parsedQuery.data.url, forceRefresh);
  return json(result, 200, req);
}

async function handleFeedBatchRequest(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsedBody = FeedBatchRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return errorResponse(400, "Invalid batch payload", req);
  }

  const items: Array<{
    url: string;
    success: boolean;
    result?: FeedFetchResponse;
    error?: string;
  }> = [];

  const queue = parsedBody.data.urls.map((url, index) => ({ url, index }));
  const orderedItems = new Array<(typeof items)[number]>(queue.length);

  async function worker() {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;

      try {
        const result = await getFeed(next.url, parsedBody.data.forceRefresh);
        orderedItems[next.index] = { url: next.url, success: true, result };
      } catch (error) {
        orderedItems[next.index] = {
          url: next.url,
          success: false,
          error: error instanceof Error ? error.message : "Unknown feed error",
        };
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(FEED_BATCH_CONCURRENCY, queue.length) },
      () => worker(),
    ),
  );

  items.push(...orderedItems.filter(Boolean));

  const response = {
    total: items.length,
    success: items.filter((it) => it.success).length,
    failed: items.filter((it) => !it.success).length,
    items,
  };

  FeedBatchResponseSchema.parse(response);
  return json(response, 200, req);
}

async function handleFeedValidateRequest(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsedBody = FeedValidateRequestSchema.safeParse(body);

  if (!parsedBody.success) {
    return errorResponse(400, "Invalid validation payload", req);
  }

  const items: Array<{
    url: string;
    isValid: boolean;
    status: FeedValidationStatus;
    error?: string;
    title?: string;
    responseTimeMs: number;
    checkedAt: string;
    method: "backend";
    severity?: FeedHealthSeverity;
    lastSuccessfulFetchAt?: string | null;
    usedCache?: boolean;
    route?: string;
    diagnostic?: string;
  }> = [];

  for (const feedUrl of parsedBody.data.urls) {
    const health = await validateFeedHealth(feedUrl, parsedBody.data.forceRefresh);
    const validationStatus: FeedValidationStatus =
      health.status === "degraded_stale"
        ? "valid"
        : health.status === "unknown"
          ? "invalid"
          : health.status;
    items.push({
      url: health.url,
      isValid: health.isValid,
      status: validationStatus,
      error: health.error,
      title: health.title,
      responseTimeMs: health.responseTimeMs,
      checkedAt: health.checkedAt,
      method: "backend",
      severity: health.severity,
      lastSuccessfulFetchAt: health.lastSuccessfulFetchAt,
      usedCache: health.usedCache,
      route: health.route,
      diagnostic: health.diagnostic,
    });
  }

  const response = {
    total: items.length,
    valid: items.filter((item) => item.isValid).length,
    invalid: items.filter((item) => !item.isValid).length,
    items,
  };

  FeedValidateResponseSchema.parse(response);
  return json(response, 200, req);
}

function handleFeedCollectionGet(req: Request): Response {
  const payload = {
    feeds: db.getFeeds(),
    categories: db.getCategories(),
    source: "backend" as const,
    updatedAt: new Date().toISOString(),
  };
  FeedCollectionResponseSchema.parse(payload);
  return json(payload, 200, req);
}

async function handleFeedCollectionPut(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = FeedCollectionPutRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, "Invalid feed collection payload", req);
  }

  const categories = parsed.data.categories ?? db.getCategories();
  const result = db.replaceFeedCollection(parsed.data.feeds, categories);
  const payload = {
    feeds: db.getFeeds(),
    categories: db.getCategories(),
    source: "backend" as const,
    updatedAt: result.updatedAt,
  };
  FeedCollectionResponseSchema.parse(payload);
  return json(payload, 200, req);
}

async function handleFeedCategoriesPut(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = FeedCategoriesPutRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, "Invalid feed categories payload", req);
  }

  const result = db.replaceCategories(parsed.data.categories);
  const payload = {
    feeds: db.getFeeds(),
    categories: db.getCategories(),
    source: "backend" as const,
    updatedAt: result.updatedAt,
  };
  FeedCollectionResponseSchema.parse(payload);
  return json(payload, 200, req);
}

async function handleFeedCollectionImport(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = FeedCollectionImportRequestSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, "Invalid feed import payload", req);
  }

  const result = db.importFeedCollection(parsed.data.feeds, parsed.data.categories);
  FeedCollectionImportResponseSchema.parse(result);
  return json(result, 200, req);
}

function handleFeedHealthGet(req: Request, reqUrl: URL): Response {
  const urls = reqUrl.searchParams.getAll("url");
  const payload = {
    items: db.getFeedHealth(urls.length > 0 ? urls : undefined),
    checkedAt: new Date().toISOString(),
  };
  FeedHealthResponseSchema.parse(payload);
  return json(payload, 200, req);
}

function handleSettingsGet(req: Request): Response {
  const payload = {
    settings: db.getSettings(),
  };

  SettingsGetResponseSchema.parse(payload);
  return json(payload, 200, req);
}

async function handleSettingsPut(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = SettingsPutSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, "Invalid settings payload", req);
  }

  const updated = db.updateSettings(parsed.data);
  const payload = { settings: updated };
  SettingsGetResponseSchema.parse(payload);
  return json(payload, 200, req);
}

function handleCacheStats(req: Request): Response {
  const stats = db.getCacheStats();
  CacheStatsSchema.parse(stats);
  return json(stats, 200, req);
}

function handleCacheEntries(req: Request, reqUrl: URL): Response {
  const limitRaw = reqUrl.searchParams.get("limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
  const entries = db.getCacheEntries(Number.isFinite(limit) ? limit : 50);
  const payload = { entries };
  CacheEntriesResponseSchema.parse(payload);
  return json(payload, 200, req);
}

function handleCacheClear(req: Request): Response {
  const cleared = db.clearCache();
  const payload = { cleared };
  CacheClearResponseSchema.parse(payload);
  return json(payload, 200, req);
}

function handleProxyStats(req: Request): Response {
  const payload = {
    localProxy: db.getProxyStats(),
  };
  ProxyStatsResponseSchema.parse(payload);
  return json(payload, 200, req);
}

async function handleMigration(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null);
  const parsed = LocalStorageMigrationSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse(400, "Invalid migration payload");
  }

  const result = db.importLocalStorageSnapshot(parsed.data.data);
  LocalStorageMigrationResponseSchema.parse(result);
  return json(result, 200, req);
}

function getHealthPayload() {
  const payload = {
    status: "ok" as const,
    service: "personalnews-backend" as const,
    version: BACKEND_VERSION,
    uptimeMs: Date.now() - startedAt,
    dbPath: db.dbPath,
    now: new Date().toISOString(),
  };
  BackendHealthSchema.parse(payload);
  return payload;
}

const server = Bun.serve({
  hostname: HOST,
  port: PORT,
  idleTimeout: 30,
  async fetch(req: Request) {
    if (req.method === "OPTIONS") {
      return preflightResponse(req);
    }

    const reqUrl = new URL(req.url);
    const pathname = reqUrl.pathname;

    if (pathname === "/health") {
      return json(getHealthPayload(), 200, req);
    }

    const requestValidation = validateBackendRequest(req);
    if (requestValidation) {
      return requestValidation;
    }

    const clientId = resolveClientId(req);
    const rl = checkRateLimit(clientId);
    if (!rl.allowed) {
      return json({ error: "Rate limit exceeded", retryAfterMs: rl.retryAfterMs }, 429, req);
    }

    try {
      if (req.method === "GET" && pathname === "/api/v1/feeds") {
        return handleFeedCollectionGet(req);
      }

      if (req.method === "PUT" && pathname === "/api/v1/feeds") {
        return await handleFeedCollectionPut(req);
      }

      if (req.method === "PUT" && pathname === "/api/v1/feeds/categories") {
        return await handleFeedCategoriesPut(req);
      }

      if (req.method === "POST" && pathname === "/api/v1/feeds/import-local-storage") {
        return await handleFeedCollectionImport(req);
      }

      if (req.method === "GET" && pathname === "/api/v1/feeds/health") {
        return handleFeedHealthGet(req, reqUrl);
      }

      if (req.method === "GET" && pathname === "/api/v1/feed") {
        return await handleFeedRequest(req, reqUrl);
      }

      if (req.method === "POST" && pathname === "/api/v1/feeds/batch") {
        return await handleFeedBatchRequest(req);
      }

      if (req.method === "POST" && pathname === "/api/v1/feeds/validate") {
        return await handleFeedValidateRequest(req);
      }

      if (req.method === "GET" && pathname === "/api/v1/settings") {
        return handleSettingsGet(req);
      }

      if (req.method === "PUT" && pathname === "/api/v1/settings") {
        return await handleSettingsPut(req);
      }

      if (req.method === "GET" && pathname === "/api/v1/cache/stats") {
        return handleCacheStats(req);
      }

      if (req.method === "GET" && pathname === "/api/v1/cache/entries") {
        return handleCacheEntries(req, reqUrl);
      }

      if (req.method === "POST" && pathname === "/api/v1/cache/clear") {
        return handleCacheClear(req);
      }

      if (req.method === "GET" && pathname === "/api/v1/proxy/stats") {
        return handleProxyStats(req);
      }

      if (req.method === "POST" && pathname === "/api/v1/migrate/local-storage") {
        return await handleMigration(req);
      }

      return errorResponse(404, "Not found", req);
    } catch (error) {
      if (error instanceof SecurityValidationError) {
        return errorResponse(error.status, error.message, req);
      }

      const message = error instanceof Error ? error.message : "Internal server error";
      return errorResponse(mapUnhandledErrorStatus(error), message, req);
    }
  },
});

console.log(
  `[personalnews-backend] listening on http://${HOST}:${PORT} (db: ${db.dbPath})`
);
console.log(
  `PERSONALNEWS_BACKEND_READY ${JSON.stringify({
    baseUrl: `http://${HOST}:${PORT}`,
    dbPath: db.dbPath,
    version: BACKEND_VERSION,
  })}`
);

process.on("SIGINT", () => {
  db.close();
  server.stop();
  process.exit(0);
});

process.on("SIGTERM", () => {
  db.close();
  server.stop();
  process.exit(0);
});
