import { z } from "zod";

const getImportMetaEnv = () => {
  const meta = import.meta as ImportMeta & {
    env?: Record<string, string | undefined>;
  };
  return meta.env || {};
};

const normalizeBaseUrl = (value: string | undefined) => {
  if (!value) return null;
  const trimmed = value.trim().replace(/\/$/, "");
  return trimmed.length > 0 ? trimmed : null;
};

export const BACKEND_DEFAULT_URL =
  normalizeBaseUrl(getImportMetaEnv().VITE_LOCAL_BACKEND_URL) ||
  "http://127.0.0.1:3001";

export const BACKEND_RUNTIME_ENABLED =
  getImportMetaEnv().VITE_BACKEND_ENABLED === "true";

export const BACKEND_DEFAULT_MODE = (getImportMetaEnv()
  .VITE_BACKEND_DEFAULT_MODE || "auto") as "auto" | "on" | "off";

export const BACKEND_AUTH_TOKEN_HEADER = "x-personalnews-backend-token";

export const BACKEND_DEV_AUTH_TOKEN =
  getImportMetaEnv().VITE_LOCAL_BACKEND_TOKEN?.trim() || null;

export const DesktopBackendHealthStateSchema = z.enum([
  "unknown",
  "starting",
  "restarting",
  "ready",
  "failed",
]);
export type DesktopBackendHealthState = z.infer<
  typeof DesktopBackendHealthStateSchema
>;

export const DesktopBackendDiagnosticSchema = z.enum([
  "unknown",
  "not_started",
  "starting",
  "ready",
  "port_occupied",
  "binary_missing",
  "spawn_blocked",
  "health_failed",
  "crashed",
]);
export type DesktopBackendDiagnostic = z.infer<
  typeof DesktopBackendDiagnosticSchema
>;

export const DesktopBackendStatusSchema = z.object({
  generation: z.number().int().nonnegative().default(0),
  sidecarSpawned: z.boolean(),
  pid: z.number().int().positive().optional(),
  baseUrl: z.string(),
  port: z.number().int().positive(),
  dbPath: z.string(),
  tokenAvailable: z.boolean(),
  health: DesktopBackendHealthStateSchema,
  diagnostic: DesktopBackendDiagnosticSchema.default("unknown"),
  uptimeMs: z.number().nonnegative().optional(),
  lastStartError: z.string().optional(),
  lastHealthError: z.string().optional(),
  lastExitCode: z.number().int().optional(),
});
export type DesktopBackendStatus = z.infer<typeof DesktopBackendStatusSchema>;

export const DesktopRuntimeStateSchema = z.enum([
  "booting",
  "ready",
  "degraded",
  "failed",
]);
export type DesktopRuntimeState = z.infer<typeof DesktopRuntimeStateSchema>;

export const BackendModeSchema = z.enum(["auto", "on", "off"]);
export type BackendMode = z.infer<typeof BackendModeSchema>;

export const WindowStyleSchema = z.enum(["native_thin", "frameless_thin"]);
export type WindowStyle = z.infer<typeof WindowStyleSchema>;

export const BackendHealthSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("personalnews-backend"),
  version: z.string(),
  uptimeMs: z.number().nonnegative(),
  dbPath: z.string(),
  now: z.string(),
});
export type BackendHealth = z.infer<typeof BackendHealthSchema>;

export const ArticleWireSchema = z.object({
  title: z.string(),
  link: z.string(),
  pubDate: z.string(),
  sourceTitle: z.string(),
  feedUrl: z.string().optional(),
  imageUrl: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  author: z.string().optional(),
  categories: z.array(z.string()).optional(),
});
export type ArticleWire = z.infer<typeof ArticleWireSchema>;

export const FeedFetchResponseSchema = z.object({
  title: z.string(),
  articles: z.array(ArticleWireSchema),
  meta: z.object({
    source: z.enum(["backend", "client-fallback"]),
    cached: z.boolean(),
    fetchedAt: z.string(),
    latencyMs: z.number().nonnegative(),
  }),
});
export type FeedFetchResponse = z.infer<typeof FeedFetchResponseSchema>;

export const FeedFetchQuerySchema = z.object({
  url: z.string().url(),
  forceRefresh: z.union([z.literal("0"), z.literal("1")]).default("0"),
});

