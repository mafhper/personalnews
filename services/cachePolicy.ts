export const MINUTE_MS = 60 * 1000;
export const HOUR_MS = 60 * MINUTE_MS;

export const CACHE_POLICY_V1 = {
  version: 1,
  storage: "localStorage",
  keys: {
    smartFeedCache: "smart-feed-cache-v2",
    articleContentPrefix: "article_cache_v2_",
    policySettings: "personalnews-cache-policy-v1",
    lastClearedAt: "personalnews-cache-last-cleared-at-v1",
  },
  feeds: {
    freshTtlMs: 10 * MINUTE_MS,
    staleWhileRevalidateMs: 2 * HOUR_MS,
    maxEntries: 100,
    scopedFreshTtlMinutes: 10 as 0 | 5 | 10,
  },
  articles: {
    maxSize: 500,
    maxAgeMs: 24 * HOUR_MS,
    memoryLimitMb: 50,
    autoCleanupIntervalMs: 5 * MINUTE_MS,
  },
} as const;

export type CachePolicyV1 = typeof CACHE_POLICY_V1;

export interface CachePolicySettingsV1 {
  version: 1;
  feedFreshTtlMinutes: number;
  staleWhileRevalidateMinutes: number;
  respectHttpValidators: boolean;
  offlineFallback: boolean;
  maxStorageMb: number;
  maxFeedEntries: number;
  articleMaxAgeHours: number;
  articleMaxEntries: number;
}

export type CachePolicyOverridesV1 = Partial<
  Omit<CachePolicySettingsV1, "version">
>;

export const DEFAULT_CACHE_POLICY_SETTINGS_V1: CachePolicySettingsV1 = {
  version: 1,
  feedFreshTtlMinutes: CACHE_POLICY_V1.feeds.freshTtlMs / MINUTE_MS,
  staleWhileRevalidateMinutes:
    CACHE_POLICY_V1.feeds.staleWhileRevalidateMs / MINUTE_MS,
  respectHttpValidators: true,
  offlineFallback: true,
  maxStorageMb: CACHE_POLICY_V1.articles.memoryLimitMb,
  maxFeedEntries: CACHE_POLICY_V1.feeds.maxEntries,
  articleMaxAgeHours: CACHE_POLICY_V1.articles.maxAgeMs / HOUR_MS,
  articleMaxEntries: CACHE_POLICY_V1.articles.maxSize,
};

const clampNumber = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
};

export const normalizeCachePolicySettingsV1 = (
  value: unknown,
): CachePolicySettingsV1 => {
  const candidate =
    value && typeof value === "object"
      ? (value as Partial<CachePolicySettingsV1>)
      : {};
  const defaults = DEFAULT_CACHE_POLICY_SETTINGS_V1;

  return {
    version: 1,
    feedFreshTtlMinutes: clampNumber(
      candidate.feedFreshTtlMinutes,
      1,
      720,
      defaults.feedFreshTtlMinutes,
    ),
    staleWhileRevalidateMinutes: clampNumber(
      candidate.staleWhileRevalidateMinutes,
      0,
      24 * 60,
      defaults.staleWhileRevalidateMinutes,
    ),
    respectHttpValidators:
      typeof candidate.respectHttpValidators === "boolean"
        ? candidate.respectHttpValidators
        : defaults.respectHttpValidators,
    offlineFallback:
      typeof candidate.offlineFallback === "boolean"
        ? candidate.offlineFallback
        : defaults.offlineFallback,
    maxStorageMb: clampNumber(
      candidate.maxStorageMb,
      10,
      500,
      defaults.maxStorageMb,
    ),
    maxFeedEntries: clampNumber(
      candidate.maxFeedEntries,
      10,
      1000,
      defaults.maxFeedEntries,
    ),
    articleMaxAgeHours: clampNumber(
      candidate.articleMaxAgeHours,
      1,
      24 * 30,
      defaults.articleMaxAgeHours,
    ),
    articleMaxEntries: clampNumber(
      candidate.articleMaxEntries,
      50,
      5000,
      defaults.articleMaxEntries,
    ),
  };
};

export const readCachePolicySettingsV1 = (
  storage: Pick<Storage, "getItem"> | undefined =
    typeof window !== "undefined" ? window.localStorage : undefined,
): CachePolicySettingsV1 => {
  if (!storage) return DEFAULT_CACHE_POLICY_SETTINGS_V1;

  try {
    const raw = storage.getItem(CACHE_POLICY_V1.keys.policySettings);
    if (!raw) return DEFAULT_CACHE_POLICY_SETTINGS_V1;
    return normalizeCachePolicySettingsV1(JSON.parse(raw));
  } catch {
    return DEFAULT_CACHE_POLICY_SETTINGS_V1;
  }
};

export const writeCachePolicySettingsV1 = (
  overrides: CachePolicyOverridesV1,
  storage: Pick<Storage, "getItem" | "setItem"> | undefined =
    typeof window !== "undefined" ? window.localStorage : undefined,
): CachePolicySettingsV1 => {
  const next = normalizeCachePolicySettingsV1({
    ...readCachePolicySettingsV1(storage),
    ...overrides,
    version: 1,
  });

  storage?.setItem(CACHE_POLICY_V1.keys.policySettings, JSON.stringify(next));
  return next;
};

export const getCachePolicyV1 = (): CachePolicyV1 => CACHE_POLICY_V1;

export const describeCachePolicyV1 = () => ({
  version: CACHE_POLICY_V1.version,
  storage: CACHE_POLICY_V1.storage,
  feedFreshMinutes: CACHE_POLICY_V1.feeds.freshTtlMs / MINUTE_MS,
  feedStaleHours: CACHE_POLICY_V1.feeds.staleWhileRevalidateMs / HOUR_MS,
  maxFeedEntries: CACHE_POLICY_V1.feeds.maxEntries,
  articleMaxAgeHours: CACHE_POLICY_V1.articles.maxAgeMs / HOUR_MS,
  articleMaxSize: CACHE_POLICY_V1.articles.maxSize,
});