export const FeedBatchRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(25),
  forceRefresh: z.boolean().optional().default(false),
});

export const FeedBatchItemSchema = z.object({
  url: z.string().url(),
  success: z.boolean(),
  result: FeedFetchResponseSchema.optional(),
  error: z.string().optional(),
});

export const FeedBatchResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  success: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  items: z.array(FeedBatchItemSchema),
});
export type FeedBatchResponse = z.infer<typeof FeedBatchResponseSchema>;

export const FeedValidationStatusSchema = z.enum([
  "valid",
  "invalid",
  "timeout",
  "network_error",
  "parse_error",
  "cors_error",
  "forbidden",
  "rate_limited",
  "not_found",
  "server_error",
]);
export type FeedValidationStatus = z.infer<typeof FeedValidationStatusSchema>;

export const FeedValidateRequestSchema = z.object({
  urls: z.array(z.string().url()).min(1).max(100),
  forceRefresh: z.boolean().optional().default(true),
});

export const FeedValidateItemSchema = z.object({
  url: z.string().url(),
  isValid: z.boolean(),
  status: FeedValidationStatusSchema,
  error: z.string().optional(),
  title: z.string().optional(),
  responseTimeMs: z.number().int().nonnegative(),
  checkedAt: z.string(),
  method: z.literal("backend"),
  severity: z.enum(["ok", "warning", "error", "pending"]).optional(),
  lastSuccessfulFetchAt: z.string().nullable().optional(),
  usedCache: z.boolean().optional(),
  route: z.string().optional(),
  diagnostic: z.string().optional(),
});

export const FeedValidateResponseSchema = z.object({
  total: z.number().int().nonnegative(),
  valid: z.number().int().nonnegative(),
  invalid: z.number().int().nonnegative(),
  items: z.array(FeedValidateItemSchema),
});
export type FeedValidateResponse = z.infer<typeof FeedValidateResponseSchema>;

export const FeedHealthSeveritySchema = z.enum([
  "ok",
  "warning",
  "error",
  "pending",
]);
export type FeedHealthSeverity = z.infer<typeof FeedHealthSeveritySchema>;

export const FeedHealthStatusSchema = z.enum([
  "valid",
  "degraded_stale",
  "not_found",
  "timeout",
  "rate_limited",
  "server_error",
  "parse_error",
  "network_error",
  "unknown",
]);
export type FeedHealthStatus = z.infer<typeof FeedHealthStatusSchema>;

export const FeedCollectionItemSchema = z.object({
  url: z.string().url(),
  categoryId: z.string().optional(),
  customTitle: z.string().optional(),
  hideFromAll: z.boolean().optional(),
  order: z.number().int().nonnegative().optional(),
});
export type FeedCollectionItem = z.infer<typeof FeedCollectionItemSchema>;

export const FeedCategoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().optional(),
  order: z.number().int().optional(),
  isDefault: z.boolean().optional(),
  isPinned: z.boolean().optional(),
  description: z.string().optional(),
  layoutMode: z.string().optional(),
  autoDiscovery: z.boolean().optional(),
  hideFromAll: z.boolean().optional(),
});
export type FeedCategoryItem = z.infer<typeof FeedCategoryItemSchema>;

export const FeedCollectionResponseSchema = z.object({
  feeds: z.array(FeedCollectionItemSchema),
  categories: z.array(FeedCategoryItemSchema).default([]),
  source: z.literal("backend"),
  updatedAt: z.string(),
});
export type FeedCollectionResponse = z.infer<
  typeof FeedCollectionResponseSchema
>;

export const FeedCollectionPutRequestSchema = z.object({
  feeds: z.array(FeedCollectionItemSchema).max(500),
  categories: z.array(FeedCategoryItemSchema).optional(),
});
export type FeedCollectionPutRequest = z.infer<
  typeof FeedCollectionPutRequestSchema
>;

export const FeedCategoriesPutRequestSchema = z.object({
  categories: z.array(FeedCategoryItemSchema).max(100),
});
export type FeedCategoriesPutRequest = z.infer<
  typeof FeedCategoriesPutRequestSchema
>;

export const FeedCollectionImportRequestSchema =
  FeedCollectionPutRequestSchema.extend({
    source: z.literal("localStorage").optional().default("localStorage"),
  });

export const FeedCollectionImportResponseSchema = z.object({
  importedFeeds: z.number().int().nonnegative(),
  skippedFeeds: z.number().int().nonnegative(),
  importedCategories: z.number().int().nonnegative(),
  skippedCategories: z.number().int().nonnegative(),
  updatedAt: z.string(),
});
export type FeedCollectionImportResponse = z.infer<
  typeof FeedCollectionImportResponseSchema
>;

export const FeedHealthItemSchema = z.object({
  url: z.string().url(),
  isValid: z.boolean(),
  status: FeedHealthStatusSchema,
  severity: FeedHealthSeveritySchema,
  title: z.string().optional(),
  error: z.string().optional(),
  diagnostic: z.string().optional(),
  route: z.string().optional(),
  checkedAt: z.string(),
  lastSuccessfulFetchAt: z.string().nullable(),
  usedCache: z.boolean(),
  responseTimeMs: z.number().int().nonnegative(),
});
export type FeedHealthItem = z.infer<typeof FeedHealthItemSchema>;

export const FeedHealthResponseSchema = z.object({
  items: z.array(FeedHealthItemSchema),
  checkedAt: z.string(),
});
export type FeedHealthResponse = z.infer<typeof FeedHealthResponseSchema>;

export const UserPreferencesV2Schema = z.object({
  backendMode: BackendModeSchema.default("auto"),
  windowStyle: WindowStyleSchema.default("native_thin"),
  cacheTtlMinutes: z.number().int().min(1).max(720).default(30),
  updatedAt: z.string(),
});
export type UserPreferencesV2 = z.infer<typeof UserPreferencesV2Schema>;

export const SettingsPutSchema = z.object({
  backendMode: BackendModeSchema.optional(),
  windowStyle: WindowStyleSchema.optional(),
  cacheTtlMinutes: z.number().int().min(1).max(720).optional(),
});

export const SettingsGetResponseSchema = z.object({
  settings: UserPreferencesV2Schema,
});

export const CacheStatsSchema = z.object({
  entries: z.number().int().nonnegative(),
  expired: z.number().int().nonnegative(),
  avgPayloadBytes: z.number().nonnegative(),
  totalHits: z.number().int().nonnegative(),
  oldestFetchedAt: z.string().nullable(),
  newestFetchedAt: z.string().nullable(),
});
export type CacheStats = z.infer<typeof CacheStatsSchema>;

export const CacheEntrySchema = z.object({
  url: z.string().url(),
  title: z.string(),
  fetchedAt: z.string(),
  expiresAt: z.string(),
  lastUsedAt: z.string(),
  hitCount: z.number().int().nonnegative(),
  payloadBytes: z.number().int().nonnegative(),
  sourceHost: z.string().nullable(),
});
export type CacheEntry = z.infer<typeof CacheEntrySchema>;

export const CacheEntriesResponseSchema = z.object({
  entries: z.array(CacheEntrySchema),
});

export const BackendProxyStatsSchema = z.object({
  proxyName: z.literal("LocalProxy"),
  totalRequests: z.number().int().nonnegative(),
  successes: z.number().int().nonnegative(),
  failures: z.number().int().nonnegative(),
  successRate: z.number().nonnegative(),
  avgResponseMs: z.number().nonnegative(),
  lastUsedAt: z.string().nullable(),
});
export type BackendProxyStats = z.infer<typeof BackendProxyStatsSchema>;

export const ProxyStatsResponseSchema = z.object({
  localProxy: BackendProxyStatsSchema,
});
export type ProxyStatsResponse = z.infer<typeof ProxyStatsResponseSchema>;

export const CacheClearResponseSchema = z.object({
  cleared: z.number().int().nonnegative(),
});

export const LocalStorageMigrationSchema = z.object({
  version: z.string(),
  timestamp: z.string(),
  data: z.record(z.string(), z.unknown()),
});

export const LocalStorageMigrationResponseSchema = z.object({
  importedKeys: z.number().int().nonnegative(),
  skippedKeys: z.number().int().nonnegative(),
});

export const isBackendMode = (value: string): value is BackendMode => {
  return BackendModeSchema.safeParse(value).success;
};

export const isWindowStyle = (value: string): value is WindowStyle => {
  return WindowStyleSchema.safeParse(value).success;
};
